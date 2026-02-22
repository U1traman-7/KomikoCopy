import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom } from '../state';
import type { Character } from '../state';
import rawCharactersData from '../assets/characters.json';
import { normalizeCategoryToKey } from '../utils/characterNameUtils';
import { useRecentCharacters } from './useRecentCharacters';

// Cache for character data by collection
// Key format: `${collection}-${userId || 'guest'}-${offset}`
const characterCache = new Map<
  string,
  {
    characters: Character[];
    total: number;
    timestamp: number;
  }
>();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Clear cache for a specific collection or all collections
 * @param collection - Collection ID to clear, or undefined to clear all
 */
export function clearCharacterCache(collection?: string) {
  if (collection) {
    // Clear all cache entries for this collection
    const keysToDelete: string[] = [];
    characterCache.forEach((_, key) => {
      if (key.startsWith(`${collection}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => characterCache.delete(key));
  } else {
    // Clear all cache
    characterCache.clear();
  }
}

export interface UseCharactersOptions {
  collection?: string;
  userId?: string;
  includeOfficial?: boolean;
  includeUserCreated?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean; // Whether to fetch data (default: true)
}

export interface UseCharactersReturn {
  characters: Character[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Hook to fetch and manage character data based on collection type
 * Supports pagination and different collection types (popular, recent, my, adopted, or IP collection slugs)
 */
export function useCharacters(
  options: UseCharactersOptions = {},
): UseCharactersReturn {
  const {
    collection = 'popular',
    userId,
    includeOfficial = true,
    includeUserCreated = true,
    limit = 50,
    offset: initialOffset = 0,
    enabled = true, // Default to enabled
  } = options;

  const isAuth = useAtomValue(authAtom);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialOffset);
  const isFetchingRef = useRef(false);

  const { recentCharacters } = useRecentCharacters(limit);

  const fetchCharacters = useCallback(
    async (currentOffset: number = 0, append: boolean = false) => {
      // Prevent duplicate requests
      if (isFetchingRef.current) {
        return;
      }

      // Check auth requirements for certain collections
      if (['recent', 'my', 'adopted'].includes(collection) && !isAuth) {
        setCharacters([]);
        setHasMore(false);
        return;
      }

      // For 'recent' collection, use localStorage-based recent characters
      if (collection === 'recent') {
        isFetchingRef.current = false;
        setLoading(false);
        return;
      }

      // Check cache first (only for initial load, not for pagination)
      if (currentOffset === 0 && !append) {
        const cacheKey = `${collection}-${userId || 'guest'}-0`;
        const cached = characterCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setCharacters(cached.characters);
          setHasMore(cached.characters.length < cached.total);
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        let endpoint = '';
        let queryParams = new URLSearchParams();

        // Build endpoint and query params based on collection type
        switch (collection) {
          case 'all':
            // All characters (sorted by name to show all including new ones)
            endpoint = '/api/characters';
            queryParams.append('sort', 'name');
            // All collection should only show official characters
            queryParams.append('official', 'true');
            queryParams.append('limit', limit.toString());
            queryParams.append('offset', currentOffset.toString());
            break;

          case 'popular':
            endpoint = '/api/characters';
            queryParams.append('sort', 'popular');
            // Popular should only show official characters
            queryParams.append('official', 'true');
            queryParams.append('limit', limit.toString());
            queryParams.append('offset', currentOffset.toString());
            break;

          case 'my':
            endpoint = '/api/getOwnedCharacters';
            // This endpoint returns all owned AND collected characters, we'll filter for owned only
            break;

          case 'adopted':
            endpoint = '/api/getCollectedCharacters';
            // This endpoint returns all collected characters, no pagination
            break;

          default:
            if (
              !['all', 'popular', 'recent', 'my', 'adopted'].includes(
                collection,
              )
            ) {
              endpoint = '/api/characters';
              queryParams.append('ip_collection', collection);
              queryParams.append('sort', 'popular'); // Sort by num_gen
              queryParams.append('official', 'true'); // Only get official characters
              queryParams.append('limit', limit.toString());
              queryParams.append('offset', currentOffset.toString());
            } else {
              // Default to all official characters
              endpoint = '/api/characters';
              queryParams.append('sort', 'popular');
              queryParams.append('official', 'true');
              queryParams.append('limit', limit.toString());
              queryParams.append('offset', currentOffset.toString());
            }
        }

        const url = queryParams.toString()
          ? `${endpoint}?${queryParams.toString()}`
          : endpoint;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Handle different response formats
        let fetchedCharacters: Character[] = [];
        let total = 0;

        if (Array.isArray(data)) {
          // Direct array response (e.g., from getOwnedCharacters)
          fetchedCharacters = data;
          total = data.length;
        } else if (data.data) {
          // Response wrapped in data property (standard API format)
          if (Array.isArray(data.data)) {
            fetchedCharacters = data.data;
            total = data.total || fetchedCharacters.length;
          } else if (data.data.characters) {
            // Paginated response with metadata
            fetchedCharacters = data.data.characters;
            total = data.data.total || fetchedCharacters.length;
          }
        } else if (data.characters) {
          // Paginated response with metadata (direct response from success())
          fetchedCharacters = data.characters;
          total = data.total || fetchedCharacters.length;
        }

        // Filter for 'my' collection: only show owned characters (not collected)
        if (collection === 'my') {
          fetchedCharacters = fetchedCharacters.filter(
            (char: any) => char.is_owned === true,
          );
        }

        // Merge with static data: prefer local images, keep API stats
        const isIpCollection = ![
          'all',
          'popular',
          'recent',
          'my',
          'adopted',
        ].includes(collection);
        if (
          isIpCollection ||
          collection === 'popular' ||
          collection === 'all'
        ) {
          const ipSlug = isIpCollection ? collection : null;

          let matchingStaticWorlds: any[] = [];

          if (ipSlug) {
            // For specific IP collection, find matching world in static data
            const staticWorld = rawCharactersData.find(
              (world: any) => normalizeCategoryToKey(world.world) === ipSlug,
            );
            if (staticWorld) {
              matchingStaticWorlds = [staticWorld];
            }
          }

          if (matchingStaticWorlds.length > 0) {
            // Create map of static characters with local images
            const staticMap = new Map<string, any>();
            matchingStaticWorlds.forEach((world: any) => {
              (world.characters || []).forEach((char: any) => {
                const normalizedName = (char.simple_name || char.name)
                  .toLowerCase()
                  .replace(/[\s:\-!?.,'"()_]/g, '');

                if (char.image && char.image.startsWith('/images/')) {
                  staticMap.set(normalizedName, {
                    image: char.image,
                    alt_prompt: char.name,
                  });
                }
              });
            });

            // Merge: use local image if available, otherwise use character_pfp
            fetchedCharacters = fetchedCharacters.map((dbChar: any) => {
              const normalizedName = (dbChar.character_name || '')
                .toLowerCase()
                .replace(/[\s:\-!?.,'"()_]/g, '');

              const staticData = staticMap.get(normalizedName);

              if (staticData?.image) {
                // Use local image from static data
                return {
                  ...dbChar,
                  image: staticData.image,
                  character_pfp: staticData.image, // Override with local
                  alt_prompt: staticData.alt_prompt || dbChar.alt_prompt,
                };
              } else {
                // Use Supabase URL from API
                return {
                  ...dbChar,
                  image: dbChar.character_pfp,
                };
              }
            });
          } else {
            // No static data, just copy character_pfp to image
            fetchedCharacters = fetchedCharacters.map((char: any) => ({
              ...char,
              image: char.character_pfp,
            }));
          }
        } else {
          // For non-IP collections, just copy character_pfp to image
          fetchedCharacters = fetchedCharacters.map((char: any) => ({
            ...char,
            image: char.character_pfp,
          }));
        }

        // Update characters list
        if (append) {
          setCharacters(prev => [...prev, ...fetchedCharacters]);
        } else {
          setCharacters(fetchedCharacters);

          // Cache the data (only for initial load)
          if (currentOffset === 0) {
            const cacheKey = `${collection}-${userId || 'guest'}-0`;
            characterCache.set(cacheKey, {
              characters: fetchedCharacters,
              total,
              timestamp: Date.now(),
            });
          }
        }

        // Determine if there are more characters to load
        const newHasMore =
          fetchedCharacters.length === limit &&
          currentOffset + fetchedCharacters.length < total;
        setHasMore(newHasMore);
      } catch (err) {
        console.error('Failed to fetch characters:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch characters'),
        );
        setCharacters([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [collection, isAuth, userId, includeOfficial, limit],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }

    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchCharacters(newOffset, true);
  }, [hasMore, loading, offset, limit, fetchCharacters]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchCharacters(0, false);
  }, [fetchCharacters]);

  // Initial fetch (skip for 'recent' collection as it's handled separately)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (collection === 'recent') {
      return;
    }
    // Clear everything when collection changes
    clearCharacterCache(collection);
    setCharacters([]); // Clear old characters immediately
    setOffset(0);
    setHasMore(true);

    // Force refetch even if already fetching
    isFetchingRef.current = false;
    fetchCharacters(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, isAuth, userId, includeOfficial, enabled]);

  // Clear characters when auth changes
  useEffect(() => {
    if (!isAuth && ['recent', 'my', 'adopted'].includes(collection)) {
      setCharacters([]);
      setHasMore(false);
    }
  }, [isAuth, collection]);

  useEffect(() => {
    if (collection === 'recent') {
      setCharacters(recentCharacters);
      setLoading(false);
      setHasMore(false);
      setOffset(0);
    }
  }, [collection, recentCharacters]);

  return {
    characters,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}
