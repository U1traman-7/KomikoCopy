/**
 * Character name formatting utilities
 *
 * This module provides utility functions for formatting character names,
 * category names, and converting between different name formats.
 */

export interface SingleCharacter {
  name?: string;
  simple_name?: string;
  character_name?: string;
  uniqid?: string;
  character_uniqid?: string;
  image?: string;
  character_pfp?: string;
  alt_prompt?: string;
}

/**
 * Convert character name to ID format
 *
 * Replaces spaces with underscores while keeping parentheses and other characters.
 *
 * @example
 * convertNameToId("Lumine (Genshin Impact)") // "Lumine_(Genshin_Impact)"
 * convertNameToId("Hu Tao (Genshin Impact)") // "Hu_Tao_(Genshin_Impact)"
 * convertNameToId("Nami (One Piece)") // "Nami_(One_Piece)"
 *
 * @param name - The character name to convert
 * @returns The name with spaces replaced by underscores
 */
export const convertNameToId = (name: string): string => {
  return name.replace(/\s+/g, '_');
};

/**
 * Format category name for display
 *
 * Converts snake_case category names to Title Case for better readability.
 * Handles special cases like articles, prepositions, and possessive apostrophes.
 *
 * @example
 * formatCategoryName("girls'_frontline") // "Girls' Frontline"
 * formatCategoryName("honkai_(series)") // "Honkai (Series)"
 * formatCategoryName("the_legend_of_zelda") // "The Legend of Zelda"
 *
 * @param name - The category name to format
 * @returns The formatted category name in Title Case
 */
export const formatCategoryName = (name: string): string => {
  // If already in title case format (has uppercase letters), return as-is
  if (name !== name.toLowerCase() && name.match(/[A-Z]/)) {
    return name;
  }

  // Convert snake_case to Title Case
  return name
    .split('_')
    .map((word, index) => {
      // Handle special cases - keep lowercase for articles/prepositions (except first word)
      if (
        index > 0 &&
        (word === 'of' ||
          word === 'the' ||
          word === 'and' ||
          word === 'a' ||
          word === 'an')
      ) {
        return word;
      }

      // Handle possessive apostrophes
      if (word.includes("'")) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s*\(\s*/g, ' (') // Fix spacing around parentheses
    .replace(/\s*\)\s*/g, ')')
    .replace(/\s*:\s*/g, ': '); // Fix spacing around colons
};

/**
 * Convert character to prompt format with @ prefix
 *
 * Determines the correct prompt name for a character based on available fields.
 * Priority order:
 * 1. character_uniqid or uniqid (if available)
 * 2. name field (if starts with @)
 * 3. Convert name to ID format and add @ prefix
 *
 * @example
 * getCharacterPromptName({ uniqid: "lumine_123" }) // "@lumine_123"
 * getCharacterPromptName({ name: "@custom_char" }) // "@custom_char"
 * getCharacterPromptName({ name: "Lumine (Genshin Impact)" }) // "@Lumine_(Genshin_Impact)"
 *
 * @param char - The character object
 * @returns The character prompt name with @ prefix
 */
export const getCharacterPromptName = (char: SingleCharacter): string => {
  // Priority 1: Use character_uniqid if available
  if (char.uniqid || char.character_uniqid) {
    const uniqid = (char.uniqid || char.character_uniqid) as string;
    return uniqid.startsWith('@') ? uniqid : '@' + uniqid;
  }

  // Priority 2: For user-created characters, use the name as-is (already has @ prefix)
  if (char.name?.startsWith('@')) {
    return char.name;
  }

  // Priority 3: For official characters, convert name to ID format and add @ prefix
  return '@' + convertNameToId(char.name || '');
};

/**
 * Get display name for a character
 *
 * Returns the most appropriate display name based on available fields.
 * Priority order:
 * 1. simple_name
 * 2. character_name
 * 3. name (without @ prefix if present)
 *
 * @example
 * getCharacterDisplayName({ simple_name: "Lumine" }) // "Lumine"
 * getCharacterDisplayName({ character_name: "Hu Tao" }) // "Hu Tao"
 * getCharacterDisplayName({ name: "@custom_char" }) // "custom_char"
 *
 * @param char - The character object
 * @returns The display name for the character
 */
export const getCharacterDisplayName = (char: SingleCharacter): string => {
  if (char.simple_name) {
    return char.simple_name;
  }

  if (char.character_name) {
    return char.character_name;
  }

  if (char.name) {
    // Remove @ prefix if present
    return char.name.startsWith('@') ? char.name.slice(1) : char.name;
  }

  return '';
};

/**
 * Get image URL for a character
 *
 * Returns the most appropriate image URL based on available fields.
 * Priority order:
 * 1. image
 * 2. character_pfp
 * 3. Default placeholder (empty string if not provided)
 *
 * @example
 * getCharacterImageUrl({ image: "/images/lumine.webp" }) // "/images/lumine.webp"
 * getCharacterImageUrl({ character_pfp: "https://..." }) // "https://..."
 * getCharacterImageUrl({}) // ""
 *
 * @param char - The character object
 * @param defaultImage - The default image URL to use if no image is found
 * @returns The image URL for the character
 */
export const getCharacterImageUrl = (
  char: SingleCharacter,
  defaultImage: string = '',
): string => {
  return char.image || char.character_pfp || defaultImage;
};

/**
 * Normalize character name for comparison
 *
 * Converts a character name to a normalized format for case-insensitive comparison.
 * Removes spaces, special characters, and converts to lowercase.
 *
 * @example
 * normalizeCharacterName("Lumine (Genshin Impact)") // "lumineGenshinimpact"
 * normalizeCharacterName("Hu Tao") // "hutao"
 * normalizeCharacterName("Nami (One Piece)") // "namionePiece"
 *
 * @param name - The character name to normalize
 * @returns The normalized character name
 */
export const normalizeCharacterName = (name: string): string => {
  return name.toLowerCase().replace(/[\s:\-!?.,'"()_]/g, '');
};

/**
 * Normalize a database category string to a stable i18n slug key.
 * Examples:
 *  - "Fate (Series)" -> "fate_series"
 *  - "Girls' Frontline" -> "girls_frontline"
 *  - "ALIEN STAGE: Prologue" -> "alien_stage_prologue"
 */
export const normalizeCategoryToKey = (category: string = ''): string => {
  return (
    (category || '')
      .toLowerCase()
      .trim()
      // Replace all non-alphanumeric characters with underscores
      .replace(/[^a-z0-9]+/g, '_')
      // Collapse multiple underscores
      .replace(/_+/g, '_')
      // Trim leading/trailing underscores
      .replace(/^_|_$/g, '')
  );
};

/**
 * Build the i18n translation key for a category in the create:worlds namespace
 */
export const i18nKeyForCategory = (category: string = ''): string => {
  // Remove "worlds." prefix if it exists (from characters.json)
  const cleanCategory = category.replace(/^worlds\./, '');
  return `create:worlds.${normalizeCategoryToKey(cleanCategory)}`;
};
