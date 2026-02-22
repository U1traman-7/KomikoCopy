/**
 * 视频管线处理模块 (Video Pipeline Processor)
 *
 * 根据 video_pipeline_type 字段对视频模板走不同的生成管线:
 * - type2: 用户图片 + prompt1 -> Gemini 生成新图片 -> 新图片 + prompt2 -> 用户选定模型 i2v
 * - type3: 并行(图片+prompt1->Gemini生新图, 图片+prompt2->Gemini生文本prompt3) -> 新图+prompt3 -> 用户选定模型 i2v
 * - null/无: 返回 null，调用方走现有流程
 *
 * 设计为可扩展的 handler 字典路由，未来新增 type4/type5 只需添加对应处理函数。
 */

import {
  fetchGeminiImageEdit,
  uploadImageToSupabase,
} from '../../_utils/index.js';
import { generateWithGemini } from '../../_utils/gemini.js';
import { getVideoPipelinePrompts } from '../../tools/_effectPrompts.js';
import { translateTemplatePrompt, extractTemplateInputs } from '../../_utils/videoHelper.js';
export { getVideoPipelineExtraCost } from '../../tools/_zaps.js';

// Pipeline 处理结果
export interface PipelineResult {
  imageUrl: string;
  prompt: string;
}

// Pipeline 处理参数 (从 model.parseParams 传入的 params)
interface PipelineParams {
  image?: string;
  images?: string[];
  prompt?: string;
  meta_data?: {
    video_pipeline_type?: string;
    style_id?: string;
    no_translate?: boolean;
    [key: string]: any;
  };
  no_translate?: boolean;
  [key: string]: any;
}

/**
 * 从 Gemini 图片生成 response 中提取 base64 data URL
 */
const extractImageFromGeminiResponse = (response: any): string | null => {
  const candidates = response?.candidates;
  if (!candidates || candidates.length === 0) return null;

  const finishReason = candidates[0].finishReason as string;
  if (finishReason === 'IMAGE_SAFETY' || finishReason === 'PROHIBITED_CONTENT') {
    console.warn('[VideoPipeline] Gemini image generation blocked by safety filter');
    return null;
  }

  const parts = candidates[0].content?.parts;
  if (!parts) return null;

  const imagePart = parts.find((part: any) => part.inlineData);
  if (!imagePart?.inlineData) return null;

  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

// STANDARD_META_FIELDS 和 extractTemplateInputs 从 videoHelper.ts 统一导入

/**
 * 用 Gemini 编辑图片并上传到 Supabase Storage
 * processType2 和 processType3 共用的辅助函数
 */
async function geminiEditAndUpload(
  prompt: string,
  imageUrl: string,
  userId: string,
): Promise<string> {
  const geminiResponse = await fetchGeminiImageEdit(prompt, imageUrl);
  const newImageDataUrl = extractImageFromGeminiResponse(geminiResponse);

  if (!newImageDataUrl) {
    throw new Error('[VideoPipeline] Gemini image generation failed');
  }

  const uploadedUrl = await uploadImageToSupabase(
    newImageDataUrl,
    userId,
    undefined,
    true, // noWatermark - pipeline 中间结果不加水印
  );

  if (!uploadedUrl) {
    throw new Error('[VideoPipeline] Failed to upload generated image');
  }

  return uploadedUrl;
}

/**
 * type2 处理:
 * 1. 用户图片 + prompt1 -> fetchGeminiImageEdit 生成新图片
 * 2. 上传新图片到 Supabase Storage
 * 3. 返回 { imageUrl: 新图片URL, prompt: prompt2 }
 */
const processType2 = async (
  params: PipelineParams,
  prompts: { prompt1?: string; prompt2?: string },
): Promise<PipelineResult> => {
  const { prompt1, prompt2 } = prompts;
  const userImage = params.image || params.images?.[0];

  if (!userImage) {
    throw new Error('[VideoPipeline] type2: user image is required');
  }
  if (!prompt1) {
    throw new Error('[VideoPipeline] type2: prompt1 is required');
  }
  if (!prompt2) {
    throw new Error('[VideoPipeline] type2: prompt2 is required');
  }

  console.log('[VideoPipeline] type2: generating new image with Gemini...');

  const userId = params.meta_data?.user_id || 'pipeline';
  const uploadedUrl = await geminiEditAndUpload(prompt1, userImage, userId);

  console.log('[VideoPipeline] type2: new image uploaded:', uploadedUrl);

  // Step 3: 翻译 prompt2
  let finalPrompt = prompt2;
  finalPrompt = await translateTemplatePrompt(finalPrompt, params);

  return {
    imageUrl: uploadedUrl,
    prompt: finalPrompt,
  };
};

/**
 * type3 处理:
 * 1. 并行: (图片+prompt1->Gemini生新图) + (prompt2->翻译->Gemini增强生成prompt3)
 * 2. 返回 { imageUrl: 新图片URL, prompt: Gemini生成的prompt3 }
 *
 * prompt2 的处理复制 PromptMiddlewareProcessor.processPrompt 的核心流程:
 * 翻译 -> generateWithGemini 增强
 */
const processType3 = async (
  params: PipelineParams,
  prompts: { prompt1?: string; prompt2?: string },
): Promise<PipelineResult> => {
  const { prompt1, prompt2 } = prompts;
  const userImage = params.image || params.images?.[0];

  if (!userImage) {
    throw new Error('[VideoPipeline] type3: user image is required');
  }
  if (!prompt1) {
    throw new Error('[VideoPipeline] type3: prompt1 is required');
  }
  if (!prompt2) {
    throw new Error('[VideoPipeline] type3: prompt2 is required');
  }

  console.log(
    '[VideoPipeline] type3: parallel image generation + prompt processing...',
  );

  // prompt2 先翻译，再由 Gemini 增强（等效于 processPrompt 流程）
  const translatedPrompt2 = await translateTemplatePrompt(prompt2, params);

  // 并行执行: Gemini 生成+上传新图片 + 翻译后的 prompt2 经 Gemini 增强生成 prompt3
  const userId = params.meta_data?.user_id || 'pipeline';
  const [uploadedUrl, generatedPrompt] = await Promise.all([
    geminiEditAndUpload(prompt1, userImage, userId),
    generateWithGemini(translatedPrompt2, userImage),
  ]);

  console.log('[VideoPipeline] type3: new image uploaded:', uploadedUrl);
  console.log(
    '[VideoPipeline] type3: generated prompt:',
    generatedPrompt.substring(0, 100),
  );

  return {
    imageUrl: uploadedUrl,
    prompt: generatedPrompt,
  };
};

/**
 * Pipeline handler 字典 - 可扩展
 * 未来新增 type4/type5 等只需在此添加对应处理函数
 */
const pipelineHandlers: Record<
  string,
  (
    params: PipelineParams,
    prompts: { prompt1?: string; prompt2?: string },
  ) => Promise<PipelineResult>
> = {
  type2: processType2,
  type3: processType3,
  // 未来扩展: type4: processType4, ...
};

/**
 * 统一入口函数: 检查是否需要 pipeline 处理
 *
 * @param params - 从前端传入的完整参数 (包含 meta_data.video_pipeline_type)
 * @returns PipelineResult | null  (null 表示无需 pipeline 处理，走现有流程)
 */
export async function processVideoPipeline(
  params: PipelineParams,
): Promise<PipelineResult | null> {
  const pipelineType = params.meta_data?.video_pipeline_type;

  // 无 pipeline type -> 返回 null，调用方走原有流程
  if (!pipelineType) {
    return null;
  }

  const handler = pipelineHandlers[pipelineType];
  if (!handler) {
    console.warn(
      '[VideoPipeline] Unknown pipeline type:',
      pipelineType,
      '- falling back to default flow',
    );
    return null;
  }

  const styleId = params.meta_data?.style_id;
  if (!styleId) {
    console.error('[VideoPipeline] style_id is required for pipeline processing');
    return null;
  }

  // 提取模板变量用于 prompt 占位符替换
  const templateInputs = extractTemplateInputs(params.meta_data || {});

  // 获取 pipeline 专用 prompt (prompt1 / prompt2)
  const prompts = await getVideoPipelinePrompts(
    styleId,
    pipelineType,
    templateInputs,
  );

  if (!prompts.prompt1 && !prompts.prompt2) {
    console.error(
      '[VideoPipeline] No pipeline prompts found for:',
      styleId,
      pipelineType,
    );
    return null;
  }

  console.log('[VideoPipeline] Processing pipeline:', pipelineType, 'for style:', styleId);

  return handler(params, prompts);
}

