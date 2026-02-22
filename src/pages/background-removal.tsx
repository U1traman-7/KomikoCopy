// [#target:tools]
import React from 'react';
import { Header } from '../Components/Header'
import { ToolsBackgroundRemovalPage } from '../Components/ToolsPage/ToolsBackgroundRemovalPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../Components/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function Tools() {
  const { t } = useTranslation('background-removal');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try { mixpanel.track('visit.page.tools.background-removal', {}); console.log('tracking mixpanel'); }
        catch (error) { console.error('Mixpanel tracking failed:', error); }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{t('pageTitle')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('pageTitle')} />
        <meta property='og:description' content={t('metaDescription')} />
        <meta
          property='og:url'
          content={'https://komiko.app/background-removal'}
        />
        <meta
          property='og:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/background-removal.webp'
          }
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('pageTitle')} />
        <meta name='twitter:description' content={t('metaDescription')} />
        <meta
          name='twitter:image'
          content={
            'https://d31cygw67xifd4.cloudfront.net/covers/tools/background-removal.webp'
          }
        />
        <meta name='description' content={t('metaDescription')} />
        <meta name='keywords' content={t('metaKeywords')} />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 md:pl-56 lg:pl-[240px] w-full h-full'>
          <ToolsBackgroundRemovalPage />
        </div>
      </div>
      <SiteFooter className='ml-5 border-border md:pl-56 lg:pl-[240px]' />
    </main>
  );
}
