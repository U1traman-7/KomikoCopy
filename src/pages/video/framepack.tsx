// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import {
  ToolsFramePackPage,
  ToolsImageToVideoPage,
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
          mixpanel.track('visit.page.tools.framepack', {});
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
        <title>FramePack AI Video Generator – KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='FramePack AI Video Generator – KomikoAI'
        />
        <meta
          property='og:description'
          content='Create high-quality AI-generated videos locally with FramePack, the cutting-edge next-frame prediction neural network that enables long video generation using minimal GPU memory.'
        />
        <meta property='og:url' content='https://komiko.app/video/framepack' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/frame-pack-ai-video-generator/woman.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='FramePack AI Video Generator – KomikoAI'
        />
        <meta
          name='twitter:description'
          content='Create high-quality AI-generated videos locally with FramePack, the cutting-edge next-frame prediction neural network that enables long video generation using minimal GPU memory.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/frame-pack-ai-video-generator/woman.webp'
        />
        <meta
          name='description'
          content='FramePack is an advanced AI video generator that uses next-frame prediction neural networks to produce long, high-fidelity videos locally on consumer GPUs with as little as 6GB VRAM.'
        />
        <meta
          name='keywords'
          content='FramePack, AI video generator, local AI video generation, next-frame prediction, video diffusion, video generation neural network, 6GB VRAM video generation, long video AI, progressive video generation, video AI model, Hunyuan video model, efficient AI video creation'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px] 2xl:pl-72'>
          <ToolsFramePackPage model={ImageToVideoModel.RAY_FLASH_V2} />
        </div>
      </div>
    </main>
  );
}
