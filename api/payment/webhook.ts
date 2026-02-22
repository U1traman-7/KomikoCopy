/* eslint-disable */
import { Stripe } from 'stripe';
import { createStripe } from './_init.js';
import { createSupabase } from '../_utils/index.js';
import { BROAD_TYPES, CONTENT_TYPES } from '../_constants.js';
import {
  CycleMode,
  OneTimePackPriceType,
  PlanCode,
  SubscriptionStatus,
} from './_constant.js';
import { Subscription, SupabaseClient } from '@supabase/supabase-js';
import {
  trackSubscriptionStarted,
  trackSubscriptionRenewed,
  trackSubscriptionCancelled,
  trackOneTimePurchaseCompleted,
  trackPaymentCompleted,
} from '../_utils/posthog.js';
import { pushMessage } from '../message.js';
import { checkXSPackPurchased } from './_checkXSPackPurchased.js';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const LARK_WEBHOOK =
  'https://open.larksuite.com/open-apis/bot/v2/hook/15606307-828e-4fc5-aa27-8b9a3825c20d';

const subscriptionsTableName =
  process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';

const failed = (message: string) => new Response(message, { status: 400 });
const success = (data: any) =>
  new Response(JSON.stringify(data), { status: 200 });

const stripe = createStripe();

const formatDateLabel = (timestamp?: number | null) => {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp * 1000);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}/${month}/${day}`;
};

const buildInvoiceDescription = (
  start?: number | null,
  end?: number | null,
  planName?: string | null,
) => {
  const startText = formatDateLabel(start) ?? 'current period';
  const endText = formatDateLabel(end) ?? 'future period';
  const planLabel = planName ? `${planName} subscription` : 'subscription';
  return `${startText} ～ ${endText} ${planLabel}`;
};

const getAmountFromStripeEvent = (
  eventType: 'checkout.session.completed' | 'invoice.payment_succeeded',
  stripeData: Stripe.Checkout.Session | Stripe.Invoice,
): number => {
  if (eventType === 'checkout.session.completed') {
    const session = stripeData as Stripe.Checkout.Session;
    return session.amount_total ? session.amount_total / 100 : 0;
  } else {
    // invoice.payment_succeeded
    const invoice = stripeData as Stripe.Invoice;
    return invoice.amount_paid ? invoice.amount_paid / 100 : 0;
  }
};

const ZapsMap = {
  XS: {
    0: 800,
    1: 1300, // Premium: 800 + 500
    2: 1000, // Plus: 800 + 200
    3: 900,  // Starter: 800 + 100
    4: 1300, // Premium Annual
    5: 1000, // Plus Annual
    6: 900,  // Starter Annual
  },
  S: {
    0: 2000,
    1: 5000,  // Premium: 2000 + 3000
    2: 3700,  // Plus: 2000 + 1700
    3: 2300,  // Starter: 2000 + 300
    4: 5000,  // Premium Annual
    5: 3700,  // Plus Annual
    6: 2300,  // Starter Annual
  },
  SM: {
    0: 3500,
    1: 10000,
    2: 7500,
    3: 5000,
    4: 10000,
    5: 7500,
    6: 5000,
  },
  M: {
    0: 9000,
    1: 20000,
    2: 15000,
    3: 10000,
    4: 20000,
    5: 15000,
    6: 10000,
  },
  L: {
    0: 20000,
    1: 40000,
    2: 30000,
    3: 21000,
    4: 40000,
    5: 30000,
    6: 21000,
  },
  XL: {
    0: 52500,
    1: 99500,  // Premium: 52500 + 47000
    2: 74500,  // Plus: 52500 + 22000
    3: 55000,  // Starter: 52500 + 2500
    4: 99500,  // Premium Annual
    5: 74500,  // Plus Annual
    6: 55000,  // Starter Annual
  },
  XXL: {
    0: 221500,
    1: 399500, // Premium: 221500 + 178000
    2: 299500, // Plus: 221500 + 78000
    3: 231300, // Starter: 221500 + 9800
    4: 399500, // Premium Annual
    5: 299500, // Plus Annual
    6: 231300, // Starter Annual
  },
};

const addOneTimeZaps = async (
  supabase: SupabaseClient,
  userId: string,
  type: OneTimePackPriceType,
  amount?: number,
) => {
  const tableName =
    process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const { data, error } = await supabase
    .from(tableName)
    .select('plan_code')
    .eq('user_id', userId)
    .gt('expires', (Date.now() / 1000) | 0)
    .order('expires', { ascending: true })
    .lt('plan_code', 1000);

  if (error) {
    console.error('[addOneTimeZaps] Subscription query error:', error);
    return false;
  }
  let plan_code = 0;
  if (data.length) {
    plan_code = data[0].plan_code;
  }

  const zaps = ZapsMap[type]?.[plan_code] as number;

  if (!zaps) {
    console.error('[addOneTimeZaps] Zaps not found for pack type:', type, 'plan_code:', plan_code);
    return false;
  }
  const { data: userData, error: fetchError } = await supabase
    .from('User')
    .select('credit')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('error fetching user', fetchError);
    return false;
  }

  const newCredit = (userData.credit || 0) + zaps;
  const { error: updateError } = await supabase
    .from('User')
    .update({ credit: newCredit })
    .eq('id', userId);
  if (updateError) {
    console.error('error', updateError);
    return false;
  }

  // Track one-time purchase completion
  try {
    await trackOneTimePurchaseCompleted(userId, type, amount || 0, zaps, 'USD');
    await trackPaymentCompleted(
      userId,
      `OneTime_${type}`,
      amount || 0,
      'stripe',
      'USD',
    );
  } catch (error) {
    console.error('Error tracking one-time purchase:', error);
  }

  return true;
};

const fetchSubscriptionRecord = async (
  supabase: SupabaseClient,
  subscriptionId?: string | null,
) => {
  if (!subscriptionId) {
    return { plan: null, user_id: null };
  }
  const { data } = await supabase
    .from(subscriptionsTableName)
    .select('plan, user_id')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();
  return data || { plan: null, user_id: null };
};

const fetchCustomerUserId = async (customerId?: string | null) => {
  if (!customerId) {
    return null;
  }
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || (customer as Stripe.DeletedCustomer).deleted) {
      return null;
    }
    return (customer as Stripe.Customer)?.metadata?.userId || null;
  } catch (error) {
    console.error('Failed to fetch Stripe customer metadata:', error);
    return null;
  }
};

const insertShouldChargeMessage = async (
  supabase: SupabaseClient,
  userId: string,
  invoiceText: string,
  invoiceId: string,
  subscriptionId?: string | null,
) => {
  // const { count } = await supabase
  //   .from('messages')
  //   .select('id', { count: 'exact', head: true })
  //   .eq('user_id', userId)
  //   .eq('content_type', CONTENT_TYPES.SHOULD_CHARGE)
  //   .eq('payload->>invoiceId', invoiceId);

  // if ((count ?? 0) > 0) {
  //   return;
  // }

  const payload = {
    version: 1,
    invoiceText,
    invoiceId,
    subscriptionId: subscriptionId || null,
  };

  pushMessage(
    {
      content_type: CONTENT_TYPES.SHOULD_CHARGE,
      content_id: 0,
      host_content_id: 0,
      need_aggregate: false,
      broad_type: BROAD_TYPES.MESSAGE,
      user_id: userId,
      payload,
    },
    undefined,
  ).catch(error => {
    console.error('Failed to push SHOULD_CHARGE message:', error);
  });
};

const handleInvoicePaymentFailed = async (
  event: Stripe.Event,
  supabase: SupabaseClient,
) => {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

  const subscriptionRecord = await fetchSubscriptionRecord(
    supabase,
    subscriptionId,
  );

  let userId = invoice.metadata?.userId || subscriptionRecord.user_id || null;
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;
  if (!userId) {
    userId = await fetchCustomerUserId(customerId);
  }

  if (!userId) {
    console.warn('invoice.payment_failed received without userId', invoice.id);
    return;
  }

  const linePeriod = invoice.lines?.data?.[0]?.period;
  const periodStart = linePeriod?.start || invoice.period_start || null;
  const periodEnd = linePeriod?.end || invoice.period_end || null;
  const planName =
    subscriptionRecord.plan ||
    invoice.lines?.data?.[0]?.plan?.nickname ||
    invoice.lines?.data?.[0]?.price?.nickname ||
    invoice.lines?.data?.[0]?.plan?.id ||
    null;

  const invoiceText = buildInvoiceDescription(periodStart, periodEnd, planName);
  await insertShouldChargeMessage(
    supabase,
    userId,
    invoiceText,
    invoice.id,
    subscriptionId,
  );
};

const handleCancelSubscription = async (
  event: Stripe.Event,
  supabase: SupabaseClient,
) => {
  if (event.type === 'customer.subscription.updated') {
    const stripeData = event.data.object as Stripe.Subscription;

    let statusShouldBe = SubscriptionStatus.ACTIVE;
    if (stripeData.canceled_at) {
      statusShouldBe = SubscriptionStatus.CANCELLED;
    }
    const { error: subscriptionError } = await supabase
      .from(subscriptionsTableName)
      .update({ status: statusShouldBe })
      .eq('subscription_id', stripeData.id)
      .single();
    if (subscriptionError) {
      console.error('error', subscriptionError);
    }

    // Track subscription cancellation
    if (statusShouldBe === SubscriptionStatus.CANCELLED) {
      try {
        // Get user info from subscription table
        const { data: subscriptionData } = await supabase
          .from(subscriptionsTableName)
          .select('user_id, plan')
          .eq('subscription_id', stripeData.id)
          .single();

        if (subscriptionData?.user_id) {
          await trackSubscriptionCancelled(
            subscriptionData.user_id,
            subscriptionData.plan || 'unknown',
            'user_cancelled',
          );
        }
      } catch (error) {
        console.error('Error tracking subscription cancellation:', error);
      }
    }
  }
  return true;
};

const stopSubscription = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  refund = true,
) => {
  const subscriptionsTableName =
    process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const { error } = await supabase
    .from(subscriptionsTableName)
    .update({
      expires: 0,
      period_expires: 0,
      status: SubscriptionStatus.CANCELLED,
    })
    .eq('subscription_id', subscription.id);

  if (error) {
    console.error('cancel subscription error:', error);
  }

  console.log('cancel subscription', subscription.id);
  await stripe.subscriptions.cancel(subscription.id, {
    invoice_now: false, // 如果想立即生成最终账单，可设为 true
    prorate: true, // 按比例退款/结算未使用的时间
  });

  if (refund) {
    console.log('refund', subscription.latest_invoice);
    const invoice = await stripe.invoices.retrieve(
      subscription.latest_invoice as string,
    );
    const chargeId = invoice.charge as string;
    if (!chargeId) {
      return;
    }
    console.log('refund chargeId', chargeId);
    await stripe.refunds.create({
      charge: chargeId,
    });
  }
};

const sendLarkMessage = async (message: any) => {
  await fetch(LARK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
};

export const detectHighRisk = async (
  event: Stripe.Event,
  supabase: SupabaseClient,
) => {
  if (event.type !== 'checkout.session.completed') {
    return false;
  }
  const session = event.data.object;

  const paymentIntentId = session.payment_intent as string;
  const subscriptionId = session.subscription as string;
  console.log('paymentIntentId', paymentIntentId);
  console.log('subscriptionId', subscriptionId);
  if (!paymentIntentId && !subscriptionId) {
    return false;
  }

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const invoiceId = subscription.latest_invoice as string;
    const invoice = await stripe.invoices.retrieve(invoiceId);
    const chargeId = invoice.charge as string;
    if (!chargeId) {
      return false;
    }
    const charge = await stripe.charges.retrieve(chargeId);
    const riskLevel = charge.outcome?.risk_level;
    console.log('riskLevel', riskLevel);
    if (riskLevel !== 'highest' && riskLevel !== 'elevated') {
      return false;
    }

    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    const metadata = (customer as any)?.metadata || {};
    const userId = metadata.userId;
    let userEmail = '';
    if (userId) {
      const { data } = await supabase
        .from('User')
        .select('email')
        .eq('id', userId)
        .single();
      userEmail = data?.email || '';
    }
    const stripeEmail = customer?.email || '';
    console.log('stripeEmail', stripeEmail);

    await stopSubscription(supabase, subscription);
    sendLarkMessage({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: '⚠️ 高风险支付',
            content: [
              [
                {
                  tag: 'text',
                  text: `用户ID: ${userId}, KomikoAI邮箱: ${userEmail}, Stripe邮箱: ${stripeEmail}, 风险等级：${riskLevel}`,
                },
              ],
            ],
          },
        },
      },
    });

    return true;
  }

  try {
    // 1. 获取 paymentIntent 并展开 charges
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge as string;
    if (!chargeId) {
      return false;
    }
    const charge = await stripe.charges.retrieve(chargeId);
    const riskLevel = charge.outcome?.risk_level;

    // 2. 如果 risk_level = highest
    if (riskLevel !== 'highest' && riskLevel !== 'elevated') {
      return false;
    }
    const userId =
      session.customer_details?.metadata?.userId || session.metadata?.userId;
    const customerEmail =
      session.customer_details?.email || session.customer_email;

    // 3. 从 Supabase 获取用户信息
    const { data, error } = await supabase
      .from('User')
      .select('email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('error', error);
    }

    const userEmail = data?.email || '';

    await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    sendLarkMessage({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: '⚠️ 高风险支付',
            content: [
              [
                {
                  tag: 'text',
                  text: `用户ID ${userId}, KomikoAI 邮箱: ${userEmail}, Stripe 邮箱: ${customerEmail}, 风险等级：${riskLevel}`,
                },
              ],
            ],
          },
        },
      },
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const handleFraud = async (event: Stripe.Event, supabase: SupabaseClient) => {
  if (event.type !== 'radar.early_fraud_warning.created') {
    return;
  }
  const stripeData = event.data.object as Stripe.Radar.EarlyFraudWarning;
  let chargeId = stripeData.charge;
  if (!chargeId) {
    return;
  }
  if (typeof chargeId === 'object') {
    chargeId = (chargeId as Stripe.Charge).id;
  }

  const charge = await stripe.charges.retrieve(chargeId);
  if (charge.status === 'succeeded') {
    return;
  }
  await stripe.refunds.create({
    payment_intent: charge.payment_intent as string,
  });
  const invoiceId = charge.invoice as string;
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (!invoice) {
    return;
  }
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!subscription) {
    return;
  }
  await stopSubscription(supabase, subscription, false);
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const metadata = (customer as any)?.metadata || {};
  await stripe.customers.update(customerId, {
    metadata: {
      ...metadata,
      fraud_flag: 'true',
    },
  });
};

const resetUserBenefit = async (
  supabase: SupabaseClient,
  userId: string,
  benefitType: number,
) => {
  try {
    const { error } = await supabase.rpc('reset_benefit', {
      p_user_id: userId,
      p_benefit_type: benefitType,
    });
    if (error) {
      console.error('error resetUserBenefit', error, userId, benefitType);
      sendLarkMessage({
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: '⚠️ 重置用户权益失败',
              content: [
                [
                  {
                    tag: 'text',
                    text: `用户ID: ${userId}, 权益类型: ${benefitType}`,
                  },
                ],
              ],
            },
          },
        },
      });
      return false;
    }
  } catch (error) {
    console.error('error resetUserBenefit', error, userId, benefitType);
    sendLarkMessage({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: '⚠️ 重置用户权益失败',
            content: [
              [
                {
                  tag: 'text',
                  text: `用户ID: ${userId}, 权益类型: ${benefitType}`,
                },
              ],
            ],
          },
        },
      },
    });
    return false;
  }
  return true;
};

// plan_code 小于 1000 用于stripe的订阅
const handler = async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const supabase = createSupabase();
  let event: Stripe.Event;

  if (process.env.NODE_ENV !== 'development') {
    const body = await req.text();
    if (!body) {
      return failed('Invalid request payload');
    }
    // console.log('signature', signature);
    if (!signature) {
      return failed('Invalid signature');
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } else {
    event = await req.json();
    console.log('event', event);
  }
  const tableName =
    process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';

  // if (event.type === 'radar.early_fraud_warning.created') {
  //   await handleFraud(event, supabase);
  //   return success({ received: true });
  // }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'invoice.payment_succeeded'
  ) {
    let stripeData: Stripe.Checkout.Session | Stripe.Invoice;
    if (event.type === 'checkout.session.completed') {
      stripeData = event.data.object as Stripe.Checkout.Session;
    } else {
      stripeData = event.data.object as Stripe.Invoice;
    }

    if (event.type === 'checkout.session.completed') {
      try {
        const isHighRisk = await detectHighRisk(event, supabase).catch();
        if (isHighRisk) {
          console.log('isHighRisk', isHighRisk);
          return success({ received: true });
        }
      } catch (error) {
        console.error('error', error);
      }
    }
    let { userId, pack, fraud_flag } = stripeData.metadata ?? {};

    // if (pack && fraud_flag === 'true') {
    //   await stripe.refunds.create({
    //     payment_intent: stripeData.payment_intent as string,
    //   });
    //   return;
    // }

    // Handle one-time purchase
    if (pack) {
      const amount = getAmountFromStripeEvent(event.type, stripeData);

      // ⚠️ XS 包（0.99）限购逻辑：先记录购买，再发放 zaps
      // 执行顺序很重要：UNIQUE 约束作为分布式锁，防止重复购买
      if (pack === 'XS') {
        console.log('[Webhook] XS pack payment detected for user:', userId);

        // 🔒 第一步：尝试记录购买（UNIQUE 约束防止并发重复）
        const sessionId = event.type === 'checkout.session.completed'
          ? (stripeData as Stripe.Checkout.Session).id
          : null;

        // invoice.payment_succeeded 事件没有 sessionId，需要用其他标识
        const recordId = sessionId || `invoice_${(stripeData as Stripe.Invoice).id}`;

        if (!recordId) {
          console.error('[Webhook] CRITICAL: XS pack payment has no recordId, cannot track purchase');
          // 无法记录购买，拒绝处理以防止重复购买
          return failed('Unable to track XS pack purchase - missing transaction identifier');
        }

        try {
          const { error: insertError } = await supabase
            .from('xs_pack_purchases')
            .insert({
              user_id: userId,
              stripe_session_id: recordId,
            });

          if (insertError) {
            // UNIQUE 约束违反：用户已购买过 XS 包
            if (insertError.code === '23505') {
              console.error('[Webhook] User has already purchased XS pack (database UNIQUE constraint), refunding duplicate payment');

              // 自动退款
              if (event.type === 'checkout.session.completed') {
                const session = stripeData as Stripe.Checkout.Session;
                if (session.payment_intent) {
                  await stripe.refunds.create({
                    payment_intent: session.payment_intent as string,
                    reason: 'duplicate',
                  });
                  console.log('[Webhook] XS pack payment refunded due to purchase limit (one per account)');
                }
              } else if (event.type === 'invoice.payment_succeeded') {
                const invoice = stripeData as Stripe.Invoice;
                if (invoice.payment_intent) {
                  await stripe.refunds.create({
                    payment_intent: invoice.payment_intent as string,
                    reason: 'duplicate',
                  });
                  console.log('[Webhook] XS pack invoice payment refunded due to purchase limit');
                }
              }

              return success({
                received: true,
                refunded: true,
                reason: 'XS pack can only be purchased once per account',
              });
            }

            // 其他数据库错误：严重错误，拒绝处理
            console.error('[Webhook] CRITICAL: Failed to insert XS pack purchase record:', insertError);

            // 发送 Lark 告警
            await sendLarkMessage({
              msg_type: 'post',
              content: {
                post: {
                  zh_cn: {
                    title: '⚠️ XS 包购买记录失败',
                    content: [
                      [
                        {
                          tag: 'text',
                          text: `用户ID: ${userId}, 错误: ${insertError.message || insertError.code}, recordId: ${recordId}`,
                        },
                      ],
                    ],
                  },
                },
              },
            });

            // 拒绝处理以防止数据不一致
            return failed('Failed to record XS pack purchase - database error');
          }

          console.log('[Webhook] ✅ XS pack purchase recorded in database for user:', userId);
        } catch (error) {
          console.error('[Webhook] CRITICAL: Exception when recording XS pack purchase:', error);

          // 发送 Lark 告警
          await sendLarkMessage({
            msg_type: 'post',
            content: {
              post: {
                zh_cn: {
                  title: '⚠️ XS 包购买记录异常',
                  content: [
                    [
                      {
                        tag: 'text',
                        text: `用户ID: ${userId}, 异常: ${error}, recordId: ${recordId}`,
                      },
                    ],
                  ],
                },
              },
            },
          });

          // 拒绝处理以防止数据不一致
          return failed('Exception when recording XS pack purchase');
        }
      }

      // 💰 第二步：发放 zaps（只有记录成功才会执行到这里）
      const done = await addOneTimeZaps(
        supabase,
        userId,
        pack as OneTimePackPriceType,
        amount,
      );
      if (!done) {
        console.error('[Webhook] CRITICAL: Failed to add zaps after XS pack purchase was recorded');

        // 发放失败但购买已记录，发送告警供人工处理
        if (pack === 'XS') {
          await sendLarkMessage({
            msg_type: 'post',
            content: {
              post: {
                zh_cn: {
                  title: '⚠️ XS 包 zaps 发放失败',
                  content: [
                    [
                      {
                        tag: 'text',
                        text: `用户ID: ${userId}, 购买已记录但 zaps 发放失败，需人工补发`,
                      },
                    ],
                  ],
                },
              },
            },
          });
        }

        return failed('Error adding one-time zaps');
      }

      console.log('[Webhook] ✅ One-time pack processed successfully:', pack, 'for user:', userId);
      return success({ received: true });
    }

    const subscription = await stripe.subscriptions.retrieve(
      stripeData.subscription as string,
    );
    // if (fraud_flag === 'true') {
    //   await stopSubscription(supabase, subscription);
    //   return success({ received: true });
    // }
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription?.customer?.id;
    if (event.type === 'invoice.payment_succeeded' && customerId) {
      const customerData = await stripe.customers.retrieve(customerId);
      userId = (customerData as any)?.metadata?.userId ?? '';
    }

    if (!userId || !customerId) {
      return new Response('Invalid session metadata', { status: 400 });
    }
    if (event.type !== 'invoice.payment_succeeded') {
      stripe.customers.update(customerId, {
        metadata: {
          userId,
        },
      });
    }
    // if (event.type === 'invoice.payment_succeeded') {
    //   await resetUserBenefit(supabase, userId, 11);
    // }
    const price = subscription.items.data[0].price.id;
    const plansTableName =
      process.env.MODE === 'development' ? 'Plans_test' : 'Plans';
    const { data: plan, error: planError } = await supabase
      .from(plansTableName)
      .select('name,credit,plan_code,cycle_mode')
      .eq('stripe_id', price)
      .single();

    if (planError || !plan) {
      console.log('planError', planError, price, plansTableName);
      return failed(`Invalid plan: ${price}  ${plansTableName}`);
    }
    const periodExpires =
      plan.cycle_mode === CycleMode.MONTHLY
        ? subscription.current_period_end
        : ((Date.now() / 1000) | 0) + 30 * 24 * 60 * 60;
    // console.log(plan, '*****');
    const row = {
      customer_id: customerId,
      user_id: userId,
      credit: plan.credit,
      plan: plan.name,
      expires: subscription.current_period_end,
      subscription_id: subscription.id,
      plan_code: plan.plan_code,
      period_expires: periodExpires,
      status: SubscriptionStatus.ACTIVE,
    };
    // console.log(row, '*****');
    const { error } = await supabase.from(tableName).insert(row);

    // subscription_id duplicate
    if (error?.code === '23505') {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          credit: plan.credit,
          expires: subscription.current_period_end,
          period_expires: periodExpires,
        })
        .eq('subscription_id', subscription.id);

      if (!updateError) {
        // Track subscription renewal (复购)
        try {
          const amount = getAmountFromStripeEvent(event.type, stripeData);

          await trackSubscriptionRenewed(
            userId,
            plan.name,
            amount,
            plan.cycle_mode === CycleMode.MONTHLY ? 'monthly' : 'annual',
            'USD',
          );

          await trackPaymentCompleted(
            userId,
            plan.name,
            amount,
            'stripe',
            'USD',
          );
        } catch (trackError) {
          console.error('Error tracking subscription renewal:', trackError);
        }

        return success({ received: true });
      }
      console.error('update error', updateError);
      return failed('Error updating subscription');
    }

    if (error) {
      console.error('insert error', error);
      return failed('Error creating subscription');
    }
    // TODO: insert zaps history to database

    // Track new subscription start
    try {
      const amount = getAmountFromStripeEvent(event.type, stripeData);

      await trackSubscriptionStarted(
        userId,
        plan.name,
        amount,
        plan.cycle_mode === CycleMode.MONTHLY ? 'monthly' : 'annual',
        'USD',
      );

      // Also track general payment completion
      await trackPaymentCompleted(userId, plan.name, amount, 'stripe', 'USD');
    } catch (trackError) {
      console.error('Error tracking subscription start:', trackError);
    }

    return success({ received: true });
  } else if (event.type === 'invoice.payment_failed') {
    await handleInvoicePaymentFailed(event, supabase);
    return success({ received: true });
  } else if (event.type === 'customer.subscription.updated') {
    await handleCancelSubscription(event, supabase);
    return success({ received: true });
  }
  return success({ received: true });
};

export { handler as POST };
