import { createSupabase } from './index.js';

/**
 * Extract character IDs from prompt
 * Supports both @character-id (new) and <character-id> (old) formats
 * Extracts character IDs (alphanumeric, underscore, hyphen, parentheses, period)
 */
export const getCharacterIds = (prompt: string): string[] => {
  // Support both old <xx> format and new @xx format
  // Match alphanumeric characters, underscores, hyphens, parentheses, and periods
  // e.g., @Isabelle_(Animal_Crossing), @Mr._C.B._(Umamusume), @Momo_Ayase
  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const characterIds: string[] = [];
  let match = reg.exec(prompt);
  while (match) {
    // match[1] is for @xx format, match[2] is for <xx> format
    characterIds.push(match[1] || match[2]);
    match = reg.exec(prompt);
  }
  return characterIds;
};

/**
 * Fetch character images from database
 * Returns character images in the same order as characterIds
 * For official characters (not in database), returns empty array
 */
export const fetchCharacterImages = async (
  characterIds: string[],
): Promise<string[]> => {
  if (characterIds.length === 0) return [];

  const supabase = createSupabase();
  const { data, error } = await supabase
    .from('CustomCharacters')
    .select('character_pfp,character_uniqid')
    .in('character_uniqid', characterIds);

  if (error) {
    console.error('Error fetching character images:', error);
    throw new Error('Failed to fetch character images');
  }


  if (!data || data.length === 0) {
    console.log(
      'No character data found for IDs (might be official characters):',
      characterIds,
    );
    return [];
  }

  // Return character images in the same order as characterIds
  const pfpMap = new Map(data.map(c => [c.character_uniqid, c.character_pfp]));
  return characterIds
    .map(id => pfpMap.get(id))
    .filter((pfp): pfp is string => !!pfp);
};

/**
 * Process character mention in params
 * Priority:
 * 1. Use params.image if provided (frontend already has the image)
 * 2. Use params.characterImages if provided (frontend passed OC images)
 * 3. Fetch from database using character IDs in prompt (fallback)
 */
export const processCharacterMention = async (
  params: any,
): Promise<string> => {
  // Priority 1: If image is already provided, return it
  if (params.image) {
    return params.image;
  }

  // Priority 2: If frontend passed character images, use the first one
  if (params.characterImages && params.characterImages.length > 0) {
    return params.characterImages[0];
  }

  // Priority 3: Extract character IDs from prompt and fetch from database
  const characterIds = getCharacterIds(params.prompt || '');
  if (characterIds.length === 0) {
    throw new Error('No image or character mention found');
  }

  // Fetch character images from database
  const characterImages = await fetchCharacterImages(characterIds);
  if (characterImages.length === 0) {
    throw new Error(
      'No character images found. For official characters, please pass characterImages from frontend.',
    );
  }

  // Return the first character image
  return characterImages[0];
};

/**
 * Get character images for video generation
 * Priority:
 * 1. Use params.characterImages if provided (frontend passed OC images)
 * 2. Fetch from database using character IDs in prompt (fallback)
 */
export const getCharacterImagesForVideo = async (
  params: any,
): Promise<string[]> => {
  // Priority 1: If frontend passed character images, use them
  if (params.characterImages && params.characterImages.length > 0) {
    return params.characterImages;
  }

  // Priority 2: Extract character IDs from prompt and fetch from database
  const characterIds = getCharacterIds(params.prompt || '');
  if (characterIds.length === 0) {
    return [];
  }

  // Fetch character images from database
  return await fetchCharacterImages(characterIds);
};

export const getCharacterData = async (
  searchColumn: 'character_uniqid' | 'character_pfp',
  searchValue: string,
  targetColumn: 'character_name' | 'character_pfp' | 'character_uniqid',
) => {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from('CustomCharacters')
    .select(targetColumn)
    .eq(searchColumn, searchValue);

  if (error) {
    console.error(`Error fetching ${targetColumn} by ${searchColumn}:`, error);
    throw new Error(`Failed to fetch ${targetColumn}`);
  }

  return data?.[0]?.[targetColumn];
};

export const getCharacterName = async (
  characterUniqid?: string,
  characterImageURL?: string,
) => {
  if (characterUniqid) {
    return getCharacterData(
      'character_uniqid',
      characterUniqid,
      'character_name',
    );
  }
  if (characterImageURL) {
    return getCharacterData(
      'character_pfp',
      characterImageURL,
      'character_name',
    );
  }
  return undefined;
};
