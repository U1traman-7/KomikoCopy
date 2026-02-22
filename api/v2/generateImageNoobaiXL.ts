// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit.js';
import Replicate from 'replicate';
import { IMAGE_NOOBAI_XL } from '../tools/_zaps.js';
import { failed, uploadImageToSupabase } from '../_utils/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
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
      'delta-lock/noobai-xl:d09db5fc24b8b6573b095c2bd845b58242dce8f996b034fa865130bf1075858f',
      {
        input,
      },
    );
    // console.log(output);
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
      store_supabase,
      tool,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Noobai',
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
    const cost = num_images * IMAGE_NOOBAI_XL;
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

    // console.log('Start fetching');
    const body = {
      vae: 'default',
      seed: -1,
      model: 'amanatsuIllustrious_v11',
      steps: 35,
      width: image_size.width || 1184,
      height: image_size.height || 864,
      prompt,
      strength: 0.7,
      cfg_scale: 5,
      clip_skip: 1,
      pag_scale: 3,
      scheduler: 'DPM++ 2M SDE Karras',
      batch_size: 1,
      blur_factor: 5,
      negative_prompt,
      guidance_rescale: 0.5,
      prepend_preprompt: true,
    };
    for (let i = 0; i < Number(num_images); i++) {
      requests.push(fetchImage(body));
    }

    const results = await Promise.all(requests);

    for (const result of results) {
      // Skip empty results
      if (!result || result.trim() === '') {
        console.log('Skipping empty result');
        continue;
      }

      let imageUrl = '';
      let imageUrlPath = '';

      if (store_supabase) {
        const supaResult = await uploadImageToSupabase(
          result,
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
        imageUrls.push(result); // Use the original Replicate URL if Supabase upload failed
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: userPrompt ?? originalPrompt ?? prompt,
            model: 'Noobai',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image noobai error', error);
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
      model: 'Noobai',
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
  translateMiddleware,
  generatePromptMiddleware('NoobaiXL'),
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
