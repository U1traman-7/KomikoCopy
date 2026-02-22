import { id } from 'date-fns/locale';

export const ERROR_CODES = {
  // POST删除错误
  POST_DELETE_ERROR: 1001,
  POST_NOT_FOUND: 1002,
  POST_ID_NEEDED: 1003,
  POST_OPERATION_FORBIDDEN: 10014,

  GENERATION_FAILED: 1004,
  GENERATION_MODEL_NOT_FOUND: 1005,
  GENERATION_TASK_NOT_FOUND: 1006,
  INVALID_PARAMS: 1007,
  // photo to anime vip style requires subscription
  VIP_STYLE_REQUIRES_SUBSCRIPTION: 1008,

  // 速率限制错误
  RATE_LIMIT_EXCEEDED: 1010,
  // no zaps
  NOT_ENOUGH_ZAPS: 1011,
  CHARACTER_NOT_ENOUGH: 1012,

  UNAUTHORIZED: 1013,

  // 用户相关错误
  USER_NOT_FOUND: 1014,
  USER_OPERATION_FORBIDDEN: 1015,
  USER_OPERATION_FAILED: 1016,
  INVALID_REQUEST: 1017,
  DEVICE_LIMIT_EXCEEDED: 1018,
  PROFILE_MODERATION_FAILED: 1019,
};

export const LANGUAGES = [
  'en', // 英语
  'ja', // 日语
  'id', // 印尼语
  'hi', // 印地语
  'zh-CN', // 简体中文
  'zh-TW', // 繁体中文
  'ko', // 韩语
  'es', // 西班牙语
  'fr', // 法语
  'de', // 德语
  'pt', // 葡萄牙语
  'ru', // 俄语
  'th', // 泰语
  'vi', // 越南语
];

// 生图类型
export const TASK_TYPES = {
  IMAGE: 1,
  VIDEO: 2,
  CHARACTER: 11,
} as const;

export type TaskTypes = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

export const GenerationStatus = {
  FAILED: 0,
  PROCESSING: 1,
  SUCCEEDED: 2,
  PENDING: 3,
  FINISHED: 4, // 在cleanup中只能判断结束，不知道成功或失败
  REPLACED: 5, // Fallback created; original replaced by a new task
} as const;

export type GenerationStatusType =
  (typeof GenerationStatus)[keyof typeof GenerationStatus];

export const ModelIds = {
  MINIMAX: 1,
  RAY: 2,
  RAY_FLASH_V2: 3,
  WAN: 4,
  WAN_PRO: 5,
  KLING: 6,
  PIXVERSE: 7,
  KLING_V2: 8,
  VEO2: 9,
  FRAME_PACK: 10,
  VIDU: 11,
  ANISORA: 12,
  VIDU_Q2: 13,
  /**
   * @deprecated
   */
  MAGI_1: 14,
  HEDRA: 15,
  SE_COG: 16,
  SE_WAN: 17,
  VIDEO_UPSCALE: 18,
  VIDEO_INTERPOLATION: 19,
  IN_BETWEEN: 20,
  MJ_VIDEO: 21,
  SEEDANCE: 22,
  RAY2_FLASH_MODIFY: 23, // FAL
  ACT_TWO: 24,
  ALEPH: 25,
  RAY2_FLASH_MODIFY_LUMA: 26, // Luma (fallback)
  SEEDANCE_TEXT_TO_VIDEO: 27,
  VIDU_Q2_TEXT_TO_VIDEO: 28,
  KLING_V2_TEXT_TO_VIDEO: 29,
  MINIMAX_TEXT_TO_VIDEO: 30,
  WAN_TEXT_TO_VIDEO: 31,
  RAY_TEXT_TO_VIDEO: 32,
  VIDU_TEXT_TO_VIDEO: 33,
  WAN_ANIMATE: 34,
  SORA: 35,
  SORA_PRO: 36,
  SORA_TEXT_TO_VIDEO: 37,
  SORA_PRO_TEXT_TO_VIDEO: 38,
  VEO3: 39,
  VEO3_TEXT_TO_VIDEO: 40,
  VIDU_Q2_REFERENCE_TO_VIDEO: 41,
  ILLUSTRIOUS: 42,
  ANIMAGINE_XL_3_1: 43,
  FLUX_KONTEXT: 44,
  FLUX_KONTEXT_DEV: 45,
  NOOBAI_XL: 46,
  SEEDREAM: 47,
  SEEDREAM_EDIT: 48,
  GEMINI_NANO_BANANA: 49,
  ART_PRO: 50,
  ART_UNLIMITED: 51,
  KUSAXL: 52,
  SORA_STABLE: 53,
  SORA_PRO_STABLE: 54,
  SORA_STABLE_TEXT_TO_VIDEO: 55,
  SORA_PRO_STABLE_TEXT_TO_VIDEO: 56,
  VIDU_Q2_PRO: 57,
  WAN_22_TURBO_IMAGE_TO_VIDEO: 58,
  WAN_22_TURBO_TEXT_TO_VIDEO: 59,
  SEEDREAM_V4: 60,
  SEEDREAM_V4_EDIT: 61,
} as const;

export const ROLES = {
  ADMIN: 1,
} as const;

export const FeedPageSize = {
  FREE: 8,
  PAID: 5,
} as const;

// Maximum number of OC tags to query in Following mode to prevent performance issues
export const MAX_OC_TAGS = 100;

export const KUSA_STYLES = [
  {
    id: '1',
    label: 'vibrant anime style',
    labelKey: 'kusa_styles.vibrant_anime',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[vibrant-anime-style]',
  },
  {
    id: '2',
    label: 'high-contrast glossy style',
    labelKey: 'kusa_styles.high_contrast_glossy',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[high-contrast-glossy-style]',
  },
  {
    id: '3',
    label: 'lacquered illustration',
    labelKey: 'kusa_styles.lacquered_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[lacquered-illustration-style]',
  },
  {
    id: '4',
    label: 'soft pastel style',
    labelKey: 'kusa_styles.soft_pastel',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-pastel-style]',
  },
  {
    id: '6',
    label: 'soft light illustration',
    labelKey: 'kusa_styles.soft_light_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-light-illustration-style]',
  },
  {
    id: '8',
    label: 'Irasutoya style',
    labelKey: 'kusa_styles.irastoya',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    value: '[irasutoya-style]',
  },
  {
    id: '9',
    label: 'doodle style',
    labelKey: 'kusa_styles.doodle',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[doodle-style]',
  },
  {
    id: '10',
    label: 'deep-fried meme',
    labelKey: 'kusa_styles.deep_fried_meme',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    value: '[deep-fried-meme-style]',
  },
  {
    id: '11',
    label: 'chibi sticker style',
    labelKey: 'kusa_styles.chibi_sticker',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[chibi-sticker-style]',
  },
  {
    id: '12',
    label: 'iridescent style',
    labelKey: 'kusa_styles.iridescent',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    image: '/images/kusa_styles/iridescent.webp',
    value: '[iridescent-style]',
  },
  {
    id: '13',
    label: 'serious man',
    labelKey: 'kusa_styles.serious_man',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[serious-man-style]',
  },
  {
    id: '14',
    label: 'toon-shaded style',
    labelKey: 'kusa_styles.toon_shaded',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[toon-shaded-style]',
  },
  {
    id: '15',
    label: 'soft glossy style',
    labelKey: 'kusa_styles.soft_glossy',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-glossy-style]',
  },
  {
    id: '16',
    label: 'grayscale manga',
    labelKey: 'kusa_styles.grayscale_manga',
    category: 'Manga',
    categoryKey: 'kusa_categories.manga',
    value: '[grayscale-manga-style]',
  },
  {
    id: '18',
    label: '3d anime style',
    labelKey: 'kusa_styles.3d_model',
    category: '3D',
    categoryKey: 'kusa_categories.3d',
    image: '/images/kusa_styles/3d_model.webp',
    value: '[3d-anime-style]',
  },
  {
    id: '19',
    label: 'thick outline',
    labelKey: 'kusa_styles.thick_outline',
    category: 'Flat',
    categoryKey: 'kusa_categories.flat',
    image: '/images/kusa_styles/thick_outline.webp',
    value: '[thick-outline-style]',
  },
  {
    id: '20',
    label: 'seductive style',
    labelKey: 'kusa_styles.seductive',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    image: '/images/kusa_styles/anime_screencap.webp',
    value: '[seductive-style]',
  },
  // {
  //   id: '21',
  //   label: 'vibrant pop style',
  //   labelKey: 'kusa_styles.vibrant_pop',
  //   category: 'Art',
  //   categoryKey: 'kusa_categories.art',
  //   image: '/images/kusa_styles/vibrant_pop.webp',
  //   value: '[vibrant-pop-style]',
  // },
  {
    id: '22',
    label: 'blocky-faced chibi',
    labelKey: 'kusa_styles.blocky_faced_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    image: '/images/kusa_styles/blocky_faced_chibi.webp',
    value: '[blocky-faced-chibi-style]',
  },
  {
    id: '23',
    label: 'horror manga',
    labelKey: 'kusa_styles.horror_manga',
    category: 'Manga',
    categoryKey: 'kusa_categories.manga',
    image: '/images/kusa_styles/horror_manga.webp',
    value: '[horror-manga-style]',
  },
  {
    id: '26',
    label: 'flat chibi',
    labelKey: 'kusa_styles.flat_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    image: '/images/kusa_styles/flat_chibi.webp',
    value: '[flat-chibi-style]',
  },
  {
    id: '27',
    label: 'soft chibi',
    labelKey: 'kusa_styles.soft_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    image: '/images/kusa_styles/soft_chibi.webp',
    value: '[soft-chibi-style]',
  },
  {
    id: '28',
    label: 'vintage chibi',
    labelKey: 'kusa_styles.vintage_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    image: '/images/kusa_styles/vintage_chibi.webp',
    value: '[vintage-chibi-style]',
  },
  {
    id: '29',
    label: 'close look',
    labelKey: 'kusa_styles.close_look',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    image: '/images/kusa_styles/close_look.webp',
    value: '[close-look-style]',
  },
  // {
  //   id: '30',
  //   label: 'pretty boy',
  //   labelKey: 'kusa_styles.pretty_boy',
  //   category: 'Male Focus',
  //   categoryKey: 'kusa_categories.male_focus',
  //   value: '[pretty-boy-style]',
  // },
  {
    id: '31',
    label: 'glossy chibi',
    labelKey: 'kusa_styles.glossy_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[glossy-chibi-style]',
  },
  {
    id: '34',
    label: 'flat outline chibi',
    labelKey: 'kusa_styles.flat_outline_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[flat-outline-chibi-style]',
  },
  {
    id: '35',
    label: 'pastel chibi',
    labelKey: 'kusa_styles.pastel_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[pastel-chibi-style]',
  },
  {
    id: '36',
    label: 'shiny-eye chibi',
    labelKey: 'kusa_styles.shiny_eye_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[shiny-eye-chibi-style]',
  },
  {
    id: '37',
    label: 'watercolor Illustration',
    labelKey: 'kusa_styles.watercolor_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[watercolor-illustration-style]',
  },
  {
    id: '38',
    label: 'flat illustration',
    labelKey: 'kusa_styles.flat_illustration',
    category: 'Flat',
    categoryKey: 'kusa_categories.flat',
    value: '[flat-illustration-style]',
  },
  // {
  //   id: '39',
  //   label: 'colorful manga',
  //   labelKey: 'kusa_styles.colorful_manga',
  //   category: 'Manga',
  //   categoryKey: 'kusa_categories.manga',
  //   value: '[colorful-manga-style]',
  // },
  {
    id: '40',
    label: 'flat pastel style',
    labelKey: 'kusa_styles.flat_pastel_style',
    category: 'Flat',
    categoryKey: 'kusa_categories.flat',
    value: '[flat-pastel-style]',
  },
  {
    id: '41',
    label: 'muted illustration',
    labelKey: 'kusa_styles.muted_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[muted-illustration-style]',
  },
  {
    id: '42',
    label: 'Helltalker style',
    labelKey: 'kusa_styles.helltalker_style',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    value: '[helltalker-style]',
  },
  {
    id: '43',
    label: 'high-gloss Illustration',
    labelKey: 'kusa_styles.high_gloss_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[high-gloss-illustration-style]',
  },
  {
    id: '44',
    label: 'sweet pastel style',
    labelKey: 'kusa_styles.sweet_pastel_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[sweet-pastel-style]',
  },
  {
    id: '46',
    label: 'prismatic style',
    labelKey: 'kusa_styles.prismatic_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[prismatic-style]',
  },
  {
    id: '48',
    label: 'action manga',
    labelKey: 'kusa_styles.action_manga',
    category: 'Manga',
    categoryKey: 'kusa_categories.manga',
    image: '/images/kusa_styles/action_manga.webp',
    value: '[action-manga-style]',
  },
  {
    id: '86',
    label: 'retro anime style',
    labelKey: 'kusa_styles.retro_anime_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[retro-anime-style]',
  },
  {
    id: '50',
    label: 'dazzling illustration',
    labelKey: 'kusa_styles.dazzling_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[dazzling-illustration-style]',
  },
  {
    id: '51',
    label: 'mature man',
    labelKey: 'kusa_styles.mature_man',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[mature-man-style]',
  },
  {
    id: '53',
    label: 'minimalist',
    labelKey: 'kusa_styles.minimalist',
    category: 'Flat',
    categoryKey: 'kusa_categories.flat',
    image: '/images/kusa_styles/minimalist.webp',
    value: '[minimalist-style]',
  },
  {
    id: '54',
    label: 'sweet painting style',
    labelKey: 'kusa_styles.sweet_painting_style',
    category: 'Painterly',
    categoryKey: 'kusa_categories.painterly',
    value: '[sweet-painting-style]',
  },
  {
    id: '55',
    label: 'sharp-line anime',
    labelKey: 'kusa_styles.sharp_line_anime',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    image: '/images/kusa_styles/sharp_line_anime.webp',
    value: '[sharp-line-anime-style]',
  },
  {
    id: '56',
    label: 'mini chibi',
    labelKey: 'kusa_styles.mini_chibi',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[mini-chibi-style]',
  },
  // {
  //   id: '86',
  //   label: 'anime screenshot',
  //   labelKey: 'kusa_styles.anime_screenshot',
  //   category: 'Anime',
  //   categoryKey: 'kusa_categories.anime',
  //   value: '[anime-screenshot-style]',
  // },
  {
    id: '17',
    label: 'soft shading style',
    labelKey: 'kusa_styles.soft_shading',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-shading-style]',
  },
  {
    id: '30',
    label: 'semi-realistic portrait',
    labelKey: 'kusa_styles.semi_realistic_portrait',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[semi-realistic-portrait-style]',
  },
  {
    id: '47',
    label: 'desaturated illustration',
    labelKey: 'kusa_styles.desaturated_illustration',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[desaturated-illustration-style]',
  },
  {
    id: '204',
    label: 'sensual glossy style',
    labelKey: 'kusa_styles.sensual_glossy_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    image: '/images/kusa_styles/sensual_glossy_style.webp',
    value: '[sensual-glossy-style]',
  },
  {
    id: '70',
    label: 'glossy anime',
    labelKey: 'kusa_styles.glossy_anime',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[glossy-anime-style]',
  },
  {
    id: '59',
    label: 'muscular manhwa',
    labelKey: 'kusa_styles.muscular_manhwa',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[muscular-manhwa-style]',
  },
  {
    id: '39',
    label: 'Hentai',
    labelKey: 'kusa_styles.hentai',
    category: 'Manga',
    categoryKey: 'kusa_categories.manga',
    value: '[hentai-style]',
  },
  {
    id: '49',
    label: '90s shojo style',
    labelKey: 'kusa_styles.90s_shojo_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[90s-shojo-style]',
  },
  {
    id: '94',
    label: 'flat anime style',
    labelKey: 'kusa_styles.flat_anime_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[flat-anime-style]',
  },
  {
    id: '95',
    label: 'bright anime style',
    labelKey: 'kusa_styles.bright_anime_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[bright-anime-style]',
  },
  {
    id: '96',
    label: 'pop anime style',
    labelKey: 'kusa_styles.pop_anime_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[pop-anime-style]',
  },
  {
    id: '76',
    label: 'pop sketch',
    labelKey: 'kusa_styles.pop_sketch',
    category: 'Sketch',
    categoryKey: 'kusa_categories.sketch',
    value: '[pop-sketch-style]',
  },
  {
    id: '81',
    label: 'clean lines',
    labelKey: 'kusa_styles.clean_lines',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[clean-lines-style]',
  },
  {
    id: '68',
    label: 'bubble chibi style',
    labelKey: 'kusa_styles.bubble_chibi_style',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[bubble-chibi-style]',
  },
  {
    id: '83',
    label: 'Powerpuff Girls style',
    labelKey: 'kusa_styles.powerpuff_girls_style',
    category: 'Chibi',
    categoryKey: 'kusa_categories.chibi',
    value: '[powerpuff-girls-style]',
  },
  {
    id: '92',
    label: 'pop toon style',
    labelKey: 'kusa_styles.pop_toon_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[pop-toon-style]',
  },
  {
    id: '64',
    label: 'pokemon style',
    labelKey: 'kusa_styles.pokemon_style',
    category: 'Furry',
    categoryKey: 'kusa_categories.furry',
    value: '[pokemon-style]',
  },
  {
    id: '62',
    label: 'realistic furry',
    labelKey: 'kusa_styles.realistic_furry',
    category: 'Furry',
    categoryKey: 'kusa_categories.furry',
    value: '[realistic-furry-style]',
  },
  {
    id: '65',
    label: 'soft furry',
    labelKey: 'kusa_styles.soft_furry',
    category: 'Furry',
    categoryKey: 'kusa_categories.furry',
    value: '[soft-furry-style]',
  },
  {
    id: '89',
    label: 'flat furry',
    labelKey: 'kusa_styles.flat_furry',
    category: 'Furry',
    categoryKey: 'kusa_categories.furry',
    value: '[flat-furry-style]',
  },
  {
    id: '79',
    label: '90s realistic style',
    labelKey: 'kusa_styles.90s_realistic_style',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[90s-realistic-style]',
  },
  {
    id: '90',
    label: 'soft painterly style',
    labelKey: 'kusa_styles.soft_painterly_style',
    category: 'Painterly',
    categoryKey: 'kusa_categories.painterly',
    value: '[soft-painterly-style]',
  },
  {
    id: '72',
    label: 'radiant coating',
    labelKey: 'kusa_styles.radiant_coating',
    category: 'Painterly',
    categoryKey: 'kusa_categories.painterly',
    value: '[radiant-coating-style]',
  },
  {
    id: '77',
    label: 'gothic oil painting',
    labelKey: 'kusa_styles.gothic_oil_painting',
    category: 'Painterly',
    categoryKey: 'kusa_categories.painterly',
    value: '[gothic-oil-painting-style]',
  },
  {
    id: '85',
    label: 'sketchy painterly style',
    labelKey: 'kusa_styles.sketchy_painterly_style',
    category: 'Sketch',
    categoryKey: 'kusa_categories.sketch',
    value: '[sketchy-painterly-style]',
  },
  {
    id: '87',
    label: 'digital painterly style',
    labelKey: 'kusa_styles.digital_painterly_style',
    category: 'Painterly',
    categoryKey: 'kusa_categories.painterly',
    value: '[digital-painterly-style]',
  },
  {
    id: '57',
    label: 'Doro style',
    labelKey: 'kusa_styles.doro_style',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    value: '[doro-style]',
  },
  {
    id: '74',
    label: 'Uplook style',
    labelKey: 'kusa_styles.uplook_style',
    category: 'Meme',
    categoryKey: 'kusa_categories.meme',
    value: '[uplook-style]',
  },
  {
    id: '58',
    label: 'faded sketchy lines',
    labelKey: 'kusa_styles.faded_sketchy_lines',
    category: 'Sketch',
    categoryKey: 'kusa_categories.sketch',
    value: '[faded-sketchy-lines-style]',
  },
  {
    id: '60',
    label: 'soft pixel art',
    labelKey: 'kusa_styles.soft_pixel_art',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-pixel-art-style]',
  },
  {
    id: '61',
    label: 'arcade pixel art',
    labelKey: 'kusa_styles.arcade_pixel_art',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[arcade-pixel-art-style]',
  },
  {
    id: '67',
    label: 'dark lolita style',
    labelKey: 'kusa_styles.dark_lolita_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[dark-lolita-style]',
  },
  {
    id: '71',
    label: 'moody glow style',
    labelKey: 'kusa_styles.moody_glow_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[moody-glow-style]',
  },
  {
    id: '78',
    label: 'soft-shaded moe style',
    labelKey: 'kusa_styles.soft_shaded_moe_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-shaded-moe-style]',
  },
  {
    id: '93',
    label: 'soft wash sketch',
    labelKey: 'kusa_styles.soft_wash_sketch',
    category: 'Sketch',
    categoryKey: 'kusa_categories.sketch',
    value: '[soft-wash-sketch-style]',
  },
  {
    id: '73',
    label: 'graphic ink',
    labelKey: 'kusa_styles.graphic_ink',
    category: 'Manga',
    categoryKey: 'kusa_categories.manga',
    value: '[graphic-ink-style]',
  },
  {
    id: '75',
    label: 'MMD style',
    labelKey: 'kusa_styles.mmd_style',
    category: '3D',
    categoryKey: 'kusa_categories.3d',
    value: '[mmd-style]',
  },
  {
    id: '21',
    label: '3D anime game',
    labelKey: 'kusa_styles.3d_anime_game',
    category: '3D',
    categoryKey: 'kusa_categories.3d',
    value: '[3d-anime-game-style]',
  },
  {
    id: '97',
    label: 'Ukiyo-e',
    labelKey: 'kusa_styles.ukiyo_e',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[ukiyo-e-style]',
    requiresSeedream: true,
  },
  {
    id: '98',
    label: 'Retro Comic Dots',
    labelKey: 'kusa_styles.retro_comic_dots',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[retro-comic-dots-style]',
    requiresSeedream: true,
  },
  {
    id: '99',
    label: 'Cyberpunk',
    labelKey: 'kusa_styles.cyberpunk',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[cyberpunk-style]',
    requiresSeedream: true,
  },
  {
    id: '206',
    label: 'Cyber Candy',
    labelKey: 'kusa_styles.cyber_candy',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[cyber-candy-style]',
  },
  {
    id: '207',
    label: 'Glimmer Anime Style',
    labelKey: 'kusa_styles.glimmer_anime_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[glimmer-anime-style]',
  },
  {
    id: '209',
    label: 'Polished Illustration Style',
    labelKey: 'kusa_styles.polished_illustration_style',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[polished-illustration-style]',
  },
  {
    id: '208',
    label: 'High-Contrast Manhwa',
    labelKey: 'kusa_styles.high_contrast_manhwa',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[high-contrast-manhwa-style]',
  },
  {
    id: '210',
    label: 'Silky Radiance',
    labelKey: 'kusa_styles.silky_radiance',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[silky-radiance-style]',
  },
  {
    id: '211',
    label: 'Vibrant anime male style',
    labelKey: 'kusa_styles.vibrant_anime_male_style',
    category: 'Male Focus',
    categoryKey: 'kusa_categories.male_focus',
    value: '[vibrant-anime-male-style]',
  },
  {
    id: '212',
    label: 'Soft Luminous Anime',
    labelKey: 'kusa_styles.soft_luminous_anime',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[soft-luminous-anime-style]',
  },
  {
    id: '213',
    label: 'Smooth Satin Illustration',
    labelKey: 'kusa_styles.smooth_satin_illustration',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[smooth-satin-illustration-style]',
  },
  {
    id: '214',
    label: 'Vivid Oil-Cel',
    labelKey: 'kusa_styles.vivid_oil_cel',
    category: 'Anime',
    categoryKey: 'kusa_categories.anime',
    value: '[vivid-oil-cel-style]',
  },
  {
    id: '215',
    label: 'Disney Style',
    labelKey: 'kusa_styles.disney_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[disney-style]',
  },
  {
    id: '216',
    label: 'Matte Velvet',
    labelKey: 'kusa_styles.matte_velvet',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[matte-velvet-style]',
  },
  {
    id: '217',
    label: 'Mischief Style',
    labelKey: 'kusa_styles.mischief_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[mischief-style]',
  },
  {
    id: '218',
    label: 'Smooth Render Style',
    labelKey: 'kusa_styles.smooth_render_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[smooth-render-style]',
  },
  {
    id: '219',
    label: 'Stylized Cartoon Comic',
    labelKey: 'kusa_styles.stylized_cartoon_comic',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[stylized-cartoon-comic-style]',
  },
  {
    id: '220',
    label: 'Warm Storybook',
    labelKey: 'kusa_styles.warm_storybook',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[warm-storybook-style]',
  },
  {
    id: '221',
    label: 'Classic Pixel Game Style',
    labelKey: 'kusa_styles.classic_pixel_game_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[classic-pixel-game-style]',
  },
  {
    id: '222',
    label: 'Morandi Color Style',
    labelKey: 'kusa_styles.morandi_color_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[morandi-color-style]',
  },
  {
    id: '223',
    label: 'Refined Fantasy Style',
    labelKey: 'kusa_styles.refined_fantasy_style',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[refined-fantasy-style]',
  },
  {
    id: '224',
    label: 'Layered Cel Anime',
    labelKey: 'kusa_styles.layered_cel_anime',
    category: 'Art',
    categoryKey: 'kusa_categories.art',
    value: '[layered-cel-anime-style]',
  },
];

export const GEMINI_LIMITS = {
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  MAX_SIZE: 20 * 1024 * 1024,
};

export const GENERAL_STYLES = {
  '[pop-anime-style]':
    'Generate in modern pop hand-drawn 2D anime style, as if from a modern Japanese anime. Use flat coloring, and flat cel-shading. Do not include text or any watermark.',
  '[retro-anime-style]':
    'Generate in late 1980s / early 1990s hand-drawn 2D vintage anime style, as if from a vintage Japanese anime. Use flat coloring, flat cel-shading, bold outlines, slightly muted and slightly warm colors, and slightly grainy texture. Do not include text or any watermark.',
  '[semi-realistic-portrait-style]':
    'Generate in a pretty Korean manhwa-inspired semi-realistic soft glossy digital illustration style, with lips also being glossy.',
  '[soft-pastel-style]':
    'Generate using the soft pastel art style, use soft pastel colors, gentle shading, slightly muted palette.',
  '[watercolor-illustration-style]':
    'Generate using the painterly watercolor style, where colors are layered with soft gradients, the art has visible brushstroke-like textures, softened delicate linework, shadows are painted in cool hues (bluish or purplish), while highlights are soft and luminous.',
  '[iridescent-style]':
    'Generate using the shimmering art style, with prominent iridescent light reflections on places like hair, soft glow, glossy shading, delicate linework, luminous highlights, shimmering light reflections.',
  '[flat-illustration-style]':
    'Generate in flat-color anime-style vector art with no linework, no gradient, only flat color blocks. Remove all outlines from input image if any.',
  '[doodle-style]':
    'Draw in minimalist chibi anime doodle style with thick lines, use extremely minimal simple doodle drawing and flat coloring.',
  '[chibi-sticker-style]':
    'Draw in flat chibi style, with chibi super deformed character in 2-head proportion, thick lines, flat coloring with only flat color blocks, and very minimalist simple drawing.',
  '[glossy-chibi-style]':
    'Draw in glossy chibi anime style with thick lines and glossy coloring, use minimal simple drawing and very chibi proportions.',
  '[muscular-manhwa-style]':
    'Illustrate in the style of a Korean manhwa with male character being very handsome, with broad shoulders, sharp facial features, and expressive eyes. Use semi-realistic rendering with clean linework, polished shading, and manhwa aesthetic.',
  '[manhwa-style]':
    'Illustrate in the style of beautiful manhwa webtoon with semi-realistic drawing, soft shading, cinematic panel feel, and polished professional finish, use very classic manhwa style.',
  '[action-manga-style]':
    'Illustrate in the style of shonen manga, with bold energetic linework, expressive dramatic poses and expressions, high contrast coloring, cinematic lighting.',
  '[grayscale-manga-style]':
    'Illustrate in the style of black and white Japanese manga.',
  '[3d-anime-style]':
    'Render as 3D model asset in 3D game engine, with smooth 3D polygonal modeling, glossy textures, 3D game engine model rendering, soft studio lighting, and 3D engine glow, bloom, reflections effects.',
  '[minimalist-style]':
    'Illustrate in minimalist art style, with flat coloring, only flat color blocks, thick lines, and very minimal simple drawing.',
  '[soft-pixel-art-style]':
    'Illustrate in pixel art style with soft color palette.',
  '[digital-painterly-style]':
    'Illustrate in digital painterly style, with soft graphite lineart combined, muted pastel palette, semi-realistic digital art.',
  '[gothic-oil-painting-style]':
    'Illustrate in gothic oil painting style with thick oil painterly texture, with slightly muted pastel colors and soft lighting, anime-inspired gothic oil painting.',
  '[pop-sketch-style]':
    'Illustrate in rough anime sketch style, loose hand-drawn lineart, flat muted multi-shaded gray or blue colors, minimal shading, casual anime-style doodle.',
  '[ukiyo-e-style]':
    'Illustrate in Ukiyo-e art style, with flat color scene, bold outlines, muted earth tones and intricate patterns.',
  '[retro-comic-dots-style]':
    'Illustrate in retro comic art style with Ben-Day dots and exaggerated features.',
  '[cyberpunk-style]':
    'Illustrate in futuristic cyberpunk style with high-contrast lighting, glitch effects, and neon lights.',
};

export const GRID_PROMPTS = {
  '<2x2-grid>':
    'Generate a 2x2 grid shotboards, with exactly 2 rows, and exactly 2 columns. All 4 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
  '<3x3-grid>':
    'Generate a 3x3 grid shotboards, with exactly 3 rows, and exactly 3 columns. All 9 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
  '<4x4-grid>':
    'Generate a 4x4 grid shotboards, with exactly 4 rows, and exactly 4 columns. All 16 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
  '<5x5-grid>':
    'Generate a 5x5 grid shotboards, with exactly 5 rows, and exactly 5 columns. All 25 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
  '<6x6-grid>':
    'Generate a 6x6 grid shotboards, with exactly 6 rows, and exactly 6 columns. All 36 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
  '<three-panel-strip>':
    'Design a mobile-optimized vertical scroll layout with 3 panels (3 rows and 1 column).',
  '<four-panel-strip>':
    'Design a mobile-optimized vertical scroll layout with 4 panels (4 rows and 1 column).',
  '<diagonal-panels>':
    'Arrange 3-4 panels diagonally across the page from top-left to bottom-right with varying sizes. Maintain panel tilts for dynamic energy, ensuring text placement remains readable in angled panels.',
  '<dominant-panel>':
    'Compose a page with one oversized central panel (60%+ area) surrounded by 2-3 smaller supporting panels. Use the central panel for key action/moment, with smaller panels showing reactions or context.',
  '<exploding-panel>':
    "Create a page with one 'exploding' panel - break its borders into 3-5 irregular shards overlapping adjacent panels. Use speed lines/impact effects while keeping 60% of the original panel area visible.",
  '<right-to-left>':
    'A Japanese manga panel, multiple right to left panels, read from right to left. Use screentone effects for shading and clean, bold line art.',
  '<exaggerated-right-to-left>':
    'A Japanese manga panel in a right-to-left format. Two or more panels. Use bold outlines, exaggerated features.',
};

export const BROAD_TYPES = {
  MESSAGE: 1,
  BROADCAST: 2,
} as const;

export const CONTENT_TYPES = {
  // 1 likes; 2 comment; 3 follow;4 oc collected;5 oc used; 6 featured;
  /** 点赞通知 */
  LIKES: 1,
  /** 评论通知 */
  COMMENT: 2,
  /** 评论回复通知 */
  REPLY_COMMENT: 14,
  /** 关注通知 */
  FOLLOW: 3,
  /** 角色收藏通知 */
  OC_COLLECTED: 4,
  /** 使用角色通知 */
  OC_USED: 5,
  /** 帖子精选通知 */
  FEATURED: 6,
  /**
   * @name 上榜单
   * @deprecated 徽章下发代替
   */
  IN_RANKING: 7,
  /** 官方通知 */
  OFFICIAL: 8,
  /** 评论点赞通知 */
  COMMENT_LIKES: 9,
  /** badge获得通知 */
  BADGE_EARNED: 10,
  /** CPP激活通知 */
  CPP_ACTIVED: 11,
  /** 需要充值通知 */
  SHOULD_CHARGE: 12,
  /** 标签请求通知 */
  TAG_REQUEST: 13,
} as const;

export const CONTENT_TABLE_NAME = {
  [CONTENT_TYPES.LIKES]: 'AppVotes',
  [CONTENT_TYPES.COMMENT]: 'AppComments',
  [CONTENT_TYPES.FOLLOW]: 'AppFollows',
  [CONTENT_TYPES.OC_COLLECTED]: 'CollectedCharacters',
};
