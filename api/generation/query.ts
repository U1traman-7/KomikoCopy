import { authMiddleware } from '../_utils/middlewares/auth.js';
import { getParams } from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import {
  createSupabase,
  failedWithCode,
  getUserId,
  success,
  unauthorized,
} from '../_utils/index.js';
import { ERROR_CODES, GenerationStatus, TASK_TYPES } from '../_constants.js';
import pLimit from 'p-limit';
import {
  handler as webhookHandler,
  failedTask as markFailed,
} from './webhook.js';
import { waitUntil } from '@vercel/functions';
import { type SupabaseClient } from '@supabase/supabase-js';
import RunwayML from '@runwayml/sdk';
import Replicate from 'replicate';
import { LumaAI } from 'lumaai';

const limit = pLimit(10);
const WEBHOOK_URL = `${process.env.GENERATION_WEBHOOK_BASE_URL}/api/generation/webhook`;

type GenerationTaskRow = {
  id: number;
  status: number;
  output: string | null;
  cost: number | null;
  payload: string;
  model_id: string | null;
  type: number | null;
  platform: string | null;
  task_id: string | null;
  previous_task_id: string | null;
  tool?: string | null;
};

const processDeerTask = async (supabase: SupabaseClient) => {
  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select(
      'id, status, output, cost, payload, model_id, type, platform, task_id',
    )
    .eq('platform', 'deer')
    .eq('status', GenerationStatus.PROCESSING);

  if (error || !tasks) {
    console.error('query generation tasks error', error, tasks);
    return;
  }

  for (const task of tasks) {
    if (task.platform !== 'deer') {
      continue;
    }
    if (!task.task_id) {
      continue;
    }
    // console.log('process deer task', task);
    const baseUrl = `https://api.deerapi.com/mj/task/${task.task_id}/fetch`;
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${process.env.DEER_API_KEY}`,
      },
    });
    if (!response.ok) {
      continue;
    }
    const text = await response.text();
    // console.log(text);
    const request = new Request('https://komiko.app/api/generation/webhook', {
      method: 'POST',
      body: text,
    });
    await webhookHandler(request);
  }
};

const processArkTask = async (supabase: SupabaseClient, userId: string) => {
  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select(
      'id, status, output, cost, payload, model_id, type, platform, task_id',
    )
    .eq('user_id', userId)
    .eq('platform', 'ark')
    .eq('status', GenerationStatus.PROCESSING);

  if (error || !tasks) {
    console.error('query generation tasks error', error, tasks);
    return;
  }

  for (const task of tasks) {
    if (task.platform !== 'ark') {
      continue;
    }
    if (!task.task_id) {
      continue;
    }
    // console.log('process deer task', task);
    const baseUrl = `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${task.task_id}`;
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${process.env.ARK_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[ARK][query] Failed to query task ${task.task_id}:`,
        response.status,
        response.statusText,
      );
      // Try to get error details
      try {
        const errorText = await response.text();
        console.error('[ARK][query] Error response:', errorText);
      } catch (e) {
        // Ignore error reading response
        console.error('[ARK][query] Error reading response:', e);
      }
      continue;
    }
    const text = await response.text();
    // console.log(text);
    const request = new Request('https://komiko.app/api/generation/webhook', {
      method: 'POST',
      body: text,
    });
    await webhookHandler(request);
  }
};

const runwayClient = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY });

const processRunwayTasks = async (supabase: SupabaseClient, userId: string) => {
  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select(
      'id, status, output, cost, payload, model_id, type, platform, task_id',
    )
    .eq('platform', 'runway')
    .eq('user_id', userId)
    .eq('status', GenerationStatus.PROCESSING);

  if (error || !tasks || tasks.length === 0) {
    return;
  }

  for (const task of tasks) {
    try {
      const details = await runwayClient.tasks.retrieve(task.task_id);
      const status = (details?.status || '').toUpperCase();

      if (status === 'SUCCEEDED') {
        const out = Array.isArray(details.output)
          ? details.output[0]
          : details.output;

        const body = JSON.stringify({
          id: task.task_id,
          status: 'SUCCEEDED',
          output: out,
        });

        const request = new Request(
          `${process.env.GENERATION_WEBHOOK_BASE_URL}/api/generation/webhook`,
          {
            method: 'POST',
            body,
          },
        );
        await webhookHandler(request);
      } else if (status === 'FAILED' || status === 'CANCELED') {
        const failure = (details as any)?.failure || (details as any)?.error;
        const failureCode = (details as any)?.failureCode;
        await webhookHandler(
          new Request(
            `${process.env.GENERATION_WEBHOOK_BASE_URL}/api/generation/webhook`,
            {
              method: 'POST',
              body: JSON.stringify({
                id: task.task_id,
                status: 'FAILED',
                failure,
                failureCode,
              }),
            },
          ),
        );
      }
    } catch (e) {
      console.error('runway polling error', e);
    }
  }
};

const lumaClient = new LumaAI({ authToken: process.env.LUMAAI_API_KEY });

// 主动轮询Luma，处理可能漏掉的回调
const processLumaPollTasks = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  if (!process.env.LUMAAI_API_KEY) {
    return;
  }
  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select('id, task_id, status')
    .eq('platform', 'luma')
    .eq('user_id', userId)
    .in('status', [GenerationStatus.PENDING, GenerationStatus.PROCESSING])
    .limit(200);

  if (error || !tasks || tasks.length === 0) {
    return;
  }

  for (const t of tasks) {
    if (!t.task_id) {
      continue;
    }

    try {
      const g: any = await lumaClient.generations.get(t.task_id);
      const state = String(g?.state || '').toLowerCase();
      if (!state) {
        continue;
      }
      if (state === 'completed') {
        const video = Array.isArray(g?.assets?.video)
          ? g.assets.video[0]
          : g?.assets?.video;

        await webhookHandler(
          new Request(WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify({
              id: t.task_id,
              state: 'completed',
              assets: { video },
            }),
          }),
        );
      } else if (state === 'failed') {
        await webhookHandler(
          new Request(WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify({
              id: t.task_id,
              state: 'failed',
              failure: g?.failure_reason,
            }),
          }),
        );
      }
    } catch (e) {
      console.error('[LUMA][poll] error', e);
    }
  }
};

const LUMA_TIMEOUT_MIN = 15;

const processLumaTimeouts = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const cutoff = new Date(
    Date.now() - LUMA_TIMEOUT_MIN * 60 * 1000,
  ).toISOString();
  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select('id, task_id, created_at, status')
    .eq('platform', 'luma')
    .eq('user_id', userId)
    .in('status', [GenerationStatus.PENDING, GenerationStatus.PROCESSING])
    .lt('created_at', cutoff)
    .limit(200);

  if (error || !tasks || tasks.length === 0) {
    return;
  }

  for (const t of tasks) {
    try {
      await markFailed(t.task_id as string, {
        failure: 'Timeout',
        failureCode: 'TIMEOUT',
      });
    } catch (e) {
      console.error(
        '[LUMA][timeout] failed to mark timeout task',
        t?.task_id,
        e,
      );
    }
  }
};

const handler = async (request: Request) => {
  const params = await getParams(request);
  const taskIds = params.task_ids; // int数组
  const status = params.status; // int类型，参考GenerationStatus
  const tool = params.tool; // string类型
  const type = parseInt(params.type) || 2; // 2: video, 1: image

  const supabase = createSupabase();
  const userId = getUserId(request);

  if (!userId) {
    return unauthorized('Unauthorized');
  }

  const baseSelect =
    'id, status, output, cost, payload, model_id, type, platform, task_id, previous_task_id';

  let query = supabase
    .from('generation_tasks')
    .select(baseSelect)
    .eq('type', type)
    .eq('user_id', userId);

  if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
    query = query.in('id', taskIds);
  }

  if (Array.isArray(status) && status.length > 0) {
    query = query.in('status', status);
  } else if (status !== undefined && status !== null) {
    query = query.eq('status', status);
  }

  // Only apply tool filter when not querying explicit task IDs
  const hasExplicitTaskIds = Array.isArray(taskIds) && taskIds.length > 0;
  if (tool !== undefined && tool !== null && !hasExplicitTaskIds) {
    query = query.eq('tool', tool);
  }

  const { data, error } = await query;
  const tasks = (data ?? []) as unknown as GenerationTaskRow[];

  if (error) {
    console.error('query generation tasks error', error);
    return failedWithCode(
      ERROR_CODES.GENERATION_TASK_NOT_FOUND,
      'Failed to query tasks',
    );
  }

  // Note: Fallback tasks now reuse the original record (task_id is updated, previous_task_id stores history)
  // No need for separate fallback task queries or REPLACED status handling

  const result = tasks.map(task => {
    let prompt: string | undefined;
    let meta_data: string | undefined;
    let failure: string | undefined;
    let failureCode: string | undefined;
    try {
      const payload = JSON.parse(task.payload);
      prompt = payload?.originalPrompt || payload?.prompt;
      meta_data = payload?.meta_data
        ? JSON.stringify(payload.meta_data)
        : undefined;
      failure = payload?.failure;
      failureCode = payload?.failureCode;
    } catch (e) {
      console.error('parse payload error', error, e);
    }
    return {
      id: task.id,
      status: task.status,
      output: task.output,
      cost: task.cost,
      prompt,
      model: task.model_id,
      type: task.type,
      meta_data,
      failure,
      failureCode,
    };
  });

  const resultWithGenerationId = await Promise.all(
    result.map(task =>
      limit(
        () =>
          new Promise(resolve => {
            if (!task || !task?.output) {
              resolve({
                ...task,
                type: undefined,
              });
              return;
            }
            const tableName =
              task.type === TASK_TYPES.VIDEO
                ? 'VideoGeneration'
                : 'ImageGeneration';
            const columnName =
              task.type === TASK_TYPES.VIDEO ? 'video_url' : 'url_path';
            supabase
              .from(tableName)
              .select('id')
              .eq(columnName, task.output)
              .eq('user_id', userId)
              .limit(1)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error('query generation id error', error);
                  resolve(task);
                  return {
                    ...task,
                    type: undefined,
                  };
                }
                resolve({
                  ...task,
                  generation_id: data?.id,
                  type: undefined,
                });
              });
          }),
      ),
    ),
  );

  // waitUntil(processDeerTask(supabase));
  // waitUntil(processRunwayTasks(supabase, userId));
  // waitUntil(processArkTask(supabase, userId));
  // waitUntil(processLumaPollTasks(supabase, userId));
  // waitUntil(processLumaTimeouts(supabase, userId));

  // 按需处理轮询任务
  if (tasks.some(task => task.platform === 'ark')) {
    waitUntil(processArkTask(supabase, userId));
  }
  if (tasks.some(task => task.platform === 'runway')) {
    waitUntil(processRunwayTasks(supabase, userId));
  }
  if (tasks.some(task => task.platform === 'luma')) {
    waitUntil(processLumaPollTasks(supabase, userId));
    waitUntil(processLumaTimeouts(supabase, userId));
  }
  return success({ tasks: resultWithGenerationId || [] });
};

export const POST = withHandler(handler, [authMiddleware]);
