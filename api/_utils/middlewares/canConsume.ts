import { ERROR_CODES } from "../../_constants.js";
import { CreditModel } from "../../_models/credit.js";
import { failedWithCode, getUserId, MiddlewareFunc, unauthorized } from "../index.js";

export const canConsumeHandler: (cost: number) => MiddlewareFunc = (cost: number) => {
  return async (request: Request) => {
    const userId = getUserId(request);
    if (!userId) {
      return { success: false, response: unauthorized() };
    }
    const creditModel = new CreditModel(userId);
    const success = await creditModel.canConsume(cost);
    if (!success) {
      return { success: false, response: failedWithCode(ERROR_CODES.NOT_ENOUGH_ZAPS, 'not enough zaps') }
    }
    return { success: true };
  };
};
