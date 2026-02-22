import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindParamsMiddleware,
  getParams,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import {
  ModelConfig,
  type AIModel,
  type FallbackFailureInfo,
} from './_common/models.js';
import Replicate from 'replicate';
import { fal } from '@fal-ai/client';
import { LumaAI } from 'lumaai';
import {
  createSupabase,
  failedWithCode,
  success,
  unauthorized,
} from '../_utils/index.js';
import {
  ERROR_CODES,
  GenerationStatus,
  ModelIds,
  TASK_TYPES,
  TaskTypes,
} from '../_constants.js';
import { isNumber, result } from 'lodash-es';
import { CreditModel } from '../_models/credit.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import RunwayML from '@runwayml/sdk';
import { getEffectInfo } from '../tools/_effectPrompts.js';
import { type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import addGeminiNanoTask from '../v2/_addGeminiNanoTask.js';
import { waitUntil } from '@vercel/functions';

const WEBHOOK_BASE_URL =
  process.env.GENERATION_WEBHOOK_BASE_URL ||
  'https://komiko-app-git-feat-webhook-komiko.vercel.app';

const webhookUrl = `${WEBHOOK_BASE_URL}/api/generation/webhook`;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

fal.config({
  credentials: process.env.fal_api_key,
});

const luma = new LumaAI({ authToken: process.env.LUMAAI_API_KEY as string });

const runwayClient = new RunwayML({
  apiKey: process.env.RUNWAY_API_KEY,
});

type PredictionOption = Parameters<typeof replicate.predictions.create>[0];

export const checkGenerationAllowed = async (
  userId: string,
  type: TaskTypes,
  supabase: SupabaseClient,
) => {
  const { data, error } = await supabase.rpc('check_generation_limit', {
    p_user_id: userId,
    p_type: type,
  });

  if (error || !data?.length) {
    console.error('Failed to check generation limit', error, data);
    return false;
  }
  console.log('checkGenerationAllowed', userId, type, data);
  return data[0].allowed;
};

/**
 * Submit a task to a specific platform
 * This function handles the platform-specific logic for submitting tasks
 */
export const submitTaskToPlatform = async (
  modelConfig: AIModel,
  input: any,
  callbackUrl: string,
  params?: any,
  userId?: string,
): Promise<{ success: boolean; taskId?: string; error?: string }> => {
  let platformTaskId = '';

  if (modelConfig.platform === 'fal') {
    try {
      const result = await fal.queue.submit(modelConfig.name, {
        input,
        webhookUrl: callbackUrl,
      });
      if (result.status !== 'IN_QUEUE') {
        console.error('status not in queue');
        return { success: false, error: 'Failed to submit task' };
      }
      platformTaskId = result.request_id;
    } catch (e) {
      console.error('❌ Failed to submit task to FAL:', e);
      console.error('Error details:', JSON.stringify(e, null, 2));
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'runway') {
    const modelNames = modelConfig.name.split(':');
    const modelName = modelNames[0];
    try {
      const created = await runwayClient.characterPerformance.create({
        ...(input as any),
        model: modelName,
        publicFigureThreshold: 'low',
      });
      platformTaskId = created.id;
    } catch (e) {
      console.error('Failed to submit runway task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'replicate') {
    const modelNames = modelConfig.name.split(':');
    const modelName = modelNames[0];
    const version = modelNames[1];

    const options: PredictionOption = {
      input,
      model: modelName,
      version,
      webhook: callbackUrl,
      webhook_events_filter: ['completed'],
    };
    try {
      const result = await replicate.predictions.create(options);
      platformTaskId = result.id;
    } catch (e) {
      console.error('[SUBMIT][replicate] Failed to submit task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'luma') {
    try {
      let resp: any;
      if (modelConfig.name === 'luma/modify-video') {
        const { media, first_frame, model: lumaModel, mode, prompt } = input;
        const body: any = {
          generation_type: 'modify_video',
          media,
          model: lumaModel || 'ray-flash-2',
          mode: mode || 'reimagine_1',
          callback_url: callbackUrl,
        };
        if (first_frame?.url) {
          body.first_frame = first_frame;
        }
        if (typeof prompt === 'string' && prompt.trim()) {
          body.prompt = prompt;
        }
        resp = await luma.generations.video.modify(body);
      } else {
        resp = await luma.generations.create({
          ...params,
          callback_url: callbackUrl,
        });
      }
      platformTaskId = resp?.id || '';
    } catch (e) {
      console.error('Failed to submit Luma task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'ark') {
    const url =
      'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';

    try {
      console.log('submit ark task', url, input, process.env.ARK_API_KEY);
      const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          model: modelConfig.name,
          content: input,
          callback_url: callbackUrl,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ARK_API_KEY}`,
        },
      });
      console.log('submit ark task result', result);
      if (!result.ok) {
        const data = await result.json();
        console.error('Failed to submit ark task', data);
        return { success: false, error: 'Failed to submit task' };
      }
      const data = await result.json();
      console.log('submit ark task result', data);
      platformTaskId = data.id;
    } catch (e) {
      console.error('Failed to submit ark task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'wavespeed') {
    const endpoint = 'https://api.wavespeed.ai/api/v3';
    const url = `${endpoint}/${modelConfig.name}?webhook=${encodeURIComponent(callbackUrl)}`;
    try {
      console.log('[WAVESPEED][submit] Submitting task', {
        url,
        modelName: modelConfig.name,
        hasInput: !!input,
      });

      const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}`,
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('[WAVESPEED][submit] Failed to submit task', {
          status: result.status,
          statusText: result.statusText,
          error: errorText,
        });
        return { success: false, error: errorText };
      }

      const data = await result.json();
      platformTaskId = data.data.id;

      console.log('[WAVESPEED][submit] Task submitted successfully', {
        taskId: platformTaskId,
        status: data.data.status,
      });
    } catch (e) {
      console.error('[WAVESPEED][submit] Failed to submit wavespeed task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  // KIE AI (Grok Imagine)
  if (modelConfig.platform === 'kie') {
    const url = 'https://api.kie.ai/api/v1/jobs/createTask';
    try {
      console.log('[KIE][submit] Submitting task', {
        modelName: modelConfig.name,
        hasInput: !!input,
      });

      const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          model: modelConfig.name,
          callBackUrl: callbackUrl,
          input,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('[KIE][submit] Failed to submit task', {
          status: result.status,
          statusText: result.statusText,
          error: errorText,
        });
        return { success: false, error: errorText };
      }

      const data = await result.json();

      if (data.code !== 200 || !data.data?.taskId) {
        console.error('[KIE][submit] API returned error', {
          code: data.code,
          message: data.message,
        });
        return {
          success: false,
          error: data.message || 'Failed to submit task',
        };
      }

      platformTaskId = data.data.taskId;

      console.log('[KIE][submit] Task submitted successfully', {
        taskId: platformTaskId,
      });
    } catch (e) {
      console.error('[KIE][submit] Failed to submit KIE task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'kusa') {
    const url = 'https://api.kusa.pics/api/go/b2b/tasks/create';
    try {
      const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          webhook_url: callbackUrl,
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.KUSA_API_KEY!,
        },
      });
      if (!result.ok) {
        const errorText = await result.text();
        console.error('[KUSA][submit] Failed to submit KUSA task', {
          status: result.status,
          statusText: result.statusText,
          error: errorText,
        });
        return { success: false, error: errorText };
      }
      const data = await result.json();
      if (data.code || data.data.status === 'FAILED') {
        console.error('[KUSA][submit] API returned error', {
          code: data.code,
          message: data.message,
        });
        return {
          success: false,
          error: data.message || 'Failed to submit task',
        };
      }
      platformTaskId = data.data.task_id;
    } catch (e) {
      console.error('[KUSA][submit] Failed to submit KUSA task', e);
      return { success: false, error: 'Failed to submit task' };
    }
  }

  if (modelConfig.platform === 'gemini') {
    platformTaskId = randomUUID();
    waitUntil(
      addGeminiNanoTask({
        ...params,
        task_id: platformTaskId,
        webhookUrl: callbackUrl,
        userId,
      }),
    );
  }

  if (!platformTaskId) {
    return { success: false, error: 'Failed to submit task' };
  }

  return { success: true, taskId: platformTaskId };
};

/**
 * Create a fallback task by updating the original record
 * Instead of creating a new record, this function updates the existing record
 * with new platform task information
 */
export const createFallbackTask = async (params: {
  originalTaskId: string;
  originalPayload: any;
  fallbackModelId: number;
  paramsOverride?: Record<string, any>;
}): Promise<{ success: boolean; newTaskId?: string; error?: string }> => {
  const { originalTaskId, originalPayload, fallbackModelId, paramsOverride } =
    params;

  const supabase = createSupabase();

  // Get fallback model config
  const fallbackModel = ModelConfig[fallbackModelId];
  if (!fallbackModel) {
    console.error(
      '[FALLBACK] Fallback model config not found:',
      fallbackModelId,
    );
    return { success: false, error: 'Fallback model config not found' };
  }

  // Parse original payload
  let payload: any;
  try {
    payload =
      typeof originalPayload === 'string'
        ? JSON.parse(originalPayload)
        : originalPayload;
  } catch (e) {
    console.error('[FALLBACK] Failed to parse original payload:', e);
    return { success: false, error: 'Failed to parse original payload' };
  }

  // Merge params override
  const fallbackPayload = {
    ...payload,
    target_model: fallbackModelId,
    ...(paramsOverride || {}),
  };

  // Parse params for fallback model
  let fallbackInput: any;
  try {
    fallbackInput = await fallbackModel.parseParams(fallbackPayload);
  } catch (e) {
    console.error('[FALLBACK] Failed to parse fallback params:', e);
    return { success: false, error: 'Failed to parse fallback params' };
  }

  // Submit to platform
  const submitResult = await submitTaskToPlatform(
    fallbackModel,
    fallbackInput,
    webhookUrl,
    fallbackPayload,
  );

  if (!submitResult.success || !submitResult.taskId) {
    console.error(
      '[FALLBACK] Failed to submit fallback task:',
      submitResult.error,
    );
    return {
      success: false,
      error: submitResult.error || 'Failed to submit fallback task',
    };
  }

  const newPlatformTaskId = submitResult.taskId;

  console.log('[FALLBACK] Updating original record:', {
    originalTaskId,
    newPlatformTaskId,
    fallbackModelId,
    platform: fallbackModel.platform,
  });

  // Update original record instead of creating new one
  // Save the original task_id to previous_task_id
  const { error: updateError } = await supabase
    .from('generation_tasks')
    .update({
      previous_task_id: originalTaskId,
      task_id: newPlatformTaskId,
      model_id: fallbackModelId,
      model: fallbackModel.name,
      platform: fallbackModel.platform,
      status: GenerationStatus.PENDING,
      payload: JSON.stringify(fallbackPayload),
    })
    .eq('task_id', originalTaskId);

  if (updateError) {
    console.error(
      '[FALLBACK] Failed to update original task record:',
      updateError,
    );
    return { success: false, error: 'Failed to update task record' };
  }

  console.log('[FALLBACK] Successfully updated task record:', {
    originalTaskId,
    newPlatformTaskId,
  });

  return { success: true, newTaskId: newPlatformTaskId };
};

/**
 * Cancel a platform task by platform name and task ID.
 * Only Replicate supports cancellation via API; other platforms log a warning.
 */
async function cancelPlatformTask(platform: string, taskId: string) {
  if (platform === 'replicate') {
    try {
      await replicate.predictions.cancel(taskId);
    } catch (e) {
      console.warn('[SUBMIT] Failed to cancel replicate prediction', taskId, e);
    }
    return;
  }
  console.warn(
    `[SUBMIT] Cannot cancel ${platform} task ${taskId} - no cancel API available`,
  );
}

const handler = async (request: Request) => {
  // console.log('webhook url', webhookUrl)
  const params = await getParams(request);
  let targetModel = params.target_model;

  // Auto-switch text-to-video → image-to-video when user provides an image
  const hasImage = !!(
    params.image ||
    (Array.isArray(params.images) && params.images.length > 0)
  );
  if (hasImage) {
    // text-to-video → image-to-video 映射表
    const textToImageVideoMap: Record<number, number> = {
      [ModelIds.SORA_TEXT_TO_VIDEO]: ModelIds.SORA,
      [ModelIds.SORA_PRO_TEXT_TO_VIDEO]: ModelIds.SORA_PRO,
      [ModelIds.SORA_STABLE_TEXT_TO_VIDEO]: ModelIds.SORA_STABLE,
      [ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO]: ModelIds.SORA_PRO_STABLE,
    };
    const mappedModel = textToImageVideoMap[targetModel];
    if (mappedModel !== undefined) {
      targetModel = mappedModel;
      params.target_model = targetModel;
    }
  }

  const model = ModelConfig[targetModel];
  const supabase = createSupabase();
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return unauthorized('Unauthorized');
  }

  if (!model) {
    // return new Response('Model not found', { status: 400 });
    return failedWithCode(
      ERROR_CODES.GENERATION_MODEL_NOT_FOUND,
      'Model not found',
    );
  }

  const creditModel = new CreditModel(userId);
  const cost = await model.cost(params);
  if (!isNumber(cost) || isNaN(cost)) {
    return failedWithCode(ERROR_CODES.GENERATION_FAILED, 'Invalid cost');
  }

  // 检查用户是否有足够的积分（包括正在处理中的任务）
  let reserved = 0;
  try {
    const { data: pendingTasks, error: pendingError } = await supabase
      .from('generation_tasks')
      .select('cost, status')
      .eq('user_id', userId)
      .in('status', [GenerationStatus.PENDING, GenerationStatus.PROCESSING]);

    if (!pendingError && Array.isArray(pendingTasks)) {
      reserved = pendingTasks.reduce(
        (sum: number, t: any) => sum + (t?.cost || 0),
        0,
      );
    } else if (pendingError) {
      console.warn(
        '[SUBMIT] Failed to fetch pending tasks for soft reservation',
        pendingError,
      );
    }
  } catch (e) {
    console.warn('[SUBMIT] Soft reservation check failed', e);
  }

  const generationCount = params.num_images || 1;
  const totalNeeded = (Number(cost) || 0) * generationCount + reserved;
  const isEnough = await creditModel.canConsume(totalNeeded);
  if (!isEnough) {
    return failedWithCode(ERROR_CODES.NOT_ENOUGH_ZAPS, 'Insufficient credits');
  }

  if (model.type === TASK_TYPES.VIDEO) {
    const isAllowed = await checkGenerationAllowed(
      userId,
      model.type,
      supabase,
    );
    if (!isAllowed) {
      return failedWithCode(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
      );
    }
  }

  const tasks: number[] = [];

  // check params
  let input;
  try {
    input = await model.parseParams(params);
    console.log('input params:', input, userId);
  } catch (e) {
    console.error('Failed to parse params', e);
    if (model.platform === 'replicate') {
      return failedWithCode(ERROR_CODES.INVALID_PARAMS, 'Invalid params', {
        model: model.name,
        platform: model.platform,
        message: (e as any)?.message,
      });
    }
    return failedWithCode(ERROR_CODES.INVALID_PARAMS, 'Invalid params');
  }

  const generateTask = async () => {
    const upgradeToModelId = model.upgradeToModelByInput?.(input) || 0;
    const modelName = ModelConfig[upgradeToModelId]?.name ?? model.name;
    const modelId = upgradeToModelId || targetModel;
    const targetModelConfig = ModelConfig[modelId] || model;

    // Step 1: 先写 DB（用临时 task_id 占位），DB 失败则平台不调用
    const tempTaskId = `temp-${randomUUID()}`;

    let newParams = params;
    if (
      params?.init_images?.length &&
      params.init_images.some((image: string) => image.startsWith('data:'))
    ) {
      newParams = {
        ...params,
        init_images: params.init_images.map((image: string) => {
          if (image.startsWith('data:')) {
            return 'image_placeholder';
          }
          return image;
        }),
      };
    }
    const payload = JSON.stringify(newParams);

    const { data: task, error } = await supabase.rpc('create_generation_task', {
      p_user_id: userId,
      p_task_id: tempTaskId,
      p_cost: cost,
      p_model: modelName,
      p_platform: targetModelConfig.platform,
      p_type: targetModelConfig.type,
      p_model_id: modelId,
      p_payload: payload,
      p_tool: params.tool,
    });

    if (!task || error) {
      console.log('[SUBMIT] DB write failed before platform call', error, task);
      if ((task === null || task === undefined) && !error) {
        return { error: 'RATE_LIMIT' };
      }
      return { error: 'Failed to submit task' };
    }

    // Step 2: DB 写入成功后再调平台 API
    const submitResult = await submitTaskToPlatform(
      targetModelConfig,
      input,
      webhookUrl,
      params,
      userId,
    );

    if (!submitResult.success || !submitResult.taskId) {
      // 平台失败 → 清理 DB 占位记录，用户可立即重试
      await supabase
        .from('generation_tasks')
        .delete()
        .eq('task_id', tempTaskId);
      return { error: submitResult.error || 'Failed to submit task' };
    }

    const platformTaskId = submitResult.taskId;

    // Step 3: 更新 DB 记录，把 tempTaskId 替换为真实 platformTaskId（重试 5 次）
    const MAX_RETRIES = 5;
    let updateError = null;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('generation_tasks')
        .update({ task_id: platformTaskId })
        .eq('task_id', tempTaskId)
        .select('task_id');
      if (!updateErr && updatedRows && updatedRows.length > 0) {
        updateError = null;
        break;
      }
      updateError =
        updateErr ?? new Error(`No row matched tempTaskId: ${tempTaskId}`);
      if (i < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 200 * (i + 1)));
      }
    }

    if (updateError) {
      // 5 次重试全失败 → 取消平台任务，清理 DB 记录，返回错误
      console.error(
        '[SUBMIT] Failed to update task_id after retries',
        updateError,
      );
      await cancelPlatformTask(targetModelConfig.platform, platformTaskId);
      await supabase
        .from('generation_tasks')
        .delete()
        .eq('task_id', tempTaskId);
      return { error: 'Failed to submit task' };
    }

    tasks.push(task);
  };

  // for (let i = 0; i < generationCount; i++) {
  //   const response = await generateTask();
  //   if (response instanceof Response) {
  //     return response;
  //   }
  // }
  const results = await Promise.all(
    new Array(generationCount).fill(0).map(() => generateTask()),
  );

  const allFailed = results.every(result => result?.error);
  if (allFailed) {
    if (results.some(result => result?.error === 'RATE_LIMIT')) {
      return failedWithCode(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
      );
    }
    return failedWithCode(
      ERROR_CODES.GENERATION_FAILED,
      'Failed to submit task',
    );
  }

  return success({ task_ids: tasks });
};

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
]);
