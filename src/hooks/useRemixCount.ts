import { useCallback, useEffect, useRef, useState } from 'react';

const remixCountCache = new Map<number, number>();
const remixCountLoading = new Set<number>();
const remixCountSubscribers = new Map<number, Set<(count: number) => void>>();

const publishRemixCount = (postId: number, nextCount: number) => {
  remixCountCache.set(postId, nextCount);
  const listeners = remixCountSubscribers.get(postId);
  if (listeners) {
    listeners.forEach(listener => listener(nextCount));
  }
};

type UseRemixCountOptions = {
  postId: number;
  enabled?: boolean;
  fetchOnView?: boolean;
};

export const useRemixCount = ({
  postId,
  enabled = true,
  fetchOnView = true,
}: UseRemixCountOptions) => {
  const remixButtonRef = useRef<HTMLDivElement | null>(null);
  const [remixCount, setRemixCount] = useState<number>(
    () => remixCountCache.get(postId) ?? 0,
  );

  const updateRemixCount = useCallback(
    (nextCount: number) => {
      publishRemixCount(postId, nextCount);
    },
    [postId],
  );

  useEffect(() => {
    setRemixCount(remixCountCache.get(postId) ?? 0);
    let listeners = remixCountSubscribers.get(postId);
    if (!listeners) {
      listeners = new Set();
      remixCountSubscribers.set(postId, listeners);
    }
    listeners.add(setRemixCount);
    return () => {
      const activeListeners = remixCountSubscribers.get(postId);
      if (!activeListeners) {
        return;
      }
      activeListeners.delete(setRemixCount);
      if (activeListeners.size === 0) {
        remixCountSubscribers.delete(postId);
      }
    };
  }, [postId]);

  useEffect(() => {
    if (!enabled || !fetchOnView) {
      return;
    }
    if (remixCountCache.has(postId)) {
      setRemixCount(remixCountCache.get(postId) ?? 0);
      return;
    }

    const node = remixButtonRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const loadRemixCount = async () => {
      if (remixCountCache.has(postId) || remixCountLoading.has(postId)) {
        return;
      }
      remixCountLoading.add(postId);
      try {
        const resp = await fetch(`/api/post/remixCount?post_id=${postId}`);
        const data = await resp.json().catch(() => null);
        if (!resp.ok || data?.code !== 1) {
          return;
        }
        const nextCount = data?.data?.remix_count ?? data?.remix_count;
        if (typeof nextCount === 'number') {
          const cachedCount = remixCountCache.get(postId);
          if (typeof cachedCount === 'number' && cachedCount > nextCount) {
            return;
          }
          publishRemixCount(postId, nextCount);
        }
      } catch (e) {
        // ignore fetch failures, keep default display
      } finally {
        remixCountLoading.delete(postId);
      }
    };

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          void loadRemixCount();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [enabled, fetchOnView, postId]);

  const incrementRemixCount = useCallback(async () => {
    if (!enabled) {
      return;
    }
    const previousCount = remixCountCache.get(postId) ?? 0;
    updateRemixCount(previousCount + 1);
    try {
      const resp = await fetch('/api/post/remixCount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || data?.code !== 1) {
        updateRemixCount(previousCount);
        return;
      }
      const nextCount = data?.data?.remix_count ?? data?.remix_count;
      if (typeof nextCount === 'number') {
        updateRemixCount(nextCount);
      }
    } catch (e) {
      updateRemixCount(previousCount);
    }
  }, [enabled, postId, updateRemixCount]);

  return {
    remixCount,
    remixButtonRef,
    incrementRemixCount,
  };
};
