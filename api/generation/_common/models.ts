import {
  ModelIds,
  TASK_TYPES,
  TaskTypes,
  KUSA_STYLES,
} from '../../_constants.js';
import {
  calculateImageToAnimationCost,
  calculateTextToVideoCost,
  calculateVideoToVideoGenerationCost,
  calculateVideoUpscaleCost,
  IMAGE_TO_ANIMATION_MJ_VIDEO,
  IMAGE_ILLUSTRIOUS,
  IMAGE_ANIMAGINE_XL_3_1,
  IMAGE_FLUX_KONTEXT,
  IMAGE_NOOBAI_XL,
  IMAGE_SEEDREAM,
  IMAGE_SEEDREAM_V4,
  ImageToVideoModel,
  IN_BETWEEN,
  TextToVideoModel,
  TextToVideoStyle,
  VIDEO_INTERPOLATION,
  VIDEO_STYLE_TO_PROMPT,
  IMAGE_GEMINI_3_PREVIEW,
  IMAGE_GEMINI,
  IMAGE_ART_PRO,
  IMAGE_KUSAXL,
} from '../../tools/_zaps.js';
import { getEffectInfo, type EffectInfo } from '../../tools/_effectPrompts.js';
import {
  getStyleInfo,
  type StyleInfo,
} from '../../tools/_styleTransferPrompts.js';
import { generateMultiImagePrompt } from '../../_utils/imageStitching.js';
import {
  getCharacterIds,
  processCharacterMention,
} from '../../_utils/characterHelper.js';
import {
  prepareVideoParams,
  translateTemplatePrompt,
  extractTemplateInputs,
} from '../../_utils/videoHelper.js';
import { replaceCharacterId } from '../../_utils/index.js';
import { parseViduQ2ReferenceParams } from './_paramHandlers/viduQ2Params.js';

import { generateWithGemini } from '../../_utils/gemini.js';
import {
  processVideoPipeline,
  getVideoPipelineExtraCost,
} from './videoPipeline.js';
import { translate } from '../../_utils/middlewares/translate.js';
import {
  improvePromptWithFallback,
  parseStyleToPrompt,
  isDanbroouModel,
} from '../../_utils/middlewares/improvePrompt.js';
import { createClient } from '@supabase/supabase-js';

// Type definitions for PromptMiddlewareProcessor
interface GenerationMetaData {
  need_middleware?: boolean;
  style_id?: string;
  [key: string]: any;
}

interface GenerationParams {
  meta_data?: GenerationMetaData;
  style_id?: string;
  prompt?: string;
  image?: string;
  [key: string]: any;
}

type PromptInfo = StyleInfo | EffectInfo | null;

type FallbackStyleFunction = (styleId: any) => string;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// STANDARD_META_FIELDS 和 extractTemplateInputs 从 videoHelper.ts 统一导入

/**
 * Universal middleware processor for handling prompt enhancement and template processing
 */
class PromptMiddlewareProcessor {
  /**
   * Process prompt with middleware enhancement if needed
   * @param params - Generation parameters
   * @param fallbackStyleFunction - Function to generate style prompt (optional)
   * @returns Enhanced or processed prompt
   */
  static async processPrompt(
    params: GenerationParams,
    fallbackStyleFunction?: FallbackStyleFunction,
  ): Promise<string> {
    // Check if middleware processing is required
    if (params.meta_data?.need_middleware === true) {
      try {
        console.log(
          '[MiddlewareProcessor] Processing prompt with middleware...',
        );
        const templateInputs = extractTemplateInputs(params.meta_data);
        const styleId = params.meta_data?.style_id || 'default';

        // Try to get prompt info from different sources
        const promptInfo = await this.getPromptInfo(styleId, templateInputs);

        if (promptInfo?.prompt) {
          let promptToEnhance = promptInfo.prompt;

          // Translate template prompt before Gemini enhancement if needed
          promptToEnhance = await translateTemplatePrompt(
            promptToEnhance,
            params,
          );

          // Use Gemini to enhance the prompt
          const enhancedPrompt = await generateWithGemini(
            promptToEnhance,
            params.image, // Pass image if available
          );
          console.log('[MiddlewareProcessor] Prompt enhanced successfully');
          return enhancedPrompt;
        }
      } catch (error) {
        console.warn(
          '[MiddlewareProcessor] Middleware processing failed:',
          error,
        );
        // Fallback to original processing
      }
    }

    // Standard processing: use fallback style function or direct prompt
    if (fallbackStyleFunction && params.style_id) {
      const stylePrompt = fallbackStyleFunction(params.style_id);
      return stylePrompt
        ? `${params.prompt}. ${stylePrompt}`
        : params.prompt || '';
    }

    return params.prompt || '';
  }

  /**
   * Try to get prompt info from various sources (effect, style, etc.)
   * @param styleId - Style ID to look up
   * @param templateInputs - Template input variables
   * @returns Prompt information object
   */
  private static async getPromptInfo(
    styleId: string,
    templateInputs: Record<string, any>,
  ): Promise<PromptInfo> {
    // Try effect info first (for video effects)
    const effectInfo = await this.tryFetchPromptInfo(
      getEffectInfo,
      'effect info',
      styleId,
      templateInputs,
    );
    if (effectInfo) {
      return effectInfo;
    }

    // Try style info (for style transfer)
    const styleInfo = await this.tryFetchPromptInfo(
      getStyleInfo,
      'style info',
      styleId,
      templateInputs,
    );
    if (styleInfo) {
      return styleInfo;
    }

    console.warn(
      '[MiddlewareProcessor] No prompt info found for style:',
      styleId,
    );
    return null;
  }

  /**
   * Generic helper to try fetching prompt info from a given source
   * @param fetchFunction - Function to fetch the info
   * @param infoType - Description for logging purposes
   * @param styleId - Style ID to look up
   * @param templateInputs - Template input variables
   * @returns Prompt info if found and valid, null otherwise
   */
  private static async tryFetchPromptInfo(
    fetchFunction: (
      styleId: string,
      templateInputs: Record<string, any>,
    ) => Promise<any>,
    infoType: string,
    styleId: string,
    templateInputs: Record<string, any>,
  ): Promise<PromptInfo> {
    try {
      const info = await fetchFunction(styleId, templateInputs);
      if (info?.prompt) {
        console.log(`[MiddlewareProcessor] Found ${infoType} for:`, styleId);
        return info;
      }
    } catch (error) {
      console.log(`[MiddlewareProcessor] No ${infoType} found for:`, styleId);
    }
    return null;
  }

  /**
   * Check if middleware processing is needed
   * @param params - Generation parameters
   * @returns True if middleware processing is required
   */
  static needsMiddleware(params: GenerationParams): boolean {
    return params.meta_data?.need_middleware === true;
  }

  /**
   * Extract template inputs from metadata
   * @param metaData - Metadata object
   * @returns Template input fields
   */
  static extractTemplateInputs(
    metaData: GenerationMetaData = {},
  ): Record<string, any> {
    return extractTemplateInputs(metaData);
  }
}

export type GenerationModel =
  | 'replicate'
  | 'fal'
  | 'openai'
  | 'deer'
  | 'luma'
  | 'runway'
  | 'gemini'
  | 'ark' // 火山方舟
  | 'wavespeed'
  | 'kie' // KIE AI
  | 'kusa'; // KUSA API

export type FallbackFailureInfo = { failure?: string; failureCode?: string };

export type FallbackParamsOverride =
  | Record<string, any>
  | ((params: Record<string, any>) => Record<string, any>);

export interface ModelFallbackConfig {
  modelId: number;
  paramsOverride?: FallbackParamsOverride;
  shouldFallback?: (failureInfo?: FallbackFailureInfo) => boolean;
}

export interface AIModel {
  name: string;
  platform: GenerationModel;
  type: TaskTypes;
  parseParams: (params: any) => any | Promise<any>;
  originalCode?: number;
  cost: (params: any) => number | Promise<number>;
  alias?: string | ((params: any) => string);
  upgradeToModelByInput?: (params: any) => number;
  fallback?: ModelFallbackConfig;
}

// const parseParamsStr = (params: any) => {
//   const resolutionParamsStr = params.resolution
//     ? `--rs ${params.resolution}`
//     : '';
//   const durationParamsStr = params.duration ? `--dur ${params.duration}` : '';
//   const aspectRatioParamsStr = params.aspect_ratio
//     ? `--rt ${params.aspect_ratio}`
//     : '';
//   return `${resolutionParamsStr} ${durationParamsStr} ${aspectRatioParamsStr}`;
// };

const parseTextToVideoStyle = (style_id: TextToVideoStyle) =>
  VIDEO_STYLE_TO_PROMPT[style_id] || '';

export const RAYFLASH_MAX_DURATION = 15;
export const ACT_TWO_MAX_DURATION = 30;
export const ACT_TWO_MIN_DURATION = 3;
export const ACT_TWO_MAX_SIZE = 32;

// Helper function to normalize dimensions to be divisible by 8
const normalizeDimension = (dimension: number): number =>
  Math.floor(dimension / 8) * 8;

const parseSeedreamSize = (size: any) => {
  let imageSize = {
    width: 1024,
    height: 1024,
  };
  if (!size) {
    return { imageSize };
  }
  if (size === 'square') {
    imageSize = { width: 1024, height: 1024 };
  } else if (size === 'landscape') {
    imageSize = { width: 768, height: 1024 };
  } else if (size === 'portrait') {
    imageSize = { width: 1024, height: 768 };
  } else if (size?.width && size?.height) {
    imageSize = { width: size.width, height: size.height };
  }
  return { imageSize };
};

const parseSeedreamPrompt = async (params: any) => {
  await generatePrompt('Seedream', params);
  await replaceCharacterPrompts('Seedream', params);

  const prompt = params.prompt;
  const initImages: string[] = [...(params.init_images || [])];

  const characterIds = getCharacterIds(prompt);
  if (characterIds?.length) {
    try {
      const { data: characterData } = await supabase
        .from('CustomCharacters')
        .select('character_pfp,character_uniqid')
        .in('character_uniqid', characterIds);
      characterIds.forEach(id => {
        const character = characterData?.find(d => d.character_uniqid === id);
        if (character?.character_pfp) {
          initImages.push(character.character_pfp);
        }
      });
    } catch (error) {
      console.error('Seedream character fetch error', error);
    }
  }

  const referenceImagesPrompt = initImages
    .map(
      (_: any, index: number) =>
        `Input image ${index + 1} is a reference image named "reference_${
          index + 1
        }". When the prompt mentions "reference_${index + 1}" or <reference_${
          index + 1
        }>, it refers to this specific reference image. The generated image should incorporate elements from this reference image as specified in the prompt.`,
    )
    .join('\n');

  let characterRefPrompt = '';
  if (characterIds?.length) {
    characterRefPrompt = characterIds
      .map(
        (id: string, index: number) =>
          `Input image ${index + 1} is the portrait of character <${id}>.`,
      )
      .join('\n');
    if (characterRefPrompt) {
      characterRefPrompt = `${characterRefPrompt}
    The generated image should keep the same identity, appearance, facial features, clothing of the input character images.`;
    }
  }

  const stylePrompt = parseStyleToPrompt(prompt ?? params.originalPrompt);
  const newPrompt = (prompt ?? '').replace(/\[.+?\]/g, '');
  const finalPrompt = `${referenceImagesPrompt ? `${referenceImagesPrompt}\n` : ''}${
    characterRefPrompt ? `${characterRefPrompt}\n` : ''
  }Generate a high quality image with the following prompt: ${newPrompt}${
    stylePrompt ? ` ${stylePrompt}` : ''
  }`;

  Object.assign(params, {
    prompt: finalPrompt,
    originalPrompt: params.originalPrompt || prompt,
    init_images: initImages,
  });

  return {
    prompt: finalPrompt,
    initImages,
  };
};

const translatePrompt = async (params: any) => {
  const prompt = params.prompt;
  let originalPrompt = params.originalPrompt || params.prompt;

  // Apply translate middleware logic
  const noTranslate = params.no_translate;
  const acceptLanguage = params.accept_language; // Can be passed from request
  if (
    !noTranslate &&
    prompt &&
    acceptLanguage &&
    !acceptLanguage.match(/^en/)
  ) {
    try {
      const translatedPrompt = await translate(prompt);
      originalPrompt = prompt;
      Object.assign(params, {
        prompt: translatedPrompt,
        originalPrompt,
      });
    } catch (error) {
      console.error('Error translating prompt:', error);
    }
  }
};

export const generatePrompt = async (model: string, params: any) => {
  const prompt = params.prompt;
  if (params.improve_prompt && prompt) {
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
      Object.assign(params, {
        prompt: improvedPrompt + (stylePrompt ? ` ${stylePrompt}` : ''),
        originalPrompt: params.originalPrompt || prompt,
      });
    } catch (error) {
      console.error(`Error improving ${model} prompt:`, error);
    }
  }
};

const replaceCharacterPrompts = async (model: string, params: any) => {
  const prompt = params.prompt;
  const originalPrompt = params.originalPrompt || params.prompt;
  if (isDanbroouModel(model) && prompt) {
    try {
      const characterIds = getCharacterIds(prompt);
      if (characterIds.length > 0) {
        const { data: characters } = await supabase
          .from('CustomCharacters')
          .select('character_uniqid, alt_prompt, character_description')
          .in('character_uniqid', characterIds);

        const dbCharacters = characters || [];
        let newPrompt = prompt;
        let newOriginalPrompt = originalPrompt || prompt;

        for (const characterId of characterIds) {
          let replacement = '';
          const dbCharacter = dbCharacters.find(
            char => char.character_uniqid === characterId,
          );

          if (dbCharacter) {
            replacement =
              dbCharacter.alt_prompt || dbCharacter.character_description || '';
          } else {
            replacement = characterId.replace(/_/g, ' ');
          }

          if (replacement) {
            newPrompt = newPrompt.split(`@${characterId}`).join(replacement);
            newOriginalPrompt = newOriginalPrompt
              .split(`@${characterId}`)
              .join(replacement);
            newPrompt = newPrompt.split(`<${characterId}>`).join(replacement);
            newOriginalPrompt = newOriginalPrompt
              .split(`<${characterId}>`)
              .join(replacement);
          }
        }

        Object.assign(params, {
          prompt: newPrompt,
          originalPrompt: newOriginalPrompt,
        });
      }
    } catch (error) {
      console.error(`[replaceCharacterPrompts] ${model} Error:`, error);
    }
  }
};

const parseKusaStyleId = (prompt: string) => {
  const reg = /\[(.*?)\]/g;
  const match = prompt.match(reg);
  if (match) {
    const style = KUSA_STYLES.find(style => style.value === match[0]);
    if (style) {
      return style.id;
    }
    return '70';
  }
  return '70';
};

const parseKusaImageSize = (size: any) => {
  let imageSize = { width: 960, height: 1680 };
  if (size === 'square') {
    imageSize = { width: 1024, height: 1024 };
  } else if (size === 'landscape') {
    imageSize = { width: 1152, height: 768 };
  } else if (size === 'portrait') {
    imageSize = { width: 768, height: 1152 };
  } else if (size?.width && size?.height) {
    imageSize = {
      width: size.width,
      height: size.height,
    };
  }
  return imageSize;
};

const parseKusaParams = async (
  modelName: string,
  params: any,
  options: {
    removeStyleTag?: boolean;
    styleId?: string;
    negativePrompt?: string;
  } = {},
) => {
  await generatePrompt(modelName, params);
  await replaceCharacterPrompts(modelName, params);

  const imageSize = parseKusaImageSize(params.size);

  let prompt = params.prompt;
  let styleId: string;

  if (options.removeStyleTag !== false) {
    prompt = params.prompt.replace(/\[.*?\]/g, '');
    styleId = options.styleId || parseKusaStyleId(params.prompt);
  } else {
    styleId = options.styleId || '1';
  }

  // Merge user's negative prompt with default/required negative prompts
  const negativePrompt = [params.negative_prompt, options.negativePrompt]
    .filter(Boolean)
    .join(', ');

  return {
    task_type: 'TEXT_TO_IMAGE',
    params: {
      prompt: `${prompt}, rating:general`,
      style_id: styleId,
      width: imageSize.width,
      height: imageSize.height,
      negative_prompt: negativePrompt,
      amount: 1,
    },
  };
};

// Helper function for Kusa models with middleware processing
const parseKusaParamsWithMiddleware = async (
  modelName: string,
  params: any,
  options?: any,
) => {
  if (PromptMiddlewareProcessor.needsMiddleware(params)) {
    const prompt = await PromptMiddlewareProcessor.processPrompt(params);
    const updatedParams = { ...params, prompt };
    return parseKusaParams(modelName, updatedParams, options);
  }
  return parseKusaParams(modelName, params, options);
};

export const ModelConfig: Record<number, AIModel> = {
  [ModelIds.MINIMAX]: {
    name: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params?.prompt || (!params?.image && !params.images)) {
        throw new Error('Invalid params');
      }

      // Handle end_frame parameter (first frame + last frame mode)
      if (params.end_frame) {
        const firstFrameUrl =
          params.image || (params.images && params.images[0]);
        if (!firstFrameUrl) {
          throw new Error(
            'First frame image is required when end_frame is provided',
          );
        }
        return {
          prompt: params.prompt,
          image_url: firstFrameUrl,
          end_image_url: params.end_frame,
        };
      }

      // Handle single image mode
      if (params.image) {
        return {
          prompt: params.prompt,
          image_url: params.image,
        };
      }

      // Handle multi-image mode (first frame + last frame)
      if (params.images?.length < 2) {
        throw new Error('Please provide 2 images');
      }
      return {
        prompt: params.prompt,
        image_url: params.images[0],
        end_image_url: params.images[1],
      };
    },
    alias: 'Hailuo 02',
    originalCode: ImageToVideoModel.MINIMAX,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.MINIMAX,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.RAY]: {
    name: 'fal-ai/luma-dream-machine/ray-2/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image && !params.images) {
        throw new Error('Image is required');
      }

      // Handle end_frame parameter (first frame + last frame mode)
      if (params.end_frame) {
        const firstFrameUrl =
          params.image || (params.images && params.images[0]);
        if (!firstFrameUrl) {
          throw new Error(
            'First frame image is required when end_frame is provided',
          );
        }
        return {
          prompt: params.prompt,
          image_url: firstFrameUrl,
          end_image_url: params.end_frame,
          aspect_ratio: params.aspect_ratio || '16:9',
        };
      }

      // Handle single image mode
      if (params.image) {
        return {
          prompt: params.prompt,
          image_url: params.image,
          aspect_ratio: params.aspect_ratio || '16:9',
        };
      }

      // Handle multi-image mode (first frame + last frame)
      if (params.images?.length < 2) {
        throw new Error('Please provide 2 images');
      }
      return {
        prompt: params.prompt,
        image_url: params.images[0],
        end_image_url: params.images[1],
        aspect_ratio: params.aspect_ratio || '16:9',
      };
    },
    alias: 'Luma Ray 2',
    originalCode: ImageToVideoModel.RAY,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.RAY,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.RAY_FLASH_V2]: {
    name: 'luma/ray-flash-2-720p',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      start_image_url: params.image,
      duration: +params.duration || 5,
      aspect_ratio: params.aspect_ratio || '16:9',
    }),
    alias: 'Luma Ray Flash 2',
    originalCode: ImageToVideoModel.RAY_FLASH_V2,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.RAY_FLASH_V2,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.WAN]: {
    name: 'wan/v2.6/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
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

      // Handle effect mode prompt
      if (
        (params.meta_data?.mode === 'effect' ||
          params.meta_data?.mode === 'template') &&
        params.meta_data?.style_id
      ) {
        const templateInputs = extractTemplateInputs(params.meta_data);
        const effectInfo = await getEffectInfo(
          params.meta_data?.style_id,
          templateInputs,
        );
        if (effectInfo?.prompt) {
          prompt = effectInfo.prompt;

          // Translate the template prompt if needed
          prompt = await translateTemplatePrompt(prompt, params);
        }
      }

      const result = {
        prompt,
        image_url: imageUrl,
        aspect_ratio: params.aspect_ratio || '16:9',
        resolution: params.resolution || '720p',
        audio_url: params.audio, // optional audio link when provided
        duration: params.duration || '5',
        multi_shots: params.multi_shots,
        enable_safety_checker: false,
      };

      return result;
    },
    alias: 'Wan 2.6',
    originalCode: ImageToVideoModel.WAN,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.WAN,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.WAN_PRO]: {
    name: 'fal-ai/wan-pro/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
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

      return {
        prompt,
        image_url: imageUrl,
      };
    },
    alias: 'Wan Pro',
    originalCode: ImageToVideoModel.WAN_PRO,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.WAN_PRO,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.KLING]: {
    name: 'kwaivgi/kling-v1.6-pro',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      duration: +params.duration || 5,
      start_image: params.image,
      aspect_ratio: params.aspect_ratio || '16:9',
    }),
    alias: 'Kling v1.6',
    originalCode: ImageToVideoModel.KLING,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.KLING,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.PIXVERSE]: {
    name: 'fal-ai/pixverse/v3.5/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      image_url: params.image,
      resolution: params.resolution || '720p',
      duration: +params.duration || 5,
      aspect_ratio: params.aspect_ratio || '16:9',
    }),
    alias: 'Pixverse v3.5',
    originalCode: ImageToVideoModel.PIXVERSE,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.PIXVERSE,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.KLING_V2]: {
    name: 'fal-ai/kling-video/v2.1/master/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      image_url: params.image,
      duration: params.duration || '5',
      aspect_ratio: params.aspect_ratio || '16:9',
    }),
    alias: 'Kling 2.1',
    originalCode: ImageToVideoModel.KLING_V2,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.KLING_V2,
        params.duration,
        params.resolution,
      ),
  },
  // [ModelIds.VEO2]: {
  //   name: 'fal-ai/veo2/image-to-video',
  //   platform: 'fal',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: (params: any) => ({
  //     prompt: params.prompt,
  //     image_url: params.image,
  //     duration: `${params.duration || 5}s`,
  //     aspect_ratio: params.aspect_ratio || 'auto',
  //   }),
  //   alias: 'Google Veo 2',
  //   originalCode: ImageToVideoModel.VEO,
  //   cost: (params: any) =>
  //     calculateImageToAnimationCost(
  //       ImageToVideoModel.VEO,
  //       params.duration,
  //       params.resolution,
  //     ),
  // },
  [ModelIds.VEO3]: {
    name: 'fal-ai/veo3/fast/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
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

      return {
        prompt,
        image_url: imageUrl,
        duration: '8s',
        aspect_ratio: params.aspect_ratio || 'auto',
      };
    },
    alias: 'Google Veo 3',
    originalCode: ImageToVideoModel.VEO,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.VEO,
        '8',
        params.resolution,
      ),
  },
  [ModelIds.FRAME_PACK]: {
    name: 'fal-ai/framepack',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      image_url: params.image,
      aspect_ratio: params.aspect_ratio || '16:9',
      resolution: '720p',
    }),
    alias: 'Frame Pack',
    originalCode: ImageToVideoModel.FRAME_PACK,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.FRAME_PACK,
        params.duration,
        params.resolution,
      ),
  },
  // [ModelIds.VIDU]: {
  //   name: 'fal-ai/vidu/image-to-video',
  //   platform: 'fal',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: (params: any) => ({
  //     prompt: params.prompt,
  //     image_url: params.image,
  //   }),
  //   alias: 'Vidu Base',
  //   originalCode: ImageToVideoModel.VIDU,
  //   cost: (params: any) =>
  //     calculateImageToAnimationCost(
  //       ImageToVideoModel.VIDU,
  //       params.duration,
  //       params.resolution,
  //     ),
  // },
  // [DEPRECATED] Original VIDU model using Ark platform
  // [ModelIds.VIDU]: {
  //   name: 'doubao-seedance-1-0-pro-250528',
  //   platform: 'ark',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: async (params: any) => {
  //     const imageUrl = await processCharacterMention(params);
  //
  //     const paramsStr = parseParamsStr({
  //       resolution: '480p',
  //       duration: params.duration || '5',
  //       aspect_ratio: params.aspect_ratio || '16:9',
  //     });
  //
  //     let prompt: any;
  //     if (
  //       (params.meta_data?.mode === 'effect' ||
  //         params.meta_data?.mode === 'template') &&
  //       params.meta_data?.style_id
  //     ) {
  //       prompt = getEffectInfo(params.meta_data?.style_id).prompt;
  //     } else {
  //       prompt = params.prompt;
  //     }
  //     return [
  //       {
  //         type: 'text',
  //         text: `${prompt} ${paramsStr}`,
  //       },
  //       {
  //         type: 'image_url',
  //         image_url: {
  //           url: imageUrl,
  //         },
  //       },
  //     ];
  //   },
  //   alias: 'Anime Base',
  //   originalCode: ImageToVideoModel.SEEDANCE,
  //   cost: async (params: any) =>
  //     calculateImageToAnimationCost(
  //       ImageToVideoModel.VIDU,
  //       params.duration,
  //       '480p',
  //     ),
  // },

  [ModelIds.VIDU]: {
    name: 'grok-imagine/image-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Video pipeline 预处理 (type2/type3)
      const pipelineResult = await processVideoPipeline(params);
      if (pipelineResult) {
        return {
          image_urls: [pipelineResult.imageUrl],
          prompt: pipelineResult.prompt || '',
          mode: 'normal',
        };
      }

      const { imageUrl, prompt } = await prepareVideoParams(params, {
        handleEffectMode: true,
        shouldTranslate: true, // Translate template prompt to English for better AI model understanding
      });

      return {
        image_urls: [imageUrl],
        prompt: prompt || '',
        mode: 'normal', // fun | normal | spicy (spicy not supported with external images)
      };
    },
    alias: 'Anime Base',
    originalCode: ImageToVideoModel.SEEDANCE,
    cost: async (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.VIDU,
        params.duration,
        '480p',
      ) + getVideoPipelineExtraCost(params.meta_data?.video_pipeline_type),
  },
  /** anisora */
  [ModelIds.ANISORA]: {
    name: 'fal-ai/vidu/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      image_url: params.image,
    }),
    alias: 'Anisora',
    originalCode: ImageToVideoModel.ANISORA,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.ANISORA,
        params.duration,
        params.resolution,
      ),
  },
  // =========================================
  // Vidu Q2 Turbo (replacing Q1)
  // API: fal-ai/vidu/q2/image-to-video/turbo
  // =========================================
  [ModelIds.VIDU_Q2]: {
    name: 'fal-ai/vidu/q2/image-to-video/turbo',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      const imageUrl = await processCharacterMention(params);

      const duration = params.duration ? Number(params.duration) : 4;
      return {
        prompt: params.prompt,
        image_url: imageUrl,
        duration,
        resolution: params.resolution || '720p',
        movement_amplitude: 'auto',
        bgm: duration === 4,
      };
    },
    alias: 'Vidu Q2 Turbo',
    originalCode: ImageToVideoModel.VIDU_Q2,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.VIDU_Q2,
        params.duration,
        params.resolution,
      ),
  },
  // =========================================
  // Vidu Q2 Pro
  // API: fal-ai/vidu/q2/image-to-video/pro
  // =========================================
  [ModelIds.VIDU_Q2_PRO]: {
    name: 'fal-ai/vidu/q2/image-to-video/pro',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      const imageUrl = await processCharacterMention(params);

      const duration = params.duration ? Number(params.duration) : 4;
      return {
        prompt: params.prompt,
        image_url: imageUrl,
        duration,
        resolution: params.resolution || '720p',
        movement_amplitude: 'auto',
        bgm: duration === 4,
      };
    },
    alias: 'Vidu Q2 Pro',
    originalCode: ImageToVideoModel.VIDU_Q2_PRO,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.VIDU_Q2_PRO,
        params.duration,
        params.resolution,
      ),
  },
  // =========================================
  // Vidu Q2 Reference-to-Video (replacing Q1 Multi)
  // API: fal-ai/vidu/q2/reference-to-video
  // =========================================
  [ModelIds.VIDU_Q2_REFERENCE_TO_VIDEO]: {
    name: 'fal-ai/vidu/q2/reference-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: parseViduQ2ReferenceParams,
    alias: 'Vidu Q2 Reference',
    originalCode: ImageToVideoModel.VIDU_Q2_MULTI,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.VIDU_Q2_MULTI,
        params.duration,
        params.resolution,
      ),
  },
  /** magi */
  [ModelIds.MAGI_1]: {
    name: 'fal-ai/magi-distilled/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      prompt: params.prompt,
      image_url: params.image,
      aspect_ratio: params.aspect_ratio || 'auto',
      resolution: params.resolution || '720p',
      num_frames: params.num_frames || 96,
      frames_per_second: params.frames_per_second
        ? Number(params.frames_per_second)
        : 24,
      seed: params.seed,
      enable_safety_checker: params.enable_safety_checker !== false,
    }),
    alias: 'Magi-1',
    originalCode: ImageToVideoModel.MAGI_1,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.MAGI_1,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.SE_COG]: {
    name: 'story-engine-inc/test-cog-comfyui:f694c54e46d565be7c2140281c70704f26786131b1bdacd36def9ee4e454ef7b',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image) {
        // return new Response(JSON.stringify({ error: 'Missing ref_image parameter' }), { status: 400 });
        throw new Error('Missing reference image parameter');
      }
      if (!params.video) {
        // return new Response(JSON.stringify({ error: 'Missing ref_video parameter' }), { status: 400 });
        throw new Error('Missing video parameter');
      }

      return {
        ref_image: params.image,
        ref_video: params.video,
        positive_prompt: params.prompt || '',
        negative_prompt: '',
        output_format: 'webp',
        workflow_json: '',
        output_quality: 95,
        randomise_seeds: true,
        force_reset_cache: false,
        return_temp_files: false,
        overwrite_prompt_node: 16,
      };
    },
    alias: 'V2V',
    cost: (params: any) => {
      // Use selectedDuration for billing (what user selected and saw)
      const selectedDuration = params.selectedDuration || 5;
      const actualDuration = params.actualDuration;

      // Validation: actualDuration should not be too far from selectedDuration
      if (actualDuration && typeof actualDuration === 'number') {
        const difference = Math.abs(actualDuration - selectedDuration);
        if (difference > 2) {
          console.warn(
            'SE_COG Duration Mismatch Warning: Actual duration differs significantly from selected duration',
          );
        }
      }

      return calculateVideoToVideoGenerationCost('rayFlash', selectedDuration);
    },
  },
  // [ModelIds.SE_WAN]: {
  //   name: 'story-engine-inc/wan2.1fun-depth:68ebd668560213bf142cc99c66c493d85a56883b8269fbe88cfc411b727494ba',
  //   platform: 'replicate',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: (params: any) => {
  //     if (!params.image) {
  //       // return new Response(JSON.stringify({ error: 'Missing ref_image parameter' }), { status: 400 });
  //       throw new Error('Missing reference image parameter');
  //     }
  //     if (!params.video) {
  //       // return new Response(JSON.stringify({ error: 'Missing ref_video parameter' }), { status: 400 });
  //       throw new Error('Missing video parameter');
  //     }

  //     return {
  //       ref_image: params.image,
  //       ref_video: params.video,
  //       positive_prompt: params.prompt || '',
  //       negative_prompt: '',
  //       output_format: 'webp',
  //       workflow_json: '',
  //       output_quality: 95,
  //       randomise_seeds: true,
  //       force_reset_cache: false,
  //       return_temp_files: false,
  //       overwrite_prompt_node: 16,
  //     };
  //   },
  //   alias: 'Story Engine Wan 2.1',
  //   cost: (params: any) => {
  //     // Use selectedDuration for billing (what user selected and saw)
  //     const selectedDuration = params.selectedDuration || 5;
  //     const actualDuration = params.actualDuration;

  //     // Validation: actualDuration should not be too far from selectedDuration
  //     if (actualDuration && typeof actualDuration === 'number') {
  //       const difference = Math.abs(actualDuration - selectedDuration);
  //       if (difference > 2) {
  //         console.warn(
  //           'SE_WAN Duration Mismatch Warning: Actual duration differs significantly from selected duration',
  //         );
  //       }
  //     }

  //     return calculateVideoToVideoGenerationCost('wan', selectedDuration);
  //   },
  // },
  [ModelIds.VIDEO_UPSCALE]: {
    name: 'lucataco/real-esrgan-video:c23768236472c41b7a121ee735c8073e29080c01b32907740cfada61bff75320',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      const videoPath = params.video_path;
      if (!videoPath) {
        // return failed('Video path is required');
        throw new Error('Video path is required');
      }

      const inputVideo = videoPath;
      if (
        !videoPath.startsWith('http://') &&
        !videoPath.startsWith('https://')
      ) {
        // return failed('Video path must be a valid URL');
        throw new Error('Video path must be a valid URL');
      }
      return {
        video_path: inputVideo,
        resolution: params.resolution,
        duration: params.duration,
      };
    },
    alias: 'Video Upscale',
    cost: (params: any) => {
      const duration = params.duration || 1;
      return calculateVideoUpscaleCost(duration);
    },
  },
  [ModelIds.VIDEO_INTERPOLATION]: {
    name: 'zsxkib/film-frame-interpolation-for-large-motion:222d67420da179935a68afff47093bab48705fe9e09c3c79268c1eb2ee7c5e91',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => ({
      mp4: params.video,
      num_interpolation_steps: params.interpolate_steps,
      playback_frames_per_second: params.frames_per_second,
    }),
    alias: 'Video Interpolation',
    cost: (params: any) => {
      const duration = Number(params.duration) || 1;
      const interpolate_steps = Number(params.interpolate_steps) || 1;
      return VIDEO_INTERPOLATION * duration * interpolate_steps;
    },
  },
  [ModelIds.IN_BETWEEN]: {
    name: 'fofr/tooncrafter:0486ff07368e816ec3d5c69b9581e7a09b55817f567a0d74caad9395c9295c77',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      const images = params?.images || [];
      if (images.length < 2) {
        throw new Error('At least 2 images are required');
      }
      const aiInputParams = {
        prompt: params.prompt,
        max_width: 512,
        max_height: 512,
        loop: false,
        interpolate: false,
        negative_prompt: '',
        color_correction: true,
      };
      images.slice(0, 5).forEach((image, index) => {
        aiInputParams[`image_${index + 1}`] = image;
      });
      return aiInputParams;
    },
    alias: 'inbetween',
    cost: (params: any) => {
      const count = Math.max(params?.images?.length || 1, 2);
      return IN_BETWEEN * (count - 1);
    },
  },
  // text and image
  [ModelIds.MJ_VIDEO]: {
    name: 'mj_fast_video',
    platform: 'deer',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image && !params.prompt) {
        throw new Error('Image is required');
      }
      return {
        prompt: params.prompt,
        image: params.image,
        videoType: 'vid_1.1_i2v_480',
        mode: 'fast',
        animateMode: 'manual',
        motion: 'low',
      };
    },
    alias: 'Midjourney Video',
    originalCode: ImageToVideoModel.MJ_VIDEO,
    cost() {
      return IMAGE_TO_ANIMATION_MJ_VIDEO;
    },
  },
  [ModelIds.RAY2_FLASH_MODIFY]: {
    name: 'fal-ai/luma-dream-machine/ray-2-flash/modify',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image || !params.video) {
        throw new Error('Both image and video are required');
      }

      const result: any = {
        image_url: params.image,
        video_url: params.video,
      };

      let finalPrompt = '';

      if (params.meta_data?.preset_prompt) {
        finalPrompt = params.meta_data.preset_prompt;
      }

      if (params.prompt && params.prompt.length >= 3) {
        if (finalPrompt) {
          finalPrompt += ` ${params.prompt}`;
        } else {
          finalPrompt = params.prompt;
        }
      }

      if (finalPrompt) {
        result.prompt = finalPrompt;
      }

      // Validate duration using selectedDuration
      const selectedDuration = params.selectedDuration || 5;
      if (selectedDuration > RAYFLASH_MAX_DURATION) {
        throw new Error('Video duration must be between 1 and 15 seconds');
      }

      return result;
    },
    alias: 'V2V General',
    cost: (params: any) =>
      calculateVideoToVideoGenerationCost('rayFlash', params.selectedDuration),
    // Fallback to Luma native API when FAL fails
    fallback: {
      modelId: ModelIds.RAY2_FLASH_MODIFY_LUMA,
      // Always fallback on failure (no specific condition)
      shouldFallback: () => true,
    },
  },
  [ModelIds.RAY2_FLASH_MODIFY_LUMA]: {
    name: 'luma/modify-video',
    platform: 'luma',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image || !params.video) {
        throw new Error('Both image and video are required');
      }

      const result: any = {
        prompt: '',
        media: { url: params.video },
        first_frame: { url: params.image },
        model: params.model || 'ray-flash-2',
        mode: 'reimagine_1',
        resolution: params.resolution || '720p',
      };

      {
        const dur = Number(params.actualDuration || params.selectedDuration);
        if (!Number.isNaN(dur) && dur > 0) {
          const clamped = Math.max(1, Math.min(15, Math.floor(dur)));
          (result as any).duration = `${clamped}s`;
        }
      }

      let finalPrompt = '';
      if (params.meta_data?.preset_prompt) {
        finalPrompt = params.meta_data.preset_prompt;
      }
      if (params.prompt && params.prompt.length >= 3) {
        finalPrompt = finalPrompt
          ? `${finalPrompt} ${params.prompt}`
          : params.prompt;
      }
      // Luma requires a non-empty prompt; provide a safe fallback
      result.prompt =
        (finalPrompt && finalPrompt.trim()) || 'Video style transfer';

      // Validate duration using selectedDuration
      const selectedDuration = params.selectedDuration || 5;
      if (selectedDuration > RAYFLASH_MAX_DURATION) {
        throw new Error('Video duration must be between 1 and 15 seconds');
      }

      return result;
    },
    alias: 'V2V General',
    cost: (params: any) =>
      calculateVideoToVideoGenerationCost('rayFlash', params.selectedDuration),
  },
  [ModelIds.ACT_TWO]: {
    name: 'act_two',
    platform: 'runway',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      if (!params.image || !params.video) {
        throw new Error('Image and video are required');
      }

      if (params.tool === 'image_animation') {
        params.ratio = '720:1280';
      } else if (!params.ratio) {
        throw new Error('Aspect ratio is required');
      }

      if (
        (params.actualDuration && params.actualDuration < 3) ||
        (params.selectedDuration && params.selectedDuration < 3)
      ) {
        throw new Error('Video must be at least 3 seconds');
      }
      const result: any = {
        character: {
          type: 'image',
          uri: params.image,
        },
        reference: {
          type: 'video',
          uri: params.video,
        },
        bodyControl: params.bodyControl || true,
        expressionIntensity: params.expressionIntensity || 3,
        ratio: params.ratio || '16:9',
      };

      // Validate duration using selectedDuration
      const selectedDuration = params.selectedDuration || 3;
      if (
        selectedDuration < ACT_TWO_MIN_DURATION ||
        selectedDuration > ACT_TWO_MAX_DURATION
      ) {
        throw new Error(
          `Video duration must be between ${ACT_TWO_MIN_DURATION} and ${ACT_TWO_MAX_DURATION} seconds`,
        );
      }

      return result;
    },
    alias: 'V2V Human Video',
    cost: (params: any) =>
      calculateVideoToVideoGenerationCost('actTwo', params.selectedDuration),
  },
  // @Reference: https://wavespeed.ai/docs/docs-api/wavespeed-ai/wan-2.2-animate
  [ModelIds.WAN_ANIMATE]: {
    name: 'wavespeed-ai/wan-2.2/animate',
    platform: 'wavespeed',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      if (!params.video || !params.image) {
        throw new Error('Video and image are required');
      }

      // Use middleware processor for prompt handling
      let prompt: string;
      if (
        (params.meta_data?.mode === 'effect' ||
          params.meta_data?.mode === 'template') &&
        params.meta_data?.style_id
      ) {
        prompt = await PromptMiddlewareProcessor.processPrompt(params);
      } else {
        prompt = params.prompt || '';
      }

      return {
        image: params.image,
        video: params.video,
        prompt,
        mode: params.mode || 'animate',
        seed: '1',
        resolution: '480p',
      };
    },
    alias: 'Wan Animate',
    cost: (params: any) =>
      calculateVideoToVideoGenerationCost(
        params.meta_data?.mode === 'dance'
          ? 'wanAnimateDiscount'
          : 'wanAnimate',
        params.selectedDuration,
      ),
  },
  [ModelIds.ALEPH]: {
    name: 'runwayml/gen4-aleph',
    platform: 'replicate',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      if (!params.video) {
        throw new Error('Video is required');
      }

      // - 若存在 meta_data.style_id，则优先使用服务端风格提示词（若有 meta_data.preset_prompt 则使用之，否则回退为 style_id 文本）
      // - 再拼接用户 prompt（若有且非空），空格分隔
      let finalPrompt = '';
      const styleId = params.meta_data?.style_id as string | undefined;
      if (styleId) {
        // 使用本地映射，若未命中则回退 preset_prompt 或 styleId 自身
        const info = await getStyleInfo(styleId);
        const stylePrompt =
          (info?.prompt && info.prompt.trim()) ||
          (params.meta_data?.preset_prompt as string | undefined) ||
          styleId;
        finalPrompt = stylePrompt.trim();
      } else if (params.meta_data?.preset_prompt) {
        finalPrompt = String(params.meta_data.preset_prompt).trim();
      }

      if (typeof params.prompt === 'string' && params.prompt.trim()) {
        finalPrompt = finalPrompt
          ? `${finalPrompt} ${params.prompt.trim()}`
          : params.prompt.trim();
      }

      if (!finalPrompt) {
        // 对于 Aleph，当没有风格提示词且用户 prompt 为空时，仍需报错
        throw new Error('Prompt is required');
      }

      const result: any = {
        video: params.video,
        prompt: finalPrompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        reference_image: params.image,
      };

      // Validate duration using selectedDuration
      const selectedDuration = params.selectedDuration || 5;
      if (selectedDuration < 1 || selectedDuration > 15) {
        throw new Error('Video duration must be between 1 and 15 seconds');
      }

      return result;
    },
    alias: 'V2V Pro',
    cost: (params: any) =>
      calculateVideoToVideoGenerationCost('aleph', params.selectedDuration),
  },
  [ModelIds.SEEDANCE]: {
    name: 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Video pipeline 预处理 (type2/type3)
      const pipelineResult = await processVideoPipeline(params);
      if (pipelineResult) {
        const result: any = {
          prompt: pipelineResult.prompt,
          image_url: pipelineResult.imageUrl,
          resolution: params.resolution || '480p',
          duration: params.duration || '5',
          aspect_ratio: params.aspect_ratio || '16:9',
        };
        if (params.end_frame) {
          result.end_image_url = params.end_frame;
        }
        return result;
      }

      // 优先使用 params.image，如果不存在则尝试 params.images 数组的第一个元素
      let imageUrl = params.image;
      if (
        !imageUrl &&
        params.images &&
        Array.isArray(params.images) &&
        params.images.length > 0
      ) {
        imageUrl = params.images[0];
      }

      if (!params.prompt) {
        throw new Error('prompt is required');
      }

      // Process character mention
      if (!imageUrl) {
        imageUrl = await processCharacterMention(params);
        if (!imageUrl) {
          throw new Error('Image is required');
        }
      }

      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      const result: any = {
        prompt,
        image_url: imageUrl,
        resolution: params.resolution || '480p',
        duration: params.duration || '5',
        aspect_ratio: params.aspect_ratio || '16:9',
      };

      if (params.end_frame) {
        result.end_image_url = params.end_frame;
      }

      return result;
    },
    alias: 'Seedance 1.5 Pro',
    originalCode: ImageToVideoModel.SEEDANCE,
    cost: async (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.SEEDANCE,
        params.duration,
        params.resolution,
        params.aspect_ratio,
      ) + getVideoPipelineExtraCost(params.meta_data?.video_pipeline_type),
  },
  // deprecated
  // [ModelIds.SEEDANCE]: {
  //   name: 'doubao-seedance-1-0-pro-250528',
  //   platform: 'ark',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: async (params: any) => {
  //     if (!params.image && !params.images) {
  //       throw new Error('Image is required');
  //     }
  //     if (!params.prompt) {
  //       throw new Error('Prompt is required');
  //     }
  //     const paramsStr = parseParamsStr(params);
  //     const prompt = params.prompt;

  //     // Handle end_frame parameter (first frame + last frame mode)
  //     if (params.end_frame) {
  //       const firstFrameUrl =
  //         params.image || (params.images && params.images[0]);
  //       if (!firstFrameUrl) {
  //         throw new Error(
  //           'First frame image is required when end_frame is provided',
  //         );
  //       }
  //       return [
  //         {
  //           type: 'text',
  //           text: `${prompt} ${paramsStr}`,
  //         },
  //         {
  //           type: 'image_url',
  //           image_url: {
  //             url: firstFrameUrl,
  //           },
  //           role: 'first_frame',
  //         },
  //         {
  //           type: 'image_url',
  //           image_url: {
  //             url: params.end_frame,
  //           },
  //           role: 'last_frame',
  //         },
  //       ];
  //     }

  //     // Handle single image mode
  //     if (params.image) {
  //       return [
  //         {
  //           type: 'text',
  //           text: `${prompt} ${paramsStr}`,
  //         },
  //         {
  //           type: 'image_url',
  //           image_url: {
  //             url: params.image,
  //           },
  //         },
  //       ];
  //     }

  //     // Handle multi-image mode (first frame + last frame)
  //     if (params?.images?.length < 2) {
  //       throw new Error('please provide 2 images');
  //     }
  //     return [
  //       {
  //         type: 'text',
  //         text: `${prompt} ${paramsStr}`,
  //       },
  //       {
  //         type: 'image_url',
  //         image_url: {
  //           url: params.images[0],
  //         },
  //         role: 'first_frame',
  //       },
  //       {
  //         type: 'image_url',
  //         image_url: {
  //           url: params.images[1],
  //         },
  //         role: 'last_frame',
  //       },
  //     ];
  //   },
  //   alias: 'Seedance Pro',
  //   originalCode: ImageToVideoModel.SEEDANCE,
  //   cost: async (params: any) =>
  //     calculateImageToAnimationCost(
  //       ImageToVideoModel.SEEDANCE,
  //       params.duration,
  //       params.resolution,
  //       params.aspect_ratio || '16:9',
  //     ),
  // },
  // Sora Stable - uses old wavespeed Sora config
  [ModelIds.SORA_STABLE]: {
    name: 'openai/sora-2/image-to-video',
    platform: 'wavespeed',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Stable',
    parseParams: async (params: any) => {
      const { imageUrl, prompt } = await prepareVideoParams(params);

      return {
        prompt,
        image: imageUrl,
        duration: +params.duration || 4,
      };
    },
    cost(params) {
      return calculateImageToAnimationCost(
        ImageToVideoModel.SORA_STABLE,
        params.duration,
        params.resolution,
      );
    },
  },
  // New KIE.AI Sora 2 Image-to-Video
  [ModelIds.SORA]: {
    name: 'sora-2-image-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora',
    parseParams: async (params: any) => {
      // Map aspect_ratio to KIE.AI format (portrait/landscape)
      const aspectRatio = params.aspect_ratio || '16:9';
      const kieAspectRatio =
        aspectRatio === '9:16' || aspectRatio === '3:4'
          ? 'portrait'
          : 'landscape';

      // Map duration to n_frames (10 or 15)
      const duration = +params.duration || 10;
      const nFrames = duration <= 10 ? '10' : '15';

      // pipeline 检查放在此处而非函数开头，因为 pipeline 分支也需要 kieAspectRatio/nFrames
      const pipelineResult = await processVideoPipeline(params);
      if (pipelineResult) {
        return {
          prompt: pipelineResult.prompt,
          image_urls: [pipelineResult.imageUrl],
          aspect_ratio: kieAspectRatio,
          n_frames: nFrames,
          remove_watermark: true,
        };
      }

      // Always extract image URL and base prompt via prepareVideoParams
      const { imageUrl, prompt: basePrompt } = await prepareVideoParams(
        params,
        {
          handleEffectMode: true,
          shouldTranslate: true,
        },
      );

      // Use middleware processor for enhanced prompt if need_middleware is set
      const prompt =
        params.meta_data?.need_middleware === true
          ? await PromptMiddlewareProcessor.processPrompt(
              params,
              parseTextToVideoStyle,
            )
          : basePrompt;

      return {
        prompt,
        image_urls: [imageUrl],
        aspect_ratio: kieAspectRatio,
        n_frames: nFrames,
        remove_watermark: true,
      };
    },
    cost(params) {
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.SORA,
          params.duration,
          params.resolution,
        ) + getVideoPipelineExtraCost(params.meta_data?.video_pipeline_type)
      );
    },
  },
  // Sora Pro Stable - uses old wavespeed Sora Pro config
  [ModelIds.SORA_PRO_STABLE]: {
    name: 'openai/sora-2/image-to-video-pro',
    platform: 'wavespeed',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Pro Stable',
    parseParams: async (params: any) => {
      // Video pipeline 预处理 (type2/type3)
      const pipelineResult = await processVideoPipeline(params);
      if (pipelineResult) {
        return {
          prompt: pipelineResult.prompt,
          image: pipelineResult.imageUrl,
          duration: +params.duration || 4,
          resolution: params.resolution || '720p',
        };
      }

      const { imageUrl, prompt } = await prepareVideoParams(params);

      return {
        prompt,
        image: imageUrl,
        duration: +params.duration || 4,
        resolution: params.resolution || '720p',
      };
    },
    cost(params) {
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.SORA_PRO_STABLE,
          params.duration,
          params.resolution,
        ) + getVideoPipelineExtraCost(params.meta_data?.video_pipeline_type)
      );
    },
  },
  // New KIE.AI Sora 2 Pro Image-to-Video
  [ModelIds.SORA_PRO]: {
    name: 'sora-2-pro-image-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Pro',
    parseParams: async (params: any) => {
      // Map aspect_ratio to KIE.AI format (portrait/landscape)
      const aspectRatio = params.aspect_ratio || '16:9';
      const kieAspectRatio =
        aspectRatio === '9:16' || aspectRatio === '3:4'
          ? 'portrait'
          : 'landscape';

      // Map duration to n_frames (10 or 15)
      const duration = +params.duration || 10;
      const nFrames = duration <= 10 ? '10' : '15';

      // Map resolution to size (720p->standard, 1080p->high)
      const resolution = params.resolution || '720p';
      const size = resolution === '1080p' ? 'high' : 'standard';

      // pipeline 检查放在此处而非函数开头，因为 pipeline 分支也需要 kieAspectRatio/nFrames/size
      const pipelineResult = await processVideoPipeline(params);
      if (pipelineResult) {
        return {
          prompt: pipelineResult.prompt,
          image_urls: [pipelineResult.imageUrl],
          aspect_ratio: kieAspectRatio,
          n_frames: nFrames,
          size,
          remove_watermark: true,
        };
      }

      const { imageUrl, prompt: basePrompt } = await prepareVideoParams(params);

      // Use middleware processor for enhanced prompt if need_middleware is set
      const prompt =
        params.meta_data?.need_middleware === true
          ? await PromptMiddlewareProcessor.processPrompt(
              params,
              parseTextToVideoStyle,
            )
          : basePrompt;

      return {
        prompt,
        image_urls: [imageUrl],
        aspect_ratio: kieAspectRatio,
        n_frames: nFrames,
        size,
        remove_watermark: true,
      };
    },
    cost(params) {
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.SORA_PRO,
          params.duration,
          params.resolution,
        ) + getVideoPipelineExtraCost(params.meta_data?.video_pipeline_type)
      );
    },
  },
  // [DEPRECATED] Original VIDU_TEXT_TO_VIDEO model using Ark platform
  // [ModelIds.VIDU_TEXT_TO_VIDEO]: {
  //   name: 'doubao-seedance-1-0-pro-250528',
  //   platform: 'ark',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: (params: any) => {
  //     const paramsStr = parseParamsStr({
  //       resolution: '480p',
  //       duration: params.duration || '5',
  //       aspect_ratio: params.aspect_ratio || '16:9',
  //     });
  //     const stylePrompt = parseTextToVideoStyle(params?.style_id);
  //     return [
  //       {
  //         type: 'text',
  //         text: `${params.prompt}.${stylePrompt} ${paramsStr}`,
  //       },
  //     ];
  //   },
  //   alias: 'Anime Base Text to Video',
  //   originalCode: TextToVideoModel.VIDU,
  //   cost: async (params: any) =>
  //     calculateTextToVideoCost(
  //       TextToVideoModel.VIDU,
  //       params.duration,
  //       '480p',
  //       params.aspect_ratio || '16:9',
  //     ),
  // },

  // Grok Imagine Text-to-Video via KIE AI (frontend shows as "Komiko Anime")
  [ModelIds.VIDU_TEXT_TO_VIDEO]: {
    name: 'grok-imagine/text-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    parseParams: (params: any) => {
      // 只在有有效 style_id 时才添加 style prompt
      const stylePrompt =
        params?.style_id !== undefined && params?.style_id !== null
          ? parseTextToVideoStyle(params.style_id)
          : '';
      const prompt = stylePrompt
        ? `${params.prompt}. ${stylePrompt}`
        : params.prompt;

      return {
        prompt,
        mode: 'normal', // fun | normal | spicy
        // Grok Imagine 不支持 aspect_ratio，不传入
      };
    },
    alias: 'Anime Base Text to Video',
    originalCode: TextToVideoModel.VIDU,
    cost: async (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.VIDU,
        params.duration,
        '480p',
        params.aspect_ratio || '16:9',
      ),
    fallback: {
      modelId: ModelIds.SEEDANCE_TEXT_TO_VIDEO,
      paramsOverride: {
        resolution: '480p',
        duration: '5',
      },
      shouldFallback: failureInfo =>
        String(failureInfo?.failureCode || '') === '500',
    },
  },
  // [ModelIds.SEEDANCE_TEXT_TO_VIDEO]: {
  //   name: 'doubao-seedance-1-0-pro-250528',
  //   platform: 'ark',
  //   type: TASK_TYPES.VIDEO,
  //   parseParams: (params: any) => {
  //     const paramsStr = parseParamsStr(params);
  //     const stylePrompt = parseTextToVideoStyle(params?.style_id);
  //     console.log('stylePrompt', stylePrompt);
  //     return [
  //       {
  //         type: 'text',
  //         text: `${params.prompt}.${stylePrompt} ${paramsStr}`,
  //       },
  //     ];
  //   },
  //   alias: 'Seedance Pro Text to Video',
  //   originalCode: TextToVideoModel.SEEDANCE,
  //   cost: async (params: any) =>
  //     calculateTextToVideoCost(
  //       TextToVideoModel.SEEDANCE,
  //       params.duration || '5',
  //       params.resolution || '480p',
  //       params.aspect_ratio || '16:9',
  //     ),
  // },
  [ModelIds.SEEDANCE_TEXT_TO_VIDEO]: {
    name: 'fal-ai/bytedance/seedance/v1.5/pro/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      if (!params.prompt) {
        throw new Error('prompt is required');
      }

      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        resolution: params.resolution || '480p',
        duration: params.duration || '5',
        aspect_ratio: params.aspect_ratio || '16:9',
      };
    },
    alias: 'Seedance 1.5 Pro Text to Video',
    originalCode: TextToVideoModel.SEEDANCE,
    cost: async (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.SEEDANCE,
        params.duration,
        params.resolution,
        params.aspect_ratio,
      ),
  },
  // =========================================
  // Vidu Q2 Text-to-Video (replacing Q1)
  // API: fal-ai/vidu/q2/text-to-video
  // =========================================
  [ModelIds.VIDU_Q2_TEXT_TO_VIDEO]: {
    name: 'fal-ai/vidu/q2/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      const duration = params.duration ? Number(params.duration) : 4;
      return {
        prompt,
        duration,
        resolution: params.resolution || '720p',
        aspect_ratio: params.aspect_ratio || '16:9',
        movement_amplitude: 'auto',
        bgm: duration === 4,
        seed: params.seed,
      };
    },
    alias: 'Vidu Q2 Text to Video',
    // originalCode: ImageToVideoModel.VIDU_Q1,
    cost: (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.VIDU_Q2,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.KLING_V2_TEXT_TO_VIDEO]: {
    name: 'fal-ai/kling-video/v2.1/master/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        duration: params.duration || '5',
        aspect_ratio: params.aspect_ratio || '16:9',
      };
    },
    alias: 'Kling 2.1 Text to Video',
    // originalCode: ImageToVideoModel.KLING_V2,
    cost: (params: any) =>
      calculateTextToVideoCost(TextToVideoModel.KLING_V2, params.duration),
  },
  [ModelIds.MINIMAX_TEXT_TO_VIDEO]: {
    name: 'fal-ai/minimax/hailuo-02/standard/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
      };
    },
    alias: 'Hailuo 02 Text to Video',
    // originalCode: ImageToVideoModel.KLING_V2,
    cost: (params: any) =>
      calculateTextToVideoCost(TextToVideoModel.MINIMAX, params.duration),
  },
  [ModelIds.WAN_TEXT_TO_VIDEO]: {
    name: 'wan/v2.6/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        resolution: params.resolution || '720p',
        duration: params.duration || '5', // Wan 2.6 supports 5, 10, 15 seconds
        audio_url: params.audio, // optional audio link when provided
        multi_shots: params.multi_shots,
        enable_safety_checker: false,
      };
    },
    alias: 'Wan 2.6 Text to Video',
    // originalCode: ImageToVideoModel.WAN,
    cost: (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.WAN,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.RAY_TEXT_TO_VIDEO]: {
    name: 'fal-ai/luma-dream-machine/ray-2',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        image_url: params.image,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: `${params.duration || '5'}s`,
      };
    },
    alias: 'Luma Ray 2 Text to Video',
    // originalCode: ImageToVideoModel.RAY,
    cost: (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.RAY,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.VEO3_TEXT_TO_VIDEO]: {
    name: 'fal-ai/veo3/fast',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: `${params.duration}s`,
        // audio_enabled: false, // Default to audio off for cost efficiency
      };
    },
    alias: 'Google Veo 3 Fast Text to Video',
    originalCode: TextToVideoModel.VEO,
    cost: (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.VEO,
        params.duration,
        params.resolution,
        params.aspect_ratio,
      ),
  },
  // Sora Stable Text-to-Video - uses old wavespeed config
  [ModelIds.SORA_STABLE_TEXT_TO_VIDEO]: {
    name: 'openai/sora-2/text-to-video',
    platform: 'wavespeed',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Stable Text to Video',
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        // resolution: params.resolution || '720p',
        duration: +params.duration || 4,
        // aspect_ratio: params.aspect_ratio || '16:9',
        size: params.aspect_ratio === '9:16' ? '720*1280' : '1280*720',
      };
    },
    cost(params) {
      return calculateTextToVideoCost(
        TextToVideoModel.SORA_STABLE,
        params.duration,
        params.resolution,
      );
    },
  },
  // New KIE.AI Sora 2 Text-to-Video
  [ModelIds.SORA_TEXT_TO_VIDEO]: {
    name: 'sora-2-text-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Text to Video',
    parseParams: async (params: any) => {
      // Use the new middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      // Map aspect_ratio to KIE.AI format (portrait/landscape)
      const aspectRatio = params.aspect_ratio || '16:9';
      const kieAspectRatio =
        aspectRatio === '9:16' || aspectRatio === '3:4'
          ? 'portrait'
          : 'landscape';

      // Map duration to n_frames (10 or 15)
      const duration = +params.duration || 10;
      const nFrames = duration <= 10 ? '10' : '15';

      return {
        prompt,
        aspect_ratio: kieAspectRatio,
        n_frames: nFrames,
        remove_watermark: true,
      };
    },
    cost(params) {
      return calculateTextToVideoCost(
        TextToVideoModel.SORA,
        params.duration,
        params.resolution,
      );
    },
  },
  // Sora Pro Stable Text-to-Video - uses old wavespeed config
  [ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO]: {
    name: 'openai/sora-2/text-to-video-pro',
    platform: 'wavespeed',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Pro Stable Text to Video',
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        // resolution: params.resolution || '720p',
        duration: +params.duration || 4,
        // aspect_ratio: params,
        size: params.aspect_ratio === '9:16' ? '720*1280' : '1280*720',
      };
    },
    cost(params) {
      return calculateTextToVideoCost(
        TextToVideoModel.SORA_PRO_STABLE,
        params.duration,
        params.resolution,
      );
    },
  },
  // New KIE.AI Sora 2 Pro Text-to-Video
  [ModelIds.SORA_PRO_TEXT_TO_VIDEO]: {
    name: 'sora-2-pro-text-to-video',
    platform: 'kie',
    type: TASK_TYPES.VIDEO,
    alias: 'Sora Pro Text to Video',
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      // Map aspect_ratio to KIE.AI format (portrait/landscape)
      const aspectRatio = params.aspect_ratio || '16:9';
      const kieAspectRatio =
        aspectRatio === '9:16' || aspectRatio === '3:4'
          ? 'portrait'
          : 'landscape';

      // Map duration to n_frames (10 or 15)
      const duration = +params.duration || 10;
      const nFrames = duration <= 10 ? '10' : '15';

      // Map resolution to size (720p→standard, 1080p→high)
      const resolution = params.resolution || '720p';
      const size = resolution === '1080p' ? 'high' : 'standard';

      return {
        prompt,
        aspect_ratio: kieAspectRatio,
        n_frames: nFrames,
        size,
        remove_watermark: true,
      };
    },
    cost(params) {
      return calculateTextToVideoCost(
        TextToVideoModel.SORA_PRO,
        params.duration,
        params.resolution,
      );
    },
  },
  [ModelIds.ILLUSTRIOUS]: {
    name: 'aisha-ai-official/anillustrious-v4:80441e2c32a55f2fcf9b77fa0a74c6c86ad7deac51eed722b9faedb253265cb4',
    platform: 'replicate',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      await generatePrompt('Illustrious', params);
      await replaceCharacterPrompts('Illustrious', params);

      return {
        vae: 'Anillustrious-v4',
        seed: -1,
        model: 'Anillustrious-v4',
        steps: 30,
        width: params.size?.width || 1024,
        height: params.size?.height || 1024,
        prompt: params.prompt,
        refiner: false,
        upscale: 'Original',
        cfg_scale: 7,
        clip_skip: 2,
        pag_scale: 0,
        scheduler: 'Euler a beta',
        adetailer_face: false,
        adetailer_hand: false,
        refiner_prompt: '',
        negative_prompt: `nsfw, naked, nude, sex, explicit, ass, vagina, pussy, penis, breasts, mature, fetish, bondage, bdsm, violence, gore, blood, pornography, bottomless, anal, nipples, underwear, lingerie, partially undressed, cum, orgasm, penetration, dildo, sex toy, masturbation, camel toe, bikini, undressed, ${params.negative_prompt || ''}`,
        adetailer_person: false,
        guidance_rescale: 1,
        refiner_strength: 0.8,
        prepend_preprompt: true,
        prompt_conjunction: true,
        adetailer_face_prompt: '',
        adetailer_hand_prompt: '',
        adetailer_person_prompt: '',
        negative_prompt_conjunction: false,
        adetailer_face_negative_prompt: '',
        adetailer_hand_negative_prompt: '',
        adetailer_person_negative_prompt: '',
      };
    },
    alias: 'Illustrious',
    cost: (params: any) => IMAGE_ILLUSTRIOUS,
  },
  [ModelIds.NOOBAI_XL]: {
    name: 'delta-lock/noobai-xl:d09db5fc24b8b6573b095c2bd845b58242dce8f996b034fa865130bf1075858f',
    platform: 'replicate',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      await generatePrompt('NoobaiXL', params);
      await replaceCharacterPrompts('NoobaiXL', params);

      let imageSize = { width: 1184, height: 864 };
      if (params.size === 'square') {
        imageSize = { width: 1024, height: 1024 };
      } else if (params.size === 'landscape') {
        imageSize = { width: 1152, height: 768 };
      } else if (params.size === 'portrait') {
        imageSize = { width: 768, height: 1152 };
      } else if (params.size?.width && params.size?.height) {
        imageSize = {
          width: params.size.width,
          height: params.size.height,
        };
      }

      return {
        vae: 'default',
        seed: -1,
        model: 'amanatsuIllustrious_v11',
        steps: 35,
        width: imageSize.width || 1184,
        height: imageSize.height || 864,
        prompt: params.prompt,
        strength: 0.7,
        cfg_scale: 5,
        clip_skip: 1,
        pag_scale: 3,
        scheduler: 'DPM++ 2M SDE Karras',
        batch_size: 1,
        blur_factor: 5,
        negative_prompt: params.negative_prompt,
        guidance_rescale: 0.5,
        prepend_preprompt: true,
      };
    },
    alias: 'NoobaiXL',
    cost: () => IMAGE_NOOBAI_XL,
  },
  [ModelIds.SEEDREAM]: {
    name: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      const { imageSize } = parseSeedreamSize(params.size);
      const { prompt, initImages } = await parseSeedreamPrompt(params);
      if (initImages?.length) {
        return {
          prompt,
          image_urls: initImages,
          image_size: imageSize,
          enable_safety_checker: false,
        };
      }
      return {
        prompt,
        image_size: imageSize,
        enable_safety_checker: false,
      };
    },
    alias: 'Seedream',
    cost: () => IMAGE_SEEDREAM,
    upgradeToModelByInput: input => {
      if (input.image_urls?.length) {
        return ModelIds.SEEDREAM_EDIT;
      }
      return ModelIds.SEEDREAM;
    },
  },
  [ModelIds.SEEDREAM_EDIT]: {
    name: 'fal-ai/bytedance/seedream/v4.5/edit',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      const { imageSize } = parseSeedreamSize(params.size);
      const { prompt, initImages } = await parseSeedreamPrompt(params);
      return {
        prompt,
        image_urls: initImages,
        image_size: imageSize,
        enable_safety_checker: false,
      };
    },
    alias: 'Seedream Edit',
    cost: () => IMAGE_SEEDREAM,
  },
  // Seedream v4 (Legacy)
  [ModelIds.SEEDREAM_V4]: {
    name: 'fal-ai/bytedance/seedream/v4/text-to-image',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      const { imageSize } = parseSeedreamSize(params.size);
      const { prompt, initImages } = await parseSeedreamPrompt(params);
      if (initImages?.length) {
        return {
          prompt,
          image_urls: initImages,
          image_size: imageSize,
          enable_safety_checker: false,
        };
      }
      return {
        prompt,
        image_size: imageSize,
        enable_safety_checker: false,
      };
    },
    alias: 'Seedream 4',
    cost: () => IMAGE_SEEDREAM_V4,
    upgradeToModelByInput: input => {
      if (input.image_urls?.length) {
        return ModelIds.SEEDREAM_V4_EDIT;
      }
      return ModelIds.SEEDREAM_V4;
    },
  },
  [ModelIds.SEEDREAM_V4_EDIT]: {
    name: 'fal-ai/bytedance/seedream/v4/edit',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      const { imageSize } = parseSeedreamSize(params.size);
      const { prompt, initImages } = await parseSeedreamPrompt(params);
      return {
        prompt,
        image_urls: initImages,
        image_size: imageSize,
        enable_safety_checker: false,
      };
    },
    alias: 'Seedream 4 Edit',
    cost: () => IMAGE_SEEDREAM_V4,
  },
  [ModelIds.ANIMAGINE_XL_3_1]: {
    name: 'cjwbw/animagine-xl-3.1:6afe2e6b27dad2d6f480b59195c221884b6acc589ff4d05ff0e5fc058690fbb9',
    platform: 'replicate',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      await generatePrompt('Animagine', params);
      await replaceCharacterPrompts('Animagine', params);

      let image_size;
      if (params.size === 'square') {
        image_size = {
          width: normalizeDimension(1024),
          height: normalizeDimension(1024),
        };
      } else if (params.size === 'landscape') {
        image_size = {
          width: normalizeDimension(1152),
          height: normalizeDimension(768),
        };
      } else if (params.size === 'portrait') {
        image_size = {
          width: normalizeDimension(768),
          height: normalizeDimension(1152),
        };
      } else {
        image_size = {
          width: normalizeDimension(params.size?.width || 896),
          height: normalizeDimension(params.size?.height || 1152),
        };
      }

      return {
        width: image_size.width || 896,
        height: image_size.height || 1152,
        prompt: params.prompt,
        guidance_scale: 7,
        style_selector: '(None)',
        negative_prompt: params.negative_prompt || '',
        quality_selector: 'Standard v3.1',
        num_inference_steps: 28,
      };
    },
    alias: 'Animagine',
    cost: (params: any) => IMAGE_ANIMAGINE_XL_3_1,
  },
  [ModelIds.FLUX_KONTEXT]: {
    name: 'fal-ai/flux-kontext-lora/text-to-image',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      // Replace character IDs with placeholders (Alex, Blair, etc.)
      const finalPrompt = replaceCharacterId(params.prompt);

      // Calculate aspect ratio and image size
      let imageSize = {
        width: 1024,
        height: 1024,
      };

      if (!params.size) {
        // Use default
      } else if (params.size === 'square') {
        imageSize = {
          width: 1024,
          height: 1024,
        };
      } else if (params.size === 'landscape') {
        imageSize = {
          width: 768,
          height: 1024,
        };
      } else if (params.size === 'portrait') {
        imageSize = {
          width: 1024,
          height: 768,
        };
      } else {
        imageSize = {
          width: params.size.width,
          height: params.size.height,
        };
      }

      // Handle character references
      const character_ids = getCharacterIds(params.prompt);
      let characterRefPrompt = '';
      if (character_ids.length) {
        const characterId = character_ids[0];
        characterRefPrompt = `Input image is the portrait of character <${characterId}>.`;
        if (characterRefPrompt) {
          characterRefPrompt = `${characterRefPrompt}
    The generated image should keep the same identity, appearance, facial features, clothing of the input character images.`;
        }
      }

      const promptImproved = `${characterRefPrompt}
  Generate a high quality image with the following prompt: ${finalPrompt}`;

      // Text-to-image mode
      return {
        prompt: promptImproved,
        image_size: imageSize,
        enable_safety_checker: false,
      };
    },
    alias: 'Flux',
    cost: (params: any) => IMAGE_FLUX_KONTEXT,
  },
  [ModelIds.FLUX_KONTEXT_DEV]: {
    name: 'fal-ai/flux-kontext/dev',
    platform: 'fal',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      // Replace character IDs with placeholders (Alex, Blair, etc.)
      const finalPrompt = replaceCharacterId(params.prompt);

      // Calculate aspect ratio
      let aspect_ratio: string | undefined;
      if (!params.size) {
        aspect_ratio = undefined;
      } else if (params.size === 'square') {
        aspect_ratio = '1:1';
      } else if (params.size === 'landscape') {
        aspect_ratio = '4:3';
      } else if (params.size === 'portrait') {
        aspect_ratio = '3:4';
      } else {
        const width = params.size.width;
        const height = params.size.height;
        // Calculate closest aspect ratio
        const ratios = [
          21 / 9,
          16 / 9,
          3 / 2,
          4 / 3,
          5 / 4,
          1 / 1,
          4 / 5,
          3 / 4,
          2 / 3,
          9 / 16,
          9 / 21,
        ];
        const ratio_strs = [
          '21:9',
          '16:9',
          '3:2',
          '4:3',
          '5:4',
          '1:1',
          '4:5',
          '3:4',
          '2:3',
          '9:16',
          '9:21',
        ];
        const closestRatio = ratios.reduce(
          /* eslint-disable-next-line */
          (closest, ratio) =>
            Math.abs(ratio - width / height) <
            Math.abs(closest - width / height)
              ? ratio
              : closest,
          ratios[0],
        );
        aspect_ratio = ratio_strs[ratios.indexOf(closestRatio)];
      }

      // Handle character references and image
      let init_images = params.init_images || [];
      const character_ids = getCharacterIds(params.prompt);

      // If there's a character ID, fetch character image from database
      if (character_ids?.length) {
        const { data: characterData } = await supabase
          .from('CustomCharacters')
          .select('character_pfp,character_uniqid')
          .eq('character_uniqid', character_ids[0])
          .single();
        if (characterData?.character_pfp) {
          init_images = [characterData.character_pfp];
        }
      }

      let characterRefPrompt = '';
      if (character_ids.length) {
        const characterId = character_ids[0];
        characterRefPrompt = `Input image is the portrait of character <${characterId}>.`;
        if (characterRefPrompt) {
          characterRefPrompt = `${characterRefPrompt}
    The generated image should keep the same identity, appearance, facial features, clothing of the input character images.`;
        }
      }

      const promptImproved = `${characterRefPrompt}
      ${init_images?.length && !characterRefPrompt ? 'Use the input image as a reference image, smartly reference it when generating the image.' : ''}
  Generate a high quality image with the following prompt: ${finalPrompt}`;

      // Image-to-image mode
      const image = init_images?.[0] || params.image;
      if (!image) {
        throw new Error('Image is required for FLUX_KONTEXT_DEV model');
      }

      return {
        prompt: promptImproved,
        image_url: image,
        enable_safety_checker: false,
        resolution_mode: aspect_ratio || 'match_input',
      };
    },
    alias: 'Flux',
    cost: (params: any) => IMAGE_FLUX_KONTEXT,
  },
  [ModelIds.GEMINI_NANO_BANANA]: {
    name: 'gemini',
    platform: 'gemini',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) => {
      // Check if middleware processing is needed
      if (PromptMiddlewareProcessor.needsMiddleware(params)) {
        const prompt = await PromptMiddlewareProcessor.processPrompt(params);
        return { ...params, prompt };
      }
      return params;
    },
    /* eslint-disable-next-line */
    alias: params =>
      params.model === 'Gemini Pro'
        ? 'Gemini Nano Banana Pro'
        : 'Gemini Nano Banana',
    /* eslint-disable-next-line */
    cost: (params: any) =>
      params.model === 'Gemini Pro' ? IMAGE_GEMINI_3_PREVIEW : IMAGE_GEMINI,
  },
  [ModelIds.ART_PRO]: {
    name: 'kusa-art-pro',
    platform: 'kusa',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) =>
      parseKusaParamsWithMiddleware('Art Pro', params, {
        negativePrompt: '(nsfw:1.4),sexy,sex,nipples, pussy',
      }),
    alias: 'Art Pro',
    cost: () => IMAGE_ART_PRO,
  },
  [ModelIds.ART_UNLIMITED]: {
    name: 'kusa-art-unlimited',
    platform: 'kusa',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) =>
      parseKusaParamsWithMiddleware('Art Unlimited', params),
    alias: 'Art Unlimited',
    cost: () => IMAGE_ART_PRO,
  },
  [ModelIds.KUSAXL]: {
    name: 'kusa-xl',
    platform: 'kusa',
    type: TASK_TYPES.IMAGE,
    parseParams: async (params: any) =>
      parseKusaParamsWithMiddleware('KusaXL', params, {
        removeStyleTag: false,
        styleId: '1',
      }),
    alias: 'KusaXL',
    cost: () => IMAGE_KUSAXL,
  },
  [ModelIds.WAN_22_TURBO_IMAGE_TO_VIDEO]: {
    name: 'fal-ai/wan/v2.2-a14b/image-to-video/turbo',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      let imageUrl = params.image;
      let prompt = params.prompt;

      if (params.images && params.images.length > 0) {
        imageUrl = params.images[0];
      }

      if (imageUrl && params.imageNames && params.imageNames.length > 0) {
        prompt = generateMultiImagePrompt(params.imageNames, params.prompt);
      }

      const requestBody: any = {
        prompt,
        image_url: imageUrl,
        aspect_ratio: 'auto',
        resolution: params.resolution,
        enable_safety_checker: false,
        enable_output_safety_checker: false,
        enable_prompt_expansion: true,
      };

      if (params.end_frame) {
        requestBody.end_image_url = params.end_frame;
      }

      return requestBody;
    },
    alias: 'Wan 2.2 Turbo',
    originalCode: ImageToVideoModel.WAN_22_TURBO,
    cost: (params: any) =>
      calculateImageToAnimationCost(
        ImageToVideoModel.WAN_22_TURBO,
        params.duration,
        params.resolution,
      ),
  },
  [ModelIds.WAN_22_TURBO_TEXT_TO_VIDEO]: {
    name: 'fal-ai/wan/v2.2-a14b/text-to-video',
    platform: 'fal',
    type: TASK_TYPES.VIDEO,
    parseParams: async (params: any) => {
      // Use middleware processor for prompt handling
      const prompt = await PromptMiddlewareProcessor.processPrompt(
        params,
        parseTextToVideoStyle,
      );

      return {
        prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        resolution: params.resolution || '720p',
        enable_safety_checker: false,
        enable_output_safety_checker: false,
        enable_prompt_expansion: true,
      };
    },
    alias: 'Wan 2.2 Turbo Text to Video',
    originalCode: TextToVideoModel.WAN_22_TURBO,
    cost: (params: any) =>
      calculateTextToVideoCost(
        TextToVideoModel.WAN_22_TURBO,
        params.duration,
        params.resolution,
      ),
  },
} as const;
