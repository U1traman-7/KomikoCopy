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
 * GET /api/user/blocked-list
 * 获取当前用户的屏蔽列表
 */
async function handler(request: RequestImproved) {
  const currentUserId = getUserId(request);

  if (!currentUserId) {
    return unauthorized('Unauthorized');
  }

  try {
    // 查询当前用户屏蔽的所有用户，JOIN User 表获取详细信息
    const { data, error } = await supabase
      .from('user_blocks')
      .select(
        `
        blocked_user_id,
        created_at,
        blocked_user:User!user_blocks_blocked_user_id_fkey (
          id,
          user_name,
          image,
          user_uniqid
        )
      `,
      )
      .eq('blocker_user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked users list:', error);
      return failed('Failed to fetch blocked users');
    }

    // 转换数据格式
    const blockedUsers = (data || [])
      .filter((item: any) => item.blocked_user)
      .map((item: any) => ({
        id: item.blocked_user.id,
        user_name: item.blocked_user.user_name,
        image: item.blocked_user.image,
        user_uniqid: item.blocked_user.user_uniqid,
        blocked_at: item.created_at,
      }));

    return success({ blockedUsers });
  } catch (error) {
    console.error('Error in blocked-list handler:', error);
    return failed('Failed to fetch blocked users');
  }
}

export const GET = withHandler(handler, [authMiddleware]);
