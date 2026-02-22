import { useState, useCallback, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

const DEFAULT_MAX_ITEMS = 20;
const DEFAULT_STORAGE_KEY = 'komiko_search_history';

interface UseSearchHistoryOptions {
  maxItems?: number;
  storageKey?: string;
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { maxItems = DEFAULT_MAX_ITEMS, storageKey = DEFAULT_STORAGE_KEY } =
    options;

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 加载搜索历史
  const loadHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, [storageKey]);

  // 保存搜索历史
  const saveHistory = useCallback(
    (query: string) => {
      if (typeof window === 'undefined' || !query.trim()) return;
      try {
        const trimmedQuery = query.trim();
        setHistory(prev => {
          const filtered = prev.filter(
            item => item.query.toLowerCase() !== trimmedQuery.toLowerCase(),
          );
          const newHistory: SearchHistoryItem[] = [
            { query: trimmedQuery, timestamp: Date.now() },
            ...filtered,
          ].slice(0, maxItems);
          localStorage.setItem(storageKey, JSON.stringify(newHistory));
          return newHistory;
        });
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    },
    [maxItems, storageKey],
  );

  // 删除单个搜索历史
  const removeHistory = useCallback(
    (query: string) => {
      if (typeof window === 'undefined') return;
      try {
        setHistory(prev => {
          const newHistory = prev.filter(item => item.query !== query);
          localStorage.setItem(storageKey, JSON.stringify(newHistory));
          return newHistory;
        });
      } catch (error) {
        console.error('Error removing search history:', error);
      }
    },
    [storageKey],
  );

  // 清空搜索历史
  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(storageKey);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [storageKey]);

  // 初始加载
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    saveHistory,
    removeHistory,
    clearHistory,
  };
}
