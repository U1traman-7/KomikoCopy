import React from 'react';
import { Button } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

interface CookieConsentBannerProps {
  isVisible: boolean;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Cookie 隐私同意横幅
 * 显示在页面底部，用于询问用户是否同意广告数据收集
 */
export function CookieConsentBanner({
  isVisible,
  onAccept,
  onReject,
}: CookieConsentBannerProps) {
  const { t } = useTranslation('common');

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className='fixed left-0 right-0 z-50 cookie-banner-position'
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* 移动端：距离底部 60px 避开 tab bar */
        .cookie-banner-position {
          bottom: max(env(safe-area-inset-bottom, 0px), 60px);
        }

        /* 桌面端（md 及以上）：贴底显示 */
        @media (min-width: 768px) {
          .cookie-banner-position {
            bottom: 0;
          }
        }
      `}</style>
      <div className='bg-content1/95 backdrop-blur-md border-t border-divider shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            {/* 左侧文字 */}
            <div className='flex-1'>
              <p className='text-sm text-default-700'>
                🍪{' '}
                {t(
                  'ad_consent.banner_text',
                  'We use cookies and ads to support our free service. By accepting, you allow us to collect data for personalized ads.',
                )}{' '}
                <a
                  href='/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary underline hover:text-primary-600 transition-colors'>
                  {t('ad_consent.learn_more', 'Learn more')}
                </a>
              </p>
            </div>

            {/* 右侧按钮 */}
            <div className='flex items-center gap-3 flex-shrink-0'>
              <Button
                size='sm'
                variant='flat'
                color='default'
                onPress={onReject}
                className='min-w-20'>
                {t('ad_consent.reject', 'Decline')}
              </Button>
              <Button
                size='sm'
                color='primary'
                onPress={onAccept}
                className='min-w-20'>
                {t('ad_consent.accept', 'Accept')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
