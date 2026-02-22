import { createSupabase } from '../_utils/index.js';

/**
 * 检查用户是否已购买 XS pack
 * 查询数据库中的 xs_pack_purchases 表
 *
 * @param userId 用户 ID
 * @returns 是否已购买
 */
export async function checkXSPackPurchased(userId: string): Promise<boolean> {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from('xs_pack_purchases')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error) {
    // 如果找不到记录，说明未购买
    if (error.code === 'PGRST116') {
      return false;
    }
    // 其他错误需要抛出
    console.error('[checkXSPackPurchased] Database error:', error);
    throw error;
  }

  return !!data;
}
