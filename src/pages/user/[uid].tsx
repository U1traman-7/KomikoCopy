/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Chip,
  useDisclosure,
  Tabs,
  Tab,
  Card,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { RiUserForbidLine, RiUserLine, RiRefreshLine, RiMoreFill } from 'react-icons/ri';
import { HiOutlinePhotograph, HiOutlineUser, HiOutlineDocumentText } from 'react-icons/hi';
import { FaUserShield } from 'react-icons/fa';
import { MdOutlineCollections } from 'react-icons/md';
import { FaUsers, FaTheaterMasks } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SpecificFeed from '../../Components/ProfilePage/SpecificFeed';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { VipAvatarWithBorder } from '../../Components/VipBadge';
import { Feed } from '@/components/Feed';
import { fetchFollowerInfo } from '@/api/profile';
import { useAtomValue } from 'jotai';
import { authAtom, profileAtom } from '../../state';
import { useBlockUser } from '../../hooks/useBlockUser';
import { PublicUserCharacters } from '../../Components/ProfilePage/PublicUserCharacters';
import UserBadges from '../../Components/ProfilePage/UserBadges';
import { ProfileModTab } from '../../Components/ProfilePage/ProfileModTab';
import type { Badge } from '@/state/index';
import { NsfwToggle } from '../../Components/NsfwToggle';

// 定义ROLES常量，避免导入问题
const ROLES = {
  ADMIN: 1,
} as const;

interface Profile {
  authUserId: string;
  user_uniqid: string;
  created_at: string;
  user_name: string;
  image: string;
  user_desc: string;
  num_followers: number;
  num_following: number;
  credit: number;
  date_checkin: string;
  date_post: string;
  date_like: string;
  followed: boolean;
  isFollowingMe?: boolean; // 对方是否关注了我
  is_cpp: boolean;
  plan?: string;
  badges?: Badge[];
}

export default function User({ _profile }: { _profile: Profile }) {
  const { t } = useTranslation(['user', 'common']);
  const router = useRouter();
  const { uid } = router.query;
  const userUrl = `https://komiko.app/user/${uid}`;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState(_profile?.user_name);
  const [bio, setBio] = useState(_profile?.user_desc);
  const [bad, setBad] = useState<Boolean>(_profile === null);
  const [profile, setProfile] = useState<Profile>(_profile);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetField, setResetField] = useState<'avatar' | 'username' | 'bio' | 'all' | null>(null);

  // NSFW mode state for filtering user's posts and characters
  const [nsfwMode, setNsfwMode] = useState(false);
  const [feedKey, setFeedKey] = useState(1);
  const [hasModTags, setHasModTags] = useState(false);

  // Handle NSFW mode change
  const handleNsfwModeChange = useCallback((isNsfwMode: boolean) => {
    setNsfwMode(isNsfwMode);
    setFeedKey(prev => prev + 1);
  }, []);

  // 获取当前用户信息和权限
  const isAuth = useAtomValue(authAtom);
  const currentUserProfile = useAtomValue(profileAtom);
  const isAdmin = currentUserProfile.roles?.includes(ROLES.ADMIN) || false;

  // 用户级别屏蔽功能
  const {
    blockUser: userBlockUser,
    unblockUser: userUnblockUser,
    isBlocked: isUserBlockedCheck,
    fetchBlockedUsers,
  } = useBlockUser();
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isUserBlocking, setIsUserBlocking] = useState(false);
  const [userBlockConfirmOpen, setUserBlockConfirmOpen] = useState(false);

  // 初始化屏蔽列表并检查当前用户屏蔽状态
  useEffect(() => {
    if (isAuth && profile?.authUserId) {
      fetchBlockedUsers();
    }
  }, [isAuth, profile?.authUserId, fetchBlockedUsers]);

  // 监听 blockedUserIds 变化，更新当前页面的用户屏蔽状态
  useEffect(() => {
    if (profile?.authUserId) {
      setIsUserBlocked(isUserBlockedCheck(profile.authUserId));
    }
  }, [profile?.authUserId, isUserBlockedCheck]);

  // 处理用户级别的block/unblock
  const handleUserBlock = async () => {
    if (!profile?.authUserId) return;

    setIsUserBlocking(true);
    let success = false;
    if (isUserBlocked) {
      success = await userUnblockUser(profile.authUserId, profile.user_name);
    } else {
      success = await userBlockUser(profile.authUserId, profile.user_name);
    }

    if (success) {
      setIsUserBlocked(!isUserBlocked);
      // Block 成功后返回主页
      if (!isUserBlocked) {
        router.push('/');
      }
    }
    setIsUserBlocking(false);
    setUserBlockConfirmOpen(false);
  };

  // 是否是自己的主页
  const isOwnProfile = currentUserProfile?.user_uniqid === profile?.user_uniqid;

  // 双向屏蔽关系检查：检查页面所有者是否屏蔽了当前访问者（反向检查）
  const [hasBlockRelation, setHasBlockRelation] = useState(false);

  useEffect(() => {
    // 未登录、自己的主页、或没有 profile 时不需要检查
    if (!isAuth || isOwnProfile || !profile?.authUserId) {
      setHasBlockRelation(false);
      return;
    }

    const checkBlockRelation = async () => {
      try {
        const response = await fetch(
          `/api/user/check-block-relation?targetUserId=${encodeURIComponent(profile.authUserId)}`,
          { credentials: 'include' },
        );

        if (!response.ok) {
          setHasBlockRelation(false);
          return;
        }

        const data = await response.json();
        if (data.code === 1 && data.data) {
          setHasBlockRelation(data.data.hasBlockRelation);
        }
      } catch (err) {
        console.error('Failed to check block relation:', err);
        setHasBlockRelation(false);
      }
    };

    checkBlockRelation();
  }, [isAuth, isOwnProfile, profile?.authUserId]);

  // 是否应该显示内容：自己的主页 或 不存在屏蔽关系
  const shouldShowContent = isOwnProfile || !hasBlockRelation;

  // 检查用户是否被管理员封禁
  const checkUserBlockStatus = async () => {
    if (!uid) return;

    try {
      const response = await fetch(`/api/blockUser?user_uniqid=${uid}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.code === 1) {
        setIsBlocked(data.data.blocked);
      } else {
        console.error('Failed to check block status:', data.error);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  // 处理block/unblock用户
  const handleBlockUser = async (action: 'block' | 'unblock') => {
    if (!uid) return;

    setIsBlocking(true);
    try {
      const response = await fetch('/api/blockUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_uniqid: uid,
          action: action,
        }),
      });

      const data = await response.json();

      if (response.ok && data.code === 1) {
        setIsBlocked(action === 'block');
        toast.success(
          action === 'block'
            ? 'User blocked successfully'
            : 'User unblocked successfully',
        );
        window.location.reload();
      } else {
        toast.error(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setIsBlocking(false);
    }
  };

  const RESET_FIELD_LABELS: Record<string, string> = {
    avatar: 'avatar',
    username: 'username',
    bio: 'bio',
    all: 'all profile info',
  };

  const openResetConfirm = (field: 'avatar' | 'username' | 'bio' | 'all') => {
    setResetField(field);
    setResetConfirmOpen(true);
  };

  const confirmResetProfile = async () => {
    if (!uid || !resetField) return;

    const isAll = resetField === 'all';

    setIsResetting(true);
    try {
      const response = await fetch('/api/fetchProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'admin-reset-profile',
          target_user_uniqid: uid,
          reset_avatar: resetField === 'avatar' || isAll,
          reset_username: resetField === 'username' || isAll,
          reset_bio: resetField === 'bio' || isAll,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User ${RESET_FIELD_LABELS[resetField]} cleared successfully`);
        setResetConfirmOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to reset profile');
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast.error('Failed to reset profile');
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch user profile when uid changes (for client-side navigation)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!uid || typeof uid !== 'string') return;

      try {
        const response = await fetch('/api/fetchProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'public-profile', user_uniqid: uid }),
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({ ...data, authUserId: data.id || '' });
          setUsername(data.user_name);
          setBio(data.user_desc);
          setBad(false);
        } else {
          setBad(true);
          setProfile(null as any);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setBad(true);
      }
    };

    // Only fetch on client-side navigation (when uid differs from current profile)
    if (uid && uid !== profile?.user_uniqid) {
      fetchUserProfile();
    }
  }, [uid]);

  useEffect(() => {
    const uniqId =
      router.query.uid && typeof router.query.uid === 'string'
        ? router.query.uid
        : undefined;
    fetchFollowerInfo(uniqId).then(res => {
      if (!res.code || res.error) {
        return;
      }
      const data = res.data;
      setProfile(prev => ({
        ...prev,
        num_followers: data.follower_count,
        num_following: data.following_count,
      }));
    });

    // 检查用户屏蔽状态（仅管理员需要）
    if (isAdmin) {
      checkUserBlockStatus();
    }

    // Check if user has mod tags
    const checkModTags = async () => {
      const uniqId =
        router.query.uid && typeof router.query.uid === 'string'
          ? router.query.uid
          : undefined;
      if (!uniqId) return;

      try {
        const response = await fetch(
          `/api/tag/moderated?userUniqid=${uniqId}`,
        );
        const data = await response.json();
        setHasModTags(data.tags && data.tags.length > 0);
      } catch (error) {
        console.error('Error checking mod tags:', error);
      }
    };

    checkModTags();
  }, [router.query.uid, isAdmin]);

  // 根据VIP等级获取背景渐变样式
  const getVipBackgroundGradient = (plan?: string, is_cpp?: boolean) => {
    // CPP用户使用Plus样式
    if (is_cpp || plan === 'CPP') {
      return 'bg-gradient-to-br from-purple-100/80 via-purple-50/50 to-white dark:from-purple-900/30 dark:via-purple-950/20 dark:to-gray-900';
    }

    switch (plan) {
      case 'Starter':
        // 清新青色斜向渐变
        return 'bg-gradient-to-br from-cyan-100/80 via-cyan-50/50 to-white dark:from-cyan-900/30 dark:via-cyan-950/20 dark:to-gray-900';
      case 'Plus':
        // 神秘紫色斜向渐变
        return 'bg-gradient-to-br from-purple-100/80 via-purple-50/50 to-white dark:from-purple-900/30 dark:via-purple-950/20 dark:to-gray-900';
      case 'Premium':
        // 豪华金色斜向渐变
        return 'bg-gradient-to-br from-amber-100/80 via-amber-50/50 to-white dark:from-amber-900/30 dark:via-amber-950/20 dark:to-gray-900';
      case 'Enterprise':
        // 高级银色斜向渐变
        return 'bg-gradient-to-br from-muted/80 via-muted/50 to-background';
      default:
        // 免费用户浅色背景
        return 'bg-muted';
    }
  };

  // 获取VIP头像显示的plan (CPP使用Plus样式)
  const getVipAvatarPlan = (plan?: string, is_cpp?: boolean) => {
    return is_cpp || plan === 'CPP' ? 'Plus' : plan;
  };

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    return num > 1000 ? `${(num / 1000).toFixed(1)}k` : num.toLocaleString();
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.user', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  //! HANDLE FOLLOW
  const handleFollow = async () => {
    let followValue = 0;
    if (profile?.followed) {
      followValue = -1;
    } else {
      followValue = 1;
    }

    console.log(
      JSON.stringify({
        followingUserId: profile?.authUserId,
        value: followValue,
      }),
    );
    // Make API call to update follow
    const response = await fetch(`/api/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        followingUserId: profile?.authUserId,
        value: followValue,
      }),
    });

    if (response.ok) {
      // Toggle the followed state based on the previous value
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile; // Handle case if prevProfile is undefined

        return {
          ...prevProfile,
          followed: !prevProfile.followed,
        };
      });
    } else {
      console.error('Failed to update follow status');
      toast.error('Failed to update follow status. Have you logged in?');
    }
  };

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>
          {profile
            ? `${profile.user_name} | Komiko`
            : 'User Not Found | Komiko'}
        </title>
        <meta property='og:type' content='profile' />
        <meta
          property='og:title'
          content={
            profile
              ? `${profile.user_name} | Komiko`
              : 'User Not Found | Komiko'
          }
        />
        <meta property='og:description' content={profile?.user_desc} />
        <meta property='og:image' content={profile?.image} />
        <meta property='og:url' content={userUrl} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@KomikoAI' />
        <meta
          name='twitter:title'
          content={
            profile
              ? `${profile.user_name} | Komiko`
              : 'User Not Found | Komiko'
          }
        />
        <meta name='twitter:description' content={profile?.user_desc} />
        <meta name='twitter:image' content={profile?.image} />
        <meta
          name='description'
          content={`${profile?.user_desc}
          Join ${profile?.user_name} and start creating on KomikoAI!`}
        />
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='md:px-2 md:pt-24 pt-16 w-full h-full lg:pl-[240px] md:ml-5'>
          {profile && (
            <div className='container relative mx-auto w-full max-w-6xl flex-grow px-2 md:px-6'>
              {
                //! TOP
              }

              {/* 用户个人信息 - 渐变背景层 */}
              <div
                className={`w-full rounded-2xl border-border border overflow-hidden ${getVipBackgroundGradient(profile.plan, profile.is_cpp)}`}>
                {/* 头部区域 */}
                <div
                  className={`pt-8 pb-8 px-6 md:px-8 text-center md:text-left`}>
                  {/* 头像和用户信息 - 响应式布局 */}
                  <div className='flex flex-col md:flex-row items-stretch gap-4 md:gap-6 mb-4'>
                    {/* 头像 */}
                    <div className='flex items-center justify-center flex-shrink-0 md:w-[140px]'>
                      <div className='transition-transform duration-300 hover:rotate-12'>
                        <VipAvatarWithBorder
                          plan={getVipAvatarPlan(profile.plan, profile.is_cpp)}
                          radius='full'
                          className='w-24 h-24'
                          src={profile.image}
                          name={profile.user_name}
                          borderWidth={3}
                        />
                      </div>
                    </div>

                    {/* 用户信息 */}
                    <div className='text-center md:text-left flex-1 flex flex-col justify-center'>
                      {/* 用户名 */}
                      <div className='mb-3'>
                        {profile.user_name ? (
                          <div className='flex items-center gap-2 justify-center md:justify-start flex-wrap'>
                            <h1 className='text-xl md:text-2xl font-bold text-heading'>
                              {profile.user_name}
                            </h1>
                            {/* Follows you 标签：登录状态 + 不是自己 + 对方关注了我 */}
                            {isAuth && profile.isFollowingMe && currentUserProfile?.user_uniqid !== profile.user_uniqid && (
                              <Chip size='sm' variant='flat' color='default' className='text-xs'>
                                {t('followsYou')}
                              </Chip>
                            )}
                          </div>
                        ) : (
                          <h1 className='text-xl md:text-2xl text-muted-foreground text-center md:text-left'>
                            {t('setUsername')}
                          </h1>
                        )}
                      </div>

                      {/* 徽章列表 */}
                      <UserBadges badges={profile.badges} className="mb-3" />

                      {/* 用户简介 */}
                      {profile.user_desc && (
                        <p className='text-muted-foreground text-sm leading-relaxed mb-4 max-w-sm md:max-w-none'>
                          {profile.user_desc}
                        </p>
                      )}

                      {/* 统计数据 */}
                      <div className='flex gap-6 justify-center md:justify-start mb-4'>
                        <div>
                          <span className='text-muted-foreground text-sm'>
                            {formatNumber(profile.num_followers ?? 0)} Followers
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground text-sm'>
                            {formatNumber(profile.num_following ?? 0)} Following
                          </span>
                        </div>
                      </div>

                      {/* Follow 按钮 - 大屏幕时在用户信息区域内 */}
                      <div className='flex gap-1 justify-center md:justify-start'>
                        {profile.followed ? (
                          <Button
                            variant='flat'
                            radius='full'
                            size='md'
                            className='px-8 font-medium min-w-[120px]'
                            onPress={() => handleFollow()}>
                            <AiOutlineMinus className='w-4 h-4 mr-2' />
                            {t('following_count')}
                          </Button>
                        ) : (
                          <Button
                            variant='flat'
                            radius='full'
                            size='md'
                            className='px-8 font-medium min-w-[120px]'
                            onPress={() => handleFollow()}>
                            <AiOutlinePlus className='w-4 h-4 mr-2' />
                            {t('follow')}
                          </Button>
                        )}

                        {/* 用户级别屏蔽按钮 - 非自己的主页显示 */}
                        {isAuth && !isOwnProfile && !isAdmin && (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                variant='flat'
                                radius='full'
                                size='md'
                                isIconOnly
                                className='min-w-[40px]'>
                                <RiMoreFill className='w-5 h-5' />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label='User actions'
                              onAction={(key) => {
                                if (key === 'block') {
                                  setUserBlockConfirmOpen(true);
                                }
                              }}>
                              <DropdownItem
                                key='block'
                                className={isUserBlocked ? 'text-success' : 'text-danger'}
                                color={isUserBlocked ? 'success' : 'danger'}
                                startContent={
                                  isUserBlocked
                                    ? <RiUserLine className='w-4 h-4' />
                                    : <RiUserForbidLine className='w-4 h-4' />
                                }>
                                {isUserBlocked
                                  ? t('common:block.buttonUnblock')
                                  : t('common:block.buttonBlock')}
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        )}

                        {/* Admin 操作按钮 - 只有admin可见 */}
                        {isAuth && isAdmin && (
                          <>
                            {isBlocked ? (
                              <Button
                                variant='flat'
                                radius='full'
                                size='sm'
                                className='px-6 h-10 font-medium min-w-[100px] text-green-600 border-green-600'
                                isLoading={isBlocking}
                                onPress={() => handleBlockUser('unblock')}>
                                <RiUserLine className='w-4 h-4 mr-2' />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant='flat'
                                radius='full'
                                size='sm'
                                className='px-6 h-10 font-medium min-w-[100px] text-red-600 border-red-600'
                                isLoading={isBlocking}
                                onPress={() => handleBlockUser('block')}>
                                <RiUserForbidLine className='w-4 h-4 mr-2' />
                                Block
                              </Button>
                            )}

                            {/* Reset Profile 下拉菜单 */}
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  variant='flat'
                                  radius='full'
                                  size='sm'
                                  className='px-6 h-10 font-medium min-w-[100px] text-orange-600'
                                  isLoading={isResetting}>
                                  <RiRefreshLine className='w-4 h-4 mr-2' />
                                  Reset Profile
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label='Reset profile options'
                                onAction={key =>
                                  openResetConfirm(
                                    key as 'avatar' | 'username' | 'bio' | 'all',
                                  )
                                }>
                                <DropdownSection showDivider>
                                  <DropdownItem
                                    key='avatar'
                                    startContent={
                                      <HiOutlinePhotograph className='w-4 h-4' />
                                    }>
                                    Clear Avatar
                                  </DropdownItem>
                                  <DropdownItem
                                    key='username'
                                    startContent={
                                      <HiOutlineUser className='w-4 h-4' />
                                    }>
                                    Clear Username
                                  </DropdownItem>
                                  <DropdownItem
                                    key='bio'
                                    startContent={
                                      <HiOutlineDocumentText className='w-4 h-4' />
                                    }>
                                    Clear Bio
                                  </DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                  <DropdownItem
                                    key='all'
                                    className='text-danger'
                                    color='danger'>
                                    Clear All
                                  </DropdownItem>
                                </DropdownSection>
                              </DropdownMenu>
                            </Dropdown>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {
                //! PUBLIC FEED - 内容区域层
              }

              <div className='mt-2'>
                <div className='relative'>
                  <Tabs
                    aria-label='User profile tabs'
                    color='primary'
                    variant='underlined'
                    classNames={{
                      base: 'w-full',
                      tabList:
                        'gap-3 md:gap-6 w-full relative rounded-none p-0 pr-12 md:pr-14 border-b border-divider min-w-max text-xs md:text-base',
                      cursor: 'w-full bg-primary',
                      tab: 'max-w-fit px-0 h-12',
                      tabContent: 'group-data-[selected=true]:text-primary',
                      panel: 'px-0 pt-2',
                    }}>
                    <Tab
                      key='posts'
                      title={
                        <div className='flex gap-2 items-center'>
                          <MdOutlineCollections className='text-xl' />
                          <span>{t('posts')}</span>
                        </div>
                      }>
                      <Card className='border-none shadow-none min-h-0 bg-transparent'>
                        {shouldShowContent ? (
                          <Feed
                            key={`${profile.user_uniqid}-${feedKey}`}
                            simple
                            type='profile'
                            prerenderedPosts={false}
                            user_uniqid={profile.user_uniqid}
                            externalNsfwMode={nsfwMode}
                          />
                        ) : (
                          <div className='py-8'></div>
                        )}
                      </Card>
                    </Tab>
                    <Tab
                      key='characters'
                      title={
                        <div className='flex gap-2 items-center'>
                          <FaTheaterMasks className='text-xl' />
                          <span>{t('characters')}</span>
                        </div>
                      }>
                      <Card className='border-none shadow-none min-h-0 bg-transparent'>
                        {shouldShowContent ? (
                          <PublicUserCharacters
                            key={`${profile.user_uniqid}-${feedKey}`}
                            userUniqid={profile.user_uniqid}
                            nsfwMode={nsfwMode}
                          />
                        ) : (
                          <div className='py-8'></div>
                        )}
                      </Card>
                    </Tab>
                    {shouldShowContent && hasModTags && (
                      <Tab
                        key='mod'
                        title={
                          <div className='flex gap-2 items-center'>
                            <FaUserShield className='text-xl' />
                            <span>{t('mod')}</span>
                          </div>
                        }>
                        <Card className='border-none shadow-none min-h-0 bg-transparent'>
                          <ProfileModTab userUniqid={profile.user_uniqid} />
                        </Card>
                      </Tab>
                    )}
                  </Tabs>
                  {/* NSFW Toggle - fixed position on right */}
                  <div className='absolute right-0 top-3 bg-background pl-2'>
                    <NsfwToggle
                      onModeChange={handleNsfwModeChange}
                      isActive={nsfwMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {bad && (
            <div className='pt-0 pr-0 pb-0 pl-0 h-full'>
              <div className='flex flex-col justify-center items-center pt-6 pr-0 pl-0 h-full sm:flex-row max-h-998 md:max-h-999'>
                <div>
                  <img
                    src={'/images/sad_cat.webp'}
                    alt={`sad cat`}
                    className='w-80'
                  />
                  <p>{t('userNotFound')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Profile Confirm Modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        placement='center'>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Reset Profile
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to clear this user's{' '}
                  <span className='font-semibold'>
                    {resetField ? RESET_FIELD_LABELS[resetField] : ''}
                  </span>
                  ?
                </p>
                <p className='text-sm text-muted-foreground'>
                  This action cannot be undone. The user will be notified.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color='default' variant='light' onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color='danger'
                  isLoading={isResetting}
                  onPress={confirmResetProfile}>
                  Clear
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* User Block Confirm Modal */}
      {userBlockConfirmOpen && (
        <Modal
          isOpen
          onClose={() => setUserBlockConfirmOpen(false)}
          placement='center'>
          <ModalContent>
            <ModalHeader>
              {isUserBlocked
                ? t('common:block.confirmUnblockTitle', { name: profile?.user_name })
                : t('common:block.confirmBlockTitle', { name: profile?.user_name })}
            </ModalHeader>
            <ModalBody>
              {isUserBlocked ? (
                <p className='text-sm text-default-600'>
                  {t('common:block.unblockDescription')}
                </p>
              ) : (
                <div className='space-y-2 text-sm text-default-600'>
                  <p>{t('common:block.blockDescription1')}</p>
                  <p>{t('common:block.blockDescription2')}</p>
                  <p>{t('common:block.blockDescription3')}</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={() => setUserBlockConfirmOpen(false)}>
                {t('common:block.buttonCancel')}
              </Button>
              <Button
                color={isUserBlocked ? 'primary' : 'danger'}
                isLoading={isUserBlocking}
                onPress={handleUserBlock}>
                {isUserBlocked ? t('common:block.buttonUnblock') : t('common:block.buttonBlock')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </main>
  );
}

export async function getServerSideProps(context: {
  params: { uid: any };
  req: any;
}) {
  const { uid } = context.params;
  const { req } = context;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fetchProfile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: req.headers.cookie,
        },
        body: JSON.stringify({ method: 'public-profile', user_uniqid: uid }),
      },
    );

    if (!response.ok) {
      console.log('user not found');
      return { props: { _profile: null } };
    }

    const data = await response.json();

    return {
      props: { _profile: { ...data, authUserId: data.id || '' } },
    };
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return { props: { _profile: null } };
  }
}
