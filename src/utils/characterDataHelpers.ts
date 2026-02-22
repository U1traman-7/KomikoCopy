/**
 * Character data helper utilities for RightSidebar
 */

import { normalizeCategoryToKey } from './characterNameUtils';

export interface CharacterData {
  world: string;
  key: string;
  characters: any[];
}

export interface UserCharacterCategories {
  recent?: CharacterData | null;
  myCharacters?: CharacterData | null;
  adopted?: CharacterData | null;
}

/**
 * Fetch all official characters from the API in batches
 * The API has a limit of 200 characters per request when using sort=name
 */
export async function fetchAllOfficialCharacters(): Promise<any[]> {
  const allCharacters: any[] = [];
  let offset = 0;
  const batchSize = 200;

  try {
    while (true) {
      const response = await fetch(
        `/api/characters?official=true&limit=${batchSize}&offset=${offset}&sort=name`,
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`,
        );
      }

      const batchRes = await response.json();

      if (batchRes?.code === 1 && batchRes?.data?.characters) {
        const batchCharacters = batchRes.data.characters;
        allCharacters.push(...batchCharacters);

        // Check if we've fetched all characters
        if (
          batchCharacters.length < batchSize ||
          allCharacters.length >= (batchRes.data.total || 0)
        ) {
          break;
        }

        offset += batchSize;
      } else {
        break;
      }
    }

    return allCharacters;
  } catch (error) {
    console.error('[fetchAllOfficialCharacters] Error:', error);
    return [];
  }
}

/**
 * Create a map of static character images for merging with database data
 */
export function createStaticImageMap(
  rawCharactersData: any[],
): Map<string, { image: string; alt_prompt: string }> {
  const staticImageMap = new Map<
    string,
    { image: string; alt_prompt: string }
  >();

  rawCharactersData.forEach((world: any) => {
    (world.characters || []).forEach((char: any) => {
      const normalizedName = (char.simple_name || char.name)
        .toLowerCase()
        .replace(/[\s:\-!?.,'"()_]/g, '');

      if (char.image && char.image.startsWith('/images/')) {
        staticImageMap.set(normalizedName, {
          image: char.image,
          alt_prompt: char.name,
        });
      }
    });
  });

  return staticImageMap;
}

/**
 * Convert database characters to CharacterData format, grouped by world
 */
export function convertDbCharactersToCharacterData(
  dbCharacters: any[],
  staticImageMap: Map<string, { image: string; alt_prompt: string }>,
): CharacterData[] {
  const charactersData: CharacterData[] = [];

  for (const char of dbCharacters) {
    const world = char.category || 'Other';

    // Check if this character has a local image in static data
    const normalizedName = (char.character_name || '')
      .toLowerCase()
      .replace(/[\s:\-!?.,'"()_]/g, '');
    const staticData = staticImageMap.get(normalizedName);

    const character = {
      ...char,
      name: char.alt_prompt || char.character_name,
      simple_name: char.character_name,
      image: staticData?.image || char.character_pfp,
      uniqid: char.character_uniqid,
    };

    // Insert character into the corresponding world
    const worldIndex = charactersData.findIndex(
      worldData => worldData.world === world,
    );

    if (worldIndex === -1) {
      charactersData.push({
        world,
        key: normalizeCategoryToKey(world),
        characters: [character],
      });
    } else {
      charactersData[worldIndex].characters.push(character);
    }
  }

  return charactersData;
}

/**
 * Merge and sort character data with static data
 * - Existing categories (in static data) are sorted by static order
 * - New categories (DB only) are sorted alphabetically
 * - General is always first
 */
export function mergeAndSortCharacterData(
  charactersData: CharacterData[],
  rawCharactersData: any[],
): CharacterData[] {
  const staticWorldNames = new Set(
    rawCharactersData.map(w => w.world.toLowerCase().trim()),
  );

  const existingCategories: CharacterData[] = [];
  const newCategories: CharacterData[] = [];

  // Merge duplicate worlds
  const worldMap = new Map<string, CharacterData>();
  for (const worldData of charactersData) {
    const normalizedWorld = worldData.world.toLowerCase().trim();

    if (worldMap.has(normalizedWorld)) {
      const existing = worldMap.get(normalizedWorld)!;
      existing.characters.push(...worldData.characters);
    } else {
      worldMap.set(normalizedWorld, { ...worldData });
    }
  }

  // Categorize merged worlds
  for (const worldData of worldMap.values()) {
    const normalizedWorld = worldData.world.toLowerCase().trim();

    if (staticWorldNames.has(normalizedWorld)) {
      existingCategories.push(worldData);
    } else {
      newCategories.push(worldData);
    }
  }

  // Add static worlds not in DB
  for (const staticWorld of rawCharactersData) {
    const normalizedStatic = staticWorld.world.toLowerCase().trim();
    if (!worldMap.has(normalizedStatic)) {
      existingCategories.push(staticWorld);
    }
  }

  // Sort existing categories by static data order
  const staticOrder = rawCharactersData.map(w =>
    w.world.toLowerCase().trim(),
  );
  existingCategories.sort((a, b) => {
    const aIndex = staticOrder.indexOf(a.world.toLowerCase().trim());
    const bIndex = staticOrder.indexOf(b.world.toLowerCase().trim());
    return aIndex - bIndex;
  });

  // Sort new categories alphabetically
  newCategories.sort((a, b) => a.world.localeCompare(b.world));

  // Combine: existing first, then new
  let result = [...existingCategories, ...newCategories];

  // Ensure General is always first
  result = ensureGeneralFirst(result);

  // Move "Spot Zero" to second position if it exists
  const spotZeroIndex = result.findIndex(
    data => data.world === 'Spot Zero' || data.key === 'spot_zero',
  );
  if (spotZeroIndex > 1) {
    const spotZero = result.splice(spotZeroIndex, 1)[0];
    result.splice(1, 0, spotZero);
  }

  return result;
}

/**
 * Create My Characters data from owned characters array
 * Used with cached data from useOwnedCharacters hook
 */
export function createMyCharactersData(
  ownedCharacters: any[],
  t: (key: string) => string,
): CharacterData {
  const ownedOnly = Array.isArray(ownedCharacters)
    ? ownedCharacters.filter((char: any) => char.is_owned === true)
    : [];

  const charDataFilter = ownedOnly.map((char: any) => ({
    name: `@${char.character_uniqid}`,
    simple_name: char.character_name,
    image: char.character_pfp,
  }));

  return {
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
}

/**
 * Fetch user's owned characters and create CharacterData
 * @deprecated Use createMyCharactersData with useOwnedCharacters hook instead
 */
export async function fetchOwnedCharacters(
  t: (key: string) => string,
): Promise<CharacterData> {
  try {
    const ownedRes = await fetch('/api/getOwnedCharacters');
    const ownedChars = await ownedRes.json();

    return createMyCharactersData(ownedChars, t);
  } catch (error) {
    console.error('[fetchOwnedCharacters] Error:', error);
    // Return empty My Characters on error
    return {
      world: t('my_characters'),
      key: 'my_characters',
      characters: [
        {
          name: '@new_character',
          simple_name: t('character:new_character'),
          image: '/images/new_character.webp',
        },
      ],
    };
  }
}

/**
 * Create Recent Characters data from recent characters list
 */
export function createRecentCharactersData(
  recentCharacters: any[],
  t: (key: string) => string,
): CharacterData | null {
  if (recentCharacters.length === 0) {
    return null;
  }

  // Filter out characters without valid character_uniqid to avoid @undefined
  const validCharacters = recentCharacters
    .filter((char: any) => char.character_uniqid)
    .map((char: any) => ({
      name: `@${char.character_uniqid}`,
      simple_name: char.character_name,
      image: char.character_pfp,
      uniqid: char.character_uniqid,
    }));

  // If no valid characters after filtering, return null
  if (validCharacters.length === 0) {
    return null;
  }

  return {
    world: t('recently_used'),
    key: 'recent_characters',
    characters: validCharacters,
  };
}

/**
 * Create Adopted Characters data from adopted characters array
 * Used with cached data from useAdoptedCharacters hook
 */
export function createAdoptedCharactersData(
  adoptedCharacters: any[],
  t: (key: string) => string,
): CharacterData | null {
  if (!Array.isArray(adoptedCharacters) || adoptedCharacters.length === 0) {
    return null;
  }

  return {
    world: t('adopted_characters'),
    key: 'adopted_characters',
    characters: adoptedCharacters.map((char: any) => ({
      name: char.name || `@${char.character_uniqid}`,
      simple_name: char.simple_name || char.character_name,
      image: char.image || char.character_pfp,
      uniqid: char.character_uniqid,
    })),
  };
}

/**
 * Fetch user's adopted/collected characters
 * @deprecated Use createAdoptedCharactersData with useAdoptedCharacters hook instead
 */
export async function fetchAdoptedCharacters(
  t: (key: string) => string,
): Promise<CharacterData | null> {
  try {
    const adoptedRes = await fetch('/api/getCollectedCharacters');
    const adoptedChars = await adoptedRes.json();

    return createAdoptedCharactersData(adoptedChars, t);
  } catch (error) {
    console.error('[fetchAdoptedCharacters] Error:', error);
    return null;
  }
}

/**
 * Insert user character categories (Recent, My Characters, Adopted) into the character data array
 * in the correct order after General.
 *
 * Order: General -> Recently Used -> My Characters -> Adopted Characters -> (IP collections)
 *
 * @param charactersData - The base character data array
 * @param categories - User character categories to insert
 * @returns New array with user categories inserted
 */
export function insertUserCharacterCategories(
  charactersData: CharacterData[],
  categories: UserCharacterCategories,
): CharacterData[] {
  const { recent, myCharacters, adopted } = categories;

  // Create a copy to avoid mutation
  const result = [...charactersData];

  // Find General category index
  const generalIndex = result.findIndex(
    data => data.world === 'General' || data.key === 'general',
  );

  // Insert right after General (or at the beginning if General doesn't exist)
  const insertIndex = generalIndex >= 0 ? generalIndex + 1 : 0;

  // Collect categories to insert in order: Recent -> My Characters -> Adopted
  const toInsert: CharacterData[] = [];

  if (recent) {
    toInsert.push(recent);
  }

  if (myCharacters) {
    toInsert.push(myCharacters);
  }

  if (adopted) {
    toInsert.push(adopted);
  }

  // Insert all at once
  if (toInsert.length > 0) {
    result.splice(insertIndex, 0, ...toInsert);
  }

  return result;
}

/**
 * Update existing character data by inserting or updating user categories.
 * This function checks if categories already exist and handles updates intelligently.
 *
 * @param charactersData - Current character data array
 * @param categories - User character categories to insert/update
 * @returns Updated array with user categories
 */
export function updateUserCharacterCategories(
  charactersData: CharacterData[],
  categories: UserCharacterCategories,
): CharacterData[] {
  const { recent, myCharacters, adopted } = categories;

  // Remove existing user categories first
  let result = charactersData.filter(
    data =>
      data.key !== 'recent_characters' &&
      data.key !== 'my_characters' &&
      data.key !== 'adopted_characters',
  );

  // Then insert them in the correct order
  return insertUserCharacterCategories(result, categories);
}

/**
 * Check if a category exists in the character data array
 *
 * @param charactersData - Character data array to search
 * @param key - Category key to look for
 * @returns True if the category exists
 */
export function hasCategoryKey(
  charactersData: CharacterData[],
  key: string,
): boolean {
  return charactersData.some(data => data.key === key);
}

/**
 * Find the index of a category in the character data array
 *
 * @param charactersData - Character data array to search
 * @param key - Category key to look for
 * @returns Index of the category, or -1 if not found
 */
export function findCategoryIndex(
  charactersData: CharacterData[],
  key: string,
): number {
  return charactersData.findIndex(data => data.key === key);
}

/**
 * Remove a category from the character data array
 *
 * @param charactersData - Character data array
 * @param key - Category key to remove
 * @returns New array without the specified category
 */
export function removeCategoryByKey(
  charactersData: CharacterData[],
  key: string,
): CharacterData[] {
  return charactersData.filter(data => data.key !== key);
}

/**
 * Ensure General category is always first in the array
 *
 * @param charactersData - Character data array
 * @returns Array with General category moved to the front
 */
export function ensureGeneralFirst(
  charactersData: CharacterData[],
): CharacterData[] {
  const generalIndex = charactersData.findIndex(
    data => data.world === 'General',
  );

  if (generalIndex <= 0) {
    // Already first or doesn't exist
    return charactersData;
  }

  const result = [...charactersData];
  const [generalData] = result.splice(generalIndex, 1);
  result.unshift(generalData);

  return result;
}

