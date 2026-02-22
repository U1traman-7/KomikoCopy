// DEPRECATED: This page has been redirected to /effects/ghibli-anime-image
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterPhotoToStudioGhibliPage } from '@/components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.filter.studio_ghibli_filter', {});
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
        <title>Studio Ghibli Filter - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Authentic Studio Ghibli Filter: Create Your Own Miyazaki-Inspired Art'
        />
        <meta
          property='og:description'
          content="Bring the enchanting world of Studio Ghibli to your photos with our advanced AI technology. Experience the magic of Hayao Miyazaki's animation style as we transform your ordinary pictures into breathtaking Ghibli artworks complete with dreamy landscapes, whimsical characters, and that signature hand-painted look that defines classics like Spirited Away and My Neighbor Totoro."
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/photo-to-ghibli'
        />
        <meta
          property='og:image'
          content='/images/examples/studio-ghibli-filter/cover.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Become Part of a Studio Ghibli Film - AI Art Generator'
        />
        <meta
          name='twitter:description'
          content="Step into the magical realms of Studio Ghibli with our AI-powered transformation tool. Whether you want to see yourself as a character from Howl's Moving Castle, explore Totoro's forest, or fly with Kiki on her delivery route, our technology captures every detail of Ghibli's iconic animation style - from the soft watercolor backgrounds to the expressive character designs."
        />
        <meta
          name='twitter:image'
          content='/images/examples/studio-ghibli-filter/cover.webp'
        />
        <meta
          name='description'
          content="Free AI-powered Studio Ghibli filter that transforms your photos into authentic Ghibli-style artwork. Experience the wonder of Miyazaki's worlds with our technology that perfectly replicates the studio's signature aesthetic - delicate line work, ethereal lighting, and nostalgic charm. Create personalized Ghibli avatars, fantasy portraits, or reimagine your memories through the lens of Japan's most beloved animation studio."
        />
        <meta
          name='keywords'
          content="Studio Ghibli art filter, Miyazaki animation style, Ghibli movie artwork creator, Spirited Away photo transformation, Totoro style portrait generator, Howl's Moving Castle AI art, Kiki's Delivery Service filter, Ghibli character creator, Studio Ghibli avatar maker, Ghibli film aesthetic converter, Hayao Miyazaki art style, Ghibli watercolor filter, anime fantasy portrait generator, Ghibli merchandise inspiration, Studio Ghibli fan art creator"
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterPhotoToStudioGhibliPage />
        </div>
      </div>
    </main>
  );
}
