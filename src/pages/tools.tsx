import { NextUIProvider } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

import { Header } from '../Components/Header';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';
import { Sidebar } from '@/components/Sidebar';

interface ToolConfig {
  title: string;
  url: string;
}

export default function Tools() {
  const { t } = useTranslation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.home', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  const toolsConfig: ToolConfig[] = [
    // !!!!编译时会替换为实际的工具配置，不要删除

    {
      url: '/ai-anime-generator',
      title: t('ai-anime-generator:title'),
    },
    {
      url: '/ai-comic-generator',
      title: t('ai-comic-generator:meta.title'),
    },
    {
      url: '/ai-talking-head',
      title: t('ai-talking-head:meta.title'),
    },
    {
      url: '/background-removal',
      title: t('background-removal:pageTitle'),
    },
    {
      url: '/create',
      title: t('create:pageTitle'),
    },
    {
      url: '/filter/ai-action-figure-generator',
      title: 'AI Action Figure Generator - KomikoAI',
    },
    {
      url: '/filter/ai-character-sheet-generator',
      title: 'AI Character Sheet Generator - KomikoAI',
    },
    {
      url: '/filter/ai-doll-generator',
      title: 'AI Doll Generator - KomikoAI',
    },
    {
      url: '/filter/anime-ai-filter',
      title: 'Anime AI Filter - KomikoAI',
    },
    {
      url: '/filter/studio-ghibli-ai-generator',
      title: 'Studio Ghibli AI Generator - KomikoAI',
    },
    {
      url: '/filter/studio-ghibli-filter',
      title: 'Studio Ghibli Filter - KomikoAI',
    },
    {
      url: '/image-animation-generator',
      title: t('image-animation-generator:pageTitle'),
    },
    {
      url: '/image-relighting',
      title: t('image-relighting:pageTitle'),
    },
    {
      url: '/image-upscaling',
      title: t('image-upscaling:meta.title'),
    },
    {
      url: '/inbetween',
      title: t('inbetween:meta.title'),
    },
    {
      url: '/layer_splitter',
      title: t('layer-splitter:meta.title'),
    },
    {
      url: '/line_art_colorization',
      title: t('line-art-colorization:meta.title'),
    },
    {
      url: '/photo-to-anime',
      title: t('photo-to-anime:meta.title'),
    },
    {
      url: '/sketch_simplification',
      title: 'AI Sketch Simplification - KomikoAI',
    },
    {
      url: '/video/AniSora',
      title: 'Try AniSora: The Ultimate Anime Video Generation Model',
    },
    {
      url: '/video/framepack',
      title: 'FramePack AI Video Generator – KomikoAI',
    },
    {
      url: '/video/magi-1',
      title: 'Magi-1 AI Video Generator – KomikoAI',
    },
    {
      url: '/video/veo-3',
      title: 'Veo 3 Video Generator',
    },
    {
      url: '/video/vidu-q1',
      title: 'Vidu Q1 Video Generator – KomikoAI',
    },
    {
      url: '/video-to-video',
      title: t('video-to-video:meta.title'),
    },
    {
      url: '/video_interpolation',
      title: t('video-interpolation:meta.title'),
    },
    {
      url: '/video_upscaling',
      title: t('video-upscaling:meta.title'),
    },
  ];

  return (
    <NextUIProvider>
      <Head>
        <title>{t('tools:meta.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('tools:meta.title')} />
        <meta property='og:description' content={t('tools:meta.description')} />
        <meta property='og:image' content={'/images/social.webp'} />
        <meta property='og:url' content={'https://komiko.app/tools'} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('tools:meta.title')} />
        <meta
          name='twitter:description'
          content={t('tools:meta.description')}
        />
        <meta name='twitter:image' content={'/images/social.webp'} />
        <meta name='keywords' content={t('tools:meta.keywords')} />
      </Head>
      <Script
        async
        src='https://www.googletagmanager.com/gtag/js?id=AW-16476793251'></Script>

      <Script
        dangerouslySetInnerHTML={{
          __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'AW-16476793251');
                        `,
        }}></Script>
      <Analytics />
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='text-center md:pl-56 lg:pl-[240px] ml-5 w-full'>
            <h1 className='mt-24 text-4xl font-bold text-center'>
              {t('tools:title')}
            </h1>
            <p className='text-center text-muted-foreground'>
              {t('tools:description')}
            </p>
            <div className='flex flex-wrap justify-center gap-4 max-w-[1200px] mx-auto mt-10'>
              {toolsConfig.map((tool, index) => (
                <Link
                  key={index}
                  href={tool.url}
                  className='px-6 py-3 rounded-lg shadow-sm transition-all duration-200 transform bg-default-100 hover:bg-default-200 hover:scale-105'>
                  {tool.title.replace(/\s*[-|]\s*KomikoAI$/, '')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </NextUIProvider>
  );
}
