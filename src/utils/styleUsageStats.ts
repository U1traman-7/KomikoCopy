/**
 * Style 使用统计工具函数
 * 用于记录和查询各个工具中 style 的使用热度
 */

export interface StyleUsageStat {
  id: number;
  tool: string;
  style_id: string;
  usage_count: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * 记录 style 使用
 * @param tool - 工具名称
 * @param styleId - style ID
 *
 */
export async function recordStyleUsage(
  tool: string,
  styleId: string,
): Promise<boolean> {
  try {
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'record',
        tool,
        styleId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to record style usage:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error recording style usage:', error);
    return false;
  }
}

/**
 * 获取指定工具的 style 使用统计
 * @param tool - 工具名称
 * @param limit - 返回结果数量限制
 */
export async function getStyleStatsByTool(
  tool: string,
  limit: number = 50,
): Promise<StyleUsageStat[] | null> {
  try {
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getByTool',
        tool,
        limit,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get style stats:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting style stats:', error);
    return null;
  }
}

/**
 * 获取所有工具的热门 styles
 * @param limit - 返回结果数量限制
 */
export async function getTopStyles(
  limit: number = 20,
): Promise<StyleUsageStat[] | null> {
  try {
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getTopStyles',
        limit,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get top styles:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting top styles:', error);
    return null;
  }
}

/**
 * 获取指定 style 在所有工具中的使用统计
 * @param styleId - style ID
 */
export async function getStyleUsageAcrossTools(
  styleId: string,
): Promise<StyleUsageStat[] | null> {
  try {
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getByStyleId',
        styleId,
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to get style usage across tools:',
        response.statusText,
      );
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting style usage across tools:', error);
    return null;
  }
}

/**
 * 批量获取多个 style 的使用统计
 * @param tool - 工具名称
 * @param styleIds - style ID 数组
 */
export async function getBatchStyleStats(
  tool: string,
  styleIds: string[],
): Promise<StyleUsageStat[] | null> {
  try {
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getBatch',
        tool,
        styleIds,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get batch style stats:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting batch style stats:', error);
    return null;
  }
}

/**
 * 记录模板使用（直接 increment style_templates.usage_count）
 * 替代旧的 recordStyleUsage，不再需要 tool 维度
 */
export async function recordTemplateUsage(
  templateId: string,
): Promise<boolean> {
  try {
    const response = await fetch('/api/tools/increment-template-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error recording template usage:', error);
    return false;
  }
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
    const response = await fetch('/api/tools/style-usage-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getBatchMultiTool',
        toolStyleMap,
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to get batch multi-tool stats:',
        response.statusText,
      );
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting batch multi-tool stats:', error);
    return null;
  }
}

