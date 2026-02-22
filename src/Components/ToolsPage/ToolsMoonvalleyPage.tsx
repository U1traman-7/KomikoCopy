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
      question: t('moonvalley.faq.question1'),
      answer: t('moonvalley.faq.answer1'),
    },
    {
      id: 2,
      question: t('moonvalley.faq.question2'),
      answer: t('moonvalley.faq.answer2'),
    },
    {
      id: 3,
      question: t('moonvalley.faq.question3'),
      answer: t('moonvalley.faq.answer3'),
    },
    {
      id: 4,
      question: t('moonvalley.faq.question4'),
      answer: t('moonvalley.faq.answer4'),
    },
    {
      id: 5,
      question: t('moonvalley.faq.question5'),
      answer: t('moonvalley.faq.answer5'),
    },
    {
      id: 6,
      question: t('moonvalley.faq.question6'),
      answer: t('moonvalley.faq.answer6'),
    },
    {
      id: 7,
      question: t('moonvalley.faq.question7'),
      answer: t('moonvalley.faq.answer7'),
    },
  ]

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-4 md:mb-6 text-2xl font-bold text-center text-heading md:text-4xl lg:text-5xl'>
            {t('moonvalley.hero.title')}
          </h1>
          <p className='px-2 mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('moonvalley.hero.description')}
          </p>
        </div>

        <ImageOrTextToVideoConvert exampleVideoUrl='https://framerusercontent.com/assets/3ZFBeuc9oZzASGBNFY9LwRLRJvQ.mp4' />

        {/* Moonvalley Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('moonvalley.examples.title')}
          </h2>
          <p className='mx-auto text-sm md:text-lg mb-10 max-w-3xl text-center text-muted-foreground'>
            {t('moonvalley.examples.description')}
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3'>
            {/* Camera Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/1JtuLaMQc0uI9ZtAxtMX4BXa0w.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.cameraControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.cameraControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.cameraControl.description')}
                </p>
              </div>
            </div>

            {/* Motion Transfer Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/G6g5UNTx9dlKbMGdS8Iag4Xas.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.motionTransfer')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.motionTransfer.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.motionTransfer.description')}
                </p>
              </div>
            </div>

            {/* Trajectory Control Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/GJBpO7xq7zqJureQHIvfUo7cM.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.trajectoryControl')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.trajectoryControl.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.trajectoryControl.description')}
                </p>
              </div>
            </div>

            {/* Pose Transfer Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/3ZFBeuc9oZzASGBNFY9LwRLRJvQ.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.poseTransfer')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.poseTransfer.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.poseTransfer.description')}
                </p>
              </div>
            </div>

            {/* Natural Physics Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/kso1kLqdfQGAtuwv1DEbS4mlmc.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.naturalPhysics')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.naturalPhysics.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.naturalPhysics.description')}
                </p>
              </div>
            </div>

            {/* Dynamic Motion Example */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='overflow-hidden w-full rounded-t-xl aspect-video'>
                <video
                  src='https://framerusercontent.com/assets/vgdQZ2zcFZsxMSqZv8s2kwwKJ8.mp4'
                  controls
                  autoPlay
                  playsInline
                  loop
                  muted
                  className='object-cover w-full h-full'>
                  {t('moonvalley.examples.videoFallback.dynamicMotion')}
                </video>
              </div>
              <div className='p-4 bg-primary-50'>
                <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600'>
                  {t('moonvalley.examples.dynamicMotion.title')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t('moonvalley.examples.dynamicMotion.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className='pt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
          {t('moonvalley.whatIs.title')}
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          {t('moonvalley.whatIs.description')}
        </p>

        {/* Benefits Section */}
        <div className='py-16 mb-4 md:mb-8 bg-gradient-to-b from-background rounded-xl to-primary-100'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('moonvalley.benefits.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            {t('moonvalley.benefits.description')}
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: t('moonvalley.benefits.features.aiTechnology.title'),
                content: t('moonvalley.benefits.features.aiTechnology.content'),
                icon: '🚀',
              },
              {
                title: t('moonvalley.benefits.features.cinematicQuality.title'),
                content: t(
                  'moonvalley.benefits.features.cinematicQuality.content',
                ),
                icon: '🎬',
              },
              {
                title: t('moonvalley.benefits.features.intuitive.title'),
                content: t('moonvalley.benefits.features.intuitive.content'),
                icon: '🎯',
              },
              {
                title: t('moonvalley.benefits.features.accelerated.title'),
                content: t('moonvalley.benefits.features.accelerated.content'),
                icon: '⚡',
              },
              {
                title: t('moonvalley.benefits.features.superiorOutput.title'),
                content: t(
                  'moonvalley.benefits.features.superiorOutput.content',
                ),
                icon: '⭐',
              },
              {
                title: t('moonvalley.benefits.features.limitless.title'),
                content: t('moonvalley.benefits.features.limitless.content'),
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
        <div className='py-16 bg-background'>
          <h2 className='mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('moonvalley.howItWorks.title')}
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: t('moonvalley.howItWorks.steps.step1.title'),
                content: t('moonvalley.howItWorks.steps.step1.content'),
              },
              {
                step: 2,
                title: t('moonvalley.howItWorks.steps.step2.title'),
                content: t('moonvalley.howItWorks.steps.step2.content'),
              },
              {
                step: 3,
                title: t('moonvalley.howItWorks.steps.step3.title'),
                content: t('moonvalley.howItWorks.steps.step3.content'),
              },
              {
                step: 4,
                title: t('moonvalley.howItWorks.steps.step4.title'),
                content: t('moonvalley.howItWorks.steps.step4.content'),
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
        <div className='py-16 mt-4 md:mt-8'>
          <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('moonvalley.faqSection.title')}
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground md:mb-8 lg:mb-10'>
            {t('moonvalley.faqSection.description')}
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
