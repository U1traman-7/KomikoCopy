import sodium from 'libsodium-wrappers';
import * as crypto from 'crypto';
import {
  createSupabase,
  deleteMediaByUrl,
  uploadMediaFromUrl,
} from '../_utils/index.js';
import {
  GenerationStatus,
  TASK_TYPES,
  TaskTypes,
  ModelIds,
} from '../_constants.js';
import { CreditModel } from '../_models/credit.js';
import { waitUntil } from '@vercel/functions';
import { ModelConfig, type FallbackFailureInfo } from './_common/models.js';
import { createFallbackTask } from './submit.js';

const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json';
const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let jwksCache = null;
let jwksCacheTime = 0;

const response = (message?: string) =>
  new Response(message || 'OK', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SECRET || '';
const WAVESPEED_WEBHOOK_SECRET = process.env.WAVESPEED_WEBHOOK_SECRET || '';
// const MAX_DIFF_IN_SECONDS = 300;

async function fetchJwks() {
  const currentTime = Date.now();
  if (!jwksCache || currentTime - jwksCacheTime > JWKS_CACHE_DURATION) {
    const response = await fetch(JWKS_URL);
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }
    jwksCache = (await response.json()).keys || [];
    jwksCacheTime = currentTime;
  }
  return jwksCache;
}

export async function verifyWebhookSignature(
  requestId,
  userId,
  timestamp,
  signatureHex,
  body,
) {
  if (!requestId || !userId || !timestamp || !signatureHex || !body) {
    return false;
  }
  await sodium.ready;

  // Validate timestamp (within ±5 minutes)
  // try {
  //   const timestampInt = parseInt(timestamp, 10);
  //   const currentTime = Math.floor(Date.now() / 1000);
  //   if (Math.abs(currentTime - timestampInt) > 300) {
  //     console.error('Timestamp is too old or in the future.');
  //     return false;
  //   }
  // } catch (e) {
  //   console.error('Invalid timestamp format:', e);
  //   return false;
  // }

  // Construct the message to verify
  try {
    const messageParts = [
      requestId,
      userId,
      timestamp,
      crypto.createHash('sha256').update(body).digest('hex'),
    ];
    if (messageParts.some(part => part === null)) {
      console.error('Missing required header value.');
      return false;
    }
    const messageToVerify = messageParts.join('\n');
    const messageBytes = Buffer.from(messageToVerify, 'utf-8');

    // Decode signature
    let signatureBytes;
    try {
      signatureBytes = Buffer.from(signatureHex, 'hex');
    } catch (e) {
      console.error('Invalid signature format (not hexadecimal).');
      return false;
    }

    // Fetch public keys
    let publicKeysInfo;
    try {
      publicKeysInfo = await fetchJwks();
      if (!publicKeysInfo.length) {
        console.error('No public keys found in JWKS.');
        return false;
      }
    } catch (e) {
      console.error('Error fetching JWKS:', e);
      return false;
    }
    console.log(publicKeysInfo);

    // verify signature with each public key
    for (const keyInfo of publicKeysInfo) {
      try {
        const publicKeyB64Url = keyInfo.x;
        if (typeof publicKeyB64Url !== 'string') {
          continue;
        }
        const publicKeyBytes = Buffer.from(publicKeyB64Url, 'base64url');
        const isValid = sodium.crypto_sign_verify_detached(
          signatureBytes,
          messageBytes,
          publicKeyBytes,
        );
        if (isValid) {
          return true;
        }
      } catch (e) {
        console.error('Verification failed with a key:', e);
        continue;
      }
    }

    console.error('Signature verification failed with all keys.');
    return false;
  } catch (e) {
    console.error('Error constructing message:', e);
    return false;
  }
}

const supabase = createSupabase();
export const verifyReplicateSignature = async (
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignatures: string | null,
  body: string,
) => {
  if (!webhookId || !webhookTimestamp || !webhookSignatures || !body) {
    console.warn('[WEBHOOK][replicate] Missing required signature headers', {
      hasId: !!webhookId,
      hasTimestamp: !!webhookTimestamp,
      hasSignatures: !!webhookSignatures,
      bodyLength: body?.length,
    });
    return false;
  }
  // const timestamp = parseInt(webhookTimestamp);
  // const now = Math.floor(Date.now() / 1000);
  // const diff = Math.abs(now - timestamp);

  // if (diff > MAX_DIFF_IN_SECONDS) {
  //   return false
  // }
  if (!WEBHOOK_SECRET) {
    console.error(
      '[WEBHOOK][replicate] REPLICATE_WEBHOOK_SECRET not set; all webhooks will be rejected',
    );
    return false;
  }
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

  // Get the secret key (remove 'whsec_' prefix)
  const secretKey = WEBHOOK_SECRET.split('_')[1];
  const secretBytes = Buffer.from(secretKey, 'base64');

  // Calculate the HMAC signature
  const computedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // Parse the webhook signatures
  const expectedSignatures = webhookSignatures
    .split(' ')
    .map(sig => sig.split(',')[1]);

  // console.log(expectedSignatures, computedSignature)

  const isValid = expectedSignatures.some(expectedSig =>
    crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(computedSignature),
    ),
  );

  if (!isValid) {
    return false;
  }
  return true;
};

export const verifyWaveSpeedSignature = async (
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null,
  body: string,
) => {
  if (!webhookId || !webhookTimestamp || !webhookSignature || !body) {
    console.warn('[WEBHOOK][wavespeed] Missing required signature headers', {
      hasId: !!webhookId,
      hasTimestamp: !!webhookTimestamp,
      hasSignature: !!webhookSignature,
      bodyLength: body?.length,
    });
    return false;
  }

  if (!WAVESPEED_WEBHOOK_SECRET) {
    console.error(
      '[WEBHOOK][wavespeed] WAVESPEED_WEBHOOK_SECRET not set; all webhooks will be rejected',
    );
    return false;
  }

  // Validate timestamp (within 5 minutes)
  try {
    const timestampInt = parseInt(webhookTimestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestampInt) > 300) {
      console.error(
        '[WEBHOOK][wavespeed] Timestamp is too old or in the future.',
      );
      return false;
    }
  } catch (e) {
    console.error('[WEBHOOK][wavespeed] Invalid timestamp format:', e);
    return false;
  }

  // Parse signature header (format: v3,<signature>)
  const signatureParts = webhookSignature.split(',');
  if (signatureParts.length !== 2 || signatureParts[0] !== 'v3') {
    console.error('[WEBHOOK][wavespeed] Invalid signature header format');
    return false;
  }

  const receivedSignature = signatureParts[1];

  // Construct the signed content: {webhook-id}.{webhook-timestamp}.{raw_body}
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

  // Calculate HMAC once (raw bytes)
  const expectedSignature = crypto
    .createHmac('sha256', WAVESPEED_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex');

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    )
  ) {
    console.error('[WEBHOOK][wavespeed] Signature verification failed');
    return false;
  }

  return true;
};

const processGemini = async (request: Request) => {
  const taskId = request.headers.get('x-gemini-task-id') as string;
  if (!taskId) {
    console.error('[WEBHOOK][GEMINI] Task ID is required');
    return { success: false, error: 'Task ID is required' };
  }
  try {
    const bodyText = await request.text();
    console.log(bodyText, 'bodyText');
    const body = JSON.parse(bodyText);

    const { output, tool } = body;
    if (!output) {
      console.error('[WEBHOOK][GEMINI] Output is required');
      return { success: false, error: 'Output is required' };
    }
    return { success: true, taskId, output, tool };
  } catch (e) {
    console.error('[WEBHOOK][GEMINI] Failed to process Gemini task:', e);
    return { success: false, error: 'Failed to process Gemini task' };
  }
};

const deleteUploadedFile = async (payload: string | null) => {
  if (!payload) {
    return;
  }
  try {
    const data = JSON.parse(payload);
    // const file = data.video || data.image;
    let images = data.images ?? [];
    if (!Array.isArray(images)) {
      images = [];
    }
    if (!data.should_delete_media) {
      return;
    }

    const files = [data.video, data.image, ...images].filter(Boolean);

    // Only delete files that were uploaded to our Supabase bucket; skip external URLs (e.g., fal.media)
    const supabaseBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/`;

    // 不会删除的目录
    // app_media/ 和 app_videos/ 是安全的，可以删除（临时上传）
    // 受保护的目录，不允许删除
    const protectedPaths = [
      '/custom_characters/', // 角色图片
      '/image_generation/', // 用户生成的图片
      '/generations/', // 生成的结果
      '/story/',
      '/posts/', // 帖子媒体
      '/profiles/', // 用户资料
      '/avatars/', // 用户头像
      '/uploads/', // 用户上传
      '/assets/', // 系统资源（模板、示例）
    ];

    const safeToDeleteFiles = files.filter((url: string) => {
      if (typeof url !== 'string') {
        return false;
      }
      // 必须在我们的Supabase bucket中
      if (!url.startsWith(supabaseBase)) {
        return false;
      }
      // 必须不在保护目录中
      return !protectedPaths.some(path => url.includes(path));
    });

    if (safeToDeleteFiles.length === 0) {
      return;
    }

    for (const file of safeToDeleteFiles) {
      const result = await deleteMediaByUrl(file);
      if (result.success) {
        console.log('delete file success', file);
      } else {
        console.error('delete file failed', file, result.error);
      }
    }
  } catch (e) {
    console.error('delete file failed', e);
  }
};

export const failedTask = async (
  taskId: string,
  failureInfo?: FallbackFailureInfo,
) => {
  console.log('[WEBHOOK][FAILED] Processing failed task:', {
    taskId,
    failure: failureInfo?.failure,
    failureCode: failureInfo?.failureCode,
  });

  // Get task details for potential fallback
  const { data: tasks } = await supabase
    .from('generation_tasks')
    .select('payload, platform, model_id, user_id, cost, type, tool')
    .eq('task_id', taskId)
    .limit(1);

  let currentTask = tasks?.[0];
  if (!currentTask) {
    // Race condition retry: submit.ts may not have updated temp task_id to platformTaskId yet
    console.warn(
      '[WEBHOOK] task_id not found, retrying after delay (possible race condition)',
      taskId,
    );
    await new Promise(r => setTimeout(r, 2000));
    const { data: retryTasks } = await supabase
      .from('generation_tasks')
      .select('payload, platform, model_id, user_id, cost, type, tool')
      .eq('task_id', taskId)
      .limit(1);
    currentTask = retryTasks?.[0];
  }

  if (!currentTask) {
    console.error('[WEBHOOK][FAILED] Task not found after retry:', taskId);
    return response('Task not found');
  }

  console.log('[WEBHOOK][FAILED] Current task info:', {
    taskId,
    platform: currentTask?.platform,
    model_id: currentTask?.model_id,
    hasPayload: !!currentTask?.payload,
  });

  // Check if this model has a fallback configuration
  const modelConfig = currentTask.model_id
    ? ModelConfig[currentTask.model_id]
    : null;
  const fallbackConfig = modelConfig?.fallback;

  if (fallbackConfig) {
    // Check if we should use fallback based on failure info
    const shouldUseFallback = fallbackConfig.shouldFallback
      ? fallbackConfig.shouldFallback(failureInfo)
      : true; // Default to fallback if no shouldFallback function

    if (shouldUseFallback) {
      console.log('[WEBHOOK][FAILED] Attempting fallback for model:', {
        modelId: currentTask.model_id,
        fallbackModelId: fallbackConfig.modelId,
        taskId,
      });

      try {
        // Compute params override
        let paramsOverride: Record<string, any> | undefined;
        if (fallbackConfig.paramsOverride) {
          if (typeof fallbackConfig.paramsOverride === 'function') {
            const payload = currentTask.payload
              ? JSON.parse(currentTask.payload)
              : {};
            paramsOverride = fallbackConfig.paramsOverride(payload);
          } else {
            paramsOverride = fallbackConfig.paramsOverride;
          }
        }

        // Use the generic createFallbackTask from submit.ts
        const fallbackResult = await createFallbackTask({
          originalTaskId: taskId,
          originalPayload: currentTask.payload,
          fallbackModelId: fallbackConfig.modelId,
          paramsOverride,
        });

        if (fallbackResult.success) {
          console.log(
            '[WEBHOOK][FAILED] Fallback task created successfully:',
            fallbackResult.newTaskId,
          );
          // The original record was updated, no need to mark as failed
          return response('OK');
        }

        console.log(
          '[WEBHOOK][FAILED] Fallback creation failed, proceeding with original failure:',
          fallbackResult.error,
        );
      } catch (error) {
        console.error('[WEBHOOK][FAILED] Error creating fallback:', error);
      }
    } else {
      console.log(
        '[WEBHOOK][FAILED] Fallback not triggered due to shouldFallback condition:',
        { failureInfo },
      );
    }
  }

  // Try to also persist failure info into payload JSON (non-breaking)
  try {
    if (failureInfo && (failureInfo.failure || failureInfo.failureCode)) {
      const currentPayload = currentTask?.payload;
      let newPayload = currentPayload;
      try {
        const obj = currentPayload ? JSON.parse(currentPayload) : {};
        if (failureInfo.failure) {
          obj.failure = failureInfo.failure;
        }
        if (failureInfo.failureCode) {
          obj.failureCode = failureInfo.failureCode;
        }
        newPayload = JSON.stringify(obj);

        console.log('[WEBHOOK][FAILED] Updated payload with failure info:', {
          taskId,
          failure: failureInfo.failure,
          failureCode: failureInfo.failureCode,
        });
      } catch (e) {
        console.error('[WEBHOOK][FAILED] Failed to parse/update payload:', e);
      }

      await supabase
        .from('generation_tasks')
        .update({ payload: newPayload })
        .eq('task_id', taskId);
    }
  } catch (e) {
    console.error(
      '[WEBHOOK][FAILED] Unable to merge failure info into payload:',
      e,
    );
  }

  const { error: updateError } = await supabase
    .from('generation_tasks')
    .update({
      status: GenerationStatus.FAILED,
    })
    .eq('task_id', taskId);

  if (updateError) {
    console.error('[WEBHOOK][FAILED] Failed to update task status:', {
      taskId,
      error: updateError,
    });
    return response('Internal Server Error');
  }

  waitUntil(deleteUploadedFile(currentTask.payload));
  console.log('[WEBHOOK][FAILED] Task marked as failed successfully:', taskId);
  return response('OK');
};

// 添加接口定义
interface ImageGeneration {
  id?: number;
  created_at?: string;
  prompt?: string;
  model?: string;
  url_path: string;
  tool: string;
  user_id: string;
  meta_data?: string;
}

interface VideoGeneration {
  id?: number;
  created_at?: string;
  video_url: string;
  tool: string;
  user_id: string;
  prompt: string;
  model?: string;
  meta_data?: string;
}

export function parseModelName(modelId: number): string {
  if (!modelId) {
    return '';
  }

  const modelConfig = ModelConfig[modelId];
  if (modelConfig) {
    let alias: any = modelConfig.alias;
    if (typeof alias === 'function') {
      alias = alias();
    }
    const modelName = alias || modelConfig.name;

    return modelName;
  }

  return '';
  // return `Model ${modelId}`;
}

// 创建图片生成记录
async function createImageGeneration(
  imageData: Omit<ImageGeneration, 'id' | 'created_at'>,
) {
  const { data, error } = await supabase
    .from('ImageGeneration')
    .insert([
      {
        url_path: imageData.url_path,
        tool: imageData.tool,
        user_id: imageData.user_id,
        prompt: imageData.prompt,
        model: imageData.model,
        meta_data: imageData.meta_data,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting image generation:', error);
    return null;
  }
  return data;
}

// 创建视频生成记录
async function createVideoGeneration(
  videoData: Omit<VideoGeneration, 'id' | 'created_at'>,
) {
  const { data, error } = await supabase
    .from('VideoGeneration')
    .insert([
      {
        video_url: videoData.video_url,
        tool: videoData.tool,
        user_id: videoData.user_id,
        prompt: videoData.prompt,
        model: videoData.model,
        meta_data: videoData.meta_data,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting video generation:', error);
    return null;
  }
  return data;
}

// 保存生成结果到相应表中
async function saveGenerationResult(
  output: string,
  userId: string,
  payload: string,
  modelId: number,
  type: TaskTypes,
) {
  if (!payload) {
    console.log('payload is null', payload);
    return;
  }

  try {
    const payloadData = JSON.parse(payload);
    const tool = payloadData.tool || '';
    const prompt = payloadData.originalPrompt || payloadData.prompt || '';
    const modelName = parseModelName(modelId);

    if (type === TASK_TYPES.VIDEO) {
      // 保存视频生成记录
      await createVideoGeneration({
        video_url: output,
        tool,
        user_id: userId,
        prompt,
        model: modelName,
        meta_data: payloadData.meta_data
          ? JSON.stringify(payloadData.meta_data)
          : undefined,
      });
      console.log('Video generation record saved successfully');
    } else if (type === TASK_TYPES.IMAGE) {
      // 保存图片生成记录
      await createImageGeneration({
        url_path: output,
        tool,
        user_id: userId,
        prompt,
        model: modelName,
        meta_data: payloadData.meta_data
          ? JSON.stringify(payloadData.meta_data)
          : undefined,
      });
      console.log('Image generation record saved successfully');
    }
  } catch (e) {
    console.error('Error saving generation result:', e);
  }
}

enum ArkProcessResult {
  IN_PROGRESS = 1,
  SUCCESS = 2,
  FAILED = 0,
  UNKNOWN = 3,
}

type ArkStatus = 'queued' | 'running' | 'succeeded' | 'canceled' | 'failed';

const processArkWebhook = async (data: any) => {
  if (!data) {
    return { status: ArkProcessResult.UNKNOWN, taskId: null };
  }
  if (!data.model?.startsWith('doubao-')) {
    return { status: ArkProcessResult.UNKNOWN, taskId: null };
  }
  const status = data.status as ArkStatus;
  if (status === 'succeeded') {
    return {
      status: ArkProcessResult.SUCCESS,
      taskId: data.id,
      url: data.content?.video_url || '',
    };
  }
  if (status === 'failed') {
    return {
      status: ArkProcessResult.FAILED,
      taskId: data.id,
      url: '',
    };
  }
  if (status === 'canceled') {
    return {
      status: ArkProcessResult.FAILED,
      taskId: data.id,
      url: '',
    };
  }
  return {
    status: ArkProcessResult.IN_PROGRESS,
    taskId: data.id,
    url: '',
  };
};
const processKusaWebhook = async (data: any) => {
  if (!data) {
    return { taskId: null };
  }
  if (typeof data.code === 'number' && data.data.task_id) {
    if (data.data.status === 'COMPLETED') {
      return {
        taskId: data.data.task_id,
        url: data.data.result?.images?.[0]?.display_url || '',
        error: '',
      };
    }
    if (data.data.status === 'FAILED') {
      return {
        taskId: data.data.task_id,
        url: '',
        error: data.data.error_message || 'Failed to generate image',
      };
    }
  }
  return { taskId: null };
};

export const handler = async (request: Request) => {
  console.log('[WEBHOOK-ENTRY] ===== WEBHOOK RECEIVED =====');
  console.log('[WEBHOOK-ENTRY] Method:', request.method);
  console.log('[WEBHOOK-ENTRY] URL:', request.url);

  // 详细的headers日志
  const allHeaders = Object.fromEntries(request.headers.entries());
  console.log('[WEBHOOK-ENTRY] Headers:', allHeaders);
  console.log('[WEBHOOK-ENTRY] Headers count:', Object.keys(allHeaders).length);

  // 检查特定的headers
  console.log(
    '[WEBHOOK-ENTRY] Content-Type:',
    request.headers.get('content-type'),
  );
  console.log('[WEBHOOK-ENTRY] User-Agent:', request.headers.get('user-agent'));
  console.log(
    '[WEBHOOK-ENTRY] Authorization:',
    request.headers.get('authorization') ? '[PRESENT]' : '[MISSING]',
  );
  console.log(
    '[WEBHOOK-ENTRY] X-Signature:',
    request.headers.get('x-signature') ? '[PRESENT]' : '[MISSING]',
  );
  console.log(
    '[WEBHOOK-ENTRY] X-Luma-Signature:',
    request.headers.get('x-luma-signature') ? '[PRESENT]' : '[MISSING]',
  );

  console.log('[WEBHOOK-ENTRY] Timestamp:', new Date().toISOString());

  let platform:
    | 'fal'
    | 'replicate'
    | 'wavespeed'
    | 'deer'
    | 'luma'
    | 'runway'
    | 'ark'
    | 'kie'
    | 'gemini'
    | 'kusa'
    | 'unknown' = 'deer';
  let output = '';
  let taskId = '';
  let tool: string = '';

  // console.log('headers', request.headers)
  if (!taskId && request.headers.get('x-fal-webhook-signature')) {
    platform = 'fal';
    const signature = request.headers.get('x-fal-webhook-signature');
    const timestamp = request.headers.get('x-fal-webhook-timestamp');
    const userId = request.headers.get('x-fal-webhook-user-id');
    const requestId = request.headers.get('x-fal-webhook-request-id');
    const text = await request.text();
    console.log('body', text);
    const body = Buffer.from(text);
    const isValid = await verifyWebhookSignature(
      requestId,
      userId,
      timestamp,
      signature,
      body,
    );
    if (!isValid) {
      console.log(
        'invalid signature',
        requestId,
        userId,
        timestamp,
        signature,
        body,
      );
      return response('Invalid signature');
    }
    const data = JSON.parse(text);
    taskId = data.requestId || data.request_id;

    if (data.status?.toLowerCase() !== 'ok' || data.error) {
      return failedTask(taskId);
    }

    output =
      data?.output ||
      data?.payload?.video?.url ||
      data?.payload?.images?.[0]?.url ||
      data?.payload?.image?.url;
    if (Array.isArray(output)) {
      output = output[0];
    }
  }

  console.log('webhook headers', request.headers);
  // Check for Replicate webhook: signature present and NOT WaveSpeed's v3 format
  if (
    !taskId &&
    request.headers.get('webhook-signature') &&
    !request.headers.get('webhook-signature')?.startsWith('v3,')
  ) {
    platform = 'replicate';
    const signature = request.headers.get('webhook-signature');
    const timestamp = request.headers.get('webhook-timestamp');
    const webhookId = request.headers.get('webhook-id');
    const text = await request.text();

    console.log('[WEBHOOK][replicate] Received webhook', {
      webhookId,
      timestamp,
      hasSignature: !!signature,
      bodyLength: text?.length,
    });

    const isValid = await verifyReplicateSignature(
      webhookId,
      timestamp,
      signature,
      text,
    );
    if (!isValid) {
      console.log(
        '[WEBHOOK][replicate] invalid signature',
        webhookId,
        timestamp,
        signature,
        text?.slice?.(0, 300),
      );
      return response('Invalid signature');
    }
    const data = JSON.parse(text);

    console.log(
      '[WEBHOOK][replicate] Parsed body keys',
      Object.keys(data || {}),
    );

    taskId = data.id;

    const st = (data.status || '').toLowerCase();
    if (st !== 'succeeded' || data.error) {
      console.log('[WEBHOOK][replicate] failed or not-succeeded task', {
        id: data.id,
        status: data.status,
        error: data.error,
      });
      return failedTask(taskId);
    }

    output =
      data?.output || data?.payload?.video?.url || data?.payload?.image?.url;
    if (Array.isArray(output)) {
      output = output[0];
    }

    console.log(
      '[WEBHOOK][replicate] Success, output url',
      typeof output === 'string' ? output.slice(0, 120) : output,
    );
  }

  // WaveSpeed callbacks (signature must be v3,<hex>)
  if (
    !taskId &&
    request.headers.get('webhook-id') &&
    request.headers.get('webhook-timestamp') &&
    request.headers.get('webhook-signature')?.startsWith('v3,')
  ) {
    platform = 'wavespeed';
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');
    const webhookSignature = request.headers.get('webhook-signature');
    const text = await request.text();

    console.log('[WEBHOOK][wavespeed] Received webhook', {
      webhookId,
      webhookTimestamp,
      hasSignature: !!webhookSignature,
      bodyLength: text?.length,
    });

    // Verify webhook signature
    const isValid = await verifyWaveSpeedSignature(
      webhookId,
      webhookTimestamp,
      webhookSignature,
      text,
    );

    if (!isValid) {
      console.log(
        '[WEBHOOK][wavespeed] invalid signature',
        webhookId,
        webhookTimestamp,
        webhookSignature,
        text?.slice?.(0, 300),
      );
      return response('Invalid signature');
    }

    const data = JSON.parse(text);
    console.log(
      '[WEBHOOK][wavespeed] Parsed body keys',
      Object.keys(data || {}),
    );

    taskId = data.id;
    const status = (data.status || '').toLowerCase();

    if (status !== 'completed' || data.error) {
      console.log('[WEBHOOK][wavespeed] failed or not-completed task', {
        id: data.id,
        status: data.status,
        error: data.error,
      });
      return failedTask(taskId);
    }

    // Extract output from outputs array
    if (
      data.outputs &&
      Array.isArray(data.outputs) &&
      data.outputs.length > 0
    ) {
      output = data.outputs[0];
    }

    console.log(
      '[WEBHOOK][wavespeed] Success, output url',
      typeof output === 'string' ? output.slice(0, 120) : output,
    );
  }

  // Gemini webhook
  if (!taskId && request.headers.get('x-gemini-task-id')) {
    const result = await processGemini(request);
    if (result.success && result.taskId && result.output) {
      taskId = result.taskId;
      output = result.output;
      tool = result.tool;
      platform = 'gemini';
    }
  }

  // KIE AI callbacks (Grok Imagine) + Luma Labs callbacks + generic JSON fallback (Runway poll)
  if (!taskId) {
    console.log('[WEBHOOK][generic] Entering generic webhook processing');
    const text = await request.text();
    // console.log(
    //   '[WEBHOOK][generic] Raw body text (first 500 chars):',
    //   text.slice(0, 500),
    // );

    let data: any = null;
    try {
      data = JSON.parse(text);
      // console.log(
      //   '[WEBHOOK][generic] Parsed JSON keys:',
      //   Object.keys(data || {}),
      // );
      // console.log('[WEBHOOK][generic] Data sample:', {
      //   id: data?.id,
      //   'detail.id': data?.detail?.id,
      //   status: data?.status,
      //   'detail.status': data?.detail?.status,
      //   state: data?.state,
      //   hasOutput: !!data?.output,
      //   hasAssets: !!data?.assets,
      //   hasVideoUrls: !!data?.videoUrls,
      // });
    } catch (e) {
      console.log('[WEBHOOK][generic] Failed to parse JSON:', e);
      return response('Unknown platform');
    }

    const kusaResult = await processKusaWebhook(data);
    if (kusaResult.taskId) {
      taskId = kusaResult.taskId;
      output = kusaResult.url;
      platform = 'kusa';
      if (kusaResult.error) {
        return failedTask(taskId, {
          failure: kusaResult.error,
          failureCode: 'KUSA_ERROR',
        });
      }
    }

    // KIE AI webhook format: { code: 200|501, data: { taskId, state, resultJson, failCode, failMsg }, msg }
    // Handles both grok-imagine and sora-2 models
    const isKieModel =
      data.data?.model?.startsWith('grok-imagine') ||
      data.data?.model?.startsWith('sora-2');
    if (
      !taskId &&
      data &&
      typeof data.code === 'number' &&
      data.data?.taskId &&
      isKieModel
    ) {
      platform = 'kie';
      taskId = data.data.taskId;

      console.log('[WEBHOOK][kie] Received KIE AI webhook', {
        taskId,
        code: data.code,
        state: data.data.state,
        model: data.data.model,
      });

      const state = String(data.data.state).toLowerCase();

      if (state === 'success' && data.code === 200) {
        // Parse resultJson to get the output URL
        try {
          const resultJson = JSON.parse(data.data.resultJson || '{}');
          const resultUrls = resultJson.resultUrls || [];
          output = resultUrls[0] || '';

          console.log('[WEBHOOK][kie] Success, output:', output?.slice(0, 120));
        } catch (e) {
          console.error('[WEBHOOK][kie] Failed to parse resultJson:', e);
          return failedTask(taskId, {
            failure: 'Failed to parse result',
            failureCode: 'PARSE_ERROR',
          });
        }
      } else if (state === 'fail' || data.code !== 200) {
        console.log('[WEBHOOK][kie] Task failed', {
          taskId,
          failCode: data.data.failCode,
          failMsg: data.data.failMsg,
        });
        return failedTask(taskId, {
          failure: data.data.failMsg || data.msg || 'KIE task failed',
          failureCode: data.data.failCode || String(data.code),
        });
      } else if (
        state === 'waiting' ||
        state === 'queuing' ||
        state === 'generating'
      ) {
        console.log('[WEBHOOK][kie] Task in progress, state:', state);
        return response('In progress');
      }
    }

    const result = await processArkWebhook(data);
    if (result.status === ArkProcessResult.FAILED) {
      return failedTask(result.taskId);
    }
    if (result.status === ArkProcessResult.IN_PROGRESS) {
      return response('In progress');
    }
    if (result.status === ArkProcessResult.SUCCESS) {
      output = result.url;
      platform = 'ark';
      taskId = result.taskId;
    }

    // Luma schema (only used for fallback tasks)
    if (!taskId && data && data.id && typeof data.state === 'string') {
      console.log('[WEBHOOK][luma] Detected Luma webhook format');
      taskId = data.id;
      platform = 'luma';
      const state = String(data.state).toLowerCase();
      console.log('[WEBHOOK][luma] State:', state);

      if (state === 'completed') {
        output = Array.isArray(data?.assets?.video)
          ? data.assets.video[0]
          : data?.assets?.video || '';
        console.log(
          '[WEBHOOK][luma] Success, output:',
          typeof output === 'string' ? output.slice(0, 120) : output,
        );
      } else if (state === 'failed') {
        console.log('[WEBHOOK][luma] Task failed');
        return failedTask(taskId);
      } else {
        console.log('[WEBHOOK][luma] Task in progress, state:', state);
        return response('In progress');
      }
    }

    // Generic schema (e.g., Runway polling forward: { id, status, output, failure, failureCode } or { detail: {...} })
    if (
      !taskId &&
      data &&
      (data.id || data.detail?.id) &&
      typeof (data.status || data.detail?.status) === 'string'
    ) {
      console.log('[WEBHOOK][runway] Detected Runway/generic webhook format');
      taskId = data.id || data.detail?.id;
      platform = 'runway';
      const st = String(data.status || data.detail?.status).toUpperCase();
      console.log('[WEBHOOK][runway] Status:', st);

      if (st === 'SUCCEEDED' || st === 'COMPLETED') {
        output =
          data.output ||
          data?.payload?.video?.url ||
          data?.payload?.image?.url ||
          '';
        if (Array.isArray(output)) {
          output = output[0];
        }
        console.log(
          '[WEBHOOK][runway] Success, output:',
          typeof output === 'string' ? output.slice(0, 120) : output,
        );
      } else if (st === 'FAILED' || st === 'CANCELED' || st === 'ERROR') {
        const failure = data.failure || data.detail?.failure;
        const failureCode = data.failureCode || data.detail?.failureCode;
        console.log('[WEBHOOK][runway] failed task', {
          taskId,
          failure,
          failureCode,
        });
        return failedTask(taskId, { failure, failureCode });
      } else {
        console.log('[WEBHOOK][runway] Task in progress, status:', st);
        return response('In progress');
      }
    }

    console.log('[WEBHOOK][generic] No matching webhook format found');
  }

  if (!taskId) {
    console.log('[WEBHOOK] No taskId found after all processing');
    return response('Task not found');
  }

  console.log(`[WEBHOOK][${platform}] Processing task:`, {
    taskId,
    platform,
    hasOutput: !!output,
    outputType: typeof output,
    outputLength:
      typeof output === 'string'
        ? output.length
        : Array.isArray(output)
          ? (output as any[]).length
          : 'N/A',
  });

  console.log(`[WEBHOOK][${platform}] Querying task in database:`, taskId);

  let { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select('cost, user_id, payload, model_id, type, status, tool')
    .eq('task_id', taskId);

  let taskData = tasks?.[0];
  if (!taskData?.user_id || error) {
    // Race condition retry: submit.ts may not have updated temp task_id to platformTaskId yet
    console.warn(
      '[WEBHOOK] task_id not found, retrying after delay (possible race condition)',
      taskId,
    );
    await new Promise(r => setTimeout(r, 2000));
    const { data: retryTasks, error: retryError } = await supabase
      .from('generation_tasks')
      .select('cost, user_id, payload, model_id, type, status, tool')
      .eq('task_id', taskId);
    tasks = retryTasks;
    error = retryError;
    taskData = tasks?.[0];
  }

  if (!tool) {
    tool = taskData?.tool || '';
  }

  console.log(`[WEBHOOK][${platform}] Database query result:`, {
    taskId,
    tasksFound: tasks?.length || 0,
    error: error?.message,
    tasks: tasks?.map(t => ({
      user_id: t.user_id,
      model_id: t.model_id,
      status: t.status,
    })),
  });

  if (!taskData?.user_id || error) {
    console.error(
      `[WEBHOOK][${platform}] Task not found in database after retry:`,
      taskId,
      error?.message,
    );
    return response('Task not found');
  }

  console.log(`[WEBHOOK][${platform}] Task found in database:`, {
    taskId,
    currentStatus: taskData.status,
    userId: taskData.user_id,
    type: taskData.type,
    cost: taskData.cost,
  });

  // Note: previous_task_id is now only used for historical/debugging purposes
  // since we reuse the original record for fallback tasks instead of creating new ones

  if (
    taskData.status === GenerationStatus.SUCCEEDED ||
    taskData.status === GenerationStatus.FINISHED
  ) {
    console.log(`[WEBHOOK][${platform}] Task already processed:`, taskId);
    return response('OK');
  }

  if (taskData.status === GenerationStatus.FAILED && !output) {
    console.log(`[WEBHOOK][${platform}] Task already failed:`, taskId);
    return response('OK');
  }

  if (!output) {
    console.log('No output found for task:', taskId);
    // return new Response('No output found', { status: 400 });
    // const { error: updateError } = await supabase
    //   .from('generation_tasks')
    //   .update({
    //     status: GenerationStatus.FAILED,
    //   })
    //   .eq('task_id', taskId);
    // if (updateError) {
    //   console.error('update error', updateError);
    //   return new Response('Internal Server Error', { status: 200 });
    // }
    return failedTask(taskId);
    // return new Response('OK');
  }

  if (!output.includes('husbando-land')) {
    try {
      const result = await uploadMediaFromUrl(
        output,
        taskData.user_id,
        tool === 'oc-maker' || tool === 'ai-comic-generator',
      );
      if (result) {
        output = result;
      }
    } catch (e) {
      console.error('upload error', e);
    }
  }

  // 仅当状态从非 SUCCEEDED 变为 SUCCEEDED 时扣费
  const { data: updatedRows, error: updateError } = await supabase
    .from('generation_tasks')
    .update({
      status: GenerationStatus.SUCCEEDED,
      output,
    })
    .neq('status', GenerationStatus.SUCCEEDED)
    .eq('task_id', taskId)
    .select('task_id');

  if (updateError) {
    console.error(
      `[WEBHOOK][${platform}] Task update failed:`,
      taskId,
      updateError.message,
    );
    return response('Internal Server Error');
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.log(
      `[WEBHOOK][${platform}] Task already processed, skip charging:`,
      taskId,
    );
    return response('OK');
  }

  const creditModel = new CreditModel(taskData.user_id);
  try {
    await creditModel.deductCredit(taskData.cost, taskData.tool);
    console.log(
      `[WEBHOOK][${platform}] Credit deducted:`,
      taskId,
      taskData.cost,
    );
  } catch (e) {
    console.error(
      `[WEBHOOK][${platform}] Credit deduction failed:`,
      taskId,
      e instanceof Error ? e.message : String(e),
    );
  }

  waitUntil(deleteUploadedFile(taskData.payload));

  const finalModelId = taskData.model_id || 0;
  try {
    await saveGenerationResult(
      output,
      taskData.user_id,
      taskData.payload,
      finalModelId,
      taskData.type,
    );
    console.log(`[WEBHOOK][${platform}] Completed:`, taskId);
  } catch (e) {
    console.error(
      `[WEBHOOK][${platform}] Save result failed:`,
      taskId,
      e instanceof Error ? e.message : String(e),
    );
  }

  return response('OK');
};

export const POST = async (request: Request) => {
  try {
    return handler(request);
  } catch (error) {
    console.error(error);
    return response('Internal Server Error');
  }
};
