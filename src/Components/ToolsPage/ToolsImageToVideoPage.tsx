import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import VideoOuputExamples from '@/Components/SEO/ExampleGrid/VideoOuputExamples';
import type { VideoExample } from '@/Components/SEO/types';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { Hero } from '../SEO';

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  const localizedFaqs = [
    {
      id: 1,
      question: t('seo.faq.q1'),
      answer: t('seo.faq.a1'),
    },
    {
      id: 2,
      question: t('seo.faq.q2'),
      answer: t('seo.faq.a2'),
    },
    {
      id: 3,
      question: t('seo.faq.q3'),
      answer: t('seo.faq.a3'),
    },
    {
      id: 4,
      question: t('seo.faq.q4'),
      answer: t('seo.faq.a4'),
    },
    {
      id: 5,
      question: t('seo.faq.q5'),
      answer: t('seo.faq.a5'),
    },
    {
      id: 6,
      question: t('seo.faq.q6'),
      answer: t('seo.faq.a6'),
    },
    {
      id: 7,
      question: t('seo.faq.q7'),
      answer: t('seo.faq.a7'),
    },
    {
      id: 8,
      question: t('seo.faq.q8'),
      answer: t('seo.faq.a8'),
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <Hero
          title={t('seo.hero.title')}
          description={t('seo.hero.description')}
        />

        <ImageOrTextToVideoConvert />
        <h2 className='pt-10 md:pt-16 mt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
          {t('seo.whatIs.title')}
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
          {t('seo.whatIs.description')}
        </p>

        {/* How It Works Section */}
        <div className='py-10 md:py-16 bg-card dark:bg-transparent'>
          <h2 className='mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('seo.howToUse.title')}
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {t('seo.howToUse.steps', { returnObjects: true }).map(
              (step: any, index: number) => (
                <div
                  key={step.title}
                  className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
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

        {/* Examples Section */}
        <VideoOuputExamples
          title={t('seo.examples.title')}
          description={t('seo.examples.description')}
          inputType='image'
          autoPlay={true}
          examples={[
            {
              id: 1,
              layout: 'comparison',
              type: 'video',
              input:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/running.webp',
              output:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/running.webm',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example7.details'),
            },
            {
              id: 2,
              layout: 'comparison',
              type: 'video',
              input:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/man.webp',
              output:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/man.webm',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example6.details'),
            },
            {
              id: 3,
              layout: 'comparison',
              type: 'video',
              input:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/kiss.webp',
              output:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/kiss.webm',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example5.details'),
            },
            {
              id: 4,
              layout: 'comparison',
              type: 'video',
              input:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/monster.webp',
              output:
                'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/monster.webm',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example8.details'),
            },
            {
              id: 5,
              layout: 'comparison',
              type: 'video',
              input: '/images/examples/image-animation-generator/input2.webp',
              output: '/images/examples/image-animation-generator/output2.mp4',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example1.details'),
            },
            {
              id: 6,
              layout: 'comparison',
              type: 'video',
              input: '/images/examples/image-animation-generator/input3.webp',
              output: '/images/examples/image-animation-generator/output3.mp4',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example2.details'),
            },
            {
              id: 7,
              layout: 'comparison',
              type: 'video',
              input: '/images/examples/image-animation-generator/input4.jpg',
              output: '/images/examples/image-animation-generator/output4.mp4',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example3.details'),
            },
            {
              id: 8,
              layout: 'comparison',
              type: 'video',
              input: '/images/examples/image-animation-generator/input5.webp',
              output: '/images/examples/image-animation-generator/output5.webm',
              inputLabel: t('seo.examples.inputLabel'),
              outputLabel: t('seo.examples.outputLabel'),
              description: t('seo.examples.example4.details'),
            },
          ]}
        />

        {/* Benefits Section */}
        <div className='py-10 md:py-16 bg-gradient-to-b from-card rounded-xl to-primary-100 mb-14 md:mb-16'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('seo.benefits.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('seo.benefits.description')}
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {t('seo.benefits.features', { returnObjects: true }).map(
              (feature: any, index: number) => (
                <div
                  key={feature.title}
                  className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                  <div className='flex items-center mb-4'>
                    <span className='mr-3 text-xl md:text-2xl'>
                      {feature.icon}
                    </span>
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

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>
        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('seo.faq.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('seo.faq.description')}
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
