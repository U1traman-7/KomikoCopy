/* eslint-disable */
import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
} from 'react';
import {
  Link,
  Tabs,
  Tab,
  Button,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { Key } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  authAtom,
  profileAtom,
} from '../../state';
import { FiMoreHorizontal } from 'react-icons/fi';
import {
  insertUserCharacterCategories,
  updateUserCharacterCategories,
  createMyCharactersData,
  createRecentCharactersData,
  createAdoptedCharactersData,
  hasCategoryKey,
  findCategoryIndex,
} from '../../utils/characterDataHelpers';
import {
  formatCategoryName,
  getCharacterPromptName,
  i18nKeyForCategory,
} from '../../utils/characterNameUtils';
import {
  getCachedCharacters,
  setCachedCharacters,
} from '../../utils/characterCache';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import { useOwnedCharacters } from '../../hooks/useOwnedCharacters';
import { useAdoptedCharacters } from '../../hooks/useAdoptedCharacters';
import { useCharacterCollections } from '../../hooks/useCharacterCollections';
import { CharacterCardItem } from '../character/CharacterCardItem';
import { useRecentCharacters } from '../../hooks/useRecentCharacters';
import rawCharactersData from '../../assets/characters.json';

// 添加组件特定的样式
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.textContent = `
    /* 移动端响应式样式 */
    @media (max-width: 768px) {
      .mobile-character-name {
        width: 58px !important;
        font-size: 0.7rem !important;
      }
    }
  `;
  if (!document.head.querySelector('#characterSelector-styles')) {
    styleEl.id = 'characterSelector-styles';
    document.head.appendChild(styleEl);
  }
}

interface ClassNameProps {
  classNames?: {
    characterTab?: string;
    characterTabItem?: string;
  };
  className?: string;
}

export interface SingleCharacter {
  name: string; // Full name used in prompts (e.g., "Lumine (Genshin Impact)")
  simple_name: string; // Display name (e.g., "Lumine")
  image: string; // Image path (local or Supabase URL)
  uniqid?: string; // Character unique ID (from database)
  character_uniqid?: string; // Alternative unique ID field
  alt_prompt?: string;
  num_collected?: number;
}

interface CharacterData {
  world: string;
  key: string;
  characters: SingleCharacter[];
}

export interface CharactersSelectorProps extends ClassNameProps {
  prompt: string;
  setPrompt?: (newPrompt: string) => void;
  isMobile?: boolean;
  useDb?: boolean;
  setCharacter?: (character: SingleCharacter) => void;
  showPreset?: boolean;
  children?: React.ReactNode;
  model?: string;
  isCreatePage?: boolean;
}

const makeCharRegex = (char: SingleCharacter | string) => {
  if (typeof char === 'string') {
    return char.replace(/[.*+?^${}()|[\]\\<>]/g, '\\$&');
  } else {
    // Use the character's prompt name (with @ prefix and ID format)
    const promptName = getCharacterPromptName(char);
    return promptName.replace(/[.*+?^${}()|[\]\\<>]/g, '\\$&');
  }
};

export const CharactersSelector: React.FC<CharactersSelectorProps> = memo(
  ({
    prompt,
    setPrompt,
    useDb = true,
    setCharacter,
    classNames,
    children,
    model,
    isCreatePage,
  }) => {
    const { t } = useTranslation(['create', 'character']);
    const router = useRouter();
    const [profile] = useAtom(profileAtom);

    // Selected world/category on the left-side tabs
    // Start with 'Popular' as default, then restore saved tab when data is loaded
    const [world, setWorld] = useState<string>('Popular');
    const isAuth = useAtomValue(authAtom);
    const [isMobile, setIsMobile] = useState(false);

    // Refs for tab restoration logic
    const hasRestoredRef = useRef(false);
    const savedTabRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);

    // Initialize savedTabRef once on mount
    useEffect(() => {
      if (!isInitializedRef.current && typeof window !== 'undefined') {
        savedTabRef.current = localStorage.getItem('character-selector-tab');
        isInitializedRef.current = true;
      }
    }, []);

    useEffect(() => {
      // Skip saving until restoration is complete
      if (!hasRestoredRef.current) return;

      if (typeof window !== 'undefined') {
        localStorage.setItem('character-selector-tab', world);
        savedTabRef.current = world;
      }
    }, [world]);

    // Use cached owned characters instead of fetching every time
    const { characters: ownedCharacters } = useOwnedCharacters();

    // Use character collections hook (same as characters.tsx)
    const { collections: fetchedCollections } = useCharacterCollections(
      profile?.id,
    );

    // Build a map for quick lookup when lazy-loading categories
    const apiCollectionsMapRef = useRef<Map<string, any>>(new Map());
    const lazyLoadedCategoriesRef = useRef<Set<string>>(new Set());

    // Update apiCollectionsMapRef when collections are fetched
    useEffect(() => {
      const collectionsMap = new Map<string, any>();

      // Add General category (not included in API collections)
      collectionsMap.set('General', {
        name: 'General',
        slug: 'general',
        character_count: 0, // Will be loaded from API
      });

      // Convert Collection[] to map format for lazy loading
      if (fetchedCollections.length > 0) {
        fetchedCollections.forEach(collection => {
          if (collection.type === 'ip' && collection.name) {
            collectionsMap.set(collection.name, {
              name: collection.name,
              slug: collection.key,
              character_count: collection.count || 0,
            });
          }
        });
      }

      apiCollectionsMapRef.current = collectionsMap;
    }, [fetchedCollections]);

    // Preload top collections in the background to speed up tab switching
    useEffect(() => {
      if (!fetchedCollections || fetchedCollections.length === 0) return;

      // Preload the first 3 IP collections (most likely to be clicked)
      const topCollections = fetchedCollections
        .filter(c => c.type === 'ip' && c.name)
        .slice(0, 3);

      // Delay preloading to not block initial render
      const preloadTimer = setTimeout(() => {
        topCollections.forEach(async collection => {
          const collectionName = collection.name!;
          const collectionSlug = collection.key;

          // Skip if already loaded or loading
          if (lazyLoadedCategoriesRef.current.has(collectionName)) {
            return;
          }

          // Check if already cached
          const cachedChars = getCachedCharacters(collectionSlug);
          if (cachedChars && cachedChars.length > 0) {
            // Already cached, mark as loaded
            lazyLoadedCategoriesRef.current.add(collectionName);
            return;
          }

          // Preload from API in background
          try {
            const limit = Math.min(200, Math.max(collection.count || 0, 50));
            const res = await fetch(
              `/api/characters?official=true&sort=name&limit=${limit}&ip_collection=${encodeURIComponent(
                collectionSlug,
              )}`,
            );
            const json = await res.json();

            if (json?.code === 1) {
              const apiChars = json.data?.characters || json.data || [];

              // Cache for future use
              if (apiChars.length > 0) {
                setCachedCharacters(collectionSlug, apiChars);
                lazyLoadedCategoriesRef.current.add(collectionName);
              }
            }
          } catch (err) {
            // Silent fail for background preloading
            console.log(
              `Background preload failed for ${collectionName}:`,
              err,
            );
          }
        });
      }, 1000); // Wait 1 second after initial render

      return () => clearTimeout(preloadTimer);
    }, [fetchedCollections]);

    useEffect(() => {
      if (!fetchedCollections || fetchedCollections.length === 0) return;

      // Keep Japanese experience: only show General
      // if (
      //   typeof window !== 'undefined' &&
      //   navigator.language.startsWith('ja')
      // ) {
      //   return;
      // }

      // Fetch Popular characters (top 30 across all IPs)
      (async () => {
        try {
          const res = await fetch(
            '/api/characters?official=true&limit=30&sort=popular',
          );
          const json = await res.json();
          if (json?.code === 1) {
            const popularChars = (json.data?.characters || json.data || []).map(
              (c: any) => ({
                name: `@${c.character_uniqid}`,
                simple_name: c.character_name,
                image: c.character_pfp || '',
                character_uniqid: c.character_uniqid,
                num_collected: c.num_collected,
                alt_prompt: c.alt_prompt,
              }),
            );

            setCharactersData(prev => {
              // Preserve user categories if they already exist to avoid flicker
              const recentIdx = findCategoryIndex(prev, 'recent_characters');
              const myIdx = findCategoryIndex(prev, 'my_characters');
              const adoptedIdx = findCategoryIndex(prev, 'adopted_characters');
              const recent = recentIdx >= 0 ? prev[recentIdx] : null;
              const myCharacters = myIdx >= 0 ? prev[myIdx] : null;
              const adopted = adoptedIdx >= 0 ? prev[adoptedIdx] : null;

              // Create Popular category
              const popularCategory: CharacterData = {
                world: 'Popular',
                key: 'popular',
                characters: popularChars,
              };

              // Get General category from local JSON data
              const generalFromJson = rawCharactersData.find(
                (d: any) => d.world === 'General',
              );
              const generalCategory: CharacterData = generalFromJson
                ? {
                    world: generalFromJson.world,
                    key: 'general',
                    characters: generalFromJson.characters.map((c: any) => ({
                      name: c.name,
                      simple_name: c.simple_name,
                      image: c.image || '',
                      character_uniqid: '',
                      num_collected: 0,
                    })),
                  }
                : {
                    world: 'General',
                    key: 'general',
                    characters: [],
                  };

              // Build IP worlds from fetched collections (order preserved and already sorted)
              const ipWorlds: CharacterData[] = fetchedCollections
                .filter(col => col.name && col.type === 'ip')
                .map(col => ({
                  world: col.name!,
                  key: col.key,
                  characters: [], // empty initially; lazy-loaded on selection
                }));

              // Combine: General + Popular + IP worlds (General first, but Popular is default selected)
              const allWorlds = [generalCategory, popularCategory, ...ipWorlds];

              // Insert user categories in the right place (after General)
              let next = insertUserCharacterCategories(allWorlds, {
                recent,
                myCharacters,
                adopted,
              });

              return next;
            });
          }
        } catch (err) {
          console.error('Failed to fetch popular characters:', err);
        }
      })();
    }, [fetchedCollections]);

    // Use cached adopted characters
    const { characters: adoptedCharacters } = useAdoptedCharacters();

    // Use recent characters hook
    const { recentCharacters, addToRecent } = useRecentCharacters(10);

    // Memoize ownedCharacters to prevent unnecessary re-renders
    // Only update when the actual content changes (length or first item)
    const stableOwnedCharacters = useMemo(
      () => ownedCharacters,
      [ownedCharacters.length, ownedCharacters[0]?.character_uniqid],
    );

    const stableAdoptedCharacters = useMemo(
      () => adoptedCharacters,
      [adoptedCharacters.length, adoptedCharacters[0]?.character_uniqid],
    );

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }, []);

    // Initialize with General category data for instant first render
    // This avoids waiting for API calls and provides immediate content
    const initialCharactersData = useMemo<CharacterData[]>(() => {
      const generalData = rawCharactersData.find(
        (d: any) => d.world === 'General',
      );
      if (!generalData) return [];

      return [
        {
          world: 'General',
          key: 'general',
          characters: (generalData.characters || []).map((c: any) => ({
            name: c.name,
            simple_name: c.simple_name,
            image: c.image || '',
            character_uniqid: '',
            num_collected: 0,
          })),
        },
      ];
    }, []);

    const [charactersData, setCharactersData] = useState<CharacterData[]>(
      initialCharactersData,
    );

    // Restore saved tab when data is loaded
    useEffect(() => {
      if (hasRestoredRef.current) return;

      if (!isInitializedRef.current) return;

      if (charactersData.length < 5) {
        return;
      }

      // If we have a saved tab and it exists in charactersData, restore it
      if (savedTabRef.current && savedTabRef.current !== world) {
        const tabExists = charactersData.some(
          data => data.world === savedTabRef.current,
        );

        if (tabExists) {
          setWorld(savedTabRef.current);
        }
      } else if (!savedTabRef.current) {
        // If no saved tab, default to Popular (not General)
        const popularExists = charactersData.some(
          data => data.world === 'Popular',
        );
        if (popularExists && world !== 'Popular') {
          setWorld('Popular');
        }
      }

      // Mark as restored after first check (whether we restored or not)
      hasRestoredRef.current = true;
    }, [charactersData, world]);

    // Lazy-load full characters for the selected category using ip_collection
    useEffect(() => {
      const selectedWorld = world;

      if (!selectedWorld) {
        return;
      }

      const collection = apiCollectionsMapRef.current.get(selectedWorld);
      if (!collection) {
        return;
      }

      // Check if already loaded - but still allow re-render if data is missing
      let currentCategory = charactersData.find(
        (d: CharacterData) => d.world === selectedWorld,
      );
      let hasData = (currentCategory?.characters?.length || 0) > 0;

      if (lazyLoadedCategoriesRef.current.has(selectedWorld) && hasData) {
        return;
      }

      if (lazyLoadedCategoriesRef.current.has(selectedWorld) && !hasData) {
        // Marked as loaded but no data, re-fetch
        lazyLoadedCategoriesRef.current.delete(selectedWorld);
      }

      const have = currentCategory?.characters?.length || 0;
      const target = collection?.character_count || 0;

      // If we already have enough characters for this category, skip fetching
      if (target && have >= target) {
        return;
      }

      // Only fetch when the tab is actually selected to keep requests minimal
      (async () => {
        // Check localStorage cache
        const cachedChars = getCachedCharacters(collection.slug);
        if (cachedChars && cachedChars.length > 0) {
          // Use cached data
          const mapped = cachedChars.map((c: any) => ({
            name: c.character_name || c.name,
            simple_name: c.character_name || c.simple_name,
            image: c.character_pfp || c.image || '',
            character_uniqid: c.character_uniqid,
            num_collected: c.num_collected,
            alt_prompt: c.alt_prompt,
          }));

          setCharactersData(prev => {
            const idx = prev.findIndex(
              (d: CharacterData) => d.world === selectedWorld,
            );
            if (idx < 0) return prev;

            const next = [...prev];
            next[idx] = { ...prev[idx], characters: mapped };
            return next;
          });

          lazyLoadedCategoriesRef.current.add(selectedWorld);

          return;
        }

        try {
          const limit = Math.min(200, Math.max(target || 0, 50));
          const res = await fetch(
            `/api/characters?official=true&sort=popular&limit=${limit}&ip_collection=${encodeURIComponent(
              collection.slug,
            )}`,
          );
          const json = await res.json();
          if (json?.code !== 1) {
            throw new Error(json?.message || 'Failed to load characters');
          }

          const apiChars = json.data?.characters || json.data || [];

          // Cache the API response
          if (apiChars.length > 0) {
            setCachedCharacters(collection.slug, apiChars);
          }

          const mapped = (apiChars as any[]).map((c: any) => ({
            name: c.character_name,
            simple_name: c.character_name,
            image: c.character_pfp || '',
            character_uniqid: c.character_uniqid,
            num_collected: c.num_collected,
            alt_prompt: c.alt_prompt
          }));

          setCharactersData(prev => {
            const idx = prev.findIndex(
              (d: CharacterData) => d.world === selectedWorld,
            );
            if (idx < 0) return prev;

            const existing = prev[idx]?.characters || [];
            const seen = new Set<string>();
            const merged: any[] = [];

            // Add API characters first
            for (const ch of mapped) {
              const id = ch.character_uniqid || ch.name?.toLowerCase();
              if (id && !seen.has(id)) {
                seen.add(id);
                if (ch.name) seen.add(ch.name.toLowerCase());
                merged.push(ch);
              }
            }
            // Add any existing static entries not present in API
            for (const ch of existing) {
              const nameKey = ch.name?.toLowerCase();
              const simpleKey = ch.simple_name?.toLowerCase();
              const id = ch.character_uniqid || nameKey || simpleKey;
              if (
                id &&
                !seen.has(id) &&
                (nameKey ? !seen.has(nameKey) : true) &&
                (simpleKey ? !seen.has(simpleKey) : true)
              ) {
                merged.push(ch as any);
              }
            }

            const next = [...prev];
            next[idx] = { ...prev[idx], characters: merged };
            return next;
          });
        } catch (e) {
          console.error('[CharactersSelector] Lazy load category failed', e);
        } finally {
          lazyLoadedCategoriesRef.current.add(selectedWorld);
        }
      })();
    }, [world, charactersData]);

    // Use cached owned characters to build "My Characters" tab
    useEffect(() => {
      if (!isAuth || recentCharacters.length === 0) return;

      // Update the Recent Characters category in charactersData
      setCharactersData(prevData => {
        const recentData = createRecentCharactersData(recentCharacters, t);
        if (!recentData) return prevData;
        const myExisting =
          prevData.find(d => d.key === 'my_characters') || null;
        const adoptedExisting =
          prevData.find(d => d.key === 'adopted_characters') || null;
        return updateUserCharacterCategories(prevData, {
          recent: recentData,
          myCharacters: myExisting,
          adopted: adoptedExisting,
        });
      });
    }, [recentCharacters, isAuth, t]);

    // 更新My Characters
    useEffect(() => {
      if (!isAuth) return;

      setCharactersData(prevData => {
        const myCharacters = createMyCharactersData(stableOwnedCharacters, t);
        const recentExisting =
          prevData.find(d => d.key === 'recent_characters') || null;
        const adoptedExisting =
          prevData.find(d => d.key === 'adopted_characters') || null;
        return updateUserCharacterCategories(prevData, {
          recent: recentExisting,
          myCharacters,
          adopted: adoptedExisting,
        });
      });
    }, [stableOwnedCharacters, isAuth, t]);

    // 更新Adopted Characters
    useEffect(() => {
      if (!isAuth) return;

      setCharactersData(prevData => {
        const adoptedData = createAdoptedCharactersData(
          stableAdoptedCharacters,
          t,
        );
        const recentExisting =
          prevData.find(d => d.key === 'recent_characters') || null;
        const myExisting =
          prevData.find(d => d.key === 'my_characters') || null;
        return updateUserCharacterCategories(prevData, {
          recent: recentExisting,
          myCharacters: myExisting,
          adopted: adoptedData,
        });
      });
    }, [stableAdoptedCharacters, isAuth, t]);

    // Initialize My Characters category if useDb is false
    useEffect(() => {
      if (useDb !== false) return;

      // Use cached owned characters instead of fetching
      const charDataFilter: SingleCharacter[] =
        stableOwnedCharacters.length > 0
          ? stableOwnedCharacters.map(char => ({
              name: `@${char.character_uniqid}`,
              simple_name: char.character_name,
              image: char.character_pfp,
            }))
          : [];

      const myCharactersData: CharacterData = {
        world: t('my_characters'),
        key: 'my_characters',
        characters: [
          {
            name: '@new_character',
            simple_name: t('character:new_character'),
            image: '/images/new_character.webp',
          },
          ...charDataFilter,
        ],
      };

      // Create Recent and Adopted data from cached data
      const recentData =
        recentCharacters.length > 0
          ? createRecentCharactersData(recentCharacters, t)
          : null;
      const adoptedData = isAuth
        ? createAdoptedCharactersData(stableAdoptedCharacters, t)
        : null;

      // Check if My Characters already exists
      const hasMyCharacters = hasCategoryKey(charactersData, 'my_characters');

      if (!hasMyCharacters) {
        // Insert all user categories
        const newData = insertUserCharacterCategories(charactersData, {
          recent: recentData,
          myCharacters: myCharactersData,
          adopted: adoptedData,
        });
        setCharactersData(newData);
      }
    }, [
      useDb,
      stableOwnedCharacters,
      recentCharacters,
      stableAdoptedCharacters,
      isAuth,
      t,
    ]);

    return (
      <div
        className={cn(
          'flex max-w-full relative',
          isMobile
            ? 'max-h-[42vh]'
            : isCreatePage
              ? 'max-h-[49vh]'
              : 'max-h-[70vh]',
        )}>
        <Tabs
          fullWidth={false}
          aria-label='Character Worlds'
          size='sm'
          placement='start'
          variant='light'
          disableAnimation
          color='default'
          className={cn(
            'overflow-y-auto overflow-x-hidden flex-shrink-0 h-full',
            isMobile ? 'max-w-20' : 'max-w-24',
            classNames?.characterTab,
          )}
          classNames={{
            tab: cn(
              'rounded-lg transition-color duration-200 hover:bg-muted hover:text-foreground active:bg-muted data-[selected=true]:bg-muted',
              isMobile ? 'py-1 px-2 h-auto' : 'py-2 px-1 h-auto',
            ),
            tabContent: cn(
              'group-data-[selected=true]:text-foreground font-medium',
              isMobile ? 'text-xs' : 'text-sm',
            ),
            cursor: 'bg-muted shadow-none grid place-items-center',
            panel: cn('max-w-full pr-0 h-full overflow-y-auto pt-0 pl-0'),
            tabList: cn(
              'border-r border-border rounded-r-none p-0 h-full pb-12 pr-1 pt-1',
            ),
          }}
          onSelectionChange={(key: Key) => {
            const selectedWorld = key as string;
            setWorld(selectedWorld);
          }}
          selectedKey={world}>
          {charactersData.map((world, index) => {
            // Determine if this is a system collection
            const isSystemCollection = [
              'popular',
              'general',
              'my_characters',
              'recent_characters',
              'adopted_characters',
            ].includes(world.key);

            // Check if we need to insert a divider before this tab
            // Insert divider before the first IP collection
            const prevWorld = index > 0 ? charactersData[index - 1] : null;
            const prevIsSystem = prevWorld
              ? [
                  'popular',
                  'general',
                  'my_characters',
                  'recent_characters',
                  'adopted_characters',
                ].includes(prevWorld.key)
              : false;
            const needsDivider = !isSystemCollection && prevIsSystem;

            return (
              <React.Fragment key={world.world}>
                {needsDivider && (
                  <Tab
                    key='fan-collections-divider'
                    isDisabled
                    classNames={{
                      tab: cn(
                        'data-[disabled=true]:opacity-100 cursor-default h-auto min-h-fit mt-3 mb-1',
                        isMobile ? 'px-1' : 'px-0',
                      ),
                    }}
                    title={
                      <div className='flex flex-col items-center justify-center w-full pointer-events-none py-1'>
                        <div className='w-full h-px bg-border mb-1.5' />
                        <span
                          className={cn(
                            'font-semibold text-muted-foreground uppercase whitespace-normal break-words text-center leading-tight text-[10px] tracking-tight',
                            isMobile ? ' px-0' : 'tracking-wide px-2',
                          )}>
                          {t('fan_collections')}
                        </span>
                        <div className='w-full h-px bg-border mt-1.5' />
                      </div>
                    }
                    className='m-0 cursor-default pointer-events-none h-auto'
                  />
                )}
                <Tab
                  key={world.world}
                  title={
                    <div className='flex items-center w-full text-left'>
                      <span
                        className={cn(
                          'whitespace-normal break-words text-center leading-tight transition-all group-data-[selected=true]:font-medium text-xs group-data-[hover=true]:text-foreground',
                        )}
                        title={world.world}>
                        {(() => {
                          // For user categories (my_characters, recent_characters, adopted_characters),
                          // use direct translation keys instead of create:worlds namespace
                          if (world.key === 'my_characters') {
                            return t('my_characters');
                          }
                          if (world.key === 'recent_characters') {
                            return t('recently_used');
                          }
                          if (world.key === 'adopted_characters') {
                            return t('adopted_characters');
                          }
                          if (world.key === 'popular') {
                            return t('popular');
                          }

                          // For other categories, use the worlds namespace
                          const translationKey = i18nKeyForCategory(world.key);
                          const translated = t(translationKey);
                          // If translation returns the same as key (no translation found), use formatted name
                          if (
                            translated === translationKey ||
                            translated === world.key
                          ) {
                            return formatCategoryName(world.world);
                          }
                          return translated;
                        })()}
                      </span>
                    </div>
                  }
                  className='m-0'
                  style={{
                    marginBottom:
                      index === charactersData.length - 1 ? '50px' : '0px',
                  }}>
                  <div>
                    <div
                      className={cn(
                        'mt-0 grid w-full overflow-x-hidden',
                        isMobile
                          ? 'grid-cols-3 sm:grid-cols-4 gap-1.5 pb-3 p-2'
                          : 'grid-cols-3 gap-3 px-2 pb-4 pt-1',
                        classNames?.characterTabItem,
                      )}>
                      {world.characters.map(
                        (character: SingleCharacter, charIndex: number) => {
                          const isGeneralCategory =
                            world.key === 'general' ||
                            world.world === 'General';

                          const characterPromptName = isGeneralCategory
                            ? character.name
                            : getCharacterPromptName(character);

                          const escapedPromptName = characterPromptName.replace(
                            /[.*+?^${}()|[\]\\<>]/g,
                            '\\$&',
                          );
                          const charRegex = new RegExp(
                            `(^|\\s*|,)${escapedPromptName}(\\s*|,|$)`,
                            'i',
                          );
                          const included = charRegex.test(prompt);
                          // Priority:
                          // 1. character.image (Full URL from Supabase or local path from static data)
                          // 2. Fallback to constructed local path if empty
                          let imagePath = character.image || '';

                          // If no image path, try constructing local path as fallback
                          if (!imagePath) {
                            imagePath = `/images/characters/${world.world}/${character.name}.webp`;
                          }

                          // Update character object with correct image path
                          const characterWithImage = {
                            ...character,
                            image: imagePath,
                          };

                          const handleCharacterClick = () => {
                            if (character.name !== '@new_character') {
                              if (!included) {
                                const reg = /,\s*$/;
                                const newPrompt =
                                  prompt.replace(reg, '') +
                                  ', ' +
                                  characterPromptName;
                                setPrompt &&
                                  setPrompt(newPrompt.replace(/^,\s*/, ''));
                                setCharacter && setCharacter(character);
                              } else {
                                // Simple approach: remove the character name and clean up commas
                                let newPrompt = prompt.replace(
                                  new RegExp(escapedPromptName, 'g'),
                                  '',
                                );
                                // Clean up multiple commas and spaces
                                newPrompt = newPrompt
                                  .replace(/\s*,\s*,\s*/g, ', ')
                                  .replace(/^\s*,\s*/, '')
                                  .replace(/\s*,\s*$/, '')
                                  .replace(/\s+/g, ' ')
                                  .trim();
                                setPrompt && setPrompt(newPrompt);
                              }
                            } else {
                              router.push('/oc-maker');
                            }
                          };

                          return (
                            <CharacterCardItem
                              key={character.name}
                              character={characterWithImage as any}
                              selected={included}
                              onClick={handleCharacterClick}
                              compact={isMobile}
                              showId={world.key !== 'recent_characters'}
                              priority={charIndex < 6}
                              showCollectionCount={false}
                            />
                          );
                        },
                      )}
                    </div>

                    {/* General category footer */}
                    {(world.key === 'general' || world.world === 'General') && (
                      <p className='text-xs md:text-sm text-start mt-3 ml-2 text-muted-foreground '>
                        {t('explore_more_characters')}{' '}
                        <Link
                          size='sm'
                          target='_blank'
                          showAnchorIcon
                          href='https://www.downloadmost.com/NoobAI-XL/danbooru-character/'
                          underline='always'>
                          {t('here')}
                        </Link>
                        {t('only_for_Animagine_and_Illustrious')}
                      </p>
                    )}
                  </div>
                </Tab>
              </React.Fragment>
            );
          })}
        </Tabs>
        {/* More button - positioned absolutely at bottom left */}
        <div
          className={cn(
            'absolute bottom-0 left-0 bg-card border-t border-r border-border',
            isMobile ? 'w-20 p-1.5' : 'w-24 p-2',
          )}>
          <Button
            variant='light'
            size='sm'
            className={cn(
              'w-full justify-center font-medium text-foreground hover:bg-muted transition-colors',
              isMobile ? 'text-xs h-8' : 'text-sm h-9',
            )}
            startContent={<FiMoreHorizontal className='text-muted-foreground' />}
            onPress={() => router.push('/characters')}>
            {t('more')}
          </Button>
        </div>
        {children}
      </div>
    );
  },
);

CharactersSelector.displayName = 'CharactersSelector';

