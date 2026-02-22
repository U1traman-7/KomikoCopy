import {
  createSupabase,
  failed,
  getUserId,
  success,
  unauthorized,
} from '../_utils/index.js';
import { authMiddleware } from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
};

const supabase = createSupabase();

/**
 * GET /api/user/check-block-relation?targetUserId=xxx
 * 检查当前用户与目标用户之间是否存在双向屏蔽关系
 * 只返回布尔值，不泄露具体屏蔽列表
 */
async function handler(request: RequestImproved) {
  const currentUserId = getUserId(request);

  if (!currentUserId) {
    return unauthorized('Unauthorized');
  }

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('targetUserId');

  if (!targetUserId || typeof targetUserId !== 'string') {
    return failed('Target user ID is required');
  }

  // 自己和自己不存在屏蔽关系
  if (currentUserId === targetUserId) {
    return success({ hasBlockRelation: false });
  }

  try {
    // 查询 user_blocks 表，检查任一方向是否存在屏蔽记录
    // 方向1: 当前用户屏蔽了目标用户
    // 方向2: 目标用户屏蔽了当前用户
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .or(
        `and(blocker_user_id.eq.${currentUserId},blocked_user_id.eq.${targetUserId}),and(blocker_user_id.eq.${targetUserId},blocked_user_id.eq.${currentUserId})`,
      )
      .limit(1);

    if (error) {
      console.error('Error checking block relation:', error);
      return failed('Failed to check block relation');
    }

    return success({ hasBlockRelation: (data?.length ?? 0) > 0 });
  } catch (error) {
    console.error('Error in check-block-relation handler:', error);
    return failed('Failed to check block relation');
  }
}

export const GET = withHandler(handler, [authMiddleware]);
