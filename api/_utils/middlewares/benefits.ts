import { ERROR_CODES } from '../../_constants.js';
import {
  createSupabase,
  failed,
  failedWithCode,
  MiddlewareFunc,
  unauthorized,
} from '../index.js';

export const benefitsHandler =
  (benefitType: number): MiddlewareFunc =>
  async (request: RequestImproved) => {
    const supabase = createSupabase();
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return { success: false, response: unauthorized('Unauthorized') };
    }

    const rpcName =
      process.env.MODE === 'development'
        ? 'consume_benefit_test'
        : 'consume_benefit';
    const { data, error } = await supabase.rpc(rpcName, {
      p_user_id: userId,
      p_benefit_type: benefitType,
    });
    // console.log(data, error, rpcName, '********');
    if (error) {
      console.error(error);
      return {
        success: false,
        response: failedWithCode(
          ERROR_CODES.CHARACTER_NOT_ENOUGH,
          'CHARACTER_NOT_ENOUGH',
        ),
      };
    }
    if (data) {
      return { success: true };
    }
    return {
      success: false,
      response: failedWithCode(
        ERROR_CODES.CHARACTER_NOT_ENOUGH,
        'CHARACTER_NOT_ENOUGH',
      ),
    };
  };
