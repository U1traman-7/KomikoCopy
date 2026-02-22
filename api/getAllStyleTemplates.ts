import { createClient } from '@supabase/supabase-js';
import { T } from './_utils/templateTables.js';
import type {
  TemplateType,
  TemplateCategory,
  TemplateInputField,
  StyleTemplate,
} from '../src/types/template';

// 公开只读 API，使用 anon key 是有意为之。
// 数据安全依赖 Supabase RLS 策略保护，无需 service_role key。
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Cache for templates to reduce database calls
let allTemplatesCache: TemplateCategory[] | null = null;
let allTemplatesCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Debug function to clear template cache
export const clearAllTemplatesCache = () => {
  console.log('[getAllStyleTemplates] Clearing template cache');
  allTemplatesCache = null;
  allTemplatesCacheTimestamp = 0;
};

// 统一排序: order 升序 (无 order 排最后) → usage_count 降序
const sortByOrderThenUsage = (
  a: { order?: number; usage_count?: number },
  b: { order?: number; usage_count?: number },
) => {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return (b.usage_count ?? 0) - (a.usage_count ?? 0);
};

// Helper function to create URL-friendly slug
// Always include type suffix to avoid conflicts between video and image templates with same name
const createUrlSlug = (id: string, type: string): string => {
  const baseName = id.replace(/-(v|i)$/, '');
  // Map type to URL-friendly suffix
  const typeSlugMap: { [key: string]: string } = {
    video: 'video',
    image: 'image',
    expression: 'expression',
    dance: 'dance',
  };
  const typeSuffix = typeSlugMap[type] || type;
  return `${baseName}-${typeSuffix}`;
};

// Helper function to clean template ID suffix (-v or -i) for display name
const cleanTemplateId = (id: string): string => id.replace(/-(v|i)$/, '');

export type { TemplateType, TemplateCategory, TemplateInputField, StyleTemplate };

/**
 * Get all style templates across all types (image, video, expression, dance)
 * Categories are sorted by order field
 * Templates within each category are sorted by order (asc) then usage_count (desc)
 * A virtual "Trending" category is added at the beginning with trending templates
 */
export async function getAllStyleTemplates(): Promise<TemplateCategory[]> {
  // Check cache first
  if (
    allTemplatesCache &&
    allTemplatesCacheTimestamp &&
    Date.now() - allTemplatesCacheTimestamp < CACHE_DURATION
  ) {
    return allTemplatesCache;
  }

  try {
    // Query 1: Get all categories (no type filter)
    const { data: categoriesData, error: categoriesError } = await supabase
      .from(T.template_categories)
      .select(
        'id, type, name_key, icon, emoji, support_v2v, support_playground, "order"',
      )
      .order('order', { ascending: true })
      .order('created_at', { ascending: true }); // Secondary sort for categories without order

    if (categoriesError) {
      throw categoriesError;
    }

    // Extract category IDs for filtering templates
    const categoryIds = categoriesData?.map(cat => cat.id) || [];

    if (categoryIds.length === 0) {
      return [];
    }

    // Query 2: Get all templates with their category relations at once (no type filter)
    // Also fetch is_trending field for creating the trending category
    // 先尝试带 i18n 字段查询；如果 i18n 列尚未创建，回退到不带 i18n 的查询
    const baseFields =
      'id, type, name_key, url, display_url, is_pro_model, support_v2v, support_playground, prompt, ratio, input_media, metadata, need_middleware, video_pipeline_type, "order", usage_count, description, is_trending';
    const relationJoin = `${T.template_category_relations}!inner(category_id, category_type)`;

    let templatesData: any[] | null = null;

    // 尝试带 i18n 字段的查询
    const withI18n = await supabase
      .from(T.style_templates)
      .select(`${baseFields}, i18n, ${relationJoin}`)
      .in(`${T.template_category_relations}.category_id`, categoryIds);

    if (!withI18n.error) {
      templatesData = withI18n.data;
    } else {
      // 只有列不存在时才回退到不带 i18n 的查询，其他错误直接抛出
      const msg = (withI18n.error.message || '').toLowerCase();
      const isColumnMissing =
        msg.includes('column') && msg.includes('does not exist');

      if (!isColumnMissing) {
        throw withI18n.error;
      }

      console.warn(
        '[getAllStyleTemplates] i18n column not found, falling back without i18n:',
        withI18n.error.message,
      );
      const withoutI18n = await supabase
        .from(T.style_templates)
        .select(`${baseFields}, ${relationJoin}`)
        .in(`${T.template_category_relations}.category_id`, categoryIds);

      if (withoutI18n.error) {
        throw withoutI18n.error;
      }
      templatesData = withoutI18n.data;
    }

    // Extract template IDs for fetching character inputs
    const templateIds = templatesData?.map(template => template.id) || [];

    // Query 3: Get all character inputs for all templates at once
    let characterInputsData: {
      template_id: string;
      input_field: string;
      placeholder: string;
      field_type?: string;
      choice_fields?: any;
    }[] = [];
    if (templateIds.length > 0) {
      const { data: inputsData, error: inputsError } = await supabase
        .from(T.template_character_inputs)
        .select(
          'template_id, input_field, placeholder, field_type, choice_fields',
        )
        .in('template_id', templateIds)
        .order('template_id', { ascending: true })
        .order('created_at', { ascending: true });

      if (inputsError) {
        throw inputsError;
      }

      characterInputsData = inputsData || [];
    }

    // Create a map of character inputs by template ID for O(1) lookup
    // Use cleaned template IDs as keys to match the final template structure
    const characterInputsMap: { [templateId: string]: TemplateInputField[] } =
      {};
    characterInputsData.forEach(input => {
      const cleanedId = cleanTemplateId(input.template_id);
      if (!characterInputsMap[cleanedId]) {
        characterInputsMap[cleanedId] = [];
      }

      // Parse choice fields for choice-type inputs
      let choiceData: {
        question?: string;
        choices?: Array<{ value: string; label: string }>;
      } | null = null;
      if (input.field_type === 'choice' && input.choice_fields) {
        try {
          const rawChoiceData =
            typeof input.choice_fields === 'string'
              ? JSON.parse(input.choice_fields)
              : input.choice_fields;

          // Support both 'options' and 'choices' field names for backward compatibility
          const optionsArray =
            rawChoiceData.options || rawChoiceData.choices || [];

          choiceData = {
            question: rawChoiceData.question,
            choices: optionsArray,
          };
        } catch (error) {
          console.error('Failed to parse choice_fields:', error);
        }
      }

      characterInputsMap[cleanedId].push({
        input_field: input.input_field,
        placeholder: input.placeholder || '',
        type: (input.field_type as any) || 'text',
        ...(choiceData && {
          question: choiceData.question,
          choices: choiceData.choices || [],
        }),
      });
    });

    // Create a map of templates by category ID for efficient grouping
    const templatesByCategoryId: { [categoryId: string]: StyleTemplate[] } = {};

    templatesData?.forEach(template => {
      // 不在后端过滤，返回所有模板，让前端自己根据需要筛选
      // Handle different possible structures of template_category_relations
      let categoryId: string;
      const relations = (template as any)[T.template_category_relations];

      if (Array.isArray(relations)) {
        // If it's an array, take the first one
        categoryId = relations[0]?.category_id;
      } else if (relations?.category_id) {
        // If it's an object
        categoryId = relations.category_id;
      } else {
        console.warn(
          '[getAllStyleTemplates] No valid category_id found for template:',
          template.id,
        );
        return;
      }

      if (!categoryId) {
        console.warn(
          '[getAllStyleTemplates] Empty category_id for template:',
          template.id,
        );
        return;
      }

      if (!templatesByCategoryId[categoryId]) {
        templatesByCategoryId[categoryId] = [];
      }

      const displayName = cleanTemplateId(template.id);
      const urlSlug = createUrlSlug(template.id, template.type);
      const characterInputs = characterInputsMap[displayName] || [];

      templatesByCategoryId[categoryId].push({
        ...template,
        id: template.id, // 保留原始 ID 用于 API 调用
        urlSlug, // URL 友好的 slug
        displayName, // 显示名称
        character_inputs:
          characterInputs.length > 0 ? characterInputs : undefined,
      } as StyleTemplate);
    });

    // Build the final categories structure, merging categories with the same name_key
    // This allows video and image templates with the same category name to appear in one row
    const mergedCategoriesMap: Map<string, TemplateCategory> = new Map();

    categoriesData?.forEach(category => {
      const nameKey = category.name_key;
      const templates = templatesByCategoryId[category.id] || [];

      if (mergedCategoriesMap.has(nameKey)) {
        // Merge templates into existing category
        const existingCategory = mergedCategoriesMap.get(nameKey)!;

        // Deduplicate templates by id to avoid duplicates when same template exists in multiple categories
        const existingTemplateIds = new Set(
          existingCategory.templates.map(t => t.id),
        );
        const uniqueNewTemplates = templates.filter(
          t => !existingTemplateIds.has(t.id),
        );
        existingCategory.templates.push(...uniqueNewTemplates);

        // Update support flags (if any category supports it, the merged one should too)
        existingCategory.support_v2v =
          existingCategory.support_v2v || category.support_v2v;
        existingCategory.support_playground =
          existingCategory.support_playground || category.support_playground;

        // Keep the smaller order value (higher priority)
        if (
          category.order !== undefined &&
          (existingCategory.order === undefined ||
            category.order < existingCategory.order)
        ) {
          existingCategory.order = category.order;
        }

        // Prefer non-null emoji/icon
        if (!existingCategory.emoji && category.emoji) {
          existingCategory.emoji = category.emoji;
        }
        if (!existingCategory.icon && category.icon) {
          existingCategory.icon = category.icon;
        }
      } else {
        // Create new merged category
        mergedCategoriesMap.set(nameKey, {
          id: category.id, // Use first category's ID
          type: 'mixed' as TemplateType, // Mark as mixed since it may contain multiple types
          name_key: nameKey,
          icon: category.icon,
          emoji: category.emoji,
          support_v2v: category.support_v2v,
          support_playground: category.support_playground,
          order: category.order,
          templates: [...templates],
        });
      }
    });

    // Convert map to array and filter out empty categories
    // Only keep categories that have at least one template
    const categories = Array.from(mergedCategoriesMap.values()).filter(
      category => category.templates && category.templates.length > 0,
    );

    // Sort merged categories by order
    categories.sort(sortByOrderThenUsage);

    // Re-sort templates within each merged category
    categories.forEach(category => {
      category.templates.sort(sortByOrderThenUsage);
    });

    // Create virtual "Trending" category from templates with is_trending=true
    // Collect all trending templates from templatesData
    const trendingTemplates: StyleTemplate[] = [];
    const seenTrendingIds = new Set<string>();

    templatesData?.forEach(template => {
      if ((template as any).is_trending === true) {
        const displayName = cleanTemplateId(template.id);
        // Deduplicate by displayName to avoid showing same template twice
        if (!seenTrendingIds.has(displayName)) {
          seenTrendingIds.add(displayName);
          const urlSlug = createUrlSlug(template.id, template.type);
          const characterInputs = characterInputsMap[displayName] || [];

          trendingTemplates.push({
            ...template,
            id: template.id,
            urlSlug,
            displayName,
            character_inputs:
              characterInputs.length > 0 ? characterInputs : undefined,
          } as StyleTemplate);
        }
      }
    });

    // Sort trending templates by order (asc) then usage_count (desc)
    trendingTemplates.sort(sortByOrderThenUsage);

    // If there are trending templates, create the Trending category and insert at the beginning
    if (trendingTemplates.length > 0) {
      const trendingCategory: TemplateCategory = {
        id: 'trending', // Virtual ID for trending category
        type: 'mixed' as TemplateType,
        name_key: 'trending',
        emoji: '\uD83D\uDD25', // Fire emoji
        support_v2v: true,
        support_playground: true,
        order: -1, // Ensure it's always first
        templates: trendingTemplates,
      };

      // Insert trending category at the beginning
      categories.unshift(trendingCategory);
    }

    // Cache the result
    allTemplatesCache = categories;
    allTemplatesCacheTimestamp = Date.now();

    return categories;
  } catch (error) {
    console.error(
      '[getAllStyleTemplates] Error fetching style templates:',
      error,
    );
    throw error;
  }
}

// API Handler for Next.js App Router
export async function GET(request: Request) {
  try {
    const templates = await getAllStyleTemplates();
    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache control: allow browser and CDN caching for 5 minutes
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[getAllStyleTemplates] API Error:', error);

    // 返回更详细的错误信息用于调试
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('[getAllStyleTemplates] Detailed error info:', {
      message: errorMessage,
      stack: errorStack,
      url: request?.url,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage,
        }),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
