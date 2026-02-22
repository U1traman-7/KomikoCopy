import { failed, success } from '../_utils/index.js';
import { getAuthUserId } from '../tools/image-generation.js';
import { checkXSPackPurchased } from './_checkXSPackPurchased.js';

/**
 * 检查用户是否可以购买 XS 包（0.99）
 * XS 包限购：每个账户只能购买一次
 */
const handler = async (req: Request) => {
  const userId = await getAuthUserId(req).catch();
  if (!userId) {
    return failed('Invalid login status');
  }

  console.log(
    '[checkXSPackEligibility] Checking XS pack eligibility for user:',
    userId,
  );

  try {
    // 查询数据库中的 XS 包购买记录
    const hasPurchasedXS = await checkXSPackPurchased(userId);

    if (hasPurchasedXS) {
      console.log(
        '[checkXSPackEligibility] User has already purchased XS pack',
      );
      return success({
        eligible: false,
        reason: 'already_purchased',
        message: 'You have already purchased the XS pack',
      });
    }

    console.log(
      '[checkXSPackEligibility] User is eligible to purchase XS pack',
    );
    return success({
      eligible: true,
      reason: null,
      message: 'You can purchase the XS pack',
    });
  } catch (error) {
    console.error(
      '[checkXSPackEligibility] Error checking eligibility:',
      error,
    );
    return failed('Failed to check purchase eligibility');
  }
};

export { handler as GET };
