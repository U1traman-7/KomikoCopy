import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FaDownload } from 'react-icons/fa';
import { BiSolidZap } from 'react-icons/bi';
import { MdOutlineAnimation, MdEdit, MdDashboard } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { ImportFromCharacterDropdown } from '../ImportFromCharacterDropdown';
import { useTranslation } from 'react-i18next';
import UploadFile from '../UploadFile';
import MultiImageUploadArea, { MultiImageItem } from './MultiImageUploadArea';
import { GenerationStatus } from './utils';
import { ResultCard } from './ResultCard';
import {
  calculateImageToAnimationCost,
  ImageToVideoModel,
  SORA_KIE_UNIT,
} from '../../../api/tools/_zaps';
import { authAtom } from 'state';
import { useAtomValue } from 'jotai';
import { redrawImageToBase64, getImageSize } from '@/utils/index';

import { getClosestAspectRatioFromList } from '../VideoGeneration/utils/videoHelpers';
import { uploadImageFromUrlWithFile } from '@/utils/uploadUtils';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { ModelIds } from '../../../api/_constants';
import { VideoToolsTabs } from './VideoToolsTabs';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVideos } from 'hooks/useVideos';
import { isNil } from 'lodash-es';
import { getCreateYoursData } from '../../utilities/tools';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { VideoStyleGrids } from '../StyleTemplatePicker/StyleGirds/VideoStyleGrids';
import StyleTemplatePicker, {
  StyleTemplatesPickerRef,
} from '../StyleTemplatePicker';
import {
  DanceTemplate,
  getDanceTemplatesSync,
} from '../StyleTemplatePicker/StyleGirds/styles';
import {
  getEffectTemplatesSync,
  getEffectTemplates,
  getTrendingStylesId,
} from '../StyleTemplatePicker/styles/video';
import { templateDataManager } from '../../utils/templateCache';
import {
  VideoStyleTemplate,
  TemplateInputField,
} from '../StyleTemplatePicker/styles/index';
import { VIDEO_TO_VIDEO_GENERATION_PER_SECOND } from '../../../api/tools/_zaps';
import { loginModalAtom } from '../../state';

import { uploadTempVideo } from '@/components/ToolsPage/utils';
import {
  handleVideoDownload,
  handleDeleteClick as handleVideoDeleteClick,
  handleConfirmDelete as handleVideoConfirmDelete,
  showErrorToast,
} from '../../utilities/video/videoActions';
import { recordStyleUsage } from '../../utils/styleUsageStats';
import { stitchImagesInBrowser } from '../../utils/stitchImagesInBrowser';
import { uploadImageToFal } from '../../utilities/fal';

enum VideoStyle {
  ANIME = 'anime',
  DEFAULT = 'default',
}

enum VideoResolution {
  '360p' = '360p',
  '540p' = '540p',
  '720p' = '720p',
  '1080p' = '1080p',
  '480p' = '480p',
}

type StyleMode = 'template' | 'dance';

// 将字符串模型名映射到 ImageToVideoModel 枚举
const mapStringToVideoModel = (modelString: string): ImageToVideoModel => {
  const modelMap: Record<string, ImageToVideoModel> = {
    VEO: ImageToVideoModel.VEO,
    Minimax: ImageToVideoModel.MINIMAX,
    Hailuo: ImageToVideoModel.MINIMAX,
    Ray: ImageToVideoModel.RAY,
    'Luma Ray': ImageToVideoModel.RAY,
    Kling: ImageToVideoModel.KLING,
    'Kling v2': ImageToVideoModel.KLING_V2,
    'Kling V2': ImageToVideoModel.KLING_V2,
    Pixverse: ImageToVideoModel.PIXVERSE,
    'Ray Flash V2': ImageToVideoModel.RAY_FLASH_V2,
    Wan: ImageToVideoModel.WAN,
    WAN: ImageToVideoModel.WAN,
    'Wan Pro': ImageToVideoModel.WAN_PRO,
    'WAN Pro': ImageToVideoModel.WAN_PRO,
    'Frame Pack': ImageToVideoModel.FRAME_PACK,
    Vidu: ImageToVideoModel.VIDU,
    'Vidu Base': ImageToVideoModel.VIDU,
    'Vidu Q1': ImageToVideoModel.VIDU_Q2,
    'VIDU Q1': ImageToVideoModel.VIDU_Q2,
    'Magi 1': ImageToVideoModel.MAGI_1,
    'MAGI 1': ImageToVideoModel.MAGI_1,
    Anisora: ImageToVideoModel.ANISORA,
    Hedra: ImageToVideoModel.HEDRA,
    'MJ Video': ImageToVideoModel.MJ_VIDEO,
    Seedance: ImageToVideoModel.SEEDANCE,
    'Seedance Pro': ImageToVideoModel.SEEDANCE,
    SEEDANCE: ImageToVideoModel.SEEDANCE,
    Sora: ImageToVideoModel.SORA,
    SORA: ImageToVideoModel.SORA,
    'Sora Pro': ImageToVideoModel.SORA_PRO,
    'SORA PRO': ImageToVideoModel.SORA_PRO,
    SoraPro: ImageToVideoModel.SORA_PRO,
    SORA_PRO: ImageToVideoModel.SORA_PRO,
    'Vidu Q2': ImageToVideoModel.VIDU_Q2,
    'VIDU Q2': ImageToVideoModel.VIDU_Q2,
  };

  const mapped = modelMap[modelString] ?? ImageToVideoModel.VIDU;
  return mapped;
};

const convertModel = (model: ImageToVideoModel) => {
  switch (model) {
    case ImageToVideoModel.MAGI_1:
      return ModelIds.MAGI_1;
    case ImageToVideoModel.RAY_FLASH_V2:
      return ModelIds.RAY_FLASH_V2;
    case ImageToVideoModel.KLING_V2:
      return ModelIds.KLING_V2;
    case ImageToVideoModel.VIDU_Q2:
      return ModelIds.VIDU_Q2;
    case ImageToVideoModel.VEO:
      return ModelIds.VEO3;
    case ImageToVideoModel.WAN:
      return ModelIds.WAN;
    case ImageToVideoModel.WAN_PRO:
      return ModelIds.WAN_PRO;
    case ImageToVideoModel.KLING:
      return ModelIds.KLING;
    case ImageToVideoModel.PIXVERSE:
      return ModelIds.PIXVERSE;
    case ImageToVideoModel.RAY:
      return ModelIds.RAY;
    case ImageToVideoModel.ANISORA:
      return ModelIds.ANISORA;
    case ImageToVideoModel.FRAME_PACK:
      return ModelIds.FRAME_PACK;
    case ImageToVideoModel.VIDU:
      return ModelIds.VIDU;
    case ImageToVideoModel.HEDRA:
      return ModelIds.HEDRA;
    case ImageToVideoModel.MJ_VIDEO:
      return ModelIds.MJ_VIDEO;
    case ImageToVideoModel.SEEDANCE:
      return ModelIds.SEEDANCE;
    case ImageToVideoModel.SORA_PRO:
      return ModelIds.SORA_PRO;
    case ImageToVideoModel.SORA:
      return ModelIds.SORA;
    case ImageToVideoModel.MAGI_1:
    default:
      return model;
  }
};

// effectTemplateMap will be computed dynamically based on videoTemplates state

import { FaRandom } from 'react-icons/fa';

const HeroBanner = ({
  image,
  video,
  title,
  subtitle,
  onChange,
  onRandom,
  forceCrop = false,
  t,
}: {
  image?: string;
  video?: string;
  title: string;
  subtitle?: string;
  onChange: () => void;
  onRandom?: () => void;
  forceCrop?: boolean;
  t: any;
}) => {
  const [isWideVideo, setIsWideVideo] = useState(false);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // 宽高比 > 1.4 认为是横屏，保持裁剪
    setIsWideVideo(video.videoWidth / video.videoHeight > 1.4);
  };

  const shouldCrop = forceCrop || isWideVideo;

  return (
    <div
      className='relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden group shadow-large border border-border cursor-pointer bg-card mt-2'
      onClick={onChange}>
      <div className='absolute inset-0 flex items-center justify-center bg-card overflow-hidden'>
        {video ? (
          <>
            {/* 模糊背景层 */}
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className='absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110'
            />
            {/* 前景视频 */}
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              className={
                shouldCrop
                  ? 'relative w-full h-full object-cover object-top z-10'
                  : 'relative h-full object-contain z-10 rounded-lg'
              }
            />
          </>
        ) : image ? (
          <>
            <img
              src={image}
              className='absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110'
              alt=''
            />
            <img
              src={image}
              className='relative w-full h-full object-cover object-top z-10'
              alt={title}
            />
          </>
        ) : (
          <div className='w-full h-full flex items-center justify-center text-primary-300'>
            <MdDashboard className='w-12 h-12' />
          </div>
        )}
      </div>
      <div className='absolute inset-x-0 bottom-6 text-center text-white z-30 px-4'>
        <h3 className='font-bold text-2xl md:text-3xl leading-tight text-white drop-shadow-lg'>
          {title}
        </h3>
      </div>
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none z-20' />
      <div
        className='absolute md:top-4 md:right-4 top-2 right-2 flex gap-2 z-30'
        onClick={e => e.stopPropagation()}>
        {onRandom && (
          <Button
            size='sm'
            isIconOnly
            className='!bg-black/60 hover:!bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-lg'
            onPress={onRandom}>
            <FaRandom className='w-3 h-3' />
          </Button>
        )}
        <Button
          size='sm'
          className='!bg-black/60 hover:!bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-lg'
          onPress={onChange}
          endContent={<MdEdit className='w-3 h-3' />}>
          {t('common:change')}
        </Button>
      </div>
    </div>
  );
};

function TemplateVideoGenerator({
  exampleVideoUrl = '/images/examples/image-animation-generator/output2.mp4',
  mode = 'template',
  initialStyle,
}: {
  exampleVideoUrl?: string;
  mode?: StyleMode;
  initialStyle?: string;
}) {
  // Dynamic dance template map getter - defined early to avoid hoisting issues
  const getDanceTemplateMap = useCallback(() => {
    const templates = getDanceTemplatesSync();
    return Object.fromEntries(
      templates.map(template => [template.id, template]),
    );
  }, []); // This will be updated when needed through templateDataManager

  const { t } = useTranslation([
    'image-animation-generator',
    'common',
    'style-templates',
  ]);

  // 模板数据状态 - use getter to get latest cache
  const [videoTemplates, setVideoTemplates] = useState(getEffectTemplatesSync);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // 加载模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);

      try {
        // 确保全局模板数据管理器已初始化
        await templateDataManager.loadAllData();

        const [videoTemplatesFromDB, trendingStylesFromDB] = await Promise.all([
          getEffectTemplates(),
          getTrendingStylesId(),
        ]);

        // 如果成功加载到数据，使用数据库数据
        if (videoTemplatesFromDB && videoTemplatesFromDB.length > 0) {
          setVideoTemplates(videoTemplatesFromDB);

          // Check if we have templates with input fields loaded
          const templatesWithInputs = videoTemplatesFromDB.flatMap(cat =>
            cat.templates.filter(
              t => t.needsCharacterInputs && t.needsCharacterInputs.length > 0,
            ),
          );

          // If no templates have input fields, try refreshing once
          if (templatesWithInputs.length === 0) {
            try {
              await templateDataManager.forceReload();
              const refreshedTemplates = await getEffectTemplates();
              if (refreshedTemplates && refreshedTemplates.length > 0) {
                const refreshedWithInputs = refreshedTemplates.flatMap(cat =>
                  cat.templates.filter(
                    t =>
                      t.needsCharacterInputs &&
                      t.needsCharacterInputs.length > 0,
                  ),
                );
                if (refreshedWithInputs.length > 0) {
                  setVideoTemplates(refreshedTemplates);
                }
              }
            } catch (refreshError) {
              // Auto-refresh failed, continue with initial data
            }
          }
        } else {
          setVideoTemplates(getEffectTemplatesSync());
        }
      } catch (error) {
        // 发生错误时使用静态数据作为回退
        setVideoTemplates(getEffectTemplatesSync());
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // 监听全局模板数据变化，自动更新组件状态
  useEffect(() => {
    const handleDataChange = () => {
      const latestVideoTemplates = templateDataManager.getVideoTemplates();
      if (latestVideoTemplates && latestVideoTemplates.length > 0) {
        // Transform the data to match our expected format
        const transformed = latestVideoTemplates.map(category => ({
          category: `categories.${category.name_key}`,
          icon: category.icon || '',
          emoji: category.emoji || '',
          templates: category.templates.map(template => {
            // Convert string model name to ModelIds enum number
            let modelId: number = ModelIds.VIDU; // Default
            if (template.metadata?.model) {
              if (typeof template.metadata.model === 'number') {
                modelId = template.metadata.model;
              } else {
                // Convert string model to ModelIds
                const modelMap = {
                  SORA: ModelIds.SORA,
                  VIDU: ModelIds.VIDU,
                  SORA_TEXT_TO_VIDEO: ModelIds.SORA_TEXT_TO_VIDEO,
                  SORA_PRO: ModelIds.SORA_PRO,
                  SORA_PRO_TEXT_TO_VIDEO: ModelIds.SORA_PRO_TEXT_TO_VIDEO,
                  KLING: ModelIds.KLING,
                  KLING_V2: ModelIds.KLING_V2,
                  WAN: ModelIds.WAN,
                  WAN_PRO: ModelIds.WAN_PRO,
                  RAY: ModelIds.RAY,
                  RAY_FLASH_V2: ModelIds.RAY_FLASH_V2,
                  PIXVERSE: ModelIds.PIXVERSE,
                  VIDU_Q2: ModelIds.VIDU_Q2,
                  VEO3: ModelIds.VEO3,
                  SEEDANCE: ModelIds.SEEDANCE,
                  MJ_VIDEO: ModelIds.MJ_VIDEO,
                  HEDRA: ModelIds.HEDRA,
                  ANISORA: ModelIds.ANISORA,
                  FRAME_PACK: ModelIds.FRAME_PACK,
                  MAGI_1: ModelIds.MAGI_1,
                } as const;
                modelId =
                  modelMap[template.metadata.model as keyof typeof modelMap] ||
                  ModelIds.VIDU;
              }
            }

            return {
              id: template.id.replace(/-v$/, ''), // Clean template ID
              nameKey: template.name_key,
              video: template.url || '',
              model: modelId,
              duration: template.metadata?.duration || 5,
              hasAudio: template.metadata?.hasAudio !== false,
              needsCharacterInputs: template.character_inputs,
              needMiddleware: template.need_middleware || false,
              input_media: template.input_media,
            };
          }),
        }));

        setVideoTemplates(transformed);
      }
    };

    // 使用监听器代替轮询，只在数据变化时更新
    const unsubscribe =
      templateDataManager.addDataChangeListener(handleDataChange);

    // 清理函数
    return () => {
      unsubscribe();
    };
  }, []);

  // 专门监听 dance 模板数据的更新
  useEffect(() => {
    const checkDanceTemplateUpdates = () => {
      // 触发 getDanceTemplateMap 重新计算
      // 这会强制组件重新获取最新的 dance 模板数据
      const latestDanceTemplates = templateDataManager.getDanceTemplates();
      if (latestDanceTemplates && latestDanceTemplates.length > 0) {
        console.log(
          '[TemplateVideoGenerator] Dance templates updated from database',
        );
      }
    };

    // 监听全局模板数据变化
    const unsubscribe = templateDataManager.addDataChangeListener(
      checkDanceTemplateUpdates,
    );

    // 如果数据已加载，立即检查一次
    if (templateDataManager.isDataLoaded()) {
      checkDanceTemplateUpdates();
    }

    // 清理函数
    return () => {
      unsubscribe();
    };
  }, []);

  // dance style 价格计算
  const calculateDanceCost = useCallback(
    (danceStyle: DanceTemplate | undefined) => {
      if (!danceStyle) return 0;
      const rounded = Math.max(0, Math.round(danceStyle.duration));
      return VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimateDiscount * rounded;
    },
    [],
  );

  // 获取初始样式状态
  const getInitialStyleState = (mode: StyleMode) => {
    const currentDanceTemplates = getDanceTemplatesSync();
    if (mode === 'dance' && currentDanceTemplates.length > 0) {
      return {
        styleId: currentDanceTemplates[0].id,
        danceStyle: currentDanceTemplates[0],
      };
    } else if (mode === 'template' && videoTemplates.length > 0) {
      // videoTemplates 现在是分类数组，获取第一个分类的第一个模板
      const firstTemplate = videoTemplates[0]?.templates[0];
      return {
        styleId: firstTemplate?.id || '',
        danceStyle: undefined,
      };
    }
    return {
      styleId: '',
      danceStyle: undefined,
    };
  };

  const initialState = getInitialStyleState(mode);

  // Check if initial style exists by computing effectTemplateMap from current templates
  const hasInitialStyle = useMemo(() => {
    if (!initialStyle) return false;
    const effectTemplateMap = Object.fromEntries(
      videoTemplates.flatMap(category =>
        category.templates.map(template => [template.id, template]),
      ),
    );
    return !!effectTemplateMap[initialStyle as string];
  }, [initialStyle, videoTemplates]);

  const [styleMode, setStyleMode] = useState<StyleMode>(() =>
    hasInitialStyle ? 'template' : mode,
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() =>
    hasInitialStyle ? (initialStyle as string) : initialState.styleId,
  );

  const router = useRouter();

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

  // Track if user already has a preset style (from URL/Create Yours/variant page)
  const hasPresetStyleRef = useRef<boolean>(hasInitialStyle);

  const hasAutoOpenedPickerRef = useRef(false);

  // Ref for StyleTemplatePicker to control modal
  const styleTemplatesPickerRef = useRef<StyleTemplatesPickerRef>(null);

  const { inputImage, setInputImage } = useProcessInitialImage();

  // Multi-image state for templates with input_media config
  const [inputImages, setInputImages] = useState<MultiImageItem[]>([]);

  // Get current template's input_media config for multi-image support
  const currentInputMedia = useMemo(() => {
    if (styleMode !== 'template' || !selectedStyleId) return null;

    // Compute effectTemplateMap dynamically from current videoTemplates state
    const effectTemplateMap = Object.fromEntries(
      videoTemplates.flatMap(category =>
        category.templates.map(template => [template.id, template]),
      ),
    );

    const template = effectTemplateMap[selectedStyleId];

    if (template && (template as any).input_media) {
      const inputMediaArray = (template as any).input_media;
      // Find the first image type input_media
      const imageMedia = inputMediaArray.find(
        (media: any) => media.media_type === 'image',
      );
      if (imageMedia && imageMedia.max_count > 1) {
        return imageMedia;
      }
    }
    return null;
  }, [styleMode, selectedStyleId, videoTemplates]);

  const isMultiImageMode = currentInputMedia && currentInputMedia.max_count > 1;

  // Reset inputImages when switching templates or when multi-image mode changes
  useEffect(() => {
    if (!isMultiImageMode && inputImages.length > 0) {
      // Clean up blob URLs
      inputImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      setInputImages([]);
    }
  }, [isMultiImageMode, selectedStyleId]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);

  // last video添加 ref
  const lastVideoRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  // const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const loginModal = useAtomValue(loginModalAtom);

  const [dancePickerOpen, setDancePickerOpen] = useState(false);

  // Add these new states near the top of the component
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectedModel, setSelectedModel] = useState<ImageToVideoModel>(
    ImageToVideoModel.VIDU,
  );
  const [selectedDanceStyle, setSelectedDanceStyle] = useState<
    DanceTemplate | undefined
  >(initialState.danceStyle);

  // Dynamic input values for template effects - supports any field name
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const resolveTemplateName = useCallback(
    (key: string) => {
      if (!key) return '';
      if (key.includes(':')) {
        return t(key);
      }

      const fallbackKeys = [
        `style-templates:effects.${key}`,
        `style-templates:dances.${key}`,
        `style-templates:${key}`,
      ];

      for (const candidate of fallbackKeys) {
        const translated = t(candidate, { defaultValue: '' });
        if (translated) {
          return translated;
        }
      }

      return key;
    },
    [t],
  );

  // 将 effectTemplateMap 提取为独立的 useMemo，避免在多处重复计算
  const effectTemplateMap = useMemo(
    () =>
      Object.fromEntries(
        videoTemplates.flatMap(category =>
          category.templates.map(template => [template.id, template]),
        ),
      ),
    [videoTemplates],
  );

  const currentStyleData = useMemo(() => {
    if (styleMode === 'dance') {
      if (selectedDanceStyle) {
        // For uploaded video, name might be different
        if (selectedDanceStyle.id === 'uploaded-video') {
          return {
            video: selectedDanceStyle.video,
            // UI 展示使用 displayVideo，降级到 video
            displayVideo: selectedDanceStyle.video,
            name: t('style-templates:dances.uploadMotionVideo'),
            subtitle: t('ui.styleModes.dance'),
          };
        }
        return {
          video: selectedDanceStyle.video,
          // UI 展示优先使用 displayVideo，降级到 video
          displayVideo:
            selectedDanceStyle.displayVideo || selectedDanceStyle.video,
          name:
            t(`style-templates:dances.${selectedDanceStyle.nameKey}`) ||
            selectedDanceStyle.nameKey,
          subtitle: t('ui.styleModes.dance'),
        };
      }
    } else if (styleMode === 'template') {
      const style = effectTemplateMap[selectedStyleId];
      if (style) {
        return {
          video: style.video,
          // effect 模板也支持 displayVideo
          displayVideo: style.displayVideo || style.video,
          name: resolveTemplateName(style.nameKey),
          subtitle: t('ui.styleModes.templates'),
        };
      }
    }
    return null;
  }, [
    styleMode,
    selectedDanceStyle,
    selectedStyleId,
    effectTemplateMap,
    t,
    resolveTemplateName,
  ]);

  // Get current template's needsCharacterInputs for conditional rendering
  const currentTemplateInputs = useMemo(() => {
    if (styleMode === 'template') {
      const style = effectTemplateMap[selectedStyleId];

      if (style?.needsCharacterInputs) {
        const inputs = style.needsCharacterInputs;

        // Handle both old string[] format and new TemplateInputField[] format
        if (Array.isArray(inputs) && inputs.length > 0) {
          if (typeof inputs[0] === 'string') {
            // Old string[] format - convert to TemplateInputField format
            return inputs.map(input => ({
              input_field: input,
              placeholder: null,
            }));
          } else {
            // New TemplateInputField[] format
            return inputs;
          }
        }
      }
    }
    return null;
  }, [styleMode, selectedStyleId, effectTemplateMap]);

  // Clean up inputValues when template changes to remove fields that are no longer needed
  useEffect(() => {
    if (currentTemplateInputs) {
      const requiredFields = currentTemplateInputs.map(
        input => input.input_field,
      );
      setInputValues(prev => {
        const cleaned: Record<string, string> = {};
        requiredFields.forEach(field => {
          if (prev[field]) {
            cleaned[field] = prev[field];
          }
        });
        return cleaned;
      });
    } else {
      // No inputs required, clear all
      setInputValues({});
    }
  }, [currentTemplateInputs]);

  const [uploadedDanceTempUrl, setUploadedDanceTempUrl] = useState<
    string | null
  >(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  }>({ width: 600, height: 600 });
  const [isPublic, setIsPublic] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>(
    VideoResolution['480p'],
  );
  const [cost, setCost] = useState(
    calculateImageToAnimationCost(ImageToVideoModel.VIDU),
  );
  const [duration, setDuration] = useState<
    '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  >('5');
  const { submit: openModal } = useOpenModal();
  const { resultVideos, setResultVideos, submitTask, profile, addTaskId } =
    useVideos(
      mode === 'dance' ? 'dance-video-generator' : 'video-effect',
      exampleVideoUrl,
    );

  // effect style 价格计算
  const calculateEffectCost = useCallback(
    (effectStyle: VideoStyleTemplate | undefined) => {
      if (!effectStyle) return 0;
      const { model, duration } = effectStyle;
      switch (model) {
        case ModelIds.VIDU:
          //return duration === 5 ? 200 : 400;
          return 200;
        case ModelIds.WAN:
          return calculateImageToAnimationCost(
            ImageToVideoModel.WAN,
            duration.toString() as any,
            '480p',
            aspectRatio as any,
          );
        case ModelIds.WAN_ANIMATE:
          return VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimate * duration;
        case ModelIds.SORA:
        case ModelIds.SORA_TEXT_TO_VIDEO:
          // KIE.AI Sora: 30 Zaps/sec
          return SORA_KIE_UNIT * duration;
        case ModelIds.SEEDANCE:
          return calculateImageToAnimationCost(
            ImageToVideoModel.SEEDANCE,
            duration.toString() as any,
          );
        default:
          return 200;
      }
    },
    [aspectRatio],
  );

  const updateExampleVideo = useCallback(
    (videoUrl: string) => {
      setResultVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === -1 ? { ...video, video_url: videoUrl } : video,
        ),
      );
    },
    [setResultVideos],
  );

  useEffect(() => {
    if (styleMode === 'dance' && selectedStyleId) {
      if (selectedStyleId !== 'uploaded-video') {
        const danceTemplateMap = getDanceTemplateMap();
        const danceStyle = danceTemplateMap[selectedStyleId];
        if (danceStyle && danceStyle !== selectedDanceStyle) {
          setSelectedDanceStyle(danceStyle);
        }
      }
    }

    // 处理示例视频的更新
    if (selectedStyleId) {
      let template: VideoStyleTemplate | DanceTemplate | undefined;
      if (styleMode === 'dance') {
        // 对于 uploaded-video，使用当前的 selectedDanceStyle
        if (selectedStyleId === 'uploaded-video') {
          template = selectedDanceStyle;
        } else {
          const danceTemplateMap = getDanceTemplateMap();
          template = danceTemplateMap[selectedStyleId];
        }
      } else if (styleMode === 'template') {
        // Compute effectTemplateMap dynamically
        const effectTemplateMap = Object.fromEntries(
          videoTemplates.flatMap(category =>
            category.templates.map(template => [template.id, template]),
          ),
        );
        template = effectTemplateMap[selectedStyleId];
      }

      if (template) {
        updateExampleVideo(template.video);
      }
    }
  }, [
    styleMode,
    selectedStyleId,
    selectedDanceStyle,
    videoTemplates,
    updateExampleVideo,
    getDanceTemplateMap,
  ]);

  // 当切换 mode 时，自动选择第一个 template
  useEffect(() => {
    if (styleMode === 'template' && videoTemplates.length > 0) {
      // Compute effectTemplateMap to check if current style exists
      const effectTemplateMap = Object.fromEntries(
        videoTemplates.flatMap(category =>
          category.templates.map(template => [template.id, template]),
        ),
      );

      if (!selectedStyleId || !effectTemplateMap[selectedStyleId]) {
        const firstTemplate = videoTemplates[0]?.templates[0];
        if (firstTemplate) {
          setSelectedStyleId(firstTemplate.id);
        }
      }
    } else if (styleMode === 'dance' && getDanceTemplatesSync().length > 0) {
      const danceTemplateMap = getDanceTemplateMap();
      if (
        !selectedStyleId ||
        (!danceTemplateMap[selectedStyleId] &&
          selectedStyleId !== 'uploaded-video')
      ) {
        setSelectedStyleId(getDanceTemplatesSync()[0].id);
      }
    }
  }, [styleMode, selectedStyleId, videoTemplates, getDanceTemplateMap]);
  useEffect(() => {
    if (profile?.plan) {
      setIsPublic(profile.plan === 'Free');
    }
  }, [profile?.plan]);

  useEffect(() => {
    getImageSize(inputImage).then(size => {
      setImageSize(size);
      const autoAspectRatio = getClosestAspectRatioFromList(
        size.width,
        size.height,
        ['16:9', '9:16', '1:1'],
      );
      setAspectRatio(autoAspectRatio);
    });
  }, [inputImage]);

  useEffect(() => {
    if (styleMode === 'dance') {
      const danceStyle = selectedDanceStyle;
      if (danceStyle) {
        setCost(calculateDanceCost(danceStyle));
      }
    } else if (styleMode === 'template') {
      // Compute effectTemplateMap dynamically
      const effectTemplateMap = Object.fromEntries(
        videoTemplates.flatMap(category =>
          category.templates.map(template => [template.id, template]),
        ),
      );

      const effectStyle = effectTemplateMap[selectedStyleId];
      if (effectStyle) {
        setCost(calculateEffectCost(effectStyle));
      }
    }
  }, [
    styleMode,
    selectedStyleId,
    selectedDanceStyle,
    videoTemplates,
    calculateDanceCost,
    calculateEffectCost,
  ]);

  useEffect(() => {
    const isSoraModel =
      selectedModel === ImageToVideoModel.SORA ||
      selectedModel === ImageToVideoModel.SORA_PRO;
    if (selectedModel === ImageToVideoModel.VEO) {
      setDuration('8');
    } else if (isSoraModel) {
      setDuration('4');
    } else {
      setDuration('5');
    }

    setSelectedResolution(
      selectedModel === ImageToVideoModel.SORA_PRO ||
        selectedModel === ImageToVideoModel.SORA
        ? VideoResolution['720p']
        : VideoResolution['480p'],
    );
  }, [selectedModel]);

  // Get prompt from URL query parameter
  useEffect(() => {
    if (!router.isReady) return;

    const danceParam = router.query.dance;
    if (typeof danceParam === 'string' && danceParam.length > 0) {
      setStyleMode('dance');
      setSelectedStyleId(danceParam);
      const danceTemplateMap = getDanceTemplateMap();
      const dance = danceTemplateMap[danceParam];
      if (dance) {
        setSelectedDanceStyle(dance);
      }
      hasPresetStyleRef.current = true;
      clearRouterParam('dance');
    }

    const effectParam = router.query.effect;
    const styleParam =
      typeof effectParam === 'string' && effectParam.length > 0
        ? effectParam
        : typeof router.query.style === 'string'
          ? router.query.style
          : undefined;

    if (styleParam) {
      // 验证样式是否存在
      const effectTemplateMap = Object.fromEntries(
        videoTemplates.flatMap(category =>
          category.templates.map(template => [template.id, template]),
        ),
      );

      if (effectTemplateMap[styleParam]) {
        setStyleMode('template');
        setSelectedStyleId(styleParam);
        hasPresetStyleRef.current = true;
      } else {
        // 如果样式不存在，显示警告
        console.warn(`Style "${styleParam}" not found in effectTemplateMap`);
      }
    }

    if (router.query.mode) {
      // Handle legacy 'template' mode from old URLs
      const modeParam =
        router.query.mode === 'template' ? 'effect' : router.query.mode;
      setStyleMode(modeParam as StyleMode);
    }

    if (router.query.model) {
      const modelParam = router.query.model as string;
      const mappedModel = mapStringToVideoModel(modelParam);
      setSelectedModel(mappedModel);
    }

    const generationId = router.query.generationId;

    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;
      if (generation) {
        const model = generation.model;
        if (model) {
          const mappedModel =
            typeof model === 'string'
              ? mapStringToVideoModel(model)
              : (model as ImageToVideoModel);
          setSelectedModel(mappedModel);
        }

        if (generation.meta_data) {
          const meta = generation.meta_data;

          // set mode
          if (meta.mode) {
            setStyleMode(meta.mode as StyleMode);
            if (meta.style_id) {
              // 直接设置 selectedStyleId，副作用由 useEffect 处理
              setSelectedStyleId(meta.style_id);
              hasPresetStyleRef.current = true;
            }
          }
          if (meta.resolution) {
            setSelectedResolution(meta.resolution as VideoResolution);
          }
          if (meta.aspect_ratio && meta.mode === 'template') {
            setAspectRatio(meta.aspect_ratio as string);
          }
        }
        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query, clearRouterParam, getDanceTemplateMap]);

  // Open StyleTemplatePicker modal on initial load when in effect mode (only if no preset style)
  useEffect(() => {
    if (!router.isReady) return;

    // 检查URL中是否有style参数
    const hasStyleParam =
      typeof router.query.style === 'string' && router.query.style.length > 0;

    if (
      styleMode === 'template' &&
      !hasPresetStyleRef.current &&
      !hasAutoOpenedPickerRef.current &&
      !hasStyleParam
    ) {
      hasAutoOpenedPickerRef.current = true;
      setTimeout(() => {
        styleTemplatesPickerRef.current?.onOpen();
      }, 300);
    }
  }, [styleMode, router.isReady, router.query]);

  useEffect(() => {
    if (styleMode === 'template') {
      setSelectedModel(ImageToVideoModel.VIDU);
      setDuration('5');
    }
  }, [styleMode]);

  useEffect(() => {
    if (resultVideos.length > 0) {
      lastVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultVideos]);

  /* ******************************  点击删除视频相关    *****************************  */
  // 点击删除按钮时保存视频 ID
  const handleDeleteClick = (videoId: number) => {
    handleVideoDeleteClick(
      videoId,
      setResultVideos,
      setVideoToDelete,
      setDeleteModalOpen,
    );
  };

  // 先生成表情包九宫格
  const generateChibiSticker = async (inputImage: string) => {
    const params = {
      image_url: inputImage,
      style_id: 'chibi-stickers',
      mode: 'template',
      tool: 'image_animation',
    };

    const response = await fetch('/api/tools/style-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Generate chibi sticker failed');
    }

    const data = await response.json();
    if (data.error === '429') {
      return { error: 'Resource has been exhausted', output: '' };
    }
    if (data.output) {
      return { output: data.output, error: '' };
    }

    return data;
  };

  // 确认删除时使用保存的 ID
  const handleConfirmDelete = async () => {
    await handleVideoConfirmDelete(
      videoToDelete,
      [mode === 'dance' ? 'dance-video-generator' : 'video-effect'],
      t,
      setResultVideos,
      setVideoToDelete,
      setDeleteModalOpen,
    );
  };

  /* ******************************  下载短视频   *****************************  */
  // 下载短视频按键
  const handleDownload = async (videoUrl: string) => {
    await handleVideoDownload(videoUrl, t);
  };

  /* ******************************   图片上传生成视频相关    *****************************  */

  const handleChange = async (url: string) => {
    // 如果是 Supabase URL，直接使用
    if (url.includes('supabase.co')) {
      setInputImage(url);
    } else {
      const base64 = await redrawImageToBase64(url);
      setInputImage(base64);
    }
  };

  const submitMotionTask = async (
    imageUrl: string,
    style: DanceTemplate,
    shouldDeleteMedia: boolean,
  ) => {
    const roundedDuration = Math.max(0, Math.round(style.duration));
    const apiParams: any = {
      image: imageUrl,
      video: style.video,
      target_model: ModelIds.WAN_ANIMATE,
      selectedDuration: roundedDuration,
      tool: 'dance-video-generator',
      should_delete_media: shouldDeleteMedia,
      mode: 'animate',
      meta_data: {
        style_id: style.id,
        mode: 'dance',
      },
    };

    const taskId = await submitTask(apiParams).catch(error => {
      throw error;
    });

    return taskId;
  };

  const handleUploadDanceVideo = async (
    fileUrl: string,
  ): Promise<string | null> => {
    try {
      const videoUrl = await uploadTempVideo(fileUrl, profile.id);
      if (!videoUrl) {
        toast.error(
          t('toast:error.uploadVideoFailed', 'Failed to upload video'),
        );
        return null;
      }
      return videoUrl;
    } catch (error) {
      toast.error(t('toast:error.uploadVideoFailed', 'Failed to upload video'));
      return null;
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  };

  const handleGenerateChibiSticker = async (
    imageUrl: string,
  ): Promise<string> => {
    const stickerToastId = toast.loading(t('ui.toasts.generatingSticker'), {
      position: 'top-center',
    });

    try {
      const chibiSticker = await generateChibiSticker(imageUrl);
      toast.dismiss(stickerToastId);

      if (chibiSticker.error) {
        showErrorToast(chibiSticker.error);
        return imageUrl; // 返回原图
      } else {
        return chibiSticker.output;
      }
    } catch (error) {
      toast.dismiss(stickerToastId);
      showErrorToast(t('ui.toasts.stickerGeneratedFailed'));
      return imageUrl; // 返回原图
    }
  };

  const handleSubmit = async () => {
    // Validate image input based on mode
    if (isMultiImageMode) {
      if (inputImages.length < (currentInputMedia?.min_count || 1)) {
        showErrorToast(
          t(
            'toast:imageToVideo.minImagesRequired',
            `Please upload at least ${currentInputMedia?.min_count || 1} images`,
          ),
        );
        return;
      }
    } else if (!inputImage) {
      showErrorToast(
        t('toast:imageToVideo.noImageSelected', 'Please select an image first'),
      );
      return;
    }

    if (profile.credit < cost) {
      openModal('pricing');
      return;
    }

    setLoading(true);
    let currentImageUrl = '';
    let should_delete_media = false;
    // 用于存储实际图片尺寸，避免使用组件 state 的默认值
    let imageSizeForTask: { width: number; height: number } | undefined;
    // Handle multi-image mode: stitch images together

    let imageToProcess = inputImage;

    if (isMultiImageMode && inputImages.length > 0) {
      if (inputImages.length > 1) {
        // Stitch multiple images into one
        const imageUrls = inputImages.map(img => img.url);
        const imageNames = inputImages.map(img => img.name);

        try {
          const stitchedBlob = await stitchImagesInBrowser({
            imageUrls,
            imageNames,
            aspectRatio: '16:9', // Default aspect ratio for stitching
          });

          // Upload stitched image to FAL
          currentImageUrl = await uploadImageToFal(
            stitchedBlob,
            (profile as any)?.id,
          );
          should_delete_media = false;
          // 计算拼接后图片的尺寸
          imageSizeForTask = await getImageSize(currentImageUrl);
        } catch (error) {
          console.error('Failed to stitch images:', error);
          showErrorToast(
            t('toast:error.stitchingFailed', 'Failed to process images'),
          );
          setLoading(false);
          return;
        }
      } else if (inputImages.length === 1) {
        // Single image in multi-image mode, use it directly
        imageToProcess = inputImages[0].url;
      }
    }

    // If we didn't stitch (single image mode or single image in multi-mode)
    if (!currentImageUrl) {
      // 计算单张图片的尺寸并赋值给 imageSizeForTask
      imageSizeForTask = await getImageSize(imageToProcess);

      if (imageToProcess.includes('supabase.co')) {
        currentImageUrl = imageToProcess;
        should_delete_media = false;
      } else {
        currentImageUrl = await uploadImageFromUrlWithFile(imageToProcess);
        should_delete_media = true;
      }
    }

    if (!currentImageUrl) {
      showErrorToast(t('toast:error.uploadImageFailed'));
      setLoading(false);
      return;
    }

    try {
      // 调用 API 处理图片

      // 生成表情包九宫格
      if (selectedStyleId === 'animated-stickers') {
        currentImageUrl = await handleGenerateChibiSticker(currentImageUrl);
      }

      let taskId: number | null = null;

      if (styleMode === 'dance') {
        let styleForSubmit = selectedDanceStyle as DanceTemplate;
        if (styleForSubmit?.id === 'uploaded-video') {
          if (!uploadedDanceTempUrl) {
            toast.error(t('toast:imageToVideo.noVideoSelected'));
            setLoading(false);
            return;
          }

          const videoUrl = await handleUploadDanceVideo(uploadedDanceTempUrl);
          if (!videoUrl) {
            setLoading(false);
            return;
          }

          styleForSubmit = { ...styleForSubmit, video: videoUrl };
        }

        taskId =
          (await submitMotionTask(
            currentImageUrl,
            styleForSubmit,
            should_delete_media,
          )) || null;
      } else {
        const image = currentImageUrl;
        const images = [currentImageUrl];

        const isMultiLangModel = [
          ImageToVideoModel.VEO,
          ImageToVideoModel.SORA,
          ImageToVideoModel.SORA_PRO,
        ].includes(selectedModel);

        const params = {
          image,
          images,
          prompt: '',
          aspect_ratio: aspectRatio,
          target_model: convertModel(selectedModel) as any,
          model: selectedModel,
          duration,
          style: VideoStyle.DEFAULT,
          resolution: selectedResolution,
          frames_per_second: undefined,
          tool: mode === 'dance' ? 'dance-video-generator' : 'video-effect',
          should_delete_media,
          image_size: imageSizeForTask,
          meta_data: {
            aspect_ratio: aspectRatio,
            duration,
            resolution: selectedResolution,
            mode: styleMode,
            style_id:
              selectedStyleId !== 'uploaded-video' ? selectedStyleId : '',
            ...inputValues, // Include all dynamic input values
          } as any,
          no_translate: isMultiLangModel,
        };

        if (styleMode === 'template') {
          const selectedEffect = effectTemplateMap[selectedStyleId];
          if (selectedEffect) {
            params.duration = selectedEffect.duration.toString() as any;
            // selectedEffect.model is already a ModelIds number, use it directly
            params.target_model = selectedEffect.model;
            // Add needMiddleware to meta_data for proper prompt processing
            params.meta_data.need_middleware = selectedEffect.needMiddleware;
            // 优先使用用户输入的 prompt，其次使用模板 prompt，最后使用模板名称
            if (!params.prompt) {
              params.prompt =
                selectedEffect.prompt || selectedEffect.nameKey || selectedStyleId;
            }
          } else {
            params.duration = '5';
            params.target_model = ModelIds.VIDU;
          }
        }

        taskId =
          (await submitTask(params).catch(error => {
            console.error('Submit task error:', error);
            return null;
          })) || null;
      }

      if (isNil(taskId)) {
        return;
      }

      addTaskId(taskId);

      // 记录 style 使用统计
      if (styleMode === 'template' && selectedStyleId) {
        recordStyleUsage('ai-video-effect', selectedStyleId).catch(err => {
          console.error('Failed to record style usage:', err);
        });
      } else if (styleMode === 'dance' && selectedDanceStyle?.id) {
        recordStyleUsage('dance-video-generator', selectedDanceStyle.id).catch(
          err => {
            console.error('Failed to record style usage:', err);
          },
        );
      }

      const newVideo = {
        id: taskId,
        video_url: '',
        prompt: '',
        status: GenerationStatus.GENERATING,
        created_at: new Date().toISOString(),
        meta_data: JSON.stringify({
          mode: styleMode,
          style_id: selectedStyleId,
          ...inputValues, // Include all dynamic input values
        }),
      };

      const updatedVideos = [
        newVideo,
        ...resultVideos.filter(video => video.id !== -1),
      ];

      // Sort by created_at descending (newest first)
      updatedVideos.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setResultVideos(updatedVideos);
      setLoading(false);
    } catch (error) {
      console.log(error);
      showErrorToast(t('toast:imageToVideo.generateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStyleChange = (
    style: VideoStyleTemplate | DanceTemplate,
  ) => {
    setSelectedStyleId(style.id);
    if (styleMode === 'dance') {
      setSelectedDanceStyle(style as DanceTemplate);
    }
  };

  // 检查提交按钮是否应该禁用
  const isSubmitDisabled = () => {
    // Check image input based on mode
    if (isMultiImageMode) {
      if (inputImages.length < (currentInputMedia?.min_count || 1)) return true;
    } else if (!inputImage) {
      return true;
    }

    switch (styleMode) {
      case 'template':
        return !selectedStyleId;
      case 'dance':
        return !selectedDanceStyle;
      default:
        return false;
    }
  };

  return (
    <div className='grid grid-cols-12 gap-6 mt-4 mb-14 md:mb-16 md:grid-rows-[minmax(0,auto)]'>
      {/* Left input area */}
      <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-5 md:row-span-1'>
        <Card className='p-4 md:px-6 md:pt-4 md:pb-6 transition-all duration-300 shadow-2xl border-1.5 border-primary-200'>
          <div className='mb-1 w-full overflow-hidden overflow-x-auto'>
            <VideoToolsTabs activeTab={mode} />
          </div>

          {/* Conditional rendering based on defaultMode */}
          {styleMode === 'template' ? (
            <div>
              {currentStyleData ? (
                <HeroBanner
                  video={currentStyleData.displayVideo}
                  title={currentStyleData.name}
                  subtitle={currentStyleData.subtitle}
                  onChange={() => styleTemplatesPickerRef.current?.onOpen()}
                  onRandom={() => {
                    if (videoTemplates.length > 0) {
                      // Flatten all templates
                      const allTemplates = videoTemplates.flatMap(
                        cat => cat.templates,
                      );
                      // Pick a random one
                      const randomTemplate =
                        allTemplates[
                          Math.floor(Math.random() * allTemplates.length)
                        ];
                      handleSelectStyleChange(
                        randomTemplate as VideoStyleTemplate,
                      );
                    }
                  }}
                  t={t}
                />
              ) : isLoadingTemplates ? (
                // Show loading state while templates are loading
                <div className='relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden bg-muted flex items-center justify-center'>
                  <div className='text-muted-foreground text-center'>
                    <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mb-2 mx-auto'></div>
                    <p>{t('common:loading', 'Loading...')}</p>
                  </div>
                </div>
              ) : (
                // Show placeholder when no template is selected
                <div
                  className='relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden bg-muted flex items-center justify-center cursor-pointer border-2 border-dashed border-border'
                  onClick={() => styleTemplatesPickerRef.current?.onOpen()}>
                  <div className='text-muted-foreground text-center'>
                    <MdOutlineAnimation className='w-12 h-12 mx-auto mb-2' />
                    <p>{t('ui.selectTemplate', 'Select a template')}</p>
                  </div>
                </div>
              )}
              <div className='hidden'>
                <StyleTemplatePicker
                  ref={styleTemplatesPickerRef}
                  selectedStyle={selectedStyleId}
                  onSelect={style =>
                    handleSelectStyleChange(style as VideoStyleTemplate)
                  }
                  templateType='video'
                  tool='i2v-effect'
                  recommendedStyleIds={[
                    '360-View',
                    'magical-girl-transformation',
                    'anime-mv',
                    'sprite-attack-animation',
                  ]}
                />
              </div>
            </div>
          ) : styleMode === 'dance' ? (
            <div>
              {currentStyleData && (
                <HeroBanner
                  video={currentStyleData.displayVideo}
                  title={currentStyleData.name}
                  subtitle={currentStyleData.subtitle}
                  onChange={() => setDancePickerOpen(true)}
                  onRandom={() => {
                    const currentDanceTemplates = getDanceTemplatesSync();
                    if (currentDanceTemplates.length > 0) {
                      const randomTemplate =
                        currentDanceTemplates[
                          Math.floor(
                            Math.random() * currentDanceTemplates.length,
                          )
                        ];
                      handleSelectStyleChange(randomTemplate as DanceTemplate);
                    }
                  }}
                  forceCrop={false}
                  t={t}
                />
              )}
            </div>
          ) : null}

          {/* Image Upload Section with Toggle */}
          <div className='mt-4'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-bold text-foreground text-sm'>
                {isMultiImageMode
                  ? t('ui.input.images.title', 'Images')
                  : t('ui.input.image.title', 'Image')}
              </h3>
              <ImportFromCharacterDropdown
                onSelect={char => {
                  const updates: Record<string, string> = {};

                  if (
                    currentTemplateInputs?.some(
                      input => input.input_field === 'characterName',
                    ) &&
                    char.character_name
                  ) {
                    updates.characterName = char.character_name;
                  }
                  if (
                    currentTemplateInputs?.some(
                      input => input.input_field === 'occupation',
                    ) &&
                    char.occupation
                  ) {
                    updates.occupation = char.occupation;
                  }

                  if (Object.keys(updates).length > 0) {
                    setInputValues(prev => ({ ...prev, ...updates }));
                  }

                  if (char.character_pfp) {
                    const pfpUrl = char.character_pfp;
                    if (isMultiImageMode) {
                      // Check if max_count limit is reached before adding
                      const maxCount = currentInputMedia?.max_count || 3;
                      if (inputImages.length >= maxCount) {
                        toast.error(
                          t('toast.maxImagesReached', {
                            max: maxCount,
                            defaultValue: `Maximum ${maxCount} images allowed`,
                          }),
                          {
                            position: 'top-center',
                            style: { background: '#555', color: '#fff' },
                          },
                        );
                        return;
                      }
                      // Add to multi-image list
                      setInputImages(prev => [
                        ...prev,
                        {
                          id: `char-${Date.now()}`,
                          url: pfpUrl,
                          name: char.character_name || 'Character',
                        },
                      ]);
                    } else {
                      setInputImage(pfpUrl);
                    }
                  }
                }}
              />
            </div>

            {isMultiImageMode ? (
              <MultiImageUploadArea
                images={inputImages}
                onImagesChange={setInputImages}
                minCount={currentInputMedia?.min_count || 1}
                maxCount={currentInputMedia?.max_count || 3}
                accept='.png,.jpg,.jpeg,.webp'
              />
            ) : (
              <UploadFile
                onChange={handleChange}
                accept='.png,.jpg,.jpeg,.webp'
                initialImage={inputImage}
                className='!h-18 !md:h-27'
              />
            )}
            <p className='text-xs text-muted-foreground mt-2'>
              {t(
                'ui.input.image.description',
                'Upload JPG/PNG/WEBP images up to 10MB, with a minimum width/height of 300px.',
              )}
            </p>
          </div>

          {/* Dynamic Template Input Fields */}
          {currentTemplateInputs && currentTemplateInputs.length > 0 && (
            <div className='mt-4 space-y-4'>
              <div>
                <h3 className='font-bold text-foreground text-sm mb-2'>
                  {t('ui.input.config', 'Additional Information')}
                </h3>
                <div className='space-y-3'>
                  {currentTemplateInputs.map(inputField => {
                    const fieldName = inputField.input_field;
                    const fieldType = inputField.type || 'text';
                    const placeholder =
                      inputField.placeholder ||
                      t(`ui.${fieldName}Placeholder`, `Enter ${fieldName}...`);
                    const label = t(
                      `ui.${fieldName}`,
                      fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
                    ) as string;

                    const handleValueChange = (value: string) => {
                      setInputValues(prev => ({ ...prev, [fieldName]: value }));
                    };

                    // 选择题渲染 - 支持 options 或 choices 字段
                    const hasChoices =
                      (fieldType === 'choice' && inputField.choices) ||
                      inputField.options;
                    const choiceOptions =
                      inputField.options || inputField.choices;

                    if (hasChoices && choiceOptions) {
                      // 如果有question字段，使用Select下拉框；否则使用radio按钮
                      if (inputField.question) {
                        return (
                          <Select
                            key={fieldName}
                            radius='md'
                            label={inputField.question}
                            placeholder={`Select ${inputField.question.toLowerCase()}...`}
                            selectedKeys={
                              inputValues[fieldName]
                                ? [inputValues[fieldName]]
                                : []
                            }
                            onSelectionChange={keys => {
                              const selected = Array.from(keys)[0] as string;
                              if (selected) {
                                handleValueChange(selected);
                              }
                            }}
                            variant='flat'
                            size='sm'>
                            {choiceOptions.map((choice, index) => {
                              // 使用 label 作为显示内容，但 value 作为实际的值
                              const label =
                                choice?.label ||
                                choice?.text ||
                                choice?.name ||
                                choice?.value ||
                                `option-${index}`;
                              const value =
                                choice?.value || choice?.id || label;

                              return (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </Select>
                        );
                      } else {
                        // 无question字段时使用radio按钮
                        return (
                          <div key={fieldName} className='space-y-3'>
                            <div className='p-4 bg-muted rounded-lg'>
                              <p className='font-medium text-foreground mb-3'>
                                {label}
                              </p>
                              <div className='space-y-2'>
                                {choiceOptions.map((choice, index) => {
                                  const label =
                                    choice?.label ||
                                    choice?.text ||
                                    choice?.name ||
                                    choice?.value ||
                                    `option-${index}`;
                                  const value =
                                    choice?.value || choice?.id || label;
                                  return (
                                    <label
                                      key={value}
                                      className={cn(
                                        'flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all group',
                                        inputValues[fieldName] === value
                                          ? 'border-primary-500 bg-primary-100'
                                          : 'border-border bg-card hover:bg-muted hover:border-primary-300',
                                      )}>
                                      <input
                                        type='radio'
                                        name={fieldName}
                                        value={value}
                                        checked={
                                          inputValues[fieldName] === value
                                        }
                                        onChange={e =>
                                          handleValueChange(e.target.value)
                                        }
                                        className='mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500'
                                      />
                                      <div className='flex-1'>
                                        <span className='text-sm font-medium text-foreground'>
                                          {label}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    }

                    // 原有的文本输入渲染逻辑
                    const isTextarea =
                      fieldType === 'textarea' ||
                      fieldName.toLowerCase().includes('info') ||
                      fieldName.toLowerCase().includes('description') ||
                      fieldName.toLowerCase().includes('background') ||
                      fieldName.toLowerCase().includes('effect') ||
                      (typeof placeholder === 'string' &&
                        placeholder.length > 50);

                    return (
                      <div key={fieldName}>
                        {isTextarea ? (
                          <Textarea
                            radius='md'
                            label={label}
                            placeholder={placeholder as string}
                            value={inputValues[fieldName] || ''}
                            onValueChange={handleValueChange}
                            variant='flat'
                            size='sm'
                            minRows={3}
                            classNames={{
                              input: 'resize-none',
                            }}
                          />
                        ) : (
                          <Input
                            radius='md'
                            label={label}
                            placeholder={placeholder as string}
                            value={inputValues[fieldName] || ''}
                            onValueChange={handleValueChange}
                            variant='flat'
                            size='sm'
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Public Visibility - show in all modes */}
          <div className='my-2'>
            <PublicVisibilityToggle
              isPublic={isPublic}
              onToggle={setIsPublic}
              variant='section'
            />
          </div>

          {/* Submit button */}
          <Button
            isLoading={loading}
            color='primary'
            className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
            size='lg'
            onPress={() => {
              if (!isAuth) {
                loginModal?.onOpen?.();
              } else {
                handleSubmit();
              }
            }}
            isDisabled={isSubmitDisabled()}>
            <span className='mr-2'>{t('ui.buttons.generateAnimation')}</span>
            {isAuth && (
              <Chip
                startContent={
                  <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                }
                variant='bordered'
                color={'primary'}
                size='sm'
                className='bg-card'>
                -{cost}/{profile.credit}
              </Chip>
            )}
          </Button>
        </Card>
      </div>

      {/* Right output area */}
      <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-7 md:row-span-1 md:h-0 md:min-h-full'>
        <Card className='p-4 md:pb-6 md:px-6 md:pt-4 h-full shadow-md md:shadow-2xl border-1.5 border-primary-50 md:flex md:flex-col md:overflow-hidden'>
          <h2 className='flex items-center mb-4 text-base font-bold text-primary-800 dark:text-primary-300'>
            <FaDownload className='mr-2 text-primary-600' />{' '}
            {t('ui.output.title')}
          </h2>
          <div className='flex overflow-hidden flex-col flex-1 w-full max-h-[600px] md:max-h-none'>
            <div className='overflow-y-auto flex-1 rounded-lg md:min-h-0'>
              {resultVideos?.length > 0 ? (
                <div className='grid grid-cols-1 gap-2'>
                  {resultVideos.map((video, index) => (
                    <ResultCard
                      showPrompt
                      key={video.id}
                      data={video}
                      handleDownload={handleDownload}
                      handleDelete={handleDeleteClick}
                      index={index}
                      type='video'
                      totalCount={resultVideos.length}
                      isExample={video.id === -1}
                      tool={
                        mode === 'dance'
                          ? 'dance-video-generator'
                          : 'video-effect'
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                  <MdOutlineAnimation
                    size={48}
                    className='mb-4 text-primary-300'
                  />
                  <p className='text-center'>{t('ui.output.empty.line1')}</p>
                  <p className='mt-2 text-sm text-center'>
                    {t('ui.output.empty.line2')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        shouldBlockScroll={false}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
          base: 'border border-primary-200',
        }}>
        <ModalContent>
          <ModalHeader className='text-primary-800'>
            {t('ui.deleteModal.title')}
          </ModalHeader>
          <ModalBody>
            <p>{t('ui.deleteModal.message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setDeleteModalOpen(false)}
              className='transition-all duration-300 hover:bg-muted'>
              {t('ui.deleteModal.cancelButton')}
            </Button>
            <Button
              color='danger'
              onPress={handleConfirmDelete}
              className='bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 hover:from-red-600 hover:to-pink-600'>
              {t('ui.deleteModal.deleteButton')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={dancePickerOpen}
        onClose={() => setDancePickerOpen(false)}
        size='3xl'
        shouldBlockScroll={false}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
          base: 'border border-primary-200',
        }}>
        <ModalContent>
          <ModalHeader className='text-primary-800  pt-4 pb-0'>
            {t('ui.styleModes.dance')}
          </ModalHeader>
          <ModalBody>
            <VideoStyleGrids
              selectedStyleId={selectedStyleId}
              setStyle={style => {
                handleSelectStyleChange(style as DanceTemplate);
                setDancePickerOpen(false);
              }}
              onUploadedVideoChange={(
                file: File | null,
                tempUrl: string | null,
                duration: number,
              ) => {
                setUploadedDanceTempUrl(tempUrl);
                const uploadedStyle: DanceTemplate = {
                  id: 'uploaded-video',
                  nameKey: 'uploadedVideo',
                  video: tempUrl || '',
                  duration,
                };
                // Update selection states when video is uploaded
                if (tempUrl) {
                  setSelectedStyleId('uploaded-video');
                  setSelectedDanceStyle(uploadedStyle);
                } else {
                  // Clear selection when video is removed
                  setSelectedStyleId('');
                  setSelectedDanceStyle(undefined);
                }
                setCost(calculateDanceCost(uploadedStyle));
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default memo(TemplateVideoGenerator);
