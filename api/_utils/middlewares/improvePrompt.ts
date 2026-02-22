import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getCharacterIds } from '../characterHelper.js';
import { GENERAL_STYLES } from '../../_constants.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://komiko.app', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'KomikoAI', // Optional. Site title for rankings on openrouter.ai.
  },
  // apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is not defined in environment variables.',
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isDanbroouModel(model?: string) {
  const models = [
    'Animagine',
    'Art Pro',
    'Art Unlimited',
    'Illustrious',
    'KusaXL',
    'Noobai',
  ];
  return models.includes(model || '');
}

/**
 * Fetch character descriptions for OC characters
 * Returns only characters that have character_description (OC without alt_prompt)
 */
async function fetchOCCharacterDescriptions(
  characterIds: string[],
): Promise<Map<string, string>> {
  if (characterIds.length === 0) {
    return new Map();
  }

  try {
    const { data: characters, error } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid, character_description, alt_prompt')
      .in('character_uniqid', characterIds);

    if (error || !characters) {
      console.error('[fetchOCCharacterDescriptions] Error:', error);
      return new Map();
    }

    const ocMap = new Map<string, string>();

    // Only include characters that have character_description but no alt_prompt (true OCs)
    for (const char of characters) {
      if (char.character_description && !char.alt_prompt) {
        ocMap.set(char.character_uniqid, char.character_description);
      }
    }

    return ocMap;
  } catch (error) {
    console.error('[fetchOCCharacterDescriptions] Error:', error);
    return new Map();
  }
}

/**
 * Improve prompt with OC character context for Danbooru models
 */
export const improvePrompt = async (prompt: string, model: string) => {
  if (!prompt) {
    return '';
  }

  let newPrompt = '';

  if (isDanbroouModel(model)) {
    // Extract character IDs from the prompt
    const characterIds = getCharacterIds(prompt);

    if (characterIds.length > 0) {
      // Fetch OC character descriptions
      const ocDescriptions = await fetchOCCharacterDescriptions(characterIds);

      // If we have OC characters with descriptions, use the enhanced prompt template
      if (ocDescriptions.size > 0) {
        const characterDescriptionLines: string[] = [];

        for (const [charId, description] of ocDescriptions.entries()) {
          characterDescriptionLines.push(
            `Description prompt for @${charId}: "${description}"`,
          );
        }

        newPrompt = `Current user input prompt for image generation: "${prompt}"

${characterDescriptionLines.join('\n')}

Now generate and slightly expand the image generation prompt for danbooru model, use English danbooru tags, use space instead of _ in the danbooru tags, use comma to separate danbooru tags. Directly output the optimized danbooru tags without anything else.`;
      } else {
        // No OC characters, use standard Danbooru prompt
        newPrompt = `Current user input prompt for image generation: "${prompt || ''}"
Optimize and slightly expand from the user prompt, use English danbooru tags, use space instead of _ in the danbooru tags, use comma to separate danbooru tags. When mentioning popular IP characters if any, keep the same way as how the user mention the character. Directly output the optimized danbooru tags without anything else.`;
      }
    } else {
      // No characters mentioned, use standard Danbooru prompt
      newPrompt = `Current user input prompt for image generation: "${prompt || ''}"
Optimize and slightly expand from the user prompt, use English danbooru tags, use space instead of _ in the danbooru tags, use comma to separate danbooru tags. When mentioning popular IP characters if any, keep the same way as how the user mention the character. Directly output the optimized danbooru tags without anything else.`;
    }
  } else {
    // Non-Danbooru models use the original natural language prompt
    newPrompt = `Current user input prompt for image generation: "${prompt || ''}"
Optimize and slightly expand from the user prompt in one or two natural language sentences, use the same language as the user prompt. If there's special phrase wrapped in brackets or square brackets, e.g., <character-id> or @character-id or [style-name], keep them as is: use the exact same characters and keep them in their brackets or square brackets or @something. If there's no special phrase wrapped in brackets or square brackets or @something in the original prompt, don't add any. Directly output the optimized prompt without anything else, use the same language as in the user input.`;
  }

  const response = await openai.chat.completions.create({
    model: 'x-ai/grok-4.1-fast',
    // model: 'chatgpt-4o-latest',
    messages: [
      {
        role: 'user',
        content: newPrompt,
      },
    ],
  });
  return response.choices[0].message.content || '';
};

export function parseStyleToPrompt(prompt: string) {
  const style = prompt.match(/\[.+?\]/)?.[0];
  if (style) {
    return GENERAL_STYLES[style as keyof typeof GENERAL_STYLES] || '';
  }
  return '';
}

/** Check if text is primarily English/ASCII (< 20% non-ASCII characters) */
function isEnglishText(text: string): boolean {
  const cleaned = text.replace(/\[.*?\]/g, '').trim();
  if (!cleaned) {
    return true;
  }
  const nonAsciiCount = (cleaned.match(/[^\u0020-\u007E]/g) || []).length;
  return nonAsciiCount / cleaned.length < 0.2;
}

/** Translate text to English using Google Translate (no API key required, no content filtering) */
async function translateWithGoogle(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return '';
    }
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return '';
    }
    return (data[0] as any[])
      .map((item: any[]) => item[0])
      .filter(Boolean)
      .join('');
  } catch (e) {
    console.error('[improvePrompt] Google Translate failed', e);
    return '';
  }
}

/**
 * Improve prompt with retry and language-aware fallback.
 * - Retries once if AI returns empty (e.g. content refusal)
 * - Falls back to original prompt if English, or Google Translate if non-English
 */
export const improvePromptWithFallback = async (
  newPrompt: string,
  originalPrompt: string,
  model: string,
): Promise<string> => {
  let result = '';
  try {
    result = await improvePrompt(newPrompt, model);
    if (!result) {
      console.warn('[improvePrompt] First attempt empty, retrying...');
      result = await improvePrompt(newPrompt, model);
    }
  } catch (e) {
    console.error('[improvePrompt] API error, falling back', e);
  }

  if (!result) {
    console.warn('[improvePrompt] Retry also empty, using language fallback');
    if (isEnglishText(originalPrompt)) {
      console.log('[improvePrompt] English detected, using original prompt');
      return originalPrompt;
    }
    console.log('[improvePrompt] Non-English detected, translating via Google');
    return (await translateWithGoogle(originalPrompt)) || originalPrompt;
  }

  return result;
};

export const generatePromptMiddleware =
  (model: string) => async (request: any) => {
    const shouldImprovePrompt = request.params?.improve_prompt;
    if (!shouldImprovePrompt) {
      console.log('no improve prompt');
      return { success: true };
    }
    const prompt = request.params?.prompt;
    try {
      const stylePrompt = /\[(.+?)\]/g.exec(prompt)?.[0];
      let newPrompt = prompt;
      if (stylePrompt) {
        newPrompt = prompt.replace(stylePrompt, ' ');
        newPrompt = `${newPrompt} ${parseStyleToPrompt(prompt)}`;
      }
      // Strip style tag from fallback prompt to avoid duplication when re-appended below
      const originalPromptForFallback = stylePrompt
        ? prompt.replace(stylePrompt, '').trim()
        : prompt;
      const improvedPrompt = await improvePromptWithFallback(
        newPrompt,
        originalPromptForFallback,
        model,
      );
      console.log(
        'improvedPrompt:',
        improvedPrompt,
        'originalPrompt:',
        prompt,
        'styledPrompt:',
        newPrompt,
      );

      // Preserve negative_prompt when updating params
      const { negative_prompt } = request.params;
      Object.assign(request.params, {
        prompt: improvedPrompt + (stylePrompt ? ` ${stylePrompt}` : ''),
        originalPrompt: request.params.originalPrompt ?? prompt,
        negative_prompt,
      });
      return { success: true };
    } catch (error) {
      console.error('Error improving prompt:', error);
      return { success: true };
    }
  };
