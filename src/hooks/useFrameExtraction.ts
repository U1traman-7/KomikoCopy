import { useState, useCallback } from 'react';
import { extractFrameFromVideo, FrameExtractionResult, isVideoFrameExtractionSupported } from '../utilities/video/firstFrameExtractor';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface FrameExtractionState {
  extractedFrame: string | null;
  extractedFrameDimensions: { width: number; height: number } | null;
  originalVideoDuration: number | null;
  isExtracting: boolean;
  extractionProgress: number;
  extractionError: string | null;
  frameHeight: number;
  frameWidth: number;
}

export interface UseFrameExtractionOptions {
  quality?: number;
  showToasts?: boolean;
}

export const useFrameExtraction = (options: UseFrameExtractionOptions = {}) => {
  const { quality = 0.9, showToasts = true } = options;
  const { t } = useTranslation(['video-to-video', 'toast']);

  const [state, setState] = useState<FrameExtractionState>({
    extractedFrame: null,
    extractedFrameDimensions: null,
    originalVideoDuration: null,
    isExtracting: false,
    extractionProgress: 0,
    extractionError: null,
    frameHeight: 0,
    frameWidth: 0,
  });

  const resetState = useCallback(() => {
    setState({
      extractedFrame: null,
      extractedFrameDimensions: null,
      originalVideoDuration: null,
      isExtracting: false,
      extractionProgress: 0,
      extractionError: null,
      frameWidth: 0,
      frameHeight: 0,
    });
  }, []);

  const extractFrame = useCallback(
    async (videoFile: File): Promise<FrameExtractionResult | null> => {
      // 验证文件支持性
      if (!isVideoFrameExtractionSupported(videoFile)) {
        const errorMessage = 'Unsupported video format for frame extraction';
        setState(prev => ({ ...prev, extractionError: errorMessage }));

        if (showToasts) {
          toast.error(errorMessage, {
            position: 'top-center',
            duration: 4000,
          });
        }
        return null;
      }

      // 重置错误状态并开始提取
      setState(prev => ({
        ...prev,
        isExtracting: true,
        extractionProgress: 0,
        extractionError: null,
      }));

      try {
        const result = await extractFrameFromVideo(videoFile, {
          quality,
          onProgress: progress => {
            setState(prev => ({ ...prev, extractionProgress: progress }));
          },
        });

        // 更新状态
        setState(prev => ({
          ...prev,
          extractedFrame: result.frameUrl,
          extractedFrameDimensions: result.dimensions,
          originalVideoDuration: result.videoDuration,
          isExtracting: false,
          extractionProgress: 100,
          frameWidth: result.dimensions?.width || 0,
          frameHeight: result.dimensions?.height || 0,
        }));

        if (showToasts) {
          toast.success(t('toast:video.styleTransfer.frameExtracted'), {
            position: 'top-center',
            duration: 3000,
          });
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Frame extraction failed';

        setState(prev => ({
          ...prev,
          extractionError: errorMessage,
          isExtracting: false,
        }));

        if (showToasts) {
          toast.error(errorMessage, {
            position: 'top-center',
            duration: 4000,
          });
        }

        return null;
      }
    },
    [quality, showToasts, t],
  );

  const clearExtractedFrame = useCallback(() => {
    setState(prev => ({
      ...prev,
      extractedFrame: null,
      extractedFrameDimensions: null,
      frameWidth: 0,
      frameHeight: 0,
    }));
  }, []);

  const setExtractedFrame = useCallback(
    (frameUrl: string, dimensions?: { width: number; height: number }) => {
      setState(prev => ({
        ...prev,
        frameWidth: dimensions?.width || 0,
        frameHeight: dimensions?.height || 0,
        extractedFrame: frameUrl,
        extractedFrameDimensions: dimensions || prev.extractedFrameDimensions,
      }));
    },
    [],
  );

  return {
    // 状态
    ...state,

    // 操作方法
    extractFrame,
    resetState,
    clearExtractedFrame,
    setExtractedFrame,
    // 计算属性
    hasExtractedFrame: !!state.extractedFrame,
    canExtractFrame: !state.isExtracting,
  };
}; 