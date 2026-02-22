import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "./PhotoToAnimeConvert";
import { useTranslation } from "react-i18next";
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { Hero, CTA } from '@/Components/SEO';
interface ToolsExpressionChangerProps {
  defaultStyle?: any;
}

export default function ToolsExpressionChanger({
  defaultStyle,
}: ToolsExpressionChangerProps) {
  const { t } = useTranslation('ai-expression-changer');
  //  turn string to array
  const examples = t('content.examples', { returnObjects: true });

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <Toaster />
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        <Hero
          title={t('content.header.title')}
          description={t('content.header.subtitle')}
        />

        <PhotoToAnimeConvert
          selectedStyle={defaultStyle}
        />

        {/* What Is Section - 只在 variant 页面显示 */}
        {t('content.sections.whatIs') && (
          <div className='pt-14 md:py-16 md:mt-16'>
            <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('content.sections.whatIs.title')}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
              <p>{t('content.sections.whatIs.description')}</p>
            </div>
          </div>
        )}

        {/* Examples Section */}
        <div className='mt-12 md:mt-16'>
          <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('content.sections.examples.title')}
          </h2>
          <div className='grid grid-cols-1 gap-6 md:gap-10 md:grid-cols-2'>
            {examples?.map((item: any, index: number) => (
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
                      {t('content.inputLabel')}
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
                      {t('content.outputLabel')}
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
            {t('content.sections.howToUse.title')}
          </h2>
          {t('content.sections.howToUse.subtitle') && (
            <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
              {t('content.sections.howToUse.subtitle')}
            </p>
          )}
          <div className='grid grid-cols-1 gap-4 md:gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {t('content.sections.howToUse.steps', { returnObjects: true }).map(
              (step: any, index: number) => (
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
              ),
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className='pb-10 md:pb-16 mt-12 md:mt-24 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('content.sections.whyUse.title')}
          </h2>
          {t('content.sections.whyUse.subtitle') && (
            <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
              {t('content.sections.whyUse.subtitle')}
            </p>
          )}
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {t('content.sections.whyUse.features', { returnObjects: true }).map(
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
            {t('content.sections.faq.title')}
          </h2>
          <p className='mx-auto mb-6 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('content.sections.faq.description')}
          </p>
          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={t('content.faq', { returnObjects: true })} />
            </div>
          </div>
        </div>

        {t('content.sections.cta') && (
          <CTA
            title={t('content.sections.cta.title')}
            description={t('content.sections.cta.description')}
            buttonText={t('content.sections.cta.buttonText')}
          />
        )}
      </div>
    </div>
  );
}
