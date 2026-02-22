// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsMagiPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import { Sidebar } from '@/components/Sidebar';

export default function MagiTools() {
  const { t } = useTranslation('image-animation-generator');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.magi', {});
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
        <title>Magi-1 AI Video Generator – KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Magi-1 AI Video Generator – KomikoAI'
        />
        <meta
          property='og:description'
          content='Create high-quality AI-generated videos from text with Magi-1, a revolutionary text-to-video model with exceptional understanding of physical interactions and cinematic prompts.'
        />
        <meta property='og:url' content='https://komiko.app/video/magi-1' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/magi/dancer.webm'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Magi-1 AI Video Generator – KomikoAI'
        />
        <meta
          name='twitter:description'
          content='Create high-quality AI-generated videos from text with Magi-1, a revolutionary text-to-video model with exceptional understanding of physical interactions and cinematic prompts.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/magi/dancer.webm'
        />
        <meta
          name='description'
          content='Magi-1 is a cutting-edge text-to-video generator that excels at physical understanding and cinematic composition, creating stunning videos directly from text descriptions.'
        />
        <meta
          name='keywords'
          content='Magi-1, text to video, AI video generator, cinematic AI, video generation, AI storytelling, physical interaction AI, camera movements AI, AI video creation, cinematic composition, realistic AI videos, anime generation, AI animation, AI comic video, manga video, text to anime, AI animation tool, video editing, video production, AI-generated content'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px] 2xl:pl-72'>
          <ToolsMagiPage />
        </div>
      </div>
    </main>
  );
}
