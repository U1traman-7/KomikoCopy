/* eslint-disable */
import { NextUIProvider } from '@nextui-org/react';
import { Header } from '../../Components/Header';
import Head from 'next/head';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { useRouter } from 'next/router';
import {
  cancelSubscription,
  manageSubscriptionPortal,
  createOneTimeZaps,
  createPaymentLink,
  type Plan,
} from '../../api/pricing';
import { Button } from '@nextui-org/react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLoginModal } from '../../hooks/useLoginModal';
import { fetchProfile } from '../../api/profile';
import FAQ from '@/components/FAQ';
import MarketingLayout from 'Layout/MarketingLayout';
import {
  OneTimePackPrice,
  OneTimePackPriceType,
  PlanCode,
  SubscriptionStatus,
} from '../../../api/payment/_constant';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';
import { profileAtom, promotionDataAtom, topCampaignAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { Profile } from 'next-auth';
import toast from 'react-hot-toast';
import { TestimonialsSection } from '@/components/Landing/TestimonialsSection';
import { FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { toastError } from '@/utils/index';
import cn from 'classnames';
import { SEOTags } from '@/components/common/SEOTags';
import {
  trackPaymentInitiated,
  trackPricingPageView,
} from '../../utilities/analytics';
import styles from './Pricing.module.scss';
import { Crown } from 'lucide-react';

type PricingCompProps = {
  className?: string;
};
const plansOrder = ['Starter', 'Plus', 'Premium', 'Enterprise'];
const plansCodeOrder = [
  [PlanCode.STARTER, PlanCode.STARTER_ANNUAL],
  [PlanCode.PLUS, PlanCode.PLUS_ANNUAL],
  [PlanCode.PREMIUM, PlanCode.PREMIUM_ANNUAL],
];
export const PricingComp = memo(({ className }: PricingCompProps) => {
  const router = typeof window !== 'undefined' ? useRouter() : null;
  const { t } = useTranslation('pricing');
  const [isMounted, setIsMounted] = useState(false);
  const topCampaign = useAtomValue(topCampaignAtom);
  const promotionData = useAtomValue(promotionDataAtom);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [planLoading, setPlanLoading] = useState({
    Free: false,
    Starter: false,
    Plus: false,
    Premium: false,
  });
  const [disabled, setDisabled] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const choosePlan = (plan: Plan) => {
    if (!isAuth) {
      onOpen();
      return;
    }
    if (plan === 'Free') {
      if (isMounted && router) {
        router.back();
      }
      return;
    }
    setDisabled(true);
    setPlanLoading(prev => ({ ...prev, [plan]: true }));
    let planCode = PlanCode.STARTER;
    if (plan === 'Starter' && billingCycle === 'monthly') {
      planCode = PlanCode.STARTER;
    } else if (plan === 'Starter' && billingCycle === 'annual') {
      planCode = PlanCode.STARTER_ANNUAL;
    } else if (plan === 'Plus' && billingCycle === 'monthly') {
      planCode = PlanCode.PLUS;
    } else if (plan === 'Plus' && billingCycle === 'annual') {
      planCode = PlanCode.PLUS_ANNUAL;
    } else if (plan === 'Premium' && billingCycle === 'monthly') {
      planCode = PlanCode.PREMIUM;
    } else if (plan === 'Premium' && billingCycle === 'annual') {
      planCode = PlanCode.PREMIUM_ANNUAL;
    }

    // Track payment initiation
    try {
      if (profile?.id) {
        // Get plan pricing for tracking
        const planData = plans.find(p => p.key === plan);
        let amount = 0;
        if (planData && typeof planData.price === 'object') {
          amount = parseFloat(planData.price[billingCycle].replace('$', ''));
        } else if (planData && typeof planData.price === 'string') {
          amount = parseFloat(planData.price.replace('$', ''));
        }

        trackPaymentInitiated(profile.id, plan, amount, 'USD');
      }
    } catch (error) {
      console.error('Error tracking payment initiation:', error);
    }

    createPaymentLink({ plan, plan_code: planCode })
      .then(res => {
        if (res.code === 1) {
          location.href = res.data.url;
        }
      })
      .finally(() => {
        setTimeout(() => {
          setPlanLoading(prev => ({ ...prev, [plan]: false }));
          setDisabled(false);
        }, 1000);
      });
  };

  type PlanItem = {
    key: string;
    name: string;
    description: string;
    price:
      | string
      | {
          monthly: string;
          annual: string;
        };
    includes: string[];
    isPopular?: boolean;
    order: number;
    zaps: string;
  };

  const plans: PlanItem[] = [
    {
      ...t('plans.starter', { returnObjects: true }),
      order: 3,
      key: 'Starter',
    } as unknown as PlanItem,
    {
      ...t('plans.plus', { returnObjects: true }),
      order: 2,
      key: 'Plus',
      isPopular: true,
    } as unknown as PlanItem,
    {
      ...t('plans.premium', { returnObjects: true }),
      order: 1,
      key: 'Premium',
    } as unknown as PlanItem,
    {
      ...t('plans.enterprise', { returnObjects: true }),
      order: 4,
      key: 'Enterprise',
      zaps: '',
    } as unknown as PlanItem,
  ];

  const promotionPriceMap = useMemo(() => {
    if (!promotionData.isEligible || !topCampaign) {
      return new Map<number, number>();
    }

    const map = new Map<number, number>();
    promotionData.subscriptionPromotions.forEach(promotion => {
      if (promotion.campaign_id !== topCampaign.id) {
        return;
      }

      const planCode = Number(promotion.plan_code);
      const priceCents = Number(promotion.price);
      if (!Number.isFinite(planCode) || !Number.isFinite(priceCents)) {
        return;
      }
      if (priceCents <= 0) {
        return;
      }

      map.set(planCode, priceCents);
    });

    return map;
  }, [
    promotionData.isEligible,
    promotionData.subscriptionPromotions,
    topCampaign?.id,
  ]);

  const getAnnualPlanCode = (planKey: string) => {
    switch (planKey) {
      case 'Starter':
        return PlanCode.STARTER_ANNUAL;
      case 'Plus':
        return PlanCode.PLUS_ANNUAL;
      case 'Premium':
        return PlanCode.PREMIUM_ANNUAL;
      default:
        return null;
    }
  };

  const formatCentsToUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatMonthlyFromAnnual = (annualPrice: string) => {
    const annualValue = Number(annualPrice.replace('$', ''));
    if (!Number.isFinite(annualValue)) {
      return annualPrice;
    }
    return `$${(Math.round((annualValue * 100) / 12) / 100).toFixed(2)}`;
  };

  const [currentPlan, setCurrentPlan] = useState('Free');
  const [plansCode, setPlansCode] = useState<PlanCode[]>([]);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  );
  const [profile, setProfile] = useAtom(profileAtom);
  const { LoginModal, onOpen, isAuth } = useLoginModal();

  // XS 包购买状态
  const [xsPackPurchased, setXsPackPurchased] = useState(false);
  const [xsPackChecking, setXsPackChecking] = useState(true);

  useEffect(() => {
    if (profile.id) {
      return;
    }
    fetchProfile().then(profile => {
      if (!(profile as any).error) {
        const planCode =
          profile.plan_codes.filter(code => code < 1000)?.[0] || 0;
        const currentPlanIndex = plansCodeOrder.findIndex(codes =>
          codes.includes(planCode),
        );
        const plan =
          currentPlanIndex >= 0 ? plansOrder[currentPlanIndex] : 'Free';
        setCurrentPlan(plan);
        setPlansCode(profile.plan_codes || []);
        setProfile(prev => ({
          ...prev,
          ...profile,
        }));
      }
    });
  }, [profile?.id]);

  // 查询 XS 包购买资格
  useEffect(() => {
    // 等待用户认证和 profile 加载完成
    if (!isAuth || !profile?.id) {
      setXsPackChecking(false);
      return;
    }

    const checkXSPackEligibility = async () => {
      try {
        setXsPackChecking(true);
        const response = await fetch('/api/payment/checkXSPackEligibility');
        const data = await response.json();

        if (response.ok && data.code === 1) {
          // eligible: true 表示可以购买，false 表示已购买
          setXsPackPurchased(!data.data.eligible);
        } else {
          console.error('[XS Pack Check] Failed to check eligibility:', data);
        }
      } catch (error) {
        console.error('[XS Pack Check] Error:', error);
      } finally {
        setXsPackChecking(false);
      }
    };

    checkXSPackEligibility();
  }, [isAuth, profile?.id]);

  const handleDoNotCancel = () => {
    setCancelLoading(true);
    cancelSubscription()
      .then(res => {
        if (res.code) {
          toast.success(t('toasts.subscriptionNotCancelled'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
          setProfile(prev => ({
            ...prev,
            subscription_status: SubscriptionStatus.ACTIVE,
          }));
        }
      })
      .finally(() => {
        setCancelLoading(false);
      });
  };

  // const currentPlanIndex = plansOrder.indexOf(currentPlan);
  const getButtonProps = useCallback(
    (plan: PlanItem) => {
      const index = plansOrder.indexOf(plan.key);
      const planCode = plansCode.filter(code => code < 1000)[0] || 0;
      const currentPlanIndex = plansCodeOrder.findIndex(codes =>
        codes.includes(planCode),
      );
      console.log(
        'currentPlanIndex',
        plan.key,
        index,
        currentPlanIndex,
        planCode,
        plansCode,
      );

      if (plan.key === 'Enterprise') {
        return {
          text: t('buttons.contactSales'),
          className: 'bg-foreground text-background hover:bg-foreground/80',
          disabled: false,
        };
      }
      if (!isAuth) {
        return {
          text: t('buttons.upgrade'),
          className: 'bg-indigo-600 text-white hover:bg-indigo-700',
          disabled: false,
        };
      }
      if (index > currentPlanIndex) {
        return {
          text: t('buttons.upgrade'),
          className:
            'bg-indigo-600 text-white ' +
            (currentPlan === 'Free'
              ? 'hover:bg-indigo-700'
              : 'opacity-75 cursor-not-allowed'),
          disabled: currentPlan !== 'Free',
        };
      }
      if (index < currentPlanIndex) {
        return {
          text: t('buttons.downgrade'),
          className: 'bg-muted text-muted-foreground cursor-not-allowed',
          disabled: currentPlan !== 'Free',
        };
      }
      if (index === currentPlanIndex) {
        console.log('currentPlanIndex', currentPlanIndex, currentPlan);
        return {
          text: t('buttons.currentPlan'),
          className: 'bg-muted text-muted-foreground cursor-not-allowed',
          disabled: currentPlan !== 'Free',
          showCancelLink: currentPlan !== 'Free',
        };
      }
    },
    [plansCode, currentPlan],
  );

  /**
   * @deprecated
   */
  const handleCancelSubscription = () => {
    setCancelLoading(true);
    cancelSubscription()
      .then(res => {
        if (res.code) {
          setShowCancelModal(false);
          toast.success(t('toasts.subscriptionCancelled'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
          setProfile(prev => ({
            ...prev,
            subscription_status: SubscriptionStatus.CANCELLED,
          }));
          setShowCancelModal(false);
        }
      })
      .catch(() => {
        toast.error(t('toasts.failedToCancel'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      })
      .finally(() => {
        setCancelLoading(false);
      });
  };

  const goToPortal = async () => {
    setCancelLoading(true);
    const res = await manageSubscriptionPortal().catch();
    if (!res?.code) {
      toastError(t('toasts.failedToFindSubscription'));
      setCancelLoading(false);
      return;
    }
    setCancelLoading(false);
    window.location.href = res.data.url;
  };

  useEffect(() => {
    if (isMounted) {
      // 追踪pricing页面访问
      trackPricingPageView(profile?.id, billingCycle);
    }
  }, [profile?.id, billingCycle, isMounted]);

  // eslint-disable-next-line
  const PlanComp = memo(() =>
    plans.map(plan => {
      const buttonProps = getButtonProps(plan);
      const annualPlanCode = getAnnualPlanCode(plan.key);
      const promoPriceCents = annualPlanCode
        ? promotionPriceMap.get(annualPlanCode)
        : null;
      const annualPrice =
        typeof plan.price === 'string'
          ? plan.price
          : promoPriceCents
            ? formatCentsToUSD(promoPriceCents)
            : plan.price.annual;
      const perMonthPrice =
        typeof plan.price === 'string'
          ? plan.price
          : billingCycle === 'monthly'
            ? plan.price.monthly
            : formatMonthlyFromAnnual(annualPrice);
      return (
        <div
          key={plan.key}
          className={cn(
            `rounded-lg md:order-none min-h-[480px] shadow-lg bg-card p-6 relative flex flex-col h-full`,
            {
              'order-1': plan.order === 1,
              'order-2': plan.order === 2,
              'order-3': plan.order === 3,
              'order-4': plan.order === 4,
              // 'border-2 border-indigo-600': plan.key === 'Plus',
              // 'border-2 border-secondary': plan.key === 'Starter',
              // 'border-2 border-yellow-500': plan.key === 'Premium',
              // 'border-2 border-blue-900': plan.key === 'Enterprise',
            },
            styles.card,
            {
              [styles.starterCard]: plan.key === 'Starter',
              [styles.plusCard]: plan.key === 'Plus',
              [styles.premiumCard]: plan.key === 'Premium',
              [styles.enterpriseCard]: plan.key === 'Enterprise',
            },
          )}>
          {plan.isPopular && (
            <div className={styles.popularTag}>
              <span>{t('plans.premium.popular')}</span>
            </div>
          )}

          {plan.key === currentPlan ? (
            <div className='absolute top-4 right-4'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
                {t('labels.active')}
              </span>
            </div>
          ) : null}
          <div className='text-center'>
            <h3 className={styles.cardTitle}>{plan.name}</h3>
            {/* <p className='mb-6 text-sm text-muted-foreground'>{plan.description}</p> */}

            <div>
              {typeof plan.price === 'string' ? (
                <>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.unit}>{t('labels.perMonth')}</span>
                  <div className='mt-1 text-sm text-muted-foreground h-[24px]' />
                </>
              ) : (
                <>
                  <span className={styles.price}>{perMonthPrice}</span>
                  <span className={styles.unit}>{t('labels.perMonth')}</span>
                  <div className='mt-1 text-sm text-muted-foreground h-[24px]'>
                    {billingCycle === 'annual' &&
                      annualPrice &&
                      t('labels.billedAnnually', { price: annualPrice })}
                  </div>
                </>
              )}
            </div>

            <div className={styles.splitLineContainer}>
              <div className={styles.splitLine} />
            </div>

            <div className={styles.creditContainer}>
              <img src='/images/zap-icon.svg' className={styles.zapIcon} />
              <span className={styles.zapCount}>
                {plan.zaps || t('custom')} &nbsp;
              </span>
            </div>
          </div>

          <ul className={cn('space-y-3', styles.points)}>
            {plan.includes.map(feature => (
              <li key={feature} className='flex items-start text-sm'>
                <svg
                  className='flex-shrink-0 w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                <span className='ml-0.5'>{feature}</span>
              </li>
            ))}
          </ul>

          <div className={styles.cardFooter}>
            {plan.key === 'Enterprise' ? (
              <a href='mailto:sales@komiko.app?subject=Komiko Enterprise Plan Inquiry&body=Hi%20Komiko%20Team,%0D%0A%0D%0AMy%20name%20is%20%5BFirst%20Name%5D%20%5BLast%20Name%5D,%20and%20I%E2%80%99m%20reaching%20out%20from%20%5BCompany%20Name%5D%20based%20in%20%5BCountry%5D.%20I%E2%80%99m%20currently%20serving%20as%20%5BJob%20Title%5D%20at%20our%20company.%20%0D%0A%0D%0AWe%20are%20exploring%20AI%20solutions%20and%20are%20very%20interested%20in%20using%20Komiko%20to%20support%20our%20content%20creation%20needs.%20Specifically,%20we%E2%80%99re%20looking%20to%20%5Bbrief%20description%20of%20your%20use%20case%5D%0D%0A%0D%0AWe%E2%80%99d%20love%20to%20learn%20more%20about%20how%20it%20works,%20pricing,%20and%20if%20it%20can%20fit%20into%20our%20current%20content%20pipeline.%20Let%20me%20know%20if%20we%20can%20set%20up%20a%20quick%20call.%0D%0A%0D%0AThanks,%0D%0A%5BYour%20Name%5D%0D%0A%5BYour%20Company%5D'>
                <Button
                  className={`w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all ${buttonProps!.className} ${styles.cardButton}`}>
                  {buttonProps!.text}
                </Button>
              </a>
            ) : currentPlan === 'Free' && plan.key !== 'Free' ? (
              <Button
                className={`w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all ${buttonProps!.className} ${styles.cardButton}`}
                onPress={() => choosePlan(plan.key as Plan)}
                isDisabled={disabled || buttonProps!.disabled}
                isLoading={planLoading[plan.key as keyof typeof planLoading]}>
                {buttonProps!.text}
              </Button>
            ) : (
              <div>
                {buttonProps?.showCancelLink ? (
                  <Button
                    color='default'
                    isLoading={cancelLoading}
                    onPress={() => goToPortal()}
                    className={cn(
                      'w-full font-bold !text-muted-foreground rounded-full',
                    )}>
                    {t('buttons.manageSubscription')}
                  </Button>
                ) : (
                  <button
                    disabled={disabled || buttonProps!.disabled}
                    className={`w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all ${buttonProps!.className} ${styles.cardButton}`}>
                    {buttonProps!.text}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }),
  );

  return (
    <ContentComp
      isAuth={isAuth}
      onOpen={onOpen}
      billingCycle={billingCycle}
      setBillingCycle={setBillingCycle}
      LoginModal={LoginModal}
      PlanComp={PlanComp}
      className={className}
      hasCampaign={!!topCampaign}
      xsPackPurchased={xsPackPurchased}
      xsPackChecking={xsPackChecking}
    />
  );
});

export const PricingFAQ = memo(() => {
  const { t } = useTranslation('pricing');
  const faqsRaw = t('faq.items', { returnObjects: true }) as {
    question: string;
    answer: string;
  }[];
  const faqs = faqsRaw.map((faq, index) => ({
    id: index,
    question: faq.question,
    answer: faq.answer,
  }));
  return (
    <div className='mx-auto mt-20 max-w-3xl'>
      <h2 className='mb-12 text-3xl font-bold text-center text-heading'>
        {t('page.faq')}
      </h2>
      <div className='space-y-6'>
        <FAQ faqs={faqs} />
      </div>
    </div>
  );
});

export default function Page() {
  const { t } = useTranslation('pricing');
  const router = useRouter();
  // const {submit: openModal} = useOpenModal()
  return (
    <MarketingLayout>
      <Head>
        <SEOTags
          canonicalPath='/pricing'
          title={t('meta.title')}
          description={t('meta.description')}
          ogImage='/images/social.webp'
          locale={router.locale || 'en'}
        />
      </Head>
      <Analytics />
      <PricingComp />
      <div className='px-4 pt-12 -mb-12'>
        <h2
          className={`text-foreground text-center font-sans mb-5 text-2xl font-bold leading-tight sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight`}>
          {/* Proudly a Top Product on Product Hunt */}
          {t('productHunt')}
        </h2>
        <div className='flex-center'>
          <a
            href='https://www.producthunt.com/products/framepack-ai-video-generator?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_source=badge-komikoai&#0045;video&#0045;to&#0045;video' // TODO: change to this one
            // href="https://www.producthunt.com/products/framepack-ai-video-generator?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-komiko&#0045;2"
            target='_blank'
            rel='noopener noreferrer nofollow'>
            <img
              src='/api/proxyProducthunt'
              alt='KomikoAI&#0032;Video&#0032;to&#0032;Video - Make&#0032;your&#0032;videos&#0032;pop&#0032;with&#0032;anime&#0044;&#0032;arcade&#0044;&#0032;fire&#0032;styles&#0032;&#0038;&#0032;more&#0033; | Product Hunt'
              style={{ width: '375px', height: '72px' }}
              width='375'
              height='72'
            />
          </a>
        </div>
      </div>
      <TestimonialsSection />
      <PricingFAQ />
      {/* <button onClick={() => openModal('pricing')}>提交</button> */}
    </MarketingLayout>
  );
}

interface ContentCompProps {
  LoginModal: React.ComponentType;
  PlanComp: React.ComponentType;
  isAuth: boolean;
  onOpen: () => void;
  billingCycle: 'monthly' | 'annual';
  setBillingCycle: (billingCycle: 'monthly' | 'annual') => void;
  className?: string;
  hasCampaign: boolean;
  xsPackPurchased: boolean;
  xsPackChecking: boolean;
}

// eslint-disable-next-line
export const ContentComp = memo(
  ({
    LoginModal,
    isAuth,
    onOpen,
    PlanComp,
    billingCycle,
    setBillingCycle,
    className,
    hasCampaign,
    xsPackPurchased,
    xsPackChecking,
  }: ContentCompProps) => {
    const { t } = useTranslation('pricing');
    const [viewMode, setViewMode] = useState<'subscription' | 'zap-packs'>(
      'subscription',
    );
    const [isLoading, setIsLoading] = useState(false);
    const profile = useAtomValue(profileAtom);
    const topCampaign = useAtomValue(topCampaignAtom);

    // 计算折扣金额（来自活动，默认 17%）
    const discountAmount = topCampaign?.discount ?? 17;

    const zapPacksRaw = t('zapPacks.packs', { returnObjects: true }) as {
      name: string;
      price: string;
      label: string;
      bonuses: { plan: string; amount: string }[];
    }[];
    const types = Object.keys(OneTimePackPrice) as OneTimePackPriceType[];
    const zapPacks = zapPacksRaw.map((pack, index) => ({
      ...pack,
      type: types[index],
    }));

    // 获取用户当前的订阅等级名称
    const getUserPlanTier = (): string | null => {
      const planCode = profile?.plan_codes?.filter(
        (code: number) => code < 1000,
      )?.[0];
      if (!planCode) return null;
      if (
        planCode === PlanCode.STARTER ||
        planCode === PlanCode.STARTER_ANNUAL
      )
        return 'Starter';
      if (planCode === PlanCode.PLUS || planCode === PlanCode.PLUS_ANNUAL)
        return 'Plus';
      if (
        planCode === PlanCode.PREMIUM ||
        planCode === PlanCode.PREMIUM_ANNUAL
      )
        return 'Premium';
      return null;
    };
    const userPlanTier = getUserPlanTier();
    const createOneTime = (type: OneTimePackPriceType) => {
      if (!isAuth) {
        onOpen();
        return;
      }

      // Track one-time purchase initiation
      try {
        if (profile?.id) {
          trackPaymentInitiated(profile.id, `OneTime_${type}`, 0, 'USD');
        }
      } catch (error) {
        console.error('Error tracking one-time purchase initiation:', error);
      }

      setIsLoading(true);
      createOneTimeZaps({ type, redirectUrl: window.location.href })
        .then(res => {
          if (res.code) {
            location.href = res.data.url;
          }
        })
        .catch(() => {
          setIsLoading(false);
          toast.error(t('toasts.failedToCreateZapPack'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        });
    };

    const ZapPacksComp = () => {
      // 皇冠颜色按索引映射: Starter=蓝, Plus=紫, Premium=金
      // 使用 hex 值直接传给 lucide color prop，避免 Tailwind 类名被 CSS 覆盖
      const CROWN_COLORS = ['#2563eb', '#9333ea', '#f59e0b'] as const; // blue-600, purple-600, amber-500
      // bonuses 数组固定顺序: [Starter, Plus, Premium]，用英文名匹配 userPlanTier
      const PLAN_TIERS = ['Starter', 'Plus', 'Premium'] as const;

      return (
      <div className='flex justify-center mt-8'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-[1200px] w-full'>
          {zapPacks.map((pack, index) => {
            const isSpecialOffer = pack.label === 'oneTimeOffer';
            const labelText = isSpecialOffer
              ? t('zapPacks.oneTimeOffer')
              : t('zapPacks.oneTimePurchase');
            // 拆分价格显示: "$" 与数字部分分开
            const priceMatch = pack.price.match(/^(\$)(.+)$/);
            const priceCurrency = priceMatch ? priceMatch[1] : '$';
            const priceValue = priceMatch ? priceMatch[2] : pack.price;

            return (
              <div
                key={index}
                className={cn(
                  'rounded-2xl shadow-md bg-card p-6 relative flex flex-col',
                  isSpecialOffer
                    ? 'border-2 border-indigo-500'
                    : 'border border-gray-200 dark:border-gray-700',
                )}>
                {/* 套餐名称 */}
                <div className='text-center'>
                  <h3 className='text-2xl font-bold text-heading'>
                    {pack.name}
                  </h3>
                  {/* 标签 */}
                  <p
                    className={cn(
                      'mt-1 text-xs font-semibold tracking-wide uppercase',
                      isSpecialOffer
                        ? 'text-indigo-600 italic'
                        : 'text-muted-foreground',
                    )}>
                    {labelText}
                  </p>
                </div>

                {/* 价格 */}
                <div className='flex justify-center items-baseline mt-5 mb-4'>
                  <span className='text-lg font-semibold text-foreground align-top'>
                    {priceCurrency}
                  </span>
                  <span className='text-5xl font-extrabold text-foreground leading-none'>
                    {priceValue}
                  </span>
                </div>

                {/* 分割线 */}
                <div className='mx-4 mb-4 border-t border-gray-200 dark:border-gray-700' />

                {/* 订阅者奖励 */}
                <div className='flex-1'>
                  <p className='mb-2 text-sm text-muted-foreground'>
                    {t('zapPacks.subscriberBonuses')}
                  </p>
                  <ul className='space-y-2'>
                    {pack.bonuses.map((bonus, idx) => {
                      // 使用索引匹配英文 plan 名称，避免 i18n 翻译导致匹配失败
                      const planTier = PLAN_TIERS[idx] || null;
                      const isActive = userPlanTier === planTier;
                      const crownColor = CROWN_COLORS[idx] || '#9ca3af'; // 默认 gray-400
                      return (
                        <li
                          key={idx}
                          className={cn(
                            'flex items-center text-sm rounded-md px-2 py-1 transition-all',
                            isActive
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 font-bold border-2 border-indigo-400 dark:border-indigo-500 shadow-md'
                              : 'border-2 border-transparent',
                          )}>
                          <Crown
                            color={crownColor}
                            className={cn(
                              'mr-2 shrink-0 transition-all',
                              isActive ? 'w-5 h-5' : 'w-4 h-4',
                              isActive && 'drop-shadow-lg',
                            )}
                          />
                          <span className='text-foreground'>
                            <span className={cn('font-medium', isActive && 'text-lg')}>
                              {bonus.plan}:
                            </span>{' '}
                            <span className={cn(
                              'text-indigo-600 dark:text-indigo-400',
                              isActive && 'font-extrabold text-indigo-700 dark:text-indigo-300'
                            )}>
                              {t('zapPacks.bonusZaps', {
                                amount: bonus.amount,
                              })}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* 购买按钮 */}
                <div className='mt-5'>
                  <Button
                    className='px-4 py-2.5 w-full text-sm font-bold text-center text-white bg-indigo-600 rounded-full transition-all hover:bg-indigo-700 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed'
                    onClick={() =>
                      createOneTime(pack.type as OneTimePackPriceType)
                    }
                    isDisabled={
                      isLoading ||
                      (pack.type === 'XS' && (xsPackChecking || xsPackPurchased))
                    }>
                    {pack.type === 'XS' && xsPackPurchased
                      ? t('zapPacks.alreadyPurchased')
                      : pack.type === 'XS' && xsPackChecking
                        ? t('zapPacks.checking')
                        : t('zapPacks.buyNow')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      );
    };

    return (
      <div
        className={cn(
          'px-4 py-12 bg-muted caffelabs sm:px-6 lg:px-8 sm:pt-[60px]',
          className,
        )}>
        <LoginModal />
        <div className='mx-auto max-w-7xl'>
          {/* Header with Toggle */}
          <div className='relative text-center'>
            <div className='flex justify-center items-center mb-6'>
              <h1 className='flex relative text-4xl font-bold text-heading md:whitespace-nowrap'>
                {viewMode === 'subscription'
                  ? t('page.title')
                  : t('page.zapPacksTitle')}
                <button
                  onClick={() =>
                    setViewMode(
                      viewMode === 'subscription'
                        ? 'zap-packs'
                        : 'subscription',
                    )
                  }
                  className='hidden md:inline-flex items-center px-2  ml-4 text-[18px] text-indigo-700 bg-indigo-100 rounded-md transition-colors hover:bg-indigo-200'>
                  <FaArrowRight className='mr-1.5' />
                  {viewMode === 'subscription'
                    ? t('page.one_time_pack')
                    : t('page.upgrade_plan')}
                </button>
              </h1>
            </div>
            <p className='hidden mx-auto mb-8 max-w-4xl text-xl text-muted-foreground md:block'>
              {viewMode === 'subscription'
                ? t('page.description')
                : t('page.zapPacksDescription')}
            </p>

            {/* Billing cycle toggle - only show for subscription view */}
            {viewMode === 'subscription' && (
              <>
                <div className='flex justify-center mb-8'>
                  <div
                    className={cn(
                      'inline-flex relative p-1 bg-muted rounded-full',
                    )}>
                    <div
                      className='absolute  rounded-full transition-transform duration-200 ease-in-out z-[1]'
                      style={{
                        width: '50%',
                        height: 'calc(100% - 8px)',
                        transform: `translateX(${billingCycle === 'annual' ? '92%' : '0'})`,
                        top: '4px',
                        left: '4px',
                        background: 'linear-gradient(135deg, #877CF4, #4F46E5)',
                      }}
                    />
                    <div
                      className={cn(styles.buttonGroupBorder, {
                        [styles.active]: hasCampaign,
                      })}></div>
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`relative px-4 py-2 font-semibold rounded-md transition-colors duration-200 z-[2] ${
                        billingCycle === 'monthly'
                          ? 'text-white'
                          : 'text-primary-600 dark:text-primary-500'
                      }`}>
                      {t('page.monthly')}
                    </button>
                    <div className='relative z-[2]'>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-4 py-2 font-semibold rounded-md transition-colors duration-200 ${
                          billingCycle === 'annual'
                            ? 'text-white'
                            : hasCampaign
                              ? styles.annualButton
                              : 'text-primary-600 dark:text-primary-500'
                        }`}>
                        {t('page.annual')}
                      </button>
                      <span
                        className={cn(
                          'absolute -top-3 -right-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-muted-foreground',
                          styles.saveBadge,
                          hasCampaign ? styles.active : '',
                        )}>
                        <span
                          className={cn({ [styles.saveInner]: hasCampaign })}>
                          {t('page.save_amount', { amount: discountAmount })}
                        </span>
                      </span>
                      {/* <span
                        className={cn(
                          'absolute -top-3 -right-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold',
                          styles.saveBadge,
                        )}>
                        <span className={styles.saveInner}>
                          {t('page.save50')}
                        </span>
                      </span> */}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pricing Cards */}
          {viewMode === 'subscription' ? (
            <div className='grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-4'>
              <PlanComp />
            </div>
          ) : (
            <ZapPacksComp />
          )}
          <div className='flex justify-center pt-4 md:hidden'>
            <button
              onClick={() => {
                setViewMode(
                  viewMode === 'subscription' ? 'zap-packs' : 'subscription',
                );
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }}
              className='flex items-center px-2 text-[18px] text-indigo-700 bg-indigo-100 rounded-md transition-colors hover:bg-indigo-200'>
              <FaArrowRight className='mr-1.5' />
              {viewMode === 'subscription'
                ? t('page.one_time_pack')
                : t('page.upgrade_plan')}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
