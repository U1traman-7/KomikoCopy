import { failed, success } from '../_utils/index.js';
import { getAuthUserId } from '../tools/image-generation.js';
import { PlanCode } from './_constant.js';
import { createStripe } from './_init.js';
import { createClient } from '@supabase/supabase-js';
import { trackPaymentInitiatedServer } from '../_utils/posthog.js';
import { waitUntil } from '@vercel/functions';

/**
 * 获取新手折扣的 Stripe 配置
 *
 * 逻辑：
 * 1. 查询 type=1 的新手活动（长期活动，end_time=null）
 * 2. 检查用户是否在24小时窗口内
 * 3. 检查 deleted_user 表，防止删除后重新注册的用户享受新用户优惠
 * 4. 根据 plan_code 查询对应的 subscription_promotion
 * 5. 返回 stripe_id 和 stripe_type
 */
async function getNewUserPromotion(
  supabase: any,
  userId: string,
  planCode: number,
): Promise<{
  stripe_id: string;
  stripe_type: number;
  campaign_id: number;
} | null> {
  const now = new Date().toISOString();

  // 1. 查询新手活动（type=1, status=1, end_time=null）
  const { data: campaigns } = await supabase
    .from('subscription_campaign')
    .select('id, priority')
    .eq('id', 4)
    .eq('status', 1)
    .order('priority', { ascending: true })
    .limit(1);

  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  const campaign = campaigns[0];

  // 2. 查询用户信息
  const { data: user } = await supabase
    .from('User')
    .select('email, created_at')
    .eq('id', userId)
    .single();

  if (!user) {
    console.log('User not found');
    return null;
  }

  // 3. 检查 deleted_user 表
  const { data: deletedUser } = await supabase
    .from('deleted_user')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();

  if (deletedUser) {
    console.log('User is deleted');
    return null;
  }

  // 4. 检查24小时窗口
  const userCreationTime = new Date(user.created_at).getTime();
  const currentTime = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;

  if (currentTime >= userCreationTime + hours24) {
    return null;
  }

  // 5. 查询对应的 subscription_promotion
  const { data: promotions } = await supabase
    .from('subscription_promotion')
    .select('id, stripe_type, stripe_id')
    .eq('campaign_id', campaign.id)
    .or(`plan_code.is.null,plan_code.eq.${planCode}`)
    .limit(1);

  if (!promotions || promotions.length === 0) {
    console.log('No promotion found');
    return null;
  }

  const promotion = promotions[0];

  return {
    stripe_id: promotion.stripe_id,
    stripe_type: promotion.stripe_type,
    campaign_id: campaign.id,
  };
}

type Payload = {
  plan: 'Starter' | 'Plus' | 'Premium';
  plan_code: PlanCode;
  redirectUrl?: string;
};

const handler = async (req: Request) => {
  const stripe = createStripe();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const data: Payload | null = await req.json().catch();
  if (!data) {
    return failed('Invailid request payload');
  }
  const plansTableName =
    process.env.MODE === 'development' ? 'Plans_test' : 'Plans';
  const { data: plan, error } = await supabase
    .from(plansTableName)
    .select('stripe_id')
    .eq('plan_code', data.plan_code)
    .single();

  if (!plan || error) {
    return failed('Invalid plan');
  }

  const userId = await getAuthUserId(req).catch();
  if (!userId) {
    return failed('Invalid login status');
  }
  const tableName =
    process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const { data: subData, error: subError } = await supabase
    .from(tableName)
    .select('plan_code')
    .eq('user_id', userId)
    .gt('expires', (Date.now() / 1000) | 0)
    .lt('plan_code', 1000)
    .order('expires', { ascending: true });

  if (subData?.length) {
    // @ts-ignore
    return failed('Already subscribed', { plan: subData[0].plan });
  }

  // 先检查新手折扣（单独处理，因为是长期活动）
  const newUserPromotion = await getNewUserPromotion(
    supabase,
    userId,
    data.plan_code,
  );

  if (newUserPromotion) {
    // 查询用户邮箱
    // const { data: user } = await supabase
    //   .from('User')
    //   .select('email')
    //   .eq('id', userId)
    //   .single();

    // const userEmail = user?.email || '';

    // 应用新手折扣
    if (newUserPromotion.stripe_type === 1 && newUserPromotion.stripe_id) {
      const session = await stripe.checkout.sessions
        .create({
          mode: 'subscription',
          line_items: [
            {
              price: plan.stripe_id,
              quantity: 1,
            },
          ],
          discounts: [{ coupon: newUserPromotion.stripe_id }],
          success_url: data.redirectUrl || 'https://komiko.app/pricing',
          cancel_url: 'https://komiko.app/pricing',
          // customer_email: userEmail,
          metadata: {
            userId,
            planCode: data.plan_code.toString(),
            campaignId: newUserPromotion.campaign_id.toString(),
          },
        })
        .catch();

      if (!session) {
        return failed('Failed to create checkout session');
      }

      try {
        waitUntil(
          trackPaymentInitiatedServer(userId, data.plan, 'USD', 'stripe'),
        );
      } catch (e) {
        console.error('Error tracking payment initiated (server):', e);
      }

      return success({ url: session.url });
    }
  }

  // 如果没有新手折扣，查询其他活动（type != 1）
  const now = new Date().toISOString();
  const { data: campaigns, error: campaignError } = await supabase
    .from('subscription_campaign')
    .select('id, type, priority')
    .eq('status', 1)
    .lte('start_time', now)
    .or(`end_time.is.null,end_time.gte.${now}`)
    .neq('id', 4) // 排除新手活动，因为已经处理过了
    .order('priority', { ascending: true })
    .limit(1);

  let promotion: {
    stripe_id: string;
    stripe_type: number;
    campaign_id: number;
  } | null = null;
  let shouldApplyDiscount = false;
  let userEmail = '';

  if (!campaignError && campaigns && campaigns.length > 0) {
    const campaign = campaigns[0];

    // 查询对应的 subscription_promotion
    const { data: promotions } = await supabase
      .from('subscription_promotion')
      .select('id, stripe_type, stripe_id')
      .eq('campaign_id', campaign.id)
      .or(`plan_code.is.null,plan_code.eq.${data.plan_code}`)
      .limit(1);

    if (promotions && promotions.length > 0) {
      const promo = promotions[0];
      promotion = {
        stripe_id: promo.stripe_id,
        stripe_type: promo.stripe_type,
        campaign_id: campaign.id,
      };
      shouldApplyDiscount = true;

      // 查询用户邮箱
      const { data: user } = await supabase
        .from('User')
        .select('email')
        .eq('id', userId)
        .single();

      userEmail = user?.email || '';
    }
  }

  // 如果符合促销条件，使用 Stripe Checkout Session
  if (shouldApplyDiscount && promotion) {
    if (promotion.stripe_type === 1 && promotion.stripe_id) {
      // 使用优惠券
      const session = await stripe.checkout.sessions
        .create({
          mode: 'subscription',
          line_items: [
            {
              price: plan.stripe_id,
              quantity: 1,
            },
          ],
          discounts: [{ coupon: promotion.stripe_id }],
          success_url: data.redirectUrl || 'https://komiko.app/pricing',
          cancel_url: 'https://komiko.app/pricing',
          customer_email: userEmail,
          metadata: {
            userId,
            planCode: data.plan_code.toString(),
            campaignId: promotion.campaign_id.toString(),
          },
        })
        .catch();

      if (!session) {
        return failed('Failed to create checkout session');
      }

      try {
        waitUntil(
          trackPaymentInitiatedServer(userId, data.plan, 'USD', 'stripe'),
        );
      } catch (e) {
        console.error('Error tracking payment initiated (server):', e);
      }

      return success({ url: session.url });
    }
    // if (promotion.stripe_type === 2 && promotion.stripe_id) {
    //   // 使用特殊价格
    //   const session = await stripe.checkout.sessions
    //     .create({
    //       mode: 'subscription',
    //       line_items: [
    //         {
    //           price: promotion.stripe_id,
    //           quantity: 1,
    //         },
    //       ],
    //       success_url: data.redirectUrl || 'https://komiko.app/pricing',
    //       cancel_url: 'https://komiko.app/pricing',
    //       customer_email: userEmail,
    //       metadata: {
    //         userId,
    //         planCode: data.plan_code.toString(),
    //         promotionId: promotion.id.toString(),
    //       },
    //     })
    //     .catch();

    //   if (!session) {
    //     return failed('Failed to create checkout session');
    //   }

    //   try {
    //     await trackPaymentInitiatedServer(userId, data.plan, 'USD', 'stripe');
    //   } catch (e) {
    //     console.error('Error tracking payment initiated (server):', e);
    //   }

    //   return success({ url: session.url });
    // }
  }

  // 非促销使用原有的 Payment Link 方式
  const paymentLink = await stripe.paymentLinks
    .create({
      line_items: [
        {
          price: plan.stripe_id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: data.redirectUrl || 'https://komiko.app/pricing',
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId,
      },
    })
    .catch();
  if (!paymentLink) {
    return failed('Failed to create payment link');
  }

  try {
    await trackPaymentInitiatedServer(userId, data.plan, 'USD', 'stripe');
  } catch (e) {
    console.error('Error tracking payment initiated (server):', e);
  }

  return success({ url: paymentLink.url });
};

export { handler as POST };
