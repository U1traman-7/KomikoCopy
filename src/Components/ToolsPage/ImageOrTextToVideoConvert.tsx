import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { BiSolidZap } from 'react-icons/bi';
import { MdOutlineAnimation, MdAccessTime } from 'react-icons/md';
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  Switch,
  Tooltip,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { GenerationStatus } from './utils';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import {
  calculateTextToVideoCost,
  ImageToVideoModel,
  TextToVideoModel,
  TextToVideoStyle,
  calculateImageToAnimationCost,
} from '../../../api/tools/_zaps';
import { authAtom } from 'state';
import { useAtomValue } from 'jotai';
import {
  redrawImageToBase64,
  getImageSize,
  hasTransparency,
} from '@/utils/index';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { VideoToolsTabs } from './VideoToolsTabs';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVideos } from 'hooks/useVideos';
import { isNil } from 'lodash-es';
import {
  handleVideoDownload,
  handleDeleteClick as handleVideoDeleteClick,
  handleConfirmDelete as handleVideoConfirmDelete,
  TOAST_CONFIG,
} from '../../utilities/video/videoActions';
import { uploadImageToFal } from '../../utilities/fal';
import { compressImage } from '../ImageUploader';
import { stitchImagesInBrowser } from '../../utils/stitchImagesInBrowser';
// Extracted modules
import { createModelOptions } from '../VideoGeneration/config/modelOptions';
import {
  getModelConfig,
  getTextToVideoConfig,
  VideoAspectRatio,
  VideoDuration,
} from '../VideoGeneration/config/modelConfig';
import { aspectRatioIconMap } from '../VideoGeneration/constants/aspectRatioIcons';
import {
  convertModel,
  uploadImage,
  uploadAudio,
  getClosestAspectRatioFromList,
} from '../VideoGeneration/utils/videoHelpers';
import { videosAPI } from '../VideoGeneration/utils/api';
import { useCharacterMention } from '../VideoGeneration/hooks/useCharacterMention';
import { useAudioInput } from '../VideoGeneration/hooks/useAudioInput';
import { useFilteredModelOptions } from '../VideoGeneration/hooks/useFilteredModelOptions';
import { ImageUploadArea } from '../VideoGeneration/components/ImageUploadArea';
import { CharacterQuickSelector } from '../VideoGeneration/components/CharacterQuickSelector';
import { MentionDropdown } from '../VideoGeneration/components/MentionDropdown';
import { PromptTextarea } from '../VideoGeneration/components/PromptTextarea';
import { useRecentCharacters } from '../../hooks/useRecentCharacters';
import AudioInput from '../VideoGeneration/components/AudioInput';
import DurationSelector from '../VideoGeneration/Selector/DurationSelector';
import AspectRatioSelector from '../VideoGeneration/Selector/AspectRatioSelector';
import ResolutionSelector from '../VideoGeneration/Selector/ResolutionSelector';
import ModelSelector from '../VideoGeneration/Selector/ModelSelector';
import StyleSelector from '../VideoGeneration/Selector/StyleSelector';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { consumeDraft, debouncedSaveDraft, getDraft } from '@/utils/draft';
import { getCreateYoursData } from '../../utilities/tools';
import { loginModalAtom } from '../../state';
import { recordStyleUsage } from '../../utils/styleUsageStats';

enum VideoResolution {
  '360p' = '360p',
  '540p' = '540p',
  '720p' = '720p',
  '1080p' = '1080p',
  '480p' = '480p',
}

/**
 * Extract character IDs from prompt (e.g., "@character_id" -> "character_id")
 * Supports both @character-id (new) and <character-id> (old) formats
 * Supports formats like @Anya_(Spy_X_Family), @kusa-11, @Mr._C.B._(Umamusume)
 *
 * Uses same regex as backend (api/_utils/characterHelper.ts) for consistency
 */
function extractCharacterIdsFromPrompt(prompt: string): string[] {
  // Support both old <xx> format and new @xx format
  // Match alphanumeric characters (\w = [a-zA-Z0-9_]), hyphens, parentheses, periods, colons
  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const characterIds: string[] = [];
  let match = reg.exec(prompt);
  while (match) {
    // match[1] is for @xx format, match[2] is for <xx> format
    characterIds.push(match[1] || match[2]);
    match = reg.exec(prompt);
  }
  return characterIds;
}

/**
 * Load missing character images before submitting video generation task
 * Ensures all characters mentioned in prompt have their images loaded
 */
async function ensureCharacterImagesLoaded(
  prompt: string,
  referenceImages: Array<{
    id: string;
    url: string;
    name: string;
    characterId?: string;
    isCharacter?: boolean;
  }>,
  setReferenceImages: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        url: string;
        name: string;
        file?: File;
        characterId?: string;
        isCharacter?: boolean;
      }>
    >
  >,
  processedCharacterIdsRef: React.MutableRefObject<Set<string>>,
  t: any,
): Promise<boolean> {
  // Extract character IDs mentioned in prompt
  const mentionedCharacterIds = extractCharacterIdsFromPrompt(prompt);

  if (mentionedCharacterIds.length === 0) {
    return true; // No characters to load
  }

  // Check which characters already have loaded images OR are being processed
  const loadedCharacterIds = referenceImages
    .filter(img => img.isCharacter && img.characterId)
    .map(img => img.characterId);

  // Find characters that are mentioned but don't have images yet AND not being processed
  const missingCharacterIds = mentionedCharacterIds.filter(
    id =>
      !loadedCharacterIds.includes(id) &&
      !processedCharacterIdsRef.current.has(id),
  );

  // If there are missing character images, load them first
  if (missingCharacterIds.length > 0) {
    // Mark as being processed
    missingCharacterIds.forEach(id => processedCharacterIdsRef.current.add(id));

    try {
      const response = await fetch(
        `/api/getCharactersProfile?uniqids=${missingCharacterIds.join(',')}&fields=minimal`,
      );
      const characters = await response.json();

      if (characters && !characters.error && characters.length > 0) {
        // Add missing character images to referenceImages
        const newCharacterImages = characters
          .filter((character: any) => {
            // Skip if already exists
            return !referenceImages.some(
              img => img.characterId === character.character_uniqid,
            );
          })
          .map((character: any) => ({
            id: `char-${character.character_uniqid}-${Date.now()}`,
            url: character.character_pfp,
            name: character.character_name,
            characterId: character.character_uniqid,
            isCharacter: true,
          }));

        if (newCharacterImages.length > 0) {
          // Update referenceImages state and wait for it to complete
          await new Promise<void>(resolve => {
            setReferenceImages(prev => {
              // Double-check to avoid duplicates (in case useEffect also added them)
              const finalImages = newCharacterImages.filter(
                newImg =>
                  !prev.some(
                    existingImg =>
                      existingImg.characterId === newImg.characterId,
                  ),
              );
              const updated = [...prev, ...finalImages];
              // Use setTimeout to ensure state update completes
              setTimeout(() => resolve(), 0);
              return updated;
            });
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to load character images:', error);
      // Remove from processed set if fetch failed
      missingCharacterIds.forEach(id =>
        processedCharacterIdsRef.current.delete(id),
      );
      toast.error(
        t(
          'toast:error.failedToLoadCharacters',
          'Failed to load character images',
        ),
        {
          position: 'top-center',
          style: {
            background: 'hsl(var(--muted-foreground))',
            color: 'hsl(var(--background))',
          },
        },
      );
      return false;
    }
  }

  return true;
}

function ImageOrTextToVideoConvert({
  model = ImageToVideoModel.VIDU,
  exampleVideoUrl = '/images/examples/image-animation-generator/output2.mp4',
}: {
  model?: ImageToVideoModel;
  exampleVideoUrl?: string;
}) {
  const { t } = useTranslation([
    'image-animation-generator',
    'common',
    'toast',
  ]);
  const { t: uiT } = useTranslation('image-animation-generator', {
    keyPrefix: 'ui',
  });
  const router = useRouter();
  const didInitFromQueryRef = useRef(false);
  const shouldAutoGenerateRef = useRef(false);
  const processedCharacterIdsRef = useRef<Set<string>>(new Set());

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastVideoRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const isAuth = useAtomValue(authAtom);
  const loginModal = useAtomValue(loginModalAtom);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // States
  const [inputImage, setInputImage] = useState<string>('');
  const [endFrameImage, setEndFrameImage] = useState<string>('');
  const [referenceImages, setReferenceImages] = useState<
    Array<{
      id: string;
      url: string;
      name: string;
      file?: File;
      characterId?: string;
      isCharacter?: boolean;
    }>
  >([]);
  const [prompt, setPrompt] = useState<string>('');
  const [magicPromptLoading, setMagicPromptLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectedModel, setSelectedModel] = useState<ImageToVideoModel>(model);
  const [userSelectedAspectRatio, setUserSelectedAspectRatio] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<TextToVideoStyle>(
    model === ImageToVideoModel.VIDU
      ? TextToVideoStyle.MODERN_ANIME
      : TextToVideoStyle.REALISTIC,
  );

  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  }>({ width: 600, height: 600 });

  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>(
    (() => {
      const config = getModelConfig(model);
      return config.defaultResolution
        ? (config.defaultResolution as VideoResolution)
        : VideoResolution['480p'];
    })(),
  );
  const [cost, setCost] = useState(0);
  // Load user settings from unified cache
  const getI2VSettings = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('i2v-settings');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const [multiShots, setMultiShots] = useState(() => {
    return getI2VSettings().multiShots ?? false;
  });
  const [cameraFixed, setCameraFixed] = useState(() => {
    return getI2VSettings().cameraFixed ?? false;
  });
  // const FRAME_PACK_VALUE = ImageToVideoModel.FRAME_PACK as number;

  // Model options configuration - filter based on upload state
  const allModelOptions: any[] = useMemo(() => createModelOptions(uiT), [uiT]);

  // Use shared hook for filtered model options
  const { filteredModelOptions: modelOptions, characterImageCount } =
    useFilteredModelOptions({
      allModelOptions,
      referenceImages,
      endFrameImage,
      selectedModel,
      onModelChange: setSelectedModel,
    });

  // Recent characters hook
  const { addToRecent } = useRecentCharacters(10);

  // Note: useCharacterMention now handles character search via API
  // No need to fetch all official characters upfront

  // Character mention hook
  // Note: OC mention format has been updated from <character_id> to @character_id
  // Backend APIs (getOwnedCharacters, getCollectedCharacters) now return @character_id format
  // The backend should query character data by character_uniqid when processing @mentions
  const {
    availableCharacters,
    loadingCharacters,
    showMentionDropdown,
    setShowMentionDropdown,
    dropdownPosition,
    textareaRef,
    mentionDropdownRef,
    filteredCharacters,
    isCharacterMentioned,
    extractCharacterIdsFromPrompt,
    toggleCharacterMention: originalToggleCharacterMention,
    handlePromptChange,
    selectCharacterFromDropdown,
  } = useCharacterMention({
    isAuth,
    prompt,
    setPrompt,
    onAddCharacterImage: character => {
      // Add to recent characters when selected
      addToRecent(character as any);

      // Unified multi-image mode: add to referenceImages
      processedCharacterIdsRef.current.add(character.character_uniqid);

      // Use functional update to check latest state
      setReferenceImages(prev => {
        // 1) If this character already exists, do nothing
        const existsByCharId = prev.some(
          img => img.characterId === character.character_uniqid,
        );
        if (existsByCharId) {
          return prev;
        }

        const maxOCs = 7; // Fixed max for all models
        const currentCharacterCount = prev.filter(
          img => img.isCharacter,
        ).length;

        // 2) If an image with the same URL already exists, convert it to a character image
        const existingUrlIndex = prev.findIndex(
          img => img.url === character.character_pfp,
        );

        if (existingUrlIndex !== -1) {
          // Check limit: converting a non-character to character increases count by 1
          const willIncrease = !prev[existingUrlIndex].isCharacter;
          if (willIncrease && currentCharacterCount >= maxOCs) {
            toast.error(
              t('ui.input.maxOCsReached', {
                max: maxOCs,
                position: 'top-center',
              }),
            );
            return prev;
          }

          const updated = [...prev];
          updated[existingUrlIndex] = {
            ...updated[existingUrlIndex],
            name: character.character_name,
            characterId: character.character_uniqid,
            isCharacter: true,
          } as any;
          return updated;
        }

        // 3) Otherwise, add new character image (respect max limit)
        if (currentCharacterCount >= maxOCs) {
          toast.error(
            t('ui.input.maxOCsReached', {
              max: maxOCs,
              position: 'top-center',
            }),
          );
          return prev;
        }

        return [
          ...prev,
          {
            id: `char-${character.character_uniqid}-${Date.now()}`,
            url: character.character_pfp,
            name: character.character_name,
            characterId: character.character_uniqid,
            isCharacter: true,
          },
        ];
      });
    },
    onRemoveCharacterImage: characterId => {
      setReferenceImages(prev =>
        prev.filter(img => img.characterId !== characterId),
      );
    },
  });

  // Wrapper function to add character to recent list when selected from dropdown
  const handleSelectCharacterFromDropdown = (character: any) => {
    addToRecent(character as any);
    selectCharacterFromDropdown(character);
  };

  const getPageKey = () => {
    return location.pathname.slice(1);
  };

  // Wrapper function to check conditions before toggling character mention
  const handleToggleCharacterMention = (character: any) => {
    const characterId = character.character_uniqid;
    const mention = `@${characterId}`;
    const isAlreadyMentioned = prompt.includes(mention);

    // If removing, allow it
    if (isAlreadyMentioned) {
      originalToggleCharacterMention(character);
      return;
    }

    // If adding, check max limit (unified multi-image mode)
    const currentCharacterCount = referenceImages.filter(
      img => img.isCharacter,
    ).length;
    const maxOCs = 7; // Fixed max for all models

    if (currentCharacterCount >= maxOCs) {
      toast.error(
        t('ui.input.maxOCsReached', {
          max: maxOCs,
        }),
        { position: 'top-center' },
      );
      return;
    }

    // Add to recent when toggling on
    addToRecent(character as any);
    originalToggleCharacterMention(character);
  };

  // Audio input hook
  const { selectedAudio, audioDuration, handleAudioChange, clearAllAudio } =
    useAudioInput(t);

  // Migrate any legacy inputImage to referenceImages (unified multi-image mode)
  useEffect(() => {
    // If there's an inputImage but no referenceImages, migrate it
    if (inputImage && referenceImages.length === 0) {
      setReferenceImages([
        {
          id: `${Date.now()}-${Math.random()}`,
          url: inputImage,
          name: 'Image 1',
        },
      ]);
      setInputImage(''); // Clear single image state
    }
  }, [inputImage, referenceImages.length]);

  const initialDuration = (getModelConfig(model).defaultDuration ||
    5) as VideoDuration;
  const [duration, setDuration] = useState<VideoDuration>(initialDuration);
  const { submit: openModal } = useOpenModal();
  const MAX_AUDIO_SIZE_MB = 15;
  const [isPublic, setIsPublic] = useState(true);

  // Auto-switch to VIDU_Q1_MULTI when VIDU_Q1 has multiple images
  const effectiveModel = useMemo(() => {
    if (
      (selectedModel === ImageToVideoModel.VIDU_Q2 ||
        selectedModel === (TextToVideoModel.VIDU_Q2 as any)) &&
      referenceImages.length >= 2
    ) {
      return ImageToVideoModel.VIDU_Q2_MULTI;
    }
    return selectedModel;
  }, [selectedModel, referenceImages.length]);

  // Memoized config - use effectiveModel (might be auto-switched from VIDU_Q1 to VIDU_Q1_MULTI)
  const mentionedCharacterIds = useMemo(
    () => extractCharacterIdsFromPrompt(prompt),
    [prompt],
  );
  const hasAnyImage =
    inputImage ||
    referenceImages.length > 0 ||
    mentionedCharacterIds.length > 0;

  // Image-to-video config (always available)
  const imageConfig = useMemo(
    () => getModelConfig(effectiveModel),
    [effectiveModel],
  );

  // Text-to-video config (for text-only mode) - uses textToVideoFallback from imageConfig
  // Returns null if model is image-only and has no text fallback (text mode not supported)
  const textConfig = useMemo(() => {
    if (
      imageConfig.inputMode === 'image-only' &&
      !imageConfig.textToVideoFallback
    ) {
      return null;
    }
    const fallbackModel = imageConfig.textToVideoFallback;
    return fallbackModel ? getTextToVideoConfig(fallbackModel) : imageConfig;
  }, [imageConfig]);

  const config = hasAnyImage || !textConfig ? imageConfig : textConfig;

  // Helper: Check if WAN model is selected
  const isWanModel = useMemo(
    () =>
      selectedModel === ImageToVideoModel.WAN ||
      (selectedModel as any) === TextToVideoModel.WAN,
    [selectedModel],
  );

  // Helper: Validate image meets minimum dimensions for WAN model (240x240)
  const validateImageForWan = async (url: string): Promise<boolean> => {
    if (!isWanModel) return true;
    const size = await getImageSize(url);
    return size.width >= 240 && size.height >= 240;
  };

  // Derive all UI options from the active config
  const shouldShowDuration = config.showDuration;
  const shouldShowAspectRatio = config.showAspectRatio;

  // Icon maps for selectors

  const durationOptions = useMemo(() => {
    const options = config.durationOptions || [5];
    return options.map(duration => ({
      key: String(duration),
      label: `${duration}s`,
      icon: <MdAccessTime className='w-4 h-4' />,
    }));
  }, [config.durationOptions]);

  const aspectRatioOptions = useMemo(() => {
    const options = config.aspectRatioOptions || ['16:9', '9:16'];
    return options.map(ratio => ({
      key: ratio,
      label: ratio,
      icon: aspectRatioIconMap[ratio],
    }));
  }, [config.aspectRatioOptions]);

  const { resultVideos, setResultVideos, submitTask, profile, addTaskId } =
    useVideos(['image_animation'], exampleVideoUrl);

  // Ensure loading is false on mount
  useEffect(() => {
    setLoading(false);
  }, []);

  // Effects
  useEffect(() => {
    if (inputImage) {
      getImageSize(inputImage).then(size => {
        setImageSize(size);
        if (shouldShowAspectRatio && !userSelectedAspectRatio) {
          const availableRatios = config.aspectRatioOptions || ['16:9', '9:16'];
          const autoAspectRatio = getClosestAspectRatioFromList(
            size.width,
            size.height,
            availableRatios,
          );
          setAspectRatio(autoAspectRatio);
        }
      });
    }
  }, [
    inputImage,
    selectedModel,
    userSelectedAspectRatio,
    shouldShowAspectRatio,
  ]);

  // Auto-detect aspect ratio from reference images (multi-image mode)
  useEffect(() => {
    if (referenceImages.length > 0 && !userSelectedAspectRatio) {
      // Get the first non-character image
      const firstRegularImage = referenceImages.find(img => !img.isCharacter);
      if (firstRegularImage) {
        getImageSize(firstRegularImage.url).then(size => {
          setImageSize(size);
          if (shouldShowAspectRatio) {
            const availableRatios = config.aspectRatioOptions || [
              '16:9',
              '9:16',
            ];
            const autoAspectRatio = getClosestAspectRatioFromList(
              size.width,
              size.height,
              availableRatios,
            );
            setAspectRatio(autoAspectRatio);
          }
        });
      }
    }
  }, [
    referenceImages,
    selectedModel,
    userSelectedAspectRatio,
    shouldShowAspectRatio,
  ]);

  useEffect(() => {
    const hasImage = inputImage || referenceImages.length > 0;

    const durationStr = String(duration) as `${VideoDuration}`;
    // 根据模型的 inputMode 决定使用哪种成本计算方式
    // image-only 模型：始终使用 ImageToVideo 成本计算
    // text-only 模型：始终使用 TextToVideo 成本计算
    // both 模型：根据是否有图片决定
    const isImageOnlyModel = imageConfig.inputMode === 'image-only';
    const isTextOnlyModel = imageConfig.inputMode === 'text-only';
    const shouldUseImageCost =
      isImageOnlyModel || (hasImage && !isTextOnlyModel);

    if (shouldUseImageCost) {
      // 使用 ImageToVideo 成本计算
      // 使用 effectiveModel（考虑多参考图自动切换到 VIDU_Q2_MULTI 等情况）
      setCost(
        calculateImageToAnimationCost(
          effectiveModel,
          durationStr,
          selectedResolution as any,
          aspectRatio as any,
        ),
      );
    } else {
      // 使用 TextToVideo 成本计算
      // 使用 imageConfig.textToVideoFallback 获取对应的 TextToVideoModel
      const textModel =
        imageConfig.textToVideoFallback || TextToVideoModel.VIDU;
      setCost(
        calculateTextToVideoCost(
          textModel,
          durationStr,
          selectedResolution as any,
          aspectRatio as any,
        ),
      );
    }
  }, [
    effectiveModel,
    duration,
    selectedResolution,
    aspectRatio,
    imageSize,
    inputImage,
    referenceImages,
    imageConfig,
  ]);

  // Reset duration to default when model changes
  useEffect(() => {
    const defaultDuration = (config.defaultDuration || 5) as VideoDuration;
    setDuration(defaultDuration);
  }, [effectiveModel]);

  useEffect(() => {
    const availableDurations = durationOptions.map(opt => Number(opt.key));

    // Validate duration is in available options (fallback safety)
    if (!availableDurations.includes(duration)) {
      const defaultDuration = (config.defaultDuration || 5) as VideoDuration;
      setDuration(defaultDuration);
    }

    const defaultResolution = config.defaultResolution || '480p';
    if (selectedResolution !== defaultResolution) {
      setSelectedResolution(defaultResolution as VideoResolution);
    }

    // Auto-adjust aspect ratio ONLY when model changes
    if (shouldShowAspectRatio) {
      const availableRatios = (config.aspectRatioOptions || [
        '16:9',
        '9:16',
      ]) as string[];

      // If current aspect ratio is not available for this model, choose a new one
      if (!availableRatios.includes(aspectRatio)) {
        const defaultAspectRatio = (config.defaultAspectRatio ||
          '16:9') as string;
        setAspectRatio(defaultAspectRatio);
      }
    }

    // Reset style based on model
    setSelectedStyle(
      selectedModel === ImageToVideoModel.VIDU
        ? TextToVideoStyle.MODERN_ANIME
        : TextToVideoStyle.REALISTIC,
    );

    // Reset multiShots when switching to a model that doesn't support it
    const modelConfig = getModelConfig(selectedModel);
    if (!modelConfig.otherParams?.supportMulitShots) {
      setMultiShots(false);
    }

    // Reset cameraFixed when switching to a model that doesn't support it
    if (!modelConfig.otherParams?.supportCameraFixed) {
      setCameraFixed(false);
    }

    setUserSelectedAspectRatio(false);
  }, [selectedModel]);

  // Persist user settings to unified localStorage key
  useEffect(() => {
    const settings = { multiShots, cameraFixed };
    localStorage.setItem('i2v-settings', JSON.stringify(settings));
  }, [multiShots, cameraFixed]);

  // Validate existing images when switching to WAN model (min 240x240)
  useEffect(() => {
    if (!isWanModel) return;

    const validateImages = async () => {
      let hasInvalidImages = false;

      // Validate input image
      if (inputImage) {
        const isValid = await validateImageForWan(inputImage);
        if (!isValid) {
          setInputImage('');
          hasInvalidImages = true;
        }
      }

      // Validate reference images
      if (referenceImages.length > 0) {
        const validatedRefs = await Promise.all(
          referenceImages.map(async img => {
            const isValid = await validateImageForWan(img.url);
            return isValid ? img : null;
          }),
        );

        const validRefs = validatedRefs.filter(
          (img): img is NonNullable<typeof img> => img !== null,
        );

        if (validRefs.length < referenceImages.length) {
          setReferenceImages(validRefs);
          hasInvalidImages = true;
        }
      }

      if (hasInvalidImages) {
        toast.error(t('ui.toasts.imageTooSmall'));
      }
    };

    validateImages();
  }, [isWanModel]);

  // Get prompt and character from URL query parameters (run once per mount)
  useEffect(() => {
    if (!router.isReady || didInitFromQueryRef.current) return;
    const {
      prompt,
      mediaUrl,
      characterId,
      generationId,
      model: queryModel,
      duration: queryDuration,
      aspectRatio: queryAspectRatio,
      style: queryStyle,
      hasReferenceImages,
    } = router.query;

    // Set prompt if provided
    if (prompt && typeof prompt === 'string' && prompt.trim() !== '') {
      setPrompt(prompt);
    } else if (!generationId) {
      getDraft(getPageKey(), setPrompt);
    }

    // Handle model, duration, aspectRatio, style from QuickCreatePanel
    if (queryModel && typeof queryModel === 'string') {
      const modelNum = Number(queryModel);
      if (!isNaN(modelNum)) {
        setSelectedModel(modelNum as ImageToVideoModel);
      }
    }

    if (queryDuration && typeof queryDuration === 'string') {
      const durationNum = Number(queryDuration);
      if (!isNaN(durationNum)) {
        setDuration(durationNum as VideoDuration);
      }
    }

    if (queryAspectRatio && typeof queryAspectRatio === 'string') {
      setAspectRatio(queryAspectRatio);
      setUserSelectedAspectRatio(true);
    }

    if (queryStyle && typeof queryStyle === 'string') {
      const styleNum = Number(queryStyle);
      if (!isNaN(styleNum)) {
        setSelectedStyle(styleNum as TextToVideoStyle);
      }
    }

    // Handle reference images from sessionStorage (from QuickCreatePanel)
    if (hasReferenceImages === 'true') {
      try {
        const storedImages = sessionStorage.getItem(
          'quickCreate_videoReferenceImages',
        );
        if (storedImages) {
          const parsedImages = JSON.parse(storedImages);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            setReferenceImages(parsedImages);
          }
          // Clear sessionStorage after reading
          sessionStorage.removeItem('quickCreate_videoReferenceImages');
        }
      } catch (error) {
        console.error(
          'Failed to parse reference images from sessionStorage:',
          error,
        );
      }
    }

    // Handle end frame image from sessionStorage (from QuickCreatePanel)
    const { hasEndFrameImage } = router.query;
    if (hasEndFrameImage === 'true') {
      try {
        const storedEndFrame = sessionStorage.getItem(
          'quickCreate_videoEndFrameImage',
        );
        if (storedEndFrame) {
          setEndFrameImage(storedEndFrame);
          sessionStorage.removeItem('quickCreate_videoEndFrameImage');
        }
      } catch (error) {
        console.error(
          'Failed to get end frame image from sessionStorage:',
          error,
        );
      }
    }

    // Handle character from route (from Characters page Animate button)
    if (characterId && typeof characterId === 'string') {
      const mention = `@${characterId}`;
      setPrompt(prev => (prev ? `${prev} ${mention}` : mention));

      // Always fetch character data to get the real name
      const fetchCharacterData = async () => {
        try {
          const response = await fetch(
            `/api/getCharactersProfile?uniqids=${characterId}`,
          );
          const characters = await response.json();

          if (characters && !characters.error && characters.length > 0) {
            const character = characters[0];

            // Use mediaUrl if provided, otherwise use character_pfp from API
            const imageUrl =
              mediaUrl && typeof mediaUrl === 'string'
                ? mediaUrl
                : character.character_pfp;

            setReferenceImages(prev => {
              // Skip if this character already exists
              const existsByChar = prev.some(
                img => img.characterId === character.character_uniqid,
              );
              if (existsByChar) return prev;

              const maxOCs = 7;
              const currentCharacterCount = prev.filter(
                img => img.isCharacter,
              ).length;

              // If an image with the same URL exists, convert it to a character image
              const existingUrlIndex = prev.findIndex(
                img => img.url === imageUrl,
              );
              if (existingUrlIndex !== -1) {
                const willIncrease = !prev[existingUrlIndex].isCharacter;
                if (willIncrease && currentCharacterCount >= maxOCs) {
                  toast.error(
                    t('ui.input.maxOCsReached', {
                      max: maxOCs,
                      position: 'top-center',
                    }),
                  );
                  return prev;
                }
                const updated = [...prev];
                updated[existingUrlIndex] = {
                  ...updated[existingUrlIndex],
                  name: character.character_name,
                  characterId: character.character_uniqid,
                  isCharacter: true,
                } as any;
                return updated;
              }

              // Otherwise, add new character image (respect max limit)
              if (currentCharacterCount >= maxOCs) {
                toast.error(
                  t('ui.input.maxOCsReached', {
                    max: maxOCs,
                    position: 'top-center',
                  }),
                );
                return prev;
              }

              return [
                ...prev,
                {
                  id: `char-${character.character_uniqid}-${Date.now()}`,
                  url: imageUrl,
                  name: character.character_name,
                  characterId: character.character_uniqid,
                  isCharacter: true,
                },
              ];
            });
          }
        } catch (error) {
          console.error('Failed to fetch character data:', error);
        }
      };

      fetchCharacterData();
    } else if (mediaUrl && typeof mediaUrl === 'string') {
      // Handle standalone mediaUrl (without characterId)
      if (imageConfig.supportsMultipleReferenceImages) {
        setReferenceImages(prev => {
          const exists = prev.some(img => img.url === mediaUrl);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              url: mediaUrl,
              name: `Image ${prev.length + 1}`,
            },
          ];
        });
      } else {
        handleImageChange(mediaUrl);
      }
    } else if (!generationId) {
      getDraft(getPageKey(), setPrompt);
    }
    didInitFromQueryRef.current = true;

    // Mark for auto-generate if flag is set (from QuickCreatePanel)
    const { autoGenerate } = router.query;
    if (autoGenerate === 'true') {
      shouldAutoGenerateRef.current = true;
    }
  }, [router.isReady, router.query]);

  // Auto-generate effect - triggers when state is ready
  useEffect(() => {
    if (!shouldAutoGenerateRef.current || !isAuth || loading) return;

    // Check if we have the required data
    const hasPrompt = prompt.trim().length > 0;
    const hasImages = referenceImages.length > 0 || inputImage || endFrameImage;

    // Only trigger if we have prompt or images
    if (hasPrompt || hasImages) {
      shouldAutoGenerateRef.current = false; // Prevent re-triggering
      handleSubmit();
    }
  }, [prompt, referenceImages, inputImage, endFrameImage, isAuth, loading]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // Set prompt if available
        if (generation.prompt) {
          setPrompt(generation.prompt);
        }

        // Set model, duration, aspect ratio, resolution from meta_data
        if (generation.meta_data) {
          const metaData =
            typeof generation.meta_data === 'string'
              ? JSON.parse(generation.meta_data)
              : generation.meta_data;

          if (metaData.model) {
            setSelectedModel(metaData.model);
          }

          if (metaData.duration) {
            setDuration(Number(metaData.duration) as VideoDuration);
          }

          if (metaData.aspect_ratio) {
            setAspectRatio(metaData.aspect_ratio);
            setUserSelectedAspectRatio(true);
          }

          if (metaData.resolution) {
            setSelectedResolution(metaData.resolution as VideoResolution);
          }

          if (metaData.style_id !== undefined && metaData.style_id !== null) {
            setSelectedStyle(Number(metaData.style_id));
          }
        }

        consumeDraft(getPageKey());

        // Clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  // Sync character images with prompt mentions (unified multi-image mode)
  // When @character-id is removed from prompt, remove corresponding image
  // When @character-id is added to prompt, fetch and add character image
  useEffect(() => {
    const mentionedCharacterIds = extractCharacterIdsFromPrompt(prompt);

    // Use functional update to access the latest referenceImages
    setReferenceImages(prev => {
      const characterImages = prev.filter(img => img.isCharacter);

      // Find character images that are no longer mentioned in prompt
      const imagesToRemove = characterImages.filter(
        img =>
          img.characterId && !mentionedCharacterIds.includes(img.characterId),
      );

      if (imagesToRemove.length > 0) {
        // Remove from processed set when image is removed
        imagesToRemove.forEach(img => {
          if (img.characterId) {
            processedCharacterIdsRef.current.delete(img.characterId);
          }
        });
        return prev.filter(
          img => !imagesToRemove.some(toRemove => toRemove.id === img.id),
        );
      }

      // Find character IDs that are mentioned but don't have images yet
      const existingCharacterIds = characterImages.map(img => img.characterId);
      const missingCharacterIds = mentionedCharacterIds.filter(
        id =>
          !existingCharacterIds.includes(id) &&
          !processedCharacterIdsRef.current.has(id),
      );

      // Fetch and add missing character images
      // Only fetch if user typed @character-id manually (not from CharacterQuickSelector)
      if (missingCharacterIds.length > 0) {
        missingCharacterIds.forEach(id =>
          processedCharacterIdsRef.current.add(id),
        );

        const fetchMissingCharacters = async () => {
          try {
            const response = await fetch(
              `/api/getCharactersProfile?uniqids=${missingCharacterIds.join(',')}`,
            );
            const characters = await response.json();

            if (characters && !characters.error) {
              // Use a single state update to add all missing characters
              setReferenceImages(current => {
                const newImages = [...current];

                characters.forEach((character: any) => {
                  // 1) Skip if this character already exists
                  const existsByChar = newImages.some(
                    img => img.characterId === character.character_uniqid,
                  );
                  if (existsByChar) return;

                  const maxOCs = 7; // Fixed max for all models
                  const currentCharacterCount = newImages.filter(
                    img => img.isCharacter,
                  ).length;

                  // 2) If an image with the same URL exists, convert it to a character image
                  const existingUrlIndex = newImages.findIndex(
                    img => img.url === character.character_pfp,
                  );
                  if (existingUrlIndex !== -1) {
                    const willIncrease =
                      !newImages[existingUrlIndex].isCharacter;
                    if (willIncrease && currentCharacterCount >= maxOCs) {
                      toast.error(
                        t('ui.input.maxOCsReached', {
                          max: maxOCs,
                          position: 'top-center',
                        }),
                      );
                      return;
                    }
                    newImages[existingUrlIndex] = {
                      ...newImages[existingUrlIndex],
                      name: character.character_name,
                      characterId: character.character_uniqid,
                      isCharacter: true,
                    } as any;
                    return;
                  }

                  // 3) Otherwise, add a new character image (respect max limit)
                  if (currentCharacterCount >= maxOCs) {
                    toast.error(
                      t('ui.input.maxOCsReached', {
                        max: maxOCs,
                        position: 'top-center',
                      }),
                    );
                    return;
                  }

                  newImages.push({
                    id: `char-${character.character_uniqid}-${Date.now()}`,
                    url: character.character_pfp,
                    name: character.character_name,
                    characterId: character.character_uniqid,
                    isCharacter: true,
                  });
                });

                return newImages;
              });
            }
          } catch (error) {
            console.error('Failed to fetch character data:', error);
            // Remove from processed set if fetch failed
            missingCharacterIds.forEach(id =>
              processedCharacterIdsRef.current.delete(id),
            );
          }
        };

        fetchMissingCharacters();
      }

      return prev; // No immediate changes
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, t]); // extractCharacterIdsFromPrompt is a pure function, no need to include in deps

  useEffect(() => {
    if (resultVideos.length > 0) {
      lastVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultVideos]);

  const handleDeleteClick = (videoId: number) => {
    handleVideoDeleteClick(
      videoId,
      setResultVideos,
      setVideoToDelete,
      setDeleteModalOpen,
    );
  };

  const handleConfirmDelete = async () => {
    await handleVideoConfirmDelete(
      videoToDelete,
      ['image_animation'],
      t,
      setResultVideos,
      setVideoToDelete,
      setDeleteModalOpen,
    );
  };

  const handleImageChange = async (url: string) => {
    setUserSelectedAspectRatio(false);

    // Check minimum dimensions (240x240) - only for WAN model
    const isValid = await validateImageForWan(url);
    if (!isValid) {
      toast.error(t('ui.toasts.imageTooSmall'));
      return;
    }

    // Check for transparency and add white background if needed
    // This applies to both Supabase URLs and other URLs
    const hasTrans = await hasTransparency(url);
    if (hasTrans) {
      const base64 = await redrawImageToBase64(url);
      setInputImage(base64);
    } else if (url.includes('supabase.co')) {
      setInputImage(url);
    } else {
      const base64 = await redrawImageToBase64(url);
      setInputImage(base64);
    }
  };

  // Escape special regex characters
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle image deletion with sync to prompt
  const handleDeleteReferenceImage = (imageId: string) => {
    const imageToDelete = referenceImages.find(img => img.id === imageId);
    if (imageToDelete?.isCharacter && imageToDelete.characterId) {
      const mention = `@${imageToDelete.characterId}`;
      // Remove mention and clean up extra spaces - escape special regex chars
      const escapedMention = escapeRegExp(mention);
      const newPrompt = prompt
        .replace(new RegExp(`\\s*${escapedMention}\\s*`, 'g'), ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setPrompt(newPrompt);
    }
    setReferenceImages(prev => prev.filter(img => img.id !== imageId));
  };

  const generateMagicPrompt = async () => {
    const newPrompt = `Current user input prompt for video generation: "${prompt}"
Describe the visual scene in more details, optimize and slightly expand the prompt in one or two natural language sentences, use the same language as the user prompt. Directly output the optimized prompt without anything else, use the same language as in the user input.`;

    try {
      setMagicPromptLoading(true);
      const { generateText } = await import('../InfCanva/utils');
      const text = await generateText(newPrompt, 'gpt-4o', t);
      if (text) {
        setPrompt(text.replace(/["']/g, ''));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMagicPromptLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (profile.credit < cost) {
      openModal('pricing');
      return;
    }

    // Validate prompt length
    if (
      imageConfig.maxPromptLength &&
      prompt.length > imageConfig.maxPromptLength
    ) {
      toast.error(
        t(
          'toast:error.promptTooLong',
          `Prompt is too long (${prompt.length}/${imageConfig.maxPromptLength} characters)`,
        ),
      );
      return;
    }

    // Validate based on model requirements
    if (imageConfig.inputMode === 'image-only') {
      // Image-to-video models: image is required, prompt is optional
      const hasImage =
        inputImage || referenceImages.length > 0 || endFrameImage;
      if (!hasImage) {
        toast.error(
          t(
            'toast:imageToVideo.noImageSelected',
            'Please select an image first',
          ),
          {
            position: 'top-center',
            style: {
              background: 'hsl(var(--muted-foreground))',
              color: 'hsl(var(--background))',
            },
          },
        );
        return;
      }
    } else {
      // Text-to-video or hybrid models: prompt is required
      if (!prompt) {
        toast.error(t('toast:error.promptRequired', 'Please enter a prompt'), {
          position: 'top-center',
          style: {
            background: 'hsl(var(--muted-foreground))',
            color: 'hsl(var(--background))',
          },
        });
        return;
      }
    }

    if (isWanModel && selectedAudio) {
      if (audioDuration < 3 || audioDuration > 30) {
        toast.error(
          t(
            'image-animation-generator:ui.audio.durationRange',
            'Audio duration must be between 3s and 30s',
          ),
        );
        return;
      }
    }

    setLoading(true);

    // CRITICAL: Ensure all character images are loaded before submitting
    const loadSuccess = await ensureCharacterImagesLoaded(
      prompt,
      referenceImages,
      setReferenceImages,
      processedCharacterIdsRef,
      t,
    );

    if (!loadSuccess) {
      setLoading(false);
      return;
    }

    try {
      let currentImageUrl = '';
      let endFrameUrl = '';
      let multiImageUrls: string[] = [];
      let should_delete_media = false;

      // Handle image upload (unified multi-image mode)
      if (referenceImages.length > 0) {
        const regularImages = referenceImages.filter(img => !img.isCharacter);

        // If model supports multiple reference images AND we have 2+ images
        if (
          imageConfig.supportsMultipleReferenceImages &&
          (referenceImages.length >= 2 || endFrameImage)
        ) {
          try {
            // Separate character and regular images
            const ocImages = referenceImages.filter(img => img.isCharacter);
            const regularImages = referenceImages.filter(
              img => !img.isCharacter,
            );
            const allImages = [...regularImages, ...ocImages];

            // Check if this model requires image stitching
            const requiresStitching =
              imageConfig.requiresImageStitching ?? true;

            if (requiresStitching) {
              // Models that need stitching (Sora, Sora Pro, Veo3, Wan, Wan Pro)
              // Browser-side stitching for 2-3 images
              if (
                referenceImages.length >= 2 &&
                referenceImages.length <= 3 &&
                !endFrameImage
              ) {
                const imageUrls = allImages.map(img => img.url);
                const imageNames = allImages.map(img => img.name);

                // Stitch images in browser
                const blob = await stitchImagesInBrowser({
                  imageUrls,
                  imageNames,
                  aspectRatio,
                });

                // Upload stitched image directly to FAL
                const falUrl = await uploadImageToFal(
                  blob,
                  (profile as any)?.id,
                );

                if (!falUrl) {
                  throw new Error('Failed to upload stitched image');
                }

                // Use single stitched image
                currentImageUrl = falUrl;
                should_delete_media = false;
              } else {
                // Fallback: Upload images individually (for end frame mode or >3 images)

                for (const img of allImages) {
                  const falUrl = await uploadImageToFal(
                    img.url,
                    (profile as any)?.id,
                  );
                  if (!falUrl) {
                    throw new Error('Failed to upload image');
                  }
                  multiImageUrls.push(falUrl);
                }

                should_delete_media = false;

                // Handle end frame upload if needed
                if (endFrameImage) {
                  if (endFrameImage.includes('supabase.co')) {
                    endFrameUrl = endFrameImage;
                  } else {
                    try {
                      endFrameUrl = await uploadImage(endFrameImage);
                      if (!endFrameUrl) {
                        throw new Error('Failed to upload end frame image');
                      }
                    } catch (error) {
                      console.error('Failed to upload end frame image:', error);
                      toast.error(t('toast:error.uploadEndFrameFailed'));
                      setLoading(false);
                      return;
                    }
                  }
                }
              }
            } else {
              // Models with native multi-image support (Vidu Q1 Multi)
              // Upload images individually without stitching
              for (const img of allImages) {
                const falUrl = await uploadImageToFal(
                  img.url,
                  (profile as any)?.id,
                );
                if (!falUrl) {
                  throw new Error('Failed to upload image');
                }
                multiImageUrls.push(falUrl);
              }

              should_delete_media = false;

              // Handle end frame upload if needed
              if (endFrameImage) {
                if (endFrameImage.includes('supabase.co')) {
                  endFrameUrl = endFrameImage;
                } else {
                  try {
                    endFrameUrl = await uploadImage(endFrameImage);
                    if (!endFrameUrl) {
                      throw new Error('Failed to upload end frame image');
                    }
                  } catch (error) {
                    console.error('Failed to upload end frame image:', error);
                    toast.error(t('toast:error.uploadEndFrameFailed'));
                    setLoading(false);
                    return;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Multi-image upload failed:', error);
            toast.error(
              t('toast:error.imageStitchingFailed', 'Failed to process images'),
            );
            setLoading(false);
            return;
          }
        } else {
          // Single-image mode: use only the first image
          const firstImage = regularImages[0] || referenceImages[0];
          if (firstImage) {
            const size = await getImageSize(firstImage.url);
            setImageSize(size);

            const compressedImageUrl = await compressImage(
              firstImage.url,
              1024,
              1024,
              0.85,
            );

            currentImageUrl = await uploadImage(compressedImageUrl);
            should_delete_media = false;

            if (!currentImageUrl) {
              toast.error(t('toast:error.uploadImageFailed'), {
                position: 'top-center',
                style: {
                  background: 'hsl(var(--muted-foreground))',
                  color: 'hsl(var(--background))',
                },
              });
              setLoading(false);
              return;
            }

            // Handle end frame if supported and provided
            if (endFrameImage) {
              try {
                const compressedEndFrame = await compressImage(
                  endFrameImage,
                  1024,
                  1024,
                  0.85,
                );
                endFrameUrl = await uploadImage(compressedEndFrame);
                if (!endFrameUrl) {
                  throw new Error('Failed to upload end frame image');
                }
              } catch (error) {
                console.error('Failed to upload end frame image:', error);
                toast.error(t('toast:error.uploadImageFailed'), {
                  position: 'top-center',
                  style: {
                    background: 'hsl(var(--muted-foreground))',
                    color: 'hsl(var(--background))',
                  },
                });
                setLoading(false);
                return;
              }
            }
          }
        }
      }
      // Legacy: Handle old inputImage state (should be migrated to referenceImages)
      else if (inputImage) {
        const size = await getImageSize(inputImage);
        setImageSize(size);

        // Compress and upload image
        const compressedImageUrl = await compressImage(
          inputImage,
          1024,
          1024,
          0.85,
        );
        currentImageUrl = await uploadImage(compressedImageUrl);
        should_delete_media = true;

        if (!currentImageUrl) {
          toast.error(t('toast:error.uploadImageFailed'), {
            position: 'top-center',
            style: {
              background: 'hsl(var(--muted-foreground))',
              color: 'hsl(var(--background))',
            },
          });
          setLoading(false);
          return;
        }

        // Handle end frame if supported and provided
        if (endFrameImage) {
          try {
            const compressedEndFrame = await compressImage(
              endFrameImage,
              1024,
              1024,
              0.85,
            );
            endFrameUrl = await uploadImage(compressedEndFrame);
            if (!endFrameUrl) {
              throw new Error('Failed to upload end frame image');
            }
          } catch (error) {
            console.error('Failed to upload end frame image:', error);
            toast.error(t('toast:error.uploadEndFrameFailed'));
            setLoading(false);
            return;
          }
        }
      }

      // Extract OC images (character images) from referenceImages
      const ocImages = referenceImages.filter(img => img.isCharacter);

      // Check if prompt mentions any characters (even if images not loaded yet)
      const mentionedCharacterIds = extractCharacterIdsFromPrompt(prompt);
      const hasCharacterMention = mentionedCharacterIds.length > 0;

      // Check if we have any images (regular images, character images, current image, or character mentions)
      // If character is mentioned in prompt, backend will fetch images from database
      const hasImage = !!(
        multiImageUrls.length > 0 ||
        currentImageUrl ||
        ocImages.length > 0 ||
        hasCharacterMention
      );

      const targetModel = convertModel(
        effectiveModel,
        hasImage,
        multiImageUrls.length ||
          ocImages.length ||
          mentionedCharacterIds.length,
      );

      const params: any = {
        prompt: prompt,
        negativePrompt: undefined,
        aspect_ratio: aspectRatio,
        target_model: targetModel as any,
        model: effectiveModel,
        duration,
        resolution: selectedResolution,
        tool: 'image_animation',
        image_size: imageSize,
        // Only include style_id if text-to-video (no images)
        style_id: !hasImage ? selectedStyle : undefined,
        meta_data: {
          duration,
          resolution: selectedResolution,
          aspect_ratio: aspectRatio,
          model: effectiveModel,
          prompt: prompt,
          negativePrompt: undefined,
          // Only include style_id if text-to-video (no images)
          style_id: !hasImage ? selectedStyle : undefined,
        },
        no_translate:
          effectiveModel === ImageToVideoModel.SORA ||
          effectiveModel === ImageToVideoModel.SORA_PRO ||
          effectiveModel === ImageToVideoModel.SORA_STABLE ||
          effectiveModel === ImageToVideoModel.SORA_PRO_STABLE ||
          effectiveModel === ImageToVideoModel.VEO ||
          effectiveModel === ImageToVideoModel.VIDU,
      };

      // Add multi_shots for models that support it
      if (config.otherParams?.supportMulitShots) {
        params.multi_shots = multiShots;
      }

      // Add camera_fixed for models that support it (Seedance)
      if (config.otherParams?.supportCameraFixed) {
        params.camera_fixed = cameraFixed;
      }

      // Add character images to params (always include if we have character images)
      // Backend will use these for models that support native multi-reference (e.g., Vidu Q1 Multi)
      if (ocImages.length > 0) {
        params.characterImages = ocImages.map(img => img.url);
      }

      // Add multi-images if provided (already uploaded to fal.ai)
      if (multiImageUrls.length > 0) {
        // Use FAL-hosted URLs for reference images
        params.images = multiImageUrls;
        params.should_delete_media = should_delete_media;

        // Add end frame if provided (for first frame + last frame mode)
        if (endFrameUrl) {
          params.end_frame = endFrameUrl;
        }

        // Add image names for stitching/labeling (includes all images: regular and character images)
        if (!endFrameImage) {
          const imageNames = referenceImages
            .map(img => img.name)
            .filter(name => name && name.trim() !== ''); // Only filter out empty names
          if (imageNames.length > 0) {
            params.imageNames = imageNames;
          }
        }
      }
      // Add single image if provided (for stitched image or single-image mode)
      else if (currentImageUrl) {
        params.image = currentImageUrl;
        params.should_delete_media = should_delete_media;

        // Add end frame if provided (for first frame + last frame mode)
        if (endFrameUrl) {
          params.end_frame = endFrameUrl;
        }

        // Add image names for stitching prompt generation (for stitched images)
        if (referenceImages.length >= 2) {
          const imageNames = referenceImages
            .map(img => img.name)
            .filter(name => name && name.trim() !== '');
          if (imageNames.length > 0) {
            params.imageNames = imageNames;
          }
        }
      }

      // Handle audio upload if provided
      if (isWanModel && selectedAudio) {
        try {
          const audioUrl = await uploadAudio(selectedAudio);
          if (!audioUrl) {
            toast.error(
              t(
                'image-animation-generator:ui.audio.uploadFailed',
                'Failed to upload audio file',
              ),
            );
            setLoading(false);
            return;
          }
          params.audio = audioUrl;
        } catch (e) {
          toast.error(
            t(
              'image-animation-generator:ui.audio.processFailed',
              'Failed to process audio file',
            ),
          );
          setLoading(false);
          return;
        }
      }

      const taskId = await submitTask(params).catch(error => {
        console.error('Failed to submit task:', error);
        toast.error(t('toast:error.videoGenerationFailed'));
        return undefined;
      });
      if (isNil(taskId)) {
        setLoading(false);
        return;
      }

      addTaskId(taskId);

      // 记录 style 使用统计
      // 只在 style selector 显示时才记录（即 text-to-video 模式）
      const isTextToVideoMode =
        !inputImage && referenceImages.length === 0 && !endFrameImage;
      if (isTextToVideoMode && selectedStyle) {
        recordStyleUsage('ai-animation-generator', String(selectedStyle)).catch(
          err => {
            console.error('Failed to record style usage:', err);
          },
        );
      }

      const newVideo = {
        id: taskId,
        video_url: '',
        prompt: prompt,
        status: GenerationStatus.GENERATING,
        created_at: new Date().toISOString(),
      };

      const updatedVideos = [
        newVideo,
        ...resultVideos.filter(video => video.id !== 1),
      ];

      // Sort: generating tasks first, then by created_at descending, example video last
      updatedVideos.sort((a, b) => {
        if (a.id === -1) return 1;
        if (b.id === -1) return -1;
        if (
          a.status === GenerationStatus.GENERATING &&
          b.status !== GenerationStatus.GENERATING
        )
          return -1;
        if (
          b.status === GenerationStatus.GENERATING &&
          a.status !== GenerationStatus.GENERATING
        )
          return 1;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setResultVideos(updatedVideos);
      setLoading(false);
    } catch (error) {
      toast.error(t('toast:imageToVideo.generateFailed'), {
        position: 'top-center',
        style: {
          background: 'hsl(var(--muted-foreground))',
          color: 'hsl(var(--background))',
        },
      });
    } finally {
      setLoading(false);
      consumeDraft(getPageKey());
    }
  };

  return (
    <div className='grid grid-cols-12 gap-6 mt-4 mb-14 md:mb-16 md:grid-rows-[minmax(0,auto)]'>
      {/* Left input area */}
      <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-5 md:row-span-1'>
        <Card className={`p-4 md:px-6 md:pt-4 md:pb-6 transition-all duration-300 ${TOOL_CARD_STYLES.inputCard} h-full`}>
          <div className='mb-1 w-full overflow-hidden overflow-x-auto'>
            <VideoToolsTabs activeTab='image-animation' />
          </div>

          {/* Prompt input with image upload inside */}
          <div className='mb-4'>
            <div className='relative border border-border rounded-lg bg-card overflow-visible mt-2'>
              {/* Image upload area */}
              <ImageUploadArea
                supportsMultipleImages={
                  imageConfig.supportsMultipleReferenceImages || false
                }
                requiresImage={imageConfig.inputMode === 'image-only'}
                inputImage={inputImage}
                referenceImages={referenceImages}
                endFrameImage={endFrameImage}
                supportsEndFrame={imageConfig.supportsEndFrame || false}
                selectedModel={selectedModel}
                onImageChange={handleImageChange}
                onInputImageRemove={() => {
                  setInputImage('');
                  setImageSize({ width: 600, height: 600 });
                }}
                onReferenceImagesAdd={async files => {
                  setUserSelectedAspectRatio(false);

                  // Validate and filter images by minimum dimensions (only for WAN)
                  const validatedImages = await Promise.all(
                    files.map(async (file, i) => {
                      const url = URL.createObjectURL(file);

                      // Check minimum dimensions using helper
                      const isValid = await validateImageForWan(url);
                      if (!isValid) {
                        URL.revokeObjectURL(url);
                        return null;
                      }

                      const fileName = file.name;
                      const nameWithoutExt =
                        fileName.substring(0, fileName.lastIndexOf('.')) ||
                        fileName;
                      return {
                        id: `${Date.now()}-${Math.random()}-${i}`,
                        url,
                        name: nameWithoutExt,
                        file,
                      };
                    }),
                  );

                  const additions = validatedImages.filter(
                    (img): img is NonNullable<typeof img> => img !== null,
                  );
                  const rejectedCount = files.length - additions.length;

                  if (rejectedCount > 0) {
                    toast.error(t('ui.toasts.imageTooSmall'));
                  }

                  if (additions.length > 0) {
                    setReferenceImages(prev => [...prev, ...additions]);
                  }
                }}
                onReferenceImageRemove={handleDeleteReferenceImage}
                onReferenceImageRename={(id, name) => {
                  setReferenceImages(prev =>
                    prev.map(item =>
                      item.id === id ? { ...item, name } : item,
                    ),
                  );
                }}
                onEndFrameChange={setEndFrameImage}
                onEndFrameRemove={() => setEndFrameImage('')}
                t={t}
              />

              {/* Textarea */}
              <PromptTextarea
                maxLength={imageConfig.maxPromptLength}
                value={prompt}
                onChange={val => {
                  handlePromptChange(val);
                  debouncedSaveDraft(getPageKey(), val);
                }}
                onKeyDown={e => {
                  if (
                    showMentionDropdown &&
                    (e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'Enter')
                  ) {
                    e.preventDefault();
                  }
                  if (e.key === 'Escape') {
                    setShowMentionDropdown(false);
                  }
                }}
                placeholder={
                  imageConfig.inputMode === 'image-only'
                    ? t('common:describe_video_effect')
                    : t('common:mention_characters')
                }
                textareaRef={textareaRef}
                magicPromptLoading={magicPromptLoading}
                onMagicPrompt={generateMagicPrompt}
                t={t}
              />

              {/* Mention dropdown */}
              <MentionDropdown
                show={showMentionDropdown}
                position={dropdownPosition}
                loading={loadingCharacters}
                characters={filteredCharacters}
                dropdownRef={mentionDropdownRef}
                onSelect={handleSelectCharacterFromDropdown}
                onClose={() => setShowMentionDropdown(false)}
              />
            </div>

            {/* Quick character selection area */}
            <CharacterQuickSelector
              characters={availableCharacters}
              isCharacterMentioned={isCharacterMentioned}
              onCharacterClick={handleToggleCharacterMention}
              onAddNewClick={() => router.push('/oc-maker')}
              t={t}
            />
          </div>

          {/* Model selection*/}
          <ModelSelector
            selectedModel={selectedModel}
            modelOptions={modelOptions}
            onModelChange={setSelectedModel}
            t={t}
            className='mb-4'
            duration={duration}
          />

          {/* Style selection - only show when no image is uploaded (text-to-video mode) */}
          {!inputImage && referenceImages.length === 0 && !endFrameImage && (
            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
              className='mb-4'
            />
          )}

          {/* Duration and Aspect Ratio selection */}
          {(shouldShowDuration || shouldShowAspectRatio) && (
            <div className='mb-6'>
              <div className='flex gap-4'>
                {shouldShowDuration && (
                  <div className='flex-1'>
                    <DurationSelector
                      value={String(duration)}
                      options={durationOptions}
                      onChange={value =>
                        setDuration(Number(value) as VideoDuration)
                      }
                      placeholder={t('ui.input.duration.label')}
                      className='w-full'
                    />
                  </div>
                )}

                {shouldShowAspectRatio && (
                  <div className='flex-1'>
                    <AspectRatioSelector
                      value={aspectRatio}
                      options={aspectRatioOptions}
                      onChange={value => {
                        setAspectRatio(value);
                        setUserSelectedAspectRatio(true);
                      }}
                      placeholder={t('ui.input.ratio')}
                      className='w-full'
                    />
                  </div>
                )}
              </div>

              {/* Multi-shots toggle - only for models that support it */}
              {config.otherParams?.supportMulitShots && (
                <div className='flex items-center justify-between mt-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-foreground'>
                      {t('ui.multiShots.label')}
                    </span>
                    <Tooltip
                      content={t('ui.multiShots.tooltip')}
                      placement='top'>
                      <span className='text-muted-foreground cursor-help text-xs'>
                        ⓘ
                      </span>
                    </Tooltip>
                  </div>
                  <Switch
                    size='sm'
                    isSelected={multiShots}
                    onValueChange={setMultiShots}
                  />
                </div>
              )}

              {/* Camera Fixed toggle - only for models that support it (Seedance) */}
              {config.otherParams?.supportCameraFixed && (
                <div className='flex items-center justify-between mt-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-foreground'>
                      {t('ui.cameraFixed.label')}
                    </span>
                    <Tooltip
                      content={t('ui.cameraFixed.tooltip')}
                      placement='top'>
                      <span className='text-muted-foreground cursor-help text-xs'>
                        ⓘ
                      </span>
                    </Tooltip>
                  </div>
                  <Switch
                    size='sm'
                    isSelected={cameraFixed}
                    onValueChange={setCameraFixed}
                  />
                </div>
              )}
            </div>
          )}

          {/* Resolution selection for specific models */}
          {config.showResolution && (
            <div className='mb-6'>
              <label className='block mb-2 font-medium text-foreground'>
                {t('ui.input.resolution.label')}
              </label>
              <ResolutionSelector
                value={selectedResolution}
                options={(config.resolutionOptions || []).map(res => ({
                  key: res,
                  label: res,
                }))}
                onChange={value =>
                  setSelectedResolution(value as VideoResolution)
                }
                placeholder={t('ui.input.resolution.placeholder')}
                className='w-full'
              />
            </div>
          )}

          {/* Audio Input */}
          {config.supportsAudioInput && (
            <AudioInput
              value={selectedAudio}
              onChange={handleAudioChange}
              label={t(
                'image-animation-generator:ui.audio.label',
                'Audio (Optional - MP3/WAV, 3-30s, ≤15MB)',
              )}
              accept='.mp3,.wav'
              maxDuration={30}
              maxSizeMB={MAX_AUDIO_SIZE_MB}
              t={key => t(`image-animation-generator:ui.audio.${key}`, key)}
              className='mb-6'
            />
          )}

          {/* Public Visibility */}
          <div className='mb-2'>
            <PublicVisibilityToggle
              isPublic={isPublic}
              onToggle={setIsPublic}
              label={t('common:publicVisibility.label')}
              tooltip={t('common:publicVisibility.tooltip')}
              variant='section'
            />
          </div>

          {/* Submit button */}
          <Button
            isLoading={loading}
            color='primary'
            className='w-full transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
            size='lg'
            onPress={() => {
              if (!isAuth) {
                loginModal?.onOpen?.();
              } else {
                handleSubmit();
              }
            }}
            isDisabled={
              imageConfig.inputMode === 'image-only'
                ? !inputImage && referenceImages.length === 0
                : !prompt
            }>
            <span className='mr-2'>{t('ui.buttons.generateAnimation')}</span>
            {isAuth && (
              <Chip
                startContent={
                  <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                }
                variant='bordered'
                color={'primary'}
                size='sm'
                className='bg-card'
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
        <Card className={`p-4 md:pb-6 md:px-6 md:pt-4 h-full ${TOOL_CARD_STYLES.outputCard} md:flex md:flex-col md:overflow-hidden`}>
          <h2 className='flex items-center mb-4 text-base font-bold text-foreground'>
            <FaDownload className='mr-2 text-primary-600' />{' '}
            {t('ui.output.title')}
          </h2>
          <div className='flex overflow-hidden flex-col flex-1 w-full'>
            <div className='overflow-y-auto flex-1 rounded-lg md:min-h-0'>
              {resultVideos?.length > 0 ? (
                <div className='grid grid-cols-1 gap-2'>
                  {resultVideos.map((video, index) => (
                    <ResultCard
                      showPrompt
                      key={video.id}
                      data={video}
                      handleDownload={() =>
                        handleVideoDownload(video.video_url, t)
                      }
                      handleDelete={handleDeleteClick}
                      index={index}
                      videoRefs={videoRefs}
                      type='video'
                      totalCount={resultVideos.length}
                      isExample={video.id === -1}
                      tool='image-animation'
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        classNames={TOOL_CARD_STYLES.modalClassNames}>
        <ModalContent>
          <ModalHeader className='text-foreground'>
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

      {/* Enlarged Image Modal */}
      <Modal
        size='3xl'
        isOpen={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
        }}>
        <ModalContent>
          <ModalBody className='p-4'>
            <img
              src={enlargedImage || ''}
              alt='Enlarged view'
              className='max-w-full max-h-[80vh] object-contain mx-auto'
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default memo(ImageOrTextToVideoConvert);
