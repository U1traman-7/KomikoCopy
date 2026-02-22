import {
  createSupabase,
  failed,
  getUserId,
  success,
  unauthorized,
} from '../_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
};

const supabase = createSupabase();

/**
 * POST /api/user/block
 * 屏蔽或取消屏蔽用户（用户级别的屏蔽，非管理员封禁）
 */
async function handler(request: RequestImproved) {
  const params = request.params;
  const { targetUserId, action } = params || {};
  const currentUserId = getUserId(request);

  if (!currentUserId) {
    return unauthorized('Unauthorized');
  }

  // 验证参数
  if (!targetUserId || typeof targetUserId !== 'string') {
    return failed('Target user ID is required');
  }

  if (!action || !['block', 'unblock'].includes(action)) {
    return failed('Action must be either "block" or "unblock"');
  }

  // 防止自我屏蔽
  if (currentUserId === targetUserId) {
    return failed('You cannot block yourself');
  }

  try {
    // 验证目标用户存在
    const { data: targetUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return failed('Target user not found');
    }

    if (action === 'block') {
      // 插入屏蔽记录
      const { error: blockError } = await supabase.from('user_blocks').insert({
        blocker_user_id: currentUserId,
        blocked_user_id: targetUserId,
      });

      if (blockError) {
        // 唯一约束冲突 - 已经屏蔽过了
        if (blockError.code === '23505') {
          return success({ message: 'User already blocked' });
        }
        console.error('Error blocking user:', blockError);
        return failed('Failed to block user');
      }

      return success({ message: 'User blocked successfully' });
    }
    // 删除屏蔽记录
    const { error: unblockError } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_user_id', currentUserId)
      .eq('blocked_user_id', targetUserId);

    if (unblockError) {
      console.error('Error unblocking user:', unblockError);
      return failed('Failed to unblock user');
    }

    return success({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error in user block handler:', error);
    return failed('Operation failed');
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
