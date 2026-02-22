// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsMultiShotPage } from '../../Components/ToolsPage';
import Head from 'next/head';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>Multi-Shot Video Generator – KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Multi-Shot Video Generator – KomikoAI'
        />
        <meta
          property='og:description'
          content='Generate dynamic AI-powered multi-shot videos effortlessly. Create engaging, multi-angle, and multi-scene videos optimized for diverse content needs using advanced AI technology.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/video/multi-shot-video-generator'
        />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/frame-pack-ai-video-generator/woman.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Multi-Shot Video Generator – KomikoAI'
        />
        <meta
          name='twitter:description'
          content='Generate dynamic AI-powered multi-shot videos effortlessly. Create engaging, multi-angle, and multi-scene videos optimized for diverse content needs using advanced AI technology.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/frame-pack-ai-video-generator/woman.webp'
        />
        <meta
          name='description'
          content='Generate dynamic AI-powered multi-shot videos effortlessly. Create engaging, multi-angle, and multi-scene videos optimized for diverse content needs using advanced AI technology.'
        />
        <meta
          name='keywords'
          content='Multi-shot video generator, AI video creation, multi-angle video AI, dynamic video generation, multi-scene video tool, cinematic AI video, AI video editing, video synthesis AI, advanced video AI generator, AI video production'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 lg:pl-[240px] 2xl:pl-72'>
          <ToolsMultiShotPage model={ImageToVideoModel.SEEDANCE} />
        </div>
      </div>
    </main>
  );
}
