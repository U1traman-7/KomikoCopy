// [#target:tools]
/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  Chip,
  NextUIProvider,
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
import {
  loadServerTranslation,
  TranslationData,
} from '../lib/server-translations';
import { GetStaticProps } from 'next';
import { cleanQualityModifiers } from '../utilities/promptUtils';
import { AI_COMIC_GENERATOR, getDraft } from '@/utils/draft';

import {
  ImageGenerationController,
  type ImageGenerationControllerRef,
} from '../Components/RightSidebar/RightSidebar';

// Default style and grid for comic generator
const DEFAULT_STYLE = '[action-manga-style]';
const DEFAULT_GRID = '<three-panel-strip>';
const DEFAULT_PROMPT = `${DEFAULT_GRID} ${DEFAULT_STYLE}`;

// Allowed models for comic generator (only models that support grid layouts)
const ALLOWED_MODELS = ['Gemini', 'Gemini Pro', 'Seedream 4', 'Seedream 4.5'];
// Default model for comic generator
const DEFAULT_MODEL = 'Seedream 4.5';

// Component to handle image loading with placeholder
const ImageWithPlaceholder = memo(
  ({ src, alt }: { src: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
      <div className='relative w-full'>
        {!isLoaded && (
          <div className='w-full aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded-none'>
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

interface GenerationResultProps {
  className?: string;
  images: ImageGeneration[];
  setImages: React.Dispatch<React.SetStateAction<ImageGeneration[]>>;
  isMobile?: boolean;
  isAuth?: boolean;
  selectedImage: ImageGeneration | null;
  setSelectedImage: (image: ImageGeneration | null) => void;
  inputValue?: string;
  setInputValue?: (value: string) => void;
  onDelete?: () => void;
}

/* eslint-disable */
const FAQComp = memo(
  ({ isVariant, variantFaqs }: { isVariant: boolean; variantFaqs?: any[] }) => {
    const { t } = useTranslation('ai-comic-generator');
    const [openFaqId, setOpenFaqId] = useState<number | null>(null);
    const defaultFaqs = [
      {
        id: -5,
        question: t('faq.edit_after_creation.question'),
        answer: t('faq.edit_after_creation.answer'),
      },
      {
        id: 1,
        question: t('faq.what_is_comic_generator.question'),
        answer: t('faq.what_is_comic_generator.answer'),
      },
      {
        id: 0,
        question: t('faq.what_is_manga_generator.question'),
        answer: t('faq.what_is_manga_generator.answer'),
      },
      {
        id: -1,
        question: t('faq.what_is_manhwa_generator.question'),
        answer: t('faq.what_is_manhwa_generator.answer'),
      },
      {
        id: -3,
        question: t('faq.how_to_make_comics.question'),
        answer: t('faq.how_to_make_comics.answer'),
      },
      {
        id: 2,
        question: t('faq.how_it_works.question'),
        answer: t('faq.how_it_works.answer'),
      },
      {
        id: 4,
        question: t('faq.art_styles.question'),
        answer: t('faq.art_styles.answer'),
      },
      {
        id: 5,
        question: t('faq.what_comics_can_i_generate.question'),
        answer: t('faq.what_comics_can_i_generate.answer'),
      },
      {
        id: 3,
        question: t('faq.commercial_use.question'),
        answer: t('faq.commercial_use.answer'),
      },
      {
        id: 10,
        question: t('faq.need_drawing_skills.question'),
        answer: t('faq.need_drawing_skills.answer'),
      },
      {
        id: 6,
        question: t('faq.for_memes.question'),
        answer: t('faq.for_memes.answer'),
      },
      {
        id: 7,
        question: t('faq.is_free.question'),
        answer: t('faq.is_free.answer'),
      },
      {
        id: 8,
        question: t('faq.share_online.question'),
        answer: t('faq.share_online.answer'),
      },
      {
        id: 9,
        question: t('faq.custom_art_styles.question'),
        answer: t('faq.custom_art_styles.answer'),
      },
    ];

    // Use variant FAQs if available, otherwise use default FAQs
    const faqs =
      isVariant && variantFaqs
        ? variantFaqs.map((faq, index) => ({
            id: index,
            question: faq.question,
            answer: faq.answer,
          }))
        : defaultFaqs;

    return faqs.map(faq => (
      <div key={faq.id} className='rounded-lg shadow-sm'>
        <button
          className='flex justify-between items-center px-6 py-4 w-full text-left'
          onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}>
          <span className='text-base sm:text-lg font-medium text-foreground'>
            {faq.question}
          </span>
          <svg
            className={`w-5 h-5 text-muted-foreground transform transition-transform ${
              openFaqId === faq.id ? 'rotate-180' : ''
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
        {openFaqId === faq.id && (
          <div className='px-6 pb-4'>
            <p className='text-sm sm:text-base text-muted-foreground'>
              {faq.answer}
            </p>
          </div>
        )}
      </div>
    ));
  },
);

const GenerationResult = memo(
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
  }: GenerationResultProps) => {
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver>();
    const { t, i18n } = useTranslation(['ai-comic-generator', 'toast']);
    const { isVariant, data } = useVariantData();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [columnCount, setColumnCount] = useState(4);
    const containerRef = useRef<HTMLDivElement>(null);

    const lastImageRef = useCallback(
      (node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
            loadMoreImages();
          }
        });
        if (node) observer.current.observe(node);
      },
      [loading, hasMore],
    );

    const calculateColumns = useCallback(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const minColumnWidth = 200;
      const gap = 16;

      let columns = Math.floor((containerWidth + gap) / (minColumnWidth + gap));
      columns = Math.max(1, Math.min(6, columns));
      setColumnCount(columns);
    }, []);

    useEffect(() => {
      calculateColumns();
      const handleResize = () => calculateColumns();
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
            tool: 'ai-comic-generator',
            pageNo: Math.floor(images.length / 16) + 1,
            pageSize: 16,
          }),
        });
        const data = await response.json();
        if (data.data) {
          const newImages = data.data.map((image: ImageGeneration) => ({
            ...image,
            url_path: image.url_path.startsWith('https')
              ? image.url_path
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/${image.url_path}`,
            status: 'done',
          }));

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

    // Example images for empty state
    const exampleImages = [
      {
        id: 1,
        url_path: '/images/examples/ai-comic-generator/comic1.webp',
        alt: 'Comic example 1',
        prompt: `${DEFAULT_GRID} ${DEFAULT_STYLE} a hero fighting a villain`,
      },
      {
        id: 2,
        url_path: '/images/examples/ai-comic-generator/comic2.webp',
        alt: 'Comic example 2',
        prompt: `${DEFAULT_GRID} ${DEFAULT_STYLE} friends having an adventure`,
      },
    ];

    if (images.length === 0) {
      return (
        <div
          className={cn(
            'flex overflow-y-auto flex-col items-center pt-4 rounded-lg border border-border md:max-h-none',
            className,
          )}>
          <div className='w-full text-center'>
            <div className='px-4'>
              <p className='mb-2 text-sm font-semibold md:text-base text-primary-700 dark:text-primary-500'>
                {t('emptyState.title', 'Create Your First Comic')}
              </p>
              <p className='mb-6 text-sm text-muted-foreground md:text-base'>
                {t(
                  'emptyState.description',
                  'Enter a prompt and click Generate to create your comic',
                )}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'overflow-y-auto p-0 px-2 rounded-lg border border-border md:px-4 h-[60px]',
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
                  <Card className='bg-card relative w-full border border-border cursor-pointer'>
                    <div className='overflow-hidden relative'>
                      {image.status === 'generating' ? (
                        <div className='flex items-center justify-center aspect-square bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700'>
                          <ProTipCarousel
                            className='w-full max-w-sm'
                            autoPlayInterval={4000}
                          />
                        </div>
                      ) : (
                        <ImageWithPlaceholder
                          src={image.url_path}
                          alt='Generated comic'
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
              {t('loading.moreImages', 'Loading more...')}
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
          type='ai-comic-generator'
          onDelete={onDelete}
        />
      </div>
    );
  },
);

// Interactive content component with ImageGenerationController
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
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
  onImageLoaded: any;
  isMobile: boolean;
  images: ImageGeneration[];
  setImages: React.Dispatch<React.SetStateAction<ImageGeneration[]>>;
  isAuth: boolean;
  selectedImage: ImageGeneration | null;
  setSelectedImage: (image: ImageGeneration | null) => void;
  isPromptReferenceCollapsed: boolean;
  setIsPromptReferenceCollapsed: (collapsed: boolean) => void;
  autoGenerate: boolean;
}) => {
  const { t } = useTranslation(['ai-comic-generator', 'toast']);
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
      const timer = setTimeout(() => {
        imageGenRef.current?.triggerGenerate();
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
          tool='ai-comic-generator'
          stackChip={isMobile}
          className='relative z-30 h-full'
          isPromptReferenceCollapsed={isPromptReferenceCollapsed}
          setIsPromptReferenceCollapsed={setIsPromptReferenceCollapsed}
          allowedModels={ALLOWED_MODELS}
          defaultModel={DEFAULT_MODEL}>
          <div
            className={cn('flex flex-col flex-1 min-h-[60vh]', {
              'mt-1 w-full': isMobile,
            })}>
            <div className='flex items-center mb-2 h-[32px]'>
              <h3 className='font-bold text-md text-primary-600 dark:text-primary-600'>
                {t('results.title', 'Results')}
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

interface AiComicGeneratorPageProps {
  translations?: TranslationData;
}

export default function AiComicGeneratorPage({
  translations,
}: AiComicGeneratorPageProps) {
  const { t, i18n } = useTranslation(['ai-comic-generator', 'toast']);
  const { isVariant, data, getContent } = useVariantData();
  const content = useVariantContent(isVariant, data, t);
  const [inputValue, setInputValue] = useState('');
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const isMobile = useMobileScreen();
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

  // Get prompt from URL query parameter or set default for comic generator
  useEffect(() => {
    if (!router.isReady || initialSetInputValue.current) return;

    const prompt = router.query?.prompt;
    const generationId = router.query?.generationId;
    const isAutoGenerate = router.query?.autoGenerate === 'true';

    let inputPrompt = '';
    if (prompt && typeof prompt === 'string' && prompt.trim() !== '') {
      inputPrompt = isAutoGenerate
        ? prompt
        : prompt.replace(/\,\s*$/, '') + ', ';
    } else if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        const model = generation.model;

        if (generation.prompt) {
          if (generation.prompt.includes(POSITIVE_PROMPT)) {
            inputPrompt = generation.prompt.replace(POSITIVE_PROMPT, '');
          } else {
            inputPrompt = generation.prompt;
          }
        }

        router.replace(
          { pathname: router.pathname, query: model ? { model } : {} },
          undefined,
          { shallow: true },
        );
        setInputValue(inputPrompt);
        initialSetInputValue.current = true;
        return;
      }
    }

    if (inputPrompt) {
      setInputValue(inputPrompt);
      initialSetInputValue.current = true;
      return;
    }

    // Set default prompt with grid and style for comic generator
    // Set default first, then getDraft will overwrite if a draft exists
    setInputValue(DEFAULT_PROMPT + ' ');
    getDraft(AI_COMIC_GENERATOR, setInputValue);
    initialSetInputValue.current = true;
  }, [
    router.isReady,
    router.query?.prompt,
    router.query.generationId,
    isVariant,
    data,
  ]);

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
      const numGenerations = options.numGenerations || 1;
      const placeholders: ImageGeneration[] = Array(numGenerations)
        .fill(null)
        .map(() => ({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          url_path: '/images/placeholder.jpg',
          tool: AI_COMIC_GENERATOR,
          status: 'generating',
          prompt: options.prompt,
          user_id: '',
          model: options.model,
        }));

      setImages(prev => [...placeholders, ...prev]);

      try {
        const { imageUrls } = await options.asyncImageFunc();

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

          const generatedImages = imageUrls.map(
            ({ id, url }: { id: string; url: string }) => ({
              id: id,
              created_at: new Date().toISOString(),
              url_path: url,
              tool: 'ai-comic-generator',
              status: 'done',
              prompt: options.prompt,
              model: options.model,
            }),
          );

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
        setImages(prev => {
          const placeholderIds = new Set(placeholders.map(p => p.id));
          return prev.filter(img => !placeholderIds.has(img.id));
        });
      }
    }
  };

  // Add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.ai-comic-generator', {});
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
      <NextUIProvider>
        <main className='flex overflow-x-hidden flex-col min-h-screen caffelabs text-foreground bg-background'>
          {!isVariant && (
            <Head>
              <title>{t('meta.title')}</title>
              <meta property='og:type' content='website' />
              <meta property='og:title' content={t('meta.title')} />
              <meta property='og:description' content={t('meta.description')} />
              <meta
                property='og:url'
                content='https://komiko.app/ai-comic-generator'
              />
              <meta
                property='og:image'
                content='https://d31cygw67xifd4.cloudfront.net/covers/tools/comic.webp'
              />
              <meta name='twitter:card' content='summary_large_image' />
              <meta name='twitter:title' content={t('meta.title')} />
              <meta
                name='twitter:description'
                content={t('meta.description')}
              />
              <meta
                name='twitter:image'
                content='https://d31cygw67xifd4.cloudfront.net/covers/tools/comic.webp'
              />
              <meta name='description' content={t('meta.description')} />
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
              <div className='w-full max-w-[1300px] flex flex-col items-center justify-center px-2 md:px-8'>
                <div
                  className={`${
                    isVariant ? 'mt-4' : 'mt-6'
                  } w-full flex flex-col items-center`}>
                  {isVariant && <Breadcrumb className='w-full mb-2' />}
                  <h1 className='text-2xl font-bold text-center text-heading md:text-3xl lg:text-4xl mt-2 md:mt-0'>
                    {isVariant ? content.header.title : t('form.title')}
                  </h1>
                  <p className='md:mt-2 mb-4 max-w-2xl text-xs text-center text-muted-foreground md:text-xs lg:text-base'>
                    {isVariant ? content.header.subtitle : t('form.subtitle')}
                  </p>
                </div>

                {/* Interactive content with ImageGenerationController */}
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
                <div className='flex flex-col justify-center items-center mb-8 w-full'>
                  <div className='col-span-12 w-full'>
                    {/* What Is Section */}
                    {(isVariant ? content.sections.whatIs : null) && (
                      <div className='pt-14 md:py-16 md:mt-16'>
                        <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
                          {content.sections.whatIs.title}
                        </h2>
                        <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
                          <p>{content.sections.whatIs.description}</p>
                        </div>
                      </div>
                    )}

                    {!isVariant && (
                      <>
                        <h2 className='mt-16 mb-2 text-xl md:text-3xl font-bold text-center text-primary-600 dark:text-primary-400'>
                          {t('seo.main_heading')}
                        </h2>
                        <p className='px-8 mb-6 text-center text-muted-foreground text-sm sm:text-md sm:px-20'>
                          {t('seo.main_description')}
                        </p>
                      </>
                    )}

                    <h2 className='mt-16 mb-4 text-xl md:text-3xl font-bold text-center text-primary-600 dark:text-primary-400'>
                      {isVariant
                        ? content.sections.howToUse.title
                        : t('how_to_use.heading')}
                    </h2>
                    {isVariant && content.sections.howToUse.subtitle && (
                      <p className='mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                        {content.sections.howToUse.subtitle}
                      </p>
                    )}
                    <div className='grid grid-cols-1 gap-6 px-4 mb-6 sm:grid-cols-2 lg:grid-cols-4'>
                      {(isVariant
                        ? content.sections.howToUse.steps
                        : [
                            {
                              title: t('how_to_use.step1.title'),
                              content: t('how_to_use.step1.content'),
                            },
                            {
                              title: t('how_to_use.step2.title'),
                              content: t('how_to_use.step2.content'),
                            },
                            {
                              title: t('how_to_use.step3.title'),
                              content: t('how_to_use.step3.content'),
                            },
                            {
                              title: t('how_to_use.step4.title'),
                              content: t('how_to_use.step4.content'),
                            },
                          ]
                      ).map((step, index) => (
                        <div
                          key={step.title}
                          className='flex flex-col p-4 h-full bg-card rounded-lg border border-border border-border shadow-md'>
                          <div className='flex justify-center items-center w-12 h-12 text-xl sm:text-2xl font-bold text-white rounded-full bg-primary-500'>
                            {index + 1}
                          </div>
                          <div className='flex-grow mt-4'>
                            <h3 className='text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400'>
                              {step.title}
                            </h3>
                            <p className='mt-2 text-muted-foreground text-sm sm:text-md'>
                              {step.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h2 className='mt-16 mb-4 text-xl md:text-3xl font-bold text-center text-primary-600 dark:text-primary-400'>
                      {isVariant
                        ? content.sections.whyUse.title
                        : t('why_use.heading')}
                    </h2>
                    <p className='px-8 mb-6 text-center text-muted-foreground text-sm sm:text-md sm:px-20'>
                      {isVariant
                        ? content.sections.whyUse.subtitle
                        : t('why_use.description')}
                    </p>
                    <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                      {(isVariant
                        ? content.sections.whyUse.features
                        : [
                            {
                              title: t(
                                'why_use.features.beginner_friendly.title',
                              ),
                              content: t(
                                'why_use.features.beginner_friendly.content',
                              ),
                            },
                            {
                              title: t('why_use.features.custom_art.title'),
                              content: t('why_use.features.custom_art.content'),
                            },
                            {
                              title: t(
                                'why_use.features.amazing_layouts.title',
                              ),
                              content: t(
                                'why_use.features.amazing_layouts.content',
                              ),
                            },
                            {
                              title: t('why_use.features.tell_story.title'),
                              content: t('why_use.features.tell_story.content'),
                            },
                            {
                              title: t('why_use.features.ai_efficiency.title'),
                              content: t(
                                'why_use.features.ai_efficiency.content',
                              ),
                            },
                            {
                              title: t('why_use.features.high_quality.title'),
                              content: t(
                                'why_use.features.high_quality.content',
                              ),
                            },
                            {
                              title: t(
                                'why_use.features.creative_freedom.title',
                              ),
                              content: t(
                                'why_use.features.creative_freedom.content',
                              ),
                            },
                            {
                              title: t('why_use.features.accessible.title'),
                              content: t('why_use.features.accessible.content'),
                            },
                            {
                              title: t('why_use.features.share_comics.title'),
                              content: t(
                                'why_use.features.share_comics.content',
                              ),
                            },
                          ]
                      ).map(feature => (
                        <div
                          key={feature.title}
                          className='p-4 bg-card rounded-lg border border-border shadow-md shadow-primary-300 dark:shadow-gray-900/50'>
                          <h3 className='mb-2 text-base sm:text-lg font-semibold text-primary-600 dark:text-primary-400'>
                            {feature.title}
                          </h3>
                          <p className='text-xs sm:text-sm text-muted-foreground'>
                            {feature.content}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className='my-12 md:my-16'>
                      <MoreAITools category='comic' />
                    </div>

                    <h2 className='mt-16 mb-2 text-xl md:text-3xl font-bold text-center text-primary-600 dark:text-primary-400'>
                      {t('faq.title')}
                    </h2>
                    <p className='px-4 sm:pr-20 sm:pl-20 mb-6 text-center text-muted-foreground text-sm sm:text-md'>
                      {t('faq.description')}
                    </p>
                    <div className='flex justify-center items-center'>
                      <div className='w-[80%]'>
                        <FAQComp
                          isVariant={isVariant}
                          variantFaqs={
                            isVariant ? content?.faq?.items : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter className='border-border md:pl-56 lg:pl-[240px]' />
        <LoginModal />
      </NextUIProvider>
    </LoginContext.Provider>
  );
}

// Static props for translations
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  try {
    const translations = await loadServerTranslation(locale);

    return {
      props: {
        translations,
      },
      revalidate: 86400,
    };
  } catch (error) {
    console.error('Error loading translations:', error);

    const fallbackTranslations = await loadServerTranslation('en');
    return {
      props: {
        translations: fallbackTranslations,
      },
      revalidate: 86400,
    };
  }
};
