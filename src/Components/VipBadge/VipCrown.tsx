import React from 'react'
import { FaCrown } from 'react-icons/fa'
import cn from 'classnames'

export interface VipCrownProps {
  plan: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 根据VIP边框颜色定义，与VipRing保持一致
const getPlanStyles = (plan: string) => {
  switch (plan?.toLowerCase()) {
    case 'starter':
      return {
        crownColor: 'text-blue-500', // 蓝色，与Starter边框渐变主色调一致
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
      }
    case 'plus':
      return {
        crownColor: 'text-indigo-600', // 靛蓝色，与Plus边框渐变主色调一致
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
      }
    case 'premium':
      return {
        crownColor: 'text-yellow-500', // 金色，与Premium边框渐变主色调一致
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
      }
    case 'enterprise':
      return {
        crownColor: 'text-blue-800', // 深蓝色，与Enterprise边框渐变主色调一致
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
      }
    default:
      return null
  }
}

const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'w-3 h-3'
    case 'md':
      return 'w-4 h-4'
    case 'lg':
      return 'w-5 h-5'
    default:
      return 'w-4 h-4'
  }
}

export const VipCrown: React.FC<VipCrownProps> = ({
  plan,
  size = 'md',
  className,
}) => {
  const styles = getPlanStyles(plan)

  if (!styles || plan === 'Free' || !plan) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center',
        'transform translate-x-1/2 -translate-y-1/2',
        className,
      )}>
      <FaCrown className={cn(getSizeClass(size), styles.crownColor)} />
    </div>
  )
}

// 内联皇冠组件，用于显示在用户名后面
export const VipCrownInline: React.FC<VipCrownProps> = ({
  plan,
  size = 'sm',
  className,
}) => {
  const styles = getPlanStyles(plan)

  if (!styles || plan === 'Free' || !plan) {
    return null
  }

  return (
    <FaCrown
      className={cn(getSizeClass(size), styles.crownColor, 'ml-1', className)}
    />
  )
}
