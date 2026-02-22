/**
 * Constants extracted from RightSidebar.tsx
 */

import AnimeImg from '../../../public/images/anime.webp';
import NoobaiImg from '../../../public/images/noobai.webp';
import AnimagineImg from '../../../public/images/animagine.webp';
import GeminiImg from '../../../public/images/gemini.webp';
import FluxImg from '../../../public/images/flux.webp';
import GPTImg from '../../../public/images/gpt4o.webp';
import AutoImg from '../../../public/images/auto-model.webp';

// Model Images Mapping
export const MODEL_IMAGES: Record<string, string> = {
  'Auto Model': AutoImg.src,
  'Gemini Pro':
    'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/image_generation/fe775601-0d1c-4ad9-bd44-edce4c6a036e/2025-12-01-feeb2c92-6c07-4ff2-8f0b-c1265aff4d66.webp?t=1764586581792',
  'Art Pro': AnimeImg.src,
  'Art Unlimited': NoobaiImg.src,
  'Seedream 4.5': FluxImg.src,
  'Seedream 4': FluxImg.src,
  Gemini: GeminiImg.src,
  Animagine: AnimagineImg.src,
  Illustrious: GPTImg.src,
  Noobai: NoobaiImg.src,
  KusaXL: NoobaiImg.src,
};

// Model Labels Mapping (for display names different from keys)
export const MODEL_LABELS: Record<string, string> = {
  'Gemini Pro': '🔥 Nano Banana Pro',
  Gemini: 'Gemini (Nano Banana)',
};

// Model Lists
/**
 * Danbooru models list - models that support Danbooru tags
 */
export const DANBOORU_MODELS = [
  'Animagine',
  'Art Pro',
  'Art Unlimited',
  'Illustrious',
  'KusaXL',
  'Noobai',
] as const;

/**
 * Models that should hide certain tabs
 */
export const MODELS_HIDE_TABS = [''] as const;

/**
 * Models that should hide reference image option
 */
export const MODELS_HIDE_REFERENCE = [
  'Animagine',
  'Noobai',
  'Neta',
  'Illustrious',
  'Art Pro',
  'Art Unlimited',
] as const;

// Size Options
/**
 * 缓存sizes数组 - Available image size options
 * Only show "Reference Image" option for single reference image
 */
export const SIZE_OPTIONS = [
  { key: '1:1', width: 15, height: 15 },
  { key: '3:4', width: 12, height: 16 },
  { key: '4:3', width: 16, height: 12 },
  { key: '16:9', width: 16, height: 9 },
  { key: '9:16', width: 9, height: 16 },
] as const;

export const DEFAULT_SIZE = '3:4';

// Resolution Options
export type Resolution = '1k' | '2k' | '4k';
export const RESOLUTION_OPTIONS: Resolution[] = ['1k', '2k', '4k'];
export const DEFAULT_RESOLUTION: Resolution = '1k';

// Helper Functions
/**
 * Check if a model is a Danbooru model
 */
export const isDanbrooModel = (model?: string): boolean => {
  return DANBOORU_MODELS.includes(model as any);
};

/**
 * Add this function to check if a model should hide certain tabs
 */
export const shouldHideTabs = (model: string): boolean => {
  return MODELS_HIDE_TABS.includes(model as any);
};

/**
 * Check if a model should hide reference image option
 */
export const shouldHideReference = (model: string): boolean => {
  return MODELS_HIDE_REFERENCE.includes(model as any);
};

