// [#target:tools]
import React from 'react';
import { Header } from '../Components/Header'
import ToolsExpressionChanger from '../Components/ToolsPage/ToolsExpressionChanger';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function AiExpressionChangerPage() {
  const { t } = useTranslation('ai-expression-changer');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.ai-expression-changer', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{t('seo.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('seo.title')} />
        <meta property='og:description' content={t('seo.description')} />
        <meta
          property='og:url'
          content='https://komiko.app/ai-expression-changer'
        />
        <meta
          property='og:image'
          content='https://d31cygw67xifd4.cloudfront.net/covers/tools/expression-changer.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('seo.title')} />
        <meta name='twitter:description' content={t('seo.description')} />
        <meta
          name='twitter:image'
          content='https://d31cygw67xifd4.cloudfront.net/covers/tools/expression-changer.webp'
        />
        <meta name='description' content={t('seo.description')} />
        <meta name='keywords' content={t('seo.keywords')} />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 lg:pl-[240px] w-full h-full'>
          <ToolsExpressionChanger />
        </div>
      </div>
      <SiteFooter className='ml-5 border-border md:pl-56 lg:pl-[240px]' />
    </main>
  );
}
