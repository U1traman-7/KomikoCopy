import React from 'react';
import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import cn from 'classnames';

/**
 * 面包屑项目定义
 */
export interface BreadcrumbItem {
  /** 显示文本 */
  label: string;
  /** 链接路径（最后一项通常不需要链接） */
  href?: string;
  /** 图标组件 */
  icon?: React.ReactNode;
}

/**
 * 面包屑组件 Props
 */
export interface BreadcrumbProps {
  /** 面包屑项目列表 */
  items: BreadcrumbItem[];
  /** 自定义类名 */
  className?: string;
  /** 是否显示首页图标 */
  showHomeIcon?: boolean;
  /** 分隔符自定义 */
  separator?: React.ReactNode;
}

/**
 * 面包屑导航组件
 *
 * 用于显示页面层级关系，帮助用户了解当前位置并支持快速导航
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Effects', href: '/effects' },
 *     { label: 'Anime MV' }
 *   ]}
 * />
 * ```
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  showHomeIcon = false,
  separator,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const defaultSeparator = (
    <FiChevronRight
      className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0'
      aria-hidden='true'
    />
  );

  const renderSeparator = separator || defaultSeparator;

  return (
    <nav
      aria-label='Breadcrumb'
      className={cn('flex items-center', className)}>
      <ol className='flex items-center flex-wrap gap-1 text-sm'>
        {/* 可选的首页图标 */}
        {showHomeIcon && (
          <>
            <li className='flex items-center'>
              <Link
                href='/'
                className='flex items-center text-muted-foreground hover:text-primary-600 transition-colors'>
                <FiHome className='h-4 w-4' aria-hidden='true' />
                <span className='sr-only'>Home</span>
              </Link>
            </li>
            <li
              className='flex items-center mx-1'
              role='presentation'
              aria-hidden='true'>
              {renderSeparator}
            </li>
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const hasLink = !!item.href && !isLast;

          return (
            <React.Fragment key={`breadcrumb-${index}-${item.label}`}>
              <li className='flex items-center'>
                {hasLink ? (
                  <Link
                    href={item.href!}
                    className='flex items-center gap-1.5 text-muted-foreground hover:text-primary-600 transition-colors font-medium'>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      isLast
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground font-medium',
                    )}
                    aria-current={isLast ? 'page' : undefined}>
                    {item.icon}
                    <span className={isLast ? 'truncate max-w-[200px]' : ''}>
                      {item.label}
                    </span>
                  </span>
                )}
              </li>

              {/* 分隔符（最后一项不显示） */}
              {!isLast && (
                <li
                  className='flex items-center mx-1'
                  role='presentation'
                  aria-hidden='true'>
                  {renderSeparator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * 预设的 Effects 面包屑
 * 用于特效相关页面的快速使用
 */
export const EffectsBreadcrumb: React.FC<{
  /** 当前特效名称 */
  effectName?: string;
  /** 自定义类名 */
  className?: string;
}> = ({ effectName, className }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Effects', href: '/effects' },
    ...(effectName ? [{ label: effectName }] : []),
  ];

  return <Breadcrumb items={items} className={className} />;
};

export default Breadcrumb;
