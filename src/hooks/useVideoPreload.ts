import { useEffect, useState, RefObject } from 'react';

const getRootMargin = () => {
  if (typeof window === 'undefined') return '100px';
  return window.innerWidth < 768 ? '100px' : '200px';
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const useVideoPreload = (videoRef: RefObject<HTMLVideoElement>): boolean => {
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    if (isSafari()) {
      // Safari 需要至少 metadata 才能显示第一帧
      setShouldPreload(true);
      return;
    }

    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setShouldPreload(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: getRootMargin(),
        threshold: 0,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [videoRef]);

  return shouldPreload;
};
