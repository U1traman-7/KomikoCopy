// DEPRECATED: This page has been redirected to /ai-anime-generator
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterPhotoToAnimePage } from '@/components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.filter.photo_to_anime', {});
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
        <title>Anime AI Filter - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Instant AI Anime Converter: From Selfies to Professional Anime Portraits'
        />
        <meta
          property='og:description'
          content='Experience revolutionary AI technology that transforms ordinary photos into breathtaking anime artwork. Our advanced neural networks analyze facial features, lighting, and expressions to create authentic anime-style conversions with multiple genre options including Shonen action, Shojo romance, and Fantasy adventure styles.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/photo-to-anime'
        />
        <meta
          property='og:image'
          content='/images/examples/photo-to-anime/cover.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Free AI Anime Filter: Become Your Favorite Anime Character in Seconds'
        />
        <meta
          name='twitter:description'
          content='The most powerful photo to anime converter online! Our AI preserves every detail while applying authentic anime aesthetics. Perfect for cosplay references, social media avatars, or bringing your anime fantasies to life. No artistic skills needed!'
        />
        <meta
          name='twitter:image'
          content='/images/examples/photo-to-anime/cover.webp'
        />
        <meta
          name='description'
          content='Transform your photos into professional anime art with our free AI anime filter. Experience cutting-edge technology that converts portraits into stunning anime characters with customizable styles. Our tool handles everything from Shonen action heroes to delicate Shojo characters and magical Fantasy creations - all with perfect anime proportions and vibrant colors.'
        />
        <meta
          name='keywords'
          content='AI photo to anime, free anime converter, anime filter online, AI anime avatar, photo to cartoon, selfie to anime, AI anime generator, anime style converter, digital anime art, anime profile picture maker, shojo anime filter, shonen anime converter, fantasy anime art, manga camera, kawaii camera, anime character creator, stable diffusion anime, AI anime transformation, anime portrait generator, photo to manga'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterPhotoToAnimePage />
        </div>
      </div>
    </main>
  );
}
