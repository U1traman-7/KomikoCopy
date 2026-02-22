/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-11 19:34:15
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-11 20:25:04
 * @FilePath: /ComicEditor/api/tools/video-interpolation.ts
 * @Description:
 */
/*eslint-disable */
import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { VIDEO_INTERPOLATION } from "./_zaps.js";
import { canGenerateMiddleware } from "../_utils/middlewares/canGenerate.js";
import { authMiddleware, bindGenerationLogData, bindParamsMiddleware, headerHandler } from "../_utils/middlewares/index.js";
import withHandler from "../_utils/withHandler.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});


// 调用 https://replicate.com/zsxkib/film-frame-interpolation-for-large-motion
/*
params
  mp4: "https://replicate.delivery/pbxt/JvaWxfvzYBgS0FpE5ZQNrYJkK5meQoKNRhu8AdNWrGOyQRb8/output.mp4",
  num_interpolation_steps: 1,
  playback_frames_per_second: 28
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
  tryGenerateHandler(TASK_TYPES.VIDEO),
]);

