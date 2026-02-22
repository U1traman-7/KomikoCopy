export type MiddlewareResult = {
  success: boolean;
  response?: Response;
  cleanup?: (request: Request) => Promise<void>;
}

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
  log?: {
    cost?: number;
    tool?: string;
    model?: string;
    generationResult?: 0 | 2 | 4;
  }
};

export const TIMEOUT = 1000 * 60 * 4 + 30 * 1000; // 4.5 minutes
// export const TIMEOUT = 1000 * 5; // 5 seconds

const withHandler = (handler: ((request: RequestImproved) => Promise<Response>), middlewares?: ((request: Request) => Promise<MiddlewareResult>)[]) => {
  return async (request: Request) => {

    let cleanupList: ((request: Request) => Promise<void>)[] = [];
    try {
      middlewares = middlewares || [];
      for (const middleware of middlewares) {
        try {
          const result = await middleware(request);
          if (result.cleanup) {
            cleanupList.push(result.cleanup);
          }
          if (!result.success) {
            if (result.response) {
              return result.response;
            }
            break;
          }
        } catch (e) {
          console.error('Middleware error:', e);
          break;
        }
      }
      const promise = handler(request);
      const timeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout'));
        }, TIMEOUT);
      });
      const result = await Promise.race([promise, timeout]).catch((e) => {
        if (e instanceof Error && e.message === 'Timeout') {
          return new Response(JSON.stringify({ error: 'Timeout' }), {
            status: 504,
          })
        }
      });

      return result;
    } catch (e) {
      console.error('Handler error:', e);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
      })
    } finally {
      for (const cleanup of cleanupList) {
        try {
          cleanup(request);
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    }
  };
};

export default withHandler;
