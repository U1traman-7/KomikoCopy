import { failed, success } from '../_utils/index.js';
import { getAuthUserId } from '../tools/image-generation.js';
import { OneTimePackPrice, OneTimePackPriceType } from './_constant.js';
import { createStripe } from './_init.js';
import { trackPaymentInitiatedServer } from '../_utils/posthog.js';
import { checkXSPackPurchased } from './_checkXSPackPurchased.js';

interface Payload {
  type: OneTimePackPriceType;
  redirectUrl?: string;
}

const handler = async (req: Request) => {
  const stripe = createStripe();
  const data: Payload | null = await req.json().catch();
  if (!data) {
    return failed('Invalid request payload');
  }

  const userId = await getAuthUserId(req).catch();
  if (!userId) {
    return failed('Invalid login status');
  }

  const price = OneTimePackPrice[data.type];
  if (!price) {
    console.error(
      '[createOneTime] Price ID not found for pack type:',
      data.type,
    );
    return failed('Failed to create payment link');
  }

  // ⚠️ XS 包（0.99）限购：每个账户只能购买一次
  if (data.type === 'XS') {
    console.log(
      '[createOneTime] Checking XS pack purchase limit for user:',
      userId,
    );

    // 查询数据库中的 XS 包购买记录
    try {
      const hasPurchasedXS = await checkXSPackPurchased(userId);

      if (hasPurchasedXS) {
        console.log(
          '[createOneTime] User has already purchased XS pack, purchase limit reached',
        );
        return failed(
          'You have already purchased the XS pack. Each account can only purchase it once.',
        );
      }

      console.log(
        '[createOneTime] User has not purchased XS pack yet, proceeding',
      );
    } catch (error) {
      console.error(
        '[createOneTime] Error checking XS pack purchase history:',
        error,
      );
      // 如果查询失败，为了安全起见，拒绝购买
      return failed('Unable to verify purchase eligibility');
    }
  }

  const paymentLink = await stripe.paymentLinks
    .create({
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: data.redirectUrl || 'https://komiko.app/pricing',
        },
      },
      metadata: {
        userId,
        pack: data.type,
      },
    })
    .catch(err => {
      console.error('[createOneTime] Failed to create payment link:', err);
      return null;
    });

  if (!paymentLink) {
    return failed('Failed to create payment link');
  }

  try {
    await trackPaymentInitiatedServer(
      userId,
      `OneTime_${data.type}`,
      'USD',
      'stripe',
    );
  } catch (e) {
    console.error('[createOneTime] Error tracking payment initiated:', e);
  }

  return success({ url: paymentLink.url });
};

export { handler as POST };
