import { Button, Card } from '@nextui-org/react';
import { BiSolidZap } from 'react-icons/bi';
import { createPaymentLink, Plan } from '../../api/pricing';
import { memo, useState } from 'react';
import {
  trackPlanClicked,
  trackPaymentFlowStarted,
  trackPaymentInitiated,
} from '../../utilities/analytics';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { PlanCode } from '../../../api/payment/_constant';

const Plans = memo(
  ({
    profile,
    billingCycle = 'monthly',
  }: {
    profile?: { plan: Plan | string } | null;
    billingCycle?: 'monthly' | 'annual';
  }) => {
    const currentProfile = useAtomValue(profileAtom);
    const plans = [
      {
        name: 'Starter',
        price: '9.99',
        zaps: 5000,
      },
      {
        name: 'Plus',
        price: '19.99',
        zaps: 15000,
      },
      {
        name: 'Premium',
        price: '49.99',
        zaps: 50000,
      },
    ];
    const handlePlanClick = async (plan: Exclude<Plan, 'Free'>) => {
      // 追踪计划点击
      if (currentProfile?.id) {
        trackPlanClicked(
          currentProfile.id,
          plan,
          parseFloat(plans.find(p => p.name === plan)?.price || '0'),
          billingCycle,
          profile?.plan as string,
          'modal',
        );
      }

      setDisabled(true);
      setPlanLoading({ ...planLoading, [plan]: true });

      // Determine plan code based on plan and billing cycle
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

      const paymentLink = await createPaymentLink({
        plan,
        plan_code: planCode,
      }).catch(() => {
        setDisabled(false);
        setPlanLoading({ ...planLoading, [plan]: false });
      });
      if (paymentLink?.data && paymentLink.data.url) {
        // 追踪付费流程开始 - 在即将跳转时触发
        if (currentProfile?.id) {
          const price = parseFloat(
            plans.find(p => p.name === plan)?.price || '0',
          );
          // 发起事件
          trackPaymentInitiated(currentProfile.id, plan, price, 'USD');
          // 流程开始事件
          trackPaymentFlowStarted(
            currentProfile.id,
            plan,
            price,
            'stripe',
            'modal',
          );
        }
        // 轻微延迟，减少埋点丢失概率
        setTimeout(() => {
          location.href = paymentLink.data.url;
        }, 150);
      }
    };

    profile = profile || { plan: 'Free' };
    console.log(profile);

    const [disabled, setDisabled] = useState(false);
    const [planLoading, setPlanLoading] = useState({
      Starter: false,
      Plus: false,
      Premium: false,
    });

    return (
      <>
        {plans.map(plan => (
          <Card key={plan.name} className='mb-4'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
              }}>
              <div>
                <p className='text-lg font-bold'>{plan.name}</p>
                <p className='flex items-center font-bold text-muted-foreground'>
                  <BiSolidZap className='w-5 h-5 text-orange-400' />
                  <span>{plan.zaps}</span>
                  <span className='text-sm'>/Month</span>
                </p>
              </div>
              {profile.plan === 'Free' ? (
                <Button
                  disabled={disabled}
                  isLoading={planLoading[plan.name as keyof typeof planLoading]}
                  onClick={() =>
                    handlePlanClick(plan.name as Exclude<Plan, 'Free'>)
                  }
                  className='text-primary-foreground bg-primary-500'>
                  ${plan.price}
                </Button>
              ) : plan.name === profile.plan ? (
                <button
                  className='min-w-[81px]  bg-indigo-600 text-primary-foreground cursor-default opacity-75 py-2 px-4 rounded-medium cursor-not-allowed'
                  disabled>
                  Current Plan
                </button>
              ) : (
                <button
                  className='min-w-[81px] rounded-full bg-muted text-muted-foreground cursor-not-allowed  py-2 px-4 rounded-medium'
                  disabled>
                  ${plan.price}
                </button>
              )}
            </div>
          </Card>
        ))}
      </>
    );
  },
);

export default Plans;
