// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CreditModel } from '../_models/credit.js';
import Replicate from 'replicate';
import { IMAGE_ANIMAGINE_XL_3_1 } from '../tools/_zaps.js';
import { failed, getUserId, uploadImageToSupabase } from '../_utils/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { replaceCharacterPromptsMiddleware } from '../_utils/middlewares/replaceCharacterPrompts.js';
import { GenerationResult } from '../_utils/types.js';
import { generatePromptMiddleware } from '../_utils/middlewares/improvePrompt.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to normalize dimensions to be divisible by 8
const normalizeDimension = (dimension: number): number =>
  Math.floor(dimension / 8) * 8;

const fetchImage = async (input: any) => {
  try {
    const output = await replicate.run(
      'cjwbw/animagine-xl-3.1:6afe2e6b27dad2d6f480b59195c221884b6acc589ff4d05ff0e5fc058690fbb9',
      {
        input,
      },
    );

    return output;
  } catch {
    return '';
  }
};

async function handler(request: Request) {
  try {
    const {
      prompt,
      originalPrompt,
      userPrompt,
      negative_prompt,
      size,
      num_images,
      store_supabase,
      tool,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Animagine',
      generationResult: GenerationStatus.FAILED,
      tool,
      cost: 0,
    });
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
      });
    }

    const userId = getUserId(request);
    // Check if user has enough credits
    const creditModel = new CreditModel(userId as string);
    const cost = num_images * IMAGE_ANIMAGINE_XL_3_1;
    const success = await creditModel.canConsume(cost);
    if (!success) {
      return new Response(JSON.stringify({ error: 'no zaps' }), {
        status: 402,
      });
    }

    let image_size;
    if (size === 'square') {
      image_size = {
        width: normalizeDimension(1024),
        height: normalizeDimension(1024),
      };
    } else if (size === 'landscape') {
      image_size = {
        width: normalizeDimension(1152),
        height: normalizeDimension(768),
      };
    } else if (size === 'portrait') {
      image_size = {
        width: normalizeDimension(768),
        height: normalizeDimension(1152),
      };
    } else {
      image_size = {
        width: normalizeDimension(size.width || 896),
        height: normalizeDimension(size.height || 1152),
      };
    }

    const imageUrls: string[] = [];
    const requests: Promise<any>[] = [];

    // console.log('Start fetching');
    const body = {
      width: image_size.width || 896,
      height: image_size.height || 1152,
      prompt,
      guidance_scale: 7,
      style_selector: '(None)',
      negative_prompt,
      quality_selector: 'Standard v3.1',
      num_inference_steps: 28,
    };
    for (let i = 0; i < Number(num_images); i++) {
      requests.push(fetchImage(body));
    }

    const results = await Promise.all(requests);
    const generations: GenerationResult[] = [];

    for (const result of results) {
      // Skip empty results
      if (!result || result.trim() === '') {
        console.log('Skipping empty result');
        continue;
      }

      let imageUrl = '';
      let imageUrlPath = '';

      if (store_supabase) {
        const imageUri = result;
        const supaResult = await uploadImageToSupabase(
          imageUri,
          userId as string,
        );
        imageUrl = supaResult;
        imageUrls.push(imageUrl);
        imageUrlPath = imageUrl.replace(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
          '',
        );
      }

      if (imageUrl === '') {
        imageUrls.push(result); // Use the original Replicate URL if Supabase upload failed
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: userPrompt ?? originalPrompt ?? prompt,
            model: 'Animagine',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image animagine error', error);
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
      model: 'Animagine',
      generationResult: GenerationStatus.SUCCEEDED,
      tool,
      cost,
    });
    return new Response(JSON.stringify(generations), { status: 200 });
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
    });
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  replaceCharacterPromptsMiddleware,
  generatePromptMiddleware('Animagine'),
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
