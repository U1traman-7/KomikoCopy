/* eslint-disable */
import Replicate from 'replicate';
import { CreditModel } from '../_models/credit.js';
import { getAuthUserId } from './video-generation.js';
import { failed, uploadImage, uploadImageToSupabase } from '../_utils/index.js';
import { calculateLineArtColorizeCost, ToolsModel } from './_zaps.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { gptEditImage } from './_gptEditImage.js';

// import { uploadFile } from "../../src/utilities/index.js";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { v4 as uuidv4 } from 'uuid';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function uploadToGemini(base64Data: string) {
  // 从 base64 数据中提取实际内容（移除 data:image/xxx;base64, 前缀）
  const base64Content = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;
  const mimeType = base64Data.split(';')[0].split(':')[1];
  // 创建临时文件
  const tempFilePath = `/tmp/temp_image_${Date.now()}.${mimeType.split('/')[1]}`;

  // 将 base64 写入临时文件
  fs.writeFileSync(tempFilePath, Buffer.from(base64Content, 'base64'));

  try {
    // 上传临时文件到 Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: `image_${Date.now()}.${mimeType.split('/')[1]}`,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // 删除临时文件
    fs.unlinkSync(tempFilePath);

    return file;
  } catch (error) {
    // 确保出错时也删除临时文件
    try {
      // const fs = require('fs');
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    throw error;
  }
}

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
async function handler(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    const params = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Layer Splitter',
      generationResult: GenerationStatus.FAILED,
      tool: 'layer-splitter',
      cost: 0,
    });
    params.white_bg = false;
    const model = params.model || ToolsModel.BASIC;
    const modelGemini = genAI.getGenerativeModel({
      model:
        model === ToolsModel.BASIC
          ? NANO_BANANA_MODEL_ID
          : NANO_BANANA_PRO_MODEL_ID,
    });
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(
      calculateLineArtColorizeCost(params.white_bg, model),
    );
    if (!success) {
      return failed('no zaps');
    }
    // console.log("params", params);

    let output: any;
    let base64: string = '';

    // Choose which model to use based on the selected model parameter
    //     if (model === ToolsModel.ADVANCED) {
    //       // Use GPT for image generation (Advanced model)
    //       const prompt = `AI Tool: Layer Splitter

    // Goal: Decompose this image into separated layer parts for animation and rigging, and lay all the parts on a pure white background.

    // Instructions:
    // 	•	Keep every part in the same angle and orientation and pose as the original image.
    // 	•	Preserve the exact original pose, proportions, linework, colors, and lighting of the character with no alterations.

    // Extract and display each part individually, including:
    // 	•	Head and face elements (eyes, eyebrows, mouth)
    // 	•	Hair segments (front, sides)
    // 	•	Arms, hands, legs, feet
    // 	•	Clothing pieces (tops, skirts, sleeves)
    // 	•	Unique items and accessories (hats, ribbons, etc)
    // 	•	Place each part in a evenly spaced layout.
    // 	•	Show parts at their original scale, angle, colors, lighting and orientation, with no perspective, rotation, or re-drawing.
    // 	•	Keep the white background clean and uniform, with no extra effects.

    // The final result should look like a cut-out character sheet: each piece cleanly separated, with consistent style, proportions, and coloring as the original image, ready for animation rigging.`;

    //       output = await gptEditImage({
    //         prompt: prompt,
    //         images: [params.sketch_b64],
    //         quality: 'high',
    //         imageSize: 'auto',
    //       });

    //       if (output.error) {
    //         return failed(`Failed to generate image: ${output.error}`);
    //       }
    //     } else
    {
      // Use Gemini (Basic model)
      const parts: any[] = [];
      const sketchFile = await uploadToGemini(params.sketch_b64);
      parts.push({ text: 'Input image:' });
      parts.push({
        fileData: {
          mimeType: sketchFile.mimeType,
          fileUri: sketchFile.uri,
        },
      });
      const chatSession = modelGemini.startChat({
        generationConfig,
        history: [
          {
            role: 'user',
            parts: parts,
          },
        ],
      });
      let prompt = `AI Tool: Layer Splitter

Goal: Decompose this image into separated layer parts for animation and rigging, and lay all the parts on a pure white background.

Instructions:
	•	Keep every part in the same angle and orientation and pose as the original image.
	•	Preserve the exact original pose, proportions, linework, colors, and lighting of the character with no alterations.

Extract and display each part individually, including:
	•	Head and face elements (eyes, eyebrows, mouth)
	•	Hair segments (front, sides)
	•	Arms, hands, legs, feet
	•	Clothing pieces (tops, skirts, sleeves)
	•	Unique items and accessories (hats, ribbons, etc)
	•	Place each part in a evenly spaced layout.
	•	Show parts at their original scale, angle, colors, lighting and orientation, with no perspective, rotation, or re-drawing.
	•	Keep the white background clean and uniform, with no extra effects.

The final result should look like a cut-out character sheet: each piece cleanly separated, with consistent style, proportions, and coloring as the original image, ready for animation rigging.`;
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
        console.error('Error in LayerSplitter:', error);
        return failed(`Failed to generate image: ${error}`);
      }
    }

    const result = await credit.deductCredit(
      calculateLineArtColorizeCost(params.white_bg, model),
      'layer-splitter',
    );
    if (!result) {
      return failed('no zaps');
    }
    if (params.white_bg) {
      const imageToProcess = model === ToolsModel.ADVANCED ? output : base64;
      output = await replicate.run(
        '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
        { input: { image: imageToProcess } },
      );
      try {
        output = await uploadImageToSupabase(output, userId, undefined, true);
      } catch (error) {
        console.error('Error in LayerSplitter:', error);
      }
      return new Response(JSON.stringify({ output: output }), { status: 200 });
    }
    try {
      output = await uploadImageToSupabase(output, userId, undefined, true);
    } catch (error) {
      console.error('Error in LayerSplitter:', error);
    }
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
