import { createClient } from '@supabase/supabase-js';
import {
  getPredictionMapping,
  deletePredictionMapping,
  createTalkingHeadGeneration,
  releaseReservedCredits,
  deductReservedCredits,
} from './talking-head.js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

//  API base URL
const BASE_URL = 'https://api.hedra.com/web-app';

// Hedra API 响应接口定义
interface GenerationStatusResponse {
  id: string; // uuid
  asset_id: string; // uuid
  type: 'image' | 'audio' | 'video' | 'voice';
  status: 'complete' | 'error' | 'processing' | 'finalizing' | 'queued' | 'pending';
  progress: number; // 0-1
  created_at: string; // ISO date-time
  error_message?: string | null;
  url?: string | null;
}

interface MetaData {
  resolution: string;
  aspectRatio: string;
  audioDuration: number;
  modelId: string;
  prompt: string;
}
/**
 * 将 Hedra 视频转存到 Supabase 存储
 * @param hedraVideoUrl Hedra 提供的视频 URL
 * @param userId 用户 ID
 * @returns Supabase 存储的视频 URL
 */
async function migrateVideoToSupabase(
  hedraVideoUrl: string,
  userId: string,
): Promise<string> {
  // 如果已经是 Supabase 的 URL，直接返回
  if (!hedraVideoUrl || hedraVideoUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
    return hedraVideoUrl;
  }

  try {
    console.log(`[migrateVideoToSupabase] Starting migration for user ${userId}: ${hedraVideoUrl}`);

    // 获取视频文件
    const response = await fetch(hedraVideoUrl);
    if (!response.ok) {
      console.error(`[migrateVideoToSupabase] Failed to fetch video from Hedra: ${response.status}`);
      return hedraVideoUrl; // 返回原始 URL 作为备用
    }

    const blob = await response.blob();
    const videoPath = `talking-head-videos/${userId}/${uuidv4()}.mp4`;
    const file = new File([blob], videoPath, { type: 'video/mp4' });

    console.log(`[migrateVideoToSupabase] Uploading video to Supabase path: ${videoPath}`);

    // 上传到 Supabase
    const { error } = await supabase.storage
      .from('husbando-land')
      .upload(videoPath, file, {
        cacheControl: '604800', // 7天缓存 (7 * 24 * 60 * 60 = 604800秒)
        contentType: 'video/mp4',
      });

    if (error) {
      console.error(`[migrateVideoToSupabase] Failed to upload video to Supabase:`, error);
      return hedraVideoUrl; // 返回原始 URL 作为备用
    }

    // 获取公共 URL
    const { data } = await supabase.storage
      .from('husbando-land')
      .getPublicUrl(videoPath);

    const supabaseUrl = data?.publicUrl;
    if (supabaseUrl) {
      console.log(`[migrateVideoToSupabase] Video successfully migrated: ${hedraVideoUrl} -> ${supabaseUrl}`);
      return supabaseUrl;
    } else {
      console.error(`[migrateVideoToSupabase] Failed to get public URL from Supabase`);
      return hedraVideoUrl; // 返回原始 URL 作为备用
    }
  } catch (error) {
    console.error(`[migrateVideoToSupabase] Error migrating video:`, error);
    return hedraVideoUrl; // 返回原始 URL 作为备用
  }
}

// Extract progress information from Hedra status
function extractProgressFromStatus(
  status: string,
  statusData?: any,
): { progress: number; currentStep: string } {
  // 优先使用 Hedra 返回的真实进度值，处理多种可能的格式
  let progress = 0;
  if (statusData?.progress !== undefined && statusData.progress !== null) {
    const rawProgress = Number(statusData.progress);
    console.log(`[extractProgressFromStatus] Raw progress value: ${rawProgress}, type: ${typeof statusData.progress}`);

    if (!isNaN(rawProgress)) {
      if (rawProgress >= 0 && rawProgress <= 1) {
        // 0-1 格式，转换为百分比
        progress = Math.min(Math.round(rawProgress * 100), 100);
      } else {
        // 负值或其他异常值
        progress = 0;
        console.log(`[extractProgressFromStatus] Invalid value, using 0: ${rawProgress} -> ${progress}%`);
      }
    } else {
      console.log(`[extractProgressFromStatus] NaN progress value: ${statusData.progress}`);
    }
  } else {
    console.log(`[extractProgressFromStatus] No progress value in statusData`);
  }

  // 根据状态确定进度和步骤
  switch (status) {
    case 'pending':
    case 'queued':
      return {
        progress: Math.max(progress, 5), // 确保至少显示5%
        currentStep: 'Queued for processing...',
      };
    case 'processing':
      return {
        progress: Math.max(progress, 10), // 处理中至少显示10%
        currentStep: progress > 0
          ? `Generating talking head video... (${progress}%)`
          : 'Generating talking head video...',
      };
    case 'finalizing':
      return {
        progress: Math.max(progress, 90), // 最终化至少显示90%
        currentStep: progress > 0
          ? `Finalizing video... (${progress}%)`
          : 'Finalizing video...',
      };
    case 'complete':
      return { progress: 100, currentStep: 'Completed!' };
    case 'error':
      return { progress: 0, currentStep: 'Failed' };
    default:
      return {
        progress: Math.max(progress, 5), // 默认至少显示5%
        currentStep: progress > 0
          ? `Processing... (${progress}%)`
          : 'Processing...',
      };
  }
}

// 从响应中提取视频 URL
function extractVideoUrl(statusData: GenerationStatusResponse): string | null {
  return statusData.url || null;
}

// 将视频保存到数据库
async function saveToDatabase(
  userId: string,
  videoUrl: string,
  promptText: string = '',
  metaData: any = {},
) {
  const results = await createTalkingHeadGeneration({
    video_url: videoUrl,
    tool: 'talking-head',
    user_id: userId,
    prompt: promptText,
    meta_data: metaData,
  });

  if (!results) {
    const error = new Error(
      'Failed to save video to database: createTalkingHeadGeneration returned null/undefined',
    );
    console.error('Error saving video to database:', error);
    throw error;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
      });
    }

    console.log(`[${id}] Checking status for Hedra generation`);
    
    // Track warnings for partial failures that don't prevent success
    const warnings: string[] = [];

    // 检查 Hedra 生成状态
    const response = await fetch(
      `${BASE_URL}/public/generations/${id}/status`,
      {
        headers: {
          'x-api-key': process.env.HEDRA_API_KEY || '',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${id}] Failed to check generation status:`, errorText);
      return new Response(
        JSON.stringify({
          error: `Failed to check generation status: ${response.status}`,
        }),
        { status: 500 },
      );
    }

    const statusData: GenerationStatusResponse = await response.json();

    // 详细记录原始响应用于调试
    // console.log(
    //   `[${id}] Raw Hedra response:`,
    //   JSON.stringify(statusData, null, 2),
    // );
    // console.log(`[${id}] Status: ${statusData.status}`);

    // Extract progress information from status
    let progressInfo = extractProgressFromStatus(statusData.status, statusData);

    // 尝试提取视频 URL
    let videoUrl = extractVideoUrl(statusData);

    // Handle completed status
    if (statusData.status === 'complete') {
      if (videoUrl) {
        // 获取映射信息以保存到数据库
        const mapping = await getPredictionMapping(id);
        if (mapping) {

          // 将 Hedra 视频转存到 Supabase 存储
          let finalVideoUrl = videoUrl;
          try {
            finalVideoUrl = await migrateVideoToSupabase(videoUrl, mapping.user_id);
          } catch (error) {
            const errorMsg = `Failed to migrate video to Supabase: ${error instanceof Error ? error.message : error}`;
            console.error(`[${id}] Failed to migrate video to Supabase:`, error);
            warnings.push(errorMsg);
            // Continue with original URL if migration fails
            finalVideoUrl = videoUrl;
          }

          let prompt = '';
          let metaData : MetaData = {
            resolution: '',
            aspectRatio: '',
            audioDuration: 0,
            modelId: '',
            prompt: '',
          };
          if (mapping.meta_data) {
            metaData = JSON.parse(mapping.meta_data) as MetaData;
          }
          prompt = metaData?.prompt || '';

          try {
            await saveToDatabase(
              mapping.user_id,
              finalVideoUrl,
              prompt,
              metaData,
            );
          } catch (error) {
            const errorMsg = `Failed to save video to database: ${error instanceof Error ? error.message : error}`;
            console.error(`[${id}] Failed to save video to database:`, error);
            warnings.push(errorMsg);
            // Continue with credit deduction even if database save fails
          }

          // 扣除保留的积分
          console.log(`[${id}] Deducting reserved credits for successful generation`);
          const creditDeducted = await deductReservedCredits(id);
          if (!creditDeducted) {
            const errorMsg = 'Failed to deduct reserved credits after successful generation';
            console.error(`[${id}] ${errorMsg}`);
            warnings.push(errorMsg);
          }

          // 更新映射表中的视频 URL（使用转存后的 Supabase URL）
          const { error } = await supabase
            .from('PredictionVideoMapping')
            .update({ video_url: finalVideoUrl })
            .eq('prediction_id', id);

          if (error) {
            const errorMsg = `Failed to update prediction mapping: ${error.message || error}`;
            console.error(`[${id}] Error updating prediction mapping:`, error);
            warnings.push(errorMsg);
          } 

          // 更新 videoUrl 为转存后的 Supabase URL，以便返回给前端
          videoUrl = finalVideoUrl;
        }

        progressInfo = { progress: 100, currentStep: 'Completed!' };
      } else {
        // 检查是否有错误信息
        if (statusData.error_message) {
          console.error(`[${id}] Generation completed with error: ${statusData.error_message}`);
          
          // 释放保留的积分由于生成错误
          console.log(`[${id}] Releasing reserved credits due to generation error`);
          const creditsReleased = await releaseReservedCredits(id);
          if (!creditsReleased) {
            console.error(`[${id}] Failed to release reserved credits after generation error`);
          }
          
          progressInfo = {
            progress: 0,
            currentStep: `Error: ${statusData.error_message}`,
          };
        } else {
          // 继续等待，可能视频还在上传或处理中
          progressInfo = {
            progress: 95,
            currentStep: 'Finalizing video output...',
          };
        }
      }
    } else if (statusData.status === 'error') {
      const errorMsg = statusData.error_message || 'Generation failed';

      console.error(`[${id}] Generation failed: ${errorMsg}`);

      const creditsReleased = await releaseReservedCredits(id);
      if (!creditsReleased) {
        console.error(`[${id}] Failed to release reserved credits after generation failure`);
      }
      
      progressInfo = {
        progress: 0,
        currentStep: `Failed: ${errorMsg}`,
      };
    }

    // Return clean response
    const finalProgress = Math.max(0, Math.min(100, progressInfo.progress));
    const responseData = {
      status: statusData.status,
      output: videoUrl || null,
      error: statusData.error_message || null,
      // Include processed progress information
      progress: finalProgress, // 确保进度在0-100范围内
      currentStep: progressInfo.currentStep,
      // 添加原始进度值用于调试
      rawProgress: statusData.progress,
      // Include warnings for partial failures
      ...(warnings.length > 0 && { warnings }),
    };

    return new Response(JSON.stringify(responseData), { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch generation status:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Failed to fetch generation status',
      }),
      { status: 500 },
    );
  }
}
