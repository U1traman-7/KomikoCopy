/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  Avatar,
  Spinner,
  useDisclosure,
  Input,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { BiSolidZap } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import { fetchInvitations } from '../../api/profile';
import { DAILY_CHECKIN_REWARDS, Plans } from '../../constants';
import { useSetAtom, useAtom } from 'jotai';
import { modalsAtom, profileAtom } from '../../state';

const Discord = () => (
  <a
    className='text-blue-600 underline'
    href='https://discord.gg/KJNSBVVkvN'
    target='_blank'
    rel='noopener noreferrer'>
    Discord
  </a>
);

export default function DailyRewardsModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const setModals = useSetAtom(modalsAtom);
  const [profile, setProfile] = useAtom(profileAtom);
  const router = useRouter();
  const { t } = useTranslation('profile');
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [invitations, setInvitations] = useState<
    { name?: string; email: string }[]
  >([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const REDEEM_ERROR_KEYS: Record<number, string> = {
    4001: 'redeemErrors.codeRequired',
    4002: 'redeemErrors.unknown',
    4101: 'redeemErrors.codeNotFound',
    4102: 'redeemErrors.notStarted',
    4103: 'redeemErrors.expired',
    4104: 'redeemErrors.usageLimit',
    4105: 'redeemErrors.userLimit',
    4106: 'redeemErrors.updateFailed',
    5001: 'redeemErrors.unknown',
  };

  useEffect(() => {
    setModals(modals => ({
      ...modals,
      dailyRewards: {
        onOpen,
        onClose,
      },
    }));
  }, [onOpen, onClose, setModals]);

  useEffect(() => {
    const loadInvitations = async () => {
      if (isOpen) {
        setIsLoadingInvitations(true);
        try {
          const response = await fetchInvitations();
          if (response.data) {
            setInvitations(response.data);
          }
        } catch (error) {
          console.error('Error fetching invitations:', error);
        } finally {
          setIsLoadingInvitations(false);
        }
      }
    };
    loadInvitations();
  }, [isOpen]);

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
        onClose();
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
        onClose();
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
  }, [profile, todayString]);

  const handleTaskClick = (task: (typeof tasks)[number]) => {
    if (task.id === 1) {
      const textToCopy = `https://komiko.app?code=${profile.invite_code}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success(t('referralLinkCopied'));
      });
      return;
    }
    if (task.id === 5) {
      const textToCopy = `${profile.invite_code}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success(t('referralCodeCopied'));
      });
      return;
    }
    task.onClick?.();
  };

  const handleRedeemCode = async () => {
    const trimmedCode = redeemCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error(t('redeemErrors.codeRequired'));
      return;
    }
    setIsRedeeming(true);
    try {
      const response = await fetch('/api/redeemPromotionCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: trimmedCode }),
      });
      const result = await response.json();
      if (result?.code !== 1) {
        const translationKey =
          REDEEM_ERROR_KEYS[result?.error_code as number] ||
          'redeemErrors.unknown';
        toast.error(t(translationKey));
        return;
      }
      setProfile(prev => ({
        ...prev,
        credit: result?.data?.credit ?? prev.credit,
      }));
      toast.success(t('redeemSuccess'));
      setRedeemCode('');
    } catch (error) {
      console.error('Redeem code failed', error);
      toast.error(t('redeemErrors.unknown'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Modal size='lg' isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>
              <p>{t('dailyRewards')}</p>
            </ModalHeader>
            <ModalBody className='overflow-y-auto h-full md:overflow-y-none max-h-[500px]'>
              <div className='p-5 px-0'>
                {tasks.map(task => (
                  <div key={task.id} className='mb-5'>
                    <Card>
                      <div className='flex items-center p-4'>
                        <BiSolidZap className='w-5 h-5 text-orange-400' />

                        <div className='ml-2.5 font-bold'>
                          {task.pointsTip ? (
                            <span>{task.pointsTip}</span>
                          ) : (
                            <span>x{task.points}</span>
                          )}
                        </div>
                        <div className='ml-5 flex-1'>{task.title}</div>
                        <Button
                          onClick={() => handleTaskClick(task)}
                          disabled={task.completed}
                          className={
                            task.completed
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary text-primary-foreground'
                          }>
                          {task.completed
                            ? task.buttonCompleted
                            : task.buttonIncomplete}
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
                {/*<div className='mt-6 flex flex-col gap-3'>
                  <div className='text-sm font-semibold text-foreground'>
                    {t('redeemInputLabel')}
                  </div>
                  <div className='flex flex-col sm:flex-row gap-2'>
                    <Input
                      variant='bordered'
                      radius='full'
                      size='sm'
                      placeholder={t('redeemCodePlaceholder')}
                      value={redeemCode}
                      onValueChange={setRedeemCode}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && !isRedeeming) {
                          handleRedeemCode();
                        }
                      }}
                    />
                    <Button
                      color='primary'
                      className='rounded-full'
                      size='sm'
                      isLoading={isRedeeming}
                      onClick={handleRedeemCode}
                      isDisabled={!redeemCode.trim() || isRedeeming}>
                      {t('redeemButton')}
                    </Button>
                  </div>
                </div>*/}
                <div className='mt-6'>
                  <div className='mb-4 text-lg font-bold'>
                    {t('invitedUsers')}
                  </div>
                  <div>
                    {isLoadingInvitations ? (
                      <div className='flex justify-center'>
                        <Spinner size='sm' />
                      </div>
                    ) : invitations.length > 0 ? (
                      <div className='space-y-2'>
                        {invitations.map((invitation, index) => (
                          <Card
                            key={invitation.email || `inv-${index}`}
                            className='p-2'>
                            <div className='flex items-center'>
                              <Avatar
                                name={invitation.name || invitation.email}
                                size='sm'
                                className='mr-2'
                              />
                              <div>{invitation.name || invitation.email}</div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center text-muted-foreground'>
                        {t('noInvitations')}
                      </div>
                    )}
                  </div>
                </div>
                <div className='mt-6 text-lg'>
                  <Trans
                    i18nKey='joinDiscord'
                    ns='profile'
                    components={{
                      discord: <Discord />,
                    }}></Trans>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
