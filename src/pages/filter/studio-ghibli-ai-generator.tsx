// DEPRECATED: This page has been redirected to /effects/ghibli-anime-image
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterStudioGhibliGeneratorPage } from '@/components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.filter.studio_ghibli_ai_generatoro', {});
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
        <title>Studio Ghibli AI Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Studio Ghibli AI Generator: Become a Ghibli Character'
        />
        <meta
          property='og:description'
          content="Our advanced AI technology transforms your ordinary photos into breathtaking Studio Ghibli-style artwork. Experience the magic of Hayao Miyazaki's world as you become a character straight out of Spirited Away or My Neighbor Totoro. Perfect for creating unique avatars, gifts, or simply exploring your Ghibli alter-ego."
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/photo-to-ghibli'
        />
        <meta
          property='og:image'
          content='/images/examples/photo-to-ghibli/cover.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content="AI Ghibli Generator: See Yourself in Miyazaki's World"
        />
        <meta
          name='twitter:description'
          content="Discover which Studio Ghibli character you'd be with our AI-powered transformation tool. Our technology meticulously analyzes Ghibli's signature animation style - from the delicate watercolor backgrounds to the expressive character designs - to create authentic Ghibli artwork from your photos."
        />
        <meta
          name='twitter:image'
          content='/images/examples/photo-to-ghibli/cover.webp'
        />
        <meta
          name='description'
          content='Free AI Studio Ghibli character generator that magically transforms your photos into Ghibli-style artwork. Our AI studies thousands of frames from classic Ghibli films to recreate their unique aesthetic - the soft lighting, detailed backgrounds, and expressive characters that make Studio Ghibli films so beloved worldwide. Create your Ghibli avatar, transform friends and family into anime characters, or reimagine your favorite places in the Ghibli style.'
        />
        <meta
          name='keywords'
          content='Studio Ghibli AI generator, AI Photo to Cartoon, Ghibli Anime Character creator, Pixar inspired cartoon maker, AI cartoon generator, Anime Character transformation, Renaissance painting style, Hand drawn caricature AI, Voilà Ai Artist alternative, Photo to Ghibli art, AI animation style converter, Miyazaki-style portrait, Ghibli avatar maker, AI anime filter, Studio Ghibli art generator'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterStudioGhibliGeneratorPage />
        </div>
      </div>
    </main>
  );
}
