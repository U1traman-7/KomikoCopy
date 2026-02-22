import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { MdAccessTime } from 'react-icons/md';
import {
  ImageToVideoModel,
  calculateTextToVideoCost,
  calculateImageToAnimationCost,
  TextToVideoModel,
  TextToVideoStyle,
} from '../../../api/tools/_zaps';
import { createModelOptions } from '../VideoGeneration/config/modelOptions';
import {
  getModelConfig,
  VideoDuration,
} from '../VideoGeneration/config/modelConfig';
import { useFilteredModelOptions } from '../VideoGeneration/hooks/useFilteredModelOptions';
import { aspectRatioIconMap } from '../VideoGeneration/constants/aspectRatioIcons';
import { authAtom, profileAtom, loginModalAtom } from '../../state';
import { uploadImageToFal } from '../../utilities/fal';
import type { VideoReferenceItem } from './VideoReferenceModal';

export function useQuickCreateVideo() {
  const router = useRouter();
  const { t: tVideo } = useTranslation('image-animation-generator');
  const { t: tVideoUi } = useTranslation('image-animation-generator', {
    keyPrefix: 'ui',
  });
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const loginModal = useAtomValue(loginModalAtom);

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [selectedVideoModel, setSelectedVideoModel] =
    useState<ImageToVideoModel>(ImageToVideoModel.VIDU);
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('16:9');
  const [videoStyle, setVideoStyle] = useState<TextToVideoStyle>(
    TextToVideoStyle.MODERN_ANIME,
  );
  const [videoReferenceImages, setVideoReferenceImages] = useState<
    VideoReferenceItem[]
  >([]);
  const [videoEndFrameImage, setVideoEndFrameImage] = useState<string>('');
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [isVideoReferenceModalOpen, setIsVideoReferenceModalOpen] =
    useState(false);

  // Popover states
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] = useState(false);
  const [isAspectPopoverOpen, setIsAspectPopoverOpen] = useState(false);

  // Get video model options and config
  const allVideoModelOptions = useMemo(
    () => createModelOptions(tVideoUi),
    [tVideoUi],
  );
  const videoConfig = useMemo(
    () => getModelConfig(selectedVideoModel),
    [selectedVideoModel],
  );

  // Use shared hook for filtered model options
  const { filteredModelOptions: videoModelOptions } = useFilteredModelOptions({
    allModelOptions: allVideoModelOptions,
    referenceImages: videoReferenceImages,
    endFrameImage: videoEndFrameImage,
    selectedModel: selectedVideoModel,
    onModelChange: setSelectedVideoModel,
  });

  const videoDurationOptions = useMemo(
    () =>
      (videoConfig.durationOptions || [5]).map(d => ({
        key: String(d),
        label: `${d}s`,
        icon: <MdAccessTime className='w-4 h-4' />,
      })),
    [videoConfig.durationOptions],
  );

  const videoAspectRatioOptions = useMemo(
    () =>
      (videoConfig.aspectRatioOptions || ['16:9', '9:16']).map(r => ({
        key: r,
        label: r,
        icon: aspectRatioIconMap[r],
      })),
    [videoConfig.aspectRatioOptions],
  );

  // Reset duration when model changes and current duration is not available
  useEffect(() => {
    const availableDurations = videoConfig.durationOptions || [5];
    if (!availableDurations.includes(videoDuration)) {
      setVideoDuration((videoConfig.defaultDuration || 5) as VideoDuration);
    }
    const availableRatios: string[] = videoConfig.aspectRatioOptions || [
      '16:9',
      '9:16',
    ];
    if (!availableRatios.includes(videoAspectRatio)) {
      setVideoAspectRatio(videoConfig.defaultAspectRatio || '16:9');
    }
  }, [selectedVideoModel, videoConfig]);

  // Calculate video generation cost
  const videoCost = useMemo(() => {
    const supportedAspectRatio = [
      '21:9',
      '16:9',
      '4:3',
      '1:1',
      '3:4',
      '9:16',
    ].includes(videoAspectRatio)
      ? (videoAspectRatio as '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16')
      : '16:9';

    if (videoReferenceImages.length > 0) {
      return calculateImageToAnimationCost(
        selectedVideoModel,
        String(videoDuration) as any,
        '480p',
        supportedAspectRatio,
      );
    }

    return calculateTextToVideoCost(
      videoConfig.textToVideoFallback || TextToVideoModel.VIDU,
      String(videoDuration) as any,
      '480p',
      supportedAspectRatio,
    );
  }, [
    videoConfig.textToVideoFallback,
    videoDuration,
    videoAspectRatio,
    videoReferenceImages.length,
    selectedVideoModel,
  ]);

  const handleVideoGenerate = async () => {
    if (!isAuth || !profile?.id) {
      loginModal?.onOpen?.();
      return;
    }

    setVideoGenerating(true);

    try {
      const query: Record<string, string> = {
        prompt: videoPrompt,
        model: String(selectedVideoModel),
        duration: String(videoDuration),
        aspectRatio: videoAspectRatio,
        style: String(videoStyle),
      };

      if (videoReferenceImages.length > 0 || videoEndFrameImage) {
        const imagesWithFalUrls = await Promise.all(
          videoReferenceImages.map(async img => {
            if (
              !img.previewUrl.startsWith('blob:') &&
              !img.previewUrl.startsWith('data:')
            ) {
              return { id: img.id, url: img.previewUrl, name: img.name };
            }
            const falUrl = await uploadImageToFal(img.previewUrl, profile?.id);
            return { id: img.id, url: falUrl, name: img.name };
          }),
        );

        sessionStorage.setItem(
          'quickCreate_videoReferenceImages',
          JSON.stringify(imagesWithFalUrls),
        );
        query.hasReferenceImages = 'true';

        if (videoEndFrameImage) {
          let endFrameUrl = videoEndFrameImage;
          if (
            videoEndFrameImage.startsWith('blob:') ||
            videoEndFrameImage.startsWith('data:')
          ) {
            endFrameUrl = await uploadImageToFal(
              videoEndFrameImage,
              profile?.id,
            );
          }
          sessionStorage.setItem('quickCreate_videoEndFrameImage', endFrameUrl);
          query.hasEndFrameImage = 'true';
        }
      }

      query.autoGenerate = 'true';

      router.push({
        pathname: '/image-animation-generator',
        query,
      });
    } finally {
      setVideoGenerating(false);
    }
  };

  return {
    // State
    videoPrompt,
    setVideoPrompt,
    selectedVideoModel,
    setSelectedVideoModel,
    videoDuration,
    setVideoDuration,
    videoAspectRatio,
    setVideoAspectRatio,
    videoStyle,
    setVideoStyle,
    videoReferenceImages,
    setVideoReferenceImages,
    videoEndFrameImage,
    setVideoEndFrameImage,
    videoGenerating,
    isVideoReferenceModalOpen,
    setIsVideoReferenceModalOpen,

    // Popover states
    isStylePopoverOpen,
    setIsStylePopoverOpen,
    isDurationPopoverOpen,
    setIsDurationPopoverOpen,
    isAspectPopoverOpen,
    setIsAspectPopoverOpen,

    // Options and config
    videoConfig,
    videoModelOptions,
    videoDurationOptions,
    videoAspectRatioOptions,
    videoCost,

    // Translation
    tVideo,

    // Profile
    profile,

    // Actions
    handleVideoGenerate,
  };
}

export default useQuickCreateVideo;
