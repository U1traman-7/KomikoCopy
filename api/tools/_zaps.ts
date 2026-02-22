// ========================================
// Vidu Q2 Pricing Types and Constants
// ========================================
export type ViduQ2Resolution = '360p' | '520p' | '720p' | '1080p';
export type ViduQ2Variant = 'turbo' | 'pro' | 'reference' | 'text';

const dollarToZapsVidu = (dollar: number) => Math.round(dollar * 2000);

// Vidu Q2 Turbo Image-to-Video
// 720p: $0/base + $0.05/sec, 1080p: $0.20/base + $0.05/sec
export const VIDU_Q2_TURBO_720P_BASE = 0;
export const VIDU_Q2_TURBO_720P_PER_SEC = dollarToZapsVidu(0.05); // 100 Zaps/sec
export const VIDU_Q2_TURBO_1080P_BASE = dollarToZapsVidu(0.2); // 400 Zaps
export const VIDU_Q2_TURBO_1080P_PER_SEC = dollarToZapsVidu(0.05); // 100 Zaps/sec

// Vidu Q2 Pro Image-to-Video
// 720p: $0.10/base + $0.05/sec, 1080p: $0.30/base + $0.10/sec
export const VIDU_Q2_PRO_720P_BASE = dollarToZapsVidu(0.1); // 200 Zaps
export const VIDU_Q2_PRO_720P_PER_SEC = dollarToZapsVidu(0.05); // 100 Zaps/sec
export const VIDU_Q2_PRO_1080P_BASE = dollarToZapsVidu(0.3); // 600 Zaps
export const VIDU_Q2_PRO_1080P_PER_SEC = dollarToZapsVidu(0.1); // 200 Zaps/sec

// Vidu Q2 Reference-to-Video
// 360p: $0.10, 520p: $0.20, 720p: $0.30 flat, 1080p: $0.20/base + $0.10/sec
export const VIDU_Q2_REF_360P = dollarToZapsVidu(0.1); // 200 Zaps
export const VIDU_Q2_REF_520P = dollarToZapsVidu(0.2); // 400 Zaps
export const VIDU_Q2_REF_720P = dollarToZapsVidu(0.3); // 600 Zaps
export const VIDU_Q2_REF_1080P_BASE = dollarToZapsVidu(0.2); // 400 Zaps
export const VIDU_Q2_REF_1080P_PER_SEC = dollarToZapsVidu(0.1); // 200 Zaps/sec

// Vidu Q2 Text-to-Video (same as Reference-to-Video)
export const VIDU_Q2_TEXT_360P = VIDU_Q2_REF_360P;
export const VIDU_Q2_TEXT_520P = VIDU_Q2_REF_520P;
export const VIDU_Q2_TEXT_720P = VIDU_Q2_REF_720P;
export const VIDU_Q2_TEXT_1080P_BASE = VIDU_Q2_REF_1080P_BASE;
export const VIDU_Q2_TEXT_1080P_PER_SEC = VIDU_Q2_REF_1080P_PER_SEC;

/**
 * Calculate Vidu Q2 cost based on variant, duration, and resolution
 */
export const calculateViduQ2Cost = (
  variant: ViduQ2Variant,
  duration: number = 4,
  resolution: ViduQ2Resolution = '720p',
): number => {
  const durationSec = Math.max(2, Math.min(8, duration));

  if (variant === 'turbo') {
    if (resolution === '1080p') {
      return (
        VIDU_Q2_TURBO_1080P_BASE + VIDU_Q2_TURBO_1080P_PER_SEC * durationSec
      );
    }
    return VIDU_Q2_TURBO_720P_BASE + VIDU_Q2_TURBO_720P_PER_SEC * durationSec;
  }

  if (variant === 'pro') {
    if (resolution === '1080p') {
      return VIDU_Q2_PRO_1080P_BASE + VIDU_Q2_PRO_1080P_PER_SEC * durationSec;
    }
    return VIDU_Q2_PRO_720P_BASE + VIDU_Q2_PRO_720P_PER_SEC * durationSec;
  }

  if (variant === 'reference' || variant === 'text') {
    if (resolution === '360p') {
      return VIDU_Q2_REF_360P;
    }
    if (resolution === '520p') {
      return VIDU_Q2_REF_520P;
    }
    if (resolution === '720p') {
      return VIDU_Q2_REF_720P;
    }
    if (resolution === '1080p') {
      return VIDU_Q2_REF_1080P_BASE + VIDU_Q2_REF_1080P_PER_SEC * durationSec;
    }
    return VIDU_Q2_REF_720P;
  }

  return VIDU_Q2_TURBO_720P_PER_SEC * durationSec;
};

export enum ImageToVideoModel {
  VEO,
  MINIMAX,
  RAY,
  KLING,
  PIXVERSE,
  RAY_FLASH_V2,
  WAN,
  WAN_PRO,
  KLING_V2,
  FRAME_PACK,
  VIDU,
  MAGI_1,
  ANISORA,
  HEDRA,
  VIDU_Q2, // Vidu Q2 Turbo
  MJ_VIDEO,
  SEEDANCE,
  SORA,
  SORA_PRO,
  VIDU_Q2_MULTI,
  SORA_STABLE,
  SORA_PRO_STABLE,
  VIDU_Q2_PRO,
  WAN_22_TURBO,
}

export enum TextToVideoModel {
  MINIMAX = 1,
  RAY,
  KLING_V2,
  WAN,
  VIDU,
  SEEDANCE,
  VIDU_Q2,
  VEO,
  SORA,
  SORA_PRO,
  SORA_STABLE,
  SORA_PRO_STABLE,
  WAN_22_TURBO,
}

export enum TalkingHeadQuality {
  STANDARD,
  HIGH,
  HEDRA,
}

export enum TextToVideoStyle {
  MODERN_ANIME,
  REALISTIC,
  STUDIO_GHIBLI,
  RETRO_ANIME,
  MYSTICAL_ANIME,
  HORROR_ANIME,
  DISNEY,
  CARTOON,
  KAWAII,
  MANGA,
  CINEMATIC,
  INK_WASH,
  CYBERPUNK,
  CLAYMATION,
  HAND_DRAWN,
}

export const VIDEO_STYLE_TO_PROMPT = {
  [TextToVideoStyle.MODERN_ANIME]:
    'Generate in the style of 2d modern anime made in Japan with clean line art and vibrant colors.',
  [TextToVideoStyle.REALISTIC]: '',
  [TextToVideoStyle.STUDIO_GHIBLI]: 'Generate in Studio Ghibli 2d anime style.',
  [TextToVideoStyle.RETRO_ANIME]:
    'Generate in the style of retro 1990s anime made in 90s Japan with bold line art, slightly muted yet saturated colors, hand-painted cel shading, and film grain texture.',
  [TextToVideoStyle.MYSTICAL_ANIME]:
    'Generate high-quality 2D Japanese anime film with high details. Render the scene in a mystical visual style with ethereal lighting, subtle glowing particles, and mystical and ethereal atmosphere, and slight blue and purple-ish theme.',
  [TextToVideoStyle.HORROR_ANIME]:
    'Generate the 2d anime in horror thriller style with black and red coloring.',
  [TextToVideoStyle.DISNEY]: 'Generate in Disney Pixar 3d animation style.',
  [TextToVideoStyle.CARTOON]:
    'Generate in the style of western 2d cartoon with bold outlines, simplified yet expressive character designs, vibrant flat colors, and exaggerated poses.',
  [TextToVideoStyle.KAWAII]:
    'Use the kawaii hand-drawn anime style with pastel colors and kawaii elements and hand-drawn elements and sketchy lines.',
  [TextToVideoStyle.MANGA]:
    'Generate the animation in Japanese black and white manga style with black and white manga lines, manga panels, speech bubbles, and gliches.',
  [TextToVideoStyle.CINEMATIC]:
    'Generate in the style of a cinematic movie with dramatic lighting and a sense of depth and atmosphere. Use dynamic camera angles, rich colors, and a storytelling tone.',
  [TextToVideoStyle.INK_WASH]:
    'Generate in the style of black and white Chinese ink wash animation.',
  [TextToVideoStyle.CYBERPUNK]:
    'Generate in cyberpunk style with neon lights and cyberpunk visual.',
  [TextToVideoStyle.CLAYMATION]:
    'Generate in the style of claymation (clay animation), with handcrafted clay textures, stop-motion aesthetics, and expressive, tactile character designs that look sculpted from real clay.',
  [TextToVideoStyle.HAND_DRAWN]:
    'Generate in the style of simple hand-drawn line animation. Use clean black lines, simple background, simple flat coloring, with minimal details and no shading. The characters and objects should be drawn simple yet expressive.',
};

export const discount = (count: number) => Math.ceil(count * 0.8);

export const dollarToZaps = (dollar: number) => Math.round(dollar * 2000);
// 标准汇率：每次生图=$0.0051=10 Zaps
// $0.01 = 20Zaps
// 线稿上色 消费2个积分
export const LINE_ART_COLORIZE = 20;
export const LINE_ART_COLORIZE_TRANSPARENT = 25;
export const LINE_ART_COLORIZE_GPT4O_TRANSPARENT = 385;
export const LINE_ART_COLORIZE_GEMINI_PRO_1K_TRANSPARENT = 305;
export const FRAME_INTERPOLATION = discount(92);

export const VIDEO_UPSCALE = discount(600);

// 每秒消费积分
export const VIDEO_UPSCALE_UNIT = discount(130);

export const VIDEO_INTERPOLATION = discount(100);

export const IN_BETWEEN = discount(124);

export const BACKGROUND_REMOVAL = 10;
export const IMAGE_UPSCALE = 10;
export const IMAGE_TO_VIDEO = 0;
export const IMAGE_TO_ANIMATION_VEO = discount(1600);
export const IMAGE_TO_ANIMATION_MINIMAX = discount(540);
export const IMAGE_TO_ANIMATION_RAY = discount(1000);
export const IMAGE_TO_ANIMATION_KLING_5 = discount(1000);
export const IMAGE_TO_ANIMATION_KLING_10 = discount(2000);
export const IMAGE_TO_ANIMATION_KLING_V2_5 = discount(2800);
export const IMAGE_TO_ANIMATION_KLING_V2_10 = discount(5600);
export const IMAGE_TO_ANIMATION_RAY_FLASH_V2_5 = discount(600);
export const IMAGE_TO_ANIMATION_RAY_FLASH_V2_9 = discount(1080);
export const IMAGE_TO_ANIMATION_WAN_720P = discount(200);
export const IMAGE_TO_ANIMATION_WAN_1080P = discount(300);
export const IMAGE_TO_ANIMATION_WAN_PRO = discount(1600);
// Wan 2.2 Turbo: $0.10/720p, $0.075/580p, $0.05/480p (per video, not per second)
export const IMAGE_TO_ANIMATION_WAN_22_720P = dollarToZaps(0.1); // 200 Zaps
export const IMAGE_TO_ANIMATION_WAN_22_580P = dollarToZaps(0.075); // 150 Zaps
export const IMAGE_TO_ANIMATION_WAN_22_480P = dollarToZaps(0.05); // 100 Zaps
export const PHOTO_TO_ANIME = 20;
export const IMAGE_TO_ANIMATION_VEO_UNIT = discount(300);
export const IMAGE_TO_ANIMATION_FRAME_PACK = discount(400);
export const IMAGE_TO_ANIMATION_VIDU = discount(400);
export const IMAGE_TO_ANIMATION_MAGI_1 = discount(640);
export const IMAGE_TO_ANIMATION_ANISORA = discount(400);
export const IMAGE_TO_ANIMATION_VIDU_Q1 = discount(800);

export const IMAGE_TO_ANIMATION_MJ_VIDEO = discount(1500);
// Seedance 1.5: $2.4/M tokens (with audio), $1.2/M (without)
export const SEEDANCE_TOKEN_UNIT = dollarToZaps(2.4) / 100_0000;

// Old wavespeed Sora pricing - now used for SORA_STABLE
export const SORA_STABLE_UNIT = discount(200);
export const SORA_PRO_STABLE_UNIT_720P = discount(600); // 720p
export const SORA_PRO_STABLE_UNIT_1080P = discount(1000); // 1080p

// KIE.AI Sora pricing
export const SORA_KIE_UNIT = 30; // $0.015/sec = 30 Zaps/sec
export const SORA_PRO_KIE_STANDARD_10S = 150; // $0.075/sec for ≤10s tier (720p) = 1500 Zaps total for 10s
export const SORA_PRO_KIE_STANDARD_15S = 180; // $0.09/sec for >10s tier (720p) = 2700 Zaps total for 15s
export const SORA_PRO_KIE_HIGH_10S = 330; // $0.165/sec for ≤10s tier (1080p) = 3300 Zaps total for 10s
export const SORA_PRO_KIE_HIGH_15S = 420; // $0.21/sec for >10s tier (1080p) = 6300 Zaps total for 15s

export const VIDEO_TO_VIDEO_STYLE_TRANSFER = discount(2000);

/**
 * Calculate WAN 2.2 Turbo cost based on resolution
 * Wan 2.2 has flat pricing per video (not per second)
 */
const calculateWan22TurboCost = (resolution?: Resolution): number => {
  if (resolution === '720p') {
    return IMAGE_TO_ANIMATION_WAN_22_720P;
  }
  if (resolution === '580p') {
    return IMAGE_TO_ANIMATION_WAN_22_580P;
  }
  // Default to 480p
  return IMAGE_TO_ANIMATION_WAN_22_480P;
};

export const calculateImageToAnimationCost = (
  model: ImageToVideoModel,
  duration?:
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '15',
  resolution?: Resolution,
  aspectRatio?: AspectRatio,
) => {
  if (model === ImageToVideoModel.MINIMAX) {
    return IMAGE_TO_ANIMATION_MINIMAX;
  }
  if (model === ImageToVideoModel.RAY) {
    return IMAGE_TO_ANIMATION_RAY;
  }
  if (model === ImageToVideoModel.KLING) {
    return duration === '5'
      ? IMAGE_TO_ANIMATION_KLING_5
      : IMAGE_TO_ANIMATION_KLING_10;
  }
  if (model === ImageToVideoModel.RAY_FLASH_V2) {
    return duration === '5'
      ? IMAGE_TO_ANIMATION_RAY_FLASH_V2_5
      : IMAGE_TO_ANIMATION_RAY_FLASH_V2_9;
  }
  if (model === ImageToVideoModel.WAN) {
    if (resolution === '1080p') {
      return IMAGE_TO_ANIMATION_WAN_1080P * (+(duration as string) || 5);
    }
    return IMAGE_TO_ANIMATION_WAN_720P * (+(duration as string) || 5);
  }
  if (model === ImageToVideoModel.WAN_PRO) {
    return IMAGE_TO_ANIMATION_WAN_PRO;
  }
  if (model === ImageToVideoModel.WAN_22_TURBO) {
    return calculateWan22TurboCost(resolution);
  }
  if (model === ImageToVideoModel.PIXVERSE) {
    const durationSeconds = +(duration || '5');
    if (resolution === '360p' || resolution === '540p') {
      return discount(dollarToZaps(0.15 / 5) * durationSeconds);
    }
    if (resolution === '720p') {
      return discount(dollarToZaps(0.2 / 5) * durationSeconds);
    }
    if (resolution === '1080p') {
      return discount(dollarToZaps(0.4 / 5) * durationSeconds);
    }
    return discount(dollarToZaps(0.15 / 5) * durationSeconds);
  }
  if (model === ImageToVideoModel.KLING_V2) {
    return duration === '5'
      ? IMAGE_TO_ANIMATION_KLING_V2_5
      : IMAGE_TO_ANIMATION_KLING_V2_10;
  }
  if (model === ImageToVideoModel.FRAME_PACK) {
    return IMAGE_TO_ANIMATION_FRAME_PACK;
  }
  // if (model === ImageToVideoModel.VIDU) {
  //   return IMAGE_TO_ANIMATION_VIDU;
  // }
  if (model === ImageToVideoModel.ANISORA) {
    return IMAGE_TO_ANIMATION_ANISORA;
  }
  if (model === ImageToVideoModel.MAGI_1) {
    const durationSeconds = +(duration || '5');
    const baseCost = dollarToZaps(0.32);
    const perSecondCost = dollarToZaps(0.08);

    const resolutionMultiplier = resolution === '480p' ? 0.5 : 1;

    return Math.round(
      (baseCost + perSecondCost * durationSeconds) * resolutionMultiplier,
    );
  }
  // Vidu Q2 Turbo (using VIDU_Q1 for backward compatibility)
  if (model === ImageToVideoModel.VIDU_Q2) {
    return calculateViduQ2Cost(
      'turbo',
      +(duration || '4'),
      (resolution as ViduQ2Resolution) || '720p',
    );
  }
  // Vidu Q2 Pro
  if (model === ImageToVideoModel.VIDU_Q2_PRO) {
    return calculateViduQ2Cost(
      'pro',
      +(duration || '4'),
      (resolution as ViduQ2Resolution) || '720p',
    );
  }
  // Vidu Q2 Reference-to-Video (using VIDU_Q1_MULTI for backward compatibility)
  if (model === ImageToVideoModel.VIDU_Q2_MULTI) {
    return calculateViduQ2Cost(
      'reference',
      +(duration || '4'),
      (resolution as ViduQ2Resolution) || '720p',
    );
  }
  if (model === ImageToVideoModel.MJ_VIDEO) {
    return IMAGE_TO_ANIMATION_MJ_VIDEO;
  }
  if (
    model === ImageToVideoModel.SEEDANCE ||
    model === ImageToVideoModel.VIDU
  ) {
    const durationSeconds = +(duration || '5');
    if (model === ImageToVideoModel.VIDU) {
      // if (durationSeconds === 5) {
      //   return 200;
      // }
      // return 400;
      return 200;
    }
    // const multiplier = resolution === '1080p' ? 5 : 1;
    // const { width, height } = imageSize || { width: 1024, height: 1024 };
    const { width, height } = getVideoSize(
      aspectRatio || '16:9',
      resolution || '480p',
    );
    // Seedance 1.5: $2.4/M tokens (with audio), $1.2/M (without)
    // tokens = (height × width × FPS × duration) / 1024
    // 720p 5s ≈ $0.26
    const unit = dollarToZaps(2.4) / 100_0000;
    const FPS = 24;
    return Math.round((unit * width * height * durationSeconds * FPS) / 1024);
  }
  // SORA_STABLE uses old wavespeed pricing
  if (model === ImageToVideoModel.SORA_STABLE) {
    return SORA_STABLE_UNIT * (+(duration as string) || 4);
  }
  if (model === ImageToVideoModel.SORA_PRO_STABLE) {
    const unit =
      resolution === '1080p'
        ? SORA_PRO_STABLE_UNIT_1080P
        : SORA_PRO_STABLE_UNIT_720P;
    return unit * (+(duration as string) || 4);
  }

  // New KIE.AI Sora pricing with tiered rates
  if (model === ImageToVideoModel.SORA) {
    const durationSeconds = +(duration as string) || 10;
    return SORA_KIE_UNIT * durationSeconds;
  }
  if (model === ImageToVideoModel.SORA_PRO) {
    const durationSeconds = +(duration as string) || 10;
    const isHighQuality = resolution === '1080p';
    // Tiered pricing: different rate for ≤10s vs >10s
    if (durationSeconds <= 10) {
      const unit = isHighQuality
        ? SORA_PRO_KIE_HIGH_10S
        : SORA_PRO_KIE_STANDARD_10S;
      return unit * durationSeconds;
    }
    // >10s uses 15s pricing tier
    const unit = isHighQuality
      ? SORA_PRO_KIE_HIGH_15S
      : SORA_PRO_KIE_STANDARD_15S;
    return unit * durationSeconds;
  }
  return IMAGE_TO_ANIMATION_VEO_UNIT * (+(duration as string) || 5);
};

type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
type Resolution = '480p' | '720p' | '1080p' | '360p' | '540p' | '580p';

interface VideoSize {
  width: number;
  height: number;
}

function getVideoSize(
  aspectRatio: AspectRatio,
  resolution: Resolution,
): VideoSize {
  // 提取分辨率的数字部分，作为高度
  const height = parseInt(resolution.replace('p', ''), 10);

  // 解析宽高比
  const [w, h] = aspectRatio.split(':').map(Number);

  // 根据比例计算宽度，使用更精确的计算
  const width = Math.round((height * w) / h);

  // 对于常见的分辨率，使用标准值以确保兼容性
  // 480p resolutions
  if (resolution === '480p' && aspectRatio === '16:9') {
    return { width: 864, height: 480 };
  }
  if (resolution === '480p' && aspectRatio === '4:3') {
    return { width: 736, height: 544 };
  }
  if (resolution === '480p' && aspectRatio === '1:1') {
    return { width: 640, height: 640 };
  }
  if (resolution === '480p' && aspectRatio === '3:4') {
    return { width: 544, height: 736 };
  }
  if (resolution === '480p' && aspectRatio === '9:16') {
    return { width: 480, height: 864 };
  }
  if (resolution === '480p' && aspectRatio === '21:9') {
    return { width: 960, height: 416 };
  }

  // 720p resolutions
  if (resolution === '720p' && aspectRatio === '16:9') {
    return { width: 1248, height: 704 };
  }
  if (resolution === '720p' && aspectRatio === '4:3') {
    return { width: 1120, height: 832 };
  }
  if (resolution === '720p' && aspectRatio === '1:1') {
    return { width: 960, height: 960 };
  }
  if (resolution === '720p' && aspectRatio === '3:4') {
    return { width: 832, height: 1120 };
  }
  if (resolution === '720p' && aspectRatio === '9:16') {
    return { width: 704, height: 1248 };
  }
  if (resolution === '720p' && aspectRatio === '21:9') {
    return { width: 1504, height: 640 };
  }

  // 1080p resolutions
  if (resolution === '1080p' && aspectRatio === '16:9') {
    return { width: 1920, height: 1088 };
  }
  if (resolution === '1080p' && aspectRatio === '4:3') {
    return { width: 1664, height: 1248 };
  }
  if (resolution === '1080p' && aspectRatio === '1:1') {
    return { width: 1440, height: 1440 };
  }
  if (resolution === '1080p' && aspectRatio === '3:4') {
    return { width: 1248, height: 1664 };
  }
  if (resolution === '1080p' && aspectRatio === '9:16') {
    return { width: 1088, height: 1920 };
  }
  if (resolution === '1080p' && aspectRatio === '21:9') {
    return { width: 2176, height: 928 };
  }
  return { width, height };
}

export const calculateTextToVideoCost = (
  model: TextToVideoModel,
  duration?:
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '15',
  resolution?: Resolution,
  aspectRatio?: AspectRatio,
) => {
  if (model === TextToVideoModel.MINIMAX) {
    return IMAGE_TO_ANIMATION_MINIMAX;
  }
  if (model === TextToVideoModel.RAY) {
    return IMAGE_TO_ANIMATION_RAY;
  }
  if (model === TextToVideoModel.KLING_V2) {
    return IMAGE_TO_ANIMATION_KLING_V2_5;
  }
  if (model === TextToVideoModel.WAN) {
    if (resolution === '1080p') {
      return IMAGE_TO_ANIMATION_WAN_1080P * (+(duration as string) || 5);
    }
    return IMAGE_TO_ANIMATION_WAN_720P * (+(duration as string) || 5);
  }
  if (model === TextToVideoModel.WAN_22_TURBO) {
    return calculateWan22TurboCost(resolution);
  }
  // Vidu Q2 Text-to-Video
  if (model === TextToVideoModel.VIDU_Q2) {
    return calculateViduQ2Cost(
      'text',
      +(duration || '4'),
      (resolution as ViduQ2Resolution) || '720p',
    );
  }
  if (model === TextToVideoModel.VEO) {
    return IMAGE_TO_ANIMATION_VEO_UNIT * (+(duration as string) || 5);
  }
  if (model === TextToVideoModel.SEEDANCE || model === TextToVideoModel.VIDU) {
    const durationSeconds = +(duration || '5');
    if (model === TextToVideoModel.VIDU) {
      if (durationSeconds === 5) {
        return 200;
      }
      return 400;
    }
    // const multiplier = resolution === '1080p' ? 5 : 1;
    // const { width, height } = imageSize || { width: 1024, height: 1024 };
    const { width, height } = getVideoSize(
      aspectRatio || '16:9',
      resolution || '480p',
    );
    // Seedance 1.5: $2.4/M tokens (with audio), $1.2/M (without)
    // tokens = (height × width × FPS × duration) / 1024
    // 720p 5s ≈ $0.26
    const unit = dollarToZaps(2.4) / 100_0000;
    const FPS = 24;
    return Math.round((unit * width * height * durationSeconds * FPS) / 1024);
  }
  // SORA_STABLE uses old wavespeed pricing
  if (model === TextToVideoModel.SORA_STABLE) {
    return SORA_STABLE_UNIT * (+(duration as string) || 4);
  }
  if (model === TextToVideoModel.SORA_PRO_STABLE) {
    const unit =
      resolution === '1080p'
        ? SORA_PRO_STABLE_UNIT_1080P
        : SORA_PRO_STABLE_UNIT_720P;
    return unit * (+(duration as string) || 4);
  }

  // New KIE.AI Sora pricing with tiered rates
  if (model === TextToVideoModel.SORA) {
    const durationSeconds = +(duration as string) || 10;
    return SORA_KIE_UNIT * durationSeconds;
  }
  if (model === TextToVideoModel.SORA_PRO) {
    const durationSeconds = +(duration as string) || 10;
    const isHighQuality = resolution === '1080p';
    // Tiered pricing: different rate for ≤10s vs >10s
    if (durationSeconds <= 10) {
      const unit = isHighQuality
        ? SORA_PRO_KIE_HIGH_10S
        : SORA_PRO_KIE_STANDARD_10S;
      return unit * durationSeconds;
    }
    // >10s uses 15s pricing tier
    const unit = isHighQuality
      ? SORA_PRO_KIE_HIGH_15S
      : SORA_PRO_KIE_STANDARD_15S;
    return unit * durationSeconds;
  }
  return IMAGE_TO_ANIMATION_VEO_UNIT * (+(duration as string) || 5);
};

export const RELIGHTING = 46;

export const LATENT_SYNC = 400;

export const IMAGE_FLUX_KONTEXT_PRO = 80;
export const IMAGE_FLUX_KONTEXT_PRO_MINI = 50;
export const IMAGE_FLUX_KONTEXT = 50;
export const IMAGE_FLUX_KONTEXT_MINI = 40;
export const IMAGE_FLUX = 50;
export const IMAGE_GEMINI = 80;
export const IMAGE_GEMINI_MINI = 50;
export const IMAGE_GEMINI_3_PREVIEW = 300;
export const IMAGE_GEMINI_PRO_1K = 300;
export const IMAGE_GEMINI_PRO_2K = 350;
export const IMAGE_GEMINI_PRO_4K = 500;
export const IMAGE_NETA = 10;
export const IMAGE_NOOBAI_XL = 20;
export const IMAGE_ANIMAGINE_XL_3_1 = 15;
export const IMAGE_ANIMAGINE_XL_4 = 15;
export const IMAGE_GPT4O = 380;
export const IMAGE_GPT4O_MINI = 140;
export const IMAGE_ILLUSTRIOUS = 10;
export const IMAGE_SDXL = 10;
export const IMAGE_ART_PRO = 15;
export const IMAGE_KUSAXL = 20;
/**
 * Seedream 4: $0.0195 / 50 zaps, Seedream 4.5: $0.04 / 55 zaps
 */
export const IMAGE_SEEDREAM = 55;
export const IMAGE_SEEDREAM_V4 = 50;

export const calculateVideoUpscaleCost = (duration: number) => {
  const remain = Math.max(0, duration - 4);
  return Math.ceil(remain * VIDEO_UPSCALE_UNIT) + VIDEO_UPSCALE;
};

export const calculateLineArtColorizeCost = (
  isTransparent: boolean,
  model: ToolsModelType = ToolsModel.BASIC,
) => {
  // eslint-disable-next-line eqeqeq
  if (model == ToolsModel.ADVANCED) {
    return isTransparent
      ? LINE_ART_COLORIZE_GEMINI_PRO_1K_TRANSPARENT
      : IMAGE_GEMINI_PRO_1K;
  }
  return isTransparent ? IMAGE_GEMINI + 5 : IMAGE_GEMINI;
};

export const calculatePhotoToAnimeCost = (
  model: ToolsModelType = ToolsModel.BASIC,
  // eslint-disable-next-line eqeqeq
) => (model == ToolsModel.ADVANCED ? IMAGE_GPT4O : IMAGE_FLUX_KONTEXT_PRO);

export const ToolsModel = {
  /** Model:Gemini */
  BASIC: 1,
  /** Model:GPT */
  ADVANCED: 2,
} as const;

export type ToolsModelType = (typeof ToolsModel)[keyof typeof ToolsModel];

export const TALKING_HEAD_STANDARD = discount(20);
export const TALKING_HEAD_HIGH = discount(50);
// Hedra定价计算 (基于美元价格后转Zaps)
// 我们估计每个Hedra credit值$0.01，因此：
// 540p: 3 credits/sec = $0.03/sec = 60 Zaps/sec (按$0.0005 = 1 Zap计算)
// 720p: 6 credits/sec = $0.06/sec = 120 Zaps/sec (按$0.0005 = 1 Zap计算)
export const HEDRA_CREDIT_TO_DOLLAR = 0.01; // 每个Hedra credit估计为$0.01
export const HEDRA_540P_ZAPS_PER_SEC = Math.round(
  (3 * HEDRA_CREDIT_TO_DOLLAR) / 0.0005,
); // 60 Zaps/sec
export const HEDRA_720P_ZAPS_PER_SEC = Math.round(
  (6 * HEDRA_CREDIT_TO_DOLLAR) / 0.0005,
); // 120 Zaps/sec

export const calculateTalkingHeadCost = (
  quality: TalkingHeadQuality,
  resolution?: string,
  durationInSeconds = 10,
) => {
  if (quality === TalkingHeadQuality.HEDRA) {
    // 根据分辨率和时长计算Zaps
    const zapsPerSecond =
      resolution === '540p' ? HEDRA_540P_ZAPS_PER_SEC : HEDRA_720P_ZAPS_PER_SEC;
    return zapsPerSecond * durationInSeconds;
  }
  return quality === TalkingHeadQuality.HIGH
    ? TALKING_HEAD_HIGH
    : TALKING_HEAD_STANDARD;
};

// Video to Video Style Transfer pricing
// FLUX.1 Kontext Pro: $0.04 per image -> 暂定 40zap一次
export const VIDEO_TO_VIDEO_STYLE_TRANSFER_FLUX = 40;
// 150 ZAP per second for new Luma Ray 2 Flash API / 成本：$0.12 per second
export const VIDEO_TO_VIDEO_GENERATION_PER_SECOND = {
  rayFlash: 150,
  wan: 150,
  aleph: 225,
  actTwo: 80,
  wanAnimate: 50,
  wanAnimateDiscount: 45,
};

type StyleTransferModel =
  | 'flux-kontext-pro'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

export const calculateStyleTransferCost = (
  mode: 'template' | 'custom' | 'upload',
  tool?: 'video-to-video' | 'photo-to-anime',
  model?: StyleTransferModel,
) => {
  // For upload mode (use reference), no cost for style transfer
  if (mode === 'upload') {
    return 0;
  }

  // FLUX.1 Kontext Pro charges $0.04 per image regardless of size
  if (tool && tool === 'photo-to-anime') {
    if (model === 'gemini-2.5-flash-image' || model === 'flux-kontext-pro') {
      return IMAGE_GEMINI;
    }
    if (model === 'gemini-3-pro-image-preview') {
      return IMAGE_GEMINI_3_PREVIEW;
    }
    return IMAGE_GEMINI;
  }
  return VIDEO_TO_VIDEO_STYLE_TRANSFER_FLUX;
};

// ========================================
// Video Pipeline Extra Cost
// ========================================
// Pipeline type2/type3 模板调用额外的 Gemini 模型，费用从这里的常量派生
// 修改 IMAGE_GEMINI 等常量后，pipeline 费用会自动跟随变化
/**
 */
export function getVideoPipelineExtraCost(pipelineType?: string): number {
  switch (pipelineType) {
    case 'type2':
    case 'type3':
      return 0; // 目前不会增加额外费用
    default:
      return 0;
  }
}

/**
 * 计算视频模板的 Zap 费用（前端共享函数）
 * 根据 modelId + duration + pipelineType 计算费用
 * @param modelId - 模型 ID (来自 ModelIds 常量)
 * @param duration - 视频时长（秒）
 * @param pipelineType - 视频管线类型 (type2/type3)，用于计算额外 Gemini 费用
 */
export const calculateVideoTemplateCost = (
  modelId: number,
  duration: number,
  pipelineType?: string,
): number => {
  const pipelineExtra = getVideoPipelineExtraCost(pipelineType);

  // NOTE: 此文件被前端组件导入，不能 import 后端模块 (api/_constants.js)，
  // 因此使用内联数字值。值来源: api/_constants.ts → ModelIds
  switch (modelId) {
    case 11: // ModelIds.VIDU
      return 200 + pipelineExtra;
    case 4: // ModelIds.WAN
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.WAN,
          duration.toString() as any,
          '480p',
        ) + pipelineExtra
      );
    case 34: // ModelIds.WAN_ANIMATE
      return (
        VIDEO_TO_VIDEO_GENERATION_PER_SECOND.wanAnimate * duration +
        pipelineExtra
      );
    case 35: // ModelIds.SORA
    case 37: // ModelIds.SORA_TEXT_TO_VIDEO
      return SORA_KIE_UNIT * duration + pipelineExtra;
    case 36: // ModelIds.SORA_PRO
    case 38: // ModelIds.SORA_PRO_TEXT_TO_VIDEO
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.SORA_PRO,
          duration.toString() as any,
        ) + pipelineExtra
      );
    case 53: // ModelIds.SORA_STABLE
    case 55: // ModelIds.SORA_STABLE_TEXT_TO_VIDEO
      return SORA_STABLE_UNIT * duration + pipelineExtra;
    case 54: // ModelIds.SORA_PRO_STABLE
    case 56: // ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO
      return SORA_PRO_STABLE_UNIT_720P * duration + pipelineExtra;
    case 22: // ModelIds.SEEDANCE
      return (
        calculateImageToAnimationCost(
          ImageToVideoModel.SEEDANCE,
          duration.toString() as any,
        ) + pipelineExtra
      );
    default:
      return 200 + pipelineExtra;
  }
};

export type VideoToVideoModel =
  | 'rayFlash'
  | 'aleph'
  | 'actTwo'
  | 'wan'
  | 'wanAnimate'
  | 'wanAnimateDiscount';

export const calculateVideoToVideoGenerationCost = (
  model: VideoToVideoModel,
  durationInSeconds: number = 3,
) =>
  Math.floor(durationInSeconds * VIDEO_TO_VIDEO_GENERATION_PER_SECOND[model]);

/**
 * @deprecated 旧的模型定价
 * story-engine-inc/test-cog-comfyui: $0.001525 per second
 * 3s的视频 -> 耗时3min
 * 5s的视频 -> 5min
 * 10s的视频 -> 7min
 */
// export const calculateVideoToVideoGenerationCost = (
// durationInSeconds: number = 5,
// ) => {
//   // Map video duration to processing time with proper scaling
//   let processingTimeInSeconds: number;

//   if (durationInSeconds <= 3) {
//     // Fixed pricing for short videos: 140 zaps per second
//     // 1s = 140 zaps, 2s = 280 zaps, 3s = 420 zaps
//     return Math.floor(durationInSeconds * 140);
//   }
//   if (durationInSeconds <= 5) {
//     // Medium videos: scale from 3min (for 3s) to 5min (for 5s)
//     // Linear interpolation: 3s->3min, 5s->5min
//     const baseTime = 3 * 60; // 3分钟 for 3s video
//     const maxTime = 5 * 60; // 5分钟 for 5s video
//     const progress = (durationInSeconds - 3) / (5 - 3); // 0 to 1
//     processingTimeInSeconds = baseTime + (maxTime - baseTime) * progress;
//   } else if (durationInSeconds <= 10) {
//     // Long videos: scale from 5min (for 5s) to 10min (for 10s)
//     // Linear interpolation: 5s->5min, 10s->10min
//     const baseTime = 5 * 60; // 5分钟 for 5s video
//     const maxTime = 10 * 60; // 10分钟 for 10s video
//     const progress = (durationInSeconds - 5) / (10 - 5); // 0 to 1
//     processingTimeInSeconds = baseTime + (maxTime - baseTime) * progress;
//   } else {
//     // Extra long videos: use linear extrapolation based on 10s -> 10min pattern
//     const ratio = (10 * 60) / 10; // 60 seconds processing per 1 second video
//     processingTimeInSeconds = durationInSeconds * ratio;
//   }

//   // Cost based on processing time, not video duration
//   // 打个85折
//   return Math.ceil(dollarToZaps(0.001525) * processingTimeInSeconds * 0.85);
// };
