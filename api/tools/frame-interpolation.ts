/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-11 16:56:08
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-11 18:51:46
 * @FilePath: /ComicEditor/api/tools/frame-interpolation.ts
 * @Description:
 */
/*eslint-disable */
import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { FRAME_INTERPOLATION } from "./_zaps.js";
import withHandler from "../_utils/withHandler.js";
import { authMiddleware } from "../_utils/middlewares/auth.js";
import { bindGenerationLogData, bindParamsMiddleware, canGenerateMiddleware, headerHandler } from "../_utils/middlewares/index.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// 调用 https://replicate.com/google-research/frame-interpolation
/*
params
  frame1: "https://replicate.delivery/mgxm/5de85319-a354-4178-a2b0-aab4a65fa480/start.png",
  frame2: "https://replicate.delivery/mgxm/aebabf54-c730-4efe-857d-1182960918d4/end.png",
  times_to_interpolate: 5
output:  [
    'https://xx.mp4',
  ]
*/
async function handler(request: Request) {
    try {
        const userId = await getAuthUserId(request);
        bindGenerationLogData(request, {
            model: 'Frame Interpolation',
            generationResult: GenerationStatus.FAILED,
            tool: 'frame-interpolation',
            cost: 0
        });
        if(!userId){
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const credit = new CreditModel(userId);
        const success = await credit.canConsume(FRAME_INTERPOLATION);
        if(!success){
            return failed("Insufficient credits");
        }
        const params = (request as any).params;
        console.log("frame-interpolation params", params);
        const output = await replicate.run(
            "google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
            {
                input: {
                    frame1: params.frame1,
                    frame2: params.frame2,
                    times_to_interpolate: params.times_to_interpolate
                }
            });
        console.log("frame-interpolation output", output);
        const result = await credit.deductCredit(
          FRAME_INTERPOLATION,
          'frame-interpolation',
        );
        if(!result) {
            return failed('no zaps');
        }
        bindGenerationLogData(request, {
            model: 'Frame Interpolation',
            generationResult: GenerationStatus.SUCCEEDED,
            tool: 'frame-interpolation',
            cost: FRAME_INTERPOLATION
        });
        return new Response(JSON.stringify({ "output": output }), { status: 200 });
    } catch (error) {
        console.error('Error in tooncrafter:', error);
        return new Response(JSON.stringify({ error: 'Failed to process images' }), { status: 500 });
    }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.VIDEO),
]);

