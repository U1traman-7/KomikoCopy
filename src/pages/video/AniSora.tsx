// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header'
import { ToolsFramePackPage, ToolsImageToVideoPage, ToolsAniSoraPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function Tools() {
  const { t } = useTranslation('image-animation-generator');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try { mixpanel.track('visit.page.tools.vidu', {}); console.log('tracking mixpanel'); }
        catch (error) { console.error('Mixpanel tracking failed:', error); }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>Try AniSora: The Ultimate Anime Video Generation Model</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Try AniSora: The Ultimate Anime Video Generation Model'
        />
        <meta
          property='og:description'
          content='Index-AniSora is the most powerful open-source animated video generation model presented by Bilibili. It enables one-click creation of video shots across diverse anime styles including series episodes, Chinese original animations, manga adaptations, VTuber content, anime PVs, mad-style parodies, and more'
        />
        <meta property='og:url' content='https://komiko.app/video/vidu' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Try AniSora: The Ultimate Anime Video Generation Model'
        />
        <meta
          name='twitter:description'
          content='Index-AniSora is the most powerful open-source animated video generation model presented by Bilibili. It enables one-click creation of video shots across diverse anime styles including series episodes, Chinese original animations, manga adaptations, VTuber content, anime PVs, mad-style parodies, and more'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content='Index-AniSora is the most powerful open-source animated video generation model presented by Bilibili. It enables one-click creation of video shots across diverse anime styles including series episodes, Chinese original animations, manga adaptations, VTuber content, anime PVs, mad-style parodies, and more'
        />
        <meta
          name='keywords'
          content='AniSora, AniSora AI, AniSora Anime, AniSora Video, AniSora Animation, AniSora Manga, AniSora Manhwa, AniSora Comic, AniSora Video Generation, AniSora Video Generator, Anime Video Generator, Anime Video Generation Model'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='w-full mt-16 p-2 md:p-4 md:pl-44 lg:pl-60 2xl:pl-72 h-full mb-[5rem] mr-8'>
          <ToolsAniSoraPage />
        </div>
      </div>
    </main>
  );
}
