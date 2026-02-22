import { useEffect } from 'react';

/**
 * Ensure only one <video> element plays at a time across the whole document.
 * O(1) approach: remember the last playing video and pause only that one.
 * - When any video starts playing, pause the previously playing video (if any).
 * - Added with capture=true so it catches play events from native media elements.
 * - Idempotent: attaches the listener only once per page load.
 */
export const useSingleVideoPlayback = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Avoid attaching multiple times if multiple components call this hook
    const flagKey = '__augment_single_video_playback_bound__';
    if ((window as any)[flagKey]) return;
    (window as any)[flagKey] = true;

    const onPlay = (e: Event) => {
      const current = e.target as HTMLVideoElement | null;
      if (!current || current.tagName !== 'VIDEO') return;
      try {
        const currentKey = '__augment_current_playing_video__';
        const prev = (window as any)[currentKey] as HTMLVideoElement | undefined;
        if (prev && prev !== current && !prev.paused) {
          try { prev.pause(); } catch {}
        }
        (window as any)[currentKey] = current;
      } catch {}
    };

    document.addEventListener('play', onPlay, true);
    return () => {
      // We intentionally do not remove the flag to keep it idempotent for the session
      document.removeEventListener('play', onPlay, true);
    };
  }, []);
};

