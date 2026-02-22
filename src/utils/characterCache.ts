/**
 * Character API Response Cache Utility
 * 
 * Caches character API responses to localStorage to reduce network requests
 * and improve perceived performance when switching between character collections.
 */

interface CachedCharacterData {
  characters: any[];
  timestamp: number;
  collection: string;
}

const CACHE_PREFIX = 'komiko_char_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (longer than in-memory cache)

/**
 * Generate cache key for a collection
 */
function getCacheKey(collection: string): string {
  return `${CACHE_PREFIX}${collection}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedData: CachedCharacterData): boolean {
  return Date.now() - cachedData.timestamp < CACHE_TTL;
}

/**
 * Get cached characters for a collection
 */
export function getCachedCharacters(collection: string): any[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cacheKey = getCacheKey(collection);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const cachedData: CachedCharacterData = JSON.parse(cached);
    
    if (!isCacheValid(cachedData)) {
      // Remove expired cache
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.characters;
  } catch (error) {
    console.error('Error reading character cache:', error);
    return null;
  }
}

/**
 * Cache characters for a collection
 */
export function setCachedCharacters(collection: string, characters: any[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cacheKey = getCacheKey(collection);
    const cachedData: CachedCharacterData = {
      characters,
      timestamp: Date.now(),
      collection,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error writing character cache:', error);
    // If localStorage is full, try to clear old caches
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearOldCaches();
      // Try again after clearing
      try {
        const cacheKey = getCacheKey(collection);
        const cachedData: CachedCharacterData = {
          characters,
          timestamp: Date.now(),
          collection,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      } catch (retryError) {
        console.error('Failed to cache after clearing old data:', retryError);
      }
    }
  }
}

/**
 * Clear cache for a specific collection
 */
export function clearCharacterCache(collection?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (collection) {
      const cacheKey = getCacheKey(collection);
      localStorage.removeItem(cacheKey);
    } else {
      // Clear all character caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing character cache:', error);
  }
}

/**
 * Clear old/expired caches to free up space
 */
function clearOldCaches(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cachedData: CachedCharacterData = JSON.parse(cached);
            if (now - cachedData.timestamp >= CACHE_TTL) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old caches:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  totalCaches: number;
  validCaches: number;
  expiredCaches: number;
  totalSize: number;
} {
  if (typeof window === 'undefined') {
    return { totalCaches: 0, validCaches: 0, expiredCaches: 0, totalSize: 0 };
  }

  const keys = Object.keys(localStorage);
  const now = Date.now();
  let totalCaches = 0;
  let validCaches = 0;
  let expiredCaches = 0;
  let totalSize = 0;

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      totalCaches++;
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const cachedData: CachedCharacterData = JSON.parse(cached);
          if (now - cachedData.timestamp < CACHE_TTL) {
            validCaches++;
          } else {
            expiredCaches++;
          }
        }
      } catch (error) {
        expiredCaches++;
      }
    }
  });

  return { totalCaches, validCaches, expiredCaches, totalSize };
}

