interface Tool {
  route: string;
  titleKey: string;
}
export const POSITIVE_PROMPT =
  ', best quality, 4k, masterpiece, highres, detailed, amazing quality, rating: general';
export const toolsMappingData = {
  create: {
    route: '/create',
    title_key: 'ai_tools.comic_generation.create_on_canvas.title',
  },
  image_animation: {
    route: '/image-animation-generator',
    title_key: 'ai_tools.animation.animation_generator.title',
  },
  'text-to-video': {
    route: '/image-animation-generator',
    title_key: 'ai_tools.animation.text_to_video.title',
  },
  animation_generator: {
    route: '/image-animation-generator',
    title_key: 'ai_tools.animation.animation_generator.title',
  },
  'ai-comic-generator': {
    route: '/ai-comic-generator',
    title_key: 'ai_tools.comic_generation.ai_comic_generator.title',
  },
  'oc-maker': {
    route: '/oc-maker',
    title_key: 'ai_tools.comic_generation.create_character.title',
  },
  'talking-head': {
    route: '/ai-talking-head',
    title_key: 'ai_tools.animation.ai_talking_head.title',
  },
  'video-to-video': {
    route: '/video-to-video',
    title_key: 'ai_tools.animation.video_to_video.title',
  },
  'colorize-line-art': {
    route: '/line_art_colorization',
    title_key: 'ai_tools.illustration.line_art_colorization.title',
  },
  'sketch-simplifier': {
    route: '/sketch_simplification',
    title_key: 'ai_tools.illustration.sketch_simplification.title',
  },
  'background-removal': {
    route: '/background-removal',
    title_key: 'ai_tools.illustration.background_removal.title',
  },
  photo_to_anime: {
    route: '/playground',
    title_key: 'ai_tools.illustration.ai_playground.title',
  },
  'image-upscale': {
    route: '/image-upscaling',
    title_key: 'ai_tools.illustration.image_upscaling.title',
  },
  'video-upscale': {
    route: '/video_upscaling',
    title_key: 'ai_tools.animation.video_upscaling.title',
  },
  'video-interpolation': {
    route: '/video_interpolation',
    title_key: 'ai_tools.animation.video_interpolation.title',
  },
  inbetween: {
    route: '/inbetween',
    title_key: 'ai_tools.animation.inbetweening.title',
  },
  relighting: {
    route: '/image-relighting',
    title_key: 'ai_tools.illustration.image_relighting.title',
  },
  'layer-splitter': {
    route: '/layer_splitter',
    title_key: 'ai_tools.animation.layer_splitter.title',
  },
  'ai-anime-generator': {
    route: '/ai-anime-generator',
    title_key: 'ai_tools.illustration.ai_anime_generator.title',
  },
  'dance-video-generator': {
    route: '/dance-video-generator',
    title_key: 'ai_tools.animation.dance_video_generator.title',
  },
  'video-effect': {
    route: '/ai-video-effects',
    title_key: 'ai_tools.illustration.ai_video_effects.title',
  },
};
export const getToolPageRoute = (tool: string, metaData?: any): string => {
  const parsedMetaData =
    typeof metaData === 'string' ? JSON.parse(metaData) : metaData;

  if (parsedMetaData?.mode === 'dance') {
    return '/dance-video-generator';
  }
  if (
    parsedMetaData?.mode === 'effect' ||
    parsedMetaData?.mode === 'template'
  ) {
    // For template/effect mode, redirect to /effects/{slug}
    const styleId = parsedMetaData?.style_id;
    if (styleId) {
      // Determine suffix based on tool type
      const isVideoTool =
        tool === 'video-effect' || tool === 'dance-video-generator';
      const suffix = isVideoTool ? 'video' : 'image';
      const effectsSlug = `${styleId}-${suffix}`;
      return `/effects/${effectsSlug}`;
    }
    // Fallback to old route if no style_id
    return '/ai-video-effects';
  }

  // Legacy data: check if we have style_id even without explicit mode
  // This handles historical posts that used templates but don't have mode field
  if (
    parsedMetaData?.style_id &&
    (tool === 'video-effect' ||
      tool === 'dance-video-generator' ||
      tool === 'photo_to_anime')
  ) {
    // Determine suffix based on tool type
    const isVideoTool =
      tool === 'video-effect' || tool === 'dance-video-generator';
    const suffix = isVideoTool ? 'video' : 'image';
    const effectsSlug = `${parsedMetaData.style_id}-${suffix}`;
    return `/effects/${effectsSlug}`;
  }

  return toolsMappingData[tool]?.route || '/ai-anime-generator';
};

export const storeCreateYoursData = (
  generation: any,
  postData: any,
): string => {
  const createYoursData = {
    generation,
    postData,
    timestamp: Date.now(),
    tool: generation.tool,
  };

  try {
    const storageKey = `generation_${generation.id}`;
    localStorage.setItem(storageKey, JSON.stringify(createYoursData));
    return generation.id;
  } catch (error) {
    return '';
  }
};

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

export const buildCreateYoursParams = (
  generation: any,
  postData?: any,
): URLSearchParams => {
  const params = new URLSearchParams();
  const generationId = storeCreateYoursData(generation, postData);

  if (generationId) {
    params.append('generationId', generationId);
  }

  return params;
};

/**
 * Validates if generation data is complete enough to show "Create Yours" functionality
 */
export const hasCompleteGenerationData = (generation: any): boolean => {
  if (!generation || !generation.tool || generation.tool.trim() === '') {
    return false;
  }

  // For tools that use meta_data (like photo_to_anime), check if meta_data exists
  if (generation.meta_data) {
    try {
      const metadata =
        typeof generation.meta_data === 'string'
          ? JSON.parse(generation.meta_data)
          : generation.meta_data;

      // If meta_data has meaningful content, consider it complete
      if (
        metadata &&
        typeof metadata === 'object' &&
        Object.keys(metadata).length > 0
      ) {
        return true;
      }
    } catch (error) {
      // If meta_data parsing fails, fall back to prompt check
    }
  }

  return !!(generation.prompt && generation.prompt.trim() !== '');
};
