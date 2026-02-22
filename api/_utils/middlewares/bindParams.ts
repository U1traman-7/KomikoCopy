import { MiddlewareFunc } from "../index.js";

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

export const bindParamsMiddleware: MiddlewareFunc = async (request: RequestImproved) => {
  try {
    if(!request.params) {
      // Check if request has a body
      const hasBody = request.body !== null && request.body !== undefined;
      
      if (!hasBody) {
        return { success: false, response: new Response(JSON.stringify({ error: 'No request body' }), { status: 400 }) };
      }
      
      try {
        request.params = await request.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        return { success: false, response: new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), { status: 400 }) };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in bindParamsMiddleware:', error);
    return { success: false, response: new Response(JSON.stringify({ error: 'Internal server error in parameter binding' }), { status: 500 }) };
  }
}

