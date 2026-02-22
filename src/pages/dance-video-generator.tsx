import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../state';
import { trackToolPageView } from '../utilities/analytics';
import { Header } from '@/Components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/Components/SEO';
import TemplateVideoGenerator from '@/Components/ToolsPage/TemplateVideoGenerator';
import { useTranslation } from 'react-i18next';
import { useSectionRenderer } from '@/hooks/useSectionRenderer';

export default function DancePage() {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);

  useEffect(() => {
    if (router.isReady) {
      try {
        trackToolPageView('dance-video-generator', profile?.id);
      } catch (error) {
        console.error('Error tracking dance page view:', error);
      }
    }
  }, [router.isReady, profile?.id]);

  const { t } = useTranslation('dance-video-generator');

  const seo = t('seo', { returnObjects: true }) as any;
  const examples = t('seo.examples', { returnObjects: true }) as any[];

  const pageStructure = [
    'whatIs',
    'howToUse',
    'examples',
    'benefits',
    'moreAITools',
    'faq',
    'cta',
  ];

  // 使用通用的section渲染hook
  const { renderSections } = useSectionRenderer({
    content: {
      seo,
      examples,
      pageStructure,
    },
    category: 'animation',
  });

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>{seo.meta.title}</title>
        <meta name='description' content={seo.meta.description} />
        <meta name='keywords' content={seo.meta.keywords} />
        <meta property='og:title' content={seo.meta.title} />
        <meta property='og:description' content={seo.meta.description} />
        <meta
          property='og:url'
          content='https://komiko.app/dance-video-generator'
        />
        <meta
          property='og:image'
          content='/images/thumbnail/image-animation-generator.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={seo.meta.title} />
        <meta name='twitter:description' content={seo.meta.description} />
        <meta
          name='twitter:image'
          content='/images/thumbnail/image-animation-generator.webp'
        />
      </Head>

      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
          <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
            <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
              {/* Hero Section */}
              <Hero title={seo.hero.title} description={seo.hero.description} />

              {/* Main Convert Component - Dance Mode */}
              <TemplateVideoGenerator
                mode='dance'
                exampleVideoUrl='/images/examples/image-animation-generator/output2.mp4'
              />

              {/* Dynamic sections based on pageStructure */}
              <div className='px-2 flex gap-14 md:gap-24 flex-col'>
                {renderSections()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter className='ml-5 border-border lg:pl-[240px]' />
    </main>
  );
}

