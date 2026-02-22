// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsVeo31Page } from '../../Components/ToolsPage';
import Head from 'next/head';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function Tools() {
  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>Veo 3.1</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content='Veo 3.1' />
        <meta
          property='og:description'
          content="Experience Google DeepMind's revolutionary Veo 3.1 , the most advanced AI video generation tool available. Veo 3.1 creates stunning 1080p videos from text prompts or images with synchronized audio, character consistency, and multi-scene storytelling. Our Veo 3.1  features enhanced character consistency, vertical 9:16 format support, custom narration capabilities, and cinema-grade color grading."
        />
        <meta property='og:url' content='https://komiko.app/video/veo-3-1' />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Veo 3.1' />
        <meta
          name='twitter:description'
          content="Experience Google DeepMind's revolutionary Veo 3.1 , the most advanced AI video generation tool available. Veo 3.1 creates stunning 1080p videos from text prompts or images with synchronized audio, character consistency, and multi-scene storytelling. Our Veo 3.1  features enhanced character consistency, vertical 9:16 format support, custom narration capabilities, and cinema-grade color grading."
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content="Experience Google DeepMind's revolutionary Veo 3.1 , the most advanced AI video generation tool available. Veo 3.1 creates stunning 1080p videos from text prompts or images with synchronized audio, character consistency, and multi-scene storytelling. Our Veo 3.1  features enhanced character consistency, vertical 9:16 format support, custom narration capabilities, and cinema-grade color grading. Transform your creative ideas into professional-quality videos with Veo 3.1's breakthrough video synthesis technology on KomikoAI today!"
        />
        <meta
          name='keywords'
          content='Veo 3.1 , Veo 3.1 Video Generation, AI Video Creator Veo 3.1, Google Veo 3.1, Veo 3.1 Character Consistency, Multi-Scene Video Generator, Veo 3.1 Synchronized Audio, AI Video Maker 2025, Professional Video Generator, Veo 3.1 Cinema Grade, Vertical Video Generator, 9:16 Video Format, Custom Narration AI, Video Synthesis Technology, Veo 3.1 Features, Advanced AI Video Tool'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='w-full mt-16 p-2 md:p-4 md:pl-44 lg:pl-60 2xl:pl-72 h-full mb-[5rem] mr-8'>
          <ToolsVeo31Page />
        </div>
      </div>
    </main>
  );
}
