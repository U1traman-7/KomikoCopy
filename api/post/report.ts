import {
  createSupabase,
  getUserId,
  success,
  failed,
  unauthorized,
} from '../_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { sendReportNotification } from '../_utils/lark.js';

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
};

const supabase = createSupabase();

// 允许的举报原因
const VALID_REASONS = [
  'inappropriate',
  'spam',
  'hate_speech',
  'violence',
  'copyright',
  'other',
];

// postId 的合法范围
const MAX_POST_ID = Number.MAX_SAFE_INTEGER;

async function handler(request: RequestImproved) {
  const params = request.params;
  const userId = getUserId(request);

  if (!userId) {
    return unauthorized('Unauthorized');
  }

  // 验证参数
  const { postId, reason } = params || {};

  if (
    !postId ||
    typeof postId !== 'number' ||
    postId <= 0 ||
    postId > MAX_POST_ID
  ) {
    return failed('Invalid post ID');
  }

  // 验证 reason
  const reportReason = reason || 'inappropriate';
  if (
    typeof reportReason !== 'string' ||
    !VALID_REASONS.includes(reportReason)
  ) {
    return failed('Invalid report reason');
  }

  // 验证帖子是否存在
  const { data: postData, error: postError } = await supabase
    .from('AppPosts')
    .select('id, uniqid, content, authUserId')
    .eq('id', postId)
    .single();

  if (postError || !postData) {
    return failed('Post not found');
  }

  // 不允许举报自己的帖子
  if (postData.authUserId === userId) {
    return failed('You cannot report your own post');
  }

  // 插入举报记录
  const { error: insertError } = await supabase.from('post_reports').insert({
    post_id: postId,
    reporter_user_id: userId,
    report_reason: reportReason,
  });

  if (insertError) {
    // 处理唯一约束冲突（重复举报）
    if (insertError.code === '23505') {
      return failed('You have already reported this post');
    }
    console.error('Error inserting report:', insertError);
    return failed('Failed to report post');
  }

  // 发送 Lark 通知
  // 获取举报者信息
  const { data: reporterData } = await supabase
    .from('User')
    .select('user_name, email')
    .eq('id', userId)
    .single();

  // 等待 Lark 通知发送完成（确保在 serverless 环境中不被中断）
  try {
    await sendReportNotification({
      postId,
      postUniqid: postData.uniqid,
      reporterName: reporterData?.user_name || 'Unknown',
      reporterEmail: reporterData?.email || 'Unknown',
      reason: reportReason,
      postContent: postData.content || undefined,
    });
  } catch (err: unknown) {
    // Lark 通知失败不影响举报功能
    console.error('Failed to send Lark notification:', err);
  }

  return success({ message: 'Post reported successfully' });
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
