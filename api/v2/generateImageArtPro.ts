/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit.js';
import {
  failed,
  failedWithCode,
  getUserId,
  hasError,
  unauthorized,
  uploadImageToSupabase,
} from '../_utils/index.js';
import {
  ERROR_CODES,
  GenerationStatus,
  KUSA_STYLES,
  TASK_TYPES,
} from '../_constants.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { IMAGE_ART_PRO, IMAGE_KUSAXL } from '../tools/_zaps.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { replaceCharacterPromptsMiddleware } from '../_utils/middlewares/replaceCharacterPrompts.js';
import { GenerationResult } from '../_utils/types.js';
import { generatePromptMiddleware } from '../_utils/middlewares/improvePrompt.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const parseStyleId = (prompt: string) => {
  const reg = /\[(.*?)\]/g;
  const match = prompt.match(reg);
  if (match) {
    // return match[0];
    const style = KUSA_STYLES.find(style => style.value === match[0]);
    if (style) {
      return style.id;
    }
    return '70';
  }
  return '70';
};

interface KusaImageResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface KusaResult {
  task_id: string;
  status: KusaStatus;
  error_message?: string;
  result: {
    images: {
      display_url: string;
      content_type: string;
    }[];
  };
}
type KusaStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';

const pollingKusaResult = (taskId: string) => {
  let withResolve: (value: {
    error?: string;
    imageUrl: string;
  }) => void = () => {};
  let running = true;
  const perform = () => {
    fetchKusaResult(taskId).then(result => {
      console.log('result', result);
      if (result.code) {
        running = false;
        withResolve({ error: result.message, imageUrl: '' });
        return;
      }
      if (result.data?.status === 'COMPLETED') {
        running = false;
        console.log(
          'result.data.result.images[0].original_url',
          result.data.result.images,
        );
        withResolve({ imageUrl: result.data.result.images[0].display_url });
        return;
      }
      if (result.data?.status === 'FAILED') {
        running = false;
        withResolve({
          error: result.data?.error_message || 'Failed to generate image',
          imageUrl: '',
        });
        return;
      }
    });
    setTimeout(() => {
      if (!running) {
        return;
      }
      perform();
    }, 5000);
  };
  return new Promise<{ imageUrl: string; error?: string }>(resolve => {
    withResolve = resolve;
    perform();
  });
};

const fetchKusaResult = async (taskId: string) => {
  const response = await fetch('https://api.kusa.pics/api/go/b2b/tasks/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.KUSA_API_KEY!,
    },
    body: JSON.stringify({ task_id: taskId }),
  });
  // return response.json();
  if (!response.ok) {
    return { code: 500, message: 'Failed to fetch kusa result', data: null };
  }
  const data = (await response.json()) as KusaImageResponse<KusaResult>;
  return data;
};

const fetchKusaImage = async (
  prompt: string,
  imageSize: { width: number; height: number },
  model: 'Art Pro' | 'Art Unlimited' | 'KusaXL' = 'Art Pro',
  userNegativePrompt?: string,
) => {
  // const result = await fetchKusaResult(taskId);
  let styleId: string | undefined;
  let newPrompt = prompt;
  const defaultNegativePrompt =
    model === 'Art Pro' ? '(nsfw:1.4),sexy,sex,nipples, pussy' : '';
  // Merge user's negative prompt with default safety prompts
  const negativePrompt = [userNegativePrompt, defaultNegativePrompt]
    .filter(Boolean)
    .join(', ');
  if (model !== 'KusaXL') {
    newPrompt = prompt.replace(/\[.*?\]/g, '');
    styleId = parseStyleId(prompt);
  } else {
    styleId = '1';
  }
  const body = JSON.stringify({
    task_type: 'TEXT_TO_IMAGE',
    params: {
      prompt: newPrompt + ', rating:general',
      style_id: styleId,
      // image_size: imageSize,
      width: imageSize.width || 960,
      height: imageSize.height || 1680,
      negative_prompt: negativePrompt,
      amount: 1,
    },
  });

  console.log(body, 'body');
  const response = await fetch(
    'https://api.kusa.pics/api/go/b2b/tasks/create ',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.KUSA_API_KEY!,
      },
      body,
    },
  );
  if (!response.ok) {
    console.error('Failed to fetch kusa image', await response.text());
    return { imageUrl: '', error: 'Failed to fetch kusa image' };
  }
  const data = (await response.json()) as KusaImageResponse<KusaResult>;
  // console.log(data, 'data');
  if (data.code) {
    console.error('Failed to fetch kusa image', data);
    return { imageUrl: '', error: 'Failed to fetch kusa image' };
  }
  const taskId = data.data.task_id;
  console.log(taskId, 'taskId');
  return pollingKusaResult(taskId);
};

export function generateHandler(
  model: 'Art Pro' | 'Art Unlimited' | 'KusaXL' = 'Art Pro',
) {
  return async function handler(request: Request) {
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
        model,
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

      if (!userId) {
        return unauthorized('unauthorized');
      }

      const baseCost = model === 'KusaXL' ? IMAGE_KUSAXL : IMAGE_ART_PRO;
      const creditModel = new CreditModel(userId as string);
      const cost = num_images * baseCost;
      const success = await creditModel.canConsume(cost);
      if (!success) {
        return failedWithCode(ERROR_CODES.NOT_ENOUGH_ZAPS, 'no zaps');
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
      const requests: Promise<{ imageUrl: string; error?: string }>[] = [];

      // console.log('Start fetching');
      // const style = parseStyleId(prompt);

      // const body = JSON.stringify({
      //   prompt,
      //   negative_prompt:
      //     'nsfw, 18+_adults_only_sign, naked, ai-generated, ai-assisted, stable diffusion, nai diffusion, worst quality, worst aesthetic, bad quality, normal quality, average quality, oldest, old, early, very displeasing, displeasing, adversarial noise, unknown artist, banned artist, what, off-topic, artist request, text, artist name, signature, username, logo, watermark, copyright name, copyright symbol, resized, downscaled, source larger, low quality, lowres, jpeg artifacts, compression artifacts, blurry, artistic error, bad anatomy, bad hands, bad feet, disfigured, deformed, extra digits, fewer digits, missing fingers, censored, bar censor, mosaic censoring, missing, extra, fewer, bad, hyper, error, ugly, worst, tagme, unfinished, bad proportions, bad perspective, aliasing, simple background, asymmetrical, unclear, icon, multiple images, turnaround, panel skew, letterboxed, framed, border, speech bubble, lossy-lossless, scan artifacts, out of frame, cropped, abstract, doesnotexist',
      //   // image_size,
      //   // num_images: num_images || 1,
      //   // ip_adapter_images,
      //   // init_images,
      //   // overwrite_strength: 0.6,
      // });
      for (let i = 0; i < Number(num_images); i++) {
        requests.push(
          // fetchKusaImage(prompt, { width: 960, height: 1680 }, model),
          fetchKusaImage(prompt, image_size, model, negative_prompt),
        );
      }

      const results = await Promise.all(requests);
      const generations: GenerationResult[] = [];

      for (const result of results) {
        // const imageData = result.images[0];
        if (hasError(result) || !result.imageUrl) {
          continue;
        }
        const imageUri = result.imageUrl;
        let imageUrl = '';
        let imageUrlPath = '';

        if (store_supabase) {
          const supaResult = await uploadImageToSupabase(
            imageUri,
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
          imageUrls.push(imageUri);
        }
        const { data, error } = await supabase
          .from('ImageGeneration')
          .insert([
            {
              prompt: userPrompt ?? originalPrompt ?? prompt,
              model,
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
      if (generations.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate image' }),
          {
            status: 500,
          },
        );
      }
      const newCost =
        results.filter(result => !hasError(result) && result.imageUrl).length *
        baseCost;
      const result = await creditModel.deductCredit(newCost, tool);
      if (!result) {
        return failed('no zaps');
      }
      bindGenerationLogData(request, {
        model,
        generationResult: GenerationStatus.SUCCEEDED,
        tool,
        cost,
      });
      return new Response(JSON.stringify(generations), { status: 200 });
    } catch (error) {
      console.error('Error generating image:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        {
          status: 500,
        },
      );
    }
  };
}

export const POST = withHandler(generateHandler('Art Pro'), [
  authMiddleware,
  bindParamsMiddleware,
  replaceCharacterPromptsMiddleware,
  translateMiddleware,
  generatePromptMiddleware('Art Pro'),
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
