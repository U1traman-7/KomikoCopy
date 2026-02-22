import React from 'react';
import { Avatar, AvatarProps } from '@nextui-org/react';
import { VipCrown } from './VipCrown';
import cn from 'classnames';
import { FaCrown } from 'react-icons/fa';

// VIP边框样式配置，每个等级都有独特的色彩特征
const getVipBorderStyles = (plan: string) => {
  switch (plan) {
    case 'Starter':
      return {
        // 清新蓝绿色系：天蓝→青色→薄荷绿→海蓝
        gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981, #0891b2)',
      };
    case 'Plus':
      return {
        // 神秘紫色系：深紫→品红→紫红→蓝紫
        gradient: 'linear-gradient(135deg, #7c3aed, #c026d3, #e11d48, #8b5cf6)',
      };
    case 'Premium':
      return {
        // 豪华金橙色系：橙色→金色→黄色→琥珀色
        gradient: 'linear-gradient(135deg, #f97316, #f59e0b, #eab308, #d97706)',
      };
    case 'Enterprise':
      return {
        // 高级银灰色系：银色→白金→珍珠白→钛金
        gradient: 'linear-gradient(135deg, #94a3b8, #e2e8f0, #f8fafc, #cbd5e1)',
      };
    case 'CPP':
      return {
        // CPP创意伙伴：粉色→品红→紫色→蓝紫
        gradient: 'linear-gradient(135deg, #ec4899, #d946ef, #a855f7, #8b5cf6)',
      };
    default:
      return null;
  }
};

export interface VipAvatarProps extends AvatarProps {
  plan?: string;
  crownSize?: 'sm' | 'md' | 'lg';
  showCrown?: boolean;
}

export const VipAvatar: React.FC<VipAvatarProps> = ({
  plan,
  crownSize = 'md',
  showCrown = false, // 默认不显示皇冠，因为我们要把它移到名字后面
  className,
  ...avatarProps
}) => (
  <div className='relative inline-block'>
    <Avatar {...avatarProps} className={cn(className)} />
    {showCrown && plan && plan !== 'Free' && (
      <VipCrown plan={plan} size={crownSize} />
    )}
  </div>
);

// 带VIP边框的头像组件
export interface VipAvatarWithBorderProps extends AvatarProps {
  plan?: string;
  borderWidth?: number;
}

export const VipAvatarWithBorder: React.FC<VipAvatarWithBorderProps> = ({
  plan,
  borderWidth = 3,
  className,
  style,
  ...avatarProps
}) => {
  const borderStyles = getVipBorderStyles(plan || 'Free');

  // 如果是免费用户，直接返回普通头像
  if (!borderStyles || plan === 'Free') {
    return (
      <Avatar
        {...avatarProps}
        className={cn('flex-shrink-0', className)}
        style={style}
        classNames={{
          base: 'flex-shrink-0',
          img: 'object-cover !opacity-100',
          ...avatarProps.classNames,
        }}
      />
    );
  }

  return (
    <div
      className={cn('flex-shrink-0 rounded-full p-1', className)}
      style={{
        background: borderStyles.gradient,
        padding: `${borderWidth}px`,
        ...style,
      }}>
      <Avatar
        {...avatarProps}
        className='w-full h-full'
        classNames={{
          base: 'w-full h-full flex-shrink-0',
          img: 'object-cover !opacity-100',
          ...avatarProps.classNames,
        }}
      />
    </div>
  );
};

// VIP配置类型
interface VipChipConfig {
  gradient: string;
  startContent: React.ReactNode;
  label: string;
  textColor?: string;
}

// VIP等级Chip组件
export interface VipChipProps {
  plan?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VipChip: React.FC<VipChipProps> = ({
  plan,
  size = 'md',
  className,
}) => {
  // 如果是免费用户，不显示Chip
  if (!plan || plan === 'Free') {
    return null;
  }

  // 获取VIP等级的颜色和样式
  const getVipChipConfig = (plan: string): VipChipConfig | null => {
    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

    switch (plan) {
      case 'Starter':
        return {
          // 清新蓝绿色系：天蓝→青色→薄荷绿
          gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981)',
          startContent: <FaCrown size={iconSize} />,
          label: 'Starter',
        };
      case 'Plus':
        return {
          // 神秘紫色系：深紫→品红→紫红
          gradient: 'linear-gradient(135deg, #7c3aed, #c026d3, #e11d48)',
          startContent: <FaCrown size={iconSize} />,
          label: 'Plus',
        };
      case 'Premium':
        return {
          // 豪华金橙色系：橙色→金色→黄色
          gradient: 'linear-gradient(135deg, #f97316, #f59e0b, #eab308)',
          startContent: <FaCrown size={iconSize} />,
          label: 'Premium',
        };
      case 'Enterprise':
        return {
          // 高级银灰色系：银色→白金→珍珠白
          gradient: 'linear-gradient(135deg, #94a3b8, #e2e8f0, #f8fafc)',
          startContent: <FaCrown size={iconSize} />,
          label: 'Enterprise',
          textColor: '#374151', // 深灰色文字在浅色背景上
        };
      default:
        return null;
    }
  };

  const config = getVipChipConfig(plan);
  if (!config) {
    return null;
  }

  return (
    <div
      style={{
        background: config.gradient,
        borderRadius: '12px',
        padding: '6px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
        fontWeight: '500',
        color: config.textColor || 'white',
      }}
      className={cn('vip-chip', className)}>
      {config.startContent}
      {config.label}
    </div>
  );
};
