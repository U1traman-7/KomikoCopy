import { MiddlewareFunc as Middleware, failed } from '../index.js';

const ALLOWED_ORIGINS = ['https://komiko.app', 'https://komikoai.com'];

export const originMiddleware: Middleware = async (request: Request) => {
  // 仅在真正的生产部署下启用来源检查（Vercel preview 不检查）
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'
  const isProduction =
    process.env.NODE_ENV === 'production' && vercelEnv === 'production';

  if (!isProduction) {
    return { success: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 检查Origin header
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return { success: true };
  }

  // 如果没有Origin，检查Referer header
  if (referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;

    if (ALLOWED_ORIGINS.includes(refererOrigin)) {
      return { success: true };
    }
  }

  // 记录未授权的访问尝试
  console.warn(
    `[Origin Check] Unauthorized access attempt from origin: ${origin}, referer: ${referer}`,
  );

  return {
    success: false,
    response: new Response(
      JSON.stringify({ error: 'Access denied: Invalid origin' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    ),
  };
};
