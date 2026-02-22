/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-01 20:28:49
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-01 23:56:14
 * @FilePath: /ComicEditor/api/tooncrafter.ts
 * @Description:
 */
import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { IN_BETWEEN } from "./_zaps.js";
import withHandler from "../_utils/withHandler.js";
import { authMiddleware } from "../_utils/middlewares/auth.js";
import { bindGenerationLogData, bindParamsMiddleware, canGenerateMiddleware, headerHandler } from "../_utils/middlewares/index.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { translateMiddleware } from "../_utils/middlewares/translate.js";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// 调用 toonCrafter API
/*
params
  prompt: '',
  max_width: 512,
  max_height: 512,
  loop: false,
  interpolate: false,
  negative_prompt: '',
  color_correction: true,
  image_1: 'https://xx.jpg',
  image_2: 'https://xx.jpg'
output:  [
    'https://xx.mp4',
  ]
*/
async function handler(request: Request) {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
  });
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.VIDEO),
]);

