import React from 'react'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import FAQ from '@/components/FAQ'
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps'

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['moonvalley-marey', 'toast'])

  const localizedFaqs = [
    {
      id: 1,
      question: t('marey.faq.question1'),
      answer: t('marey.faq.answer1'),
    },
    {
      id: 2,
      question: t('marey.faq.question2'),
      answer: t('marey.faq.answer2'),
    },
    {
      id: 3,
      question: t('marey.faq.question3'),
      answer: t('marey.faq.answer3'),
    },
    {
      id: 4,
      question: t('marey.faq.question4'),
      answer: t('marey.faq.answer4'),
    },
    {
      id: 5,
      question: t('marey.faq.question5'),
      answer: t('marey.faq.answer5'),
    },
    {
      id: 6,
      question: t('marey.faq.question6'),
      answer: t('marey.faq.answer6'),
    },
    {
      id: 7,
      question: t('marey.faq.question7'),
      answer: t('marey.faq.answer7'),
    },
    {
      id: 8,
      question: t('marey.faq.question8'),
      answer: t('marey.faq.answer8'),
    },
  ]

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-4 md:mb-6 text-2xl font-bold text-center text-heading md:text-4xl lg:text-5xl'>
            {t('marey.hero.title')}
          </h1>
          <p className='px-2 mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('marey.hero.description')}
          </p>
        </div>

        <div className='mb-5 md:mb-7 lg:mb-10'>
          <ImageOrTextToVideoConvert exampleVideoUrl='https://framerusercontent.com/assets/n2GMFj97mJ15e8X2Qulx9RRQNbs.mp4' />
        </div>

        {/* Marey Examples Section */}
        <section className='py-5 md:py-8 lg:py-12 mb-4 md:mb-8 px-2'>
          <h2 className='mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('marey.examples.title')}
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('marey.examples.description')}
          </p>

          <div className='grid grid-cols-1 gap-4 md:gap-5 lg:gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {/* Camera Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/qNhzpeN3vAxl04mGH91EPsPbKow.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.cameraControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.cameraControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.cameraControl.description')}
                </p>
              </div>
            </div>

            {/* Motion Transfer Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/kccjyMwuMfI0AFrAKIP2JIVYFk.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.motionTransfer')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.motionTransfer.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.motionTransfer.description')}
                </p>
              </div>
            </div>

            {/* Trajectory Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/dVjvNN7XHGWupVsi6AppNGUCL4k.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.trajectoryControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.trajectoryControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.trajectoryControl.description')}
                </p>
              </div>
            </div>

            {/* Keyframing Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/n2GMFj97mJ15e8X2Qulx9RRQNbs.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.keyframing')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.keyframing.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.keyframing.description')}
                </p>
              </div>
            </div>

            {/* Reference Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/FsvuMqquKIb3qL6gk1FLCzOblo.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.referenceControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.referenceControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.referenceControl.description')}
                </p>
              </div>
            </div>

            {/* Pose Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/USHQ1X6sdrPzGGECy1sxY4DZzU.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('marey.examples.videoFallback.poseControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('marey.examples.poseControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('marey.examples.poseControl.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='py-5 md:py-8 lg:py-12'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('marey.whatIs.title')}
          </h2>
          <p className='mx-auto text-sm md:text-base mb-6 max-w-3xl text-center text-muted-foreground md:mb-2 lg:mb-10'>
            {t('marey.whatIs.description')}
          </p>
        </section>

        {/* Benefits Section */}
        <div className='mb-4 md:mb-8 py-8 bg-gradient-to-b from-background rounded-xl to-primary-100 md:py-12 lg:py-16'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('marey.benefits.title')}
          </h2>
          <p className='mx-auto text-sm md:text-base mb-6 max-w-3xl text-center text-muted-foreground md:mb-8 lg:mb-10'>
            {t('marey.benefits.description')}
          </p>
          <div className='grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6'>
            {[
              {
                title: t('marey.benefits.features.awareness3D.title'),
                content: t('marey.benefits.features.awareness3D.content'),
                icon: '🎬',
              },
              {
                title: t('marey.benefits.features.commercialSafe.title'),
                content: t('marey.benefits.features.commercialSafe.content'),
                icon: '✅',
              },
              {
                title: t('marey.benefits.features.motionControl.title'),
                content: t('marey.benefits.features.motionControl.content'),
                icon: '🎯',
              },
              {
                title: t('marey.benefits.features.rapidProduction.title'),
                content: t('marey.benefits.features.rapidProduction.content'),
                icon: '⚡',
              },
              {
                title: t('marey.benefits.features.studioGrade.title'),
                content: t('marey.benefits.features.studioGrade.content'),
                icon: '⭐',
              },
              {
                title: t('marey.benefits.features.creativeFreedom.title'),
                content: t('marey.benefits.features.creativeFreedom.content'),
                icon: '🎨',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                <div className='flex items-center mb-1 md:mb-4'>
                  <span className='mr-3 text-sm md:text-2xl'>
                    {feature.icon}
                  </span>
                  <h3 className='text-base md:text-xl font-semibold text-primary-600'>
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

        {/* How It Works Section */}
        <div className='py-8 bg-background md:py-12 lg:py-16'>
          <h2 className='mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('marey.howItWorks.title')}
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-8'>
            {[
              {
                step: 1,
                title: t('marey.howItWorks.steps.step1.title'),
                content: t('marey.howItWorks.steps.step1.content'),
              },
              {
                step: 2,
                title: t('marey.howItWorks.steps.step2.title'),
                content: t('marey.howItWorks.steps.step2.content'),
              },
              {
                step: 3,
                title: t('marey.howItWorks.steps.step3.title'),
                content: t('marey.howItWorks.steps.step3.content'),
              },
              {
                step: 4,
                title: t('marey.howItWorks.steps.step4.title'),
                content: t('marey.howItWorks.steps.step4.content'),
              },
            ].map(step => (
              <div
                key={step.title}
                className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                <div className='flex justify-center items-center mb-4 w-8 md:w-14 h-8 md:h-14 text-sm md:text-2xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600'>
                  {step.step}
                </div>
                <div className='flex-grow'>
                  <h3 className='mb-3 text-base md:text-xl font-bold text-primary-600'>
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

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* FAQ Section */}
        <div className='py-8 md:py-12 lg:py-16'>
          <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('marey.faqSection.title')}
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground md:mb-8 lg:mb-10'>
            {t('marey.faqSection.description')}
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={localizedFaqs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
