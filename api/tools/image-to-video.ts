import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { failed } from "../_utils/index.js";
import { calculateImageToAnimationCost, ImageToVideoModel } from "./_zaps.js";
import { getAuthUserId } from "./image-generation.js";
import { fal } from '@fal-ai/client'
import withHandler from "../_utils/withHandler.js";
import { authMiddleware } from "../_utils/middlewares/auth.js";
import { bindGenerationLogData, bindParamsMiddleware, canGenerateMiddleware, headerHandler } from "../_utils/middlewares/index.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";
import { translateMiddleware } from "../_utils/middlewares/translate.js";

fal.config({
  credentials: process.env.fal_api_key
});


const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function handler(request: Request) {

  return new Response('Not Found',{status: 404});
  try {

    const userId = await getAuthUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const params = (request as any).params;
    const model = params.model || ImageToVideoModel.VEO;
    const cost = calculateImageToAnimationCost(model, params.duration);
    const getModelName = () => {
      switch (model) {
        case ImageToVideoModel.MINIMAX:
          return 'Minimax';
        case ImageToVideoModel.RAY:
          return 'Ray';
        case ImageToVideoModel.RAY_FLASH_V2:
          return 'Ray Flash V2';
        case ImageToVideoModel.WAN_PRO:
          return 'Wan Pro';
        case ImageToVideoModel.KLING:
          return 'Kling';
        case ImageToVideoModel.PIXVERSE:
          return 'Pixverse';
        case ImageToVideoModel.KLING_V2:
          return 'Kling V2';
        case ImageToVideoModel.VEO:
          return 'Veo';
        case ImageToVideoModel.FRAME_PACK:
          return 'Frame Pack';
        case ImageToVideoModel.VIDU:
          return 'Vidu Base';
        case ImageToVideoModel.VIDU_Q1:
          return 'Vidu Q1';
        case ImageToVideoModel.ANISORA:
          return 'AniSora';
        case ImageToVideoModel.MAGI_1:
          return 'Magi 1';
        default:
          return 'Unknown';
      }
    }
    bindGenerationLogData(request, {
      model: getModelName(),
      generationResult: GenerationStatus.FAILED,
      tool: 'image-to-video',
      cost: 0,
    });
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(cost);
    if (!success) {
      return failed("no zaps");
    }

    if (!params?.prompt || !params?.image) {
      return failed("no prompt or image");
    }
    let output: any = '';

    if (params.model === ImageToVideoModel.MINIMAX) {
      const input = {
        prompt: params.prompt,
        // prompt_optimizer: true,
        first_frame_image: params.image
      };

      output = await replicate.run("minimax/video-01-live", { input });
      // console.log(output, 'output');
      // return new Response(JSON.stringify({ output: output}), { status: 200 });
    } else if (params.model === ImageToVideoModel.RAY) {
      // console.log('ray');
      const result = await fal.subscribe("fal-ai/luma-dream-machine/ray-2/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          aspect_ratio: params.aspect_ratio || "16:9",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      output = result?.data?.video?.url || '';
    } else if (params.model === ImageToVideoModel.RAY_FLASH_V2) {
      const input = {
        prompt: params.prompt,
        start_image_url: params.image,
        duration: +params.duration || 5,
        aspect_ratio: params.aspect_ratio || '16:9',
      }
      output = await replicate.run("luma/ray-flash-2-720p", { input })
    } else if (params.model === ImageToVideoModel.WAN) {
      const result = await fal.subscribe("fal-ai/wan-i2v", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          aspect_ratio: params.aspect_ratio || "16:9",
          resolution: '720p',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      output = result?.data?.video?.url || '';
    } else if (params.model === ImageToVideoModel.WAN_PRO) {
      const result = await fal.subscribe("fal-ai/wan-pro/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      output = result?.data?.video?.url || ''
    } else if (params.model === ImageToVideoModel.KLING) {
      // const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/image-to-video", {
      //   input: {
      //     prompt: params.prompt,
      //     image_url: params.image,
      //     duration: params.duration || '5',
      //   },
      //   logs: true,
      //   onQueueUpdate: (update) => {
      //     if (update.status === "IN_PROGRESS") {
      //       update.logs.map((log) => log.message).forEach(console.log);
      //     }
      //   },
      // });
      // return new Response(JSON.stringify({ output: result?.data?.video?.url || '' }), { status: 200 });

      const input = {
        prompt: params.prompt,
        duration: +params.duration || 5,
        start_image: params.image,
        aspect_ratio: params.aspect_ratio || "16:9",
      };

      output = await replicate.run("kwaivgi/kling-v1.6-pro", { input });
    } else if (params.model === ImageToVideoModel.PIXVERSE) {
      const result = await fal.subscribe("fal-ai/pixverse/v3.5/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          resolution: params.resolution || '720p',
          duration: +params.duration || 5,
          aspect_ratio: params.aspect_ratio || '16:9',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || ''
      // return new Response(JSON.stringify({ output: result?.data?.video?.url || '' }), { status: 200 });
    } else if (params.model === ImageToVideoModel.KLING_V2) {
      const result = await fal.subscribe("fal-ai/kling-video/v2/master/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          duration: params.duration || '5',
          aspect_ratio: params.aspect_ratio || '16:9',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || ''
    } else if (params.model === ImageToVideoModel.VEO) {
      // console.log(params, 'params')
      // output = await replicate.run("google/veo-2", {
      //   input: {
      //     prompt: params.prompt,
      //     image: params.image,
      //     duration: +params.duration || 5,
      //     aspect_ratio: params.aspect_ratio || '16:9',
      //   }
      // })
      const result = await fal.subscribe("fal-ai/veo2/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          duration: (params.duration || 5) + 's',
          aspect_ratio: params.aspect_ratio || 'auto',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      output = result?.data?.video?.url || '';

    } else if (params.model === ImageToVideoModel.FRAME_PACK) {
      const result = await fal.subscribe("fal-ai/framepack", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          aspect_ratio: params.aspect_ratio || '16:9',
          resolution: '720p',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || '';
      // output = '';
    } else if (params.model === ImageToVideoModel.VIDU || params.model === ImageToVideoModel.ANISORA) {
      const result = await fal.subscribe("fal-ai/vidu/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || '';
    } else if (params.model === ImageToVideoModel.VIDU_Q1) {
      const result = await fal.subscribe("fal-ai/vidu/q1/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || '';
    } else if (params.model === ImageToVideoModel.MAGI_1) {
      const result = await fal.subscribe("fal-ai/magi-distilled/image-to-video", {
        input: {
          prompt: params.prompt,
          image_url: params.image,
          aspect_ratio: params.aspect_ratio || "auto",
          resolution: params.resolution || '720p',
          num_frames: params.num_frames || 96,
          frames_per_second: params.frames_per_second ? Number(params.frames_per_second) : 24,
          seed: params.seed,
          enable_safety_checker: params.enable_safety_checker !== false
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      output = result?.data?.video?.url || '';
    }
    const result = await credit.deductCredit(cost);
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: getModelName(),
      generationResult: GenerationStatus.SUCCEEDED,
      tool: 'image-to-video',
      cost,
    });
    return new Response(JSON.stringify({ output: output }), { status: 200 });
  } catch (e) {
    console.error('catch error', e);
    return failed("Failed to generate video");
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.VIDEO),
]);

