import React, { useState, useRef, useEffect } from 'react';
import { useBrowserDetection } from '@/hooks/useBrowserDetection';

export interface LazyVideoProps {
  src: string;
  className?: string;
  label?: string;
  controls?: boolean;
  playsInline?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  // When true, detach src while offscreen to free memory
  releaseOffscreen?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  className = '',
  label = '',
  controls = true,
  playsInline = true,
  muted = true,
  loop = true,
  autoPlay = false,
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  releaseOffscreen = false,
  crossOrigin,
}) => {
  const { isSafari } = useBrowserDetection();
  const [hasAppeared, setHasAppeared] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const srcDetachedRef = useRef(false);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAppeared(true);
          setIsIntersecting(true);
        } else {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Force Safari to decode the first frame once metadata is available
  useEffect(() => {
    if (!hasAppeared) return;
    const el = videoElRef.current;
    if (!el) return;

    const handleLoadedMetadata = () => {
      try {
        // Nudge to a non-zero time to force a frame decode
        if (el.currentTime === 0) {
          el.currentTime = 0.001;
        }
        // Ensure muted for any potential autoplay attempts
        el.muted = true;
        el.defaultMuted = true;
        // Pause to keep it as a poster frame
        el.pause();
      } catch {}
    };

    el.addEventListener('loadedmetadata', handleLoadedMetadata);
    // In case metadata already loaded
    if (el.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      el.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [hasAppeared]);

  // Release decoder/GPU memory while offscreen by detaching src and reattaching on re-entry
  useEffect(() => {
    if (!hasAppeared || !releaseOffscreen) return;
    const el = videoElRef.current;
    if (!el) return;

    if (!isIntersecting && !srcDetachedRef.current) {
      try {
        el.pause();
        el.removeAttribute('src');
        el.load();
        srcDetachedRef.current = true;
      } catch {}
    } else if (isIntersecting && srcDetachedRef.current) {
      try {
        el.src = `${src}#t=0.001`;
        srcDetachedRef.current = false;
      } catch {}
    }
  }, [isIntersecting, hasAppeared, releaseOffscreen, src]);

  // Safari poster fallback: briefly play muted then pause to force first-frame render
  useEffect(() => {
    if (!hasAppeared) return;
    const el = videoElRef.current;
    if (!el) return;

    let cancelled = false;
    const tryPlayPause = async () => {
      try {
        // Only attempt if not already displaying current frame
        el.muted = true;
        el.defaultMuted = true;
        const playPromise = el.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }
        if (!cancelled) {
          // Give the decoder a tick
          setTimeout(() => {
            try {
              el.pause();
            } catch {}
          }, 50);
        }
      } catch {
        // ignore - autoplay may still be blocked; the metadata seek above may be enough
      }
    };

    const onLoadedData = () => {
      tryPlayPause();
    };
    const onCanPlay = () => {
      tryPlayPause();
    };
    el.addEventListener('loadeddata', onLoadedData);
    el.addEventListener('canplay', onCanPlay);

    return () => {
      cancelled = true;
      el.removeEventListener('loadeddata', onLoadedData);
      el.removeEventListener('canplay', onCanPlay);
    };
  }, [hasAppeared]);

  const defaultPlaceholder = (
    <div className='w-full h-full bg-muted flex items-center justify-center rounded-lg'>
      <div className='text-muted-foreground text-sm'>Loading video...</div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className='w-full h-full flex items-center justify-center will-change-auto'>
      {!hasAppeared ? (
        placeholder || defaultPlaceholder
      ) : (
        <video
          ref={videoElRef}
          src={`${src}#t=0.001`}
          controls={controls}
          playsInline={playsInline}
          loop={loop}
          muted={muted}
          autoPlay={autoPlay}
          preload='metadata'
          {...(crossOrigin ? { crossOrigin } : {})}
          aria-label={label}
          className={className}
        />
      )}
    </div>
  );
};

export default LazyVideo;
