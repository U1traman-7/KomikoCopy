/**
 * 模板排序工具函数
 * 用于前端筛选和排序模板
 * 排序规则：先按 order 升序，再按 usage_count 降序
 */

/**
 * 模板接口定义 (最小化，用于排序)
 */
export interface SortableTemplate {
  id: string;
  order?: number | null;
  usage_count?: number | null;
  [key: string]: any; // 允许其他字段
}

/**
 * 对模板数组进行排序
 * 排序规则:
 * 1. 首先按 order 排序（有 order 的在前，order 值小的在前）
 * 2. order 相同时，按 usage_count 降序排序
 *
 * @param templates - 待排序的模板数组
 * @returns 排序后的模板数组（新数组，不修改原数组）
 */
export const sortTemplatesByUsage = <T extends SortableTemplate>(
  templates: T[],
): T[] => {
  // 创建副本以避免修改原数组
  const sorted = [...templates];

  sorted.sort((a, b) => {
    // 1. 首先按 order 排序（有 order 的在前）
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2. order 相同时，按 usage_count 降序排序
    const usageA = a.usage_count ?? 0;
    const usageB = b.usage_count ?? 0;

    return usageB - usageA; // 降序
  });

  return sorted;
};

/**
 * 对分类中的模板进行排序
 * 用于处理包含模板数组的分类对象
 *
 * @param categories - 分类数组，每个分类包含 templates 字段
 * @returns 排序后的分类数组（模板已排序）
 */
export const sortCategoryTemplates = <
  T extends { templates: SortableTemplate[] },
>(
  categories: T[],
): T[] => {
  return categories.map(category => ({
    ...category,
    templates: sortTemplatesByUsage(category.templates),
  }));
};

/**
 * 按类型筛选分类
 *
 * @param categories - 分类数组
 * @param type - 要筛选的类型 (image, video, expression, dance)
 * @returns 筛选后的分类数组
 */
export const filterCategoriesByType = <T extends { type: string }>(
  categories: T[],
  type: string,
): T[] => {
  return categories.filter(category => category.type === type);
};

/**
 * 从所有分类中提取所有模板（扁平化）
 *
 * @param categories - 分类数组
 * @returns 所有模板的扁平数组
 */
export const flattenTemplates = <T extends { templates: any[] }>(
  categories: T[],
): T['templates'][number][] => {
  return categories.flatMap(category => category.templates);
};

/**
 * 根据模板 ID、urlSlug 或 displayName 查找模板
 *
 * @param categories - 分类数组
 * @param identifier - 要查找的模板 ID、urlSlug 或 displayName
 * @returns 找到的模板，或 undefined
 */
export const findTemplateById = <
  T extends {
    templates: Array<{ id: string; urlSlug?: string; displayName?: string }>;
  },
>(
  categories: T[],
  identifier: string,
): T['templates'][number] | undefined => {
  for (const category of categories) {
    const template = category.templates.find(
      t =>
        t.id === identifier ||
        t.urlSlug === identifier ||
        t.displayName === identifier,
    );
    if (template) {
      return template;
    }
  }
  return undefined;
};

/**
 * 创建模板映射（支持通过 id、urlSlug、displayName 查找）
 *
 * @param categories - 分类数组
 * @returns 模板映射对象（键包含 id、urlSlug、displayName）
 */
export const createTemplateMap = <
  T extends {
    templates: Array<{ id: string; urlSlug?: string; displayName?: string }>;
  },
>(
  categories: T[],
): Map<string, T['templates'][number]> => {
  const map = new Map<string, T['templates'][number]>();

  categories.forEach(category => {
    category.templates.forEach(template => {
      // 使用多个键映射到同一模板
      if (!map.has(template.id)) {
        map.set(template.id, template);
      }
      if (template.urlSlug && !map.has(template.urlSlug)) {
        map.set(template.urlSlug, template);
      }
      if (template.displayName && !map.has(template.displayName)) {
        map.set(template.displayName, template);
      }
    });
  });

  return map;
};
