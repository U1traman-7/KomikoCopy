/* eslint-disable */
import { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  TEMP_IMAGE_URL,
  CHARACTER_MENTION_REGEX,
  BANANA_PRO_GRID_TAGS,
  SEEDREAM_GRID_TAGS,
} from '../../constants';
import { deepClone, toastError, toastWarn } from '../../utilities';
import { isComicBubble, isComicImage, isComicPage } from '../../helpers/id';
// const horny = "/images/horny.webp";
import { TFunction } from 'i18next';
import { ERROR_CODES, GENERAL_STYLES } from '../../../api/_constants';
import { ModelIds } from '../../../api/_constants';
import {
  addTaskId,
  queryTaskPromise,
  submitGenerationTask,
} from '@/utils/imageTask';

// Model key to display label mapping
const MODEL_DISPLAY_LABELS: Record<string, string> = {
  'Gemini Pro': '🔥 Nano Banana Pro',
  Gemini: 'Gemini (Nano Banana)',
};

// 判断是否应该添加 anime style：没有参考图 + 没有角色提及 + 没有风格预设
function shouldAddAnimeStyle(
  prompt: string,
  referenceImage: string | string[] = '',
  selectedCharImages: any[] = []
): boolean {
  const hasReferenceImage = Array.isArray(referenceImage)
    ? referenceImage.length > 0
    : !!referenceImage;
  const hasCharImages = selectedCharImages && selectedCharImages.length > 0;
  const hasCharacterMention = CHARACTER_MENTION_REGEX.test(prompt);
  const hasStylePreset = /\[.+?\]/.test(prompt);
  return !hasReferenceImage && !hasCharImages && !hasCharacterMention && !hasStylePreset;
}

export function BgLayer({ width, height }: { width: number; height: number }) {
  const layerRef = useRef<any>();
  const [components, setComponents] = useState<any>(null);

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const [reactKonva, konva] = await Promise.all([
          import('react-konva'),
          import('konva'),
        ]);
        setComponents({
          Layer: reactKonva.Layer,
          Rect: reactKonva.Rect,
          Konva: konva.default,
        });
      } catch (error) {
        console.error('Failed to load Konva components:', error);
      }
    };

    if (typeof window !== 'undefined') {
      loadComponents();
    }
  }, []);

  if (!components) {
    return null; // or a loading placeholder
  }

  const { Layer, Rect } = components;

  return (
    <Layer
      ref={layerRef}
      clipX={0}
      clipY={0}
      clipWidth={width}
      clipHeight={height}>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill='white'
        name='canvas'
        id='canvas'
        zIndex={0}
        listening={false}
      />
    </Layer>
  );
}

export async function initImage(imageUrl: string): Promise<HTMLImageElement> {
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.src = imageUrl;

  return new Promise(resolve => {
    img.onload = async () => {
      resolve(img);
    };
  });
}

export async function loadTempImage(): Promise<HTMLImageElement> {
  return initImage(TEMP_IMAGE_URL);
}

async function convertImageToURI(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const reader = new FileReader();

    return await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to URI:', error);
    throw error;
  }
}
export async function generateImageGetUrls(
  input: string,
  size: string | any = 'square',
  numGenerations: number = 1,
  compositeModel: string = 'Neta',
  selectedCharImages: any[] = [],
  referenceImage: string | string[] = '',
  isNude: boolean = false,
  storeSupabase: boolean = true,
  t: TFunction,
  tool?: string,
  meta_data?: any,
  noTranslate?: boolean,
  useMagicPrompt?: boolean,
  userNegativePrompt?: string,
) {
  if (size == 'square') {
    size = {
      width: 1024,
      height: 1024,
    };
  } else if (size == 'landscape') {
    size = {
      width: 1024,
      height: 768,
    };
  } else if (size == 'portrait') {
    size = {
      width: 768,
      height: 1024,
    };
  }

  if (isNude) {
    return {
      imageUrls:
        'https://external-preview.redd.it/uFki8hEItDYbcyk69ksbnynkrrLd4ftMjoMqTujpRcI.png?auto=webp&s=601662b59c65c9e4c1b28288507a294f9db2694f',
    };
  }

  let positivePrompt =
    ', best quality, 4k, masterpiece, highres, detailed, amazing quality, rating: general';
  const defaultNegativePrompt =
    'worst quality, nsfw, rating: sensitive, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, rating: sensitive, low contrast, flexible deformity, abstract, low contrast,';
  // Merge user negative prompt with default
  let negativePrompt = userNegativePrompt
    ? `${userNegativePrompt}, ${defaultNegativePrompt}`
    : defaultNegativePrompt;
  // let positivePrompt = ", best quality, 4k, safe, masterpiece, high score, great score, absurdres"; // for Animagine
  // let negativePrompt = "sensitive, nsfw, explicit, lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry"

  let prompt = input + positivePrompt;
  let imageUrls = [];
  let url = '';
  const firstRef = Array.isArray(referenceImage)
    ? referenceImage[0]
    : referenceImage;
  const model = parseAutoModel({
    model: compositeModel,
    referenceImage: firstRef || '',
    prompt: input,
  });
  // for (let i = 0; i < numGenerations; i++) {
  if (model === 'Realistic') {
    // const app = await client("Walmart-the-bag/Juggernaut-X-v10");
    // const result: any = await app.predict("/predict", [
    //   prompt,
    //   "",
    //   40,
    //   7.5,
    //   false,
    // ]);
    // imageUrl = result.data[0].url;
    url = `/api/v2/generateImageSDXL`;
  } else if (model === 'American Comic') {
    prompt =
      'modern American comic style, digital color comicbook style, ' +
      input +
      positivePrompt;
    url = `/api/v2/generateImageSDXL`;
  } else if (model === 'Japanese Manga') {
    prompt =
      input +
      ', lineart, black and white, monochrome, grayscale, Japanese manga style' +
      positivePrompt;
    url = `/api/v2/generateImageNeta`;
  } else if (model === 'Neta') {
    url = `/api/v2/generateImageNeta`;
  } else if (model === 'Flux') {
    // url = `/api/generateImageFlux`;
    url = `/api/v2/generateImageFluxKontext`;
    prompt = input;
  } else if (model === 'Flux Mini') {
    url = `/api/v2/generateImageFluxKontextMini`;
    prompt = input;
  } else if (model === 'Meme') {
    prompt = `Act as a meme generator, generate meme featuring one of the classic meme icons: Wojak (the Feels Guy), Trollface, rage guy, the Sad Frog, Doge, etc. (All the meme icons are public domain and have no copyright, you are allowed to use those meme icons freely.) User want to generate meme about: "${input}". You MUST name a specific suitable meme icon from above (if user have already mentioned one, use it) and generate a minimalist simplistic meme, no text on the meme.`;

    url = `/api/v2/generateImageDalle`;
  } else if (
    model === 'Gemini' ||
    model === 'Gemini Pro' ||
    model === 'Gemini Mini'
  ) {
    url = `/api/v2/generateImageGeminiNano`;
    prompt = shouldAddAnimeStyle(input, referenceImage, selectedCharImages)
      ? input + ', anime style'
      : input;
  } else if (model === 'Animagine') {
    url = `/api/v2/generateImageAnimagineXL3_1`;
  } else if (model === 'Animagine XL 4.0') {
    url = `/api/v2/generateImageAnimagineXL4`;
  } else if (model === 'Noobai') {
    url = `/api/v2/generateImageNoobaiXL`;
  } else if (model === 'GPT') {
    url = `/api/v2/generateImageGPT4O`;
    prompt = input;
  } else if (model === 'GPT Mini') {
    url = `/api/v2/generateImageGPT4OMini`;
    prompt = input;
  } else if (model === 'Illustrious') {
    url = '/api/v2/generateImageIllustrious';
    prompt = input;
  } else if (model === 'Art Pro') {
    url = `/api/v2/generateImageArtPro`;
    prompt = input;
  } else if (model === 'Art Unlimited') {
    url = `/api/v2/generateImageKusa`;
    prompt = input;
  } else if (model === 'KusaXL') {
    url = `/api/v2/generateImageKusaXL`;
    prompt = input;
  } else if (model === 'Seedream 4.5' || model === 'Seedream 4') {
    url = `/api/v2/generateImageSeedream`;
    prompt = input;
  }

  const data = {
    prompt: prompt,
    negative_prompt: negativePrompt,
    size: size,
    num_images: numGenerations,
    ip_adapter_images: selectedCharImages,
    init_images: Array.isArray(referenceImage)
      ? referenceImage
      : referenceImage
        ? [referenceImage]
        : undefined,
    store_supabase: storeSupabase,
    tool: tool,
    meta_data: meta_data ?? null,
    originalPrompt: input,
    no_translate: !!noTranslate,
    improve_prompt: !!useMagicPrompt,
    auto_model: compositeModel === 'Auto Model',
    model: model,
  };
  // production not log
  if (process.env.NODE_ENV !== 'production') {
    console.log(data);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    console.log('ERROR CALLING API');
    // console.error(await response.text());
    const message = await response.json();
    // toast.error(`Failed to generate image: ${message.error}`);
    // toast.error(t('toast:image.generation.failed'))
    if (message.error.includes('sensitive')) {
      toastError(t('toast:error.sensitiveContent'));
    } else {
      toastError(t('toast:error.generationFailed'));
    }
    // console.log(message.error)
    imageUrls = [];
  } else {
    imageUrls = await response.json();
  }
  if ((imageUrls as any).error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
    toastWarn(t('toast:common.rateLimitExceeded'));
    return [];
  }
  if ((imageUrls as any)?.error) {
    // toastError((imageUrls as any).error);
    toastError(t('toast:error.generationFailed'));
    return [];
  }

  return imageUrls;
}

export async function generateImageGetUrlsV2(
  input: string,
  size: string | any = 'square',
  numGenerations: number = 1,
  compositeModel: string = 'Seedream 4.5',
  selectedCharImages: any[] = [],
  referenceImage: string | string[] = '',
  isNude: boolean = false,
  storeSupabase: boolean = true,
  t: TFunction,
  tool?: string,
  meta_data?: any,
  noTranslate?: boolean,
  useMagicPrompt?: boolean,
  userNegativePrompt?: string,
  userOriginalPrompt?: string, // Original user input for database storage (before template wrapping)
) {
  if (size == 'square') {
    size = {
      width: 1024,
      height: 1024,
    };
  } else if (size == 'landscape') {
    size = {
      width: 1024,
      height: 768,
    };
  } else if (size == 'portrait') {
    size = {
      width: 768,
      height: 1024,
    };
  }

  if (isNude) {
    return {
      imageUrls:
        'https://external-preview.redd.it/uFki8hEItDYbcyk69ksbnynkrrLd4ftMjoMqTujpRcI.png?auto=webp&s=601662b59c65c9e4c1b28288507a294f9db2694f',
    };
  }

  let positivePrompt =
    ', best quality, 4k, masterpiece, highres, detailed, amazing quality, rating: general';
  const defaultNegativePromptV2 =
    'worst quality, nsfw, rating: sensitive, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, rating: sensitive, low contrast, flexible deformity, abstract, low contrast,';
  // Merge user negative prompt with default
  let negativePrompt = userNegativePrompt
    ? `${userNegativePrompt}, ${defaultNegativePromptV2}`
    : defaultNegativePromptV2;

  let prompt = input + positivePrompt;
  let imageUrls = [];
  let url = '';
  const firstRef = Array.isArray(referenceImage)
    ? referenceImage[0]
    : referenceImage;
  const model = parseAutoModel({
    model: compositeModel,
    referenceImage: firstRef || '',
    prompt: input,
  });
  let targetModel = 0;
  if (model === 'Flux') {
    // url = `/api/generateImageFlux`;
    url = `/api/v2/generateImageFluxKontext`;
    prompt = input;
    targetModel = ModelIds.FLUX_KONTEXT;
    if (referenceImage?.length) {
      targetModel = ModelIds.FLUX_KONTEXT_DEV;
    }
  } else if (model === 'Flux Mini') {
    url = `/api/v2/generateImageFluxKontextMini`;
    prompt = input;
  } else if (
    model === 'Gemini' ||
    model === 'Gemini Pro' ||
    model === 'Gemini Mini'
  ) {
    url = `/api/v2/generateImageGeminiNano`;
    prompt = shouldAddAnimeStyle(input, referenceImage, selectedCharImages)
      ? input + ', anime style'
      : input;
  } else if (model === 'Animagine') {
    // url = `/api/v2/generateImageAnimagineXL3_1`;
    targetModel = ModelIds.ANIMAGINE_XL_3_1;
  } else if (model === 'Noobai') {
    // url = `/api/v2/generateImageNoobaiXL`;
    targetModel = ModelIds.NOOBAI_XL;
  } else if (model === 'Illustrious') {
    // url = '/api/v2/generateImageIllustrious';
    targetModel = ModelIds.ILLUSTRIOUS;
    prompt = input;
  } else if (model === 'Art Pro') {
    // url = `/api/v2/generateImageArtPro`;
    prompt = input;
    targetModel = ModelIds.ART_PRO;
  } else if (model === 'Art Unlimited') {
    // url = `/api/v2/generateImageKusa`;
    prompt = input;
    targetModel = ModelIds.ART_UNLIMITED;
  } else if (model === 'KusaXL') {
    // url = `/api/v2/generateImageKusaXL`;
    prompt = input;
    targetModel = ModelIds.KUSAXL;
  } else if (model === 'Seedream 4.5') {
    prompt = shouldAddAnimeStyle(input, referenceImage, selectedCharImages)
      ? input + ', anime style'
      : input;
    targetModel = ModelIds.SEEDREAM;
    if (referenceImage?.length) {
      targetModel = ModelIds.SEEDREAM_EDIT;
    }
  } else if (model === 'Seedream 4') {
    prompt = shouldAddAnimeStyle(input, referenceImage, selectedCharImages)
      ? input + ', anime style'
      : input;
    targetModel = ModelIds.SEEDREAM_V4;
    if (referenceImage?.length) {
      targetModel = ModelIds.SEEDREAM_V4_EDIT;
    }
  }

  const data = {
    prompt: prompt,
    negative_prompt: negativePrompt,
    size: size,
    num_images: numGenerations,
    ip_adapter_images: selectedCharImages,
    init_images: Array.isArray(referenceImage)
      ? referenceImage
      : referenceImage
        ? [referenceImage]
        : undefined,
    store_supabase: storeSupabase,
    tool: tool,
    meta_data: meta_data ?? null,
    // Use userOriginalPrompt if provided (for template-wrapped prompts), otherwise use input
    originalPrompt: userOriginalPrompt ?? input,
    no_translate: !!noTranslate,
    improve_prompt: !!useMagicPrompt,
    auto_model: compositeModel === 'Auto Model',
    model: model,
    target_model: targetModel,
  };

  if (targetModel) {
    const result = await submitGenerationTask(data);
    if (result.error) {
      toastError(t('toast:error.generationFailed'));
      return [];
    }
    const generationPromises = queryTaskPromise(result.taskIds);
    addTaskId(...result.taskIds);
    // console.log('generations Promises', generationPromises);
    const generations = await Promise.all(generationPromises);
    const resultUrls = generations.filter(g => !!g && !g.error);
    // console.log('generations resultUrls', resultUrls);
    const errorUrls = generations.filter(g => !!g.error);
    if (errorUrls.length > 0) {
      toastError(t('toast:error.generationFailed'));
    }

    return resultUrls;
  }
  if (process.env.NODE_ENV !== 'production') {
    // production not log
    console.log(data);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    console.log('ERROR CALLING API');
    // console.error(await response.text());
    const message = await response.json();
    // toast.error(`Failed to generate image: ${message.error}`);
    // toast.error(t('toast:image.generation.failed'))
    if (message.error.includes('sensitive')) {
      toastError(t('toast:error.sensitiveContent'));
    } else {
      toastError(t('toast:error.generationFailed'));
    }
    // console.log(message.error)
    imageUrls = [];
  } else {
    imageUrls = await response.json();
  }
  if ((imageUrls as any).error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
    toastWarn(t('toast:common.rateLimitExceeded'));
    return [];
  }
  if ((imageUrls as any)?.error) {
    // toastError((imageUrls as any).error);
    toastError(t('toast:error.generationFailed'));
    return [];
  }

  return imageUrls;
}

function getImageDimensions(base64String: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = function () {
      reject(new Error('Failed to load image'));
    };
    img.src = base64String;
  });
}

export async function generateImage(
  input: string,
  model: string,
  imageSize: { width: number; height: number },
  selectedCharImages: any[],
  referenceImage: string | string[],
  numGenerations: number,
  onImageLoaded: (
    imageObj: any,
    options: {
      replace: boolean | string;
      imageSize?: { width: number; height: number };
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
      referenceImage?: string;
      asyncImageFunc?: () => Promise<any>;
      numGenerations?: number;
    },
  ) => void,
  setGenerating: (bool: boolean) => void,
  regenerate: boolean = false,
  node?: any,
  updateProfile?: () => void,
  t?: TFunction,
  tool?: string,
  meta_data?: any,
  noTranslate?: boolean,
  useMagicPrompt?: boolean,
  userNegativePrompt?: string,
  displayPrompt?: string, // Original user input for display (not the processed prompt sent to AI)
) {
  setGenerating(true);

  // const isNude = /(?:Naked| nude| naked| nudity| no clothes| horny| dick| ass| pussy| bitch| cum| without clothes| fuck| porn| pornographic| sexual| erection| boobs| breast| vagina| penis| anal| blowjob| masturbation| lust| erotic| pervert| horny| slut| whore| explicit| obscene)/i.test(input);
  const isNude = false;
  // if (referenceImage) {
  //   const tempSize: any = await getImageDimensions(referenceImage);
  //   const scale = Math.max(1024 / tempSize.width, 1024 / tempSize.height);
  //   imageSize = {
  //     width: Math.floor(scale * tempSize.width),
  //     height: Math.floor(scale * tempSize.height),
  //   };
  // }
  if (isNude) {
    imageSize = {
      width: 1024,
      height: 730,
    };
  }
  console.log('imageSize', imageSize);

  const firstRefForParse = Array.isArray(referenceImage)
    ? referenceImage[0]
    : referenceImage;
  const resolvedModel = parseAutoModel({
    model,
    referenceImage: firstRefForParse || '',
    prompt: input,
  });

  const asyncImageFunc = async () => {
    let imageUrls = await generateImageGetUrlsV2(
      input,
      imageSize,
      numGenerations,
      resolvedModel,
      selectedCharImages,
      referenceImage,
      isNude,
      undefined,
      t!,
      tool,
      meta_data,
      noTranslate,
      useMagicPrompt,
      userNegativePrompt,
      displayPrompt, // Pass original user input for database storage
    );
    if ((imageUrls as any[])?.length) {
      updateProfile?.();
    }
    if (regenerate && node?.attrs.imageUrls && node?.attrs.imageUrls.length) {
      // replace the last placeholder image
      node.attrs.imageUrls[node?.attrs.imageUrls.length - 1] = imageUrls[0];
      imageUrls = deepClone(node?.attrs.imageUrls);
    }
    return {
      imageUrls,
    };
  };
  console.log('HIIII');
  // Use display label for model name if available
  const displayModel = MODEL_DISPLAY_LABELS[resolvedModel] || resolvedModel;
  onImageLoaded(undefined, {
    replace: regenerate ? 'extend' : false,
    imageSize: imageSize,
    // Use displayPrompt (original user input) if provided, otherwise fall back to input
    prompt: displayPrompt || input,
    model: displayModel,
    selectedCharImages: selectedCharImages,
    referenceImage: firstRefForParse || undefined,
    asyncImageFunc,
    numGenerations,
  });
  setGenerating(false);
}

export async function generateText(
  prompt: string,
  model: string = 'gpt-4o',
  t: TFunction,
  noNeedLogin: boolean = false,
) {
  if (model == 'gpt-4o') {
    const url = `/api/generateText`;

    const data = {
      prompt: prompt,
      noNeedLogin: noNeedLogin,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    let output;
    if (!response.ok) {
      console.log('ERROR CALLING API');
      // console.error(await response.text());
      // toast.error(`Failed to generate text: ${response.status} ${await response.text()}`);
      toast.error(t('toast:text.generation.failed'));
    } else {
      output = await response.json();
      console.log(output);
    }
    return output;
  } else if (model == 'claude-3.5-sonnet') {
    const url = `/api/callLLMClaude`;
    const data = {
      contents: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    let output;
    if (!response.ok) {
      console.log('ERROR CALLING API');
      // toast.error(`Failed to generate text: ${response.status} ${await response.text()}`);
      toast.error(t('toast:text.generation.failed'));
    } else {
      output = await response.json();
    }
    return output?.text;
  }
}

export async function createCharacter(
  name: string,
  description: string,
  age: string,
  profession: string,
  personality: string,
  interests: string,
  intro: string,
  gender: string,
  reference_images: string[],
  t: TFunction,
  prompt?: string,
  is_public?: boolean,
) {
  const url = `/api/createCharacter`;

  const data = {
    name,
    description,
    age,
    profession,
    personality,
    interests,
    intro,
    gender,
    reference_images,
    prompt,
    is_public,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    console.log('ERROR CALLING API');
    // console.error(await response.text());
    // toast.error(`Failed to create character: ${response.status} ${await response.text()}`);
    toast.error(t('toast:character.creation.failed'));
    throw new Error(`Failed to create character: ${response.status}`);
  }

  const uniqid = await response.json();
  console.log(uniqid);
  return uniqid;
}

export const cancelAllShapeDraggable = (layerRef: any) => {
  var shapes = layerRef.current.find('Rect, Image, Group');
  shapes &&
    shapes.forEach(function (shape: { draggable: (arg0: boolean) => void }) {
      shape.draggable(false);
    });
  layerRef.current.draw();
};

// 点击一个Node时，恢复它对应容器的draggable
export const enableCNodeDraggable = (layerRef: any) => {
  console.log('enableCNodeDraggable');
  // function cnodeDraggable(node: Konva.Node){
  //   if(isComicPage(node) || isComicImage(node) || isComicBubble(node)) {
  //     node.draggable(true)
  //     transformerRef.current && transformerRef.current.nodes([node])
  //     return
  //   } else {
  //     node.parent && cnodeDraggable(node.parent)
  //   }
  // }
  // cnodeDraggable(node)
  var shapes = layerRef.current.find('Rect, Image, Group');
  shapes &&
    shapes.forEach(function (node: any) {
      if (isComicPage(node) || isComicImage(node) || isComicBubble(node)) {
        node.draggable(true);
      }
    });
  layerRef.current.draw();
};

/**
 * Parse Auto Model to determine the actual model to use
 * This is a synchronous function that uses availableCharacters data
 * If character data is not available, it conservatively returns Seedream
 */
export const parseAutoModel = ({
  model,
  referenceImage,
  prompt,
  availableCharacters,
}: {
  model: string;
  referenceImage: string | string[];
  prompt: string;
  availableCharacters?: Array<{
    character_uniqid: string;
    alt_prompt?: string;
    character_description?: string;
  }>;
}) => {
  if (model === 'Auto Model') {
    // Priority 1: Check for multiple reference images first - always use Seedream
    // Multiple reference images require Seedream model
    const hasMultipleRefs =
      Array.isArray(referenceImage) && referenceImage.length > 1;

    if (hasMultipleRefs) {
      return 'Seedream 4.5';
    }

    // Priority 2: Check for grid layout tags - these require specific models
    if (BANANA_PRO_GRID_TAGS.some(g => prompt.includes(g))) {
      return 'Gemini Pro';
    }
    if (SEEDREAM_GRID_TAGS.some(g => prompt.includes(g))) {
      return 'Seedream 4.5';
    }

    // Priority 3: Check for [ ] syntax (style presets) - always use Art Pro for anime styles
    // This takes priority because style presets are explicitly anime-focused
    const hasStylePreset = prompt.match(/\[.+?\]/);
    const generalStyles = Object.keys(GENERAL_STYLES);

    // Priority 3: Check if prompt contains @ character (character mention)
    if (prompt.includes('@')) {
      // Extract character IDs from prompt
      // Match alphanumeric characters, underscores, hyphens, parentheses, periods, colons, and single quotes
      // e.g., @Isabelle_(Animal_Crossing), @Mr._C.B._(Umamusume), @Momo_Ayase, @MayaJensen-dgqr
      const characterMentions = prompt.match(CHARACTER_MENTION_REGEX) || [];
      const mentionedCharacterIds = characterMentions.map((m: string) =>
        m.substring(1),
      );

      // If user just typed @ without a complete character ID, use default Art Pro
      if (mentionedCharacterIds.length === 0) {
        return 'Art Pro';
      }

      // Optimistic logic: Switch to Seedream only when CONFIRMED missing alt_prompt
      // Strategy:
      // - If character found AND alt_prompt is falsy -> must use Seedream (confirmed)
      // - If character not found or alt_prompt property missing -> treat as unknown -> keep Art Pro
      if (availableCharacters && availableCharacters.length > 0) {
        let hasConfirmedMissing = false; // At least one character confirmed without alt_prompt

        for (const characterId of mentionedCharacterIds) {
          const character = availableCharacters.find(
            c => c.character_uniqid === characterId,
          ) as any;

          if (!character) {
            // Heuristic: if mention looks like OC (no parentheses and has a suffix -xxxx), treat as missing alt_prompt -> Seedream
            const looksOfficial = characterId.includes('('); // Official uniqids usually contain IP in parentheses, e.g., Rem_(Re:Zero)
            const looksOC =
              !looksOfficial && /-[a-zA-Z0-9]{3,}$/.test(characterId);
            if (looksOC) {
              hasConfirmedMissing = true;
            } else {
            }
            continue;
          }

          const hasAltPromptProperty = Object.prototype.hasOwnProperty.call(
            character,
            'alt_prompt',
          );

          if (!hasAltPromptProperty) {
            // Unknown -> do not force Seedream
            continue;
          }

          const hasValidAltPrompt = !!character.alt_prompt;

          if (!hasValidAltPrompt) {
            // CONFIRMED needs Seedream
            hasConfirmedMissing = true;
          }
        }

        const result = hasConfirmedMissing ? 'Seedream 4.5' : 'Art Pro';
        return result;
      } else {
        // No character data available yet -> default to Art Pro (don't switch until we have data)
        return 'Art Pro';
      }
    }

    // No characters mentioned, but has style preset -> Art Pro
    if (hasStylePreset && hasGeneralStyle(prompt)) {
      return 'Gemini';
    } else if (hasStylePreset) {
      return 'Art Pro';
    }

    // Check for single reference image with special syntax
    const hasSingleRef = Array.isArray(referenceImage)
      ? referenceImage.length === 1
      : !!referenceImage;

    if (hasSingleRef && !prompt.includes('<')) {
      // Single reference -> use Seedream 4.5 by default
      return 'Seedream 4.5';
    } else if (hasSingleRef && prompt.includes('<')) {
      // Single reference with special syntax -> still Seedream 4.5
      return 'Seedream 4.5';
    }
    // else if (referenceImage) { // has reference image
    //   url = `/api/generateImageNeta`;
    //   console.log("has reference image")
    // }
    else if (!prompt.includes('<')) {
      // Default case: no reference image, no special syntax -> Art Pro
      // url = `/api/v2/generateImageAnimagineXL3_1`;
      // return 'Animagine';
      return 'Art Pro';
      // console.log('no < in prompt');
    } else if ((prompt.match(/</g) || []).length === 1) {
      // only one < in prompt
      // console.log('only one < in prompt');
      // url = '/api/v2/generateCanvasImageGemini';
      return 'Gemini';
    } else {
      // more than one < in prompt
      // console.log('more than one < in prompt');
      // url = `/api/v2/generateCanvasImageGemini`;
      return 'Gemini';
    }
  }
  return model;
};

export const hasGeneralStyle = (prompt: string) => {
  const generalStyles = Object.keys(GENERAL_STYLES);
  return generalStyles.some(style => prompt.includes(style));
};
