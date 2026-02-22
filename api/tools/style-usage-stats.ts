import { createSupabase } from '../_utils/index.js';
import withHandler from '../_utils/withHandler.js';
import { bindParamsMiddleware } from '../_utils/middlewares/index.js';

// 初始化Supabase客户端
const supabase = createSupabase();

export interface StyleUsageStat {
  id?: number;
  tool: string;
  style_id: string;
  usage_count?: number;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 记录 style 使用（增加计数或创建新记录）
 * @param tool - 工具名称，如 'photo-to-anime', 'video-to-video', 'template-video-generator', 'image-to-video'
 * @param styleId - style ID，如 'anime', 'korean-manhwa', 'dance-1' 等
 */
export async function recordStyleUsage(tool: string, styleId: string) {
  if (!tool || !styleId) {
    console.error('Tool and styleId are required');
    return null;
  }

  try {
    // 使用 upsert 来插入或更新记录
    // 如果记录存在（基于 tool + style_id 的 UNIQUE 约束），则更新 usage_count 和 last_used_at
    // 如果不存在，则插入新记录
    const { data, error } = await supabase.rpc('increment_style_usage', {
      p_tool: tool,
      p_style_id: styleId,
    });

    if (error) {
      console.error('Error recording style usage:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordStyleUsage:', error);
    return null;
  }
}

/**
 * 获取指定工具的 style 使用统计（按使用次数降序）
 */
export async function getStyleStatsByTool(
  tool: string,
  limit: number = 50,
): Promise<StyleUsageStat[] | null> {
  const { data, error } = await supabase
    .from('style_usage_stats')
    .select('*')
    .eq('tool', tool)
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching style stats:', error);
    return null;
  }

  return data;
}

/**
 * 获取所有工具的热门 styles（跨工具统计）
 */
export async function getTopStyles(limit: number = 20): Promise<any[] | null> {
  const { data, error } = await supabase
    .from('style_usage_stats')
    .select('style_id, style_mode, tool, usage_count')
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top styles:', error);
    return null;
  }

  return data;
}

/**
 * 获取指定 style 的使用统计（跨工具）
 */
export async function getStyleUsageAcrossTools(
  styleId: string,
): Promise<StyleUsageStat[] | null> {
  const { data, error } = await supabase
    .from('style_usage_stats')
    .select('*')
    .eq('style_id', styleId)
    .order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching style usage across tools:', error);
    return null;
  }

  return data;
}

/**
 * 批量获取多个 style 的使用统计（指定工具）
 */
export async function getBatchStyleStats(
  tool: string,
  styleIds: string[],
): Promise<StyleUsageStat[] | null> {
  if (!tool || !styleIds || styleIds.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from('style_usage_stats')
    .select('*')
    .eq('tool', tool)
    .in('style_id', styleIds);

  if (error) {
    console.error('Error fetching batch style stats:', error);
    return null;
  }

  return data;
}

/**
 * 批量获取多个工具的多个 style 的使用统计
 * @param toolStyleMap - 工具和样式ID的映射，格式：{ tool: [styleId1, styleId2, ...] }
 * @returns 返回格式化的映射：{ "tool-styleId": usage_count }
 */
export async function getBatchMultiToolStats(
  toolStyleMap: Record<string, string[]>,
): Promise<Record<string, number> | null> {
  try {
    // 构建查询条件：(tool = 'playground' AND style_id IN [...]) OR (tool = 'videoToVideo' AND style_id IN [...])
    const queries = Object.entries(toolStyleMap).map(([tool, styleIds]) => {
      if (styleIds.length === 0) return null;
      return supabase
        .from('style_usage_stats')
        .select('tool, style_id, usage_count')
        .eq('tool', tool)
        .in('style_id', styleIds);
    });

    // 过滤掉空查询
    const validQueries = queries.filter(q => q !== null);
    if (validQueries.length === 0) {
      return {};
    }

    // 并行执行所有查询
    const results = await Promise.all(validQueries);

    // 合并结果到一个映射中
    const statsMap: Record<string, number> = {};
    results.forEach(result => {
      if (result.data) {
        result.data.forEach(stat => {
          const key = `${stat.tool}-${stat.style_id}`;
          statsMap[key] = stat.usage_count;
        });
      }
    });

    return statsMap;
  } catch (error) {
    console.error('Error fetching batch multi-tool stats:', error);
    return null;
  }
}

async function handler(request: Request) {
  try {
    const params = (request as any).params;
    const { method, tool, styleId, styleIds, limit, toolStyleMap } = params;

    switch (method) {
      case 'record':
        // 记录 style 使用（不需要权限验证，因为是在用户使用工具时自动触发）
        if (!tool || !styleId) {
          return new Response(
            JSON.stringify({ error: 'tool and styleId are required' }),
            { status: 400 },
          );
        }
        const recordResult = await recordStyleUsage(tool, styleId);
        return new Response(JSON.stringify({ data: recordResult }), {
          status: 200,
        });

      case 'getByTool':
        // 获取指定工具的统计
        if (!tool) {
          return new Response(JSON.stringify({ error: 'tool is required' }), {
            status: 400,
          });
        }
        const toolStats = await getStyleStatsByTool(tool, limit);
        return new Response(JSON.stringify({ data: toolStats }), {
          status: 200,
        });

      case 'getTopStyles':
        // 获取热门 styles
        const topStyles = await getTopStyles(limit);
        return new Response(JSON.stringify({ data: topStyles }), {
          status: 200,
        });

      case 'getByStyleId':
        // 获取指定 style 的跨工具统计
        if (!styleId) {
          return new Response(
            JSON.stringify({ error: 'styleId is required' }),
            { status: 400 },
          );
        }
        const styleStats = await getStyleUsageAcrossTools(styleId);
        return new Response(JSON.stringify({ data: styleStats }), {
          status: 200,
        });

      case 'getBatch':
        // 批量获取多个 style 的统计
        if (!tool || !styleIds || !Array.isArray(styleIds)) {
          return new Response(
            JSON.stringify({ error: 'tool and styleIds array are required' }),
            { status: 400 },
          );
        }
        const batchStats = await getBatchStyleStats(tool, styleIds);
        return new Response(JSON.stringify({ data: batchStats }), {
          status: 200,
        });

      case 'getBatchMultiTool':
        // 批量获取多个工具的多个 style 的统计
        if (!toolStyleMap || typeof toolStyleMap !== 'object') {
          return new Response(
            JSON.stringify({ error: 'toolStyleMap object is required' }),
            { status: 400 },
          );
        }
        const multiToolStats = await getBatchMultiToolStats(toolStyleMap);
        return new Response(JSON.stringify({ data: multiToolStats }), {
          status: 200,
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid method' }), {
          status: 400,
        });
    }
  } catch (error) {
    console.error('Error in style-usage-stats API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export const POST = withHandler(handler, [bindParamsMiddleware]);
