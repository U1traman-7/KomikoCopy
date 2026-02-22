import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit.js';
import { failed, uploadImageToSupabase } from '../_utils/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { IMAGE_NETA } from '../tools/_zaps.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { replaceCharacterPromptsMiddleware } from '../_utils/middlewares/replaceCharacterPrompts.js';
import { GenerationResult } from '../_utils/types.js';
import { generatePromptMiddleware } from '../_utils/middlewares/improvePrompt.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
      meta_data,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Neta',
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
    const cost = num_images * IMAGE_NETA;
    const success = await creditModel.canConsume(cost);
    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            'Insufficient Zaps! Please visit the Profile page → click More Zaps',
        }),
        { status: 402 },
      );
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

    console.log('Start fetching');
    const body = JSON.stringify({
      prompt,
      negative_prompt,
      image_size,
      num_images: num_images || 1,
      ip_adapter_images,
      init_images,
      overwrite_strength: 0.6,
    });
    for (let i = 0; i < Number(num_images); i++) {
      requests.push(
        fetch('http://api2.runkomiko.com/generate_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).then(response => response.clone().json()),
      );
    }

    const results = await Promise.all(requests);
    const generations: GenerationResult[] = [];

    for (const result of results) {
      const imageData = result.images[0];
      const imageUri = `data:image/jpeg;base64,${imageData}`;
      let imageUrl = '';
      let imageUrlPath = '';

      if (store_supabase) {
        const supaResult = await uploadImageToSupabase(
          imageUri,
          userId as string,
        );
        if (supaResult) {
          imageUrl = supaResult;
          imageUrls.push(imageUrl);
          imageUrlPath = imageUrl.replace(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
            '',
          );
        }
      }
      if (imageUrl === '') {
        imageUrls.push(imageUri);
      }
      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: userPrompt ?? originalPrompt ?? prompt,
            model: 'Neta',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();
      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image neta error', error);
        generations.push({ id: -1, url });
      } else {
        generations.push({ id: data.id, url });
      }
    }
    // const { data: creditData2, error: error2 } = await supabase.from('User').select('credit').eq("id", userId).single();
    // if (error2) {
    //     throw error2;
    // }
    // await supabase.from('User').update({ credit: creditData2?.credit - num_images * 10 }).eq("id", userId);
    const result = await creditModel.deductCredit(cost, tool);
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: 'Neta',
      generationResult: GenerationStatus.SUCCEEDED,
      tool,
      cost,
      meta_data: meta_data ?? null,
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
  translateMiddleware,
  generatePromptMiddleware('Neta'), 
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
