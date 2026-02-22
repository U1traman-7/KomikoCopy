import { waitUntil } from "@vercel/functions";
import { ERROR_CODES, TASK_TYPES, TaskTypes } from "../../_constants.js";
import { createSupabase, failedWithCode, MiddlewareFunc, unauthorized } from "../index.js";
import { GenerationStatus } from "../../_constants.js";

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

export const tryGenerateHandlerTest = (type: TaskTypes) => async (request: RequestImproved) => {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return { success: false, response: unauthorized('Unauthorized') };
    }

    const supabase = createSupabase();
    const rpcName = process.env.MODE === 'development' ? 'try_generate_test' : 'try_generate';
    const { data: generationId, error } = await supabase
      .rpc(rpcName, {
        p_user_id: userId,
        p_type: type,
      });

    console.log('rate limit generationId', generationId);
    if (error) {
      console.error('Error checking rate limit:', error);
      console.log('rate limit exceeded 1');
      return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
    }
    request.headers.set('x-generation-id', generationId);
    const cleanup = async () => {
      console.log('generationId', generationId, JSON.stringify(request.log));
      if (!generationId) {
        console.error('Generation ID is not found');
        return;
      }
      waitUntil((async () => {
        const { error } = await supabase.from('user_generation_log')
          .update({
            status: request.log?.generationResult ?? GenerationStatus.FINISHED,
            consumed_credit: request.log?.cost || null,
            model: request.log?.model || null,
            tools: request.log?.tool || null,
          })
          .eq('id', generationId);
        if (error) {
          console.error('Error updating generation:', error);
        }
      })());
    }
    if (generationId) {
      return {
        success: true,
        cleanup: cleanup,
      };
    }
    console.log('rate limit exceeded 2', generationId, request?.headers?.get('x-generation-id'));
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  } catch (e) {
    console.error(e)
    console.log('rate limit exceeded 3');
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  }
}

export const tryGenerateHandler = (type: TaskTypes) => async (request: RequestImproved) => {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return { success: false, response: unauthorized('Unauthorized') };
    }

    return { success: true };

    const supabase = createSupabase();
    const rpcName = process.env.MODE === 'development' ? 'try_generate_test' : 'try_generate';
    const { data: generationId, error } = await supabase
      .rpc(rpcName, {
        p_user_id: userId,
        p_type: type,
      });

    console.log('rate limit generationId', generationId);
    if (error) {
      console.error('Error checking rate limit:', error);
      console.log('rate limit exceeded 1');
      return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
    }
    request.headers.set('x-generation-id', generationId);
    const cleanup = async () => {
      console.log('generationId', generationId, JSON.stringify(request.log));
      if (!generationId) {
        console.error('Generation ID is not found');
        return;
      }
      waitUntil((async () => {
        const { error } = await supabase.from('user_generation_log')
          .update({
            status: request.log?.generationResult ?? GenerationStatus.FINISHED,
            consumed_credit: request.log?.cost || null,
            model: request.log?.model || null,
            tools: request.log?.tool || null,
          })
          .eq('id', generationId);
        if (error) {
          console.error('Error updating generation:', error);
        }
      })());
    }
    if (generationId) {
      return {
        success: true,
        cleanup: cleanup,
      };
    }
    console.log('rate limit exceeded 2', generationId, request?.headers?.get('x-generation-id'));
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  } catch (e) {
    console.error(e)
    console.log('rate limit exceeded 3');
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  }
}
export const tryGenerateMiddleware: MiddlewareFunc = async (request) => {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return { success: false, response: unauthorized('Unauthorized') };
    }

    return { success: true };
    const tool = request.headers.get('x-generation-tool') ?? undefined;
    const model = request.headers.get('x-generation-model') ?? undefined;
    const supabase = createSupabase();
    const rpcName = process.env.NODE_ENV === 'development' ? 'try_generate_test' : 'try_generate';
    const { data: generationId, error } = await supabase
      .rpc(rpcName, {
        p_user_id: userId,
        p_tools: tool,
        p_model: model,
        p_type: TASK_TYPES.IMAGE,
      });

    console.log('rate limit generationId', generationId);

    if (error) {
      console.error('Error checking rate limit:', error);
      return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
    }
    const cleanup = async () => {
      if (!generationId) {
        return;
      }
      waitUntil((async () => {
        const { error } = await supabase.from('user_generation_log')
          .update({
            status: GenerationStatus.FINISHED,
          })
          .eq('id', generationId);
        if (error) {
          console.error('Error deleting generation:', error);
        }
      })());
    }
    if (generationId) {
      return {
        success: true,
        cleanup: cleanup,
      };
    }
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  } catch (e) {
    console.error(e)
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') };
  }
}
