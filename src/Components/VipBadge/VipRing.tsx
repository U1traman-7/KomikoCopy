import React from 'react'

interface VipRingProps {
  children: React.ReactNode
  plan?: string
  intensity?: 'light' | 'medium' | 'strong'
  borderStyle?: 'full' | 'top-only' // 新增：控制边框样式
}

const VipRing: React.FC<VipRingProps> = ({
  children,
  plan = 'Free',
  intensity = 'medium',
  borderStyle = 'full',
}) => {
  // 如果是免费用户，直接返回子组件
  if (plan === 'Free') {
    return <>{children}</>
  }

  // 根据plan获取边框和背景配置，每个等级都有独特的色彩特征
  const getPlanStyles = () => {
    switch (plan) {
      case 'Starter':
        return {
          // 清新蓝绿色系：天蓝→青色→薄荷绿→海蓝
          borderGradient:
            'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981, #0891b2)',
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
        }
      case 'Plus':
        return {
          // 神秘紫色系：深紫→品红→紫红→蓝紫
          borderGradient:
            'linear-gradient(135deg, #7c3aed, #c026d3, #e11d48, #8b5cf6)',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
        }
      case 'Premium':
        return {
          // 豪华金橙色系：橙色→金色→黄色→琥珀色
          borderGradient:
            'linear-gradient(135deg, #f97316, #f59e0b, #eab308, #d97706)',
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
        }
      case 'Enterprise':
        return {
          // 高级银灰色系：银色→白金→珍珠白→钛金
          borderGradient:
            'linear-gradient(135deg, #94a3b8, #e2e8f0, #f8fafc, #cbd5e1)',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
        }
      case 'CPP':
        return {
          // CCP使用Plus样式：神秘紫色系→深紫→品红→紫红→蓝紫
          borderGradient:
            'linear-gradient(135deg, #7c3aed, #c026d3, #e11d48, #8b5cf6)',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
        }
      default:
        return null
    }
  }

  const planStyles = getPlanStyles()
  if (!planStyles) return <>{children}</>

  // 根据intensity调整效果强度
  const intensityMultiplier =
    intensity === 'light' ? 0.6 : intensity === 'strong' ? 1.4 : 1

  // 调整背景透明度
  const adjustedBackground = planStyles.backgroundColor.replace(
    /rgba\((\d+,\s*\d+,\s*\d+),\s*([\d.]+)\)/g,
    (_, rgb, alpha) =>
      `rgba(${rgb}, ${parseFloat(alpha) * intensityMultiplier})`,
  )

  return (
    <>
      <style jsx>{`
        .vip-ring-container {
          position: relative;
          padding: 3px;
          background: ${planStyles.borderGradient};
          transition: all 0.3s ease;
        }
      `}</style>

      <div className='relative group hover:shadow-lg hover:rounded-xl'>
        {/* 渐变边框容器 */}
        <div
          className={`vip-ring-container ${borderStyle === 'top-only' ? 'rounded-t-xl' : 'rounded-xl'}`}>
          {/* 内容容器 */}
          <div
            className={`relative z-10 overflow-hidden ${borderStyle === 'top-only' ? 'rounded-t-xl' : 'rounded-xl'}`}
            style={{
              backgroundColor: adjustedBackground,
            }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default VipRing
