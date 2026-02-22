import {
  Button,
  Image,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@nextui-org/react';
import { BsDiscord } from 'react-icons/bs';
import { useRouter } from 'next/router';
import {
  authAtom,
  loginModalAtom,
  profileAtom,
  useAtomValue,
  useSetAtom,
} from '../../state';
import {
  promotionDataAtom,
  topCampaignAtom,
  promotionEndTimeAtom,
  fetchPromotionAtom,
  clearPromotionAtom,
} from '../../state/promotion';
import { useAtom } from 'jotai';
import React, { memo, useEffect, useState } from 'react';
import { fetchProfile } from '@/api/profile';
import LanguageToggle from '../LanguageToggle';
import { Trans, useTranslation } from 'react-i18next';
import Link from 'next/link';
import AvatarSetting from '../AvatarSetting';
import { ThemeToggle } from '../ThemeToggle';
import { useLoginModal } from 'hooks/useLoginModal';
import { useCheckAuth } from '@/hooks/useCheckAuth';
import { FaCrown } from 'react-icons/fa';
import cn from 'classnames';

const formatTime = (value: number) => value.toString().padStart(2, '0');

export const Promotion = memo(() => {
  const [shouldShowMobile, setShouldShowMobile] = useState(true);
  const [isAuth] = useAtom(authAtom);

  // 使用 atom 替代本地状�?
  const promotionData = useAtomValue(promotionDataAtom);
  const topCampaign = useAtomValue(topCampaignAtom);
  const endTime = useAtomValue(promotionEndTimeAtom);
  const fetchPromotion = useSetAtom(fetchPromotionAtom);
  const clearPromotion = useSetAtom(clearPromotionAtom);

  // 根据认证状态获�?清空数据
  useEffect(() => {
    fetchPromotion();
  }, [isAuth]);

  // 管理 body class
  useEffect(() => {
    if (promotionData.isEligible && endTime) {
      document.body.classList.add('promotion');
    } else {
      document.body.classList.remove('promotion');
    }
    return () => document.body.classList.remove('promotion');
  }, [promotionData.isEligible, endTime]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    days: 0,
  });

  // 倒计时逻辑
  useEffect(() => {
    if (!promotionData.isEligible || !endTime) {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expireTime = new Date(endTime!).getTime();
      const difference = expireTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, days: 0 });
        clearPromotion(); // 使用 atom �?clear 方法
        document.body.classList.remove('promotion');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, days });
    };

    const interval = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, [promotionData.isEligible, endTime, clearPromotion]);

  // 响应式屏幕尺寸检�?
  useEffect(() => {
    const checkScreenSize = () => {
      setShouldShowMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!promotionData.isEligible) {
    return null;
  }

  const Text = () => {
    if (!topCampaign) {
      return null;
    }

    const key = topCampaign?.code || '';
    // 新用户促销（type = 1�?
    if (topCampaign) {
      // 超过1天使用天数显�?
      if (timeLeft.days > 0) {
        if (shouldShowMobile) {
          return (
            <Trans
              i18nKey={`${key}.mobile_days_title`}
              ns={'header'}
              values={{
                days: timeLeft.days,
              }}
              components={{
                time: (
                  <span
                    className={cn(
                      'flex-center text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 border border-solid border-transparent rounded-full',
                      {
                        'bg-muted text-foreground':
                          (topCampaign?.theme || 'theme_pink') === 'theme_pink',
                        'bg-primary-100 text-primary-600 border-primary-50':
                          topCampaign?.theme === 'theme_blue',
                      },
                    )}
                  />
                ),
              }}
            />
          );
        }
        return (
          <Trans
            i18nKey={`${key}.days_title`}
            ns={'header'}
            values={{
              days: timeLeft.days,
            }}
            components={{
              time: (
                <span
                  className={cn(
                    'flex-center text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 border border-solid border-transparent rounded-full',
                    {
                      'bg-muted text-foreground':
                        (topCampaign?.theme || 'theme_pink') === 'theme_pink',
                      'bg-primary-100 text-primary-600 border-primary-50':
                        topCampaign?.theme === 'theme_blue',
                    },
                  )}
                />
              ),
            }}
          />
        );
      }
      // 1天以内使用倒计时显�?
      if (shouldShowMobile) {
        return (
          <Trans
            i18nKey={`${key}.mobile_title`}
            ns={'header'}
            values={{
              deadline: `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`,
            }}
            components={{
              time: (
                <span
                  className={cn(
                    'flex-center text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 border border-solid border-transparent rounded-full',
                    {
                      'bg-muted text-foreground':
                        (topCampaign?.theme || 'theme_pink') === 'theme_pink',
                      'bg-primary-100 text-primary-600 border-primary-50':
                        topCampaign?.theme === 'theme_blue',
                    },
                  )}
                />
              ),
            }}
          />
        );
      }
      return (
        <Trans
          i18nKey={`${key}.title`}
          ns={'header'}
          values={{
            deadline: `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`,
          }}
          components={{
            time: (
              <span
                className={cn(
                  'flex-center text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 border border-solid border-transparent rounded-full',
                  {
                    'bg-muted text-foreground':
                      (topCampaign?.theme || 'theme_pink') === 'theme_pink',
                    'bg-primary-100 text-primary-600 border-primary-50':
                      topCampaign?.theme === 'theme_blue',
                  },
                )}
              />
            ),
          }}
        />
      );
    }

    // 默认促销（其他类型）
    // 超过1天使用天数显�?
    if (timeLeft.days > 0) {
      if (shouldShowMobile) {
        return (
          <Trans
            i18nKey={'promotion_offer_mobile_days'}
            ns={'header'}
            values={{
              days: timeLeft.days,
            }}
            components={{
              time: (
                <span className='flex-center bg-muted text-foreground text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 rounded-full' />
              ),
            }}
          />
        );
      }
      return (
        <Trans
          i18nKey={'promotion_offer_days'}
          ns={'header'}
          values={{
            days: timeLeft.days,
          }}
          components={{
            time: (
              <span className='flex-center bg-muted text-foreground text-[13px] px-2 pt-0.5 h-[16px] -mt-[1px] rounded-full' />
            ),
          }}
        />
      );
    }
    // 1天以内使用倒计时显�?
    if (shouldShowMobile) {
      return (
        <Trans
          i18nKey={'promotion_offer_mobile'}
          ns={'header'}
          values={{
            deadline: `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`,
          }}
          components={{
            time: (
              <span className='flex-center bg-muted text-foreground text-[13px] px-2 h-[16px] -mt-[1px] pt-0.5 rounded-full' />
            ),
          }}
        />
      );
    }
    return (
      <Trans
        i18nKey={'promotion_offer'}
        ns={'header'}
        values={{
          deadline: `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`,
        }}
        components={{
          time: (
            <span className='flex-center bg-muted text-foreground text-[13px] px-2 pt-0.5 h-[16px] -mt-[1px] rounded-full' />
          ),
        }}
      />
    );
  };

  return (
    <Link href='/pricing'>
      <div
        className={cn(
          'h-[21px] flex-center text-sm font-bold gap-1 bg-gradient-to-r',
          {
            'from-[#E8BAF0] to-[#F7D0D0] text-[#760051] dark:from-[#5a2d4f] dark:to-[#4a2a2a] dark:text-pink-300':
              (topCampaign?.theme || 'theme_pink') === 'theme_pink',
            'from-[#489EFF] to-[#7A72FF] text-primary-foreground dark:from-[#2a4a8f] dark:to-[#3a2f8f]':
              (topCampaign?.theme || 'theme_pink') === 'theme_blue',
          },
        )}>
        <Text />
      </div>
    </Link>
  );
});

export default function Header({
  autoOpenLogin = true,
}: {
  autoOpenLogin?: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation(['header', 'sidebar', 'common']);
  const [redirectUrl, setRedirectUrl] = useState('/');

  const [isAuth] = useAtom(authAtom);

  // const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [, setLoginModalState] = useAtom(loginModalAtom);
  const [profile, setProfile] = useAtom(profileAtom);
  const { onOpen, LoginModal } = useLoginModal(false, true);
  useEffect(() => {
    setLoginModalState(prev => ({ ...prev, onOpen }));
  }, [onOpen]);

  useEffect(() => {
    if (!isAuth || profile?.id) {
      return;
    }
    fetchProfile().then(profile => {
      if (!profile.error) {
        setProfile(prev => ({
          ...prev,
          ...profile,
        }));
      }
    });
    setRedirectUrl('/');
  }, [isAuth, profile?.id, setProfile, setRedirectUrl]);

  const checkAuth = useCheckAuth(() => {
    if (autoOpenLogin) {
      onOpen();
    }
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const isPaid = !!(
    profile?.plan &&
    profile.plan !== 'Free' &&
    profile.plan !== 'CPP'
  );

  return (
    <>
      <div className='fixed top-0 left-0 right-0 z-50'>
        <Promotion />
        <Navbar
          className='justify-between w-full h-[50px] sm:h-[64px] bg-muted border-b-1 border-border'
          maxWidth={'full'}
          isBlurred={false}>
          <NavbarBrand className='[&>*]:rounded-none'>
            <Link href={redirectUrl}>
              <Image
                src='/images/logo_new.webp'
                className='h-[32px] min-w-[78px] sm:h-[40px] w-auto ml-0 2xl:ml-8 rounded-none dark:brightness-110'
                alt={t('logo_alt')}
              />
            </Link>
          </NavbarBrand>
          <NavbarContent justify='end' className='px-0 mx-0'>
            <NavbarItem className='flex items-center gap-1 sm:gap-2 mx-0 px-0'>
              {/* <Button
                          color="primary"
                          variant="flat"
                          className="mr-2 h-10"
                          onClick={() => {
                              window.location.href = 'sms:+16502137491';
                          }}
                      >
                          Text Us
                      </Button> */}
              {!isAuth && (
                <>
                  <ThemeToggle />
                  <LanguageToggle className='sm:mr-2 mx-0' />
                  <Button
                    color='primary'
                    variant='flat'
                    className='sm:mr-2 h-8 sm:h-10 text-xs sm:text-sm px-0 mx-0 sm:px-4 text-primary-700 dark:text-primary-300'
                    onPress={() => {
                      onOpen();
                    }}>
                    {t('login_button')}
                  </Button>
                </>
              )}
              <Button
                as={Link}
                href='https://discord.gg/KJNSBVVkvN'
                variant='light'
                target='_blank'
                className='sm:mr-2 h-8 sm:h-10 text-[#5865F2] text-xs sm:text-sm px-2 sm:px-4 hover:bg-primary-500'>
                <BsDiscord className='mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5' />
                <span className='hidden sm:inline'>{t('join_discord')}</span>
                <span className='sm:hidden'>Discord</span>
              </Button>
              {isAuth && !isPaid && (
                <Button
                  variant='flat'
                  startContent={<FaCrown className='w-4 h-4 lg:w-5 lg:h-5' />}
                  onPress={async () => {
                    router.push('/pricing');
                  }}
                  className='flex items-center sm:mr-2 h-8 sm:h-10 lg:hidden bg-primary text-primary-foreground text-xs sm:text-sm px-2 sm:px-4'>
                  {t('common:price.upgrade')}
                </Button>
              )}
              {isAuth && <AvatarSetting className='ml-1 sm:ml-2' />}
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>
      <LoginModal />
    </>
  );
}
