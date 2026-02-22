import {
  ImageToVideoModel,
  TextToVideoModel,
} from '../../../../api/tools/_zaps';

export type VideoResolution =
  | '360p'
  | '480p'
  | '540p'
  | '580p'
  | '520p'
  | '720p'
  | '1080p';

// Duration 支持的秒数
export type VideoDuration = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 15;
export type VideoAspectRatio =
  | '1:1'
  | '4:3'
  | '16:9'
  | '21:9'
  | '9:16'
  | '3:4'
  | '9:21';

export interface ModelConfig {
  // ============ 显示控制 ============
  showDuration: boolean;
  showAspectRatio: boolean;
  showResolution: boolean;

  // ============ Duration 配置 ============
  durationOptions?: VideoDuration[];
  defaultDuration?: VideoDuration;

  // ============ Aspect Ratio 配置 ============
  aspectRatioOptions?: VideoAspectRatio[];
  defaultAspectRatio?: VideoAspectRatio;

  // ============ Resolution 配置 ============
  resolutionOptions?: VideoResolution[];
  defaultResolution?: VideoResolution;

  // ============ 功能特性 ============
  supportsAudio?: boolean; // 生成的视频是否带音频
  supportsAudioInput?: boolean; // 是否支持上传音频输入
  supportsEndFrame?: boolean; // 是否支持结束帧（首尾帧）
  inputMode?: 'image-only' | 'text-only' | 'both'; // 输入模式：仅图片、仅文本、两者都支持
  supportsMultipleReferenceImages?: boolean; // 是否支持多参考图（2-7张）
  maxReferenceImages?: number; // 最大参考图数量
  requiresImageStitching?: boolean; // 是否需要拼接图片（true: Sora/Veo3/Wan需要拼接, false: Vidu原生支持多图）
  hasNSFW?: boolean; // 是否支持 NSFW 内容
  otherParams?: Record<string, any>;

  maxPromptLength?: number; // 最大提示词长度

  // ============ 模型关联 ============
  textToVideoFallback?: TextToVideoModel; // 无图片时使用的 text-to-video 模型（用于 ImageToVideo 配置）
}

/**
 * 根据 durationOptions 生成 UI 显示的时长标签
 * 例如: [4, 8, 12] -> "4-12"，[5] -> "5"
 */
export const getDurationRange = (
  config: ModelConfig,
): { min: number; max: number } | null => {
  const options = config.durationOptions;
  if (!options || options.length === 0) {
    // 如果没有 options，使用 defaultDuration
    if (config.defaultDuration) {
      return { min: config.defaultDuration, max: config.defaultDuration };
    }
    return null;
  }
  return {
    min: Math.min(...options),
    max: Math.max(...options),
  };
};

// 为图片模型和文本模型分别创建配置映射
const IMAGE_TO_VIDEO_CONFIGS: Partial<Record<ImageToVideoModel, ModelConfig>> =
  {
    // ============ Komiko Anime (VIDU -> Grok Imagine via KIE AI) ============
    [ImageToVideoModel.VIDU]: {
      showDuration: false, // Grok Imagine 不支持 duration
      showAspectRatio: false, // Grok Imagine 不支持 aspect ratio
      showResolution: false,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      inputMode: 'both',
      supportsAudio: true,
      textToVideoFallback: TextToVideoModel.VIDU,
    },

    // ============ VIDU Q2 Turbo (replaces Q1) ============
    [ImageToVideoModel.VIDU_Q2]: {
      showDuration: true,
      showAspectRatio: false,
      showResolution: true,
      durationOptions: [4, 5, 6, 7, 8],
      defaultDuration: 4,
      resolutionOptions: ['720p', '1080p'],
      defaultResolution: '720p',
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: false,
      textToVideoFallback: TextToVideoModel.VIDU_Q2,
      maxPromptLength: 3000,
    },

    // ============ VIDU Q2 Pro (New) ============
    [ImageToVideoModel.VIDU_Q2_PRO]: {
      showDuration: true,
      showAspectRatio: false,
      showResolution: true,
      durationOptions: [2, 3, 4, 5, 6, 7, 8],
      defaultDuration: 4,
      resolutionOptions: ['720p', '1080p'],
      defaultResolution: '720p',
      inputMode: 'image-only',
      supportsMultipleReferenceImages: false,
      maxPromptLength: 3000,
    },

    // ============ VIDU Q2 Reference-to-Video (replaces Q1 Multi) ============
    [ImageToVideoModel.VIDU_Q2_MULTI]: {
      showDuration: true,
      showAspectRatio: true,
      showResolution: true,
      durationOptions: [4, 5, 6, 7, 8], // Reference supports 1-8 seconds
      defaultDuration: 4,
      aspectRatioOptions: ['16:9', '9:16', '1:1'],
      defaultAspectRatio: '16:9',
      resolutionOptions: ['360p', '720p', '1080p'], // Reference supports full range
      defaultResolution: '720p',
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3, // Q2 最多3张参考图
      requiresImageStitching: false, // Vidu 原生支持多图，不需要拼接
      textToVideoFallback: TextToVideoModel.VIDU_Q2,
      maxPromptLength: 3000,
    },

    // ============ SORA_STABLE (Wavespeed) ============
    [ImageToVideoModel.SORA_STABLE]: {
      showDuration: true,
      showAspectRatio: false,
      showResolution: false,
      durationOptions: [4, 8, 12],
      defaultDuration: 4,
      aspectRatioOptions: ['16:9', '9:16'],
      defaultAspectRatio: '16:9',
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: true,
      textToVideoFallback: TextToVideoModel.SORA_STABLE,
    },

    // ============ SORA_PRO_STABLE (Wavespeed) ============
    [ImageToVideoModel.SORA_PRO_STABLE]: {
      showDuration: true,
      showAspectRatio: true,
      showResolution: true,
      durationOptions: [4, 8, 12],
      defaultDuration: 4,
      aspectRatioOptions: ['16:9', '9:16'],
      defaultAspectRatio: '16:9',
      resolutionOptions: ['720p', '1080p'],
      defaultResolution: '720p',
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: true,
      textToVideoFallback: TextToVideoModel.SORA_PRO_STABLE,
    },

    // ============ SORA (KIE.AI) ============
    [ImageToVideoModel.SORA]: {
      showDuration: true,
      showAspectRatio: true, // 显示 aspect ratio 选择器（多图拼接需要）
      showResolution: false,
      durationOptions: [10, 15],
      defaultDuration: 10,
      aspectRatioOptions: ['16:9', '9:16'],
      defaultAspectRatio: '16:9',
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: true, // Sora 需要拼接图片
      textToVideoFallback: TextToVideoModel.SORA,
    },

    // ============ SORA PRO (KIE.AI) ============
    [ImageToVideoModel.SORA_PRO]: {
      showDuration: true,
      showAspectRatio: true,
      showResolution: true,
      durationOptions: [10, 15],
      defaultDuration: 10,
      aspectRatioOptions: ['16:9', '9:16'],
      defaultAspectRatio: '16:9',
      resolutionOptions: ['720p', '1080p'],
      defaultResolution: '720p',
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: true, // Sora Pro 需要拼接图片
      textToVideoFallback: TextToVideoModel.SORA_PRO,
    },

    // ============ Minimax (Hailuo) ============
    [ImageToVideoModel.MINIMAX]: {
      showDuration: false,
      showAspectRatio: false,
      showResolution: false,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      supportsEndFrame: true,
      inputMode: 'both',
      hasNSFW: true,
      textToVideoFallback: TextToVideoModel.MINIMAX,
    },

    // ============ Seedance ============
    [ImageToVideoModel.SEEDANCE]: {
      showDuration: true,
      showAspectRatio: true,
      showResolution: true,
      durationOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12],
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16', '3:4', '4:3', '21:9'],
      defaultAspectRatio: '16:9',
      resolutionOptions: ['480p', '720p'],
      defaultResolution: '480p',
      supportsEndFrame: true,
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      otherParams: {
        supportCameraFixed: true,
      },
      textToVideoFallback: TextToVideoModel.SEEDANCE,
    },

    // ============ Kling V2 ============
    [ImageToVideoModel.KLING_V2]: {
      showDuration: true,
      showAspectRatio: true,
      showResolution: false,
      durationOptions: [5, 10],
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'both',
      textToVideoFallback: TextToVideoModel.KLING_V2,
    },

    // ============ VEO ============
    [ImageToVideoModel.VEO]: {
      showDuration: false, // VEO3 image-to-video 固定 8 秒
      showAspectRatio: true,
      showResolution: false,
      durationOptions: [8], // VEO3 只支持 8 秒
      defaultDuration: 8,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      supportsAudio: true,
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      requiresImageStitching: true, // VEO3 需要拼接图片
      textToVideoFallback: TextToVideoModel.VEO,
    },

    // ============ WAN 2.6 ============
    [ImageToVideoModel.WAN]: {
      showDuration: true,
      showAspectRatio: false,
      showResolution: true,
      durationOptions: [5, 10, 15], // Wan 2.6 supports 5, 10, 15 seconds
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      resolutionOptions: ['720p', '1080p'], // Wan 2.6 only supports 720p and 1080p
      defaultResolution: '720p',
      supportsAudio: true,
      supportsAudioInput: true, // WAN 支持音频输入
      inputMode: 'both',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
      otherParams: {
        supportMulitShots: true,
      },
      textToVideoFallback: TextToVideoModel.WAN,
    },

    // ============ WAN PRO ============
    [ImageToVideoModel.WAN_PRO]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
      supportsMultipleReferenceImages: true,
      maxReferenceImages: 3,
    },

    // ============ Ray ============
    [ImageToVideoModel.RAY]: {
      showDuration: false, // Ray 2 image-to-video 固定成本，不支持可变 duration
      showAspectRatio: true,
      showResolution: false,
      durationOptions: [5], // 固定 5 秒
      defaultDuration: 5,
      aspectRatioOptions: ['16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
      defaultAspectRatio: '16:9',
      supportsEndFrame: true,
      inputMode: 'both',
      textToVideoFallback: TextToVideoModel.RAY,
    },

    // ============ Anisora ============
    [ImageToVideoModel.ANISORA]: {
      showDuration: false,
      showAspectRatio: false,
      showResolution: false,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },

    // ============ FramePack ============
    [ImageToVideoModel.FRAME_PACK]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
      hasNSFW: true,
    },

    // ============ 其他模型（暂时使用默认配置）============
    [ImageToVideoModel.KLING]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.PIXVERSE]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.RAY_FLASH_V2]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.MAGI_1]: {
      showDuration: false,
      showAspectRatio: true,
      showResolution: false,
      defaultDuration: 5,
      aspectRatioOptions: ['1:1', '16:9', '9:16'],
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.HEDRA]: {
      showDuration: false,
      showAspectRatio: false,
      showResolution: false,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.MJ_VIDEO]: {
      showDuration: false,
      showAspectRatio: false,
      showResolution: false,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      inputMode: 'image-only',
    },
    [ImageToVideoModel.WAN_22_TURBO]: {
      showDuration: false,
      showAspectRatio: false,
      showResolution: true,
      defaultDuration: 5,
      defaultAspectRatio: '16:9',
      resolutionOptions: ['480p', '580p', '720p'],
      defaultResolution: '720p',
      inputMode: 'both',
      textToVideoFallback: TextToVideoModel.WAN_22_TURBO,
      supportsEndFrame: true,
      supportsMultipleReferenceImages: false,
      hasNSFW: true,
    },
  };

const TEXT_TO_VIDEO_CONFIGS: Partial<Record<TextToVideoModel, ModelConfig>> = {
  // ============ Komiko Anime (VIDU -> Grok Imagine via KIE AI) ============
  [TextToVideoModel.VIDU]: {
    showDuration: false, // Grok Imagine 不支持 duration
    showAspectRatio: false, // Grok Imagine 不支持 aspect ratio
    showResolution: false,
    defaultDuration: 5,
    defaultAspectRatio: '16:9',
    inputMode: 'both',
  },

  // ============ VIDU Q2 Text-to-Video ============
  [TextToVideoModel.VIDU_Q2]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: true,
    durationOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultDuration: 4,
    aspectRatioOptions: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    resolutionOptions: ['360p', '520p', '720p', '1080p'],
    defaultResolution: '720p',
    inputMode: 'both',
    supportsMultipleReferenceImages: true,
    maxReferenceImages: 3,
    maxPromptLength: 3000,
  },

  // ============ SORA_STABLE (Wavespeed) ============
  [TextToVideoModel.SORA_STABLE]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: false,
    durationOptions: [4, 8, 12],
    defaultDuration: 4,
    aspectRatioOptions: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
    supportsAudio: true,
    inputMode: 'both',
  },

  // ============ SORA_PRO_STABLE (Wavespeed) ============
  [TextToVideoModel.SORA_PRO_STABLE]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: true,
    durationOptions: [4, 8, 12],
    defaultDuration: 4,
    aspectRatioOptions: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
    resolutionOptions: ['720p', '1080p'],
    defaultResolution: '720p',
    supportsAudio: true,
    inputMode: 'both',
  },

  // ============ SORA (KIE.AI) ============
  [TextToVideoModel.SORA]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: false,
    durationOptions: [10, 15], // KIE.AI 只支持 10s 和 15s
    defaultDuration: 10,
    aspectRatioOptions: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
    supportsAudio: true,
    inputMode: 'both',
  },

  // ============ SORA PRO (KIE.AI) ============
  [TextToVideoModel.SORA_PRO]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: true,
    durationOptions: [10, 15], // KIE.AI 只支持 10s 和 15s
    defaultDuration: 10,
    aspectRatioOptions: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
    resolutionOptions: ['720p', '1080p'],
    defaultResolution: '720p',
    supportsAudio: true,
    inputMode: 'both',
  },

  // ============ Minimax (Hailuo) ============
  [TextToVideoModel.MINIMAX]: {
    showDuration: false,
    showAspectRatio: false,
    showResolution: false,
    defaultDuration: 5,
    defaultAspectRatio: '16:9',
    inputMode: 'both',
  },

  // ============ Seedance ============
  [TextToVideoModel.SEEDANCE]: {
    showDuration: true,
    showAspectRatio: true,
    defaultDuration: 5,
    showResolution: true,
    durationOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    aspectRatioOptions: ['1:1', '16:9', '9:16', '3:4', '4:3', '21:9'],
    defaultAspectRatio: '16:9',
    resolutionOptions: ['480p', '720p'],
    defaultResolution: '480p',
    inputMode: 'both',
    supportsAudio: true,
    otherParams: {
      supportCameraFixed: true,
    },
  },

  // ============ Kling V2 ============
  [TextToVideoModel.KLING_V2]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: false,
    durationOptions: [5, 10],
    defaultDuration: 5,
    aspectRatioOptions: ['1:1', '16:9', '9:16'],
    defaultAspectRatio: '16:9',
    inputMode: 'both',
  },

  // ============ VEO ============
  [TextToVideoModel.VEO]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: false,
    durationOptions: [4, 6, 8],
    defaultDuration: 8,
    aspectRatioOptions: ['1:1', '16:9', '9:16'],
    defaultAspectRatio: '16:9',
    supportsAudio: true,
    inputMode: 'both',
  },

  // ============ WAN 2.6 ============
  [TextToVideoModel.WAN]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: true,
    durationOptions: [5, 10, 15], // Wan 2.6 supports 5, 10, 15 seconds
    defaultDuration: 5,
    aspectRatioOptions: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    defaultAspectRatio: '16:9',
    resolutionOptions: ['720p', '1080p'], // Wan 2.6 only supports 720p and 1080p
    defaultResolution: '720p',
    supportsAudio: true,
    supportsAudioInput: true, // WAN 支持音频输入
    inputMode: 'both',
    otherParams: {
      supportMulitShots: true,
    },
  },

  // ============ Ray ============
  [TextToVideoModel.RAY]: {
    showDuration: true,
    showAspectRatio: true,
    showResolution: false,
    durationOptions: [5, 9],
    defaultDuration: 5,
    aspectRatioOptions: ['1:1', '16:9', '9:16'],
    defaultAspectRatio: '16:9',
    inputMode: 'both',
  },

  // ============ WAN 2.2 Turbo Text to Video ============
  [TextToVideoModel.WAN_22_TURBO]: {
    showDuration: false,
    showAspectRatio: true,
    showResolution: true,
    defaultResolution: '720p',
    resolutionOptions: ['480p', '580p', '720p'],
    defaultAspectRatio: '16:9',
    inputMode: 'both',
    aspectRatioOptions: ['1:1', '16:9', '9:16'],
    hasNSFW: true,
  },
};

// Default configuration fallback
const DEFAULT_CONFIG: ModelConfig = {
  showDuration: true,
  showAspectRatio: true,
  showResolution: false,
  durationOptions: [5, 10],
  defaultDuration: 5,
  aspectRatioOptions: ['16:9', '9:16'],
  defaultAspectRatio: '16:9',
  inputMode: 'both',
};

// Helper functions
export const getModelConfig = (
  model: ImageToVideoModel | TextToVideoModel,
): ModelConfig => {
  // Try to find in ImageToVideoModel configs first
  const imageConfig = IMAGE_TO_VIDEO_CONFIGS[model as ImageToVideoModel];
  if (imageConfig) return imageConfig;

  // Try to find in TextToVideoModel configs
  const textConfig = TEXT_TO_VIDEO_CONFIGS[model as TextToVideoModel];
  if (textConfig) return textConfig;

  // Return default config if not found
  return DEFAULT_CONFIG;
};

// Get text-to-video specific config (checks TEXT_TO_VIDEO_CONFIGS first)
export const getTextToVideoConfig = (model: TextToVideoModel): ModelConfig => {
  const textConfig = TEXT_TO_VIDEO_CONFIGS[model];
  if (textConfig) return textConfig;

  // Return default config if not found
  return DEFAULT_CONFIG;
};
