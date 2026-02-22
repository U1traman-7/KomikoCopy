import fs from 'fs';
import path from 'path';
import React, { useEffect, useCallback } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { trackToolPageView } from '../../utilities/analytics';
import { Header } from '../../Components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/Components/SEO';
import { VariantPageProps } from '@/Components/SEO/types';
import { Breadcrumb } from '../../Components/common/Breadcrumb';
import ImageOrTextToVideoConvert from '../../Components/ToolsPage/ImageOrTextToVideoConvert';
import { useSectionRenderer } from '../../hooks/useSectionRenderer';
import { SingleVideoExamples } from '@/Components/SEO/types';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import { loadVariantData } from '../../lib/variant-loader';
import { containsNsfwKeywords } from '../../utilities/nsfw';

export default function ImageAnimationVariantPage({
  variantContent,
  variantKey,
}: VariantPageProps) {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);

  // Track variant page view
  useEffect(() => {
    if (router.isReady) {
      try {
        trackToolPageView(
          `image-animation-generator-${variantKey}`,
          profile?.id,
        );
      } catch (error) {
        console.error('Error tracking variant page view:', error);
      }
    }
  }, [router.isReady, variantKey, profile?.id]);

  if (!variantContent) {
    return <div>Variant not found</div>;
  }

  const { seo } = variantContent;

  // Get examples from variant content
  const examples = variantContent.examples || [];

  const pageStructure = (variantContent as any).pageStructure || [
    'whatIs',
    'howToUse',
    'examples',
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
    category: 'animation',
  });

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{seo.meta.title}</title>
        <meta name='description' content={seo.meta.description} />
        <meta name='keywords' content={seo.meta.keywords} />
        <meta property='og:title' content={seo.meta.title} />
        <meta property='og:description' content={seo.meta.description} />
        <meta
          property='og:url'
          content={`https://komiko.app/image-animation-generator/${variantKey}`}
        />
        <meta
          property='og:image'
          content={'/images/thumbnail/image-animation-generator.webp'}
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
              {/* Breadcrumb */}
              <Breadcrumb className='w-full mb-4' />

              {/* Hero Section */}
              <Hero title={seo.hero.title} description={seo.meta.description} />

              {/* Main Convert Component */}
              <ImageOrTextToVideoConvert
                key={variantKey}
                exampleVideoUrl={
                  (examples[0] as SingleVideoExamples)?.videoUrl || ''
                }
                model={
                  ImageToVideoModel[
                    variantContent.model as keyof typeof ImageToVideoModel
                  ]
                }
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

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths: { params: { variant: string }; locale?: string }[] = [];

  try {
    // 读取 variants 目录
    const variantsDir = path.join(
      process.cwd(),
      'src/data/variants/image-animation-generator',
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
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const variantKey = params?.variant as string;

  if (!variantKey) {
    return { notFound: true };
  }

  try {
    const data = loadVariantData(
      'image-animation-generator',
      variantKey,
      locale,
    );
    if (!data || !data.seo) {
      const fallback = loadVariantData(
        'image-animation-generator',
        variantKey,
        'en',
      );
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
