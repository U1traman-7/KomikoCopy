import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// 工具名称映射
const TOOL_MAPPING: Record<string, string> = {
  playground: 'playground',
  'video-to-video': 'video-to-video',
  'ai-video-effect': 'ai-video-effect',
  'ai-animation-generator': 'ai-animation-generator',
  'ai-expression-changer': 'ai-expression-changer',
  'dance-video-generator': 'dance-video-generator',
};

const cleanTemplateId = (id: string): string => {
  return id.replace(/-(v|i)$/, '');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证 Cron 密钥
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startTime = Date.now();

    // 1. 获取所有模板
    const { data: templates, error: templatesError } = await supabase
      .from('style_templates')
      .select('id, support_v2v, support_playground');

    if (templatesError) {
      throw templatesError;
    }

    if (!templates || templates.length === 0) {
      return res.status(200).json({ message: 'No templates found', count: 0 });
    }

    // 2. 构建查询映射
    const toolStyleMap: Record<string, Set<string>> = {};
    const templateToolMap: Record<string, string[]> = {};

    templates.forEach(template => {
      const cleanId = cleanTemplateId(template.id);
      const tools: string[] = [];

      if (template.support_playground) tools.push('playground');
      if (template.support_v2v) tools.push('video-to-video');

      tools.push(
        'ai-video-effect',
        'ai-animation-generator',
        'ai-expression-changer',
        'dance-video-generator',
      );

      templateToolMap[template.id] = tools;

      tools.forEach(tool => {
        const dbTool = TOOL_MAPPING[tool] || tool;
        if (!toolStyleMap[dbTool]) {
          toolStyleMap[dbTool] = new Set();
        }
        toolStyleMap[dbTool].add(cleanId);
      });
    });

    // 3. 批量查询使用统计
    const usageStatsMap: Record<string, number> = {};

    const queries = Object.entries(toolStyleMap).map(
      async ([tool, styleIds]) => {
        const { data } = await supabase
          .from('style_usage_stats')
          .select('tool, style_id, usage_count')
          .eq('tool', tool)
          .in('style_id', Array.from(styleIds));

        if (data) {
          data.forEach(stat => {
            const key = `${stat.tool}-${stat.style_id}`;
            usageStatsMap[key] =
              (usageStatsMap[key] || 0) + (stat.usage_count || 0);
          });
        }
      },
    );

    await Promise.all(queries);

    // 4. 计算并批量更新
    const updates = templates.map(template => {
      const cleanId = cleanTemplateId(template.id);
      const tools = templateToolMap[template.id] || [];

      let totalUsage = 0;
      tools.forEach(tool => {
        const dbTool = TOOL_MAPPING[tool] || tool;
        const key = `${dbTool}-${cleanId}`;
        totalUsage += usageStatsMap[key] || 0;
      });

      return {
        id: template.id,
        usage_count: totalUsage,
      };
    });

    // 5. 逐个更新
    let updatedCount = 0;

    for (const update of updates) {
      const { error } = await supabase
        .from('style_templates')
        .update({ usage_count: update.usage_count })
        .eq('id', update.id);

      if (!error) {
        updatedCount++;
      }
    }

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: 'Template usage stats synced successfully',
      stats: {
        totalTemplates: templates.length,
        updatedTemplates: updatedCount,
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
