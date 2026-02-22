import { useState, useEffect } from 'react';

export interface BrowserInfo {
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isClient: boolean;
}

const detectSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  
  const isSafari = /Safari/.test(userAgent) && 
                   !/Chrome|Chromium|OPR|Edge|EdgA|CriOS|FxiOS/.test(userAgent);
  
  return isSafari;
};

export const useBrowserDetection = (): BrowserInfo => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isClient: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      
      setBrowserInfo({
        isSafari: detectSafari(),
        isChrome: /chrome/i.test(userAgent) && !/edge/i.test(userAgent),
        isFirefox: /firefox/i.test(userAgent),
        isClient: true,
      });
    }
  }, []);

  return browserInfo;
};

// 轻量级工具函数，用于不需要响应式更新的场景
export const detectBrowser = (): BrowserInfo => {
  if (typeof window === 'undefined') {
    return {
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isClient: false,
    };
  }

  const userAgent = navigator.userAgent;
  
  return {
    isSafari: detectSafari(),
    isChrome: /chrome/i.test(userAgent) && !/edge/i.test(userAgent),
    isFirefox: /firefox/i.test(userAgent),
    isClient: true,
  };
};

// 简化的 Safari 检测函数
export const isSafariBrowser = (): boolean => {
  return detectSafari();
}; 