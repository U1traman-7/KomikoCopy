import { getVideoDuration } from '@/Components/ToolsPage/utils';

// Safari检测
const isSafari =
  typeof window !== 'undefined' &&
  /Safari/.test(navigator.userAgent) &&
  !/Chrome/.test(navigator.userAgent);

/**
 * Safari专用视频剪切 - 优化版本
 * 解决卡帧和分辨率问题
 */
const trimVideoSafari = async (
  videoFile: File,
  maxDuration = 5,
): Promise<File> => {
  // console.log('Safari: 开始优化视频剪切');

  return new Promise(resolve => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let startTime = 0;
    let isRecording = false;
    let animationId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let lastDrawTime = 0;

    const cleanup = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (mediaRecorder && mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // console.warn('Safari: 停止录制时出错:', e);
        }
      }

      video.pause();
      video.removeAttribute('src');
      video.load();

      [video, canvas].forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      isRecording = false;
    };

    if (!ctx) {
      // console.error('Safari: 无法获取Canvas上下文');
      resolve(videoFile);
      return;
    }

    // Safari优化设置
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.controls = false;
    video.setAttribute('webkit-playsinline', 'true');

    // 完全隐藏但保持功能
    [video, canvas].forEach(el => {
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '-9999';
    });

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    video.onloadedmetadata = async () => {
      try {
        if (video.duration <= maxDuration) {
          cleanup();
          resolve(videoFile);
          return;
        }

        // console.log(`Safari: 剪切 ${video.duration}s -> ${maxDuration}s`);

        // 获取原始视频尺寸
        const originalWidth = video.videoWidth;
        const originalHeight = video.videoHeight;

        if (!originalWidth || !originalHeight) {
          // console.error('Safari: 无法获取视频尺寸');
          cleanup();
          resolve(videoFile);
          return;
        }

        // 保持原始分辨率，但限制最大尺寸以提高性能
        let canvasWidth = originalWidth;
        let canvasHeight = originalHeight;

        const maxSize = 1280; // 最大边长
        if (Math.max(canvasWidth, canvasHeight) > maxSize) {
          const ratio = maxSize / Math.max(canvasWidth, canvasHeight);
          canvasWidth = Math.round(canvasWidth * ratio);
          canvasHeight = Math.round(canvasHeight * ratio);
        }

        // 确保尺寸是偶数（视频编码要求）
        canvasWidth = canvasWidth % 2 === 0 ? canvasWidth : canvasWidth - 1;
        canvasHeight = canvasHeight % 2 === 0 ? canvasHeight : canvasHeight - 1;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // console.log(`Safari: 视频尺寸 ${originalWidth}x${originalHeight} -> Canvas ${canvasWidth}x${canvasHeight}`);

        // 等待视频完全准备
        await new Promise<void>(resolveReady => {
          const checkReady = () => {
            if (
              video.readyState >= video.HAVE_ENOUGH_DATA &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              resolveReady();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });

        await startOptimizedRecording();
      } catch (error) {
        console.error('Safari视频处理失败:', error);
        cleanup();
        resolve(videoFile);
      }
    };

    const startOptimizedRecording = async () => {
      try {
        // 优化的Canvas流设置
        const targetFPS = 30;
        const canvasStream = canvas.captureStream(targetFPS);

        if (!canvasStream) {
          throw new Error('Canvas captureStream失败');
        }

        console.log('Safari: Canvas stream创建成功');

        // Safari兼容的编码设置
        const supportedTypes = [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC
          'video/mp4;codecs=avc1.42E01E', // 只有H.264
          'video/mp4',
          'video/webm;codecs=vp8',
          'video/webm',
        ];

        let mimeType = 'video/mp4';
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            console.log(`Safari: 使用编码 ${type}`);
            break;
          }
        }

        // 根据分辨率调整比特率
        const pixelCount = canvas.width * canvas.height;
        const baseBitrate = Math.min(
          Math.max(pixelCount / 1000, 500000),
          3000000,
        );

        const options: MediaRecorderOptions = {
          mimeType,
          videoBitsPerSecond: baseBitrate,
        };

        mediaRecorder = new MediaRecorder(canvasStream, options);
        recordedChunks = [];

        mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (recordedChunks.length === 0) {
            console.error('Safari: 没有录制数据');
            cleanup();
            resolve(videoFile);
            return;
          }

          console.log(`Safari: 录制完成，${recordedChunks.length}个数据块`);

          const blob = new Blob(recordedChunks, { type: mimeType });
          const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';

          const trimmedFile = new File(
            [blob],
            videoFile.name.replace(/\.[^.]+$/, `_safari${extension}`),
            {
              type: mimeType,
              lastModified: Date.now(),
            },
          );

          console.log(`Safari: 完成 ${trimmedFile.size} bytes`);
          cleanup();
          resolve(trimmedFile);
        };

        mediaRecorder.onerror = error => {
          console.error('Safari: MediaRecorder错误', error);
          cleanup();
          resolve(videoFile);
        };

        // 开始录制
        mediaRecorder.start(200);
        isRecording = true;
        startTime = performance.now();
        lastDrawTime = 0;

        // 重置视频
        video.currentTime = 0;

        // 优化的绘制循环 - 解决卡帧问题
        const targetFrameTime = 1000 / targetFPS; // 33.33ms for 30fps

        const drawFrame = (currentTime: number) => {
          if (!isRecording) return;

          // 控制帧率，避免过度绘制
          if (currentTime - lastDrawTime >= targetFrameTime) {
            try {
              if (
                video.readyState >= video.HAVE_CURRENT_DATA &&
                video.videoWidth > 0 &&
                video.videoHeight > 0
              ) {
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 高质量绘制
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // 绘制视频帧
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              }
            } catch (drawError) {
              console.warn('Safari: 绘制失败', drawError);
            }

            lastDrawTime = currentTime;
          }

          if (isRecording) {
            animationId = requestAnimationFrame(drawFrame);
          }
        };

        // 时间控制
        const checkTime = () => {
          if (
            !isRecording ||
            !mediaRecorder ||
            mediaRecorder.state !== 'recording'
          ) {
            return;
          }

          const elapsed = (performance.now() - startTime) / 1000;

          if (elapsed >= maxDuration) {
            console.log('Safari: 达到时长限制');
            isRecording = false;
            if (animationId) {
              cancelAnimationFrame(animationId);
            }
            mediaRecorder.stop();
            video.pause();
            return;
          }

          timeoutId = setTimeout(checkTime, 100);
        };

        // 启动
        requestAnimationFrame(drawFrame);
        checkTime();

        // 播放策略
        try {
          console.log('Safari: 开始播放');
          await video.play();
          console.log('Safari: 播放成功');
        } catch (playError) {
          console.warn('Safari: 播放失败，手动推进', playError);
          manualTimeAdvance();
        }

        // 安全超时
        setTimeout(
          () => {
            if (
              isRecording &&
              mediaRecorder &&
              mediaRecorder.state === 'recording'
            ) {
              console.log('Safari: 超时停止');
              isRecording = false;
              mediaRecorder.stop();
              video.pause();
            }
          },
          (maxDuration + 3) * 1000,
        );
      } catch (error) {
        console.error('Safari录制失败:', error);
        cleanup();
        resolve(videoFile);
      }
    };

    const manualTimeAdvance = () => {
      if (!isRecording) return;

      let currentTime = 0;
      const frameInterval = 1000 / 30;

      const advance = () => {
        if (!isRecording) return;

        currentTime += frameInterval / 1000;

        if (currentTime < maxDuration && currentTime < video.duration) {
          video.currentTime = currentTime;
          setTimeout(advance, frameInterval);
        }
      };

      console.log('Safari: 手动时间推进');
      advance();
    };

    video.onerror = () => {
      console.error('Safari: 视频加载失败');
      cleanup();
      resolve(videoFile);
    };

    // 设置视频源
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.onloadstart = () => {
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
      }, 1000);
    };

    video.load();
  });
};

/**
 * 智能选择剪切方案
 */
export const trimVideoSmart = async (
  videoFile: File,
  maxDuration = 5,
): Promise<File> => {
  if (typeof window === 'undefined') {
    throw new Error('视频剪切只能在客户端执行');
  }

  // console.log(`智能剪切: ${videoFile.name}, 时长: ${maxDuration}s, Safari: ${isSafari}`);

  try {
    const duration = await getVideoDuration(videoFile);

    if (duration <= maxDuration) {
      // console.log('视频时长符合要求');
      return videoFile;
    }
  } catch (error) {
    // console.warn('获取时长失败:', error);
  }

  if (isSafari) {
    try {
      // console.log('Safari: 尝试Canvas方案');
      const result = await trimVideoSafari(videoFile, maxDuration);

      // 检查结果是否有效
      if (result !== videoFile && result.size > 0) {
        return result;
      } else {
        // console.log('Safari: Canvas方案失败，返回原文件');
        return videoFile;
      }
    } catch (error) {
      // console.error('Safari: 所有方案失败', error);
      return videoFile;
    }
  } else {
    // console.log('使用通用方案');
    const { trimVideo } = await import('./videoTrimmer');
    return await trimVideo(videoFile, maxDuration);
  }
};
