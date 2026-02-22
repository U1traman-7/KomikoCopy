import Head from 'next/head';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, CardBody } from '@nextui-org/react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { aiTools, ToolItem } from '../constants';
import { useCollectForyou } from '../hooks/useCollectForyou';
import { SiteFooter } from '@/components/site-footer';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { TbPhotoEdit, TbBook2 } from 'react-icons/tb';
import { GoPlay } from 'react-icons/go';

type AppTool = ToolItem & {
  categoryTitle?: string;
  categoryTitleKey?: string;
};

type TranslateFn = TFunction<['ai-apps', 'common']>;

const getToolTitle = (tool: ToolItem, t: TranslateFn) => {
  if (tool.title_key) {
    return t(tool.title_key, { ns: 'common' });
  }
  return tool.title;
};

const getToolDescription = (tool: ToolItem, t: TranslateFn) => {
  if (tool.content_key) {
    return t(tool.content_key, { ns: 'common' });
  }
  return tool.content;
};

const placeholderImage = '/images/styles/anime.webp';

const CATEGORY_FILTERS_CONFIG = [
  {
    id: 'all',
    labelKey: 'filters.categories.all',
    fallback: 'All tools',
  },
  {
    id: 'illustration',
    labelKey: 'filters.categories.illustration',
    fallback: 'Illustration & Concept Art',
  },
  {
    id: 'animation',
    labelKey: 'filters.categories.animation',
    fallback: 'Animation & Video Tools',
  },
  {
    id: 'comic',
    labelKey: 'filters.categories.comic',
    fallback: 'Comics · Manga · Manhwa',
  },
] as const;

type CategoryFilterId = (typeof CATEGORY_FILTERS_CONFIG)[number]['id'];

export default function AiAppsPage() {
  const { t } = useTranslation(['ai-apps', 'common']);
  const { collList, addCollectFunc, removeCollectFunc } = useCollectForyou();

  const translateCommon = (key?: string) =>
    key ? t(key, { ns: 'common' }) : '';
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const manualScrollTarget = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const favoritePaths = useMemo(
    () => new Set(collList.map(tool => tool.path)),
    [collList],
  );

  const categorizedApps = useMemo(
    () =>
      aiTools
        .filter(set => Array.isArray(set.entries) && set.entries.length > 0)
        .map(set => ({
          ...set,
          entries: set.entries
            .filter(entry => !entry.derivative)
            .map<AppTool>(entry => ({
              ...entry,
              categoryTitle: set.title,
              categoryTitleKey: set.title_key,
            })),
        }))
        .filter(set => set.entries.length > 0),
    [],
  );

  const getCategoryIcon = (categoryKey: string) => {
    if (categoryKey.includes('illustration')) {
      return <TbPhotoEdit className='w-4 h-4' />;
    }
    if (categoryKey.includes('animation')) {
      return <GoPlay className='w-4 h-4' />;
    }
    if (categoryKey.includes('comic')) {
      return <TbBook2 className='w-4 h-4' />;
    }
    return null;
  };

  const navItems = useMemo(() => {
    const items: { id: string; label: string; icon?: React.ReactNode }[] = [];

    if (collList.length > 0) {
      items.push({
        id: 'favorites',
        label: t('sections.favorites.title'),
        icon: <FaStar className='w-4 h-4' />,
      });
    }

    categorizedApps.forEach(category => {
      // Use filters.categories from ai-apps.json for short labels
      const filterKey = category.category as CategoryFilterId;
      let shortLabel: string;

      if (
        filterKey &&
        filterKey !== 'all' &&
        CATEGORY_FILTERS_CONFIG.some(f => f.id === filterKey)
      ) {
        // Use the short label from ai-apps.json filters
        // Explicitly specify namespace since useTranslation has multiple namespaces
        shortLabel = t(`filters.categories.${filterKey}`, {
          ns: 'ai-apps',
          defaultValue: category.title,
        });
      } else {
        // Fallback to full title
        shortLabel = translateCommon(category.title_key) || category.title;
      }

      items.push({
        id: `category-${category.title_key || category.title}`,
        label: shortLabel,
        icon: getCategoryIcon(category.title_key || ''),
      });
    });

    return items;
  }, [collList, categorizedApps, t]);

  // Set initial active section
  useEffect(() => {
    if (!activeSection && navItems.length > 0) {
      setActiveSection(navItems[0].id);
    }
  }, [navItems, activeSection]);

  const handleScrollToSection = (sectionId: string) => {
    manualScrollTarget.current = sectionId;
    setActiveSection(sectionId);
    const node = sectionRefs.current[sectionId];
    if (!node) {
      return;
    }

    // Adjust scroll position to account for sticky header
    const isMobile = window.innerWidth < 768;
    const yOffset = isMobile ? -135 : -180; // Mobile vs Desktop header height
    const y = node.getBoundingClientRect().top + window.scrollY + yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }
          const sectionId = entry.target.getAttribute('data-section-id');
          if (!sectionId) {
            return;
          }

          if (manualScrollTarget.current) {
            if (sectionId !== manualScrollTarget.current) {
              return;
            }
            manualScrollTarget.current = null;
          }
          setActiveSection(sectionId);
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px', // Adjust detection area
        threshold: 0,
      },
    );

    // Observe favorites
    if (sectionRefs.current['favorites']) {
      observer.observe(sectionRefs.current['favorites']);
    }

    // Observe categories
    categorizedApps.forEach(category => {
      const sectionId = `category-${category.title_key || category.title}`;
      const node = sectionRefs.current[sectionId];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [categorizedApps, collList]);

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
  }, [navItems]);

  const handleToggleFavorite = (tool: ToolItem) => {
    if (favoritePaths.has(tool.path)) {
      removeCollectFunc(tool);
    } else {
      addCollectFunc(tool);
    }
  };

  return (
    <main className='flex h-screen flex-col bg-background text-foreground'>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name='description' content={t('meta.description')} />
        <meta property='og:title' content={t('meta.title')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta property='og:url' content='https://komiko.app/ai-apps' />
        <meta property='og:type' content='website' />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex min-h-screen'>
        <Sidebar />
        <div className='flex w-full flex-col lg:pl-[240px]'>
          <div className='flex-1 flex flex-col px-3 pt-[60px] sm:px-6 sm:pt-[80px] pb-12 sm:px-4 md:px-10'>
            {/* Hero Section */}
            <section className='rounded-t-3xl bg-gradient-to-b from-primary-50 via-background to-background px-4 pt-4 sm:px-6 sm:pt-6 md:px-10 md:pt-10'>
              <p className='mb-1 md:mb-3 text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-500 sm:text-sm'>
                {t('hero.eyebrow')}
              </p>
              <h1 className='text-2xl font-bold text-heading sm:text-3xl md:text-5xl'>
                {t('hero.title')}
              </h1>
              <p className='md:mt-4 mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg'>
                {t('hero.description')}
              </p>
            </section>

            {/* Sticky Filter Bar */}
            <div className='sticky top-[50px] sm:top-[64px] z-20 bg-card/80 backdrop-blur-md rounded-b-3xl shadow-sm px-4 pb-3 sm:px-6 sm:pb-6 md:px-10 md:pb-6 border-b border-border'>
              <div className='md:mt-6 mt-4 relative group -mx-4 sm:-mx-6 md:-mx-10'>
                <button
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 shadow-md rounded-full border border-border text-muted-foreground hover:text-primary-600 dark:hover:text-primary-500 transition-opacity duration-200 ${
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
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => handleScrollToSection(item.id)}
                      className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm whitespace-nowrap flex items-center gap-1.5 ${
                        activeSection === item.id
                          ? 'border-primary-500 bg-primary-500 text-white shadow'
                          : 'border-border bg-card text-muted-foreground hover:border-primary-200 hover:text-primary-600 dark:hover:text-primary-500'
                      }`}>
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 shadow-md rounded-full border border-border text-muted-foreground hover:text-primary-600 dark:hover:text-primary-500 transition-opacity duration-200 ${
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

            <div className='md:mt-6 mt-4 px-2 sm:px-4 md:px-10'>
              {/* Favorites Section */}
              {collList.length > 0 && (
                <section
                  ref={node => {
                    if (node) {
                      sectionRefs.current['favorites'] = node;
                    } else {
                      delete sectionRefs.current['favorites'];
                    }
                  }}
                  data-section-id='favorites'
                  className='mb-8 sm:mb-10 mt-4 sm:mt-6 rounded-2xl bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 dark:from-orange-800/60 dark:via-amber-800/45 dark:to-yellow-800/50 border border-orange-100/60 dark:border-amber-600/50 md:p-4 p-3 pr-0 md:pr-6 sm:p-5 md:p-6 scroll-mt-[140px] sm:scroll-mt-[200px] shadow-sm relative overflow-y-hidden'>
                  <div className='absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-2xl pointer-events-none' />
                  <div className='absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none' />

                  <div className='relative flex items-center gap-2 mb-2 md:mb-4'>
                    <div className='p-1.5 rounded-lg bg-orange-100 text-orange-500'>
                      <FaStar className='w-3.5 h-3.5' />
                    </div>
                    <h2 className='md:text-lg text-base font-semibold text-foreground sm:text-xl tracking-tight'>
                      {t('sections.favorites.title')}
                    </h2>
                  </div>

                  <div
                    className='flex md:gap-3 gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide snap-x snap-mandatory items-stretch pl-8 sm:pl-10 pr-2 pt-1'
                    aria-label={t('sections.favorites.title')}>
                    {collList.map(tool => (
                      <div
                        key={`favorite-${tool.path}`}
                        className='snap-start flex w-28 sm:w-32 md:w-36 flex-shrink-0 relative'>
                        <AppCard
                          tool={tool as AppTool}
                          isFavorite={true}
                          toggleFavorite={handleToggleFavorite}
                          t={t}
                          showDescription={false}
                          className='bg-card/80 hover:bg-card border-orange-100/50 hover:border-orange-200 shadow-sm'
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Apps List */}
              <div className='flex flex-col md:gap-10 gap-8 mt-2'>
                {categorizedApps.map(category => (
                  <div
                    key={category.title}
                    className='scroll-mt-[140px] sm:scroll-mt-[200px]'
                    ref={node => {
                      const sectionId = `category-${category.title_key || category.title}`;
                      if (node) {
                        sectionRefs.current[sectionId] = node;
                      } else {
                        delete sectionRefs.current[sectionId];
                      }
                    }}
                    data-section-id={`category-${category.title_key || category.title}`}>
                    <div className='flex items-center md:gap-3 gap-2 md:mb-5 mb-3 border-b border-border md:pb-4 pb-1'>
                      <div className='md:p-1.5 p-1 rounded-lg bg-muted text-muted-foreground flex-shrink-0'>
                        {getCategoryIcon(category.title_key || '')}
                      </div>
                      <h3 className='md:text-xl text-base font-semibold text-foreground tracking-tight leading-snug'>
                        {translateCommon(category.title_key) || category.title}
                      </h3>
                    </div>
                    <div className='grid gap-3 md:gap-4 sm:grid-cols-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'>
                      {category.entries.map(tool => (
                        <AppCard
                          key={`${category.title}-${tool.path}`}
                          tool={tool}
                          isFavorite={favoritePaths.has(tool.path)}
                          toggleFavorite={handleToggleFavorite}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SiteFooter className='md:border-t' />
        </div>
      </div>
    </main>
  );
}

interface AppCardProps {
  tool: AppTool;
  isFavorite: boolean;
  toggleFavorite: (tool: ToolItem) => void;
  t: TranslateFn;
  showDescription?: boolean;
  className?: string;
}

const AppCard = ({
  tool,
  isFavorite,
  toggleFavorite,
  t,
  showDescription = true,
  className = '',
}: AppCardProps) => {
  const title = getToolTitle(tool, t);
  const description = getToolDescription(tool, t);
  const imageUrl = tool.image_url || placeholderImage;
  const [visible, setVisible] = useState(false);
  const mediaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mediaRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 },
    );
    observer.observe(mediaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className='w-full relative'>
      <Card
        as={Link}
        href={tool.path}
        className={`flex flex-col w-full h-full shadow-sm hover:shadow-md border border-border transition-all duration-300 hover:-translate-y-1 ${className}`}>
        <div
          ref={mediaRef}
          className='relative border-b border-border inset-0 overflow-hidden aspect-[16/10] bg-muted'>
          {tool.video_url ? (
            visible ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload='none'
                className='absolute inset-0 w-full h-full object-cover'>
                <source
                  src={tool.video_url}
                  type={
                    tool.video_url.endsWith('.webm')
                      ? 'video/webm'
                      : 'video/mp4'
                  }
                />
              </video>
            ) : (
              <div className='absolute inset-0 w-full h-full bg-muted' />
            )
          ) : (
            <img
              loading='lazy'
              src={imageUrl}
              className='absolute inset-0 w-full h-full object-cover'
              draggable={false}
              alt={title}
            />
          )}

          <button
            type='button'
            aria-label={
              isFavorite
                ? t('buttons.removeFavorite')
                : t('buttons.addFavorite')
            }
            className='absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-card/95 text-yellow-500 shadow'
            onClick={event => {
              event.preventDefault();
              toggleFavorite(tool);
            }}>
            {isFavorite ? (
              <FaStar className='h-4 w-4 ' />
            ) : (
              <FaRegStar className='h-4 w-4' />
            )}
          </button>
        </div>

        <CardBody
          className={`flex-grow border-border ${isFavorite ? 'p-2 md:p-3' : ''}`}>
          <div>
            <h3
              className={`font-semibold text-foreground md:text-base ${isFavorite ? 'text-xs ' : 'text-sm'}`}>
              {title}
            </h3>
            {showDescription && (
              <p className='mt-1 text-xs md:text-sm text-muted-foreground'>
                {description}
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
