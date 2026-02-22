// DEPRECATED: This page has been redirected to /effects/barbie-box-image
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterBarbie } from '@/components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.filter.ai_doll_generator', {});
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
        <title>AI Doll Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content='AI Doll Generator - KomikoAI' />
        <meta
          property='og:description'
          content='Experience the magic of AI technology that transforms ordinary photos into stunning dolls. Our advanced AI doll generator analyzes facial features and expressions to create realistic dolls with customizable styles, accessories, and packaging, perfect for social media avatars, creative projects, or unique gifts.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/ai-doll-generator'
        />
        <meta
          property='og:image'
          content='/images/pages/ai-doll-generator/barbie-doll.jpeg'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='AI Doll Generator: Turn Yourself into a Custom Doll in Minutes'
        />
        <meta
          name='twitter:description'
          content='Transform your photos into custom dolls with AI! Our tool preserves every detail while applying realistic doll aesthetics. Ideal for social media profiles, creative projects, or bringing your doll fantasies to life. No artistic skills needed!'
        />
        <meta
          name='twitter:image'
          content='/images/pages/ai-doll-generator/barbie-doll.jpeg'
        />
        <meta
          name='description'
          content='Create your own personalized dolls with our AI doll generator. This innovative tool converts photos into realistic dolls with customizable styles, accessories, and packaging, ideal for social media, creative projects, or as unique gifts.'
        />
        <meta
          name='keywords'
          content='AI doll generator, create custom dolls, AI toy creator, doll maker, photo to doll, AI doll, custom dolls, doll creator, AI-generated dolls, doll trends, AI image generator, doll packaging, personalized dolls, digital dolls, AI doll art'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterBarbie />
        </div>
      </div>
    </main>
  );
}
