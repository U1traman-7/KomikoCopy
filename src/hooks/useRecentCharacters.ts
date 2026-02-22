import { useEffect, useCallback, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, recentCharactersAtom } from '../state';
import type { Character } from '../state';

const MAX_RECENT_CHARACTERS = 20;

export interface UseRecentCharactersReturn {
  recentCharacters: Character[];
  addToRecent: (character: Character) => void;
  clearRecent: () => void;
}

/**
 * Hook to manage recently used characters using atomWithStorage
 * Automatically persists to localStorage and syncs across tabs
 */
export function useRecentCharacters(
  limit: number = MAX_RECENT_CHARACTERS,
): UseRecentCharactersReturn {
  const isAuth = useAtomValue(authAtom);
  // Use global atom with localStorage persistence
  const [recentCharacters, setRecentCharacters] = useAtom(recentCharactersAtom);

  // Track previous auth state to detect logout (not initial load)
  const prevAuthRef = useRef<boolean | null>(null);

  // Add a character to recent list
  const addToRecent = useCallback(
    (character: any) => {
      if (typeof window === 'undefined') return;

      try {
        // Get unique identifier - support both DB characters and official characters
        // For DB characters: use character_uniqid or uniqid
        // For official characters: use name (e.g., "Lumine (Genshin Impact)")
        const uniqueId =
          character.character_uniqid || character.uniqid || character.name;
        const displayName =
          character.character_name || character.simple_name || character.name;
        const imageUrl = character.character_pfp || character.image || '';

        if (!uniqueId) {
          console.warn(
            'Character has no unique identifier, skipping recent add',
          );
          return;
        }

        setRecentCharacters(prevCharacters => {
          const filtered = prevCharacters.filter(
            c => c.character_uniqid !== uniqueId,
          );

          const newCharacters: Character[] = [
            {
              character_uniqid: uniqueId,
              character_name: displayName,
              character_pfp: imageUrl,
            } as Character,
            ...filtered,
          ].slice(0, limit);

          return newCharacters;
        });
      } catch (error) {
        console.error('Failed to add character to recent:', error);
      }
    },
    [setRecentCharacters, limit],
  );

  // Clear all recent characters
  const clearRecent = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Update atom (which automatically syncs to localStorage)
      setRecentCharacters([]);
    } catch (error) {
      console.error('Failed to clear recent characters:', error);
    }
  }, [setRecentCharacters]);

  // Clear recent characters when user logs out
  // Only clear if user was previously authenticated (to avoid clearing on initial page load)
  useEffect(() => {
    // If this is the first render, just record the current auth state
    if (prevAuthRef.current === null) {
      prevAuthRef.current = isAuth;
      return;
    }

    if (prevAuthRef.current === true && isAuth === false) {
      setRecentCharacters([]);
    }

    // Update the previous auth state
    prevAuthRef.current = isAuth;
  }, [isAuth, setRecentCharacters]);

  return {
    recentCharacters,
    addToRecent,
    clearRecent,
  };
}
