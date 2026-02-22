import { useTranslation } from 'react-i18next';
import type { Badge } from '@/state/index';
import { FaCrown, FaGem } from 'react-icons/fa';
import React, { useState } from 'react';

export const badgeTranslationMap: Record<string, string> = {
  'deca_doodler': 'deca_doodler.title',
  'penta_praiser': 'penta_praiser.title',
  'trio_poster': 'trio_poster.title',
  'thirty_plus_liked': 'thirty_plus_liked.title',
  'century_liked_star': 'century_liked_star.title',
  'leaderboard_first': 'leaderboard_first.title',
  'leaderboard_second': 'leaderboard_second.title',
  'leaderboard_third': 'leaderboard_third.title',
  'starter': 'vip_starter.title',
  'plus': 'vip_plus.title',
  'premium': 'vip_premium.title',
  'enterprise': 'vip_enterprise.title',
  'cpp': 'vip_cpp.title',
};

export function getBadgeTitle(badgeCode: string, title: string, t: (key: string) => string): string {
  const translationKey = badgeTranslationMap[badgeCode];
  return translationKey ? t(translationKey) : title;
}

interface UserBadgesProps {
  badges?: Badge[];
  className?: string;
  badgeClassName?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'FaCrown': FaCrown,
  'FaGem': FaGem
};


function renderIcon(iconUrl: string, size: number = 14): React.ReactNode {
  if (iconMap[iconUrl]) {
    const IconComponent = iconMap[iconUrl];
    return <IconComponent size={size} className="leading-none" />;
  }
  
  return <span className='text-lg leading-none' style={{ fontSize: `${size}px` }}>{iconUrl}</span>;
}

export default function UserBadges({
  badges,
  className = '',
  badgeClassName = '',
}: UserBadgesProps) {
  const { t: tBadges } = useTranslation('badges');
  // 跟踪移动端展开的徽章ID（方案一：点击单个徽章展开）
  const [expandedBadgeId, setExpandedBadgeId] = useState<number | null>(null);

  // TODO: 暂时只显示VIP徽章，其他徽章功能暂时注释
  const vipBadges = badges?.filter(badge => badge.badge_type === 'VIP_PLAN') || [];

  if (!vipBadges || vipBadges.length === 0) {
    return null;
  }

  // VIP徽章的渐变样式配置
  const getVipBadgeStyle = (badgeCode: string) => {
    const vipStyles: Record<string, { gradient: string; textColor?: string; boxShadow?: string; icon?: string }> = {
      'starter': {
        // 清新蓝绿色系：天蓝→青色→薄荷绿
        gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981)',
        boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
        icon: 'FaCrown', 
      },
      'plus': {
        // 神秘紫色系：深紫→品红→紫红
        gradient: 'linear-gradient(135deg, #7c3aed, #c026d3, #e11d48)',
        boxShadow: '0 0 15px rgba(192, 38, 211, 0.3)',
        icon: 'FaCrown',
      },
      'premium': {
        // 豪华金橙色系：橙色→金色→黄色（
        gradient: 'linear-gradient(135deg, #f97316, #f59e0b, #eab308)',
        boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)',
        icon: 'FaCrown', 
      },
      'enterprise': {
        // 高级银灰色系：银色→白金→珍珠白
        gradient: 'linear-gradient(135deg, #94a3b8, #e2e8f0, #f8fafc)',
        textColor: '#374151',
        boxShadow: '0 0 15px rgba(148, 163, 184, 0.3)',
        icon: 'FaCrown', 
      },
      'cpp': {
        gradient: 'linear-gradient(135deg, #ec4899, #d946ef, #a855f7)',
        boxShadow: '0 0 15px rgba(217, 70, 239, 0.3)',
      },
    };
    return vipStyles[badgeCode] || null;
  };

  // 用户成就徽章的样式配置（V3 淡色版本）
  const getAchievementBadgeStyle = (badgeCode: string) => {
    const achievementStyles: Record<string, { gradient: string; textColor: string; border: string; hoverShadow: string }> = {
      'deca_doodler': {
        // 坚持不懈的绘者 - 淡蓝紫
        gradient: 'linear-gradient(135deg, #dbeafe, #e0e7ff, #ede9fe)',
        textColor: '#4338ca',
        border: '1px solid #c7d2fe',
        hoverShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
      },
      'penta_praiser': {
        // 热心鼓励者 - 淡玫红
        gradient: 'linear-gradient(135deg, #fce7f3, #fae8ff, #f5d0fe)',
        textColor: '#be185d',
        border: '1px solid #f9a8d4',
        hoverShadow: '0 4px 12px rgba(236, 72, 153, 0.15)',
      },
      'trio_poster': {
        // 崭露头角者 - 淡青绿
        gradient: 'linear-gradient(135deg, #d1fae5, #ccfbf1, #cffafe)',
        textColor: '#047857',
        border: '1px solid #6ee7b7',
        hoverShadow: '0 4px 12px rgba(20, 184, 166, 0.15)',
      },
      'thirty_plus_liked': {
        // 受关注的创作者 - 淡紫罗兰
        gradient: 'linear-gradient(135deg, #f3e8ff, #fae8ff, #fdf4ff)',
        textColor: '#7c3aed',
        border: '1px solid #d8b4fe',
        hoverShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
      },
      'century_liked_star': {
        // 备受欢迎的艺术家 - 淡橙黄
        gradient: 'linear-gradient(135deg, #ffedd5, #fef3c7, #fef9c3)',
        textColor: '#c2410c',
        border: '1px solid #fdba74',
        hoverShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
      },
    };
    return achievementStyles[badgeCode] || null;
  };

  // 榜单徽章的样式配置（V3 淡色版本）
  const getLeaderboardBadgeStyle = (badgeCode: string) => {
    const leaderboardStyles: Record<string, { gradient: string; textColor: string; border: string; hoverShadow: string }> = {
      'leaderboard_first': {
        // 冠军徽章（第一） - 淡金色
        gradient: 'linear-gradient(135deg, #fef3c7, #fde68a, #fef08a)',
        textColor: '#b45309',
        border: '1px solid #fcd34d',
        hoverShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
      },
      'leaderboard_second': {
        // 远见勋章（第二） - 淡银灰
        gradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0, #f8fafc)',
        textColor: '#475569',
        border: '1px solid #cbd5e1',
        hoverShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
      },
      'leaderboard_third': {
        // 开拓徽章（第三） - 淡古铜
        gradient: 'linear-gradient(135deg, #fef3c7, #fde68a, #fed7aa)',
        textColor: '#92400e',
        border: '1px solid #f59e0b',
        hoverShadow: '0 4px 12px rgba(180, 83, 9, 0.15)',
      },
    };
    return leaderboardStyles[badgeCode] || null;
  };

  const badgeCount = vipBadges.length;
  const isMobileExpandable = badgeCount > 1; // 移动端2个以上徽章时可点击展开
  
  const containerClass = badgeCount === 1 
    ? `flex justify-center md:justify-start gap-2 ${className}` 
    : `flex flex-wrap justify-center md:justify-start gap-2 items-start ${className}`;

  const handleBadgeClick = (badgeId: number) => {
    if (isMobileExpandable) {
      setExpandedBadgeId(expandedBadgeId === badgeId ? null : badgeId);
    }
  };

  // 统一渲染徽章的函数
  const renderBadge = (badge: Badge, style: { gradient: string; textColor?: string; boxShadow?: string; border?: string; hoverShadow?: string } | null, iconUrl: string) => {
    const displayTitle = getBadgeTitle(badge.badge_code, badge.title, tBadges);
    const isExpanded = isMobileExpandable && expandedBadgeId === badge.id;

    // 移动端：1个徽章显示称号，2个以上根据展开状态；PC端：始终显示
    const showTitle = badgeCount === 1 || isExpanded;

    return (
      <div
        key={badge.id}
        style={style ? {
          background: style.gradient,
          color: style.textColor || 'white',
          boxShadow: style.boxShadow,
          border: style.border,
        } : undefined}
        className={`flex items-center gap-1.5 rounded-full
          font-medium text-sm
          hover:scale-105
          relative overflow-hidden
          ${isMobileExpandable ? 'cursor-pointer active:scale-95 md:cursor-default md:active:scale-100' : ''}
          ${!style ? 'bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100' : ''}
          transition-all duration-300 ease-in-out
          ${showTitle ? 'px-3 py-1.5' : 'p-1.5 md:px-3 md:py-1.5'}
          ${badgeClassName}`}
        onClick={() => handleBadgeClick(badge.id)}
        title={!showTitle ? displayTitle : undefined}>
        {/* 图标容器 - 移动端收起时居中，PC端始终正常 */}
        <span className={`flex items-center justify-center shrink-0
          ${showTitle ? '' : 'w-full h-full md:w-auto md:h-auto'}
        `}>
          {renderIcon(iconUrl)}
        </span>
        {/* 文字容器 - 移动端根据展开状态，PC端始终显示 */}
        <span
          className={`grid whitespace-nowrap overflow-hidden
            transition-all duration-300 ease-in-out
            ${showTitle ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'}
            md:grid-cols-[1fr] md:opacity-100`}>
          <span className="overflow-hidden">
            {displayTitle}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div className={containerClass}>
      {vipBadges.map(badge => {
        // VIP徽章
        const vipStyle = getVipBadgeStyle(badge.badge_code);
        if (vipStyle) {
          const iconUrl = vipStyle.icon || badge.icon_url;
          return renderBadge(badge, vipStyle, iconUrl);
        }

        // 默认徽章
        return renderBadge(badge, null, badge.icon_url);

        /* TODO: 暂时注释掉非VIP徽章
        const isAchievementBadge = badge.badge_type === 'USER_ACHIEVEMENT';
        const isLeaderboardBadge = badge.badge_type === 'LEADERBOARD_RANK';

        // 用户成就徽章
        if (isAchievementBadge) {
          const achievementStyle = getAchievementBadgeStyle(badge.badge_code);
          if (achievementStyle) {
            return renderBadge(badge, achievementStyle, badge.icon_url);
          }
        }

        // 榜单徽章
        if (isLeaderboardBadge) {
          const leaderboardStyle = getLeaderboardBadgeStyle(badge.badge_code);
          if (leaderboardStyle) {
            return renderBadge(badge, leaderboardStyle, badge.icon_url);
          }
        }
        */
      })}
    </div>
  );
}

