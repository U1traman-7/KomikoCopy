import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useLayoutEffect as reactUseLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import {
  Button,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
} from '@nextui-org/react';
import {
  MdOutlineAnimation,
  MdPalette,
  MdSportsEsports,
  MdMovie,
  MdMap,
  MdTexture,
  MdCheckroom,
  MdTheaterComedy,
  MdMenu,
  MdTrendingUp,
  MdPets,
  MdSearch,
  MdOutlineColorLens,
  MdCardGiftcard,
  MdFace,
  MdOutlineEmojiEmotions,
  MdOutlineDraw,
  MdAutoAwesome,
  MdFlashOn,
  MdAutoFixHigh,
  MdMusicNote,
  MdMic,
  MdStars,
  MdDirectionsRun,
  MdVideoLibrary,
  MdRecordVoiceOver,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import {
  getTrendingStyleIds,
  ImageStyleTemplate,
  ImageStyleTemplateCategory,
  VideoStyleTemplate,
  VideoStyleTemplateCategory,
} from './styles/index';

import {
  i2iStyleTemplatesCategories,
  getI2IStyleTemplatesCategories,
  getTrendingImageStylesId,
} from './styles/image';
import {
  getEffectTemplates,
  getEffectTemplatesSync,
  getTrendingStylesId,
  getTrendingStylesIdSync,
} from './styles/video';
import { templateDataManager } from '../../utils/templateCache';
import useMediaQuery from '@/hooks/use-media-query';
import LazyRender from '../common/LazyRender';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { profileAtom } from 'state';
import { useOpenModal } from '@/hooks/useOpenModal';
import { useSingleVideoPlayback } from '@/hooks/useSingleVideoPlayback';
import { ImageCard } from './Cards/ImageCard';
import { EffectCard } from './Cards/VideoCard';
import { TbChristmasTreeFilled } from 'react-icons/tb';

// 通用模板类型
export type TemplateType = ImageStyleTemplate | VideoStyleTemplate;
export type TemplateCategoryType =
  | ImageStyleTemplateCategory
  | VideoStyleTemplateCategory;

export interface StyleTemplatesPickerProps {
  selectedStyle: string;
  onSelect: (style: TemplateType, source?: 'modal' | 'quick') => void;
  recommendedStyleIds?: string[];
  className?: string;
  tool: string;
  // 模板类型：'image' 用于图片样式，'video' 用于视频效果
  templateType?: 'image' | 'video';
  // 视频模板相关
  onUploadedVideoChange?: (
    file: File | null,
    tempUrl: string | null,
    duration: number,
  ) => void;
  // 自定义卡片渲染（可选）
  renderCard?: (
    template: TemplateType,
    selected: boolean,
    onClick: () => void,
  ) => React.ReactNode;
}

export interface StyleTemplatesPickerRef {
  onOpen: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  palette: MdOutlineColorLens,
  game: MdSportsEsports,
  film: MdMovie,
  anime: MdOutlineAnimation,
  texture: MdTexture,
  map: MdMap,
  wardrobe: MdCheckroom,
  masks: MdTheaterComedy,
  animal: MdPets,
  art: MdOutlineColorLens,
  gift: MdCardGiftcard,
  face: MdFace,
  draw: MdOutlineDraw,
  emoji: MdOutlineEmojiEmotions,
  pen: MdOutlineDraw,
  // 视频效果图标
  sparkles: MdAutoAwesome,
  bolt: MdFlashOn,
  magic: MdAutoFixHigh,
  music: MdMusicNote,
  microphone: MdMic,
  stars: MdStars,
  transformation: MdAutoFixHigh,
  action: MdDirectionsRun,
  vibe: MdAutoAwesome,
  performance: MdRecordVoiceOver,
  christmas: TbChristmasTreeFilled,
};

const renderIcon = (key: string, className = 'w-4 h-4') => {
  const Icon = iconMap[key] || MdOutlineAnimation;
  return <Icon className={className} />;
};

const StyleTemplatesPicker = forwardRef<
  StyleTemplatesPickerRef,
  StyleTemplatesPickerProps
>(function StyleTemplatesPicker(
  {
    selectedStyle,
    onSelect,
    recommendedStyleIds,
    className,
    tool,
    templateType = 'image',
    onUploadedVideoChange,
    renderCard,
  }: StyleTemplatesPickerProps,
  ref,
) {
  // Avoid SSR warning: use layout effect only on client
  const { t } = useTranslation('style-templates');
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? reactUseLayoutEffect : useEffect;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isMobile } = useMediaQuery();

  // 视频相关
  const isVideoTemplate = templateType === 'video';
  useSingleVideoPlayback(); // 视频播放控制

  useImperativeHandle(ref, () => ({
    onOpen,
  }));

  // VIP 相关状态
  const profile = useAtomValue(profileAtom);
  const [isVip, setIsVip] = useState(false);
  const { submit: openModal } = useOpenModal();

  // 模板数据状态
  const [imageTemplates, setImageTemplates] = useState(
    i2iStyleTemplatesCategories,
  );
  const [videoTemplates, setVideoTemplates] = useState(getEffectTemplatesSync);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  // Trending IDs 状态 - 用于触发 trendingStyles 的重新计算
  const [trendingIds, setTrendingIds] = useState<Record<string, string[]>>(
    getTrendingStyleIds,
  );

  useEffect(() => {
    if (profile?.plan_codes?.length > 0 || profile.is_cpp) {
      setIsVip(true);
    } else {
      setIsVip(false);
    }
  }, [profile?.plan_codes, profile?.is_cpp]);

  // 加载模板数据的公共函数
  const fetchAndUpdateTemplates = useCallback(
    async (options: { isInitialLoad?: boolean; showLoading?: boolean } = {}) => {
      const { isInitialLoad = false, showLoading = false } = options;

      if (showLoading) {
        setIsLoadingTemplates(true);
      }

      try {
        const [
          imageTemplatesFromDB,
          videoTemplatesFromDB,
          trendingVideoStylesFromDB,
          trendingImageStylesFromDB,
        ] = await Promise.all([
          getI2IStyleTemplatesCategories(),
          getEffectTemplates(),
          getTrendingStylesId(),
          getTrendingImageStylesId(),
        ]);

        // 更新 image templates
        if (imageTemplatesFromDB && imageTemplatesFromDB.length > 0) {
          setImageTemplates(imageTemplatesFromDB);
        } else if (isInitialLoad) {
          // 初次加载时使用静态数据作为回退
          console.log('[StyleTemplatePicker] Using static image templates fallback');
          setImageTemplates(i2iStyleTemplatesCategories);
        }

        // 更新 video templates
        if (videoTemplatesFromDB && videoTemplatesFromDB.length > 0) {
          setVideoTemplates(videoTemplatesFromDB);
        } else if (isInitialLoad) {
          console.log('[StyleTemplatePicker] Using static video templates fallback');
          setVideoTemplates(getEffectTemplatesSync());
        }

        // 更新 trending IDs 状态以触发重新渲染
        setTrendingIds(getTrendingStyleIds());

        console.log('[StyleTemplatePicker] Templates loaded:', {
          imageCategories: imageTemplatesFromDB?.length || 'fallback',
          videoCategories: videoTemplatesFromDB?.length || 'fallback',
          trendingVideoStyles: trendingVideoStylesFromDB?.length || 0,
          trendingImageStyles: trendingImageStylesFromDB?.length || 0,
        });
      } catch (error) {
        console.error('[StyleTemplatePicker] Failed to load templates:', error);
        if (isInitialLoad) {
          // 初次加载发生错误时使用静态数据
          setImageTemplates(i2iStyleTemplatesCategories);
          setVideoTemplates(getEffectTemplatesSync());
        }
      } finally {
        if (showLoading) {
          setIsLoadingTemplates(false);
        }
      }
    },
    [],
  );

  // 初次加载和监听数据变化
  useEffect(() => {
    // 初次加载
    fetchAndUpdateTemplates({ isInitialLoad: true, showLoading: true });

    // 监听全局缓存的数据变化
    const unsubscribe = templateDataManager.addDataChangeListener(() => {
      console.log('[StyleTemplatePicker] Data change detected, refreshing...');
      fetchAndUpdateTemplates({ isInitialLoad: false, showLoading: false });
    });

    return unsubscribe;
  }, [fetchAndUpdateTemplates]);

  // Scroll helper to align target to the top of a scrollable container
  const scrollTargetIntoContainer = (
    container: HTMLElement,
    target: HTMLElement,
    behavior: ScrollBehavior,
    offset = 8, // 保持与 mt-2 一致的间距
  ) => {
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top =
      container.scrollTop + (targetRect.top - containerRect.top) - offset;
    try {
      container.scrollTo({ top: Math.max(0, top), behavior });
    } catch {
      target.scrollIntoView({ behavior, block: 'start' });
    }
  };

  const viewAllBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 清空待选高亮状态
      setPendingStyleId(null);
      onOpen();
      return;
    }
    // closing
    onOpenChange();
    setIsCatMenuOpen(false);

    // 清空搜索输入
    setSearchQuery('');

    // 清理可能残留的 NextUI 背景层，避免遮挡
    requestAnimationFrame(() => {
      const lingering = document.querySelectorAll(
        '.nextui-backdrop,[data-slot="backdrop"],[data-slot="wrapper"]',
      );
      lingering.forEach(el => {
        const root = el.closest('[data-open="true"]');
        if (!root) (el as HTMLElement).remove();
      });

      // 失焦以避免 focus 导致的滚动跳动
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === 'function') {
        active.blur();
      }
    });
  };

  const categories = useMemo<TemplateCategoryType[]>(() => {
    // 如果是视频模式，返回视频效果分类
    if (templateType === 'video') {
      return videoTemplates as TemplateCategoryType[];
    }

    // 否则返回图片样式模板分类
    const allCategories = (imageTemplates ||
      []) as ImageStyleTemplateCategory[];

    // Default: show all
    if (!tool) return allCategories;

    // Build a generic per-tool filter with backward compatibility
    const isV2V = tool === 'video-to-video';
    const isPlayground = tool === 'playground';

    // If not V2V or Playground, return all
    if (!isV2V && !isPlayground) return allCategories;

    return allCategories
      .filter(category => {
        // Category-level flags. Default is true (visible) when flag is undefined
        if (isV2V && category.supportV2V === false) return false;
        if (isPlayground && category.supportPlayground === false) return false;

        // Filter templates within the category
        const supportedTemplates =
          category.templates?.filter((template: ImageStyleTemplate) => {
            if (isV2V && template.supportV2V === false) return false;
            if (isPlayground && template.supportPlayground === false)
              return false;
            return true;
          }) || [];

        // Only include category if it has supported templates
        return supportedTemplates.length > 0;
      })
      .map(category => ({
        ...category,
        templates:
          category.templates?.filter((template: ImageStyleTemplate) => {
            if (isV2V && template.supportV2V === false) return false;
            if (isPlayground && template.supportPlayground === false)
              return false;
            return true;
          }) || [],
      }));
  }, [tool, templateType, imageTemplates, videoTemplates]);

  const allStyles = useMemo(
    () => categories.flatMap(c => c.templates as TemplateType[]),
    [categories],
  );
  const totalStyleCount = allStyles.length;
  const recommendedStyles = useMemo(() => {
    if (recommendedStyleIds && recommendedStyleIds.length > 0) {
      const order = new Map<string, number>(
        recommendedStyleIds.map((id, idx) => [id, idx]),
      );
      const filtered = allStyles
        .filter((s: any) => order.has(s.id))
        .sort((a: any, b: any) => order.get(a.id)! - order.get(b.id)!);
      if (filtered.length > 0) return filtered.slice(0, 4);
    }
    return allStyles.slice(0, 4);
  }, [allStyles, recommendedStyleIds]);

  const trendingStyles = useMemo(() => {
    const currentTrendingIds = trendingIds[tool] || [];
    const idSet = new Set(currentTrendingIds);
    const styleById: Record<string, TemplateType> = {};
    for (const s of allStyles) {
      if (idSet.has(s.id)) styleById[s.id] = s;
    }
    return currentTrendingIds
      .map((id: string) => styleById[id])
      .filter(Boolean) as TemplateType[];
  }, [allStyles, tool, trendingIds]);

  // Search helpers
  const normalize = (v: string) => (v || '').toLowerCase().trim();
  const matchesQuery = (s: TemplateType, q: string) => {
    if (!q) return true;
    const qn = normalize(q);
    const id = normalize(s.id);
    let name = '';
    try {
      name = normalize(t(s.nameKey));
    } catch {}

    // 原有的包含检查
    if (id.includes(qn) || name.includes(qn)) return true;

    // 共同前缀模糊匹配
    const hasPrefixMatch = (target: string) => {
      if (!target) return false;
      let commonLen = 0;
      const maxLen = Math.min(qn.length, target.length);
      for (let i = 0; i < maxLen; i++) {
        if (qn[i] === target[i]) commonLen++;
        else break;
      }
      // 共同前缀至少3字符，且至少占较短串的一半
      return (
        commonLen >= 3 && commonLen >= Math.min(qn.length, target.length) * 0.5
      );
    };

    return hasPrefixMatch(id) || hasPrefixMatch(name);
  };

  const selectedStyleObject = useMemo(() => {
    return allStyles.find(s => s.id === selectedStyle);
  }, [allStyles, selectedStyle]);

  const recommendedOrdered = useMemo(() => {
    // 如果当前选中样式不在推荐中，将其追加到末尾
    const base = recommendedStyles.slice(0, 4);
    if (!selectedStyleObject) return base;
    const exists = base.some(s => s.id === selectedStyleObject.id);
    return exists
      ? base
      : [...base.slice(0, 3), selectedStyleObject].slice(0, 4);
  }, [recommendedStyles, selectedStyleObject]);

  const [tabKey, setTabKey] = useState<string>('all');
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 检查tabs是否可以左右滚动
  const updateScrollButtons = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // 滚动tabs
  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const scrollAmount = 150;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // 监听tabs滚动 - modal打开后查找tabList
  useEffect(() => {
    if (!isOpen) {
      tabsScrollRef.current = null;
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    let intervalId: NodeJS.Timeout;

    const findAndSetupTabList = () => {
      const container = tabsContainerRef.current;
      if (!container) return false;

      const tabList = container.querySelector(
        '[role="tablist"]',
      ) as HTMLDivElement | null;

      if (tabList) {
        tabsScrollRef.current = tabList;
        updateScrollButtons();
        tabList.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);
        return true;
      }
      return false;
    };

    // 多次尝试查找，确保 DOM 已渲染
    intervalId = setInterval(() => {
      attempts++;
      if (findAndSetupTabList() || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 50);

    return () => {
      clearInterval(intervalId);
      const el = tabsScrollRef.current;
      if (el) {
        el.removeEventListener('scroll', updateScrollButtons);
      }
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [isOpen, updateScrollButtons]);

  // 当 categories 变化时更新滚动按钮
  useEffect(() => {
    if (isOpen && tabsScrollRef.current) {
      // 延迟一帧让 DOM 更新
      requestAnimationFrame(updateScrollButtons);
    }
  }, [categories, isOpen, updateScrollButtons]);

  // Filtered views based on search
  const filteredTrendingStyles = useMemo<TemplateType[]>(() => {
    if (!searchQuery.trim()) return trendingStyles;
    return trendingStyles.filter(s => {
      return matchesQuery(s, searchQuery);
    });
  }, [trendingStyles, searchQuery, t]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories
      .map(cat => ({
        ...cat,
        templates: (cat.templates || []).filter((s: TemplateType) =>
          matchesQuery(s, searchQuery),
        ),
      }))
      .filter(cat => (cat.templates || []).length > 0);
  }, [categories, searchQuery, matchesQuery]);

  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [pendingStyleId, setPendingStyleId] = useState<string | null>(null);

  useEffect(() => {
    setPendingStyleId(null);
  }, [selectedStyle]);

  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // reset refs when categories change to avoid stale nodes
    categorySectionRefs.current = {};
  }, [categories]);

  // Auto-scroll the selected tab into view (mobile) when changed via dropdown
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const root = tabsContainerRef.current;
    if (!root) return;
    const el = root.querySelector(
      `[data-key="${tabKey}"]`,
    ) as HTMLElement | null;

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [tabKey, isMobile, isOpen]);

  // Ensure dropdown overlay does not linger when modal closes
  useEffect(() => {
    if (!isOpen && isCatMenuOpen) setIsCatMenuOpen(false);
  }, [isOpen, isCatMenuOpen]);

  // When switching tabs, scroll the body to the corresponding category heading
  useEffect(() => {
    if (!isOpen) return;
    const root = bodyScrollRef.current;
    if (!root) return;
    if (tabKey === 'all') {
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = categorySectionRefs.current[tabKey];
    if (target) {
      scrollTargetIntoContainer(root, target, 'smooth');
    }
  }, [tabKey, isOpen]);

  // When the modal opens, restore scroll to the previously selected tab/section
  // Use layout effect on client (no-op on server) so scroll happens before first paint to avoid flicker
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    const doScrollRestore = () => {
      // Scroll tab header to selected tab
      if (isMobile) {
        const tabsRoot = tabsContainerRef.current;
        if (tabsRoot) {
          const el = tabsRoot.querySelector(
            `[data-key="${tabKey}"]`,
          ) as HTMLElement | null;
          if (el) {
            el.scrollIntoView({
              behavior: 'auto',
              inline: 'center',
              block: 'nearest',
            });
          }
        }
      }
      // Scroll body to selected section
      const root = bodyScrollRef.current;
      if (!root) return;
      if (tabKey === 'all') {
        root.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
      const target = categorySectionRefs.current[tabKey];
      if (target) {
        scrollTargetIntoContainer(root, target, 'auto');
      }
    };

    // Immediate try before first paint
    doScrollRestore();
    // Retry on next frames to wait for layout/portals/images without causing smooth flicker
    let tries = 0;
    let raf = 0;
    const step = () => {
      tries += 1;
      doScrollRestore();
      if (tries < 6) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, tabKey, isMobile]);

  const renderTemplateCard = (template: TemplateType) => {
    const selected = (pendingStyleId || selectedStyle) === template.id;
    const onClick = () => {
      setPendingStyleId(template.id);
      onSelect(template, isOpen ? 'modal' : 'quick');
      if (isOpen) {
        handleOpenChange(false);
      }
    };

    // 如果提供了自定义渲染函数，使用它
    if (renderCard) {
      return renderCard(template, selected, onClick);
    }

    // 否则根据模板类型选择默认卡片
    if (templateType === 'video') {
      return (
        <EffectCard
          key={template.id}
          template={template as VideoStyleTemplate}
          selected={selected}
          onClick={onClick}
        />
      );
    }

    // 默认使用图片卡片
    return (
      <ImageCard
        key={template.id}
        style={template as ImageStyleTemplate}
        selected={selected}
        onClick={onClick}
        isVip={isVip}
        onOpenModal={() => openModal('pricing')}
      />
    );
  };

  return (
    <div className={className}>
      {/* Quick pick */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs text-foreground'>{t('ui.selectAStyle')}</span>
        <button
          type='button'
          ref={viewAllBtnRef}
          onClick={() => {
            // 仅在 modal 未打开时才处理
            if (!isOpen) {
              onOpen();
            }
          }}
          className='text-primary-600 hover:text-primary-500 transition-colors text-xs font-medium cursor-pointer hover:underline'>
          {t('ui.viewAll')} ({totalStyleCount})
        </button>
      </div>

      <div
        className={
          isVideoTemplate
            ? 'grid grid-cols-2 gap-1'
            : 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-4 gap-1'
        }>
        {recommendedOrdered.map(renderTemplateCard)}
      </div>

      {/* Modal - bottom sheet on mobile, centered on larger screens */}
      {isOpen && (
        <Modal
          isOpen
          scrollBehavior='inside'
          onOpenChange={handleOpenChange}
          isDismissable={true}
          hideCloseButton={false}
          shouldBlockScroll={true}
          placement={isMobile ? 'bottom' : 'center'}
          classNames={{ wrapper: 'z-50', backdrop: 'z-50' }}>
          <ModalContent className='mx-2 sm:mx-auto w-[calc(100vw-1rem)] sm:w-auto  md:max-w-4xl'>
            <>
              <ModalHeader className='flex items-center justify-between pb-1'>
                <div className='flex items-center gap-2 text-foreground'>
                  <span>{t('ui.styleTemplatesTitle')}</span>
                </div>
                <div className='hidden sm:block'>
                  <Input
                    size='sm'
                    variant='bordered'
                    radius='full'
                    placeholder={t('ui.search', {
                      defaultValue: 'Search styles',
                    })}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    startContent={
                      <MdSearch className='w-4 h-4 text-default-400' />
                    }
                    classNames={{ inputWrapper: 'h-8', input: 'text-xs' }}
                    aria-label='Search styles'
                  />
                </div>
              </ModalHeader>
              <ModalBody className='overflow-visible pt-0 gap-0 px-0'>
                <div className='sm:sticky sm:top-0 z-10 bg-card'>
                  {/* Mobile search input */}
                  <div className='px-2 pt-1 pb-2 md:hidden'>
                    <Input
                      size='sm'
                      variant='bordered'
                      radius='full'
                      placeholder={t('ui.search', {
                        defaultValue: 'Search styles',
                      })}
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      startContent={
                        <MdSearch className='w-4 h-4 text-default-400' />
                      }
                      classNames={{ inputWrapper: 'h-9', input: 'text-sm' }}
                      aria-label='Search styles'
                    />
                  </div>

                  <div
                    ref={tabsContainerRef}
                    className='relative overflow-hidden'>
                    {/* 左滚动按钮 */}
                    <button
                      type='button'
                      onClick={() => scrollTabs('left')}
                      aria-label='Scroll left'
                      className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center bg-card/95 hover:bg-muted rounded-full shadow-sm transition-all ${
                        canScrollLeft
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      }`}>
                      <MdChevronLeft className='w-4 h-4 text-muted-foreground' />
                    </button>

                    {/* 右滚动按钮 */}
                    <button
                      type='button'
                      onClick={() => scrollTabs('right')}
                      aria-label='Scroll right'
                      className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center bg-card/95 hover:bg-muted rounded-full shadow-sm transition-all ${
                        canScrollRight
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      }`}>
                      <MdChevronRight className='w-4 h-4 text-muted-foreground' />
                    </button>

                    {/* Mobile dropdown menu */}
                    <div className='absolute right-1 -top-0 z-20 md:hidden'>
                      <Dropdown
                        isOpen={isCatMenuOpen}
                        onOpenChange={setIsCatMenuOpen}>
                        <DropdownTrigger>
                          <Button
                            size='sm'
                            variant='flat'
                            isIconOnly
                            className='min-w-0 bg-card rounded-none'
                            onMouseEnter={() => setIsCatMenuOpen(true)}>
                            <MdMenu className='w-4 h-4 text-muted-foreground mt-1' />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label='Style categories'
                          onAction={key => {
                            setTabKey(key as string);
                            setIsCatMenuOpen(false);
                          }}
                          selectionMode='single'
                          items={[
                            { key: 'all', name: t('ui.all') },
                            { key: 'trending', name: t('ui.trending') },
                            ...categories.map(c => ({
                              key: c.category,
                              name: t(c.category),
                            })),
                          ]}>
                          {(item: any) => (
                            <DropdownItem key={item.key} textValue={item.name}>
                              {item.name}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    <Tabs
                      selectedKey={tabKey}
                      onSelectionChange={key => setTabKey(key as string)}
                      size='sm'
                      variant='underlined'
                      color='primary'
                      className='w-full px-2 sm:px-6'
                      classNames={{
                        tabList:
                          'relative w-full overflow-x-auto flex-nowrap justify-start gap-0 border-b border-divider pb-0 scroll-smooth pr-10 sm:pr-6',
                        tab: 'flex-none shrink-0 px-3 py-0 whitespace-nowrap max-w-fit transition-colors duration-300 text-sm',
                        cursor:
                          'w-full bg-primary transition-all duration-300 ease-out',
                        tabContent:
                          'text-xs sm:text-sm text-default-foreground dark:text-foreground group-data-[selected=true]:text-primary transition-colors duration-300',
                      }}>
                      <Tab
                        key='all'
                        title={
                          <span className='whitespace-nowrap'>
                            {t('ui.all')}
                          </span>
                        }
                      />
                      <Tab
                        key='trending'
                        title={
                          <div className='inline-flex items-center gap-1'>
                            <MdTrendingUp className='w-4 h-4' />
                            {t('ui.trending')}
                          </div>
                        }
                      />
                      {categories.map(cat => (
                        <Tab
                          key={cat.category}
                          title={
                            <div className='inline-flex items-center gap-1'>
                              {renderIcon(cat.icon)}
                              <span>{t(cat.category)}</span>
                            </div>
                          }
                        />
                      ))}
                    </Tabs>
                  </div>
                </div>

                <div
                  ref={bodyScrollRef}
                  className='max-h-[65vh] overflow-y-auto px-4 pb-4'>
                  {isLoadingTemplates ? (
                    // Show loading state while templates are loading
                    <div className='flex flex-col items-center justify-center py-16'>
                      <div className='animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mb-4'></div>
                      <p className='text-muted-foreground text-center'>
                        {t('common:loading', 'Loading templates...')}
                      </p>
                    </div>
                  ) : (
                    <div className='mt-2 space-y-4'>
                      <div
                        ref={el => {
                          categorySectionRefs.current['trending'] = el;
                        }}>
                        <div className='flex items-center gap-1'>
                          🔥
                          <h3 className='text-sm font-semibold text-foreground px-1 mb-1 flex items-center gap-1'>
                            {t('ui.trending')}
                          </h3>
                        </div>
                        <LazyRender>
                          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                            {filteredTrendingStyles.map(renderTemplateCard)}
                          </div>
                        </LazyRender>
                      </div>

                      {filteredCategories.map(cat => (
                        <div
                          key={cat.category}
                          ref={el => {
                            categorySectionRefs.current[cat.category] = el;
                          }}>
                          <div className='flex items-center gap-1'>
                            <span>{cat.emoji}</span>
                            <h3 className='text-sm font-semibold text-foreground px-1 mb-1 flex items-center gap-1'>
                              {t(cat.category)}
                            </h3>
                          </div>
                          <LazyRender>
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                              {(cat.templates as TemplateType[]).map(
                                renderTemplateCard,
                              )}
                            </div>
                          </LazyRender>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
});

export default StyleTemplatesPicker;
