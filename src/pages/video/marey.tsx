// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsMareyPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  const { t } = useTranslation('moonvalley-marey');

  // add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.marey', {});
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
        <title>Marey AI Video Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Marey AI Video Generator - KomikoAI'
        />
        <meta
          property='og:description'
          content="Marey is Moonvalley's foundational AI model, the world's first commercially safe video generator built to meet the standards of world-class cinematography. Designed specifically for filmmakers and content creators, Marey transforms static images into professional cinematic videos using only licensed, high-resolution footage - no scraped content, no legal gray zones."
        />
        <meta property='og:url' content='https://komiko.app/video/marey' />
        <meta
          property='og:image'
          content='https://komiko.app/images/examples/image_to_animation/input.jpg'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Marey AI Video Generator - KomikoAI'
        />
        <meta
          name='twitter:description'
          content="Marey is Moonvalley's foundational AI model, the world's first commercially safe video generator built to meet the standards of world-class cinematography. Designed specifically for filmmakers and content creators, Marey transforms static images into professional cinematic videos using only licensed, high-resolution footage - no scraped content, no legal gray zones."
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/examples/image_to_animation/input.jpg'
        />
        <meta
          name='description'
          content="Marey is Moonvalley's foundational AI model, the world's first commercially safe video generator built to meet the standards of world-class cinematography. Designed specifically for filmmakers and content creators, Marey transforms static images into professional cinematic videos using only licensed, high-resolution footage - no scraped content, no legal gray zones."
        />
        <meta
          name='keywords'
          content='Marey AI, AI video generator, 3D-aware video generation, cinematic video, AI animation, commercial-safe AI, anime video generator, manga animation, comic video, AI video creation, professional video production, motion-controlled animation, studio-grade quality, AI filmmaking, video AI tool'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px] 2xl:pl-72'>
          <ToolsMareyPage />
        </div>
      </div>
    </main>
  );
}
