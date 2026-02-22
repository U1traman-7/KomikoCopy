import { i2iStyleTemplatesCategories } from './image';
import { getEffectTemplatesSync, getTrendingStylesIdSync } from './video';
import { getTrendingImageStylesIdSync } from './image';
import { expressionTemplates, danceTemplates } from '../StyleGirds/styles';
import i18n from 'i18next';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  extractStyleNameKeyMapping,
  updateEffectNameKeyMapping,
  getEffectNameKeyMappingSync,
} from './nameKeyMapping';

// Re-export for backward compatibility
export {
  extractStyleNameKeyMapping,
  updateEffectNameKeyMapping,
  getEffectNameKeyMappingSync,
};

// Template input field with placeholder support
export interface TemplateInputField {
  input_field: string;
  placeholder: string | null;
  type?: 'text' | 'textarea' | 'choice'; // 添加字段类型
  choices?: Array<{
    value: string;
    label: string;
  }>; // 选择题选项
  question?: string; // 选择题问题
}

// playground or v2v
export interface ImageStyleTemplate {
  id: string;
  nameKey: string;
  image: string;
  supportV2V?: boolean; // 是否在Video to Video里面显示
  supportPlayground?: boolean; // 是否在Playground里面显示（默认显示）
  needsCharacterInputs?: TemplateInputField[]; // 需要的角色输入字段
  isProModel?: boolean;
  needMiddleware?: boolean; // 是否需要 middleware 处理
  input_media?: Array<{
    media_type: string;
    min_count: number;
    max_count: number;
  }>; // 多媒体输入配置
  i18n?: { name?: Record<string, string>; description?: Record<string, string> } | null; // 数据库 i18n 数据
}

// effect mode / dance mode
export interface VideoStyleTemplate {
  id: string;
  nameKey: string;
  video: string;
  displayVideo?: string; // UI 展示用的视频 URL，降级到 video
  duration: number;
  model: number;
  hasAudio: boolean;
  needsCharacterInputs?: TemplateInputField[]; // 需要的角色输入字段
  needMiddleware?: boolean; // 是否需要 middleware 处理
  videoPipelineType?: string; // 视频管线类型 (type2/type3 等)
  prompt?: string; // 模板 prompt，用于 SEEDANCE 等需要 prompt 的模型
  input_media?: Array<{
    media_type: string;
    min_count: number;
    max_count: number;
  }>; // 多媒体输入配置
  i18n?: { name?: Record<string, string>; description?: Record<string, string> } | null; // 数据库 i18n 数据
}

export interface ImageStyleTemplateCategory {
  category: string;
  icon: string;
  emoji?: any;
  templates: ImageStyleTemplate[];
  supportV2V?: boolean; // 是否在Video to Video里面显示
  supportPlayground?: boolean; // 是否在Playground里面显示（默认显示）
}

export interface VideoStyleTemplateCategory {
  category: string;
  icon: string;
  emoji?: any;
  templates: VideoStyleTemplate[];
}

export type styleTemplate =
  | ImageStyleTemplateCategory
  | VideoStyleTemplateCategory;

// Pre-computed mapping for performance - using static data as fallback
// Will be updated with async loaded data during app initialization
let i2iStyleNameKeyMappingCache = extractStyleNameKeyMapping(
  i2iStyleTemplatesCategories,
);

export const getI2iStyleNameKeyMapping = async () => {
  const { getI2IStyleTemplatesCategories } = await import('./image');
  const categories = await getI2IStyleTemplatesCategories();
  if (categories) {
    i2iStyleNameKeyMappingCache = extractStyleNameKeyMapping(categories);
  }
  return i2iStyleNameKeyMappingCache;
};

// Export getter function for accessing latest cached mapping
// This ensures components always get the updated mapping after database load
export const getI2iStyleNameKeyMappingSync = () => i2iStyleNameKeyMappingCache;

// Legacy export for backward compatibility - returns current cache value
export const i2iStyleNameKeyMapping = i2iStyleNameKeyMappingCache;

// Initialize effect name key mapping from static data on module load
updateEffectNameKeyMapping(getEffectTemplatesSync());

// Async version that uses fresh database data for video templates
export const getEffectNameKeyMapping = async () => {
  const { getEffectTemplates } = await import('./video');
  const templates = await getEffectTemplates();
  if (templates && templates.length > 0) {
    updateEffectNameKeyMapping(templates);
  }
  return getEffectNameKeyMappingSync();
};

/**
 * @deprecated Use getEffectNameKeyMappingSync() instead. This export returns a stale snapshot from module load time.
 */
export const effectNameKeyMapping = getEffectNameKeyMappingSync();

// Getter function that returns fresh trendingStyleIds with latest cache data
export const getTrendingStyleIds = () => ({
  'i2v-effect': getTrendingStylesIdSync(), // From database - video trending
  'video-to-video': [
    // Static data
    'anime',
    'x-ray',
    'neon-sign',
    'ios-emoji',
    'call-of-duty',
    'the-simpsons',
    'barbie',
    'cat-girl',
    'playdoh',
    'yarn',
    'fire',
    'muscle',
    'mars',
    'apocalypse',
    'cyborg',
    'orange-cat',
  ],
  playground: getTrendingImageStylesIdSync(), // From database - image trending
});

// Legacy static export for backward compatibility - returns current snapshot
export const trendingStyleIds = getTrendingStyleIds();

export const presetPrompts: Record<string, string> = {
  'retro-game':
    'Pixel art style video. Retro-style video game interface. Game UI elements are dynamically changing. Health bar is decreasing. Map with moving icons. Score counters incrementing.',
  'mobile-game':
    'A dynamic game play screen recording showing dynamic game interface.',
  'ps-game':
    'A dynamic game play screen recording showing dynamic game interface.',
  // snow: 'A heavy snowstorm.',
};

// Template info type for reverse mapping
export interface TemplateToolInfo {
  id: string;
  toolPath: string;
  queryParam: string; // 'style' or 'dance'
  effectsSlug: string; // URL slug for /effects/{slug} page
}

// Lazily-initialized cache for O(1) lookups
let templateTagNameMap: Map<string, TemplateToolInfo> | null = null;

// Build the tag name -> template info map (synchronous version using current cache)
const buildTemplateTagNameMap = (
  imageTemplates: ImageStyleTemplateCategory[] = i2iStyleTemplatesCategories,
): Map<string, TemplateToolInfo> => {
  const map = new Map<string, TemplateToolInfo>();
  const enOpts = { lng: 'en' };

  // Image style templates (playground or video-to-video)
  for (const category of imageTemplates) {
    for (const template of category.templates) {
      const enName = i18n.t(`style-templates:${template.nameKey}`, enOpts);
      const templateTyped = template as ImageStyleTemplate;
      const supportsPlayground =
        templateTyped.supportPlayground !== false &&
        category.supportPlayground !== false;

      const toolInfo = {
        id: template.id,
        toolPath: supportsPlayground ? '/playground' : '/video-to-video',
        queryParam: 'style',
        effectsSlug: `${template.id}-image`,
      };

      // Map 1: JSON i18n translation (existing behavior)
      map.set(enName, toolInfo);

      // Map 2: Database i18n.name.en (for tags created from DB data)
      if (template.i18n?.name?.en && template.i18n.name.en !== enName) {
        map.set(template.i18n.name.en, toolInfo);
      }
    }
  }

  // Effect templates (ai-video-effects)
  for (const category of getEffectTemplatesSync()) {
    for (const template of category.templates) {
      const enName = i18n.t(
        `style-templates:effects.${template.nameKey}`,
        enOpts,
      );
      const toolInfo = {
        id: template.id,
        toolPath: '/ai-video-effects',
        queryParam: 'style',
        effectsSlug: `${template.id}-video`,
      };

      // Map 1: JSON i18n translation (existing behavior)
      map.set(enName, toolInfo);

      // Map 2: Database i18n.name.en (for tags created from DB data)
      if (template.i18n?.name?.en && template.i18n.name.en !== enName) {
        map.set(template.i18n.name.en, toolInfo);
      }
    }
  }

  // Expression templates (playground with expression mode)
  for (const template of expressionTemplates) {
    const enName = i18n.t(
      `style-templates:expressions.${template.nameKey}`,
      enOpts,
    );
    const toolInfo = {
      id: `expression-${template.id}`,
      toolPath: '/playground',
      queryParam: 'style',
      effectsSlug: `expression-${template.id}-expression`,
    };

    // Map 1: JSON i18n translation (existing behavior)
    map.set(enName, toolInfo);

    // Map 2: Database i18n.name.en (for tags created from DB data)
    if (template.i18n?.name?.en && template.i18n.name.en !== enName) {
      map.set(template.i18n.name.en, toolInfo);
    }
  }

  // Dance templates
  for (const template of danceTemplates) {
    const enName = i18n.t(`style-templates:dances.${template.nameKey}`, enOpts);
    const toolInfo = {
      id: template.id,
      toolPath: '/dance-video-generator',
      queryParam: 'dance',
      effectsSlug: `${template.id}-dance`,
    };

    // Map 1: JSON i18n translation (existing behavior)
    map.set(enName, toolInfo);

    // Map 2: Database i18n.name.en (for tags created from DB data)
    if (template.i18n?.name?.en && template.i18n.name.en !== enName) {
      map.set(template.i18n.name.en, toolInfo);
    }
  }

  return map;
};

// Async function to refresh tag name map with fresh database data
export const refreshTemplateTagNameMap = async () => {
  const [{ getI2IStyleTemplatesCategories }, { getEffectTemplates }] =
    await Promise.all([import('./image'), import('./video')]);
  // Load both image and video/effect templates in parallel
  // getEffectTemplates() updates effectTemplatesCache used by getEffectTemplatesSync()
  const [imageTemplates] = await Promise.all([
    getI2IStyleTemplatesCategories(),
    getEffectTemplates(),
  ]);
  if (imageTemplates) {
    templateTagNameMap = buildTemplateTagNameMap(imageTemplates);
  }
};

// Get template tool info by English tag name - O(1) lookup
// Returns { id, toolPath, queryParam } or null if not a template tag
export const getTemplateInfoByTagName = (
  tagName: string,
): TemplateToolInfo | null => {
  if (!templateTagNameMap) {
    templateTagNameMap = buildTemplateTagNameMap();
  }
  return templateTagNameMap.get(tagName) ?? null;
};

// Invalidate cache if translations change (e.g., after i18n reload)
// or to force rebuild with latest data
export const invalidateTemplateTagNameCache = () => {
  templateTagNameMap = null;
};

// 优化的模板数据管理 Hook
export const useI2iStyleTemplates = () => {
  const [templates, setTemplates] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndSubscribe = async () => {
      setError(null);

      try {
        // 动态导入以避免循环依赖
        const { getI2IStyleTemplatesCategories } = await import('./image');
        const { templateDataManager } = await import(
          '../../../utils/templateCache'
        );

        // 立即检查是否已有缓存数据，优先使用缓存
        const cachedData = templateDataManager.getImageTemplates();
        if (cachedData && templateDataManager.isDataLoaded()) {
          // 缓存已加载完成，直接使用，无需打印日志避免页面切换时的噪音
          const currentTemplates = await getI2IStyleTemplatesCategories();
          setTemplates(currentTemplates);
          setIsLoading(false);
        } else if (templateDataManager.isDataLoading()) {
          // 正在加载中，不重复触发加载，只监听完成事件
          console.log('[useI2iStyleTemplates] Data is loading, waiting...');
        } else if (!templateDataManager.isDataLoaded()) {
          // 未加载且未在加载，才触发加载
          console.log(
            '[useI2iStyleTemplates] Starting to load template data...',
          );
          // 不等待加载完成，让监听器处理结果
          templateDataManager.loadAllData().catch(err => {
            console.error('[useI2iStyleTemplates] Load failed:', err);
            setError('Failed to load templates');
            setIsLoading(false);
          });
        }

        // 监听全局缓存的数据变化（包括首次加载完成）
        const unsubscribe = templateDataManager.addDataChangeListener(
          async () => {
            console.log(
              '[useI2iStyleTemplates] Data change detected, refreshing templates...',
            );
            try {
              const freshTemplates = await getI2IStyleTemplatesCategories();
              setTemplates(freshTemplates);
              setIsLoading(false);
              console.log('[useI2iStyleTemplates] Templates updated:', {
                categories: freshTemplates?.length,
              });

              // Auto-refresh all mappings when data is updated
              console.log('[useI2iStyleTemplates] Refreshing mappings...');
              const { getEffectTemplates, getTrendingStylesId } = await import(
                './video'
              );
              const { getTrendingImageStylesId } = await import('./image');
              await Promise.all([
                getI2iStyleNameKeyMapping(),
                refreshTemplateTagNameMap(),
                getEffectTemplates(), // Refresh video templates cache
                getTrendingStylesId(), // Refresh trending video styles cache
                getTrendingImageStylesId(), // Refresh trending image styles cache
              ]);
              console.log('[useI2iStyleTemplates] All mappings refreshed');
            } catch (err) {
              console.error(
                '[useI2iStyleTemplates] Error updating templates:',
                err,
              );
              setError(
                err instanceof Error
                  ? err.message
                  : 'Failed to update templates',
              );
              setIsLoading(false);
            }
          },
        );

        // 返回清理函数
        return unsubscribe;
      } catch (err) {
        console.error('[useI2iStyleTemplates] Failed to load templates:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load templates',
        );
        // 发生错误时，使用静态fallback数据
        setTemplates(i2iStyleTemplatesCategories);
        setIsLoading(false);
        return () => {}; // 空的清理函数
      }
    };

    const cleanupPromise = loadAndSubscribe();

    // 清理函数
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []);

  // 手动刷新函数
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { getI2IStyleTemplatesCategories } = await import('./image');
      const freshTemplates = await getI2IStyleTemplatesCategories();
      if (freshTemplates) {
        setTemplates(freshTemplates);
      }
      return freshTemplates || templates;
    } catch (err) {
      console.error('[useI2iStyleTemplates] Failed to refresh templates:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to refresh templates',
      );
      return templates;
    } finally {
      setIsLoading(false);
    }
  }, [templates]);

  return {
    templates,
    isLoading,
    error,
    refresh,
  };
};

export { i2iStyleTemplatesCategories };
