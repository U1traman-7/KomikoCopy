// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsAniSoraPage, ToolsVeo3Page } from '../../Components/ToolsPage';
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
        try {
          mixpanel.track('visit.page.tools.veo3', {});
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
        <title>Veo 3 Video Generator</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content='Veo 3 Video Generator - KomikoAI' />
        <meta
          property='og:description'
          content="Experience the power of Veo 3 Video Generator, Google's revolutionary AI video creation tool. Create stunning 4K videos with automatic audio generation, realistic animations, and advanced style controls. Try the latest 2025 version of Veo 3 Video Generator today."
        />
        <meta property='og:url' content='https://komiko.app/video/veo-3' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Veo 3 Video Generator - Next-Gen AI Video Creation Tool'
        />
        <meta
          name='twitter:description'
          content='Transform your ideas into high-quality videos with Veo 3 Video Generator. Features include 4K resolution, AI-powered audio synthesis, seamless animations, and precise style control. The most advanced video generation platform of 2025.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content="Unleash the power of Veo 3 Video Generator, the cutting-edge AI video creation platform by Google. Create professional-quality videos with 4K resolution, automatic audio generation, realistic animations, and advanced style controls. Experience the future of video generation with Veo 3's latest 2025 features."
        />
        <meta
          name='keywords'
          content='Veo 3 Video Generator, AI Video Creation, Video Generator AI, Veo 3 AI Tool, Google Veo 3, AI Video Maker, 4K Video Generator, AI Audio Generation, Video Creation Platform, Veo 3 2025, AI Animation Generator, Professional Video Generator, Automated Video Creation, AI Video Production, Veo 3 Features, Video Generation Tool'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='w-full mt-16 p-2 md:p-4 md:pl-44 lg:pl-60 2xl:pl-72 h-full mb-[5rem] mr-8'>
          <ToolsVeo3Page />
        </div>
      </div>
    </main>
  );
}
