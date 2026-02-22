import { ICON_FILL_COLOR } from '../constants';
import { cloneDeep } from 'lodash-es';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { env } from './env';
import { v4 as uuidv4 } from 'uuid';

export const downloadURI = (uri: string | undefined, name: string) => {
  // 确保 URI 存在
  if (!uri) {
    console.error('URI not provided');
    return;
  }

  // 使用 fetch 获取文件内容
  fetch(uri)
    .then(response => response.blob())
    .then(blob => {
      // 创建 Blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.download = name;
      link.href = blobUrl;

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(error => {
      console.error('Download failed:', error);
    });
};

export const getNumericVal = (val: number | undefined) => val || 0;

export const getIconColorProps = (isSelected: boolean | undefined) => ({
  fill: isSelected ? ICON_FILL_COLOR : 'none',
  stroke: isSelected ? ICON_FILL_COLOR : 'currentColor',
});

/**
 * 简单的字符串哈希函数，用于生成确定性的随机数
 * @param str - 输入字符串
 * @returns 哈希值
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * 基于种子生成确定性的随机数（范围 0-1）
 * @param seed - 种子字符串
 * @returns 0-1 之间的随机数
 */
const seededRandom = (seed: string): number => {
  const hash = hashString(seed);
  // 使用简单的线性同余生成器
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

/**
 * 将原始使用统计数据转换为带基数和 k 单位的 popularity 显示格式
 * @param usageCount - 原始使用次数（可能为 undefined 或 0）
 * @param seed - 用于生成确定性随机数的种子（通常是模板 ID）
 * @returns 格式化后的 popularity 字符串，如 "2.4k"
 */
export const formatPopularity = (
  usageCount: number | undefined,
  seed?: string,
): string => {
  let actualValue: number;

  if (usageCount && usageCount > 0) {
    // 如果有真实使用数据
    // 比如 100 次使用 -> 100 * 15 + 1000 = 2500 (2.5k)
    // 比如 10 次使用 -> 10 * 15 + 1000 = 1150 (1.2k)
    actualValue = usageCount * 15 + 1000;
  } else {
    // 如果没有数据，在预设数组中随机选择 (控制在 1.5k 以下，大部分在 1k 以下)
    const fallbackValues = [
      120, 350, 560, 890, 920, 1050, 1100, 1250, 1340, 1450, 250, 480, 670, 790,
      150,
    ];

    if (seed) {
      // 基于种子确定性选择
      const randomIndex = Math.floor(
        seededRandom(seed) * fallbackValues.length,
      );
      actualValue = fallbackValues[randomIndex];
    } else {
      // 纯随机选择
      const randomIndex = Math.floor(Math.random() * fallbackValues.length);
      actualValue = fallbackValues[randomIndex];
    }
  }

  // 如果小于 1000，直接返回数字
  if (actualValue < 1000) {
    return actualValue.toString();
  }

  // 转换为 k 单位，保留一位小数
  const kValue = actualValue / 1000;
  return `${kValue.toFixed(1)}k`;
};

// export const reorderArray = <T>(arr: T[], from: number, to: number): T[] => {
//   if (to < 0 || to > arr.length - 1) return arr;
//   const newArr = [...arr];
//   const item = newArr.splice(from, 1);
//   newArr.splice(to, 0, item[0]);
//   return newArr;
// };

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const deepClone = cloneDeep;
export function cropImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // This allows the image to be used in a canvas without being tainted.
    image.src = imageUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const width = image.width;
      const height = image.height;
      if (height / width < 16 / 9) {
        resolve([imageUrl]);
      }
      let y = 0;
      const croppedImages: string[] = [];

      while (y < height) {
        const currentCropHeight = Math.min(width, height - y);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = currentCropHeight;
        const cropContext = cropCanvas.getContext('2d');

        if (!cropContext) {
          reject(new Error('Crop canvas context not available'));
          return;
        }

        cropContext.drawImage(
          image,
          0,
          y,
          width,
          currentCropHeight,
          0,
          0,
          width,
          currentCropHeight,
        );

        const croppedImage = cropCanvas.toDataURL('image/webp', 1.0);
        croppedImages.push(croppedImage);

        y += currentCropHeight;
      }
      resolve(croppedImages);
    };

    image.onerror = error => {
      reject(error);
    };
  });
}

export function convertWebP(base64Uri: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Uri;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const image = canvas.toDataURL('image/webp', 1.0);
      resolve(image);
    };

    img.onerror = err => {
      reject(err);
    };
  });
}

export async function getUserInfo() {
  const response = await fetch('/api/getUserInfo', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData.error);
    return;
  }

  const data = await response.json();
  return data;
}

export const shareLink = async (url: string, title: string, text: string) => {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Sharing link copied! Share it with your friends now!');
  } catch (error) {
    console.error('Failed to copy: ', error);
    toast.success('Failed to copy the link.');
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      console.log('Content shared successfully');
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }
};

export async function getCharacterProfile(uniqids: string[]) {
  const origin = process.env.NEXT_PUBLIC_API_URL!;
  const url = `${origin}/api/getCharactersProfile?uniqids=${uniqids.join(',')}`;
  const res = await fetch(url);
  const characterData = await res.json().catch();
  if (characterData.error) {
    throw characterData.error;
  }
  if (!characterData) {
    console.error('Character not found', uniqids);
    return [null];
  }
  for (const character of characterData) {
    character.user_name = character.User?.user_name ?? null;
    character.user_image = character.User?.image ?? null;
    character.user_uniqid = character.User?.user_uniqid ?? null;
  }
  return characterData;
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export const isVideoValid = (url: string) =>
  new Promise<boolean>(resolve => {
    if (!url) {
      resolve(false);
      return;
    }
    const video = document.createElement('video');
    video.src = url;
    video.oncanplay = () => {
      resolve(true);
    };
    video.onerror = () => {
      resolve(false);
    };
    video.load();
  });

export const isImageValid = (url: string) =>
  new Promise<boolean>(resolve => {
    if (!url) {
      resolve(false);
      return;
    }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(true);
    image.src = url;
    image.onerror = () => resolve(false);
  });

export const proxyImageUrl = (filename: string, baseURL?: string) =>
  `${baseURL ?? ''}/api/tools/proxyImage?filename=${filename}`;
export const proxyVideoUrl = (url: string, baseURL?: string) =>
  `${baseURL ?? ''}/api/tools/proxyVideo?url=${url}`;
export const uploadFile = async (filename: string, file: File) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC!,
  );
  const { error } = await supabase.storage
    .from('husbando-land')
    .upload(filename, file, { contentType: 'image/webp' });
  if (error) {
    console.error(error);
    return '';
  }
  const { data } = await supabase.storage
    .from('husbando-land')
    .getPublicUrl(filename);
  return data?.publicUrl || '';
};

/**
 * Convert File to base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Calculate the byte size of a base64 string
 */
export const getBase64Size = (base64: string): number => {
  // base64 format: data:image/png;base64,xxxxx
  const base64Data = base64.split(',')[1] || base64;
  // Each base64 character represents 6 bits, so total bytes = length * 3/4
  // But we also need to account for padding
  return base64Data.length;
};

/**
 * Delete files from Supabase storage by public URLs
 * @param publicUrls - Single URL or array of URLs to delete
 * @returns Promise indicating success/failure
 */
export const deleteFilesByUrl = async (
  publicUrls: string | string[],
): Promise<{ success: boolean; error?: string }> => {
  try {
    const urls = Array.isArray(publicUrls) ? publicUrls : [publicUrls];
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/`;

    // Extract file paths from public URLs
    const filePaths = urls
      .map(url => {
        if (url.startsWith(baseUrl)) {
          return url.replace(baseUrl, '');
        }
        return null;
      })
      .filter((path): path is string => path !== null);

    if (filePaths.length === 0) {
      return { success: true }; // No valid files to delete
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC!,
    );

    const { error } = await supabase.storage
      .from('husbando-land')
      .remove(filePaths);

    if (error) {
      console.error('Error deleting files from Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully deleted files:', filePaths);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteFilesByUrl:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(url);
    const blob = await response.blob();

    // Create a FileReader to convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        // const base64 = base64String.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

/**
 * 检测图片是否有透明通道
 * @param url 图片URL
 * @returns Promise<boolean> 是否有透明通道
 */
export const hasTransparency = async (url: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(false);
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 检查是否有任何像素的 alpha 值小于 255（即有透明度）
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      } catch (error) {
        console.warn('Failed to check transparency:', error);
        resolve(false);
      }
    };

    image.onerror = () => {
      resolve(false);
    };

    image.src = url;
  });
};

/**
 * 将图片重绘到canvas中，然后转换为base64，确保格式兼容性
 * @param url 图片URL
 * @param format 输出格式，默认为'image/webp'
 * @param quality 图片质量，0-1之间，默认为0.9
 * @param addWhiteBackground 是否自动为透明图片添加白色背景，默认为true
 * @returns base64字符串
 */
export const redrawImageToBase64 = async (
  url: string,
  format: string = 'image/webp',
  quality: number = 0.9,
  addWhiteBackground: boolean = true,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 设置canvas尺寸为图片尺寸
        canvas.width = image.width;
        canvas.height = image.height;

        // 如果需要添加白色背景，先填充白色
        if (addWhiteBackground) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 绘制图片到canvas（透明部分会显示白色背景）
        ctx.drawImage(image, 0, 0);

        // 转换为base64
        const base64 = canvas.toDataURL(format, quality);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = (error: any) => {
      reject(new Error(`Failed to load image: ${error}`));
    };

    image.src = url;
  });

/**
 * 从外部服务转存视频到Supabase
 * @param videoUrl 视频URL
 * @returns Supabase存储的视频URL
 */
export const migrateMediaFromReplicate = async (
  mediaUrl: string,
  mediaType: 'video' | 'image',
): Promise<string> => {
  // 如果已经是Supabase的URL，直接返回
  if (!mediaUrl || mediaUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
    return mediaUrl;
  }

  try {
    // 获取视频文件
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      console.error('Failed to fetch media from external service');
      return mediaUrl;
    }

    const blob = await response.blob();

    let filePath = '';
    let file: File;
    if (mediaType === 'video') {
      filePath = `app_videos/${uuidv4()}.mp4`;
      file = new File([blob], filePath, { type: 'video/mp4' });
    } else {
      // 使用与现有上传一致的图片目录，确保权限与清理逻辑一致
      filePath = `app_images/${uuidv4()}.webp`;
      file = new File([blob], filePath, { type: 'image/webp' });
    }

    // 上传到Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC!,
    );
    const { error } = await supabase.storage
      .from('husbando-land')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
      });

    if (error) {
      console.error('Failed to upload video to Supabase:', error);
      return mediaUrl;
    }

    // 获取公共URL
    const { data } = await supabase.storage
      .from('husbando-land')
      .getPublicUrl(filePath);
    // console.log(
    //   'Video migrated from external service to Supabase:',
    //   mediaUrl,
    //   '->',
    //   data?.publicUrl,
    // );
    return data?.publicUrl || mediaUrl;
  } catch (error) {
    console.error('Error migrating media from external service:', error);
    return mediaUrl;
  }
};

/**
 * 获取有效的图片尺寸
 * @param height 期望的图片高度
 * @param aspectRatio 宽高比（宽度/高度）
 * @returns 返回有效的高度和对应的宽度
 */
export function getValidImageDimensions(
  height: number,
  aspectRatio: number,
): { height: number; width: number } {
  // 有效的尺寸值列表
  const validSizes = [
    256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024,
  ];

  // 找到最接近的有效高度
  const validHeight = validSizes.reduce(
    (closest, current) =>
      Math.abs(current - height) < Math.abs(closest - height)
        ? current
        : closest,
    validSizes[0],
  );

  // 根据宽高比计算理想宽度
  const idealWidth = Math.round(validHeight * aspectRatio);

  // 找到最接近的有效宽度
  const validWidth = validSizes.reduce(
    (closest, current) =>
      Math.abs(current - idealWidth) < Math.abs(closest - idealWidth)
        ? current
        : closest,
    validSizes[0],
  );

  return { height: validHeight, width: validWidth };
}

export const getImageSize = (imageUrl: string) =>
  new Promise<{ width: number; height: number }>(resolve => {
    // If the URL is empty or invalid, return a safe default instead of rejecting
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      resolve({ width: 1024, height: 1024 });
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => {
      // Avoid unhandled promise rejections by resolving a default size
      console.warn(
        'getImageSize: failed to load image, using default size for',
        imageUrl,
      );
      resolve({ width: 1024, height: 1024 });
    };
    image.src = imageUrl;
  });

export const toastError = (message: string) => {
  // Suppress PostHog-related noise
  if (shouldSuppressToast(message)) {
    return;
  }
  toast.error(message, {
    position: 'top-center',
    style: {
      background: '#555',
      color: '#fff',
    },
  });
};

export const toastWarn = (message: string) => {
  toast(`️${message}`, {
    icon: '⚠️',
    position: 'top-center',
    style: {
      background: '#555',
      color: '#fff',
    },
  });
};

/**
 * Detect PostHog-related error messages to avoid user-facing toasts.
 * Matches common endpoints and library identifiers.
 */
export const isPosthogRelated = (input: unknown): boolean => {
  try {
    const text =
      typeof input === 'string'
        ? input
        : typeof input === 'object' && input !== null
          ? JSON.stringify(input)
          : String(input ?? '');
    return /posthog|\/ingest|\/capture|posthog-js|us\.posthog\.com|eu\.posthog\.com/i.test(
      text,
    );
  } catch {
    return false;
  }
};

/**
 * Centralized toast suppression rule.
 */
export const shouldSuppressToast = (input: unknown): boolean =>
  isPosthogRelated(input);

let locale = '';
export const changeLocale = (newLocale: string) => {
  locale = newLocale;
  localStorage.setItem('lang', newLocale);
};

export const getLocale = () => {
  if (!locale) {
    locale = localStorage.getItem('lang') ?? 'en';
    localStorage.setItem('lang', locale);
  }
  return locale;
};

export const nextTick = (callback: () => void) =>
  new Promise(resolve => {
    resolve(null);
  }).then(callback);

export function hasError(
  err: any,
): err is { error: string; error_code?: number } {
  if ((err as any)?.error) {
    return true;
  }
  return false;
}

export * from './sitConfig';
export * from './constants';
export * from './env';

// 视频处理工具
export * from './video';

// Export addWatermark function
export { addWatermark } from './watermark';

export const EmailWhiteList = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
  'pm.me',
  'yandex.com',
  'yandex.ru',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'web.de',
  't-online.de',
  'freenet.de',
  'orange.fr',
  'free.fr',
  'wanadoo.fr',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
] as const;

export const checkEmail = async () => {
  const response = await fetch('/api/email').catch();
  try {
    const data = await response.json();
    const device_emails = localStorage.getItem('devices_emails') || '[]';
    let device_emails_array: string[] = [];
    if (device_emails) {
      try {
        device_emails_array = JSON.parse(device_emails);
      } catch (error) {
        console.error('Error parsing devices_emails:', error);
      }
      if (device_emails_array.includes(data?.data?.email)) {
        return true;
      }
    }
    if (device_emails_array.length >= 2) {
      return false;
    }
    if (data.data.email) {
      localStorage.setItem(
        'devices_emails',
        JSON.stringify([...device_emails_array, data.data.email]),
      );
    }
    return true;
  } catch {
    return true;
  }
};

export const withClient = (
  onClientCallback: () => any,
  onSeverCallback: () => any,
) => {
  if (typeof window === 'undefined') {
    return onSeverCallback?.();
  }
  return onClientCallback?.();
};
