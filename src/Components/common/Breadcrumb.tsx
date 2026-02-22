import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

interface BreadcrumbProps {
  className?: string;
  characterData?: {
    character_name: string;
    character_uniqid: string;
  };
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ className, characterData }) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tCharacter } = useTranslation('character');

  // 清理路径，移除查询参数和hash
  const cleanPath = useMemo(() => {
    return router.asPath.split('?')[0].split('#')[0];
  }, [router.asPath]);

  const pathSegments = useMemo(() => {
    return cleanPath.split('/').filter(segment => segment);
  }, [cleanPath]);

  // 如果不是变体页面，不显示breadcrumb
  if (pathSegments.length < 2) {
    return null;
  }

  const basePath = pathSegments[0];
  const secondPath = pathSegments[1];
  const thirdPath = pathSegments[2];

  // 处理标签页面
  if (basePath === 'tags' && secondPath && thirdPath) {
    const tagName = decodeURIComponent(secondPath);
    const variantType = thirdPath;
    
    const variantNameMap: Record<string, string> = {
      fanart: 'Fanart',
      pfp: 'PFP',
      oc: 'OC',
      wallpaper: 'Wallpaper',
      pictures: 'Pictures',
    };

    const variantName = variantNameMap[variantType] || variantType.charAt(0).toUpperCase() + variantType.slice(1);

    return (
      <div className={className}>
        <Breadcrumbs
          size='sm'
          variant='light'
          separator='/'
          classNames={{
            base: 'px-0',
            list: 'bg-transparent',
            separator: 'text-muted-foreground px-1',
          }}>
          <BreadcrumbItem>
            <Link
              href='/'
              className='text-muted-foreground hover:text-primary-600 transition-colors text-sm'>
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              href={`/tags/${encodeURIComponent(tagName)}`}
              className='text-muted-foreground hover:text-primary-600 transition-colors text-sm'>
              {tagName}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className='text-foreground font-medium text-sm'>
              {variantName}
            </span>
          </BreadcrumbItem>
        </Breadcrumbs>
      </div>
    );
  }

  // 处理角色页面
  if (basePath === 'character' && secondPath && thirdPath) {
    const characterId = secondPath;
    const variantType = thirdPath;
    
    const variantNameMap: Record<string, string> = {
      fanart: tCharacter('variants.fanart.breadcrumb', { name: characterData?.character_name || 'Character' }),
      pfp: tCharacter('variants.pfp.breadcrumb', { name: characterData?.character_name || 'Character' }),
      oc: tCharacter('variants.oc.breadcrumb', { name: characterData?.character_name || 'Character' }),
      wallpaper: tCharacter('variants.wallpaper.breadcrumb', { name: characterData?.character_name || 'Character' }),
      pictures: tCharacter('variants.pictures.breadcrumb', { name: characterData?.character_name || 'Character' }),
    };

    const variantName = variantNameMap[variantType] || variantType.charAt(0).toUpperCase() + variantType.slice(1);

    return (
      <div className={className}>
        <Breadcrumbs
          size='sm'
          variant='light'
          separator='/'
          classNames={{
            base: 'px-0',
            list: 'bg-transparent',
            separator: 'text-muted-foreground px-1',
          }}>
          <BreadcrumbItem>
            <Link
              href='/characters'
              className='text-muted-foreground hover:text-primary-600 transition-colors text-sm'>
              {tCharacter('gallery.title') || 'Characters'}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              href={`/character/${characterId}`}
              className='text-muted-foreground hover:text-primary-600 transition-colors text-sm'>
              {characterData?.character_name || 'Character'}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className='text-foreground font-medium text-sm'>
              {variantName}
            </span>
          </BreadcrumbItem>
        </Breadcrumbs>
      </div>
    );
  }

  // 工具名称映射
  const toolNameMap: Record<string, string> = {
    'ai-anime-generator': tCommon('nav.ai_anime_generator') || 'AI Anime Generator',
    'ai-comic-generator': tCommon('nav.ai_comic_generator') || 'AI Comic Generator',
    'video-to-video': tCommon('nav.video_to_video') || 'Video to Video AI',
    'layer-splitter': tCommon('nav.layer_splitter') || 'Layer Splitter',
    'ai-talking-head': tCommon('nav.ai-talking-head') || 'AI Talking Head',
    'oc-maker': tCommon('nav.oc_maker') || 'OC Maker',
    playground: tCommon('nav.playground') || 'AI Playground',
  };

  const baseToolName = toolNameMap[basePath] || basePath.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const getBaseToolHref = (tool: string): string => {
    const toolPathMap: Record<string, string> = {
      playground: '/playground',
      'oc-maker': '/oc-maker',
      'ai-anime-generator': '/ai-anime-generator',
      'ai-comic-generator': '/ai-comic-generator',
      'video-to-video': '/video-to-video',
      'layer-splitter': '/layer-splitter',
      'ai-talking-head': '/ai-talking-head',
    };

    return toolPathMap[tool] || `/${tool}`;
  };

  // 获取变体名称
  const getVariantName = (variant: string): string => {
    return variant
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bOc\b/g, 'OC')
      .replace(/\bTo\b/g, 'to');
  };

  // 工具页面面包屑
  return (
    <div className={className}>
      <Breadcrumbs
        size='sm'
        variant='light'
        separator='/'
        classNames={{
          base: 'px-0',
          list: 'bg-transparent',
          separator: 'text-muted-foreground px-1',
        }}>
        <BreadcrumbItem>
          <Link
            href={getBaseToolHref(basePath)}
            className='text-muted-foreground hover:text-primary-600 transition-colors text-sm'>
            {baseToolName}
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <span className='text-foreground text-sm'>
            {getVariantName(secondPath)}
          </span>
        </BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}; 