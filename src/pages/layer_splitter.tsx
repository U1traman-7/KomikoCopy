// [#target:tools]
/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-06 19:42:13
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-06 19:45:50
 * @FilePath: /ComicEditor/src/pages/tools/line_art_colorize.tsx
 * @Description:
 */

import React from 'react';
import { Header } from '../Components/Header'
import { ToolsLayerSplitterPage } from '../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function Tools() {
    const { t } = useTranslation('layer-splitter');

    // add mixpanel tracking
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeof window !== 'undefined') {
                try { mixpanel.track('visit.page.tools.line_art_colorize', {}); console.log('tracking mixpanel'); }
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
          <meta property='og:title' content={t('meta.og.title')} />
          <meta property='og:description' content={t('meta.og.description')} />
          <meta property='og:url' content={t('meta.og.url')} />
          <meta
            property='og:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/layer-splitter.webp'
            }
          />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={t('meta.twitter.title')} />
          <meta
            name='twitter:description'
            content={t('meta.twitter.description')}
          />
          <meta
            name='twitter:image'
            content={
              'https://d31cygw67xifd4.cloudfront.net/covers/tools/layer-splitter.webp'
            }
          />
          <meta name='description' content={t('meta.description')} />
        </Head>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='p-2 pt-24 md:pl-56 lg:pl-[240px] w-full h-full'>
            <ToolsLayerSplitterPage />
          </div>
        </div>
        <SiteFooter className='ml-5 border-border md:pl-56 lg:pl-[240px]' />
      </main>
    );
}
