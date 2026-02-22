// DEPRECATED: This page has been redirected to /effects/character-sheet-image
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterCharacterSheet } from '@/components/ToolsPage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function Tools() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.filter.ai_action_figure_generator', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
      // ai-action-figure-generator
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>AI Character Sheet Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='AI Character Sheet Generator - KomikoAI'
        />
        <meta
          property='og:description'
          content='Discover the power of AI in generating comprehensive character sheets. Our AI character sheet generator transforms single images into dynamic pose variations, ideal for game development, animation, and comic book art.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/ai-character-sheet-generator'
        />
        <meta
          property='og:image'
          content='/images/pages/ai-character-sheet-generator/character_sheet.jpeg'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='AI Character Sheet Generator - KomikoAI'
        />
        <meta
          name='twitter:description'
          content='Streamline character creation with AI. Generate multiple poses from a single image, perfect for game developers, animators, and comic artists. Enhance your storytelling with AI-driven character sheets.'
        />
        <meta
          name='twitter:image'
          content='/images/pages/ai-character-sheet-generator/character_sheet.jpeg'
        />
        <meta
          name='description'
          content='Experience the future of character design with our AI character sheet generator. This innovative tool creates diverse character poses from a single image, accelerating workflows in game development, animation, comic book art, and more.'
        />
        <meta
          name='keywords'
          content='AI character sheet generator, character design, AI character creation, game development tools, animation software, comic book art, AI-generated character sheets, character pose generator, AI character sheet maker'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterCharacterSheet />
        </div>
      </div>
    </main>
  );
}
