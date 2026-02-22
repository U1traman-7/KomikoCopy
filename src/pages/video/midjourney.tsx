// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsMidjourneyPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Sidebar from '@/components/Sidebar/Sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function Tools() {
  const { t } = useTranslation('image-animation-generator');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.midjourney-video', {});
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
        <title>
          Midjourney Video | Try Midjourney AI Video Generator for Free
        </title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Midjourney AI Video Generator - KomikoAI'
        />
        <meta
          property='og:description'
          content='Discover the power of the Midjourney AI Video Generator, transforming still images into captivating 5 to 20-second animated videos. Perfect for anime, manga, manhwa, and comic creators, this AI tool delivers smooth motion, dynamic camera effects, and high-resolution video outputs to bring your characters and scenes vividly to life.'
        />
        <meta property='og:url' content='https://komiko.app/video/midjourney' />
        <meta property='og:image' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Midjourney AI Video Generator - Next-Gen AI Video Creation Tool'
        />
        <meta
          name='twitter:description'
          content='Discover the power of the Midjourney AI Video Generator, transforming still images into captivating 5 to 20-second animated videos. Perfect for anime, manga, manhwa, and comic creators, this AI tool delivers smooth motion, dynamic camera effects, and high-resolution video outputs to bring your characters and scenes vividly to life.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content='Discover the power of the Midjourney AI Video Generator, transforming still images into captivating 5 to 20-second animated videos. Perfect for anime, manga, manhwa, and comic creators, this AI tool delivers smooth motion, dynamic camera effects, and high-resolution video outputs to bring your characters and scenes vividly to life.'
        />
        <meta
          name='keywords'
          content='Midjourney AI Video Generator, Midjourney Video, AI Video Creation, Video Generator AI, Midjourney AI Tool, AI Video Maker, Video Generator, AI Animation Generator, Professional Video Generator, Automated Video Creation, AI Video Production, Midjourney Features, Video Generation Tool, AI Video Synthesis, Midjourney Video Creator'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='w-full mt-16 p-2 md:p-4 md:pl-44 lg:pl-60 2xl:pl-72 h-full mb-[5rem] ml-5 mr-8'>
          <ToolsMidjourneyPage />
        </div>
      </div>
      <SiteFooter className='ml-5 border-border md:pl-44 lg:pl-60 2xl:pl-72' />
    </main>
  );
}
