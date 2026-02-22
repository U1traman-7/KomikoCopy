import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  WhatIs,
  HowToUse,
  Benefits,
  FAQ,
  SingleVideoExamples,
  CTA,
} from '@/Components/SEO';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { type SingleVideoExamples as SingleVideoExamplesType } from '@/Components/SEO/types';
import { VideoOutputExamples } from '@/Components/SEO/ExampleGrid';
import ImageCompare from '@/Components/SEO/ExampleGrid/ImageCompare';

// 辅助函数 - 动态生成FAQ数组
const generateFaqArray = (
  faqData: any,
): Array<{ id: number; question: string; answer: string }> => {
  const faqs: Array<{ id: number; question: string; answer: string }> = [];
  for (let i = 1; i <= Object.keys(faqData).length - 2; i++) {
    const question = faqData[`q${i}`];
    const answer = faqData[`a${i}`];
    if (question && answer) {
      faqs.push({ id: i, question, answer });
    }
  }
  return faqs;
};

export interface SectionRendererOptions {
  content: any;
  toolName?: string;
  category?: string; // for MoreAITools
}

const exampleTypeMap = {
  'video-to-video': VideoOutputExamples,
  playground: ImageCompare,
  'image-animation-generator': SingleVideoExamples,
  'ai-video-effects': VideoOutputExamples,
};

export const useSectionRenderer = ({
  content,
  toolName,
  category = 'animation',
}: SectionRendererOptions) => {
  const { seo, examples, pageStructure } = content;
  const { t } = useTranslation('common');

  const SECTION_CONFIGS = {
    whatIs: {
      component: WhatIs,
      condition: () => Boolean(seo.whatIs),
      props: () => ({
        title: seo.whatIs.title,
        description: seo.whatIs.description || seo.whatIs.subtitle,
        media: seo.whatIs.media,
      }),
    },

    howToUse: {
      component: HowToUse,
      condition: () => Boolean(seo.howToUse),
      props: () => ({
        title: seo.howToUse.title,
        subtitle: seo.howToUse.subtitle || '',
        steps: seo.howToUse.steps,
      }),
    },

    examples: {
      component:
        exampleTypeMap[toolName as keyof typeof exampleTypeMap] ||
        SingleVideoExamples,
      condition: () => examples.length > 0,
      props: () => {
        let finalProps: any = {
          title: seo.examples?.title || 'Examples',
          description:
            seo.examples?.description || seo.examples?.subtitle || '',
        };

        if (toolName === 'video-to-video' || toolName === 'ai-video-effects') {
          finalProps.inputType = 'video';
          finalProps.outputType = 'video';
          finalProps.examples = examples as SingleVideoExamplesType[];
        } else if (toolName === 'playground') {
          // Transform examples data for ImageCompare component
          finalProps.examples = examples.map((example: any) => ({
            input: example.input,
            output: example.output || example.image, // Support both 'output' and 'image' fields
            inputLabel: example.inputLabel,
            outputLabel: example.outputLabel,
            // Support both 'prompt' and 'style' fields
            // Use i18n for labels instead of hardcoding
            prompt:
              example.prompt ||
              (example.style
                ? `${t('examples.styleLabel')}: ${example.style}`
                : ''),
          }));
        } else {
          finalProps.examples = examples as SingleVideoExamplesType[];
        }

        return finalProps;
      },
    },

    whyUse: {
      component: Benefits,
      condition: () => Boolean(seo.benefits),
      props: () => ({
        title: seo.benefits.title,
        description: seo.benefits.description || seo.benefits.subtitle,
        features: seo.benefits.features,
      }),
    },

    benefits: {
      component: Benefits,
      condition: () => Boolean(seo.benefits),
      props: () => ({
        title: seo.benefits.title,
        description: seo.benefits.description || seo.benefits.subtitle,
        features: seo.benefits.features,
      }),
    },

    faq: {
      component: FAQ,
      condition: () => Boolean(seo.faq),
      props: () => ({
        title: seo.faq.title,
        description: seo.faq.description || seo.faq.subtitle,
        faqs: generateFaqArray(seo.faq),
      }),
    },

    moreAITools: {
      component: MoreAITools,
      condition: () => true,
      props: () => ({ category }),
    },

    cta: {
      component: CTA,
      condition: () => Boolean(seo.cta),
      props: () => ({
        title: seo.cta.title,
        description: seo.cta.description,
        buttonText: seo.cta.buttonText,
      }),
    },
  } as const;

  // Section渲染函数
  const renderSection = useCallback(
    (sectionType: string) => {
      const config =
        SECTION_CONFIGS[sectionType as keyof typeof SECTION_CONFIGS];

      if (!config || !config.condition()) {
        return null;
      }

      const Component = config.component as any;
      const props = config.props();

      return <Component key={sectionType} {...props} />;
    },
    [seo, examples, category],
  );

  // 渲染所有sections
  const renderSections = useCallback(() => {
    return pageStructure.map(renderSection).filter(Boolean);
  }, [pageStructure, renderSection]);

  return {
    renderSections,
    renderSection,
    SECTION_CONFIGS,
  };
};

export default useSectionRenderer;
