import { createSupabase } from '../_utils/index.js';
import withHandler from '../_utils/withHandler.js';

const supabase = createSupabase();

/**
 * Lark 举报回调处理
 * 管理员通过 Lark 卡片按钮点击后跳转到此 API，执行隐藏帖子操作
 */
async function handler(request: Request) {
  const url = new URL(request.url);
  const postId = url.searchParams.get('postId');
  const action = url.searchParams.get('action');

  // 验证参数
  if (!postId || action !== 'hide') {
    return new Response(
      buildHtmlPage('Bad Request', 'Invalid request parameters.'),
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }

  const parsedPostId = parseInt(postId, 10);
  if (isNaN(parsedPostId) || parsedPostId <= 0) {
    return new Response(buildHtmlPage('Bad Request', 'Invalid post ID.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 隐藏帖子（设置 banned = true）
  const { error } = await supabase
    .from('AppPosts')
    .update({ banned: true })
    .eq('id', parsedPostId);

  if (error) {
    console.error('Error hiding post:', error);
    return new Response(
      buildHtmlPage(
        'Error',
        `Failed to hide post ${parsedPostId}. Error: ${error.message}`,
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }

  return new Response(
    buildHtmlPage(
      'Post Hidden',
      `Post ${parsedPostId} has been hidden successfully.`,
    ),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

/**
 * 构造简单的 HTML 响应页面
 */
function buildHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Komiko Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
    .card { max-width: 480px; margin: 0 auto; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { margin-bottom: 16px; color: #333; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

/**
 * 转义 HTML 特殊字符，防止 XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const GET = withHandler(handler, []);
