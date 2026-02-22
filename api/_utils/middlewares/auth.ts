import { getAuthUserId, MiddlewareFunc as Middleware, unauthorized } from '../index.js';

export const authMiddleware: Middleware = async (request: Request) => {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return { success: false, response: unauthorized('Unauthorized') };
  }
  request.headers.set('x-user-id', userId);
  return { success: true };
};
