/**
 * 基于 https://dev.to/abhirup99/compressing-videos-to-webm-in-the-browser-1poc 的视频压缩实现
 */

import {
  pauseSWDuringVideoCompression,
  resumeSWAfterVideoCompression,
} from './serviceWorkerMonitor';

// 延迟释放blob URL的辅助函数
const safeRevokeObjectURL = (url: string, delay = 3000) => {
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // 忽略释放错误
      console.debug('URL already revoked:', url);
    }
  }, delay);
};

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fps?: number;
}

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

interface CompressedVideoResult {
  file: File;
  originalDuration: number;
  originalWidth: number;
  originalHeight: number;
}

// 获取视频信息
const getVideoInfo = (file: File): Promise<VideoInfo> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const videoUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const info = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };
      // 立即释放URL，因为我们只需要元数据
      URL.revokeObjectURL(videoUrl);
      resolve(info);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = videoUrl;
  });
};

// 计算新的尺寸
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
) => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // 如果尺寸超出限制，按比例缩放
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width / maxWidth > height / maxHeight) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  // 确保尺寸为偶数（视频编码要求）
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;

  return { width, height };
};

// 带进度回调的压缩函数
export const compressVideoToWebM = async (
  file: File,
  options: CompressionOptions & {
    onProgress?: (progress: number) => void;
  } = {},
): Promise<CompressedVideoResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.8,
    fps = 30,
    onProgress,
  } = options;

  console.log('开始压缩视频:', file.name);

  // 暂停 Service Worker 缓存以提高性能
  pauseSWDuringVideoCompression();

  try {
    // 获取视频信息
    const videoInfo = await getVideoInfo(file);
    console.log('视频信息:', videoInfo);

    // 计算新尺寸
    const { width, height } = calculateDimensions(
      videoInfo.width,
      videoInfo.height,
      maxWidth,
      maxHeight,
    );

    console.log(`压缩尺寸: ${width}x${height}`);

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let videoUrl: string;

      let mediaRecorder: MediaRecorder;
      const chunks: Blob[] = [];
      let isRecording = false;

      const cleanup = () => {
        if (
          isRecording &&
          mediaRecorder &&
          mediaRecorder.state === 'recording'
        ) {
          mediaRecorder.stop();
        }
        video.pause();
        video.currentTime = 0;

        // 立即清理chunks数组释放内存，减少后期卡顿
        chunks.length = 0;

        // 移除事件监听器避免内存泄漏
        video.ontimeupdate = null;
        video.onended = null;
        video.onerror = null;
        video.onloadedmetadata = null;

        // 延迟释放URL，给浏览器时间处理
        if (videoUrl) {
          safeRevokeObjectURL(videoUrl, 1000); // 缩短延迟到1秒
        }
      };

      video.onloadedmetadata = () => {
        try {
          // 设置视频尺寸
          video.width = width;
          video.height = height;

          // 检查浏览器兼容性
          if (!(video as any).captureStream) {
            throw new Error('Browser does not support video.captureStream API');
          }

          // 直接从video元素捕获流（这样可以保留音频）
          const stream = (video as any).captureStream(fps);

          // 选择最佳的MIME类型，优先选择支持音频的格式
          const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
          ];

          let selectedMimeType = 'video/webm';
          for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
              selectedMimeType = mimeType;
              console.log('使用编码格式:', mimeType);
              break;
            }
          }

          // 简化比特率计算，提高性能
          const pixelCount = width * height;

          // 降低比特率避免卡顿
          let videoBitrate: number;
          if (pixelCount <= 720 * 480) {
            // 480p
            videoBitrate = 500000; // 500kbps
          } else if (pixelCount <= 1280 * 720) {
            // 720p
            videoBitrate = 1000000; // 1Mbps
          } else if (pixelCount <= 1920 * 1080) {
            // 1080p
            videoBitrate = 1500000; // 1.5Mbps
          } else {
            // 更高分辨率
            videoBitrate = 2000000; // 2Mbps
          }

          // 根据质量调整
          videoBitrate = Math.round(videoBitrate * quality);

          const recorderOptions: MediaRecorderOptions = {
            mimeType: selectedMimeType,
            videoBitsPerSecond: videoBitrate,
          };

          // 简化音频处理 - 固定比特率
          if (stream.getAudioTracks().length > 0) {
            recorderOptions.audioBitsPerSecond = 128000; // 固定128kbps
            console.log('检测到音频轨道，使用固定音频比特率: 128kbps');
          }

          mediaRecorder = new MediaRecorder(stream, recorderOptions);

          console.log(
            `比特率设置: 分辨率${width}x${height}, 视频${Math.round(videoBitrate / 1000)}kbps`,
          );

          mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            console.log(`录制停止，处理${chunks.length}个chunks`);

            // 分批处理chunks，避免一次性处理导致卡顿
            const blob = new Blob(chunks, { type: selectedMimeType });
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.webm'),
              { type: 'video/webm' },
            );

            const sizeMB = compressedFile.size / (1024 * 1024);
            console.log(`压缩完成: ${sizeMB.toFixed(2)}MB`);

            if (sizeMB > 50) {
              console.warn(`文件大小超过50MB: ${sizeMB.toFixed(2)}MB`);
            }

            // 文件生成后立即清理，释放内存
            cleanup();
            // 恢复 Service Worker 缓存
            resumeSWAfterVideoCompression();
            resolve({
              file: compressedFile,
              originalDuration: videoInfo.duration,
              originalWidth: videoInfo.width,
              originalHeight: videoInfo.height,
            });
          };

          mediaRecorder.onerror = event => {
            console.error('MediaRecorder错误:', event);
            cleanup();
            resumeSWAfterVideoCompression();
            reject(new Error('录制失败'));
          };

          let lastProgressUpdate = 0;
          video.ontimeupdate = () => {
            if (video.duration > 0) {
              const now = Date.now();
              // 每500ms最多更新一次进度
              if (now - lastProgressUpdate > 500) {
                const progress = (video.currentTime / video.duration) * 100;
                onProgress?.(Math.round(progress));
                lastProgressUpdate = now;
              }
            }
          };

          video.onended = () => {
            console.log('视频播放完毕');
            if (isRecording && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              isRecording = false;
            }
          };

          // 简化的启动流程
          const startRecording = () => {
            try {
              video.muted = true;
              mediaRecorder.start();
              isRecording = true;
              console.log('开始录制');

              video.play().catch(error => {
                console.error('播放失败:', error);
                cleanup();
                reject(error);
              });
            } catch (error) {
              console.error('录制启动失败:', error);
              cleanup();
              reject(error);
            }
          };

          // 立即开始（参考原文章的方式）
          startRecording();
        } catch (error) {
          console.error('初始化失败:', error);
          cleanup();
          reject(error);
        }
      };

      video.onerror = () => {
        cleanup();
        resumeSWAfterVideoCompression();
        reject(new Error('视频加载失败'));
      };

      // 设置视频属性
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      // 加载视频
      videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;
    });
  } catch (error) {
    console.error('压缩失败:', error);
    resumeSWAfterVideoCompression();
    throw error;
  }
};

// 优化的压缩函数，平衡质量和文件大小
export const quickCompressVideo = async (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<CompressedVideoResult> => {
  const fileSizeMB = file.size / (1024 * 1024);

  // 获取视频信息来做更精确的判断
  const videoInfo = await getVideoInfo(file);
  const videoDuration = videoInfo.duration;
  const originalWidth = videoInfo.width;
  const originalHeight = videoInfo.height;

  console.log(
    `原始视频: ${originalWidth}x${originalHeight}, 时长: ${videoDuration.toFixed(
      1,
    )}s, 大小: ${fileSizeMB.toFixed(2)}MB`,
  );

  let options: CompressionOptions;

  // 基于视频时长和原始分辨率的智能策略
  const isLongVideo = videoDuration > 300; // 5分钟以上
  const isHighRes = originalWidth >= 1920 || originalHeight >= 1080;

  if (fileSizeMB > 500 || (isLongVideo && isHighRes)) {
    // 超大文件或长时间高分辨率：720p中等质量
    options = { maxWidth: 1280, maxHeight: 720, quality: 0.7, fps: 30 };
  } else if (fileSizeMB > 200 || isLongVideo) {
    // 大文件或长视频：720p高质量
    options = { maxWidth: 1280, maxHeight: 720, quality: 0.8, fps: 30 };
  } else if (fileSizeMB > 100) {
    // 中等文件：保持原分辨率或1080p
    const targetWidth = Math.min(originalWidth, 1920);
    const targetHeight = Math.min(originalHeight, 1080);
    options = {
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      quality: 0.8,
      fps: 30,
    };
  } else if (fileSizeMB > 50) {
    // 小文件：保持原分辨率，高质量
    options = {
      maxWidth: originalWidth,
      maxHeight: originalHeight,
      quality: 0.85,
      fps: 30,
    };
  } else {
    // 很小文件：保持原分辨率，最高质量
    options = {
      maxWidth: originalWidth,
      maxHeight: originalHeight,
      quality: 0.9,
      fps: 30,
    };
  }

  console.log(
    `压缩策略: ${options.maxWidth}x${options.maxHeight}, 质量: ${options.quality}, 帧率: ${options.fps}`,
  );

  const startTime = Date.now();
  const result = await compressVideoToWebM(file, { ...options, onProgress });
  const duration = (Date.now() - startTime) / 1000;

  // 检查结果文件大小
  const resultSizeMB = result.file.size / (1024 * 1024);
  console.log(
    `压缩完成: ${resultSizeMB.toFixed(2)}MB (压缩率: ${(
      ((fileSizeMB - resultSizeMB) / fileSizeMB) *
      100
    ).toFixed(1)}%)`,
  );

  return result;
};