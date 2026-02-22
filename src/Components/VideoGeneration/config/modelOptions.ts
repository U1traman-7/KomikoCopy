import {
  ImageToVideoModel,
  IMAGE_TO_ANIMATION_ANISORA,
  IMAGE_TO_ANIMATION_FRAME_PACK,
  IMAGE_TO_ANIMATION_KLING_V2_5,
  IMAGE_TO_ANIMATION_MINIMAX,
  IMAGE_TO_ANIMATION_RAY,
  IMAGE_TO_ANIMATION_VEO_UNIT,
  IMAGE_TO_ANIMATION_WAN_720P,
  IMAGE_TO_ANIMATION_WAN_22_480P,
  SORA_KIE_UNIT,
  SORA_PRO_KIE_STANDARD_10S,
  SORA_STABLE_UNIT,
  SORA_PRO_STABLE_UNIT_720P,
  VIDU_Q2_TURBO_720P_PER_SEC,
  VIDU_Q2_PRO_720P_BASE,
  VIDU_Q2_PRO_720P_PER_SEC,
} from '../../../../api/tools/_zaps';
import LumaRayIcon from '../../../../public/images/icons/ray.svg';
import KoIcon from '../../../../public/images/favicon.webp';
import ViduIcon from '../../../../public/images/icons/vidu.png';
import MinimaxIcon from '../../../../public/images/icons/hailuo.svg';
import BytedanceIcon from '../../../../public/images/icons/bytedance.png';
import KlingIcon from '../../../../public/images/icons/kling.svg';
import VeoIcon from '../../../../public/images/icons/veo.svg';
import WanIcon from '../../../../public/images/icons/wavespeed.jpg';
import SoraIcon from '../../../../public/images/icons/sora.png';
import AnisoraIcon from '../../../../public/images/icons/anisora.webp';
import { getModelConfig, getDurationRange } from './modelConfig';

/**
 * UI-only model option type (before merging with config)
 */
interface ModelOptionUI {
  model: ImageToVideoModel;
  icon: string;
  dollars: string | number;
  i18nKey: string;
}

/**
 * Full model option type (after merging with config)
 */
export interface ModelOption {
  model: ImageToVideoModel;
  name: string;
  description?: string;
  icon: string;
  dollars: string | number;
  duration?: string;
  hasAudio?: boolean;
  hasNSFW?: boolean;
  supportsMultipleReferenceImages?: boolean;
  supportsFirstLastFrame?: boolean;
}

/**
 * UI-only configuration for each model
 * Functional properties (supportsText, supportsAudio, etc.) come from modelConfig.ts
 */
const MODEL_UI_OPTIONS: ModelOptionUI[] = [
  {
    model: ImageToVideoModel.VIDU,
    icon: KoIcon.src,
    dollars: '200+',
    i18nKey: 'modelOptions.vidu_base',
  },
  {
    model: ImageToVideoModel.SORA,
    icon: SoraIcon.src,
    dollars: `${SORA_KIE_UNIT * 10}+`, // 10s default = 300 Zaps+
    i18nKey: 'modelOptions.sora',
  },
  {
    model: ImageToVideoModel.SORA_PRO,
    icon: SoraIcon.src,
    dollars: `${SORA_PRO_KIE_STANDARD_10S * 10}+`, // 720p 10s = 1500 Zaps+
    i18nKey: 'modelOptions.sora_pro',
  },
  {
    model: ImageToVideoModel.SORA_STABLE,
    icon: SoraIcon.src,
    dollars: `${SORA_STABLE_UNIT * 4}+`,
    i18nKey: 'modelOptions.sora_stable',
  },
  // {
  //   model: ImageToVideoModel.SORA_PRO_STABLE,
  //   icon: SoraIcon.src,
  //   dollars: SORA_PRO_STABLE_UNIT_720P * 4 + '+',
  //   i18nKey: 'modelOptions.sora_pro_stable',
  // },
  {
    model: ImageToVideoModel.VIDU_Q2,
    icon: ViduIcon.src,
    dollars: `${VIDU_Q2_TURBO_720P_PER_SEC * 4}+`,
    i18nKey: 'modelOptions.vidu_q2',
  },
  // {
  //   model: ImageToVideoModel.VIDU_Q2_PRO,
  //   icon: ViduIcon.src,
  //   dollars: VIDU_Q2_PRO_720P_BASE + VIDU_Q2_PRO_720P_PER_SEC * 4 + '+',
  //   i18nKey: 'modelOptions.vidu_q2_pro',
  // },
  {
    model: ImageToVideoModel.MINIMAX,
    icon: MinimaxIcon.src,
    dollars: IMAGE_TO_ANIMATION_MINIMAX,
    i18nKey: 'modelOptions.minimax',
  },
  {
    model: ImageToVideoModel.SEEDANCE,
    icon: BytedanceIcon.src,
    dollars: '180+',
    i18nKey: 'modelOptions.seedance',
  },
  // {
  //   model: ImageToVideoModel.KLING_V2,
  //   icon: KlingIcon.src,
  //   dollars: IMAGE_TO_ANIMATION_KLING_V2_5 + '+',
  //   i18nKey: 'modelOptions.kling_v2',
  // },
  // {
  //   model: ImageToVideoModel.VEO,
  //   icon: VeoIcon.src,
  //   dollars: IMAGE_TO_ANIMATION_VEO_UNIT * 8,
  //   i18nKey: 'modelOptions.veo',
  // },
  {
    model: ImageToVideoModel.WAN,
    icon: WanIcon.src,
    dollars: `${IMAGE_TO_ANIMATION_WAN_720P * 5}+`,
    i18nKey: 'modelOptions.wan',
  },
  {
    model: ImageToVideoModel.WAN_22_TURBO,
    icon: WanIcon.src,
    dollars: `${IMAGE_TO_ANIMATION_WAN_22_480P}+`,
    i18nKey: 'modelOptions.wan_22_turbo',
  },
  // {
  //   model: ImageToVideoModel.RAY,
  //   icon: LumaRayIcon.src,
  //   dollars: IMAGE_TO_ANIMATION_RAY,
  //   i18nKey: 'modelOptions.ray',
  // },
  // {
  //   model: ImageToVideoModel.ANISORA,
  //   icon: AnisoraIcon.src,
  //   dollars: IMAGE_TO_ANIMATION_ANISORA,
  //   i18nKey: 'modelOptions.anisora',
  // },
  {
    model: ImageToVideoModel.FRAME_PACK,
    icon: KoIcon.src,
    dollars: IMAGE_TO_ANIMATION_FRAME_PACK,
    i18nKey: 'modelOptions.frame_pack',
  },
];

/**
 * 根据 duration 范围生成显示标签
 */
const formatDurationLabel = (
  range: { min: number; max: number } | null,
  secLabel: string,
): string | undefined => {
  if (!range) {
    return undefined;
  }
  if (range.min === range.max) {
    return `${range.min} ${secLabel}`;
  }
  return `${range.min}-${range.max} ${secLabel}`;
};

/**
 * Creates model options by merging UI config with functional config from modelConfig.ts
 * @param uiT - i18n translation function with 'ui' keyPrefix
 * @returns Array of complete model options
 */
export const createModelOptions = (uiT: any): ModelOption[] =>
  MODEL_UI_OPTIONS.map(uiOption => {
    const config = getModelConfig(uiOption.model);
    const i18nData = uiT(uiOption.i18nKey, { returnObjects: true }) || {};
    const durationRange = getDurationRange(config);

    // Remove 'model' from i18nData to prevent it from overriding the correct value
    const { model: _unusedModel, ...safeI18nData } = i18nData;

    return {
      ...safeI18nData,
      model: uiOption.model,
      icon: uiOption.icon,
      dollars: uiOption.dollars,
      type: 'image' as const,

      // Functional properties from modelConfig (single source of truth)
      duration: formatDurationLabel(durationRange, uiT('sec')),
      hasAudio: config.supportsAudio,
      hasNSFW: config.hasNSFW,
      supportsMultipleReferenceImages: config.supportsMultipleReferenceImages,
      supportsFirstLastFrame: config.supportsEndFrame,
    };
  });
