import { createClient } from '@supabase/supabase-js';
import {
  failed,
  getUserId,
  uploadImageToSupabase,
  deleteMediaByUrl,
  fetchGeminiNano,
} from '../_utils/index.js';
import { GoogleGenAI } from '@google/genai';
import { parseStyleToPrompt } from '../_utils/middlewares/improvePrompt.js';
import { generatePrompt } from '../generation/_common/models.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type GeminiModelVersion =
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

const fetchGeminiImage = async (
  prompt: string,
  imageSize: { width: number; height: number } = { width: 1024, height: 1024 },
  init_images: string[] = [],
  meta_data?: any,
  modelVersion: GeminiModelVersion = 'gemini-2.5-flash-image',
) => {
  // const API_KEY = Math.random() > 0.5 ? 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE' : 'AIzaSyDc17N7ac38TCa6ILQrYkhRTOl2S6mpWh4'
  const API_KEY = process.env.GEMINI_API_KEY!;
  // const genAI = new GoogleGenerativeAI(API_KEY);
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
    responseModalities: ['image', 'text'],
  };

  // const model = genAI.getGenerativeModel({
  //   model: 'gemini-2.5-flash-image',
  //   generationConfig,
  // });

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

  // Support both @character_id and <character_id> formats
  const reg = /@([\w\-().:]+)|<([^>]+)>/g;
  const character_ids: string[] = [];
  let match = reg.exec(prompt);
  while (match) {
    // match[1] is for @character_id, match[2] is for <character_id>
    character_ids.push(match[1] || match[2]);
    match = reg.exec(prompt);
  }

  const promptImproved = `
    Image generation prompt: ${prompt}
    `;
  if (!character_ids.length && !init_images.length) {
    console.log('no custom characters');
    const response = await fetchGeminiNano(
      promptImproved,
      aspectRatio,
      modelVersion,
    );

    if (
      (response.candidates![0].finishReason as string) === 'IMAGE_SAFETY' ||
      (response.candidates![0].finishReason as string) ===
        'PROHIBITED_CONTENT' ||
      response.candidates![0].content?.parts?.filter(part => part.inlineData)
        ?.length === 0
    ) {
      return {
        error: "Image generation failed due to Google's content moderation",
      };
    }
    const data = response.candidates![0].content?.parts;
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
  // If no data found, it might be official characters (not in database)
  // Continue with empty data array instead of returning error
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

  const response = await ai.models.generateContent({
    model: modelVersion,
    contents: [...characterParts, ...referenceParts, { text: promptImproved }],
    config: {
      imageConfig: {
        aspectRatio,
      },
      ...generationConfig,
    },
  });
  if (
    (response.candidates![0].finishReason as string) === 'IMAGE_SAFETY' ||
    (response.candidates![0].finishReason as string) === 'PROHIBITED_CONTENT' ||
    response.candidates![0].content?.parts?.filter(part => part.inlineData)
      ?.length === 0
  ) {
    return {
      error: "Image generation failed due to Google's content moderation",
    };
  }
  // const imageUrls = response.response
  const imageUrls = response
    ?.candidates![0].content?.parts?.filter(part => part.inlineData)
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

export default async function handler(params: any) {
  try {
    // (request as any).params = await request.json();
    // const params = await request.json();
    await generatePrompt('Gemini', params);
    const {
      prompt,
      originalPrompt,
      init_images,
      size: imageSize,
      tool,
      meta_data,
      model: modelParam,
      task_id,
      webhookUrl,
      userId,
    } = params;

    // Determine which Gemini model version to use
    const isGeminiPro = modelParam === 'Gemini Pro';
    const geminiModelVersion: GeminiModelVersion = isGeminiPro
      ? 'gemini-3-pro-image-preview'
      : 'gemini-2.5-flash-image';

    if (!prompt) {
      return failed('Prompt is required');
    }
    // const userId = getUserId(request);
    if (!userId) {
      return failed('User not found');
    }
    const stylePrompt = parseStyleToPrompt(prompt ?? originalPrompt);

    const newPrompt = (prompt ?? originalPrompt).replace(/\[.+?\]/g, '');
    const newPromptWithStyle = stylePrompt
      ? `${newPrompt} ${stylePrompt}`
      : newPrompt;

    console.log(
      'promptImproved',
      newPromptWithStyle,
      'model:',
      geminiModelVersion,
    );

    const imageResult = await fetchGeminiImage(
      newPromptWithStyle,
      imageSize,
      init_images,
      meta_data,
      geminiModelVersion,
    );
    if (hasError(imageResult)) {
      // return failed(imageResult.error);
      console.error(imageResult.error);
      return false;
    }

    const imageUri = Array.isArray(imageResult)
      ? (imageResult.find((u: any) => typeof u === 'string' && u) as
          | string
          | undefined)
      : undefined;
    if (!imageUri) {
      console.error('No image returned from Gemini');
      return false;
    }
    const uploadedUrl = await uploadImageToSupabase(
      imageUri,
      userId as string,
      undefined,
      tool === 'oc-maker',
    );

    const webhookResult = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        task_id,
        output: uploadedUrl,
        tool,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-task-id': task_id,
      },
    });
    if (webhookResult.status !== 200) {
      // return failed('Webhook failed');
      console.error('Webhook failed');
      return false;
    }

    // return new Response(JSON.stringify(generations), { status: 200 });
    // return new Response('success', { status: 200 });
    return true;
  } catch (e) {
    console.error('Image generation failed', e);
    // return failed('Image generation failed');
    return false;
  }
}

// export const POST = withHandler(handler, [authMiddleware]);
