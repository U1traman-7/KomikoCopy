import { generateMultiImagePrompt } from './imageStitching.js';
import { processCharacterMention } from './characterHelper.js';
import { getEffectInfo } from '../tools/_effectPrompts.js';
import { translate } from './middlewares/translate.js';

/**
 * 翻译模板 prompt，统一处理 no_translate 标志和异常降级
 * @param prompt - 待翻译的 prompt
 * @param params - 包含 no_translate 标志的参数对象
 * @returns 翻译后的 prompt，翻译失败时返回原始 prompt
 */
export async function translateTemplatePrompt(
  prompt: string,
  params: { no_translate?: boolean; meta_data?: { no_translate?: boolean } },
): Promise<string> {
  const noTranslate = params.no_translate || params.meta_data?.no_translate;
  if (noTranslate) return prompt;

  try {
    const translated = await translate(prompt);
    return translated || prompt;
  } catch {
    return prompt;
  }
}

// Standard metadata fields that are not template inputs
// This list should include all system/generation-related fields
export const STANDARD_META_FIELDS = new Set([
  'style_id',
  'mode',
  'duration',
  'aspect_ratio',
  'resolution',
  'need_middleware',
  'model',
  'tool',
  'created_at',
  'updated_at',
  'user_id',
  'cost',
  'frames_per_second',
  'seed',
  'multi_shots',
  'audio',
  'enable_safety_checker',
  'movement_amplitude',
  'bgm',
  'image_size',
  'no_translate',
  'video_pipeline_type',
]);

/**
 * Extracts template input fields from metadata by filtering out standard system fields
 * @param metaData - The metadata object containing both system and template fields
 * @returns Object containing only the template input fields
 */
export const extractTemplateInputs = (
  metaData: Record<string, any> = {},
): Record<string, any> => {
  const templateInputs: Record<string, any> = {};

  Object.keys(metaData).forEach(key => {
    if (
      !STANDARD_META_FIELDS.has(key) &&
      metaData[key] != null &&
      metaData[key] !== ''
    ) {
      templateInputs[key] = metaData[key];
    }
  });

  return templateInputs;
};

/**
 * Helper function for video models to prepare common params
 * Handles: multiple images, multi-image prompt, character mentions, and optionally effect mode
 */
export async function prepareVideoParams(
  params: any,
  options?: { handleEffectMode?: boolean; shouldTranslate?: boolean },
) {
  let imageUrl = params.image;
  let prompt = params.prompt;

  // Handle multiple images from array (use first image)
  if (params.images && params.images.length > 0) {
    imageUrl = params.images[0];
  }

  // Generate multi-image prompt for browser-stitched images
  // Frontend stitches multiple images in browser and sends imageNames
  if (imageUrl && params.imageNames && params.imageNames.length > 0) {
    prompt = generateMultiImagePrompt(params.imageNames, params.prompt);
  }

  // Process character mention
  if (!imageUrl) {
    imageUrl = await processCharacterMention(params);
  }

  // Handle effect mode prompt (only for models used in video templates)
  if (
    options?.handleEffectMode &&
    (params.meta_data?.mode === 'effect' ||
      params.meta_data?.mode === 'template') &&
    params.meta_data?.style_id
  ) {
    // Extract all template inputs from metadata (not just characterName)
    const templateInputs = extractTemplateInputs(params.meta_data);

    const effectInfo = await getEffectInfo(
      params.meta_data.style_id,
      templateInputs,
    );

    if (effectInfo?.prompt) {
      prompt = effectInfo.prompt;

      // Translate the template prompt if needed
      if (options?.shouldTranslate) {
        prompt = await translateTemplatePrompt(prompt, params);
      }
    }
  }

  return { imageUrl, prompt };
}
