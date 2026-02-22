import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import {
  createSupabase,
  failed,
  success,
  unauthorized,
} from './_utils/index.js';
import { createStripe } from './payment/_init.js';

const stripe = createStripe();

export async function POST(request: Request) {
  try {
    // 解析cookie获取用户ID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return unauthorized('unauthorized');
    }

    let token: any = null;
    try {
      token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      return unauthorized('unauthorized');
    }

    if (!token || !token.id) {
      return unauthorized('unauthorized');
    }

    const userId = token.id;
    const supabase = createSupabase();

    // 查询User表中id=userId的记录
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('id,email')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Error fetching user:', fetchError);
      return failed('user not found');
    }
    const tableName =
      process.env.MODE === 'development'
        ? 'Subscriptions_test'
        : 'Subscriptions';
    const now = (Date.now() / 1000) | 0;
    const { data: subData, error: subError } = await supabase
      .from(tableName)
      .select('subscription_id')
      .gt('expires', now)
      .gt('period_expires', now)
      .eq('user_id', userId);

    if (subError) {
      console.error('Error deleting user:', subError);
      return failed('Failed to delete user');
    }

    for (const sub of subData) {
      const subId = sub.subscription_id;
      // 立刻取消订阅
      try {
        // 先检查 subscription 状态
        const subscription = await stripe.subscriptions.retrieve(subId);

        // 如果已经取消，跳过
        if (subscription.status === 'canceled' || subscription.canceled_at) {
          console.log('Subscription already canceled:', subId);
          continue;
        }

        // 立即取消订阅
        const canceled = await stripe.subscriptions.cancel(subId);
        if (!canceled) {
          console.error('Failed to cancel subscription:', subId);
          return failed('Failed to delete user');
        }
      } catch (error: unknown) {
        // 如果是 "No such subscription" 错误，可能是已经删除，继续处理
        const stripeError = error as { code?: string };
        if (stripeError?.code === 'resource_missing') {
          console.log(
            'Subscription not found (may be already deleted):',
            subId,
          );
          continue;
        }
        console.error('Error canceling subscription:', error);
        return failed('Failed to delete user');
      }
    }

    // 删除用户记录
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return failed('Failed to delete user');
    }

    await supabase.from('deleted_user').insert({
      email: user.email,
      user_id: userId,
    });

    return success({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return failed('Internal server error');
  }
}
