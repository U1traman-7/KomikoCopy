import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  useDisclosure,
} from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import { useSetAtom, useAtom, useAtomValue } from 'jotai';
import { modalsAtom, profileAtom, topCampaignAtom } from '../../state';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BiSolidZap } from 'react-icons/bi';
import { DAILY_CHECKIN_REWARDS, Plans } from '../../constants';
import { useTranslation } from 'react-i18next';
// 判断链接地址是否是视频
const isVideoUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.pathname.endsWith('.mp4') ||
      urlObj.pathname.endsWith('.webm') ||
      urlObj.pathname.endsWith('.mov') ||
      urlObj.pathname.endsWith('.avi')
    );
  } catch (error) {
    console.error('Error checking if URL is video:', error);
    return false;
  }
};

const LinkWrapper = ({
  href,
  children,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  if (!href) {
    return children;
  }
  return (
    <Link href={href} onClick={onClick}>
      {children}
    </Link>
  );
};

export default function DailyCheckInModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const setModals = useSetAtom(modalsAtom);
  const [profile, setProfile] = useAtom(profileAtom);
  const router = useRouter();
  const { t } = useTranslation('common');
  const [claiming, setClaiming] = useState(false);
  const topCampaign = useAtomValue(topCampaignAtom);

  useEffect(() => {
    setModals(modals => ({
      ...modals,
      dailyCheckIn: {
        onOpen,
        onClose,
      },
    }));
  }, [onOpen, onClose, setModals]);

  const logLastCheckInDate = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastCheckInDate', today);
  };

  const handleOpenChange = () => {
    logLastCheckInDate();
    onOpenChange();
  };

  const getDailyReward = () => {
    const planKey =
      Object.values(Plans).find(p => p === profile?.plan) || Plans.FREE;
    return DAILY_CHECKIN_REWARDS[planKey];
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const response = await fetch('/api/dailyCheckIn', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.error || !data.code) {
        console.error('Failed to claim daily reward:', data.error);
        setClaiming(false);
        return;
      }

      setProfile((prev: any) => ({
        ...prev,
        credit: data.data,
      }));

      // window.location.reload();
    } catch (error) {
      console.error('Error claiming daily reward:', error);
    } finally {
      onClose();
      setClaiming(false);
      logLastCheckInDate();
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
    setTimeout(() => {
      onClose();
    }, 1000);
    logLastCheckInDate();
  };

  const dailyReward = getDailyReward();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      size='md'
      placement='center'
      hideCloseButton
      classNames={{
        wrapper: 'z-[70]',
        backdrop: 'z-[70] bg-black/60',
      }}>
      <ModalContent className='overflow-hidden'>
        <ModalBody className='p-6 flex flex-col items-center'>
          <div className='flex items-center justify-between w-full'>
            <h2 className='text-xl font-bold'>{t('daily_check_in.title')}</h2>
            <div className='flex items-center gap-1'>
              <BiSolidZap className='w-5 h-5 text-orange-400' />
              <span className='font-semibold'>{profile?.credit ?? 0}</span>
            </div>
          </div>

          {!topCampaign?.show_modal ? (
            <div className='w-full rounded-lg pt-4 px-2 pb-0 flex items-center justify-center flex-col'>
              {/* Original video: https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/uploads/2025/10/videos/1760074664616_037e047f.mp4#t=0.001 */}
              <img
                src='/images/modal_banner.jpg'
                alt='Daily Check In Banner'
                className='w-full h-auto rounded-lg shadow-lg max-h-[300px] object-cover'
              />
            </div>
          ) : (
            <div className='w-full rounded-lg pt-4 px-2 pb-0 flex items-center justify-center flex-col'>
              <LinkWrapper href={topCampaign?.modal_config?.redirect_url}>
                {isVideoUrl(
                  topCampaign?.modal_config?.media_url ||
                    'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/uploads/2025/10/videos/1760074664616_037e047f.mp4#t=0.001',
                ) ? (
                  <video
                    src={
                      topCampaign?.modal_config?.media_url ||
                      'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/uploads/2025/10/videos/1760074664616_037e047f.mp4#t=0.001'
                    }
                    autoPlay
                    muted
                    loop
                    playsInline
                    className='w-full h-auto rounded-lg shadow-lg max-h-[300px] object-cover'
                  />
                ) : (
                  <img
                    src={topCampaign?.modal_config?.media_url || ''}
                    alt='Daily Check In Banner'
                    className='w-full h-auto rounded-lg shadow-lg max-h-[300px] min-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity'
                  />
                )}
              </LinkWrapper>

              <div className='flex flex-col items-center justify-center gap-1 mt-3'>
                {topCampaign?.modal_config?.i18n_title_key && (
                  <LinkWrapper
                    href={topCampaign?.modal_config?.redirect_url}
                    onClick={onClose}>
                    <p className='text-md font-semibold text-center'>
                      {t(
                        `${topCampaign?.code}.${topCampaign?.modal_config?.i18n_title_key || ''}`,
                      )}
                    </p>
                  </LinkWrapper>
                )}
                {topCampaign?.modal_config?.i18n_description_key && (
                  <LinkWrapper
                    href={topCampaign?.modal_config?.redirect_url}
                    onClick={onClose}>
                    <p className='text-md font-normal text-center'>
                      {t(
                        `${topCampaign?.code}.${topCampaign?.modal_config?.i18n_description_key || ''}`,
                      )}
                    </p>
                  </LinkWrapper>
                )}
              </div>
            </div>
          )}

          <Button
            size='lg'
            className='w-full bg-card border-2 border-border text-foreground font-semibold hover:bg-muted'
            startContent={<BiSolidZap className='w-5 h-5 text-orange-400' />}
            onPress={handleClaim}
            isLoading={claiming}
            disabled={claiming}>
            {t('daily_check_in.claim_button', { amount: dailyReward })}
          </Button>

          <Button
            size='lg'
            color='primary'
            className='w-full font-semibold'
            onPress={handleUpgrade}>
            {t('daily_check_in.upgrade_button', { amount: 4800 })}
          </Button>

          <p className='text-xs text-muted-foreground text-center mt-2'>
            {t('daily_check_in.extra_rewards_tip')}
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
