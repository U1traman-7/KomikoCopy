/* eslint-disable */
import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Tooltip,
  Tabs,
  Tab,
  Switch,
  Slider,
  Input,
  Card,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
// import { Node, NodeConfig } from 'konva/lib/Node'; // 移除静态导入避免被打包到主bundle
import { Key } from 'react';
import { DrawAction } from '../../constants';
import toast from 'react-hot-toast';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom, loginModalAtom } from '../../state';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { IoColorPaletteOutline } from 'react-icons/io5';
import { FiSettings } from 'react-icons/fi';

// Dynamically import PoseEditor to prevent Canvas from being bundled
// const PoseEditor = nextDynamic(() => import('../PoseEditor/PoseEditor'), {
//   ssr: false,
//   loading: () => <div className="flex justify-center items-center h-64">Loading Pose Editor...</div>
// });

// 动态加载Canvas相关工具函数
const loadCanvasUtils = async () => {
  const { generateImage, generateText } = await import('../InfCanva/utils');
  return { generateImage, generateText };
};
import { FaPaintBrush } from 'react-icons/fa';
import { FaCaretUp, FaCaretDown, FaChevronDown } from 'react-icons/fa';
import { BsGrid3X3Gap } from 'react-icons/bs';
import { SimpleImageUploader } from '../ImageUploader';
import mixpanel from 'mixpanel-browser';
import { BiSolidZap } from 'react-icons/bi';
import { PiStarFourFill, PiCamera, PiX, PiXCircle } from 'react-icons/pi';
import { useBtnText } from 'hooks/useBtnText';
import { CHARACTER_MENTION_REGEX } from '../../constants';
import {
  IMAGE_ANIMAGINE_XL_3_1,
  IMAGE_ANIMAGINE_XL_4,
  IMAGE_ART_PRO,
  IMAGE_FLUX,
  IMAGE_FLUX_KONTEXT,
  IMAGE_GEMINI,
  IMAGE_GEMINI_3_PREVIEW,
  IMAGE_GPT4O,
  IMAGE_GPT4O_MINI,
  IMAGE_ILLUSTRIOUS,
  IMAGE_KUSAXL,
  IMAGE_NETA,
  IMAGE_NOOBAI_XL,
  IMAGE_SEEDREAM,
  IMAGE_SEEDREAM_V4,
} from '../../../api/tools/_zaps';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import AnimeImg from '../../../public/images/anime.webp';
import NoobaiImg from '../../../public/images/noobai.webp';
import AnimagineImg from '../../../public/images/animagine.webp';
import GeminiImg from '../../../public/images/gemini.webp';
import FluxImg from '../../../public/images/flux.webp';
import GPTImg from '../../../public/images/gpt4o.webp';
import AutoImg from '../../../public/images/auto-model.webp';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVariantData } from '../ToolsPage/TemplateWrapper';
import RecommendTags from '@/components/RecommendTags';
import { trackPaywallTriggered } from '../../utilities/analytics';
import { getCreateYoursData, POSITIVE_PROMPT } from '../../utilities/tools';
import { hasGeneralStyle, parseAutoModel } from '../InfCanva/utils';
import ReferenceImagesModal, { ReferenceItem } from './ReferenceImagesModal';
import NegativePromptButton from './NegativePromptButton';
import { StyleSelectorModal } from './StyleSelectorModal';
import GridSelectorModal from './GridSelectorModal';
import { withClient } from '../../utilities';
import PromptTag from './PromptTag';
import { usePromptPresets } from './usePromptPresets';
import { StyleTagsSelector } from './StyleTagsSelector';
import { LabelData, GenerationModel } from './types';

import { useCharacterMention } from '../VideoGeneration/hooks/useCharacterMention';
import { MentionDropdown } from '../VideoGeneration/components/MentionDropdown';
import { useRecentCharacters } from '../../hooks/useRecentCharacters';
import { useCharacterAltPromptCheck } from '../../hooks/useCharacterAltPromptCheck';
import { GENERAL_STYLES } from '../../../api/_constants';
import { consumeDraft, debouncedSaveDraft } from '@/utils/draft';
import {
  CharactersSelector,
  SingleCharacter as ImportedSingleCharacter,
} from './CharactersSelector';
import {
  isDanbrooModel,
  shouldHideTabs,
  shouldHideReference,
  MODEL_IMAGES,
  MODEL_LABELS,
} from './constants';
import { ModelSelector } from './ModelSelector';

const generalStyles = Object.keys(GENERAL_STYLES);

// 添加组件特定的样�?
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.textContent = `
    /* 移动端响应式样式 */
    @media (max-width: 768px) {
      .mobile-character-name {
        width: 58px !important;
        font-size: 0.7rem !important;
      }
    }
  `;
  if (!document.head.querySelector('#rightSidebar-styles')) {
    styleEl.id = 'rightSidebar-styles';
    document.head.appendChild(styleEl);
  }
}

interface ClassNameProps {
  classNames?: {
    characterTab?: string;
    characterTabItem?: string;
    textarea?: string;
    leftSidebar?: string;
  };
  className?: string;
}

// Re-export SingleCharacter type for backward compatibility
export type SingleCharacter = ImportedSingleCharacter;

interface CharactersSelectorProps extends ClassNameProps {
  prompt: string;
  setPrompt?: (newPrompt: string) => void;
  isMobile?: boolean;
  referenceImage?: any;
  setReferenceImage?: any;
  useDb?: boolean;
  setCharacter?: (character: SingleCharacter) => void;
  showPreset?: boolean;
  children?: React.ReactNode;
  model?: GenerationModel;
  setModel?: (newModel: GenerationModel) => void;
  isCreatePage?: boolean;
  isPromptReferenceCollapsed?: boolean;
  setIsPromptReferenceCollapsed?: (collapsed: boolean) => void;
  // Character mention props
  availableCharacters?: any[];
  isCharacterMentioned?: (id: string) => boolean;
  handleToggleCharacterMention?: (character: any) => void;
}

// isDanbrooModel moved to ./constants.ts

const PromptEditor: React.FC<CharactersSelectorProps> = ({
  prompt,
  setPrompt,
  isMobile,
  referenceImage,
  setReferenceImage,
  showPreset = true,
  classNames,
  model = 'Neta',
  children,
  isCreatePage = false,
  isPromptReferenceCollapsed = false,
  setIsPromptReferenceCollapsed,
  setModel,
}) => {
  const { t } = useTranslation('create');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    isMobile ? '' : 'Character',
  );
  const [selectedMemeName, setSelectedMemeName] = useState<string>('');

  // shouldHideTabs and shouldHideReference moved to ./constants.ts

  // Add this effect to handle tab selection when model changes
  useEffect(() => {
    if (
      shouldHideTabs(model) &&
      (selectedCategory === 'Character' || selectedCategory === 'Reference')
    ) {
      setSelectedCategory('Style');
    }
    if (shouldHideReference(model) && selectedCategory === 'Reference') {
      setSelectedCategory('Character');
    }
  }, [model]);

  const { promptPresets } = usePromptPresets(model);

  // const memeNames = [
  //   'Two Buttons',
  //   'Both Buttons Pressed',
  //   'Distracted Boyfriend',
  //   'Anime Girl Hiding from Terminator',
  //   'Buff Doge vs. Cheems',
  //   'Creepy Condescending Wonka',
  //   'Cute Cat',
  //   'Disappointed Black Guy',
  //   'Disaster Girl',
  //   'Drake Hotline Bling',
  //   'drowning kid in the pool',
  //   'For the better right',
  //   'Grandma Finds The Internet',
  //   "Guess I'll die",
  //   'he man skeleton advices',
  //   'Hide the Pain Harold',
  //   "I Bet He's Thinking About Other Women",
  //   'Is This A Pigeon',
  //   'Laughing Leo',
  //   'Leonardo Dicaprio Cheers',
  //   'Monkey Puppet',
  //   'Roll Safe Think About It',
  //   'Sad guy Happy guy bus',
  //   'Scooby doo mask reveal',
  //   'Shut Up And Take My Money',
  //   'Soldier protecting sleeping child',
  //   'Success Kid',
  //   'Three dragons',
  //   'Trump Bill Signing',
  //   'Willy Wonka',
  //   'Woman Yelling At Cat',
  // ];

  if (!showPreset && !children) {
    return null;
  }
  return (
    <div className='mt-4'>
      <div
        className={cn(
          'w-full ',
          isMobile || isCreatePage
            ? 'flex flex-col'
            : 'flex gap-4 items-stretch max-h-[80vh]',
        )}>
        {showPreset && (
          <div
            className={cn(
              classNames?.leftSidebar,
              isMobile || isCreatePage
                ? 'w-full mb-2'
                : 'flex-shrink-0 w-80 min-w-[320px] max-w-[400px] flex flex-col ',
              children ? 'w-full' : '',
            )}>
            {/* Prompt Reference Header with Collapse Button */}

            <div className='flex justify-between items-center md:mb-2'>
              <h3 className='font-bold text-md text-primary-600'>
                {t('prompt_presets.prompt_reference')}
              </h3>
              <Button
                isIconOnly
                size='sm'
                variant='light'
                className='text-muted-foreground'
                onClick={() => {
                  console.log(
                    'Collapse button clicked, current state:',
                    isPromptReferenceCollapsed,
                  );
                  setIsPromptReferenceCollapsed &&
                    setIsPromptReferenceCollapsed(!isPromptReferenceCollapsed);
                }}>
                {isPromptReferenceCollapsed ? <FaCaretDown /> : <FaCaretUp />}
              </Button>
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isPromptReferenceCollapsed
                  ? 'max-h-0 opacity-0'
                  : 'opacity-100',
                isMobile
                  ? isPromptReferenceCollapsed
                    ? 'h-0'
                    : 'h-[50vh]'
                  : 'h-full',
              )}>
              <div
                className={cn(
                  'flex-1 pr-0 pb-1 pl-1 bg-background rounded-xl border border-border',
                  isMobile ? 'h-[50vh]' : isCreatePage ? 'h-[58vh]' : 'h-full',
                )}>
                <Tabs
                  variant='underlined'
                  color='primary'
                  fullWidth
                  className={cn('flex justify-between space-x-0 w-full')}
                  classNames={{
                    tabList:
                      'w-full relative rounded-none p-0 border-b-1 border-grey-200 overflow-x-auto overflow-y-hidden gap-0 ',
                    cursor: 'w-full bg-primary ',
                    tab:
                      'justify-center py-5 min-w-fit' +
                      (isMobile ? ' px-1' : ' px-2'),
                    tabContent: 'group-data-[selected=true]:text-primary ',
                    panel: 'h-[calc(100%-30px)] pb-2 px-0 pt-0',
                  }}
                  selectedKey={selectedCategory}
                  onSelectionChange={key => {
                    const newKey = key as string;
                    if (selectedCategory === newKey) {
                      setSelectedCategory('');
                    } else {
                      setSelectedCategory(newKey);
                    }
                  }}
                  shouldSelectOnPressUp
                  disableAnimation
                  destroyInactiveTabPanel={false}>
                  {promptPresets.map(promptPreset => {
                    // Hide Style tab from UI (data still available for StyleSelectorModal)
                    if (promptPreset.key === 'Style') {
                      return null;
                    }
                    if (
                      shouldHideReference(model) &&
                      promptPreset.key === 'Reference'
                    ) {
                      return null;
                    }
                    if (
                      shouldHideTabs(model) &&
                      (promptPreset.key === 'Character' ||
                        promptPreset.key === 'Reference')
                    ) {
                      return null;
                    }
                    // const isSelected = selectedCategory === promptPreset.key;
                    return (
                      <Tab
                        key={promptPreset.key}
                        className='relative group'
                        title={
                          <div
                            className={cn(
                              'flex items-center justify-center space-x-2 w-full h-full flex-col overflow-auto',
                              isMobile || isCreatePage ? 'py-2 px-0' : 'px-2',
                            )}>
                            <span className={cn('text-lg')}>
                              {promptPreset.icon}
                            </span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                isMobile ? 'm-0' : '',
                              )}>
                              {promptPreset.category}
                            </span>
                          </div>
                        }>
                        {promptPreset.key == 'Character' && (
                          <CharactersSelector
                            prompt={prompt}
                            setPrompt={setPrompt}
                            classNames={classNames}
                            model={model}
                            isCreatePage={isCreatePage}></CharactersSelector>
                        )}
                        {promptPreset.key !== 'Character' &&
                          promptPreset.key !== 'Reference' && (
                            <div className='flex flex-col h-full'>
                              <StyleTagsSelector
                                prompt={prompt}
                                setPrompt={setPrompt!}
                                labelsData={promptPreset?.labelData ?? []}
                                setModel={setModel}
                              />
                              {promptPreset.key === 'Style' && null}
                            </div>
                          )}
                        {promptPreset.key == 'Reference' && (
                          <div className='flex'>
                            <div className={cn('overflow-y-auto flex-1 p-3')}>
                              <div className='mt-1 mb-[5px] text-sm'>
                                {t('upload_reference_image')}
                              </div>
                              <SimpleImageUploader
                                referenceImage={referenceImage}
                                setReferenceImage={(image: string) => {
                                  if (image !== '') setReferenceImage(image);
                                  else {
                                    setReferenceImage(null);
                                    setSelectedMemeName('');
                                  }
                                }}
                                compress
                              />
                            </div>
                          </div>
                        )}
                      </Tab>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          </div>
        )}
        <div
          className={cn({
            'w-full  h-full': isMobile,
            'flex-1 min-w-0 flex flex-col h-[80vh]': !isMobile,
            'h-[40vh]': isCreatePage && !isMobile,
          })}>
          {children}
        </div>
      </div>
    </div>
  );
};

// 使用泛型替代NodeConfig避免Konva依赖
interface DrawingNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
  child?: DrawingNode[];
}

interface SidebarProps {
  onElementChange: (payload: any) => void;
  onImageLoaded: (
    imageObj: any,
    options: {
      replace?: boolean | string;
      updateSize?: boolean;
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
      asyncImageFunc?: any;
    },
  ) => void;
  onArchive: () => void;
  onCheckoutVersion: (versionId: string | number) => void;
  currentSelectedShape:
    | {
        type: DrawAction;
        id: string;
        node: any; // 使用any替代Node<NodeConfig>避免Konva依赖
        originTargetAttrs?: DrawingNode;
      }
    | undefined;
  displayComicBg: boolean;
  setDisplayComicBg: (displayComicBg: boolean) => void;
  setBgWidth: (width: number) => void;
  setBgHeight: (height: number) => void;
  bgWidth: number;
  bgHeight: number;
  handleExport: (margin: number, post: boolean) => void;
  isMobile: boolean;
}

interface ImageGenerationProps extends ClassNameProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onImageLoaded: (
    imageObj: any,
    options: {
      replace?: boolean | string;
      updateSize?: boolean;
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
      asyncImageFunc?: any;
    },
  ) => void;
  currentSelectedShape?:
    | {
        type: DrawAction;
        id: string;
        node: any; // 使用any替代Node<NodeConfig>避免Konva依赖
        originTargetAttrs?: DrawingNode;
      }
    | undefined;
  isMobile: boolean;
  prompt?: string;
  showPreset?: boolean;
  optionStyle?: 'default' | 'compact';
  showImagesCount?: boolean;
  children?: React.ReactNode;
  tool?: string;
  stackChip?: boolean;
  isPromptReferenceCollapsed?: boolean;
  setIsPromptReferenceCollapsed?: (collapsed: boolean) => void;
  onClickGenerate?: () => void;
  onGenerating?: () => void;
  needPromptReferenceCollapsed?: boolean;
  autoGenerate?: boolean;
  onModelChange?: (model: string) => void;
  /** List of allowed model keys to display in the model selector */
  allowedModels?: string[];
  /** Default model to select when no model is specified in URL */
  defaultModel?: string;
}

// Ref type for programmatic control
export interface ImageGenerationControllerRef {
  triggerGenerate: () => void;
  getCurrentModel: () => string;
}

const ImageGenerationControllerInner = forwardRef<
  ImageGenerationControllerRef,
  ImageGenerationProps
>(
  (
    {
      inputValue,
      setInputValue,
      onImageLoaded,
      currentSelectedShape,
      isMobile,
      showPreset = true,
      classNames,
      optionStyle = 'default',
      showImagesCount,
      tool = 'create',
      children,
      stackChip = true,
      className,
      isPromptReferenceCollapsed,
      setIsPromptReferenceCollapsed,
      onClickGenerate,
      onGenerating,
      needPromptReferenceCollapsed = true,
      autoGenerate = false,
      onModelChange,
      allowedModels,
      defaultModel,
    },
    ref,
  ) => {
    const { t } = useTranslation('create');
    const { t: tToast } = useTranslation('toast');
    const router = useRouter();
    const { prompt, model: initModel } = router.query;
    const variantData = useVariantData(); // 获取variant数据

    const [profile, setProfile] = useAtom(profileAtom);

    // Use recent characters hook for adding characters when generating
    const { addToRecent } = useRecentCharacters(10);

    const [numGenerations, setNumGenerations] = useState<number>(1);
    const [generating, setGenerating] = useState(false);
    const [model, setModel] = useState<GenerationModel>('Auto Model');
    const [selectedCategory, setSelectedCategory] = useState<string>(
      isMobile ? '' : 'Character',
    );
    // const [selectedMemeName, setSelectedMemeName] = useState<string>('');
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    const [isGridModalOpen, setIsGridModalOpen] = useState(false);
    const [isSizePopoverOpen, setIsSizePopoverOpen] = useState(false);
    const [isNumPopoverOpen, setIsNumPopoverOpen] = useState(false);
    const [isResolutionPopoverOpen, setIsResolutionPopoverOpen] =
      useState(false);
    const [resolution, setResolution] = useState<'1k' | '2k' | '4k'>('1k');
    const [placeholder, setPlaceholder] = useState<string>(
      t('enter_prompt_general'),
    );
    const isAuth = useAtomValue(authAtom);
    const [closeDropdownTimer, setCloseDropdownTimer] =
      useState<NodeJS.Timeout | null>(null);
    const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    // 添加防抖的输入处�?
    const [localInputValue, setLocalInputValue] = useState(inputValue);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // const [magicPromptLoading, setMagicPromptLoading] = useState(false);
    const [isMagicPopoverOpen, setIsMagicPopoverOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(() => {
      return profile.plan === 'Free';
    });

    // 初始值用 SSR 安全的默认值 true，避免 hydration 不匹配
    // 客户端 mount 后通过 useEffect 从 localStorage 同步实际值
    const [useMagicPrompt, setUseMagicPrompt] = useState(true);

    const [shouldUseDraft, setShouldUseDraft] = useState(true);

    const { promptPresets, kusaStyleData, gridData } = usePromptPresets(model);
    const stylePreset = promptPresets.find(p => p.key === 'Style');
    const stylesData = (stylePreset?.labelData as LabelData[]) ?? [];

    // Pre-compute kusa-only style
    const kusaOnlyStyles = useMemo(() => {
      const set = new Set<string>();
      for (const category of kusaStyleData) {
        for (const label of category.labels as Array<{
          value: string;
          kusaSpecial?: boolean;
        }>) {
          if (label.kusaSpecial === true) {
            set.add(label.value);
          }
        }
      }
      return set;
    }, [kusaStyleData]);

    // Find selected kusa style from prompt
    const selectedKusaStyle = useMemo(() => {
      const kusaMatch = localInputValue.match(/\[([^\]]+)\]/);
      if (!kusaMatch) return null;

      const kusaValue = kusaMatch[0]; // e.g., "[vibrant-anime-style]"

      // Search through all kusa style categories
      for (const category of kusaStyleData) {
        const found = category.labels.find(
          (label: { value: string; label: string; image?: string }) =>
            label.value === kusaValue,
        );
        if (found) {
          return {
            label: found.label,
            value: found.value,
            image: found.image,
          };
        }
      }
      return null;
    }, [localInputValue, kusaStyleData]);

    // Track selected grid layout similar to selectedKusaStyle
    const selectedGrid = useMemo(() => {
      // Look for grid patterns like <panel-layout>, <four-panel-grid>, etc.
      const gridMatch = localInputValue.match(/<([^>]+)>/);
      if (!gridMatch) return null;

      const gridValue = gridMatch[0]; // e.g., "<panel-layout>"

      // Search through all grid categories
      for (const category of gridData) {
        const found = category.labels.find(
          (label: { value: string; label: string; image?: string }) =>
            label.value === gridValue,
        );
        if (found) {
          return {
            label: found.label,
            value: found.value,
            image: found.image,
          };
        }
      }
      return null;
    }, [localInputValue, gridData]);

    // Check if any URL parameters exist that should disable draft usage
    useEffect(() => {
      if (!router.isReady) return;

      const hasParams = !!(
        router.query.prompt ||
        router.query.model ||
        router.query.generationId ||
        router.query.characterId
      );

      setShouldUseDraft(!hasParams);
    }, [
      router.isReady,
      router.query.prompt,
      router.query.model,
      router.query.generationId,
      router.query.characterId,
    ]);

    const excludeKeywords = useMemo(() => {
      const keywords = promptPresets
        .map(preset => preset.labelData.map(d => d.labels.map(l => l.value)))
        .flat(2);

      return keywords;
    }, [promptPresets]);

    // 防抖更新父组件的inputValue
    const debouncedSetInputValue = useCallback(
      (value: string) => {
        setLocalInputValue(value);

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          setInputValue(value);
        }, 300); // 300ms防抖
      },
      [setInputValue],
    );

    // Get Generation preset from PostData(create yours)
    // Priority: create yours > draft
    useEffect(() => {
      if (!router.isReady) return;
      const generationId = router.query.generationId;

      if (generationId) {
        const prePostData = getCreateYoursData(generationId as string);
        const generation = prePostData?.generation;
        if (generation) {
          // Disable draft to prevent overwriting create yours data
          setShouldUseDraft(false);

          // get model
          const modelStr = generation.model as string | undefined;
          if (modelStr) {
            const { keyForLookup, image } = resolveModelSelection(modelStr);
            setModel(keyForLookup as GenerationModel);
            setModelImage(image);
            setSelectedModelKey(keyForLookup);
            setIsModelPopoverOpen(false);
          }
          //  get prompt
          const prompt = generation.prompt;
          if (prompt) {
            if (prompt.includes(POSITIVE_PROMPT)) {
              debouncedSetInputValue(prompt.replace(POSITIVE_PROMPT, ''));
            } else {
              debouncedSetInputValue(prompt);
            }
          }

          router.replace({
            pathname: router.pathname,
            query: {},
          });
        }
      }
    }, [router.isReady, router.query.generationId]);

    // 同步外部inputValue变化
    useEffect(() => {
      setLocalInputValue(inputValue);
    }, [inputValue]);

    // 清理防抖定时�?
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // 客户端 mount 后从 localStorage 同步 magic prompt 设置
    useEffect(() => {
      const stored = localStorage.getItem('useMagicPrompt');
      if (stored !== null) {
        setUseMagicPrompt(stored === 'true');
      }
    }, []);

    const handleMagicToggle = (checked: boolean) => {
      setUseMagicPrompt(checked);
      localStorage.setItem('useMagicPrompt', checked.toString());
      setIsMagicPopoverOpen(false);
    };

    // Use internal state if props are not provided (for backward compatibility)
    const [
      internalIsPromptReferenceCollapsed,
      setInternalIsPromptReferenceCollapsed,
    ] = useState(false);
    const actualIsPromptReferenceCollapsed =
      isPromptReferenceCollapsed ?? internalIsPromptReferenceCollapsed;
    const actualSetIsPromptReferenceCollapsed =
      setIsPromptReferenceCollapsed ?? setInternalIsPromptReferenceCollapsed;
    const { submit: openModal } = useOpenModal();
    const [hideReferenceImage, setHideReferenceImage] = useState(false);

    // 改进滚动处理函数
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);

        // 清除之前的计时器
        if (closeDropdownTimer) {
          clearTimeout(closeDropdownTimer);
        }

        // 设置延迟关闭计时�?
        const timer = setTimeout(() => {
          // 重置滚动标志
          setIsScrolling(false);
        }, 1500); // 增加�?500ms延迟，提供更长的滚动等待时间

        setCloseDropdownTimer(timer);
      };

      // 添加滚动事件监听
      window.addEventListener('scroll', handleScroll, { passive: true });

      // 清理函数
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (closeDropdownTimer) {
          clearTimeout(closeDropdownTimer);
        }
      };
    }, [closeDropdownTimer]);

    // shouldHideTabs and shouldHideReference moved to ./constants.ts

    // Models that don't support negative prompt
    const shouldHideNegativePrompt = useCallback((model: string) => {
      return [
        'Flux',
        'Gemini',
        'Gemini Pro',
        'Gemini Mini',
        'GPT-4o',
        'GPT-4o Mini',
        'Seedream',
      ].includes(model);
    }, []);

    useEffect(() => {
      if (shouldHideReference(model)) {
        setHideReferenceImage(true);
      } else if (model === 'Flux' && localInputValue.includes('<')) {
        setHideReferenceImage(true);
      } else if (model === 'Auto Model' && localInputValue.match(/\[.+?\]/)) {
        // kusa 不支�?reference image
        const styleMatch = localInputValue.match(/\[([^\]]+)\]/);
        const styleValue = styleMatch ? `[${styleMatch[1]}]` : '';
        setHideReferenceImage(kusaOnlyStyles.has(styleValue));
      } else {
        setHideReferenceImage(false);
      }
    }, [model, localInputValue, shouldHideReference, kusaOnlyStyles]);

    const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
    const referenceImage = referenceItems[0]?.previewUrl || '';
    const [negativePrompt, setNegativePrompt] = useState('');

    // 用 ref 追踪当前 referenceItems，供卸载清理使用
    const referenceItemsRef = useRef<ReferenceItem[]>([]);
    useEffect(() => {
      const prev = referenceItemsRef.current;
      const currentIds = new Set(referenceItems.map(item => item.id));
      // 释放已被移除的 Blob URL
      prev.forEach(item => {
        if (!currentIds.has(item.id) && item.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      referenceItemsRef.current = referenceItems;
    }, [referenceItems]);
    // 组件卸载时释放所有剩余 Blob URL
    useEffect(() => {
      return () => {
        referenceItemsRef.current.forEach(item => {
          if (item.previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- referenceItemsRef 是 ref，始终是最新值

    // Restore pending reference images passed via sessionStorage from cross-page navigation
    useEffect(() => {
      const pending = sessionStorage.getItem('pendingReferenceItems');
      if (!pending) return;
      sessionStorage.removeItem('pendingReferenceItems');
      try {
        const items: Array<{ id: string; name: string; base64: string }> =
          JSON.parse(pending);
        if (!Array.isArray(items) || items.length === 0) return;
        if (!items.every(item => item.id && item.base64?.includes(','))) return;
        const restored: ReferenceItem[] = items.map(item => {
          const arr = item.base64.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([u8arr], item.name || 'reference.jpg', {
            type: mime,
          });
          return {
            id: item.id,
            file,
            previewUrl: URL.createObjectURL(file),
            name: item.name,
          };
        });
        setReferenceItems(restored);
      } catch (e) {
        console.error(
          'Failed to restore reference images from sessionStorage:',
          e,
        );
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // const [charImages, setCharImages] = useState<any[]>([]);
    // const [outfitImages, setOutfitImages] = useState<any[]>([]);
    // const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
    // const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([]);
    // const [history, setHistory] = useAtom(historyAtom);
    // const [isPoseEditorVisible, setIsPoseEditorVisible] = useState(false);
    // const [poseImageUrl, setPoseImageUrl] = useState<string | null>(null);
    // const [poseString, setPoseString] = useState<string | null>(null);
    // Multiple reference images support
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
    // const [AiOptimize, setAiOptimize] = useState(false);
    const [size, setSize] = useState('3:4');
    // Character mention hook for @mention functionality
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
      toggleCharacterMention: handleToggleCharacterMention,
      handlePromptChange,
      selectCharacterFromDropdown,
    } = useCharacterMention({
      isAuth,
      prompt: localInputValue,
      setPrompt: debouncedSetInputValue,
    });

    // Fetch alt_prompt info for characters not in availableCharacters
    const { characterInfo, loading: loadingCharacterInfo } =
      useCharacterAltPromptCheck(localInputValue, model, availableCharacters);

    // Handle characterId from URL query parameter (from Characters page "Generate Image" button)
    useEffect(() => {
      const { characterId } = router.query;
      if (characterId && typeof characterId === 'string' && isAuth) {
        // Check if character is already mentioned
        const alreadyMentioned = localInputValue.includes(`@${characterId}`);
        if (!alreadyMentioned) {
          // Find the character in available characters
          const character = availableCharacters.find(
            c => c.character_uniqid === characterId,
          );
          if (character) {
            // Add mention to prompt only (no reference image)
            const newPrompt = localInputValue
              ? `${localInputValue.trim()}, @${characterId}`
              : `@${characterId}`;
            debouncedSetInputValue(newPrompt);
          }
        }
      }
    }, [router.query, availableCharacters, isAuth]);

    // const [loginModalState] = useAtom(loginModalAtom);
    // Backward-compat helper to support existing child components expecting setReferenceImage
    const setReferenceImage = async (url: string | null) => {
      if (!url) {
        setReferenceItems([]);
      } else {
        // Convert URL to File object for consistency
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'reference.jpg', { type: blob.type });
          setReferenceItems([
            { id: 'legacy-0', file: file, previewUrl: url, name: 'reference' },
          ]);
        } catch (error) {
          console.error('Failed to convert URL to File:', error);
        }
      }
    };

    const loginModal = useAtomValue(loginModalAtom);
    const btnText = useBtnText(t('login_to_generate'), t('generate'));
    const btnTextInside = useBtnText(
      t('login_to_generate_inside'),
      t('generate_inside'),
    );

    // 缓存sizes数组
    const sizes = useMemo(() => {
      const sizes = [
        {
          key: '1:1',
          icon: <div className='w-[15px] h-[15px] rounded-sm p-0 m-0'></div>,
        },
        {
          key: '3:4',
          icon: <div className='w-[12px] h-[16px] rounded-sm p-0 m-0'></div>,
        },
        {
          key: '4:3',
          icon: <div className='w-[16px] h-[12px] rounded-sm p-0 m-0'></div>,
        },
        {
          key: '16:9',
          icon: <div className='w-[16px] h-[9px] rounded-sm p-0 m-0'></div>,
        },
        {
          key: '9:16',
          icon: <div className='w-[9px] h-[16px] rounded-sm p-0 m-0'></div>,
        },
      ];
      // Only show "Reference Image" option for single reference image
      // if (referenceItems.length === 1) {
      //   return [
      //     ...sizes,
      //     {
      //       key: 'Reference Image',
      //       icon: null,
      //     },
      //   ];
      // }
      return sizes;
    }, [referenceItems.length]);

    const [sizeIcon, setSizeIcon] = useState<React.ReactNode>(sizes[1].icon);

    const [showLegacyModels, setShowLegacyModels] = useState(false);

    // 缓存models数组
    const models = useMemo<
      {
        key: GenerationModel | 'category' | 'legacy-toggle';
        image: string;
        cost: number | string;
        features: string[];
        label?: string;
        isCategory?: boolean;
        suffix?: React.ReactNode;
        isLegacyToggle?: boolean;
        isLegacy?: boolean;
      }[]
    >(
      () => [
        // First row: Auto Model | Nano Banana Pro
        {
          key: 'Auto Model',
          image: AutoImg.src,
          cost: '15-80',
          features: ['Character preset', 'Multiple OC'],
        },
        {
          key: 'Gemini Pro',
          image:
            'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/image_generation/fe775601-0d1c-4ad9-bd44-edce4c6a036e/2025-12-01-feeb2c92-6c07-4ff2-8f0b-c1265aff4d66.webp?t=1764586581792',
          label: '🔥 Nano Banana Pro',
          cost: '300-500',
          features: ['Multiple OC', 'Reference image'],
        },
        {
          key: 'category',
          image: '',
          cost: 0,
          features: [],
          label: '🌸 ' + t('create:anime_models'),
          suffix: (
            <span className='font-normal'>
              (
              <a
                href='https://komiko-app.notion.site/AI-Art-Generator-26b4d853a19f80c08e9ff0e8c9e903b3'
                target='_blank'
                className='text-primary-500 hover:text-primary-600'
                rel='noopener noreferrer'>
                {t('create:how_to_guide')}
              </a>
              )
            </span>
          ),
          isCategory: true,
        },
        {
          key: 'Art Pro',
          image: AnimeImg.src,
          cost: IMAGE_ART_PRO,
          features: ['Character preset', 'Anime style', 'Danbooru tags'],
        },
        {
          key: 'Art Unlimited',
          image: NoobaiImg.src,
          cost: IMAGE_ART_PRO,
          features: [
            'Character preset',
            'Anime style',
            'NSFW',
            'Danbooru tags',
          ],
        },
        {
          key: 'category',
          image: '',
          cost: 0,
          features: [],
          label: '�?' + t('create:general_models'),
          isCategory: true,
        },
        {
          key: 'Seedream 4.5',
          image: FluxImg.src,
          cost: IMAGE_SEEDREAM,
          features: ['Multiple OC', 'NSFW', 'Reference image'],
        },
        {
          key: 'Gemini',
          image: GeminiImg.src,
          label: 'Gemini (Nano Banana)',
          cost: IMAGE_GEMINI,
          features: ['Multiple OC', 'Reference image'],
        },
        {
          key: 'legacy-toggle',
          image: '',
          cost: 0,
          features: [],
          label: 'View Legacy Models',
          isLegacyToggle: true,
        },
        {
          key: 'Seedream 4',
          image: FluxImg.src,
          cost: IMAGE_SEEDREAM_V4,
          features: ['Multiple OC', 'NSFW', 'Reference image'],
          isLegacy: true,
        },
        {
          key: 'Animagine',
          image: AnimagineImg.src,
          cost: IMAGE_ANIMAGINE_XL_3_1,
          features: ['Character preset', 'Anime Style', 'Danbooru tags'],
          isLegacy: true,
        },
        {
          key: 'Illustrious',
          image: GPTImg.src,
          cost: IMAGE_ILLUSTRIOUS,
          features: [
            'Character preset',
            'Anime Style',
            'NSFW',
            'Danbooru tags',
          ],
          isLegacy: true,
        },
        {
          key: 'Noobai',
          image: NoobaiImg.src,
          cost: IMAGE_NOOBAI_XL,
          features: ['Character preset', 'Anime Style', 'Danbooru tags'],
          isLegacy: true,
        },
        {
          key: 'KusaXL',
          image: NoobaiImg.src,
          cost: IMAGE_KUSAXL,
          features: [
            'Character preset',
            'Anime style',
            'NSFW',
            'Danbooru tags',
          ],
          isLegacy: true,
        },
      ],
      [],
    );

    // Helper function to get model image from MODEL_IMAGES
    const getModelImage = useCallback((modelKey: string): string => {
      return MODEL_IMAGES[modelKey] ?? MODEL_IMAGES['Auto Model'];
    }, []);

    // Helper function to get model display name
    const getModelDisplayName = useCallback((modelKey: string): string => {
      return MODEL_LABELS[modelKey] ?? modelKey;
    }, []);

    // 统一解析外部传入的模型字符串
    const resolveModelSelection = useCallback(
      (input: string) => {
        const found = models.find(m => m.key === input || m.label === input);
        let normalizedKey = found?.key;

        // Handle special model mappings (DB aliases �?frontend model keys)
        if (!normalizedKey) {
          if (
            input.includes('Gemini Pro') ||
            input.includes('Nano Banana Pro')
          ) {
            normalizedKey = 'Gemini Pro';
          } else if (input.includes('Gemini')) {
            normalizedKey = 'Gemini';
          } else if (
            input.includes('Seedream Edit') ||
            input.includes('Seedream 4.5')
          ) {
            normalizedKey = 'Seedream 4.5';
          } else if (input.includes('Seedream 4')) {
            normalizedKey = 'Seedream 4';
          } else if (input.includes('Seedream')) {
            // Bare "Seedream" alias from DB �?map to current Seedream 4.5
            normalizedKey = 'Seedream 4.5';
          }
        }

        const keyForLookup = normalizedKey ?? input;
        const matchedModel = models.find(m => m.key === keyForLookup);
        const image = matchedModel?.image ?? '';
        const displayName = found?.label ?? matchedModel?.label ?? keyForLookup;
        return { keyForLookup, image, displayName };
      },
      [models],
    );

    // 添加状态标志当前选中的模�?
    const [selectedModelKey, setSelectedModelKey] = useState<string>(model);
    const [modelImage, setModelImage] = useState(MODEL_IMAGES['Auto Model']);
    const [cost, setCost] = useState(IMAGE_NETA);
    // Track the actual model being used (for Auto Model display)
    const [displayModel, setDisplayModel] = useState<string>(model);
    // Sticky auto model: once escalated to a non-default model, keep it until user sets 'Auto Model'
    const stickyAutoModelRef = useRef<GenerationModel | null>(null);

    // Auto Model: Detect which model to use and update UI
    // Show the detected model to users (e.g., "Seedream" when multiple references)
    // Users can still manually select any model to override auto-detection
    useEffect(() => {
      if (model !== 'Auto Model') {
        // User manually selected a model, update UI to match
        setDisplayModel(model);
        setSelectedModelKey(model);
        setModelImage(getModelImage(model));
        return;
      }

      // Don't auto-switch while user is typing/selecting characters
      if (showMentionDropdown) {
        return;
      }

      // Wait for character data to load before making decisions
      if (loadingCharacters || loadingCharacterInfo) {
        return;
      }

      // Merge character data from API and user's owned characters
      const mergedCharacters = [
        ...Array.from(characterInfo.values()),
        ...(availableCharacters || []),
      ] as Array<{
        character_uniqid: string;
        alt_prompt?: string;
        character_description?: string;
      }>;

      // Detect which model should be used
      const detectedModel = parseAutoModel({
        model,
        referenceImage: referenceItems.map(r => r.previewUrl),
        prompt: localInputValue,
        availableCharacters: mergedCharacters,
      }) as GenerationModel;

      // Update UI based on detected model
      // Only show non-default models (Seedream 4.5, Gemini, etc.)
      // For Art Pro (default), show "Auto Model"
      if (
        detectedModel === 'Seedream 4.5' ||
        detectedModel === 'Seedream Edit'
      ) {
        // Show Seedream 4.5 (non-default model) and stick
        setDisplayModel('Seedream 4.5');
        setSelectedModelKey('Seedream 4.5');
        setModelImage(getModelImage('Seedream 4.5'));
        stickyAutoModelRef.current = 'Seedream 4.5';
      } else if (detectedModel === 'Gemini Pro') {
        // Show Gemini Pro (for grid layouts: 4x4, 5x5, 6x6) and stick
        setDisplayModel('Gemini Pro');
        setSelectedModelKey('Gemini Pro');
        setModelImage(getModelImage('Gemini Pro'));
        stickyAutoModelRef.current = 'Gemini Pro';
      } else if (
        detectedModel === 'Gemini' &&
        !hasGeneralStyle(localInputValue)
      ) {
        // Show Gemini (for single reference image). Do not stick.
        setDisplayModel('Gemini');
        setSelectedModelKey('Gemini');
        setModelImage(getModelImage('Gemini'));
      } else if (localInputValue.match(/\[.+?\]/)) {
        const style = localInputValue.match(/\[.+?\]/)?.[0] || '';
        if (!generalStyles.includes(style)) {
          // Show Art Pro (for style presets). Do not stick; style may be removed.
          setDisplayModel('Art Pro');
          setSelectedModelKey('Art Pro');
          setModelImage(getModelImage('Art Pro'));
        }
      } else {
        // Default: If previously escalated, keep sticky non-default; otherwise show Auto Model
        if (stickyAutoModelRef.current) {
          const sticky = stickyAutoModelRef.current;
          setDisplayModel(sticky);
          setSelectedModelKey(sticky);
          setModelImage(getModelImage(sticky));
        } else {
          setDisplayModel('Auto Model');
          setSelectedModelKey('Auto Model');
          setModelImage(getModelImage('Auto Model'));
        }
      }
    }, [
      model,
      localInputValue,
      referenceItems,
      availableCharacters,
      characterInfo,
      getModelImage,
      showMentionDropdown,
      loadingCharacterInfo,
    ]);

    // Notify parent component of effective model changes
    useEffect(() => {
      if (onModelChange) {
        // Use the actual model that will be used for generation
        const effectiveModel = model === 'Auto Model' ? displayModel : model;
        onModelChange(effectiveModel);
      }
    }, [model, displayModel, onModelChange]);

    // Update placeholder based on effective model (displayModel for Auto Model)
    useEffect(() => {
      // 优先使用variant的placeholder，如果没有则使用默认的model placeholder
      if (variantData?.data?.placeholderText) {
        setPlaceholder(variantData.data.placeholderText);
      } else {
        // Use displayModel for Auto Model to reflect the actual detected model
        const effectiveModel = model === 'Auto Model' ? displayModel : model;

        if (isDanbrooModel(effectiveModel)) {
          setPlaceholder(t('enter_prompt_danbooru_placeholder'));
        } else if (effectiveModel === 'Auto Model') {
          setPlaceholder(t('enter_prompt_general_placeholder'));
        } /*else if (effectiveModel === 'Neta') {
          setPlaceholder(t('enter_prompt_neta_placeholder'));
        }*/ else if (
          effectiveModel === 'Gemini' ||
          effectiveModel === 'Gemini Pro' ||
          effectiveModel === 'Seedream 4.5' ||
          effectiveModel === 'Seedream 4'
        ) {
          setPlaceholder(t('enter_prompt_gemini_placeholder'));
        } /*else if (effectiveModel === 'Noobai') {
          setPlaceholder(t('enter_prompt_noobai_placeholder'));
        } else if (effectiveModel === 'Animagine') {
          setPlaceholder(t('enter_prompt_animagine_placeholder'));
        } else if (effectiveModel === 'Illustrious') {
          setPlaceholder(t('enter_prompt_illustrious_placeholder'));
        }*/ else if (effectiveModel === 'GPT') {
          setPlaceholder(t('enter_prompt_gpt4o_placeholder'));
        } else {
          setPlaceholder(t('enter_prompt_flux_placeholder'));
        }
      }
      if (referenceItems.length > 0) {
        setPlaceholder(t('how_to_remix'));
      }

      if (
        shouldHideTabs(model) &&
        (selectedCategory === 'Character' || selectedCategory === 'Reference')
      ) {
        setSelectedCategory('Style');
        return;
      }
      if (shouldHideReference(model) && selectedCategory === 'Reference') {
        setSelectedCategory('Character');
        return;
      }
    }, [
      model,
      displayModel,
      variantData,
      shouldHideTabs,
      shouldHideReference,
      selectedCategory,
      t,
      referenceItems,
    ]);

    // 缓存成本计算（与真实用到的模型保持一致）
    const calculatedCost = useMemo(() => {
      let effective: GenerationModel;

      if (model !== 'Auto Model') {
        effective = model as GenerationModel;
      } else {
        // Use displayModel (already detected in UI effect)
        // If displayModel is still "Auto Model", it means Art Pro (default)
        effective =
          displayModel === 'Auto Model'
            ? 'Art Pro'
            : (displayModel as GenerationModel);
      }

      // 映射模型到单次价�?
      switch (effective) {
        case 'Neta':
          return IMAGE_NETA * numGenerations;
        case 'Gemini':
          return IMAGE_GEMINI * numGenerations;
        case 'Gemini Pro':
          // Resolution-based pricing for Gemini Pro
          const resolutionCost =
            resolution === '1k' ? 300 : resolution === '2k' ? 350 : 500;
          return resolutionCost * numGenerations;
        case 'Animagine':
          return IMAGE_ANIMAGINE_XL_3_1 * numGenerations;
        case 'Noobai':
          return IMAGE_NOOBAI_XL * numGenerations;
        case 'GPT':
          return IMAGE_GPT4O * numGenerations;
        case 'Illustrious':
          return IMAGE_ILLUSTRIOUS * numGenerations;
        case 'Art Pro':
        case 'Art Unlimited':
          return IMAGE_ART_PRO * numGenerations;
        case 'KusaXL':
          return IMAGE_KUSAXL * numGenerations;
        case 'Seedream 4.5':
          return IMAGE_SEEDREAM * numGenerations;
        case 'Seedream 4':
          return IMAGE_SEEDREAM_V4 * numGenerations;
        default:
          return IMAGE_FLUX_KONTEXT * numGenerations;
      }
    }, [model, numGenerations, displayModel, resolution]);

    // 更新cost状�?
    useEffect(() => {
      setCost(calculatedCost);
    }, [calculatedCost]);

    useEffect(() => {
      const sizeIcon = sizes.find(s => s.key === size)?.icon;
      setSizeIcon(sizeIcon);
    }, [size, sizes]);

    useEffect(() => {
      if (prompt) setInputValue(`${prompt}, `);
    }, [prompt, setInputValue]);

    useEffect(() => {
      // Use initModel from URL query, or defaultModel prop if provided
      const modelToUse = initModel || defaultModel;
      if (modelToUse) {
        const initStr = String(modelToUse);
        const { keyForLookup, image } = resolveModelSelection(initStr);
        setModel(keyForLookup as GenerationModel);
        setModelImage(image);
        setSelectedModelKey(keyForLookup);
        setIsModelPopoverOpen(false);
      }
    }, [initModel, defaultModel, resolveModelSelection]);

    // Auto adjust height of textarea - 使用useCallback优化
    const adjustTextareaHeight = useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, []);

    useEffect(() => {
      adjustTextareaHeight();
    }, [localInputValue, adjustTextareaHeight]);

    useEffect(() => {
      if (shouldUseDraft) {
        debouncedSaveDraft(tool, localInputValue);
      }
    }, [localInputValue, tool, shouldUseDraft]);

    useEffect(() => {
      if (!isAuth || profile?.id) {
        return;
      }
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/fetchProfile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ method: 'profile' }),
          });

          const data = await response.json();
          if (!data.error) {
            setProfile(prev => ({ ...prev, ...data, authUserId: data.id }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }, [isAuth, profile?.id]);

    const isCreatePage = router.pathname === '/create';
    const isButtonInRow = isMobile || isCreatePage;

    // 缓存生成按钮点击处理函数
    const handleGenerateClick = useCallback(async () => {
      // authUserId is not always available
      onClickGenerate?.();

      // 检查用户是否已登录
      if (!isAuth || !(profile as any)?.id) {
        loginModal?.onOpen?.();
        return;
      }

      // Extract and add characters to recent when user clicks Generate
      // Match @character_uniqid pattern in the prompt
      // Match alphanumeric characters, underscores, hyphens, parentheses, periods, colons, and single quotes
      // Support formats like @Anya_(Spy_X_Family), @kusagane-kabuto-b7pY
      // e.g., @Isabelle_(Animal_Crossing), @Mr._C.B._(Umamusume), @Momo_Ayase
      const characterMatches = localInputValue.match(CHARACTER_MENTION_REGEX);
      if (characterMatches && availableCharacters.length > 0) {
        characterMatches.forEach(match => {
          const uniqid = match.substring(1); // Remove @ prefix
          const character = availableCharacters.find(
            char => char.character_uniqid === uniqid,
          );
          if (character) {
            addToRecent(character as any);
          }
        });
      }

      if (profile.credit < cost) {
        // 追踪信用不足触发付费�?
        if (profile?.id) {
          trackPaywallTriggered(
            profile.id,
            'credit_insufficient',
            tool || 'image_generation',
            'credit_limit',
            profile.credit,
            cost,
            {
              model: model,
              required_credits: cost,
              user_plan: profile.plan || 'Free',
            },
          );
        }

        openModal('pricing', {
          trackingContext: {
            source: 'paywall',
            triggerTool: tool || 'image_generation',
          },
        });
        return;
      }
      if (!localInputValue) {
        toast.error(t('please_enter_prompt'));
        return;
      }

      // 移动端点击生成按钮后立即收起Prompt Reference
      if (isMobile && needPromptReferenceCollapsed) {
        actualSetIsPromptReferenceCollapsed(true);
      }

      // Determine which model to use for generation
      let realModel: GenerationModel;
      if (model === 'Auto Model') {
        // Use displayModel (already detected in UI effect)
        // If displayModel is still "Auto Model", it means Art Pro (default)
        realModel =
          displayModel === 'Auto Model'
            ? 'Art Pro'
            : (displayModel as GenerationModel);
      } else {
        // User manually selected a model, use it directly
        realModel = model as GenerationModel;
      }

      // 多语言模型和开启优化提示词功能时不需要翻�?
      const isMultiLangModel = [
        'Gemini',
        'Seedream 4.5',
        'Seedream 4',
      ].includes(realModel);
      const noTranslate = isMultiLangModel || useMagicPrompt;

      let imageSize = { width: 1024, height: 1024 };
      const isKusa =
        realModel === 'Art Pro' ||
        realModel === 'Art Unlimited' ||
        realModel === 'KusaXL';
      const isSeedream =
        realModel === 'Seedream 4.5' || realModel === 'Seedream 4';
      const isGeminiPro = realModel === 'Gemini Pro';

      if (size === '1:1') {
        imageSize = { width: 1024, height: 1024 };
        if (isKusa) {
          imageSize = { width: 1280, height: 1280 };
        }
        if (isSeedream) {
          imageSize = { width: 2048, height: 2048 };
        }
        if (isGeminiPro) {
          const res = resolution || '1k';
          if (res === '2k') {
            imageSize = { width: 2048, height: 2048 };
          } else if (res === '4k') {
            imageSize = { width: 4096, height: 4096 };
          } else {
            imageSize = { width: 1024, height: 1024 };
          }
        }
      } else if (size === '3:4') {
        imageSize = { width: 768, height: 1024 };
        if (isKusa) {
          imageSize = { width: 1080, height: 1440 };
        }
        if (isSeedream) {
          imageSize = { width: 1536, height: 2048 };
        }
        if (isGeminiPro) {
          const res = resolution || '1k';
          if (res === '2k') {
            imageSize = { width: 1536, height: 2048 };
          } else if (res === '4k') {
            imageSize = { width: 3072, height: 4096 };
          } else {
            imageSize = { width: 768, height: 1024 };
          }
        }
      } else if (size === '4:3') {
        imageSize = { width: 1024, height: 768 };
        if (isKusa) {
          imageSize = { width: 1440, height: 1080 };
        }
        if (isSeedream) {
          imageSize = { width: 2048, height: 1536 };
        }
        if (isGeminiPro) {
          const res = resolution || '1k';
          if (res === '2k') {
            imageSize = { width: 2048, height: 1536 };
          } else if (res === '4k') {
            imageSize = { width: 4096, height: 3072 };
          } else {
            imageSize = { width: 1024, height: 768 };
          }
        }
      } else if (size === '16:9') {
        imageSize = { width: 1280, height: 720 };
        if (isKusa) {
          imageSize = { width: 1920, height: 1080 };
        }
        if (isSeedream) {
          imageSize = { width: 2560, height: 1440 };
        }
        if (isGeminiPro) {
          const res = resolution || '1k';
          if (res === '2k') {
            imageSize = { width: 2560, height: 1440 };
          } else if (res === '4k') {
            imageSize = { width: 5120, height: 2880 };
          } else {
            imageSize = { width: 1280, height: 720 };
          }
        }
      } else if (size === '9:16') {
        imageSize = { width: 720, height: 1280 };
        if (isKusa) {
          imageSize = { width: 1080, height: 1920 };
        }
        if (isSeedream) {
          imageSize = { width: 1440, height: 2560 };
        }
        if (isGeminiPro) {
          const res = resolution || '1k';
          if (res === '2k') {
            imageSize = { width: 1440, height: 2560 };
          } else if (res === '4k') {
            imageSize = { width: 2880, height: 5120 };
          } else {
            imageSize = { width: 720, height: 1280 };
          }
        }
      } /*else if (size === 'Reference Image') {
        if (referenceItems.length > 0) {
          const tempSize: any = await getImageDimensions(
            referenceItems[0].previewUrl,
          );
          console.log('tempSize', tempSize);
          const scale = Math.max(1024 / tempSize.width, 1024 / tempSize.height);
          imageSize = {
            width: Math.floor(scale * tempSize.width),
            height: Math.floor(scale * tempSize.height),
          };
        }
      }*/

      const { generateImage } = await loadCanvasUtils();

      // onGenerating implies cross-page navigation (e.g., home → ai-anime-generator),
      // so persist reference items to sessionStorage to survive the page transition
      if (onGenerating && referenceItems.length > 0) {
        try {
          const base64List = await Promise.all(
            referenceItems.map(
              item =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(item.file);
                }),
            ),
          );
          const pendingData = referenceItems.map((item, i) => ({
            id: item.id,
            name: item.name,
            base64: base64List[i],
          }));
          sessionStorage.setItem(
            'pendingReferenceItems',
            JSON.stringify(pendingData),
          );
        } catch (e) {
          // Non-critical; likely sessionStorage QuotaExceededError for large images
          console.warn('Failed to save reference images for navigation:', e);
        }
      }

      onGenerating?.();

      const finalReferenceItems = referenceItems;

      // Check if this is a general model that needs the template format
      const isGeneralModel = [
        'Seedream 4.5',
        'Seedream 4',
        'Gemini',
        'Gemini Pro',
      ].includes(realModel);

      // Build the prompt to send to AI
      let promptForAI = localInputValue;

      if (isGeneralModel) {
        // For general models: extract components and build structured prompt
        let userPrompt = localInputValue;
        let stylePrompt = '';
        let gridPrompt = '';

        // Extract style prompt from style placeholder like [semi-realistic-portrait-style]
        const styleMatch = userPrompt.match(/\[([^\]]+)\]/);
        if (styleMatch) {
          const styleValue = styleMatch[0]; // e.g., "[semi-realistic-portrait-style]"

          // Find the corresponding style prompt from GENERAL_STYLES
          if (GENERAL_STYLES[styleValue as keyof typeof GENERAL_STYLES]) {
            stylePrompt =
              GENERAL_STYLES[styleValue as keyof typeof GENERAL_STYLES];
          } else {
            // Check kusaStyleData for kusa styles
            for (const category of kusaStyleData) {
              const found = category.labels.find(
                (label: { value: string; label: string }) =>
                  label.value === styleValue,
              );
              if (found) {
                stylePrompt = found.label;
                break;
              }
            }
          }

          // Remove style placeholder from user prompt if found
          if (stylePrompt) {
            userPrompt = userPrompt
              .replace(styleValue, '')
              .replace(/\s+/g, ' ')
              .trim();
          }
        }

        // Extract grid prompt from grid placeholder like <4x4-grid>
        const gridMatch = userPrompt.match(/<([^>]+)>/);
        if (gridMatch) {
          const gridValue = gridMatch[0]; // e.g., "<4x4-grid>"

          // Find the corresponding grid prompt
          for (const category of gridData) {
            const found = category.labels.find(
              (label: { value: string; prompt: string }) =>
                label.value === gridValue,
            );
            if (found) {
              gridPrompt = found.prompt;
              // Remove grid placeholder from user prompt
              userPrompt = userPrompt
                .replace(gridValue, '')
                .replace(/\s+/g, ' ')
                .trim();
              break;
            }
          }
        }

        // Clean up user prompt (remove extra commas and spaces)
        userPrompt = userPrompt
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*/, '')
          .replace(/,\s*$/, '')
          .trim();

        // Only apply template if there's style or grid to process
        if (stylePrompt || gridPrompt) {
          // Format the final prompt for general models
          promptForAI = gridPrompt
            ? 'Generate a comic following these requirements:\n\n'
            : 'Generate an image following these requirements:\n\n';

          if (userPrompt) {
            promptForAI += `User input prompt: ${userPrompt}\n\n`;
          }

          if (stylePrompt) {
            promptForAI += `Required art style: ${stylePrompt}\n\n`;
          }

          if (gridPrompt) {
            promptForAI += `Grid format: ${gridPrompt}`;
          }
        }
        // If no style or grid, just use the original prompt as-is
      }
      // For anime models (Art Pro, KusaXL, Animagine, etc.): use original prompt directly
      // The backend improvePrompt middleware will handle style expansion for these models

      // Process reference images: use base64 if total size < 4.5MB, otherwise upload to Supabase
      let initImages: string[] = [];
      if (finalReferenceItems.length > 0) {
        try {
          const { uploadFile, fileToBase64, getBase64Size } = await import(
            '../../utilities'
          );
          const { v4: uuidv4 } = await import('uuid');

          // Convert all files to base64
          const base64Array = await Promise.all(
            finalReferenceItems.map(item => fileToBase64(item.file)),
          );

          // Calculate total size
          const totalSize = base64Array.reduce(
            (sum, b64) => sum + getBase64Size(b64),
            0,
          );
          const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB

          if (totalSize < MAX_SIZE) {
            // Use base64 directly (no upload to Supabase)
            initImages = base64Array;
          } else {
            initImages = await Promise.all(
              finalReferenceItems.map(async item => {
                const ext = item.file.type.split('/')[1] || 'jpg';
                const filename = `app_media/references/${uuidv4()}.${ext}`;
                const publicUrl = await uploadFile(filename, item.file);
                return publicUrl;
              }),
            );
          }
        } catch (error) {
          console.error('Failed to process referenceimages:', error);
          toast.error(
            tToast('error.uploadFailed') ||
              'Failed to process reference images',
          );
          setGenerating(false);
          return;
        }
      }

      const metaData: any = {
        reference_names: finalReferenceItems.map(r => r.name),
      };

      // Add resolution for Gemini Pro model
      if (realModel === 'Gemini Pro') {
        metaData.resolution = resolution;
      }

      const isGemini = model === 'Gemini';
      const ratioKeys = ['1:1', '3:4', '4:3', '16:9', '9:16'];
      if (
        isGemini &&
        finalReferenceItems.length >= 1 &&
        ratioKeys.includes(size)
      ) {
        const ratioToDims: Record<string, { w: number; h: number }> = {
          '1:1': { w: 1024, h: 1024 },
          '3:4': { w: 1080, h: 1440 },
          '4:3': { w: 1440, h: 1080 },
          '16:9': { w: 1920, h: 1080 },
          '9:16': { w: 1080, h: 1920 },
        };
        const dims = ratioToDims[size];
        // Use server-side static templates (api/_utils/aspectRatios). Do not append on client.
        // Keep user references only; server will append the ratio template as the LAST image.
        // Ensure content image is first by preserving current order.
        metaData.aspect_template_ratio = size;
      }

      await generateImage(
        promptForAI, // Templated prompt for general models, original for anime models
        realModel,
        imageSize,
        [],
        initImages,
        numGenerations,
        onImageLoaded,
        setGenerating,
        false,
        undefined,
        () => {
          setProfile({
            ...profile,
            credit: profile.credit - cost,
          });
        },
        t,
        tool,
        metaData,
        noTranslate,
        useMagicPrompt,
        negativePrompt,
        localInputValue, // Original user input for database storage
      );
      if (shouldUseDraft) {
        consumeDraft(tool);
      }
    }, [
      profile,
      cost,
      localInputValue,
      isMobile,
      actualSetIsPromptReferenceCollapsed,
      model,
      size,
      numGenerations,
      referenceItems,
      onImageLoaded,
      setGenerating,
      setProfile,
      t,
      tool,
      loginModal,
      openModal,
      availableCharacters,
      addToRecent,
      shouldUseDraft,
      isAuth,
      negativePrompt,
    ]);

    // Expose triggerGenerate via ref for programmatic control
    useImperativeHandle(
      ref,
      () => ({
        triggerGenerate: handleGenerateClick,
        getCurrentModel: () => model,
      }),
      [handleGenerateClick, model],
    );

    // 缓存模型选择处理函数
    const handleModelSelect = useCallback(
      (modelKey: GenerationModel, modelImg: string) => {
        setModel(modelKey);
        setModelImage(modelImg);
        setSelectedModelKey(modelKey);
        setDisplayModel(modelKey);
        setIsModelPopoverOpen(false);
        // Clear sticky when user explicitly selects 'Auto Model'
        if (modelKey === 'Auto Model') {
          stickyAutoModelRef.current = null;
        }
        // Notify parent component of model change
        onModelChange?.(modelKey);
      },
      [onModelChange],
    );

    // 缓存尺寸选择处理函数
    const handleSizeSelect = useCallback((selectedKey: string) => {
      setSize(selectedKey);
      setIsSizePopoverOpen(false);
    }, []);

    // 缓存数量选择处理函数
    const handleNumSelect = useCallback((num: number) => {
      setNumGenerations(num);
      setIsNumPopoverOpen(false);
    }, []);

    const handleClearReferenceImage = useCallback(() => {
      // Remove all character mentions from prompt
      const characterMentions = referenceItems
        .filter(item => item.name?.startsWith('@'))
        .map(item => item.name);

      let newPrompt = localInputValue;
      characterMentions.forEach(mention => {
        // Remove the mention and clean up extra commas/spaces
        newPrompt = newPrompt
          .replace(new RegExp(`\\s*,?\\s*${mention}\\s*,?\\s*`, 'g'), ' ')
          .replace(/\s+/g, ' ')
          .trim();
      });

      if (newPrompt !== localInputValue) {
        // Use immediate update instead of debounced to ensure UI sync
        setLocalInputValue(newPrompt);
        debouncedSetInputValue(newPrompt);
      }

      setReferenceItems([]);
      if (singleReferenceImageRef.current) {
        singleReferenceImageRef.current.value = '';
      }
    }, [referenceItems, localInputValue, debouncedSetInputValue]);

    // Check if current model supports multiple reference images
    const supportsMultipleReferenceImages = useCallback(() => {
      return [
        'Gemini',
        'Gemini Pro',
        'Auto Model',
        'Seedream 4.5',
        'Seedream 4',
      ].includes(model);
    }, [model]);

    // Single reference image file input ref
    const singleReferenceImageRef = useRef<HTMLInputElement>(null);

    // Handle single reference image change
    const handleSingleReferenceImageChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          // Check file size (5MB limit)
          const maxSizeBytes = 5 * 1024 * 1024;
          if (file.size > maxSizeBytes) {
            toast.error(tToast('error.imageIsLargerThan5MB'), {
              position: 'top-center',
            });
            // Clear the input value
            if (e.target) {
              e.target.value = '';
            }
            return;
          }

          // Store File object directly without compression
          // Use unique id so the referenceItems useEffect can detect and revoke the old blob URL
          const previewUrl = URL.createObjectURL(file);
          setReferenceItems([
            {
              id: `ref-${Date.now()}`,
              file: file,
              previewUrl: previewUrl,
              name: 'reference',
            },
          ]);
        }
      },
      [tToast],
    );

    // Track previous reference state to only update size when transitioning
    const prevReferenceStateRef = useRef({
      hasReference: false,
      count: 0,
    });

    useEffect(() => {
      const prevState = prevReferenceStateRef.current;
      const currentHasReference = referenceItems.length > 0;
      const currentCount = referenceItems.length;

      // Only update size when:
      // 1. Going from no reference to having reference
      // 2. Going from having reference to no reference
      // 3. Changing from single to multiple or vice versa
      const shouldUpdateSize =
        prevState.hasReference !== currentHasReference ||
        (currentHasReference && prevState.count === 1 && currentCount > 1) ||
        (currentHasReference && prevState.count > 1 && currentCount === 1);

      if (shouldUpdateSize) {
        if (!currentHasReference) {
          setSize('3:4');
        }
        // else if (currentCount === 1) {
        //   // Only set to "Reference Image" for single reference image
        //   setSize('Reference Image');
        // }
        else if (currentCount > 1) {
          // For multiple references, only reset if coming from single reference
          if (prevState.count === 1) {
            setSize('3:4');
          }
        }
      }

      // Update previous state
      prevReferenceStateRef.current = {
        hasReference: currentHasReference,
        count: currentCount,
      };
    }, [referenceItems.length, setSize]);

    return (
      <div className={cn('w-full max-w-[100%]', className)}>
        <div className='relative mt-0 w-full'>
          <div className='border border-primary-300 rounded-xl p-3 pb-4'>
            {/* Model selector + Style selector + Grid selector */}
            <div className='pb-2 flex items-center gap-4 flex-wrap'>
              {/* Model Selector */}
              <ModelSelector
                selectedModel={selectedModelKey}
                displayModel={displayModel}
                modelImage={modelImage}
                onModelSelect={handleModelSelect}
                isOpen={isModelPopoverOpen}
                onOpenChange={setIsModelPopoverOpen}
                isMobile={isMobile}
                isButtonInRow={isButtonInRow}
                isScrolling={isScrolling}
                allowedModels={allowedModels}
              />

              {/* Style Button */}
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm',
                  selectedKusaStyle
                    ? 'bg-primary-50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/15 dark:border-primary-400/40 dark:hover:bg-primary-400/25'
                    : 'bg-primary-50/50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20',
                )}
                onClick={() => setIsStyleModalOpen(true)}>
                {selectedKusaStyle ? (
                  <img
                    src={selectedKusaStyle.image}
                    alt={selectedKusaStyle.label}
                    className='w-5 h-5 rounded object-cover'
                  />
                ) : (
                  <IoColorPaletteOutline className='w-4 h-4 text-primary-300' />
                )}
                <span className='font-medium text-primary-300 capitalize'>
                  {selectedKusaStyle ? selectedKusaStyle.label : t('Style')}
                </span>
                {selectedKusaStyle ? (
                  <div
                    role='button'
                    className='p-0.5 hover:bg-primary-200 dark:hover:bg-primary-400/20 rounded-full transition-colors text-primary-300 hover:text-primary-600'
                    onClick={e => {
                      e.stopPropagation();
                      const newPrompt = localInputValue
                        .replace(/\[[^\]]+\]\s*,?\s*/g, '')
                        .replace(/,\s*,/g, ',')
                        .replace(/^,\s*/, '')
                        .replace(/,\s*$/, '')
                        .trim();
                      debouncedSetInputValue(newPrompt);
                    }}>
                    <PiXCircle className='w-3.5 h-3.5' />
                  </div>
                ) : null}
                <FaChevronDown className='w-2.5 h-2.5 text-primary-400' />
              </div>

              {/* Grid Layout Button - Hidden for anime models */}
              {model !== 'Art Pro' &&
                model !== 'Art Unlimited' &&
                model !== 'Animagine' &&
                model !== 'Illustrious' &&
                model !== 'Noobai' &&
                model !== 'KusaXL' && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm',
                      selectedGrid
                        ? 'bg-primary-50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/15 dark:border-primary-400/40 dark:hover:bg-primary-400/25'
                        : 'bg-primary-50/50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20',
                    )}
                    onClick={() => setIsGridModalOpen(true)}>
                    {selectedGrid ? (
                      <img
                        src={selectedGrid.image}
                        alt={selectedGrid.label}
                        className='w-5 h-5 rounded object-cover'
                      />
                    ) : (
                      <BsGrid3X3Gap className='w-4 h-4 text-primary-300' />
                    )}
                    <span className='font-medium text-primary-300'>
                      {selectedGrid ? selectedGrid.label : t('Grid')}
                    </span>
                    {selectedGrid ? (
                      <div
                        role='button'
                        className='p-0.5 hover:bg-primary-200 dark:hover:bg-primary-400/20 rounded-full transition-colors text-primary-300 hover:text-primary-600'
                        onClick={e => {
                          e.stopPropagation();
                          const newPrompt = localInputValue
                            .replace(/<[^>]+>\s*,?\s*/g, '')
                            .replace(/,\s*,/g, ',')
                            .replace(/^,\s*/, '')
                            .replace(/,\s*$/, '')
                            .trim();
                          debouncedSetInputValue(newPrompt);
                        }}>
                        <PiXCircle className='w-3.5 h-3.5' />
                      </div>
                    ) : null}
                    <FaChevronDown className='w-2.5 h-2.5 text-primary-400' />
                  </div>
                )}
            </div>

            {/* Divider */}
            <div className='h-[1px] bg-primary-100 dark:bg-border' />

            <textarea
              ref={textareaRef}
              value={localInputValue}
              onChange={e => handlePromptChange(e.target.value)}
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
              placeholder={placeholder}
              className={cn(
                'pt-3 w-full h-auto bg-transparent',
                'text-sm focus:outline-none',
                'min-h-[128px]',
                'resize-none',
                'placeholder:text-muted-foreground placeholder:text-sm placeholder:leading-relaxed',
                classNames?.textarea,
              )}
              style={{
                resize: 'none',
                overflow: 'hidden',
                lineHeight: '1.6',
                wordBreak: 'break-word',
              }}
              disabled={generating}
            />
            <div className='flex justify-between items-center pt-3 border-t border-border'>
              <div
                className={cn('flex items-center', {
                  'flex-col gap-3 w-full': isButtonInRow,
                  'flex-row justify-between w-full': !isButtonInRow,
                })}>
                {/* Size and other controls */}
                <div
                  className={cn('flex items-center', {
                    'justify-between w-full': isButtonInRow,
                    'flex-row': !isButtonInRow,
                  })}>
                  {/* Image Size Button */}
                  <Dropdown
                    placement='bottom-start'
                    offset={12}
                    isOpen={isSizePopoverOpen}
                    onOpenChange={open => {
                      // 忽略滚动过程中的自动关闭
                      if (!open && isScrolling) {
                        return;
                      }
                      setIsSizePopoverOpen(open);
                    }}
                    shouldBlockScroll={false}>
                    <DropdownTrigger>
                      <Button
                        variant={isMobile ? 'flat' : 'light'}
                        size='sm'
                        className={cn('pr-1 pl-[3px]', {
                          'justify-between w-1/2': isMobile,
                          'flex-1': isButtonInRow,
                        })}
                        endContent={
                          <svg
                            className='-ml-1 w-4 h-4 text-muted-foreground'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M19 9l-7 7-7-7'></path>
                          </svg>
                        }
                        startContent={
                          sizeIcon && (
                            <div className='rounded-sm border border-muted-foreground'>
                              {sizeIcon}
                            </div>
                          )
                        }>
                        <span className='font-medium text-foreground'>
                          {size}
                        </span>
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      variant='flat'
                      aria-label='Image Size Selection'
                      className='!p-3 rounded-xl max-w-[100%] sm:max-w-[380px] z-50'
                      selectedKeys={new Set([size])}
                      selectionMode='single'
                      onSelectionChange={keys => {
                        const selectedKey = Array.from(keys)[0] as string;
                        handleSizeSelect(selectedKey);
                      }}>
                      {sizes.map(
                        (sizeOption: {
                          key: string;
                          icon: React.ReactNode;
                        }) => (
                          <DropdownItem
                            key={sizeOption.key}
                            textValue={sizeOption.key}
                            color={
                              size === sizeOption.key ? 'primary' : 'default'
                            }
                            className='px-2.5 py-1.5 data-[hover=true]:bg-default-100'
                            startContent={
                              sizeOption.icon && (
                                <div className='flex flex-shrink-0 justify-center items-center w-6 h-6'>
                                  <div className='rounded-sm border border-muted-foreground'>
                                    {sizeOption.icon}
                                  </div>
                                </div>
                              )
                            }>
                            <span className='ml-2 text-sm font-medium'>
                              {sizeOption.key}
                            </span>
                          </DropdownItem>
                        ),
                      )}
                    </DropdownMenu>
                  </Dropdown>
                  {/* Resolution Button - Only for Gemini Pro */}
                  {model === 'Gemini Pro' && (
                    <>
                      <Divider
                        orientation='vertical'
                        className='h-[20px] w-[1px] bg-border mx-[3px]'
                      />
                      <Dropdown
                        placement='bottom-start'
                        offset={12}
                        isOpen={isResolutionPopoverOpen}
                        onOpenChange={open => {
                          if (!open && isScrolling) {
                            return;
                          }
                          setIsResolutionPopoverOpen(open);
                        }}
                        shouldBlockScroll={false}>
                        <DropdownTrigger>
                          <Button
                            variant={isMobile ? 'flat' : 'light'}
                            size='sm'
                            className={cn('pr-1 pl-[3px]', {
                              'justify-between w-1/2': isMobile,
                              'flex-1': isButtonInRow,
                            })}
                            endContent={
                              <svg
                                className='-ml-1 w-4 h-4 text-muted-foreground'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                xmlns='http://www.w3.org/2000/svg'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M19 9l-7 7-7-7'></path>
                              </svg>
                            }
                            startContent={
                              <div className='flex items-center justify-center'>
                                <span className='text-[10px] font-bold text-primary-foreground bg-muted-foreground rounded-sm px-1 py-0.5 leading-none min-w-[20px] text-center'>
                                  {(resolution || '1k').toUpperCase()}
                                </span>
                              </div>
                            }>
                            <span className='font-medium text-foreground'>
                              {(resolution || '1k') === '1k'
                                ? t('resolution_standard', 'Standard')
                                : (resolution || '1k') === '2k'
                                  ? t('resolution_high', 'High')
                                  : t('resolution_ultra', 'Ultra')}
                            </span>
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          variant='flat'
                          aria-label='Resolution Selection'
                          className='!p-3 rounded-xl max-w-[100%] sm:max-w-[380px] z-50'
                          selectedKeys={new Set([resolution || '1k'])}
                          selectionMode='single'
                          onSelectionChange={keys => {
                            const selectedKey = Array.from(keys)[0] as
                              | '1k'
                              | '2k'
                              | '4k';
                            if (selectedKey) {
                              setResolution(selectedKey);
                            }
                          }}>
                          {[
                            {
                              key: '1k',
                              label:
                                t('resolution_standard', 'Standard') + ' 1K',
                            },
                            {
                              key: '2k',
                              label: t('resolution_high', 'High') + ' 2K',
                            },
                            {
                              key: '4k',
                              label: t('resolution_ultra', 'Ultra') + ' 4K',
                            },
                          ].map(resOption => (
                            <DropdownItem
                              key={resOption.key}
                              textValue={resOption.key}
                              color={
                                resolution === resOption.key
                                  ? 'primary'
                                  : 'default'
                              }
                              className='px-2.5 py-1.5 data-[hover=true]:bg-default-100'
                              startContent={
                                <div className='flex flex-shrink-0 justify-center items-center w-6 h-6'>
                                  <span className='text-[10px] font-bold text-primary-foreground bg-muted-foreground rounded-sm px-1.5 py-1 leading-none min-w-[24px] text-center'>
                                    {(resOption.key || '1k').toUpperCase()}
                                  </span>
                                </div>
                              }>
                              <span className='ml-2 text-sm font-medium'>
                                {resOption.label}
                              </span>
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                    </>
                  )}
                  {/* Image Count Button */}
                  {!isButtonInRow && showImagesCount && (
                    <>
                      <Divider
                        orientation='vertical'
                        className='h-[20px] w-[1px] bg-border mx-[3px]'
                      />
                      <Popover
                        placement='bottom-start'
                        offset={12}
                        isOpen={isNumPopoverOpen}
                        onOpenChange={open => {
                          if (!open && isScrolling) {
                            return;
                          }
                          setIsNumPopoverOpen(open);
                        }}>
                        <PopoverTrigger>
                          <Button
                            variant='light'
                            size='sm'
                            className='p-0 min-w-8'>
                            {numGenerations}x
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='!p-[14px] rounded-[10px] w-[272px] outline-[0.5px] outline-border bg-card'>
                          <div className='flex justify-between text-[16px] w-full font-[500] mb-4'>
                            <div className='text-sm text-foreground'>
                              {t('number_of_images')}
                            </div>
                            <div className='flex gap-1 items-center'>
                              <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                              {numGenerations}
                            </div>
                          </div>
                          <div className='flex w-full'>
                            <div className='overflow-hidden p-1 w-full rounded-md bg-muted'>
                              <div className='relative flex w-full h-[40px]'>
                                <div
                                  className='absolute h-full bg-card rounded shadow-sm transition-all duration-300 ease-in-out'
                                  style={{
                                    width: '25%',
                                    left: `${(numGenerations - 1) * 25}%`,
                                  }}
                                />
                                {[1, 2, 3, 4].map(num => (
                                  <div
                                    key={num}
                                    className='flex z-10 flex-1 justify-center items-center cursor-pointer'
                                    onClick={() => handleNumSelect(num)}>
                                    <span className='font-medium text-foreground'>
                                      {num}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                  {/** reference image(s) */}
                  {!hideReferenceImage && (
                    <>
                      <Divider
                        orientation='vertical'
                        className='h-[20px] w-[1px] bg-border mx-[3px]'
                      />
                      {supportsMultipleReferenceImages() ? (
                        // Multiple reference images button (for Gemini and Auto Model)
                        <Button
                          variant='light'
                          size='sm'
                          className={cn('p-0 px-1 min-w-[84px]', {
                            'bg-default/40': referenceItems.length > 0,
                            'flex-1': isButtonInRow,
                          })}
                          onPress={() => setIsReferenceModalOpen(true)}
                          startContent={
                            <PiCamera className='w-5 h-5 text-muted-foreground stroke-0 min-w-5' />
                          }>
                          <div className='flex items-center gap-1 truncate text-foreground'>
                            <div className='truncate'>
                              {t('prompt_presets.reference')}
                            </div>
                            {referenceItems.length > 0 && (
                              <span className='text-foreground'>
                                ({referenceItems.length})
                              </span>
                            )}
                          </div>
                          {referenceItems.length > 0 && (
                            <PiXCircle
                              className='w-4 h-4 cursor-pointer'
                              onClick={e => {
                                e.stopPropagation();
                                handleClearReferenceImage();
                              }}
                            />
                          )}
                        </Button>
                      ) : (
                        // Single reference image button (for other models)
                        <Button
                          variant='light'
                          size='sm'
                          className={cn('p-0 px-1 min-w-[84px]', {
                            'bg-default/40': referenceItems.length > 0,
                            'flex-1': isButtonInRow,
                          })}
                          onPress={() => {
                            if (referenceItems.length > 0) {
                              return;
                            }
                            singleReferenceImageRef.current?.click();
                          }}
                          startContent={
                            referenceItems.length > 0 ? null : (
                              <PiCamera className='w-5 h-5 text-muted-foreground stroke-0 min-w-5' />
                            )
                          }>
                          {referenceItems.length > 0 ? (
                            <img
                              src={referenceItems[0].previewUrl}
                              className='object-contain w-5 h-full'
                            />
                          ) : (
                            <div className='text-foreground'>
                              {t('prompt_presets.reference')}
                            </div>
                          )}
                          {referenceItems.length > 0 && (
                            <PiXCircle
                              className='w-4 h-4 cursor-pointer'
                              onClick={e => {
                                e.stopPropagation();
                                handleClearReferenceImage();
                              }}
                            />
                          )}
                        </Button>
                      )}
                      <input
                        ref={singleReferenceImageRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleSingleReferenceImageChange}
                      />
                    </>
                  )}
                  {/** negative prompt */}
                  {!shouldHideNegativePrompt(model) && (
                    <>
                      <Divider
                        orientation='vertical'
                        className='h-[20px] w-[1px] bg-border mx-[3px]'
                      />
                      <NegativePromptButton
                        value={negativePrompt}
                        onChange={setNegativePrompt}
                        isButtonInRow={isButtonInRow}
                      />
                    </>
                  )}
                </div>

                <div
                  className={cn('flex gap-2 items-center', {
                    'w-full': isButtonInRow,
                  })}>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-primary text-tiny font-semibold px-1',
                      {
                        'flex-1': isButtonInRow,
                      },
                    )}>
                    <Popover
                      placement='bottom-end'
                      isOpen={isMagicPopoverOpen}
                      onOpenChange={setIsMagicPopoverOpen}>
                      <PopoverTrigger>
                        <Button
                          variant='flat'
                          size='sm'
                          startContent={
                            <FaWandMagicSparkles className='w-4 h-4' />
                          }
                          className='bg-card flex-1 hover:bg-muted text-foreground font-semibold px-1'>
                          {useMagicPrompt
                            ? t('common:magic_prompt_on')
                            : t('common:magic_prompt_off')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-56 p-0 z-0 bg-card'>
                        <div className='p-4'>
                          <h4 className='font-semibold text-foreground mb-3'>
                            {t('common:magic_prompt')}
                          </h4>
                          <p className='text-sm text-muted-foreground mb-3 whitespace-normal'>
                            {t('common:magic_prompt_description')}
                          </p>
                          <div className='space-y-2'>
                            <Button
                              variant='light'
                              className={`w-full justify-start h-auto p-3 ${
                                useMagicPrompt
                                  ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handleMagicToggle(true)}>
                              <div className='flex flex-col items-start'>
                                <span className='font-medium text-foreground'>
                                  {t('common:magic_prompt_on')}
                                </span>
                              </div>
                            </Button>
                            <Button
                              variant='light'
                              className={`w-full justify-start h-auto p-3 ${
                                !useMagicPrompt
                                  ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handleMagicToggle(false)}>
                              <div className='flex flex-col items-start'>
                                <span className='font-medium text-foreground'>
                                  {t('common:magic_prompt_off')}
                                </span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <PublicVisibilityToggle
                    isPublic={isPublic}
                    onToggle={setIsPublic}
                    label={t('common:publicVisibility.public')}
                    showCrown={false}
                    variant='inline'
                  />

                  <Button
                    size='sm'
                    type='button'
                    className={cn(
                      'text-sm h-9 rounded-xl gap-1.5 relative !overflow-visible min-w-[110px] font-semibold bg-primary-500 hover:bg-primary-600 text-primary-foreground shadow-md px-5',
                      { 'w-full flex-1': isButtonInRow },
                    )}
                    isDisabled={!localInputValue.trim()}
                    isLoading={generating}
                    onClick={handleGenerateClick}>
                    {!stackChip && (
                      <PiStarFourFill className='w-4 h-4 min-w-4 min-h-4' />
                    )}
                    {currentSelectedShape?.type == DrawAction.Rectangle
                      ? btnTextInside
                      : btnText}
                    <Chip
                      startContent={
                        <BiSolidZap className='mr-0 w-3 h-3 text-yellow-400' />
                      }
                      variant='flat'
                      size='sm'
                      className='bg-background/90 text-muted-foreground text-[10px] scale-[0.85] absolute top-full -translate-y-1/2 left-0 right-0 mx-auto w-fit shadow-sm'>
                      {cost} / {profile?.credit ?? '...'}
                    </Chip>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {textareaRef.current && (
            <RecommendTags
              text={localInputValue}
              setText={text => debouncedSetInputValue(text as string)}
              inputElement={textareaRef.current}
              className='z-50'
              excludeKeywords={excludeKeywords}
            />
          )}
          {/* Mention dropdown for @character mentions */}
          <MentionDropdown
            show={showMentionDropdown}
            position={dropdownPosition}
            loading={loadingCharacters}
            characters={filteredCharacters}
            dropdownRef={mentionDropdownRef}
            onSelect={selectCharacterFromDropdown}
            onClose={() => setShowMentionDropdown(false)}
          />
        </div>
        <PromptEditor
          prompt={localInputValue}
          setPrompt={debouncedSetInputValue}
          isMobile={isMobile}
          referenceImage={referenceImage}
          setReferenceImage={setReferenceImage}
          showPreset={showPreset}
          classNames={classNames}
          model={model}
          setModel={setModel}
          isCreatePage={stackChip}
          isPromptReferenceCollapsed={actualIsPromptReferenceCollapsed}
          setIsPromptReferenceCollapsed={actualSetIsPromptReferenceCollapsed}
          availableCharacters={availableCharacters}
          isCharacterMentioned={isCharacterMentioned}
          handleToggleCharacterMention={handleToggleCharacterMention}>
          {children}
        </PromptEditor>

        <ReferenceImagesModal
          isOpen={isReferenceModalOpen}
          onClose={() => setIsReferenceModalOpen(false)}
          references={referenceItems}
          setReferences={setReferenceItems}
          onInsertName={name => {
            const token = name; // do not wrap with <>
            debouncedSetInputValue(
              `${localInputValue?.trim() ? localInputValue.trim() + ', ' : ''}${token}`,
            );
          }}
          onDeleteImage={item => {
            // If the deleted image is a character image (name starts with @), remove the mention from prompt
            if (item.name?.startsWith('@')) {
              const mention = item.name;
              let newPrompt = localInputValue
                .replace(new RegExp(`\\s*,?\\s*${mention}\\s*,?\\s*`, 'g'), ' ')
                .replace(/\s+/g, ' ')
                .trim();
              if (newPrompt !== localInputValue) {
                // Use immediate update instead of debounced to ensure UI sync
                setLocalInputValue(newPrompt);
                debouncedSetInputValue(newPrompt);
              }
            }
          }}
        />

        <StyleSelectorModal
          isOpen={isStyleModalOpen}
          onClose={() => setIsStyleModalOpen(false)}
          prompt={localInputValue}
          setPrompt={debouncedSetInputValue}
          styles={stylesData}
          onLoginOpen={loginModal?.onOpen}
          setModel={setModel}
        />

        <GridSelectorModal
          isOpen={isGridModalOpen}
          onClose={() => setIsGridModalOpen(false)}
          prompt={localInputValue}
          setPrompt={debouncedSetInputValue}
          gridData={gridData}
          setModel={setModel}
        />

        {/* <Button color="secondary" variant="shadow" size="sm" className="mt-3 text-sm h-[34px] rounded-xl" isLoading={generating} onClick={onArchive}>
                            {"Archive"}
                        </Button>
                    <div>
                        {history.map((i) => (
                            <div onClick={() => onCheckoutVersion(i.versionId)} key={i.versionId}>
                                version: {i.versionId}
                            </div>
                        ))}
                    </div>
                    */}

        {/*
                    <ImageUploader
                        currentSelectedShape={currentSelectedShape}
                        images={charImages}
                        setImages={setCharImages}
                        selectedIds={selectedCharIds}

                        setSelectedIds={setSelectedCharIds}
                        label="Characters"
                        hint="Upload a character image to ensure consistent character generation"
                    />
                    <Divider className="mt-5 mb-3" />
                    <Tooltip content="Take precise control of your character's pose with our 3D pose creation tool. Tip: Always describe the character's pose and action in detail in your prompt. If the result isn't as expected, use the pose control feature for greater precision.">
                        <div className="flex items-center mb-1">
                            <div className="text-sm"><b>Pose control</b></div>
                            <HiOutlineQuestionMarkCircle className="ml-1" />
                        </div>
                    </Tooltip>
                    {poseImageUrl && <div className={"overflow-hidden relative flex-none pt-1 pr-1 pb-1 mb-1 rounded-xl z-1 w-[150px]"}>
                        <Image
                            isZoomed
                            src={poseImageUrl}
                            alt="Pose preview"
                            className="object-cover w-full h-full rounded-xl z-1"
                        // width={150}
                        // height={150}
                        />
                        <Checkbox
                            className="absolute top-3 left-3 z-10"
                            size="lg"
                            isSelected={true}
                        />
                        <button
                            className="absolute top-[-0px] right-[-0px] z-50 pb-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-border bg-card text-foreground"
                            onClick={() => setPoseImageUrl("")}
                        >
                            <b>×</b>
                        </button>
                    </div>
                    }
                    <Button fullWidth color="primary" variant="shadow" size="sm" className="mt-1 text-sm h-[34px] rounded-xl" onClick={() => setIsPoseEditorVisible(true)}>
                        {poseString && poseImageUrl ? "Edit pose" : "Create new pose"}
                    </Button>
                    <Modal size="5xl" className="h-[80%]" isOpen={isPoseEditorVisible} onClose={() => {
                        setIsPoseEditorVisible(false);
                    }} >
                        <ModalContent>
                            {(onClose) => (
                                <PoseEditor poseString={poseString} onSave={(poseString: string, imageUrl: string) => {
                                    setIsPoseEditorVisible(false);
                                    setPoseString(poseString);
                                    setPoseImageUrl(imageUrl);
                                }} />
                            )}
                        </ModalContent>

                    </Modal>
                    <Divider className="mt-5 mb-3" />
                    <ImageUploader
                        currentSelectedShape={currentSelectedShape}
                        images={outfitImages}
                        setImages={setOutfitImages}
                        selectedIds={selectedOutfitIds}
                        setSelectedIds={setSelectedOutfitIds}
                        label="Outfits"
                        hint="Choose a full-body character image on the canvas to apply the selected outfit"
                    />
                    <Button fullWidth color="primary" variant="shadow" size="sm" className="mt-3 text-sm h-[34px] rounded-xl" onClick={changeOutfit} isDisabled={!(selectedOutfitIds.length > 0 && currentSelectedShape?.node instanceof Konva.Image)}>
                        {"Change outfit"}
                    </Button> */}

        {/* <PricingModal title="No Credits, Buy Now" profile={profile} /> */}
      </div>
    );
  },
);

// Add display name for debugging
ImageGenerationControllerInner.displayName = 'ImageGenerationController';

// Export with memo to prevent unnecessary re-renders
// memo correctly preserves ref forwarding from forwardRef
export const ImageGenerationController = memo(
  ImageGenerationControllerInner,
) as typeof ImageGenerationControllerInner;

const RightSidebar = ({
  onImageLoaded,
  onElementChange,
  currentSelectedShape,
  onCheckoutVersion,
  onArchive,
  displayComicBg,
  setDisplayComicBg,
  setBgWidth,
  setBgHeight,
  bgWidth,
  bgHeight,
  handleExport,
  isMobile,
}: SidebarProps) => {
  const { t } = useTranslation('create');
  const [inputValue, setInputValue] = useState('');
  const [margin, setMargin] = useState<number>(0);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 top-auto z-20 px-0 pb-3 pt-0 bg-background rounded-t-xl border-l border-border shadow-xl xs:bg-muted xs:dark:bg-background md:bg-background xs:w-full md:w-[380px]',
        isMobile ? 'px-1' : 'px-0',
      )}
      style={{
        boxShadow:
          '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)',
        height: isMobile ? (showSidebar ? '70%' : '0px') : 'calc(100% - 50px)',
        width: isMobile ? '100%' : '380px',
      }}>
      {isMobile && (
        <Button
          isIconOnly
          className='absolute right-2 -top-11 bg-muted rounded-full shadow-md FoldupButton z-10000 text-muted-foreground'
          onClick={() => setShowSidebar(!showSidebar)}>
          {showSidebar ? (
            <FaCaretDown color={'currentColor'} />
          ) : (
            <FaCaretUp color={'currentColor'} />
          )}
        </Button>
      )}
      {isMobile && showSidebar && (
        <div className='overflow-y-auto px-1 w-full'>
          <ImageGenerationController
            inputValue={inputValue}
            setInputValue={setInputValue}
            currentSelectedShape={currentSelectedShape}
            onImageLoaded={onImageLoaded}
            isMobile={isMobile}
            optionStyle='compact'
            stackChip={false}
            showImagesCount={true}
            classNames={{
              textarea: 'text-base',
              leftSidebar: 'w-full',
            }}
            needPromptReferenceCollapsed={false}
          />
        </div>
      )}

      {!isMobile && (
        <div className='pt-1'>
          <div className='p-2'>
            <Tabs aria-label='Options' radius='full' fullWidth>
              <Tab
                key='photos'
                className='group data-[hover=true]:bg-muted rounded-lg transition-all'
                title={
                  <div className='flex items-center px-2 py-2 space-x-2 w-full rounded-lg transition-all'>
                    <FaWandMagicSparkles className='text-xl' />
                    <span className='font-medium'>{t('generation')}</span>
                  </div>
                }>
                <ImageGenerationController
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  currentSelectedShape={currentSelectedShape}
                  onImageLoaded={onImageLoaded}
                  isMobile={isMobile}
                  optionStyle='compact'
                  needPromptReferenceCollapsed={false}
                />
              </Tab>
              <Tab
                key='music'
                className='group data-[hover=true]:bg-muted rounded-lg transition-all'
                title={
                  <div className='flex items-center px-2 py-2 space-x-2 w-full text-foreground rounded-lg transition-all'>
                    <FiSettings className='text-xl' />
                    <span className='font-medium'>{t('canvas')}</span>
                  </div>
                }>
                <Switch
                  className='mt-2'
                  size='sm'
                  isSelected={displayComicBg}
                  onChange={e => setDisplayComicBg(e.target.checked)}>
                  <Tooltip content={t('show_background_tooltip')}>
                    <div className='flex items-center'>
                      <div className='text-sm text-foreground'>
                        {t('show_background')}
                      </div>
                      <HiOutlineQuestionMarkCircle className='ml-1' />
                    </div>
                  </Tooltip>
                </Switch>
                <div className='flex justify-between items-center mt-3'>
                  <div className='text-sm text-foreground'>
                    {t('background_width')}
                  </div>
                  <Input
                    type='number'
                    size='sm'
                    placeholder=''
                    className='w-[100px]'
                    value={bgWidth.toString()}
                    onChange={e => setBgWidth(Number(e.target.value))}
                  />
                </div>
                <div className='flex justify-between items-center mt-3 mb-3'>
                  <div className='text-sm text-foreground'>
                    {t('background_height')}
                  </div>
                  <Input
                    type='number'
                    size='sm'
                    placeholder=''
                    className='w-[100px]'
                    value={bgHeight.toString()}
                    onChange={e => setBgHeight(Number(e.target.value))}
                  />
                </div>
                <Slider
                  size='sm'
                  className='mt-3 mb-4'
                  step={5}
                  maxValue={100}
                  minValue={0}
                  showSteps={true}
                  aria-label='stroke'
                  value={margin}
                  label={
                    <Tooltip content={t('export_margin_tooltip')}>
                      <div className='flex items-center mb-2'>
                        <div className='text-sm text-foreground'>
                          {t('export_margin')}
                        </div>
                        <HiOutlineQuestionMarkCircle className='ml-1' />
                      </div>
                    </Tooltip>
                  }
                  onChange={(v: number | number[]) => {
                    setMargin(v as number);
                  }}
                />
                <Button
                  fullWidth
                  color='default'
                  variant='flat'
                  size='md'
                  className='mt-1 rounded-xl'
                  onClick={() => {
                    try {
                      mixpanel.track('export.image', {
                        margin: margin,
                      });
                    } catch (error) {}
                    handleExport(margin, false);
                  }}>
                  {t('export_as_png')}
                </Button>
              </Tab>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
