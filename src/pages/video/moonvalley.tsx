// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsMoonvalleyPage } from '../../Components/ToolsPage';
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
          mixpanel.track('visit.page.tools.moonvalley', {});
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
        <title>Moonvalley AI Video Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Moonvalley AI Video Generator - KomikoAI'
        />
        <meta
          property='og:description'
          content="Moonvalley AI Video Generator represents the future of AI-powered video creation. Built by the imagination research company Moonvalley, this breakthrough AI video generator features Marey, the world's first commercially safe video generation model. Transform static images into stunning cinematic videos with the most advanced Moonvalley AI Video Generator technology, designed specifically for filmmakers, content creators, and digital artists."
        />
        <meta property='og:url' content='https://komiko.app/video/moonvalley' />
        <meta
          property='og:image'
          content='https://komiko.app/images/examples/image_to_animation/input.jpg'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Moonvalley AI Video Generator - KomikoAI'
        />
        <meta
          name='twitter:description'
          content="Moonvalley AI Video Generator represents the future of AI-powered video creation. Built by the imagination research company Moonvalley, this breakthrough AI video generator features Marey, the world's first commercially safe video generation model. Transform static images into stunning cinematic videos with the most advanced Moonvalley AI Video Generator technology, designed specifically for filmmakers, content creators, and digital artists."
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/examples/image_to_animation/input.jpg'
        />
        <meta
          name='description'
          content="Moonvalley AI Video Generator represents the future of AI-powered video creation. Built by the imagination research company Moonvalley, this breakthrough AI video generator features Marey, the world's first commercially safe video generation model. Transform static images into stunning cinematic videos with the most advanced Moonvalley AI Video Generator technology, designed specifically for filmmakers, content creators, and digital artists."
        />
        <meta
          name='keywords'
          content='Moonvalley AI, AI video generator, AI animation, AI comic video, AI manga video, text to anime video, AI anime creation, AI animation tool, AI manga animation, AI comic animation, Moonvalley AI Studio, AI video editing, AI video creation, AI storytelling, AI video production, cinematic AI video'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px]  2xl:pl-72'>
          <ToolsMoonvalleyPage />
        </div>
      </div>
    </main>
  );
}
