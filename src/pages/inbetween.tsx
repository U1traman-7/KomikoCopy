// [#target:tools]
/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-03 18:25:04
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-04 20:44:01
 * @FilePath: /ComicEditor/src/pages/tools/inbetween.tsx
 * @Description:
 */

import React from 'react';
import { ToolsHeader } from '../Components/ToolsPage'
import { ToolsInbetweenPage } from '../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Header } from '../Components/Header'
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function Tools() {
    const { t } = useTranslation('inbetween');

    // add mixpanel tracking
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeof window !== 'undefined') {
                try { mixpanel.track('visit.page.tools.inbetween', {}); console.log('tracking mixpanel'); }
                catch (error) { console.error('Mixpanel tracking failed:', error); }
            }
        }, 800);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
        <Head>
          <title>{t('meta.title')}</title>
          <meta property='og:type' content='website' />
          <meta property='og:title' content={t('meta.title')} />
          <meta property='og:description' content={t('meta.description')} />
          <meta property='og:url' content={'https://komiko.app/inbetween'} />
          <meta
            property='og:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/inbetween.webp'
            }
          />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={t('meta.title')} />
          <meta name='twitter:description' content={t('meta.description')} />
          <meta
            name='twitter:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/inbetween.webp'
            }
          />
          <meta name='description' content={t('meta.description')} />
          <meta name='keywords' content={t('meta.keywords')} />
        </Head>
        <Header autoOpenLogin={false} />

        <div className='flex'>
          <Sidebar />
          <div className='p-2 pt-24 md:pl-56 lg:pl-[240px] w-full h-full'>
            <ToolsInbetweenPage />
          </div>
        </div>
        <SiteFooter className='ml-5 border-border md:pl-56 lg:pl-[240px]' />
      </main>
    );
}
