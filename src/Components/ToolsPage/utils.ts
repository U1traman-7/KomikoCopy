/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-09 22:00:37
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-09 22:01:02
 * @FilePath: /ComicEditor/src/Components/ToolsPage/utils.ts
 * @Description:
 */
import { v4 as uuidv4 } from 'uuid';

import { isImageValid, isVideoValid, uploadFile } from '@/utils/index';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

// 生成极简文件名
export const generateShortFileName = (extension: string): string => {
  // 使用4位base62字符串
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let shortId = '';
  for (let i = 0; i < 4; i++) {
    shortId += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${shortId}.${extension}`;
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

export enum GenerationStatus {
  GENERATING = 1,
  DONE = 0,
}
interface MediaData {
  status?: GenerationStatus;
  duration?: number;
  id: number | string;
  prompt?: string;
  oldId?: number | string;
}
export interface VideoData extends MediaData {
  id: number;
  video_url: string;
  meta_data?: any;
  created_at?: string;
  taskId?: number; // 真实的后端 taskId，用于 polling 匹配（占位项 id 保持稳定以避免 React key 变化导致进度条重置）
}
export interface ImageData extends MediaData {
  url_path: string;
  meta_data?: string;
  created_at?: string;
}
export const filterValidMedia =
  <T>(validFn: (data: any) => Promise<boolean>, pathName: string) =>
  async (data: T[]) => {
    const results = await Promise.all<T | null>(
      data.map(
        d =>
          new Promise(resolve =>
            validFn(d[pathName])
              .then((valid: any) => resolve(valid ? d : null))
              .catch(),
          ),
      ),
    );

    return results.filter(r => r) as T[];
  };

export const filterValidVideo = async (data: VideoData[]) => {
  return filterValidMedia<VideoData>(isVideoValid, 'video_url')(data);
};
export const filterValidImage = async (data: ImageData[]) => {
  return filterValidMedia<ImageData>(isImageValid, 'url_path')(data);
};
export const genId = () => {
  let id = 0;
  return () => id++;
};

// TODO: 接口如果返回插入的id，这个方法可以删掉
export const mergeMediaData = (
  oldData: MediaData[],
  newData: MediaData[],
  propName: 'video_url' | 'url_path',
) => {
  for (let item of newData) {
    const index = oldData.findIndex(d => d[propName] === item[propName]);
    if (index > -1) {
      oldData[index] = {
        id: item.id,
        [propName]: item[propName],
        prompt: item.prompt,
      };
    }
  }
  return oldData;
};

export const deleteMediaData = (
  setData: React.Dispatch<React.SetStateAction<any>>,
  id: number,
) => {
  setData(oldData => {
    const index = oldData.findIndex(d => d.id === id);
    if (index > -1) {
      oldData.splice(index, 1);
      return [...oldData];
    }
    return oldData;
  });
};

export const dispatchGenerated = (id: number | string) => {
  document.dispatchEvent(new Event('komiko.generated.' + id));
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 100);
  });
};

export const preloadImage = (url: string) =>
  new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => resolve(url);
  });

export const uploadVideo = async (
  videoUrl: string,
  userId?: string,
): Promise<string> => {
  try {
    // 1. 获取视频 blob
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video URL');
    }
    const blob = await response.blob();

    // 2. 创建视频文件
    const file = new File([blob], `${uuidv4()}.mp4`, { type: 'video/mp4' });

    // 3. 上传到 Supabase
    const videoPath = `app_videos/${file.name}`; // 使用专门的视频文件夹

    const url = await uploadFile(videoPath, file);
    return url;
  } catch (error) {
    console.error('Failed to upload video:', error);
    throw error;
  }
};

import { trackError } from '../../utilities/analytics';

export const uploadTempVideo = async (
  videoUrl: string,
  userId?: string,
): Promise<string> => {
  try {
    // 1. 获取视频 blob
    const response = await fetch(videoUrl);
    if (!response.ok) {
      const error = new Error(
        `Failed to fetch video URL: ${response.status} ${response.statusText}`,
      );

      trackError(error, {
        source: 'uploadTempVideo',
        userId: userId,
        additionalData: { status: response.status },
      });

      throw error;
    }
    const blob = await response.blob();

    // Validate blob
    if (
      !blob.type.startsWith('video/') &&
      blob.type !== 'application/octet-stream'
    ) {
      throw new Error(`Invalid video blob type: ${blob.type}`);
    }

    // 2. 创建视频文件
    const fileName = generateShortFileName('mp4');
    const videoPath = `tmp/${fileName}`;

    const file = new File([blob], fileName, { type: 'video/mp4' });

    const url = await uploadFile(videoPath, file);

    return url;
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to fetch') {
      trackError(error, {
        source: 'uploadTempVideo',
        userId: userId,
        additionalData: {
          online:
            typeof navigator !== 'undefined' ? navigator.onLine : undefined,
        },
      });
    }

    console.error('Failed to upload video:', error);
    throw error;
  }
};

export const uploadTempImage = async (file: File): Promise<string> => {
  const fileName = generateShortFileName('jpg');
  const imagePath = `tmp/${fileName}`;
  const url = await uploadFile(imagePath, file);
  return url;
};

/**
 * 获取视频时长
 * @param videoFile - 视频文件（File对象或blob URL）
 * @returns Promise<number> - 返回视频时长（秒）
 */
export const getVideoDuration = async (
  videoFile: File | string,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      video.remove();
      resolve(duration);
    };

    video.onerror = () => {
      video.remove();
      reject(new Error('Failed to load video'));
    };

    // 设置视频源
    if (videoFile instanceof File) {
      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      video.load();

      // 在metadata加载完成后清理URL
      const cleanup = () => {
        URL.revokeObjectURL(videoUrl);
      };

      video.addEventListener('loadedmetadata', cleanup, { once: true });
      video.addEventListener('error', cleanup, { once: true });
    } else {
      video.src = videoFile;
      video.load();
    }
  });
};

/**
 * 获取图像实际尺寸
 * @param imageUrl - 图像URL
 * @returns Promise<{ width: number; height: number }> - 返回图像尺寸
 */
export const getImageDimensions = async (
  imageUrl: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

/**
 * 自动裁剪参考图像以匹配提取帧的尺寸
 * @param imageFile - 要裁剪的图像文件
 * @param targetDimensions - 目标尺寸
 * @returns Promise<File> - 返回裁剪后的图像文件
 */
export const cropReferenceToMatchFrame = async (
  imageFile: File,
  targetDimensions: { width: number; height: number },
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const { width: targetWidth, height: targetHeight } = targetDimensions;
      const sourceWidth = img.width;
      const sourceHeight = img.height;

      // 计算目标宽高比
      const targetAspectRatio = targetWidth / targetHeight;
      const sourceAspectRatio = sourceWidth / sourceHeight;

      // 设置画布尺寸为目标尺寸
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      let cropX = 0,
        cropY = 0,
        cropWidth = sourceWidth,
        cropHeight = sourceHeight;

      if (sourceAspectRatio > targetAspectRatio) {
        // 源图像更宽，需要裁剪左右
        cropWidth = sourceHeight * targetAspectRatio;
        cropX = (sourceWidth - cropWidth) / 2;
      } else if (sourceAspectRatio < targetAspectRatio) {
        // 源图像更高，需要裁剪上下
        cropHeight = sourceWidth / targetAspectRatio;
        cropY = (sourceHeight - cropHeight) / 2;
      }

      // 裁剪并缩放到目标尺寸
      ctx?.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      canvas.toBlob(
        blob => {
          if (blob) {
            const croppedFile = new File([blob], imageFile.name, {
              type: imageFile.type,
            });
            resolve(croppedFile);
          } else {
            reject(new Error('Failed to crop image'));
          }
        },
        imageFile.type,
        0.9,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

// Smoothly scroll to align the given element to top with an offset and optional delay
// It will scroll the nearest scrollable ancestor if present; otherwise it scrolls window
export const scrollWindowToElementTop = (
  el: HTMLElement | null,
  opts?: { offset?: number; delay?: number; behavior?: ScrollBehavior },
) => {
  const offset = opts?.offset ?? 64;
  const delay = opts?.delay ?? 0;
  const behavior: ScrollBehavior = opts?.behavior ?? 'smooth';

  const exec = () => {
    if (!el) return;

    // Find nearest scrollable ancestor (overflow-y: auto/scroll/overlay and scrollable)
    let container: HTMLElement | null = el.parentElement;
    while (container) {
      const cs = window.getComputedStyle(container);
      const oy = cs.overflowY;
      if (
        (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
        container.scrollHeight > container.clientHeight
      ) {
        break;
      }
      container = container.parentElement;
    }

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetTop =
        container.scrollTop + (elRect.top - containerRect.top) - offset;
      container.scrollTo({ top: Math.max(0, targetTop), behavior });
    } else {
      const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, y), behavior });
    }
  };

  if (delay > 0) {
    setTimeout(exec, delay);
  } else if (typeof window.requestAnimationFrame === 'function') {
    // Wait for next two frames to avoid layout jank from button state changes
    requestAnimationFrame(() => requestAnimationFrame(exec));
  } else {
    exec();
  }
};
