import { CreditModel } from "../_models/credit.js";
import { failed } from "../_utils/index.js";
import { TalkingHeadQuality, calculateTalkingHeadCost, HEDRA_CREDIT_TO_DOLLAR } from "./_zaps.js";
import { getAuthUserId } from "./image-generation.js";
import { createSupabase } from "../_utils/index.js";

//  API base URL
const BASE_URL = "https://api.hedra.com/web-app";

// 初始化Supabase客户端
const supabase = createSupabase();

// 生成唯一资产名称
function generateUniqueName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomStr}.${extension}`;
}

// API response interfaces
interface AssetCreationResponse {
  id: string;
  status: string;
}

interface GenerationResponse {
  id: string;
  status: string;
}

// 视频生成状态枚举
export enum TalkingHeadStatus {
  DONE = 0,
  GENERATING = 1
}

// 数据库操作函数
export interface TalkingHeadGeneration {
  id?: number;
  created_at?: string;
  video_url: string;
  tool: string;
  user_id: string;
  prompt: string;
  status?: TalkingHeadStatus;
  meta_data?: any;
}

export interface PredictionMapping {
  id?: number;
  prediction_id: string;
  video_url: string;
  user_id: string;
  reserved_credits?: number;
  created_at?: string;
  meta_data?: any;
}

export async function createPredictionMapping(
  mapping: Omit<PredictionMapping, 'id' | 'created_at'>,
) {
  const { data, error } = await supabase
    .from('PredictionVideoMapping')
    .insert([mapping])
    .select();

  if (error) {
    console.error('Error inserting prediction mapping:', error);
    return null;
  }

  return data;
}

// 根据 prediction_id 获取映射
export async function getPredictionMapping(predictionId: string) {
  const { data, error } = await supabase
    .from('PredictionVideoMapping')
    .select('*')
    .eq('prediction_id', predictionId)
    .single();

  if (error) {
    console.error('Error fetching prediction mapping:', error);
    return null;
  }

  return data;
}

// 删除 prediction 映射记录
export async function deletePredictionMapping(predictionId: string) {
  const { data, error } = await supabase
    .from('PredictionVideoMapping')
    .delete()
    .eq('prediction_id', predictionId)
    .select();

  if (error) {
    console.error('Error deleting prediction mapping:', error);
    return null;
  }

  return data;
}

// 释放保留的积分回用户账户（实际上不需要操作，因为我们从未真正扣除）
export async function releaseReservedCredits(predictionId: string) {
  const mapping = await getPredictionMapping(predictionId);
  if (!mapping || !mapping.reserved_credits) {
    console.log(`No reserved credits found for prediction ${predictionId}`);
    return true;
  }

  return true;
}

// 扣除保留的积分
export async function deductReservedCredits(predictionId: string) {
  const mapping = await getPredictionMapping(predictionId);
  if (!mapping || !mapping.reserved_credits) {
    console.log(`No reserved credits found for prediction ${predictionId}`);
    return true;
  }

  console.log(
    `Deducting ${mapping.reserved_credits} reserved credits from user ${mapping.user_id}`,
  );

  const credit = new CreditModel(mapping.user_id);

  // 最终验证用户仍有足够积分（防止竞态条件）
  const hasEnoughCredits = await credit.canConsume(mapping.reserved_credits);
  if (!hasEnoughCredits) {
    console.error(
      `User ${mapping.user_id} no longer has enough credits for reserved amount ${mapping.reserved_credits}`,
    );
    return false;
  }
  
  const success = await credit.deductCredit(
    mapping.reserved_credits,
    'talking-head',
  );
  
  if (success) {
    console.log(
      `Successfully deducted ${mapping.reserved_credits} credits from user ${mapping.user_id}`,
    );
  } else {
    console.error(
      `Failed to deduct reserved credits from user ${mapping.user_id}`,
    );
  }

  return success;
}

// 创建视频数据
export async function createTalkingHeadGeneration(
  videoData: Omit<TalkingHeadGeneration, 'id' | 'created_at'>,
) {
  const { data, error } = await supabase
    .from('VideoGeneration')
    .insert([
      {
        video_url: videoData.video_url,
        tool: videoData.tool,
        user_id: videoData.user_id,
        prompt: videoData.prompt,
        meta_data: videoData.meta_data || {},
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting talking-head generation:', error);
    return null;
  }

  return data;
}

// 获取用户视频列表
export async function getTalkingHeadsByUser(user_id: string) {
  const { data, error } = await supabase
    .from('VideoGeneration')
    .select('*')
    .eq('tool', 'talking-head')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching talking-head generations:', error);
    return null;
  }
  return data;
}

// 删除视频数据
export async function deleteTalkingHeadById(id: number, userId: string) {
  const { data, error } = await supabase
    .from('VideoGeneration')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('tool', 'talking-head')
    .select();

  if (error) {
    console.error('Error deleting talking-head generation:', error);
    return null;
  }
  return data;
}

// 从base64转换为Blob
function base64ToBlob(base64String: string, contentType: string): Blob {
  const parts = base64String.split(',');
  const base64Data = parts[1] || parts[0];
  const byteCharacters = Buffer.from(base64Data, 'base64');
  return new Blob([byteCharacters], { type: contentType });
}

export async function POST(request: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] Talking head request started`);

    const userId = await getAuthUserId(request);
    if (!userId) {
      console.log(`[${requestId}] Unauthorized request`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Handle different request types (JSON or FormData)
    let requestData: FormData | null = null;
    let jsonData: any = null;

    // Check if it's a JSON request first
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        jsonData = await request.json();

        // Handle getVideos
        if (jsonData.method === 'getVideos') {
          try {
            const results = await getTalkingHeadsByUser(userId);
            const videosData = results?.map(({ user_id, ...rest }) => ({
              ...rest,
              status: TalkingHeadStatus.DONE, // 所有从数据库获取的视频都标记为完成状态
              width: rest.width || 480,
              height: rest.height || 640,
            }));
            return new Response(JSON.stringify({ data: videosData }), {
              status: 200,
            });
          } catch (error) {
            console.error(`[${requestId}] Error fetching videos:`, error);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch videos' }),
              { status: 500 },
            );
          }
        }

        // Handle deleteVideo
        if (jsonData.method === 'deleteVideo' && jsonData.id) {
          try {
            const results = await deleteTalkingHeadById(jsonData.id, userId);
            const deleteData = results?.map(({ user_id, ...rest }) => rest);
            return new Response(
              JSON.stringify({ success: true, data: deleteData }),
              {
                status: 200,
              },
            );
          } catch (error) {
            console.error(`[${requestId}] Error deleting video:`, error);
            return new Response(
              JSON.stringify({ error: 'Failed to delete video' }),
              { status: 500 },
            );
          }
        }
      } catch (e) {
        console.error(`[${requestId}] Error parsing JSON request:`, e);
      }
    }

    // If not handled as JSON or JSON parsing failed, try to parse as FormData
    try {
      requestData = await request.formData();
    } catch (e) {
      console.error(`[${requestId}] Error parsing FormData:`, e);
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
      });
    }

    if (!requestData) {
      console.error(`[${requestId}] No request data found`);
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
      });
    }

    // Parse request data
    const prompt = (requestData.get('prompt') as string) || '';
    const image = requestData.get('image') as string;
    const audio = requestData.get('audio') as string;
    const quality = (requestData.get('quality') as string) || 'standard';
    const modelId = (requestData.get('modelId') as string) || '';
    const resolution = (requestData.get('resolution') as string) || '540p';
    const aspectRatio = (requestData.get('aspectRatio') as string) || '16:9';
    const audioDurationStr = requestData.get('audioDuration') as string;
    const audioDuration = audioDurationStr
      ? parseInt(audioDurationStr, 10)
      : undefined;

    // Validate inputs
    if (!image) {
      console.error(`[${requestId}] No image provided`);
      return failed('No image provided');
    }

    if (!audio) {
      console.error(`[${requestId}] No audio provided`);
      return failed('Audio file must be provided');
    }

    // Calculate cost based on audio duration and resolution - using the same logic as frontend
    const durationInSeconds = audioDuration || 10; // Use detected audio duration or default to 10s
    const cost = calculateTalkingHeadCost(
      TalkingHeadQuality.HEDRA,
      resolution,
      durationInSeconds,
    );


    // Check if user has enough credits
    const credit = new CreditModel(userId);
    const hasEnoughCredits = await credit.canConsume(cost);
    if (!hasEnoughCredits) {
      console.log(
        `[${requestId}] Insufficient credits: user=${userId}, required=${cost}`,
      );
      return failed('Insufficient credits');
    }

    // 1. 创建图像资产
    const createImageAssetResponse = await fetch(`${BASE_URL}/public/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HEDRA_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'image',
        name: generateUniqueName('talking_head_image', 'png'),
      }),
    });

    if (!createImageAssetResponse.ok) {
      const errorText = await createImageAssetResponse.text();
      console.error(`[${requestId}] Image asset creation failed:`, errorText);
      throw new Error(
        `Failed to create image asset: ${createImageAssetResponse.status}, ${errorText}`,
      );
    }

    const imageAssetData: AssetCreationResponse =
      await createImageAssetResponse.json();
    const imageAssetId = imageAssetData.id;
    console.log(`[${requestId}] Image asset created with ID: ${imageAssetId}`);

    // 2. 上传图像数据
    const imageBlob = base64ToBlob(image, 'image/png');
    const imageFormData = new FormData();
    imageFormData.append(
      'file',
      imageBlob,
      generateUniqueName('talking_head_image', 'png'),
    );

    const imageUploadResponse = await fetch(
      `${BASE_URL}/public/assets/${imageAssetId}/upload`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.HEDRA_API_KEY || '',
        },
        body: imageFormData,
      },
    );

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text();
      console.error(`[${requestId}] Image upload failed:`, errorText);
      throw new Error(
        `Failed to upload image: ${imageUploadResponse.status}, ${errorText}`,
      );
    }

    // 3. 创建音频资产并上传
    const createAudioAssetResponse = await fetch(`${BASE_URL}/public/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HEDRA_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'audio',
        name: generateUniqueName('talking_head_audio', 'mp3'),
      }),
    });

    if (!createAudioAssetResponse.ok) {
      const errorText = await createAudioAssetResponse.text();
      console.error(`[${requestId}] Audio asset creation failed:`, errorText);
      throw new Error(
        `Failed to create audio asset: ${createAudioAssetResponse.status}, ${errorText}`,
      );
    }

    const audioAssetData: AssetCreationResponse =
      await createAudioAssetResponse.json();
    const audioAssetId = audioAssetData.id;

    // 上传音频数据
    const audioBlob = base64ToBlob(audio, 'audio/mpeg');
    const audioFormData = new FormData();
    audioFormData.append(
      'file',
      audioBlob,
      generateUniqueName('talking_head_audio', 'mp3'),
    );

    const audioUploadResponse = await fetch(
      `${BASE_URL}/public/assets/${audioAssetId}/upload`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.HEDRA_API_KEY || '',
        },
        body: audioFormData,
      },
    );

    if (!audioUploadResponse.ok) {
      const errorText = await audioUploadResponse.text();
      console.error(`[${requestId}] Audio upload failed:`, errorText);
      throw new Error(
        `Failed to upload audio: ${audioUploadResponse.status}, ${errorText}`,
      );
    }

    // 4. 选择模型
    let characterModel;
    if (!modelId || modelId === 'default') {
      try {
        const videoModelsResponse = await fetch(`${BASE_URL}/public/models`, {
          headers: {
            'x-api-key': process.env.HEDRA_API_KEY || '',
          },
        });

        if (!videoModelsResponse.ok) {
          throw new Error(
            `Failed to get models: ${videoModelsResponse.status}`,
          );
        }

        const videoModels = await videoModelsResponse.json();

        characterModel = videoModels.find(
          (model: any) =>
            model.name.toLowerCase().includes('character') ||
            model.description?.toLowerCase().includes('talking head'),
        );

        if (!characterModel) {
          characterModel = videoModels.find(
            (model: any) =>
              model.type === 'video' && model.requires_audio_input === true,
          );
        }

        if (!characterModel) {
          throw new Error('No suitable model found');
        }
      } catch (error) {
        console.error(`[${requestId}] Error fetching models:`, error);
        characterModel = {
          id: 'd1dd37a3-e39a-4854-a298-6510289f9cf2',
          name: 'Hedra Character 3',
        };
      }
    } else {
      characterModel = { id: modelId };
    }

    // 5. 创建视频生成请求
    const generationData: any = {
      type: 'video',
      ai_model_id: characterModel.id,
      start_keyframe_id: imageAssetId,
      audio_id: audioAssetId,
      generated_video_inputs: {
        text_prompt: prompt || '',
        resolution: resolution,
        aspect_ratio: aspectRatio,
      },
    };

    // 使用重试逻辑发送生成请求
    let generationResponse;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        generationResponse = await fetch(`${BASE_URL}/public/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.HEDRA_API_KEY || '',
          },
          body: JSON.stringify(generationData),
        });

        if (generationResponse.ok) {
          break;
        }

        const errorText = await generationResponse.text();
        console.error(
          `[${requestId}] Generation request failed (attempt ${retryCount + 1}/${maxRetries}):`,
          errorText,
        );

        // 特殊错误处理
        if (errorText.includes('without valid audio input')) {
          // 修改请求格式，尝试不同的参数组合
          if (retryCount === 0) {
            delete generationData.audio_id;
          } else if (retryCount === 1) {
            try {
              const fallbackModelsResponse = await fetch(
                `${BASE_URL}/public/models`,
                {
                  headers: {
                    'x-api-key': process.env.HEDRA_API_KEY || '',
                  },
                },
              );

              if (fallbackModelsResponse.ok) {
                const allModels = await fallbackModelsResponse.json();
                const fallbackModel = allModels[0];
                if (fallbackModel && fallbackModel.id !== characterModel.id) {
                  generationData.ai_model_id = fallbackModel.id;
                }
              }
            } catch (error) {
              console.error(
                `[${requestId}] Failed to get fallback models:`,
                error,
              );
            }
          }
        }

        retryCount++;
        if (retryCount < maxRetries) {
          const delayMs = 1000 * 2 ** retryCount;
          console.log(`[${requestId}] Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(
          `[${requestId}] Generation request network error:`,
          error,
        );
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(
            `[${requestId}] Retrying after network error in 2000ms...`,
          );
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!generationResponse || !generationResponse.ok) {
      console.error(`[${requestId}] All generation attempts failed`);
      throw new Error(
        `Failed to create generation after ${maxRetries} attempts`,
      );
    }

    const generationResult: GenerationResponse =
      await generationResponse.json();
    const generationId = generationResult.id;

    // 保存到映射表，用于后续状态轮询，包含保留的积分数量
    await createPredictionMapping({
      prediction_id: generationId,
      video_url: '', // 暂时为空，轮询完成后会更新
      user_id: userId,
      reserved_credits: cost,
      meta_data: { resolution, aspectRatio, audioDuration, modelId, prompt },
    });

    // 返回 prediction ID，让前端开始轮询
    return new Response(
      JSON.stringify({
        id: generationId,
        status: 'processing',
        message: 'Generation started successfully',
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error(`[${requestId}] Error in talking head generation:`, error);
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      'Failed to generate talking head video';
    return failed(errorMessage);
  }
} 
