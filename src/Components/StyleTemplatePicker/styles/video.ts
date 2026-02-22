import type { VideoStyleTemplateCategory, TemplateInputField } from './index';
import { updateEffectNameKeyMapping } from './nameKeyMapping';
import { ModelIds } from '../../../../api/_constants';
import { templateDataManager } from '../../../utils/templateCache';

// Type definitions for API response
interface DBTemplateCategory {
  id: string;
  type: 'image' | 'video';
  name_key: string;
  icon?: string;
  emoji?: string;
  support_v2v: boolean;
  support_playground: boolean;
  templates: Array<{
    id: string;
    type: 'image' | 'video';
    name_key: string;
    url?: string;
    is_pro_model: boolean;
    support_v2v: boolean;
    support_playground: boolean;
    character_inputs?: TemplateInputField[];
    need_middleware?: boolean;
    video_pipeline_type?: string;
    metadata?: any;
    prompt?: { prompt: string }; // 模板 prompt，用于 SEEDANCE 等模型
    input_media?: Array<{
      media_type: string;
      min_count: number;
      max_count: number;
    }>;
  }>;
}

// Helper function to clean template ID suffix for video templates
// Removes -v suffix specifically, as these are video templates
const cleanTemplateId = (id: string): string =>
  // For video templates, remove -v suffix if present
  id.replace(/-v$/, '');
// Helper function to convert string model name to ModelIds enum
const stringToModelId = (modelStr?: string): number => {
  if (!modelStr) {
    return ModelIds.VIDU;
  }

  const modelMap: Record<string, number> = {
    SORA: ModelIds.SORA,
    VIDU: ModelIds.VIDU,
    SORA_TEXT_TO_VIDEO: ModelIds.SORA_TEXT_TO_VIDEO,
    SEEDANCE: ModelIds.SEEDANCE,
  };

  return modelMap[modelStr] || ModelIds.VIDU;
};

// Transform database category to match existing interface
const transformVideoCategory = (
  dbCategory: DBTemplateCategory,
): VideoStyleTemplateCategory => ({
  category: `categories.${dbCategory.name_key}`,
  icon: dbCategory.icon || '',
  emoji: dbCategory.emoji || '',
  templates: dbCategory.templates.map(template => ({
    id: cleanTemplateId(template.id),
    nameKey: template.name_key,
    video: template.url || '',
    model: stringToModelId(template.metadata?.model),
    duration: template.metadata?.duration || 5,
    hasAudio: template.metadata?.hasAudio !== false,
    needsCharacterInputs: template.character_inputs,
    needMiddleware: template.need_middleware || false,
    videoPipelineType: template.video_pipeline_type, // 传递 video pipeline type
    prompt: template.prompt?.prompt || '', // 传递模板 prompt
    input_media: template.input_media,
    i18n: (template as any).i18n || null,
  })),
});

// Helper function to process templates, update cache, and sync name key mapping
// This avoids code duplication in getEffectTemplates
const processAndCacheTemplates = (
  dbTemplates: DBTemplateCategory[],
): VideoStyleTemplateCategory[] => {
  const transformed = dbTemplates.map(transformVideoCategory);
  // Update cache
  effectTemplatesCache = transformed;
  // Sync effect name key mapping
  updateEffectNameKeyMapping(transformed);
  return transformed;
};

// Function to get video templates from global cache (secure)
export const getEffectTemplates = async (): Promise<
  VideoStyleTemplateCategory[]
> => {
  if (typeof window === 'undefined') {
    return effectTemplatesStatic;
  }

  const cachedTemplates = templateDataManager.getVideoTemplates();
  if (cachedTemplates) {
    return processAndCacheTemplates(cachedTemplates);
  }

  // 如果正在加载，返回静态数据作为临时显示，避免判断为加载失败
  if (templateDataManager.isDataLoading()) {
    console.log(
      '[Video Templates] Data is loading, returning static templates temporarily',
    );
    return effectTemplatesStatic;
  }

  // 如果缓存为空且未在加载，尝试加载数据
  if (!templateDataManager.isDataLoaded()) {
    console.log('[Video Templates] Loading templates from global cache...');
    await templateDataManager.loadAllData();
    const videoTemplates = templateDataManager.getVideoTemplates();
    if (videoTemplates) {
      return processAndCacheTemplates(videoTemplates);
    }
  }

  // 如果仍然无法获取数据，返回静态数据
  console.log('[Video Templates] Using static video template fallback');
  return effectTemplatesStatic;
};

// Function to get trending styles from global cache (secure)
export const getTrendingStylesId = async (): Promise<string[]> => {
  // 服务端渲染时直接返回静态数据
  if (typeof window === 'undefined') {
    console.log('[Trending Styles] Server-side, using static fallback');
    return trendingStylesIdStatic;
  }

  // 客户端：首先尝试从全局缓存获取
  const cachedStyles = templateDataManager.getTrendingStyles();
  console.log('[Trending Styles] Cache check:', {
    cachedStyles,
    isArray: Array.isArray(cachedStyles),
    length: cachedStyles?.length,
    isDataLoaded: templateDataManager.isDataLoaded(),
    isDataLoading: templateDataManager.isDataLoading(),
  });

  if (cachedStyles && cachedStyles.length > 0) {
    // Clean template IDs (remove -v suffix) to match transformed template IDs
    const cleanedStyles = cachedStyles.map(cleanTemplateId);
    console.log('[Trending Styles] Using cached trending styles:', {
      original: cachedStyles,
      cleaned: cleanedStyles,
    });
    // Update cache
    trendingStylesCache = cleanedStyles;
    return cleanedStyles;
  }

  // 如果正在加载，等待或返回静态数据
  if (templateDataManager.isDataLoading()) {
    console.log('[Trending Styles] Data is loading, using static fallback');
    return trendingStylesIdStatic;
  }

  // 如果缓存为空且未在加载，尝试加载数据
  if (!templateDataManager.isDataLoaded()) {
    console.log('[Trending Styles] Loading data from template manager...');
    await templateDataManager.loadAllData();
    const trendingStyles = templateDataManager.getTrendingStyles();
    console.log('[Trending Styles] After loading:', {
      trendingStyles,
      length: trendingStyles?.length,
    });

    if (trendingStyles && trendingStyles.length > 0) {
      // Clean template IDs (remove -v suffix) to match transformed template IDs
      const cleanedStyles = trendingStyles.map(cleanTemplateId);
      console.log('[Trending Styles] Loaded trending styles:', {
        original: trendingStyles,
        cleaned: cleanedStyles,
      });
      // Update cache
      trendingStylesCache = cleanedStyles;
      return cleanedStyles;
    }
  }

  // 如果仍然无法获取数据，返回静态数据
  console.log('[Trending Styles] Using static trending styles fallback');
  return trendingStylesIdStatic;
};

// Static fallback data (keeping original structure as backup)
const effectTemplatesStatic: VideoStyleTemplateCategory[] = [
  // christmas
  {
    category: 'categories.funEffects',
    icon: 'anime',
    emoji: '🎭',
    templates: [
      {
        id: '360-View',
        nameKey: '360View',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/360-view.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'live2d-breeze',
        nameKey: 'live2dBreeze',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/live2d-breeze.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'squish',
        nameKey: 'squish',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/squish.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'screen-kiss',
        nameKey: 'screenKiss',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/screen-kiss.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'animated-stickers',
        nameKey: 'animatedStickers',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/animated-stickers.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'into-outer-space',
        nameKey: 'intoOuterSpace',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/into-outer-space.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
  {
    category: 'categories.action',
    icon: 'action',
    emoji: '💃',
    templates: [
      {
        id: 'take-my-hand',
        nameKey: 'takeMyHand',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/take-my-hand.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'wink',
        nameKey: 'wink',
        video: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/wink.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'twerk',
        nameKey: 'twerk',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/twerk.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: false,
      },
      {
        id: 'sprite-attack-animation',
        nameKey: 'spriteAttackAnimation',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/sprite-attack-animation.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'sword-swing',
        nameKey: 'swordSwing',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/sword-swing.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'energy-ball',
        nameKey: 'energyBall',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/energy-ball.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'fire-magic',
        nameKey: 'fireMagic',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/fire-magic.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
    ],
  },
  // transformation
  {
    category: 'categories.transformation',
    icon: 'transformation',
    emoji: '🎭',
    templates: [
      {
        id: 'magical-girl-transformation',
        nameKey: 'magicalGirlTransformation',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/magical-girl-transformation.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'super-saiyan',
        nameKey: 'superSaiyan',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/super-saiyan.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'wings',
        nameKey: 'wings',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/wings.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'crimson-eye',
        nameKey: 'crimsonEye',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/crimson-eye.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'batman-transformation',
        nameKey: 'batmanTransformation',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/batman-transformation.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'demon-transformation',
        nameKey: 'demonTransformation',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/demon-transformation.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'bankai',
        nameKey: 'bankai',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/bankai.webm',
        model: ModelIds.SORA_TEXT_TO_VIDEO,
        duration: 15,
        hasAudio: true,
        needsCharacterInputs: [
          { input_field: 'characterName', placeholder: null },
        ],
      },
    ],
  },
  // music video
  {
    category: 'categories.musicVideo',
    icon: 'music',
    emoji: '🎵',
    templates: [
      {
        id: 'anime-mv',
        nameKey: 'animeMv',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/anime-mv.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'manga-style-mv',
        nameKey: 'mangaStyleMv',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/manga-style-mv.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'kawaii-mv',
        nameKey: 'kawaiiMv',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/kawaii-mv.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'hand-drawn-mv',
        nameKey: 'handDrawnMv',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/hand-drawn-mv.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
  // game
  {
    category: 'categories.game',
    icon: 'game',
    emoji: '🎮',
    templates: [
      {
        id: 'game-promo-video',
        nameKey: 'gamePromoVideo',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/game-promo-video.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'dating-sim',
        nameKey: 'datingSim',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/dating-sim.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'retro-game',
        nameKey: 'retroGame',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/retro-game.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'pokemon-evolution',
        nameKey: 'pokemonEvolution',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/pokemon-evolution.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'minecraft-documentary',
        nameKey: 'minecraftDocumentary',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/minecraft-documentary.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'genshin-impact',
        nameKey: 'genshinImpact',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/genshin-impact.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'zelda',
        nameKey: 'zelda',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/zelda.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
  // performance
  {
    category: 'categories.performance',
    icon: 'performance',
    emoji: '🎤',
    templates: [
      {
        id: 'idol',
        nameKey: 'idol',
        video: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/idol.webm',
        model: ModelIds.VIDU,
        duration: 5,
        hasAudio: true,
      },
      {
        id: 'live-concert',
        nameKey: 'liveConcert',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/live-concert.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'tiktok-dance',
        nameKey: 'tiktokDance',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/tiktok-dance.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'streaming-vtuber',
        nameKey: 'streamingVtuber',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/streaming-vtuber.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'dj',
        nameKey: 'dj',
        video: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/dj.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'ted-talk',
        nameKey: 'tedTalk',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/ted-talk.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'vlogger',
        nameKey: 'vlogger',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/vlogger.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
  // vibe
  {
    category: 'categories.vibe',
    icon: 'vibe',
    emoji: '✨',
    templates: [
      {
        id: 'poetic-animation',
        nameKey: 'poeticAnimation',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/poetic-animation.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'lo-fi-vibe',
        nameKey: 'loFiVibe',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/lo-fi-vibe.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'cyberpunk',
        nameKey: 'cyberpunk',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/cyberpunk.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
  {
    category: 'categories.christmas',
    icon: 'christmas',
    emoji: '🎄',
    templates: [
      {
        id: 'christmas-dance',
        nameKey: 'christmasDance',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-dance.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
      {
        id: 'christmas-barbecue',
        nameKey: 'christmasBarbecue',
        video:
          'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-barbecue.webm',
        model: ModelIds.SORA,
        duration: 10,
        hasAudio: true,
      },
    ],
  },
];

const trendingStylesIdStatic = [
  'bankai',
  '360-View',
  'live2d-breeze',
  'take-my-hand',
  'super-saiyan',
  'anime-mv',
  'manga-style-mv',
  'game-promo-video',
  'dating-sim',
  'streaming-vtuber',
];

// Initialize with database data, fallback to static data if fails
let effectTemplatesCache: any[] = effectTemplatesStatic;
let trendingStylesCache: string[] = trendingStylesIdStatic;
const isVideoDataLoaded = false;

// Function to load video data from global cache (secure)
const initializeVideoData = async () => {
  // 从全局缓存获取数据
  const templates = templateDataManager.getVideoTemplates();
  const trending = templateDataManager.getTrendingStyles();

  if (templates && trending) {
    return {
      effectTemplates: templates.map(transformVideoCategory),
      trendingStylesId: trending,
    };
  }

  // 如果缓存为空，尝试加载数据
  if (
    !templateDataManager.isDataLoaded() &&
    !templateDataManager.isDataLoading()
  ) {
    await templateDataManager.loadAllData();
    const loadedTemplates = templateDataManager.getVideoTemplates();
    const loadedTrending = templateDataManager.getTrendingStyles();

    if (loadedTemplates && loadedTrending) {
      return {
        effectTemplates: loadedTemplates.map(transformVideoCategory),
        trendingStylesId: loadedTrending,
      };
    }
  }

  // 如果仍然无法获取数据，返回静态数据
  console.log('Using static video data fallback');
  return {
    effectTemplates: effectTemplatesStatic,
    trendingStylesId: trendingStylesIdStatic,
  };
};

// Synchronous getter functions for accessing latest cached data
// These ensure components always get the updated cache after database load
export const getEffectTemplatesSync = () => effectTemplatesCache;
export const getTrendingStylesIdSync = () => trendingStylesCache;

// Default exports return current cached data (synchronous)
// Note: These are snapshot values - use getter functions above for latest data
export const effectTemplates = effectTemplatesCache;
export const trendingStylesId = trendingStylesCache;

// Main async functions that get data from global cache
export const getEffectTemplatesAsync = getEffectTemplates;
export const getTrendingStylesIdAsync = getTrendingStylesId;

// Legacy functions for backwards compatibility
export const getEffectTemplatesAsyncLegacy = () =>
  initializeVideoData().then(data => data.effectTemplates);
export const getTrendingStylesIdAsyncLegacy = () =>
  initializeVideoData().then(data => data.trendingStylesId);

// Legacy synchronous exports (deprecated - use getter functions above)
export const effectTemplatesSync = getEffectTemplatesSync;
export const trendingStylesIdSync = getTrendingStylesIdSync;
