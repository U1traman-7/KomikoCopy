import { failed, success, unauthorized } from "../../_utils/index.js";
import { getAuthUserId } from "../../tools/image-generation.js";
import { SubscriptionStatus } from "../_constant.js";
import { createStripe } from "../_init.js";
import { createClient } from '@supabase/supabase-js'


/**
 * 取消订阅
 * @deprecated 请使用 cancelPortal 代替
 */
const handler = async (req: Request) => {
  const userId = await getAuthUserId(req).catch();
  if (!userId) {
    return unauthorized('Invalid login status');
  }

  const stripe = createStripe()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const subscriptionsTableName = process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const { data: subscriptions, error } = await supabase
    .from(subscriptionsTableName)
    .select('subscription_id,status,period_expires')
    .eq('user_id', userId)
    .gte('expires', (Date.now() / 1000 | 0))
    .lt('plan_code', 1000)
    .order('expires', { ascending:  false })
    .limit(1)
    .single();

  if (!subscriptions || error) {
    return failed('Invalid subscription');
  }

  let statusShouldBe = SubscriptionStatus.CANCELLED;
  if (subscriptions.status === SubscriptionStatus.CANCELLED) {
    statusShouldBe = SubscriptionStatus.ACTIVE;
  }

  const { error: subscriptionError } = await supabase
    .from(subscriptionsTableName)
    .update({ status: statusShouldBe })
    .eq('user_id', userId)
    .eq('subscription_id', subscriptions.subscription_id)
    .single();

  if (subscriptionError) {
    return failed('Failed to cancel subscription');
  }

  const cancelSubscription = await stripe
    .subscriptions
    .update(subscriptions.subscription_id, {
      cancel_at: statusShouldBe === SubscriptionStatus.CANCELLED
        ? subscriptions.period_expires
        : null,
    })
    .catch();

  if (!cancelSubscription) {
    return failed('Failed to cancel subscription');
  }
  return success(null);
}

export { handler as GET }
