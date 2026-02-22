import { templateDataManager } from '../../../utils/templateCache';

export interface ExpressionTemplate {
  id: string;
  nameKey: string;
  image: string;
  i18n?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null;
}

// Expression templates from global cache (secure)
export const getExpressionTemplatesFromDB = async (): Promise<
  ExpressionTemplate[]
> => {
  // 首先尝试从全局缓存获取
  const cachedTemplates = templateDataManager.getExpressionTemplates();
  if (cachedTemplates && Array.isArray(cachedTemplates)) {
    // expression templates are directly returned as an array from the API
    return cachedTemplates.map(template => ({
      id: template.id,
      nameKey: template.name_key,
      image: template.url || '',
      i18n: (template as any).i18n || null,
    }));
  }

  // 如果缓存为空，尝试加载数据
  if (
    !templateDataManager.isDataLoaded() &&
    !templateDataManager.isDataLoading()
  ) {
    await templateDataManager.loadAllData();
    const expressionData = templateDataManager.getExpressionTemplates();
    if (expressionData && Array.isArray(expressionData)) {
      return expressionData.map(template => ({
        id: template.id,
        nameKey: template.name_key,
        image: template.url || '',
        i18n: (template as any).i18n || null,
      }));
    }
  }

  // 如果仍然无法获取数据，返回静态数据
  console.log('[ExpressionTemplates] Using static template fallback');
  return expressionTemplatesStatic;
};

// Static fallback data
const expressionTemplatesStatic: ExpressionTemplate[] = [
  {
    id: 'smile',
    nameKey: 'smile',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/smile.webp',
  },
  {
    id: 'villain-grin',
    nameKey: 'villainGrin',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/villain_grin.webp',
  },
  {
    id: 'very-angry-pouting',
    nameKey: 'veryAngry',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/very-angry.webp',
  },
  {
    id: 'upset',
    nameKey: 'upset',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/upset.webp',
  },
  {
    id: 'unconscious',
    nameKey: 'unconscious',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/unconscious.webp',
  },
  {
    id: 'triangle-mouth',
    nameKey: 'triangleMouth',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/triangle-mouth.webp',
  },
  {
    id: 'tiny-mouth',
    nameKey: 'tinyMouth',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/tiny_mouth.webp',
  },
  {
    id: 'sympathy',
    nameKey: 'sympathy',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/sympathy.webp',
  },
  {
    id: 'stunned',
    nameKey: 'stunned',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/stunned.webp',
  },
  {
    id: 'star-eyes',
    nameKey: 'starEyes',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/star-eyes.webp',
  },
  {
    id: 'speechless',
    nameKey: 'speechless',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/speechless.webp',
  },
  {
    id: 'sparkling-eyes',
    nameKey: 'sparklingEyes',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/sparkling-eyes.webp',
  },
  {
    id: 'smug',
    nameKey: 'smug',
    image: 'https://d31cygw67xifd4.cloudfront.net/styles/expressions/smug.webp',
  },
  {
    id: 'shy',
    nameKey: 'shy',
    image: 'https://d31cygw67xifd4.cloudfront.net/styles/expressions/shy.webp',
  },
  {
    id: 'shocked',
    nameKey: 'shocked',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/shocked.webp',
  },
  {
    id: 'shark-teeth',
    nameKey: 'sharkTeeth',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/shark-teeth.webp',
  },
  {
    id: 'scared',
    nameKey: 'scared',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/scared.webp',
  },
  {
    id: 'sassy',
    nameKey: 'sassy',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/sassy.webp',
  },
  {
    id: 'playful',
    nameKey: 'playful',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/playful.webp',
  },
  {
    id: 'no-mouth',
    nameKey: 'noMouth',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/no_mouth.webp',
  },
  {
    id: 'naughty',
    nameKey: 'naughty',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/naughty.webp',
  },
  {
    id: 'mad',
    nameKey: 'mad',
    image: 'https://d31cygw67xifd4.cloudfront.net/styles/expressions/mad.webp',
  },
  {
    id: 'kitty-mouth',
    nameKey: 'kittyMouth',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/kitty-mouth.webp',
  },
  {
    id: 'hungry',
    nameKey: 'hungry',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/hungry.webp',
  },
  {
    id: 'heart-eyes',
    nameKey: 'heartEyes',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/heart-eyes.webp',
  },
  {
    id: 'googly-eyes',
    nameKey: 'googlyEyes',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/googly-eyes.webp',
  },
  {
    id: 'frustration',
    nameKey: 'frustration',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/frustration.webp',
  },
  {
    id: 'fear',
    nameKey: 'fear',
    image: 'https://d31cygw67xifd4.cloudfront.net/styles/expressions/fear.webp',
  },
  {
    id: 'dizzy',
    nameKey: 'dizzy',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/dizzy.webp',
  },
  {
    id: 'disgust',
    nameKey: 'disgust',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/disgust.webp',
  },
  {
    id: 'derp-face',
    nameKey: 'derpFace',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/derp-face.webp',
  },
  {
    id: 'cry',
    nameKey: 'cry',
    image: 'https://d31cygw67xifd4.cloudfront.net/styles/expressions/cry.webp',
  },
  {
    id: 'beyond-words',
    nameKey: 'beyondWords',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/beyond-words.webp',
  },
  {
    id: 'awkward',
    nameKey: 'awkward',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/awkward.webp',
  },
  {
    id: 'angry',
    nameKey: 'angry',
    image:
      'https://d31cygw67xifd4.cloudfront.net/styles/expressions/angry.webp',
  },
];

// Initialize expression templates cache with static data, then load from DB
let expressionTemplatesCache: ExpressionTemplate[] = expressionTemplatesStatic;
let isExpressionDataLoaded = false;
let isExpressionDataLoading = false;

const initializeExpressionData = async () => {
  if (isExpressionDataLoaded) {
    console.log('[ExpressionTemplates] Data already loaded, skipping...');
    return expressionTemplatesCache;
  }

  if (isExpressionDataLoading) {
    console.log(
      '[ExpressionTemplates] Loading already in progress, skipping...',
    );
    return expressionTemplatesCache;
  }

  isExpressionDataLoading = true;

  try {
    const dbTemplates = await getExpressionTemplatesFromDB();
    expressionTemplatesCache = dbTemplates;
    isExpressionDataLoaded = true;
    console.log(
      '[ExpressionTemplates] Successfully loaded templates from database',
    );
    return dbTemplates;
  } catch (error) {
    console.error(
      '[ExpressionTemplates] Failed to load from database, using static fallback:',
      error,
    );
    isExpressionDataLoaded = true;
    return expressionTemplatesStatic;
  } finally {
    isExpressionDataLoading = false;
  }
};

// 不再立即执行初始化，改为按需加载
// initializeExpressionData();

// Default export returns current cached data (synchronous)
export const expressionTemplates: ExpressionTemplate[] =
  expressionTemplatesCache;

// Async function to get fresh expression data from database
export const getExpressionTemplatesAsync = async () => {
  // 先检查是否已经加载
  if (isExpressionDataLoaded) {
    return expressionTemplatesCache;
  }

  // 如果全局缓存已经加载，直接从全局缓存获取
  if (templateDataManager.isDataLoaded()) {
    const freshData = await getExpressionTemplatesFromDB();
    expressionTemplatesCache = freshData;
    isExpressionDataLoaded = true;
    updateExpressionMapping(freshData);
    return freshData;
  }

  // 否则调用初始化函数
  const result = await initializeExpressionData();
  updateExpressionMapping(result);
  return result;
};

// Precomputed mapping for quick lookup. Supports both raw id and `expression-<id>` keys
export const expressionNameKeyMapping: Record<string, string> = {};

// Function to update mapping when templates change
const updateExpressionMapping = (templates: ExpressionTemplate[]) => {
  // Clear existing mappings
  Object.keys(expressionNameKeyMapping).forEach(
    key => delete expressionNameKeyMapping[key],
  );

  // Add new mappings
  templates.forEach((template: ExpressionTemplate) => {
    expressionNameKeyMapping[template.id] = template.nameKey;
    expressionNameKeyMapping[`expression-${template.id}`] = template.nameKey;
  });
};

// Initialize mapping with current templates
updateExpressionMapping(expressionTemplatesCache);

// 不再立即更新mapping，改为在需要时才更新
// initializeExpressionData().then(templates => {
//   updateExpressionMapping(templates);
// });

export interface DanceTemplate {
  id: string;
  nameKey: string;
  video: string;
  displayVideo?: string; // 用于 UI 展示的视频 URL，如果有则优先使用
  duration: number;
  i18n?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null;
}

// 将数据库模板记录映射为 DanceTemplate
const mapToDanceTemplate = (template: any): DanceTemplate => ({
  id: template.id,
  nameKey: template.name_key,
  video: template.url || '',
  displayVideo: template.display_url || template.url || '',
  duration: template.metadata?.duration || 10,
  i18n: template.i18n || null,
});

// Dance templates from global cache (secure)
export const getDanceTemplatesFromDB = async (): Promise<DanceTemplate[]> => {
  // 首先尝试从全局缓存获取
  const cachedData = templateDataManager.getDanceTemplates();
  if (cachedData) {
    // Dance templates are returned as category object with templates array
    if (cachedData.templates && Array.isArray(cachedData.templates)) {
      console.log(
        '[DanceTemplates] Using cached database templates:',
        cachedData.templates.length,
      );
      return cachedData.templates.map(mapToDanceTemplate);
    }
    // Handle direct array case (fallback)
    if (Array.isArray(cachedData)) {
      console.log(
        '[DanceTemplates] Using cached database templates (array):',
        cachedData.length,
      );
      return cachedData.map(mapToDanceTemplate);
    }
  }

  // 如果缓存为空，尝试加载数据
  if (
    !templateDataManager.isDataLoaded() &&
    !templateDataManager.isDataLoading()
  ) {
    console.log('[DanceTemplates] Loading template data from database...');
    await templateDataManager.loadAllData();
    const danceData = templateDataManager.getDanceTemplates();
    if (danceData) {
      if (danceData.templates && Array.isArray(danceData.templates)) {
        console.log(
          '[DanceTemplates] Using fresh database templates:',
          danceData.templates.length,
        );
        return danceData.templates.map(mapToDanceTemplate);
      }
      if (Array.isArray(danceData)) {
        console.log(
          '[DanceTemplates] Using fresh database templates (array):',
          danceData.length,
        );
        return danceData.map(mapToDanceTemplate);
      }
    }
  }

  // 如果仍然无法获取数据，返回静态数据
  console.log('[DanceTemplates] Using static template fallback');
  return danceTemplatesStatic;
};

// Static fallback data
const danceTemplatesStatic: DanceTemplate[] = [
  {
    id: 'mirror-dance',
    nameKey: 'mirrorDance',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/natalie-reybolds-mirror-dance.webm',
    duration: 9,
  },
  {
    id: 'lonely-lonely',
    nameKey: 'lonelyLonely',
    video: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/lonely.webm',
    duration: 10,
  },
  {
    id: 'tyla-dance',
    nameKey: 'tylaDance',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/tyla-dance.webm',
    duration: 11,
  },
  {
    id: 'robot-dance',
    nameKey: 'robotDance',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/robot-dance.webm',
    duration: 29,
  },
  {
    id: 'ratomilton-dance',
    nameKey: 'ratomiltonDance',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/ratomilton-dance.webm',
    duration: 15,
  },
  {
    id: 'not-my-problem',
    nameKey: 'notMyProblem',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/not-my-problem.webm',
    duration: 11,
  },
  {
    id: 'like-jennie',
    nameKey: 'likeJennie',
    video:
      'https://d31cygw67xifd4.cloudfront.net/styles/motions/like-jennie.webm',
    duration: 24,
  },
  // {
  //   id: 'heels-dance',
  //   nameKey: 'heelsDance',
  //   video:
  //     'https://d31cygw67xifd4.cloudfront.net/styles/motions/heels-dance.webm',
  //   duration: 17,
  // },
  // {
  //   id: 'crispey-spray-dance',
  //   nameKey: 'crispeySprayDance',
  //   video:
  //     'https://d31cygw67xifd4.cloudfront.net/styles/motions/crispey-spray-dance.webm',
  //   duration: 13,
  // },
  // {
  //   id: 'come-bady-come',
  //   nameKey: 'comeBadyCome',
  //   video:
  //     'https://d31cygw67xifd4.cloudfront.net/styles/motions/come-bady-come.webm',
  //   duration: 13,
  // },
];

// Initialize dance templates cache with static data, then load from DB
let danceTemplatesCache: DanceTemplate[] = danceTemplatesStatic;
let isDanceDataLoaded = false;
let isDanceDataLoading = false;

const initializeDanceData = async () => {
  if (isDanceDataLoaded) {
    console.log('[DanceTemplates] Data already loaded, skipping...');
    return danceTemplatesCache;
  }

  if (isDanceDataLoading) {
    console.log('[DanceTemplates] Loading already in progress, skipping...');
    return danceTemplatesCache;
  }

  isDanceDataLoading = true;
  console.log('[DanceTemplates] Initializing dance template data...');

  try {
    const dbTemplates = await getDanceTemplatesFromDB();
    if (dbTemplates && Array.isArray(dbTemplates) && dbTemplates.length > 0) {
      danceTemplatesCache = dbTemplates;
      isDanceDataLoaded = true;
      console.log(
        '[DanceTemplates] Successfully loaded templates from database:',
        dbTemplates.length,
      );
      return dbTemplates;
    }
    console.log(
      '[DanceTemplates] No valid templates from DB, using static fallback',
    );
    isDanceDataLoaded = true;
    return danceTemplatesStatic;
  } catch (error) {
    console.error(
      '[DanceTemplates] Failed to load from database, using static fallback:',
      error,
    );
    isDanceDataLoaded = true;
    return danceTemplatesStatic;
  } finally {
    isDanceDataLoading = false;
  }
};

// 不再立即执行初始化，改为按需加载
// initializeDanceData();

// Default export returns current cached data (synchronous)
export const danceTemplates: DanceTemplate[] = danceTemplatesCache;

// Async function to get fresh dance data from database
export const getDanceTemplatesAsync = async () => {
  // 先检查是否已经加载并且有有效数据
  if (isDanceDataLoaded && danceTemplatesCache.length > 0) {
    console.log(
      '[DanceTemplates] Returning cached templates:',
      danceTemplatesCache.length,
    );
    return danceTemplatesCache;
  }

  // 如果全局缓存已经加载，直接从全局缓存获取
  if (templateDataManager.isDataLoaded()) {
    console.log('[DanceTemplates] Getting fresh data from global cache...');
    const freshData = await getDanceTemplatesFromDB();
    if (freshData && Array.isArray(freshData) && freshData.length > 0) {
      danceTemplatesCache = freshData;
      isDanceDataLoaded = true;
      updateDanceMapping(freshData);
      console.log('[DanceTemplates] Fresh data loaded:', freshData.length);
      return freshData;
    }
  }

  // 否则调用初始化函数
  console.log('[DanceTemplates] Initializing dance data...');
  const result = await initializeDanceData();
  updateDanceMapping(result);
  return result;
};

export const danceNameKeyMapping: Record<string, string> = {};

// Function to update dance mapping when templates change
const updateDanceMapping = (templates: DanceTemplate[]) => {
  // Clear existing mappings
  Object.keys(danceNameKeyMapping).forEach(
    key => delete danceNameKeyMapping[key],
  );

  // Add new mappings
  templates.forEach((template: DanceTemplate) => {
    danceNameKeyMapping[template.id] = template.nameKey;
  });
};

// Initialize mapping with current templates
updateDanceMapping(danceTemplatesCache);

// Synchronous getter functions for accessing latest cached data
// These ensure components always get the updated cache after database load
export const getDanceTemplatesSync = () => {
  // 优先从全局缓存获取最新数据
  const globalDanceData = templateDataManager.getDanceTemplates();
  if (globalDanceData && globalDanceData.length > 0) {
    // 将全局数据转换为本地缓存格式并更新本地缓存
    const transformed = globalDanceData.map(template => ({
      id: template.id,
      nameKey: template.name_key,
      video: template.url || '',
      displayVideo: template.display_url || template.url || '', // 优先使用 display_url，降级到 url
      prompt: template.prompt || '',
      duration: template.metadata?.duration || 5,
      hasAudio: template.metadata?.hasAudio !== false,
      i18n: (template as any).i18n || null,
    }));

    // 更新本地缓存
    danceTemplatesCache = transformed;
    isDanceDataLoaded = true;

    // 同步更新 danceNameKeyMapping，确保 PromptComp 能正确查找模板名称
    updateDanceMapping(transformed);

    return transformed;
  }

  // 如果全局缓存没有数据，但已经加载过本地缓存，返回本地缓存
  if (isDanceDataLoaded && danceTemplatesCache.length > 0) {
    return danceTemplatesCache;
  }

  // 否则尝试触发异步加载（但立即返回静态数据）
  if (!isDanceDataLoading && !isDanceDataLoaded) {
    // 异步加载数据（不等待结果）
    initializeDanceData().then(templates => {
      updateDanceMapping(templates);
    });
  }

  return danceTemplatesCache; // 返回当前缓存（可能是静态数据）
};

// 不再立即更新mapping，改为在需要时才更新
// initializeDanceData().then(templates => {
//   updateDanceMapping(templates);
// });
