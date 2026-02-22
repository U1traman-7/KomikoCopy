export enum PlanCode {
  // monthly
  PREMIUM = 1,
  PLUS = 2,
  STARTER = 3,

  // annual
  PREMIUM_ANNUAL = 4,
  PLUS_ANNUAL = 5,
  STARTER_ANNUAL = 6,
}

export enum CycleMode {
  MONTHLY = 1,
  ANNUAL = 2,
}

export enum SubscriptionStatus {
  NONE = 0,
  ACTIVE = 1,
  CANCELLED = 2,
}

export interface Subscription {
  id: string;
  credit: number;
  expires: number;
  period_expires: number;
  plan_code: {
    plan_code: PlanCode;
    name: string;
    credit: number;
  };
  status: SubscriptionStatus;
}

export const OneTimePackPrice = {
  XS: process.env.ONE_TIME_ZAPS_PRICE_ID_099,
  S: process.env.ONE_TIME_ZAPS_PRICE_ID_499,
  // SM: process.env.ONE_TIME_ZAPS_PRICE_ID_999,
  M: process.env.ONE_TIME_ZAPS_PRICE_ID_1999,
  L: process.env.ONE_TIME_ZAPS_PRICE_ID_3999,
  XL: process.env.ONE_TIME_ZAPS_PRICE_ID_9999,
  XXL: process.env.ONE_TIME_ZAPS_PRICE_ID_39999,
} as const;

export type OneTimePackPriceType = keyof typeof OneTimePackPrice;
