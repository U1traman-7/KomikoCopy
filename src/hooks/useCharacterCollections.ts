import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom } from '../state';
import type { Collection } from '../Components/character/CollectionNav';
import { FaFire, FaClock, FaUser, FaHeart } from 'react-icons/fa';
import { MdCollections } from 'react-icons/md';
import React from 'react';
// import rawCharactersData from '../assets/characters.json';

// Preferred display order for Fan Collections (IP) — use slugs from API
const IP_PRIORITY_ORDER: string[] = [
  'genshin_impact',
  'kpop_demon_hunters',
  'hazbin_hotel',
  'kimetsu_no_yaiba',
  'boku_no_hero_academia',
  'neon_genesis_evangelion',
  'pokemon',
  'jujutsu_kaisen',
  'one_piece',
  'chiikawa',
  'italian_brainrot',
  'marvel',
  'dc_comics',
  'azur_lane',
  'league_of_legends',
  'final_fantasy',
  'spy_x_family',
  'sousou_no_frieren',
  'harry_potter',
  'honkai_series',
  'arknights',
  'girls_frontline',
  'vocaloid',
  'hololive',
  'mahou_shoujo_madoka_magica',
  'shingeki_no_kyojin',
  'death_note',
  'nijisanji',
  'jojo_no_kimyou_na_bouken',
  'animal_crossing',
  'dandadan',
  'bang_dream',
  'nier_series',
  'rick_and_morty',
  'zootopia',
  'spongebob_squarepants',
  'alien_stage_prologue',
];

// Treat these keys as "Others" category and always push them to the bottom
const OTHER_KEYS = new Set<string>([
  'spot_zero',
  'komiko_official',
  'other',
  'others',
  'uncategorized',
  'unknown',
]);

import { normalizeCategoryToKey } from '../utils/characterNameUtils';

export interface UseCharacterCollectionsReturn {
  collections: Collection[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage character collections
 * Returns system collections (Popular, Recently Used, My Characters, Adopted Characters)
 * and Fan collections (filtered to only show safe ones)
 */
export function useCharacterCollections(
  userId?: string,
): UseCharacterCollectionsReturn {
  const isAuth = useAtomValue(authAtom);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  // Default system collections - memoize to prevent recreation
  const getSystemCollections = (): Collection[] => {
    return [
      {
        id: 'popular',
        key: 'popular',
        icon: React.createElement(FaFire, { className: 'w-4 h-4' }),
        type: 'system',
      },
      {
        id: 'recent',
        key: 'recently_used',
        icon: React.createElement(FaClock, { className: 'w-4 h-4' }),
        requireAuth: true,
        type: 'system',
      },
      {
        id: 'my',
        key: 'my_characters',
        icon: React.createElement(FaUser, { className: 'w-4 h-4' }),
        requireAuth: true,
        type: 'system',
      },
      {
        id: 'adopted',
        key: 'adopted_characters',
        icon: React.createElement(FaHeart, { className: 'w-4 h-4' }),
        requireAuth: true,
        type: 'system',
      },
    ];
  };

  const fetchCollections = useCallback(async () => {
    // Prevent duplicate requests
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      // Start with system collections
      const systemCollections = getSystemCollections();

      // Fetch character counts for system collections if authenticated
      if (isAuth && userId) {
        try {
          // Fetch counts for each collection
          const [myCharsRes, adoptedCharsRes] = await Promise.all([
            fetch('/api/getOwnedCharacters'),
            fetch('/api/getCollectedCharacters'),
          ]);

          const myChars = await myCharsRes.json();
          const adoptedChars = await adoptedCharsRes.json();

          // Update counts
          systemCollections.forEach(collection => {
            if (collection.id === 'my' && Array.isArray(myChars)) {
              // Filter to only count owned characters (not collected)
              collection.count = myChars.filter(
                (char: any) => char.is_owned === true,
              ).length;
            } else if (
              collection.id === 'adopted' &&
              Array.isArray(adoptedChars)
            ) {
              collection.count = adoptedChars.length;
            }
          });
        } catch (err) {
          console.error('Failed to fetch collection counts:', err);
          // Continue without counts
        }
      }

      // Get Fan collections from static characters.json as fallback
      let fanCollections: Collection[] = [];

      // Fetch IP collections with accurate counts from database
      try {
        const response = await fetch('/api/characters?collections=true');
        const data = await response.json();

        if (data?.code === 1 && data?.data?.collections) {
          const dbCollections = data.data.collections;

          // Transform to our Collection format
          fanCollections = dbCollections
            .filter(
              (col: any) =>
                col.name &&
                col.name !== 'General' &&
                col.name !== 'My Characters' &&
                col.character_count > 0,
            )
            .map((col: any) => {
              // Use the slug/key directly from API to match translation keys
              // API converts "Honkai (Series)" → "honkai_series"
              // API converts "Girls' Frontline" → "girls_frontline"
              const slug = normalizeCategoryToKey(col.name);

              return {
                id: slug,
                key: slug,
                // Set name for fallback display (when translation doesn't exist)
                name: col.name,
                icon: React.createElement(MdCollections, {
                  className: 'w-4 h-4',
                }),
                count: col.character_count,
                type: 'ip' as const,
              };
            })
            // Sort by: Others last → custom priority → count desc → key asc
            .sort((a: Collection, b: Collection) => {
              const aIsOther = OTHER_KEYS.has(a.key);
              const bIsOther = OTHER_KEYS.has(b.key);
              if (aIsOther || bIsOther) {
                if (aIsOther && bIsOther) return 0;
                return aIsOther ? 1 : -1;
              }

              const ai = IP_PRIORITY_ORDER.indexOf(a.key);
              const bi = IP_PRIORITY_ORDER.indexOf(b.key);
              const aIn = ai !== -1;
              const bIn = bi !== -1;
              if (aIn || bIn) {
                if (aIn && bIn) return ai - bi;
                return aIn ? -1 : 1;
              }

              if ((b.count || 0) !== (a.count || 0)) {
                return (b.count || 0) - (a.count || 0);
              }
              return a.key.localeCompare(b.key);
            });
        } else {
          console.warn(
            '[useCharacterCollections] No collections data from API',
          );
        }
      } catch (err) {
        console.error('Failed to fetch characters from API:', err);
      }

      // Combine system and Fan collections
      const allCollections = [...systemCollections, ...fanCollections];
      setCollections(allCollections);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch collections'),
      );
      // Set at least system collections on error
      setCollections(getSystemCollections());
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuth, userId]);

  const refetch = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  // Initial fetch
  useEffect(() => {
    if (!isFetchingRef.current) {
      fetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, userId]);

  return {
    collections,
    loading,
    error,
    refetch,
  };
}
