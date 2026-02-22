/**
 * 广告隐私同意管理工具
 * 用于管理用户对广告数据收集的同意状态
 */

const AD_CONSENT_COOKIE = 'ad_privacy_consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1年（秒）

export type ConsentStatus = 'accepted' | 'rejected' | 'unknown';

/**
 * 获取用户的广告隐私同意状态
 */
export function getAdConsentStatus(): ConsentStatus {
  if (typeof document === 'undefined') {
    return 'unknown'; // SSR 环境
  }

  const cookies = document.cookie.split(';').map(c => c.trim());

  // 查找 ad_privacy_consent cookie
  const consentCookie = cookies.find(c =>
    c.startsWith(`${AD_CONSENT_COOKIE}=`),
  );

  if (!consentCookie) {
    return 'unknown'; // 用户尚未做出选择
  }

  const value = consentCookie.split('=')[1];

  if (value === 'true') {
    return 'accepted';
  }
  if (value === 'false') {
    return 'rejected';
  }

  return 'unknown';
}

/**
 * 设置用户接受广告隐私同意
 */
export function acceptAdConsent(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AD_CONSENT_COOKIE}=true; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Strict`;
}

/**
 * 设置用户拒绝广告隐私同意
 */
export function rejectAdConsent(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AD_CONSENT_COOKIE}=false; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Strict`;
}

/**
 * 清除广告隐私同意状态（用户可以重新选择）
 */
export function clearAdConsent(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // 设置过期时间为过去，删除 cookie
  document.cookie = `${AD_CONSENT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * 检查是否应该显示同意弹窗
 */
export function shouldShowConsentModal(): boolean {
  return getAdConsentStatus() === 'unknown';
}
