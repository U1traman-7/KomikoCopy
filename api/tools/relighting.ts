import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { RELIGHTING } from "./_zaps.js";
import { authMiddleware } from "../_utils/middlewares/auth.js";
import { bindGenerationLogData, bindParamsMiddleware } from "../_utils/middlewares/index.js";
import withHandler from "../_utils/withHandler.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";
import { translateMiddleware } from "../_utils/middlewares/translate.js";

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
            model: 'Relighting',
            generationResult: GenerationStatus.FAILED,
            tool: 'relighting',
            cost: 0
        });
        const credit = new CreditModel(userId);
        const success = await credit.canConsume(RELIGHTING);
        if(!success){
            return failed("no zaps");
        }
        const params = (request as any).params;
        if(!params.subject_image){
            return failed("subject_image is required");
        }
        if(!params.background_image){
            return failed("background_image is required");
        }

        const output = await replicate.run(
          "zsxkib/ic-light-background:60015df78a8a795470da6494822982140d57b150b9ef14354e79302ff89f69e3",
          {
            input: {
              cfg: 2,
              steps: 25,
              width: params.width || 512,
              height: params.height || 832,
              // prompt: "Woman, detailed face, sci-fi RGB glowing, cyberpunk",
              prompt: params.prompt,
              light_source: "Use Background Image",
              highres_scale: 1.5,
              output_format: "webp",
              // subject_image: "https://replicate.delivery/pbxt/KtCKrs9sxPF3HciwoWL0TTVM9Nde7ySDWpO9S2flTiyi9Pp3/i3.png",
              subject_image: params.subject_image,
              compute_normal: false,
              output_quality: 80,
              appended_prompt: "best quality",
              highres_denoise: 0.5,
              negative_prompt: "lowres, bad anatomy, bad hands, cropped, worst quality",
              // background_image: "https://replicate.delivery/pbxt/KxPIbJUjSmVBlvn0M3C8PAz6brN5Z0eyZSGcKIVw3XfJ6vNV/7.webp",
              background_image: params.background_image,
              number_of_images: 1
            }
          }
        );
        const result = await credit.deductCredit(RELIGHTING, 'relighting');
        if(!result) {
          return failed('no zaps');
        }
        bindGenerationLogData(request, {
            model: 'Relighting',
            generationResult: GenerationStatus.SUCCEEDED,
            tool: 'relighting',
            cost: RELIGHTING
        });
        // console.log(output);
        return new Response(JSON.stringify({ "output": output[0] }), { status: 200 });
    } catch (error) {
        console.error('Error in relighting:', error);
        return new Response(JSON.stringify({ error: 'Failed to process images' }), { status: 500 });
    }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);

