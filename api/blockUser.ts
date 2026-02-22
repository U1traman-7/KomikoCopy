import { ERROR_CODES } from './_constants.js';
import Roles from './_models/roles.js';
import {
  createSupabase,
  failedWithCode,
  getUserId,
  success,
  unauthorized,
} from './_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from './_utils/middlewares/index.js';
import withHandler from './_utils/withHandler.js';

const supabase = createSupabase();

async function handler(request: RequestImproved) {
  const params = request.params;
  const { user_uniqid, action } = params;
  const userId = getUserId(request);

  if (!user_uniqid) {
    return failedWithCode(
      ERROR_CODES.USER_NOT_FOUND,
      'User unique ID is required',
    );
  }

  if (!action || !['block', 'unblock'].includes(action)) {
    return failedWithCode(
      ERROR_CODES.INVALID_REQUEST,
      'Action must be either "block" or "unblock"',
    );
  }

  if (!userId) {
    return unauthorized('Unauthorized');
  }

  // 检查管理员权限
  const roles = new Roles(userId);
  await roles.getRoles();
  const isAdmin = roles.isAdmin();
  if (!isAdmin) {
    return failedWithCode(ERROR_CODES.USER_OPERATION_FORBIDDEN, 'Forbidden');
  }

  try {
    // 根据user_uniqid查找用户
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('user_uniqid', user_uniqid)
      .single();

    if (userError || !userData) {
      return failedWithCode(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    const targetUserId = userData.id;

    if (action === 'block') {
      // 封禁用户：插入blocked_users记录
      const { error: blockError } = await supabase
        .from('blocked_users')
        .insert({ user_id: targetUserId });

      if (blockError) {
        // 如果用户已经被封禁，忽略错误
        if (blockError.code === '23505') {
          // unique constraint violation
          console.log('User already blocked:', user_uniqid);
        } else {
          console.error('Error blocking user:', blockError);
          return failedWithCode(
            ERROR_CODES.USER_OPERATION_FAILED,
            'Failed to block user',
          );
        }
      }

      // 批量更新该用户的所有post为banned=true
      await updateUserPostsBannedStatus(targetUserId, true);
    } else if (action === 'unblock') {
      // 解封用户：删除blocked_users记录
      const { error: unblockError } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', targetUserId);

      if (unblockError) {
        console.error('Error unblocking user:', unblockError);
        return failedWithCode(
          ERROR_CODES.USER_OPERATION_FAILED,
          'Failed to unblock user',
        );
      }

      // 批量更新该用户的所有post为banned=false
      await updateUserPostsBannedStatus(targetUserId, false);
    }

    return success({ message: `User ${action}ed successfully` });
  } catch (error) {
    console.error('Error in blockUser handler:', error);
    return failedWithCode(
      ERROR_CODES.USER_OPERATION_FAILED,
      'Operation failed',
    );
  }
}

// 分页更新用户所有post的banned状态
async function updateUserPostsBannedStatus(userId: string, banned: boolean) {
  const pageSize = 100; // Supabase单次查询限制
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // 按id倒序分页查询用户的posts
    const { data: posts, error } = await supabase
      .from('AppPosts')
      .select('id')
      .eq('authUserId', userId)
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching user posts:', error);
      break;
    }

    if (!posts || posts.length === 0) {
      hasMore = false;
      break;
    }

    // 批量更新banned状态
    const postIds = posts.map(post => post.id);
    const { error: updateError } = await supabase
      .from('AppPosts')
      .update({ banned })
      .in('id', postIds);

    console.log('postIds', postIds);

    if (updateError) {
      console.error('Error updating posts banned status:', updateError);
      break;
    }

    console.log(
      `Updated ${posts.length} posts for user ${userId}, banned: ${banned}`,
    );

    // 如果返回的记录数少于pageSize，说明已经到最后一页
    if (posts.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }
}

// GET请求处理函数 - 检查用户是否被屏蔽
async function getHandler(request: RequestImproved) {
  // const params = request.params;
  // const { user_uniqid } = params;
  const searchParams = new URL(request.url).searchParams;
  const user_uniqid = searchParams.get('user_uniqid');

  if (!user_uniqid) {
    return failedWithCode(
      ERROR_CODES.USER_NOT_FOUND,
      'User unique ID is required',
    );
  }

  try {
    // 根据user_uniqid查找用户
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('user_uniqid', user_uniqid)
      .single();

    if (userError || !userData) {
      return failedWithCode(ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    const targetUserId = userData.id;

    // 检查blocked_users表中是否存在该用户
    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_users')
      .select('user_id')
      .eq('user_id', targetUserId)
      .single();

    const isBlocked = !blockedError && !!blockedData;

    return success({ blocked: isBlocked });
  } catch (error) {
    console.error('Error in getHandler:', error);
    return failedWithCode(
      ERROR_CODES.USER_OPERATION_FAILED,
      'Operation failed',
    );
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);

export const GET = withHandler(getHandler, [authMiddleware]);
