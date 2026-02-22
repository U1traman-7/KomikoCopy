import { atom } from 'jotai';

// 类型定义
export interface Campaign {
  id: number;
  code: string;
  type: number; // 1=新用户, 2=节假日等
  status: number;
  priority: number;
  start_time: string;
  end_time: string | null; // 后端修改后：新用户促销包含计算的过期时间
  discount?: number; // 折扣百分比 (如 20 表示 20% off)
  theme?: string;
  show_modal: boolean;
  modal_config: {
    version: number;
    media_url: string;
    i18n_title_key?: string;
    i18n_description_key?: string;
    redirect_url?: string;
  } | null;
}

export interface SubscriptionPromotion {
  campaign_id: number;
  plan_code: number;
  price: number;
}

export interface PromotionData {
  isEligible: boolean;
  campaigns: Campaign[];
  subscriptionPromotions: SubscriptionPromotion[];
  loaded: boolean;
}

// 初始状态
const initialPromotionData: PromotionData = {
  isEligible: false,
  campaigns: [],
  subscriptionPromotions: [],
  loaded: false,
};

// 数据存储 atom
export const promotionDataAtom = atom<PromotionData>(initialPromotionData);

// 派生 atom: 获取优先级最高的活动
export const topCampaignAtom = atom(get => {
  const data = get(promotionDataAtom);
  if (!data.isEligible || data.campaigns.length === 0) {
    return null;
  }
  return data.campaigns[0]; // API 已按 priority 排序
});

// 派生 atom: 获取结束时间（统一接口）
export const promotionEndTimeAtom = atom(get => {
  const campaign = get(topCampaignAtom);
  return campaign?.end_time ?? null;
});

// 派生 atom: 检查是否已过期
export const isPromotionExpiredAtom = atom(get => {
  const endTime = get(promotionEndTimeAtom);
  if (!endTime) {
    return true;
  }
  return new Date(endTime).getTime() < Date.now();
});

interface PromotionResponse {
  is_eligible: boolean;
  campaigns?: Campaign[];
  subscription_promotions?: SubscriptionPromotion[];
  reason?: string;
}
// 异步 atom: 获取促销数据
export const fetchPromotionAtom = atom(
  null, // 无读函数
  async (get, set) => {
    try {
      const response = await fetch('/api/getActivePromotion');
      const data: PromotionResponse = await response.json();

      set(promotionDataAtom, {
        isEligible: data.is_eligible,
        campaigns: data.campaigns || [],
        subscriptionPromotions: data.subscription_promotions || [],
        loaded: true,
      });
    } catch (error) {
      console.error('Failed to fetch promotion data:', error);
      set(promotionDataAtom, initialPromotionData);
    }
  },
);

// 清空促销数据 atom（登出时使用）
export const clearPromotionAtom = atom(null, async (get, set) => {
  set(promotionDataAtom, initialPromotionData);
});
