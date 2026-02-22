// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import {
  ToolsFramePackPage,
  ToolsImageToVideoPage,
  ToolsViduPage,
} from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  const { t } = useTranslation('image-animation-generator');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.vidu', {});
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
        <title>Vidu Q1 Video Generator – KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Vidu Q1 Video Generator – KomikoAI'
        />
        <meta
          property='og:description'
          content='Effortlessly create stunning anime, animation, comic, manhwa, and manga videos with Vidu Q1 Video Generator. Transform your ideas into high-quality animated content using advanced AI-powered tools.'
        />
        <meta property='og:url' content='https://komiko.app/video/vidu' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Vidu Q1 Video Generator – KomikoAI'
        />
        <meta
          name='twitter:description'
          content='Effortlessly create stunning anime, animation, comic, manhwa, and manga videos with Vidu Q1 Video Generator. Transform your ideas into high-quality animated content using advanced AI-powered tools.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content='Vidu Q1 Video Generator empowers creators to produce professional-quality anime, animation, comic, manhwa, and manga videos from text and images. Experience next-level AI video generation for storytellers, artists, and studios.'
        />
        <meta
          name='keywords'
          content='Vidu Q1 AI, AI video generator, anime video generator, AI animation, AI comic video, AI manhwa video, AI manga video, text to anime video, AI anime creation, AI animation tool, AI manga animation, AI manhwa animation, AI comic animation, Vidu AI Studio, AI video editing, AI video creation, AI anime workflow, AI storytelling, AI video production, Vidu AI anime, Vidu AI manga, Vidu AI manhwa, Vidu AI comic, AI-generated anime, AI-generated animation, AI-generated manga, AI-generated manhwa, AI-generated comic'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px] 2xl:pl-72'>
          <ToolsViduPage />
        </div>
      </div>
    </main>
  );
}
