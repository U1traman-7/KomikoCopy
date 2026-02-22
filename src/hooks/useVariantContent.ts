import { useMemo } from 'react';

/**
 * 通用的Variant内容获取Hook
 * 简化重复的三元运算符判断，提供类型安全的内容访问
 */
export const useVariantContent = <T = any>(
  isVariant: boolean, 
  data: any, 
  t: (key: string, options?: any) => any
) => {
  return useMemo(() => {
    const getValue = (variantPath: string, fallbackKey: string, options?: any) => {
      const variantValue = variantPath.split('.').reduce((obj, key) => obj?.[key], data);
      return isVariant && variantValue ? variantValue : t(fallbackKey, options);
    };

    const getArray = (variantPath: string, fallbackKey: string) => {
      const variantValue = variantPath
        .split('.')
        .reduce((obj, key) => obj?.[key], data);

      if (isVariant && variantValue && Array.isArray(variantValue)) {
        return variantValue;
      }

      // Fallback to translation
      const fallbackValue = t(fallbackKey, { returnObjects: true });

      // If the fallback is an object (like steps with step1, step2, etc.), convert to array
      if (
        fallbackValue &&
        typeof fallbackValue === 'object' &&
        !Array.isArray(fallbackValue)
      ) {
        return Object.values(fallbackValue) as T[];
      }

      // If it's already an array, return it
      if (Array.isArray(fallbackValue)) {
        return fallbackValue as T[];
      }

      // Default to empty array to prevent map errors
      return [];
    };

    return {
      // SEO相关内容
      seo: {
        title: getValue('seo.title', 'head.title'),
        ogDescription: getValue('seo.ogDescription', 'head.ogDescription'),
        metaDescription: getValue(
          'seo.metaDescription',
          'head.metaDescription',
        ),
        metaKeywords: getValue('seo.metaKeywords', 'head.metaKeywords'),
      },

      // 页面结构（用于动态渲染顺序）
      pageStructure: data?.pageStructure || [
        'whatIs',
        'examples',
        'howToUse',
        'whyUse',
        'moreAITools',
        'applications',
        'tips',
        'faq',
        'cta',
      ],

      // 页面头部内容
      header: {
        title: getValue('content.header.title', 'header.title'),
        subtitle: getValue('content.header.subtitle', 'header.subtitle'),
      },

      // 各个章节内容
      sections: {
        whatIs: {
          title: getValue('content.sections.whatIs.title', 'headings.whatIs'),
          description: getValue(
            'content.sections.whatIs.description',
            'intro.description1',
          ),
        },
        howToUse: {
          title: getValue(
            'content.sections.howToUse.title',
            'headings.howToUse',
          ),
          subtitle: getValue(
            'content.sections.howToUse.subtitle',
            'howToUse.subtitle',
          ),
          steps: getArray('content.sections.howToUse.steps', 'howToUse.steps'),
        },
        whyUse: {
          title: getValue('content.sections.whyUse.title', 'headings.whyUse'),
          subtitle: getValue(
            'content.sections.whyUse.subtitle',
            'whyUse.subtitle',
          ),
          features: getArray(
            'content.sections.whyUse.features',
            'whyUse.features',
          ),
        },
        styles: {
          title: getValue(
            'content.sections.styles.title',
            'headings.createStyles',
          ),
          items: getArray('content.sections.styles.items', 'styles'),
        },
        applications: {
          title: getValue(
            'content.sections.applications.title',
            'headings.applications',
          ),
          items: getArray(
            'content.sections.applications.items',
            'applications',
          ),
        },
      },

      // Tips部分
      tips: {
        title: isVariant
          ? getValue('content.sections.tips.title', 'headings.tips')
          : getValue('content.tips.title', 'headings.tips'),
        items: isVariant
          ? getArray('content.sections.tips.items', 'tips.items')
          : getArray('content.tips.items', 'tips.items'),
      },

      // CTA部分
      cta: {
        title: getValue('content.cta.title', 'headings.startCreating'),
        description: getValue('content.cta.description', 'closing.description'),
        buttonText: getValue('content.cta.buttonText', 'closing.buttonText'),
      },

      // FAQ部分
      faq: {
        title: getValue('content.faq.title', 'faq.title'),
        items:
          isVariant && data?.content?.faq && Array.isArray(data.content.faq)
            ? data.content.faq
            : (t('faq.items', { returnObjects: true }) as Array<{
                question: string;
                answer: string;
              }>),
      },

      // UI相关内容
      ui: {
        resultsTitle: getValue('content.ui.resultsTitle', 'results.title'),
      },

      // xpost
      xposts: getArray('content.xposts', 'xposts.items'),

      // 通用获取方法，供特殊情况使用
      getValue,
      getArray,
    };
  }, [isVariant, data, t]);
};

/**
 * 为特定工具页面定制的content获取函数
 * 可以根据不同工具的数据结构进行定制
 */
export const useAIAnimeGeneratorContent = (
  isVariant: boolean, 
  data: any, 
  t: (key: string, options?: any) => any
) => {
  return useVariantContent(isVariant, data, t);
};

export default useVariantContent; 