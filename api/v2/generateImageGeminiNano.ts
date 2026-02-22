import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit.js';
import {
  failed,
  fetchGemini,
  getUserId,
  uploadImageToSupabase,
  deleteMediaByUrl,
  fetchGeminiNano,
} from '../_utils/index.js';
import {
  IMAGE_GEMINI,
  IMAGE_GEMINI_MINI,
  IMAGE_GEMINI_PRO_1K,
  IMAGE_GEMINI_PRO_2K,
  IMAGE_GEMINI_PRO_4K,
} from '../tools/_zaps.js';
import { GoogleGenAI } from '@google/genai';
import withHandler from '../_utils/withHandler.js';
import {
  authMiddleware,
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import {
  GENERAL_STYLES,
  GenerationStatus,
  ModelIds,
  TASK_TYPES,
} from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { GenerationResult } from '../_utils/types.js';
import {
  generatePromptMiddleware,
  parseStyleToPrompt,
} from '../_utils/middlewares/improvePrompt.js';
import { waitUntil } from '@vercel/functions';
import { randomUUID } from 'node:crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type GeminiModelVersion =
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

const fetchGeminiImage = async (
  prompt: string,
  imageSize: { width: number; height: number } = { width: 1024, height: 1024 },
  init_images: string[] = [],
  meta_data?: any,
  modelVersion: GeminiModelVersion = 'gemini-2.5-flash-image',
  resolution?: '1k' | '2k' | '4k',
) => {
  // const API_KEY = Math.random() > 0.5 ? 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE' : 'AIzaSyDc17N7ac38TCa6ILQrYkhRTOl2S6mpWh4'
  const API_KEY = process.env.GEMINI_API_KEY!;
  // const genAI = new GoogleGenerativeAI(API_KEY);
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  // const model = genAI.getGenerativeModel({
  //   model: 'gemini-2.5-flash-image',
  //   generationConfig,
  // });

  // console.log('model', model);
  let aspectRatio = '1:1';
  let shape = 'square';

  const ratio = imageSize.width / imageSize.height;

  if (Math.abs(ratio - 1) < 0.01) {
    // 1:1 (square)
    aspectRatio = '1:1';
    shape = 'square';
  } else if (Math.abs(ratio - 16 / 9) < 0.01) {
    // 16:9 (landscape)
    aspectRatio = '16:9';
    shape = 'landscape';
  } else if (Math.abs(ratio - 9 / 16) < 0.01) {
    // 9:16 (portrait)
    aspectRatio = '9:16';
    shape = 'portrait';
  } else if (Math.abs(ratio - 3 / 4) < 0.01) {
    // 3:4 (portrait)
    aspectRatio = '3:4';
    shape = 'portrait';
  } else if (Math.abs(ratio - 2 / 3) < 0.01) {
    // 2:3 (portrait)
    aspectRatio = '2:3';
    shape = 'portrait';
  } else if (Math.abs(ratio - 4 / 3) < 0.01) {
    // 4:3 (landscape)
    aspectRatio = '4:3';
    shape = 'landscape';
  } else {
    // Default to 1:1 for any unrecognized ratio
    aspectRatio = '1:1';
    shape = 'square';
  }

  // Support both @character_id and <character_id> formats
  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const character_ids: string[] = [];
  let match = reg.exec(prompt);
  while (match) {
    // match[1] is for @character_id, match[2] is for <character_id>
    character_ids.push(match[1] || match[2]);
    match = reg.exec(prompt);
  }

  const promptImproved = `
    Image generation prompt: ${prompt}
    `;

  const imageSizeParam = resolution
    ? (resolution.toUpperCase() as '1K' | '2K' | '4K')
    : undefined;

  if (!character_ids.length && !init_images.length) {
    const response = await fetchGeminiNano(
      promptImproved,
      aspectRatio,
      modelVersion,
      imageSizeParam,
    );

    if (
      (response.candidates![0].finishReason as string) === 'IMAGE_SAFETY' ||
      (response.candidates![0].finishReason as string) ===
        'PROHIBITED_CONTENT' ||
      response.candidates![0].content?.parts?.filter(part => part.inlineData)
        ?.length === 0
    ) {
      return {
        error: "Image generation failed due to Google's content moderation",
      };
    }
    const data = response.candidates![0].content?.parts;
    return data
      ?.filter(part => part.inlineData)
      ?.map(
        part =>
          `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
      );
  }

  const { data, error } = await supabase
    .from('CustomCharacters')
    .select('character_pfp,character_uniqid')
    .in('character_uniqid', character_ids);
  if (error) {
    console.error(error);
    return { error: 'Error fetching characters' };
  }
  // If no data found, it might be official characters (not in database)
  // Continue with empty data array instead of returning error
  if (!data || data.length === 0) {
    console.log(
      'No character data found (might be official characters):',
      character_ids,
    );
  }

  // 将图片转换为base64
  const imageToBase64 = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return Buffer.from(await blob.arrayBuffer()).toString('base64');
  };

  const characterParts = (
    await Promise.all(
      data.map(async ({ character_pfp, character_uniqid }, index) => {
        const base64 = await imageToBase64(character_pfp);
        const urlObj = new URL(character_pfp);
        const mimeType = `image/${urlObj?.pathname.split('.').pop()}`;

        return [
          {
            text: `Input image ${index + 1} is the portrait of character <${character_uniqid}>:. `,
          },
          {
            inlineData: {
              data: base64,
              mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            },
          },
        ];
      }),
    )
  ).flat();

  const referenceParts = (
    await Promise.all(
      init_images?.map(async (base64, idx) => {
        let base64Data = base64;
        let mimeType = '';
        if (/https?:\/\//.test(base64)) {
          const response = await fetch(base64);
          const blob = await response.blob();
          base64Data = Buffer.from(await blob.arrayBuffer()).toString('base64');
          mimeType = blob.type;
        } else {
          base64Data = base64.split(',')[1];
          mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
        }

        // Build reference image description with names if provided
        let beforeText = '';
        const characterCount = character_ids.length;
        const reference_names = meta_data?.reference_names || [];

        if (reference_names && reference_names.length > 0) {
          const imageName = reference_names[idx] || `reference${idx + 1}`;
          const imageNumber = characterCount + idx + 1;
          beforeText = `Input image ${imageNumber} is a reference image named "${imageName}". When the prompt mentions "${imageName}" or <${imageName}>, it refers to this specific reference image. The generated image should incorporate elements from this reference image as specified in the prompt.`;
        } else {
          beforeText =
            'The input image is a character/reference image. The generated image should preserve identity, appearance, facial features and clothing as appropriate, and follow the prompt.';
        }

        return [
          {
            text: beforeText,
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            },
          },
        ];
      }),
    )
  ).flat();

  // Build imageConfig - only include imageSize for Gemini 3 Pro
  const imageConfig: { aspectRatio?: string; imageSize?: string } = {
    aspectRatio,
  };
  if (modelVersion === 'gemini-3-pro-image-preview' && imageSizeParam) {
    imageConfig.imageSize = imageSizeParam;
  }

  const response = await ai.models.generateContent({
    model: modelVersion,
    contents: [...characterParts, ...referenceParts, { text: promptImproved }],
    config: {
      imageConfig,
      ...generationConfig,
    },
  });
  if (
    (response.candidates![0].finishReason as string) === 'IMAGE_SAFETY' ||
    (response.candidates![0].finishReason as string) === 'PROHIBITED_CONTENT' ||
    response.candidates![0].content?.parts?.filter(part => part.inlineData)
      ?.length === 0
  ) {
    return {
      error: "Image generation failed due to Google's content moderation",
    };
  }
  // const imageUrls = response.response
  const imageUrls = response
    ?.candidates![0].content?.parts?.filter(part => part.inlineData)
    ?.map(
      part =>
        `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
    );

  // Delete reference images after generation (only user-uploaded ones in app_media/references/)
  if (init_images && init_images.length > 0) {
    const referenceUrls = init_images.filter((url: string) =>
      url.includes('/app_media/references/'),
    );
    if (referenceUrls.length > 0) {
      await deleteMediaByUrl(referenceUrls);
      console.log('Deleted reference images:', referenceUrls);
    }
  }

  return imageUrls;
};

function hasError(err: any): err is { error: string } {
  if ((err as any)?.error) {
    return true;
  }
  return false;
}

type GenerationTaskPayload = {
  user_id: string;
  task_id: string;
  cost: number;
  model: string;
  platform: string;
  type: number;
  tool: string;
  status: number;
  payload: any;
  output: string;
  model_id: number;
};
const addGenerationTask = async (supabase: SupabaseClient, payload) => {
  const { error } = await supabase.from('generation_tasks').insert([payload]);
  if (error) {
    console.error('add generation task error', error);
    return false;
  }
  return true;
};

async function handler(request: Request) {
  try {
    const {
      prompt,
      originalPrompt,
      num_images,
      init_images,
      size: imageSize,
      store_supabase,
      tool,
      meta_data,
      model: modelParam,
    } = (request as any).params;

    // Gemini Mini is the same as Gemini
    // Determine which Gemini model version to use
    const isGeminiPro = modelParam === 'Gemini Pro';
    const geminiModelVersion: GeminiModelVersion = isGeminiPro
      ? 'gemini-3-pro-image-preview'
      : 'gemini-2.5-flash-image';

    // Get resolution from meta_data (only applicable for Gemini Pro)
    const resolution: '1k' | '2k' | '4k' | undefined = isGeminiPro
      ? meta_data?.resolution || '1k'
      : undefined;

    // Resolution-based pricing for Gemini Pro
    let unitCost: number;
    if (isGeminiPro) {
      switch (resolution) {
        case '2k':
          unitCost = IMAGE_GEMINI_PRO_2K;
          break;
        case '4k':
          unitCost = IMAGE_GEMINI_PRO_4K;
          break;
        default: // '1k'
          unitCost = IMAGE_GEMINI_PRO_1K;
          break;
      }
    } else if (modelParam === 'Gemini Mini') {
      unitCost = IMAGE_GEMINI_MINI;
    } else {
      unitCost = IMAGE_GEMINI;
    }
    const modelName = isGeminiPro
      ? 'Gemini (Nano Banana Pro)'
      : 'Gemini (Nano Banana)';

    bindGenerationLogData(request, {
      model: isGeminiPro ? 'Nano Banana Pro' : 'Nano Banana',
      generationResult: GenerationStatus.FAILED,
      tool,
      cost: 0,
    });
    if (!prompt) {
      return failed('Prompt is required');
    }
    const userId = getUserId(request);
    const creditModel = new CreditModel(userId as string);
    const success = await creditModel.canConsume(unitCost * (num_images || 1));
    if (!success) {
      return failed('no zaps');
    }
    const cost = unitCost * (num_images || 1);

    const imageUrls: string[] = [];
    const requests: Promise<any>[] = [];
    const generations: GenerationResult[] = [];
    const stylePrompt = parseStyleToPrompt(prompt ?? originalPrompt);

    const newPrompt = (prompt ?? originalPrompt).replace(/\[.+?\]/g, '');
    const newPromptWithStyle = stylePrompt
      ? `${newPrompt} ${stylePrompt}`
      : newPrompt;

    console.log(
      'promptImproved',
      newPromptWithStyle,
      'model:',
      geminiModelVersion,
    );

    for (let i = 0; i < (num_images || 1); i++) {
      requests.push(
        fetchGeminiImage(
          newPromptWithStyle,
          imageSize,
          init_images,
          meta_data,
          geminiModelVersion,
          resolution,
        ),
      );
    }

    const results = await Promise.all(requests);

    for (const result of results) {
      if (hasError(result)) {
        return failed(result.error);
      }

      const imageUri = Array.isArray(result)
        ? (result.find((u: any) => typeof u === 'string' && u) as
            | string
            | undefined)
        : undefined;
      let imageUrl = '';
      let imageUrlPath = '';

      if (imageUri) {
        if (store_supabase) {
          try {
            const uploadedUrl = await uploadImageToSupabase(
              imageUri,
              userId as string,
            );
            imageUrl = uploadedUrl;
            imageUrls.push(imageUrl);
            imageUrlPath = imageUrl.replace(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
              '',
            );
          } catch (err) {
            console.error(
              'Upload to Supabase failed, fallback to data URL:',
              err,
            );
          }
        }

        if (imageUrl === '') {
          imageUrls.push(imageUri);
        }
      } else {
        console.error('No image returned from Gemini for one request');
        imageUrls.push('');
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: originalPrompt ?? prompt,
            model: modelName,
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image gemini error', error);
        generations.push({ id: -1, url });
      } else {
        generations.push({ id: data.id, url });
      }
    }

    const result = await creditModel.deductCredit(cost, tool);
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: isGeminiPro ? 'Nano Banana Pro' : 'Nano Banana',
      generationResult: GenerationStatus.SUCCEEDED,
      tool,
      cost,
      meta_data: meta_data ?? null,
    });

    waitUntil(
      addGenerationTask(supabase, {
        user_id: userId,
        task_id: randomUUID(),
        cost,
        model: geminiModelVersion,
        platform: 'gemini',
        type: TASK_TYPES.IMAGE,
        tool,
        model_id: ModelIds.GEMINI_NANO_BANANA,
        output: generations.map(generation => generation.url).join(','),
        payload: JSON.stringify({
          prompt: newPromptWithStyle,
          imageSize,
          init_images: init_images.map((image: string) => {
            if (image?.match(/^https?:\/\//)) {
              return image;
            }
            return 'image_placeholder';
          }),
          meta_data,
          model: geminiModelVersion,
          resolution,
        }),
        status: GenerationStatus.SUCCEEDED,
      }),
    );
    return new Response(JSON.stringify(generations), { status: 200 });
  } catch (e) {
    console.error(e);
    return failed('Image generation failed');
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  // translateMiddleware,
  generatePromptMiddleware('Gemini'),
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
