import { createClient } from '@supabase/supabase-js';
import { CreditModel } from '../_models/credit.js';
import {
  failed,
  fetchGemini,
  getUserId,
  uploadImageToSupabase,
  deleteMediaByUrl,
  isUserSubscribed,
} from '../_utils/index.js';
import { IMAGE_GEMINI } from '../tools/_zaps.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFile } from 'fs/promises';
import path from 'path';
import withHandler from '../_utils/withHandler.js';
import {
  authMiddleware,
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { GenerationResult } from '../_utils/types.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function dataURLToBlob(dataURL: string) {
  const [header, data] = dataURL.split(',');
  const contentType = header!.match(/:(.*?);/)![1];
  const byteCharacters = Buffer.from(data, 'base64');

  const blob = new Blob([byteCharacters], { type: contentType });
  return blob;
}

const fetchGeminiImage = async (
  prompt: string,
  imageSize: { width: number; height: number } = { width: 1024, height: 1024 },
  init_images: string[] = [],
  meta_data?: any,
) => {
  // const API_KEY = Math.random() > 0.5 ? 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE' : 'AIzaSyDc17N7ac38TCa6ILQrYkhRTOl2S6mpWh4'
  const API_KEY = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(API_KEY);

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig,
  });

  // console.log('model', model);
  let aspectRatio = '1:1';
  let shape = 'square';
  if (imageSize.width === 1024 && imageSize.height === 1024) {
    aspectRatio = '1:1';
    shape = 'square';
  } else if (imageSize.width === 1280 && imageSize.height === 720) {
    aspectRatio = '16:9';
    shape = 'landscape';
  } else if (imageSize.width === 720 && imageSize.height === 1280) {
    aspectRatio = '9:16';
    shape = 'portrait';
  } else if (imageSize.width === 768 && imageSize.height === 1024) {
    aspectRatio = '3:4';
    shape = 'portrait';
  } else if (imageSize.width === 768 && imageSize.height === 1152) {
    aspectRatio = '2:3';
    shape = 'portrait';
  } else if (imageSize.width === 1024 && imageSize.height === 768) {
    aspectRatio = '4:3';
    shape = 'landscape';
  } else if (imageSize.width && imageSize.height) {
    aspectRatio = `${imageSize.width}:${imageSize.height}`;
    shape = 'custom';
  }

  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const character_ids: string[] = [];
  let match = reg.exec(prompt);
  while (match) {
    character_ids.push(match[1]);
    match = reg.exec(prompt);
  }

  let sizePrompt =
    'Now generate a high-quality high-resolution image with the same aspect ratio as the reference image.';
  if (!init_images.length) {
    sizePrompt = `Now generate a high-quality high-resolution image with aspect ratio ${aspectRatio}. Make sure the image is in ${shape} shape and has ${imageSize ? `${imageSize.width}x${imageSize.height}` : ''} ${aspectRatio} aspect ratio.`;
  }

  // Minimal addition: when a ratio template is present, append the exact canvas instruction
  let canvasPrompt = '';
  if (meta_data?.aspect_template_ratio && init_images?.length >= 1) {
    const target = init_images.length === 1 ? 'second image' : 'last image';
    const ratioTxt = String(meta_data.aspect_template_ratio);
    canvasPrompt = `Take the subject from the first image and place it inside the ${target} canvas. Expand the background of the first image naturally to fill the extra space of the ${target}. Keep the subject exactly the same, without cropping or distortion. Extend the background seamlessly in a photorealistic way, matching the original style, details, colors, lighting, and textures. Ensure smooth blending with no visible edges, borders, or repetition. Final result should be in perfect [${ratioTxt}] ratio.`;
  }

  const promptImproved = `
    Image generation prompt: ${prompt}
    ${sizePrompt}
    ${canvasPrompt}`;
  if (!character_ids.length && !init_images.length) {
    console.log('no custom characters');
    const response = await fetchGemini(promptImproved);
    if ((response.candidates![0].finishReason as string) === 'IMAGE_SAFETY') {
      return {
        error: "Image generation failed due to Google's content moderation",
      };
    }
    const data = response.candidates![0].content.parts;
    return data
      ?.filter(part => part.inlineData)
      ?.map(
        part =>
          `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
      );
  }

  const { data, error } = await supabase
    .from('CustomCharacters')
    .select('character_pfp,character_uniqid')
    .in('character_uniqid', character_ids);
  if (error) {
    console.error(error);
    return { error: 'Error fetching characters' };
  }

  if (!data || data.length === 0) {
    console.log(
      'No character data found (might be official characters):',
      character_ids,
    );
  }

  // 将图片转换为base64
  const imageToBase64 = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return Buffer.from(await blob.arrayBuffer()).toString('base64');
  };

  const characterParts = (
    await Promise.all(
      data.map(async ({ character_pfp, character_uniqid }, index) => {
        const base64 = await imageToBase64(character_pfp);
        const urlObj = new URL(character_pfp);
        const mimeType = `image/${urlObj?.pathname.split('.').pop()}`;

        return [
          {
            text: `Input image ${index + 1} is the portrait of character <${character_uniqid}>:. `,
          },
          {
            inlineData: {
              data: base64,
              mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            },
          },
        ];
      }),
    )
  ).flat();

  const referenceParts = (
    await Promise.all(
      init_images?.map(async (base64, idx) => {
        let base64Data = base64;
        let mimeType = '';
        if (/https?:\/\//.test(base64)) {
          const response = await fetch(base64);
          const blob = await response.blob();
          base64Data = Buffer.from(await blob.arrayBuffer()).toString('base64');
          mimeType = blob.type;
        } else {
          base64Data = base64.split(',')[1];
          mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
        }

        // Build reference image description with names if provided
        let beforeText = '';
        const characterCount = character_ids.length;
        const reference_names = meta_data?.reference_names || [];

        if (reference_names && reference_names.length > 0) {
          const imageName = reference_names[idx] || `reference${idx + 1}`;
          const imageNumber = characterCount + idx + 1;
          beforeText = `Input image ${imageNumber} is a reference image named "${imageName}". When the prompt mentions "${imageName}" or <${imageName}>, it refers to this specific reference image. The generated image should incorporate elements from this reference image as specified in the prompt.`;
        } else {
          beforeText =
            'The input image is a character/reference image. The generated image should preserve identity, appearance, facial features and clothing as appropriate, and follow the prompt.';
        }

        return [
          {
            text: beforeText,
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            },
          },
        ];
      }),
    )
  ).flat();

  // Append server-side ratio template from api/_utils/aspectRatios as the LAST image
  if (meta_data?.aspect_template_ratio) {
    try {
      const ratioMap: Record<string, string> = {
        '1:1': '1_1.png',
        '3:4': '3_4.png',
        '4:3': '4_3.png',
        '9:16': '9_16.png',
        '16:9': '16_9.png',
      };
      const fileName = ratioMap[String(meta_data.aspect_template_ratio)];
      if (fileName) {
        const baseDir = path.join(
          process.cwd(),
          'api',
          '_utils',
          'aspectRatios',
        );
        const filePath = path.join(baseDir, fileName);
        const buf = await readFile(filePath);
        const base64Data = buf.toString('base64');
        referenceParts.push({ text: '' } as any);
        referenceParts.push({
          inlineData: { data: base64Data, mimeType: 'image/png' },
        } as any);
      }
    } catch (e) {
      console.error('Failed to append aspect-ratio template:', e);
    }
  }

  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: 'user',
        parts: [...characterParts, ...referenceParts] as any,
      },
    ],
  });

  const response = await chatSession.sendMessage(promptImproved);
  if (
    (response.response.candidates![0].finishReason as string) === 'IMAGE_SAFETY'
  ) {
    return {
      error: "Image generation failed due to Google's content moderation",
    };
  }
  const imageUrls = response.response
    .candidates![0].content.parts?.filter(part => part.inlineData)
    ?.map(
      part =>
        `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
    );

  // Delete reference images after generation (only user-uploaded ones in app_media/references/)
  if (init_images && init_images.length > 0) {
    const referenceUrls = init_images.filter((url: string) =>
      url.includes('/app_media/references/'),
    );
    if (referenceUrls.length > 0) {
      await deleteMediaByUrl(referenceUrls);
      console.log('Deleted reference images:', referenceUrls);
    }
  }

  return imageUrls;
};

function hasError(err: any): err is { error: string } {
  if ((err as any)?.error) {
    return true;
  }
  return false;
}

async function handler(request: Request) {
  try {
    const {
      prompt,
      originalPrompt,
      num_images,
      init_images,
      size: imageSize,
      store_supabase,
      tool,
      meta_data,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Gemini',
      generationResult: GenerationStatus.FAILED,
      tool,
      cost: 0,
    });
    if (!prompt) {
      return failed('Prompt is required');
    }
    const userId = getUserId(request);

    // Check VIP requirement for multiple reference images (subscribed or CPP users)
    if (init_images && init_images.length > 1) {
      const isSubscribed = await isUserSubscribed(userId as string);

      // Also check if user is CPP member
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('is_cpp')
        .eq('id', userId)
        .single();

      const isCPP = userData?.is_cpp || false;

      if (!isSubscribed && !isCPP) {
        return failed('Multiple reference images require a premium plan');
      }
    }

    const creditModel = new CreditModel(userId as string);
    const success = await creditModel.canConsume(
      IMAGE_GEMINI * (num_images || 1),
    );
    if (!success) {
      return failed('no zaps');
    }
    const cost = IMAGE_GEMINI * (num_images || 1);

    const imageUrls: string[] = [];
    const requests: Promise<any>[] = [];
    const generations: GenerationResult[] = [];

    for (let i = 0; i < (num_images || 1); i++) {
      requests.push(
        fetchGeminiImage(
          prompt ?? originalPrompt,
          imageSize,
          init_images,
          meta_data,
        ),
      );
    }

    const results = await Promise.all(requests);

    for (const result of results) {
      if (hasError(result)) {
        return failed(result.error);
      }

      const imageUri = Array.isArray(result)
        ? (result.find((u: any) => typeof u === 'string' && u) as
            | string
            | undefined)
        : undefined;
      let imageUrl = '';
      let imageUrlPath = '';

      if (imageUri) {
        if (store_supabase) {
          try {
            const uploadedUrl = await uploadImageToSupabase(
              imageUri,
              userId as string,
            );
            imageUrl = uploadedUrl;
            imageUrls.push(imageUrl);
            imageUrlPath = imageUrl.replace(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
              '',
            );
          } catch (err) {
            console.error(
              'Upload to Supabase failed, fallback to data URL:',
              err,
            );
          }
        }

        if (imageUrl === '') {
          imageUrls.push(imageUri);
        }
      } else {
        console.error('No image returned from Gemini for one request');
        imageUrls.push('');
      }

      const { data, error } = await supabase
        .from('ImageGeneration')
        .insert([
          {
            prompt: originalPrompt ?? prompt,
            model: 'Gemini (Nano Banana)',
            url_path: imageUrlPath,
            user_id: userId,
            tool,
          },
        ])
        .select('id')
        .single();

      const url = imageUrls[imageUrls.length - 1];
      if (error || !data) {
        console.error('generate image gemini error', error);
        generations.push({ id: -1, url });
      } else {
        generations.push({ id: data.id, url });
      }
    }

    const result = await creditModel.deductCredit(cost, tool);
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: 'Gemini',
      generationResult: GenerationStatus.SUCCEEDED,
      tool,
      cost,
      meta_data: meta_data ?? null,
    });
    return new Response(JSON.stringify(generations), { status: 200 });
  } catch (e) {
    console.error(e);
    return failed('Image generation failed');
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
