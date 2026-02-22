// [#target:tools]
import React from 'react';
import { Header } from '../Components/Header'
import { ToolsRelightingPage } from '../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../Components/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function Tools() {
    const { t } = useTranslation('image-relighting');

    // add mixpanel tracking
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeof window !== 'undefined') {
                try { mixpanel.track('visit.page.tools.relighting', {}); console.log('tracking mixpanel'); }
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
          <meta property='og:title' content={t('ogTitle')} />
          <meta property='og:description' content={t('ogDescription')} />
          <meta property='og:url' content={'https://komiko.app/relighting'} />
          <meta
            property='og:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/image-relighting.webp'
            }
          />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={t('twitterTitle')} />
          <meta name='twitter:description' content={t('twitterDescription')} />
          <meta
            name='twitter:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/image-relighting.webp'
            }
          />
          <meta name='description' content={t('metaDescription')} />
          <meta name='keywords' content={t('metaKeywords')} />
        </Head>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='p-2 pt-20 md:pt-24  lg:pl-[240px] w-full h-full'>
            <ToolsRelightingPage />
          </div>
        </div>
        <SiteFooter className='ml-5 border-border  lg:pl-[240px]' />
      </main>
    );
}
