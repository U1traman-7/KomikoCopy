import fs from 'fs';
import path from 'path';
import React, { useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import mixpanel from 'mixpanel-browser';
import { profileAtom } from '../../state';
import { trackToolPageView } from '../../utilities/analytics';
import { Header } from '../../Components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import TemplateVideoGenerator from '@/Components/ToolsPage/TemplateVideoGenerator';
import { Hero } from '@/Components/SEO';
import { VariantPageProps, type VideoExample } from '@/Components/SEO/types';
import { Breadcrumb } from '../../Components/common/Breadcrumb';
import { loadVariantData } from '../../lib/variant-loader';
import { useSectionRenderer } from '../../hooks/useSectionRenderer';
import { containsNsfwKeywords } from '../../utilities/nsfw';

export default function AiVideoEffectsVariantPage({
  variantContent,
  variantKey,
}: VariantPageProps) {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);

  // Track variant page view
  useEffect(() => {
    if (router.isReady) {
      try {
        trackToolPageView(`ai-video-effects-${variantKey}`, profile?.id);
      } catch (error) {
        console.error('Error tracking variant page view:', error);
      }
    }
  }, [router.isReady, variantKey, profile?.id]);

  // Add mixpanel tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.tools.ai-video-effects.variant', {
            variant: variantKey,
          });
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [variantKey]);

  if (!variantContent) {
    return <div>Variant not found</div>;
  }

  const { seo } = variantContent;

  // Get examples from variant content
  const examples = variantContent.examples || [];

  const pageStructure = (variantContent as any).pageStructure || [
    'whatIs',
    'examples',
    'howToUse',
    'benefits',
    'moreAITools',
    'faq',
    'cta',
  ];

  // Defensive check for seo.meta
  if (!seo?.meta) {
    return <div>Error: SEO metadata not found</div>;
  }

  // 使用通用的section渲染hook
  const { renderSections } = useSectionRenderer({
    content: {
      seo,
      examples,
      pageStructure,
    },
    toolName: 'ai-video-effects',
    category: 'animation',
  });

  // Get default style for this variant from config
  const defaultStyle = variantContent.config?.defaultStyle;

  // Get example video URL for the generator component
  const exampleVideoUrl =
    (examples as VideoExample[])[0]?.output ||
    '/images/examples/image-animation-generator/output2.mp4';

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>{seo.meta.title}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={seo.meta.title} />
        <meta property='og:description' content={seo.meta.description} />
        <meta
          property='og:url'
          content={`https://komiko.app/ai-video-effects/${variantKey}`}
        />
        <meta
          property='og:image'
          content='/images/thumbnail/ai-video-effects.webp'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={seo.meta.title} />
        <meta name='twitter:description' content={seo.meta.description} />
        <meta
          name='twitter:image'
          content='/images/thumbnail/ai-video-effects.webp'
        />
        <meta name='description' content={seo.meta.description} />
        <meta name='keywords' content={seo.meta.keywords} />
      </Head>

      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
          <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
            <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
              {/* Breadcrumb */}
              <Breadcrumb className='w-full mb-4' />

              {/* Hero Section */}
              <Hero title={seo.hero.title} description={seo.meta.description} />

              {/* Main Convert Component - Template Mode */}
              <TemplateVideoGenerator
                key={variantKey}
                mode='template'
                initialStyle={defaultStyle}
                exampleVideoUrl={exampleVideoUrl}
              />

              {/* Render all SEO sections dynamically */}
              <div className='flex flex-col gap-14 md:gap-24 mt-12 md:mt-20'>
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

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths: { params: { variant: string }; locale?: string }[] = [];

  try {
    // 读取 variants 目录
    const variantsDir = path.join(
      process.cwd(),
      'src/data/variants/ai-video-effects',
    );

    if (fs.existsSync(variantsDir)) {
      const files = fs.readdirSync(variantsDir);

      files.forEach(file => {
        if (file.endsWith('.json')) {
          const variantKey = file.replace('.json', '');
          // 跳过包含NSFW关键词的variants
          if (containsNsfwKeywords(variantKey)) {
            return;
          }
          if (locales && Array.isArray(locales)) {
            locales.forEach(locale =>
              paths.push({ params: { variant: variantKey }, locale }),
            );
          } else {
            paths.push({ params: { variant: variantKey } });
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading variant paths:', error);
  }

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const variantKey = params?.variant as string;

  if (!variantKey) {
    return { notFound: true };
  }

  try {
    const data = loadVariantData('ai-video-effects', variantKey, locale);
    if (!data || !data.seo) {
      const fallback = loadVariantData('ai-video-effects', variantKey, 'en');
      if (!fallback || !fallback.seo) return { notFound: true };
      return {
        props: {
          variantContent: fallback,
          variantKey,
        },
        revalidate: 86400,
      };
    }

    return {
      props: {
        variantContent: data,
        variantKey,
      },
      revalidate: 86400,
    };
  } catch (error) {
    console.error('Error loading variant data:', error);
    return { notFound: true };
  }
};
