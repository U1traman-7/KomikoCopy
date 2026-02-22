import {
  createSupabase,
  failed,
  success,
  unauthorized,
} from './_utils/index.js';
import { getAuthUserId } from './tools/image-generation.js';
import { CreditModel } from './_models/credit.js';
import { PlanCode } from './payment/_constant.js';
import { waitUntil } from '@vercel/functions';
import { trackServerEvent } from './_utils/posthog.js';

export const POST = async (req: Request) => {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return unauthorized('User not authenticated');
  }
  const supabase = createSupabase();

  const { data, error } = await supabase
    .from('User')
    .select('credit, date_checkin')
    .eq('id', userId)
    .single();
  if (error) {
    return failed('Daily check-in failed');
  }
  const date = new Date().toISOString().split('T')[0];
  if (data.date_checkin && data.date_checkin >= date) {
    return failed('You checked');
  }

  const creditModel = new CreditModel(userId);
  await creditModel.getSubscriptionCredit();

  let rewards = 80; // 免费用户默认80积分
  if (creditModel.subscriptions.length > 0) {
    // 有订阅时，按plan_code排序取第一个
    const sortedSubs = [...creditModel.subscriptions].sort(
      (a, b) => a.plan_code - b.plan_code,
    );
    const firstSub = sortedSubs[0];

    // 根据plan_code设置不同的奖励
    switch (firstSub.plan_code) {
      case PlanCode.PREMIUM:
      case PlanCode.PREMIUM_ANNUAL:
        rewards = 160;
        break;
      case PlanCode.PLUS:
      case PlanCode.PLUS_ANNUAL:
        rewards = 120;
        break;
      case PlanCode.STARTER:
      case PlanCode.STARTER_ANNUAL:
        rewards = 100;
        break;
    }
  }
  const { error: updateError } = await supabase
    .from('User')
    .update({ date_checkin: date, credit: data.credit + rewards })
    .eq('id', userId);

  if (updateError) {
    return failed('Daily check-in failed');
  }
  waitUntil(
    trackServerEvent('dispatch_credit', userId, {
      credit: rewards,
      reason: 'daily_checkin',
    }),
  );
  return success(data.credit + rewards);
};

export const GET = async (req: Request) => {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return unauthorized('User not authenticated');
  }
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from('User')
    .select('credit, date_checkin')
    .eq('id', userId)
    .single();
  if (error) {
    return failed('Failed to get daily check-in');
  }
  return success(data);
};
