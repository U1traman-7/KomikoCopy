import {
  getVideoDuration,
  getImageDimensions,
} from '@/Components/ToolsPage/utils';

export interface FrameExtractionResult {
  frameUrl: string;
  dimensions: { width: number; height: number };
  videoDuration: number;
}

export interface FrameExtractionOptions {
  quality?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Extract first frame from video file
 * @param videoFile - Video file (File object or blob URL)
 * @param quality - Image quality (0-1), default 0.9
 * @returns Promise<string> - Returns base64 image data URL
 */
export const extractVideoFirstFrame = async (
  videoFile: File | string,
  quality: number = 0.9,
): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error(
      'Video frame extraction can only be performed in client environment',
    );
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }

    // Basic configuration
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.volume = 0;

    // Safari compatibility settings
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');

    // iOS Safari optimization: add to DOM to ensure proper loading
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isSafari || isIOS) {
      video.style.position = 'absolute';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.visibility = 'hidden';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);
    }

    let videoUrl: string | null = null;
    let extracted = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const attemptedTimes: number[] = []; // Record attempted time points

    const cleanup = () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    // Function to detect if frame is black
    const isBlackFrame = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
    ): boolean => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let blackPixels = 0;
      const totalPixels = data.length / 4;

      // Sample detection to avoid checking every pixel (performance optimization)
      const sampleRate = Math.max(1, Math.floor(totalPixels / 1000)); // Check at most 1000 pixels

      for (let i = 0; i < data.length; i += 4 * sampleRate) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        // Safari needs stricter black frame detection
        const blackThreshold = isSafari || isIOS ? 20 : 30;
        if (brightness < blackThreshold) {
          blackPixels++;
        }
      }

      const sampledPixels = Math.ceil(totalPixels / sampleRate);
      const blackRatio = blackPixels / sampledPixels;

      // Safari needs stricter black frame judgment
      const blackRatioThreshold = isSafari || isIOS ? 0.85 : 0.9;
      return blackRatio > blackRatioThreshold;
    };

    const extractFrame = () => {
      if (extracted) {
        return;
      }

      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Video dimensions unavailable');
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detect if frame is black
        const isBlack = isBlackFrame(canvas, ctx);
        const currentTime = video.currentTime;

        console.log(
          `Frame at ${currentTime}s: ${isBlack ? 'BLACK' : 'VALID'}, attempted times: [${attemptedTimes.join(', ')}]`,
        );

        if (isBlack) {
          // Record current time point
          if (!attemptedTimes.includes(currentTime)) {
            attemptedTimes.push(currentTime);
          }

          // Safari needs to try multiple time points
          const timePoints =
            isSafari || isIOS ? [0.3, 0.5, 0.8, 1.0, 1.5, 2.0] : [0.5, 1.0];

          // Find next untried time point
          const nextTime = timePoints.find(
            time => !attemptedTimes.includes(time),
          );

          if (nextTime) {
            console.log(`Black frame detected, trying to jump to ${nextTime}s`);
            video.currentTime = nextTime;
            return; // Don't extract this frame, wait for seek event
          }
          // All time points have been tried but still black frames, entire video might be black
          console.warn('All time points are black frames, using current frame');
        }

        const frameDataUrl = canvas.toDataURL('image/jpeg', quality);
        extracted = true;

        cleanup();
        resolve(frameDataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    // Safari/iOS special handling: multiple event listeners and delayed processing
    if (isSafari || isIOS) {
      let loadedDataFired = false;
      let canPlayFired = false;
      let metadataLoaded = false;

      const tryExtractFrame = () => {
        if (!extracted && video.videoWidth > 0 && video.videoHeight > 0) {
          // Safari may need a brief delay to correctly draw
          setTimeout(() => {
            if (!extracted) {
              extractFrame();
            }
          }, 100);
        }
      };

      video.onloadeddata = () => {
        loadedDataFired = true;
        tryExtractFrame();
      };

      video.oncanplay = () => {
        canPlayFired = true;
        tryExtractFrame();
      };

      video.onloadedmetadata = () => {
        metadataLoaded = true;
        // Safari: Force set to 0 and immediately try
        setTimeout(() => {
          if (!extracted && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Safari: Setting currentTime to 0 and extracting');
            video.currentTime = 0;
            // Immediately try to extract, don't wait for seek event
            setTimeout(() => {
              if (!extracted) {
                tryExtractFrame();
              }
            }, 150);
          }
        }, 200);
      };

      // Safari seek event handling
      video.onseeked = () => {
        if (!extracted) {
          console.log(`Safari: Seeked to ${video.currentTime}s`);
          tryExtractFrame();
        }
      };
    } else {
      // Standard browser handling - also changed to start from 0
      video.onloadedmetadata = () => {
        video.currentTime = 0; // Start from 0, let black frame detection decide if offset is needed
      };

      video.onseeked = () => {
        extractFrame();
      };
    }

    video.onerror = e => {
      console.error('Video load error:', e);
      cleanup();
      reject(new Error('Video load failed'));
    };

    // Add timeout protection, Safari may need more time
    timeoutId = setTimeout(
      () => {
        if (!extracted) {
          console.warn('Video frame extraction timeout, attempting fallback');

          // Safari last attempt: Extract directly from current position
          if (
            (isSafari || isIOS) &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            try {
              extractFrame();
              return;
            } catch (e) {
              // Final failure
            }
          }

          cleanup();
          reject(new Error('Video frame extraction timeout'));
        }
      },
      isSafari || isIOS ? 15000 : 10000,
    ); // Safari gives more time

    // Set video source
    if (videoFile instanceof File) {
      videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
    } else {
      video.src = videoFile;
    }

    // Force load
    video.load();

    // Safari additional handling: Ensure video starts loading
    if (isSafari || isIOS) {
      setTimeout(() => {
        if (!extracted && video.readyState < 2) {
          console.warn('Safari video not loading, forcing play attempt');
          video.play().catch(() => {
            // Silent play failure is fine, mainly to trigger load
          });
        }
      }, 1000);
    }
  });
};

/**
 * Extract last frame from video file
 * This is mainly used for NSFW detection (together with the first frame),
 * so the implementation is kept simpler and focuses on grabbing a frame
 * near the end of the video timeline.
 * @param videoFile - Video file (File object or blob URL)
 * @param quality - Image quality (0-1), default 0.9
 * @returns Promise<string> - Returns base64 image data URL
 */
export const extractVideoLastFrame = async (
  videoFile: File | string,
  quality: number = 0.9,
): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error(
      'Video frame extraction can only be performed in client environment',
    );
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }

    // Basic configuration
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.volume = 0;

    // Safari compatibility settings
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');

    // iOS Safari optimization: add to DOM to ensure proper loading
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isSafari || isIOS) {
      video.style.position = 'absolute';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.visibility = 'hidden';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);
    }

    let videoUrl: string | null = null;
    let extracted = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const extractFrame = () => {
      if (extracted) {
        return;
      }

      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Video dimensions unavailable');
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frameDataUrl = canvas.toDataURL('image/jpeg', quality);
        extracted = true;

        cleanup();
        resolve(frameDataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    // Once metadata is loaded, seek near the end of the video
    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      // Try to grab from the last 0.5s; fall back to duration if very short
      let targetTime =
        duration > 0.5 ? duration - 0.5 : Math.max(duration - 0.1, 0);

      // Guard against NaN/Infinity
      if (!isFinite(targetTime) || targetTime < 0) {
        targetTime = 0;
      }

      // If duration is not reliable, just capture the current frame
      if (targetTime === 0) {
        extractFrame();
      } else {
        video.currentTime = targetTime;
      }
    };

    video.onseeked = () => {
      extractFrame();
    };

    video.onerror = e => {
      console.error('Video load error (last frame):', e);
      cleanup();
      reject(new Error('Video load failed'));
    };

    // Timeout protection
    timeoutId = setTimeout(() => {
      if (!extracted) {
        console.warn(
          'Video last-frame extraction timeout, attempting fallback',
        );
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          try {
            extractFrame();
            return;
          } catch {
            // ignore and fall through
          }
        }
        cleanup();
        reject(new Error('Video last frame extraction timeout'));
      }
    }, 12000);

    // Set video source
    if (videoFile instanceof File) {
      videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
    } else {
      video.src = videoFile;
    }

    // Force load
    video.load();

    // Safari additional handling: Ensure video starts loading
    if (isSafari || isIOS) {
      setTimeout(() => {
        if (!extracted && video.readyState < 2) {
          console.warn(
            'Safari video not loading (last frame), forcing play attempt',
          );
          video.play().catch(() => {
            // Silent play failure is fine, mainly to trigger load
          });
        }
      }, 1000);
    }
  });
};

/**
 * Extract first frame from video file and get related information
 * @param videoFile Video file
 * @param options Extraction options
 * @returns Promise<FrameExtractionResult>
 */
export const extractFrameFromVideo = async (
  videoFile: File,
  options: FrameExtractionOptions = {},
): Promise<FrameExtractionResult> => {
  const { quality = 0.9, onProgress } = options;

  try {
    if (typeof window === 'undefined') {
      throw new Error(
        'Frame extraction can only be performed in client environment',
      );
    }

    onProgress?.(25);

    const videoDuration = await getVideoDuration(videoFile);

    onProgress?.(50);

    const extractedFrameUrl = await extractVideoFirstFrame(videoFile, quality);

    onProgress?.(75);

    const frameDimensions = await getImageDimensions(extractedFrameUrl);

    onProgress?.(100);

    return {
      frameUrl: extractedFrameUrl,
      dimensions: frameDimensions,
      videoDuration,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Frame extraction failed';

    throw new Error(errorMessage);
  }
};

/**
 * Validate if video file supports frame extraction
 * @param videoFile Video file
 * @returns boolean
 */
export const isVideoFrameExtractionSupported = (videoFile: File): boolean => {
  const supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/mov',
    'video/avi',
    'video/quicktime',
  ];

  return (
    supportedTypes.includes(videoFile.type) ||
    supportedTypes.some(type =>
      videoFile.name.toLowerCase().includes(type.split('/')[1]),
    )
  );
};

/**
 * Get basic video file information (without extracting frames)
 * @param videoFile Video file
 * @returns Promise<{ duration: number; size: number; type: string; name: string }>
 */
export const getVideoInfo = async (
  videoFile: File,
): Promise<{
  duration: number;
  size: number;
  type: string;
  name: string;
}> => {
  try {
    const duration = await getVideoDuration(videoFile);

    return {
      duration,
      size: videoFile.size,
      type: videoFile.type,
      name: videoFile.name,
    };
  } catch (error) {
    throw new Error(`Failed to get video info: ${error}`);
  }
};

// Export main functions as default export
export default extractVideoFirstFrame;
