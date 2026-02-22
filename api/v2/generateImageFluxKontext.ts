import { CreditModel } from '../_models/credit.js';
import { IMAGE_FLUX_KONTEXT } from '../tools/_zaps.js';
import { GenerationStatus, TASK_TYPES } from '../_constants.js';
import { authMiddleware } from '../_utils/middlewares/auth.js';
import withHandler from '../_utils/withHandler.js';
import {
  bindGenerationLogData,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import {
  createSupabase,
  failed,
  getUserId,
  replaceCharacterId,
  uploadImageToSupabase,
} from '../_utils/index.js';
import { translateMiddleware } from '../_utils/middlewares/translate.js';
import { tryGenerateHandler } from '../_utils/middlewares/tryGenerate.js';
import { getCharacterIds } from '../_utils/characterHelper.js';
import { fal } from '@fal-ai/client';
import { GenerationResult } from '../_utils/types.js';

fal.config({
  credentials: process.env.fal_api_key,
});

const supabase = createSupabase();

export interface GenerateImageFluxKontextProParams {
  prompt: string;
  image: string;
  aspectRatio: string;
  imageSize?: {
    width: number;
    height: number;
  };
}

export const generateImageFluxKontext = async (
  params: GenerateImageFluxKontextProParams,
) => {
  const { prompt, image, aspectRatio, imageSize } = params;
  if (!prompt) {
    console.error('Prompt is required');
    return '';
  }
  const finalPrompt = replaceCharacterId(prompt);
  if (!image) {
    const result = await fal.run('fal-ai/flux-kontext-lora/text-to-image', {
      input: {
        prompt: finalPrompt,
        image_size: imageSize || {
          width: 1024,
          height: 1024,
        },
        enable_safety_checker: false,
      },
    });
    return result?.data?.images?.[0]?.url || '';
  }

  const result = await fal.run('fal-ai/flux-kontext/dev', {
    input: {
      prompt: finalPrompt,
      image_url: image,
      enable_safety_checker: false,
      resolution_mode: (aspectRatio || 'match_input') as any,
    },
  });
  return result?.data?.images?.[0]?.url || '';
};

export const generateHandler = (modelName: string, imageCost: number) =>
  async function handler(request: RequestImproved) {
    try {
      const {
        prompt,
        originalPrompt,
        init_images = [],
        size,
        num_images = 1,
        store_supabase,
        tool,
        meta_data,
      } = (request as any).params;
      bindGenerationLogData(request, {
        model: modelName,
        generationResult: GenerationStatus.FAILED,
        tool,
        meta_data: meta_data ?? null,
        cost: 0,
      });
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
        });
      }

      const userId = getUserId(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
        });
      }

      const cost = num_images * imageCost;
      // Check if user has enough credits
      const creditModel = new CreditModel(userId);
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

      let aspect_ratio;
      let imageSize = {
        width: 1024,
        height: 1024,
      };
      if (!size) {
        aspect_ratio = undefined;
      } else if (size === 'square') {
        aspect_ratio = '1:1';
        imageSize = {
          width: 1024,
          height: 1024,
        };
      } else if (size === 'landscape') {
        aspect_ratio = '4:3';
        imageSize = {
          width: 768,
          height: 1024,
        };
      } else if (size === 'portrait') {
        aspect_ratio = '3:4';
        imageSize = {
          width: 1024,
          height: 768,
        };
      } else {
        const width = size.width;
        const height = size.height;
        imageSize = {
          width,
          height,
        };
        const ratios = [
          21 / 9,
          16 / 9,
          3 / 2,
          4 / 3,
          5 / 4,
          1 / 1,
          4 / 5,
          3 / 4,
          2 / 3,
          9 / 16,
          9 / 21,
        ];
        const ratio_strs = [
          '21:9',
          '16:9',
          '3:2',
          '4:3',
          '5:4',
          '1:1',
          '4:5',
          '3:4',
          '2:3',
          '9:16',
          '9:21',
        ];
        console.assert(
          ratios.length === ratio_strs.length,
          'Ratios and ratio_strs must have the same length',
        );
        const closestRatio = ratios.reduce(
          // eslint-disable-next-line no-confusing-arrow
          (closest, ratio) =>
            Math.abs(ratio - width / height) <
            Math.abs(closest - width / height)
              ? ratio
              : closest,
          ratios[0],
        );
        aspect_ratio = ratio_strs[ratios.indexOf(closestRatio)];
      }

      const imageUrls: string[] = [];
      const character_ids: string[] = getCharacterIds(prompt);
      const generations: GenerationResult[] = [];

      let characterRefPrompt = '';
      if (character_ids.length) {
        const characterId = character_ids[0];
        characterRefPrompt = `Input image is the portrait of character <${characterId}>.`;
        if (characterRefPrompt) {
          characterRefPrompt = `${characterRefPrompt}
    The generated image should keep the same identity, appearance, facial features, clothing of the input character images.`;
        }
      }

      const promptImproved = `${characterRefPrompt}
      ${init_images?.length && !characterRefPrompt ? 'Use the input image as a reference image, smartly reference it when generating the image.' : ''}
  Generate a high quality image with the following prompt: ${prompt}`;
      // 该模型只能使用一张图片。没有参考图，有自定义角色，则使用自定义角色图作为参考图；有参考图，直接使用参考图
      if (character_ids?.length) {
        const { data: characterData, error } = await supabase
          .from('CustomCharacters')
          .select('character_pfp,character_uniqid')
          .eq('character_uniqid', character_ids[0]);
        if (error) {
          console.error(error);
          // return { error: 'Error fetching characters' }
        }
        const data = characterData;
        if (!data) {
          console.error('No data');
          // return { error: 'Error fetching characters' }
        } else {
          const imageUrl = data[0].character_pfp;
          init_images.length = 0;
          init_images.push(imageUrl);
        }
      }

      const promises = new Array(num_images).fill(0).map(() =>
        generateImageFluxKontext({
          prompt: promptImproved,
          image: init_images?.[0],
          aspectRatio: aspect_ratio,
          imageSize,
        }).catch(),
      );

      const results = await Promise.all(promises);

      for (const imageUri of results as any) {
        console.log('imageUri', imageUri);
        // const imageData = result.images[0];
        // const imageUri = `data:image/jpeg;base64,${imageData}`;
        let imageUrl = '';
        let imageUrlPath = '';

        if (store_supabase) {
          try {
            const result = await uploadImageToSupabase(
              imageUri,
              userId,
              undefined,
              tool === 'oc-maker' || tool === 'ai-comic-generator',
            );
            imageUrl = result;
            imageUrls.push(imageUrl);
            imageUrlPath = result.replace(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
              '',
            );
          } catch (error) {
            console.error('Error uploading image to Supabase:', error);
            // 如果上传失败，使用原始URL
            imageUrls.push(imageUri);
          }
        }
        if (imageUrl === '') {
          imageUrls.push(imageUri);
        }
        const { data, error } = await supabase
          .from('ImageGeneration')
          .insert([
            {
              prompt: originalPrompt ?? prompt,
              model: modelName,
              url_path: imageUrlPath,
              user_id: userId,
              tool,
              meta_data: meta_data ?? null,
            },
          ])
          .select('id')
          .single();
        const url = imageUrls[imageUrls.length - 1];
        if (error || !data) {
          console.error('generate image flux kontext error', error);
          generations.push({ id: -1, url });
        } else {
          generations.push({ id: data.id, url });
        }
      }

      const validImageCount = imageUrls.length;
      const realCost = validImageCount * imageCost;
      const result = await creditModel.deductCredit(realCost, tool);
      if (!result) {
        return failed('no zaps');
      }
      bindGenerationLogData(request, {
        model: modelName,
        generationResult: GenerationStatus.SUCCEEDED,
        tool,
        meta_data: meta_data ?? null,
        cost: realCost,
      });
      return new Response(JSON.stringify(generations), { status: 200 });
    } catch (error) {
      console.error('Error generating image:', error);
      return new Response(
        JSON.stringify({
          error: (error as any)?.message || 'Failed to generate image',
        }),
        { status: 500 },
      );
    }
  };

export const POST = withHandler(generateHandler('Flux', IMAGE_FLUX_KONTEXT), [
  authMiddleware,
  bindParamsMiddleware,
  translateMiddleware,
  tryGenerateHandler(TASK_TYPES.IMAGE),
]);
