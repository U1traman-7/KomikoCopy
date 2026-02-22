/* eslint-disable */
import posthog from 'posthog-js';
import { aiTools } from '../constants';

// 事件名称常量
export const EVENTS = {
  // 用户行为
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // 付费行为
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // 一次性购买
  ONE_TIME_PURCHASE_COMPLETED: 'one_time_purchase_completed',

  // 页面浏览
  PAGE_VIEWED: 'page_viewed',

  // 工具使用
  TOOL_USED: 'tool_used',
  IMAGE_GENERATED: 'image_generated',
  VIDEO_GENERATED: 'video_generated',
  CREDITS_SPENT: 'credits_spent',

  // 付费转化漏斗事件
  PAYWALL_TRIGGERED: 'paywall_triggered', // 用户触发付费墙
  PRICING_MODAL_VIEWED: 'pricing_modal_viewed', // 用户看到定价模态框
  PRICING_PAGE_VIEWED: 'pricing_page_viewed', // 用户访问定价页面
  PLAN_CLICKED: 'plan_clicked', // 用户点击某个计划
  UPGRADE_BUTTON_CLICKED: 'upgrade_button_clicked', // 用户点击升级按钮
  PAYMENT_FLOW_STARTED: 'payment_flow_started', // 用户开始付费流程
} as const;

// 用户属性接口
export interface UserProperties {
  email?: string;
  plan?: string;
  subscription_status?: string;
  total_credits?: number;
  registration_date?: string;
  user_segment?: string;
}

// 安全的PostHog追踪函数
export const safeCapture = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  // Disable PostHog in local development
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  try {
    if (typeof window !== 'undefined' && posthog?.capture) {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        source: 'frontend',
      });
    }
  } catch (error) {
    console.warn('PostHog capture failed:', error);
  }
};

// 设置用户属性
export const setUserProperties = (properties: UserProperties) => {
  // Disable PostHog in local development
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  try {
    if (typeof window !== 'undefined' && posthog?.people?.set) {
      posthog.people.set(properties);
    }
  } catch (error) {
    console.warn('PostHog user properties failed:', error);
  }
};

// 追踪用户登录
export const trackUserLogin = (
  userId: string,
  email: string,
  method: 'email' | 'google' = 'email',
) => {
  safeCapture(EVENTS.USER_LOGGED_IN, {
    user_id: userId,
    email,
    login_method: method,
  });
};

// 追踪支付发起
export const trackPaymentInitiated = (
  userId: string,
  plan: string,
  amount: number,
  currency = 'USD',
) => {
  safeCapture(EVENTS.PAYMENT_INITIATED, {
    user_id: userId,
    plan,
    amount,
    currency,
  });
};

// 创建路径到分类的映射
const createPathToCategoryMap = () => {
  const pathToCategory = new Map<string, string>();

  if (aiTools && Array.isArray(aiTools)) {
    aiTools.forEach(toolSet => {
      if (toolSet && toolSet.entries && Array.isArray(toolSet.entries)) {
        toolSet.entries.forEach(tool => {
          if (tool && tool.path) {
            pathToCategory.set(tool.path, toolSet.category);
          }
        });
      }
    });
  }

  return pathToCategory;
};

// 全局映射表，只创建一次
const PATH_TO_CATEGORY_MAP = createPathToCategoryMap();

// 追踪页面浏览
export const trackPageView = (
  url: string,
  userId?: string,
  additionalData?: Record<string, any>,
) => {
  // 解析URL信息
  const urlObj = new URL(
    url,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://komiko.app',
  );
  const pathname = urlObj.pathname;

  /**
   * 自动从constants配置中获取页面分类
   *
   * 这个函数会根据aiTools配置自动确定页面分类，避免硬编码。
   * 首先检查是否为精确匹配，然后检查路径前缀匹配。
   *
   * @param path - URL路径
   * @returns 分类字符串
   */
  const getPageCategory = (path: string): string => {
    // 精确匹配
    if (PATH_TO_CATEGORY_MAP.has(path)) {
      return PATH_TO_CATEGORY_MAP.get(path)!;
    }

    // 前缀匹配 - 检查是否有工具路径是当前路径的前缀
    for (const [toolPath, category] of PATH_TO_CATEGORY_MAP.entries()) {
      if (path.startsWith(toolPath + '/') || path.startsWith(toolPath + '?')) {
        return category;
      }
    }

    // 特殊页面的基本分类（不在aiTools中的页面）
    if (path === '/') return 'home';
    if (path.startsWith('/pricing')) return 'pricing';
    if (path.startsWith('/login') || path.startsWith('/register'))
      return 'auth';
    if (path.startsWith('/user/')) return 'profile';
    if (path.startsWith('/character/')) return 'character';
    if (path.startsWith('/blog')) return 'blog';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/tools')) return 'tools_overview';

    return 'other';
  };

  // 获取页面标题
  const pageTitle = typeof document !== 'undefined' ? document.title : '';

  // 获取引荐来源
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  safeCapture(EVENTS.PAGE_VIEWED, {
    url,
    pathname,
    page_title: pageTitle,
    page_category: getPageCategory(pathname),
    referrer,
    user_id: userId,
    user_type: userId ? 'logged_in' : 'anonymous',
    timestamp: new Date().toISOString(),
    // UTM参数
    utm_source: urlObj.searchParams.get('utm_source'),
    utm_medium: urlObj.searchParams.get('utm_medium'),
    utm_campaign: urlObj.searchParams.get('utm_campaign'),
    utm_content: urlObj.searchParams.get('utm_content'),
    utm_term: urlObj.searchParams.get('utm_term'),
    // 设备信息
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : null,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : null,
    ...additionalData,
  });
};

// 获取用户分群
export const getUserSegment = (
  registrationDate: string,
  plan: string,
  subscriptionStatus: string,
): string => {
  const daysSinceRegistration = Math.floor(
    (Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (plan !== 'Free' || subscriptionStatus === 'active') {
    return 'paying_user';
  } else if (daysSinceRegistration <= 7) {
    return 'new_user';
  } else if (daysSinceRegistration <= 30) {
    return 'active_user';
  } else {
    return 'inactive_user';
  }
};

// 追踪工具使用
export const trackToolUsage = (
  userId: string,
  toolName: string,
  additionalProperties?: Record<string, any>,
) => {
  safeCapture(EVENTS.TOOL_USED, {
    tool_name: toolName,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ...additionalProperties,
  });
};

// 用户注册事件
export const trackUserRegistration = (
  userId: string,
  email: string,
  registrationMethod: 'email' | 'google' = 'email',
) => {
  safeCapture(EVENTS.USER_REGISTERED, {
    user_id: userId,
    email,
    registration_method: registrationMethod,
  });

  setUserProperties({
    email,
    registration_date: new Date().toISOString(),
    user_segment: 'new_user',
  });
};

// 用户登出事件
export const trackUserLogout = (userId: string) => {
  safeCapture(EVENTS.USER_LOGGED_OUT, {
    user_id: userId,
  });
};

// 付费完成事件
export const trackPaymentCompleted = (
  userId: string,
  plan: string,
  amount: number,
  paymentMethod: string,
  currency = 'USD',
) => {
  safeCapture(EVENTS.PAYMENT_COMPLETED, {
    user_id: userId,
    plan,
    amount,
    payment_method: paymentMethod,
    currency,
  });
};

// 订阅开始事件
export const trackSubscriptionStarted = (
  userId: string,
  plan: string,
  amount: number,
  billingCycle: 'monthly' | 'annual',
  currency = 'USD',
) => {
  safeCapture(EVENTS.SUBSCRIPTION_STARTED, {
    user_id: userId,
    plan,
    amount,
    billing_cycle: billingCycle,
    currency,
  });

  setUserProperties({
    plan,
    subscription_status: 'active',
    user_segment: 'paying_user',
  });
};

// 订阅续费事件（复购）
export const trackSubscriptionRenewed = (
  userId: string,
  plan: string,
  amount: number,
  billingCycle: 'monthly' | 'annual',
  currency = 'USD',
) => {
  safeCapture(EVENTS.SUBSCRIPTION_RENEWED, {
    user_id: userId,
    plan,
    amount,
    billing_cycle: billingCycle,
    currency,
  });

  setUserProperties({
    plan,
    subscription_status: 'active',
    user_segment: 'retained_user',
  });
};

// 订阅取消事件
export const trackSubscriptionCancelled = (
  userId: string,
  plan: string,
  reason?: string,
) => {
  safeCapture(EVENTS.SUBSCRIPTION_CANCELLED, {
    user_id: userId,
    plan,
    reason,
  });

  setUserProperties({
    subscription_status: 'cancelled',
    user_segment: 'churned_user',
  });
};

// 一次性购买完成事件
export const trackOneTimePurchaseCompleted = (
  userId: string,
  packageType: string,
  amount: number,
  credits: number,
  currency = 'USD',
) => {
  safeCapture(EVENTS.ONE_TIME_PURCHASE_COMPLETED, {
    user_id: userId,
    package_type: packageType,
    amount,
    credits_purchased: credits,
    currency,
  });
};

// 图片生成事件
export const trackImageGenerated = (
  userId: string,
  toolName: string,
  creditsUsed: number,
  success: boolean,
  additionalProperties?: Record<string, any>,
) => {
  safeCapture(EVENTS.IMAGE_GENERATED, {
    user_id: userId,
    tool_name: toolName,
    credits_used: creditsUsed,
    success,
    timestamp: new Date().toISOString(),
    ...additionalProperties,
  });
  if (success) {
    trackCreditsSpent(userId, toolName, creditsUsed, 'image_generation');
  }
};

// 视频生成事件
export const trackVideoGenerated = (
  userId: string,
  toolName: string,
  creditsUsed: number,
  success: boolean,
) => {
  safeCapture(EVENTS.VIDEO_GENERATED, {
    user_id: userId,
    tool_name: toolName,
    credits_used: creditsUsed,
    success,
  });
  if (success) {
    trackCreditsSpent(userId, toolName, creditsUsed, 'video_generation');
  }
};

// 统一的信用点消耗事件 (Zap)
export const trackCreditsSpent = (
  userId: string,
  toolName: string,
  creditsUsed: number,
  source: 'image_generation' | 'video_generation' | 'other',
) => {
  if (creditsUsed > 0) {
    safeCapture(EVENTS.CREDITS_SPENT, {
      user_id: userId,
      amount: creditsUsed,
      source,
      tool_name: toolName,
    });
  }
};

// 特定页面追踪函数
export const trackPricingPageView = (
  userId?: string,
  billingCycle?: 'monthly' | 'annual',
) => {
  trackPageView(window.location.href, userId, {
    billing_cycle_selected: billingCycle,
    page_type: 'pricing_page',
  });
};

export const trackToolPageView = (toolName: string, userId?: string) => {
  trackPageView(window.location.href, userId, {
    tool_name: toolName,
    page_type: 'tool_page',
  });
};

export const trackBlogArticleView = (
  articleTitle: string,
  articleSlug: string,
  userId?: string,
) => {
  trackPageView(window.location.href, userId, {
    article_title: articleTitle,
    article_slug: articleSlug,
    page_type: 'blog_article',
  });
};

export const trackCharacterPageView = (
  characterId: string,
  isOwner: boolean,
  userId?: string,
) => {
  trackPageView(window.location.href, userId, {
    character_id: characterId,
    is_owner: isOwner,
    page_type: 'character_page',
  });
};

export const trackUserProfileView = (
  profileUserId: string,
  isOwnProfile: boolean,
  userId?: string,
) => {
  trackPageView(window.location.href, userId, {
    profile_user_id: profileUserId,
    is_own_profile: isOwnProfile,
    page_type: 'user_profile',
  });
};

export const trackCanvasPageView = (
  userId?: string,
  hasExistingProject?: boolean,
) => {
  trackPageView(window.location.href, userId, {
    has_existing_project: hasExistingProject,
    page_type: 'canvas_editor',
  });
};

// 付费转化漏斗追踪函数

/**
 * 追踪付费墙触发事件
 * @param userId 用户ID
 * @param trigger 触发原因
 * @param toolName 工具名称
 * @param limitType 限制类型
 * @param currentUsage 当前使用量
 * @param limitValue 限制值
 * @param additionalData 额外数据
 */
export const trackPaywallTriggered = (
  userId: string,
  trigger: 'credit_insufficient' | 'usage_limit' | 'feature_limit',
  toolName?: string,
  limitType?: string,
  currentUsage?: number,
  limitValue?: number,
  additionalData?: Record<string, any>,
) => {
  safeCapture(EVENTS.PAYWALL_TRIGGERED, {
    user_id: userId,
    trigger_reason: trigger,
    tool_name: toolName,
    limit_type: limitType,
    current_usage: currentUsage,
    limit_value: limitValue,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * 追踪定价模态框查看事件
 * @param userId 用户ID
 * @param source 来源（从哪里打开的）
 * @param triggerTool 触发工具
 */
export const trackPricingModalViewed = (
  userId: string,
  source: 'paywall' | 'navbar' | 'sidebar' | 'profile' | 'manual',
  triggerTool?: string,
) => {
  safeCapture(EVENTS.PRICING_MODAL_VIEWED, {
    user_id: userId,
    source,
    trigger_tool: triggerTool,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 追踪计划点击事件
 * @param userId 用户ID
 * @param planName 计划名称
 * @param planPrice 计划价格
 * @param billingCycle 计费周期
 * @param currentPlan 当前计划
 * @param source 来源
 */
export const trackPlanClicked = (
  userId: string,
  planName: string,
  planPrice: number,
  billingCycle: 'monthly' | 'annual',
  currentPlan?: string,
  source?: 'modal' | 'page',
) => {
  safeCapture(EVENTS.PLAN_CLICKED, {
    user_id: userId,
    plan_name: planName,
    plan_price: planPrice,
    billing_cycle: billingCycle,
    current_plan: currentPlan,
    source,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 追踪升级按钮点击事件
 * @param userId 用户ID
 * @param buttonLocation 按钮位置
 * @param targetPlan 目标计划
 */
export const trackUpgradeButtonClicked = (
  userId: string,
  buttonLocation: 'sidebar' | 'profile' | 'modal' | 'navbar' | 'paywall',
  targetPlan?: string,
) => {
  safeCapture(EVENTS.UPGRADE_BUTTON_CLICKED, {
    user_id: userId,
    button_location: buttonLocation,
    target_plan: targetPlan,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 追踪付费流程开始事件
 * @param userId 用户ID
 * @param planName 选择的计划
 * @param planPrice 计划价格
 * @param paymentMethod 付费方式
 * @param source 来源
 */
export const trackPaymentFlowStarted = (
  userId: string,
  planName: string,
  planPrice: number,
  paymentMethod: string,
  source: 'modal' | 'page',
) => {
  safeCapture(EVENTS.PAYMENT_FLOW_STARTED, {
    user_id: userId,
    plan_name: planName,
    plan_price: planPrice,
    payment_method: paymentMethod,
    source,
    timestamp: new Date().toISOString(),
  });
};

// Service Worker 相关追踪函数
export const trackServiceWorkerError = (
  error: string,
  errorType:
    | 'uncaught'
    | 'unhandled_rejection'
    | 'cache_error'
    | 'fetch_error' = 'uncaught',
  userId?: string,
) => {
  safeCapture('service_worker_error', {
    user_id: userId,
    error_message: error,
    error_type: errorType,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window?.location?.href : undefined,
    user_agent:
      typeof navigator !== 'undefined' ? navigator?.userAgent : undefined,
  });
};

export const trackServiceWorkerPerformanceWarning = (
  message: string,
  cacheSize?: number,
  userId?: string,
) => {
  safeCapture('service_worker_performance_warning', {
    user_id: userId,
    warning_message: message,
    cache_size: cacheSize,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window?.location?.href : undefined,
  });
};

export const trackServiceWorkerCacheCleanup = (
  cleanupType: 'manual' | 'automatic' | 'emergency',
  itemsDeleted: number,
  userId?: string,
) => {
  safeCapture('service_worker_cache_cleanup', {
    user_id: userId,
    cleanup_type: cleanupType,
    items_deleted: itemsDeleted,
    timestamp: new Date().toISOString(),
  });
};

// 通用错误追踪函数
export const trackError = (
  error: Error | unknown,
  context: {
    source: string;
    step?: string;
    userId?: string;
    additionalData?: Record<string, any>;
  },
) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorType = error instanceof Error ? error.name : 'UnknownError';

  safeCapture('$exception', {
    $exception_message: errorMessage,
    $exception_type: errorType,
    $exception_source: context.source,
    step: context.step,
    user_id: context.userId,
    // 网络状态信息
    online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    connection_type:
      typeof navigator !== 'undefined'
        ? (navigator as any).connection?.effectiveType
        : undefined,
    ...context.additionalData,
  });
};

export default {
  safeCapture,
  setUserProperties,
  trackUserRegistration,
  trackUserLogin,
  trackUserLogout,
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackSubscriptionStarted,
  trackSubscriptionRenewed,
  trackSubscriptionCancelled,
  trackOneTimePurchaseCompleted,
  trackPageView,
  trackPricingPageView,
  trackToolPageView,
  trackBlogArticleView,
  trackCharacterPageView,
  trackUserProfileView,
  trackCanvasPageView,
  trackToolUsage,
  trackImageGenerated,
  trackVideoGenerated,
  trackCreditsSpent,
  getUserSegment,
  trackPaywallTriggered,
  trackPricingModalViewed,
  trackPlanClicked,
  trackUpgradeButtonClicked,
  trackPaymentFlowStarted,
  trackServiceWorkerError,
  trackServiceWorkerPerformanceWarning,
  trackServiceWorkerCacheCleanup,
  trackError,
  EVENTS,
};
