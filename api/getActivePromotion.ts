import { createClient } from '@supabase/supabase-js';
import { getAuthUserId } from './_utils/index.js';

export const PromotionType = {
  NEW_USER: 1,
  OTHER: 2,
} as const;

interface Campaign {
  id: number;
  code: string;
  type: number; // 1=新用户促销, 2=节假日促销等
  status: number; // 1=启用
  priority: number;
  start_time: string;
  end_time: string | null;
  discount?: number; // 折扣百分比 (如 20 表示 20% off)
  theme?: string;
}

interface SubscriptionPromotion {
  campaign_id: number;
  plan_code: number | null;
  price: number;
}

export interface PromotionResponse {
  is_eligible: boolean;
  campaigns?: Campaign[];
  subscription_promotions?: SubscriptionPromotion[];
  reason?: string;
}

const CAMPAIGN_TABLE =
  process.env.PROMOTION_MODE === 'development'
    ? 'subscription_campaign_test'
    : 'subscription_campaign';
const PROMOTION_TABLE =
  process.env.PROMOTION_MODE === 'development'
    ? 'subscription_promotion_test'
    : 'subscription_promotion';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    let user = {
      id: userId,
      email: '',
      created_at: '',
    };
    if (userId) {
      // 3. 查询用户信息
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('id, email, created_at')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return new Response(JSON.stringify({ is_eligible: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      user = userData;
    }
    // 4. 查询当前有效的促销活动
    const now = new Date().toISOString();
    const { data: campaigns, error: campaignError } = await supabase
      .from(CAMPAIGN_TABLE)
      .select('*')
      .eq('status', 1)
      .lte('start_time', now)
      .or(`end_time.is.null,end_time.gte.${now}`)
      .order('priority', { ascending: true });

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return new Response(JSON.stringify({ is_eligible: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ is_eligible: false, reason: 'no_active_promotion' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    let deletedUser: { email: string } | null = null;
    if (user?.email) {
      // 5. 检查 deleted_user 表
      const { data: deletedUserData } = await supabase
        .from('deleted_user')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();
      if (deletedUserData) {
        deletedUser = deletedUserData;
      }
    }
    // 6. 将新用户促销计算出的过期时间注入到 campaign.end_time
    // 这样前端可以统一使用 campaign[0].end_time 来判断到期时间
    const enrichedCampaigns = campaigns
      .map((campaign: Campaign) => {
        // 新用户促销：注入计算的过期时间到 end_time
        if (campaign.id === 4) {
          // 删除后重新注册的用户，不享受新用户优惠
          if (deletedUser || !userId) {
            return null;
          }
          const userCreationTime = new Date(user.created_at).getTime();
          const currentTime = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          const endTime = userCreationTime + hours24;

          if (currentTime < endTime) {
            return {
              ...campaign,
              end_time: new Date(endTime).toISOString(),
            };
          }
          // 新用户促销已过期，过滤掉
          return null;
        }
        if (campaign.end_time) {
          const endTime = new Date(campaign.end_time).getTime();
          const currentTime = Date.now();
          if (currentTime > endTime) {
            return null;
          }
          return {
            ...campaign,
            end_time: new Date(endTime).toISOString(),
          };
        }
        return campaign;
      })
      .filter(Boolean) as Campaign[];

    // 如果没有有效的活动，返回不 eligible
    if (enrichedCampaigns.length <= 0) {
      return new Response(
        JSON.stringify({ is_eligible: false, reason: 'no_eligible_promotion' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const toNumber = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return null;
    };

    const campaignIds = enrichedCampaigns.map(campaign => campaign.id);
    let subscriptionPromotions: SubscriptionPromotion[] = [];

    if (campaignIds.length > 0) {
      const { data: promotionRows, error: promotionError } = await supabase
        .from(PROMOTION_TABLE)
        .select('campaign_id, plan_code, price')
        .in('campaign_id', campaignIds);

      if (promotionError) {
        console.error(
          'Error fetching subscription promotions:',
          promotionError,
        );
      } else {
        subscriptionPromotions = (promotionRows || [])
          .map(promotion => {
            const campaignId = toNumber(promotion.campaign_id);
            const planCode =
              promotion.plan_code === null
                ? null
                : toNumber(promotion.plan_code);
            const price = toNumber(promotion.price);

            if (
              campaignId === null ||
              planCode === null ||
              price === null ||
              price <= 0
            ) {
              return null;
            }

            return {
              campaign_id: campaignId,
              plan_code: planCode,
              price,
            };
          })
          .filter(Boolean) as SubscriptionPromotion[];
      }
    }

    // 7. 返回所有有效的活动，让前端根据 priority 选择显示哪个
    const response: PromotionResponse = {
      is_eligible: true,
      campaigns: enrichedCampaigns,
      subscription_promotions: subscriptionPromotions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting active promotion:', error);
    return new Response(JSON.stringify({ is_eligible: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
