import { createClient } from '@supabase/supabase-js';
import { T } from './_utils/templateTables.js';
import type {
  TemplateCategory,
  TemplateInputField,
  StyleTemplate,
} from '../src/types/template';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Cache for templates to reduce database calls - shortened for dynamic content updates
let templateCache: { [key: string]: any } = {};
let cacheTimestamp: { [key: string]: number } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds (reduced for template updates)

// Debug function to clear template cache
export const clearTemplateCache = () => {
  console.log('[getStyleTemplates] Clearing template cache');
  templateCache = {};
  cacheTimestamp = {};
};

// Helper function to clean template ID suffix (-v or -i)
const cleanTemplateId = (id: string): string => {
  return id.replace(/-(v|i)$/, '');
};

export type { TemplateCategory, TemplateInputField, StyleTemplate };

export async function getStyleTemplatesByType(type: 'image' | 'video') {
  // Check cache first
  const cacheKey = `templates_${type}`;
  if (
    templateCache[cacheKey] &&
    cacheTimestamp[cacheKey] &&
    Date.now() - cacheTimestamp[cacheKey] < CACHE_DURATION
  ) {
    return templateCache[cacheKey];
  }

  try {
    // Query 1: Get all categories for the specified type
    const { data: categoriesData, error: categoriesError } = await supabase
      .from(T.template_categories)
      .select(
        'id, type, name_key, icon, emoji, support_v2v, support_playground, "order"',
      )
      .eq('type', type)
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

    // Query 2: Get all templates with their category relations at once
    const { data: templatesData, error: templatesError } = await supabase
      .from(T.style_templates)
      .select(
        `
        id,
        type,
        name_key,
        url,
        display_url,
        is_pro_model,
        support_v2v,
        support_playground,
        prompt,
        ratio,
        input_media,
        metadata,
        need_middleware,
        "order",
        usage_count,
        created_at,
        ${T.template_category_relations}!inner(category_id, category_type)
      `,
      )
      .in(`${T.template_category_relations}.category_id`, categoryIds)
      .eq(`${T.template_category_relations}.category_type`, type);

    if (templatesError) {
      throw templatesError;
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
        .order('template_id, created_at');

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
          `[getStyleTemplatesByType] No valid category_id found for template:`,
          template.id,
        );
        return;
      }

      if (!categoryId) {
        console.warn(
          `[getStyleTemplatesByType] Empty category_id for template:`,
          template.id,
        );
        return;
      }

      if (!templatesByCategoryId[categoryId]) {
        templatesByCategoryId[categoryId] = [];
      }

      const cleanedTemplateId = cleanTemplateId(template.id);
      const characterInputs = characterInputsMap[cleanedTemplateId] || [];

      templatesByCategoryId[categoryId].push({
        ...template,
        id: cleanedTemplateId,
        character_inputs:
          characterInputs.length > 0 ? characterInputs : undefined,
      } as StyleTemplate);
    });

    // Sort templates by category: order (asc) -> usage_count (desc) -> created_at (asc)
    Object.keys(templatesByCategoryId).forEach(categoryId => {
      templatesByCategoryId[categoryId].sort((a, b) => {
        // 1. 首先按 order 排序（有 order 的在前）
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // 2. order 相同时，按 usage_count 降序排序
        const usageA = a.usage_count ?? 0;
        const usageB = b.usage_count ?? 0;

        if (usageA !== usageB) {
          return usageB - usageA; // 降序
        }

        // 3. 如果都没有 order 且 usage_count 相同，按 created_at 升序
        const createdA = new Date((a as any).created_at || 0).getTime();
        const createdB = new Date((b as any).created_at || 0).getTime();

        return createdA - createdB;
      });
    });

    // Build the final categories structure
    const categories: TemplateCategory[] = [];
    categoriesData?.forEach(category => {
      const templateCount = templatesByCategoryId[category.id]?.length || 0;

      categories.push({
        id: category.id,
        type: category.type,
        name_key: category.name_key,
        icon: category.icon,
        emoji: category.emoji,
        support_v2v: category.support_v2v,
        support_playground: category.support_playground,
        order: category.order,
        templates: templatesByCategoryId[category.id] || [],
      });
    });

    // Cache the result
    templateCache[cacheKey] = categories;
    cacheTimestamp[cacheKey] = Date.now();

    return categories;
  } catch (error) {
    console.error('Error fetching style templates:', error);
    throw error;
  }
}

export async function getTemplatePrompts(type: 'image' | 'video') {
  try {
    const { data, error } = await supabase
      .from(T.style_templates)
      .select('id, prompt')
      .eq('type', type);

    if (error) {
      throw error;
    }

    const prompts: { [key: string]: { prompt: string } } = {};

    for (const row of data || []) {
      prompts[cleanTemplateId(row.id)] = row.prompt;
    }

    return prompts;
  } catch (error) {
    console.error('Error fetching template prompts:', error);
    throw error;
  }
}

export async function getTrendingStyleIds(type?: 'image' | 'video') {
  try {
    let query = supabase
      .from(T.style_templates)
      .select('id')
      .eq('is_trending', true)
      .order('order', { ascending: true, nullsLast: true })
      .order('created_at', { ascending: false });

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data?.map(row => cleanTemplateId(row.id)) || [];
  } catch (error) {
    console.error('Error fetching trending styles:', error);
    // Return empty array as fallback
    return [];
  }
}

// Get templates by category name (e.g., 'characterExpression', 'dance')
export async function getTemplatesByCategory(categoryNameKey: string) {
  try {
    const { data: categoryData, error: categoryError } = await supabase
      .from(T.template_categories)
      .select(
        'id, type, name_key, icon, emoji, support_v2v, support_playground, "order"',
      )
      .eq('name_key', categoryNameKey);

    if (categoryError) {
      console.error(
        `[getTemplatesByCategory] Category error for ${categoryNameKey}:`,
        categoryError,
      );
      throw categoryError;
    }

    if (!categoryData || categoryData.length === 0) {
      return null;
    }

    const category = categoryData[0];

    // Get templates for this category
    const { data: templatesData, error: templatesError } = await supabase
      .from(T.style_templates)
      .select(
        `
        id,
        type,
        name_key,
        url,
        display_url,
        is_pro_model,
        support_v2v,
        support_playground,
        prompt,
        ratio,
        input_media,
        metadata,
        "order",
        usage_count,
        created_at,
        ${T.template_category_relations}!inner(category_id, category_type)
      `,
      )
      .eq(`${T.template_category_relations}.category_id`, category.id);

    if (templatesError) {
      console.error(
        `[getTemplatesByCategory] Templates error for category ${category.id}:`,
        templatesError,
      );
      throw templatesError;
    }

    const templates: StyleTemplate[] = [];

    // Extract template IDs for fetching character inputs in bulk
    const templateIds = templatesData?.map(template => template.id) || [];

    // Fetch all character inputs for all templates at once (bulk query)
    let characterInputsData: {
      template_id: string;
      input_field: string;
      placeholder: string | null;
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
        .order('template_id, created_at');

      if (inputsError) {
        throw inputsError;
      }

      characterInputsData = inputsData || [];
    }

    // Create a map of character inputs by template ID for O(1) lookup
    const characterInputsMap: { [templateId: string]: TemplateInputField[] } =
      {};
    characterInputsData.forEach(input => {
      if (!characterInputsMap[input.template_id]) {
        characterInputsMap[input.template_id] = [];
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

      characterInputsMap[input.template_id].push({
        input_field: input.input_field,
        placeholder: input.placeholder,
        type: (input.field_type as any) || 'text',
        ...(choiceData && {
          question: choiceData.question,
          choices: choiceData.choices || [],
        }),
      });
    });

    // Process templates with their character inputs
    for (const template of templatesData || []) {
      const characterInputs = characterInputsMap[template.id] || [];

      templates.push({
        ...template,
        id: cleanTemplateId(template.id),
        character_inputs:
          characterInputs.length > 0 ? characterInputs : undefined,
      });
    }

    // Sort templates: order (asc) -> usage_count (desc) -> created_at (asc)
    templates.sort((a, b) => {
      // 1. 首先按 order 排序（有 order 的在前）
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 2. order 相同时，按 usage_count 降序排序
      const usageA = a.usage_count ?? 0;
      const usageB = b.usage_count ?? 0;

      if (usageA !== usageB) {
        return usageB - usageA; // 降序
      }

      // 3. 如果都没有 order 且 usage_count 相同，按 created_at 升序
      const createdA = new Date((a as any).created_at || 0).getTime();
      const createdB = new Date((b as any).created_at || 0).getTime();

      return createdA - createdB;
    });

    const result = {
      id: category.id,
      type: category.type,
      name_key: category.name_key,
      icon: category.icon,
      emoji: category.emoji,
      support_v2v: category.support_v2v,
      support_playground: category.support_playground,
      order: category.order,
      templates,
    };

    return result;
  } catch (error) {
    console.error(
      `[getTemplatesByCategory] Error fetching templates for category ${categoryNameKey}:`,
      error,
    );
    throw error;
  }
}

// API Handler for Next.js App Router
export async function GET(request: Request) {
  try {
    // Parse query params
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const action = url.searchParams.get('action');

    // Handle different actions
    if (action === 'prompts') {
      if (!type || (type !== 'image' && type !== 'video')) {
        return new Response(
          JSON.stringify({ error: 'Invalid type. Must be "image" or "video"' }),
          { status: 400 },
        );
      }
      const prompts = await getTemplatePrompts(type as 'image' | 'video');
      return new Response(JSON.stringify(prompts), { status: 200 });
    }

    if (action === 'trending') {
      const trendingType = url.searchParams.get('trendingType') as
        | 'image'
        | 'video'
        | null;
      const trendingIds = await getTrendingStyleIds(trendingType || undefined);
      return new Response(JSON.stringify(trendingIds), { status: 200 });
    }

    // Handle category-specific requests
    if (category && typeof category === 'string') {
      try {
        const templates = await getTemplatesByCategory(category);
        if (!templates) {
          return new Response(JSON.stringify({ error: 'Category not found' }), {
            status: 404,
          });
        }
        return new Response(JSON.stringify(templates), { status: 200 });
      } catch (categoryError) {
        console.error(
          `[API] Error processing category ${category}:`,
          categoryError,
        );
        throw categoryError; // 重新抛出让外层捕获
      }
    }

    // Handle type-specific requests
    if (type && (type === 'image' || type === 'video')) {
      const templates = await getStyleTemplatesByType(type);
      return new Response(JSON.stringify(templates), { status: 200 });
    }

    // If no specific parameters, return error
    return new Response(
      JSON.stringify({
        error:
          'Missing parameters. Use ?type=image|video or ?category=category_name or ?action=prompts|trending',
      }),
      { status: 400 },
    );
  } catch (error) {
    console.error('API Error:', error);

    // 返回更详细的错误信息用于调试
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('Detailed error info:', {
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
