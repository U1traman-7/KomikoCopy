import Replicate from 'replicate';
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
import { IMAGE_ILLUSTRIOUS } from '../tools/_zaps.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { GenerationResult } from '../_utils/types.js';
import { generatePromptMiddleware } from '../_utils/middlewares/improvePrompt.js';
import { replaceCharacterPromptsMiddleware } from '../_utils/middlewares/replaceCharacterPrompts.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const fetchImage = async (params: any): Promise<string> => {
  const output = await replicate.run(
    'aisha-ai-official/anillustrious-v4:80441e2c32a55f2fcf9b77fa0a74c6c86ad7deac51eed722b9faedb253265cb4',
    {
      input: {
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
        negative_prompt: `nsfw, naked, nude, sex, explicit, ass, vagina, pussy, penis, breasts, mature, fetish, bondage, bdsm, violence, gore, blood, pornography, bottomless, anal, nipples, underwear, lingerie, partially undressed, cum, orgasm, penetration, dildo, sex toy, masturbation, camel toe, bikini, undressed, ${params.negative_prompt}`,
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
      },
    },
  );
  return output[0];
};

async function handler(request: Request) {
  try {
    const {
      prompt,
      originalPrompt,
      userPrompt,
      negative_prompt = '',
      num_images,
      size,
      store_supabase,
      tool,
    } = (request as any).params;

    bindGenerationLogData(request, {
      model: 'Illustrious',
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

    const imageCost = IMAGE_ILLUSTRIOUS;
    const cost = imageCost * (num_images || 1);
    const creditModel = new CreditModel(userId as string);
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

    const imageUrls: string[] = [];
    const requests: Promise<string | null>[] = [];

    for (let i = 0; i < (num_images || 1); i++) {
      const request = fetchImage({
        prompt,
        negative_prompt,
        size,
      }).catch(error => {
        console.error('Image generation failed:', error);
        return null;
      });
      requests.push(request);
    }

    const results = await Promise.all(requests);
    const validResults = results.filter(
      (image): image is string => image !== null,
    );

    if (validResults.length === 0) {
      return new Response(JSON.stringify({ error: 'Generation failed' }), {
        status: 500,
      });
    }

    const generations: GenerationResult[] = [];

    for (const result of validResults) {
      let imageUrl = '';
      let imageUrlPath = '';

      if (store_supabase) {
        const supaResult = await uploadImageToSupabase(
          result,
          userId as string,
          undefined,
          tool === 'oc-maker' || tool === 'ai-comic-generator',
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
        imageUrls.push(result);
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: userPrompt ?? originalPrompt ?? prompt,
            model: 'Illustrious',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image illustrious error', error);
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
      model: 'Illustrious',
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
  translateMiddleware,
  generatePromptMiddleware('Illustrious'),
  replaceCharacterPromptsMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
