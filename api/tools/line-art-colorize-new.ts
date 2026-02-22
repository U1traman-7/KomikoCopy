/* eslint-disable */
import Replicate from 'replicate';
import { CreditModel } from '../_models/credit.js';
import { getAuthUserId } from './video-generation.js';
import {
  failed,
  hasError,
  pollingHistory,
  uploadImage,
} from '../_utils/index.js';
import { calculateLineArtColorizeCost, ToolsModel } from './_zaps.js';
import { TaskType } from './_constants.js';
import { serverUrl as imageServerUrl } from './_constants.js';
import { createClient } from '@supabase/supabase-js';
// import fs from 'node:fs';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { v4 as uuidv4 } from 'uuid';
import { gptEditImage } from './_gptEditImage.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
  canGenerateMiddleware,
  headerHandler,
} from '../_utils/middlewares/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export const uploadFile = async (filename: string, file: File) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC!,
  );
  const { error } = await supabase.storage
    .from('husbando-land')
    .upload(filename, file, { contentType: 'image/webp' });
  if (error) {
    console.error(error);
    // return '';
    throw new Error('Failed to upload file');
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${filename}`;
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// async function uploadToGemini(base64Data: string) {
//   // 从 base64 数据中提取实际内容（移除 data:image/xxx;base64, 前缀）
//   const base64Content = base64Data.includes('base64,')
//     ? base64Data.split('base64,')[1]
//     : base64Data;
//   const mimeType = base64Data.split(';')[0].split(':')[1];
//   // 创建临时文件
//   const uuid = uuidv4();
//   const tempFilePath = `/tmp/temp_image_${uuid}.${mimeType.split('/')[1]}`;

//   // 将 base64 写入临时文件
//   fs.writeFileSync(tempFilePath, Buffer.from(base64Content, 'base64'));

//   try {
//     // 上传临时文件到 Gemini
//     const uploadResult = await fileManager.uploadFile(tempFilePath, {
//       mimeType,
//       displayName: `image_${uuid}.${mimeType.split('/')[1]}`,
//     });
//     const file = uploadResult.file;
//     console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

//     // 删除临时文件
//     fs.unlinkSync(tempFilePath);

//     return file;
//   } catch (error) {
//     // 确保出错时也删除临时文件
//     try {
//       // const fs = require('fs');
//       fs.unlinkSync(tempFilePath);
//     } catch (cleanupError) {
//       console.error('Error cleaning up temp file:', cleanupError);
//     }
//     throw error;
//   }
// }

const NANO_BANANA_MODEL_ID = 'gemini-2.5-flash-image';
const NANO_BANANA_PRO_MODEL_ID = 'gemini-3-pro-image-preview';

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
  responseModalities: ['image', 'text'],
};

const serverUrl = 'http://34.67.156.195:12588';
const getPrompt = params => {
  if (params.ipadapter_b64) {
    return `Task: line art colorization.
Now colorize the input line art image by strictly following the line art structure.
${params.user_prompt ? `Additional user instruction to follow: ${params.user_prompt}` : ''}
${params.white_bg ? 'Generate the image in clean white background.' : ''}
Only output the colorized image`;
  } else {
    return `Task: line art colorization.
Follow the line art structure and colorize the input line art image in anime art style.
${params.user_prompt ? `Additional user instruction to follow: ${params.user_prompt}` : ''}
${params.white_bg ? 'Generate the image in clean white background.' : ''}
Only output the colorized image`;
  }
};

const splitBase64 = (base64: string) => {
  const mimeType = base64.split(';')[0].split(':')[1];
  const data = base64.split('base64,')[1];
  return { mimeType, data };
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
    const modelName =
      params.model === ToolsModel.BASIC ? 'Gemini' : 'Gemini Pro';
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(
      calculateLineArtColorizeCost(params.white_bg, params.model),
    );
    if (!success) {
      return failed('no zaps');
    }
    if (!params.sketch_b64) {
      return failed('Sketch image is required');
    }
    // console.log("params", params);

    let output: any;
    let base64: string = '';

    const model = genAI.getGenerativeModel({
      model:
        params.model === ToolsModel.BASIC
          ? NANO_BANANA_MODEL_ID
          : NANO_BANANA_PRO_MODEL_ID,
    });

    {
      const parts: any[] = [];

      // const sketchFile = await uploadToGemini(params.sketch_b64);
      const { mimeType, data } = splitBase64(params.sketch_b64);
      parts.push({
        text: 'Input line art image (you need to colorize the line art image and strictly follow the line art structure):\n```',
      });
      parts.push({
        inlineData: {
          data,
          mimeType,
        },
      });

      if (params.ipadapter_b64) {
        // const referenceFile = await uploadToGemini(params.ipadapter_b64);
        const { mimeType, data } = splitBase64(params.ipadapter_b64);
        parts.push({
          text: '```\n\n\nReference image (you need to reference the colors and shading of the reference image):\n```',
        });
        parts.push({
          inlineData: {
            data,
            mimeType,
          },
        });
        parts.push({ text: '```\n\n\n' });
      }

      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: 'user',
            parts: parts,
          },
        ],
      });
      const prompt = getPrompt(params);
      const result = await chatSession.sendMessage(prompt);
      try {
        if (
          (result.response.candidates![0].finishReason as string) ===
          'IMAGE_SAFETY'
        ) {
          return failed(
            'Image generation failed due to content moderation restrictions from our service provider. Please try again with a different input, adjust your prompt, or switch to our basic model.',
          );
        }
        // console.log('result', result, result.response.candidates![0].content.parts);
        // console.log('result text', result.response.text())
        const inlineData = result.response.candidates![0].content.parts?.filter(
          (part: any) => part.inlineData,
        )[0]?.inlineData;
        const data = inlineData?.data;
        if (!data) {
          console.log('data', data);
          return failed('Failed to generate image');
        }
        const mimeType = inlineData?.mimeType;
        base64 = 'data:' + mimeType + ';base64,' + data;
        output = await uploadImage(
          `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.png`,
          base64,
        );
      } catch (error) {
        console.error('Error in lineArtColorize:', error);
        return failed(`Failed to generate image: ${error}`);
      }
    }
    // decorate
    // } else if (params.model === 'SDXL') {
    //   let apiUrl = `${serverUrl}/generate/lineart_sdxl`;

    //   if (!params.ipadapter_b64) {
    //     apiUrl = `${serverUrl}/generate/lineart_sdxl_prompt`;
    //   }

    //   const response = await fetch(apiUrl, {
    //     method: 'POST',
    //     body: JSON.stringify({ ...params, white_bg: undefined }),
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   const text = await response.text();
    //   if (text.includes('error')) {
    //     return failed(text);
    //   }
    //   const prompt_id = text.split('"prompt_id":"')?.[1]?.split('"')[0];
    //   if (!prompt_id) {
    //     return failed('Failed to generate image');
    //   }
    //   const result = await pollingHistory(
    //     prompt_id,
    //     TaskType.LINE_ART_COLORIZE,
    //   );
    //   if (result.error) {
    //     return failed(result.error);
    //   }
    //   output = result.filename;

    //   if (params.white_bg) {
    //     const imageUrl = `${imageServerUrl}/view?filename=${result.filename}&type=temp`;
    //     base64 = await fetch(imageUrl)
    //       .then(res => res.arrayBuffer())
    //       .then(buffer => Buffer.from(buffer).toString('base64'));
    //   }
    // } else {
    //   // GPT
    //   output = await gptEditImage({
    //     prompt: getPrompt(params),
    //     images: [params.sketch_b64, params.ipadapter_b64].filter(d => d),
    //     quality: 'high',
    //     imageSize: 'auto',
    //   });

    //   if (hasError(output)) {
    //     console.error(output.error);
    //     return failed('generation failed');
    //   }
    //   output = await uploadImage(
    //     `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.png`,
    //     output,
    //   );
    // }

    const result = await credit.deductCredit(
      calculateLineArtColorizeCost(params.white_bg),
      'line-art-colorize',
    );
    if (!result) {
      return failed('no zaps');
    }
    if (params.white_bg) {
      // const base64Data = !base64 ? output : `data:image/png;base64,${base64}`;
      output = await replicate.run(
        '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
        { input: { image: output } },
      );
      bindGenerationLogData(request, {
        model: modelName,
        generationResult: GenerationStatus.SUCCEEDED,
        tool: 'line-art-colorize-new',
        cost: calculateLineArtColorizeCost(params.white_bg),
      });
      return new Response(JSON.stringify({ output: output }), { status: 200 });
    }
    bindGenerationLogData(request, {
      model: modelName,
      generationResult: GenerationStatus.SUCCEEDED,
      tool: 'line-art-colorize-new',
      cost: calculateLineArtColorizeCost(params.white_bg),
    });
    return new Response(JSON.stringify({ output: output }), { status: 200 });
  } catch (error) {
    console.error('Error in lineArtColorize:', error);
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
