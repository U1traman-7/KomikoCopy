import { OneTimePackPriceType, PlanCode } from "../../api/payment/_constant";
import { get, post } from "./request";

export type Plan = 'Free' | 'Starter' | 'Plus' | 'Premium';

interface CreatePaymentLinkParams {
  plan: Exclude<Plan, 'Free'>;
  plan_code: PlanCode;
  redirectUrl?: string;
}

interface APIResponse<T = any> {
  code: number;
  message: string;
  data: T;
  error?: string;
}
interface CreatePaymentLinkResponse extends APIResponse {
  data: {
    url: string;
  };
}

export const createPaymentLink = async (params: CreatePaymentLinkParams) => {
  const response = await post<CreatePaymentLinkResponse>('/api/payment/create', {
    plan: params.plan,
    plan_code: params.plan_code,
    redirectUrl: params.redirectUrl || location.href,
  });
  return response;
};

export const cancelSubscription = async () => {
  const response = await get<APIResponse>('/api/payment/subscription/cancel');
  return response;
};

export const manageSubscriptionPortal = async () => {
  const response = await get<APIResponse<{ url: string }>>('/api/payment/subscription/manage');
  return response;
};

interface CreateOneTimeZapsParams {
  type: OneTimePackPriceType;
  redirectUrl?: string;
}
interface CreateOneTimeZapsResponse extends APIResponse {
  data: {
    url: string;
  };
}
export const createOneTimeZaps = async (params: CreateOneTimeZapsParams) =>
   post<CreateOneTimeZapsResponse>('/api/payment/createOneTime', params);
