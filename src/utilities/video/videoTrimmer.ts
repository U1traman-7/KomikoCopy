import { getVideoDuration } from '@/Components/ToolsPage/utils';

// 客户端环境检查
const isClient =
  typeof window !== 'undefined' && typeof document !== 'undefined';

// 简易 Safari 检测，仅用于决定是否需要把 <video> 挂到 DOM
const isSafari = typeof window !== 'undefined'
  && /Safari/.test(navigator.userAgent)
  && !/Chrome/.test(navigator.userAgent);


const MAX_ALLOWED_TRIM_SECONDS = 15; // 最大允许剪切时长（秒）
const STOP_EARLY_EPSILON_SECONDS = 0.1; // 为避免容器/编码导致的超时长，提前停止的余量（秒）

/**
 * 轻量级Safari兼容的视频剪切方案
 * 使用视频流捕获并保留音频
 * @param videoFile - 视频文件（File对象）
 * @param maxDuration - 最大时长（秒），默认5秒
 * @returns Promise<File> - 返回截取后的视频文件
 */
const trimVideoLightweight = async (
  videoFile: File,
  maxDuration = 5,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    const targetSeconds = Math.min(
      Math.max(maxDuration, 0),
      MAX_ALLOWED_TRIM_SECONDS,
    );
    const stopAtSeconds = Math.max(
      0,
      targetSeconds - STOP_EARLY_EPSILON_SECONDS,
    );

    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let recordingStartTime = 0;
    let cleanupTimer: NodeJS.Timeout | null = null;
    let hasStartedRecording = false;
    let manualTimeAdvancer: NodeJS.Timeout | null = null;
    let drawRafId: number | null = null;
    let streamRef: MediaStream | null = null;
    // Keep reference of any addEventListener handlers to remove explicitly
    let canplayHandler: ((this: HTMLVideoElement, ev: Event) => any) | null =
      null;

    const cleanup = () => {
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }

      if (manualTimeAdvancer) {
        clearTimeout(manualTimeAdvancer);
        manualTimeAdvancer = null;
      }

      // 停止所有媒体录制并清理 rAF
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          console.warn('停止录制时出错:', e);
        }
      }
      if (drawRafId) {
        cancelAnimationFrame(drawRafId);
        drawRafId = null;
      }

      // 停止所有媒体轨道（包括 video.captureStream/canvas.captureStream 产生的轨道）
      if (streamRef) {
        try {
          streamRef.getTracks().forEach(t => {
            try {
              t.stop();
            } catch {}
          });
        } finally {
          streamRef = null;
        }
      }

      // 释放video URL
      if (video.src && video.src.startsWith('blob:')) {
        URL.revokeObjectURL(video.src);
      }
      // 显式移除所有事件监听
      try {
        if (canplayHandler) {
          video.removeEventListener('canplaythrough', canplayHandler);
          canplayHandler = null;
        }
        // 置空所有直接赋值的监听器
        (video as any).onloadedmetadata = null;
        (video as any).onseeked = null;
        (video as any).oncanplay = null;
        (video as any).onloadeddata = null;
        (video as any).onerror = null;
        if (mediaRecorder) {
          (mediaRecorder as any).ondataavailable = null;
          (mediaRecorder as any).onstop = null;
          (mediaRecorder as any).onerror = null;
        }
      } catch {}

      // 暂停并重置视频
      try {
        video.pause();
        video.currentTime = 0;
        video.src = '';
        video.load();
      } catch (e) {
        console.warn('清理视频时出错:', e);
      }

      // 从DOM中移除video元素
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }

      // 标记清理完成
      hasStartedRecording = false;
    };

    // Safari优化的视频配置
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
    video.preload = 'auto';

    // 完全隐藏video元素
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.visibility = 'hidden';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';

    // Safari特殊属性
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.controls = false;
    video.autoplay = false;

    // 仅在 Safari 下将 <video> 挂到 DOM；其他浏览器保持离屏，避免引发 DOM 节点锯齿式增长
    if (isSafari) {
      document.body.appendChild(video);
    }

    video.onloadedmetadata = async () => {
      try {
        // 检查是否需要剪切
        if (video.duration <= targetSeconds) {
          cleanup();
          resolve(videoFile);
          return;
        }

        console.log(`开始剪切视频: ${video.duration}s -> ${targetSeconds}s`);

        // 等待视频完全加载
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
          canplayHandler = handleVideoReady as any;
          video.addEventListener(
            'canplaythrough',
            canplayHandler as EventListener,
            {
              once: true,
            },
          );
          return;
        }

        await handleVideoReady();
      } catch (error) {
        cleanup();
        reject(new Error(`视频处理失败: ${error}`));
      }
    };

    const handleVideoReady = async () => {
      try {
        // 尝试获取视频流，Safari兼容的方式
        let stream: MediaStream;

        try {
          // 优先尝试video captureStream（保留音频）
          if ((video as any).captureStream) {
            stream = (video as any).captureStream();
            streamRef = stream;
            console.log('使用Video captureStream，保留音频');

            // 验证音频轨道状态
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              // 确保音频轨道启用（用于录制）
              audioTracks.forEach(track => (track.enabled = true));
            }
          } else {
            throw new Error('captureStream不支持');
          }
        } catch (error) {
          console.warn('Video captureStream失败，使用Canvas fallback:', error);

          // Canvas fallback（无音频）
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            cleanup();
            reject(new Error('无法获取Canvas上下文'));
            return;
          }

          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          stream = canvas.captureStream(20);
          streamRef = stream;

          // 启动canvas绘制循环
          const drawFrame = () => {
            if (video.readyState >= video.HAVE_CURRENT_DATA && !video.paused) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            if (
              hasStartedRecording &&
              mediaRecorder &&
              mediaRecorder.state === 'recording'
            ) {
              drawRafId = requestAnimationFrame(drawFrame);
            }
          };

          // 开始绘制循环
          drawRafId = requestAnimationFrame(drawFrame);
        }

        // 选择合适的MIME类型
        let mimeType = 'video/webm';
        const supportedTypes = [
          'video/mp4;codecs=h264,aac',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];

        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            console.log(`使用MIME类型: ${type}`);
            break;
          }
        }

        // 创建MediaRecorder
        try {
          const options: MediaRecorderOptions = {
            mimeType,
            videoBitsPerSecond: 2000000, // 2Mbps
          };

          // 如果有音频轨道，设置音频比特率
          if (stream.getAudioTracks().length > 0) {
            options.audioBitsPerSecond = 128000; // 128kbps
          }

          mediaRecorder = new MediaRecorder(stream, options);
        } catch (error) {
          cleanup();
          reject(new Error('无法创建MediaRecorder'));
          return;
        }

        recordedChunks = [];

        mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (recordedChunks.length === 0) {
            cleanup();
            reject(new Error('没有录制到任何数据'));
            return;
          }

          const blob = new Blob(recordedChunks, { type: mimeType });

          // 确定文件扩展名 - 强制保持MP4
          let extension = '.mp4';
          const originalExtension = videoFile.name
            .split('.')
            .pop()
            ?.toLowerCase();
          if (originalExtension === 'mp4' || originalExtension === 'mov') {
            extension = '.mp4';
          } else if (mimeType.includes('webm')) {
            extension = '.webm';
          }

          const trimmedFile = new File(
            [blob],
            videoFile.name.replace(/\.[^.]+$/, `_trimmed${extension}`),
            { type: mimeType, lastModified: Date.now() },
          );

          console.log(
            `剪切完成: ${trimmedFile.size} bytes, 音频轨道: ${
              stream.getAudioTracks().length > 0 ? '是' : '否'
            }`,
          );
          cleanup();
          resolve(trimmedFile);
        };

        mediaRecorder.onerror = error => {
          console.error('MediaRecorder错误:', error);
          cleanup();
          reject(new Error('录制过程中出现错误'));
        };

        // 确保视频完全准备好
        video.currentTime = 0;

        // 等待视频真正准备好播放
        await new Promise<void>(resolveReady => {
          let readyCheckCount = 0;
          const maxReadyChecks = 20;

          const checkVideoReady = () => {
            readyCheckCount++;

            // 检查视频是否真正准备好
            if (
              video.readyState >= video.HAVE_ENOUGH_DATA &&
              video.videoWidth > 0 &&
              video.videoHeight > 0 &&
              video.currentTime === 0
            ) {
              resolveReady();
              return;
            }

            if (readyCheckCount >= maxReadyChecks) {
              resolveReady();
              return;
            }

            // 继续检查
            setTimeout(checkVideoReady, 100);
          };

          // 开始检查
          checkVideoReady();
        });

        // 开始录制
        mediaRecorder.start(100);
        hasStartedRecording = true;
        // Delay start timestamp until playback is verified to avoid early cutoff
        recordingStartTime = 0;

        // 等待录制真正开始
        await new Promise<void>(resolveStart => {
          const checkRecordingStart = () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              resolveStart();
            } else {
              setTimeout(checkRecordingStart, 50);
            }
          };
          checkRecordingStart();
        });

        // 播放策略：确保视频真正播放
        let playbackStrategy: 'auto' | 'manual' = 'auto';

        // 尝试自动播放
        try {
          await video.play();

          // 验证视频是否真正在播放
          await new Promise<void>(resolvePlayback => {
            let checkCount = 0;
            const maxChecks = 20;
            let lastTime = video.currentTime;

            const verifyPlayback = () => {
              checkCount++;
              const currentTime = video.currentTime;

              // 如果时间在前进，说明真正在播放
              if (currentTime > lastTime && currentTime > 0.1) {
                playbackStrategy = 'auto';
                resolvePlayback();
                return;
              }

              // 如果时间没有前进，尝试手动推进
              if (checkCount > 10 && currentTime === lastTime) {
                playbackStrategy = 'manual';
                resolvePlayback();
                return;
              }

              // 超时处理
              if (checkCount >= maxChecks) {
                playbackStrategy = 'manual';
                resolvePlayback();
                return;
              }

              lastTime = currentTime;
              setTimeout(verifyPlayback, 100);
            };

            // 开始验证
            setTimeout(verifyPlayback, 300);
          });

          // Mark the actual recording start after playback is verified
          if (!recordingStartTime) {
            recordingStartTime = performance.now();
          }
        } catch (playError) {
          console.warn('自动播放失败，使用手动时间推进:', playError);
          playbackStrategy = 'manual';
        }

        // 如果需要手动推进时间
        if (playbackStrategy === 'manual') {
          let manualTime = 0;
          const frameInterval = 1000 / 30; // 30fps

          // Mark start when manual advancement begins
          if (!recordingStartTime) {
            recordingStartTime = performance.now();
          }

          const advanceTime = () => {
            if (
              !hasStartedRecording ||
              !mediaRecorder ||
              mediaRecorder.state !== 'recording'
            ) {
              return;
            }

            manualTime += frameInterval / 1000;

            if (manualTime < stopAtSeconds && manualTime < video.duration) {
              video.currentTime = manualTime;
              manualTimeAdvancer = setTimeout(advanceTime, frameInterval);
            }
          };

          // 开始手动推进
          manualTimeAdvancer = setTimeout(advanceTime, frameInterval);
        }

        // 精确时间控制
        let animationFrameId: number | null = null;

        const checkDuration = () => {
          if (
            !hasStartedRecording ||
            !mediaRecorder ||
            mediaRecorder.state !== 'recording'
          ) {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
            }
            if (manualTimeAdvancer) {
              clearTimeout(manualTimeAdvancer);
            }
            return;
          }

          const elapsedTime = (performance.now() - recordingStartTime) / 1000;

          if (elapsedTime >= stopAtSeconds) {
            hasStartedRecording = false;
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
            }
            if (manualTimeAdvancer) {
              clearTimeout(manualTimeAdvancer);
            }
            mediaRecorder.stop();
            video.pause();
            return;
          }

          // 继续检查
          animationFrameId = requestAnimationFrame(checkDuration);
        };

        // 开始时间检查
        checkDuration();

        // 安全超时
        cleanupTimer = setTimeout(
          () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              hasStartedRecording = false;
              if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
              }
              if (manualTimeAdvancer) {
                clearTimeout(manualTimeAdvancer);
              }
              mediaRecorder.stop();
            }
            video.pause();
          },
          (stopAtSeconds + 0.5) * 1000,
        );
      } catch (error) {
        cleanup();
        reject(new Error(`视频处理失败: ${error}`));
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('视频加载失败'));
    };

    // 设置视频源
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();
  });
};

/**
 * 简化的视频剪切函数 - 专为Safari优化
 * @param videoFile - 视频文件（File对象）
 * @param maxDuration - 最大时长（秒），默认5秒
 * @returns Promise<File> - 返回截取后的视频文件
 */
export const trimVideo = async (
  videoFile: File,
  maxDuration = 5,
): Promise<File> => {
  // 检查客户端环境
  if (!isClient) {
    throw new Error('视频剪切只能在客户端环境中执行');
  }

  try {
    // 首先检查视频时长
    const duration = await getVideoDuration(videoFile);
    const effectiveMaxDuration = Math.min(
      Math.max(maxDuration, 0),
      MAX_ALLOWED_TRIM_SECONDS,
    );

    if (duration <= effectiveMaxDuration) {
      return videoFile;
    }
  } catch (error) {
    console.warn('获取视频时长失败，继续执行剪切:', error);
  }

  // 使用轻量级方案
  try {
    const effectiveMaxDuration = Math.min(
      Math.max(maxDuration, 0),
      MAX_ALLOWED_TRIM_SECONDS,
    );

    const result = await trimVideoLightweight(videoFile, effectiveMaxDuration);

    if (result && result.size > 0) {
      // 剪切后再次校验，确保最终时长 <= 15s（并且不超过调用方要求）
      try {
        const outDur = await getVideoDuration(result);
        if (outDur > effectiveMaxDuration) {
          const retryTarget = Math.max(0, effectiveMaxDuration - 0.2);
          const reResult = await trimVideoLightweight(result, retryTarget);
          return reResult;
        }
      } catch (e) {
        console.warn('获取剪切后视频时长失败，跳过二次裁剪:', e);
      }

      return result;
    } else {
      throw new Error('生成的文件为空或无效');
    }
  } catch (error) {
    console.error('轻量级方案失败:', error);
    // 如果剪切失败，返回原文件而不是抛出错误
    console.warn('剪切失败，返回原始视频文件');
    return videoFile;
  }
};



