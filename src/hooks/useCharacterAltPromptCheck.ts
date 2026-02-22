import { useState, useEffect, useRef } from 'react';
import { CHARACTER_MENTION_REGEX } from '../constants';

export interface CharacterAltPromptInfo {
  character_uniqid: string;
  alt_prompt?: string;
  character_description?: string;
}

/**
 * Hook to fetch character alt_prompt information for characters not in availableCharacters
 * This is used for Auto Model selection to determine if characters have alt_prompt
 */
export function useCharacterAltPromptCheck(
  prompt: string,
  model: string,
  availableCharacters?: Array<{
    character_uniqid: string;
    alt_prompt?: string;
    character_description?: string;
  }>,
) {
  const [characterInfo, setCharacterInfo] = useState<
    Map<string, CharacterAltPromptInfo>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, CharacterAltPromptInfo>>(new Map());

  useEffect(() => {
    // Only fetch when model is Auto Model
    if (model !== 'Auto Model') {
      setCharacterInfo(new Map());
      return;
    }

    // Extract character IDs from prompt using @ mentions
    // Match alphanumeric, underscores, hyphens, parentheses, periods, colons, and single quotes
    const characterMentions = prompt.match(CHARACTER_MENTION_REGEX) || [];
    const mentionedCharacterIds = characterMentions.map((m: string) =>
      m.substring(1),
    );

    if (mentionedCharacterIds.length === 0) {
      // No characters mentioned, clear state
      setCharacterInfo(new Map());
      return;
    }

    // Find characters that are either:
    // - not in availableCharacters, or
    // - in availableCharacters but missing alt_prompt
    // and also not already in cache
    const missingCharacterIds = mentionedCharacterIds.filter(id => {
      const inAvailable = availableCharacters?.some(
        c => c.character_uniqid === id,
      );
      const hasAltInAvailable = availableCharacters?.some(
        c => c.character_uniqid === id && !!c.alt_prompt,
      );
      if (hasAltInAvailable) return false; // already have alt_prompt locally
      if (!inAvailable) {
        return !cacheRef.current.has(id);
      }
      // in available but missing alt_prompt -> need fetch unless cached
      return !cacheRef.current.has(id);
    });

    if (missingCharacterIds.length === 0) {
      // All characters are either in availableCharacters or cached
      // Update state with cached data
      const cachedData = new Map<string, CharacterAltPromptInfo>();
      mentionedCharacterIds.forEach(id => {
        if (cacheRef.current.has(id)) {
          cachedData.set(id, cacheRef.current.get(id)!);
        }
      });
      setCharacterInfo(cachedData);
      return;
    }

    setLoading(true);

    // Fetch missing characters from API
    const fetchMissingCharacters = async () => {
      setLoading(true);
      try {
        const idsParam = missingCharacterIds.join(',');
        const response = await fetch(
          `/api/getCharacterAltPrompt?ids=${idsParam}`,
        );

        if (!response.ok) {
          console.error('Failed to fetch character info:', response.statusText);
          return;
        }

        const json = await response.json();
        const apiChars = (json && json.data) || [];
        if (Array.isArray(apiChars)) {
          // Update cache
          apiChars.forEach((char: CharacterAltPromptInfo) => {
            cacheRef.current.set(char.character_uniqid, char);
          });

          // Update state with all mentioned characters (from cache)
          const allData = new Map<string, CharacterAltPromptInfo>();
          mentionedCharacterIds.forEach(id => {
            const cached = cacheRef.current.get(id);
            if (cached) {
              allData.set(id, cached);
            }
          });
          setCharacterInfo(allData);
        } else {
          console.warn(
            'Unexpected response from /api/getCharacterAltPrompt:',
            json,
          );
        }
      } catch (error) {
        console.error('Error fetching character info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissingCharacters();
  }, [prompt, model, availableCharacters]);

  return { characterInfo, loading };
}

