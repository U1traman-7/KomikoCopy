/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Progress,
  Tabs,
  Tab,
  Textarea,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  Chip,
  Switch,
  Slider,
} from '@nextui-org/react';
import { FaDownload, FaVideo } from 'react-icons/fa';
import { BsInfoCircleFill, BsExclamationTriangle } from 'react-icons/bs';
import {
  MdOutlineAnimation,
  MdDashboard,
  MdEdit,
  MdImage,
  MdSync,
  MdVideoLibrary,
  MdPalette,
  MdBolt,
} from 'react-icons/md';
import { Zap, UserRound, UserSquare } from 'lucide-react';
import { IconQuestionMark } from '@tabler/icons-react';
import StyleTemplatesPicker, {
  StyleTemplatesPickerRef,
} from '../StyleTemplatePicker';
import {
  getI2iStyleNameKeyMappingSync,
  useI2iStyleTemplates,
} from '../StyleTemplatePicker/styles/index';
import { BiErrorCircle, BiSolidZap } from 'react-icons/bi';
import { BsInfoCircle } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import UploadFile from '../UploadFile';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import {
  VideoData,
  deleteMediaData,
  cropReferenceToMatchFrame,
  getVideoDuration,
} from './utils';
import { uploadImageToFal, uploadVideoToFal } from '../../utilities/fal';
import { trimVideo } from '../../utilities/video';
import { useTranslation } from 'react-i18next';
import {
  calculateStyleTransferCost,
  calculateVideoToVideoGenerationCost,
  VideoToVideoModel,
  VIDEO_TO_VIDEO_GENERATION_PER_SECOND,
} from '../../../api/tools/_zaps';
import { useProcessInitialImage } from '../../hooks/useProcessInitialImage';
import { useOpenModal } from 'hooks/useOpenModal';
import { useFrameExtraction } from '../../hooks/useFrameExtraction';
import { FrameExtractionResult } from '../../utilities/video/firstFrameExtractor';
import { useBrowserDetection } from '../../hooks/useBrowserDetection';
import { VideoToolsTabs } from './VideoToolsTabs';
import { useVideos } from 'hooks/useVideos';
import { ModelIds, GenerationStatus } from '../../../api/_constants';
import { isNil } from 'lodash-es';
import FramePreview from '../VideoToVideo/FramePreview';
import LazyRender from '../common/LazyRender';
import { presetPrompts } from '../StyleTemplatePicker/styles/index';

import { DurationSelector } from '../VideoToVideo/DurationSelector';
import { safeCapture, trackError } from '../../utilities/analytics';
import { fetchProfile as fetchProfileApi } from '../../api/profile';

import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import KoModelSelect, { KoModelOption } from '../KoSelect/KoModelSelect';
import { compressImage } from '../ImageUploader';
import { GEMINI_LIMITS } from '../../../api/_constants';
import { recordStyleUsage } from '../../utils/styleUsageStats';

const RAYFLASH_MAX_DURATION = 15;
const ACT_TWO_MAX_DURATION = 30;
const ACT_TWO_MIN_DURATION = 3;

type VideoApiParams = {
  method: 'getVideos' | 'generateVideo' | 'deleteVideo';
  video_url?: string;
  id?: number;
  prompt?: string;
};

interface VideosResponse {
  data: VideoData[];
}

const videosAPI = async (params: VideoApiParams): Promise<VideosResponse> => {
  const response = await fetch('/api/tools/video-to-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  const data = await response.json();
  return data;
};

interface VideoToVideoState {
  uploadedVideo: File | null;
  styledFrame: string | null;
  finalVideo: string | null;
  error: string | null;
}

interface VideoToVideoConvertProps {
  defaultStyle?: string;
  exampleVideo?: string;
  defaultModel?: VideoToVideoModel;
}

export default function VideoToVideoConvert({
  defaultStyle,
  exampleVideo,
  defaultModel,
}: VideoToVideoConvertProps = {}) {
  const { t } = useTranslation([
    'video-to-video',
    'common',
    'toast',
    'style-templates',
  ]);

  const { submit: openModal } = useOpenModal();
  const router = useRouter();
  const videoRefs = useRef<any>({});
  const clearRouterParam = useCallback(
    (key: string) => {
      if (!router.isReady || !(key in router.query)) return;
      const newQuery = { ...router.query } as Record<string, any>;
      delete newQuery[key];
      router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const isAuth = useAtomValue(authAtom);
  const videoGenerationSectionRef = useRef<HTMLDivElement>(null);
  const styleSelectionSectionRef = useRef<HTMLDivElement>(null);
  const generatedResultSectionRef = useRef<HTMLDivElement>(null);
  const framePreviewRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const styleTemplatesPickerRef = useRef<StyleTemplatesPickerRef>(null);

  // Track if user already has a preset style (from Create Yours or variant page)
  const hasPresetStyleRef = useRef(defaultStyle ? true : false);

  const [profile, setProfile] = useAtom(profileAtom);

  const [isClientMounted, setIsClientMounted] = useState(false);

  const { isSafari, isClient } = useBrowserDetection();
  const leftSideRef = useRef<HTMLDivElement>(null);

  const { inputImage: videoInput } = useProcessInitialImage();
  const [isGeneratingStyleFrame, setIsGeneratingStyleFrame] = useState(false);

  const scrollToElement = (element: HTMLElement | null, offset: number = 0) => {
    if (!element) {
      return;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      const findScrollContainer = (el: HTMLElement): HTMLElement | null => {
        let parent = el.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          const overflowY = style.overflowY;
          const isScrollable =
            (overflowY === 'scroll' || overflowY === 'auto') &&
            parent.scrollHeight > parent.clientHeight;

          if (isScrollable) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };

      const scrollContainer = findScrollContainer(element);

      if (scrollContainer) {
        // 滚动容器
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        const targetScrollTop =
          scrollContainer.scrollTop + (elRect.top - containerRect.top) - offset;

        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    } else {
      // 桌面端：滚动左侧容器
      if (leftScrollRef.current) {
        const containerRect = leftScrollRef.current.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        const top =
          leftScrollRef.current.scrollTop +
          (elRect.top - containerRect.top) -
          offset;
        leftScrollRef.current.scrollTo({
          top: Math.max(0, top),
          behavior: 'smooth',
        });
      }
    }
  };

  const formatPrompt = (task: any) => {
    try {
      // console.log('resultVideos', task.meta_data);
      if (task.prompt) {
        return task.prompt;
      } else {
        const meta_data = JSON.parse(task.meta_data || '{}');
        return meta_data.style_prompt || meta_data.prompt_will_show;
      }
    } catch (e) {
      return task.prompt;
    }
  };

  const { resultVideos, setResultVideos, addTaskId, submitTask } = useVideos(
    'video-to-video',
    exampleVideo ||
      'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/examples/video-to-video/v2v-launch.webm',
    { formatPrompt },
  );
  useEffect(() => {
    if (!router.isReady) return;

    const effectParam = router.query.effect;
    const styleParam =
      typeof effectParam === 'string' && effectParam.length > 0
        ? effectParam
        : typeof router.query.style === 'string'
          ? router.query.style
          : undefined;

    if (styleParam) {
      setStyleMode('template');
      setSelectedStyle(styleParam);
      hasPresetStyleRef.current = true;
      if (effectParam) {
        clearRouterParam('effect');
      } else {
        clearRouterParam('style');
      }
    }
  }, [router.isReady, router.query.style, router.query.effect]);

  // Scroll helper for right-side results container
  const scrollResultsToTop = () => {
    const el = resultsScrollRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      el.scrollTop = 0;
    }
  };

  // If a new generating item appears at the top (or status changes to generating), auto-scroll to top
  const prevTopRef = useRef<{
    id: number | string;
    status?: number | boolean;
  } | null>(null);
  useEffect(() => {
    if (!resultVideos || resultVideos.length === 0) return;

    const top = resultVideos[0];
    const prev = prevTopRef.current;

    // 只在真正需要时才滚动：新任务开始生成
    const isNewGeneratingTask =
      !prev || (prev.id !== top.id && (top as any).status === 1);

    if (isNewGeneratingTask) {
      // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
      requestAnimationFrame(() => {
        scrollResultsToTop();
      });

      prevTopRef.current = { id: top.id as any, status: (top as any).status };
    } else if (
      prev &&
      prev.id === top.id &&
      prev.status !== (top as any).status
    ) {
      // 只更新引用，不滚动
      prevTopRef.current = { id: top.id as any, status: (top as any).status };
    }
  }, [resultVideos.length, resultVideos[0]?.id, resultVideos[0]?.status]); // 更精确的依赖

  // 使用新的帧提取hook
  const {
    extractedFrame,
    frameWidth,
    frameHeight,
    extractedFrameDimensions,
    originalVideoDuration,
    extractionProgress,
    extractFrame,
    resetState: resetFrameState,
  } = useFrameExtraction({ quality: 0.9, showToasts: true });

  const [state, setState] = useState<VideoToVideoState>({
    uploadedVideo: null,
    styledFrame: null,
    finalVideo: null,
    error: null,
  });

  const [styleMode, setStyleMode] = useState<'template' | 'prompt' | 'upload'>(
    'template',
  );
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle || '');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(3); // Default to 3 seconds
  const [selectedModel, setSelectedModel] = useState<VideoToVideoModel>(
    defaultModel ?? 'wanAnimate',
  );
  const [isPublic, setIsPublic] = useState(true);
  const [savedStyle, setSavedStyle] = useState(defaultStyle || ''); // 用于meta_data
  const [disableV2vGeneral, setDisableV2vGeneral] = useState(false);
  const [disableActTwo, setDisableActTwo] = useState(false);
  const [maxDuration, setMaxDuration] = useState(15);

  // 使用优化的模板数据管理 Hook
  const {
    templates: i2iStyleTemplatesCategories,
    isLoading: templatesLoading,
    error: templatesError,
  } = useI2iStyleTemplates();

  // Map between UI alias and backend ModelIds for video-to-video
  const toModelId = (
    m: VideoToVideoModel,
  ): (typeof ModelIds)[keyof typeof ModelIds] => {
    switch (m) {
      case 'rayFlash':
        return ModelIds.RAY2_FLASH_MODIFY;
      case 'actTwo':
        return ModelIds.ACT_TWO;
      case 'aleph':
        return ModelIds.ALEPH;
      case 'wan':
        // Not currently exposed in UI; map to Story Engine Wan V2V if used later
        return ModelIds.SE_WAN as any;
      case 'wanAnimate':
        return ModelIds.WAN_ANIMATE;
      default:
        return ModelIds.ACT_TWO;
    }
  };

  type AspectEnum = '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9';
  type AspectOrAuto = AspectEnum | 'auto';
  const ACT_TWO_MAP: Record<AspectEnum, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '1:1': '960:960',
    '4:3': '1104:832',
    '3:4': '832:1104',
    '21:9': '1584:672',
  };
  const [actTwoRatio, setActTwoRatio] = useState<AspectOrAuto>('auto');

  // Normalize WH to nearest aspect enum
  const normalizeAspectFromWH = (w?: number, h?: number): AspectEnum => {
    if (!w || !h) return '16:9';
    const r = w / h;
    const table: Record<AspectEnum, number> = {
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4,
      '1:1': 1,
      '21:9': 21 / 9,
    };
    let best: AspectEnum = '16:9';
    let min = Infinity;
    (Object.keys(table) as AspectEnum[]).forEach(k => {
      const diff = Math.abs(table[k] - r);
      if (diff < min) {
        min = diff;
        best = k;
      }
    });
    return best;
  };

  // Auto select when dimensions known
  useEffect(() => {
    if (!extractedFrameDimensions) return;
    const aspect = normalizeAspectFromWH(
      extractedFrameDimensions.width,
      extractedFrameDimensions.height,
    );
    setActTwoRatio(prev => (prev === 'auto' ? (aspect as AspectOrAuto) : prev));
  }, [extractedFrameDimensions?.width, extractedFrameDimensions?.height]);

  const selectedStyleName = React.useMemo(() => {
    if (!selectedStyle) return '';
    return t(
      'style-templates:' + getI2iStyleNameKeyMappingSync()[selectedStyle] || '',
    );
  }, [selectedStyle, t]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get model
        const model = generation.model;
        if (model) {
          switch (model) {
            case 'V2V Basis':
              setSelectedModel('rayFlash');
              break;
            case 'Wan Animate':
              setSelectedModel('wanAnimate');
              break;
            case 'V2V General':
              setSelectedModel('rayFlash');
              break;
            case 'V2V Human Video':
              setSelectedModel('actTwo');
              break;
            case 'V2V Pro':
              setSelectedModel('wanAnimate');
              break;
            default:
              setSelectedModel('wanAnimate');
              break;
          }
        }

        // get meta data
        const prompt = generation.prompt;
        if (generation.meta_data) {
          // get style
          const styleId = generation.meta_data.style_id;
          if (styleId) {
            setStyleMode('template');
            setSelectedStyle(styleId);
            // Mark that user has preset style from Create Yours
            hasPresetStyleRef.current = true;
          }

          // get custom style prompt
          const stylePrompt = generation.meta_data?.style_prompt;
          if (stylePrompt) {
            setStyleMode('prompt');
            setCustomStylePrompt(stylePrompt);
          }
        }

        if (prompt) {
          let currentStyleName = '';
          const styleIdFromGen = generation.meta_data?.style_id;
          if (styleIdFromGen) {
            currentStyleName = t(
              'style-templates:' +
                getI2iStyleNameKeyMappingSync()[styleIdFromGen] || '',
            );
          }

          // 只有当prompt与当前样式名称不同时才设置
          if (prompt !== currentStyleName) {
            setVideoPrompt(prompt);
          }
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  // Open StyleTemplatePicker modal on page load when in template mode (only if no preset style)
  useEffect(() => {
    if (styleMode === 'template' && !hasPresetStyleRef.current) {
      setTimeout(() => {
        styleTemplatesPickerRef.current?.onOpen();
      }, 0);
    }
  }, []);

  const applyButtonText = React.useMemo(() => {
    if (isGeneratingStyleFrame) return t('ui.buttons.applying');
    const hasStyled = !!state.styledFrame;
    if (styleMode === 'upload') {
      return hasStyled
        ? t('ui.buttons.useNewReference')
        : t('ui.buttons.useReference');
    }
    if (styleMode === 'template' && selectedStyleName) {
      return hasStyled
        ? t('ui.buttons.applyNewStyleWithName', { style: selectedStyleName })
        : t('ui.buttons.applyStyleWithName', {
            style: selectedStyleName,
          });
    }
    return hasStyled
      ? t('ui.buttons.applyNewStyle')
      : t('ui.buttons.applyStyle');
  }, [
    isGeneratingStyleFrame,
    state.styledFrame,
    styleMode,
    selectedStyleName,
    t,
  ]);

  // Reusable model options for KoModelSelect
  const v2vModelOptions: KoModelOption[] = React.useMemo(() => {
    return [
      {
        value: 'wanAnimate',
        name: t('ui.model.options.wanAnimate'),
        iconEl: <UserSquare className='w-6 h-6 md:w-7 md:h-7 text-muted-foreground' />,
        dollars:
          VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimate +
          ' ' +
          t('ui.model.zapsPerSecond'),
        description: t('ui.model.descriptions.wanAnimate'),
      },
      // {
      //   value: 'actTwo',
      //   name: t('ui.model.options.v2vHuman'),
      //   iconEl: <UserRound className='w-6 h-6 md:w-7 md:h-7 text-muted-foreground' />,
      //   dollars:
      //     VIDEO_TO_VIDEO_GENERATION_PER_SECOND.actTwo +
      //     ' ' +
      //     t('ui.model.zapsPerSecond'),
      //   description: t('ui.model.descriptions.v2vHuman'),
      //   disabled: disableActTwo,
      //   minDuration: ACT_TWO_MIN_DURATION,
      //   maxDuration: ACT_TWO_MAX_DURATION,
      // },
      {
        value: 'rayFlash',
        name: t('ui.model.options.v2vGeneral'),
        iconEl: <Zap className='w-6 h-6 md:w-7 md:h-7 text-muted-foreground' />,
        dollars:
          VIDEO_TO_VIDEO_GENERATION_PER_SECOND.rayFlash +
          ' ' +
          t('ui.model.zapsPerSecond'),
        description: t('ui.model.descriptions.v2vGeneral'),
        disabled: disableV2vGeneral,
        maxDuration: RAYFLASH_MAX_DURATION,
      },
      // {
      //   value: 'aleph',
      //   name: t('ui.model.options.aleph'),
      //   iconEl: <ThumbsUp className='w-6 h-6 md:w-7 md:h-7 text-muted-foreground' />,
      //   dollars:
      //     VIDEO_TO_VIDEO_GENERATION_PER_SECOND.aleph +
      //     ' ' +
      //     t('ui.model.zapsPerSecond'),
      //   description: t('ui.model.descriptions.aleph'),
      // },
    ];
  }, [t, disableActTwo, disableV2vGeneral]);

  // Add video prompt state
  const [videoPrompt, setVideoPrompt] = useState(''); // Optional prompt for video generation
  const hasSelectedTemplateStyle = !!selectedStyle && styleMode === 'template';

  // Add cost calculation states
  const [styleTransferCost, setStyleTransferCost] = useState(0);
  const [videoGenerationCost, setVideoGenerationCost] = useState(
    calculateVideoToVideoGenerationCost(selectedModel, 3),
  );

  const [totalCost, setTotalCost] = useState(0);

  // Update profile state helper
  const updateProfile = async () => {
    try {
      const latest = await fetchProfileApi();
      if (!(latest as any)?.error) {
        setProfile(prev => ({
          ...prev,
          credit: (latest as any)?.credit ?? prev.credit,
        }));
      }
    } catch (error) {
      console.warn('Failed to update profile:', error);
    }
  };

  useEffect(() => {
    if (extractedFrame) {
      const costMode = styleMode === 'prompt' ? 'custom' : styleMode;

      // Check if selected style uses Pro model (similar to PhotoToAnimeConvert)
      let isProModel = false;
      if (i2iStyleTemplatesCategories && styleMode === 'template') {
        for (const cat of i2iStyleTemplatesCategories) {
          const tpl = cat.templates.find((t: any) => t.id === selectedStyle);
          if (tpl && (tpl as any).isProModel) {
            isProModel = true;
            break;
          }
        }
      }

      const model = isProModel ? 'gemini-3-pro-image-preview' : undefined;
      const cost = calculateStyleTransferCost(
        costMode,
        'video-to-video',
        model,
      );
      setStyleTransferCost(cost);
    } else {
      setStyleTransferCost(0);
    }
  }, [styleMode, extractedFrame, selectedStyle, i2iStyleTemplatesCategories]);

  useEffect(() => {
    const total = styleTransferCost + videoGenerationCost;
    setTotalCost(total);
  }, [styleTransferCost, videoGenerationCost]);

  useEffect(() => {
    setVideoGenerationCost(
      calculateVideoToVideoGenerationCost(selectedModel, selectedDuration),
    );

    selectedDuration > RAYFLASH_MAX_DURATION
      ? setDisableV2vGeneral(true)
      : setDisableV2vGeneral(false);
  }, [selectedDuration, selectedModel]);

  useEffect(() => {
    // Safari用户跳过自动设置，因为会通过后端API获取
    if (isSafari) return;

    if (originalVideoDuration && originalVideoDuration > 0) {
      if (originalVideoDuration < 3) {
        setSelectedDuration(originalVideoDuration);
      } else {
        setSelectedDuration(3);
      }
      // 现在默认选3s
      // else if (originalVideoDuration >= 5 && originalVideoDuration <= 15) {
      //   // For videos between 5-15 seconds, use floor value (5.1s -> 5s, 6.8s -> 6s, etc.)
      //   const floorDuration = Math.floor(originalVideoDuration);
      //   setSelectedDuration(floorDuration);
      // } else {
      //   const availableOptions = [3, 5, 10, 15];
      //   const suitableOption =
      //     availableOptions.find(
      //       option =>
      //         originalVideoDuration !== undefined &&
      //         option <= originalVideoDuration,
      //     ) || availableOptions[0];
      //   setSelectedDuration(suitableOption);
      // }
    }
  }, [originalVideoDuration, isSafari]);

  // 确保只在客户端执行
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Auto-handle video input when it changes (similar to VideoUpscale)
  useEffect(() => {
    if (videoInput && isClientMounted) {
      handleVideoUpload(videoInput);
    }
  }, [videoInput, isClientMounted]);

  const handleVideoUpload = async (url: string) => {
    setDisableActTwo(false);
    setDisableV2vGeneral(false);

    try {
      // 追踪视频上传开始
      // safeCapture('video_to_video_upload_start', {
      //   url: url,
      //   component: 'VideoToVideoConvert',
      //   step: 'fetch_video_url',
      // });

      // Convert URL to File object for compatibility
      const response = await fetch(url);

      // 检查响应是否成功
      if (!response.ok) {
        const error = new Error(
          `Failed to fetch video: ${response.status} ${response.statusText}`,
        );
        throw error;
      }

      const blob = await response.blob();

      // 验证blob是否为视频格式
      if (!blob.type.startsWith('video/')) {
        throw new Error(
          `Invalid file type: ${blob.type}. Expected video format.`,
        );
      }

      const originalFile = new File([blob], 'uploaded-video.mp4', {
        type: blob.type || 'video/mp4',
      });

      // 重置帧提取状态
      resetFrameState();

      // 清除缓存（新视频上传时）

      setState(prev => ({
        ...prev,
        uploadedVideo: originalFile,
      }));

      // Safari特殊处理：给视频文件一些时间来完全加载到内存，并提前检查时长
      if (isSafari) {
        await new Promise(resolve => setTimeout(resolve, 500));

        let duration = 0;

        try {
          duration = await getVideoDuration(originalFile);
        } catch (durationError) {
          toast.error(
            t('toast:video.styleTransfer.safariDurationCheckFailed'),
            {
              position: 'top-center',
              duration: 4000,
            },
          );
        }

        if (duration) {
          setSelectedDuration(duration);
        }
      }

      // 开始提取首帧，增加重试机制
      let extractResult: FrameExtractionResult | null = null;
      let retryCount = 0;
      const maxRetries = isSafari ? 3 : 1;

      while (!extractResult && retryCount < maxRetries) {
        try {
          extractResult = await extractFrame(originalFile);

          if (!extractResult) {
            throw new Error(
              t('toast:video.styleTransfer.frameExtractionEmpty'),
            );
          }

          break;
        } catch (error) {
          retryCount++;
          console.warn(`Frame extraction attempt ${retryCount} failed:`, error);

          if (retryCount < maxRetries) {
            // Safari waits longer before retrying
            const waitTime = isSafari ? 1000 * retryCount : 500;
            await new Promise(resolve => setTimeout(resolve, waitTime));

            toast.error(
              t('toast:video.styleTransfer.retryingFrameExtraction', {
                attempt: retryCount + 1,
              }),
              {
                position: 'top-center',
                duration: 2000,
              },
            );
          } else {
            throw error;
          }
        }
      }

      if (extractResult) {
        setVideoGenerationCost(
          calculateVideoToVideoGenerationCost(selectedModel, selectedDuration),
        );

        // // size in mb
        // console.log('originalFile.size', originalFile.size / 1024 / 1024);
        // // 如果视频文件 > 20MB, 禁用actTwo
        // if (originalFile.size > ACT_TWO_MAX_SIZE * 1024 * 1024) {
        //   if (selectedModel !== 'wanAnimate') {
        //     setSelectedModel('wanAnimate');
        //   }
        // }

        if (extractResult.videoDuration) {
          if (extractResult.videoDuration < ACT_TWO_MIN_DURATION) {
            if (selectedModel === 'actTwo') {
              setSelectedModel('wanAnimate');
            }
            setDisableActTwo(true);
          }
          if (selectedModel === 'wanAnimate') {
            setMaxDuration(extractResult.videoDuration);
          }
        }

        // 上传并提取帧完成后，滚动到样式选择区域
        setTimeout(() => {
          scrollToElement(
            styleSelectionSectionRef.current,
            window.innerWidth < 768 ? 80 : 0,
          );
        }, 100);
      } else {
        throw new Error(
          t('toast:video.styleTransfer.frameExtractionAllRetries'),
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('toast:common.processingFailed');

      let errorSource = 'unknown';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch video:')) {
          errorSource = 'http_response_error';
        } else if (
          error.message === 'Failed to fetch' ||
          error.name === 'TypeError'
        ) {
          errorSource = 'network_fetch_error';
        } else if (error.message.includes('Invalid file type')) {
          errorSource = 'file_type_validation';
        } else if (error.message.includes('timeout')) {
          errorSource = 'timeout_error';
        }
      }

      // trackError(error, {
      //   source: 'VideoToVideoConvert',
      //   step: 'handle_video_upload',
      //   additionalData: {
      //     error_source: errorSource,
      //     is_safari: isSafari,
      //     url: url,
      //   },
      // });
      if (errorMessage) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      }
      // Special error tips for Safari
      if (isSafari && errorMessage.includes('timeout')) {
        toast.error(t('toast:video.styleTransfer.safariTimeoutAdvice'), {
          position: 'top-center',
          duration: 6000,
        });
      } else {
        toast.error(errorMessage, {
          position: 'top-center',
          duration: 4000,
        });
      }
    }
  };

  const handleVideoRemove = () => {
    // 重置所有相关状态
    setState(prev => ({
      ...prev,
      uploadedVideo: null,
      styledFrame: null,
      finalVideo: null,
      error: null,
    }));

    // 重置帧提取状态
    resetFrameState();

    setDisableActTwo(false);
    setDisableV2vGeneral(false);
    setSelectedModel('wanAnimate');

    // 清除缓存的视频URL
    setVideoGenerationCost(
      calculateVideoToVideoGenerationCost(selectedModel, selectedDuration),
    );
  };

  const handleStyleModeChange = (key: any) => {
    setStyleMode(key as any);
    // When switching to template mode, always open modal (user initiated action)
    if (key === 'template') {
      setTimeout(() => {
        styleTemplatesPickerRef.current?.onOpen();
      }, 0);
    }
  };

  const handleStyleSelect = (styleId: string, source?: 'modal' | 'quick') => {
    setSelectedStyle(styleId);

    // 选择样式后滚动到样式选择区域顶部
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const delay = source === 'modal' ? 300 : 50;

    setTimeout(() => {
      scrollToElement(styleSelectionSectionRef.current, isMobile ? 64 : 0);
    }, delay);
  };

  const handleCustomStylePromptChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomStylePrompt(e.target.value);
  };

  const handleReferenceImageUpload = (url: string) => {
    // Convert URL to File object for compatibility
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], 'reference-image.jpg', {
          type: 'image/jpeg',
        });

        // 如果有提取帧的尺寸，自动裁剪参考图像以匹配
        if (extractedFrameDimensions) {
          cropReferenceToMatchFrame(file, extractedFrameDimensions)
            .then(croppedFile => {
              setReferenceImage(croppedFile);
              toast.success(
                t('toast:video.styleTransfer.referenceImageCropped'),
                {
                  position: 'top-center',
                  duration: 3000,
                },
              );
            })
            .catch(error => {
              console.warn(
                'Auto-cropping failed, using original image:',
                error,
              );
              setReferenceImage(file);
              toast.error(t('toast:video.styleTransfer.autoCropFailed'), {
                position: 'top-center',
                duration: 3000,
              });
            });
        } else {
          setReferenceImage(file);
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          error: 'Failed to process reference image',
        }));
      });
  };

  const handleReferenceImageRemove = () => {
    setReferenceImage(null);
  };

  const handleModelChange = (key: any) => {
    const selected = key as VideoToVideoModel;
    setSelectedModel(selected);
    setVideoGenerationCost(
      calculateVideoToVideoGenerationCost(selected, selectedDuration),
    );

    if (selected === 'rayFlash') {
      setMaxDuration(RAYFLASH_MAX_DURATION);
    } else if (selected === 'actTwo') {
      setMaxDuration(ACT_TWO_MAX_DURATION);
    } else if (originalVideoDuration) {
      setMaxDuration(originalVideoDuration);
    }
  };

  const generateStyledFrame = async () => {
    // 滚动到帧预览区域
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    scrollToElement(framePreviewRef.current, isMobile ? 64 : 0);

    // 额度校验
    if (styleMode !== 'upload') {
      setIsGeneratingStyleFrame(true);
      if ((profile?.credit || 0) < styleTransferCost) {
        openModal('pricing');
        return;
      }
    }

    // For upload mode, directly use the uploaded reference image as styled frame
    if (styleMode === 'upload' && referenceImage) {
      setSelectedStyle('');

      try {
        // Convert reference image to URL
        const referenceImageUrl = URL.createObjectURL(referenceImage);

        if (referenceImageUrl) {
          setState(prev => ({
            ...prev,
            styledFrame: referenceImageUrl,
          }));
        }

        toast.success(t('toast:video.styleTransfer.referenceApplied'), {
          position: 'top-center',
          duration: 3000,
        });

        return;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: t('toast:video.styleTransfer.useReferenceFailed'),
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      error: null,
    }));

    // Clear other mode values when applying - ensure only current mode's settings are used
    if (styleMode === 'template') {
      setCustomStylePrompt('');
      setReferenceImage(null);
    } else if (styleMode === 'prompt') {
      setSelectedStyle('');
      setReferenceImage(null);
    } else if (styleMode === 'upload') {
      setCustomStylePrompt('');
      setSelectedStyle('');
    }

    try {
      // Convert data URL to blob and upload if needed
      let imageUrl = extractedFrame;

      // Prepare API parameters
      let apiParams: any = {
        image_url: imageUrl,
        mode: styleMode === 'prompt' ? 'custom' : styleMode,
        tool: 'video-to-video-style-transfer',
      };

      // Set parameters based on style mode
      switch (styleMode) {
        case 'template':
          apiParams.style_id = selectedStyle;
          break;
        case 'prompt':
          apiParams.custom_prompt = customStylePrompt;
          break;
        default:
          throw new Error('Invalid style mode');
      }

      // 如果图片 > 20MB，压缩图片
      if (extractedFrame) {
        if (
          extractedFrame.length > GEMINI_LIMITS.MAX_SIZE ||
          frameWidth > GEMINI_LIMITS.MAX_WIDTH ||
          frameHeight > GEMINI_LIMITS.MAX_HEIGHT
        ) {
          const compressedImage = await compressImage(
            extractedFrame,
            GEMINI_LIMITS.MAX_WIDTH,
            GEMINI_LIMITS.MAX_HEIGHT,
          );
          apiParams.image_url = compressedImage;
        }

        if (referenceImage) {
          const referenceImageUrl = URL.createObjectURL(referenceImage);
          const compressedImage = await compressImage(
            referenceImageUrl,
            GEMINI_LIMITS.MAX_WIDTH,
            GEMINI_LIMITS.MAX_HEIGHT,
          );
          apiParams.image_url = compressedImage;
        }
      }

      // Call the style transfer API
      const response = await fetch('/api/tools/style-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiParams),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // trackError(new Error(errorData.error || 'Style transfer API failed'), {
        //   source: 'VideoToVideoConvert',
        //   step: 'style_transfer_api',
        //   additionalData: {
        //     status: response.status,
        //     statusText: response.statusText,
        //     error_data: errorData,
        //   },
        // });

        // 如果后端返回详细错误信息，使用它
        if (errorData.error) {
          const detailedError = new Error(errorData.error);
          // 将额外信息附加到错误对象上
          (detailedError as any).errorCode = errorData.errorCode;
          (detailedError as any).category = errorData.category;
          (detailedError as any).requestId = errorData.requestId;
          throw detailedError;
        }

        throw new Error(t('toast:video.styleTransfer.styleTransferFailed'));
      }

      const result = await response.json();

      if (!result.output) {
        throw new Error(t('toast:video.styleTransfer.invalidStyleResponse'));
      }

      setState(prev => ({
        ...prev,
        styledFrame: result.output,
      }));

      // 保存style_id用于meta_data, 成功后保存
      if (apiParams.style_id) {
        setSavedStyle(apiParams.style_id);
      }

      toast.success(t('toast:video.styleTransfer.styleApplied'), {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('toast:video.styleTransfer.styleTransferFailed');

      // 获取详细错误信息
      const errorCode = (error as any)?.errorCode;
      const category = (error as any)?.category;
      const requestId = (error as any)?.requestId;

      // 根据错误类型显示不同的toast持续时间
      const toastDuration = category === 'CONTENT_FILTER' ? 6000 : 4000;

      toast.error(errorMessage, {
        position: 'top-center',
        duration: toastDuration,
      });

      // 构建详细的错误信息用于UI显示
      let detailedErrorMessage = errorMessage;
      if (errorCode || requestId) {
        const errorDetails: string[] = [];
        if (errorCode)
          errorDetails.push(t('common:error.code', { code: errorCode }));
        if (requestId)
          errorDetails.push(t('common:error.requestId', { id: requestId }));
        detailedErrorMessage = `${errorMessage}\n${errorDetails.join(' | ')}`;
      }

      if (detailedErrorMessage) {
        setState(prev => ({
          ...prev,
          error: detailedErrorMessage,
        }));
      }
      return;
    } finally {
      setIsGeneratingStyleFrame(false);
    }

    // 对账
    await updateProfile();
  };

  const canGenerateStyle = () => {
    // 根据当前选中的模式判断是否可以生成
    switch (styleMode) {
      case 'template':
        return selectedStyle !== '';
      case 'prompt':
        return customStylePrompt.trim() !== '';
      case 'upload':
        return referenceImage !== null;
      default:
        return false;
    }
  };

  const generateFinalVideo = async () => {
    if (!state.uploadedVideo || !state.styledFrame) {
      toast.error(t('toast:video.styleTransfer.missingVideoOrFrame'), {
        position: 'top-center',
        duration: 4000,
      });
      return;
    }

    // 验证 prompt 长度（根据是否选择了风格）/ V2V Pro
    // const hasTemplateStyle = !!selectedStyle;
    // if (
    //   !hasTemplateStyle &&
    //   selectedModel === 'aleph' &&
    //   styleMode === 'upload'
    // ) {
    //   if (!videoPrompt || videoPrompt.trim().length < 3) {
    //     toast.error(t('toast:video.styleTransfer.promptTooShort'));
    //     return;
    //   }
    // }

    // 额度校验（使用总credit）
    if ((profile?.credit || 0) < videoGenerationCost) {
      openModal('pricing');
      return;
    }

    let prompt = '';
    if (!videoPrompt) {
      switch (styleMode) {
        case 'template':
          prompt = t(
            'style-templates:' + getI2iStyleNameKeyMappingSync()[savedStyle] ||
              '',
          );
          break;
        case 'prompt':
          prompt = customStylePrompt;
          break;
        case 'upload':
          prompt = '';
          break;
      }
    } else {
      prompt = videoPrompt;
    }

    let toastId;

    try {
      // 1. 处理视频截取（Safari特殊处理）
      let processedVideo = state.uploadedVideo;
      const originalDuration = originalVideoDuration || 0;

      // Safari用户：直接使用原视频，不进行剪切
      if (!isSafari && originalDuration > selectedDuration) {
        // 非Safari用户：检查是否需要剪切
        // 如果选择了“原始时长”或与其近似，则跳过剪切
        const isOriginalSelected =
          Math.abs(selectedDuration - originalDuration) < 0.1;

        if (!isOriginalSelected) {
          try {
            // 检查是否在客户端环境
            if (!isClientMounted) {
              throw new Error(
                'Video trimming can only be performed after client mount',
              );
            }

            toastId = toast.loading(
              t('toast:video.styleTransfer.trimmingVideo'),
              {
                position: 'top-center',
              },
            );

            // Add a small buffer to mitigate recorder/start delays
            const targetDuration = Math.max(1, selectedDuration + 0.3);
            processedVideo = await trimVideo(
              state.uploadedVideo,
              targetDuration,
            );

            // Validate trimmed duration and retry once with a larger buffer if too short
            try {
              const trimmedDur = await getVideoDuration(processedVideo);
              const tolerance = 0.2; // seconds tolerance
              if (trimmedDur + tolerance < selectedDuration) {
                const retryTarget = Math.max(
                  1,
                  Math.min(15, selectedDuration + 0.6),
                );
                const retryVideo = await trimVideo(
                  state.uploadedVideo,
                  retryTarget,
                );
                const retryDur = await getVideoDuration(retryVideo);
                if (retryDur > trimmedDur) {
                  processedVideo = retryVideo;
                }
              }
            } catch {}
          } catch (trimError) {
            processedVideo = state.uploadedVideo;

            const errorMessage =
              trimError instanceof Error
                ? trimError.message
                : t('toast:video.styleTransfer.trimFailedUsingOriginal');
            toast.error(errorMessage, {
              position: 'top-center',
              duration: 4000,
            });
          }
        }
      }

      // 2. Upload processed video to get URL
      let videoUrl = '';
      if (processedVideo) {
        try {
          // Create a temporary blob URL for the processed video
          const tempUrl = URL.createObjectURL(processedVideo);

          try {
            // luma
            // videoUrl = await uploadTempVideo(tempUrl, profile.id);
            // fal
            videoUrl = await uploadVideoToFal(processedVideo, profile.id);
            if (!toastId) {
              toastId = toast.loading(
                t('toast:video.styleTransfer.uploadingVideo'),
              );
            } else {
              toast.loading(t('toast:video.styleTransfer.uploadingVideo'), {
                id: toastId,
              });
            }
          } catch (uploadError) {
            // Clean up the temporary URL on error
            URL.revokeObjectURL(tempUrl);
            throw uploadError;
          }

          // Clean up the temporary URL
          URL.revokeObjectURL(tempUrl);
        } catch (uploadError) {
          throw uploadError;
        }
      }

      // 3. Handle reference image upload for upload mode
      let styledFrameUrl = state.styledFrame;
      if (styleMode === 'upload' && referenceImage) {
        try {
          styledFrameUrl = await uploadImageToFal(
            referenceImage,
            (profile as any)?.id,
          );
        } catch (uploadError) {
          trackError(
            uploadError instanceof Error
              ? uploadError
              : new Error('Unknown upload error'),
            {
              source: 'VideoToVideoConvert',
              step: 'convert_reference_image_to_base64',
              additionalData: {
                fileName: referenceImage.name,
                fileSize: referenceImage.size,
                fileType: referenceImage.type,
              },
            },
          );

          throw new Error(t('toast:video.styleTransfer.uploadReferenceFailed'));
        }
      }

      // 4. Get actual video duration from uploaded video URL for accurate cost calculation
      let actualVideoDuration = selectedDuration; // fallback to selected duration
      try {
        const rawDuration = await getVideoDuration(videoUrl);

        // Validate duration (should be reasonable)
        if (rawDuration <= 0) {
          console.warn(
            `Invalid duration ${actualVideoDuration}s, using selected duration ${selectedDuration}s`,
          );
        }
      } catch (error) {
        console.warn(
          'Failed to get duration from uploaded video, using selected duration:',
          error,
        );
      }

      // 5. Prepare API parameters
      const apiParams: any = {
        image: styledFrameUrl,
        video: videoUrl,
        target_model: toModelId(selectedModel),
        selectedDuration: selectedDuration, // User selected duration for billing
        actualDuration: actualVideoDuration, // Actual video duration for backend validation
        tool: 'video-to-video',
        prompt: videoPrompt,
        meta_data: {
          style_id: styleMode === 'template' ? savedStyle : '',
          style_prompt: styleMode === 'prompt' ? customStylePrompt : '',
        },
        should_delete_media: false, // luma的话改为true
        mode: 'animate',
      };

      // // Runway Act Two specific params
      if (selectedModel === 'actTwo') {
        // apiParams.bodyControl = actBodyControl;
        // apiParams.expressionIntensity = actExpressionIntensity;
        const actAspectEnum =
          actTwoRatio !== 'auto'
            ? (actTwoRatio as AspectEnum)
            : normalizeAspectFromWH(
                extractedFrameDimensions?.width,
                extractedFrameDimensions?.height,
              );
        apiParams.ratio = ACT_TWO_MAP[actAspectEnum];
      }

      // Aleph specific params
      // if (selectedModel === 'aleph') {
      //   apiParams.aspect_ratio = (
      //     alephAspect === 'auto'
      //       ? normalizeAspectFromWH(
      //           extractedFrameDimensions?.width,
      //           extractedFrameDimensions?.height,
      //         )
      //       : (alephAspect as AspectEnum)
      //   ) as string;
      // }

      const hasStyle = !!selectedStyle;
      if (hasStyle && presetPrompts[selectedStyle]) {
        apiParams.meta_data.preset_prompt = presetPrompts[selectedStyle];
      }

      if (
        customStylePrompt &&
        styleMode === 'prompt' &&
        selectedStyle.length === 0
      ) {
        apiParams.meta_data.preset_prompt = customStylePrompt;
      }

      const trimmed = (videoPrompt || '').trim();
      // If a template style is selected, prompt becomes optional and we append user prompt (any length > 0)
      // If no style, require >=3 chars to attach; Aleph validation above ensures required
      const shouldAttachPrompt = hasStyle
        ? trimmed.length > 0
        : trimmed.length >= 3;

      if (shouldAttachPrompt) {
        apiParams.prompt = trimmed;
      }

      toastId = toast.loading(
        t('toast:video.styleTransfer.videoGenerationStarted'),
        {
          id: toastId,
        },
      );

      const taskId = await submitTask(apiParams).catch(error => {
        throw error;
      });

      // Enhanced debugging for missing prediction ID
      if (isNil(taskId)) {
        return;
      }

      // // 创建一个新的视频记录，先显示生成中状态
      const newVideo: VideoData = {
        id: taskId,
        video_url: '',
        prompt,
        status: GenerationStatus.PROCESSING,
      };

      if (savedStyle) {
        newVideo.meta_data = JSON.stringify({
          style_id: savedStyle,
        });
      }

      setResultVideos(prev => [
        newVideo,
        ...prev.filter(video => video.id !== -1),
      ]);

      toast.dismiss(toastId);

      addTaskId(taskId);

      // 记录 style 使用统计
      if (savedStyle) {
        recordStyleUsage('video-to-video', savedStyle).catch(err => {
          console.error('Failed to record style usage:', err);
        });
      }

      // 对账 - 更新profile以获取最新的credit（视频生成任务提交成功后）
      await updateProfile();
    } catch (error) {
      // if (selectedModel === 'actTwo') {
      //   toast.error(t('ui.actTwo.videoTooShort', { min: 3 }));
      // }
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('toast:video.styleTransfer.videoGenerationFailed');

      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000,
      });

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return;
    }

    // 对账 - 更新profile以获取最新的credit
    await updateProfile();
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'styled-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error(t('toast:video.styleTransfer.downloadFailed'), {
        position: 'top-center',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (typeof id === 'number' && id < 0) {
      setResultVideos(resultVideos => resultVideos.filter(d => d.id !== id));
      return;
    }
    try {
      const response = await videosAPI({ method: 'deleteVideo', id: id });
      if (response.data && response.data.length > 0) {
        deleteMediaData(setResultVideos, id);
        toast.success(t('toast:video.styleTransfer.videoDeleted'), {
          position: 'top-center',
          duration: 2000,
        });
      } else {
        toast.error(t('toast:video.styleTransfer.deleteFailed'), {
          position: 'top-center',
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error(t('toast:video.styleTransfer.deleteFailed'), {
        position: 'top-center',
        duration: 3000,
      });
    }
  };

  return (
    <div className='grid grid-cols-12 gap-2 md:gap-4 lg:gap-6 mt-4 md:grid-rows-[minmax(0,auto)]'>
      {/* 左侧输入区域 */}
      <div
        className='flex flex-col col-span-12 md:col-span-6 lg:col-span-5 md:row-span-1'
        ref={leftSideRef}>
        <Card className={`p-4 flex flex-col h-full transition-all duration-300 ${TOOL_CARD_STYLES.inputCard}`}>
          <div className='mb-1 w-full overflow-hidden overflow-x-auto'>
            <VideoToolsTabs activeTab='video-to-video' />
            {/* <Tooltip
              content={t('ui.tooltip')}
              color='primary'
              className='hidden md:block'>
              <span>
                <BsInfoCircleFill className='hidden text-primary-500 md:block' />
              </span>
            </Tooltip> */}
          </div>

          <div
            className='flex overflow-y-auto flex-col flex-1 md:max-h-[calc(100vh-273px)] pt-2'
            ref={leftScrollRef}>
            {/* 1. Video Upload */}
            <div className='mb-6'>
              <UploadFile
                type='video'
                accept='.mp4,.mov,.avi'
                removable
                initialImage={videoInput}
                onRemove={handleVideoRemove}
                onChange={handleVideoUpload}>
                <div className='text-center py-2 md:py-4'>
                  <FaVideo className='mx-auto mb-2 w-6 h-6 md:w-12 md:h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                  <div className='flex flex-col items-center px-1 md:px-2 '>
                    <p className='mb-2 text-sm text-muted-foreground md:text-base'>
                      {t('ui.upload.dragText')}
                    </p>
                    <div className='flex items-center gap-1'>
                      <BsInfoCircle className='w-3 h-3 text-primary-600' />
                      <span className='text-xs text-muted-foreground'>
                        {t('ui.uploadTips.title')}:
                      </span>
                    </div>

                    <ul className='list-disc list-inside text-xs text-muted-foreground text-wrap'>
                      {t('ui.uploadTips.tip1')}
                      <br />
                      {t('ui.uploadTips.tip2')}
                    </ul>
                  </div>
                </div>
              </UploadFile>

              {/* Best results tip */}
              {/* <div className='p-3 mt-3 bg-amber-50 rounded-lg border border-amber-200'>
                <div className='flex gap-2 items-start'>
                  <BsExclamationTriangle className='text-amber-600 w-4 h-4 mt-0.5 flex-shrink-0' />
                  <p className='text-sm text-amber-700'>
                    {t('ui.upload.bestResultsTip1')}
                    <br />
                    {t('ui.upload.bestResultsTip2')}
                  </p>
                </div>
              </div> */}

              {/* Safari warning for long videos */}
              {isClient && isSafari && (
                <div className='p-3 mt-2 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='flex gap-2 items-start'>
                    <BsInfoCircleFill className='text-blue-600 w-4 h-4 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-sm font-medium text-blue-700'>
                        {t('ui.upload.safariNotice')}
                      </p>
                      <p className='mt-1 text-xs text-blue-600'>
                        {t('ui.upload.safariLimitWarning')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auto extract frame when video is uploaded */}
            {state.uploadedVideo &&
              !extractedFrame &&
              !isGeneratingStyleFrame && (
                <div className='mb-6'>
                  <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <Button
                      size='sm'
                      color='primary'
                      variant='flat'
                      onPress={() => {
                        if (state.uploadedVideo) {
                          extractFrame(state.uploadedVideo);
                        }
                      }}
                      className='w-full cursor-pointer'>
                      {t('ui.upload.extractFrameManually')}
                    </Button>
                  </div>
                </div>
              )}

            {/* 3. Style Selection */}
            <div ref={styleSelectionSectionRef}>
              <div className='flex gap-2 items-center mb-3'>
                <label className='block text-sm font-bold text-foreground'>
                  {t('ui.steps.styleSelection')}
                </label>
                <Popover placement='right'>
                  <PopoverTrigger>
                    <span>
                      <BsInfoCircleFill className='w-3 h-3 transition-colors cursor-help md:w-4 md:h-4 text-primary-500 hover:text-primary-600' />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className='p-3 max-w-xs'>
                    <p className='mb-1'>{t('ui.framePreview.styleTooltip')}</p>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Style selection tabs and content */}
              <>
                <Tabs
                  selectedKey={styleMode}
                  onSelectionChange={handleStyleModeChange}
                  fullWidth
                  classNames={{
                    tabList: 'gap-0',
                    panel: 'focus:outline-none focus:ring-0 px-0',
                  }}
                  size='sm'>
                  <Tab
                    key='template'
                    title={
                      <div className='flex gap-2 items-center'>
                        <MdDashboard className='w-4 h-4' />
                        <span>{t('ui.styleModes.templates')}</span>
                      </div>
                    }>
                    <StyleTemplatesPicker
                      ref={styleTemplatesPickerRef}
                      tool='video-to-video'
                      recommendedStyleIds={[
                        'anime',
                        'ios-emoji',
                        'the-simpsons',
                        'orange-cat',
                      ]}
                      selectedStyle={selectedStyle}
                      onSelect={(style, source) =>
                        handleStyleSelect(style.id, source)
                      }
                    />
                  </Tab>

                  <Tab
                    key='prompt'
                    title={
                      <div className='flex gap-2 items-center'>
                        <MdEdit className='w-4 h-4' />
                        {t('ui.styleModes.prompt')}
                      </div>
                    }>
                    <div>
                      <Textarea
                        placeholder={t('ui.prompt.placeholder')}
                        value={customStylePrompt}
                        onChange={handleCustomStylePromptChange}
                        minRows={3}
                        className='mb-2'
                        classNames={{
                          inputWrapper: 'dark:!bg-input',
                          input: 'dark:!bg-transparent dark:!text-foreground',
                        }}
                      />
                      <p className='text-xs text-muted-foreground'>
                        {t('ui.prompt.example')}
                      </p>
                    </div>
                  </Tab>

                  <Tab
                    key='upload'
                    title={
                      <div className='flex gap-2 items-center'>
                        <MdImage className='w-4 h-4' />
                        {t('ui.styleModes.reference')}
                      </div>
                    }
                    data-focus-visible='false'>
                    <div>
                      <UploadFile
                        type='image'
                        accept='.png,.jpg,.jpeg,.webp'
                        limit={10}
                        removable
                        onRemove={handleReferenceImageRemove}
                        onChange={handleReferenceImageUpload}
                        className='border-border hover:border-primary-400'>
                        <div className='text-center'>
                          <MdImage className='mx-auto mb-2 w-6 h-6 md:w-12 md:h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                          <div>
                            <p className='mb-2 text-xs md:text-sm text-muted-foreground md:text-base'>
                              {t('ui.reference.uploadText')}
                            </p>
                            <p className='mt-1 text-xs text-muted-foreground md:text-sm'>
                              {t('ui.reference.formatInfo')}
                            </p>
                          </div>
                        </div>
                      </UploadFile>
                    </div>
                  </Tab>
                </Tabs>

                {/* Public Visibility - show in all modes */}
                <div className='mb-2'>
                  <PublicVisibilityToggle
                    isPublic={isPublic}
                    onToggle={setIsPublic}
                    label={t('common:publicVisibility.label')}
                    tooltip={t('common:publicVisibility.tooltip')}
                    variant='section'
                  />
                </div>
                <div>
                  <Button
                    color='primary'
                    variant='flat'
                    onPress={generateStyledFrame}
                    isDisabled={
                      isGeneratingStyleFrame ||
                      !canGenerateStyle() ||
                      !extractedFrame
                    }
                    isLoading={isGeneratingStyleFrame}
                    className='w-full cursor-pointer disabled:cursor-not-allowed dark:text-primary-300'
                    startContent={
                      !isGeneratingStyleFrame && (
                        <MdPalette className='flex-shrink-0 w-4 h-4' />
                      )
                    }
                    endContent={
                      styleMode !== 'upload' && styleTransferCost > 0
                        ? isAuth && (
                            <Chip
                              startContent={
                                <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                              }
                              variant='flat'
                              color='primary'
                              size='sm'
                              className='bg-card'
                              classNames={{
                                content: 'dark:text-foreground',
                              }}>
                              -{styleTransferCost}/{profile.credit}
                            </Chip>
                          )
                        : undefined
                    }>
                    {applyButtonText}
                  </Button>
                </div>
                {/* Show upload prompt when no video */}
                {/* {!extractedFrame && !state.isProcessing && (
                  <div className='p-2 bg-gray-50 rounded-lg md:p-4'>
                    <div className='text-center'>
                      <MdVideoLibrary className='flex-shrink-0 mx-auto mb-2 w-6 h-6 text-gray-600 md:w-8 md:h-8' />
                      <p className='text-sm font-medium text-gray-700'>
                        {t('toast:video.styleTransfer.uploadVideoFirst')}
                      </p>
                    </div>
                  </div>
                )} */}

                {/* Warning for reference mode */}
                {styleMode === 'upload' && extractedFrame && (
                  <div className='p-3 my-1 bg-amber-50 rounded-lg border border-amber-200'>
                    <div className='flex gap-2 items-start'>
                      <BsExclamationTriangle className='text-amber-600 w-4 h-4 mt-0.5 flex-shrink-0' />
                      <p className='text-sm text-amber-700'>
                        {t('ui.reference.compositionWarning')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show loading state when extracting */}
                {!extractedFrame && isGeneratingStyleFrame && (
                  <div className='p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200 mt-4 md:mt-6'>
                    <div className='flex justify-center items-center space-x-2'>
                      <div className='w-4 h-4 rounded-full border-b-2 border-blue-600 animate-spin'></div>
                      <p className='text-sm text-blue-700'>
                        {t('toast:video.styleTransfer.extractingFrame')}
                      </p>
                    </div>
                    {extractionProgress > 0 && (
                      <div className='overflow-hidden mt-2 w-full'>
                        <div className='w-full max-w-full'>
                          <Progress
                            value={extractionProgress}
                            color='primary'
                            size='sm'
                            className='w-full'
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FramePreview
                  ref={framePreviewRef}
                  extractedFrame={extractedFrame}
                  styledFrame={state.styledFrame}
                  isProcessing={isGeneratingStyleFrame}
                />
              </>
            </div>

            {/* 3. Generate Video */}
            {(state.styledFrame || isGeneratingStyleFrame) && (
              <>
                {/* Visual separator */}

                <div className='flex items-center my-1'>
                  <div className='flex-1 border-t border-border'></div>
                  <div className='px-4 text-xs text-muted-foreground bg-card'>
                    {t('ui.separators.readyToGenerate')}
                  </div>
                  <div className='flex-1 border-t border-border'></div>
                </div>

                {/* 2. Model selection */}
                <KoModelSelect
                  className='mb-4'
                  label={t('ui.model.label')}
                  placeholder={t('ui.model.placeholder')}
                  ariaLabel={t('ui.model.ariaLabel')}
                  defaultSelectedKey={selectedModel}
                  options={v2vModelOptions}
                  onChange={handleModelChange}
                />

                {/* Optional Video Prompt */}
                <div className='mb-4' ref={videoGenerationSectionRef}>
                  <label className='block mb-2 text-sm font-bold text-foreground'>
                    {t('ui.videoPrompt.title')}{' '}
                    {(selectedModel !== 'aleph' ||
                      hasSelectedTemplateStyle) && (
                      <span className='text-xs text-muted-foreground'>
                        {t('ui.videoPrompt.optional')}
                      </span>
                    )}
                  </label>
                  <Textarea
                    placeholder={t('ui.videoPrompt.placeholder')}
                    value={videoPrompt}
                    onChange={e => setVideoPrompt(e.target.value)}
                    minRows={2}
                    className={`mb-1 ${
                      videoPrompt &&
                      videoPrompt.trim().length > 0 &&
                      videoPrompt.trim().length < 3 &&
                      (selectedModel !== 'aleph' || !hasSelectedTemplateStyle)
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                    classNames={{
                      inputWrapper: 'dark:!bg-input',
                      input: 'dark:!bg-transparent dark:!text-foreground',
                    }}
                  />
                  {videoPrompt &&
                    videoPrompt.trim().length > 0 &&
                    videoPrompt.trim().length < 3 &&
                    (selectedModel !== 'aleph' ||
                      !hasSelectedTemplateStyle) && (
                      <p className='text-xs text-red-500 mb-1'>
                        {t('toast:video.styleTransfer.promptTooShort')}
                      </p>
                    )}
                  <p className='text-xs text-muted-foreground'>
                    {t('ui.videoPrompt.description')}
                  </p>
                </div>

                {/* Duration Selection */}
                {originalVideoDuration && (
                  <DurationSelector
                    selectedDuration={selectedDuration}
                    setSelectedDuration={setSelectedDuration}
                    originalVideoDuration={originalVideoDuration}
                    isClient={isClient}
                    isSafari={isSafari}
                    maxDuration={maxDuration}
                  />
                )}

                <div className='sticky bottom-0 z-10 bg-card/80 backdrop-blur border-t border-border pt-3'>
                  <Button
                    color='primary'
                    onPress={generateFinalVideo}
                    disabled={isGeneratingStyleFrame || !state.styledFrame}
                    isLoading={false}
                    size='lg'
                    className='w-full cursor-pointer'
                    endContent={
                      isAuth ? (
                        <Chip
                          startContent={
                            <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                          }
                          variant='bordered'
                          color='primary'
                          size='sm'
                          className='bg-card'
                          classNames={{
                            content: 'dark:text-foreground',
                          }}>
                          -{videoGenerationCost}/{profile.credit}
                        </Chip>
                      ) : undefined
                    }>
                    {state.finalVideo
                      ? t('ui.buttons.generateMore')
                      : t('ui.buttons.generateVideo')}
                  </Button>
                </div>
              </>
            )}

            {/* Error Display */}
            {state.error && (
              <div className='p-3 mt-4 bg-red-50 rounded-lg border border-red-200'>
                <div className='flex gap-2 items-start'>
                  <BiErrorCircle className='text-red-600 w-4 h-4 mt-0.5 flex-shrink-0' />
                  <div className='flex-1'>
                    <p className='text-sm text-red-600 whitespace-pre-line'>
                      {state.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 右侧结果区域 */}
      <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-7 md:row-span-1 md:h-0 md:min-h-full'>
        <Card className={`p-4 md:pb-6 md:px-6 md:pt-4 h-full ${TOOL_CARD_STYLES.outputCard} md:flex md:flex-col md:overflow-hidden`}>
          <h2
            className='flex items-center mb-4 text-base font-bold text-primary-800 dark:text-primary-300'
            ref={generatedResultSectionRef}>
            <FaDownload className='mr-2 text-primary-600' />{' '}
            {t('ui.generatedVideos')}
          </h2>
          <div className='flex overflow-hidden flex-col flex-1 w-full'>
            <div
              className='overflow-y-auto flex-1 rounded-lg md:min-h-0'
              ref={resultsScrollRef}>
              {resultVideos.length > 0 ? (
                <div className='grid grid-cols-1 gap-2'>
                  {resultVideos.map((video, index) => (
                    <LazyRender key={video.id}>
                      <ResultCard
                        type='video'
                        data={video}
                        handleDownload={handleDownload}
                        handleDelete={handleDelete}
                        videoRefs={videoRefs}
                        handleLoadedMetadata={() => {}}
                        index={index}
                        showPrompt={true}
                        maxGenerationMinutes={10}
                        totalCount={resultVideos.length}
                        isExample={video.id === -1}
                        tool='video-to-video'
                      />
                    </LazyRender>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                  <MdOutlineAnimation
                    size={48}
                    className='mb-4 text-primary-300'
                  />
                  <p className='text-center'>{t('ui.emptyState')}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
