/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-06 22:35:56
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-10 23:48:31
 * @FilePath: /ComicEditor/api/tools/line-art-colorize.ts
 * @Description:
 */
import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { LINE_ART_COLORIZE } from "./_zaps.js";
import {
  authMiddleware,
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from "../_utils/withHandler.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function handler(request: Request) {
    try {
        const userId = await getAuthUserId(request);
        if(!userId){
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        bindGenerationLogData(request, {
            model: 'Line Art Colorize',
            generationResult: GenerationStatus.FAILED,
            tool: 'line-art-colorize',
            cost: 0
        });
        const credit = new CreditModel(userId);
        const success = await credit.consume(LINE_ART_COLORIZE);
        if(!success){
            return failed("Insufficient credits");
        }
        const params = (request as any).params;
        // console.log("params", params);
        const output = await replicate.run(
            "camenduru/colorize-line-art:59575cca43435fec91bf2016648a36db03ab0c1556490974e3c483274076a6ec",
            {
                input : {
                    prompt: params.prompt || "",
                    input_image: params.input_image,
                    // det: "Lineart_Anime",
                    a_prompt: params.a_prompt || "masterpiece, best quality, ultra-detailed, illustration, disheveled hair",
                    n_prompt: params.n_prompt || "longbody, lowres, bad anatomy, bad hands, missing fingers, pubic hair,extra digit, fewer digits, cropped, worst quality, low quality",
                    strength: 1,
                    // eta: 1,
                    seed: 4,
                    scale: 9,
                    ddim_steps: 25,
                    image_resolution: 1024,
                    detect_resolution: 1024
                }
            });
        console.log("output", output);
        bindGenerationLogData(request, {
            model: 'Line Art Colorize',
            generationResult: GenerationStatus.SUCCEEDED,
            tool: 'line-art-colorize',
            cost: LINE_ART_COLORIZE
        });
        return new Response(JSON.stringify({ "output": output }), { status: 200 });
    } catch (error) {
        console.error('Error in lineArtColorize:', error);
        return new Response(JSON.stringify({ error: 'Failed to process images' }), { status: 500 });
    }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);

