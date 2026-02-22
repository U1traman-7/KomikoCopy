import { useEffect, useCallback, useState, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { characterListAtom, authAtom } from '../state';

export function useOwnedCharacters() {
  const [characters, setCharacters] = useAtom(characterListAtom);
  const isAuth = useAtomValue(authAtom);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchCharacters = useCallback(async () => {
    if (!isAuth || isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await fetch('/api/getOwnedCharacters');
      const data = await response.json();

      if (data && !data.error) {
        setCharacters(data);
      } else {
        console.error('Failed to fetch characters:', data.error);
        setCharacters([]);
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuth, setCharacters]);

  useEffect(() => {
    if (isAuth && characters.length === 0 && !isFetchingRef.current) {
      fetchCharacters();
    } else if (!isAuth && characters.length > 0) {
      setCharacters([]);
    }
  }, [isAuth, characters.length, fetchCharacters, setCharacters]);

  return {
    characters,
    loading,
    error: null,
    refresh: fetchCharacters,
  };
}

