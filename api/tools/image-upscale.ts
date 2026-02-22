import Replicate from 'replicate';
import { CreditModel } from '../_models/credit.js';
import { getAuthUserId } from './video-generation.js';
import { failed } from '../_utils/index.js';
import { IMAGE_UPSCALE } from './_zaps.js';
import {
  authMiddleware,
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { waitUntil } from '@vercel/functions';
import { deleteMediaByUrl } from '../_utils/index.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function handler(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    bindGenerationLogData(request, {
      model: 'Image Upscale',
      generationResult: GenerationStatus.FAILED,
      tool: 'image-upscale',
      cost: 0,
    });
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(IMAGE_UPSCALE);
    if (!success) {
      return failed('Insufficient credits');
    }
    const params = (request as any).params;
    if (!params?.image) {
      return failed('Image is required');
    }
    const model = params.model || 'gfpgan';
    // console.log('image upscale', params);
    let output: any;
    if (model === 'gfpgan') {
      output = await replicate.run(
        'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',
        {
          input: {
            img: params.image,
            scale: params.scale,
            version: 'v1.4',
          },
        },
      );
      console.log('imageUpscale output', output);
      const result = await credit.deductCredit(IMAGE_UPSCALE, 'image-upscale');
      if (!result) {
        return failed('no zaps');
      }
      bindGenerationLogData(request, {
        model: 'Image Upscale',
        generationResult: GenerationStatus.SUCCEEDED,
        tool: 'image-upscale',
        cost: IMAGE_UPSCALE,
      });
    } else {
      // output = await replicate.run(
      //   'daanelson/real-esrgan-a100:f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed',
      //   {
      //     input: {
      //       image: params.image,
      //       scale: params.scale,
      //     },
      //   },
      // );
      output = await replicate.run(
        'xinntao/realesrgan:1b976a4d456ed9e4d1a846597b7614e79eadad3032e9124fa63859db0fd59b56',
        {
          input: {
            img: params.image,
            tile: 0,
            scale: params.scale,
            version: 'Anime - anime6B',
            face_enhance: false,
          },
        },
      );
    }
    if (params.image && params.image.includes('husbando-land')) {
      waitUntil(deleteMediaByUrl(params.image));
    }
    return new Response(JSON.stringify({ output }), { status: 200 });
  } catch (error) {
    console.error('Error in tooncrafter:', error);
    return new Response(JSON.stringify({ error: 'Failed to process images' }), {
      status: 500,
    });
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
