import { failed, success, unauthorized } from '../../_utils/index.js';
import { getAuthUserId } from '../../tools/image-generation.js';
import { createStripe } from '../_init.js';
import { createClient } from '@supabase/supabase-js';

const handler = async (req: Request) => {
  const userId = await getAuthUserId(req).catch();
  if (!userId) {
    return unauthorized('Invalid login status');
  }

  const stripe = createStripe();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const subscriptionsTableName =
    process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const { data: subscriptions, error } = await supabase
    .from(subscriptionsTableName)
    .select('subscription_id,customer_id,status,period_expires')
    .eq('user_id', userId)
    .gte('expires', (Date.now() / 1000) | 0)
    .lt('plan_code', 1000)
    .order('expires', { ascending: false })
    .limit(1)
    .single();

  if (!subscriptions || error) {
    return failed('Invalid subscription');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscriptions.customer_id, // Stripe Customer ID
    return_url: 'https://komiko.app', // 用户退出 portal 后返回的页面
  });

  return success({
    url: portalSession.url,
  });
};

export { handler as GET };
