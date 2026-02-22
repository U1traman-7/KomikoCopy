/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-04 20:58:35
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-04 22:26:44
 * @FilePath: /ComicEditor/api/videoUpscale.ts
 * @Description:
 */
/* eslint-disable */
import Replicate from 'replicate';
import { CreditModel } from '../_models/credit.js';
import { getAuthUserId } from './video-generation.js';
import { failed } from '../_utils/index.js';
import { calculateVideoUpscaleCost } from './_zaps.js';
import {
  authMiddleware,
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function handler(request: Request) {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
  });
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.VIDEO),
]);
