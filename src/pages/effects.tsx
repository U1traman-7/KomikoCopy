import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { resolveTemplateName } from '../utils/resolveTemplateName';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Spinner,
} from '@nextui-org/react';
import { SiteFooter } from '@/components/site-footer';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { sortCategoryTemplates } from '../utils/templateSorting';
import { templateDataManager } from '../utils/templateCache';
import type {
  TemplateType,
  StyleTemplate,
  TemplateCategory,
} from '../Components/MixedTemplatePicker';

// 获取模板路由路径 - 所有模板统一跳转到 /effects/[name] 页面
const getTemplatePath = (template: StyleTemplate): string =>
  `/effects/${template.urlSlug || template.displayName || template.id}`;

// 判断模板是否为视频类型（用于预览时决定使用 video 还是 img 标签）
const isVideoTemplate = (type: TemplateType): boolean =>
  type === 'video' || type === 'dance';

// TikTok 热门模板标记（与 featuredTemplates.ts 中的 badge: 'tiktok' 保持一致）
const TIKTOK_BADGE_TEMPLATES = new Set(['twerk', 'bankai', 'lonely-lonely']);

// 单个模板卡片组件
const EffectTemplateCard = ({
  template,
  onUse,
  onPreview,
  t,
}: {
  template: StyleTemplate;
  onUse: (template: StyleTemplate) => void;
  onPreview: (template: StyleTemplate) => void;
  t: TFunction;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const title = resolveTemplateName(
    t,
    template.name_key,
    undefined,
    template.i18n,
  );
  const isVideo = isVideoTemplate(template.type);
  // 展示用 URL：优先使用 display_url（舞蹈模板等），回退到 url
  const previewUrl = template.display_url || template.url;

  // 视频加载完成回调
  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  // 视频自动播放控制
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
      { threshold: 0.5 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      clearTimeout(playTimeout);
      video.pause();
    };
  }, [previewUrl, isVideo]);

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-2.5 shadow-sm transition-all duration-200 hover:border-primary-500 hover:shadow-lg active:scale-[0.98]'>
      {/* 媒体区域 */}
      <div className='group relative aspect-square w-full overflow-hidden rounded-xl bg-muted'>
        <div
          className='h-full w-full cursor-pointer'
          role='button'
          tabIndex={0}
          onClick={() => onUse(template)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onUse(template);
            }
          }}>
          {isVideo && previewUrl ? (
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
                className={`h-full w-full object-cover object-top transition-opacity duration-300 ${
                  isVideoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoadedData={handleVideoLoaded}
              />
            </>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={title}
              className='h-full w-full object-cover object-top'
              loading='lazy'
            />
          ) : (
            <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200'>
              <HiSparkles className='w-12 h-12 text-primary-400' />
            </div>
          )}
        </div>

        {/* TikTok Badge - Bottom right corner */}
        {TIKTOK_BADGE_TEMPLATES.has(template.displayName) && (
          <div className='pointer-events-none absolute bottom-2 right-2 z-[1]'>
            <div className='flex items-center gap-1 rounded-full bg-black px-2 py-0.5 shadow'>
              <FaTiktok className='h-3 w-3 text-white' aria-hidden='true' />
              <span className='text-[10.5px] font-medium text-white'>
                TikTok
              </span>
            </div>
          </div>
        )}

        {/* 预览按钮 */}
        <button
          type='button'
          aria-label={t('effects:buttons.preview', 'Preview')}
          className='absolute top-2 right-2 flex items-center justify-center text-foreground backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-card active:scale-95 h-7 w-7 rounded-full bg-white/80 dark:bg-card/90 shadow-sm opacity-100 sm:h-8 sm:w-8 sm:rounded-lg sm:bg-white/95 sm:dark:bg-card/95 sm:shadow-md sm:opacity-0 sm:group-hover:opacity-100'
          onClick={e => {
            e.stopPropagation();
            onPreview(template);
          }}>
          <svg
            className='h-3.5 w-3.5'
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

      {/* 内容区域：固定3行布局 —— 2行标题 + 1行按钮 */}
      <div className='flex flex-col items-center gap-1.5 px-1 pt-2 pb-1'>
        <h3 className='min-h-[2.75em] text-xs md:text-sm font-semibold leading-snug text-foreground text-center line-clamp-2 flex items-center'>
          {title}
        </h3>

        <button
          type='button'
          className='flex items-center justify-center gap-1 w-full px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 dark:text-primary-500 hover:bg-primary-100 active:scale-[0.97] transition-all text-xs font-medium'
          onClick={() => onUse(template)}>
          <HiSparkles className='w-3.5 h-3.5 flex-shrink-0' />
          {t('effects:buttons.useTemplate', 'Use Template')}
        </button>
      </div>
    </div>
  );
};

// 单个专辑行组件（横向滚动）
const CategoryRow = ({
  category,
  onUseTemplate,
  onPreviewTemplate,
  t,
}: {
  category: TemplateCategory;
  onUseTemplate: (template: StyleTemplate) => void;
  onPreviewTemplate: (template: StyleTemplate) => void;
  t: TFunction;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, category.templates]);

  // 获取分类标题
  const categoryTitle = useMemo(() => {
    const nameKey = category.name_key;

    // 尝试多个翻译路径
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

    // 默认转换 nameKey 为标题格式
    return nameKey
      .split(/[-_]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [category.name_key, t]);

  // 安全检查：确保 templates 是有效数组且不为空
  if (
    !category.templates ||
    !Array.isArray(category.templates) ||
    category.templates.length === 0
  ) {
    return null;
  }

  return (
    <section className='relative'>
      {/* 分类标题 */}
      <div className='mb-3 flex items-center gap-2'>
        {category.emoji && <span className='text-xl'>{category.emoji}</span>}
        <h2 className='text-lg font-semibold text-foreground sm:text-xl'>
          {categoryTitle}
        </h2>
        <span className='text-sm text-muted-foreground'>
          ({category.templates.length})
        </span>
      </div>

      {/* 横向滚动容器 */}
      <div className='relative group'>
        {/* 左箭头 */}
        <button
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 dark:bg-card/95 shadow-lg rounded-full border border-border text-muted-foreground hover:text-primary-600 dark:hover:text-primary-500 transition-opacity duration-200 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } hidden md:flex`}
          onClick={() => scroll('left')}
          aria-label='Scroll left'>
          <FiChevronLeft className='w-5 h-5' />
        </button>

        {/* 模板网格 */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory'>
          {category.templates.map(template => (
            <div
              key={template.id}
              className='flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] snap-start'>
              <EffectTemplateCard
                template={template}
                onUse={onUseTemplate}
                onPreview={onPreviewTemplate}
                t={t}
              />
            </div>
          ))}
        </div>

        {/* 右箭头 */}
        <button
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 dark:bg-card/95 shadow-lg rounded-full border border-border text-muted-foreground hover:text-primary-600 dark:hover:text-primary-500 transition-opacity duration-200 ${
            showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } hidden md:flex`}
          onClick={() => scroll('right')}
          aria-label='Scroll right'>
          <FiChevronRight className='w-5 h-5' />
        </button>
      </div>
    </section>
  );
};

export default function EffectsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation([
    'effects',
    'templates',
    'style-templates',
  ]);

  // 数据状态
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 预览 Modal 状态
  const [previewTemplate, setPreviewTemplate] = useState<StyleTemplate | null>(
    null,
  );
  const {
    isOpen: isPreviewOpen,
    onOpen: openPreviewModal,
    onOpenChange: onPreviewChange,
    onClose: closePreviewModal,
  } = useDisclosure();

  // 加载数据（从缓存获取）
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!templateDataManager.isDataLoaded()) {
          await templateDataManager.loadAllData();
        }

        const data = templateDataManager.getAllTemplates();

        // 过滤掉空分类，只保留有模板的分类
        const validCategories = (data || []).filter(
          (category: any) =>
            category &&
            category.templates &&
            Array.isArray(category.templates) &&
            category.templates.length > 0,
        );

        // 使用排序工具函数对模板进行排序
        const sortedCategories = sortCategoryTemplates(validCategories);

        setCategories(sortedCategories);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('Failed to load templates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 使用模板
  const handleUseTemplate = useCallback(
    (template: StyleTemplate) => {
      router.push(getTemplatePath(template));
    },
    [router],
  );

  // 预览模板
  const handlePreviewTemplate = useCallback(
    (template: StyleTemplate) => {
      setPreviewTemplate(template);
      openPreviewModal();
    },
    [openPreviewModal],
  );

  return (
    <main className='flex h-screen flex-col bg-background text-foreground'>
      <Head>
        <title>{t('effects:meta.title', 'Effects | Komiko AI')}</title>
        <meta
          name='description'
          content={t(
            'effects:meta.description',
            'Browse all AI effects and templates for anime creation. Image styles, video effects, dance animations and more.',
          )}
        />
        <meta
          name='keywords'
          content={t(
            'effects:meta.keywords',
            'AI effects, anime templates, video effects, dance animation, komiko',
          )}
        />
        <meta
          property='og:title'
          content={t('effects:meta.title', 'Effects | Komiko AI')}
        />
        <meta
          property='og:description'
          content={t(
            'effects:meta.description',
            'Browse all AI effects and templates for anime creation.',
          )}
        />
        <meta property='og:url' content='https://komiko.app/effects' />
        <meta property='og:type' content='website' />
        <link rel='canonical' href='https://komiko.app/effects' />
      </Head>

      <Header autoOpenLogin={false} />

      <div className='flex min-h-screen'>
        <Sidebar />

        <div className='flex w-full flex-col lg:pl-[240px]'>
          <div className='flex-1 flex flex-col px-3 pt-[60px] sm:px-6 sm:pt-[80px] pb-12'>
            {/* Hero 区域 */}
            <section className='mt-4 rounded-3xl bg-gradient-to-b from-primary-50 via-background to-background px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 md:px-10 md:pt-10 md:pb-10'>
              <p className='mb-1 md:mb-3 text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-500 sm:text-sm'>
                {t('effects:hero.eyebrow', 'Effects Gallery')}
              </p>
              <h1
                className={`text-xl font-bold text-foreground sm:text-3xl ${i18n.language === 'ja' ? 'md:text-3xl' : 'md:text-5xl'}`}>
                {t('effects:hero.title', 'Fun Effects Loved by Anime Creators')}
              </h1>
              <p className='md:mt-4 mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg'>
                {t(
                  'effects:hero.description',
                  'Find the effect you love and jump straight into creating.',
                )}
              </p>
            </section>

            {/* 内容区域 */}
            <div className='mt-6 md:mt-8 px-2 sm:px-4 md:px-6'>
              {isLoading ? (
                // 加载状态
                <div className='flex flex-col items-center justify-center py-20'>
                  <Spinner size='lg' color='primary' />
                  <p className='mt-4 text-muted-foreground'>
                    {t('common:loading', 'Loading...')}
                  </p>
                </div>
              ) : error ? (
                // 错误状态
                <div className='flex flex-col items-center justify-center py-20'>
                  <div className='text-red-500 mb-4'>
                    <svg
                      className='w-16 h-16'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                  </div>
                  <p className='text-muted-foreground mb-4'>{error}</p>
                  <Button
                    color='primary'
                    onPress={() => window.location.reload()}>
                    {t('common:retry', 'Try Again')}
                  </Button>
                </div>
              ) : categories.length === 0 ? (
                // 空状态
                <div className='flex flex-col items-center justify-center py-20'>
                  <HiSparkles className='w-16 h-16 text-muted-foreground/40 mb-4' />
                  <p className='text-muted-foreground'>
                    {t('effects:empty', 'No effects found.')}
                  </p>
                </div>
              ) : (
                // 分类列表
                <div className='flex flex-col gap-8 md:gap-10'>
                  {categories.map(category => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onUseTemplate={handleUseTemplate}
                      onPreviewTemplate={handlePreviewTemplate}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

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
            classNames={{ wrapper: 'z-50', backdrop: 'z-50' }}>
            <ModalContent className='mx-2 sm:mx-auto w-fit max-w-[95vw] max-h-[95vh]'>
              <>
                <ModalHeader className='flex flex-col gap-1 text-lg font-semibold'>
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
                  {previewTemplate ? (
                    isVideoTemplate(previewTemplate.type) ? (
                      <video
                        src={previewTemplate.display_url || previewTemplate.url}
                        controls
                        playsInline
                        autoPlay
                        loop
                        className='max-h-[70vh] max-w-full rounded-2xl object-contain'
                      />
                    ) : (
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
                    )
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  <Button variant='light' onPress={closePreviewModal}>
                    {t('effects:buttons.close', 'Close')}
                  </Button>
                  <Button
                    color='primary'
                    onPress={() => {
                      if (previewTemplate) {
                        handleUseTemplate(previewTemplate);
                      }
                      closePreviewModal();
                    }}>
                    {t('effects:buttons.useTemplate', 'Use Template')}
                  </Button>
                </ModalFooter>
              </>
            </ModalContent>
          </Modal>

          <SiteFooter className='md:border-t' />
        </div>
      </div>
    </main>
  );
}
