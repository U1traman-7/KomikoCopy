import { ERROR_CODES } from "../../_constants.js";
import { canGenerate, failedWithCode, MiddlewareFunc, unauthorized } from "../index.js";

export const canGenerateMiddleware: MiddlewareFunc = async (request: Request) => {
  try {

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return { success: false, response: unauthorized('Unauthorized') };
    }

    const tool = request.headers.get('x-generation-tool') ?? undefined;
    const model = request.headers.get('x-generation-model') ?? undefined;
    const result = await canGenerate({ userId, tool, model })

    if (result) {
      return { success: true }
    }
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') }
  } catch (e) {
    console.error(e);
    return { success: false, response: failedWithCode(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded') }
  }


}
