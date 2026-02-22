import fal from '@fal-ai/serverless-client';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit';
import { failed, uploadImageToSupabase } from '../_utils/index';
import { GenerationStatus, TASK_TYPES } from '../_constants';
import withHandler from '../_utils/withHandler';
import { authMiddleware } from '../_utils/middlewares/auth';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index';
import { IMAGE_SDXL } from '../tools/_zaps';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate';
import { translateMiddleware } from '../_utils/middlewares/translate';
import { GenerationResult } from '../_utils/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

fal.config({
  credentials: process.env.fal_api_key,
});

async function handler(request: Request) {
  try {
    const {
      prompt,
      originalPrompt,
      negative_prompt,
      size,
      num_images,
      store_supabase,
      tool,
      meta_data,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'SDXL',
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
    const cost = num_images * IMAGE_SDXL;
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
    }

    const result: any = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt: originalPrompt ?? prompt,
        negative_prompt: negative_prompt,
        image_size: image_size,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: num_images,
        loras: [],
        embeddings: [],
        enable_safety_checker: false,
        format: 'jpeg',
      },
      logs: true,
      onQueueUpdate: update => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map(log => log.message).forEach(console.log);
        }
      },
    });

    const imageUrls = result.images.map((image: any) => image.url);
    const generations: GenerationResult[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      let imageUrlPath = '';

      if (store_supabase) {
        const supaResult = await uploadImageToSupabase(
          imageUrl,
          userId as string,
        );
        if (supaResult) {
          imageUrlPath = supaResult.replace(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
            '',
          );
        }
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: originalPrompt ?? prompt,
            model: 'SDXL',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      if (error || !data) {
        console.error('generate image SDXL error', error);
        generations.push({ id: -1, url: imageUrl });
      } else {
        generations.push({ id: data.id, url: imageUrl });
      }
    }

    const result2 = await creditModel.deductCredit(cost, tool);
    if (!result2) {
      return failed('no zaps');
    }

    bindGenerationLogData(request, {
      model: 'SDXL',
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
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
