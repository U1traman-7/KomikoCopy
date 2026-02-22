/* eslint-disable */
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CreditModel } from '../_models/credit.js';
import Replicate from 'replicate';
import { IMAGE_ANIMAGINE_XL_4 } from '../tools/_zaps.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import { failed, uploadImageToSupabase } from '../_utils/index.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
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

const fetchImage = async (input: any) => {
  try {
    const output = await replicate.run(
      'aisha-ai-official/animagine-xl-4.0:057e2276ac5dcd8d1575dc37b131f903df9c10c41aed53d47cd7d4f068c19fa5',
      {
        input,
      },
    );

    return output[0];
  } catch (e) {
    console.error('Error generating image:', e);
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
      ip_adapter_images,
      init_images,
      store_supabase,
      tool,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Animagine XL 4.0',
      generationResult: GenerationStatus.FAILED,
      tool,
      cost: 0,
    });
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
      });
    }

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Log in to generate images' }),
        { status: 401 },
      );
    }
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
      });
    }
    const userId = token.id;

    // Check if user has enough credits
    const creditModel = new CreditModel(userId as string);
    const cost = num_images * IMAGE_ANIMAGINE_XL_4;
    const success = await creditModel.canConsume(cost);
    if (!success) {
      return new Response(JSON.stringify({ error: 'no zaps' }), {
        status: 402,
      });
    }

    let image_size;
    if (size === 'square') {
      image_size = {
        width: 1024,
        height: 1024,
      };
    } else if (size === 'landscape') {
      image_size = {
        width: 1152,
        height: 768,
      };
    } else if (size === 'portrait') {
      image_size = {
        width: 768,
        height: 1152,
      };
    } else {
      image_size = size;
    }

    const imageUrls: string[] = [];
    const requests: Promise<any>[] = [];
    const generations: GenerationResult[] = [];

    console.log('Start fetching');
    const body = {
      vae: 'default',
      seed: -1,
      model: 'Animagine-XL-4.0',
      steps: 28,
      width: image_size.width || 1024,
      height: image_size.height || 1024,
      prompt: prompt,
      cfg_scale: 5,
      clip_skip: 1,
      pag_scale: 3,
      scheduler: 'Euler a',
      batch_size: 1,
      negative_prompt: negative_prompt,
      guidance_rescale: 0.5,
      prepend_preprompt: true,
    };
    for (let i = 0; i < Number(num_images); i++) {
      requests.push(fetchImage(body));
    }

    const results = await Promise.all(requests);

    const getImageExtension = (url: string) => {
      try {
        const urlObj = new URL(url);
        if (!urlObj) {
          return '';
        }
        const path = urlObj.pathname;
        return path.split('.').pop();
      } catch (e) {
        return '';
      }
    };

    for (const result of results) {
      // Skip empty results
      if (!result || result.trim() === '') {
        console.log('Skipping empty result');
        continue;
      }

      let imageUrl = '';
      let imageUrlPath = '';

      if (store_supabase) {
        // Fetch the image from Replicate URL
        const response = await fetch(result);
        const imageBlob = await response.blob();

        const ext = getImageExtension(result) || 'webp';
        let imagePath = `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.${ext}`;
        const supaResult = await supabase.storage
          .from('husbando-land')
          .upload(imagePath, imageBlob);

        if (!supaResult.error) {
          imageUrl = supabase.storage
            .from('husbando-land')
            .getPublicUrl(imagePath).data.publicUrl;
          imageUrls.push(imageUrl);
          imageUrlPath = imageUrl.replace(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
            '',
          );
        }
      }

      if (imageUrl === '') {
        imageUrls.push(result); // Use the original Replicate URL if Supabase upload failed
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: userPrompt ?? originalPrompt ?? prompt,
            model: 'Animagine XL 4.0',
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
      model: 'Animagine XL 4.0',
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
  generatePromptMiddleware('Animagine'),
  replaceCharacterPromptsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
