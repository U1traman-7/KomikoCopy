/**
 * GET /api/explore/popular-tags
 *
 * 获取热门 Tags 列表（带随机性）
 * 用于 MoreAITools 组件的推荐数据源
 *
 * 注意：此 API 用于公开展示区域，强制过滤所有 NSFW 内容，不依赖用户 Cookie
 *
 * Query Parameters:
 *   - limit: 返回数量限制，默认 200，最大 500
 *
 * Response:
 *   {
 *     code: 1,
 *     message: 'success',
 *     data: [
 *       { id, name, post_count, logo_url, popularity, is_nsfw }
 *     ]
 *   }
 */
import { createSupabase, success, failed } from '../_utils/index.js';
import { shuffleArray } from '../_utils/array.js';
import withHandler from '../_utils/withHandler.js';

// 最大允许的 limit 值
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;
// 查询池倍数：从更大的池中随机选择，增加多样性
const POOL_MULTIPLIER = 3;

const handler = async (request: Request) => {
  try {
    const supabase = createSupabase();
    const url = new URL(request.url);

    // 解析 limit 参数，限制在合理范围内
    let limit = parseInt(
      url.searchParams.get('limit') || String(DEFAULT_LIMIT),
    );
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // 查询更大的池以增加随机性
    const poolSize = Math.min(limit * POOL_MULTIPLIER, 1000);

    // 构建查询
    // 注意：强制过滤 NSFW 内容，此 API 用于公开展示区域
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name, post_count, logo_url, popularity, is_nsfw')
      .gt('post_count', 0)
      .eq('is_nsfw', false) // 强制只返回 SFW 内容
      .order('post_count', { ascending: false })
      .limit(poolSize);

    if (error) {
      console.error('Error fetching popular tags:', error);
      return failed('Failed to fetch popular tags');
    }

    // 随机打乱结果，然后取前 limit 个
    const shuffledTags = shuffleArray(tags || []).slice(0, limit);

    return success(shuffledTags);
  } catch (error) {
    console.error('Unexpected error in popular-tags:', error);
    return failed('Internal server error');
  }
};

export const GET = withHandler(handler);
