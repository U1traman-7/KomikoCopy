/* eslint-disable */
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Avatar,
  Divider,
} from '@nextui-org/react';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import {
  authAtom,
  profileAtom,
  modalsAtom,
  unreadMessageCountAtom,
} from 'state';
import {
  IoLanguage,
  IoSettingsOutline,
  IoSparklesOutline,
  IoFlashOutline,
  IoOpenOutline,
  IoBookOutline,
  IoLanguageOutline,
  IoHammer,
  IoNotificationsOutline,
  IoCheckboxOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoDesktopOutline,
  IoCheckmark,
} from 'react-icons/io5';
import { BsDiscord, BsTwitterX, BsInstagram, BsTiktok } from 'react-icons/bs';
import LogoutButton from './LogoutButton';
import SettingsModal from './Modals/SettingsModal';
import { FaCrown } from 'react-icons/fa';
import { memo, useEffect, useState } from 'react';
import cn from 'classnames';
import { changeLocale } from '../utilities';
import i18n from 'i18n';
import { useTheme } from 'next-themes';

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'ko', name: '한국어' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ru', name: 'Русский' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
];

// 小型 Plan Badge
const PlanBadge = ({ plan }: { plan?: string }) => {
  const getPlanStyle = (plan?: string) => {
    switch (plan) {
      case 'Starter':
        return 'bg-gradient-to-r from-cyan-500 to-teal-400';
      case 'Plus':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Premium':
        return 'bg-gradient-to-r from-orange-500 to-amber-400';
      case 'Enterprise':
        return 'bg-gradient-to-r from-muted-foreground to-muted-foreground/60 text-foreground';
      default:
        return 'bg-muted-foreground'; // Free
    }
  };

  const label = plan && plan !== 'Free' ? plan : 'Free';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0 rounded-full text-[10px] font-medium text-primary-foreground ${getPlanStyle(plan)}`}>
      {plan && plan !== 'Free' && <FaCrown className='w-2.5 h-2.5' />}
      {label}
    </span>
  );
};

const AvatarSetting = memo(({ className }: { className?: string }) => {
  const profile = useAtomValue(profileAtom);
  const router = useRouter();
  const { t } = useTranslation(['sidebar', 'common', 'pricing']);
  const isAuth = useAtomValue(authAtom);
  const modals = useAtomValue(modalsAtom);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useAtom(unreadMessageCountAtom);

  const isPaid = !!(
    profile?.plan &&
    profile.plan !== 'Free' &&
    profile.plan !== 'CPP'
  );

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const notificationPath = '/notifications';

  // 防止 hydration mismatch：useTheme 返回值仅在客户端可用
  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLanguage(langCode);
    changeLocale(langCode);
    router.push(router.pathname, router.asPath.split('?')[0], {
      locale: langCode,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      let lang = localStorage.getItem('lang');
      if (!lang) {
        lang = router.locale || 'en';
        changeLocale(lang);
      }
      const supportedLngs = Object.keys(
        i18n.options.resources || {},
      ) as string[];
      if (router.locale && supportedLngs.includes(router.locale)) {
        setCurrentLanguage(router.locale);
      }
    });
  }, [router.locale]);

  useEffect(() => {
    if (router.asPath.includes(notificationPath) && unreadCount !== 0) {
      setUnreadCount(0);
    }
  }, [router.asPath, notificationPath, unreadCount, setUnreadCount]);

  const formatUnreadCount = (count: number) => {
    if (count > 1000000) {
      return '1M+';
    }
    if (count > 1000) {
      return '1k+';
    }
    return `${count}`;
  };

  const handleNotificationsClick = () => {
    setIsPopoverOpen(false);
    router.push(notificationPath);
    if (router.pathname === notificationPath) {
      location.reload();
    }
  };

  return (
    <>
      <Popover
        placement='bottom-end'
        isOpen={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger>
          <button type='button' className='relative inline-flex'>
            <Avatar
              className={cn('transition-transform', className)}
              color='primary'
              size='sm'
              src={profile?.image || '/images/favicon.webp'}
            />
            {unreadCount > 0 && (
              <span className='absolute -top-1 -right-1 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center'>
                {formatUnreadCount(unreadCount)}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className='p-0 w-[260px] overflow-hidden rounded-lg'>
          <div className='flex flex-col w-full'>
            {/* User Info Header - Clickable */}
            {isAuth && (
              <div
                className='px-4 py-3 cursor-pointer bg-muted transition-colors'
                onClick={() => router.push('/profile')}>
                <div className='flex items-start gap-3'>
                  <Avatar
                    src={profile?.image || '/images/favicon.webp'}
                    className='w-9 h-9 flex-shrink-0 mt-1'
                  />
                  <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-foreground truncate text-sm'>
                        {profile?.user_name || t('sidebar:profile')}
                      </p>
                      <div className='flex-shrink-0'>
                        <PlanBadge plan={profile?.plan} />
                      </div>
                    </div>
                    <p className='text-xs font-medium text-muted-foreground'>
                      {profile?.credit || 0} Zaps
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className='flex flex-col gap-0 p-1'>
              {isAuth && (
                <>
                  <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <div className='relative'>
                        <IoNotificationsOutline className='w-5 h-5 text-muted-foreground' />
                        {unreadCount > 0 && (
                          <span className='absolute -top-1 -right-1 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center'>
                            {formatUnreadCount(unreadCount)}
                          </span>
                        )}
                      </div>
                    }
                    type='button'
                    onPress={handleNotificationsClick}>
                    {t('sidebar:notifications')}
                  </Button>
                  <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <IoSettingsOutline className='w-5 h-5 text-muted-foreground' />
                    }
                    type='button'
                    onPress={() => {
                      setIsSettingsOpen(true);
                      setIsPopoverOpen(false);
                    }}>
                    {t('sidebar:settings')}
                  </Button>

                  {/* Dark Mode 切换 */}
                  {mounted && (
                    <Popover placement='bottom-start'>
                      <PopoverTrigger>
                        <Button
                          className='justify-start h-10'
                          variant='light'
                          startContent={
                            theme === 'dark' ? (
                              <IoMoonOutline className='w-5 h-5 text-muted-foreground' />
                            ) : theme === 'light' ? (
                              <IoSunnyOutline className='w-5 h-5 text-muted-foreground' />
                            ) : (
                              <IoDesktopOutline className='w-5 h-5 text-muted-foreground' />
                            )
                          }>
                          {t('sidebar:theme')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='min-w-[160px] p-0'>
                        <div className='p-2'>
                          {[
                            { key: 'light', label: t('sidebar:light'), icon: IoSunnyOutline },
                            { key: 'dark', label: t('sidebar:dark'), icon: IoMoonOutline },
                            { key: 'system', label: t('sidebar:system'), icon: IoDesktopOutline },
                          ].map(item => (
                            <Button
                              key={item.key}
                              variant='light'
                              className='justify-start w-full h-8 mb-0.5'
                              startContent={
                                <item.icon className='w-4 h-4 text-muted-foreground' />
                              }
                              endContent={
                                theme === item.key ? (
                                  <IoCheckmark className='w-4 h-4 text-primary ml-auto' />
                                ) : null
                              }
                              onPress={() => setTheme(item.key)}>
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  <Divider className='my-1' />

                  <Button
                    className={`${isPaid ? 'justify-start h-10' : 'justify-start h-10 text-purple-600'}`}
                    variant='light'
                    startContent={
                      <FaCrown
                        className={`w-5 h-5 ${isPaid ? 'text-muted-foreground' : 'text-purple-500'}`}
                      />
                    }
                    onPress={() => router.push('/pricing')}>
                    {isPaid
                      ? t('common:price.manage_subscription')
                      : t('common:price.upgrade')}
                  </Button>
                  <Divider className='my-1' />
                  {/* <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <BsDiscord className='w-5 h-5 text-muted-foreground min-w-5' />
                    }
                    onPress={() => {
                      window.open('https://discord.gg/KJNSBVVkvN', '_blank');
                    }}>
                    <span className='flex items-center gap-1'>
                      {t('sidebar:community_support')}
                      <IoOpenOutline className='w-3.5 h-3.5 text-muted-foreground' />
                    </span>
                  </Button> */}
                  <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <IoCheckboxOutline className='w-5 h-5 text-purple-500' />
                    }
                    onPress={() => {
                      window.open(
                        'https://komiko.canny.io/vote-for-new-features',
                        '_blank',
                      );
                    }}>
                    <span className='flex items-center gap-1'>
                      {t('sidebar:vote_for_features')}
                      <IoOpenOutline className='w-3.5 h-3.5 text-muted-foreground' />
                    </span>
                  </Button>
                  <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <IoBookOutline className='w-5 h-5 text-muted-foreground' />
                    }
                    onPress={() => {
                      window.open(
                        'https://komiko-app.notion.site/How-to-Use-KomikoAI-25b4d853a19f80059a2dc4339d9dc356?source=copy_link',
                        '_blank',
                      );
                    }}>
                    <span className='flex items-center gap-1'>
                      {t('sidebar:how_to_guide')}
                      <IoOpenOutline className='w-3.5 h-3.5 text-muted-foreground' />
                    </span>
                  </Button>
                  {/*<Button
                  className='justify-start h-10'
                  variant='light'
                  startContent={<FaMoneyBill className='w-5 h-5 text-muted-foreground' />}
                  onPress={() => {
                    window.open(
                      'https://komiko-app.notion.site/Ambassador-Link-Payment-Setup-Tutorial-KomikoAI-2334d853a19f8010abffcfdfdb3b38fd?source=copy_link',
                      '_blank',
                    );
                  }}>
                  {t('sidebar:startEarning')}
                </Button> */}
                </>
              )}
              <Popover placement='bottom-start'>
                <PopoverTrigger>
                  <Button
                    className='justify-start h-10'
                    variant='light'
                    startContent={
                      <IoLanguageOutline className='w-5 h-5 text-muted-foreground' />
                    }>
                    {languages.find(lang => lang.code === currentLanguage)
                      ?.name || 'English'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='max-w-[200px] !justify-start p-0'>
                  <div className='p-2 max-h-[200px] overflow-y-auto'>
                    {languages.map(lang => (
                      <Button
                        key={lang.code}
                        variant='light'
                        className='justify-start mb-1 w-full h-8'
                        onPress={() => changeLanguage(lang.code)}>
                        {lang.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {isAuth && (
                <>
                  <Divider className='my-1' />
                  <LogoutButton className='justify-start' />
                </>
              )}

              {/* Social Media Links */}
              <Divider className='my-1' />
              <div className='px-3 py-1.5'>
                <p className='text-[10px] text-muted-foreground mb-1 text-center'>
                  {t('sidebar:follow_us')}
                </p>
                <div className='flex items-center justify-center gap-3'>
                  <a
                    href='https://discord.com/invite/rxX4B9b2ct'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-[#5865F2] transition-colors'>
                    <BsDiscord className='w-5 h-5' />
                  </a>
                  <a
                    href='https://x.com/KomikoAI'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-foreground transition-colors'>
                    <BsTwitterX className='w-5 h-5' />
                  </a>
                  <a
                    href='https://www.instagram.com/komiko.app/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-[#E4405F] transition-colors'>
                    <BsInstagram className='w-5 h-5' />
                  </a>
                  <a
                    href='https://www.tiktok.com/@komiko.app'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-foreground transition-colors'>
                    <BsTiktok className='w-5 h-5' />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Settings Modal - 移到 Popover 外面 */}
      {isAuth && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
});

export default AvatarSetting;
