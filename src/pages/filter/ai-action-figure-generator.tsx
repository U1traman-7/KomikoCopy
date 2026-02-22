// DEPRECATED: This page has been redirected to /effects/action-figure-image
// Redirect configured in next.config.mjs (301 permanent redirect)
// [#target:tools]
import React from 'react';
import { Header } from '@/components/Header';
import { FilterActionFigure } from '@/components/ToolsPage';
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
        <title>AI Action Figure Generator - KomikoAI</title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='AI Action Figure Generator: Turn Yourself into a Custom Action Figure'
        />
        <meta
          property='og:description'
          content='Experience the power of AI technology that transforms ordinary photos into stunning action figures. Our advanced AI action figure generator analyzes facial features and expressions to create realistic action figures with customizable accessories and packaging.'
        />
        <meta
          property='og:url'
          content='https://komiko.app/filter/ai-action-figure-generator'
        />
        <meta
          property='og:image'
          content='/images/pages/ai-action-figure-generator/girl_action_box.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Free AI Action Figure Generator: Become Your Own Action Figure in Minutes'
        />
        <meta
          name='twitter:description'
          content='Transform your photos into custom action figures with AI! Our tool preserves every detail while applying realistic action figure aesthetics. Perfect for social media avatars, team-building exercises, or bringing your action figure fantasies to life. No artistic skills needed!'
        />
        <meta
          name='twitter:image'
          content='/images/pages/ai-action-figure-generator/girl_action_box.webp'
        />
        <meta
          name='description'
          content='Create your own personalized action figures with our AI action figure generator. This innovative tool converts photos into realistic action figures with customizable accessories and packaging, ideal for social media, team-building, or as unique gifts.'
        />
        <meta
          name='keywords'
          content='AI action figure generator, create action figure, AI toy creator, action figure maker, photo to action figure, AI action figure, custom action figures, action figure creator, AI-generated action figures, action figure trends, AI image generator, action figure packaging, personalized action figures'
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-24 w-full h-full md:p-20 md:pl-56 lg:pl-[240px] ml-5 2xl:pl-72'>
          <FilterActionFigure />
        </div>
      </div>
    </main>
  );
}
