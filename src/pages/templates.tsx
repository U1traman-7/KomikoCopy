import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import TemplateCard from '../Components/TemplateCard';
import {
  featuredTemplateCategories,
  FeaturedTemplate,
  TemplateCategory,
} from '../data/featuredTemplates';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import { SiteFooter } from '@/components/site-footer';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getBatchMultiToolStats } from '../utils/styleUsageStats';
import { formatPopularity } from '../utilities/index';

const TOOL_DB_MAPPING: Record<string, string> = {
  playground: 'playground',
  videoToVideo: 'video-to-video',
  videoEffects: 'ai-video-effect',
  dance: 'dance-video-generator',
};

const getTemplateStyleId = (template: FeaturedTemplate): string | undefined => {
  const { query } = template.route;
  if (!query) return undefined;

  switch (template.tool) {
    case 'playground':
    case 'videoToVideo':
      return query.style;
    case 'videoEffects':
      return query.effect;
    case 'dance':
      return query.dance;
    default:
      return undefined;
  }
};

const resolveKey = (t: TFunction, key: string) => {
  if (!key) return '';
  if (key.includes(':')) return t(key);
  return t(key, { ns: 'templates' });
};

export default function TemplatesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation(['templates']);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const manualScrollTarget = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [activeCategory, setActiveCategory] = useState(
    featuredTemplateCategories[0]?.id ?? '',
  );
  const [previewTemplate, setPreviewTemplate] =
    useState<FeaturedTemplate | null>(null);
  const {
    isOpen: isPreviewOpen,
    onOpen: openPreviewModal,
    onOpenChange: onPreviewChange,
    onClose: closePreviewModal,
  } = useDisclosure();

  // 存储样式使用统计数据
  const [stylePopularityMap, setStylePopularityMap] = useState<
    Record<string, string>
  >({});

  // 基础分类数据
  const baseCategories = useMemo<TemplateCategory[]>(
    () => featuredTemplateCategories,
    [],
  );

  // 提取所有模板的 tool + styleId 组合
  const templateStyleIds = useMemo(() => {
    const styleMap = new Map<string, { tool: string; styleId: string }>();
    baseCategories.forEach(category => {
      category.templates.forEach(template => {
        const styleId = getTemplateStyleId(template);

        if (styleId) {
          // 使用 tool-styleId 作为唯一键
          const key = `${template.tool}-${styleId}`;
          styleMap.set(key, { tool: template.tool, styleId });
        }
      });
    });
    return Array.from(styleMap.values());
  }, [baseCategories]);

  // 合并统计数据后的分类数据
  const categories = useMemo<TemplateCategory[]>(() => {
    return baseCategories.map(category => ({
      ...category,
      templates: category.templates.map(template => {
        const styleId = getTemplateStyleId(template);

        // 如果有 styleId，尝试从 popularityMap 中获取数据
        if (styleId) {
          const key = `${template.tool}-${styleId}`;
          const popularity = stylePopularityMap[key];
          if (popularity !== undefined) {
            return {
              ...template,
              popularity: popularity, // 直接使用格式化的字符串，如 "1.5k"
            };
          }
        }

        return template;
      }),
    }));
  }, [baseCategories, stylePopularityMap]);

  // 获取样式使用统计数据
  useEffect(() => {
    const fetchStyleStats = async () => {
      if (templateStyleIds.length === 0) return;

      try {
        // 按工具类型分组，使用 DB 中的 tool 名称
        const toolStyleMap = templateStyleIds.reduce(
          (acc, { tool, styleId }) => {
            const dbTool = TOOL_DB_MAPPING[tool] || tool;
            if (!acc[dbTool]) {
              acc[dbTool] = [];
            }
            acc[dbTool].push(styleId);
            return acc;
          },
          {} as Record<string, string[]>,
        );

        // 一次性获取所有工具的所有样式统计数据
        const statsMap = await getBatchMultiToolStats(toolStyleMap);

        // 格式化统计数据
        const popularityMap: Record<string, string> = {};

        // 遍历所有模板，为每个模板生成 popularity 值
        templateStyleIds.forEach(({ tool, styleId }) => {
          const dbTool = TOOL_DB_MAPPING[tool] || tool;
          const dbKey = `${dbTool}-${styleId}`;
          const frontendKey = `${tool}-${styleId}`;

          const usageCount = statsMap?.[dbKey];

          // 使用 formatPopularity 函数：有真实数据用真实数据，没有则用种子生成随机值
          popularityMap[frontendKey] = formatPopularity(
            usageCount,
            frontendKey,
          );
        });

        setStylePopularityMap(popularityMap);
      } catch (error) {
        console.error('Failed to fetch style stats:', error);
      }
    };

    fetchStyleStats();
  }, [templateStyleIds]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
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
  }, [categories]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const sectionId = entry.target.getAttribute('data-category-id');
          if (!sectionId) return;

          // 如果正在手动滚动，只在到达目标时清除标记
          if (manualScrollTarget.current) {
            if (sectionId !== manualScrollTarget.current) return;
            manualScrollTarget.current = null;
          }
          setActiveCategory(sectionId);
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px', // 更稳定的检测区域
        threshold: 0,
      },
    );

    categories.forEach(category => {
      const node = sectionRefs.current[category.id];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [categories]);

  const handleScrollToCategory = (categoryId: string) => {
    manualScrollTarget.current = categoryId;
    setActiveCategory(categoryId);
    const node = sectionRefs.current[categoryId];
    if (!node) return;

    // 使用计算的偏移量而不是 scrollIntoView，更精确
    const isMobile = window.innerWidth < 768;
    const yOffset = isMobile ? -135 : -180; // 移动端 vs 桌面端的 header 高度
    const y = node.getBoundingClientRect().top + window.scrollY + yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const handleUseTemplate = (template: FeaturedTemplate) => {
    const { path, query, hash } = template.route;
    router.push(
      {
        pathname: path,
        query,
        hash,
      },
      undefined,
      { shallow: false },
    );
  };

  const handlePreview = (template: FeaturedTemplate) => {
    setPreviewTemplate(template);
    openPreviewModal();
  };

  return (
    <main className='flex h-screen flex-col bg-background text-foreground'>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name='description' content={t('meta.description')} />
        <meta name='keywords' content={t('meta.keywords')} />
        <meta property='og:title' content={t('meta.title')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta property='og:url' content='https://komiko.app/templates' />
        <meta property='og:type' content='website' />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex min-h-screen'>
        <Sidebar />
        <div className='flex w-full flex-col lg:pl-[240px]'>
          <div className='flex-1 flex flex-col px-3 pt-[60px] sm:px-6 sm:pt-[80px] pb-12'>
            <section className='mt-4 rounded-t-3xl bg-gradient-to-b from-primary-50 via-background to-background dark:from-primary-900/30 px-4 pt-4 sm:px-6 sm:pt-6 md:px-10 md:pt-10'>
              <p className='mb-1 md:mb-3 text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-500 sm:text-sm'>
                {t('hero.eyebrow')}
              </p>
              <h1
                className={`text-xl font-bold text-heading sm:text-3xl  ${i18n.language === 'ja' ? 'md:' : 'md:text-5xl'}`}>
                {t('hero.title')}
              </h1>
              <p className='md:mt-4 mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg'>
                {t('hero.description')}
              </p>
            </section>

            <div className='sticky top-[50px] sm:top-[64px] z-20 bg-card/80 backdrop-blur-md rounded-b-3xl shadow-sm px-4 pb-4 sm:px-6 sm:pb-6 md:px-10 md:pb-6 border-b border-border'>
              <div className='md:mt-6 mt-4 relative group -mx-4 sm:-mx-6 md:-mx-10'>
                <button
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 shadow-md rounded-full border border-border text-muted-foreground hover:text-primary-600 transition-opacity duration-200 ${
                    showLeftArrow
                      ? 'opacity-100'
                      : 'opacity-0 pointer-events-none'
                  } hidden md:block`}
                  onClick={() => scroll('left')}
                  aria-label='Scroll left'>
                  <FiChevronLeft className='w-5 h-5' />
                </button>

                <div
                  ref={scrollContainerRef}
                  onScroll={checkScroll}
                  className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 sm:px-6 md:px-10'>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type='button'
                      onClick={() => handleScrollToCategory(category.id)}
                      className={`flex-shrink-0 justify-center items-center rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm whitespace-nowrap flex items-center gap-1.5 ${
                        activeCategory === category.id
                          ? 'border-primary-500 bg-primary-500 text-white shadow'
                          : 'border-border bg-card text-muted-foreground hover:border-primary-200 hover:text-primary-600'
                      }`}>
                      {category.icon && <category.icon className='w-4 h-4' />}
                      {resolveKey(t, category.titleKey)}
                    </button>
                  ))}
                </div>

                <button
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 shadow-md rounded-full border border-border text-muted-foreground hover:text-primary-600 transition-opacity duration-200 ${
                    showRightArrow
                      ? 'opacity-100'
                      : 'opacity-0 pointer-events-none'
                  } hidden md:block`}
                  onClick={() => scroll('right')}
                  aria-label='Scroll right'>
                  <FiChevronRight className='w-5 h-5' />
                </button>
              </div>
            </div>

            <div className='mt-4 md:mt-6 px-2 sm:px-4 md:px-10'>
              <div className='flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12'>
                {categories.map(category => (
                  <section
                    key={category.id}
                    id={`template-section-${category.id}`}
                    data-category-id={category.id}
                    className='scroll-mt-[140px] sm:scroll-mt-[200px]'
                    ref={node => {
                      sectionRefs.current[category.id] = node;
                    }}>
                    <div className='mb-2 flex flex-col gap-2 sm:gap-3'>
                      <div className='flex items-center justify-between md:gap-3 gap-2'>
                        <div className='flex items-center md:gap-3 gap-2'>
                          {category.icon && (
                            <category.icon className='h-5 w-5 md:h-6 md:w-6 text-primary-600' />
                          )}
                          <h2 className='md:text-lg text-base font-semibold text-foreground sm:text-2xl'>
                            {resolveKey(t, category.titleKey)}
                          </h2>
                        </div>
                        {category.seeAllRoute && (
                          <Button
                            size='sm'
                            variant='light'
                            className='text-xs sm:text-sm text-primary-600 hover:text-primary-700'
                            onPress={() =>
                              router.push(category.seeAllRoute || '/playground')
                            }>
                            {t('buttons.seeAll')}
                          </Button>
                        )}
                      </div>
                      {category.descriptionKey && (
                        <p className='w-full text-xs text-muted-foreground sm:text-sm md:text-base'>
                          {resolveKey(t, category.descriptionKey)}
                        </p>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'>
                      {category.templates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onUse={handleUseTemplate}
                          onPreview={handlePreview}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
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
                    ? resolveKey(t, previewTemplate.nameKey)
                    : ''}
                </ModalHeader>
                <ModalBody className='px-6 py-0 flex justify-center'>
                  {previewTemplate ? (
                    previewTemplate.media.type === 'video' ? (
                      <video
                        src={previewTemplate.media.src}
                        poster={previewTemplate.media.poster}
                        controls
                        playsInline
                        className='max-h-[70vh] max-w-full rounded-2xl object-contain'
                      />
                    ) : (
                      <img
                        src={previewTemplate.media.src}
                        alt={resolveKey(t, previewTemplate.nameKey)}
                        className='max-h-[70vh] max-w-full rounded-2xl object-contain'
                      />
                    )
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  <Button variant='light' onPress={closePreviewModal}>
                    {t('buttons.close')}
                  </Button>
                  <Button
                    color='primary'
                    onPress={() => {
                      if (previewTemplate) {
                        handleUseTemplate(previewTemplate);
                      }
                      closePreviewModal();
                    }}>
                    {t('buttons.useTemplate')}
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
