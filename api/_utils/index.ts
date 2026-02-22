/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { serverUrl, TaskType, imageIndex } from '../tools/_constants.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import User from '../_models/User.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getHistoryImageUrl = async (
  prompt_id: string,
  type: string,
): Promise<{ url: string; error: string }> => {
  const url = `${serverUrl}/history/${prompt_id}`;
  const response = await fetch(url);
  try {
    const data = await response.json();
    console.log('data', data, prompt_id);
    if (data?.[prompt_id]?.status?.status_str === 'error') {
      return { url: '', error: data[prompt_id].status.status_str };
    }
    if (data?.[prompt_id]?.outputs?.[imageIndex[type]]) {
      return {
        url:
          data[prompt_id].outputs[imageIndex[type]]?.['images']?.[0]?.[
            'filename'
          ] ?? '',
        error: '',
      };
    }
    return { url: '', error: '' };
  } catch (e) {
    console.error(e);
    return { url: '', error: '' };
  }
};

export const success = <T>(data: T) => {
  return new Response(JSON.stringify({ code: 1, message: 'success', data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const failed = (message: string, data?: any) => {
  return new Response(
    JSON.stringify({ code: 0, message, error: message, data }),
    { status: 200 },
  );
};
export const failedWithCode = (code: number, message: string, data?: any) => {
  return new Response(
    JSON.stringify({
      code: 0,
      message,
      error: message,
      data,
      error_code: code,
    }),
    { status: 200 },
  );
};

export const unauthorized = (message: string = 'Unauthorized') =>
  new Response(JSON.stringify({ error: message }), { status: 401 });

export const createSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

type HistoryResult = { prompt_id: string; filename: string; error?: string };
export const pollingHistory = (
  prompt_id: string,
  type: TaskType,
  timeout: number = 1000 * 60 * 3,
): Promise<HistoryResult> => {
  let running = true;
  let resolveHistory: (value: HistoryResult) => void;
  const historyPromise = new Promise<HistoryResult>((resolve, reject) => {
    resolveHistory = resolve;

    const fetchImage = async () => {
      try {
        const { url: imageUrl, error } = await getHistoryImageUrl(
          prompt_id,
          type,
        );
        if (error) {
          running = false;
          resolve({ prompt_id, filename: '', error: 'generate image failed' });
          return;
        }
        if (imageUrl) {
          running = false;
          resolve({ prompt_id, filename: imageUrl });
        }
      } catch (error) {
        console.error('Fetch image failed', error);
        resolve({ prompt_id, filename: '', error: 'Fetch image failed' });
        running = false;
      }
    };

    const perform = () => {
      if (!running) {
        return;
      }
      fetchImage();
      setTimeout(() => {
        perform();
      }, 3000);
    };

    perform();
  });

  return Promise.race<HistoryResult>([
    historyPromise,
    new Promise(resolve => {
      setTimeout(() => {
        resolve({ prompt_id, filename: '', error: 'generate image timeout' });
        resolveHistory({
          prompt_id,
          filename: '',
          error: 'generate image timeout',
        });
        console.error('generate image timeout', prompt_id);
      }, timeout);
    }),
  ]);
};

const fetchGoogleResult = async (op_name: string) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${BASE_URL}/${op_name}?key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    return { error: 'Failed to fetch google result' };
  }
  const data = await response.json();
  console.log('data', data);
  return data;
};
interface GoogleResult {
  error?: string;
  response?: {
    generateVideoResponse: {
      generatedSamples: {
        video: {
          uri: string;
        };
      }[];
    };
  };
}
export const pollingGoogle = (
  op_name: string,
  timeout: number = 1000 * 60 * 3,
): Promise<GoogleResult> => {
  let running = true;
  let resolvePolling: (value: GoogleResult) => void;
  const pollingPromise = new Promise<any>((resolve, reject) => {
    resolvePolling = resolve;

    const fetchResult = async () => {
      try {
        const data = await fetchGoogleResult(op_name);
        if (data.error) {
          running = false;
          resolve({ error: data.error });
          return;
        }
        if (data.response) {
          running = false;
          resolve(data.response);
          return;
        }
        // If no response yet, continue polling
      } catch (error) {
        console.error('Fetch Google result failed', error);
        resolve({ error: 'Fetch Google result failed' });
        running = false;
      }
    };

    const perform = () => {
      if (!running) {
        return;
      }
      fetchResult();
      setTimeout(() => {
        perform();
      }, 5000); // Poll every 5 seconds
    };

    perform();
  });

  return Promise.race([
    pollingPromise,
    new Promise(resolve => {
      setTimeout(() => {
        running = false;
        resolvePolling({ error: 'Operation timeout' });
        console.error('Google operation timeout', op_name);
        resolve({ error: 'Operation timeout' });
      }, timeout);
    }),
  ]);
};

export async function dataURLToBlob(dataURL: string) {
  if (/^https?:/.test(dataURL)) {
    const response = await fetch(dataURL);
    const blob = await response.blob();
    return blob;
  }
  const [header, data] = dataURL.split(',');
  const contentType = header!.match(/:(.*?);/)![1];
  const byteCharacters = Buffer.from(data, 'base64');

  const blob = new Blob([byteCharacters], { type: contentType });
  return blob;
}

export async function uploadImage(imagePath: string, imageUri: string) {
  const supabase = createSupabase();
  // let imagePath = `image_generation/${userId}/${(new Date()).toISOString().split('T')[0]}-${uuidv4()}.webp`;
  let blob = await dataURLToBlob(imageUri);
  const supaResult = await supabase.storage
    .from('husbando-land')
    .upload(imagePath, blob);
  if (!supaResult.error) {
    const imageUrl = supabase.storage
      .from('husbando-land')
      .getPublicUrl(imagePath).data.publicUrl;
    // imageUrls.push(imageUrl);
    // imageUrlPath = imageUrl.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`, "");
    return imageUrl;
  }
}

export const fetchGemini = async (prompt: string, images?: string[]) => {
  const API_KEY = process.env.GEMINI_API_KEY!;
  // const API_KEY = Math.random() > 0.5 ? 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE' : 'AIzaSyDc17N7ac38TCa6ILQrYkhRTOl2S6mpWh4'
  const genAI = new GoogleGenerativeAI(API_KEY);
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  // result.response.candidates![0].finishReason
  // result.response.candidates![0].content.parts
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig,
  });
  const result = await model.generateContent(prompt);
  return result.response;
};

export const fetchGeminiNano = async (
  prompt: string,
  aspectRatio?: string,
  modelVersion:
    | 'gemini-2.5-flash-image'
    | 'gemini-3-pro-image-preview' = 'gemini-2.5-flash-image',
  imageSize?: '1K' | '2K' | '4K',
) => {
  const API_KEY = process.env.GEMINI_API_KEY!;
  // const API_KEY = Math.random() > 0.5 ? 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE' : 'AIzaSyDc17N7ac38TCa6ILQrYkhRTOl2S6mpWh4'
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  const imageConfig: { aspectRatio?: string; imageSize?: string } = {
    aspectRatio,
  };
  if (modelVersion === 'gemini-3-pro-image-preview' && imageSize) {
    imageConfig.imageSize = imageSize;
  }

  const response = await ai.models.generateContent({
    model: modelVersion,
    contents: [{ text: prompt }],
    config: {
      imageConfig,
      ...generationConfig,
    },
  });

  // result.response.candidates![0].finishReason
  // result.response.candidates![0].content.parts
  // const model = genAI.getGenerativeModel({
  //   model: 'gemini-2.5-flash-image',
  //   generationConfig,
  // });
  // const result = await model.generateContent(prompt);
  // return result.response;
  return response;
};

/**
 * 使用 Gemini 图片编辑 API 基于参考图片生成新图片
 * @param prompt - 文本 prompt，描述如何编辑/生成图片
 * @param referenceImageUrl - 参考图片 URL
 * @param aspectRatio - 输出图片比例（可选）
 * @returns 与 fetchGeminiNano 相同的 response 结构
 */
export const fetchGeminiImageEdit = async (
  prompt: string,
  referenceImageUrl: string,
  aspectRatio?: string,
) => {
  const API_KEY = process.env.GEMINI_API_KEY!;
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  // 将参考图片 URL 转为 base64
  const imageResponse = await fetch(referenceImageUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to fetch reference image: ${imageResponse.statusText}`,
    );
  }

  // 检查图片大小，防止下载过大文件（限制 20MB）
  const contentLength = imageResponse.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) {
    throw new Error('Reference image too large (max 20MB)');
  }

  const imageArrayBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');

  // 从 content-type 获取 MIME type，默认为 image/jpeg
  const contentType =
    imageResponse.headers.get('content-type')?.split(';')[0]?.trim() ||
    'image/jpeg';

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  const imageConfig: { aspectRatio?: string } = {};
  if (aspectRatio) {
    imageConfig.aspectRatio = aspectRatio;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: contentType,
          data: imageBase64,
        },
      },
    ],
    config: {
      imageConfig,
      ...generationConfig,
    },
  });

  return response;
};

export const fetchGeminiNew = async (
  prompt: string,
  images?: string[],
): Promise<string> => {
  fal.config({
    credentials: process.env.fal_api_key,
  });
  const result = await fal.subscribe('fal-ai/gemini-flash-edit/multi', {
    input: {
      prompt,
      input_image_urls: images || [],
    },
    logs: true,
    onQueueUpdate: update => {
      if (update.status === 'IN_PROGRESS') {
        update.logs.map(log => log.message).forEach(console.log);
      }
    },
  });

  return result?.data?.image?.url || '';
};

export async function getAuthUserId(request: Request): Promise<string | null> {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (!sessionToken) {
    return null;
  }

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return null;
    }
    return token.id as string;
  } catch (error) {
    console.error('Error decoding session token:', error);
    return null;
  }
}

export function hasError(
  err: any,
): err is { error: string; error_code?: number } {
  if ((err as any)?.error) {
    return true;
  }
  return false;
}

export const canGenerate = async ({
  userId,
  tool,
  model,
}: {
  userId: string;
  tool?: string;
  model?: string;
}) => {
  const supabase = createSupabase();
  const rpcName =
    process.env.NODE_ENV === 'development'
      ? 'try_generate_image_test'
      : 'try_generate_image';
  const { data, error } = await supabase.rpc(rpcName, {
    p_user_id: userId,
    p_tools: tool,
    p_model: model,
  });
  if (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
  return data as boolean;
};

export type MiddlewareResult = {
  success: boolean;
  response?: Response;
};

export type MiddlewareFunc = (request: Request) => Promise<MiddlewareResult>;

export const getUserId = (request: Request) => {
  return request.headers.get('x-user-id');
};

export const setToolModel = ({
  request,
  tool,
  model,
}: {
  request: Request;
  tool: string;
  model: string;
}) => {
  request.headers.set('x-generation-tool', tool);
  request.headers.set('x-generation-model', model);
};

// Helper function to detect file type from content type or file extension
export function getFileTypeCategory(
  contentType?: string,
  filename?: string,
): 'image' | 'video' | 'unknown' {
  if (contentType) {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
  }

  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || ''))
      return 'image';
    if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv'].includes(ext || ''))
      return 'video';
  }

  return 'unknown';
}

// Helper function to generate file path based on type
export function generateFilePath(
  userId: string,
  fileType: 'image' | 'video',
  filename?: string,
): string {
  const timestamp = Date.now();
  const date = new Date().toISOString().split('T')[0];

  if (fileType === 'image') {
    const extension = filename ? filename.split('.').pop() : 'webp';
    return `image_generation/${userId}/${date}-${timestamp}.${extension}`;
  } else if (fileType === 'video') {
    const extension = filename ? filename.split('.').pop() : 'mp4';
    return `app_videos/${userId}/${date}-${timestamp}.${extension}`;
  }

  return `uploads/${userId}/${date}-${timestamp}`;
}

export async function uploadMediaFromUrl(
  url: string,
  userId: string,
  noWatermark: boolean = false,
  customPath?: string,
) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from URL: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let arrayBuffer = await response.arrayBuffer();

    // Extract filename from URL if available
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split('/').pop() || undefined;

    // Generate appropriate file path if not provided
    let filePath = customPath;
    const fileType = getFileTypeCategory(contentType || undefined, filename);
    if (!filePath) {
      if (fileType === 'unknown') {
        // Default to image if type is unknown
        filePath = generateFilePath(userId, 'image', filename);
      }
      filePath = generateFilePath(
        userId,
        fileType as 'image' | 'video',
        filename,
      );
    }

    if (fileType === 'image' && !noWatermark) {
      const user = new User(userId);

      // 检查用户是否为订阅用户
      const isSubscribed = await user.isSubscribed();

      // console.log('isSubscribed', isSubscribed);
      // 如果不是订阅用户，添加水印
      // console.log('noWatermark', noWatermark);
      if (!isSubscribed) {
        const imageBuffer = Buffer.from(arrayBuffer);
        const watermarkedImageBuffer = await addWatermark(imageBuffer);
        arrayBuffer = Buffer.from(watermarkedImageBuffer).buffer;
      }
    }

    const blob = new Blob([arrayBuffer], { type: contentType || undefined });
    return await uploadMedia(filePath, blob);
  } catch (error) {
    console.error('Error uploading media from URL:', error);
    return null;
  }
}

export async function uploadMedia(
  filePath: string,
  mediaData: Blob | File | string,
) {
  const supabase = createSupabase();
  try {
    let blob: Blob;

    if (typeof mediaData === 'string') {
      // Check if it's a data URL or regular URL
      if (mediaData.startsWith('data:')) {
        // Handle data URL
        blob = await dataURLToBlob(mediaData);
      } else if (
        mediaData.startsWith('http://') ||
        mediaData.startsWith('https://')
      ) {
        // Handle regular URL - fetch the content
        const response = await fetch(mediaData);
        if (!response.ok) {
          throw new Error(`Failed to fetch from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type');
        blob = new Blob([arrayBuffer], { type: contentType || undefined });
      } else {
        throw new Error(
          'Invalid string format: must be data URL or HTTP/HTTPS URL',
        );
      }
    } else if (mediaData instanceof File || mediaData instanceof Blob) {
      blob = mediaData;
    } else {
      throw new Error('Invalid media data format');
    }

    const supaResult = await supabase.storage
      .from('husbando-land')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (supaResult.error) {
      console.error('Error uploading to Supabase:', supaResult.error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('husbando-land').getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    return null;
  }
}

export async function deleteMediaFromStorage(
  filePath: string | string[],
): Promise<{ success: boolean; error?: string; deletedFiles?: string[] }> {
  const supabase = createSupabase();

  try {
    const filePaths = Array.isArray(filePath) ? filePath : [filePath];

    const { data, error } = await supabase.storage
      .from('husbando-land')
      .remove(filePaths);

    if (error) {
      console.error('Error deleting files from Supabase storage:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully deleted files:', filePaths);
    return {
      success: true,
      deletedFiles: filePaths,
    };
  } catch (error) {
    console.error('Error in deleteMediaFromStorage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteMediaByUrl(
  publicUrl: string | string[],
): Promise<{ success: boolean; error?: string; deletedFiles?: string[] }> {
  try {
    const urls = Array.isArray(publicUrl) ? publicUrl : [publicUrl];
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/`;

    // Extract file paths from public URLs
    const filePaths = urls.map(url => {
      if (url.startsWith(baseUrl)) {
        return url.replace(baseUrl, '');
      }
      throw new Error(`Invalid URL format: ${url}`);
    });

    return await deleteMediaFromStorage(filePaths);
  } catch (error) {
    console.error('Error in deleteMediaByUrl:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid URL format',
    };
  }
}

export async function cleanupUserMedia(
  userId: string,
  mediaType?: 'image' | 'video',
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  const supabase = createSupabase();

  try {
    let folderPaths: string[] = [];

    if (!mediaType || mediaType === 'image') {
      folderPaths.push(`image_generation/${userId}/`);
    }
    if (!mediaType || mediaType === 'video') {
      folderPaths.push(`app_videos/${userId}/`);
    }

    let totalDeleted = 0;
    const errors: string[] = [];

    for (const folderPath of folderPaths) {
      try {
        // List all files in the folder
        const { data: files, error: listError } = await supabase.storage
          .from('husbando-land')
          .list(folderPath);

        if (listError) {
          errors.push(
            `Error listing files in ${folderPath}: ${listError.message}`,
          );
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${folderPath}${file.name}`);

          const { data, error: deleteError } = await supabase.storage
            .from('husbando-land')
            .remove(filePaths);

          if (deleteError) {
            errors.push(
              `Error deleting files in ${folderPath}: ${deleteError.message}`,
            );
          } else {
            totalDeleted += filePaths.length;
          }
        }
      } catch (folderError) {
        errors.push(`Error processing folder ${folderPath}: ${folderError}`);
      }
    }

    if (errors.length > 0) {
      console.error('Cleanup errors:', errors);
      return {
        success: false,
        error: errors.join('; '),
        deletedCount: totalDeleted,
      };
    }

    console.log(
      `Successfully cleaned up ${totalDeleted} files for user ${userId}`,
    );
    return {
      success: true,
      deletedCount: totalDeleted,
    };
  } catch (error) {
    console.error('Error in cleanupUserMedia:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function replaceAll(str: string, search: string, replace: string) {
  while (str.includes(search)) {
    str = str.replace(search, replace);
  }
  return str;
}

export function replaceCharacterId(prompt: string) {
  const namePlaceholders = [
    'Alex',
    'Blair',
    'Caleb',
    'Dylan',
    'Ethan',
    'Finn',
    'George',
    'Henry',
    'Isaac',
  ];
  const placeholders = namePlaceholders.slice();
  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const matched = prompt.match(reg);
  let finalPrompt = prompt;
  if (matched) {
    const uniqIds = [...new Set(matched)];
    uniqIds.forEach((uniqId, index) => {
      finalPrompt = replaceAll(finalPrompt, uniqId, placeholders[index]);
    });
  }
  return finalPrompt;
}

/**
 * 给图片添加水印
 * @param imageBuffer 图片buffer
 * @returns Promise<Buffer> 添加水印后的图片buffer
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const watermarkPath = path.join(__dirname, 'watermark_3.webp');
    const watermarkBuffer = await sharp(watermarkPath).webp().toBuffer();

    // 获取原图尺寸
    const imageMetadata = await sharp(imageBuffer).metadata();
    const watermarkMetadata = await sharp(watermarkBuffer).metadata();

    if (
      !imageMetadata.width ||
      !imageMetadata.height ||
      !watermarkMetadata.width ||
      !watermarkMetadata.height
    ) {
      throw new Error('Failed to get image dimensions');
    }

    // 计算水印位置（右下角）
    const watermarkWidth = Math.min(
      watermarkMetadata.width,
      (imageMetadata.width * 0.3) | 0,
    );
    const watermarkHeight =
      ((watermarkWidth / watermarkMetadata.width) * watermarkMetadata.height) |
      0;
    const watermarkX = imageMetadata.width - watermarkWidth - 20;
    const watermarkY = imageMetadata.height - watermarkHeight - 20;

    // 调整水印大小
    const resizedWatermark = await sharp(watermarkBuffer)
      .resize(watermarkWidth, watermarkHeight)
      .webp()
      .toBuffer();

    // 合成图片
    const baseImage = sharp(imageBuffer).composite([
      {
        input: resizedWatermark,
        top: watermarkY,
        left: watermarkX,
      },
    ]);
    const outputFormat = imageMetadata.format;
    let result: Buffer;
    if (outputFormat === 'webp') {
      result = await baseImage.webp({ lossless: true }).toBuffer();
    } else if (outputFormat === 'avif') {
      result = await baseImage.avif({ lossless: true }).toBuffer();
    } else if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      result = await baseImage
        .jpeg({
          quality: 100,
          chromaSubsampling: '4:4:4',
          mozjpeg: false,
          trellisQuantisation: false,
          overshootDeringing: false,
          optimiseScans: false,
          optimiseCoding: false,
          progressive: false,
        })
        .toBuffer();
    } else if (outputFormat) {
      result = await baseImage.toFormat(outputFormat).toBuffer();
    } else {
      result = await baseImage.toBuffer();
    }

    return result;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // 如果添加水印失败，返回原图
    return imageBuffer;
  }
}

/**
 * 转存图片到Supabase存储
 * @param imageUrl 图片URL
 * @param userId 用户ID
 * @param customPath 自定义路径（可选）
 * @returns Promise<{imageUrl: string, imageUrlPath: string}> 转存结果
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  userId: string,
  customPath?: string,
  noWatermark: boolean = false,
): Promise<string> {
  const supabase = createSupabase();
  // const user = new User(userId);

  try {
    // 获取图片blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentTypeHeader = response.headers.get('content-type');
    const contentType = contentTypeHeader?.split(';')[0]?.trim();
    const arrayBuffer = await response.arrayBuffer();
    let imageBuffer = Buffer.from(arrayBuffer as any);
    if (!noWatermark) {
      const user = new User(userId);

      // 检查用户是否为订阅用户
      const isSubscribed = await user.isSubscribed();

      // console.log('isSubscribed', isSubscribed);
      // 如果不是订阅用户，添加水印
      // console.log('noWatermark', noWatermark);
      if (!isSubscribed) {
        imageBuffer = await addWatermark(imageBuffer);
      }
    }

    const outputMetadata = await sharp(imageBuffer).metadata();
    const outputFormat = outputMetadata.format;
    const formatToMime: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
      tiff: 'image/tiff',
      heif: 'image/heif',
      heic: 'image/heic',
    };
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'image/tiff': 'tiff',
      'image/heif': 'heif',
      'image/heic': 'heic',
    };
    const resolvedContentType =
      (outputFormat ? formatToMime[outputFormat] : undefined) ||
      contentType ||
      'application/octet-stream';
    const resolvedExt =
      (outputFormat && (outputFormat === 'jpeg' ? 'jpg' : outputFormat)) ||
      (contentType ? mimeToExt[contentType] : undefined) ||
      'bin';

    // 生成文件路径
    const imagePath =
      customPath ||
      `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${randomUUID()}.${resolvedExt}`;

    // 上传到Supabase
    const supaResult = await supabase.storage
      .from('husbando-land')
      .upload(imagePath, imageBuffer, {
        contentType: resolvedContentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (supaResult.error) {
      throw new Error(
        `Failed to upload to Supabase: ${supaResult.error.message}`,
      );
    }

    // 获取公开URL
    const publicUrl = supabase.storage
      .from('husbando-land')
      .getPublicUrl(imagePath).data.publicUrl;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

export const isUserSubscribed = async (userId: string) => {
  const supabase = createSupabase();
  const now = (Date.now() / 1000) | 0;
  const { data, error } = await supabase
    .from(
      process.env.NODE_ENV === 'production'
        ? 'Subscriptions'
        : 'Subscriptions_test',
    )
    .select('user_id, expires, period_expires, plan_code')
    .eq('user_id', userId)
    .gt('expires', now)
    .gt('period_expires', now);
  if (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
  return data && data.length > 0;
};

export const getImageSize = async (
  url: string,
): Promise<{ width: number; height: number } | null> => {
  try {
    // 如果是 data URL，直接处理
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    }

    // 如果是 HTTP URL，先下载
    if (url.startsWith('http')) {
      url = url + '?t=' + Date.now();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    }

    // 如果是本地文件路径
    const metadata = await sharp(url).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error getting image size:', error);
    return null;
  }
};

export const grok = async (input: {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
}) => {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPEN_ROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://komiko.app', // Optional. Site URL for rankings on openrouter.ai.
      'X-Title': 'KomikoAI', // Optional. Site title for rankings on openrouter.ai.
    },
    // apiKey: process.env.OPENAI_API_KEY,
  });
  const completion = await openai.chat.completions.create({
    model: 'x-ai/grok-4.1-fast',
    // model: 'chatgpt-4o-latest',
    messages: input.messages,
  });
  return completion;
};
