/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-unused-vars, no-nested-ternary, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { FaDownload, FaRandom } from 'react-icons/fa';
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
  Spinner,
} from '@nextui-org/react';
import { ImportFromCharacterDropdown } from '../ImportFromCharacterDropdown';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import UploadFile from '../UploadFile';
import { MultiImageItem } from './MultiImageUploadArea';
import { stitchImagesInBrowser } from '../../utils/stitchImagesInBrowser';
import { uploadImageToFal } from '../../utilities/fal';
import {
  GenerationStatus,
  genId,
  ImageData,
  VideoData,
  dispatchGenerated,
  deleteMediaData,
} from './utils';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import {
  calculateStyleTransferCost,
  VIDEO_TO_VIDEO_GENERATION_PER_SECOND,
  calculateVideoTemplateCost,
  ImageToVideoModel,
} from '../../../api/tools/_zaps';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import {
  redrawImageToBase64,
  getImageSize,
  toastWarn,
  urlToBase64,
} from '@/utils/index';
import { getClosestAspectRatioFromList } from '../VideoGeneration/utils/videoHelpers';
import { uploadImageFromUrlWithFile } from '@/utils/uploadUtils';
import { useRouter } from 'next/router';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { ModelIds, ERROR_CODES, GEMINI_LIMITS } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVideos } from 'hooks/useVideos';
import { isNil } from 'lodash-es';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { VideoStyleGrids } from '../StyleTemplatePicker/StyleGirds/VideoStyleGrids';
import {
  DanceTemplate,
  getDanceTemplatesSync,
} from '../StyleTemplatePicker/StyleGirds/styles';
import { loginModalAtom } from '../../state';
import { uploadTempVideo } from '@/components/ToolsPage/utils';
import {
  handleVideoDownload,
  handleDeleteClick as handleVideoDeleteClick,
  handleConfirmDelete as handleVideoConfirmDelete,
  showErrorToast,
} from '../../utilities/video/videoActions';
import { recordTemplateUsage } from '../../utils/styleUsageStats';
import { compressImage } from '../ImageUploader';
import {
  StyleTemplate,
  TemplateType,
  TemplateInputField,
} from '../MixedTemplatePicker';
import { resolveTemplateName as resolveTemplateNameShared } from '../../utils/resolveTemplateName';
import type { SubmitTaskParams } from '@/api/tools';

// Duration string union type matching calculateImageToAnimationCost signature
type VideoDuration =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '15';

// AspectRatio union type matching _zaps.ts internal type
type VideoAspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

// Choice option type covering both base TemplateInputField.choices and extended API fields
interface ChoiceOption {
  value?: string;
  id?: string;
  label?: string;
  labelKey?: string;
  text?: string;
  name?: string;
}

// Extended TemplateInputField with optional fields used by some templates
// Some templates from the API include extra fields (options, questionKey) not in the base interface
interface ExtendedTemplateInputField extends TemplateInputField {
  options?: ChoiceOption[];
  questionKey?: string;
}

// Language options - key is English name for model, label is native name for display
const languageOptions = [
  { code: 'en', key: 'English', label: 'English' },
  { code: 'es', key: 'Spanish', label: 'Español' },
  { code: 'ja', key: 'Japanese', label: '日本語' },
  { code: 'zh-CN', key: 'Simplified Chinese', label: '简体中文' },
  { code: 'zh-TW', key: 'Traditional Chinese', label: '繁體中文' },
  { code: 'ko', key: 'Korean', label: '한국어' },
  { code: 'de', key: 'German', label: 'Deutsch' },
  { code: 'fr', key: 'French', label: 'Français' },
  { code: 'pt', key: 'Portuguese', label: 'Português' },
  { code: 'id', key: 'Indonesian', label: 'Bahasa Indonesia' },
  { code: 'hi', key: 'Hindi', label: 'हिंदी' },
  { code: 'ru', key: 'Russian', label: 'Русский' },
  { code: 'vi', key: 'Vietnamese', label: 'Tiếng Việt' },
  { code: 'th', key: 'Thai', label: 'ไทย' },
];

// Types
type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any;
};

interface ImagesResponse {
  data: ImageData[];
}

// API functions
const imagesAPI = async (params: ImageApiParams): Promise<ImagesResponse> => {
  const response = await fetch('/api/tools/image-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

interface PhotoToAnimeAPIParams {
  inputImage: string;
  selectedStyle: string;
  prompt?: string;
  needMiddleware?: boolean;
  variables?: {
    characterName?: string;
    occupation?: string;
    language?: string;
    info?: string;
    [key: string]: string | undefined;
  };
}

const photoToAnimeAPI = async ({
  inputImage,
  selectedStyle,
  prompt,
  needMiddleware,
  variables,
}: PhotoToAnimeAPIParams): Promise<{
  output: string;
  error?: string;
  error_code?: number;
}> => {
  const MAX_WIDTH = 4096;
  const MAX_HEIGHT = 4096;

  const imageSize = await getImageSize(inputImage);
  const aspectRatio = imageSize.width / (imageSize.height || 1);
  let width = imageSize.width;
  let height = imageSize.height;
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / aspectRatio;
  }
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * aspectRatio;
  }

  const params = {
    image_url: inputImage,
    style_id: selectedStyle,
    mode: prompt && prompt.length > 0 ? 'custom' : 'template',
    tool: 'photo-to-anime',
    custom_prompt: prompt,
    variables,
    need_middleware: needMiddleware,
  };

  const response = await fetch('/api/tools/style-transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return { error: 'Generate image failed', output: '' };
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

// Model mapping utilities
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

  return modelMap[modelString] ?? ImageToVideoModel.VIDU;
};

const convertModel = (model: ImageToVideoModel | number) => {
  if (typeof model === 'number') {
    return model;
  }

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
    default:
      return model;
  }
};

// Reverse mapping: ModelIds number → ImageToVideoModel enum
// Used by handleVideoSubmit to set the correct `model` field for backend routing
const modelIdToI2VModel = (modelId: number): ImageToVideoModel => {
  switch (modelId) {
    case ModelIds.VIDU:
      return ImageToVideoModel.VIDU;
    case ModelIds.WAN:
      return ImageToVideoModel.WAN;
    case ModelIds.WAN_PRO:
      return ImageToVideoModel.WAN_PRO;
    case ModelIds.SORA:
    case ModelIds.SORA_TEXT_TO_VIDEO:
      return ImageToVideoModel.SORA;
    case ModelIds.SORA_PRO:
    case ModelIds.SORA_PRO_TEXT_TO_VIDEO:
      return ImageToVideoModel.SORA_PRO;
    case ModelIds.SORA_STABLE:
    case ModelIds.SORA_STABLE_TEXT_TO_VIDEO:
      return ImageToVideoModel.SORA_STABLE;
    case ModelIds.SORA_PRO_STABLE:
    case ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO:
      return ImageToVideoModel.SORA_PRO_STABLE;
    case ModelIds.SEEDANCE:
      return ImageToVideoModel.SEEDANCE;
    case ModelIds.KLING:
      return ImageToVideoModel.KLING;
    case ModelIds.KLING_V2:
      return ImageToVideoModel.KLING_V2;
    case ModelIds.RAY:
      return ImageToVideoModel.RAY;
    case ModelIds.RAY_FLASH_V2:
      return ImageToVideoModel.RAY_FLASH_V2;
    case ModelIds.PIXVERSE:
      return ImageToVideoModel.PIXVERSE;
    case ModelIds.VEO3:
      return ImageToVideoModel.VEO;
    case ModelIds.ANISORA:
      return ImageToVideoModel.ANISORA;
    case ModelIds.FRAME_PACK:
      return ImageToVideoModel.FRAME_PACK;
    case ModelIds.HEDRA:
      return ImageToVideoModel.HEDRA;
    case ModelIds.MJ_VIDEO:
      return ImageToVideoModel.MJ_VIDEO;
    case ModelIds.VIDU_Q2:
      return ImageToVideoModel.VIDU_Q2;
    case ModelIds.MAGI_1:
      return ImageToVideoModel.MAGI_1;
    case ModelIds.MINIMAX:
      return ImageToVideoModel.MINIMAX;
    default:
      return ImageToVideoModel.VIDU;
  }
};

// Hero Banner component
const HeroBanner = ({
  image,
  video,
  title,
  onChange,
  onRandom,
  t,
  isLoading = false,
}: {
  image?: string;
  video?: string;
  title: string;
  onChange: () => void;
  onRandom?: () => void;
  t: TFunction;
  isLoading?: boolean;
}) => {
  const [isWideVideo, setIsWideVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget;
    setIsWideVideo(videoEl.videoWidth / videoEl.videoHeight > 1.4);
    setVideoLoaded(true);
  };

  const shouldCrop = isWideVideo;

  // 如果是图片，使用 aspect-video 容器；如果是视频，使用固定高度
  const containerClass = video
    ? 'relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden group shadow-large border border-border cursor-pointer bg-card mt-2'
    : 'relative w-full aspect-video rounded-xl overflow-hidden group shadow-lg border border-white/10 cursor-pointer mt-2';

  return (
    <div className={containerClass} onClick={onChange}>
      <div className='absolute inset-0 flex items-center justify-center overflow-hidden bg-muted'>
        {video ? (
          <>
            {/* Loading spinner */}
            {!videoLoaded && (
              <div className='absolute inset-0 flex items-center justify-center z-20'>
                <Spinner size='lg' color='primary' />
              </div>
            )}
            {/* Blur background */}
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className='absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110'
            />
            {/* Foreground video */}
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
            {/* Blur background for image */}
            <img
              src={image}
              className='absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110'
              alt=''
            />
            {/* Foreground image - use object-contain to show full image */}
            <img
              src={image}
              className='relative w-full h-full object-contain z-10'
              alt={title}
            />
          </>
        ) : (
          <div className='w-full h-full flex items-center justify-center text-primary-300'>
            {isLoading ? (
              <Spinner size='lg' color='primary' />
            ) : (
              <MdDashboard className='w-12 h-12' />
            )}
          </div>
        )}
      </div>
      {/* Gradient overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none z-20' />
      {/* Title */}
      <div className='absolute bottom-6 left-0 right-0 text-center text-white z-30 px-4'>
        <h3 className='font-bold text-2xl md:text-3xl leading-tight text-white drop-shadow-lg'>
          {title}
        </h3>
      </div>
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

// Props interface
export interface UnifiedTemplateGeneratorProps {
  /** The template to use - from getAllStyleTemplates API */
  template: StyleTemplate;
  /** Callback when user wants to change/select a different template */
  onOpenTemplatePicker: () => void;
  /** Callback to get a random template */
  onRandomTemplate?: () => void;
  /** Optional example URL for result display */
  exampleUrl?: string;
  /** Optional initial input image (used to preserve image when switching template types) */
  initialInputImage?: string;
}

export interface UnifiedTemplateGeneratorRef {
  /** Get current input image */
  getInputImage: () => string;
  /** Set input image externally */
  setInputImage: (url: string) => void;
}

const getId = genId();

/**
 * Unified Template Generator Component
 * Supports all four template types: image, video, dance, expression
 * Preserves original model calling logic from PhotoToAnimeConvert and TemplateVideoGenerator
 */
const UnifiedTemplateGenerator = forwardRef<
  UnifiedTemplateGeneratorRef,
  UnifiedTemplateGeneratorProps
>(
  (
    {
      template,
      onOpenTemplatePicker,
      onRandomTemplate,
      exampleUrl,
      initialInputImage,
    },
    ref,
  ) => {
    const { t } = useTranslation([
      'image-animation-generator',
      'photo-to-anime',
      'common',
      'style-templates',
      'toast',
    ]);
    const router = useRouter();

    // Determine template type
    const templateType = template.type as TemplateType;
    const isImageTemplate =
      templateType === 'image' || templateType === 'expression';
    const isVideoTemplate = templateType === 'video';
    const isDanceTemplate = templateType === 'dance';
    const isExpressionTemplate = templateType === 'expression';

    // 去掉 -v / -i 后缀的模板 ID，用于后端 API 调用
    const cleanTemplateId = useMemo(
      () => template.id.replace(/-(v|i)$/, ''),
      [template.id],
    );

    // Common state
    const { inputImage, setInputImage, mediaItem } = useProcessInitialImage();
    const [inputImages, setInputImages] = useState<MultiImageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useAtom(profileAtom);
    const isAuth = useAtomValue(authAtom);
    const loginModal = useAtomValue(loginModalAtom);
    const { submit: openModal } = useOpenModal();
    const [isPublic, setIsPublic] = useState(() => profile.plan === 'Free');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Dynamic input values for template effects
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    // Track selected character for tagging in publish
    const [selectedCharacterId, setSelectedCharacterId] = useState<
      string | null
    >(null);

    // Initialize language based on router locale
    useEffect(() => {
      const locale = router.locale || localStorage.getItem('lang') || 'en';
      const matched = languageOptions.find(opt => opt.code === locale);
      if (matched && !inputValues.language) {
        setInputValues(prev => ({ ...prev, language: matched.key }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在 locale 变化时初始化，不需要监听 inputValues
    }, [router.locale]);

    // Restore preserved input image when component mounts or when initialInputImage changes
    // (e.g., after template type switch, parent updates preservedInputImage)
    useEffect(() => {
      if (initialInputImage) {
        setInputImage(initialInputImage, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在 initialInputImage 变化时恢复图片
    }, [initialInputImage]);

    // Track if user has loaded history (to decide whether to show example)
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [userHasHistory, setUserHasHistory] = useState(false);

    // Image template specific state
    const [resultImages, setResultImages] = useState<ImageData[]>(() => {
      if (isImageTemplate && exampleUrl) {
        return [
          { id: -1, url_path: exampleUrl, prompt: t('common:exampleResult') },
        ];
      }
      return [];
    });
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);

    // Video/Dance template specific state
    const videoToolName = isDanceTemplate
      ? 'dance-video-generator'
      : 'video-effect';
    // Only provide example URL for video/dance templates, not for image templates
    const videoExampleUrl =
      isVideoTemplate || isDanceTemplate
        ? exampleUrl || '/images/examples/image-animation-generator/output2.mp4'
        : undefined;
    const { resultVideos, setResultVideos, submitTask, addTaskId } = useVideos(
      videoToolName,
      videoExampleUrl,
    );

    // Check if user has video history (from useVideos hook)
    useEffect(() => {
      const hasVideoHistory = resultVideos.some(v => v.id !== -1);
      if (hasVideoHistory) {
        setUserHasHistory(true);
        setHasLoadedHistory(true);
      }
    }, [resultVideos]);

    // Update example when template changes (only if user has no history)
    useEffect(() => {
      // Skip if history hasn't been loaded yet (wait for initial load)
      if (!hasLoadedHistory) {
        return;
      }

      // If user has history, don't update example
      if (userHasHistory) {
        return;
      }

      // Update example based on current template type
      if (isImageTemplate || isExpressionTemplate) {
        if (exampleUrl) {
          setResultImages([
            { id: -1, url_path: exampleUrl, prompt: t('common:exampleResult') },
          ]);
        }
        // Clear video example
        setResultVideos(prev => prev.filter(v => v.id !== -1));
      } else if (isVideoTemplate || isDanceTemplate) {
        // Clear image example
        setResultImages(prev => prev.filter(img => img.id !== -1));
        // Video example is handled by useVideos hook, but we need to add it manually when switching
        if (exampleUrl && !resultVideos.some(v => v.id === -1)) {
          setResultVideos(prev => [
            ...prev.filter(v => v.id !== -1),
            {
              id: -1,
              video_url: exampleUrl,
              prompt: t('common:exampleResult'),
              status: GenerationStatus.DONE,
            } as VideoData,
          ]);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在模板类型/示例URL/历史状态变化时更新，避免不必要的重渲染
    }, [template.type, exampleUrl, hasLoadedHistory, userHasHistory]);
    const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [imageSize, setImageSize] = useState<{
      width: number;
      height: number;
    }>({ width: 600, height: 600 });

    // Dance specific state
    const [uploadedDanceTempUrl, setUploadedDanceTempUrl] = useState<
      string | null
    >(null);
    const [dancePickerOpen, setDancePickerOpen] = useState(false);
    const [selectedDanceStyle, setSelectedDanceStyle] = useState<
      DanceTemplate | undefined
    >();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getInputImage: () => inputImage,
      setInputImage: (url: string) => setInputImage(url, false),
    }));

    // Get template metadata
    const templateMetadata = useMemo(() => {
      const metadata = template.metadata || {};

      // Convert string model name to ModelIds number if needed
      let modelId: number = ModelIds.VIDU; // Default
      if (metadata.model !== undefined && metadata.model !== null) {
        if (typeof metadata.model === 'number') {
          modelId = metadata.model;
        } else if (typeof metadata.model === 'string') {
          // Convert string model name to ModelIds enum number
          const modelMap: Record<string, number> = {
            SORA: ModelIds.SORA,
            VIDU: ModelIds.VIDU,
            SORA_TEXT_TO_VIDEO: ModelIds.SORA_TEXT_TO_VIDEO,
            SORA_PRO: ModelIds.SORA_PRO,
            SORA_PRO_TEXT_TO_VIDEO: ModelIds.SORA_PRO_TEXT_TO_VIDEO,
            SORA_STABLE: ModelIds.SORA_STABLE,
            SORA_PRO_STABLE: ModelIds.SORA_PRO_STABLE,
            SORA_STABLE_TEXT_TO_VIDEO: ModelIds.SORA_STABLE_TEXT_TO_VIDEO,
            SORA_PRO_STABLE_TEXT_TO_VIDEO:
              ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO,
            KLING: ModelIds.KLING,
            KLING_V2: ModelIds.KLING_V2,
            WAN: ModelIds.WAN,
            WAN_PRO: ModelIds.WAN_PRO,
            WAN_ANIMATE: ModelIds.WAN_ANIMATE,
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
          };
          modelId = modelMap[metadata.model] || ModelIds.VIDU;
        }
      }

      return {
        model: modelId,
        duration: metadata.duration || (template.type === 'dance' ? 10 : 5),
        hasAudio: metadata.hasAudio !== false,
        needMiddleware: template.need_middleware ?? false,
        videoPipelineType: template.video_pipeline_type || undefined,
      };
    }, [template]);

    // Get character inputs for current template
    const currentTemplateInputs = useMemo(() => {
      if (template.character_inputs && template.character_inputs.length > 0) {
        return template.character_inputs;
      }
      return null;
    }, [template]);

    // Get current template's input_media config for multi-image support
    const currentInputMedia = useMemo(() => {
      if (!template.input_media) {
        return null;
      }
      const imageMedia = template.input_media.find(
        media => media.media_type === 'image',
      );
      if (imageMedia && imageMedia.max_count > 1) {
        return imageMedia;
      }
      return null;
    }, [template]);

    const isMultiImageMode =
      currentInputMedia && currentInputMedia.max_count > 1;

    // Reset inputImages when switching templates or when multi-image mode changes
    useEffect(() => {
      if (!isMultiImageMode && inputImages.length > 0) {
        inputImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        setInputImages([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 不监听 inputImages 避免清理死循环
    }, [isMultiImageMode, template.id]);

    // Load image history data on mount (similar to useVideos hook for videos)
    useEffect(() => {
      if (!isAuth) {
        setHasLoadedHistory(true);
        return;
      }

      const loadImageHistory = async () => {
        try {
          const response = await imagesAPI({
            method: 'getImages',
            tool: 'photo_to_anime',
          });

          if (response.data && response.data.length > 0) {
            // Filter and sort images
            const historyImages = response.data.map(img => ({
              ...img,
              created_at: img.created_at || new Date().toISOString(),
            }));

            // Sort by created_at descending
            historyImages.sort((a, b) => {
              const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return timeB - timeA;
            });

            // If user has history, don't show example
            setResultImages(historyImages);
            setUserHasHistory(true);
          }
        } catch (error) {
          console.error('Failed to load image history:', error);
        } finally {
          setHasLoadedHistory(true);
        }
      };

      loadImageHistory();
    }, [isAuth]);

    // Calculate cost based on template type
    const cost = useMemo(() => {
      if (isImageTemplate || isExpressionTemplate) {
        // Image/Expression templates use style transfer cost
        const isProModel = template.is_pro_model;
        const model = isProModel ? 'gemini-3-pro-image-preview' : undefined;
        return calculateStyleTransferCost('template', 'photo-to-anime', model);
      }
      if (isDanceTemplate) {
        // Dance templates use duration-based cost (prefer selectedDanceStyle for custom-dance)
        const duration =
          selectedDanceStyle?.duration ?? templateMetadata.duration;
        const rounded = Math.max(0, Math.round(duration));
        return (
          VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimateDiscount * rounded
        );
      }
      if (isVideoTemplate) {
        // Video templates use model-specific cost
        const { model, duration, videoPipelineType } = templateMetadata;
        return calculateVideoTemplateCost(model, duration, videoPipelineType);
      }
      return 200;
    }, [
      template,
      templateMetadata,
      isImageTemplate,
      isExpressionTemplate,
      isDanceTemplate,
      isVideoTemplate,
      selectedDanceStyle,
    ]);

    // Clean up inputValues when template changes
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
        setInputValues({});
      }
    }, [currentTemplateInputs]);

    // Update aspect ratio based on input image
    useEffect(() => {
      if (inputImage) {
        getImageSize(inputImage).then(size => {
          setImageSize(size);
          const autoAspectRatio = getClosestAspectRatioFromList(
            size.width,
            size.height,
            ['16:9', '9:16', '1:1'],
          );
          setAspectRatio(autoAspectRatio);
        });
      }
    }, [inputImage]);

    // Update public setting based on plan
    useEffect(() => {
      if (profile?.plan) {
        setIsPublic(profile.plan === 'Free');
      }
    }, [profile?.plan]);

    // Initialize dance style if template is dance type
    useEffect(() => {
      if (isDanceTemplate) {
        // 从 MixedTemplatePicker 内联上传的视频：读取 metadata 中的上传信息
        if (template.metadata?.uploadedVideoUrl) {
          setUploadedDanceTempUrl(template.metadata.uploadedVideoUrl);
          setSelectedDanceStyle({
            id: 'uploaded-video',
            nameKey: 'uploadedVideo',
            video: template.metadata.uploadedVideoUrl,
            duration: template.metadata.uploadedVideoDuration || 5,
          });
          return;
        }

        // 尝试从全局 dance 列表匹配
        const danceTemplates = getDanceTemplatesSync();
        const found = danceTemplates.find(
          d => d.id === template.displayName || d.id === template.id,
        );
        if (found) {
          setSelectedDanceStyle(found);
          return;
        }

        // Fallback: 从模板自身的 url 字段创建 DanceTemplate（style_templates 表的 dance 模板）
        if (template.url) {
          setSelectedDanceStyle({
            id: template.id,
            nameKey: template.name_key,
            video: template.url,
            displayVideo: template.display_url || template.url,
            duration: template.metadata?.duration || 10,
          });
        }
      }
    }, [template, isDanceTemplate]);

    // Handle image upload
    const handleImageChange = async (url: string) => {
      if (url.startsWith('blob:')) {
        const base64Data = await urlToBase64(url);
        setInputImage(base64Data, false);
      } else if (url.includes('supabase.co')) {
        setInputImage(url);
      } else {
        const base64 = await redrawImageToBase64(url);
        setInputImage(base64);
      }
    };

    // Resolve template name for display (使用共享的 resolveTemplateName 工具函数)
    const resolveTemplateName = useCallback(
      (key: string, dbI18n?: { name?: Record<string, string> } | null) =>
        resolveTemplateNameShared(t, key, undefined, dbI18n),
      [t],
    );

    // Get display data for hero banner
    const currentStyleData = useMemo(() => {
      // Dance 模式：优先使用 selectedDanceStyle 的视频（支持 custom-dance 动态切换）
      if (isDanceTemplate && selectedDanceStyle) {
        const danceName =
          selectedDanceStyle.id === 'uploaded-video'
            ? t('style-templates:dances.uploadMotionVideo', 'Upload Your Video')
            : resolveTemplateName(
                selectedDanceStyle.nameKey
                  ? `dances.${selectedDanceStyle.nameKey}`
                  : template.name_key,
                template.i18n,
              ) || template.displayName;
        return {
          image: undefined,
          video: selectedDanceStyle.displayVideo || selectedDanceStyle.video,
          name: danceName,
        };
      }

      // 展示用 URL：优先使用 display_url（舞蹈模板等），回退到 url
      const previewUrl = template.display_url || template.url;
      return {
        image: isImageTemplate || isExpressionTemplate ? previewUrl : undefined,
        video: isVideoTemplate || isDanceTemplate ? previewUrl : undefined,
        name:
          resolveTemplateName(template.name_key, template.i18n) ||
          template.displayName,
      };
    }, [
      template,
      isImageTemplate,
      isExpressionTemplate,
      isVideoTemplate,
      isDanceTemplate,
      selectedDanceStyle,
      resolveTemplateName,
      t,
    ]);

    // 获取模板的英文名称，用于 meta_data.style_name（确保始终为英文，不随语言切换变化）
    const getEnglishTemplateName = useCallback(() => {
      // 1. 优先从数据库 i18n 列获取英文名称
      if (template.i18n?.name?.en) {
        return template.i18n.name.en;
      }

      // 2. 从 i18n JSON 文件获取英文翻译
      if (template.name_key) {
        const enName = t(`style-templates:${template.name_key}`, {
          lng: 'en',
          defaultValue: '',
        });
        if (enName && enName !== `style-templates:${template.name_key}`) {
          return enName;
        }
      }

      // 3. 最终回退：使用 template ID 转 Title Case
      const cleanId = (template.id || '').replace(/-(v|i)$/, '');
      return cleanId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }, [template, t]);

    // 校验图片输入（多图模式或单图模式）
    const validateImageInput = useCallback((): boolean => {
      if (isMultiImageMode) {
        // 过滤掉空槽位（url 为空的占位项）
        const filledImages = inputImages.filter(
          img => img.url && img.url !== '',
        );
        if (filledImages.length < (currentInputMedia?.min_count || 1)) {
          showErrorToast(
            t(
              'toast:imageToVideo.minImagesRequired',
              `Please upload at least ${currentInputMedia?.min_count || 1} images`,
            ),
          );
          return false;
        }
      } else if (!inputImage) {
        showErrorToast(
          t(
            'toast:imageToVideo.noImageSelected',
            'Please select an image first',
          ),
        );
        return false;
      }
      return true;
    }, [
      isMultiImageMode,
      inputImages,
      currentInputMedia?.min_count,
      inputImage,
      t,
    ]);

    // 多图拼接：将多张图片拼接并上传，返回处理后的图片 URL
    const processMultiImageInput = useCallback(async (): Promise<
      string | null
    > => {
      if (!isMultiImageMode) {
        return inputImage;
      }
      // 过滤掉空槽位
      const filledImages = inputImages.filter(img => img.url && img.url !== '');
      if (filledImages.length === 1) {
        return filledImages[0].url;
      }

      const imageUrls = filledImages.map(img => img.url);
      const imageNames = filledImages.map(img => img.name);

      const stitchedBlob = await stitchImagesInBrowser({
        imageUrls,
        imageNames,
        aspectRatio: '16:9',
      });

      return uploadImageToFal(stitchedBlob, profile?.id);
    }, [isMultiImageMode, inputImage, inputImages, profile]);

    // ==================== IMAGE/EXPRESSION SUBMIT LOGIC ====================
    const handleImageSubmit = async () => {
      if (!validateImageInput()) {
        return;
      }

      if (profile.credit < cost) {
        openModal('pricing');
        return;
      }

      // Create generating state immediately for better UX
      const id = getId();
      setResultImages([
        {
          id,
          url_path: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultImages.filter(d => d.id !== -1),
      ]);

      // Set loading false immediately so button stops spinning - user can see "Generating" status
      setLoading(false);

      try {
        // Handle multi-image mode: stitch images together
        let imageToProcess: string;
        try {
          const processed = await processMultiImageInput();
          if (!processed) {
            setResultImages(resultImages =>
              resultImages.filter(d => d.id !== id),
            );
            return;
          }
          imageToProcess = processed;
        } catch (error) {
          console.error('Failed to stitch images:', error);
          showErrorToast(
            t('toast:error.stitchingFailed', 'Failed to process images'),
          );
          setResultImages(resultImages =>
            resultImages.filter(d => d.id !== id),
          );
          return;
        }

        // Compress image if needed
        const imageSizeCheck = await getImageSize(imageToProcess);
        let finalImage = imageToProcess;
        if (
          imageToProcess.length > GEMINI_LIMITS.MAX_SIZE ||
          imageSizeCheck.width > GEMINI_LIMITS.MAX_WIDTH ||
          imageSizeCheck.height > GEMINI_LIMITS.MAX_HEIGHT
        ) {
          finalImage = await compressImage(
            imageToProcess,
            GEMINI_LIMITS.MAX_WIDTH,
            GEMINI_LIMITS.MAX_HEIGHT,
          );
        }

        // Build variables object - map characterInfo to info for backend compatibility
        const apiVariables = currentTemplateInputs
          ? (() => {
              const { characterInfo, ...rest } = inputValues;
              return {
                ...rest,
                ...(characterInfo !== undefined && { info: characterInfo }),
              };
            })()
          : undefined;

        // Backend will handle Gemini prompt enhancement asynchronously
        const result = await photoToAnimeAPI({
          inputImage: finalImage,
          selectedStyle: cleanTemplateId,
          prompt: '', // Template mode always uses empty prompt
          needMiddleware: templateMetadata.needMiddleware,
          variables: apiVariables,
        });

        if (result.error) {
          if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
            toastWarn(t('toast:common.rateLimitExceeded'));
          } else {
            toast.error(result.error, {
              position: 'top-center',
              style: { background: '#555', color: '#fff' },
            });
          }
          setResultImages(resultImages =>
            resultImages.filter(d => d.id !== id),
          );
          return;
        }

        setProfile(profile => ({
          ...profile,
          credit: profile.credit - cost,
        }));

        const resultUrl = result.output;

        // Update result list
        await dispatchGenerated(id);
        // prettier-ignore
        setResultImages(prev =>
          prev.map(item =>
            (item.id === id
              ? {
                  id,
                  url_path: resultUrl,
                  meta_data: JSON.stringify({
                    style_id: cleanTemplateId,
                    style_name: getEnglishTemplateName(),
                    mode: isExpressionTemplate ? 'expression' : 'template',
                    template_i18n: template.i18n,
                  }),
                }
              : item),
          ),
        );

        // Save to database
        const response = await imagesAPI({
          method: 'generateImage',
          tool: 'photo_to_anime',
          url_path: resultUrl,
          id: null,
          prompt: '',
          meta_data: JSON.stringify({
            style_id: cleanTemplateId,
            style_name: getEnglishTemplateName(),
            mode: isExpressionTemplate ? 'expression' : 'template',
            template_i18n: template.i18n,
            ...(selectedCharacterId && { character_id: selectedCharacterId }),
          }),
        });

        if (response.data && response.data.length > 0) {
          const data = response.data[0];
          // prettier-ignore
          setResultImages(prev =>
            prev.map(item =>
              (item.id === id
                ? {
                    id: data.id,
                    url_path: data.url_path,
                    prompt: '',
                    meta_data: JSON.stringify({
                      style_id: cleanTemplateId,
                      style_name: getEnglishTemplateName(),
                      mode: isExpressionTemplate ? 'expression' : 'template',
                      template_i18n: template.i18n,
                    }),
                  }
                : item),
            ),
          );

          // Record usage
          recordTemplateUsage(template.id).catch(err =>
            console.error('Failed to record template usage:', err),
          );

          toast.success(t('photo-to-anime:toast.conversionDone'), {
            position: 'top-center',
            style: { background: '#555', color: '#fff' },
          });
        }
      } catch (error) {
        console.error('Image generation failed:', error);
        toast.error(t('photo-to-anime:toast.generateFailed'), {
          position: 'top-center',
          style: { background: '#555', color: '#fff' },
        });
      }
    };

    // ==================== VIDEO SUBMIT LOGIC ====================
    const handleVideoSubmit = async () => {
      if (!validateImageInput()) {
        return;
      }

      if (profile.credit < cost) {
        openModal('pricing');
        return;
      }

      // Create generating state immediately for better UX (same pattern as handleImageSubmit)
      const placeholderId = getId();
      const placeholderVideo = {
        id: placeholderId,
        video_url: '',
        prompt: '',
        status: GenerationStatus.GENERATING,
        created_at: new Date().toISOString(),
        meta_data: JSON.stringify({
          mode: 'template',
          style_id: cleanTemplateId,
          style_name: getEnglishTemplateName(),
          template_i18n: template.i18n,
          ...inputValues,
          ...(selectedCharacterId && { character_id: selectedCharacterId }),
        }),
      };

      setResultVideos(prev => [
        placeholderVideo,
        ...prev.filter(video => video.id !== -1),
      ]);

      // Set loading false immediately so button stops spinning - user can see "Generating" status
      setLoading(false);

      // Helper to remove placeholder on failure
      const removePlaceholder = () => {
        setResultVideos(prev => prev.filter(v => v.id !== placeholderId));
      };

      try {
        // Process image input (stitching for multi-image mode)
        let currentImageUrl = '';
        let should_delete_media = false;
        let imageSizeForTask: { width: number; height: number } | undefined;

        let imageToProcess: string;
        try {
          const processed = await processMultiImageInput();
          if (!processed) {
            removePlaceholder();
            return;
          }
          imageToProcess = processed;

          // 多图拼接模式下，上传后的 URL 就是最终 URL
          const filledImagesCount = inputImages.filter(
            img => img.url && img.url !== '',
          ).length;
          if (isMultiImageMode && filledImagesCount > 1) {
            currentImageUrl = imageToProcess;
            should_delete_media = false;
            imageSizeForTask = await getImageSize(currentImageUrl);
          }
        } catch (error) {
          console.error('Failed to stitch images:', error);
          showErrorToast(
            t('toast:error.stitchingFailed', 'Failed to process images'),
          );
          removePlaceholder();
          return;
        }

        if (!currentImageUrl) {
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
          removePlaceholder();
          return;
        }

        const image = currentImageUrl;
        const images = [currentImageUrl];

        const modelId = templateMetadata.model || ModelIds.VIDU;
        const duration = templateMetadata.duration || 5;

        // Derive the correct ImageToVideoModel enum from modelId for backend routing
        const i2vModel = modelIdToI2VModel(modelId);

        // Check if model supports multi-language prompts (no translation needed)
        const isMultiLangModel = [
          ImageToVideoModel.VEO,
          ImageToVideoModel.SORA,
          ImageToVideoModel.SORA_PRO,
        ].includes(i2vModel);

        const params = {
          image,
          images,
          prompt: '' as string, // Start empty, conditionally set from template below
          aspect_ratio: aspectRatio,
          target_model: modelId as SubmitTaskParams['target_model'],
          model: i2vModel, // Correct model enum for backend routing
          duration: duration.toString(),
          style: 'default' as string, // VideoStyle.DEFAULT equivalent
          resolution: '480p',
          tool: 'video-effect',
          should_delete_media,
          image_size: imageSizeForTask,
          meta_data: {
            aspect_ratio: aspectRatio,
            duration,
            resolution: '480p',
            mode: 'template',
            style_id: cleanTemplateId,
            style_name: getEnglishTemplateName(),
            template_i18n: template.i18n,
            need_middleware: templateMetadata.needMiddleware,
            ...(templateMetadata.videoPipelineType && {
              video_pipeline_type: templateMetadata.videoPipelineType,
            }),
            ...inputValues,
            ...(selectedCharacterId && { character_id: selectedCharacterId }),
          },
          no_translate: isMultiLangModel,
        };

        // Conditionally set prompt from template data (matching TemplateVideoGenerator pattern)
        if (!params.prompt) {
          params.prompt =
            template.prompt?.prompt || template.name_key || cleanTemplateId;
        }

        const taskId = await submitTask(params).catch(error => {
          console.error('Submit task error:', error);
          return null;
        });

        if (isNil(taskId)) {
          removePlaceholder();
          return;
        }

        addTaskId(taskId);

        // Record usage
        recordTemplateUsage(template.id).catch(err => {
          console.error('Failed to record template usage:', err);
        });

        // 关联真实 taskId，但保留占位 id 不变以避免 React key 变化导致进度条重置
        setResultVideos(prev =>
          prev.map(v => (v.id === placeholderId ? { ...v, taskId } : v)),
        );
      } catch (error) {
        console.error('Video generation failed:', error);
        showErrorToast(t('toast:imageToVideo.generateFailed'));
        removePlaceholder();
      }
    };

    // ==================== DANCE SUBMIT LOGIC ====================
    const handleDanceSubmit = async () => {
      if (!validateImageInput()) {
        return;
      }

      if (!selectedDanceStyle) {
        showErrorToast(
          t(
            'toast:imageToVideo.noStyleSelected',
            'Please select a dance style',
          ),
        );
        return;
      }

      if (profile.credit < cost) {
        openModal('pricing');
        return;
      }

      // Create generating state immediately for better UX (same pattern as handleImageSubmit)
      const placeholderId = getId();
      const placeholderVideo = {
        id: placeholderId,
        video_url: '',
        prompt: '',
        status: GenerationStatus.GENERATING,
        created_at: new Date().toISOString(),
        meta_data: JSON.stringify({
          mode: 'dance',
          style_id: selectedDanceStyle.id,
          style_name: getEnglishTemplateName(),
          template_i18n: template.i18n,
          ...(selectedCharacterId && { character_id: selectedCharacterId }),
        }),
      };

      setResultVideos(prev => [
        placeholderVideo,
        ...prev.filter(video => video.id !== -1),
      ]);

      // Set loading false immediately so button stops spinning - user can see "Generating" status
      setLoading(false);

      // Helper to remove placeholder on failure
      const removePlaceholder = () => {
        setResultVideos(prev => prev.filter(v => v.id !== placeholderId));
      };

      try {
        // Process image input (stitching for multi-image mode)
        let currentImageUrl = '';
        let should_delete_media = false;

        let imageToProcess: string;
        try {
          const processed = await processMultiImageInput();
          if (!processed) {
            removePlaceholder();
            return;
          }
          imageToProcess = processed;

          // 多图拼接模式下，上传后的 URL 就是最终 URL
          const filledImagesCount = inputImages.filter(
            img => img.url && img.url !== '',
          ).length;
          if (isMultiImageMode && filledImagesCount > 1) {
            currentImageUrl = imageToProcess;
            should_delete_media = false;
          }
        } catch (error) {
          console.error('Failed to stitch images:', error);
          showErrorToast(
            t('toast:error.stitchingFailed', 'Failed to process images'),
          );
          removePlaceholder();
          return;
        }

        if (!currentImageUrl) {
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
          removePlaceholder();
          return;
        }

        let styleForSubmit = selectedDanceStyle;

        // Handle uploaded video
        if (styleForSubmit.id === 'uploaded-video') {
          if (!uploadedDanceTempUrl) {
            toast.error(t('toast:imageToVideo.noVideoSelected'));
            removePlaceholder();
            return;
          }

          const videoUrl = await uploadTempVideo(
            uploadedDanceTempUrl,
            profile.id,
          );
          if (!videoUrl) {
            toast.error(
              t('toast:error.uploadVideoFailed', 'Failed to upload video'),
            );
            removePlaceholder();
            return;
          }

          styleForSubmit = { ...styleForSubmit, video: videoUrl };
        }

        const roundedDuration = Math.max(
          0,
          Math.round(styleForSubmit.duration),
        );
        const apiParams: SubmitTaskParams = {
          image: currentImageUrl,
          video: styleForSubmit.video,
          target_model: ModelIds.WAN_ANIMATE,
          selectedDuration: roundedDuration,
          tool: 'dance-video-generator',
          should_delete_media,
          mode: 'animate',
          meta_data: {
            style_id: styleForSubmit.id,
            style_name: getEnglishTemplateName(),
            template_i18n: template.i18n,
            mode: 'dance',
            ...(selectedCharacterId && { character_id: selectedCharacterId }),
          },
        };

        const taskId = await submitTask(apiParams).catch(error => {
          console.error('Submit task error:', error);
          return null;
        });

        if (isNil(taskId)) {
          removePlaceholder();
          return;
        }

        addTaskId(taskId);

        // Record usage
        recordTemplateUsage(template.id).catch(err => {
          console.error('Failed to record template usage:', err);
        });

        // 关联真实 taskId，但保留占位 id 不变以避免 React key 变化导致进度条重置
        setResultVideos(prev =>
          prev.map(v => (v.id === placeholderId ? { ...v, taskId } : v)),
        );
      } catch (error) {
        console.error('Dance generation failed:', error);
        showErrorToast(t('toast:imageToVideo.generateFailed'));
        removePlaceholder();
      }
    };

    // Main submit handler
    const handleSubmit = async () => {
      if (isImageTemplate || isExpressionTemplate) {
        await handleImageSubmit();
      } else if (isDanceTemplate) {
        await handleDanceSubmit();
      } else if (isVideoTemplate) {
        await handleVideoSubmit();
      }
    };

    // Delete handlers
    const handleImageDeleteClick = (imageId: number) => {
      if (typeof imageId === 'number' && imageId < 0) {
        setResultImages(resultImages =>
          resultImages.filter(d => d.id !== imageId),
        );
        return;
      }
      setImageToDelete(imageId);
      setDeleteModalOpen(true);
    };

    const handleConfirmImageDelete = async () => {
      setDeleteModalOpen(false);
      if (imageToDelete) {
        try {
          const response = await imagesAPI({
            method: 'deleteImage',
            tool: 'photo_to_anime',
            id: imageToDelete,
          });
          if (response.data && response.data.length > 0) {
            deleteMediaData(setResultImages, imageToDelete);
            toast.success(t('photo-to-anime:toast.deleteSuccess'), {
              position: 'top-center',
              style: { background: '#555', color: '#fff' },
            });
          }
          setImageToDelete(null);
        } catch (error) {
          console.error('deleteImage failed', error);
          toast.error(t('photo-to-anime:toast.deleteFailed'), {
            position: 'top-center',
            style: { background: '#555', color: '#fff' },
          });
        }
      }
    };

    const handleVideoDeleteClickLocal = (videoId: number) => {
      handleVideoDeleteClick(
        videoId,
        setResultVideos,
        setVideoToDelete,
        setDeleteModalOpen,
      );
    };

    const handleConfirmVideoDelete = async () => {
      await handleVideoConfirmDelete(
        videoToDelete,
        [videoToolName],
        t,
        setResultVideos,
        setVideoToDelete,
        setDeleteModalOpen,
      );
    };

    // Download handlers
    const handleImageDownload = async (imageUrl: string) => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `result-${Date.now()}.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        toast.error(t('photo-to-anime:toast.downloadFailed'), {
          position: 'top-center',
          style: { background: '#555', color: '#fff' },
        });
      }
    };

    const handleVideoDownloadLocal = async (videoUrl: string) => {
      await handleVideoDownload(videoUrl, t);
    };

    // Check if submit should be disabled
    const isSubmitDisabled = () => {
      if (isMultiImageMode) {
        // 过滤掉空槽位
        const filledCount = inputImages.filter(
          img => img.url && img.url !== '',
        ).length;
        if (filledCount < (currentInputMedia?.min_count || 1)) {
          return true;
        }
      } else if (!inputImage) {
        return true;
      }
      if (isDanceTemplate && !selectedDanceStyle) {
        return true;
      }
      return false;
    };

    // Combine all results (images + videos) and sort by created_at
    const allResults = useMemo(() => {
      const imageResults = resultImages.map(img => ({
        ...img,
        _type: 'image' as const,
        _tool: 'photo_to_anime',
        created_at: img.created_at || new Date().toISOString(),
      }));

      const videoResults = resultVideos.map(vid => ({
        ...vid,
        _type: 'video' as const,
        _tool:
          typeof vid.meta_data === 'string' &&
          vid.meta_data.includes('"mode":"dance"')
            ? 'dance-video-generator'
            : 'video-effect',
        created_at: vid.created_at || new Date().toISOString(),
      }));

      // Combine all results
      let combined = [...imageResults, ...videoResults];

      // Check if user has any non-example history
      const hasHistory = combined.some(item => item.id !== -1);

      // If user has history, filter out all examples
      // If no history, only show example matching current template type
      const currentIsImageType = isImageTemplate || isExpressionTemplate;
      combined = combined.filter(item => {
        if (item.id !== -1) {
          return true;
        } // Keep all non-example results
        if (hasHistory) {
          return false;
        } // If has history, don't show any example
        // No history: only keep example that matches current template type
        return currentIsImageType
          ? item._type === 'image'
          : item._type === 'video';
      });

      combined.sort((a, b) => {
        // Examples always go last
        if (a.id === -1) {
          return 1;
        }
        if (b.id === -1) {
          return -1;
        }

        // Generating tasks always first (matching useVideos sort pattern)
        const aGenerating = a.status === GenerationStatus.GENERATING;
        const bGenerating = b.status === GenerationStatus.GENERATING;
        if (aGenerating && !bGenerating) {
          return -1;
        }
        if (bGenerating && !aGenerating) {
          return 1;
        }

        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      return combined;
    }, [resultImages, resultVideos, isImageTemplate, isExpressionTemplate]);

    // Get the correct handlers based on result type
    const getResultHandlers = (resultType: 'image' | 'video') => ({
      handleDownload:
        resultType === 'image' ? handleImageDownload : handleVideoDownloadLocal,
      handleDeleteClick:
        resultType === 'image'
          ? handleImageDeleteClick
          : handleVideoDeleteClickLocal,
    });

    // For delete modal, we need to know which type is being deleted
    const handleConfirmDelete = useMemo(() => {
      if (imageToDelete !== null) {
        return handleConfirmImageDelete;
      }
      if (videoToDelete !== null) {
        return handleConfirmVideoDelete;
      }
      return handleConfirmImageDelete;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 只根据删除目标切换 handler，不需要监听 handler 引用变化
    }, [imageToDelete, videoToDelete]);

    return (
      <div className='grid grid-cols-12 gap-6 mt-4 mb-14 md:mb-16 md:grid-rows-[minmax(0,auto)]'>
        {/* Left input area */}
        <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-5 md:row-span-1'>
          <Card className='p-4 md:px-6 md:pt-4 md:pb-6 transition-all duration-300 shadow-2xl border-1.5 border-primary-200 dark:border-border bg-card'>
            {/* Template Hero Banner */}
            <HeroBanner
              image={currentStyleData.image}
              video={currentStyleData.video}
              title={currentStyleData.name}
              onChange={onOpenTemplatePicker}
              onRandom={onRandomTemplate}
              t={t}
            />

            {/* Image Upload Section */}
            <div className='mt-4'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='font-bold text-foreground text-sm'>
                  {isMultiImageMode
                    ? t(
                        'image-animation-generator:ui.input.images.title',
                        'Images',
                      )
                    : t(
                        'image-animation-generator:ui.input.image.title',
                        'Image',
                      )}
                </h3>
                {/* 多图模式下隐藏顶层按钮，每个上传框内有独立的 Import Character */}
                {!isMultiImageMode && (
                  <ImportFromCharacterDropdown
                    fetchFullData={isImageTemplate || isExpressionTemplate}
                    onSelect={char => {
                      const updates: Record<string, string> = {};

                      // Save character ID for tagging in publish
                      if (char.id) {
                        setSelectedCharacterId(String(char.id));
                      }

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
                      if (
                        currentTemplateInputs?.some(
                          input => input.input_field === 'characterInfo',
                        )
                      ) {
                        const info = char.intro || char.character_description;
                        if (info) {
                          updates.characterInfo = info;
                        }
                      }

                      if (Object.keys(updates).length > 0) {
                        setInputValues(prev => ({ ...prev, ...updates }));
                      }

                      if (char.character_pfp) {
                        const pfpUrl = char.character_pfp;
                        // In single-image mode, replace the image
                        handleImageChange(pfpUrl);
                      }
                    }}
                  />
                )}
              </div>

              {isMultiImageMode ? (
                <div
                  className={`grid gap-3 ${
                    (currentInputMedia?.max_count || 3) <= 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 md:grid-cols-3'
                  }`}>
                  {Array.from({
                    length: currentInputMedia?.max_count || 3,
                  }).map((_, slotIndex) => {
                    const slotImage = inputImages[slotIndex];
                    return (
                      <div key={slotIndex} className='flex flex-col gap-1.5'>
                        {/* 序号标签 */}
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-medium text-muted-foreground'>
                            {t('image-animation-generator:ui.input.imageSlot', {
                              index: slotIndex + 1,
                              defaultValue: `Image ${slotIndex + 1}`,
                            })}
                          </span>
                          {slotImage && slotImage.url && (
                            <button
                              type='button'
                              className='text-xs text-red-400 hover:text-red-600 transition-colors'
                              onClick={() => {
                                if (slotImage.url.startsWith('blob:')) {
                                  URL.revokeObjectURL(slotImage.url);
                                }
                                setInputImages(prev => {
                                  const newImages = [...prev];
                                  // 清空此槽位而非删除，保持索引对齐
                                  newImages[slotIndex] = {
                                    id: `empty-${Date.now()}-${slotIndex}`,
                                    url: '',
                                    name: '',
                                  };
                                  // 如果末尾都是空的，裁剪掉尾部空元素
                                  while (
                                    newImages.length > 0 &&
                                    (!newImages[newImages.length - 1].url ||
                                      newImages[newImages.length - 1].url ===
                                        '')
                                  ) {
                                    newImages.pop();
                                  }
                                  return newImages;
                                });
                              }}>
                              {t('common:remove', 'Remove')}
                            </button>
                          )}
                        </div>
                        {/* 上传区域 */}
                        <UploadFile
                          onChange={url => {
                            setInputImages(prev => {
                              const newImages = [...prev];
                              // 释放旧的 blob URL
                              if (
                                newImages[slotIndex] &&
                                newImages[slotIndex].url.startsWith('blob:')
                              ) {
                                URL.revokeObjectURL(newImages[slotIndex].url);
                              }
                              // 填充中间的空槽位
                              while (newImages.length <= slotIndex) {
                                newImages.push({
                                  id: `empty-${Date.now()}-${newImages.length}`,
                                  url: '',
                                  name: '',
                                });
                              }
                              newImages[slotIndex] = {
                                id: `upload-${Date.now()}-${slotIndex}`,
                                url,
                                name: `Image ${slotIndex + 1}`,
                              };
                              return newImages;
                            });
                          }}
                          accept='.png,.jpg,.jpeg,.webp'
                          initialImage={slotImage?.url || ''}
                          className='!h-48 !md:h-64'
                        />
                        {/* Import Character 按钮 */}
                        <ImportFromCharacterDropdown
                          fetchFullData={
                            isImageTemplate || isExpressionTemplate
                          }
                          className='w-full'
                          onSelect={char => {
                            const updates: Record<string, string> = {};

                            if (char.id) {
                              setSelectedCharacterId(String(char.id));
                            }

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
                            if (
                              currentTemplateInputs?.some(
                                input => input.input_field === 'characterInfo',
                              )
                            ) {
                              const info =
                                char.intro || char.character_description;
                              if (info) {
                                updates.characterInfo = info;
                              }
                            }

                            if (Object.keys(updates).length > 0) {
                              setInputValues(prev => ({
                                ...prev,
                                ...updates,
                              }));
                            }

                            if (char.character_pfp) {
                              const pfpUrl = char.character_pfp;
                              setInputImages(prev => {
                                const newImages = [...prev];
                                while (newImages.length <= slotIndex) {
                                  newImages.push({
                                    id: `empty-${Date.now()}-${newImages.length}`,
                                    url: '',
                                    name: '',
                                  });
                                }
                                newImages[slotIndex] = {
                                  id: `char-${Date.now()}-${slotIndex}`,
                                  url: pfpUrl,
                                  name: char.character_name || 'Character',
                                };
                                return newImages;
                              });
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <UploadFile
                  onChange={handleImageChange}
                  accept='.png,.jpg,.jpeg,.webp'
                  initialImage={inputImage}
                  className='!h-18 !md:h-27'
                />
              )}
              <p className='text-xs text-muted-foreground mt-2'>
                {t(
                  'image-animation-generator:ui.input.image.description',
                  'Upload JPG/PNG/WEBP images up to 10MB, with a minimum width/height of 300px.',
                )}
              </p>
            </div>

            {/* Dynamic Template Input Fields */}
            {currentTemplateInputs && currentTemplateInputs.length > 0 && (
              <div className='mt-4 space-y-4'>
                <div>
                  <h3 className='font-bold text-foreground text-sm mb-2'>
                    {t(
                      'image-animation-generator:ui.input.config',
                      'Additional Information',
                    )}
                  </h3>
                  <div className='space-y-3'>
                    {currentTemplateInputs.map(inputField => {
                      const fieldName = inputField.input_field;
                      const fieldType = inputField.type || 'text';
                      const placeholder =
                        inputField.placeholder ||
                        t(
                          `photo-to-anime:ui.${fieldName}Placeholder`,
                          `Enter ${fieldName}...`,
                        );
                      const label = t(
                        `photo-to-anime:ui.${fieldName}`,
                        fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
                      ) as string;

                      const handleValueChange = (value: string) => {
                        setInputValues(prev => ({
                          ...prev,
                          [fieldName]: value,
                        }));
                      };

                      // Special handling for language field - always use Select with predefined options
                      if (fieldName.toLowerCase() === 'language') {
                        return (
                          <Select
                            key={fieldName}
                            radius='md'
                            label={label}
                            placeholder={t(
                              'photo-to-anime:ui.languagePlaceholder',
                              'Select Language',
                            )}
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
                            size='sm'
                            classNames={{
                              trigger:
                                'bg-input !data-[hover=true]:bg-input !data-[focus=true]:bg-input !data-[focus-visible=true]:bg-input !focus-within:bg-input',
                              label: '!text-foreground',
                              value: '!text-foreground',
                            }}>
                            {languageOptions.map(lang => (
                              <SelectItem key={lang.key} value={lang.key}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </Select>
                        );
                      }

                      // Choice field rendering
                      const extField = inputField as ExtendedTemplateInputField;
                      const hasChoices =
                        (fieldType === 'choice' && inputField.choices) ||
                        extField.options;
                      const choiceOptions: ChoiceOption[] | undefined =
                        extField.options || inputField.choices;

                      if (hasChoices && choiceOptions) {
                        if (inputField.question) {
                          return (
                            <div key={fieldName} className='space-y-2'>
                              <label className='text-sm font-medium text-foreground block'>
                                {extField.questionKey
                                  ? t(extField.questionKey)
                                  : inputField.question}
                              </label>
                              <Select
                                radius='md'
                                placeholder={'Select...'}
                                selectedKeys={
                                  inputValues[fieldName]
                                    ? [inputValues[fieldName]]
                                    : []
                                }
                                onSelectionChange={keys => {
                                  const selected = Array.from(
                                    keys,
                                  )[0] as string;
                                  if (selected) {
                                    handleValueChange(selected);
                                  }
                                }}
                                variant='flat'
                                size='sm'
                                classNames={{
                                  trigger:
                                    'bg-input data-[hover=true]:bg-input data-[focus=true]:bg-input data-[focus-visible=true]:bg-input focus-within:bg-input',
                                  label: '!text-foreground',
                                  value: '!text-foreground whitespace-normal',
                                }}>
                                {choiceOptions.map((choice, index: number) => {
                                  const choiceLabel = choice?.labelKey
                                    ? t(choice.labelKey)
                                    : choice?.label ||
                                      choice?.text ||
                                      choice?.name ||
                                      choice?.value ||
                                      `option-${index}`;
                                  const value =
                                    choice?.value || choice?.id || choiceLabel;

                                  return (
                                    <SelectItem
                                      key={value}
                                      classNames={{
                                        base: 'data-[hover=true]:bg-primary-50',
                                        title:
                                          'whitespace-normal break-words leading-relaxed',
                                      }}>
                                      {choiceLabel}
                                    </SelectItem>
                                  );
                                })}
                              </Select>
                            </div>
                          );
                        }
                      }

                      // Text/Textarea field rendering
                      const isTextarea =
                        fieldType === 'textarea' ||
                        fieldName.toLowerCase().includes('info') ||
                        fieldName.toLowerCase().includes('description') ||
                        fieldName.toLowerCase().includes('background') ||
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
                                inputWrapper:
                                  'bg-input !data-[hover=true]:bg-input !data-[focus=true]:bg-input !data-[focus-visible=true]:bg-input !focus-within:bg-input',
                                label: '!text-foreground',
                                input: '!text-foreground',
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
                              classNames={{
                                inputWrapper:
                                  'bg-input !data-[hover=true]:bg-input !data-[focus=true]:bg-input !data-[focus-visible=true]:bg-input !focus-within:bg-input',
                                label: '!text-foreground',
                                input: '!text-foreground',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Public Visibility */}
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
              <span className='mr-2'>
                {isImageTemplate || isExpressionTemplate
                  ? t('photo-to-anime:button.convert', {
                      style: currentStyleData.name || 'Generate',
                    })
                  : t(
                      'image-animation-generator:ui.buttons.generateAnimation',
                      'Generate Video',
                    )}
              </span>
              {isAuth && (
                <Chip
                  startContent={
                    <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                  }
                  variant='bordered'
                  color='primary'
                  size='sm'
                  className='bg-white dark:bg-card'
                  classNames={{
                    content: 'dark:text-foreground',
                  }}>
                  -{cost}/{profile.credit}
                </Chip>
              )}
            </Button>
          </Card>
        </div>

        {/* Right output area */}
        <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-7 md:row-span-1 md:h-0 md:min-h-full'>
          <Card className='p-4 md:pb-6 md:px-6 md:pt-4 h-full shadow-md md:shadow-2xl border-1.5 border-primary-50 dark:border-border bg-card md:flex md:flex-col md:overflow-hidden'>
            <h2 className='flex items-center mb-4 text-base font-bold text-primary-800 dark:text-primary-300'>
              <FaDownload className='mr-2 text-primary-600' />{' '}
              {t('common:results', 'Results')}
            </h2>
            <div className='flex overflow-hidden flex-col flex-1 w-full max-h-[600px] md:max-h-none'>
              <div className='overflow-y-auto flex-1 rounded-lg md:min-h-0'>
                {allResults?.length > 0 ? (
                  <div className='grid grid-cols-1 gap-2'>
                    {allResults.map((item, index) => {
                      const itemType = item._type;
                      const handlers = getResultHandlers(itemType);
                      const tool =
                        item._tool ||
                        (itemType === 'image'
                          ? 'photo_to_anime'
                          : 'video-effect');

                      return (
                        <ResultCard
                          key={`${itemType}-${item.id}`}
                          data={item}
                          handleDownload={handlers.handleDownload}
                          handleDelete={handlers.handleDeleteClick}
                          index={index}
                          type={itemType}
                          showPrompt={true}
                          isExample={item.id === -1}
                          tool={tool}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                    <MdOutlineAnimation
                      size={48}
                      className='mb-4 text-primary-300'
                    />
                    <p className='text-center'>
                      {t('photo-to-anime:results.empty', 'No results yet')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Delete Modal */}
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
              {t('photo-to-anime:deleteModal.title', 'Delete Confirmation')}
            </ModalHeader>
            <ModalBody>
              <p>
                {t(
                  'photo-to-anime:deleteModal.message',
                  'Are you sure you want to delete this?',
                )}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={() => setDeleteModalOpen(false)}
                className='transition-all duration-300 hover:bg-muted'>
                {t('photo-to-anime:deleteModal.cancel', 'Cancel')}
              </Button>
              <Button
                color='danger'
                onPress={handleConfirmDelete}
                className='bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 hover:from-red-600 hover:to-pink-600'>
                {t('photo-to-anime:deleteModal.delete', 'Delete')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Dance Style Picker Modal */}
        {isDanceTemplate && (
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
              <ModalHeader className='text-primary-800 pt-4 pb-0'>
                {t(
                  'image-animation-generator:ui.styleModes.dance',
                  'Dance Styles',
                )}
              </ModalHeader>
              <ModalBody>
                <VideoStyleGrids
                  selectedStyleId={selectedDanceStyle?.id || ''}
                  setStyle={style => {
                    setSelectedDanceStyle(style as DanceTemplate);
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
                    if (tempUrl) {
                      setSelectedDanceStyle(uploadedStyle);
                    } else {
                      setSelectedDanceStyle(undefined);
                    }
                  }}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </div>
    );
  },
);

UnifiedTemplateGenerator.displayName = 'UnifiedTemplateGenerator';

export default memo(UnifiedTemplateGenerator);
