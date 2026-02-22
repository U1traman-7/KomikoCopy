import { getAuthUserId } from './image-generation.js';
import { failedWithCode, uploadImage } from '../_utils/index.js';
import { CreditModel } from '../_models/credit.js';
import { calculateStyleTransferCost, IMAGE_GEMINI } from './_zaps.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { ERROR_CODES, GenerationStatus, TASK_TYPES } from '../_constants.js';
import { generateImageFluxKontextPro } from '../v2/generateImageFluxKontextPro.js';
import { getStyleInfo, type StyleInfo } from './_styleTransferPrompts.js';
import { failed } from '../_utils/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { uploadToGeminiFromBase64, urlToBase64 } from '../_utils/file.js';
import type { GenerativeModel } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { generateWithGemini } from '../_utils/gemini.js';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Nano Banana -> 'gemini-2.5-flash-image',
// Nano Banana Pro -> gemini-3-pro-image-preview'

const NANO_BANANA_MODEL_ID = 'gemini-2.5-flash-image';
const NANO_BANANA_PRO_MODEL_ID = 'gemini-3-pro-image-preview';

async function generateImageWithGemini(
  prompt: string,
  imageData: string,
  selectedModel: GenerativeModel,
): Promise<string> {
  // Validate image data
  if (!imageData || imageData.length === 0) {
    throw new Error('Empty image data provided');
  }

  // Convert URL to base64 if needed
  let base64Data = imageData;
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    base64Data = await urlToBase64(imageData);
  }

  // Build the prompt with image context
  const fullPrompt = `Input image to transform:

${prompt}

Generate the transformed image following the instructions above.`;

  try {
    // Upload the input image to Gemini Files API
    const inputFile = await uploadToGeminiFromBase64(base64Data);

    // Build parts like reference implementation
    const parts: any[] = [
      {
        text: 'Input image:\n```',
      },
      {
        fileData: {
          mimeType: inputFile.mimeType,
          fileUri: inputFile.uri,
        },
      },
      { text: '```\n\n' },
    ];

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
      responseModalities: ['image', 'text'],
    };

    const model = genAI.getGenerativeModel({
      model: selectedModel.model,
      generationConfig,
    });

    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const result = await chatSession.sendMessage(fullPrompt);

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates returned from Gemini');
    }
    const finishReason = candidate.finishReason as string;
    if (
      finishReason === 'IMAGE_SAFETY' ||
      finishReason === 'PROHIBITED_CONTENT' ||
      finishReason === 'SAFETY'
    ) {
      throw new Error(
        'Image generation failed due to content moderation restrictions from our service provider. Please try again with a different input, adjust your prompt, or switch to the Flux model.',
      );
    }

    const inlineData = candidate.content?.parts?.find(
      (p: any) => p.inlineData,
    )?.inlineData;
    if (!inlineData?.data) {
      throw new Error(
        'Failed to generate image - no image data returned from Gemini',
      );
    }

    return `data:${inlineData.mimeType};base64,${inlineData.data}`;
  } catch (error) {
    throw error;
  }
}

async function handler(request: Request) {
  const requestId = `vvst_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  try {
    // 1. Authentication
    const userId = await getAuthUserId(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 2. Parse parameters
    const params = (request as any).params;

    if (!params) {
      return failed('Invalid params');
    }

    const { image_url, style_id, mode, custom_prompt, variables } = params;

    // 3. Validate required parameters
    if (!image_url) {
      return failed('Image data is required');
    }

    if (!style_id && !custom_prompt) {
      return failed('Style prompt is required');
    }

    // 4. Calculate cost
    let cost = 0;
    if (params.tool !== 'image_animation') {
      cost = calculateStyleTransferCost(mode, params.tool, params.model);
    }

    let styleInfo: StyleInfo | undefined;
    if (style_id) {
      styleInfo = await getStyleInfo(style_id, variables);
      if (styleInfo && styleInfo.model) {
        params.model = styleInfo.model;
      }
      if (!styleInfo) {
        return failed('Invalid style ID');
      }
    }
    console.log(`[${requestId}] Style Info:`, styleInfo);
    // Bind generation log data - set initial model according to request
    const initialModelName =
      params?.model === 'flux-kontext-pro' ? 'FLUX.1 Kontext Pro' : 'Gemini';
    console.log(
      `[${requestId}] Initial model for request: ${initialModelName}`,
    );

    bindGenerationLogData(request, {
      model: initialModelName,
      generationResult: GenerationStatus.FAILED,
      tool: params.tool || 'style-transfer',
      cost,
    });

    // 5. Check user credits
    console.log(
      `[${requestId}] Checking credits for user ${userId}, required: ${cost}`,
    );
    const credit = new CreditModel(userId);
    const success = await credit.canConsume(cost);
    if (!success) {
      console.error(
        `[${requestId}] Insufficient credits for user ${userId}, required: ${cost}`,
      );
      return failed('Insufficient credits');
    }

    // 6. Build prompt based on mode
    let finalPrompt = '';
    // const sizePrompt =
    //   'Keep the image composition, aspect ratio, and exact dimensions identical to the original image. Keep the same number of characters and make sure the character pose and portion in the image are the same as the original image.';

    switch (mode) {
      case 'template': {
        if (!styleInfo) {
          return failed('Invalid style ID');
        }

        if (styleInfo.needVip && credit.subscriptions.length === 0) {
          // check if user is CPP
          const { data: userData } = await supabase
            .from('User')
            .select('is_cpp')
            .eq('id', userId)
            .single();
          const isCPP = userData?.is_cpp || false;

          if (!isCPP) {
            return failedWithCode(
              ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION,
              'VIP style requires a subscription',
            );
          }
        }
        if (styleInfo.changeType) {
          finalPrompt = `${styleInfo.prompt}, only change the ${styleInfo.changeType}`;
        } else {
          finalPrompt = `${styleInfo.prompt}`;
        }
        break;
      }
      case 'custom':
        finalPrompt = `${custom_prompt}.`;
        break;
      default:
        return failed('Invalid mode specified');
    }

    // 7. Check if middleware processing is needed (from styleInfo or request params)
    const needMiddleware =
      styleInfo?.needMiddleware || params.need_middleware === true;
    if (needMiddleware && finalPrompt) {
      try {
        console.log(
          `[${requestId}] Middleware processing enabled, enhancing prompt with Gemini...`,
        );
        const enhancedPrompt = await generateWithGemini(finalPrompt, image_url);
        if (enhancedPrompt && enhancedPrompt.trim()) {
          console.log(
            `[${requestId}] Prompt enhanced successfully: ${enhancedPrompt.substring(0, 100)}...`,
          );
          finalPrompt = enhancedPrompt;
        }
      } catch (error) {
        console.warn(
          `[${requestId}] Middleware enhancement failed, using original prompt:`,
          error,
        );
        // Continue with original prompt
      }
    }

    // 9. Try primary model, then fallback to the alternate model
    let output: string;
    let useModel = params.model;
    let usedModelName = initialModelName;
    let fallbackUsed = false;
    console.log(
      `[${requestId}] Generating image for user ${userId} using model: ${usedModelName}`,
    );
    console.log(`[${requestId}] Final prompt: ${finalPrompt}`);
    try {
      if (params.model === 'flux-kontext-pro') {
        // Primary: FLUX
        output = await generateImageFluxKontextPro({
          prompt: finalPrompt,
          image: image_url,
          aspectRatio: params.aspect_ratio,
        });
        usedModelName = 'FLUX.1 Kontext Pro';
      } else if (params.model === 'gemini-3-pro-image-preview') {
        // Primary: Gemini (Nano Banana Pro)
        output = await generateImageWithGemini(
          finalPrompt,
          image_url,
          genAI.getGenerativeModel({
            model: NANO_BANANA_PRO_MODEL_ID,
          }),
        );
        usedModelName = 'Gemini (Nano Banana Pro)';
      } else {
        // Primary: Gemini
        output = await generateImageWithGemini(
          finalPrompt,
          image_url,
          genAI.getGenerativeModel({
            model: NANO_BANANA_MODEL_ID,
          }),
        );
        usedModelName = 'Gemini (Nano Banana)';
      }
    } catch (primaryError: any) {
      // Primary model failed; log and try the alternate
      // const primaryModelName =
      //   params.model === 'flux-kontext-pro'
      //     ? 'FLUX.1 Kontext Pro'
      //     : 'Gemini (Nano Banana)';
      // console.error(
      //   `[${requestId}] ${primaryModelName} generation failed for user ${userId}:`,
      //   {
      //     message: primaryError?.message,
      //     error: primaryError,
      //     prompt: finalPrompt,
      //   },
      // );

      try {
        if (params.model === 'flux-kontext-pro') {
          // Fallback to Gemini
          output = await generateImageWithGemini(
            finalPrompt,
            image_url,
            genAI.getGenerativeModel({
              model: NANO_BANANA_MODEL_ID,
            }),
          );
          usedModelName = 'Gemini (Nano Banana)';
          useModel = NANO_BANANA_MODEL_ID;
        } else {
          // Fallback to FLUX
          output = await generateImageFluxKontextPro({
            prompt: finalPrompt,
            image: image_url,
            aspectRatio: params.aspect_ratio,
          });
          usedModelName = 'FLUX.1 Kontext Pro';
          useModel = 'flux-kontext-pro';
        }
        fallbackUsed = true;
      } catch (secondaryError: any) {
        // const secondaryModelName =
        //   params.model === 'flux-kontext-pro' ? 'Gemini' : 'FLUX.1 Kontext Pro';
        // console.error(
        //   `[${requestId}] Both generation methods failed (primary: ${primaryModelName}, secondary: ${secondaryModelName}):`,
        //   {
        //     primary: primaryError?.message,
        //     secondary: secondaryError?.message,
        //   },
        // );

        return new Response(
          JSON.stringify({
            error:
              'Image generation failed with both available methods. Please try again with different content or contact support.',
            requestId,
          }),
          { status: 400 },
        );
      }
    }
    console.log(
      `[${requestId}] Generating image for user ${userId} using fallback: ${fallbackUsed}`,
    );
    // 10. Validate output
    if (!output) {
      console.error(
        `[${requestId}] No image returned from ${usedModelName} for user ${userId}`,
      );
      return failed('Failed to generate styled image - no output received');
    }

    // 11. Deduct credits
    if (params.tool !== 'image_animation') {
      if (params.model !== useModel) {
        cost = calculateStyleTransferCost(mode, params.tool, useModel);
      }

      const deductResult = await credit.deductCredit(
        cost,
        params.tool || 'style-transfer',
      );

      if (!deductResult) {
        return failed('Failed to deduct credits');
      }
    }
    // 12. Process output - upload if base64, use directly if URL or video-to-video tool
    let outputImageUrl: string;

    if (typeof output === 'string' && output.startsWith('data:')) {
      const uploadedUrl = await uploadImage(
        `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.png`,
        output,
      );
      if (!uploadedUrl) {
        return failed('Failed to upload generated image');
      }
      outputImageUrl = uploadedUrl;
    } else if (
      typeof output === 'string' &&
      (output.startsWith('http://') || output.startsWith('https://'))
    ) {
      outputImageUrl = output;
    } else {
      outputImageUrl = output;
    }

    const tool = params.tool || 'video-to-video-style-transfer';
    // 13. Update generation log
    bindGenerationLogData(request, {
      model: usedModelName,
      generationResult: GenerationStatus.SUCCEEDED,
      tool,
      cost,
      fallbackUsed,
    });

    const response = {
      output: outputImageUrl,
      request_id: requestId,
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error in style transfer:`, {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    return new Response(
      JSON.stringify({
        error:
          'An unexpected error occurred during image generation. Please try again.',
        requestId,
      }),
      { status: 500 },
    );
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
