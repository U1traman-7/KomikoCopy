/**
 * Uppy上传到Supabase
 * https://supabase.com/docs/guides/storage/uploads/resumable-uploads
 */

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    duration?: number;
    width?: number;
    height?: number;
  };
}

// 文件大小限制配置
const FILE_LIMITS = {
  // 视频限制
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxDuration: 180, // 3分钟
    maxWidth: 1920,
    maxHeight: 1920,
  },
  // 图片限制
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 4096,
    maxHeight: 4096,
  },
};

// 获取视频信息
const getVideoInfo = (
  file: File,
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const info = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(video.src);
      resolve(info);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('无法读取视频信息'));
    };

    video.src = URL.createObjectURL(file);
  });
};

// 获取图片信息
const getImageInfo = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('无法读取图片信息'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 验证文件
export const validateFile = async (
  file: File,
  originalDuration?: number,
): Promise<FileValidationResult> => {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please upload video or image files.',
    };
  }

  const fileSize = file.size;

  try {
    if (isVideo) {
      // 检查视频文件
      const limits = FILE_LIMITS.video;

      if (fileSize > limits.maxSize) {
        return {
          isValid: false,
          error: `Video file too large. Maximum size: ${Math.round(
            limits.maxSize / 1024 / 1024,
          )}MB`,
        };
      }

      const videoInfo = await getVideoInfo(file);

      const durationToCheck = originalDuration ?? videoInfo.duration;

      if (durationToCheck > limits.maxDuration) {
        return {
          isValid: false,
          error: `Video duration too long. Maximum: ${Math.round(
            limits.maxDuration / 60,
          )} minutes`,
        };
      }

      console.log('Video info:', videoInfo);
      if (
        videoInfo.width > limits.maxWidth ||
        videoInfo.height > limits.maxHeight
      ) {
        return {
          isValid: false,
          error: `Video resolution too high. Maximum: ${limits.maxWidth}x${limits.maxHeight}`,
        };
      }

      return {
        isValid: true,
        fileInfo: {
          size: fileSize,
          duration: videoInfo.duration,
          width: videoInfo.width,
          height: videoInfo.height,
        },
      };
    } else if (isImage) {
      // Check image file
      const limits = FILE_LIMITS.image;

      if (fileSize > limits.maxSize) {
        return {
          isValid: false,
          error: `Image file too large. Maximum size: ${Math.round(
            limits.maxSize / 1024 / 1024,
          )}MB`,
        };
      }

      const imageInfo = await getImageInfo(file);

      if (
        imageInfo.width > limits.maxWidth ||
        imageInfo.height > limits.maxHeight
      ) {
        return {
          isValid: false,
          error: `Image resolution too high. Maximum: ${limits.maxWidth}x${limits.maxHeight} or ${limits.maxHeight}x${limits.maxWidth}`,
        };
      }

      return {
        isValid: true,
        fileInfo: {
          size: fileSize,
          width: imageInfo.width,
          height: imageInfo.height,
        },
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `File validation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }

  return {
    isValid: false,
    error: 'Unknown file validation error',
  };
};

// 创建Uppy实例
const createUppyInstance = (bucketName = 'husbando-land') => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024, // 50MB (视频限制)
      maxNumberOfFiles: 1,
      allowedFileTypes: ['image/*', 'video/*'],
    },
    autoProceed: false,
  });

  const tusConfig = {
    endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
    headers: {
      authorization: `Bearer ${supabaseAnonKey}`,
      'x-upsert': 'true',
    },
    chunkSize: 6 * 1024 * 1024, // 6MB chunks
    allowedMetaFields: [
      'bucketName',
      'objectName',
      'contentType',
      'cacheControl',
    ],
    removeFingerprintOnSuccess: true,
    overridePatchMethod: false,
  };

  console.log('TUS configuration:', tusConfig);

  uppy.use(Tus, tusConfig);

  return uppy;
};

// 清理文件路径，移除不支持的字符
const sanitizeFilePath = (filePath: string): string => {
  return (
    filePath
      // 移除或替换特殊字符
      .replace(/[^\w\-_.\/]/g, '_')
      // 移除连续的下划线
      .replace(/_+/g, '_')
      // 移除开头和结尾的下划线
      .replace(/^_+|_+$/g, '')
      // 确保不以斜杠开头
      .replace(/^\/+/, '')
      // 移除连续的斜杠
      .replace(/\/+/g, '/')
  );
};

// Uppy上传到Supabase
export const uploadFileWithUppy = async (
  file: File,
  filePath: string,
  options: UploadOptions = {},
  originalDuration?: number,
): Promise<string> => {
  const { onProgress, onSuccess, onError } = options;

  // 清理文件路径
  const sanitizedFilePath = sanitizeFilePath(filePath);
  console.log('Original path:', filePath);
  console.log('Sanitized path:', sanitizedFilePath);

  // 首先验证文件
  const validation = await validateFile(file, originalDuration);
  if (!validation.isValid) {
    const error = new Error(validation.error);
    onError?.(error);
    throw error;
  }

  console.log('File validation passed:', validation.fileInfo);

  return new Promise((resolve, reject) => {
    const uppy = createUppyInstance();

    // 添加文件到Uppy
    const fileMeta = {
      bucketName: 'husbando-land',
      objectName: sanitizedFilePath,
      contentType: file.type,
      cacheControl: '3600',
    };

    console.log('Adding file to Uppy with meta:', fileMeta);

    uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      meta: fileMeta,
    });

    // 监听上传开始
    uppy.on('upload', data => {
      console.log('Upload started:', data);
    });

    // 监听文件添加
    uppy.on('file-added', file => {
      console.log('File added to Uppy:', file);
    });

    // 监听预处理完成
    uppy.on('preprocess-complete', file => {
      console.log('Preprocess complete:', file);
    });

    // 监听上传进度
    uppy.on('upload-progress', (file, progress) => {
      const percentage = Math.round(
        (progress.bytesUploaded / (progress.bytesTotal ?? 0)) * 100,
      );
      console.log(`Upload progress: ${percentage}%`);
      onProgress?.(percentage);
    });

    // 监听上传成功
    uppy.on('upload-success', (file, response) => {
      console.log('Uppy upload completed:', response);
      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      // 检查上传是否真正成功
      if (response.status < 200 || response.status >= 300) {
        const error = new Error(
          `Upload failed with status ${response.status}: ${response.body || 'Unknown error'}`,
        );
        console.error('Upload failed:', error);
        onError?.(error);
        reject(error);
        return;
      }

      // 构建文件的公共URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/husbando-land/${sanitizedFilePath}`;

      console.log('File URL:', publicUrl);

      // 验证文件是否真正存在（可选，因为可能有延迟）
      setTimeout(async () => {
        try {
          const checkResponse = await fetch(publicUrl, { method: 'HEAD' });
          if (!checkResponse.ok) {
            console.warn(
              'File verification failed, but upload reported success:',
              checkResponse.status,
            );
          } else {
            console.log('File verified successfully:', publicUrl);
          }
        } catch (error) {
          console.warn('File verification error:', error);
        }
      }, 1000); // 1秒后检查

      onSuccess?.(publicUrl);
      resolve(publicUrl);

      // 延迟清理Uppy实例，避免清理错误
      setTimeout(() => {
        try {
          uppy.destroy();
        } catch (error) {
          console.debug('Uppy清理时出现预期错误:', error);
        }
      }, 100);
    });

    // 监听上传错误
    uppy.on('upload-error', (file, error) => {
      console.error('Uppy上传失败:', error);
      onError?.(error);
      reject(error);

      // 清理Uppy实例
      setTimeout(() => {
        try {
          uppy.destroy();
        } catch (error) {
          console.debug('Uppy清理时出现预期错误:', error);
        }
      }, 100);
    });

    // 开始上传
    uppy.upload();
  });
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时长
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
