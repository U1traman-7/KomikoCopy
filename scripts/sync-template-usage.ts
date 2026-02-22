/**
 * 同步脚本：将 style_usage_stats 表中的使用统计同步到 style_templates 表
 * 
 * 使用方式：
 * 1. 手动运行: npx tsx scripts/sync-template-usage.ts
 * 2. 定时任务: 添加到 cron job 或使用 Vercel Cron
 * 
 * 建议频率：每小时或每天一次
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 加载 .env 文件
config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// 工具名称映射：前端 tool -> 数据库 tool
const TOOL_MAPPING: Record<string, string> = {
  playground: 'playground',
  'video-to-video': 'video-to-video',
  'ai-video-effect': 'ai-video-effect',
  'ai-animation-generator': 'ai-animation-generator',
  'ai-expression-changer': 'ai-expression-changer',
  'dance-video-generator': 'dance-video-generator',
};

// Helper function to clean template ID suffix (-v or -i)
const cleanTemplateId = (id: string): string => {
  return id.replace(/-(v|i)$/, '');
};

async function syncTemplateUsageStats() {
  console.log('🚀 Starting template usage stats sync...');

  try {
    // 1. 获取所有 style_templates
    const { data: templates, error: templatesError } = await supabase
      .from('style_templates')
      .select('id, support_v2v, support_playground');

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    if (!templates || templates.length === 0) {
      console.log('⚠️  No templates found');
      return;
    }

    console.log(`📋 Found ${templates.length} templates`);

    // 2. 构建 toolStyleMap 用于批量查询
    const toolStyleMap: Record<string, Set<string>> = {};
    const templateToolMap: Record<string, string[]> = {}; // template_id -> [tools]

    templates.forEach(template => {
      const cleanId = cleanTemplateId(template.id);
      const tools: string[] = [];

      // 根据 support 字段判断可能使用的工具
      if (template.support_playground) {
        tools.push('playground');
      }
      if (template.support_v2v) {
        tools.push('video-to-video');
      }

      // 添加其他可能的工具（根据实际情况调整）
      const possibleTools = [
        'ai-video-effect',
        'ai-animation-generator',
        'ai-expression-changer',
        'dance-video-generator',
      ];

      tools.push(...possibleTools);

      templateToolMap[template.id] = tools;

      // 构建查询映射
      tools.forEach(tool => {
        const dbTool = TOOL_MAPPING[tool] || tool;
        if (!toolStyleMap[dbTool]) {
          toolStyleMap[dbTool] = new Set();
        }
        toolStyleMap[dbTool].add(cleanId);
      });
    });

    // 3. 批量查询所有工具的使用统计
    console.log('📊 Fetching usage stats from database...');
    const usageStatsMap: Record<string, number> = {};

    const queries = Object.entries(toolStyleMap).map(async ([tool, styleIds]) => {
      const { data, error } = await supabase
        .from('style_usage_stats')
        .select('tool, style_id, usage_count')
        .eq('tool', tool)
        .in('style_id', Array.from(styleIds));

      if (error) {
        console.error(`❌ Error fetching stats for tool ${tool}:`, error);
        return;
      }

      if (data) {
        data.forEach(stat => {
          const key = `${stat.tool}-${stat.style_id}`;
          // 累加不同工具的使用次数
          usageStatsMap[key] = (usageStatsMap[key] || 0) + (stat.usage_count || 0);
        });
      }
    });

    await Promise.all(queries);

    console.log(`✅ Fetched usage stats for ${Object.keys(usageStatsMap).length} style-tool combinations`);

    // 4. 计算每个模板的总使用次数并批量更新
    const updates: Array<{ id: string; usage_count: number }> = [];

    for (const template of templates) {
      const cleanId = cleanTemplateId(template.id);
      const tools = templateToolMap[template.id] || [];

      // 累加所有工具的使用次数
      let totalUsage = 0;
      tools.forEach(tool => {
        const dbTool = TOOL_MAPPING[tool] || tool;
        const key = `${dbTool}-${cleanId}`;
        totalUsage += usageStatsMap[key] || 0;
      });

      // 只更新有变化的记录
      updates.push({
        id: template.id,
        usage_count: totalUsage,
      });
    }

    // 5. 批量更新数据库
    console.log(`🔄 Updating ${updates.length} templates...`);
    
    let updatedCount = 0;
    let errorCount = 0;

    // 逐个更新（因为批量 update 需要逐个处理）
    for (const update of updates) {
      const { error } = await supabase
        .from('style_templates')
        .update({ usage_count: update.usage_count })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Error updating ${update.id}:`, error.message);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    console.log('\n✨ Sync completed!');
    console.log(`   Updated: ${updatedCount} templates`);
    console.log(`   Errors: ${errorCount} templates`);
    console.log(`   Total: ${updates.length} templates processed`);

    // 6. 显示 Top 10 最受欢迎的模板
    const topTemplates = updates
      .filter(t => t.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    if (topTemplates.length > 0) {
      console.log('\n🏆 Top 10 most popular templates:');
      topTemplates.forEach((t, idx) => {
        console.log(`   ${idx + 1}. ${cleanTemplateId(t.id)}: ${t.usage_count} uses`);
      });
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// 执行同步
syncTemplateUsageStats()
  .then(() => {
    console.log('\n✅ Script finished successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
