// [#target:tools]
/* eslint-disable */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  Component,
  type ReactNode,
  type ErrorInfo,
} from 'react';
import { Header } from '../Components/Header';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { Trans, useTranslation } from 'react-i18next';
import cn from 'classnames';
import { getCreateYoursData, POSITIVE_PROMPT } from '../utilities/tools';
import {
  Card,
  Image,
  Button,
  useDisclosure,
  Accordion,
  AccordionItem,
} from '@nextui-org/react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import useMobileScreen from 'hooks/useMobileScreen';
import {
  enUS,
  es,
  fr,
  de,
  it,
  ja,
  ko,
  zhCN,
  zhTW,
  hi,
  pt,
  id,
  ru,
  th,
  vi,
  type Locale,
} from 'date-fns/locale';
import Masonry from 'react-masonry-css';
import { HiOutlineDownload } from 'react-icons/hi';
import { downloadURI } from '../utilities';
import toast from 'react-hot-toast';
import { Sidebar } from '../Components/Sidebar';
import ModalImage from '@/components/ModalImage';
import { useRouter } from 'next/router';
import { LoginContext } from './create';
import { useLoginModal } from 'hooks/useLoginModal';
import { useAtomValue } from 'jotai';
import { authAtom } from 'state';
import { SiteFooter } from '@/components/site-footer';
import { BiSolidZap } from 'react-icons/bi';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { useVariantData } from '../Components/ToolsPage/TemplateWrapper';
import { useVariantContent } from '../hooks/useVariantContent';
import { Breadcrumb } from '../Components/common/Breadcrumb';
import { ProTipCarousel } from '../Components/common/ProTipCarousel';
import XPosts from '../Components/content/XPosts';
import nextDynamic from 'next/dynamic';
import {
  loadServerTranslation,
  TranslationData,
} from '../lib/server-translations';
import { GetStaticProps } from 'next';
import { cleanQualityModifiers } from '../utilities/promptUtils';
import { AI_ANIME_GENERATOR, getDraft } from '@/utils/draft';

import {
  ImageGenerationController,
  type ImageGenerationControllerRef,
} from '../Components/RightSidebar/RightSidebar';

// 创建一个SEO友好的静态内容组件
const StaticSEOContent = ({ content, isMobile }) => {
  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'whatIs':
        return (
          <div key='whatIs' className='pt-14 md:pt-16 md:mt-16'>
            <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.whatIs.title}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
              <p>{content.sections.whatIs.description}</p>
            </div>
          </div>
        );

      case 'howToUse':
        return (
          <div key='howToUse' className='pt-14 md:py-16'>
            <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.howToUse.title}
            </h2>
            <p className='mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {content.sections.howToUse.subtitle}
            </p>
            <div className='grid grid-cols-1 gap-8 md:px-4 sm:grid-cols-2 lg:grid-cols-4'>
              {(content.sections.howToUse.steps || []).map((step, index) => (
                <div
                  key={step.title}
                  className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-white bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {index + 1}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='mb-3 text-lg font-bold text-primary-600 dark:text-primary-400 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'whyUse':
        return (
          <div
            key='whyUse'
            className='py-14 md:py-16 bg-gradient-to-b from-background dark:from-gray-900 rounded-xl to-primary-100 dark:to-gray-800 md:mb-8'>
            <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.whyUse.title}
            </h2>
            <p className='mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {content.sections.whyUse.subtitle}
            </p>
            <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
              {(content.sections.whyUse.features || []).map(feature => (
                <div
                  key={feature.title}
                  className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                  <div className='flex items-center mb-4'>
                    <h3 className='text-md md:text-xl font-semibold text-primary-600 dark:text-primary-400'>
                      {feature.title}
                    </h3>
                  </div>
                  <p className='text-muted-foreground text-sm md:text-base'>
                    {feature.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'applications':
        return (
          <div key='applications' className='py-16'>
            <h2 className='mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.applications.title}
            </h2>
            <div className='grid grid-cols-1 gap-8 md:px-4 sm:grid-cols-2'>
              {(content.sections.applications.items || []).map(app => (
                <div
                  key={app.title}
                  className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <h3 className='mb-3 text-md md:text-xl font-semibold text-primary-600 dark:text-primary-400'>
                    {app.title}
                  </h3>
                  <p className='text-muted-foreground text-sm md:text-base'>
                    {app.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tips':
        return (
          <div key='tips' className='pb-16 md:py-16'>
            <div className='p-6 rounded-xl border bg-primary-50 border-primary-100'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-600 dark:text-primary-400 md:text-2xl'>
                {content.tips.title}
              </h2>
              <ul className='space-y-3 text-muted-foreground text-sm md:text-base'>
                {(content.tips.items || []).map((tip, index) => (
                  <li
                    key={index}
                    dangerouslySetInnerHTML={{ __html: tip }}></li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div key='faq' className='pb-14 md:py-16'>
            <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.faq.title}
            </h2>
            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full'>
                <FAQComp />
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div key='cta' className='py-8 md:py-16 text-center px-4'>
            <h2 className='mb-4 md:mb-6 text-xl md:text-3xl font-bold text-heading'>
              {content.cta.title}
            </h2>
            <p className='mx-auto mb-6 md:mb-8 max-w-2xl text-sm md:text-lg text-muted-foreground'>
              {content.cta.description}
            </p>
            <Button
              color='primary'
              size={isMobile ? 'md' : 'lg'}
              className='px-4 md:px-8 text-base md:text-lg font-semibold'
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
              {content.cta.buttonText}
            </Button>
          </div>
        );
      case 'xposts':
        return (
          <div className='pt-8 md:pt-12'>
            <XPosts
              title={'X Posts about ' + content.header.title}
              posts={content.xposts}
              breakpointCols={{
                default: 3,
                1400: 2,
                768: 1,
              }}
            />
          </div>
        );
      case 'moreAITools':
        return (
          <div key='moreAITools' className='py-16'>
            <MoreAITools category='illustration' />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex justify-center w-full'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-2 2xl:px-16'>
        {content.pageStructure.map(section => renderSection(section))}
      </div>
    </div>
  );
};

// 创建动态交互组件
const InteractiveContent = ({
  inputValue,
  setInputValue,
  onImageLoaded,
  isMobile,
  images,
  setImages,
  isAuth,
  selectedImage,
  setSelectedImage,
  isPromptReferenceCollapsed,
  setIsPromptReferenceCollapsed,
  autoGenerate,
}) => {
  const { t } = useTranslation(['ai-anime-generator', 'toast']);
  const router = useRouter();
  const imageGenRef = useRef<ImageGenerationControllerRef>(null);
  const hasAutoGenerated = useRef(false);

  // Auto-generate when autoGenerate is true and we have a prompt
  useEffect(() => {
    if (
      autoGenerate &&
      inputValue &&
      inputValue.trim() !== '' &&
      !hasAutoGenerated.current &&
      imageGenRef.current
    ) {
      hasAutoGenerated.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        imageGenRef.current?.triggerGenerate();
        // Clean up the autoGenerate query param
        router.replace(
          { pathname: router.pathname, query: { prompt: inputValue } },
          undefined,
          { shallow: true },
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoGenerate, inputValue, router]);

  return (
    <div
      className={`w-full rounded-lg md:rounded-none md:p-0 ${isMobile ? 'mt-1' : 'mt-4'} flex-grow h-auto flex justify-center`}>
      <div className='w-full'>
        <ImageGenerationController
          ref={imageGenRef}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onImageLoaded={onImageLoaded}
          isMobile={isMobile}
          showPreset={true}
          classNames={{
            leftSidebar: 'w-full',
          }}
          showImagesCount
          tool='ai-anime-generator'
          stackChip={isMobile}
          className='relative z-30 h-full'
          isPromptReferenceCollapsed={isPromptReferenceCollapsed}
          setIsPromptReferenceCollapsed={setIsPromptReferenceCollapsed}>
          <div
            className={cn('flex flex-col flex-1 min-h-[60vh]', {
              'mt-1 w-full': isMobile,
            })}>
            <div className='flex items-center justify-between mb-2 h-[32px]'>
              <h3 className='font-bold text-md text-primary-600 dark:text-primary-600'>
                {t('results.title')}
              </h3>
            </div>
            <GenerationResult
              className={cn('flex-1 flex-grow bg-background', {
                'h-full': isMobile,
              })}
              images={images}
              setImages={setImages}
              isMobile={isMobile}
              isAuth={isAuth}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onDelete={() => {
                setImages(
                  images.filter(image => image.id !== selectedImage?.id),
                );
                setSelectedImage(null);
              }}
            />
          </div>
        </ImageGenerationController>
      </div>
    </div>
  );
};

// Component to handle image loading with placeholder
const ImageWithPlaceholder = memo(
  ({ src, alt }: { src: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
      <div className='relative w-full'>
        {!isLoaded && (
          <div className='w-full aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-none'>
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer'></div>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          className={`w-full h-auto object-contain rounded-none transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'absolute inset-0 opacity-0'
          }`}
          loading='lazy'
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  },
);

const locales = {
  en: enUS,
  es,
  fr,
  de,
  it,
  ja,
  ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  hi,
  pt,
  id,
  th,
  ru,
  vi,
};

interface GenerationResultProps {
  className?: string;
  images: ImageGeneration[];
  setImages: React.Dispatch<React.SetStateAction<ImageGeneration[]>>;
  isMobile?: boolean;
  isAuth?: boolean;
}

interface ImageGeneration {
  id: number | string;
  created_at: string;
  prompt?: string;
  model?: string;
  url_path: string;
  tool: string;
  user_id: string;
  status?: 'generating' | 'done';
}

interface StepItem {
  title: string;
  content: string;
}

interface FeatureItem {
  title: string;
  content: string;
}

interface StyleItem {
  title: string;
  content: string;
}

interface ApplicationItem {
  title: string;
  content: string;
}

interface VariantExampleImage {
  title: string;
  image: string;
  alt: string;
  prompt?: string;
}

const FAQComp = memo(() => {
  const { t } = useTranslation('ai-anime-generator');
  const { isVariant, data } = useVariantData();
  const content = useVariantContent(isVariant, data, t);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const faqItems = content.faq.items;

  return (
    <>
      {faqItems.map((faq, index) => (
        <div key={index} className='rounded-lg shadow-sm'>
          <button
            className='flex justify-between items-center px-6 py-4 w-full text-left'
            onClick={() => setOpenFaqId(openFaqId === index ? null : index)}>
            <span className='text-sm md:text-lg font-medium text-foreground'>
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-muted-foreground transform transition-transform ${
                openFaqId === index ? 'rotate-180' : ''
              }`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
          {openFaqId === index && (
            <div className='px-6 pb-4'>
              <p className='text-muted-foreground text-sm md:text-base'>
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </>
  );
});

class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Unknown error' };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ai-anime-generator] Client crash:', error?.message);
    console.error('[ai-anime-generator] Stack:', error?.stack);
    console.error('[ai-anime-generator] Component stack:', info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center min-h-[40vh] gap-4'>
          <p className='text-muted-foreground'>Something went wrong. Please refresh the page.</p>
          <button
            className='px-4 py-2 bg-primary-500 text-white rounded-lg'
            onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const GenerationResult = memo(
  ({
    className,
    images,
    setImages,
    isMobile,
    isAuth,
    selectedImage,
    setSelectedImage,
    inputValue,
    setInputValue,
    onDelete,
  }: GenerationResultProps & {
    selectedImage: ImageGeneration | null;
    setSelectedImage: (image: ImageGeneration | null) => void;
    inputValue?: string;
    setInputValue?: (value: string) => void;
    onDelete?: () => void;
  }) => {
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver>();
    const { t, i18n } = useTranslation(['ai-anime-generator', 'toast']);
    const { isVariant, data } = useVariantData();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [columnCount, setColumnCount] = useState(4);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle wheel events to prevent scroll propagation
    const lastImageRef = useCallback(
      (node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
            console.log('loading more images');
            loadMoreImages();
          }
        });
        if (node) observer.current.observe(node);
      },
      [loading, hasMore],
    );

    // Function to calculate the optimal number of columns
    const calculateColumns = useCallback(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const minColumnWidth = 200; // Minimum column width in pixels
      const gap = 16; // Gap between columns in pixels (equivalent to gap-4)

      // Calculate how many columns of minColumnWidth can fit, considering gaps
      let columns = Math.floor((containerWidth + gap) / (minColumnWidth + gap));

      // Minimum 1 column, maximum 6 columns
      columns = Math.max(1, Math.min(6, columns));

      setColumnCount(columns);
    }, []);

    // Update columns on resize
    useEffect(() => {
      calculateColumns();

      const handleResize = () => {
        calculateColumns();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [calculateColumns]);

    const formatDate = (dateString: string, locale: Locale = enUS) => {
      if (!dateString || typeof dateString !== 'string') return t('date.today');
      const date = parseISO(dateString);
      if (isToday(date)) return t('date.today');
      if (isYesterday(date)) return t('date.yesterday');
      return format(date, 'MMMM d, yyyy', { locale });
    };

    const groupImagesByDate = (images: ImageGeneration[]) => {
      const groups: { [key: string]: ImageGeneration[] } = {};
      images.forEach(image => {
        const date = formatDate(
          image.created_at,
          locales[i18n.language as keyof typeof locales],
        );
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(image);
      });
      return groups;
    };

    const loadMoreImages = async () => {
      if (loading) return;
      setLoading(true);
      try {
        const response = await fetch('/api/tools/image-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'getImages',
            tool: 'ai-anime-generator',
            pageNo: Math.floor(images.length / 16) + 1,
            pageSize: 16,
          }),
        });
        const data = await response.json();
        if (data.data) {
          const newImages = data.data
            .filter((image: ImageGeneration) => image.url_path)
            .map((image: ImageGeneration) => ({
              ...image,
              url_path: image.url_path.startsWith('https')
                ? image.url_path
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/${image.url_path}`,
              status: 'done',
            }));

          // Prevent duplicates by checking image IDs
          setImages(prev => {
            const existingIds = new Set(prev.map(img => img.id));
            const uniqueNewImages = newImages.filter(
              img => !existingIds.has(img.id),
            );
            return [...prev, ...uniqueNewImages];
          });

          setHasMore(data.data.length >= 16);
        }
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      isAuth && loadMoreImages();
    }, [isAuth]);

    const groupedImages = groupImagesByDate(images);

    const breakpointColumnsObj = {
      default: isMobile ? 2 : columnCount,
      1600: isMobile ? 2 : Math.min(columnCount, 5),
      1400: isMobile ? 2 : Math.min(columnCount, 4),
      1200: isMobile ? 2 : Math.min(columnCount, 3),
      800: isMobile ? 3 : Math.min(columnCount, 1),
      600: isMobile ? 2 : Math.min(columnCount, 1),
    };

    const handleImageClick = (image: ImageGeneration) => {
      const cleanedPrompt = cleanQualityModifiers(image.prompt || '');
      const imageWithCleanedPrompt = { ...image, prompt: cleanedPrompt };
      setSelectedImage(imageWithCleanedPrompt);
      onOpen();
    };

    const handleDownload = (e: React.MouseEvent, image: ImageGeneration) => {
      e.stopPropagation();
      const ext = image.url_path.split('.').pop() || 'jpg';
      downloadURI(image.url_path, `KomikoAI.${ext}`);
      toast.success(t('toast:success.download'));
    };

    const handleExampleImageClick = (example: any) => {
      if (example.prompt && setInputValue) {
        setInputValue(example.prompt);
      }
    };

    if (images.length === 0) {
      const defaultExampleImages = [
        {
          id: 17,
          url_path: '/images/examples/ai-anime-generator/two-girl.webp',
          alt: 'Two anime girls',
          prompt:
            'two anime girls, best friends, colorful anime style, detailed artwork',
        },
        {
          id: 18,
          url_path: '/images/examples/ai-anime-generator/girl.webp',
          alt: 'Anime girl',
          prompt:
            'anime girl, beautiful detailed face, masterpiece, best quality',
        },
        {
          id: 19,
          url_path: '/images/examples/ai-anime-generator/boy1.webp',
          alt: 'Anime boy',
          prompt: 'anime boy, handsome character, detailed anime art style',
        },
        {
          id: 20,
          url_path: '/images/examples/ai-anime-generator/girl2.webp',
          alt: 'Anime girl',
          prompt:
            'anime girl, cute expression, vibrant colors, high quality anime art',
        },
        {
          id: 21,
          url_path: '/images/examples/ai-anime-generator/panda.webp',
          alt: 'Girl with panda styled head',
          prompt:
            'anime girl with panda hat, cute kawaii style, adorable character design',
        },
        {
          id: 22,
          url_path: '/images/examples/ai-anime-generator/girl4.webp',
          alt: 'Anime girl',
          prompt:
            'anime girl, elegant pose, beautiful anime artwork, detailed illustration',
        },
        {
          id: 23,
          url_path: '/images/examples/ai-anime-generator/girl3.webp',
          alt: 'Anime girl',
          prompt:
            'anime girl, stylish outfit, modern anime art, high quality rendering',
        },
        {
          id: 24,
          url_path: '/images/examples/ai-anime-generator/fate.webp',
          alt: 'Fate anime',
          prompt:
            'fate anime style character, heroic pose, detailed anime art, epic scene',
        },
      ];

      // 使用变体数据中的示例图片，如果有的话
      const exampleImages =
        isVariant && data?.content.examples
          ? (data.content.examples as VariantExampleImage[]).map(
              (example, index: number) => ({
                id: 100 + index,
                url_path: example.image,
                alt: example.alt,
                prompt: example.prompt || '',
              }),
            )
          : defaultExampleImages;

      return (
        <div
          className={cn(
            'flex overflow-y-auto flex-col items-center pt-4 rounded-lg border border-border border-border md:max-h-none',
            className,
          )}>
          <div className='w-full text-center'>
            <div className='px-4'>
              <p className='mb-2 text-sm font-semibold md:text-base text-primary-700 dark:text-primary-500'>
                {t('emptyState.title')}
              </p>
              <p className='mb-6 text-sm text-muted-foreground md:text-base'>
                {t('emptyState.description')}
              </p>
            </div>

            <div className='relative px-2 mb-2 md:px-4'>
              <style jsx global>{`
                @keyframes shimmer {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(100%);
                  }
                }
                .animate-shimmer {
                  animation: shimmer 2s infinite ease-in-out;
                }
                .example-grid {
                  perspective: 1000px;
                  mask-image: linear-gradient(
                    to bottom,
                    rgba(0, 0, 0, 1) 0%,
                    rgba(0, 0, 0, 1) 50%,
                    rgba(0, 0, 0, 0.8) 60%,
                    rgba(0, 0, 0, 0.6) 70%,
                    rgba(0, 0, 0, 0.4) 80%,
                    rgba(0, 0, 0, 0.2) 90%,
                    rgba(0, 0, 0, 0) 100%
                  );
                  -webkit-mask-image: linear-gradient(
                    to bottom,
                    rgba(0, 0, 0, 1) 0%,
                    rgba(0, 0, 0, 1) 50%,
                    rgba(0, 0, 0, 0.8) 60%,
                    rgba(0, 0, 0, 0.6) 70%,
                    rgba(0, 0, 0, 0.4) 80%,
                    rgba(0, 0, 0, 0.2) 90%,
                    rgba(0, 0, 0, 0) 100%
                  );
                  mask-size: 100% 100%;
                  -webkit-mask-size: 100% 100%;
                  mask-position: center;
                  -webkit-mask-position: center;
                  mask-repeat: no-repeat;
                  -webkit-mask-repeat: no-repeat;
                }
                .example-card {
                  transform-style: preserve-3d;
                  transition: all 0.5s ease-out;
                  opacity: 1;
                }
                .example-card:nth-child(4n + 1) {
                  transform: rotate(0.3deg);
                }
                .example-card:nth-child(4n + 2) {
                  transform: rotate(-0.3deg);
                }
                .example-card:nth-child(4n + 3) {
                  transform: rotate(0.3deg);
                }
                .example-card:nth-child(4n + 4) {
                  transform: rotate(-0.3deg);
                }
                @media (hover: hover) {
                  .example-card:hover {
                    transform: rotate(0deg) scale(1.02);
                    z-index: 10;
                  }
                }
              `}</style>
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className='flex gap-2 h-full md:gap-4 example-grid'>
                {exampleImages.map(image => (
                  <div
                    key={image.id}
                    className='mb-2 md:mb-4 example-card group cursor-pointer'
                    style={{
                      marginBottom: '16px',
                      willChange: 'transform, opacity',
                    }}
                    onClick={() => handleExampleImageClick(image)}>
                    <Card className='bg-card overflow-hidden rounded-xl shadow transition-all duration-300 dark:border-muted group-hover:shadow-xl'>
                      <div className='overflow-hidden p-0 bg-card rounded-xl'>
                        <div className='overflow-hidden relative'>
                          <Image
                            src={image.url_path}
                            alt={image.alt}
                            className='object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110'
                            style={{ height: 'auto' }}
                          />
                          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0' />
                          {image.prompt && (
                            <div className='absolute inset-0 flex items-center justify-center opacity-0 bg-black/50 transition-opacity duration-300 group-hover:opacity-100'>
                              <div className='px-3 py-2 text-xs text-white bg-black/70 rounded-lg md:text-sm'>
                                {t('clickToApplyPrompt') ||
                                  'Click to apply prompt'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </Masonry>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'overflow-y-auto p-0 px-2 rounded-lg border border-border border-border md:px-4 h-[60px]',
          isMobile ? 'pt-2' : 'pt-0',
          className,
        )}>
        {Object.entries(groupedImages).map(([date, dateImages], groupIndex) => (
          <div key={date} className='p-2'>
            <h2 className='mb-3 text-sm font-medium text-muted-foreground'>
              {date}
            </h2>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className='flex gap-2 md:gap-3'
              columnClassName='my-masonry-grid_column'>
              {dateImages.map((image, index) => (
                <div
                  key={image.id}
                  ref={
                    index === dateImages.length - 1 &&
                    groupIndex === Object.keys(groupedImages).length - 1
                      ? lastImageRef
                      : undefined
                  }
                  className='relative mb-2 md:mb-3 group'
                  onClick={() =>
                    image.status !== 'generating' && handleImageClick(image)
                  }>
                  <Card className='bg-card relative w-full border border-border border-border cursor-pointer'>
                    <div className='overflow-hidden relative'>
                      {image.status === 'generating' ? (
                        <div className='flex items-center justify-center aspect-square bg-gradient-to-br from-purple-50 to-indigo-100'>
                          <ProTipCarousel
                            className='w-full max-w-sm'
                            autoPlayInterval={4000}
                          />
                        </div>
                      ) : (
                        <ImageWithPlaceholder
                          src={image.url_path}
                          alt='Generated image'
                        />
                      )}
                    </div>
                    {image.status !== 'generating' && (
                      <Button
                        isIconOnly
                        className='absolute top-2 right-2 z-10 bg-card dark:bg-muted rounded-full opacity-100 transition-opacity duration-200 md:opacity-0 md:bg-card/80 hover:bg-card group-hover:opacity-100'
                        onClick={e => handleDownload(e, image)}>
                        <HiOutlineDownload className='w-5 h-5' />
                      </Button>
                    )}
                  </Card>
                </div>
              ))}
            </Masonry>
          </div>
        ))}
        {loading && (
          <div className='py-3 text-center'>
            <div className='inline-flex items-center px-4 py-2 text-sm text-muted-foreground bg-muted rounded-full'>
              <svg
                className='mr-2 -ml-1 w-4 h-4 animate-spin text-primary-500'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
              {t('loading.moreImages')}
            </div>
          </div>
        )}

        <ModalImage
          activeImageUrl={selectedImage?.url_path || ''}
          isOpen={isOpen}
          onClose={onClose}
          prompt={selectedImage?.prompt || ''}
          model={selectedImage?.model}
          generationId={selectedImage?.id}
          type='ai-anime-generator'
          onDelete={onDelete}
        />
      </div>
    );
  },
);

interface AnimeGenerationProps {
  showPreset?: boolean;
  hideResultFirst?: boolean;
}

export const AnimeGeneration = memo(
  ({ showPreset = true, hideResultFirst = false }: AnimeGenerationProps) => {
    const { t } = useTranslation(['ai-anime-generator', 'toast']);
    const isMobile = useMobileScreen();
    const { isVariant, data, getContent } = useVariantData();
    const [inputValue, setInputValue] = useState('');
    const [images, setImages] = useState<ImageGeneration[]>([]);
    const router = useRouter();
    const isAuth = useAtomValue(authAtom);
    const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(
      null,
    );
    const [shouldHideResultFirst, setShouldHideResultFirst] =
      useState(hideResultFirst);
    const [isPromptReferenceCollapsed, setIsPromptReferenceCollapsed] =
      useState(false);

    // Collapse prompt reference on mobile for variant pages
    useEffect(() => {
      if (isVariant) {
        setIsPromptReferenceCollapsed(isMobile);
      }
    }, [isVariant, isMobile]);

    // Get prompt from URL query parameter or set default for variant pages
    useEffect(() => {
      if (!router.isReady || router.query.generationId) {
        return;
      }

      const { prompt, tag } = router.query;
      if (prompt && typeof prompt === 'string' && prompt.trim() !== '') {
        setInputValue(prompt);
      } else if (isVariant && data?.content.examples?.[0]) {
        // For variant pages, auto-set the first example's prompt if it has one
        const firstExample = data.content.examples[0] as any;
        if (firstExample.prompt) {
          setInputValue(firstExample.prompt);
        }
      } else if (tag && typeof tag === 'string' && tag.trim() !== '') {
        setInputValue(tag.replace(/\,\s*$/, '') + ', ');
      }
    }, [
      router.isReady,
      router.query,
      isVariant,
      data,
      router.query.generationId,
    ]);

    // Get Generation preset from PostData(create yours)
    useEffect(() => {
      if (!router.isReady) return;
      const generationId = router.query.generationId;
      if (generationId) {
        const prePostData = getCreateYoursData(generationId as string);
        const generation = prePostData?.generation;

        if (generation) {
          // get model
          const model = generation.model;

          // get prompt
          if (generation.prompt) {
            if (generation.prompt.includes(POSITIVE_PROMPT)) {
              setInputValue(generation.prompt.replace(POSITIVE_PROMPT, ''));
            } else {
              setInputValue(generation.prompt);
            }
          }

          // keep model in URL so controller picks it up
          router.replace(
            { pathname: router.pathname, query: model ? { model } : {} },
            undefined,
            { shallow: true },
          );
        }
      }
    }, [router.isReady, router.query.generationId]);

    const onGenerating = useCallback(() => {
      if (!hideResultFirst) {
        return;
      }
      setShouldHideResultFirst(false);
    }, [hideResultFirst]);

    const onImageLoaded = async (
      imageObj: any,
      options: {
        replace?: boolean | string;
        updateSize?: boolean;
        imageIndex?: number | undefined;
        prompt?: string;
        model?: string;
        selectedCharImages?: any[];
        referenceImage?: string;
        asyncImageFunc?: () => Promise<any>;
        numGenerations?: number;
      },
    ) => {
      if (options.asyncImageFunc) {
        // Add placeholder images for each generation
        const numGenerations = options.numGenerations || 1;
        const placeholders: ImageGeneration[] = Array(numGenerations)
          .fill(null)
          .map(() => ({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            url_path: '/images/placeholder.jpg',
            tool: 'ai-anime-generator',
            status: 'generating',
            prompt: options.prompt,
            user_id: '',
            model: options.model,
          }));

        setImages(prev => [...placeholders, ...prev]);

        try {
          const { imageUrls } = await options.asyncImageFunc();
          // console.log("Generated imageUrls:", imageUrls);

          // Replace placeholders with actual images
          setImages(prev => {
            const newPlaceholders = prev.filter(p =>
              placeholders.some(np => np.id === p.id),
            );
            const otherPlaceholders = prev.filter(
              p =>
                p.status === 'generating' &&
                !newPlaceholders.some(np => np.id === p.id),
            );
            const existingImages = prev.filter(p => p.status !== 'generating');

            // Add new generated images
            const generatedImages = imageUrls.map(
              ({ id, url }: { id: string; url: string }) => ({
                id: id,
                created_at: new Date().toISOString(),
                url_path: url,
                tool: 'ai-anime-generator',
                status: 'done',
                prompt: options.prompt,
                model: options.model,
              }),
            );

            // Create a Set of existing image URLs to prevent duplicates
            const existingUrls = new Set(
              existingImages.map(img => img.url_path),
            );
            const uniqueGeneratedImages = generatedImages.filter(
              img => !existingUrls.has(img.url_path),
            );

            return [
              ...otherPlaceholders,
              ...uniqueGeneratedImages,
              ...existingImages,
            ];
          });
        } catch (error) {
          console.error('Error generating images:', error);
          // On error, remove only the placeholders for this specific request
          setImages(prev => {
            const placeholderIds = new Set(placeholders.map(p => p.id));
            return prev.filter(img => !placeholderIds.has(img.id));
          });
        }
      }
    };
    return (
      <div
        className={`w-full rounded-lg md:rounded-none md:p-0 ${
          isMobile ? 'mt-1' : 'mt-4'
        }  flex-grow h-auto flex justify-center`}>
        {/* 主要内容区域 - 使用响应式布局 */}
        <div className='w-full'>
          {/* 左侧：生成控制器区域 */}
          <ImageGenerationController
            inputValue={inputValue}
            setInputValue={setInputValue}
            onImageLoaded={onImageLoaded}
            isMobile={isMobile}
            showPreset={showPreset}
            classNames={{
              leftSidebar: 'w-full',
            }}
            showImagesCount
            tool='ai-anime-generator'
            stackChip={isMobile}
            className='relative z-30 h-full'
            isPromptReferenceCollapsed={isPromptReferenceCollapsed}
            setIsPromptReferenceCollapsed={setIsPromptReferenceCollapsed}
            onGenerating={onGenerating}>
            {/* 结果区域放在这里作为 ImageGenerationController 的子组件 */}
            {!shouldHideResultFirst && (
              <div
                className={cn('flex flex-col flex-1 min-h-[60vh]', {
                  'mt-1 w-full': isMobile,
                })}>
                <div className='flex items-center justify-between mb-2 h-[32px]'>
                  <h3 className='font-bold text-md text-primary-600 dark:text-primary-500'>
                    {t('results.title')}
                  </h3>
                </div>
                <GenerationResult
                  className={cn('flex-1 flex-grow bg-background', {
                    'h-full': isMobile,
                  })}
                  images={images}
                  setImages={setImages}
                  isMobile={isMobile}
                  isAuth={isAuth}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onDelete={() => {
                    setImages(
                      images.filter(image => image.id !== selectedImage?.id),
                    );
                    setSelectedImage(null);
                  }}
                />
              </div>
            )}
          </ImageGenerationController>
        </div>
      </div>
    );
  },
);

// 添加一个useMediaQuery钩子
const useMediaQuery = (width: number) => {
  const [targetReached, setTargetReached] = useState(false);

  useEffect(() => {
    const updateTarget = () => {
      if (window.innerWidth >= width) {
        setTargetReached(true);
      } else {
        setTargetReached(false);
      }
    };
    updateTarget();
    window.addEventListener('resize', updateTarget);
    return () => window.removeEventListener('resize', updateTarget);
  }, [width]);

  return targetReached;
};

interface AiAnimeGeneratorPageProps {
  translations?: TranslationData;
  xPostsData?: any[];
}

export default function AiAnimeGeneratorPage({
  translations,
  xPostsData,
}: AiAnimeGeneratorPageProps) {
  const { t, i18n } = useTranslation(['ai-anime-generator', 'toast']);
  const { isVariant, data, getContent } = useVariantData();
  const content = useVariantContent(isVariant, data, t);
  const [inputValue, setInputValue] = useState('');
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const isMobile = useMobileScreen();
  const isLargeScreen = useMediaQuery(820); // 屏幕宽度大于等于820px视为大屏
  const router = useRouter();
  const { onOpen, LoginModal } = useLoginModal();
  const isAuth = useAtomValue(authAtom);
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(
    null,
  );
  const [shouldShowDesktopLayout, setShouldShowDesktopLayout] = useState(true);
  const [isPromptReferenceCollapsed, setIsPromptReferenceCollapsed] =
    useState(false);
  const initialSetInputValue = useRef(false);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Check for autoGenerate query parameter
  useEffect(() => {
    if (router.isReady && router.query?.autoGenerate === 'true') {
      setAutoGenerate(true);
    }
  }, [router.isReady, router.query?.autoGenerate]);

  // Collapse prompt reference on mobile for variant pages
  useEffect(() => {
    if (isVariant) {
      setIsPromptReferenceCollapsed(isMobile);
    }
  }, [isVariant, isMobile]);

  // Handle responsive layout for sidebar
  useEffect(() => {
    const checkScreenSize = () => {
      setShouldShowDesktopLayout(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get prompt from URL query parameter or set default for variant pages
  useEffect(() => {
    if (!router.isReady || initialSetInputValue.current) return;

    const prompt = router.query?.prompt;
    const generationId = router.query?.generationId;
    const isAutoGenerate = router.query?.autoGenerate === 'true';
    let inputPrompt = '';
    if (prompt && typeof prompt === 'string' && prompt.trim() !== '') {
      // If autoGenerate, use prompt as-is; otherwise add trailing comma for editing
      inputPrompt = isAutoGenerate
        ? prompt
        : prompt.replace(/\,\s*$/, '') + ', ';
    } else if (isVariant && data?.content.examples?.[0]) {
      // For variant pages, auto-set the first example's prompt if it has one
      const firstExample = data.content.examples[0] as any;
      if (firstExample.prompt) {
        // setInputValue(firstExample.prompt);
        inputPrompt = firstExample.prompt.replace(/\,\s*$/, '') + ', ';
      }
    }
    if (inputPrompt) {
      setInputValue(inputPrompt);
      initialSetInputValue.current = true;
      return;
    }

    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get model
        const model = generation.model;

        // get prompt
        if (generation.prompt) {
          if (generation.prompt.includes(POSITIVE_PROMPT)) {
            setInputValue(generation.prompt.replace(POSITIVE_PROMPT, ''));
          } else {
            setInputValue(generation.prompt);
          }
        }

        // keep model in URL so controller picks it up
        router.replace(
          { pathname: router.pathname, query: model ? { model } : {} },
          undefined,
          { shallow: true },
        );
        initialSetInputValue.current = true;
        return;
      }
    }

    getDraft(AI_ANIME_GENERATOR, setInputValue);
    initialSetInputValue.current = true;
  }, [
    router.isReady,
    router.query?.prompt,
    router.query.generationId,
    isVariant,
    data,
  ]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
  }, [router.isReady, router.query.generationId]);

  const onImageLoaded = async (
    imageObj: any,
    options: {
      replace?: boolean | string;
      updateSize?: boolean;
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
      referenceImage?: string;
      asyncImageFunc?: () => Promise<any>;
      numGenerations?: number;
    },
  ) => {
    if (options.asyncImageFunc) {
      // Add placeholder images for each generation
      const numGenerations = options.numGenerations || 1;
      const placeholders: ImageGeneration[] = Array(numGenerations)
        .fill(null)
        .map(() => ({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          url_path: '/images/placeholder.jpg',
          tool: AI_ANIME_GENERATOR,
          status: 'generating',
          prompt: options.prompt,
          user_id: '',
          model: options.model,
        }));

      setImages(prev => [...placeholders, ...prev]);

      try {
        const { imageUrls } = await options.asyncImageFunc();
        // console.log("Generated imageUrls:", imageUrls);

        // Replace placeholders with actual images
        setImages(prev => {
          const newPlaceholders = prev.filter(p =>
            placeholders.some(np => np.id === p.id),
          );
          const otherPlaceholders = prev.filter(
            p =>
              p.status === 'generating' &&
              !newPlaceholders.some(np => np.id === p.id),
          );
          const existingImages = prev.filter(p => p.status !== 'generating');

          // Add new generated images
          const generatedImages = imageUrls.map(
            ({ id, url }: { id: string; url: string }) => ({
              id: id,
              created_at: new Date().toISOString(),
              url_path: url,
              tool: 'ai-anime-generator',
              status: 'done',
              prompt: options.prompt,
              model: options.model,
            }),
          );

          // Create a Set of existing image URLs to prevent duplicates
          const existingUrls = new Set(existingImages.map(img => img.url_path));
          const uniqueGeneratedImages = generatedImages.filter(
            img => !existingUrls.has(img.url_path),
          );

          return [
            ...otherPlaceholders,
            ...uniqueGeneratedImages,
            ...existingImages,
          ];
        });
      } catch (error) {
        console.error('Error generating images:', error);
        // On error, remove only the placeholders for this specific request
        setImages(prev => {
          const placeholderIds = new Set(placeholders.map(p => p.id));
          return prev.filter(img => !placeholderIds.has(img.id));
        });
      }
    }
  };

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.ai-anime-generator', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
      <main className='flex overflow-x-hidden flex-col min-h-screen caffelabs text-foreground bg-background'>
        {/* 只在非变体页面时渲染 Head */}
        {!isVariant && (
          <Head>
            <title>{t('title')}</title>
            <meta property='og:type' content='website' />
            <meta property='og:title' content={t('title')} />
            <meta property='og:description' content={t('meta.description')} />
            <meta
              property='og:url'
              content='https://komiko.app/ai-anime-generator'
            />
            <meta
              property='og:image'
              content='https://d31cygw67xifd4.cloudfront.net/covers/tools/anime.webp'
            />
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={t('title')} />
            <meta name='twitter:description' content={t('meta.description')} />
            <meta
              name='twitter:image'
              content='https://d31cygw67xifd4.cloudfront.net/covers/tools/anime.webp'
            />
            <meta name='description' content={t('meta.description')} />
            <meta name='keywords' content={t('meta.keywords')} />
          </Head>
        )}
        <Header autoOpenLogin={false} />

        <div className='flex'>
          <Sidebar />
          <div
            className={cn(
              'flex flex-col justify-center items-center p-2 pt-16 md:pt-20 mx-auto w-full h-full',
              {
                'md:pl-56 lg:pl-[240px] 2xl:pl-72': shouldShowDesktopLayout,
              },
            )}>
            <PageErrorBoundary>
              <div className='w-full max-w-[1300px] flex flex-col items-center justify-center px-2 md:px-8'>
                <div
                  className={`${
                    isVariant ? 'mt-4' : 'mt-6'
                  } w-full flex flex-col items-center`}>
                  {isVariant && <Breadcrumb className='w-full mb-2' />}
                  <h1 className='text-2xl font-bold text-center text-heading md:text-3xl lg:text-4xl mt-2 md:mt-0'>
                    {content.header.title}
                  </h1>
                  <p className='md:mt-2 mb-4 max-w-2xl text-xs text-center text-muted-foreground md:text-xs lg:text-base'>
                    {/* {content.header.subtitle} */}
                    <Trans
                      i18nKey='ai-anime-generator:header.subtitle'
                      components={{
                        Link: (
                          <a
                            href='https://komiko-app.notion.site/AI-Art-Generator-26b4d853a19f80c08e9ff0e8c9e903b3'
                            className='text-primary-500'
                            target='_blank'
                            rel='noopener noreferrer'
                          />
                        ),
                      }}
                    />
                  </p>
                </div>

                {/* 交互式内容组件 */}
                <InteractiveContent
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onImageLoaded={onImageLoaded}
                  isMobile={isMobile}
                  images={images}
                  setImages={setImages}
                  isAuth={isAuth}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  isPromptReferenceCollapsed={isPromptReferenceCollapsed}
                  setIsPromptReferenceCollapsed={setIsPromptReferenceCollapsed}
                  autoGenerate={autoGenerate}
                />

                {/* SEO Content Section */}
                <StaticSEOContent content={content} isMobile={isMobile} />
              </div>
            </PageErrorBoundary>
          </div>
        </div>
        <SiteFooter className='border-border md:pl-56 lg:pl-[240px]' />
      </main>
      <LoginModal />
    </LoginContext.Provider>
  );
}

// 为每种语言生成getStaticProps
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  try {
    const translations = await loadServerTranslation(locale);

    return {
      props: {
        translations,
      },
      // 重新验证时间：24小时
      revalidate: 86400,
    };
  } catch (error) {
    console.error('Error loading translations:', error);

    // 如果翻译加载失败，使用默认翻译
    const fallbackTranslations = await loadServerTranslation('en');
    return {
      props: {
        translations: fallbackTranslations,
      },
      revalidate: 86400,
    };
  }
};
