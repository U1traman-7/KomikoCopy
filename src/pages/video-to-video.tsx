// [#target:tools]
import React from 'react';
import { Header } from '../Components/Header';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import { TranslationData } from '../lib/server-translations';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import VideoToVideoConvert from '../Components/ToolsPage/VideoToVideoConvert';
import {
  Hero,
  HowToUse,
  WhatIs,
  Benefits,
  FAQ,
  CTA,
  type VideoExample,
  SingleVideoExamples,
} from '@/Components/SEO';
import { VideoOutputExamples } from '@/Components/SEO/ExampleGrid';

interface VideoToVideoProps {
  translations?: TranslationData;
}

export default function VideoToVideo({ translations }: VideoToVideoProps) {
  const { t } = useTranslation('video-to-video', { keyPrefix: 'seo' });
  const { t: tData } = useTranslation('video-to-video');

  // Get all data from translation
  const seoData = tData('seo', { returnObjects: true }) as any;
  const examples = tData('examples', { returnObjects: true }) as VideoExample[];

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.video_to_video', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>{t('meta.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('meta.title')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta property='og:url' content={'https://komiko.app/video-to-video'} />
        <meta
          property='og:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/video-to-video.webp'
          }
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('meta.title')} />
        <meta name='twitter:description' content={t('meta.description')} />
        <meta
          name='twitter:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/video-to-video.webp'
          }
        />
        <meta name='description' content={t('meta.description')} />
        <meta name='keywords' content={t('meta.keywords')} />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24  lg:pl-[240px] w-full h-full'>
          <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
            <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
              {/* Hero Section */}
              <Hero
                title={seoData.hero.title}
                description={seoData.meta.description}
              />

              {/* Main Convert Component */}
              <VideoToVideoConvert />

              <div className='flex flex-col gap-14 md:gap-24 mt-12 md:mt-20'>
                {/* Examples Section */}
                <VideoOutputExamples
                  inputType='video'
                  title={seoData.examples.title}
                  description={seoData.examples.description}
                  examples={examples}
                />

                {/* How to Use Section */}
                <HowToUse
                  title={seoData.howToUse.title}
                  steps={seoData.howToUse.steps}
                />

                {/* What is Video to Video Style Transfer Section */}
                <WhatIs
                  title={seoData.whatIs.title}
                  description={seoData.whatIs.description}
                />

                {/* Benefits Section */}
                <Benefits
                  title={seoData.benefits.title}
                  description={seoData.benefits.description}
                  features={seoData.benefits.features}
                />

                {/* More AI Tools */}
                <MoreAITools category='animation' />

                {/* FAQ Section */}
                <FAQ
                  title={seoData.faq.title}
                  description={seoData.faq.description}
                  faqs={[
                    { id: 1, question: seoData.faq.q1, answer: seoData.faq.a1 },
                    { id: 2, question: seoData.faq.q2, answer: seoData.faq.a2 },
                    { id: 3, question: seoData.faq.q3, answer: seoData.faq.a3 },
                    { id: 4, question: seoData.faq.q4, answer: seoData.faq.a4 },
                    { id: 5, question: seoData.faq.q5, answer: seoData.faq.a5 },
                    { id: 6, question: seoData.faq.q6, answer: seoData.faq.a6 },
                  ]}
                />

                {seoData.cta && (
                  <CTA
                    title={seoData.cta.title}
                    description={seoData.cta.description}
                    buttonText={seoData.cta.buttonText}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter className='ml-5 border-border  lg:pl-[240px]' />
    </main>
  );
}
