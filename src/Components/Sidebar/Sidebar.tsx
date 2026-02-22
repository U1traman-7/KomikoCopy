import {
  Button,
  Divider,
  Tooltip,
  Navbar,
  NavbarContent,
  NavbarItem,
  Chip,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { FaCrown, FaTheaterMasks } from 'react-icons/fa';
import { BsDiscord, BsTwitterX, BsInstagram, BsTiktok } from 'react-icons/bs';
import { IoImageOutline, IoLayers, IoPlanetSharp } from 'react-icons/io5';
import { GoHomeFill, GoPlay } from 'react-icons/go';
import { CgProfile } from 'react-icons/cg';
import React, { useEffect, useRef, useState } from 'react';
import mixpanel from 'mixpanel-browser';
import { profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FiHelpCircle, FiPlus } from 'react-icons/fi';
import { useCollectForyou } from 'hooks/useCollectForyou';
import { useRealtimeChannel } from 'hooks/useRealtimeChannel';
import cn from 'classnames';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { HiOutlineArrowsExpand, HiFire } from 'react-icons/hi';
import { RiScissorsCutFill, RiSketching } from 'react-icons/ri';
import { TbPhotoEdit } from 'react-icons/tb';
import { IconUserSquare, IconTemplate } from '@tabler/icons-react';
import { MdAnimation, MdDashboard } from 'react-icons/md';
import { IoIosColorPalette, IoMdMicrophone } from 'react-icons/io';
import { PiUserBold, PiVideoBold } from 'react-icons/pi';
import { VideoIcon } from 'lucide-react';
import { trackUpgradeButtonClicked } from '../../utilities/analytics';
import PublishDrawer from '../PublishDrawer';
// import { getUnreadMessageCount } from '@/api/profile';
// Demo tools list for showcase
export const getToolsIcon = (toolPath: string) => {
  switch (toolPath) {
    case '/oc-maker':
      return <PiUserBold className='w-[18px] h-[18px] stroke-1' />;
    case '/create':
      return <MdDashboard className='w-[18px] h-[18px]' />;
    case '/ai-comic-generator':
      return <MdDashboard className='w-[18px] h-[18px] stroke-1' />;
    case '/image-animation-generator':
      return <PiVideoBold className='w-[18px] h-[18px]' />;
    case '/inbetween':
      return <MdAnimation className='w-[18px] h-[18px]' />;
    case '/line_art_colorization':
      return <IoIosColorPalette className='w-[18px] h-[18px] stroke-1' />;
    case '/sketch_simplification':
      return <RiSketching className='w-[18px] h-[18px] stroke-1' />;
    case '/layer_splitter':
      return <IoLayers className='w-[18px] h-[18px] stroke-1' />;
    case '/playground':
      return <TbPhotoEdit className='w-[18px] h-[18px]' />;
    case '/background-removal':
      return <RiScissorsCutFill className='w-[18px] h-[18px]' />;
    case '/image-upscaling':
      return <HiOutlineArrowsExpand className='w-[18px] h-[18px]' />;
    case '/video_upscaling':
      return <HiOutlineArrowsExpand className='w-[18px] h-[18px]' />;
    case '/video_interpolation':
      return <MdAnimation className='w-[18px] h-[18px]' />;
    case '/filter/ai-character-sheet-generator':
      return <IconUserSquare className='w-[18px] h-[18px]' />;
    case '/video-to-video':
      return <VideoIcon className='w-[18px] h-[18px]' />;
    case '/ai-anime-generator':
      return <IoImageOutline className='w-[18px] h-[18px]' />;
    case '/ai-talking-head':
      return <IoMdMicrophone className='w-[18px] h-[18px]' />;
    default:
      return <FaWandMagicSparkles className='w-[18px] h-[18px]' />;
  }
};

export default function Sidebar({
  isMobile,
  loginPopupOnly,
}: {
  isMobile?: boolean;
  loginPopupOnly?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useAtom(profileAtom);
  const { t } = useTranslation(['sidebar', 'common']);
  const [shouldShowMobile, setShouldShowMobile] = useState(true); // Default to mobile view to prevent flash
  const [isClient, setIsClient] = useState(false);
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);
  const isPaid = !!(profile?.plan && profile.plan !== 'Free');
  const currentPath = router.pathname;
  // console.log(currentPath);
  const explorePath = '/';
  const characterPath = '/characters';
  const publishPath = '/publish';
  const templatesPath = '/effects';
  const aiAppsPath = '/ai-apps';
  const profilePath = '/profile';
  const pricingPath = '/pricing';
  const { collList: favoriteTools } = useCollectForyou();
  // console.log(favoriteTools);

  // ! HANDLE AUTH CHECK

  useEffect(() => {
    const fetchProfile = async () => {
      if (profile?.id) {
        return;
      }
      const response = await fetch('/api/fetchProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'profile' }),
      });
      const data = await response.json();
      if (!data.error) {
        setProfile(prev => ({
          ...prev,
          ...data,
        }));
      }
    };

    fetchProfile();
  }, [profile?.id]);

  // useEffect(() => {
  //   if (channelState.status !== 'connected') {
  //     return;
  //   }
  //   const fetchUnreadCount = async () => {
  //     try {
  //       const { code, data } = await getUnreadMessageCount();
  //       if (code !== 1) {
  //         return;
  //       }

  //       setUnreadCount(count => count + data.count);
  //     } catch (error) {
  //       console.error('Failed to fetch unread message count:', error);
  //     }
  //   };

  //   fetchUnreadCount();
  // }, [channelState.status]);

  useRealtimeChannel({
    channelName: 'messages',
    userId: profile?.id,
    reconnectInterval: 5000,
    reconnectMaxAttempts: 10,
    timeout: 30000,
    enabled: !!profile?.id,
    onError: error => {
      console.error('Realtime channel error:', error);
    },
  });

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive breakpoint based on current page
  useEffect(() => {
    if (!isClient) {
      return;
    }

    const checkScreenSize = () => {
      setShouldShowMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [currentPath, isClient]);

  const navLinks = [
    {
      path: explorePath,
      icon: <GoHomeFill className='w-[18px] h-[18px]' />,
      text: t('home'),
      active: currentPath === explorePath,
    },
    {
      path: templatesPath,
      icon: <IconTemplate className='w-[18px] h-[18px]' />,
      text: t('effects'),
      active: currentPath.includes(templatesPath),
    },
    {
      path: publishPath,
      icon: <FiPlus className='w-[18px] h-[18px]' />,
      text: t('post'),
      active: currentPath.includes(publishPath),
    },
    {
      path: aiAppsPath,
      icon: <FaWandMagicSparkles className='w-[18px] h-[18px]' />,
      text: t('aiApps'),
      active: currentPath.includes(aiAppsPath),
    },
    {
      path: profilePath,
      icon: <CgProfile className='w-[18px] h-[18px]' />,
      text: t('profile'),
      active: currentPath.includes(profilePath),
    },
  ];

  const handleClickPublish = () => {
    setIsPublishDrawerOpen(true);
  };

  return (
    <>
      {!loginPopupOnly && (
        <div className='caffelabs text-foreground bg-background'>
          <div
            className={cn(
              'fixed top-0 flex-col p-5 pr-0 w-56 h-full bg-background lg:w-[240px] z-[10]',
              {
                hidden: shouldShowMobile,
                flex: !shouldShowMobile,
              },
            )}>
            <div className='overflow-y-auto flex-grow pt-16 pr-5'>
              {/* 主导航 */}
              <div className='mb-4'>
                {navLinks.map(link => (
                  <Button
                    as={Link}
                    href={link.path}
                    key={link.path}
                    size='md'
                    variant='light'
                    radius='lg'
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm relative',
                      {
                        'bg-primary-50 text-primary font-semibold': link.active,
                        'text-muted-foreground hover:bg-muted': !link.active,
                      },
                    )}
                    style={{ justifyContent: 'flex-start' }}>
                    <div
                      className={cn({
                        'text-primary': link.active,
                        'text-muted-foreground': !link.active,
                      })}>
                      {link.icon}
                    </div>
                    {link.text}
                    {link.path === templatesPath && (
                      <Chip
                        size='sm'
                        variant='flat'
                        color='danger'
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] h-5 px-1.5 font-semibold'
                        startContent={
                          <HiFire className='w-3 h-3 text-red-500' />
                        }>
                        Hot
                      </Chip>
                    )}
                  </Button>
                ))}
              </div>

              {/* <Divider className="my-2" /> */}

              {/* 工具分组 */}
              <div>
                <div className='flex gap-1 items-center px-3 mt-8 mb-2 text-xs font-semibold text-muted-foreground'>
                  {t('tools')}
                  {/* add a question mark icon for tooltip */}
                  <Tooltip content={t('tools_description')} placement='right'>
                    <span tabIndex={0} className='cursor-pointer'>
                      <FiHelpCircle className='w-4 h-4' />
                    </span>
                  </Tooltip>
                </div>
                {favoriteTools.map(tool => (
                  <Button
                    as={Link}
                    href={tool.path}
                    key={tool.path}
                    size='md'
                    variant='light'
                    radius='lg'
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                      {
                        'bg-primary-50 text-primary font-semibold':
                          currentPath === tool.path,
                        'text-muted-foreground hover:bg-muted':
                          currentPath !== tool.path,
                      },
                    )}
                    style={{ justifyContent: 'flex-start' }}>
                    <div
                      className={cn({
                        'text-primary': currentPath === tool.path,
                        'text-muted-foreground': currentPath !== tool.path,
                      })}>
                      {/* <FaWandMagicSparkles className="w-[18px] h-[18px]" /> */}
                      {getToolsIcon(tool.path)}
                    </div>
                    <span className='truncate'>
                      {t(`common:${tool.title_key}`)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div className='mt-4 sticky bottom-0 left-0 right-0 bg-background text-foreground px-2 pt-3'>
              {profile ? (
                <div className='flex justify-between items-center px-2 mb-2 w-full text-sm font-bold'>
                  <div className='overflow-hidden max-w-2/3 text-ellipsis'>
                    {profile.user_name}
                  </div>
                  <div>{profile.credit || 0} Zaps</div>
                </div>
              ) : null}
              <Button
                size='md'
                className={cn(
                  'flex overflow-hidden gap-1 items-center px-4 py-1 w-full text-[15px] font-medium rounded-full',
                  isPaid
                    ? 'bg-card text-foreground border-[1.5px] border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                    : 'text-primary-foreground bg-gradient-to-r from-primary-500 to-purple-500',
                )}
                onPress={async () => {
                  if (profile?.id) {
                    trackUpgradeButtonClicked(profile.id, 'sidebar');
                  }
                  router.push(pricingPath);
                }}>
                <FaCrown className='w-5 h-5 mr-1.5' />
                {isPaid
                  ? t('common:price.manage_subscription')
                  : t('sidebar:upgrade_now')}
              </Button>
              {/* Social Media Links */}
              <div className='flex items-center justify-center gap-3 mt-3'>
                <a
                  href='https://discord.com/invite/rxX4B9b2ct'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-[#5865F2] transition-colors'>
                  <BsDiscord className='w-4 h-4' />
                </a>
                <a
                  href='https://x.com/KomikoAI'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-foreground transition-colors'>
                  <BsTwitterX className='w-4 h-4' />
                </a>
                <a
                  href='https://www.instagram.com/komiko.app/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-[#E4405F] transition-colors'>
                  <BsInstagram className='w-4 h-4' />
                </a>
                <a
                  href='https://www.tiktok.com/@komiko.app'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-foreground transition-colors'>
                  <BsTiktok className='w-4 h-4' />
                </a>
              </div>
            </div>
          </div>

          <Navbar
            className={cn(
              'fixed bottom-0 justify-center p-0 w-full ios-safe-bottom pwa-bottom-nav border-t border-border',
              {
                block: shouldShowMobile,
                hidden: !shouldShowMobile,
              },
            )}
            maxWidth={'full'}
            isBlurred={false}
            style={{ top: 'auto', height: '3.5rem' }}>
            {/* <NavbarContent className="flex justify-center p-0 w-full" justify="center"> */}
            <NavbarContent
              className='flex -gap-1 sm:gap-3 md:gap-8 justify-center items-center p-2 mb-5 sm:mb-2 w-full h-full pwa-nav-content'
              justify='center'>
              <NavbarItem className='p-0 m-0'>
                <Button
                  as={Link}
                  isIconOnly
                  color='primary'
                  variant='flat'
                  className='m-0 h-full w-16 p-2'
                  style={{
                    backgroundColor: 'transparent',
                    color:
                      currentPath !== explorePath
                        ? 'lightslategray'
                        : 'text-primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  href={explorePath}>
                  <div className='flex flex-col items-center'>
                    <GoHomeFill className='w-4 h-4 sm:w-5 sm:h-5' />
                    <span className='text-xs font-medium'>{t('home')}</span>
                  </div>
                </Button>
              </NavbarItem>

              <NavbarItem className='p-0 m-0'>
                <Button
                  as={Link}
                  isIconOnly
                  color='primary'
                  variant='flat'
                  className='m-0 h-full w-16 p-2 relative'
                  style={{
                    backgroundColor: 'transparent',
                    color: !currentPath.includes(templatesPath)
                      ? 'lightslategray'
                      : 'text-primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  href={templatesPath}
                  onClick={e => {
                    e.preventDefault();
                    try {
                      mixpanel.track('click.home.sidebar.effects');
                    } catch (error) {}
                    router.push(templatesPath);
                  }}>
                  <div className='flex flex-col items-center relative'>
                    <div className='relative'>
                      <IconTemplate className='w-4 h-4 sm:w-5 sm:h-5' />
                      <HiFire className='absolute -top-0.5 -right-2 w-3 h-3 text-red-500 z-10' />
                    </div>
                    <span className='text-xs font-medium'>
                      {t('effects')}
                    </span>
                  </div>
                </Button>
              </NavbarItem>
              {/* <NavbarItem className="p-0 m-0">
                            <Button
                                as={Link}
                                color="primary"
                                variant="flat"
                                className="m-0 h-[3rem] w-18 p-0 mb-3"
                                style={{
                                    backgroundColor: "white",
                                    color: currentPath != worldPath ? 'lightslategray' : 'black',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                                onClick={() => {

                                    try { mixpanel.track('click.home.sidebar.roleplay'); } catch (error) { }
                                    router.push(`${worldPath}?character_id=`);
                                }}
                            >
                                <div className="flex flex-col items-center">
                                    <IoIosChatbubbles className="w-6 h-6" />
                                    <span className="text-xs">Roleplay</span>
                                </div>
                            </Button>
                        </NavbarItem> */}

              <NavbarItem className='p-0 flex flex-col items-center'>
                <Button
                  isIconOnly
                  onPress={handleClickPublish}
                  size='sm'
                  color='primary'
                  variant='shadow'
                  className='mb-1 h-8 w-8 sm:h-10 sm:w-10 mx-2 sm:mx-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary-500 to-purple-600'>
                  <FiPlus className='w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground' />
                </Button>
              </NavbarItem>

              <NavbarItem className='p-0 m-0'>
                <Button
                  isIconOnly
                  as={Link}
                  color='primary'
                  variant='flat'
                  className='m-0 h-full w-16 p-2'
                  style={{
                    backgroundColor: 'transparent',
                    color:
                      currentPath !== aiAppsPath
                        ? 'lightslategray'
                        : 'text-primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  href={aiAppsPath}>
                  <div className='flex flex-col items-center'>
                    <FaWandMagicSparkles className='w-4 h-4 sm:w-5 sm:h-5' />
                    <span className='text-xs font-medium'>{t('aiApps')}</span>
                  </div>
                </Button>
              </NavbarItem>
              {/* <NavbarItem className="p-0 m-0">
                            <Button
                                as={Link}
                                color="primary"
                                variant="flat"
                                className="m-0 h-[3rem] w-18 p-0 mb-3"
                                style={{
                                    backgroundColor: "white",
                                    color: currentPath != leaderboardPath ? 'lightslategray' : 'black',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                                href={leaderboardPath}
                            >
                                <div className="flex flex-col items-center">
                                    <MdLeaderboard className="w-6 h-6" />
                                    <span className="text-xs">Leaderboard</span>
                                </div>
                            </Button>
                        </NavbarItem> */}
              <NavbarItem className='p-0 m-0'>
                <Button
                  isIconOnly
                  as={Link}
                  color='primary'
                  variant='flat'
                  className='m-0 h-full w-16 p-2'
                  style={{
                    backgroundColor: 'transparent',
                    color:
                      currentPath !== profilePath
                        ? 'lightslategray'
                        : 'text-primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  href={profilePath}>
                  <div className='flex flex-col items-center'>
                    <CgProfile className='w-4 h-4 sm:w-5 sm:h-5' />
                    <span className='text-xs font-medium'>{t('profile')}</span>
                  </div>
                </Button>
              </NavbarItem>
            </NavbarContent>
          </Navbar>
        </div>
      )}
      <PublishDrawer
        isOpen={isPublishDrawerOpen}
        onOpenChange={setIsPublishDrawerOpen}
      />
    </>
  );
}
