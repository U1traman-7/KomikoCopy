// [#target:tools]
import React from 'react';
import { Header } from '../../Components/Header';
import { ToolsSora2Page } from '../../Components/ToolsPage';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function Tools() {
  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>Sora 2 Video Generator - Komiko</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content='Sora 2 Video Generator - Komiko' />
        <meta
          property='og:description'
          content='The most advanced Sora 2 Video Generator for creating high-quality AI videos from text and images. Our Sora 2 Video Generator uses cutting-edge AI technology to transform your ideas into professional video content. Experience the power of Sora 2 Video Generator for free and create stunning videos in minutes with our AI-powered Sora 2 Video Generator tool.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/video/sora-2-video-generator'
        />
        <meta
          property='og:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Sora 2 Video Generator - Komiko' />
        <meta
          name='twitter:description'
          content='The most advanced Sora 2 Video Generator for creating high-quality AI videos from text and images. Our Sora 2 Video Generator uses cutting-edge AI technology to transform your ideas into professional video content. Experience the power of Sora 2 Video Generator for free and create stunning videos in minutes with our AI-powered Sora 2 Video Generator tool.'
        />
        <meta
          name='twitter:image'
          content='https://komiko.app/images/pages/vidu/cat.webp'
        />
        <meta
          name='description'
          content='The most advanced Sora 2 Video Generator for creating high-quality AI videos from text and images. Our Sora 2 Video Generator uses cutting-edge AI technology to transform your ideas into professional video content. Experience the power of Sora 2 Video Generator for free and create stunning videos in minutes with our AI-powered Sora 2 Video Generator tool.'
        />
        <meta
          name='keywords'
          content='Sora 2 Video Generator, OpenAI Sora 2, AI Video Generator, Sora 2 AI, Text to Video Generator, Image to Video AI, Sora 2 Video Creation, AI Video Maker, Sora 2 Online, Video Generation AI, Sora 2 Features, AI Video Production, Sora 2 Tool, OpenAI Video Generator, Sora 2 Platform, AI Video Synthesis, Sora 2 Technology'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='w-full mt-16 p-2 md:p-4 md:pl-44 lg:pl-60 2xl:pl-72 h-full mb-[5rem] mr-8'>
          <ToolsSora2Page />
        </div>
      </div>
    </main>
  );
}
