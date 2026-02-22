/* eslint-disable */
import {
  Chip,
  NextUIProvider,
  PopoverContent,
  Popover,
  PopoverTrigger,
  cn,
} from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import {
  Button,
  Input,
  Image,
  Card,
  Radio,
  RadioGroup,
  Switch,
  Tabs,
  Tab,
  Textarea,
  Checkbox,
  ButtonGroup,
} from '@nextui-org/react';
import { useState, useEffect, useRef } from 'react';
import { Hero } from '@/components/SEO';
import { trackPaywallTriggered } from '../utilities/analytics';
import { useAtomValue } from 'jotai';
import {
  selectedImageAtom,
  characterImagePromptAtom,
  characterGenderAtom,
  profileAtom,
  loginModalAtom,
  authAtom,
} from '../state';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { Header } from '../Components/Header';
import {
  ReferenceImagesInline,
  ReferenceItem,
} from '../Components/ReferenceImagesInline';
import { Sidebar } from '../Components/Sidebar';
import { BiSolidZap } from 'react-icons/bi';
import { MdAutoAwesome } from 'react-icons/md';
import { FaDice, FaCheck } from 'react-icons/fa';
import { RiMagicLine } from 'react-icons/ri';
import Head from 'next/head';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';

import { useTranslation } from 'react-i18next';
import {
  IMAGE_ANIMAGINE_XL_3_1,
  IMAGE_FLUX_KONTEXT,
  IMAGE_GEMINI_MINI,
} from '../../api/tools/_zaps';
import { SiteFooter } from '@/components/site-footer';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVariantData } from '../Components/ToolsPage/TemplateWrapper';
import { Breadcrumb } from '../Components/common/Breadcrumb';
import { getCreateYoursData, POSITIVE_PROMPT } from '../utilities/tools';
// Dynamically import Canvas-dependent utilities to reduce bundle size
const loadCanvasUtils = async () => {
  const utils = await import('../Components/InfCanva/utils');
  return {
    generateImageGetUrls: utils.generateImageGetUrlsV2,
    generateText: utils.generateText,
  };
};
import {
  loadServerTranslation,
  TranslationData,
} from '../lib/server-translations';
import { GetStaticProps } from 'next';
import {
  consumeDraft,
  debouncedSaveDraft,
  getDraft,
  OC_MAKER,
} from '@/utils/draft';

// Helper function to extract clean variant title (remove "OC Maker" suffix)
const getCleanVariantTitle = (title: string): string => {
  return title
    .replace(/\s*OC\s*Maker\s*$/i, '')
    .replace(/\s*Character\s*Generator\s*$/i, '')
    .replace(/\s*Generator\s*$/i, '')
    .trim();
};

// // Helper function to get variant-specific keywords for auto-selection
// const getVariantKeywords = (variantName: string): string[] => {
//   const variantKeywordMap: Record<string, string[]> = {
//     'jujutsu-kaisen': [
//       'Jujutsu Kaisen style, original character in the world of Jujutsu Kaisen',
//     ],
//     'jjk-oc-maker': [
//       'Jujutsu Kaisen style, original character in the world of Jujutsu Kaisen',
//     ],
//     'jujutsu-kaisen-oc-maker': [
//       'Jujutsu Kaisen style, original character in the world of Jujutsu Kaisen',
//     ],
//     'genshin-impact-oc-maker': [
//       'Genshin Impact style, original character in the world of Genshin Impact',
//     ],
//     'genshin-oc-maker': [
//       'Genshin Impact style, original character in the world of Genshin Impact',
//     ],
//     'genshin-oc-generator': [
//       'Genshin Impact style, original character in the world of Genshin Impact',
//     ],
//     'naruto-oc-maker': [
//       'Naruto style, original character in the world of Naruto',
//     ],
//     'one-piece-oc-maker': [
//       'One Piece style, original character in the world of One Piece',
//     ],
//     'one-piece-characters-generator': [
//       'One Piece style, original character in the world of One Piece',
//     ],
//     'demon-slayer-oc-maker': [
//       'Demon Slayer style, original character in the world of Demon Slayer',
//     ],
//     'my-hero-academia-oc-maker': [
//       'My Hero Academia style, original character in the world of My Hero Academia',
//     ],
//     'dragon-ball-oc-maker': [
//       'Dragon Ball style, original character in the world of Dragon Ball',
//     ],
//     'aot-oc-maker': [
//       'Attack on Titan style, original character in the world of Attack on Titan',
//     ],
//     'attack-on-titan-oc-maker': [
//       'Attack on Titan style, original character in the world of Attack on Titan',
//     ],
//     // Legacy mappings for backward compatibility
//     naruto: ['Naruto style, original character in the world of Naruto'],
//     'one-piece': [
//       'One Piece style, original character in the world of One Piece',
//     ],
//     'demon-slayer': [
//       'Demon Slayer style, original character in the world of Demon Slayer',
//     ],
//     'my-hero-academia': [
//       'My Hero Academia style, original character in the world of My Hero Academia',
//     ],
//     'dragon-ball': [
//       'Dragon Ball style, original character in the world of Dragon Ball',
//     ],
//     'attack-on-titan': [
//       'Attack on Titan style, original character in the world of Attack on Titan',
//     ],
//     'sonic-oc-maker': [
//       'Sonic the Hedgehog original character, anthropomorphic animal',
//     ],
//     'marvel-oc-maker': [
//       'Marvel style, superhuman, original character in the Marvel universe',
//     ],
//     'ai-marvel-character-generator': [
//       'Marvel style, superhuman, original character in the Marvel universe',
//     ],
//     'pokemon-oc-maker': ['1pokemon, original pokemon, pokemon oc, creature'],
//     'vampire-oc-maker': ['vampire'],
//     'anime-oc-maker': ['anime coloring'],
//     'anime-character-generator': ['anime coloring'],
//     'perchance-ai-character-generator': ['anime coloring'],
//     'nsfw-character-creator': ['attractive, detailed, high quality'],
//     'nsfw-oc-maker': ['attractive, detailed, high quality'],
//     'disney-oc-maker': ['anime coloring'],
//     'league-of-legends-oc-maker': ['anime coloring'],
//     'spy-x-family-oc-maker': ['anime coloring'],
//     // Legacy mappings for backward compatibility
//     sonic: ['Sonic the Hedgehog original character, anthropomorphic animal'],
//     marvel: [
//       'Marvel style, superhuman, original character in the Marvel universe',
//     ],
//     minecraft: ['Minecraft style, blocky style'],
//     mario: ['Mario style, original character in the world of Mario'],
//     pokemon: ['1pokemon, original pokemon, pokemon oc, creature'],
//     vampire: ['vampire'],
//     anime: ['anime coloring'],
//     furry: ['furry'],
//     angel: ['angel'],
//     demon: ['demon'],
//     mermaid: ['mermaid'],
//     elf: ['elf'],
//   };

//   return variantKeywordMap[variantName] || [];
// };

interface CreateCharacterProps {
  translations?: TranslationData;
}

const getPageKey = () => {
  return location.pathname.slice(1);
};

export default function CreateCharacter({
  translations,
}: CreateCharacterProps) {
  const { t } = useTranslation(['oc-maker', 'toast']);

  // Dynamic FAQ array using translations
  const faqs = [
    {
      id: 1,
      question: t('faq.question1'),
      answer: t('faq.answer1'),
    },
    {
      id: 2,
      question: t('faq.question2'),
      answer: t('faq.answer2'),
    },
    {
      id: 3,
      question: t('faq.question3'),
      answer: t('faq.answer3'),
    },
    {
      id: 4,
      question: t('faq.question4'),
      answer: t('faq.answer4'),
    },
    {
      id: 5,
      question: t('faq.question5'),
      answer: t('faq.answer5'),
    },
  ];
  const {
    isVariant,
    data: variantData,
    getContent,
    variantName,
  } = useVariantData();
  // Create OC Maker specific content structure
  const content = {
    sections: {
      whatIs: {
        title:
          isVariant && variantData?.content?.sections?.whatIs?.title
            ? variantData.content.sections.whatIs.title
            : t('whatIs.title'),
        description:
          isVariant && variantData?.content?.sections?.whatIs?.description
            ? variantData.content.sections.whatIs.description
            : t('whatIs.description'),
      },
      howToUse: {
        title:
          isVariant && variantData?.content?.sections?.howToUse?.title
            ? variantData.content.sections.howToUse.title
            : t('howItWorks.title'),
        steps:
          isVariant && variantData?.content?.sections?.howToUse?.steps
            ? variantData.content.sections.howToUse.steps
            : Object.values(
                t('howItWorks.steps', { returnObjects: true }) as any,
              ),
      },
      whyUse: {
        title:
          isVariant && variantData?.content?.sections?.whyUse?.title
            ? variantData.content.sections.whyUse.title
            : t('features.title'),
        features:
          isVariant && variantData?.content?.sections?.whyUse?.features
            ? variantData.content.sections.whyUse.features
            : Object.values(
                t('features.features', { returnObjects: true }) as any,
              ),
      },
    },
    faq: {
      title:
        isVariant &&
        variantData?.content?.faq &&
        !Array.isArray(variantData.content.faq) &&
        variantData.content.faq.title
          ? variantData.content.faq.title
          : t('faq.title'),
    },
  };

  // 动态渲染sections的函数
  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'howItWorks':
        return (
          <div key='howItWorks' className='py-10 bg-background md:py-16'>
            <h2 className='mb-6 text-xl font-bold text-center md:mb-10 text-heading md:text-3xl'>
              {content.sections.howToUse.title}
            </h2>
            <div className='grid grid-cols-1 gap-6 md:gap-8 md:px-4 sm:grid-cols-2 lg:grid-cols-4'>
              {content.sections.howToUse.steps.map(
                (step: any, index: number) => (
                  <div
                    key={step.title || index}
                    className='flex flex-col p-4 md:p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                    <div className='flex justify-center items-center mb-4 w-8 h-8 text-xl font-bold text-white bg-gradient-to-r to-purple-600 rounded-full md:w-14 md:h-14 from-primary-600 md:text-2xl'>
                      {index + 1}
                    </div>
                    <div className='flex-grow'>
                      <h3 className='mb-3 text-lg font-bold text-heading md:text-xl'>
                        {step.title}
                      </h3>
                      <p className='text-sm text-muted-foreground md:text-base'>
                        {step.content}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        );
      case 'features':
        return (
          <div
            key='features'
            className='py-10 bg-gradient-to-b from-background to-primary-100 dark:to-primary-900/30 rounded-xl md:py-16'>
            <h2 className='mb-4 text-xl font-bold text-center md:mb-6 text-heading md:text-3xl'>
              {content.sections.whyUse.title}
            </h2>
            <div className='grid grid-cols-1 gap-4 px-2 md:gap-6 md:px-4 sm:grid-cols-2 lg:grid-cols-3'>
              {content.sections.whyUse.features.map(
                (feature: any, index: number) => (
                  <div
                    key={feature.title || index}
                    className='p-4 md:p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <div className='flex items-center mb-4'>
                      <h3 className='text-lg font-semibold text-heading md:text-xl'>
                        {feature.title}
                      </h3>
                    </div>
                    <p className='text-sm text-muted-foreground md:text-base'>
                      {feature.content}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        );
      case 'faq':
        return (
          <div key='faq' className='py-10 md:py-16'>
            <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.faq.title}
            </h2>
            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full'>
                <FAQ faqs={faqs} translationNamespace='oc-maker' />
              </div>
            </div>
          </div>
        );
      case 'whatIs':
        return (
          <div key='whatIs' className='pt-14 md:py-16 md:mt-16'>
            <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.whatIs.title}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
              <p>{content.sections.whatIs.description}</p>
            </div>
          </div>
        );
      case 'examples':
        return (
          <div key='examples' className='py-10 md:py-16'>
            <h2 className='mb-4 text-xl font-bold text-center md:mb-6 text-heading md:text-3xl'>
              {isVariant && variantData?.content?.header?.title
                ? t('examples.variantTitle', {
                    variantName: getCleanVariantTitle(
                      variantData.content.header.title,
                    ),
                  })
                : t('examples.title')}
            </h2>
            <div className='grid grid-cols-2 gap-2 md:gap-10 lg:grid-cols-4'>
              {(isVariant &&
              variantData?.content?.examples &&
              Array.isArray(variantData.content.examples)
                ? variantData.content.examples.map((example: any) => ({
                    output: example.image,
                    desc: example.prompt
                      ? `${t('examples.appearance')}: ${example.prompt}`
                      : example.alt || example.title,
                  }))
                : [
                    {
                      output: '/images/komiko_girl.webp',
                      desc: t('examples.examples.example1.desc'),
                    },
                    {
                      output: '/images/komiko_boy.webp',
                      desc: t('examples.examples.example2.desc'),
                    },
                    {
                      output: '/images/examples/oc-maker/cat_girl.webp',
                      desc: t('examples.examples.example3.desc'),
                    },
                    {
                      output: '/images/examples/oc-maker/boy.webp',
                      desc: t('examples.examples.example4.desc'),
                    },
                  ]
              ).map(item => (
                <div
                  key={item.output}
                  className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                  <img
                    src={item.output}
                    alt={item.desc}
                    className='object-cover w-full h-full'
                  />
                  <div className='p-2 md:p-4 bg-primary-50 dark:bg-background h-[170px] border-box'>
                    <p className='h-full text-xs font-medium text-foreground md:text-sm'>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const [characterGender, setCharacterGender] = useAtom(characterGenderAtom);
  const [characterImagePrompt, setCharacterImagePrompt] = useAtom(
    characterImagePromptAtom,
  );
  const [AiOptimize, setAiOptimize] = useState<boolean>(true);
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [generatedCharacters, setGeneratedCharacters] = useState<string[]>([]);
  const [selectedCharacterIndex, setSelectedCharacterIndex] =
    useState<number>(-1);
  const [profile, setProfile] = useAtom(profileAtom);
  const [loginModalState] = useAtom(loginModalAtom);
  const [cost, setCost] = useState<number>(IMAGE_ANIMAGINE_XL_3_1);
  const characterCount = 4;
  const [generating, setGenerating] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState<boolean>(false);
  const { submit: openModal } = useOpenModal();
  const [shouldUseDraft, setShouldUseDraft] = useState<boolean>(true);

  // 点击生成后，自动滚动到卡片最下方
  useEffect(() => {
    if (generatedCharacters.length > 0 && scrollContainerRef.current) {
      const loadedImages = generatedCharacters.filter(url => url !== '');
      if (loadedImages.length > 0) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 200);
      }
    }
  }, [generatedCharacters]);

  let backgroundImage = '';

  // Use variant-specific examples if available, otherwise use default images
  if (
    isVariant &&
    variantData?.content?.examples &&
    variantData.content.examples.length > 0
  ) {
    // Use variant examples based on gender or fallback to first example
    const examples = variantData.content.examples;
    if (characterGender === 'female') {
      // Try to find a female character example, otherwise use first example
      const femaleExample = examples.find(
        (ex: any) =>
          ex.title?.toLowerCase().includes('girl') ||
          ex.title?.toLowerCase().includes('female') ||
          ex.alt?.toLowerCase().includes('girl') ||
          ex.alt?.toLowerCase().includes('female'),
      );
      backgroundImage = `url('${femaleExample?.image || examples[0]?.image}')`;
    } else if (characterGender === 'male') {
      // Try to find a male character example, otherwise use first example
      const maleExample = examples.find(
        (ex: any) =>
          ex.title?.toLowerCase().includes('boy') ||
          ex.title?.toLowerCase().includes('male') ||
          ex.alt?.toLowerCase().includes('boy') ||
          ex.alt?.toLowerCase().includes('male'),
      );
      backgroundImage = `url('${maleExample?.image || examples[0]?.image}')`;
    } else {
      // Use first example for other/unspecified gender
      backgroundImage = `url('${examples[0]?.image}')`;
    }
  } else {
    // Default images for non-variant pages
    if (characterGender === 'female')
      backgroundImage = "url('/images/komiko_girl.webp')";
    else if (characterGender === 'male')
      backgroundImage = "url('/images/komiko_boy.webp')";
    else backgroundImage = "url('/images/komiko_cat.webp')";
  }

  //! FETCH PROFILE
  useEffect(() => {
    if (!generatedCharacters.length) {
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
        console.log('calling fetch profile');

        const data = await response.json();
        setProfile(prev => ({ ...prev, ...data, authUserId: data.id }));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [generatedCharacters]);

  // Get prompt from URL query parameter
  useEffect(() => {
    if (!router.isReady) return;

    const { prompt } = router.query;
    if (prompt && typeof prompt === 'string' && prompt.trim() !== '') {
      setCharacterImagePrompt(prompt);
    }
  }, [router.isReady, router.query, setCharacterImagePrompt]);

  // Get character data from characterId parameter
  useEffect(() => {
    if (!router.isReady) return;

    const { characterId, post_id } = router.query;
    if (
      characterId &&
      typeof characterId === 'string' &&
      characterId.trim() !== ''
    ) {
      const fetchCharacterData = async () => {
        try {
          // Build API URL with optional post_id parameter
          let apiUrl = `/api/getCharacterProfile?uniqid=${encodeURIComponent(characterId)}`;
          if (post_id && typeof post_id === 'string') {
            apiUrl += `&post_id=${encodeURIComponent(post_id)}`;
          }

          const response = await fetch(apiUrl);
          const data = await response.json();

          // Check if user is authenticated and has permission to see the prompt
          if (data && !data.error) {
            if (data.character_description) {
              setCharacterImagePrompt(data.character_description);
            }
          } else if (data.error) {
            console.log('Cannot access character prompt:', data.error);
          }
        } catch (error) {
          console.error('Error fetching character data:', error);
        }
      };

      fetchCharacterData();
    }
  }, [router.isReady, router.query, setCharacterImagePrompt]);

  useEffect(() => {
    if (!router.isReady) return;

    // Check if any URL parameters exist
    const hasParams = !!(
      router.query.prompt ||
      router.query.generationId ||
      router.query.characterId ||
      router.query.post_id
    );

    setShouldUseDraft(!hasParams);

    if (!hasParams) {
      getDraft(getPageKey(), setCharacterImagePrompt);
    }
  }, [
    router.isReady,
    router.query.prompt,
    router.query.generationId,
    router.query.characterId,
    router.query.post_id,
  ]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // set prompt
        if (generation.prompt) {
          if (generation.prompt.includes(POSITIVE_PROMPT)) {
            setCharacterImagePrompt(
              generation.prompt.replace(POSITIVE_PROMPT, ''),
            );
          } else {
            setCharacterImagePrompt(generation.prompt);
          }
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  // Reset prompt when variant changes to ensure fresh content for each variant
  useEffect(() => {
    if (!router.isReady) return;
    if (isVariant && variantName) {
      setCharacterImagePrompt('');
    }
  }, [router.isReady, isVariant, variantName, setCharacterImagePrompt]);
  useEffect(() => {
    const handleResize = () => {
      setWide(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (characterImagePrompt.includes('1girl')) {
      setCharacterGender('female');
    } else if (characterImagePrompt.includes('1boy')) {
      setCharacterGender('male');
    }
  }, [characterImagePrompt]);

  useEffect(() => {
    if (referenceItems.length === 0) {
      setCost(IMAGE_ANIMAGINE_XL_3_1 * characterCount);
    } else if (referenceItems.length === 1) {
      setCost(IMAGE_FLUX_KONTEXT * characterCount);
    } else {
      setCost(IMAGE_GEMINI_MINI * characterCount);
    }
  }, [referenceItems, characterCount]);

  return (
    <NextUIProvider>
      {!isVariant && (
        <Head>
          <title>{t('title')}</title>
          <meta name='description' content={t('meta.description')} />
          <meta name='keywords' content={t('meta.keywords')} />
          <meta property='og:type' content='website' />
          <meta property='og:title' content={t('title')} />
          <meta property='og:description' content={t('meta.description')} />
          <meta property='og:url' content='https://komiko.app/oc-maker' />
          <meta
            property='og:image'
            content='https://d31cygw67xifd4.cloudfront.net/covers/tools/oc-maker.webp'
          />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={t('title')} />
          <meta name='twitter:description' content={t('meta.description')} />
          <meta
            name='twitter:image'
            content='https://d31cygw67xifd4.cloudfront.net/covers/tools/oc-maker.webp'
          />
          <meta name='description' content={t('meta.description')} />
          <meta name='keywords' content={t('meta.keywords')} />
        </Head>
      )}
      <Analytics />
      <div>
        <Toaster position='top-right' />
      </div>
      <main className='flex flex-col min-h-screen bg-gradient-to-b caffelabs text-foreground from-background to-background/80'>
        <Header autoOpenLogin={false} />
        <div className='flex flex-1'>
          <Sidebar />
          <div className='flex flex-col justify-center items-center p-4  pt-20 md:pt-24 w-full h-full  lg:pl-[240px] md:ml-5'>
            {isVariant && <Breadcrumb className='w-full mb-2' />}
            <Hero
              title={
                isVariant
                  ? getContent('header.title', 'header.title')
                  : t('header.title')
              }
              description={
                isVariant
                  ? getContent('header.subtitle', 'header.subtitle')
                  : t('header.subtitle')
              }
            />

            <div className='flex flex-col lg:flex-row gap-4 w-full max-w-7xl md:gap-6'>
              {/* 左侧输入区域 */}
              <div className='w-full lg:flex-none lg:w-1/2'>
                <Card className='p-4 md:p-6 transition-all duration-300 shadow-2xl border-1.5 border-primary-200 dark:border-primary-800 flex flex-col backdrop-blur-sm bg-card/90'>
                  <div className='flex flex-col items-center'>
                    <div className='flex gap-1 justify-between items-center mt-1 mb-2 w-full md:mt-2 md:mb-3'>
                      <div className='flex items-center text-sm font-medium md:text-base'>
                        {t('characterAppearance.title')}
                      </div>
                      <Button
                        size='sm'
                        className='h-[30px] px-2 text-xs md:text-sm bg-gradient-to-r from-secondary-100 to-primary-100 dark:from-secondary-900/50 dark:to-primary-900/50 text-foreground border-1 border-primary-200 dark:border-primary-700 hover:from-secondary-200 hover:to-primary-200 dark:hover:from-secondary-800/50 dark:hover:to-primary-800/50 transition-all duration-300'
                        onClick={async () => {
                          const { generateText } = await loadCanvasUtils();
                          const output = await generateText(
                            `Existing user input appearance: "${characterImagePrompt}"
Expand the appearance/expand from the existing user input appearance for one original character that would be appreciated by most female fans, the appearance should be a list of 10 words or phrases separated by ',' in one line, include "anime coloring" as one of the phrases. Only output the appearance`,
                            undefined,
                            t,
                            true,
                          );
                          if (output) {
                            setCharacterImagePrompt(
                              output.replace(/["']/g, '').trim(),
                            );
                          } else {
                            toast.error(
                              t('toast.failedToGeneratePrompt') ||
                                'Failed to generate prompt',
                            );
                          }
                        }}>
                        <FaDice className='text-primary-600' />{' '}
                        {t('characterAppearance.randomize')}
                      </Button>
                    </div>
                    <div className='relative mb-2 w-full md:mb-3'>
                      <Textarea
                        placeholder={
                          isVariant &&
                          variantData?.content?.examples &&
                          variantData.content.examples.length > 0
                            ? t('characterAppearance.placeholderVariant', {
                                variantTitle: getCleanVariantTitle(
                                  variantData.content.header?.title ||
                                    variantName,
                                ),
                                examplePrompt:
                                  (variantData.content.examples[0] as any)
                                    ?.prompt ||
                                  variantData.content.examples[0]?.title ||
                                  '',
                              })
                            : t('characterAppearance.placeholder')
                        }
                        className='w-full rounded-xl border-2'
                        size='lg'
                        minRows={wide ? 6 : 3}
                        value={characterImagePrompt}
                        classNames={{
                          // dark mode: content2 层级（#374151），比 Card 背景 content1（#1f2937）稍亮，创造层次感
                          inputWrapper: 'dark:!bg-input',
                          input: 'dark:!bg-transparent dark:!text-foreground',
                        }}
                        onChange={e => {
                          setCharacterImagePrompt(e.target.value);
                          if (shouldUseDraft) {
                            debouncedSaveDraft(getPageKey(), e.target.value);
                          }
                        }}
                      />
                      <div className='flex absolute right-2 bottom-2 items-center px-2 py-1 text-xs md:text-sm'>
                        <MdAutoAwesome className='mr-1 text-primary-500' />
                        {t('characterAppearance.aiOptimize')}
                        <Switch
                          isSelected={AiOptimize}
                          onChange={e => setAiOptimize(e.target.checked)}
                          size='sm'
                          className='ml-2'></Switch>
                      </div>
                    </div>
                    <div
                      className='flex overflow-x-auto flex-row gap-1 pb-1 mb-1 w-full whitespace-nowrap md:gap-2 md:mb-2'
                      style={{
                        scrollbarWidth: 'thin',
                        msOverflowStyle: 'none',
                      }}>
                      <Popover placement='bottom-start'>
                        <PopoverTrigger>
                          <Button
                            size='sm'
                            className='flex gap-2 items-center h-12 text-xs font-medium text-foreground bg-gradient-to-r rounded-lg from-secondary-100 to-primary-100 dark:from-secondary-900/50 dark:to-primary-900/50 md:text-sm'>
                            {t('popButton.gender')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='!p-2 md:!p-[10px] border-0.5 border-border bg-card'>
                          <div className='flex flex-col w-[85px] gap-1 md:gap-2'>
                            {[
                              {
                                key: 'male',
                                name: t('prompts.male'),
                                prompt: '1boy',
                                icon: '👦🏻',
                              },
                              {
                                key: 'female',
                                name: t('prompts.female'),
                                prompt: '1girl',
                                icon: '👧🏻',
                              },
                              {
                                key: 'other',
                                name: t('prompts.other'),
                                prompt: 'other',
                                icon: '🏳️‍🌈',
                              },
                            ].map((item: any) => (
                              <Button
                                key={item.prompt}
                                className='py-1 m-0 w-full justify-start !px-2 !border-1 !border-primary-200 dark:!border-primary-800 text-[12px] !rounded-lg'
                                onClick={() => {
                                  setCharacterGender(item.key);
                                  if (item.key === 'male') {
                                    setCharacterImagePrompt(
                                      `${item.prompt}, ${characterImagePrompt
                                        .replace(/1girl,/g, '')
                                        .replace(/1boy,/g, '')
                                        .trim()}`,
                                    );
                                  } else if (item.key === 'female') {
                                    setCharacterImagePrompt(
                                      `${item.prompt}, ${characterImagePrompt
                                        .replace(/1boy,/g, '')
                                        .replace(/1girl,/g, '')
                                        .trim()}`,
                                    );
                                  } else {
                                    setCharacterImagePrompt(
                                      characterImagePrompt
                                        .replace(/1boy,/g, '')
                                        .replace(/1girl,/g, '')
                                        .trim(),
                                    );
                                  }
                                }}
                                variant='light'>
                                <div className='flex gap-1 items-center w-full'>
                                  <div className='flex w-[16px] items-center'>
                                    {item.icon}
                                  </div>
                                  <div className='flex items-center capitalize'>
                                    {item.name}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <PopoverButton
                        title={t('popButton.style')}
                        prompts={[
                          {
                            name: t('prompts.animeColoring'),
                            prompt: 'anime coloring',
                          },
                          { name: t('prompts.chibi'), prompt: 'chibi' },
                          {
                            name: t('prompts.pastelColors'),
                            prompt: 'pastel colors',
                          },
                          {
                            name: t('prompts.celShading'),
                            prompt: 'cel shading',
                          },
                          { name: t('prompts.impasto'), prompt: 'impasto' },
                          {
                            name: t('prompts.watercolor'),
                            prompt: 'watercolor',
                          },
                          { name: t('prompts.realistic'), prompt: 'realistic' },
                          { name: t('prompts.celluloid'), prompt: 'celluloid' },
                          {
                            name: t('prompts.softServe'),
                            prompt: 'soft serve',
                          },
                          {
                            name: t('prompts.studioGhibli'),
                            prompt: 'Studio Ghibli style',
                          },
                          { name: t('prompts.lineart'), prompt: 'lineart' },
                          { name: t('prompts.cartoon'), prompt: 'cartoon' },
                          {
                            name: t('prompts.americanComic'),
                            prompt:
                              'American comic style, digital color comicbook style',
                          },
                          { name: t('prompts.pixelArt'), prompt: 'pixel art' },
                          { name: t('prompts.cyberpunk'), prompt: 'cyberpunk' },
                          {
                            name: t('prompts.genshinImpact'),
                            prompt:
                              'Genshin Impact style, original character in the world of Genshin Impact',
                          },
                          {
                            name: t('prompts.jujutsuKaisen'),
                            prompt:
                              'Jujutsu Kaisen style, original character in the world of Jujutsu Kaisen',
                          },
                          {
                            name: t('prompts.onePiece'),
                            prompt:
                              'One Piece style, original character in the world of One Piece',
                          },
                          {
                            name: t('prompts.naruto'),
                            prompt:
                              'Naruto style, original character in the world of Naruto',
                          },
                          {
                            name: t('prompts.demonSlayer'),
                            prompt:
                              'Demon Slayer style, original character in the world of Demon Slayer',
                          },
                          {
                            name: t('prompts.myHeroAcademia'),
                            prompt:
                              'My Hero Academia style, original character in the world of My Hero Academia',
                          },
                          {
                            name: t('prompts.dragonBall'),
                            prompt:
                              'Dragon Ball style, original character in the world of Dragon Ball',
                          },
                          {
                            name: t('prompts.sonic'),
                            prompt:
                              'Sonic the Hedgehog original character, anthropomorphic animal',
                          },
                          {
                            name: t('prompts.marvel'),
                            prompt:
                              'Marvel style, superhuman, original character in the Marvel universe',
                          },
                          {
                            name: t('prompts.minecraft'),
                            prompt: 'Minecraft style, blocky style',
                          },
                          {
                            name: t('prompts.mario'),
                            prompt:
                              'Mario style, original character in the world of Mario',
                          },
                          {
                            name: t('prompts.vintageComic'),
                            prompt: 'vintage comic',
                          },
                          {
                            name: t('prompts.oilPainting'),
                            prompt: 'oil painting',
                          },
                          { name: t('prompts.furry'), prompt: 'furry' },
                          { name: t('prompts.figurine'), prompt: 'figurine' },
                          { name: t('prompts.vampire'), prompt: 'vampire' },
                          { name: t('prompts.mermaid'), prompt: 'mermaid' },
                          { name: t('prompts.elf'), prompt: 'elf' },
                          { name: t('prompts.angel'), prompt: 'angel' },
                          { name: t('prompts.demon'), prompt: 'demon' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.age')}
                        prompts={[
                          { name: t('prompts.child'), prompt: 'child' },
                          { name: t('prompts.teenager'), prompt: 'teenager' },
                          { name: t('prompts.mature'), prompt: 'mature' },
                          {
                            name: t('prompts.middleAged'),
                            prompt: 'middle-aged',
                          },
                          { name: t('prompts.elderly'), prompt: 'elderly' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.body')}
                        prompts={[
                          { name: t('prompts.athletic'), prompt: 'athletic' },
                          { name: t('prompts.muscular'), prompt: 'muscular' },
                          { name: t('prompts.curvy'), prompt: 'curvy' },
                          { name: t('prompts.slim'), prompt: 'slim' },
                          { name: t('prompts.petite'), prompt: 'petite' },
                          { name: t('prompts.stocky'), prompt: 'stocky' },
                          { name: t('prompts.tall'), prompt: 'tall' },
                          { name: t('prompts.short'), prompt: 'short' },
                          { name: t('prompts.scrawny'), prompt: 'scrawny' },
                          { name: t('prompts.chubby'), prompt: 'chubby' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.hair')}
                        prompts={[
                          {
                            name: t('prompts.blackHair'),
                            prompt: 'black hair',
                          },
                          {
                            name: t('prompts.brownHair'),
                            prompt: 'brown hair',
                          },
                          {
                            name: t('prompts.blondeHair'),
                            prompt: 'blonde hair',
                          },
                          { name: t('prompts.redHair'), prompt: 'red hair' },
                          { name: t('prompts.blueHair'), prompt: 'blue hair' },
                          {
                            name: t('prompts.greenHair'),
                            prompt: 'green hair',
                          },
                          {
                            name: t('prompts.purpleHair'),
                            prompt: 'purple hair',
                          },
                          { name: t('prompts.pinkHair'), prompt: 'pink hair' },
                          { name: t('prompts.grayHair'), prompt: 'gray hair' },
                          {
                            name: t('prompts.whiteHair'),
                            prompt: 'white hair',
                          },
                          {
                            name: t('prompts.maroonHair'),
                            prompt: 'maroon hair',
                          },
                          {
                            name: t('prompts.offWhiteHair'),
                            prompt: 'off-white hair',
                          },
                          {
                            name: t('prompts.silverHair'),
                            prompt: 'silver hair',
                          },
                          {
                            name: t('prompts.straightHair'),
                            prompt: 'straight hair',
                          },
                          { name: t('prompts.braids'), prompt: 'braids' },
                          { name: t('prompts.ponytail'), prompt: 'ponytail' },
                          { name: t('prompts.twintails'), prompt: 'twintails' },
                          { name: t('prompts.bun'), prompt: 'bun' },
                          { name: t('prompts.longHair'), prompt: 'long hair' },
                          {
                            name: t('prompts.shortHair'),
                            prompt: 'short hair',
                          },
                          { name: t('prompts.wavyHair'), prompt: 'wavy hair' },
                          {
                            name: t('prompts.curlyHair'),
                            prompt: 'curly hair',
                          },
                          {
                            name: t('prompts.frizzyHair'),
                            prompt: 'frizzy hair',
                          },
                          { name: t('prompts.pigtails'), prompt: 'pigtails' },
                          { name: t('prompts.bald'), prompt: 'bald' },
                          {
                            name: t('prompts.sidePartedHair'),
                            prompt: 'side-parted hair',
                          },
                          { name: t('prompts.undercut'), prompt: 'undercut' },
                          { name: t('prompts.mohawk'), prompt: 'mohawk' },
                          {
                            name: t('prompts.dreadlocks'),
                            prompt: 'dreadlocks',
                          },
                          {
                            name: t('prompts.spikyHair'),
                            prompt: 'spiky hair',
                          },
                          { name: t('prompts.bobCut'), prompt: 'bob cut' },
                          { name: t('prompts.mullet'), prompt: 'mullet' },
                          {
                            name: t('prompts.mushroomCut'),
                            prompt: 'mushroom cut',
                          },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.eyes')}
                        prompts={[
                          {
                            name: t('prompts.brownEyes'),
                            prompt: 'brown eyes',
                          },
                          { name: t('prompts.blueEyes'), prompt: 'blue eyes' },
                          {
                            name: t('prompts.greenEyes'),
                            prompt: 'green eyes',
                          },
                          { name: t('prompts.redEyes'), prompt: 'red eyes' },
                          {
                            name: t('prompts.purpleEyes'),
                            prompt: 'purple eyes',
                          },
                          { name: t('prompts.pinkEyes'), prompt: 'pink eyes' },
                          { name: t('prompts.grayEyes'), prompt: 'gray eyes' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.face')}
                        prompts={[
                          { name: t('prompts.freckles'), prompt: 'freckles' },
                          { name: t('prompts.dimple'), prompt: 'dimple' },
                          { name: t('prompts.beard'), prompt: 'beard' },
                          { name: t('prompts.mustache'), prompt: 'mustache' },
                          { name: t('prompts.scar'), prompt: 'scar' },
                          { name: t('prompts.tattoo'), prompt: 'tattoo' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.skin')}
                        prompts={[
                          { name: t('prompts.fairSkin'), prompt: 'fair skin' },
                          { name: t('prompts.tanSkin'), prompt: 'tan skin' },
                          {
                            name: t('prompts.oliveSkin'),
                            prompt: 'olive skin',
                          },
                          { name: t('prompts.darkSkin'), prompt: 'dark skin' },
                          { name: t('prompts.paleSkin'), prompt: 'pale skin' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.top')}
                        prompts={[
                          { name: t('prompts.tShirt'), prompt: 't-shirt' },
                          { name: t('prompts.vest'), prompt: 'vest' },
                          {
                            name: t('prompts.plaidShirt'),
                            prompt: 'plaid shirt',
                          },
                          {
                            name: t('prompts.stripedShirt'),
                            prompt: 'striped shirt',
                          },
                          {
                            name: t('prompts.bohemianShirt'),
                            prompt: 'bohemian shirt',
                          },
                          {
                            name: t('prompts.henleyShirt'),
                            prompt: 'henley shirt',
                          },
                          { name: t('prompts.hoodie'), prompt: 'hoodie' },
                          {
                            name: t('prompts.knittedCardigan'),
                            prompt: 'knitted cardigan',
                          },
                          { name: t('prompts.labCoat'), prompt: 'lab coat' },
                          {
                            name: t('prompts.leatherJacket'),
                            prompt: 'leather jacket',
                          },
                          {
                            name: t('prompts.punkLeatherJacket'),
                            prompt: 'punk leather jacket',
                          },
                          {
                            name: t('prompts.varsityJacket'),
                            prompt: 'varsity jacket',
                          },
                          {
                            name: t('prompts.outdoorAdventureJacket'),
                            prompt: 'outdoor adventure jacket',
                          },
                          {
                            name: t('prompts.poloShirt'),
                            prompt: 'polo shirt',
                          },
                          {
                            name: t('prompts.knittedVest'),
                            prompt: 'knitted vest',
                          },
                          {
                            name: t('prompts.schoolVest'),
                            prompt: 'school vest',
                          },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.bottom')}
                        prompts={[
                          { name: t('prompts.jeans'), prompt: 'jeans' },
                          { name: t('prompts.overalls'), prompt: 'overalls' },
                          {
                            name: t('prompts.suitPants'),
                            prompt: 'suit pants',
                          },
                          {
                            name: t('prompts.casualPants'),
                            prompt: 'casual pants',
                          },
                          {
                            name: t('prompts.cargoPants'),
                            prompt: 'cargo pants',
                          },
                          {
                            name: t('prompts.capriPants'),
                            prompt: 'capri pants',
                          },
                          {
                            name: t('prompts.wideLegPants'),
                            prompt: 'wide-leg pants',
                          },
                          {
                            name: t('prompts.pleatedSkirt'),
                            prompt: 'pleated skirt',
                          },
                          {
                            name: t('prompts.pencilSkirt'),
                            prompt: 'pencil skirt',
                          },
                          {
                            name: t('prompts.denimSkirt'),
                            prompt: 'denim skirt',
                          },
                          {
                            name: t('prompts.beachShorts'),
                            prompt: 'beach shorts',
                          },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.set')}
                        prompts={[
                          { name: t('prompts.tracksuit'), prompt: 'tracksuit' },
                          { name: t('prompts.pajamas'), prompt: 'pajamas' },
                          {
                            name: t('prompts.downJacket'),
                            prompt: 'down jacket',
                          },
                          {
                            name: t('prompts.schoolUniform'),
                            prompt: 'school uniform',
                          },
                          { name: t('prompts.raincoat'), prompt: 'raincoat' },
                          {
                            name: t('prompts.eveningDress'),
                            prompt: 'evening dress',
                          },
                          {
                            name: t('prompts.littleBlackDress'),
                            prompt: 'little black dress',
                          },
                          { name: t('prompts.suit'), prompt: 'suit' },
                          { name: t('prompts.tuxedo'), prompt: 'tuxedo' },
                          { name: t('prompts.spacesuit'), prompt: 'spacesuit' },
                          {
                            name: t('prompts.divingSuit'),
                            prompt: 'diving suit',
                          },
                          { name: t('prompts.apron'), prompt: 'apron' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.material')}
                        prompts={[
                          { name: t('prompts.studs'), prompt: 'studs' },
                          { name: t('prompts.tassels'), prompt: 'tassels' },
                          { name: t('prompts.ruffles'), prompt: 'ruffles' },
                          { name: t('prompts.lace'), prompt: 'lace' },
                          {
                            name: t('prompts.zebraPrint'),
                            prompt: 'zebra print',
                          },
                          { name: t('prompts.plastic'), prompt: 'plastic' },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                      <PopoverButton
                        title={t('popButton.accessory')}
                        prompts={[
                          { name: t('prompts.headband'), prompt: 'headband' },
                          { name: t('prompts.hairpin'), prompt: 'hairpin' },
                          {
                            name: t('prompts.hairAccessory'),
                            prompt: 'hair accessory',
                          },
                          { name: t('prompts.crown'), prompt: 'crown' },
                          { name: t('prompts.corsage'), prompt: 'corsage' },
                          {
                            name: t('prompts.weddingVeil'),
                            prompt: 'wedding veil',
                          },
                          {
                            name: t('prompts.angleWings'),
                            prompt: 'angle wings',
                          },
                          { name: t('prompts.tie'), prompt: 'tie' },
                          { name: t('prompts.bowTie'), prompt: 'bow tie' },
                          { name: t('prompts.scarf'), prompt: 'scarf' },
                          { name: t('prompts.bow'), prompt: 'bow' },
                          { name: t('prompts.earrings'), prompt: 'earrings' },
                          { name: t('prompts.necklace'), prompt: 'necklace' },
                          { name: t('prompts.choker'), prompt: 'choker' },
                          { name: t('prompts.beret'), prompt: 'beret' },
                          {
                            name: t('prompts.baseballCap'),
                            prompt: 'baseball cap',
                          },
                          { name: t('prompts.knitHat'), prompt: 'knit hat' },
                          { name: t('prompts.topHat'), prompt: 'top hat' },
                          { name: t('prompts.sunHat'), prompt: 'sun hat' },
                          {
                            name: t('prompts.bucketHat'),
                            prompt: 'bucket hat',
                          },
                          {
                            name: t('prompts.featherHat'),
                            prompt: 'feather hat',
                          },
                          {
                            name: t('prompts.cowboyHat'),
                            prompt: 'cowboy hat',
                          },
                          { name: t('prompts.beanie'), prompt: 'beanie' },
                          { name: t('prompts.headscarf'), prompt: 'headscarf' },
                          { name: t('prompts.jewelry'), prompt: 'jewelry' },
                          { name: t('prompts.diamonds'), prompt: 'diamonds' },
                          { name: t('prompts.pearls'), prompt: 'pearls' },
                          { name: t('prompts.glasses'), prompt: 'glasses' },
                          {
                            name: t('prompts.sunglasses'),
                            prompt: 'sunglasses',
                          },
                          {
                            name: t('prompts.steampunkGoggles'),
                            prompt: 'steampunk goggles',
                          },
                          { name: t('prompts.eyePatch'), prompt: 'eye patch' },
                          {
                            name: t('prompts.aviatorSunglasses'),
                            prompt: 'aviator sunglasses',
                          },
                          {
                            name: t('prompts.headphones'),
                            prompt: 'headphones',
                          },
                          { name: t('prompts.bracelet'), prompt: 'bracelet' },
                          {
                            name: t('prompts.kneeHighSocks'),
                            prompt: 'knee-high socks',
                          },
                          {
                            name: t('prompts.boxingGloves'),
                            prompt: 'boxing gloves',
                          },
                          { name: t('prompts.foxEars'), prompt: 'fox ears' },
                          { name: t('prompts.catEars'), prompt: 'cat ears' },
                          {
                            name: t('prompts.rabbitEars'),
                            prompt: 'rabbit ears',
                          },
                          { name: t('prompts.wolfEars'), prompt: 'wolf ears' },
                          {
                            name: t('prompts.mechanicalWatch'),
                            prompt: 'mechanical watch',
                          },
                          {
                            name: t('prompts.digitalWatch'),
                            prompt: 'digital watch',
                          },
                          {
                            name: t('prompts.quartzWatch'),
                            prompt: 'quartz watch',
                          },
                        ]}
                        setCharacterImagePrompt={setCharacterImagePrompt}
                        characterImagePrompt={characterImagePrompt}
                      />
                    </div>
                    {/* <Tabs
                                            fullWidth
                                            aria-label="Gender Options"
                                            size="md"
                                            className=""
                                            onSelectionChange={(e) => {
                                                setCharacterGender(e as string);
                                            }}
                                            selectedKey={characterGender}
                                            classNames={{
                                                tab: "data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-600 transition-all duration-200",
                                                tabContent: "group-data-[selected=true]:font-medium"
                                            }}
                                        >
                                            <Tab key="male" title={<div className="flex items-center"><MdMale className="mr-2 text-lg" /> {t('gender.male')}</div>} />
                                            <Tab key="female" title={<div className="flex items-center"><MdFemale className="mr-2 text-lg" /> {t('gender.female')}</div>} />
                                            <Tab key="other" title={<div className="flex items-center">{t('gender.other')}</div>} />
                                        </Tabs> */}
                    <div className='py-2 w-full rounded-xl'>
                      <p className='flex items-center mb-2 text-xs font-medium text-left md:text-sm'>
                        {t('characterAppearance.referenceImage.title')}
                      </p>
                      <p className='text-xs text-muted-foreground mb-1 md:text-sm'>
                        {t('characterAppearance.referenceImage.description')}
                      </p>

                      {/* Reference Images Display - Inline Version */}
                      <ReferenceImagesInline
                        referenceItems={referenceItems}
                        setReferenceItems={setReferenceItems}
                        isPremium={
                          !!(profile?.plan && profile.plan !== 'Free') ||
                          profile?.is_cpp
                        }
                        onInsertName={formattedName => {
                          setCharacterImagePrompt(prev => {
                            const newPrompt = prev
                              ? `${prev} ${formattedName}`
                              : formattedName;
                            return newPrompt;
                          });
                        }}
                        onUpgradeRequired={() => {
                          // Track paywall trigger
                          trackPaywallTriggered(
                            profile?.id,
                            'feature_limit',
                            'multiple_reference_images',
                          );
                          // Open pricing modal with custom message
                          openModal('pricing', {
                            trackingContext: {
                              source: 'reference_images_limit',
                              triggerTool: 'oc-maker',
                            },
                          });
                          // Show toast message
                          toast.error(
                            t('toast:error.multipleReferenceImages'),
                            {
                              duration: 5000,
                              position: 'top-center',
                            },
                          );
                          openModal('pricing');
                        }}
                      />
                    </div>
                  </div>
                  <div className='flex gap-2 w-full md:gap-3'>
                    <Button
                      className={`mt-3 w-full transform transition-all duration-300 hover:scale-[1.02] ${generatedCharacters.length > 0 ? 'bg-secondary-500' : 'bg-gradient-to-r from-primary-600 to-purple-600'} text-white shadow-md hover:shadow-lg`}
                      color={
                        generatedCharacters.length > 0 ? 'secondary' : 'primary'
                      }
                      size='lg'
                      isLoading={generating}
                      onClick={async () => {
                        if (!profile.id) {
                          loginModalState.onOpen?.();
                          return;
                        }

                        if (profile.credit < cost) {
                          // 在paywall触发时记录创建了多少个oc
                          trackPaywallTriggered(
                            profile.id,
                            'credit_insufficient',
                            'oc_maker',
                            'oc_creation',
                            profile.credit,
                            cost,
                            {
                              oc_count_when_blocked: generatedCharacters.length,
                              required_credits: cost,
                              user_plan: profile.plan || 'Free',
                            },
                          );

                          openModal('pricing', {
                            trackingContext: {
                              source: 'paywall',
                              triggerTool: 'oc_maker',
                            },
                          });
                          return;
                        }

                        // 点击生成按钮时立即滚动到底部
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({
                            top: scrollContainerRef.current.scrollHeight,
                            behavior: 'smooth',
                          });
                        }

                        // Build reference names list for context
                        let referenceNamesText = '';
                        if (referenceItems.length > 0) {
                          referenceNamesText = referenceItems
                            .map(item => item.name)
                            .filter(name => name.trim())
                            .join(', ');
                        }

                        // Process reference images: use base64 if total size < 4.5MB, otherwise upload to Supabase
                        let referenceImageUrls: string[] = [];
                        if (referenceItems.length > 0) {
                          try {
                            const { uploadFile, fileToBase64, getBase64Size } =
                              await import('../utilities');
                            const { v4: uuidv4 } = await import('uuid');

                            // Convert all files to base64
                            const base64Array = await Promise.all(
                              referenceItems.map(item =>
                                fileToBase64(item.file),
                              ),
                            );

                            // Calculate total size
                            const totalSize = base64Array.reduce(
                              (sum, b64) => sum + getBase64Size(b64),
                              0,
                            );
                            const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB

                            if (totalSize < MAX_SIZE) {
                              // Use base64 directly (no upload to Supabase)
                              referenceImageUrls = base64Array;
                              console.log(
                                `Using base64 for reference images (total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB < 4.5MB)`,
                              );
                            } else {
                              // Upload to Supabase
                              console.log(
                                `Uploading to Supabase (total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB >= 4.5MB)`,
                              );
                              referenceImageUrls = await Promise.all(
                                referenceItems.map(async item => {
                                  const ext =
                                    item.file.type.split('/')[1] || 'jpg';
                                  const filename = `app_media/references/${uuidv4()}.${ext}`;
                                  const publicUrl = await uploadFile(
                                    filename,
                                    item.file,
                                  );
                                  return publicUrl;
                                }),
                              );
                            }
                          } catch (error) {
                            console.error(
                              'Failed to process reference images:',
                              error,
                            );
                            toast.error(
                              t('toast:error.uploadFailed') ||
                                'Failed to process reference images',
                            );
                            return;
                          }
                        }

                        let finalPrompt = characterImagePrompt;
                        setGenerating(true);
                        if (AiOptimize) {
                          try {
                            const { generateText } = await loadCanvasUtils();

                            // Build optimization prompt with reference context
                            let optimizationPrompt = `You are optimizing a prompt for anime character image generation.

User's original prompt: "${characterImagePrompt}"`;

                            // Always inform AI about reference images if they exist
                            if (referenceNamesText) {
                              optimizationPrompt += `

CRITICAL CONTEXT - Reference Images:
- There are ${referenceItems.length} reference image(s) uploaded with names: ${referenceNamesText}
- These reference images will be used during generation to influence the character's appearance
- If the user's prompt mentions ANY of these names (${referenceNamesText}), they are referring to these reference images
- You MUST preserve these reference names EXACTLY as they appear in the user's prompt
- DO NOT remove, modify, or interpret these names as regular words
- Example: If user says "mix 1, 2, 3" and reference names are "1", "2", "3", keep "1, 2, 3" in the optimized prompt`;
                            }

                            optimizationPrompt += `

Optimization rules:
1. Rewrite as comma-separated phrases in Danbooru tag style
2. Order: [1boy/1girl/leave empty], [reference names if mentioned], [other characteristics]
3. PRESERVE any reference image names (${referenceNamesText || 'N/A'}) mentioned in the original prompt
4. Add standard tags at the end: "single character, full body, looking at viewer, anime style, simple background, white background"
   - Use "upper body" instead of "full body" if user specifies upper body
   - Skip "anime style" if user specifies another style
5. Keep the prompt concise and focused on visual characteristics

Output ONLY the optimized prompt, nothing else.`;

                            let rawOutput = await generateText(
                              optimizationPrompt,
                              undefined,
                              t,
                            );
                            finalPrompt = rawOutput
                              .trim()
                              .replace(/^["']+|["']+$/g, '');
                            setCharacterImagePrompt(finalPrompt);
                          } catch (error) {
                            console.error(error);
                          }
                        }
                        const numExistingCharacters =
                          generatedCharacters.length;
                        setGeneratedCharacters(prevCharacters => {
                          return [...prevCharacters, '', '', '', ''];
                        });

                        const artProStyles = [
                          'soft-shaded-moe-style',
                          'pop-anime-style',
                          'soft-pastel-style',
                          'bright-anime-style',
                          'toon-shaded-style',
                          'semi-realistic-portrait-style',
                          'sketchy-painterly-style',
                          '3d-anime-style',
                        ];

                        const shuffledStyles = [...artProStyles].sort(
                          () => Math.random() - 0.5,
                        );
                        const selectedStyles = shuffledStyles.slice(0, 3);

                        async function generateSingleCharacter(
                          i: number,
                        ): Promise<void> {
                          // NoobaiXL
                          const { generateImageGetUrls } =
                            await loadCanvasUtils();
                          let imageUrl;
                          if (referenceImageUrls.length > 0) {
                            // Use Gemini for multiple reference images, Flux for single
                            const useGemini = referenceImageUrls.length > 1;
                            const model = useGemini ? 'Gemini Mini' : 'Flux';

                            // finalPrompt already includes reference names from AI Optimizer or manual addition above
                            const imageUrls = await generateImageGetUrls(
                              finalPrompt,
                              'portrait',
                              1,
                              model,
                              [],
                              referenceImageUrls,
                              false,
                              true,
                              t,
                              'oc-maker',
                              useGemini
                                ? {
                                    reference_names: referenceItems.map(
                                      item => item.name,
                                    ),
                                  }
                                : undefined,
                            );
                            imageUrl = imageUrls[0].url;
                          } else {
                            let model: string;
                            let promptWithStyle: string = finalPrompt;

                            if (i === 0) {
                              model = 'Illustrious';
                            } else {
                              model = 'Art Pro';
                              const styleTag = `[${selectedStyles[i - 1]}]`;
                              promptWithStyle = `${styleTag} ${finalPrompt}`;
                            }

                            const imageUrls = await generateImageGetUrls(
                              promptWithStyle,
                              model === 'Art Pro'
                                ? { width: 1080, height: 1440 }
                                : 'portrait',
                              1,
                              model,
                              [],
                              undefined,
                              false,
                              true,
                              t,
                              'oc-maker',
                              undefined, // meta_data
                              undefined, // noTranslate
                              undefined, // useMagicPrompt
                              undefined, // userNegativePrompt
                            );
                            imageUrl = imageUrls[0].url;
                          }
                          setGeneratedCharacters(prevCharacters => {
                            let newCharacters = [...prevCharacters];
                            newCharacters[numExistingCharacters + i] = imageUrl;
                            return newCharacters;
                          });
                        }

                        const promises: Promise<void>[] = [];
                        for (let i = 0; i < characterCount; i++) {
                          promises.push(generateSingleCharacter(i));
                        }
                        await Promise.all(promises)
                          .catch(e => {
                            console.error(e);
                          })
                          .finally(() => {
                            if (shouldUseDraft) {
                              consumeDraft(getPageKey());
                            }
                          });
                        setGenerating(false);
                      }}>
                      {generatedCharacters.length > 0 ? (
                        <>{t('actions.generateMore')}</>
                      ) : (
                        <>
                          <RiMagicLine className='mr-1 text-lg' />{' '}
                          {t('actions.generateCharacter')}
                        </>
                      )}
                      {isAuth && (
                        <Chip
                          startContent={
                            <BiSolidZap className='mr-0 w-5 h-5 text-orange-400' />
                          }
                          variant='bordered'
                          color={
                            generatedCharacters.length > 0
                              ? 'secondary'
                              : 'primary'
                          }
                          className='ml-1 bg-card'
                          classNames={{
                            content: 'dark:text-foreground',
                          }}>
                          -{cost}/{profile.credit}
                        </Chip>
                      )}
                    </Button>
                    {selectedCharacterIndex !== -1 && (
                      <Button
                        onClick={() => {
                          setSelectedImage(
                            generatedCharacters[selectedCharacterIndex],
                          );
                          router.push('/character/edit?source=oc-maker');
                        }}
                        className='mt-3 w-full transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
                        size='lg'>
                        <FaCheck className='mr-2' />{' '}
                        {t('actions.finalizeDesign')}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* 右侧结果区域 */}
              <div className='w-full lg:flex-1 lg:relative h-[600px] lg:h-auto'>
                <Card className='shadow-2xl border-1.5 border-primary-50 dark:border-primary-800 h-full lg:absolute lg:inset-0 flex flex-col bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30'>
                  <div className='overflow-hidden flex-1'>
                    <div
                      className='overflow-y-auto h-full'
                      ref={scrollContainerRef}>
                      {generatedCharacters.length > 0 ? (
                        <div className='flex flex-1 justify-center items-center p-2 w-full bg-card bg-opacity-90 rounded-lg md:p-4'>
                          <div className='grid grid-cols-2 gap-2 p-1 max-w-md md:gap-4 w-lg'>
                            {generatedCharacters.map((imageUrl, index) => (
                              <div key={index} className='w-full'>
                                <div
                                  className={`relative w-full cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${selectedCharacterIndex === index ? 'ring-4 ring-primary-500 ' : 'hover:opacity-90'}`}
                                  onClick={() =>
                                    imageUrl && setSelectedCharacterIndex(index)
                                  }>
                                  <Image
                                    isZoomed
                                    src={
                                      imageUrl !== ''
                                        ? imageUrl
                                        : '/images/Chicken_animation.gif'
                                    }
                                    className='object-cover w-full h-full rounded-xl'
                                    style={{ aspectRatio: '2/3' }}
                                  />
                                  {imageUrl !== '' && (
                                    <div className='absolute top-2 left-2 z-10'>
                                      <Checkbox
                                        size='lg'
                                        isSelected={
                                          selectedCharacterIndex == index
                                        }
                                        onChange={() => {
                                          setSelectedCharacterIndex(index);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className='flex flex-col justify-center items-center p-4 h-full text-center md:p-8'>
                          <h3 className='mb-2 text-lg font-medium text-foreground md:text-xl'>
                            {t('results.empty.title')}
                          </h3>
                          <p className='max-w-md text-sm text-muted-foreground md:text-base'>
                            {t('results.empty.description')}
                          </p>
                          <div className='absolute bottom-0 left-0 z-0 w-full h-full opacity-20'>
                            <div
                              className='w-full h-full'
                              style={{
                                backgroundImage: backgroundImage,
                                backgroundSize: 'cover',
                                backgroundPosition: 'top',
                              }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* What Is Section */}
            {renderSection('whatIs')}

            {/* How To Use Section */}
            {renderSection('howItWorks')}

            {/* Examples Section */}
            {renderSection('examples')}

            {/* Benefits Section */}
            {renderSection('features')}

            <div className='my-12 md:my-16'>
              <MoreAITools category='illustration' />
            </div>

            {/* FAQ Section */}
            {renderSection('faq')}
          </div>
        </div>
        <SiteFooter className='ml-5 border-border md:pl-56 lg:pl-[240px]' />
      </main>
    </NextUIProvider>
  );
}
const PopoverButton = ({
  title,
  prompts,
  setCharacterImagePrompt,
  characterImagePrompt,
}: {
  title: string;
  prompts: string[] | { name: string; prompt?: string }[];
  setCharacterImagePrompt: any;
  characterImagePrompt: string;
}) => {
  return (
    <Popover placement='bottom-start'>
      <PopoverTrigger>
        <Button
          size='sm'
          className='flex gap-2 items-center h-12 text-xs font-medium text-foreground rounded-lg bg-primary-100 dark:bg-gradient-to-r dark:from-secondary-900/50 dark:to-primary-900/50 md:text-sm'>
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='!p-2 md:!p-[10px] border-0.5 border-border bg-card'>
        {prompts.length < 7 ? (
          <div className='flex flex-col w-[90px] gap-1 md:gap-2'>
            {prompts.map((item: any, index: number) => {
              const promptValue =
                typeof item === 'string' ? item : item.prompt || item.name;
              // Check if the exact prompt value exists in characterImagePrompt
              // Use regex to match the full prompt value as a substring
              const escapedValue = promptValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&',
              );
              const regex = new RegExp(
                `(^|,\\s*)${escapedValue}($|\\s*,)`,
                'i',
              );
              const isSelected = regex.test(characterImagePrompt);

              return (
                <Button
                  key={
                    typeof item === 'string' ? item : item.name + '-' + index
                  }
                  className={`py-1 m-0 w-full justify-start !px-2 !border-1 text-[12px] !rounded-lg ${
                    isSelected
                      ? '!border-primary-500 !bg-primary-100 dark:!bg-primary-900/50 !text-primary-700 dark:!text-primary-300'
                      : '!border-primary-200 dark:!border-primary-700'
                  }`}
                  onPress={() => {
                    if (isSelected) {
                      // Remove the prompt value if already selected
                      const removeRegex = new RegExp(
                        `(^|,\\s*)${escapedValue}($|\\s*,)`,
                        'gi',
                      );
                      const newPrompt = characterImagePrompt
                        .replace(removeRegex, (match, prefix, suffix) => {
                          if (prefix && suffix) return ', ';
                          return '';
                        })
                        .replace(/^,\s*|,\s*$/g, '')
                        .replace(/,\s*,/g, ',');
                      setCharacterImagePrompt(newPrompt);
                    } else {
                      // Add the prompt value
                      setCharacterImagePrompt(
                        `${characterImagePrompt.replace(/, *$/, '')}, ${promptValue}`,
                      );
                    }
                  }}
                  variant={isSelected ? 'flat' : 'light'}>
                  {typeof item === 'string'
                    ? item.charAt(0).toUpperCase() + item.slice(1)
                    : item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className='flex flex-row flex-wrap max-w-[450px] gap-1 md:gap-2'>
            {prompts.map((item: any, index: number) => {
              const promptValue =
                typeof item === 'string' ? item : item.prompt || item.name;
              // Check if the exact prompt value exists in characterImagePrompt
              // Use regex to match the full prompt value as a substring
              const escapedValue = promptValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&',
              );
              const regex = new RegExp(
                `(^|,\\s*)${escapedValue}($|\\s*,)`,
                'i',
              );
              const isSelected = regex.test(characterImagePrompt);

              return (
                <Button
                  key={
                    typeof item === 'string' ? item : item.name + '-' + index
                  }
                  size='sm'
                  className={`!py-0 m-0 justify-start !px-2 !border-1 text-[12px] !rounded-lg ${
                    isSelected
                      ? '!border-primary-500 !bg-primary-100 dark:!bg-primary-900/50 !text-primary-700 dark:!text-primary-300'
                      : '!border-primary-200 dark:!border-primary-700'
                  }`}
                  onPress={() => {
                    if (isSelected) {
                      // Remove the prompt value if already selected
                      const removeRegex = new RegExp(
                        `(^|,\\s*)${escapedValue}($|\\s*,)`,
                        'gi',
                      );
                      const newPrompt = characterImagePrompt
                        .replace(removeRegex, (match, prefix, suffix) => {
                          // Keep comma if there are items on both sides
                          if (prefix && suffix) return ', ';
                          return '';
                        })
                        .replace(/^,\s*|,\s*$/g, '')
                        .replace(/,\s*,/g, ',');
                      setCharacterImagePrompt(newPrompt);
                    } else {
                      // Add the prompt value
                      setCharacterImagePrompt(
                        `${characterImagePrompt.replace(/, *$/, '')}, ${promptValue}`,
                      );
                    }
                  }}
                  variant={isSelected ? 'flat' : 'light'}>
                  {typeof item === 'string'
                    ? item.charAt(0).toUpperCase() + item.slice(1)
                    : item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

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
