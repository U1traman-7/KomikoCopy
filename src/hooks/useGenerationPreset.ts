import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

interface GenerationPreset {
  prompt?: string;
  model?: string;
  generation?: any;
  postData?: any;
}

const POSITIVE_PROMPT = ', best quality, 4k, masterpiece, highres, detailed, amazing quality, rating: general';

// 从localStorage获取generation数据
export const getCreateYoursData = (
  generationId: string,
): { generation: any; postData: any } | null => {
  const storageKey = `generation_${generationId}`;
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    const metaData = data.generation?.meta_data;
    if (metaData && typeof metaData === 'string') {
      try {
        data.generation.meta_data = JSON.parse(metaData);
      } catch (e) {
        // 如果解析失败，保持原值
      }
    }

    return {
      generation: data.generation,
      postData: data.postData,
    };
  } catch (error) {
    return null;
  } finally {
    try {
      localStorage.removeItem(storageKey);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
};

export const useGenerationPreset = () => {
  const router = useRouter();
  const [preset, setPreset] = useState<GenerationPreset | null>(null);

  // 清理prompt中的positive prompt
  const cleanPromptText = useCallback((prompt?: string) => {
    if (!prompt) return '';
    if (prompt.includes(POSITIVE_PROMPT)) {
      return prompt.replace(POSITIVE_PROMPT, '');
    }
    return prompt;
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    
    const generationId = router.query.generationId as string;
    if (!generationId) {
      setPreset(null);
      return;
    }

    const data = getCreateYoursData(generationId);
    if (!data) {
      setPreset(null);
      return;
    }

    const { generation, postData } = data;
    
    setPreset({
      prompt: cleanPromptText(generation?.prompt),
      model: generation?.model,
      generation,
      postData,
    });
  }, [router.isReady, router.query.generationId, cleanPromptText]);

  // 更新URL保留model参数
  const updateUrlWithModel = useCallback((model?: string) => {
    router.replace(
      { pathname: router.pathname, query: model ? { model } : {} },
      undefined,
      { shallow: true },
    );
  }, [router]);

  // 清除URL中的query参数
  const clearUrlQuery = useCallback(() => {
    router.replace(
      { pathname: router.pathname, query: {} },
      undefined,
      { shallow: true },
    );
  }, [router]);

  return {
    preset,
    updateUrlWithModel,
    clearUrlQuery,
    POSITIVE_PROMPT,
  };
};