import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { TemplateWrapper } from '../../Components/ToolsPage/TemplateWrapper';
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { trackToolPageView } from '../../utilities/analytics'
import {
  loadVariantIndex,
  loadToolData,
  loadVariantData,
} from '../../lib/variant-loader';
import { useRouter } from 'next/router';
import CreateStory from '../ai-comic-generator';
import {
  loadServerTranslation,
  TranslationData,
} from '../../lib/server-translations';

interface VariantPageProps {
  variantContent: any;
  variantKey: string;
  translations: TranslationData;
}

export default function VariantPage({
  variantContent,
  variantKey,
  translations,
}: VariantPageProps) {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);

  // Track variant page view
  useEffect(() => {
    if (router.isReady) {
      try {
        trackToolPageView(`ai-comic-generator-${variantKey}`, profile?.id);
      } catch (error) {
        console.error('Error tracking variant page view:', error);
      }
    }
  }, [router.isReady, variantKey, profile?.id]);

  if (!variantContent) {
    return <div>Variant not found</div>;
  }

  return (
    <>
      <Head>
        <title>{variantContent.seo.title}</title>
        <meta name='description' content={variantContent.seo.description} />
        <meta name='keywords' content={variantContent.seo.keywords} />
        <meta property='og:title' content={variantContent.seo.title} />
        <meta
          property='og:description'
          content={variantContent.seo.description}
        />
        <meta
          property='og:url'
          content={`https://komiko.app/ai-comic-generator/${variantKey}`}
        />
        <meta
          property='og:image'
          content={
            variantContent.content.examples?.[0]?.image ||
            '/images/examples/ai-comic-generator/cover.webp'
          }
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={variantContent.seo.title} />
        <meta
          name='twitter:description'
          content={variantContent.seo.description}
        />
        <meta
          name='twitter:image'
          content={
            variantContent.content.examples?.[0]?.image ||
            '/images/examples/ai-comic-generator/cover.webp'
          }
        />
      </Head>

      <TemplateWrapper
        variantData={variantContent}
        isVariant={true}
        toolName='ai-comic-generator'
        variantName={variantKey}>
        <CreateStory translations={translations} />
      </TemplateWrapper>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths: { params: { variant: string }; locale?: string }[] = [];

  try {
    // 使用新的variant-loader加载数据
    const toolData = loadToolData('ai-comic-generator');

    if (toolData && toolData.variants) {
      Object.keys(toolData.variants).forEach(variantKey => {
        // 为每种语言生成路径
        if (locales) {
          locales.forEach(locale => {
            paths.push({
              params: { variant: variantKey },
              locale,
            });
          });
        } else {
          // 如果没有locales，使用默认路径
          paths.push({ params: { variant: variantKey } });
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
    const [variantContent, translations] = await Promise.all([
      loadVariantData('ai-comic-generator', variantKey, locale),
      loadServerTranslation(locale),
    ]);

    if (!variantContent) {
      return { notFound: true };
    }

    return {
      props: {
        variantContent,
        variantKey,
        translations,
      },
      // 重新验证时间：24小时
      revalidate: 86400,
    };
  } catch (error) {
    console.error('Error loading variant data or translations:', error);
    return { notFound: true };
  }
};
