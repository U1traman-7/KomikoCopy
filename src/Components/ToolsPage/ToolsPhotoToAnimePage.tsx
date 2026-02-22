import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "./PhotoToAnimeConvert";
import { useTranslation } from "react-i18next";
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { Hero, CTA } from '@/Components/SEO';
const faqs = [
  {
    id: 1,
    question: 'faq.question1',
    answer: 'faq.answer1',
  },
  {
    id: 2,
    question: 'faq.question2',
    answer: 'faq.answer2',
  },
  {
    id: 3,
    question: 'faq.question3',
    answer: 'faq.answer3',
  },
  {
    id: 4,
    question: 'faq.question4',
    answer: 'faq.answer4',
  },
  {
    id: 6,
    question: 'faq.question5',
    answer: 'faq.answer5',
  },
];

interface ToolsPhotoToAnimePageProps {
  isMobile?: boolean;
  translations?: any;
  defaultStyle?: any;
  variantContent?: any;
  variantKey?: string;
}

export default function ToolsPhotoToAnimePage({
  isMobile,
  translations,
  defaultStyle,
  variantContent,
  variantKey,
}: ToolsPhotoToAnimePageProps) {
  const { t } = useTranslation('photo-to-anime');
  const { t: tCommon } = useTranslation('common');

  // 判断是否为 variant 页面
  const isVariant = !!variantContent;

  // 创建统一的内容结构
  const content = {
    header: {
      title: isVariant ? variantContent.content.header.title : t('hero.title'),
      subtitle: isVariant
        ? variantContent.content.header.subtitle
        : t('hero.description'),
    },
    sections: {
      whatIs: {
        title:
          isVariant && variantContent.content.sections?.whatIs?.title
            ? variantContent.content.sections.whatIs.title
            : t('whatIs.title'),
        description:
          isVariant && variantContent.content.sections?.whatIs?.description
            ? variantContent.content.sections.whatIs.description
            : t('whatIs.description'),
      },
      howToUse: {
        title:
          isVariant && variantContent.content.sections?.howToUse?.title
            ? variantContent.content.sections.howToUse.title
            : t('howItWorks.title'),
        subtitle:
          isVariant && variantContent.content.sections?.howToUse?.subtitle
            ? variantContent.content.sections.howToUse.subtitle
            : '',
        steps:
          isVariant && variantContent.content.sections?.howToUse?.steps
            ? variantContent.content.sections.howToUse.steps
            : [
                {
                  title: t('howItWorks.step1.title'),
                  content: t('howItWorks.step1.content'),
                },
                {
                  title: t('howItWorks.step2.title'),
                  content: t('howItWorks.step2.content'),
                },
                {
                  title: t('howItWorks.step3.title'),
                  content: t('howItWorks.step3.content'),
                },
                {
                  title: t('howItWorks.step4.title'),
                  content: t('howItWorks.step4.content'),
                },
              ],
      },
      whyUse: {
        title:
          isVariant && variantContent.content.sections?.whyUse?.title
            ? variantContent.content.sections.whyUse.title
            : t('benefits.title'),
        subtitle:
          isVariant && variantContent.content.sections?.whyUse?.subtitle
            ? variantContent.content.sections.whyUse.subtitle
            : '',
        features:
          isVariant && variantContent.content.sections?.whyUse?.features
            ? variantContent.content.sections.whyUse.features
            : [
                {
                  title: t('benefits.feature1.title'),
                  content: t('benefits.feature1.content'),
                },
                {
                  title: t('benefits.feature2.title'),
                  content: t('benefits.feature2.content'),
                },
                {
                  title: t('benefits.feature3.title'),
                  content: t('benefits.feature3.content'),
                },
                {
                  title: t('benefits.feature4.title'),
                  content: t('benefits.feature4.content'),
                },
                {
                  title: t('benefits.feature5.title'),
                  content: t('benefits.feature5.content'),
                },
                {
                  title: t('benefits.feature6.title'),
                  content: t('benefits.feature6.content'),
                },
              ],
      },
      examples: {
        title:
          isVariant && variantContent.content.sections?.examples?.title
            ? variantContent.content.sections.examples.title
            : t('examples.title'),
      },
      faq: {
        title:
          isVariant && variantContent.content.sections?.faq?.title
            ? variantContent.content.sections.faq.title
            : tCommon('faq'),
        description:
          isVariant && variantContent.content.sections?.faq?.description
            ? variantContent.content.sections.faq.description
            : '',
      },
      cta:
        isVariant && variantContent.content.sections?.cta
          ? variantContent.content.sections.cta
          : undefined,
    },
    examples:
      isVariant && variantContent.content.examples
        ? variantContent.content.examples
        : [
            {
              input: '/images/examples/photo-to-anime/input2.jpg',
              output: '/images/examples/photo-to-anime/girl_anime.webp',
              type: 'examples.style.anime',
            },
            {
              input: '/images/examples/photo-to-anime/black_guy_photo.webp',
              output: '/images/examples/photo-to-anime/boy_anime.webp',
              type: 'examples.style.anime',
            },
            {
              input: '/images/examples/photo-to-anime/cat_photo.webp',
              output: '/images/examples/photo-to-anime/cat_anime.webp',
              type: 'examples.style.anime',
            },
            {
              input: '/images/examples/photo-to-anime/dog_photo.webp',
              output: '/images/styles/anime.webp',
              type: 'examples.style.anime',
            },
          ],
    faq:
      isVariant && variantContent.content.faq
        ? variantContent.content.faq
        : faqs.map(faq => ({
            ...faq,
            question: t(faq.question),
            answer: t(faq.answer),
          })),
    cta:
      isVariant && variantContent.content.cta
        ? variantContent.content.cta
        : undefined,
  };

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        <Hero
          title={content.header.title}
          description={content.header.subtitle}
        />

        <PhotoToAnimeConvert
          selectedStyle={defaultStyle}
        />

        {/* What Is Section - 只在 variant 页面显示 */}
        {isVariant && variantContent.content.sections?.whatIs && (
          <div className='pt-14 md:py-16 md:mt-16'>
            <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {content.sections.whatIs.title}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
              <p>{content.sections.whatIs.description}</p>
            </div>
          </div>
        )}

        {/* Examples Section */}
        <div className='mt-12 md:mt-16'>
          <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {content.sections.examples.title}
          </h2>
          <div className='grid grid-cols-1 gap-6 md:gap-10 md:grid-cols-2'>
            {content.examples.map((item: any, index: number) => (
              <div
                key={index}
                className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6 pb-2'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg h-48 md:h-64 max-w-full max-h-80'>
                      <img
                        src={item.input || item.image}
                        alt='Input'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {isVariant ? 'Input' : t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg h-48 md:h-64 max-w-full max-h-80'>
                      <img
                        src={item.output || item.image}
                        alt='Output'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {isVariant ? 'Output' : t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 h-[56px] border-box'>
                  <p className='h-full font-medium capitalize text-primary-600 text-sm md:text-base'>
                    {item.prompt ||
                      (item.type ? t(item.type) : t('examples.style.anime'))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className='mt-12 md:mt-24 bg-background'>
          <h2 className='mb-4 md:mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
            {content.sections.howToUse.title}
          </h2>
          {content.sections.howToUse.subtitle && (
            <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
              {content.sections.howToUse.subtitle}
            </p>
          )}
          <div className='grid grid-cols-1 gap-4 md:gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {content.sections.howToUse.steps.map((step: any, index: number) => (
              <div
                key={index}
                className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                  {index + 1}
                </div>
                <div className='flex-grow'>
                  <h3 className='mb-3 text-lg font-bold text-primary-600 md:text-xl'>
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

        {/* Features Section */}
        <div className='pb-10 md:pb-16 mt-12 md:mt-24 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {content.sections.whyUse.title}
          </h2>
          {content.sections.whyUse.subtitle && (
            <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
              {content.sections.whyUse.subtitle}
            </p>
          )}
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {content.sections.whyUse.features.map(
              (feature: any, index: number) => (
                <div
                  key={index}
                  className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                  <div className='flex items-center mb-4'>
                    <h3 className='text-lg font-semibold text-primary-600 md:text-xl'>
                      {feature.title}
                    </h3>
                  </div>
                  <p className='text-muted-foreground text-sm md:text-base'>
                    {feature.content}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        <div className='my-12 md:my-24'>
          <MoreAITools category='illustration' />
        </div>

        {/* FAQ Section */}
        <div className='pb-12 md:pb-16 md:mt-24'>
          <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
            {content.sections.faq.title}
          </h2>
          <p className='mx-auto mb-6 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {content.sections.faq.description}
          </p>
          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={content.faq} />
            </div>
          </div>
        </div>

        {content.sections.cta && (
          <CTA
            title={content.sections.cta.title}
            description={content.sections.cta.description}
            buttonText={content.sections.cta.buttonText}
          />
        )}
      </div>
    </div>
  );
}
