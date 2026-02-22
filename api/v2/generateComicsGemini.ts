import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CreditModel } from '../_models/credit.js';
import { failed, fetchGemini } from '../_utils/index.js';
import { IMAGE_GEMINI, IMAGE_GEMINI_MINI } from '../tools/_zaps.js';
import withHandler from '../_utils/withHandler.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function URLToBlob(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
}

const getPrompt = ({
  comicType = 'Anime',
  num_images: gridCount,
  adjective = 'engaging, interesting, fun, relatable, immersive, touching',
  art_style = 'Japanese anime style',
  idea,
}: {
  idea: string;
  comicType: string;
  num_images: number;
  adjective: string;
  art_style: string;
}) => `You are simulating a ${comicType == 'Meme' ? 'most unhinged' : 'great'} visual story creator that is specialized in creating ${gridCount || 4} panel visual story, which is ${adjective}. You will need to generate images in ${art_style}, and make sure each image is square shaped (1:1). Make sure the images are safe and could pass strict content moderation.
The input story idea by user (if it's a simple concept, you might need to expand it to make it more interesting):
"""
${idea}
"""
Identify the language of the user input idea. Write speech, narration, title in user language. Write description in English.
For each panel out of the ${gridCount || 4} panels, first output the following json object, then generate one image for that panel:
{
"id": number, // the id of the panel, from 1 to ${gridCount || 4}
"description": string, // image description of the panel. Note that the panel image shouldn't include any text or speech bubble, and it should only be one panel that fills the entire image (don't leave any blank space on the image). The image should be in ${art_style}.
"language": string, // identify the language of the user input idea, use that for speech, narration, and title
"speech": string, // speech bubble text, it should be short and concise, no more than 9 words, can be empty string, non-verbal cues should be wrapped in parentheses. The speech shouldn't be generated on the image, it will be added later by human editor.
"narration": string // narration box text, it should be short and concise, no more than 15 words, use it to briefly summarize the image prompt because the generated image might be unclear. The narration shouldn't be generated on the image, it will be added later by human editor.
}
In the end add comic title with less than 5 words and return it as {"title": string}
So your output should be: panel json object, image, panel json object, image, ... , image, title json object
  `;
async function handler(request: RequestImproved) {
  try {
    const {
      idea,
      num_images,
      comicType,
      adjective,
      art_style,
      store_supabase = true,
      tool,
      meta_data,
    } = (request as any).params;
    bindGenerationLogData(request, {
      model: 'Gemini',
      generationResult: GenerationStatus.FAILED,
      tool: tool || 'ai-comic-generator',
      cost: 0,
      meta_data: meta_data ?? null,
    });
    if (!idea) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
      });
    }

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Log in to generate images' }),
        { status: 401 },
      );
    }
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
      });
    }
    const userId = token.id;

    const cost = num_images * IMAGE_GEMINI_MINI;
    const creditModel = new CreditModel(userId as string);
    const success = await creditModel.canConsume(cost);
    if (!success) {
      return new Response(
        JSON.stringify({
          error:
            'Insufficient Zaps! Please visit the Profile page → click More Zaps',
        }),
        { status: 402 },
      );
    }

    const prompt = getPrompt({
      idea,
      num_images,
      adjective,
      art_style,
      comicType,
    });
    // console.log('prompt', prompt)
    const response = await fetchGemini(prompt);
    if ((response.candidates![0].finishReason as string) === 'IMAGE_SAFETY') {
      return failed(
        'Image generation failed due to content moderation restrictions from our service provider. Please try again with a different input, adjust your prompt, or switch to the Flux model.',
      );
    }

    const parts = response.candidates![0].content.parts;
    let imageCount = 0;

    // Process images first
    const imagePromises = parts
      .filter((part, index) => part.inlineData) // Get all image parts
      .map(async imagePart => {
        if (!imagePart.inlineData) {
          return null;
        }
        const base64Data = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        let imageUrl = `data:${mimeType};base64,${base64Data}`;
        let generationId = -1;

        if (store_supabase) {
          const imagePath = `image_generation/${userId}/${new Date().toISOString().split('T')[0]}-${uuidv4()}.webp`;
          const blob = await URLToBlob(imageUrl);
          const supaResult = await supabase.storage
            .from('husbando-land')
            .upload(imagePath, blob);

          if (!supaResult.error) {
            imageUrl = supabase.storage
              .from('husbando-land')
              .getPublicUrl(imagePath).data.publicUrl;
            const imageUrlPath = imageUrl.replace(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
              '',
            );

            const { data, error } = await supabase
              .from('ImageGeneration')
              .insert([
                {
                  prompt: idea,
                  model: 'Gemini',
                  url_path: imageUrlPath,
                  user_id: userId,
                  tool,
                  meta_data: meta_data ?? null,
                },
              ])
              .select('id')
              .single();
            if (error) {
              console.error(error);
            }
            // return data?.id;
            generationId = data?.id || -1;
          }
        }

        imageCount++;
        return { url: imageUrl, id: generationId };
      });

    const urls = await Promise.all(imagePromises);
    const texts = parts
      .filter((part, index) => part.text) // Get all text parts
      .map(part => part.text || '');

    const realCost = (urls.length || 0) * IMAGE_GEMINI_MINI;
    const result = await creditModel.deductCredit(realCost, tool);
    if (!result) {
      return failed('no zaps');
    }
    bindGenerationLogData(request, {
      model: 'Gemini',
      generationResult: GenerationStatus.SUCCEEDED,
      tool: tool || 'ai-comic-generator',
      cost: realCost,
    });
    return new Response(JSON.stringify({ images: urls, texts }), {
      status: 200,
    });
  } catch (e) {
    console.error(e);
    const tool = request.params?.tool;
    bindGenerationLogData(request, {
      model: 'Gemini',
      generationResult: GenerationStatus.FAILED,
      tool: tool || 'ai-comic-generator',
      cost: 0,
    });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
