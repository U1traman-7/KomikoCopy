/* eslint-disable */
import { Button, Progress, Tooltip, ButtonGroup } from '@nextui-org/react';
import { ImageData, VideoData, GenerationStatus } from './utils';
import { FaDownload, FaTrash } from 'react-icons/fa6';
import {
  MdAnimation,
  MdVideoLibrary,
  MdTextFields,
  MdPersonAddAlt,
} from 'react-icons/md';
import { TbPhotoEdit } from 'react-icons/tb';
import { BsShareFill } from 'react-icons/bs';
import { RiScissorsCutFill } from 'react-icons/ri';
import { HiOutlineArrowsExpand } from 'react-icons/hi';
import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, uploadVideo } from 'api/upload';
import { toast } from 'react-hot-toast';
import {
  IconUserSquare,
  IconCopy,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import cn from 'classnames';
import { useVideoPreload } from '@/hooks/useVideoPreload';
import { useSingleVideoPlayback } from '@/hooks/useSingleVideoPlayback';

import {
  getI2iStyleNameKeyMappingSync,
  getEffectNameKeyMappingSync,
} from '../StyleTemplatePicker/styles/index';
import {
  expressionNameKeyMapping,
  danceNameKeyMapping,
} from '../StyleTemplatePicker/StyleGirds/styles';
import { resolveTemplateName } from '../../utils/resolveTemplateName';

const uploadMediaToCloud = async (
  mediaUrl: string,
  type: 'video' | 'image' | 'character' | 'text',
): Promise<string> => {
  // Check if mediaUrl is valid
  if (!mediaUrl || mediaUrl.trim() === '') {
    throw new Error('Invalid media URL');
  }

  // If already a cloud URL, return as-is
  const isCloudUrl =
    mediaUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL!) ||
    mediaUrl.includes('hedra-api-video');

  if (isCloudUrl) {
    return mediaUrl;
  }

  // Convert URL to Blob
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch media URL');
  }
  const blob = await response.blob();

  // Determine file extension and content type
  const isVideo = type === 'video';
  const extension = isVideo ? 'mp4' : 'png';
  const contentType = isVideo ? 'video/mp4' : 'image/png';
  const file = new File([blob], `${uuidv4()}.${extension}`, {
    type: contentType,
  });

  // Upload to cloud storage
  const form = new FormData();
  if (isVideo) {
    form.append('file', file);
    form.append('path', `app_media/${file.name}`);
    const result = await uploadVideo(form);
    if (!result || result.error) {
      throw new Error(`Upload failed: ${result.error}`);
    }
    return result.data;
  } else {
    form.append('file', file);
    form.append('imagePath', `app_media/${file.name}`);
    const result = await uploadImage(form);
    if (!result || result.error) {
      throw new Error(`Upload failed: ${result.error}`);
    }
    return result.data;
  }
};

export interface ResultCardProps {
  type: 'video' | 'image' | 'character' | 'text';
  data: VideoData | ImageData;
  handleDownload: (url: string) => Promise<void>;
  handleDelete: (id: number) => void;
  videoRefs?: React.MutableRefObject<any>;
  handleLoadedMetadata?: (index: number) => void;
  style?: React.CSSProperties;
  showPrompt?: boolean;
  index: number;
  maxGenerationMinutes?: number; // 最大生成时长（分钟），默认为3分钟
  externalProgress?: number; // 外部传入的真实进度值（0-100）
  toolButtons?: React.ReactNode;
  // 仅当视频数量为1且是示例视频时允许自动播放
  totalCount?: number;
  isExample?: boolean;
  tool?: string; // 工具类型，用于 prompt 样式显示
}

type MediaData = VideoData | ImageData;

// Utility functions to reduce code duplication
const getMediaUrl = (
  data: MediaData,
  type: 'video' | 'image' | 'character' | 'text',
): string => {
  if (type === 'image' || type === 'character' || type === 'text') {
    return (data as ImageData).url_path || '';
  }
  if (type === 'video') {
    return (data as VideoData).video_url || '';
  }
  return '';
};

// Unified function to create URL parameters for publishing and tool redirection
export const createQueryParams = (
  mediaUrl: string,
  type: 'video' | 'image' | 'character' | 'text' | 'ai-anime-generator',
  prompt = '',
  sourcePage = 'tool',
  generationId = '',
  templateTag = '',
  characterTag = '',
) => {
  const queryParams = new URLSearchParams();

  // 先添加其他参数
  queryParams.append('mediaType', type === 'character' ? 'image' : type);
  queryParams.append('source', sourcePage);

  // mediaUrl 放在最后
  queryParams.append('mediaUrl', mediaUrl);
  queryParams.append('generationId', generationId);

  // prompt
  if (prompt) {
    queryParams.append('prompt', prompt);
  }

  // template tag for posts
  if (templateTag) {
    queryParams.append('templateTag', templateTag);
  }

  // character tag for posts (format: #@character-id)
  if (characterTag) {
    queryParams.append('characterTag', characterTag);
  }

  return queryParams;
};

// Tool button options based on media type
export type ToolOption = {
  path: string;
  icon: JSX.Element;
  labelKey: string;
  special?: boolean;
};
const getToolOptions = (
  type: 'video' | 'image' | 'character' | 'text' | 'ai-anime-generator',
): ToolOption[] => {
  if (type === 'character') {
    return [
      {
        path: '/filter/ai-character-sheet-generator',
        icon: <IconUserSquare />,
        labelKey: 'result_card.tools.character_sheet',
      },
      {
        path: '/playground',
        icon: <TbPhotoEdit />,
        labelKey: 'result_card.tools.anime_style',
      },
      {
        path: '/image-animation-generator',
        icon: <MdAnimation />,
        labelKey: 'result_card.tools.animate',
      },
    ];
  } else if (type === 'image') {
    return [
      {
        path: '/background-removal',
        icon: <RiScissorsCutFill />,
        labelKey: 'result_card.tools.remove_bg',
      },
      {
        path: '/image-upscaling',
        icon: <HiOutlineArrowsExpand />,
        labelKey: 'result_card.tools.upscale',
      },
      {
        path: '/image-animation-generator',
        icon: <MdAnimation />,
        labelKey: 'result_card.tools.animate',
      },
      {
        path: '/playground',
        icon: <TbPhotoEdit />,
        labelKey: 'result_card.tools.anime_style',
      },
      {
        path: '/create',
        icon: <MdTextFields />,
        labelKey: 'result_card.tools.add_text',
      },
    ];
  } else if (type === 'text') {
    return [] as Array<{ path: string; icon: JSX.Element; labelKey: string }>;
  } else if (type === 'ai-anime-generator') {
    return [
      {
        path: '/image-animation-generator',
        icon: <MdAnimation />,
        labelKey: 'result_card.tools.create_animation',
        special: true,
      },
      {
        path: '/playground',
        icon: <TbPhotoEdit />,
        labelKey: 'result_card.tools.anime_style',
      },
      {
        path: '/background-removal',
        icon: <RiScissorsCutFill />,
        labelKey: 'result_card.tools.remove_bg',
      },
      {
        path: '/image-upscaling',
        icon: <HiOutlineArrowsExpand />,
        labelKey: 'result_card.tools.upscale',
      },
      {
        path: '/create',
        icon: <MdTextFields />,
        labelKey: 'result_card.tools.add_text',
      },
      {
        path: '/character/edit',
        icon: <MdPersonAddAlt />,
        labelKey: 'result_card.tools.new_character',
      },
    ];
  } else {
    return [
      {
        path: '/video_upscaling',
        icon: <HiOutlineArrowsExpand />,
        labelKey: 'result_card.tools.video_upscale',
      },
      {
        path: '/video_interpolation',
        icon: <MdAnimation />,
        labelKey: 'result_card.tools.video_interpolate',
      },
      {
        path: '/video-to-video',
        icon: <MdVideoLibrary />,
        labelKey: 'result_card.tools.restyle',
      },
    ];
  }
};

export interface ToolsButtonGroupProps {
  type: 'video' | 'image' | 'character' | 'text' | 'ai-anime-generator';
  mediaUrl: string;
  prompt?: string;
  showPublish?: boolean;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

export const ToolsButtonGroup = memo(
  ({
    type,
    mediaUrl,
    prompt = '',
    showPublish = true,
    className = '',
    buttonSize = 'sm',
    responsive = false,
  }: ToolsButtonGroupProps) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toast');
    const currentPath = router.pathname;
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

    const handleToolRedirect = async (path: string) => {
      if (path === currentPath) return;

      try {
        setIsLoading({ ...isLoading, [path]: true });
        const normalizedType: 'video' | 'image' | 'character' | 'text' =
          type === 'ai-anime-generator' ? 'image' : type;
        const cloudUrl = await uploadMediaToCloud(mediaUrl, normalizedType);

        // Navigate with the cloud URL
        const pathSegments = currentPath.split('/');
        const sourcePage =
          pathSegments[pathSegments.length - 1] ||
          pathSegments[pathSegments.length - 2] ||
          'tool';

        const queryParams = createQueryParams(
          cloudUrl,
          normalizedType,
          prompt || '',
          sourcePage,
        );
        router.push(`${path}?${queryParams.toString()}`);
      } catch (error) {
        console.error('Failed to process media:', error);
        toast.error(tToast('error.imageProcessingFailed'));
      } finally {
        setIsLoading({ ...isLoading, [path]: false });
      }
    };

    // 发布功能
    const handlePublish = async () => {
      try {
        setIsLoading({ ...isLoading, publish: true });
        const normalizedType: 'video' | 'image' | 'character' | 'text' =
          type === 'ai-anime-generator' ? 'image' : type;
        const cloudUrl = await uploadMediaToCloud(mediaUrl, normalizedType);

        const pathSegments = currentPath.split('/');
        const sourcePage =
          pathSegments[pathSegments.length - 1] ||
          pathSegments[pathSegments.length - 2] ||
          'tool';

        const queryParams = createQueryParams(
          cloudUrl,
          normalizedType,
          prompt || '',
          sourcePage,
        );
        router.push(`/publish?${queryParams.toString()}`);
      } catch (error) {
        console.error('Failed to process image:', error);
        toast.error(tToast('error.imageProcessingFailed'));
      } finally {
        setIsLoading({ ...isLoading, publish: false });
      }
    };

    const allToolOptions = getToolOptions(type);
    const toolOptions = allToolOptions.filter(
      tool =>
        tool.path !== currentPath &&
        (type === 'ai-anime-generator' ? !tool.special : true),
    );

    const specialButtons = allToolOptions.filter(tool => tool.special);

    // 分组逻辑：每组最多3个
    const groupSize = 3;
    const toolGroups: ToolOption[][] = [];
    for (let i = 0; i < toolOptions.length; i += groupSize) {
      toolGroups.push(toolOptions.slice(i, i + groupSize));
    }

    const buttonClass = responsive ? 'font-medium text-xs' : 'mb-1 font-medium';

    return (
      <>
        {specialButtons.length > 0 && (
          <div className={`${className} mb-1 flex gap-1`}>
            {specialButtons.map((tool, idx) => (
              <Button
                key={idx}
                size={buttonSize}
                variant='solid'
                color='primary'
                aria-label={t(tool.labelKey)}
                startContent={tool.icon}
                isIconOnly={responsive}
                onClick={() => handleToolRedirect(tool.path)}
                className={`font-semibold bg-gradient-to-r from-primary-500 to-primary-300 text-primary-foreground mb-2 md:mb-3 w-full max-w-[298px] ${buttonClass}`}
                isLoading={isLoading[tool.path]}
                isDisabled={Object.values(isLoading).some(Boolean)}>
                {!responsive && t(tool.labelKey)}
              </Button>
            ))}
          </div>
        )}
        {toolGroups.length > 1 ? (
          toolGroups.map((group: ToolOption[], groupIdx: number) => (
            <div className={`${className} mb-1 flex gap-1`} key={groupIdx}>
              {group.map((tool, idx) => (
                <Button
                  key={idx}
                  size={buttonSize}
                  variant='flat'
                  color='primary'
                  aria-label={t(tool.labelKey)}
                  startContent={tool.icon}
                  isIconOnly={responsive}
                  onClick={() => handleToolRedirect(tool.path)}
                  className={`${buttonClass} border-1.5 border-primary-200`}
                  isLoading={isLoading[tool.path]}
                  isDisabled={Object.values(isLoading).some(Boolean)}>
                  {!responsive && t(tool.labelKey)}
                </Button>
              ))}
            </div>
          ))
        ) : (
          <ButtonGroup className={`${className}`}>
            {toolOptions.map((tool, idx) => (
              <Button
                key={idx}
                size={buttonSize}
                variant='flat'
                color='primary'
                aria-label={t(tool.labelKey)}
                startContent={tool.icon}
                isIconOnly={responsive}
                onClick={() => handleToolRedirect(tool.path)}
                className={`${buttonClass} border-1.5 border-primary-200 dark:text-primary-300`}
                isLoading={isLoading[tool.path]}
                isDisabled={Object.values(isLoading).some(Boolean)}>
                {!responsive && t(tool.labelKey)}
              </Button>
            ))}
          </ButtonGroup>
        )}

        {showPublish && (
          <Button
            size='sm'
            variant='solid'
            color='primary'
            startContent={<BsShareFill className='mr-1' />}
            className='gap-2 px-6 font-medium bg-gradient-to-r from-primary-500 to-primary-600'
            onClick={handlePublish}
            isLoading={isLoading.publish}
            isDisabled={Object.values(isLoading).some(Boolean)}>
            {t('actions.post')}
          </Button>
        )}
      </>
    );
  },
);

type PromptCompProps = {
  showPrompt?: boolean;
  data: MediaData;
  tool?: string;
};

// Helper function to format style_id as a readable name when mapping lookup fails
// Converts kebab-case to Title Case (e.g., "my-dance-template" -> "My Dance Template")
const formatStyleIdAsName = (styleId: string): string => {
  if (!styleId || typeof styleId !== 'string') return '';
  return styleId
    .split('-')
    .filter(word => word.length > 0) // 过滤空字符串
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

// Prompt component extracted to avoid duplication
const PromptComp = memo(({ showPrompt, data, tool }: PromptCompProps) => {
  const { t } = useTranslation('common');
  const { t: tStyles } = useTranslation('style-templates');
  const { t: tToast } = useTranslation('toast');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  if (!showPrompt) {
    return null;
  }

  let stylePrompt;
  let displayPrompt: string | undefined;
  if (data.meta_data) {
    const metaData =
      typeof data.meta_data === 'string'
        ? JSON.parse(data.meta_data)
        : data.meta_data;

    // Use displayPrompt from meta_data if available (original user input)
    if (metaData?.displayPrompt) {
      displayPrompt = metaData.displayPrompt;
    }

    // Priority 1: Use template_i18n from DB if available (new approach)
    if (metaData?.template_i18n && metaData?.style_id) {
      stylePrompt = resolveTemplateName(
        tStyles,
        metaData.style_id,
        undefined,
        metaData.template_i18n,
      );
    }

    // Priority 2: Try translation from i18n JSON files based on style_id
    if (!stylePrompt && metaData?.style_id) {
      switch (tool) {
        case 'photo_to_anime': {
          const styleId = String(metaData.style_id);
          const isExpression =
            styleId.startsWith('expression-') || metaData.mode === 'expression';

          const translated = isExpression
            ? tStyles(
                `expressions.${expressionNameKeyMapping[metaData.style_id]}`,
              )
            : tStyles(getI2iStyleNameKeyMappingSync()[metaData.style_id]);

          // Only use if translation succeeded (doesn't look like an i18n key)
          if (translated && !translated.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
            stylePrompt = translated;
          }
          break;
        }

        case 'video-effect': {
          const effectKey = getEffectNameKeyMappingSync()[metaData.style_id];
          if (effectKey) {
            const translated = tStyles(`effects.${effectKey}`);
            // Only use if translation succeeded
            if (translated && !translated.startsWith('effects.') && !translated.startsWith('titles.')) {
              stylePrompt = translated;
            }
          }
          break;
        }

        case 'dance-video-generator': {
          const danceKey = danceNameKeyMapping[metaData.style_id];
          if (danceKey) {
            const translated = tStyles(`dances.${danceKey}`);
            // Only use if translation succeeded
            if (translated && !translated.startsWith('dances.') && !translated.startsWith('titles.')) {
              stylePrompt = translated;
            }
          }
          break;
        }

        case 'video-to-video': {
          const translated = tStyles(
            getI2iStyleNameKeyMappingSync()[metaData.style_id],
          );
          // Only use if translation succeeded
          if (translated && !translated.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
            stylePrompt = translated;
          }
          break;
        }

        case 'image_animation': {
          // For image_animation, check mode first
          if (metaData.mode === 'dance') {
            const danceKey = danceNameKeyMapping[metaData.style_id];
            if (danceKey) {
              const translated = tStyles(`dances.${danceKey}`);
              if (translated && !translated.startsWith('dances.') && !translated.startsWith('titles.')) {
                stylePrompt = translated;
              }
            }
          } else if (['effect', 'template'].includes(metaData.mode)) {
            // For effect mode, use effect mapping
            const effectKey = getEffectNameKeyMappingSync()[metaData.style_id];
            if (effectKey) {
              const translated = tStyles(`effects.${effectKey}`);
              if (translated && !translated.startsWith('effects.') && !translated.startsWith('titles.')) {
                stylePrompt = translated;
              }
            }
          } else {
            // Default: try I2i mapping
            const translated = tStyles(
              getI2iStyleNameKeyMappingSync()[metaData.style_id],
            );
            if (translated && !translated.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
              stylePrompt = translated;
            }
          }
          break;
        }

        default: {
          const translated = tStyles(
            getI2iStyleNameKeyMappingSync()[metaData.style_id],
          );
          // Only use if translation succeeded
          if (translated && !translated.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
            stylePrompt = translated;
          }
          break;
        }
      }
    }

    // Priority 3: Use style_name as fallback (should be English from generation)
    // Only use if translation from JSON files failed
    if (!stylePrompt && metaData?.style_name) {
      const looksLikeI18nKey = metaData.style_name.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/);
      if (!looksLikeI18nKey) {
        stylePrompt = metaData.style_name;
      }
    }

    // Final fallback: format style_id or use style_name as-is
    if (!stylePrompt) {
      if (metaData?.style_name) {
        // Even if style_name looks like an i18n key, use it as last resort (better than nothing)
        stylePrompt = metaData.style_name;
      } else if (metaData?.style_id) {
        stylePrompt = formatStyleIdAsName(metaData.style_id);
      }
    }
  }

  // Priority: displayPrompt (original user input) > template name > data.prompt > stylePrompt
  const isTemplateBasedTool =
    tool === 'video-effect' || tool === 'dance-video-generator';
  const promptText =
    displayPrompt ||
    (isTemplateBasedTool && stylePrompt ? stylePrompt : '') ||
    data.prompt ||
    stylePrompt ||
    '';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textRef.current && promptText) {
        const element = textRef.current;
        let lineHeight = parseInt(
          window.getComputedStyle(element).lineHeight,
          10,
        );
        if (isNaN(lineHeight)) {
          const fontSize = parseInt(
            window.getComputedStyle(element).fontSize,
            10,
          );
          lineHeight = Math.floor(fontSize * 1.4);
        }
        const maxHeight = lineHeight * 3; // 3 lines
        setShowExpandButton(element.scrollHeight > maxHeight);
      } else {
        setShowExpandButton(false); // Reset when there's no text
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [promptText]);

  const handleCopyPrompt = async () => {
    if (!promptText) return;

    try {
      await navigator.clipboard.writeText(promptText);
      toast.success(tToast('success.copy'));
    } catch (error) {
      toast.error(tToast('error.copyFailed'));
    }
  };

  return (
    <div className='mb-1 text-left'>
      <div className='overflow-hidden'>
        {promptText && !showExpandButton && (
          <Button
            isIconOnly
            size='sm'
            variant='light'
            aria-label='Copy prompt'
            className='float-right ml-1 text-muted-foreground hover:text-foreground'
            onPress={handleCopyPrompt}>
            <IconCopy className='w-4 h-4' />
          </Button>
        )}
        <p
          ref={textRef}
          className={cn(
            'text-sm font-bold text-muted-foreground',
            !isExpanded && showExpandButton && data?.id !== '-1'
              ? 'line-clamp-3'
              : '',
          )}>
          {promptText}
        </p>
      </div>

      {showExpandButton && (
        <div className='flex items-center w-full justify-end'>
          <div className='text-right'>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='inline-flex items-center text-xs text-default-500 hover:text-default-600 cursor-pointer'>
              {isExpanded ? t('actions.show_less') : t('actions.show_more')}
              {isExpanded ? (
                <IconChevronUp size={14} className='ml-1' />
              ) : (
                <IconChevronDown size={14} className='ml-1' />
              )}
            </button>
          </div>
          <Button
            isIconOnly
            size='sm'
            variant='light'
            aria-label='Copy prompt'
            className='float-right ml-1 text-muted-foreground hover:text-foreground'
            onPress={handleCopyPrompt}>
            <IconCopy className='w-4 h-4' />
          </Button>
        </div>
      )}

      {typeof data === 'object' &&
        data !== null &&
        'model_name' in data &&
        (data as any).model_name && (
          <div className='mt-1 text-xs text-muted-foreground'>
            {t('result_card.generated_by')}: {(data as any).model_name}
          </div>
        )}
    </div>
  );
});

const Container = memo(
  ({
    index,
    data,
    type,
    videoRefs,
    handleLoadedMetadata,
    showPrompt,
    maxGenerationMinutes = 3, // 默认3分钟
    externalProgress, // 外部传入的真实进度
    totalCount,
    isExample,
    tool,
  }: ResultCardProps) => {
    const { t } = useTranslation('common');
    const [internalProgress, setInternalProgress] = useState(0);
    const stop = useRef(false);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const hasInitializedAudio = useRef(false);
    const lastUserVolumeRef = useRef(0.5); // remember user's last non-zero volume
    const shouldPreload = useVideoPreload(localVideoRef);
    const allowAutoPlay =
      type === 'video' && typeof window !== 'undefined'
        ? Boolean(isExample)
        : false;

    // Ensure only one video plays at a time across the app
    useSingleVideoPlayback();

    // Direct autoplay for example videos only (no scroll monitoring)
    useEffect(() => {
      const videoEl = localVideoRef.current;
      if (!videoEl) return;

      if (allowAutoPlay) {
        const attemptPlay = () => {
          try {
            // Only set muted on first initialization, not on subsequent plays
            if (!hasInitializedAudio.current) {
              videoEl.muted = true;
              videoEl.defaultMuted = true;
              videoEl.volume = 0;
              hasInitializedAudio.current = true;
            }

            // Try to play immediately
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Example video autoplay successful');
                })
                .catch(error => {
                  console.log('Example video autoplay failed:', error);
                  // Retry after a short delay
                  setTimeout(() => {
                    videoEl.play().catch(() => {});
                  }, 500);
                });
            }
          } catch (error) {
            console.log('Example video autoplay error:', error);
          }
        };

        // Try immediately and also after video metadata loads
        attemptPlay();

        const handleLoadedData = () => {
          if (videoEl.paused) {
            attemptPlay();
          }
        };

        videoEl.addEventListener('loadeddata', handleLoadedData);

        return () => {
          videoEl.removeEventListener('loadeddata', handleLoadedData);
        };
      } else {
        // For generated result videos (non-example), default to unmuted
        videoEl.muted = false;
        videoEl.volume = 0.7;
      }
      // Non-example videos: do nothing, user must click to play
    }, [allowAutoPlay, isExample]);

    // Pause the video when tab becomes hidden
    useEffect(() => {
      const handler = () => {
        if (document.visibilityState === 'hidden') {
          const v = localVideoRef.current;
          if (v && !v.paused) v.pause();
        }
      };
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }, []);
    // Pause video when card leaves viewport (prevents background decode CPU)
    useEffect(() => {
      const el = localVideoRef.current;
      if (!el || isExample) return;
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          if (!entry) return;
          if (!entry.isIntersecting) {
            try {
              if (!el.paused) el.pause();
            } catch {}
          }
        },
        { threshold: 0 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [isExample]);

    const calculateProgress = () => {
      if (!data.status) return 0;

      const progressValue = externalProgress ?? internalProgress;
      const clampedProgress = Math.max(0, Math.min(100, progressValue));

      return clampedProgress;
    };

    const progress = calculateProgress();

    useEffect(() => {
      // 如果有外部进度，不需要内部进度计算
      if (externalProgress !== undefined) {
        // 停止内部进度计算
        stop.current = true;
        return;
      }

      // 如果状态不是生成中（即已完成），不需要内部进度计算
      if (!data.status) {
        stop.current = true;
        return;
      }

      // 重置停止标志，但延迟启动内部进度计算
      stop.current = false;

      // 延迟5秒启动内部进度计算，给外部进度一些时间
      let progressTimer: any = null;
      const startDelay = setTimeout(() => {
        if (stop.current || externalProgress !== undefined) {
          return;
        }

        // 使用传入的最大生成时长参数
        const duration = maxGenerationMinutes * 60 * 1000;
        const max = 99;
        const perform = () => {
          if (stop.current) {
            return;
          }
          setInternalProgress(prevProgress => Math.min(prevProgress + 1, max));
          progressTimer = setTimeout(
            () => {
              perform();
            },
            (duration / max) | 0,
          );
        };
        perform();
      }, 5000); // 延迟5秒启动

      return () => {
        clearTimeout(startDelay);
        if (progressTimer) {
          clearTimeout(progressTimer);
        }
      };
    }, [data, maxGenerationMinutes, externalProgress]);

    useEffect(() => {
      const complete = () => {
        setInternalProgress(100);
        stop.current = true;
      };
      document.addEventListener('komiko.generated.' + data.id, complete, {
        once: true,
      });
      return () => {
        document.removeEventListener('komiko.generated.' + data.id, complete);
      };
    }, [data.id]);

    const mediaUrl = getMediaUrl(data, type);

    // Reset audio initialization flag when video source changes
    useEffect(() => {
      if (allowAutoPlay) {
        hasInitializedAudio.current = false;
      }
    }, [mediaUrl, allowAutoPlay]);

    // Ensure clicking native mute icon restores a hearable volume when unmuted
    useEffect(() => {
      const v = localVideoRef.current;
      if (!v) return;
      const handleVolumeChange = () => {
        // Remember last non-zero volume set by the user
        if (v.volume > 0) {
          lastUserVolumeRef.current = v.volume;
        }
        // If user un-mutes but volume is 0, bump it to last or a sensible default
        if (!v.muted && v.volume === 0) {
          v.volume = Math.max(lastUserVolumeRef.current || 0.5, 0.1);
        }
      };
      v.addEventListener('volumechange', handleVolumeChange);
      return () => v.removeEventListener('volumechange', handleVolumeChange);
    }, [mediaUrl]);

    if (!data.status) {
      return (
        <>
          <PromptComp data={data} showPrompt={showPrompt} tool={tool} />
          <div className='flex overflow-hidden relative justify-center items-center bg-muted'>
            {type === 'image' ? (
              <img
                src={mediaUrl}
                alt='image'
                className='object-contain w-full max-w-full h-auto max-h-[calc(40vh-100px)] min-h-[200px]'
                style={{ maxHeight: 'calc(40vh - 100px)', minHeight: '200px' }}
              />
            ) : type === 'video' ? (
              <div className='flex overflow-hidden justify-center items-center w-full'>
                {mediaUrl &&
                (mediaUrl.includes('youtube.com') ||
                  mediaUrl.includes('youtu.be')) ? (
                  <iframe
                    src={mediaUrl}
                    className='object-contain w-full max-w-full h-auto'
                    style={{
                      maxHeight: 'calc(40vh - 100px)',
                      minHeight: '200px',
                      aspectRatio: '16/9',
                    }}
                    loading='lazy'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                    title='YouTube video player'
                  />
                ) : (
                  <video
                    ref={el => {
                      if (videoRefs?.current) {
                        videoRefs.current[index] = el;
                      }
                      localVideoRef.current = el;
                    }}
                    src={`${mediaUrl}#t=0.001`}
                    controls
                    playsInline
                    autoPlay={allowAutoPlay}
                    loop={allowAutoPlay}
                    className='object-contain w-full max-w-full h-auto'
                    style={{
                      maxHeight: 'calc(40vh - 100px)',
                      minHeight: '200px',
                    }}
                    preload={shouldPreload ? 'metadata' : 'none'}
                    onLoadedMetadata={() => handleLoadedMetadata?.(index)}
                    onPlay={() => {
                      try {
                        const all = (videoRefs?.current ||
                          []) as Array<HTMLVideoElement | null>;
                        all.forEach((v, i) => {
                          if (v && i !== index && !v.paused) {
                            v.pause();
                          }
                        });
                      } catch (err) {
                        console.error('Error in onPlay handler:', err);
                      }
                    }}
                    onEnded={e => {
                      const video = e.target as HTMLVideoElement;
                      video.pause();
                      video.currentTime = 0;
                    }}>
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : null}
          </div>
        </>
      );
    }
    return (
      <>
        <PromptComp data={data} showPrompt={showPrompt} />
        <Progress
          showValueLabel={true}
          label={t('result_card.generating')}
          value={progress}
          color='primary'
        />
      </>
    );
  },
);

export const ResultCard = memo((props: ResultCardProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toast');
  const { t: tStyles } = useTranslation('style-templates');
  const currentPath = router.pathname;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  const {
    type = 'image',
    data,
    handleDownload,
    handleDelete: handleDeleteClick,
    style,
    toolButtons,
    tool,
    isExample,
  } = props;

  const mediaUrl = getMediaUrl(data, type);

  // Extract template tag from meta_data
  // 统一返回英文 tag，显示翻译由 TagChip 负责
  const getTemplateTagFromData = (): string => {
    try {
      const metaData =
        typeof data.meta_data === 'string'
          ? JSON.parse(data.meta_data)
          : data.meta_data;
      if (metaData?.style_id) {
        const styleId = String(metaData.style_id);

        // Priority 1: Use template_i18n from DB if available (new approach)
        // 统一返回英文 tag，无论当前语言环境
        if (metaData.template_i18n && metaData.style_name) {
          return metaData.template_i18n?.name?.en || metaData.style_name;
        }

        // Priority 2: Use style_name if it looks like a proper name (not an i18n key)
        if (metaData.style_name) {
          const looksLikeI18nKey = metaData.style_name.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/);
          if (!looksLikeI18nKey) {
            // style_name is already a proper translated name, use it directly
            return metaData.style_name;
          }
        }

        // Priority 3: Legacy approach using i18n JSON files
        const enOpts = { lng: 'en' };
        let translationKey = '';

        // Determine translation key based on tool type
        switch (tool) {
          case 'photo_to_anime': {
            const isExpression =
              styleId.startsWith('expression-') ||
              metaData.mode === 'expression';
            translationKey = isExpression
              ? `expressions.${expressionNameKeyMapping[styleId]}`
              : getI2iStyleNameKeyMappingSync()[styleId];
            break;
          }
          case 'video-effect': {
            const effectKey = getEffectNameKeyMappingSync()[styleId];
            if (effectKey) {
              translationKey = `effects.${effectKey}`;
            }
            break;
          }
          case 'dance-video-generator': {
            const danceKey = danceNameKeyMapping[styleId];
            if (danceKey) {
              translationKey = `dances.${danceKey}`;
            }
            break;
          }
          case 'video-to-video':
            translationKey = getI2iStyleNameKeyMappingSync()[styleId];
            break;
          default:
            translationKey = getI2iStyleNameKeyMappingSync()[styleId];
            break;
        }

        if (translationKey) {
          const enTag = tStyles(translationKey, enOpts);
          // Check if translation succeeded (doesn't look like an i18n key)
          if (enTag && !enTag.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
            // 统一返回英文 tag，无论当前语言环境
            return enTag;
          }
        }

        // Final fallback: format style_id or use style_name as-is
        if (metaData.style_name) {
          return metaData.style_name; // Even if it's an i18n key, better than nothing
        }
        return formatStyleIdAsName(styleId);
      }
    } catch {
      // ignore parse errors
    }
    return '';
  };

  // Extract character_id from meta_data and format as #@character-id tag
  const getCharacterTagFromData = (): string => {
    try {
      const metaData =
        typeof data.meta_data === 'string'
          ? JSON.parse(data.meta_data)
          : data.meta_data;
      if (metaData?.character_id) {
        return `#@${metaData.character_id}`;
      }
    } catch {
      // ignore parse errors
    }
    return '';
  };

  // 通用的导航处理函数
  const handleNavigation = async (
    targetPath: string,
    loadingKey: string,
    skipCurrentPathCheck = false,
    includeGenerationId = false,
    includeTemplateTag = false,
    includeCharacterTag = false,
  ) => {
    if (!skipCurrentPathCheck && targetPath === currentPath) return;

    try {
      setIsLoading({ ...isLoading, [loadingKey]: true });
      const cloudUrl = await uploadMediaToCloud(mediaUrl, type);

      const pathSegments = currentPath.split('/');
      const sourcePage =
        pathSegments[pathSegments.length - 1] ||
        pathSegments[pathSegments.length - 2] ||
        'tool';


      const templateTag = includeTemplateTag ? getTemplateTagFromData() : '';
      const characterTag = includeCharacterTag ? getCharacterTagFromData() : '';

      const queryParams = createQueryParams(
        cloudUrl,
        type,
        data.prompt || '',
        sourcePage,
        includeGenerationId ? (data.id ?? '') + '' : '',
        templateTag,
        characterTag,
      );
      router.push(`${targetPath}?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to process media:', error);
      toast.error(tToast('error.imageProcessingFailed'));
    } finally {
      setIsLoading({ ...isLoading, [loadingKey]: false });
    }
  };

  const handleToolClick = (toolPath: string) => {
    handleNavigation(toolPath, toolPath);
  };

  const handlePublish = () => {
    // Include both templateTag and characterTag for publishing
    handleNavigation('/publish', 'publish', true, true, true, true);
  };

  const allToolOptions = getToolOptions(type);
  const toolOptions = allToolOptions.filter(tool => tool.path !== currentPath);

  // 生成时，自动滚动卡片到最上面
  useEffect(() => {
    if (!(data as any)?.status) return; // 只在生成中时触发
    if (typeof window === 'undefined') return;

    // 仅当自己是第一张卡片时滚动（防止每个卡片都触发）
    if ((props.index ?? -1) !== 0) return;

    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      let p = node?.parentElement || null;
      while (p) {
        const cs = window.getComputedStyle(p);
        const oy = cs.overflowY;
        if (
          (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
          p.scrollHeight > p.clientHeight
        ) {
          return p;
        }
        p = p.parentElement;
      }
      return null;
    };

    const container = getScrollParent(rootRef.current);
    if (container) {
      try {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        container.scrollTop = 0;
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [(data as any)?.status, props.index]);

  return (
    <div
      className='overflow-hidden relative p-2 mb-2 bg-card rounded-lg'
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '600px',
        ...style,
      }}
      ref={rootRef}>
      {/* 图片容器 */}
      <Container {...props} />

      {/* 底部信息 */}
      {!data.status && (
        <>
          <div className='flex justify-between items-center mt-3'>
            {/* 工具按钮组 */}
            {toolOptions.length > 0 && (
              <div className='hidden tool-btn-group gap-1'>
                {toolOptions.map((tool, idx) => (
                  <Tooltip key={idx} content={t(tool.labelKey)} placement='top'>
                    <Button
                      key={idx}
                      size='sm'
                      variant='flat'
                      color='primary'
                      aria-label={t(tool.labelKey)}
                      startContent={tool.icon}
                      isIconOnly={idx >= 3}
                      onPress={() => handleToolClick(tool.path)}
                      className={cn('font-medium border-1.5 border-primary-200 dark:text-primary-300', { 'px-2': idx < 3 })}
                      isLoading={isLoading[tool.path]}
                      isDisabled={Object.values(isLoading).some(Boolean)}>
                      {idx < 3 ? t(tool.labelKey) : ''}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* 移动端工具按钮组 */}
            {toolOptions.length > 0 && (
              <div className='flex gap-1 tool-btn-group-mobile'>
                {toolOptions.map((tool, idx) => (
                  <Tooltip key={idx} content={t(tool.labelKey)} placement='top'>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='flat'
                      color='primary'
                      aria-label={t(tool.labelKey)}
                      onPress={() => handleToolClick(tool.path)}
                      className='border-1.5 border-primary-200 dark:text-primary-300'
                      isLoading={isLoading[tool.path]}
                      isDisabled={Object.values(isLoading).some(Boolean)}>
                      {tool.icon}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* 操作按钮组 */}
            <div className='flex gap-1'>
              {toolButtons}
              {/* 下载按钮 */}
              <Tooltip content={t('actions.download')} placement='top'>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  aria-label='Download'
                  color='primary'
                  className='hover:text-primary hover:bg-transparent'
                  onClick={() => handleDownload(mediaUrl)}>
                  <FaDownload />
                </Button>
              </Tooltip>

              {/* 删除按钮 */}
              <Tooltip content={t('actions.delete')} placement='top'>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  color='danger'
                  aria-label='Delete'
                  className='hover:text-danger hover:bg-transparent'
                  onClick={() => handleDeleteClick(Number(data.id))}>
                  <FaTrash className='text-sm' />
                </Button>
              </Tooltip>

              {/* Post按钮 - 桌面端 */}
              {/* 示例视频不显示Post按钮 */}
              {data.id && !isExample && (
                <>
                  <Button
                    size='sm'
                    variant='solid'
                    color='primary'
                    startContent={<BsShareFill className='mr-1' />}
                    className='hidden gap-2 px-6 font-medium bg-gradient-to-r sm:flex from-primary-500 to-primary-600'
                    onPress={handlePublish}
                    isLoading={isLoading.publish}
                    isDisabled={Object.values(isLoading).some(Boolean)}>
                    {t('actions.post')}
                  </Button>

                  {/* Post按钮 - 移动端 */}
                  <Tooltip content={t('actions.post')} placement='top'>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='solid'
                      color='primary'
                      className='font-medium bg-gradient-to-r sm:hidden from-primary-500 to-primary-600'
                      onPress={handlePublish}
                      isLoading={isLoading.publish}
                      isDisabled={Object.values(isLoading).some(Boolean)}>
                      <BsShareFill />
                    </Button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
