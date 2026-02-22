import { createSupabase, failed, success } from './_utils/index.js';

/**
 * Internal API for Auto Model feature to fetch alt_prompt information
 * Only returns official characters' alt_prompt data
 * No authentication required since official characters are public
 * 
 * GET /api/getCharacterAltPrompt?ids=id1,id2,id3
 */
export const GET = async (req: Request) => {
  try {
    const supabase = createSupabase();
    const searchParams = new URL(req.url).searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return failed('No character IDs provided');
    }

    const characterIds = idsParam.split(',').filter(Boolean);

    if (characterIds.length === 0) {
      return failed('No character IDs provided');
    }

    // Only fetch official characters with minimal fields needed for Auto Model
    const { data, error } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid, alt_prompt, character_description')
      .in('character_uniqid', characterIds)
      .eq('is_official', true); // Only official characters

    if (error) {
      console.error(
        '[API /getCharacterAltPrompt] Error fetching character alt_prompt:',
        error,
      );
      return failed('Failed to fetch character alt_prompt');
    }

    return success(data || []);
  } catch (error) {
    console.error('[API /getCharacterAltPrompt] Unexpected error:', error);
    return failed(
      'Internal server error: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    );
  }
};

