/* eslint-disable */
import { useTranslation } from 'react-i18next';
import { VipAvatarWithBorder } from '../VipBadge';
import { FaPencilAlt } from 'react-icons/fa';
import { IoSettingsOutline } from 'react-icons/io5';
import { useSetAtom, useAtom } from 'jotai';
import { profileAtom, followCountsAtom, updateFollowCountsAtom } from '@/state/index';
import { useEffect, useState } from 'react';
import { fetchFollowerInfo } from '@/api/profile';
import { useFollowListModal } from '../../hooks/useFollowListModal';
import SettingsModal from '../Modals/SettingsModal';
import UserBadges from './UserBadges';
import type { Badge } from '@/state/index';

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
  followed?: boolean;
  is_cpp: boolean;
  plan?: string;
  badges?: Badge[];
}

interface UserInfoCardProps {
  profile: Profile;
  onEditClick: () => void;
  onDeleteAccount?: () => void;
  isOwnProfile?: boolean;
}

export default function UserInfoCard({
  profile,
  onEditClick,
  onDeleteAccount,
  isOwnProfile = false,
}: UserInfoCardProps) {
  const { t } = useTranslation('profile');
  const setProfile = useSetAtom(profileAtom);
  const [followCounts] = useAtom(followCountsAtom);
  const updateFollowCounts = useSetAtom(updateFollowCountsAtom);
  const { openFollowListModal } = useFollowListModal();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetchFollowerInfo().then(res => {
      if (!res.code || res.error) {
        return;
      }
      const data = res.data;
      setProfile(prev => ({
        ...prev,
        num_followers: data.follower_count,
        num_following: data.following_count,
      }));

      updateFollowCounts({
        followers: data.follower_count,
        following: data.following_count,
      });
    });
  }, [updateFollowCounts]);

  // 根据VIP等级获取背景渐变样式
  const getVipBackgroundGradient = (plan?: string, is_cpp?: boolean) => {
    // CPP用户使用Plus样式
    if (is_cpp) {
      return 'bg-gradient-to-br from-purple-100/80 via-purple-50/50 to-white dark:from-purple-900/30 dark:via-purple-950/20 dark:to-background';
    }

    switch (plan) {
      case 'Starter':
        // 清新青色斜向渐变
        return 'bg-gradient-to-br from-cyan-100/80 via-cyan-50/50 to-white dark:from-cyan-900/30 dark:via-cyan-950/20 dark:to-background';
      case 'Plus':
        // 神秘紫色斜向渐变
        return 'bg-gradient-to-br from-purple-100/80 via-purple-50/50 to-white dark:from-purple-900/30 dark:via-purple-950/20 dark:to-background';
      case 'Premium':
        // 豪华金色斜向渐变
        return 'bg-gradient-to-br from-amber-100/80 via-amber-50/50 to-white dark:from-amber-900/30 dark:via-amber-950/20 dark:to-background';
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
    return is_cpp ? 'Plus' : plan;
  };

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    return num > 1000 ? `${(num / 1000).toFixed(1)}k` : num.toLocaleString();
  };

  return (
    <div>
      {/* 用户个人信息 - 渐变背景层 */}
      <div
        className={`w-full rounded-2xl border-border border overflow-hidden ${getVipBackgroundGradient(profile.plan, profile.is_cpp)} relative`}>
        {/* 设置按钮 - 右上角 */}
        {isOwnProfile && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10'
            aria-label='Settings'>
            <IoSettingsOutline className='w-5 h-5 text-muted-foreground' />
          </button>
        )}
        {/* 头部区域 */}
        <div className={`pt-8 pb-8 px-6 md:px-8 text-center md:text-left`}>
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
                  onClick={isOwnProfile ? onEditClick : undefined}
                  style={isOwnProfile ? { cursor: 'pointer' } : undefined}
                />
              </div>
            </div>

            {/* 用户信息 */}
            <div className='text-center md:text-left flex-1 flex flex-col justify-center'>
              {/* 用户名和编辑按钮 */}
              <div className='mb-3'>
                <div className='flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3'>
                  {profile.user_name ? (
                    <h1 className='text-xl md:text-2xl font-bold text-heading'>
                      {profile.user_name}
                    </h1>
                  ) : (
                    <h1 className='text-xl md:text-2xl text-muted-foreground'>
                      {t('setUsername')}
                    </h1>
                  )}
                  <div className='flex items-center gap-2'>
                    {isOwnProfile && (
                      <FaPencilAlt
                        className='ml-2 cursor-pointer min-w-5 min-h-5'
                        color='slate'
                        onClick={onEditClick}
                      />
                    )}
                  </div>
                </div>
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
              <div className='flex gap-6 justify-center md:justify-start'>
                <div
                  className='cursor-pointer hover:text-foreground transition-colors'
                  onClick={() => {
                    const userId = profile.authUserId || (profile as any).id;
                    openFollowListModal({
                      userId: userId,
                      initialTab: 'followers',
                      followersCount: followCounts.followers,
                      followingCount: followCounts.following,
                    });
                  }}>
                  <span className='text-muted-foreground text-sm hover:text-foreground'>
                    {t('followers', { count: followCounts.followers })}
                  </span>
                </div>
                <div
                  className='cursor-pointer hover:text-foreground transition-colors'
                  onClick={() => {
                    const userId = profile.authUserId || (profile as any).id;
                    openFollowListModal({
                      userId: userId,
                      initialTab: 'following',
                      followersCount: followCounts.followers,
                      followingCount: followCounts.following,
                    });
                  }}>
                  <span className='text-muted-foreground text-sm hover:text-foreground'>
                    {t('following', { count: followCounts.following })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isOwnProfile && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onRequestDeleteAccount={onDeleteAccount}
        />
      )}
    </div>
  );
}
