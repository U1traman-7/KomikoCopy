import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { trackToolPageView } from '../../utilities/analytics';
import { Header } from '@/Components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SiteFooter } from '@/components/site-footer';
import {
  Hero,
  MoreAITools,
  WhatIs,
  HowToUse,
  CommunityExamples,
} from '@/Components/SEO';
import UnifiedTemplateGenerator, {
  UnifiedTemplateGeneratorRef,
} from '@/Components/ToolsPage/UnifiedTemplateGenerator';
import { Breadcrumb, BreadcrumbItem } from '@/Components/Breadcrumb';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '@nextui-org/react';
import { HiSparkles } from 'react-icons/hi2';
import MixedTemplatePicker, {
  MixedTemplatePickerRef,
  StyleTemplate as MixedStyleTemplate,
  TemplateCategory as MixedTemplateCategory,
} from '@/Components/MixedTemplatePicker';
import { templateDataManager } from '../../utils/templateCache';
import {
  resolveTemplateName,
  resolveTemplateDescription,
} from '../../utils/resolveTemplateName';

// 使用从 MixedTemplatePicker 导入的类型
type StyleTemplate = MixedStyleTemplate;
type TemplateCategory = MixedTemplateCategory;

// 合成模板：自定义舞蹈（用户上传自己的舞蹈视频）
const CUSTOM_DANCE_TEMPLATE: StyleTemplate = {
  id: 'custom-dance',
  urlSlug: 'custom-dance',
  displayName: 'custom-dance',
  type: 'dance',
  name_key: 'dances.customDance',
  is_pro_model: false,
  support_v2v: false,
  support_playground: false,
  prompt: { prompt: '' },
  ratio: '9:16',
  input_media: [{ media_type: 'image', min_count: 1, max_count: 1 }],
};

interface EffectPageProps {
  templateName: string;
}

export default function EffectPage({ templateName }: EffectPageProps) {
  const router = useRouter();
  const profile = useAtomValue(profileAtom);
  const { t } = useTranslation([
    'effects',
    'style-templates',
    'common',
    'ai-video-effects',
  ]);

  // 数据状态
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<StyleTemplate | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // 模板选择器 ref
  const templatePickerRef = useRef<MixedTemplatePickerRef>(null);

  // UnifiedTemplateGenerator ref 用于保存/恢复输入图片
  const generatorRef = useRef<UnifiedTemplateGeneratorRef>(null);

  // 保存用户输入的图片，在模板类型切换时不丢失
  const [preservedInputImage, setPreservedInputImage] = useState<string>('');

  // 记录页面访问
  useEffect(() => {
    if (router.isReady && templateName) {
      try {
        trackToolPageView(`effects-${templateName}`, profile?.id);
      } catch (error) {
        console.error('Error tracking effect page view:', error);
      }
    }
  }, [router.isReady, templateName, profile?.id]);

  // 加载模板数据（从缓存获取）
  useEffect(() => {
    // custom-dance 是合成模板，不需要从数据库查找
    if (templateName === 'custom-dance') {
      setCurrentTemplate(CUSTOM_DANCE_TEMPLATE);
      setIsLoading(false);
      return;
    }

    const loadTemplates = async () => {
      setIsLoading(true);

      try {
        if (!templateDataManager.isDataLoaded()) {
          await templateDataManager.loadAllData();
        }

        const data = templateDataManager.getAllTemplates() || [];
        setCategories(data as TemplateCategory[]);

        // 从 URL 参数中提取干净的模板 ID
        // 例如: crispey-spray-dance-video -> crispey-spray-dance
        const cleanId = templateName.replace(
          /-(video|image|expression|dance)$/,
          '',
        );

        // 查找当前模板
        // 匹配优先级:
        // 1. urlSlug 完全匹配 (如 'anime-mv-video' === 'anime-mv-video')
        // 2. displayName 完全匹配 (如 'anime-mv' === 'anime-mv')
        // 3. displayName 匹配 cleanId (如 'crispey-spray-dance' === 'crispey-spray-dance')
        // 4. 对于 dance 类型模板，尝试匹配 cleanId（支持 URL 后缀为 -video 但实际是 dance 模板的情况）
        let foundTemplate: StyleTemplate | null = null;

        for (const category of data) {
          const template = category.templates.find(
            (t: any) =>
              t.urlSlug === templateName ||
              t.displayName === templateName ||
              t.displayName === cleanId,
          );
          if (template) {
            foundTemplate = template;
            break;
          }
        }

        // 如果没有找到，尝试更宽松的匹配
        // 这处理了 URL 后缀与模板类型不一致的情况
        // 例如: URL 是 crispey-spray-dance-video，但模板的 urlSlug 是 crispey-spray-dance-dance
        if (!foundTemplate) {
          for (const category of data) {
            const template = category.templates.find((t: any) => {
              // 提取模板 urlSlug 的 base name
              const templateBaseName = t.urlSlug?.replace(
                /-(video|image|expression|dance)$/,
                '',
              );
              return templateBaseName === cleanId;
            });
            if (template) {
              foundTemplate = template;
              break;
            }
          }
        }

        if (foundTemplate) {
          setCurrentTemplate(foundTemplate);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (templateName) {
      loadTemplates();
    }
  }, [templateName]);

  // 切换模板（软性跳转，不刷新页面）
  const handleSwitchTemplate = useCallback(
    (template: StyleTemplate) => {
      // 在切换模板前保存当前的输入图片
      const currentInputImage = generatorRef.current?.getInputImage();
      if (currentInputImage) {
        setPreservedInputImage(currentInputImage);
      }

      setCurrentTemplate(template);

      // 使用 urlSlug 进行路由，shallow 模式不触发页面重新加载
      router.replace(`/effects/${template.urlSlug}`, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  // 打开模板选择器
  const openTemplatePicker = useCallback(() => {
    templatePickerRef.current?.open();
  }, []);

  // 从 URL 参数中提取干净的模板 ID（去掉 -video, -image, -expression, -dance 后缀）
  const cleanTemplateId = useMemo(
    () => templateName.replace(/-(video|image|expression|dance)$/, ''),
    [templateName],
  );

  // 获取模板显示名称
  const templateDisplayName = useMemo(() => {
    if (!currentTemplate) {
      // 如果模板数据还没加载，从 URL 参数生成显示名称
      return cleanTemplateId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return resolveTemplateName(
      t,
      currentTemplate.name_key,
      templateName,
      currentTemplate.i18n,
    );
  }, [currentTemplate, cleanTemplateId, templateName, t]);

  // 获取模板英文名称（用于搜索 tag）
  const templateEnglishName = useMemo(() => {
    if (!currentTemplate?.name_key) {
      return cleanTemplateId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // 强制使用英文翻译
    const nameKey = currentTemplate.name_key;
    const enOpts = { lng: 'en', defaultValue: '' };

    // 检查 nameKey 是否已经包含前缀（如 titles.xxx, effects.xxx）
    const hasPrefix = nameKey.includes('.');

    const fallbackKeys = hasPrefix
      ? [
          // nameKey 已经包含前缀，直接使用
          `style-templates:${nameKey}`,
        ]
      : [
          // nameKey 不包含前缀，尝试多个可能的路径
          `style-templates:titles.${nameKey}`,
          `style-templates:effects.${nameKey}`,
          `style-templates:dances.${nameKey}`,
          `style-templates:${nameKey}`,
        ];

    for (const candidate of fallbackKeys) {
      const translated = t(candidate, enOpts);
      if (translated && translated !== candidate) {
        return translated;
      }
    }

    // Fallback: 将 kebab-case 转换为 Title Case
    const cleanKey = hasPrefix ? nameKey.split('.').pop() || nameKey : nameKey;
    return cleanKey
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [currentTemplate, cleanTemplateId, t]);

  // 获取当前 URL slug（用于 SEO）
  const currentUrlSlug = currentTemplate?.urlSlug || templateName;

  // 面包屑项目
  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      { label: t('effects:breadcrumb.effects', 'Effects'), href: '/effects' },
      { label: templateDisplayName },
    ],
    [templateDisplayName, t],
  );

  // SEO Meta 信息
  const seoTitle = t('effects:meta.titleTemplate', '{{name}} Generator', {
    name: templateDisplayName,
  });

  const templateDescription = useMemo(
    () =>
      resolveTemplateDescription(
        currentTemplate?.i18n,
        currentTemplate?.description,
      ),
    [currentTemplate?.i18n, currentTemplate?.description],
  );

  const seoDescription = useMemo(() => {
    const type = currentTemplate?.type || 'video';
    // 翻译 type 值
    const translatedType = t(`effects:types.${type}`, type);
    const baseDescription = t(
      'effects:hero.defaultDescription',
      `Generate ${templateDisplayName} ${type} effects with KomikoAI. Upload a character image and experience the power of the AI ${templateDisplayName} Generator in seconds.`,
      { name: templateDisplayName, type: translatedType },
    );
    return templateDescription
      ? `${baseDescription} ${templateDescription}`.trim()
      : baseDescription;
  }, [templateDisplayName, currentTemplate?.type, templateDescription, t]);

  const seoKeywords = useMemo(() => {
    const name = templateDisplayName;
    const type = currentTemplate?.type || 'video';
    return `${name} Generator, ${name} AI Generator, ${name} AI ${type} Generator, ${name} AI, ${name} Template, ${name} Effect, AI ${name} Effect, AI ${name} Generator, ${name} ${type} Generator, ${name} ${type} Effect, ${name} Effect Generator, AI Effect, AI ${type} Effect, AI ${type} Template, AI ${type} Generator`;
  }, [templateDisplayName, currentTemplate?.type]);

  // CommunityExamples 的备选 tag 名称（使用 useMemo 避免每次渲染创建新数组，破坏 memo）
  const alternativeTagNames = useMemo(
    () =>
      [
        currentTemplate?.displayName,
        templateDisplayName !== templateEnglishName
          ? templateDisplayName
          : undefined,
      ].filter(Boolean) as string[],
    [currentTemplate?.displayName, templateDisplayName, templateEnglishName],
  );

  // Hero 区域描述
  const heroDescription = useMemo(() => {
    if (templateDescription) {
      return templateDescription;
    }
    const type = currentTemplate?.type || 'video';
    // 翻译 type 值
    const translatedType = t(`effects:types.${type}`, type);
    return t(
      'effects:hero.defaultDescription',
      `Generate ${templateDisplayName} ${type} effects with KomikoAI. Upload a character image and experience the power of the AI ${templateDisplayName} Generator in seconds.`,
      { name: templateDisplayName, type: translatedType },
    );
  }, [templateDescription, templateDisplayName, currentTemplate?.type, t]);

  // 获取随机模板的回调
  const handleRandomTemplate = useCallback(() => {
    if (categories.length === 0) {
      return;
    }

    // 收集所有模板
    const allTemplates = categories.flatMap(cat => cat.templates);
    if (allTemplates.length === 0) {
      return;
    }

    // 随机选择一个不同的模板
    const filteredTemplates = allTemplates.filter(
      t => t.urlSlug !== currentTemplate?.urlSlug,
    );
    const templatesPool =
      filteredTemplates.length > 0 ? filteredTemplates : allTemplates;
    const randomTemplate =
      templatesPool[Math.floor(Math.random() * templatesPool.length)];
    handleSwitchTemplate(randomTemplate);
  }, [categories, currentTemplate, handleSwitchTemplate]);

  // 加载状态
  if (isLoading) {
    return (
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
            <div className='flex items-center justify-center min-h-[60vh]'>
              <div className='flex flex-col items-center gap-4'>
                <Spinner size='lg' color='primary' />
                <p className='text-muted-foreground'>
                  {t('common:loading', 'Loading...')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 模板不存在
  if (!currentTemplate && !isLoading) {
    return (
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
        <Head>
          <title>Effect Not Found | Komiko AI</title>
        </Head>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
            <div className='flex items-center justify-center min-h-[60vh]'>
              <div className='flex flex-col items-center gap-4 text-center px-4'>
                <HiSparkles className='w-16 h-16 text-muted-foreground' />
                <h1 className='text-2xl font-bold text-foreground'>
                  {t('effects:notFound.title', 'Effect Not Found')}
                </h1>
                <p className='text-muted-foreground max-w-md'>
                  {t(
                    'effects:notFound.description',
                    `The effect "${templateName}" could not be found. It may have been removed or the URL is incorrect.`,
                  )}
                </p>
                <Button
                  color='primary'
                  onPress={() => router.push('/effects')}
                  className='mt-4'>
                  {t('effects:notFound.browseAll', 'Browse All Effects')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter className='ml-5 border-border lg:pl-[240px]' />
      </main>
    );
  }

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>{seoTitle}</title>
        <meta name='description' content={seoDescription} />
        <meta name='keywords' content={seoKeywords} />
        <meta property='og:title' content={seoTitle} />
        <meta property='og:description' content={seoDescription} />
        <meta
          property='og:url'
          content={`https://komiko.app/effects/${currentUrlSlug}`}
        />
        <meta property='og:type' content='website' />
        {currentTemplate?.url && (
          <meta property='og:image' content={currentTemplate.url} />
        )}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={seoTitle} />
        <meta name='twitter:description' content={seoDescription} />
        {currentTemplate?.url && (
          <meta name='twitter:image' content={currentTemplate.url} />
        )}
        <link
          rel='canonical'
          href={`https://komiko.app/effects/${currentUrlSlug}`}
        />
      </Head>

      <Header autoOpenLogin={false} />

      <div className='flex'>
        <Sidebar />

        <div className='p-2 pt-20 md:pt-24 lg:pl-[240px] w-full h-full'>
          <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
            <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
              {/* 面包屑导航 */}
              <div className='mb-4 px-2'>
                <Breadcrumb items={breadcrumbItems} />
              </div>

              {/* Hero Section */}
              <Hero title={templateDisplayName} description={heroDescription} />

              {/* 主要生成组件 - 使用统一组件支持所有模板类型 */}
              {/* 不使用 key，避免模板类型切换时重新挂载导致结果丢失 */}
              {currentTemplate && (
                <UnifiedTemplateGenerator
                  ref={generatorRef}
                  template={currentTemplate}
                  onOpenTemplatePicker={openTemplatePicker}
                  onRandomTemplate={handleRandomTemplate}
                  exampleUrl={
                    currentTemplate.display_url || currentTemplate.url
                  }
                  initialInputImage={preservedInputImage}
                />
              )}

              {/* 更多信息区域 - 使用统一的 SEO 组件风格 */}
              <div className='flex flex-col gap-14 md:gap-24 mt-12 md:mt-20'>
                {/* Community Examples Section - 在 What Is 之上 */}
                <CommunityExamples
                  templateDisplayName={templateDisplayName}
                  tagName={templateEnglishName}
                  alternativeTagNames={alternativeTagNames}
                  fallbackImageUrl={
                    currentTemplate?.display_url || currentTemplate?.url
                  }
                  templateType={currentTemplate?.type}
                />

                {/* What Is Section */}
                <WhatIs
                  title={t(
                    'effects:whatIs.title',
                    `What is ${templateDisplayName}`,
                    {
                      name: templateDisplayName,
                    },
                  )}
                  description={t(
                    'effects:whatIs.defaultDescription',
                    `AI ${templateDisplayName} Generator is an AI tool that creates ${templateDisplayName} ${currentTemplate?.type || 'video'} effects. It's one of 100+ AI effect templates designed by the KomikoAI team. Just upload a character image and let AI do the magic.`,
                    {
                      name: templateDisplayName,
                      type: t(
                        `effects:types.${currentTemplate?.type || 'video'}`,
                        currentTemplate?.type || 'video',
                      ),
                    },
                  )}
                />

                {/* How To Use Section */}
                <HowToUse
                  title={t('effects:howToUse.title', 'How to Use')}
                  steps={[
                    {
                      title: t('effects:howToUse.step1Title', 'Upload Image'),
                      content: t(
                        'effects:howToUse.step1',
                        'Upload your character image above',
                      ),
                    },
                    {
                      title: t('effects:howToUse.step2Title', 'Select Effect'),
                      content: t(
                        'effects:howToUse.step2',
                        `The ${templateDisplayName} effect is already selected for you`,
                        { name: templateDisplayName },
                      ),
                    },
                    {
                      title: t('effects:howToUse.step3Title', 'Generate'),
                      content: t(
                        'effects:howToUse.step3',
                        'Click "Generate Animation" and wait for your result',
                      ),
                    },
                    {
                      title: t('effects:howToUse.step4Title', 'Download'),
                      content: t(
                        'effects:howToUse.step4',
                        'Download or share your creation',
                      ),
                    },
                  ]}
                />

                {/* More AI Tools Section */}
                <MoreAITools category='animation' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 模板选择器 - 只有在 categories 加载完成后才传入，否则让组件自己获取 */}
      <MixedTemplatePicker
        ref={templatePickerRef}
        selectedTemplateSlug={currentTemplate?.urlSlug}
        onSelect={handleSwitchTemplate}
        categories={categories.length > 0 ? categories : undefined}
        showSearch={true}
      />

      <SiteFooter className='ml-5 border-border lg:pl-[240px]' />
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<
  EffectPageProps
> = async ctx => {
  const { name } = ctx.params || {};

  // 验证 name 参数
  if (!name || typeof name !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      templateName: name,
    },
  };
};
