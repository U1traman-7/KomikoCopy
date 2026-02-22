/**
 * Vidu Q2 Parameter Processing
 *
 * Handles complex parameter processing for Vidu Q2 Reference-to-Video API
 */

import {
  getCharacterIds,
  getCharacterImagesForVideo,
} from '../../../_utils/characterHelper.js';

export interface ViduQ2ReferenceParams {
  prompt?: string;
  images?: string[];
  imageNames?: string[];
  duration?: number | string;
  resolution?: string;
  aspect_ratio?: string;
  movement_amplitude?: string;
  bgm?: boolean;
  seed?: number;
}

export interface ViduQ2ReferenceResult {
  prompt: string;
  reference_image_urls: string[];
  duration: number;
  resolution: string;
  aspect_ratio: string;
  movement_amplitude: string;
  bgm: boolean;
  seed?: number;
}

/**
 * Deduplicate images by URL (ignoring query string)
 */
const deduplicateImages = (images: string[]): string[] => {
  const seen = new Set<string>();
  return images
    .filter(Boolean)
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0)
    .filter((u: string) => {
      const key = u.split('?')[0];
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};

/**
 * Build character placeholder mapping (Character A, B, C, ...)
 */
const buildCharacterPlaceholders = (
  characterIds: string[],
): Map<string, string> => {
  const placeholders = new Map<string, string>();
  characterIds.forEach((id, index) => {
    const placeholder = `Character ${String.fromCharCode(65 + index)}`;
    placeholders.set(id, placeholder);
  });
  return placeholders;
};

/**
 * Replace @character_id mentions with placeholders in prompt
 */
const replaceCharacterMentions = (
  prompt: string,
  placeholders: Map<string, string>,
): string => {
  let result = prompt;
  placeholders.forEach((placeholder, id) => {
    const regex = new RegExp(
      `@${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'g',
    );
    result = result.replace(regex, placeholder);
  });
  return result;
};

/**
 * Build the final prompt with image context prefix
 */
const buildFinalPrompt = (
  originalPrompt: string,
  characterIds: string[],
  imageNames?: string[],
): string => {
  const placeholders = buildCharacterPlaceholders(characterIds);
  const sanitizedPrompt = replaceCharacterMentions(
    originalPrompt || '',
    placeholders,
  );

  if (imageNames && imageNames.length > 0) {
    // Generated images already incorporate characters, only use imageNames
    const imageList = imageNames
      .map((name: string) => `the image of ${name}`)
      .join(', ');
    return `The input images include ${imageList}. ${sanitizedPrompt}`;
  }

  if (characterIds.length > 0) {
    const imageList = characterIds
      .map(
        (_id, index) =>
          `the image of Character ${String.fromCharCode(65 + index)}`,
      )
      .join(', ');
    return `The input images include ${imageList}. ${sanitizedPrompt}`;
  }

  return sanitizedPrompt;
};

/**
 * Parse and validate parameters for Vidu Q2 Reference-to-Video API
 */
export const parseViduQ2ReferenceParams = async (
  params: ViduQ2ReferenceParams,
): Promise<ViduQ2ReferenceResult> => {
  // Collect images: prioritize generated images over character references
  const characterImages = await getCharacterImagesForVideo(params);
  const generatedImages = params.images || [];

  let allImages: string[];
  if (generatedImages.length > 0) {
    allImages = deduplicateImages(generatedImages);
  } else {
    allImages = deduplicateImages(characterImages);
  }

  // Validate image count
  if (allImages.length < 1) {
    throw new Error('At least 1 image is required (OC or reference image)');
  }
  if (allImages.length > 3) {
    throw new Error('Vidu Q2 Reference supports maximum 3 images');
  }

  // Build final prompt with character context
  const characterIds = getCharacterIds(params.prompt || '');
  const finalPrompt = buildFinalPrompt(
    params.prompt || '',
    characterIds,
    params.imageNames,
  );

  const duration = params.duration ? Number(params.duration) : 4;
  const result: ViduQ2ReferenceResult = {
    prompt: finalPrompt,
    reference_image_urls: allImages,
    duration: duration,
    resolution: params.resolution || '720p',
    aspect_ratio: params.aspect_ratio || '16:9',
    movement_amplitude: 'auto',
    bgm: duration === 4 ? true : false,
  };

  return result;
};
