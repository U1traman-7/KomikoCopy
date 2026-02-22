// [#target:tools]
/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-06 19:42:13
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-06 19:45:50
 * @FilePath: /ComicEditor/src/pages/tools/sketch_simplification.tsx
 * @Description:
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../state';
import { Header } from '../Components/Header';
import { ToolsSketchSimplifierPage } from '../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import { Breadcrumb } from '../Components/common/Breadcrumb';
import { Hero, HowToUse, Benefits, FAQ, CTA } from '@/Components/SEO';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageCompare from '@/Components/SEO/ExampleGrid/ImageCompare';
import { useTranslation } from 'react-i18next';

export default function Tools() {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);
  const { t } = useTranslation('sketch-simplification');

  // add mixpanel tracking
  useEffect(() => {
    if (router.isReady) {
      const timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          try {
            mixpanel.track('visit.page.tools.sketch_simplification', {});
            console.log('tracking mixpanel');
          } catch (error) {
            console.error('Mixpanel tracking failed:', error);
          }
        }
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [router.isReady, profile?.id]);

  const seo = {
    meta: t('seo.meta', { returnObjects: true }) as any,
    hero: t('seo.hero', { returnObjects: true }) as any,
    howToUse: t('seo.howToUse', { returnObjects: true }) as any,
    examples: t('seo.examples', { returnObjects: true }) as any,
    benefits: t('seo.benefits', { returnObjects: true }) as any,
    faq: t('seo.faq', { returnObjects: true }) as any,
    cta: t('seo.cta', { returnObjects: true }) as any,
  };

  const examples = t('examples', { returnObjects: true }) as any[];

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{seo.meta.title}</title>
        <meta name='description' content={seo.meta.description} />
        <meta name='keywords' content={seo.meta.keywords} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={seo.meta.title} />
        <meta property='og:description' content={seo.meta.description} />
        <meta
          property='og:url'
          content={'https://komiko.app/sketch_simplification'}
        />
        <meta
          property='og:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/sketch-simplification.webp'
          }
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={seo.meta.title} />
        <meta name='twitter:description' content={seo.meta.description} />
        <meta
          name='twitter:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/sketch-simplification.webp'
          }
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
          <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
            <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
              {/* Breadcrumb */}
              <Breadcrumb className='w-full mb-4' />

              {/* Hero Section */}
              <Hero title={seo.hero.title} description={seo.meta.description} />

              {/* Main Tool Component */}
              <ToolsSketchSimplifierPage />

              {/* SEO Sections */}
              <div className='px-2 flex gap-8 md:gap-16 flex-col mt-8 md:mt-12'>
                {/* How To Use */}
                <HowToUse
                  title={seo.howToUse.title}
                  steps={seo.howToUse.steps}
                />

                {/* Examples */}
                <ImageCompare
                  title={seo.examples.title}
                  description={seo.examples.description}
                  examples={examples}
                />

                {/* Benefits */}
                <Benefits
                  title={seo.benefits.title}
                  description={seo.benefits.description}
                  features={seo.benefits.features}
                />

                <div className='my-12 md:my-16'>
                  <MoreAITools category='illustration' />
                </div>
                {/* FAQ */}
                <FAQ
                  title={seo.faq.title}
                  description={seo.faq.description}
                  faqs={seo.faq.questions}
                />

                {/* CTA */}
                <CTA
                  title={seo.cta.title}
                  description={seo.cta.description}
                  buttonText={seo.cta.buttonText}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter className='ml-5 border-border lg:pl-[240px]' />
    </main>
  );
}
