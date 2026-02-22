// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header'
import { ToolsRunwayAlephPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function Tools() {
  const { t } = useTranslation('runway-aleph');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try { mixpanel.track('visit.page.tools.runway-aleph', {}); console.log('tracking mixpanel'); }
        catch (error) { console.error('Mixpanel tracking failed:', error); }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{t('metaTitle')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('metaTitle')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta
          property='og:url'
          content='https://komiko.app/video-to-video/runway-aleph'
        />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('metaTitle')} />
        <meta name='twitter:description' content={t('meta.description')} />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='description' content={t('meta.description')} />
        <meta name='keywords' content={t('keywords')} />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24  lg:pl-[240px] w-full h-full'>
          <ToolsRunwayAlephPage />
        </div>
      </div>
    </main>
  );
}
