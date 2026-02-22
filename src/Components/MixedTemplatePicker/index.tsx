import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Input,
  Spinner,
  useDisclosure,
} from '@nextui-org/react';
import { MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { HiSparkles, HiOutlineUser } from 'react-icons/hi2';
import { TbVideo } from 'react-icons/tb';
import { BiSolidZap } from 'react-icons/bi';
import { FaCrown } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@/hooks/use-media-query';
import type {
  TemplateType,
  TemplateCategory,
  TemplateInputField,
  StyleTemplate,
} from '../../types/template';
import { templateDataManager } from '../../utils/templateCache';
import { resolveTemplateName } from '../../utils/resolveTemplateName';
import {
  calculateStyleTransferCost,
  VIDEO_TO_VIDEO_GENERATION_PER_SECOND,
  calculateVideoTemplateCost,
} from '../../../api/tools/_zaps';
import { ModelIds } from '../../../api/_constants';

export type {
  TemplateType,
  TemplateCategory,
  TemplateInputField,
  StyleTemplate,
};

export interface MixedTemplatePickerProps {
  // 当前选中的模板 urlSlug
  selectedTemplateSlug?: string;
  // 选中模板时的回调
  onSelect: (template: StyleTemplate) => void;
  // 可选：外部传入的分类数据（如不传则从 API 获取）
  categories?: TemplateCategory[];
  // 可选：是否显示搜索框
  showSearch?: boolean;
  // 可选：额外的 className
  className?: string;
}

export interface MixedTemplatePickerRef {
  open: () => void;
  close: () => void;
}

// 判断模板是否为视频类型
const isVideoTemplate = (type: TemplateType): boolean =>
  type === 'video' || type === 'dance';

// 判断分类是否为 Dance 类型
const isDanceCategory = (nameKey: string): boolean =>
  nameKey === 'dance' || nameKey === 'dances';

// 解析分类名称
const resolveCategoryName = (t: any, nameKey: string): string => {
  if (!nameKey) {
    return '';
  }

  const translationKeys = [
    `effects:categories.${nameKey}.title`,
    `templates:categories.${nameKey}.title`,
    `style-templates:categories.${nameKey}`,
  ];

  for (const key of translationKeys) {
    const translated = t(key, { defaultValue: '' });
    if (translated && translated !== key) {
      return translated;
    }
  }

  return nameKey
    .split(/[-_]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// 上传舞蹈视频卡片组件
const UploadDanceCard = ({ onClick, t }: { onClick: () => void; t: any }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex flex-col items-center p-2 rounded-xl border-2 border-dashed border-border bg-muted transition-all hover:border-primary-400 hover:bg-primary-50 hover:shadow-md'>
    <div className='w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative flex items-center justify-center'>
      <div className='flex flex-col items-center'>
        <div className='relative mb-2'>
          <div className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center'>
            <HiOutlineUser className='w-5 h-5 md:w-6 md:h-6 text-muted-foreground' />
          </div>
          <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center'>
            <TbVideo className='w-3 h-3 text-white' />
          </div>
        </div>
        <span className='text-[10px] md:text-xs text-muted-foreground text-center px-1'>
          {t('style-templates:dances.uploadMotionVideo', 'Upload Your Video')}
        </span>
      </div>
    </div>
    <span className='text-xs font-medium text-muted-foreground text-center line-clamp-2'>
      {t('style-templates:dances.customDance', 'Custom Dance')}
    </span>
  </button>
);

// 计算模板消耗的 Zaps
const calculateTemplateCost = (template: StyleTemplate): number => {
  const { type, is_pro_model, metadata } = template;

  if (type === 'image' || type === 'expression') {
    const model = is_pro_model ? 'gemini-3-pro-image-preview' : undefined;
    return calculateStyleTransferCost('template', 'photo-to-anime', model);
  }

  if (type === 'dance') {
    // 默认 10 秒，与 mapToDanceTemplate / TemplateVideoGenerator 保持一致
    const duration = metadata?.duration ?? 10;
    const rounded = Math.max(0, Math.round(duration));
    return VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimateDiscount * rounded;
  }

  if (type === 'video') {
    // metadata.model from DB can be a string (e.g., 'SORA_TEXT_TO_VIDEO') or number
    const rawModel = metadata?.model;
    const model =
      typeof rawModel === 'string'
        ? ((ModelIds as Record<string, number>)[rawModel] ?? ModelIds.VIDU)
        : (rawModel ?? ModelIds.VIDU);
    const duration = metadata?.duration ?? 5;
    return calculateVideoTemplateCost(
      model,
      duration,
      template.video_pipeline_type,
    );
  }

  return 200;
};

// 模板卡片组件
const TemplateCard = ({
  template,
  selected,
  onClick,
  onPreview,
  t,
}: {
  template: StyleTemplate;
  selected: boolean;
  onClick: () => void;
  onPreview: (template: StyleTemplate) => void;
  t: any;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const title = resolveTemplateName(
    t,
    template.name_key,
    undefined,
    template.i18n,
  );
  const isVideo = isVideoTemplate(template.type);
  // 展示用 URL：优先使用 display_url（舞蹈模板等），回退到 url
  const previewUrl = template.display_url || template.url;

  // IntersectionObserver：可见时播放，不可见时暂停
  useEffect(() => {
    if (!isVideo || !previewUrl) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    let playTimeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.target !== video) {
            return;
          }
          clearTimeout(playTimeout);

          if (entry.isIntersecting) {
            playTimeout = setTimeout(() => {
              video.play().catch(() => {});
            }, 300);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      clearTimeout(playTimeout);
      video.pause();
    };
  }, [previewUrl, isVideo]);

  // hover 时取消静音
  const handleMouseEnter = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  // 视频加载完成回调
  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  return (
    <div className='group relative w-full'>
      <button
        type='button'
        onClick={onClick}
        data-selected={selected || undefined}
        className={`w-full flex flex-col items-stretch p-2 rounded-xl border-2 transition-all hover:border-primary-400 hover:shadow-md ${
          selected
            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
            : 'border-border bg-card'
        }`}>
        <div className='w-full overflow-hidden rounded-lg aspect-square relative bg-muted mb-2'>
          {template.is_pro_model && !selected && (
            <div className='absolute flex items-center justify-center top-0 right-0 z-10 bg-primary/50 p-0.5 px-1 rounded-bl-lg rounded-tr-lg'>
              <FaCrown className='text-yellow-500 w-3 h-3 drop-shadow-md' />
            </div>
          )}
          {(!previewUrl || imageError) && (
            <div className='w-full h-full flex items-center justify-center'>
              <HiSparkles className='w-8 h-8 text-primary-300' />
            </div>
          )}
          {previewUrl && isVideo && !imageError && (
            <>
              {/* 视频加载占位符 */}
              {!isVideoLoaded && (
                <div className='absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10'>
                  <Spinner size='sm' color='primary' />
                </div>
              )}
              <video
                ref={videoRef}
                src={previewUrl}
                muted
                loop
                playsInline
                preload='metadata'
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isVideoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onLoadedData={handleVideoLoaded}
                onError={() => setImageError(true)}
              />
            </>
          )}
          {previewUrl && !isVideo && !imageError && (
            <img
              src={previewUrl}
              alt={title}
              className='w-full h-full object-cover'
              loading='lazy'
              onError={() => setImageError(true)}
            />
          )}
          {/* Zap cost overlay */}
          <div className='absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.5 bg-black/70 rounded-full shadow-sm'>
            <BiSolidZap className='w-2 h-2 text-yellow-400' />
            <span className='text-[8px] font-semibold text-white leading-none'>
              {calculateTemplateCost(template)}
            </span>
          </div>

          {/* 预览按钮 */}
          <button
            type='button'
            aria-label={t('effects:buttons.preview', 'Preview')}
            className='absolute top-1 right-1 flex items-center justify-center text-foreground backdrop-blur-sm transition-all hover:bg-card active:scale-95 h-6 w-6 rounded-full bg-card/80 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            onClick={e => {
              e.stopPropagation();
              onPreview(template);
            }}>
            <svg
              className='h-3 w-3'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
              />
            </svg>
          </button>
        </div>
        <span className='text-xs font-medium text-foreground text-center line-clamp-2'>
          {title}
        </span>
      </button>
    </div>
  );
};

const MixedTemplatePicker = forwardRef<
  MixedTemplatePickerRef,
  MixedTemplatePickerProps
>(
  (
    {
      selectedTemplateSlug,
      onSelect,
      categories: externalCategories,
      showSearch = true,
      className,
    }: MixedTemplatePickerProps,
    ref,
  ) => {
    const { t } = useTranslation(['effects', 'style-templates', 'common']);
    const { isMobile } = useMediaQuery();
    const [isOpen, setIsOpen] = useState(false);
    // 数据状态
    const [categories, setCategories] = useState<TemplateCategory[]>(
      externalCategories || [],
    );
    const [isLoading, setIsLoading] = useState(!externalCategories);
    const [searchQuery, setSearchQuery] = useState('');
    // Default to first category instead of 'all'
    const [selectedTab, setSelectedTab] = useState<string>(
      externalCategories?.[0]?.name_key || '',
    );

    // 预览 Modal 状态
    const [previewTemplate, setPreviewTemplate] =
      useState<StyleTemplate | null>(null);
    const {
      isOpen: isPreviewOpen,
      onOpen: openPreviewModal,
      onOpenChange: onPreviewChange,
      onClose: closePreviewModal,
    } = useDisclosure();

    // 内容滚动容器 ref（用于自动滚动到选中模板）
    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    // Tab 滚动状态
    const tabsScrollRef = useRef<HTMLDivElement | null>(null);
    const tabsContainerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      open: () => {
        // Set to first category instead of 'all'
        setSelectedTab(categories[0]?.name_key || '');
        setSearchQuery('');
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }));

    // 检查是否有有效的外部数据
    const hasValidExternalData =
      externalCategories && externalCategories.length > 0;

    // 如果外部传入有效的 categories，则使用外部数据
    useEffect(() => {
      if (hasValidExternalData) {
        setCategories(externalCategories);
        setIsLoading(false);
      }
    }, [externalCategories, hasValidExternalData]);

    // Auto-select first category when categories are loaded
    useEffect(() => {
      if (categories.length > 0 && !selectedTab) {
        setSelectedTab(categories[0].name_key);
      }
    }, [categories, selectedTab]);

    // 如果没有有效的外部数据，则从缓存获取
    useEffect(() => {
      if (hasValidExternalData) {
        return;
      }

      const loadTemplates = async () => {
        setIsLoading(true);
        try {
          if (!templateDataManager.isDataLoaded()) {
            await templateDataManager.loadAllData();
          }
          const data = templateDataManager.getAllTemplates();
          if (data) {
            setCategories(data);
          }
        } catch (err) {
          console.error('Error loading templates:', err);
        } finally {
          setIsLoading(false);
        }
      };

      loadTemplates();
    }, [hasValidExternalData]);

    // 检查 tabs 是否可以左右滚动
    const updateScrollButtons = useCallback(() => {
      const el = tabsScrollRef.current;
      if (!el) {
        return;
      }
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }, []);

    // 滚动 tabs
    const scrollTabs = useCallback((direction: 'left' | 'right') => {
      const el = tabsScrollRef.current;
      if (!el) {
        return;
      }
      const scrollAmount = 150;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }, []);

    // 监听 tabs 滚动
    useEffect(() => {
      if (!isOpen) {
        tabsScrollRef.current = null;
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      let attempts = 0;
      const maxAttempts = 20;

      const findAndSetupTabList = () => {
        const container = tabsContainerRef.current;
        if (!container) {
          return false;
        }

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

      const intervalId = setInterval(() => {
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

    // 打开时自动切换到选中模板所属的分类
    useEffect(() => {
      if (!isOpen || isLoading || !selectedTemplateSlug) {
        return;
      }

      // 遍历所有分类，找到包含选中模板的分类
      for (const category of categories) {
        const hasTemplate = category.templates.some(
          template => template.urlSlug === selectedTemplateSlug,
        );
        if (hasTemplate) {
          setSelectedTab(category.name_key);

          // 滚动分类 tab 到可见位置
          setTimeout(() => {
            const tabList = tabsScrollRef.current;
            if (!tabList) {
              return;
            }

            // 找到选中的 tab 元素
            const selectedTabEl = tabList.querySelector(
              `[data-key="${category.name_key}"]`,
            );
            if (selectedTabEl) {
              selectedTabEl.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              });
            }
          }, 100);

          break;
        }
      }
    }, [isOpen, isLoading, selectedTemplateSlug, categories]);

    // 打开时自动滚动到选中的模板
    useEffect(() => {
      if (!isOpen || isLoading || !selectedTemplateSlug) {
        return;
      }

      const timer = setTimeout(() => {
        const container = contentScrollRef.current;
        if (!container) {
          return;
        }

        const selectedEl = container.querySelector('[data-selected]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      return () => clearTimeout(timer);
    }, [isOpen, isLoading, selectedTemplateSlug]);

    // 清理 NextUI Modal 残留的 backdrop DOM 元素
    // NextUI + Tabs 组件组合使用时，关闭动画可能无法正确清理 backdrop
    const cleanupModalBackdrop = useCallback(() => {
      requestAnimationFrame(() => {
        const lingering = document.querySelectorAll(
          '.nextui-backdrop,[data-slot="backdrop"],[data-slot="wrapper"]',
        );
        lingering.forEach(el => {
          const root = el.closest('[data-open="true"]');
          if (!root) {
            (el as HTMLElement).remove();
          }
        });
        const active = document.activeElement as HTMLElement | null;
        if (active && typeof active.blur === 'function') {
          active.blur();
        }
      });
    }, []);

    // 搜索过滤
    const normalize = (v: string) => (v || '').toLowerCase().trim();
    const matchesQuery = useCallback(
      (s: StyleTemplate, q: string) => {
        if (!q) {
          return true;
        }
        const qn = normalize(q);
        const id = normalize(s.id);
        let name = '';
        try {
          name = normalize(
            resolveTemplateName(t, s.name_key, undefined, s.i18n),
          );
        } catch {
          // Ignore i18n resolution errors and continue with empty name
        }

        if (id.includes(qn) || name.includes(qn)) {
          return true;
        }

        // 前缀匹配
        const hasPrefixMatch = (target: string) => {
          if (!target) {
            return false;
          }
          let commonLen = 0;
          const maxLen = Math.min(qn.length, target.length);
          for (let i = 0; i < maxLen; i++) {
            if (qn[i] === target[i]) {
              commonLen++;
            } else {
              break;
            }
          }
          return (
            commonLen >= 3 &&
            commonLen >= Math.min(qn.length, target.length) * 0.5
          );
        };

        return hasPrefixMatch(id) || hasPrefixMatch(name);
      },
      [t],
    );

    // 过滤后的分类
    const filteredCategories = useMemo(() => {
      if (!searchQuery.trim()) {
        return categories;
      }
      return categories
        .map(cat => ({
          ...cat,
          templates: (cat.templates || []).filter((s: StyleTemplate) =>
            matchesQuery(s, searchQuery),
          ),
        }))
        .filter(cat => (cat.templates || []).length > 0);
    }, [categories, searchQuery, matchesQuery]);

    // 处理模板选择
    const handleSelect = useCallback(
      (template: StyleTemplate) => {
        setIsOpen(false);
        cleanupModalBackdrop();
        setTimeout(() => onSelect(template), 0);
      },
      [onSelect, cleanupModalBackdrop],
    );

    // 处理预览模板
    const handlePreviewTemplate = useCallback(
      (template: StyleTemplate) => {
        setPreviewTemplate(template);
        openPreviewModal();
      },
      [openPreviewModal],
    );

    // 隐藏文件输入 ref（用于舞蹈视频上传）
    const danceVideoInputRef = useRef<HTMLInputElement | null>(null);

    // 处理上传舞蹈视频卡片点击 - 直接触发文件选择
    const handleUploadDanceClick = useCallback(() => {
      danceVideoInputRef.current?.click();
    }, []);

    // 处理舞蹈视频文件选择
    const handleDanceVideoSelected = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('video/')) {
          return;
        }

        const tempUrl = URL.createObjectURL(file);

        // 检测视频时长
        const duration = await new Promise<number>(resolve => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => resolve(video.duration || 5);
          video.onerror = () => resolve(5);
          video.src = tempUrl;
        });

        // 创建合成模板，包含上传视频的元数据
        const syntheticTemplate: StyleTemplate = {
          id: 'custom-dance',
          urlSlug: 'custom-dance',
          displayName: 'custom-dance',
          type: 'dance',
          name_key: 'dances.customDance',
          is_pro_model: false,
          support_v2v: false,
          support_playground: false,
          prompt: { prompt: '' },
          ratio: '9:16',
          input_media: [{ media_type: 'image', min_count: 1, max_count: 1 }],
          metadata: {
            uploadedVideoUrl: tempUrl,
            uploadedVideoDuration: duration,
          },
        };

        setIsOpen(false);
        cleanupModalBackdrop();

        // 重置文件输入
        if (danceVideoInputRef.current) {
          danceVideoInputRef.current.value = '';
        }

        setTimeout(() => onSelect(syntheticTemplate), 0);
      },
      [onSelect, cleanupModalBackdrop],
    );

    // Modal 状态变化回调（backdrop 点击、ESC 键等）
    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (open) {
          setIsOpen(true);
          return;
        }
        setIsOpen(false);
        setSearchQuery('');
        cleanupModalBackdrop();
      },
      [cleanupModalBackdrop],
    );

    return (
      <div className={className}>
        {/* 隐藏的视频文件输入（用于舞蹈视频直接上传） */}
        <input
          ref={danceVideoInputRef}
          type='file'
          accept='video/*'
          className='hidden'
          onChange={handleDanceVideoSelected}
        />
        {isOpen && (
          <Modal
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
            isDismissable={true}
            size='4xl'
            scrollBehavior='inside'
            shouldBlockScroll={true}
            placement={isMobile ? 'bottom' : 'center'}
            classNames={{
              wrapper: 'z-50',
              backdrop: 'z-50 bg-black/50 backdrop-blur-sm',
              base: 'border border-primary-200',
            }}>
            <ModalContent className='mx-2 sm:mx-auto w-[calc(100vw-1rem)] sm:w-auto md:max-w-4xl bg-card'>
              <>
                <ModalHeader className='flex items-center justify-between pb-1'>
                  <span className='text-primary-800 dark:text-foreground'>
                    {t('effects:changeModal.title', 'Switch Effect')}
                  </span>
                  {showSearch && (
                    <div className='hidden sm:block'>
                      <Input
                        size='sm'
                        variant='bordered'
                        radius='full'
                        placeholder={t('common:search', 'Search...')}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        startContent={
                          <MdSearch className='w-4 h-4 text-default-400' />
                        }
                        classNames={{
                          inputWrapper: 'h-8 bg-input focus-within:bg-input',
                          input: 'text-xs !text-foreground',
                        }}
                        aria-label='Search templates'
                      />
                    </div>
                  )}
                </ModalHeader>
                <ModalBody className='overflow-visible pt-0 gap-0 px-0 pb-6'>
                  {/* Mobile search */}
                  {showSearch && (
                    <div className='px-2 pt-1 pb-2 md:hidden'>
                      <Input
                        size='sm'
                        variant='bordered'
                        radius='full'
                        placeholder={t('common:search', 'Search...')}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        startContent={
                          <MdSearch className='w-4 h-4 text-default-400' />
                        }
                        classNames={{
                          inputWrapper: 'h-9 bg-input focus-within:bg-input',
                          input: 'text-sm !text-foreground',
                        }}
                        aria-label='Search templates'
                      />
                    </div>
                  )}

                  {/* Tabs */}
                  <div
                    ref={tabsContainerRef}
                    className='relative overflow-hidden sticky top-0 z-10 bg-white dark:bg-card'>
                    {/* 左滚动按钮 */}
                    <button
                      type='button'
                      onClick={() => scrollTabs('left')}
                      aria-label='Scroll left'
                      className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center bg-white/95 dark:bg-card/95 hover:bg-muted rounded-full shadow-sm transition-all ${
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
                      className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center bg-white/95 dark:bg-card/95 hover:bg-muted rounded-full shadow-sm transition-all ${
                        canScrollRight
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      }`}>
                      <MdChevronRight className='w-4 h-4 text-muted-foreground' />
                    </button>

                    <Tabs
                      selectedKey={selectedTab}
                      onSelectionChange={key => setSelectedTab(key as string)}
                      size='sm'
                      variant='underlined'
                      color='primary'
                      className='w-full px-2 sm:px-6'
                      classNames={{
                        tabList:
                          'relative w-full overflow-x-auto flex-nowrap justify-start gap-0 border-b border-divider pb-0 scroll-smooth pr-6',
                        tab: 'flex-none shrink-0 px-3 py-0 whitespace-nowrap max-w-fit transition-colors duration-300 text-sm',
                        cursor:
                          'w-full bg-primary transition-all duration-300 ease-out',
                        tabContent:
                          'text-xs sm:text-sm group-data-[selected=true]:text-primary transition-colors duration-300',
                      }}>
                      {categories.map(cat => (
                        <Tab
                          key={cat.name_key}
                          title={
                            <div className='inline-flex items-center gap-1'>
                              {cat.emoji && <span>{cat.emoji}</span>}
                              <span>
                                {resolveCategoryName(t, cat.name_key)}
                              </span>
                            </div>
                          }
                        />
                      ))}
                    </Tabs>
                  </div>

                  {/* Content */}
                  <div
                    ref={contentScrollRef}
                    className='max-h-[65vh] overflow-y-auto px-4 pt-4'>
                    {isLoading && (
                      <div className='flex flex-col items-center justify-center py-16'>
                        <Spinner size='lg' color='primary' />
                        <p className='mt-4 text-muted-foreground'>
                          {t('common:loading', 'Loading...')}
                        </p>
                      </div>
                    )}
                    {!isLoading && (
                      // 显示选中分类的模板
                      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                        {/* Dance 分类在最前面显示上传卡片 */}
                        {isDanceCategory(selectedTab) && (
                          <UploadDanceCard
                            onClick={handleUploadDanceClick}
                            t={t}
                          />
                        )}
                        {filteredCategories
                          .filter(cat => cat.name_key === selectedTab)
                          .flatMap(cat => cat.templates)
                          .map(template => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              selected={
                                selectedTemplateSlug === template.urlSlug
                              }
                              onClick={() => handleSelect(template)}
                              onPreview={handlePreviewTemplate}
                              t={t}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </ModalBody>
              </>
            </ModalContent>
          </Modal>
        )}

        {/* 预览 Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onOpenChange={onPreviewChange}
          placement='center'
          size='5xl'
          scrollBehavior='outside'
          shouldBlockScroll={false}
          isDismissable
          hideCloseButton={false}
          classNames={{ wrapper: 'z-[60]', backdrop: 'z-[60]' }}>
          <ModalContent className='mx-2 sm:mx-auto w-fit max-w-[95vw] max-h-[95vh] bg-card'>
            <>
              <ModalHeader className='flex flex-col gap-1 text-lg font-semibold dark:text-foreground'>
                {previewTemplate
                  ? resolveTemplateName(
                      t,
                      previewTemplate.name_key,
                      undefined,
                      previewTemplate.i18n,
                    )
                  : ''}
              </ModalHeader>
              <ModalBody className='px-6 py-0 flex justify-center'>
                {previewTemplate && isVideoTemplate(previewTemplate.type) && (
                  <video
                    src={previewTemplate.display_url || previewTemplate.url}
                    controls
                    playsInline
                    autoPlay
                    loop
                    className='max-h-[70vh] max-w-full rounded-2xl object-contain'>
                    <track kind='captions' />
                  </video>
                )}
                {previewTemplate && !isVideoTemplate(previewTemplate.type) && (
                  <img
                    src={previewTemplate.display_url || previewTemplate.url}
                    alt={resolveTemplateName(
                      t,
                      previewTemplate.name_key,
                      undefined,
                      previewTemplate.i18n,
                    )}
                    className='max-h-[70vh] max-w-full rounded-2xl object-contain'
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={closePreviewModal}>
                  {t('effects:buttons.close', 'Close')}
                </Button>
                <Button
                  color='primary'
                  onPress={() => {
                    if (previewTemplate) {
                      handleSelect(previewTemplate);
                    }
                    closePreviewModal();
                  }}>
                  {t('effects:buttons.useTemplate', 'Use Template')}
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    );
  },
);

MixedTemplatePicker.displayName = 'MixedTemplatePicker';

export default MixedTemplatePicker;
