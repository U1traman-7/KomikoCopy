/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Progress,
  Avatar,
  Card,
  useDisclosure,
  Spinner,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { FaCrown, FaGift } from 'react-icons/fa';
import { HiSparkles, HiExclamationTriangle } from 'react-icons/hi2';
import { BiSolidZap } from 'react-icons/bi';
import { FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import { fetchInvitations } from '../../api/profile';
import { trackUpgradeButtonClicked } from '../../utilities/analytics';
import { DAILY_CHECKIN_REWARDS, Plans } from '../../constants';
import { modalsAtom, Profile } from '../../state';
import { useAtomValue } from 'jotai';

interface CreditBarProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  className?: string;
  showAmbassadorSection?: boolean;
}

export function CreditBar({
  profile,
  setProfile,
  className,
  showAmbassadorSection = false,
}: CreditBarProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const modals = useAtomValue(modalsAtom);

  // Open Daily Rewards modal via URL query param
  useEffect(() => {
    if (router.query.openDailyRewards === 'true') {
      modals.dailyRewards?.onOpen();
      // Remove query param from URL without page reload
      const { openDailyRewards, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.openDailyRewards, modals.dailyRewards?.onOpen, router]);
  const maxZap = 1000;
  const [isAmbassadorSectionVisible, setIsAmbassadorSectionVisible] = useState(
    showAmbassadorSection,
  );
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [invitations, setInvitations] = useState<
    { name?: string; email: string }[]
  >([]);
  const Discord = () => (
    <a
      className='text-blue-600 underline'
      href='https://discord.gg/KJNSBVVkvN'
      target='_blank'
      rel='noopener noreferrer'>
      Discord
    </a>
  );

  // Handle share profile functionality
  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/user/${profile?.user_uniqid}`;
      await navigator.clipboard.writeText(profileUrl);
      toast.success(t('profileLinkCopied'));
    } catch (error) {
      console.error('Failed to copy profile link:', error);
      toast.error('Failed to copy link');
    }
  };

  let tip = t('createAway');
  let tipIcon: React.ReactNode = null;
  if (profile.credit < 1000 && profile.credit >= 200) {
    tip = t('getMoreZaps');
    tipIcon = <HiSparkles className='w-3 h-3 text-blue-500 mr-1' />;
  } else if (profile.credit < 200 && profile.credit > 0) {
    tip = t('lowOnZaps');
    tipIcon = (
      <HiExclamationTriangle className='w-3 h-3 text-yellow-500 mr-1' />
    );
  } else if (profile.credit <= 0) {
    tip = t('noZapsLeft');
    tipIcon = <HiExclamationTriangle className='w-3 h-3 text-red-500 mr-1' />;
  }
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: (
        <div>
          {t('referUsers')}{' '}
          <p className='text-muted-foreground'>({t('referReward', { count: 500 })})</p>
        </div>
      ),
      points: 500,
      completed: false,
      onClick: () => {
        //! HANDLE COPY REFERRAL LINK
        const textToCopy = `https://komiko.app?code=${profile.invite_code}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          toast.success(t('referralLinkCopied'));
        });
      },
      buttonCompleted: t('copyLink'),
      buttonIncomplete: t('copyLink'),
    },
    {
      id: 5,
      title: (
        <div>
          {t('referUsers')}{' '}
          <p className='text-muted-foreground'>({t('referReward', { count: 500 })})</p>
        </div>
      ),
      points: 500,
      completed: false,
      onClick: () => {
        //! HANDLE COPY REFERRAL LINK
        const textToCopy = `${profile.invite_code}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          toast.success(t('referralCodeCopied'));
        });
      },
      buttonCompleted: t('copyCode'),
      buttonIncomplete: t('copyCode'),
    },
    {
      id: 2,
      title: t('dailyCheckIn'),
      points:
        DAILY_CHECKIN_REWARDS[profile.plan as Plans] ||
        DAILY_CHECKIN_REWARDS[Plans.FREE],
      completed: profile.date_checkin === todayString,
      onClick: async () => {
        if (profile.date_checkin === todayString) {
          return;
        }
        const res = await fetch('/api/dailyCheckIn', {
          method: 'POST',
        })
          .then(res => res.json())
          .catch(err => console.error('Daily check-in failed:', err));
        if (res?.error) {
          return;
        }
        setProfile(profile => ({
          ...profile,
          date_checkin: todayString,
          credit: res.data,
        }));

        setTasks(tasks =>
          tasks.map(task =>
            task.id === 2 ? { ...task, completed: true } : task,
          ),
        );
      },
      buttonCompleted: t('completed'),
      buttonIncomplete: t('complete'),
    },
    {
      id: 3,
      title: (
        <div>
          {t('postStory')}
          <p className='text-muted-foreground'>({t('postStoryTip')})</p>
        </div>
      ),
      points: 60,
      completed: profile.date_post === todayString,
      onClick: () => {
        router.push('/ai-anime-generator');
      },
      pointsTip: t('postStoryPointsTip', { count: 60 }),
      buttonCompleted: t('completed'),
      buttonIncomplete: t('complete'),
    },
    {
      id: 4,
      title: t('likePost'),
      points: 20,
      completed: profile.date_like === todayString,
      onClick: () => {
        router.push('/');
      },
      buttonCompleted: t('completed'),
      buttonIncomplete: t('complete'),
    },
  ]);

  useEffect(() => {
    setTasks(tasks =>
      tasks.map(task => {
        if (task.id === 2)
          return { ...task, completed: profile.date_checkin === todayString };
        if (task.id === 3)
          return { ...task, completed: profile.date_post === todayString };
        if (task.id === 4)
          return { ...task, completed: profile.date_like === todayString };
        return task;
      }),
    );
  }, [profile]);

  return (
    <Card
      className={`max-w-full md:max-w-5xl md:mx-auto p-2 md:p-3 bg-card border border-border rounded-xl shadow-sm ${className || ''}`}>
      {/* Credit Bar Section */}
      <div className='flex justify-between items-center gap-2 md:gap-4 mb-1'>
        <div className='flex flex-col flex-1'>
          <div className='flex justify-between items-center mb-1 md:mb-1.5'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='flex items-center'>
                <BiSolidZap className='mr-1 md:mr-1.5 w-5 h-5 md:w-6 md:h-6 text-orange-400' />
                {profile?.credit && (
                  <span className='font-semibold text-sm md:text-base'>
                    {profile.credit.toLocaleString()}
                  </span>
                )}
                <span className='ml-1.5 text-sm md:text-base text-muted-foreground'>
                  Zaps
                </span>
              </div>
            </div>
            <div className='hidden sm:flex items-center text-xs md:text-sm text-muted-foreground'>
              {tipIcon}
              <span className='whitespace-nowrap'>{tip}</span>
            </div>
          </div>
          <Progress
            value={(100 * profile.credit) / maxZap}
            color='primary'
            className='h-2 md:h-2.5 rounded-lg'
          />
        </div>
        <div className='flex gap-1.5 md:gap-2 ml-2 md:ml-3'>
          <Button
            color='primary'
            variant='solid'
            className='text-primary-foreground rounded-full text-xs md:text-sm px-2 md:px-3 font-semibold'
            size='sm'
            onClick={() => {
              if (profile?.id) {
                trackUpgradeButtonClicked(profile.id, 'profile');
              }
              router.push('/pricing');
            }}>
            <FaCrown className='w-3 h-3 md:w-4 md:h-4 mr-[0.5]' />
            <span>{t('upgrade')}</span>
          </Button>
          <Button
            color='default'
            variant='bordered'
            className='text-muted-foreground rounded-full text-xs md:text-sm !min-w-0 p-0 w-8 h-8 md:w-auto md:h-auto md:!min-w-16  md:px-4 border-border'
            onClick={() => modals.dailyRewards?.onOpen()}
            size='sm'>
            <FaGift className='w-3 h-3 md:w-4 md:h-4' />
            <span className='hidden md:inline ml-1'>{t('rewards')}</span>
          </Button>
          <Button
            color='default'
            variant='bordered'
            className='text-muted-foreground rounded-full text-xs md:text-sm !min-w-0 p-0 w-8 h-8 md:w-auto md:h-auto md:!min-w-16 md:px-4 border-border'
            onClick={handleShareProfile}
            size='sm'>
            <FiShare2 className='w-3 h-3 md:w-4 md:h-4' />
            <span className='hidden md:inline ml-1'>{t('share')}</span>
          </Button>
        </div>
      </div>

      {/* Ambassador Revenue Section */}
      {/*showAmbassadorSection && isAmbassadorSectionVisible && (
        <div className='mt-2 pt-2 border-t border-border'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1'>
            <div className='flex items-center justify-between w-full'>
              <p className='text-sm md:text-base text-foreground font-semibold px-2'>
                {t('ambassadorProgramTitle')}
              </p>
              <Button
                isIconOnly
                size='sm'
                variant='light'
                className='text-muted-foreground hover:text-foreground min-w-6 w-6 h-6'
                onPress={() => setIsAmbassadorSectionVisible(false)}>
                <IoClose size={16} />
              </Button>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mt-2'>
            <div className='flex gap-2'>
              <Link
                href='https://komiko-app.notion.site/Click-Me-Ambassador-Link-Payment-Setup-Guide-Komiko-2334d853a19f8010abffcfdfdb3b38fd'
                isExternal
                isBlock
                showAnchorIcon
                color='primary'
                className='text-sm md:text-base'>
                {t('howItWorks')}
              </Link>
              <Link
                href='https://komikoai.trackdesk.com/sign-up'
                isExternal
                isBlock
                showAnchorIcon
                color='primary'
                className='text-sm md:text-base'>
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      )*/}
    </Card>
  );
}
