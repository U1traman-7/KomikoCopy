/* eslint-disable */
import Replicate from 'replicate';
import { CreditModel } from '../_models/credit.js';
import { getAuthUserId } from './video-generation.js';
import {
  deleteMediaByUrl,
  failed,
  uploadImageToSupabase,
} from '../_utils/index.js';
import { BACKGROUND_REMOVAL } from './_zaps.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { waitUntil } from '@vercel/functions';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function handler(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    const { meta_data } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Background Removal',
      generationResult: GenerationStatus.FAILED,
      tool: 'background-removal',
      cost: 0,
      meta_data: meta_data ?? null,
    });
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(BACKGROUND_REMOVAL);
    if (!success) {
      return failed('Insufficient credits');
    }
    const params = (request as any).params;
    let output = (await replicate.run(
      '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
      { input: params },
    )) as unknown as string;

    output = await uploadImageToSupabase(output, userId, undefined, true);

    const result = await credit.deductCredit(
      BACKGROUND_REMOVAL,
      'background-removal',
    );
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: 'Background Removal',
      generationResult: GenerationStatus.SUCCEEDED,
      tool: 'background-removal',
      cost: BACKGROUND_REMOVAL,
      meta_data: meta_data ?? null,
    });
    if (params.image && params.image.includes('husbando-land')) {
      waitUntil(deleteMediaByUrl(params.image));
    }
    return new Response(JSON.stringify({ output: output }), { status: 200 });
  } catch (error) {
    console.error('Error in background-removal:', error);
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
