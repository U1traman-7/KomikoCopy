import { useEffect, useCallback, useState, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom } from '../state';

export interface AdoptedCharacter {
  collection_id: string;
  collected_at: string;
  character_uniqid: string;
  character_name: string;
  character_pfp: string;
  character_description?: string;
  age?: string;
  gender?: string;
  profession?: string;
  personality?: string;
  interests?: string;
  intro?: string;
  created_at?: string;
  user_name?: string;
  user_image?: string;
  authUserId?: string;
  name?: string;
  simple_name?: string;
  image?: string;
  is_collected?: boolean;
}

export interface UseAdoptedCharactersReturn {
  characters: AdoptedCharacter[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage adopted/collected characters with caching
 * Fetches from API and caches in state
 */
export function useAdoptedCharacters(): UseAdoptedCharactersReturn {
  const isAuth = useAtomValue(authAtom);
  const [characters, setCharacters] = useState<AdoptedCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchCharacters = useCallback(async () => {
    if (!isAuth || isFetchingRef.current) {
      return;
    }

    // Prevent fetching too frequently (within 5 seconds)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch('/api/getCollectedCharacters');
      const data = await response.json();

      if (data && !data.error) {
        setCharacters(Array.isArray(data) ? data : []);
        lastFetchTimeRef.current = now;
      } else {
        console.error('Failed to fetch adopted characters:', data.error);
        setError(data.error || 'Failed to fetch adopted characters');
        setCharacters([]);
      }
    } catch (err) {
      console.error('Failed to fetch adopted characters:', err);
      setError('Failed to fetch adopted characters');
      setCharacters([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuth]);

  // Auto-fetch on mount if authenticated and no data
  useEffect(() => {
    if (isAuth && characters.length === 0 && !isFetchingRef.current) {
      fetchCharacters();
    } else if (!isAuth && characters.length > 0) {
      setCharacters([]);
      setError(null);
    }
  }, [isAuth, characters.length, fetchCharacters]);

  return {
    characters,
    loading,
    error,
    refresh: fetchCharacters,
  };
}

