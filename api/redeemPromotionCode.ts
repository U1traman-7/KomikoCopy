import {
  createSupabase,
  failedWithCode,
  success,
  unauthorized,
} from './_utils/index.js';
import { getAuthUserId } from './tools/image-generation.js';

const ERROR_RESPONSES = {
  CODE_REQUIRED: { code: 4001, message: 'promotion_code_required' },
  USER_NOT_FOUND: { code: 4002, message: 'user_not_found' },
  CODE_NOT_FOUND: { code: 4101, message: 'promotion_code_not_found' },
  CODE_NOT_ACTIVE: { code: 4102, message: 'promotion_code_not_active' },
  CODE_EXPIRED: { code: 4103, message: 'promotion_code_expired' },
  CODE_USAGE_LIMIT: { code: 4104, message: 'promotion_code_usage_limit' },
  CODE_USER_LIMIT: { code: 4105, message: 'promotion_code_user_limit' },
  UPDATE_FAILED: { code: 4106, message: 'promotion_code_update_failed' },
  UNKNOWN: { code: 5001, message: 'promotion_code_unknown_error' },
} as const;

type ErrorKey = keyof typeof ERROR_RESPONSES;

const rpcErrorMap: Record<string, ErrorKey> = {
  PROMOTION_CODE_REQUIRED: 'CODE_REQUIRED',
  PROMOTION_CODE_NOT_FOUND: 'CODE_NOT_FOUND',
  PROMOTION_CODE_NOT_ACTIVE: 'CODE_NOT_ACTIVE',
  PROMOTION_CODE_EXPIRED: 'CODE_EXPIRED',
  PROMOTION_CODE_USAGE_LIMIT_REACHED: 'CODE_USAGE_LIMIT',
  PROMOTION_CODE_USER_LIMIT_REACHED: 'CODE_USER_LIMIT',
  PROMOTION_CODE_UPDATE_CREDIT_FAILED: 'UPDATE_FAILED',
};

const respondWithError = (key: ErrorKey) => {
  const { code, message } = ERROR_RESPONSES[key];
  return failedWithCode(code, message);
};

export const POST = async (req: Request) => {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return unauthorized('User not authenticated');
  }

  let payload: { code?: string } = {};
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Failed to parse redeem body', error);
  }

  const code = typeof payload?.code === 'string' ? payload.code.trim() : '';
  if (!code) {
    // return respondWithError('CODE_REQUIRED');
    return new Response('not found', { status: 404 });
  }
  // 禁用兑换码功能
  if (code) {
    // return respondWithError('CODE_EXPIRED');
    return new Response('not found', { status: 404 });
  }

  const supabase = createSupabase();
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Redeem user fetch failed', userError);
    return respondWithError('USER_NOT_FOUND');
  }

  const { data, error } = await supabase.rpc('redeem_promotion_code_v2', {
    p_user_id: userId,
    p_email: user.email || '',
    p_code: code,
  });

  if (error) {
    console.error('Redeem RPC failed', error);
    const rpcMessage = error?.message?.toUpperCase?.() || '';
    const mappedKey = rpcErrorMap[rpcMessage] || 'UNKNOWN';
    return respondWithError(mappedKey);
  }

  if (data === undefined || data === null) {
    return respondWithError('UNKNOWN');
  }

  return success({ credit: data });
};
