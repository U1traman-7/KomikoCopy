import {
  failed,
  failedWithCode,
  hasError,
  uploadImage,
} from '../_utils/index.js';
import { getAuthUserId } from './image-generation.js';
import { CreditModel } from '../_models/credit.js';
import { calculatePhotoToAnimeCost, ToolsModel } from './_zaps.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnimeStyle, VipAnimeStyles } from './_constants.js';
import { gptEditImage } from './_gptEditImage.js';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { ERROR_CODES, GenerationStatus, TASK_TYPES } from '../_constants.js';
import { generateImageFluxKontextPro } from '../generateImageFluxKontextPro.js';

// const fetchGeminiImage = async (prompt: string, imageBase64: string) => {
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

//   const generationConfig = {
//     temperature: 1,
//     topP: 0.95,
//     topK: 40,
//     maxOutputTokens: 8192,
//     responseMimeType: 'text/plain',
//     responseModalities: ['image', 'text'],
//   };
//   const getMimeType = (imageBase64: string) => {
//     const mimeType = imageBase64.split(';')[0].split(':')[1];
//     return mimeType;
//   };

//   const model = genAI.getGenerativeModel({
//     model: 'gemini-2.0-flash-preview-image-generation',
//     generationConfig,
//   });

//   const index = imageBase64.indexOf(',') + 1;
//   const imageBase64WithoutHeader = imageBase64.slice(index);
//   const parts = [
//     {
//       text: prompt,
//     },
//     {
//       inlineData: {
//         data: imageBase64WithoutHeader,
//         mimeType: getMimeType(imageBase64),
//       },
//     },
//   ];

//   const response = await model.generateContent({
//     contents: [
//       {
//         role: 'user',
//         parts: parts as any,
//       },
//     ],
//   });

//   if (
//     (response.response.candidates![0].finishReason as string) === 'IMAGE_SAFETY'
//   ) {
//     return {
//       error: "Image generation failed due to Google's content moderation",
//     };
//   }
//   const imageUrls = response.response
//     .candidates![0].content.parts.filter((part: any) => part.inlineData)
//     .map(
//       (part: any) =>
//         `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
//     );
//   return imageUrls;
// };

const styleToPrompt = (style: AnimeStyle) => {
  switch (style) {
    case AnimeStyle.ANIME:
      return 'convert this image (including human and background) to Japanese anime style';
    case AnimeStyle.KOREAN_MANHWA:
      return 'convert this image (including human and background) to Korean manhwa style';
    case AnimeStyle.GHIBLI_ANIME:
      return 'convert this image (including human and background) to studio Ghibli anime art style';
    case AnimeStyle.CHIBI:
      return 'create cute chibi stickers of this character that can be used in messages, generate one image that includes 3x3 grid of chibi stickers of different emotions of the same character';
    case AnimeStyle.ACTION_FIGURE:
      return 'convert this image to action figure style';
    case AnimeStyle.FIGURE_IN_BOX:
      return 'convert this image to a figure in a well-designed box';
    case AnimeStyle.STICKER:
      return 'from this image, generate a sticker image with a small white edges';
    case AnimeStyle.ORIGAMI_PAPER_ART:
      return 'turn this image into Origami paper art style';
    case AnimeStyle.LINE_ART:
      return 'turn this image into line art style';
    case AnimeStyle.CARTOON:
      return 'turn this image into cartoon style';
    case AnimeStyle.RICK_AND_MORTY:
      return 'turn this image art style into drawing style of the animation Rick and Morty, only change the art style, while maintaining the the character and composition of the original image';
    case AnimeStyle.SOUTH_PARK:
      return 'turn this image art style into drawing style of the animation South Park, only change the art style, while maintaining the the character and composition of the original image';
    case AnimeStyle.LEGO:
      return 'turn this image into Lego style';
    case AnimeStyle.CLAY:
      return 'turn this image into claymation style';
    case AnimeStyle.PIXEL_ART:
      return 'turn this image into minecraft style';
    case AnimeStyle.WATERCOLOR:
      return 'turn this image into watercolor style';
    case AnimeStyle.INK_WASH:
      return 'turn this image into 水墨（ink wash） style';
    case AnimeStyle.MANGA:
      return 'turn this image into Japanese manga style';
    case AnimeStyle.SIMPSONS:
      return 'turn this image art style into drawing style of the animation The Simpsons, only change the art style, while maintaining the the character and composition of the original image';
    case AnimeStyle.SPRITE_SHEET:
      return `[CHARACTER=<attached image>] [STYLE=pixel‑art]

Create a cohesive sprite sheet.
─ROW 1 – Base Model ─
• Natural idle pose in 4-8 rotations.
• Match the chosen STYLE exactly.

─ROW 2 – Base Model ─
• Natural running animation frames from the same side view.
• Match the chosen STYLE exactly.

─ROW 3 – Base Model ─
• Natural attack animation frames from the same side view.
• Match the chosen STYLE exactly.

─ ROW 4 – Adaptive Equipment Grid─
• Add distinct gear/prop items  that logically suit the CHARACTER.
• Render each item in its own cell at the clearest modelling angle(s), using the same STYLE.
• Ensure every piece fits the ROW 1 model without clipping.

─ Global Constraint ─
• Keep sheet visually and stylistically consistent (palette, light direction, line weight).
• Use white background.`;
    case AnimeStyle.LOW_POLY:
      return 'turn this image into low poly style';
    case AnimeStyle.MY_LITTLE_PONY:
      return 'turn this image into My Little Pony style';
    case AnimeStyle.NARUTO:
      return 'turn this image art style into drawing style of the anime Naruto, only change the art style, while maintaining the the character and composition of the original image';
    case AnimeStyle.ONE_PIECE:
      return 'turn this image art style into drawing style of the anime One Piece, only change the art style, while maintaining the the character and composition of the original image';
    case AnimeStyle.DOLL_BOX:
      return 'Generate a figure toy image of the person in this photo. The figure should be a full figure and displayed in its original blister pack. He/she should also have relevant accessories in the blister pack.';
    case AnimeStyle.CHARACTER_SHEET:
      return 'generate the 3 views (including front view, side view, and back view) of the same character in one image, each view are spaced out, make sure you keep the body proportions the same as the uploaded image, the generated image should be horizontal landscape size (16:9), and the background should be white';
    case AnimeStyle.BARBIE_DOLL:
      return 'Generate a realistic Barbie doll figure image of the person in this photo. The figure should be fully detailed, posed inside original blister packaging, and styled with accessories that reflect her personality or interests.';
    case AnimeStyle.PLUSHIE:
      return 'Make a chibi fluffy plushie for the character/object as a anime merch';
    case AnimeStyle.BADGE:
      return 'Create a realistic anime badge button featuring the upper body of the character shown in the uploaded image, styled as official merchandise. The badge has a glossy finish and metal backing, and is beautifully placed on a white surface surface under soft, natural lighting.';
    case AnimeStyle.STANDEE:
      return 'A realistic product photo of a acrylic standee featuring the character shown in the uploaded image. The character is shown in full body. The standee has clear acrylic edges cut precisely along the character’s silhouette, not a rectangular shape. The character is flat-printed on the back of the acrylic, giving it a smooth, glossy front surface. The standee is slotted into a stylish, decorative acrylic base that matches the color of the character, and is beautifully displayed on a light-colored desk with natural lighting. Designed as high-quality anime merchandise for fans and collectors.';
    case AnimeStyle.BODY_PILLOW:
      return 'Make a anime body pillow (Dakimakura) with the character/object printed as a anime merch';
    case AnimeStyle.CYBERPUNK:
      return 'turn this image into cyberpunk anime style and change the background to a neon-lit cyberpunk environment';
    case AnimeStyle.COSPLAY:
      return 'generate a real human cosplay of the art in similar pose and in a similar scene';
    default:
      return 'turn this image into Japanese anime style';
  }
};

async function handler(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const params = (request as any).params;
    if (!params) {
      return failed('Invalid params');
    }

    const {
      image,
      style,
      mode,
      width,
      height,
      model = ToolsModel.BASIC,
    } = params;
    const modelName = model === ToolsModel.BASIC ? 'Flux' : 'GPT4o';
    bindGenerationLogData(request, {
      model: modelName,
      generationResult: GenerationStatus.FAILED,
      tool: 'photo-to-anime',
      cost: 0,
    });
    if (!image) {
      return failed('Invalid params');
    }

    const credit = new CreditModel(userId);
    const success = await credit.canConsume(calculatePhotoToAnimeCost(model));
    if (!success) {
      return failed('no zaps');
    }

    if (VipAnimeStyles.includes(style) && credit.subscriptions.length === 0) {
      return failedWithCode(
        ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION,
        'VIP style requires a subscription',
      );
    }

    const prompt = styleToPrompt(style);

    let output: any;

    if (model === ToolsModel.ADVANCED) {
      // Use GPT for image generation
      output = await gptEditImage({
        prompt,
        images: [image],
        quality: 'high',
        imageSize: 'auto',
      });

      if (hasError(output)) {
        console.error(output.error);
        return failed('Failed to generate image');
      }
    } else {
      // Use Gemini (default)
      // const response = await fetchGeminiImage(prompt, image);
      const response = await generateImageFluxKontextPro({
        prompt,
        image,
      });

      if (!response || (response as any).error) {
        return failed('Failed to generate image');
      }

      output = response;
    }

    const result = await credit.deductCredit(
      calculatePhotoToAnimeCost(model),
      'photo-to-anime',
    );
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: modelName,
      generationResult: GenerationStatus.SUCCEEDED,
      tool: 'photo-to-anime',
      cost: calculatePhotoToAnimeCost(model),
    });
    output = await uploadImage(
      `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.png`,
      output,
    );
    return new Response(JSON.stringify({ output }), { status: 200 });
  } catch (error) {
    console.error(error);
    return failed('Failed to generate image');
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
