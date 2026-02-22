import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// localStorage key 格式: favorite-style-ids-{userId}
const STORAGE_KEY_PREFIX = 'favorite-style-ids-';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

// 从 localStorage 读取收藏的 styleId 列表
function loadFromStorage(userId: string): string[] {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

// 保存到 localStorage
function saveToStorage(userId: string, styleIds: string[]): void {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(styleIds));
  } catch {
    // localStorage 可能满或不可用，静默忽略
  }
}

// API helpers
async function fetchFavoriteStylesAPI(): Promise<string[]> {
  const res = await fetch('/api/favoriteStyles', { credentials: 'include' });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Failed to fetch favorites');
  const data = await res.json();
  return (data.favorites || []).map((f: { style_id: string }) => f.style_id);
}

async function addFavoriteStyleAPI(styleId: string): Promise<void> {
  const res = await fetch('/api/favoriteStyles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ styleId }),
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('login_required');
  if (res.status === 409) return; // 已经收藏了，静默忽略
  if (!res.ok) throw new Error('Failed to add favorite');
}

async function removeFavoriteStyleAPI(styleId: string): Promise<void> {
  const res = await fetch('/api/favoriteStyles', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ styleId }),
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('login_required');
  if (!res.ok) throw new Error('Failed to remove favorite');
}

interface UseFavoriteStylesOptions {
  userId?: string | null;
  onLoginRequired?: () => void;
}

export function useFavoriteStyles({ userId, onLoginRequired }: UseFavoriteStylesOptions = {}) {
  const { t } = useTranslation('create');
  const [favoriteStyleIds, setFavoriteStyleIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [togglingStyleId, setTogglingStyleId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // 初始化: 从 localStorage 加载，然后从 API 同步
  const loadFavorites = useCallback(async () => {
    // 先从 localStorage 快速加载
    if (userId) {
      const cached = loadFromStorage(userId);
      if (cached.length > 0) {
        setFavoriteStyleIds(new Set(cached));
      }
    }

    // 然后从 API 获取最新数据
    setIsLoading(true);
    try {
      const serverIds = await fetchFavoriteStylesAPI();
      const newSet = new Set(serverIds);
      setFavoriteStyleIds(newSet);
      // 更新 localStorage
      if (userId) {
        saveToStorage(userId, serverIds);
      }
    } catch (e) {
      console.error('Failed to fetch favorite styles', e);
      // API 失败时保持 localStorage 的缓存数据
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 只加载一次
  const loadOnce = useCallback(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadFavorites();
  }, [loadFavorites]);

  // 检查是否已收藏
  const isFavorite = useCallback(
    (styleId: string): boolean => {
      return favoriteStyleIds.has(styleId);
    },
    [favoriteStyleIds],
  );

  // 切换收藏状态（乐观更新）
  const toggleFavorite = useCallback(
    async (styleId: string) => {
      if (!userId) {
        if (onLoginRequired) {
          onLoginRequired();
        } else {
          toast.error(t('login_required') || 'Please log in to save favorites', {
            position: 'top-center',
          });
        }
        return;
      }
      if (togglingStyleId) return; // 防止并发操作
      setTogglingStyleId(styleId);

      const wasAlreadyFavorite = favoriteStyleIds.has(styleId);

      // 乐观更新 UI
      setFavoriteStyleIds(prev => {
        const next = new Set(prev);
        if (wasAlreadyFavorite) {
          next.delete(styleId);
        } else {
          next.add(styleId);
        }
        // 同步更新 localStorage
        if (userId) {
          saveToStorage(userId, Array.from(next));
        }
        return next;
      });

      try {
        if (wasAlreadyFavorite) {
          await removeFavoriteStyleAPI(styleId);
          toast.success(t('favorite_removed') || 'Removed from favorites', {
            position: 'top-center',
          });
        } else {
          await addFavoriteStyleAPI(styleId);
          toast.success(t('favorite_added') || 'Added to favorites', {
            position: 'top-center',
          });
        }
      } catch (e: any) {
        // 回滚乐观更新
        setFavoriteStyleIds(prev => {
          const next = new Set(prev);
          if (wasAlreadyFavorite) {
            next.add(styleId);
          } else {
            next.delete(styleId);
          }
          if (userId) {
            saveToStorage(userId, Array.from(next));
          }
          return next;
        });

        if (e.message === 'login_required') {
          if (onLoginRequired) {
            onLoginRequired();
          } else {
            toast.error(
              t('login_required') || 'Please log in to save favorites',
              { position: 'top-center' },
            );
          }
        } else {
          toast.error(
            t('favorite_toggle_failed') || 'Failed to update favorite',
            { position: 'top-center' },
          );
        }
      } finally {
        setTogglingStyleId(null);
      }
    },
    [favoriteStyleIds, togglingStyleId, userId, t, onLoginRequired],
  );

  return {
    favoriteStyleIds,
    isLoading,
    togglingStyleId,
    loadOnce,
    isFavorite,
    toggleFavorite,
  };
}
