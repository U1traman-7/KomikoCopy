import { createSupabase } from '../_utils/index.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import { bindParamsMiddleware } from '../_utils/middlewares/index.js';
import { T } from '../_utils/templateTables.js';

const supabase = createSupabase();

async function handler(request: Request) {
  try {
    const params = (request as any).params;
    const { templateId } = params;

    if (!templateId || typeof templateId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'templateId is required' }),
        { status: 400 },
      );
    }

    // 使用 RPC 进行原子增量，避免 read-then-write 竞态条件丢失计数
    // increment_style_template_usage 在数据库中执行 UPDATE SET usage_count = usage_count + 1
    const { error: rpcError } = await supabase.rpc(
      'increment_style_template_usage',
      { p_template_id: templateId },
    );

    if (rpcError) {
      // 如果 RPC 不存在或执行失败，回退到 read-then-write 方式
      // NOTE: 回退方式存在竞态条件，并发请求可能导致计数丢失
      // TODO: 在数据库中创建 increment_style_template_usage RPC 函数以彻底解决
      console.warn(
        'RPC increment_style_template_usage failed, falling back to read-then-write:',
        rpcError.message,
      );

      const { data, error: fetchError } = await supabase
        .from(T.style_templates)
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (fetchError || !data) {
        console.error('Error fetching template usage_count:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Template not found' }),
          { status: 404 },
        );
      }

      const { error: updateError } = await supabase
        .from(T.style_templates)
        .update({ usage_count: (data.usage_count || 0) + 1 })
        .eq('id', templateId);

      if (updateError) {
        console.error('Error updating template usage_count:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update usage count' }),
          { status: 500 },
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error in increment-template-usage API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 },
    );
  }
}

export const POST = withHandler(handler, [authMiddleware, bindParamsMiddleware]);
