// 全局模板和prompt缓存管理器
// 一次性加载所有数据，避免重复API调用和前端闪烁

// 定义图像模板分类的 fallback 顺序（来自 image.ts，当数据库 order 字段不可用时使用）
const IMAGE_CATEGORY_ORDER = [
  'art',
  'merch',
  'tStyleTransfer',
  'game',
  'movie',
  'anime',
  'changeMaterial',
  'switchScene',
  'cosplay',
  'body',
  'animal',
  'replaceCharacter',
];

// 定义视频模板分类的 fallback 顺序（来自 video.ts，当数据库 order 字段不可用时使用）
const VIDEO_CATEGORY_ORDER = [
  'funEffects',
  'action',
  'transformation',
  'musicVideo',
  'game',
  'performance',
  'vibe',
  'christmas',
];

interface TemplateCache {
  allTemplates: any[] | null; // 完整的混合格式（带 urlSlug、displayName，用于 effects 页面等）
  imageTemplates: any[] | null;
  videoTemplates: any[] | null;
  expressionTemplates: any[] | null;
  danceTemplates: any[] | null;
  trendingStyles: string[] | null; // For video (i2v-effect)
  trendingImageStyles: string[] | null; // For playground
  isLoaded: boolean;
  isLoading: boolean;
}

class TemplateDataManager {
  private cache: TemplateCache = {
    allTemplates: null,
    imageTemplates: null,
    videoTemplates: null,
    expressionTemplates: null,
    danceTemplates: null,
    trendingStyles: null,
    trendingImageStyles: null,
    isLoaded: false,
    isLoading: false,
  };

  private listeners: (() => void)[] = [];
  private loadingPromise: Promise<void> | null = null; // 防止重复加载
  private lastLoadError: number = 0; // 上次加载失败的时间戳，用于防止重试风暴

  // 根据数据库 order 字段或预定义顺序对模板分类进行排序
  private sortTemplateCategories(
    categories: any[],
    categoryOrder: string[],
  ): any[] {
    if (!Array.isArray(categories)) {
      return categories;
    }

    return [...categories].sort((a, b) => {
      const aOrder = a.order;
      const bOrder = b.order;
      const aHasOrder = typeof aOrder === 'number';
      const bHasOrder = typeof bOrder === 'number';

      // 优先使用数据库的 order 字段
      if (aHasOrder || bHasOrder) {
        if (aHasOrder && bHasOrder) {
          if (aOrder !== bOrder) return aOrder - bOrder;
          // order 相同时按 name_key 排序
          return (a.name_key || '').localeCompare(b.name_key || '');
        }
        // 有 order 字段的排在前面
        return aHasOrder ? -1 : 1;
      }

      // 都没有 order 字段时，使用预定义顺序作为 fallback
      const aIndex = categoryOrder.indexOf(a.name_key || '');
      const bIndex = categoryOrder.indexOf(b.name_key || '');

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return (a.name_key || '').localeCompare(b.name_key || '');
    });
  }

  // 添加数据变化监听器
  addDataChangeListener(callback: () => void): () => void {
    this.listeners.push(callback);
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知所有监听器数据已更新
  private notifyDataChange(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[TemplateCache] Error in data change listener:', error);
      }
    });
  }

  // 检查是否在服务器端
  private isServerSide(): boolean {
    return typeof window === 'undefined';
  }

  // 一次性加载所有模板数据
  async loadAllData(): Promise<void> {
    // 如果已经加载完成，静默返回
    if (this.cache.isLoaded) {
      return;
    }

    // 如果正在加载，返回现有的Promise
    if (this.cache.isLoading && this.loadingPromise) {
      console.log('[TemplateCache] Loading already in progress, waiting...');
      return this.loadingPromise;
    }

    // 如果上次加载失败在 30 秒内，跳过重试以防止重试风暴
    if (Date.now() - this.lastLoadError < 30000) {
      console.log('[TemplateCache] Skipping retry - last failure was within 30s cooldown');
      return;
    }

    // 开始新的加载过程
    this.cache.isLoading = true;
    console.log('[TemplateCache] Starting data loading...');

    this.loadingPromise = this.performLoad();

    try {
      await this.loadingPromise;
    } finally {
      this.cache.isLoading = false;
      this.loadingPromise = null;
    }
  }

  // 清理模板 ID 后缀 (-v 或 -i)
  private cleanTemplateId(id: string): string {
    return id.replace(/-(v|i)$/, '');
  }

  // 判断模板是否只支持 v2v（应被排除）
  private ensureDanceType(template: any): any {
    return template.type !== 'dance' ? { ...template, type: 'dance' } : template;
  }

  private isV2VOnly(template: any): boolean {
    return template.support_v2v === true && !template.support_playground;
  }

  // 将 getAllStyleTemplates 格式的模板转换为缓存格式（使用清理后的 ID）
  private transformTemplate(template: any): any {
    return {
      ...template,
      id: template.displayName || this.cleanTemplateId(template.id),
    };
  }

  // 实际的加载逻辑：单次 API 调用获取所有模板，然后拆分到各个缓存槽
  private async performLoad(): Promise<void> {
    try {
      // 单次 API 调用获取所有模板数据
      const allCategories = await this.fetchAPI('/api/getAllStyleTemplates');

      if (!Array.isArray(allCategories)) {
        console.error(
          '[TemplateCache] Invalid response from getAllStyleTemplates',
        );
        this.lastLoadError = Date.now();
        return;
      }

      // 存储完整的混合格式（过滤 v2v-only 模板），供 effects 页面等使用
      // - characterExpression 分类已废弃，从展示层过滤掉
      // - dance 分类下的模板统一标记 type='dance'，确保下游价格计算和提交逻辑正确
      this.cache.allTemplates = allCategories
        .filter((category: any) => category.name_key !== 'characterExpression')
        .map((category: any) => {
          const isDance = category.name_key === 'dance';
          return {
            ...category,
            templates: (category.templates || [])
              .filter((t: any) => !this.isV2VOnly(t))
              .map((t: any) => (isDance ? this.ensureDanceType(t) : t)),
          };
        })
        .filter((category: any) => category.templates.length > 0);

      // 按类型拆分到各个缓存槽
      const imageCategories: any[] = [];
      const videoCategories: any[] = [];
      let expressionTemplatesList: any[] = [];
      let danceTemplatesList: any[] = [];
      const trendingVideoIds: string[] = [];
      const trendingImageIds: string[] = [];

      for (const category of allCategories) {
        // 处理 trending 虚拟分类
        if (category.name_key === 'trending') {
          for (const template of category.templates || []) {
            if (this.isV2VOnly(template)) continue;
            const id =
              template.displayName || this.cleanTemplateId(template.id);
            if (template.type === 'video') {
              trendingVideoIds.push(id);
            } else if (template.type === 'image') {
              trendingImageIds.push(id);
            }
          }
          continue;
        }

        // characterExpression 分类已废弃，跳过
        if (category.name_key === 'characterExpression') {
          continue;
        }

        // 处理 expression 分类
        if (category.name_key === 'expression') {
          expressionTemplatesList = (category.templates || [])
            .filter((t: any) => !this.isV2VOnly(t))
            .map((t: any) => this.transformTemplate(t));
          continue;
        }

        // 处理 dance 分类
        if (category.name_key === 'dance') {
          danceTemplatesList = (category.templates || [])
            .filter((t: any) => !this.isV2VOnly(t))
            .map((t: any) => this.ensureDanceType(this.transformTemplate(t)));
          continue;
        }

        // 普通分类：按模板 type 拆分为 image 和 video
        const imgTemplates = (category.templates || [])
          .filter(
            (t: any) => t.type === 'image' && !this.isV2VOnly(t),
          )
          .map((t: any) => this.transformTemplate(t));

        const vidTemplates = (category.templates || [])
          .filter(
            (t: any) => t.type === 'video' && !this.isV2VOnly(t),
          )
          .map((t: any) => this.transformTemplate(t));

        if (imgTemplates.length > 0) {
          imageCategories.push({
            ...category,
            type: 'image',
            templates: imgTemplates,
          });
        }

        if (vidTemplates.length > 0) {
          videoCategories.push({
            ...category,
            type: 'video',
            templates: vidTemplates,
          });
        }
      }

      // 保存排序后的数据到缓存
      this.cache.imageTemplates =
        imageCategories.length > 0
          ? this.sortTemplateCategories(
              imageCategories,
              IMAGE_CATEGORY_ORDER,
            )
          : null;
      this.cache.videoTemplates =
        videoCategories.length > 0
          ? this.sortTemplateCategories(
              videoCategories,
              VIDEO_CATEGORY_ORDER,
            )
          : null;
      this.cache.expressionTemplates =
        expressionTemplatesList.length > 0 ? expressionTemplatesList : null;
      this.cache.danceTemplates =
        danceTemplatesList.length > 0 ? danceTemplatesList : null;
      this.cache.trendingStyles =
        trendingVideoIds.length > 0 ? trendingVideoIds : null;
      this.cache.trendingImageStyles =
        trendingImageIds.length > 0 ? trendingImageIds : null;

      // 输出加载结果
      const loadedCount = [
        this.cache.imageTemplates,
        this.cache.videoTemplates,
        this.cache.expressionTemplates,
        this.cache.danceTemplates,
        this.cache.trendingStyles,
        this.cache.trendingImageStyles,
      ].filter(Boolean).length;

      console.log(
        `[TemplateCache] Loading completed via single API call (${loadedCount}/6):`,
        {
          imageTemplates: this.cache.imageTemplates
            ? `loaded (${this.cache.imageTemplates.length} categories)`
            : 'empty',
          videoTemplates: this.cache.videoTemplates
            ? `loaded (${this.cache.videoTemplates.length} categories)`
            : 'empty',
          expressionTemplates: this.cache.expressionTemplates
            ? `loaded (${this.cache.expressionTemplates.length} templates)`
            : 'empty',
          danceTemplates: this.cache.danceTemplates
            ? `loaded (${this.cache.danceTemplates.length} templates)`
            : 'empty',
          trendingStyles: this.cache.trendingStyles
            ? `loaded (${this.cache.trendingStyles.length} items)`
            : 'empty',
          trendingImageStyles: this.cache.trendingImageStyles
            ? `loaded (${this.cache.trendingImageStyles.length} items)`
            : 'empty',
          timestamp: new Date().toISOString(),
        },
      );

      this.cache.isLoaded = true;
      console.log('[TemplateCache] All template data loaded successfully');

      // 通知所有监听器数据已更新
      this.notifyDataChange();
    } catch (error) {
      console.error('[TemplateCache] Error loading template data:', error);
      this.lastLoadError = Date.now();
    } finally {
      // 防御性重置：虽然 loadAllData() 的 finally 也会重置，
      // 但此处额外保证 performLoad 自身的状态一致性
      this.cache.isLoading = false;
    }
  }

  // 安全的API调用（服务器端使用完整URL，客户端使用相对路径）
  private async fetchAPI(endpoint: string): Promise<any> {
    const url = this.isServerSide()
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`
      : endpoint;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // 获取所有模板（完整混合格式，带 urlSlug、displayName）
  getAllTemplates(): any[] | null {
    return this.cache.allTemplates;
  }

  getImageTemplates(): any[] | null {
    return this.cache.imageTemplates;
  }

  // 获取视频模板（过滤掉 dance 类别）
  getVideoTemplates(): any[] | null {
    if (!this.cache.videoTemplates) {
      return null;
    }

    return this.cache.videoTemplates.filter((category: any) => {
      const categoryName = category.name_key || category.category || '';
      return !categoryName.toLowerCase().includes('dance');
    });
  }

  // 获取表情模板
  getExpressionTemplates(): any[] | null {
    return this.cache.expressionTemplates;
  }

  // 获取舞蹈模板
  getDanceTemplates(): any[] | null {
    return this.cache.danceTemplates;
  }

  // 获取热门样式 (video)
  getTrendingStyles(): string[] | null {
    return this.cache.trendingStyles;
  }

  // 获取热门图片样式 (image/playground)
  getTrendingImageStyles(): string[] | null {
    return this.cache.trendingImageStyles;
  }

  // 检查是否有有效的图像模板数据
  hasValidImageTemplates(): boolean {
    return (
      Array.isArray(this.cache.imageTemplates) &&
      this.cache.imageTemplates.length > 0
    );
  }

  // 检查数据是否已加载
  isDataLoaded(): boolean {
    return this.cache.isLoaded;
  }

  // 检查是否正在加载
  isDataLoading(): boolean {
    return this.cache.isLoading;
  }

  // 清空缓存（用于重新加载）
  clearCache(): void {
    console.log('[TemplateCache] Clearing all caches');
    this.cache = {
      allTemplates: null,
      imageTemplates: null,
      videoTemplates: null,
      expressionTemplates: null,
      danceTemplates: null,
      trendingStyles: null,
      trendingImageStyles: null,
      isLoaded: false,
      isLoading: false,
    };
    this.loadingPromise = null;
    this.lastLoadError = 0; // 重置错误冷却，允许 forceReload 立即重试
  }

  // Force reload data from database (bypassing cache)
  async forceReload(): Promise<void> {
    console.log('[TemplateCache] Force reloading all data from database');
    this.clearCache();
    await this.loadAllData();
  }
}

// 全局单例实例
export const templateDataManager = new TemplateDataManager();

// 便捷的钩子函数，用于在组件中使用
export const useTemplateData = () => {
  return templateDataManager;
};

// 监听模板数据变化的 hook，已移至 src/hooks/useTemplateDataChange.ts
// 此处保留 re-export 以维持向后兼容
export { useTemplateDataChange } from '../hooks/useTemplateDataChange';

// 初始化函数，在应用启动时调用
export const initializeTemplateData = async () => {
  await templateDataManager.loadAllData();
};
