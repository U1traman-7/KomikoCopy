// [#target:tools]
import React, { useEffect } from 'react';
import { Header } from '../Components/Header';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Sidebar } from '../Components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import ToolsImageOrTextPage from '../Components/ToolsPage/ToolsImageOrTextPage';

export default function Tools() {
  const { t } = useTranslation('image-animation-generator');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.image_to_video', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background  overflow-y-auto'>
      <Head>
        <title>{t('seo.meta.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('seo.meta.title')} />
        <meta property='og:description' content={t('seo.meta.description')} />
        <meta
          property='og:url'
          content='https://komiko.app/image-animation-generator'
        />
        <meta
          property='og:image'
          content='https://d31cygw67xifd4.cloudfront.net/covers/tools/image-to-video.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('seo.meta.title')} />
        <meta name='twitter:description' content={t('seo.meta.description')} />
        <meta
          name='twitter:image'
          content='https://d31cygw67xifd4.cloudfront.net/covers/tools/image-to-video.webp'
        />
        <meta name='description' content={t('seo.meta.description')} />
        <meta name='keywords' content={t('seo.meta.keywords')} />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24  lg:pl-[240px] w-full h-full '>
          <ToolsImageOrTextPage />
        </div>
      </div>
      <SiteFooter className='ml-5 border-border lg:pl-[240px]' />
    </main>
  );
}
