import { useState, useCallback, useRef, useMemo } from 'react';
import { useOwnedCharacters } from './useOwnedCharacters';

export interface Character {
  character_uniqid: string;
  character_name: string;
  character_pfp: string;
  alt_prompt?: string;
  is_collected?: boolean;
  is_owned?: boolean;
  num_collected?: number;
}

interface SearchCache {
  [query: string]: {
    characters: Character[];
    timestamp: number;
  };
}

interface UseCharacterSearchOptions {
  isAuth: boolean;
  minSearchLength?: number; // Minimum characters before triggering API search
  cacheTimeout?: number; // Cache timeout in milliseconds
}

interface UseCharacterSearchReturn {
  searchCharacters: (query: string) => Promise<Character[]>;
  loading: boolean;
  error: Error | null;
  clearCache: () => void;
}

/**
 * Hook for searching characters with caching
 * - For queries < minSearchLength: returns owned/collected characters only
 * - For queries >= minSearchLength: searches via API and caches results
 */
export function useCharacterSearch({
  isAuth,
  minSearchLength = 2,
  cacheTimeout = 5 * 60 * 1000, // 5 minutes default
}: UseCharacterSearchOptions): UseCharacterSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get owned/collected characters
  const { characters: ownedCharacters } = useOwnedCharacters();
  
  // Cache for search results
  const cacheRef = useRef<SearchCache>({});
  
  // Pre-compute lowercase versions of owned characters for faster filtering
  const ownedCharactersSearchable = useMemo(() => {
    return ownedCharacters.map(char => ({
      ...char,
      _searchName: char.character_name?.toLowerCase() || '',
      _searchId: char.character_uniqid?.toLowerCase() || '',
    }));
  }, [ownedCharacters]);

  /**
   * Clear expired cache entries
   */
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > cacheTimeout) {
        delete cache[key];
      }
    });
  }, [cacheTimeout]);

  /**
   * Clear all cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  /**
   * Filter owned characters locally
   */
  const filterOwnedCharacters = useCallback((query: string): Character[] => {
    if (!query) {
      return ownedCharacters;
    }
    
    const lowerQuery = query.toLowerCase();
    return ownedCharactersSearchable
      .filter(char => 
        char._searchName.includes(lowerQuery) || 
        char._searchId.includes(lowerQuery)
      )
      .map(({ _searchName, _searchId, ...char }) => char);
  }, [ownedCharacters, ownedCharactersSearchable]);

  /**
   * Search characters via API
   */
  const searchViaAPI = useCallback(async (query: string): Promise<Character[]> => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      clearExpiredCache();
      const cached = cacheRef.current[query];
      if (cached) {
        setLoading(false);
        return cached.characters;
      }

      // Optimization: Check if we can filter from a previous search result
      // If the new query is a superset of a previous query (e.g., "alb" -> "albu"),
      // we can filter the previous results instead of making a new API call
      const lowerQuery = query.toLowerCase();
      for (const cachedQuery in cacheRef.current) {
        if (
          lowerQuery.startsWith(cachedQuery.toLowerCase()) &&
          cachedQuery.length >= minSearchLength
        ) {
          // Found a cached prefix query - filter its results
          const cachedResults = cacheRef.current[cachedQuery].characters;
          const filtered = cachedResults.filter(
            char =>
              char.character_name?.toLowerCase().includes(lowerQuery) ||
              char.character_uniqid?.toLowerCase().includes(lowerQuery),
          );

          // Cache the filtered result
          cacheRef.current[query] = {
            characters: filtered,
            timestamp: Date.now(),
          };

          setLoading(false);
          return filtered;
        }
      }

      // Fetch from API
      // Note: Don't use sort=popular for search - let the search relevance determine order
      const response = await fetch(
        `/api/characters?official=true&search=${encodeURIComponent(query)}&limit=50`,
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result?.code === 1 && result?.data?.characters) {
        const apiCharacters: Character[] = result.data.characters.map(
          (char: any) => ({
            character_uniqid: char.character_uniqid,
            character_name: char.character_name,
            character_pfp: char.character_pfp,
            is_collected: false,
            is_owned: false,
            num_collected: char.num_collected,
          }),
        );

        // Merge with owned characters and deduplicate
        const ownedMap = new Map<string, Character>();
        ownedCharacters.forEach(char => {
          ownedMap.set(char.character_uniqid, {
            character_uniqid: char.character_uniqid,
            character_name: char.character_name,
            character_pfp: char.character_pfp,
            is_collected: char.is_collected,
            is_owned: char.is_owned,
            num_collected: char.num_collected,
          });
        });

        // Filter owned characters by query
        const filteredOwned = filterOwnedCharacters(query);

        // Add API characters that are not owned
        const combined = [...filteredOwned];
        apiCharacters.forEach(char => {
          if (!ownedMap.has(char.character_uniqid)) {
            combined.push(char);
          }
        });

        // Cache the result
        cacheRef.current[query] = {
          characters: combined,
          timestamp: Date.now(),
        };

        setLoading(false);
        return combined;
      }

      setLoading(false);
      return filterOwnedCharacters(query);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to search characters');
      setError(error);
      setLoading(false);
      console.error('[useCharacterSearch] Error:', error);
      
      // Fallback to owned characters on error
      return filterOwnedCharacters(query);
    }
  }, [ownedCharacters, filterOwnedCharacters, clearExpiredCache]);

  /**
   * Main search function
   */
  const searchCharacters = useCallback(async (query: string): Promise<Character[]> => {
    // For empty or short queries, only show owned characters
    if (!query || query.length < minSearchLength) {
      return filterOwnedCharacters(query);
    }

    // For longer queries, search via API
    return searchViaAPI(query);
  }, [minSearchLength, filterOwnedCharacters, searchViaAPI]);

  return {
    searchCharacters,
    loading,
    error,
    clearCache,
  };
}

