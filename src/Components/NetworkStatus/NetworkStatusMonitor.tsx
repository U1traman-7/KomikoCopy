'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@nextui-org/react'
import { IoWifi, IoWifiOutline } from 'react-icons/io5'
import { onNetworkChange, isOnline, safeReload, maybeResumePendingReload } from '../../utilities/offline'

interface NetworkStatusMonitorProps {
  showIndicator?: boolean
  autoRetryOnReconnect?: boolean
}

export function NetworkStatusMonitor({ 
  showIndicator = true, 
  autoRetryOnReconnect = true 
}: NetworkStatusMonitorProps) {
  const { t } = useTranslation('common');
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 初始状态检查
    setIsOnlineState(isOnline());

    // 检查是否有待处理的重新加载
    maybeResumePendingReload();

    // 监听网络状态变化
    const cleanup = onNetworkChange(online => {
      setIsOnlineState(online);

      if (!online) {
        // 离线时显示提示
        setWasOffline(true);
      } else {
        // 如果之前是离线状态，现在恢复在线
        if (wasOffline && autoRetryOnReconnect) {
          // 延迟一点时间确保网络稳定
          setTimeout(() => {
            if (isOnline()) {
              // 使用安全重载，避免无限循环
              safeReload('Network reconnected');
            }
          }, 1500);
        }
      }
    });

    return cleanup;
  }, [autoRetryOnReconnect, wasOffline]);

  if (!showIndicator) {
    return null;
  }

  return (
    <>
      {/* 网络状态指示器 */}
      <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50'>
        <Chip
          startContent={
            isOnlineState ? (
              <IoWifi className='w-4 h-4' />
            ) : (
              <IoWifiOutline className='w-4 h-4' />
            )
          }
          color={isOnlineState ? 'success' : 'danger'}
          variant={isOnlineState ? 'flat' : 'solid'}
          size='md'
          className={`transition-all duration-300 shadow-lg ${
            isOnlineState
              ? 'opacity-0 hover:opacity-100'
              : 'opacity-100 animate-pulse'
          }`}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}>
          {isOnlineState ? t('network.online') : t('network.offline')}
        </Chip>
      </div>
    </>
  );
}

// Hook for using network status in other components
export function useNetworkStatus() {
  const [isOnlineState, setIsOnlineState] = useState(true)

  useEffect(() => {
    setIsOnlineState(isOnline())
    
    const cleanup = onNetworkChange((online) => {
      setIsOnlineState(online)
    })

    return cleanup
  }, [])

  return {
    isOnline: isOnlineState,
    safeReload: (reason?: string) => safeReload(reason)
  }
}
