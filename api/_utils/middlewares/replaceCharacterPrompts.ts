import { createClient } from '@supabase/supabase-js';
import { getCharacterIds } from '../characterHelper.js';
import { isDanbroouModel } from './improvePrompt.js';
import type { MiddlewareResult } from '../withHandler.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * Replace @character_id with alt_prompt or character_description for Anime models
 * For General models, this middleware doesn't modify the prompt
 */
export const replaceCharacterPromptsMiddleware = async (
  request: any,
): Promise<MiddlewareResult> => {

  const params = request.params;

  if (!params) {
    return { success: true };
  }

  const { prompt, originalPrompt, model } = params;

  // Get model from params or URL path
  let currentModel = model;
  if (!currentModel) {
    // Try to infer model from request URL
    const url = request.url || '';
    if (url.includes('generateImageNeta')) {
      currentModel = 'Neta';
    } else if (url.includes('generateImageIllustrious')) {
      currentModel = 'Illustrious';
    } else if (url.includes('generateImageArtPro')) {
      currentModel = 'Art Pro';
    } else if (url.includes('generateImageArtUnlimited')) {
      currentModel = 'Art Unlimited';
    } else if (url.includes('generateImageKusaXL')) {
      currentModel = 'KusaXL';
    } else if (url.includes('generateImageAnimagine')) {
      currentModel = 'Animagine';
    } else if (url.includes('generateImageNoobai')) {
      currentModel = 'Noobai';
    }
  }

  // Only process for Anime/Danbooru models
  if (!currentModel || !isDanbroouModel(currentModel)) {
    return { success: true };
  }

  if (!prompt) {
    return { success: true };
  }

  try {
    // Extract character IDs from prompt
    const characterIds = getCharacterIds(prompt);

    if (characterIds.length === 0) {
      return { success: true };
    }
    request.params.userPrompt = prompt;

    // Fetch character data from database
    const { data: characters, error } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid, alt_prompt, character_description')
      .in('character_uniqid', characterIds);

    if (error) {
      return { success: true };
    }
    const dbCharacters = characters || [];
    const charactersWithoutAltPrompt = dbCharacters.filter(
      char => !char.alt_prompt && !char.character_description,
    );

    if (charactersWithoutAltPrompt.length > 0) {
      // Characters without alt_prompt cannot be used with Anime models
      // They need to use General models (Seedream/Gemini) with reference images
      const errorMessage = `The following characters are not supported by Anime models: ${charactersWithoutAltPrompt.map(c => c.character_uniqid).join(', ')}. These characters don't have text descriptions (alt_prompt) and require a General model like Seedream or Gemini that uses reference images.`;

      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'CHARACTER_NOT_SUPPORTED_BY_ANIME_MODEL',
            message: errorMessage,
            unsupported_characters: charactersWithoutAltPrompt.map(
              c => c.character_uniqid,
            ),
            suggested_model: 'Seedream',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      };
    }

    // Replace each @character_id with alt_prompt or character_description
    let newPrompt = prompt;
    let newOriginalPrompt = originalPrompt || prompt;

    // Process all character IDs (both from database and official characters)
    for (const characterId of characterIds) {
      let replacement = '';

      // Check if this character is in the database
      const dbCharacter = dbCharacters.find(
        char => char.character_uniqid === characterId,
      );

      if (dbCharacter) {
        // Use alt_prompt if available, otherwise use character_description
        replacement =
          dbCharacter.alt_prompt || dbCharacter.character_description || '';
      } else {
        // This is an official character (from characters.json)
        // Convert ID back to name: "Lumine_(Genshin_Impact)" -> "Lumine (Genshin Impact)"
        replacement = characterId.replace(/_/g, ' ');
      }

      if (replacement) {
        // Replace both @character_id and <character_id> formats
        // Use simple string replacement to avoid regex lookahead issues
        // This handles cases like "@Momo_Ayase," and "@Momo_Ayase " correctly
        newPrompt = newPrompt.split(`@${characterId}`).join(replacement);
        newOriginalPrompt = newOriginalPrompt
          .split(`@${characterId}`)
          .join(replacement);

        // Also handle <character_id> format
        newPrompt = newPrompt.split(`<${characterId}>`).join(replacement);
        newOriginalPrompt = newOriginalPrompt
          .split(`<${characterId}>`)
          .join(replacement);
      }
    }


    // Update params with new prompt
    request.params.prompt = newPrompt;
    request.params.originalPrompt = newOriginalPrompt;
  } catch (error) {
    console.error('[replaceCharacterPrompts] Error:', error);
  }

  return { success: true };
};
