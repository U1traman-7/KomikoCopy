/**
 * 媒体压缩工具
 * 支持图片压缩为WebP格式，视频压缩为WebM格式
 * 最大分辨率限制为1080p
 */

// 压缩配置
const COMPRESSION_CONFIG = {
  image: {
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 0.85, // WebP质量
    format: 'webp' as const,
  },
  video: {
    maxWidth: 1080,
    maxHeight: 1080,
    videoBitrate: 2000000, // 2Mbps
    audioBitrate: 128000, // 128kbps
    format: 'webm' as const,
  },
};

/**
 * 压缩图片到WebP格式
 * @param file 图片文件或Base64字符串
 * @param options 压缩选项
 * @returns Promise<File> 压缩后的WebP文件
 */
export const compressImage = async (
  file: File | string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
): Promise<File> => {
  const {
    maxWidth = COMPRESSION_CONFIG.image.maxWidth,
    maxHeight = COMPRESSION_CONFIG.image.maxHeight,
    quality = COMPRESSION_CONFIG.image.quality,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      let { width, height } = img;

      // 计算压缩尺寸，保持宽高比
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }

        // 确保尺寸不超过限制
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      // 绘制图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 转换为WebP格式
      canvas.toBlob(
        blob => {
          if (blob) {
            const originalFileName =
              file instanceof File ? file.name : 'compressed-image';
            const fileName = originalFileName.replace(/\.[^.]+$/, '.webp');
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onload = processImage;
    img.onerror = () => reject(new Error('图片加载失败'));

    // 设置图片源
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      img.src = file;
    }
  });
};
