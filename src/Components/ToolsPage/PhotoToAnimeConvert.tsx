/* eslint-disable */
import { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import { useRouter } from 'next/router';
import {
  filterValidImage,
  mergeMediaData,
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
  ImageData,
} from './utils';
import { getImageSize, toastWarn, urlToBase64 } from '@/utils/index';
import { getCreateYoursData } from '../../utilities/tools';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Tooltip,
  Textarea,
  Input,
  Select,
  SelectItem,
} from '@nextui-org/react';
import UploadFile from '../UploadFile';
import MultiImageUploadArea, { MultiImageItem } from './MultiImageUploadArea';
import { MdOutlineAnimation } from 'react-icons/md';
import { ImportFromCharacterDropdown } from '../ImportFromCharacterDropdown';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import { FaDownload } from 'react-icons/fa6';
import { calculateStyleTransferCost } from '../../../api/tools/_zaps';
import { BsInfoCircleFill } from 'react-icons/bs';
import { BiSolidZap } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import {
  getI2iStyleNameKeyMappingSync,
  useI2iStyleTemplates,
  TemplateInputField,
} from '../StyleTemplatePicker/styles/index';
import { compressImage } from '../ImageUploader';
import { GEMINI_LIMITS } from '../../../api/_constants';
import { stitchImagesInBrowser } from '../../utils/stitchImagesInBrowser';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { loginModalAtom } from '../../state';

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any; // 允许其他可选参�?
};

interface ImagesResponse {
  data: ImageData[];
}

const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;
// const styleData = [
//   {
//     id: AnimeStyle.ANIME,
//     name: 'Anime',
//     key: 'styles.anime',
//     image: '/images/styles/anime.webp',
//     description:
//       'Classic Japanese animation style with vibrant colors and expressive features',
//   },
//   {
//     id: AnimeStyle.GHIBLI_ANIME,
//     name: 'Ghibli Anime',
//     key: 'styles.ghibliAnime',
//     image: '/images/styles/studio_ghibli_anime.webp',
//     description:
//       'Whimsical and detailed animation style inspired by Studio Ghibli films',
//   },
//   {
//     id: AnimeStyle.KOREAN_MANHWA,
//     name: 'Korean Manhwa',
//     key: 'styles.koreanManhwa',
//     image: '/images/styles/korean_manhwa.webp',
//     description:
//       'Colorful webtoon style with flowing panels and detailed character designs',
//   },
//   {
//     id: AnimeStyle.CARTOON,
//     name: 'Cartoon',
//     key: 'styles.cartoon',
//     image: '/images/styles/cartoon.webp',
//     description:
//       'Simplified, exaggerated style with bold outlines and flat colors',
//   },
//   {
//     id: AnimeStyle.PLUSHIE,
//     name: 'Plushie',
//     key: 'styles.plushie',
//     image: '/images/styles/plushie.webp',
//     description: 'Plushie style with soft, fluffy texture',
//   },
//   {
//     id: AnimeStyle.BADGE,
//     name: 'Badge',
//     key: 'styles.badge',
//     image: '/images/styles/badge.jpeg',
//     description: 'Badge style with glossy finish and metal backing',
//   },
//   {
//     id: AnimeStyle.STANDEE,
//     name: 'Standee',
//     key: 'styles.standee',
//     image: '/images/styles/standee.jpg',
//     description: 'Standee style with clear acrylic edges and glossy finish',
//   },
//   {
//     id: AnimeStyle.BODY_PILLOW,
//     name: 'Body Pillow',
//     key: 'styles.bodyPillow',
//     image: '/images/styles/body_pillow.webp',
//     description: 'Body Pillow style with soft, fluffy texture',
//   },
//   {
//     id: AnimeStyle.COSPLAY,
//     name: 'Cosplay',
//     key: 'styles.cosplay',
//     image: '/images/styles/cosplay.jpeg',
//     description: 'Cosplay style with realistic human body and clothing',
//   },
//   {
//     id: AnimeStyle.MANGA,
//     name: 'Manga',
//     key: 'styles.manga',
//     image: '/images/styles/manga.webp',
//     description:
//       'Black and white Japanese comic style with distinctive panel layouts and expressive line work',
//   },
//   {
//     id: AnimeStyle.INK_WASH,
//     name: 'Ink Wash Painting',
//     key: 'styles.inkWash',
//     image: '/images/styles/ink.webp',
//     description:
//       'Traditional East Asian painting style with flowing ink gradients',
//   },
//   {
//     id: AnimeStyle.STICKER,
//     name: 'Sticker',
//     key: 'styles.sticker',
//     image: '/images/styles/sticker.webp',
//     description:
//       'Flat, vibrant art style with bold outlines perfect for stickers and decals',
//   },
//   {
//     id: AnimeStyle.CHIBI,
//     name: 'Chibi Stickers',
//     key: 'styles.chibi',
//     image: '/images/styles/chibi.webp',
//     description: 'Small, chibi character in different moods',
//   },
//   {
//     id: AnimeStyle.CHARACTER_SHEET,
//     name: 'Character Sheet',
//     key: 'styles.characterSheet',
//     image: '/images/styles/character_sheet.webp',
//     description: 'Character sheet style with bold outlines and flat colors',
//   },
//   {
//     id: AnimeStyle.SPRITE_SHEET,
//     name: 'Sprite Sheet',
//     key: 'styles.spriteSheet',
//     image: '/images/styles/sprite_sheet.webp',
//     description: 'Sprite sheet in pixel art style',
//   },
//   {
//     id: AnimeStyle.SIMPSONS,
//     name: 'Simpsons',
//     key: 'styles.simpsons',
//     image: '/images/styles/simpsons.webp',
//     description: 'The Simpsons style with bold outlines and flat colors',
//   },
//   {
//     id: AnimeStyle.RICK_AND_MORTY,
//     name: 'Rick and Morty',
//     key: 'styles.rickAndMorty',
//     image: '/images/styles/rick_and_morty.webp',
//     description:
//       'Distinctive style from the popular adult animated sci-fi series',
//   },
//   {
//     id: AnimeStyle.SOUTH_PARK,
//     name: 'South Park',
//     key: 'styles.southPark',
//     image: '/images/styles/south_park.webp',
//     description:
//       'Simple, cut-out paper style animation with basic shapes and bold colors',
//   },
//   {
//     id: AnimeStyle.NARUTO,
//     name: 'Naruto',
//     key: 'styles.naruto',
//     image: '/images/styles/naruto.webp',
//     description: 'Distinctive style from the popular anime series Naruto',
//   },
//   {
//     id: AnimeStyle.ONE_PIECE,
//     name: 'One Piece',
//     key: 'styles.onePiece',
//     image: '/images/styles/one_piece.webp',
//     description: 'Distinctive style from the popular anime series One Piece',
//   },
//   {
//     id: AnimeStyle.MY_LITTLE_PONY,
//     name: 'My Little Pony',
//     key: 'styles.myLittlePony',
//     image: '/images/styles/my_little_pony.webp',
//     description:
//       'Colorful and magical style inspired by the My Little Pony series, featuring vibrant characters and whimsical settings',
//   },
//   {
//     id: AnimeStyle.WATERCOLOR,
//     name: 'Watercolor',
//     key: 'styles.watercolor',
//     image: '/images/styles/watercolor.webp',
//     description:
//       'Soft, translucent colors with gentle blending and artistic brush strokes',
//   },
//   {
//     id: AnimeStyle.ACTION_FIGURE,
//     name: 'Action Figure',
//     key: 'styles.actionFigure',
//     image: '/images/styles/action_figure.webp',
//     description:
//       'Stylized 3D toy-like appearance with glossy finish and articulated features',
//   },
//   {
//     id: AnimeStyle.FIGURE_IN_BOX,
//     name: 'Figure Box',
//     key: 'styles.figureInBox',
//     image: '/images/styles/figure_in_box.webp',
//     description: 'Collectible figure style presented in packaging display box',
//   },
//   {
//     id: AnimeStyle.DOLL_BOX,
//     name: 'Figure Box 2',
//     key: 'styles.dollBox',
//     image: '/images/styles/action_box.webp',
//     description:
//       'Stylized 3D toy-like appearance with glossy finish and articulated features',
//   },
//   {
//     id: AnimeStyle.BARBIE_DOLL,
//     name: 'Barbie Doll',
//     key: 'styles.barbieDoll',
//     image: '/images/styles/barbie_doll.webp',
//     description: 'Barbie doll style with pastel colors and retro aesthetics',
//   },
//   {
//     id: AnimeStyle.LINE_ART,
//     name: 'Line Art',
//     key: 'styles.lineArt',
//     image: '/images/styles/lineart.webp',
//     description: 'Clean, monochromatic outlines with minimal or no fill colors',
//   },
//   {
//     id: AnimeStyle.ORIGAMI_PAPER_ART,
//     name: 'Origami Paper Art',
//     key: 'styles.origamiPaperArt',
//     image: '/images/styles/origami_paper_art.webp',
//     description: 'Folded paper aesthetic with geometric shapes and clean edges',
//   },
//   {
//     id: AnimeStyle.LEGO,
//     name: 'Lego',
//     key: 'styles.lego',
//     image: '/images/styles/lego.webp',
//     description:
//       'Blocky, plastic brick aesthetic with signature Lego minifigure styling',
//   },
//   {
//     id: AnimeStyle.LOW_POLY,
//     name: 'Low Poly',
//     key: 'styles.lowPoly',
//     image: '/images/styles/low_poly.webp',
//     description: 'Low-poly, blocky style with geometric shapes and clean edges',
//   },
//   {
//     id: AnimeStyle.CLAY,
//     name: 'Claymation',
//     key: 'styles.clay',
//     image: '/images/styles/clay.webp',
//     description:
//       'Textured, handcrafted appearance similar to claymation or sculpted figures',
//   },
//   {
//     id: AnimeStyle.PIXEL_ART,
//     name: 'Pixel Art',
//     key: 'styles.pixelArt',
//     image: '/images/styles/minecraft.webp',
//     description:
//       'Retro digital art style with visible pixels and limited color palettes',
//   },
//   {
//     id: AnimeStyle.VAPORWAVE,
//     name: 'Vaporwave',
//     key: 'styles.vaporwave',
//     image: '/images/styles/vaporwave.webp',
//     description: 'Vaporwave style with pastel colors and retro aesthetics',
//   },
//   {
//     id: AnimeStyle.CYBERPUNK,
//     name: 'Cyberpunk',
//     key: 'styles.cyberpunk',
//     image: '/images/styles/cyberpunk-photo.webp',
//     description:
//       'Futuristic cyberpunk style with neon-lit environments and dark atmospheric mood',
//   },
// ];

const imagesAPI = async (params: ImageApiParams): Promise<ImagesResponse> => {
  const response = await fetch('/api/tools/image-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

interface PhotoToAnimeAPIParams {
  inputImage: string;
  selectedStyle: string;
  prompt?: string;
  needMiddleware?: boolean;
  variables?: {
    characterName?: string;
    occupation?: string;
    language?: string;
    info?: string;
  };
}
const photoToAnimeAPI = async ({
  inputImage,
  selectedStyle,
  prompt,
  needMiddleware,
  variables,
}: PhotoToAnimeAPIParams): Promise<{
  output: string;
  error?: string;
  error_code?: number;
}> => {
  const imageSize = await getImageSize(inputImage);
  const aspectRatio = imageSize.width / (imageSize.height || 1);
  let width = imageSize.width;
  let height = imageSize.height;
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / aspectRatio;
  }
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * aspectRatio;
  }

  const params = {
    image_url: inputImage,
    style_id: selectedStyle,
    mode: prompt && prompt.length > 0 ? 'custom' : 'template',
    tool: 'photo-to-anime',
    custom_prompt: prompt,
    variables,
    need_middleware: needMiddleware,
  };

  const response = await fetch('/api/tools/style-transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return { error: 'Generate image failed', output: '' };
  }

  const data = await response.json();
  if (data.error === '429') {
    return { error: 'Resource has been exhausted', output: '' };
  }
  if (data.output) {
    return { output: data.output, error: '' };
  }
  return data;
};

const getId = genId();

function PhotoToAnimeConvert({
  selectedStyle: selectedStylePreset,
  exampleImageUrl = '/images/examples/photo-to-anime/girl_anime.webp',
}: {
  selectedStyle?: string;
  exampleImageUrl?: string;
}) {
  const { t } = useTranslation('photo-to-anime');
  const { t: tStyles } = useTranslation('style-templates');
  const router = useRouter();
  const styleMode = 'prompt' as const;
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [submitBtnText, setSubmitBtnText] = useState(t('button.convert'));
  // Map legacy AnimeStyle enum values to template IDs used by StyleTemplatePicker
  const enumToTemplateId: Record<string, string> = {
    anime: 'anime',
    korean_manhwa: 'korean-manhwa',
    manga: 'manga',
    chibi: 'chibi-stickers',
    ghibli_anime: 'ghibli-anime',
    action_figure: 'action-figure',
    figure_in_box: 'figure-box',
    sticker: 'sticker',
    origami_paper_art: 'origami',
    line_art: 'line-art',
    cartoon: 'cartoon',
    rick_and_morty: 'rick-and-morty',
    south_park: 'south-park',
    lego: 'toy-bricks',
    claymation: 'clay',
    pixel_art: 'pixel-art',
    watercolor: 'watercolor',
    ink_wash: 'ink-wash-painting',
    goku: 'goku',
    simpsons: 'the-simpsons',
    naruto: 'naruto',
    one_piece: 'monkey-d-luffy',
    my_little_pony: 'my-little-pony',
    vaporwave: 'vaporwave',
    low_poly: 'low-poly',
    barbie_doll: 'barbie',
    doll_box: 'figure-box',
    character_sheet: 'character-sheet',
    sprite_sheet: 'sprite-sheet',
    plushie: 'plushie',
    badge: 'badge',
    standee: 'standee',
    body_pillow: 'body-pillow',
    cyberpunk: 'cyberpunk',
    cosplay: 'cosplay',
  };

  const normalizeStyleId = (s?: string) =>
    s ? enumToTemplateId[s] || s : undefined;

  const normalizedDefaultStyle = useMemo(
    () => normalizeStyleId(selectedStylePreset) || 'anime',
    [selectedStylePreset],
  );

  const [selectedStyle, setSelectedStyle] = useState<string>(
    normalizedDefaultStyle,
  );

  // 使用优化的模板数据管�?Hook
  const {
    templates: i2iStyleTemplatesCategories,
    isLoading: templatesLoading,
    error: templatesError,
  } = useI2iStyleTemplates();

  useEffect(() => {
    if (!router.isReady) return;
    const rawStyle = router.query.style;
    if (typeof rawStyle !== 'string' || rawStyle.length === 0) {
      return;
    }

    const normalized = normalizeStyleId(rawStyle);
    if (!normalized) {
      return;
    }

    setSelectedStyle(normalized);

    const newQuery = { ...router.query } as Record<string, any>;
    delete newQuery.style;
    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, router.query.style]);

  const selectedStyleName = useMemo(() => {
    const styleNameKeyMapping = getI2iStyleNameKeyMappingSync();
    const key = styleNameKeyMapping[selectedStyle];
    return key ? tStyles(key) : selectedStyle;
  }, [selectedStyle, tStyles]);

  const { inputImage, setInputImage, mediaItem } = useProcessInitialImage();

  // Multi-image state for templates with input_media config
  const [inputImages, setInputImages] = useState<MultiImageItem[]>([]);

  // Get current template's input_media config for multi-image support
  const currentInputMedia = useMemo(() => {
    if (!i2iStyleTemplatesCategories) return null;

    for (const cat of i2iStyleTemplatesCategories) {
      const tpl = cat.templates.find((t: any) => t.id === selectedStyle);
      if (tpl && (tpl as any).input_media) {
        const inputMediaArray = (tpl as any).input_media;
        // Find the first image type input_media
        const imageMedia = inputMediaArray.find(
          (media: any) => media.media_type === 'image',
        );
        if (imageMedia && imageMedia.max_count > 1) {
          return imageMedia;
        }
      }
    }
    return null;
  }, [selectedStyle, i2iStyleTemplatesCategories]);

  const isMultiImageMode = currentInputMedia && currentInputMedia.max_count > 1;

  // Reset inputImages when switching templates or when multi-image mode changes
  useEffect(() => {
    if (!isMultiImageMode && inputImages.length > 0) {
      // Clean up blob URLs
      inputImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      setInputImages([]);
    }
  }, [isMultiImageMode, selectedStyle]);

  // Character input states for Komiko templates
  const [characterName, setCharacterName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [language, setLanguage] = useState('English');
  const [characterInfo, setCharacterInfo] = useState('');
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);

  // Custom fields values for dynamic fields
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});

  // Language options - key is English name for model, label is native name for display
  const languageOptions = [
    { code: 'en', key: 'English', label: 'English' },
    { code: 'es', key: 'Spanish', label: 'Español' },
    { code: 'ja', key: 'Japanese', label: '日本語' },
    { code: 'zh-CN', key: 'Simplified Chinese', label: '简体中文' },
    { code: 'zh-TW', key: 'Traditional Chinese', label: '繁體中文' },
    { code: 'ko', key: 'Korean', label: '한국어' },
    { code: 'de', key: 'German', label: 'Deutsch' },
    { code: 'fr', key: 'French', label: 'Français' },
    { code: 'pt', key: 'Portuguese', label: 'Português' },
    { code: 'id', key: 'Indonesian', label: 'Bahasa Indonesia' },
    { code: 'hi', key: 'Hindi', label: 'हिंदी' },
    { code: 'ru', key: 'Russian', label: 'Русский' },
    { code: 'vi', key: 'Vietnamese', label: 'Tiếng Việt' },
    { code: 'th', key: 'Thai', label: 'ไทย' },
  ];

  // Get current template's needsCharacterInputs
  const currentTemplateInputs = useMemo(() => {
    if (!i2iStyleTemplatesCategories) return null;

    for (const cat of i2iStyleTemplatesCategories) {
      const tpl = cat.templates.find((t: any) => t.id === selectedStyle);
      if (tpl && (tpl as any).needsCharacterInputs) {
        const inputs = (tpl as any).needsCharacterInputs;
        // Handle both old string[] format and new TemplateInputField[] format
        if (Array.isArray(inputs) && inputs.length > 0) {
          if (typeof inputs[0] === 'string') {
            // Old string[] format - convert to TemplateInputField format
            return inputs.map(input => ({
              input_field: input,
              placeholder: null,
            }));
          } else {
            // New TemplateInputField[] format
            return inputs;
          }
        }
      }
    }
    return null;
  }, [selectedStyle, i2iStyleTemplatesCategories]);

  // 获取当前模板是否需�?middleware 处理
  const currentTemplateNeedMiddleware = useMemo(() => {
    if (!i2iStyleTemplatesCategories) return false;

    for (const cat of i2iStyleTemplatesCategories) {
      const tpl = cat.templates.find((t: any) => t.id === selectedStyle);
      if (tpl) {
        return (tpl as any).needMiddleware || false;
      }
    }
    return false;
  }, [selectedStyle, i2iStyleTemplatesCategories]);

  // Sync language with i18n locale
  useEffect(() => {
    const locale = router.locale || localStorage.getItem('lang') || 'en';
    const matched = languageOptions.find(opt => opt.code === locale);
    if (matched) {
      setLanguage(matched.key);
    }
  }, [router.locale]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const loginModal = useAtomValue(loginModalAtom);

  // Fetch character data when characterId comes from URL
  useEffect(() => {
    const fetchCharacterData = async () => {
      const charId = mediaItem?.characterId;
      if (!charId) return;

      setIsLoadingCharacter(true);
      try {
        const response = await fetch(
          `/api/getCharacterProfile?uniqid=${charId}`,
        );
        if (response.ok) {
          const character = await response.json();
          if (character.character_name) {
            setCharacterName(character.character_name);
          }
          if (character.profession) {
            setOccupation(character.profession);
          }
          if (character.intro || character.character_description) {
            setCharacterInfo(
              character.intro || character.character_description,
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch character data:', error);
      } finally {
        setIsLoadingCharacter(false);
      }
    };

    fetchCharacterData();
  }, [mediaItem?.characterId]);
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: exampleImageUrl,
      prompt: t('common:exampleResult'),
    },
  ]);

  // Calculate cost based on selected style's model
  const cost = useMemo(() => {
    if (!i2iStyleTemplatesCategories)
      return calculateStyleTransferCost(
        styleMode === 'prompt' ? 'custom' : 'template',
        'photo-to-anime',
        undefined,
      );

    // Check if selected style uses Pro model
    let isProModel = false;
    for (const cat of i2iStyleTemplatesCategories) {
      const tpl = cat.templates.find((t: any) => t.id === selectedStyle);
      if (tpl && (tpl as any).isProModel) {
        isProModel = true;
        break;
      }
    }
    const model = isProModel ? 'gemini-3-pro-image-preview' : undefined;
    return calculateStyleTransferCost(
      styleMode === 'prompt' ? 'custom' : 'template',
      'photo-to-anime',
      model,
    );
  }, [selectedStyle, i2iStyleTemplatesCategories]);
  const { submit: openModal } = useOpenModal();
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get style from meta_data
        if (generation.meta_data) {
          const styleId = generation.meta_data.style_id;
          const generationMode = generation.meta_data.mode;
          if (styleId && generationMode !== 'prompt') {
            if (styleId == 'expression-sheet') {
              setSelectedStyle('character-expression-sheet');
            } else {
              setSelectedStyle(styleId);
            }
          }
        }

        // get prompt
        if (generation.prompt) {
          setCustomStylePrompt(generation.prompt);
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  // 监听 selectedStylePreset 的变化，确保路由切换时能正确更新
  useEffect(() => {
    if (selectedStylePreset) {
      const normalized = normalizeStyleId(selectedStylePreset) || 'anime';
      setSelectedStyle(normalized);
    }
  }, [selectedStylePreset]);

  // 按创建时间降序排序，示例图片保持在最�?
  const sortByCreatedAt = (data: ImageData[]) => {
    return data.sort((a, b) => {
      // 示例图片永远在最�?
      if (a.id === -1) return 1;
      if (b.id === -1) return -1;
      // 生成中的项目（无 created_at）在最�?
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return -1;
      if (!b.created_at) return 1;
      // �?created_at 降序排列（最新的在前�?
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  };

  const fetchImages = async (needMerge?: boolean) => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'photo_to_anime',
        prompt: selectedStyle,
      });
      if (response.data) {
        const subs = await filterValidImage(response.data);
        if (!subs.length) {
          return;
        }
        if (!needMerge) {
          setResultImages(resultImages => {
            const existingIds = new Set(subs.map(s => s.id));
            const filtered = resultImages.filter(
              d => d.id !== -1 && !existingIds.has(d.id),
            );
            // 合并后按创建时间排序
            return sortByCreatedAt([...filtered, ...subs]);
          });
          return;
        }
        setResultImages(resultImages => {
          const oldData = mergeMediaData(
            resultImages,
            subs,
            'url_path',
          ) as ImageData[];
          // 合并后按创建时间排序
          return sortByCreatedAt([...oldData]);
        });
      }
    } catch (error: any) {
      console.error('fetchImages failed', error);
      if (error.message.indexOf('401')) {
        return;
      }
      toast.error(t('toast.fetchFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  useEffect(() => {
    isAuth && fetchImages();
  }, [isAuth]);

  const handleDeleteClick = (imageId: number) => {
    if (typeof imageId === 'number' && imageId < 0) {
      setResultImages(resultImages =>
        resultImages.filter(d => d.id !== imageId),
      );
      return;
    }
    setImageToDelete(imageId);
    setDeleteModalOpen(true);
  };

  // 确认删除时使用保存的 ID
  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (imageToDelete) {
      try {
        const response = await imagesAPI({
          method: 'deleteImage',
          tool: 'photo_to_anime',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete);
          toast.success(t('toast.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteVideo failed');
          toast.error(t('toast.deleteFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setImageToDelete(null); // 清除保存�?ID
      } catch (error) {
        console.error('deleteImage failed', error);
        toast.error(t('toast.deleteFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${Date.now()}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // 释放 URL 对象
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toast.downloadFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  const handleChange = async (url: string) => {
    // 如果是用户上传的文件（blob URL），则需要转换为base64
    if (url.startsWith('blob:')) {
      const base64Data = await urlToBase64(url);
      setInputImage(base64Data, false); // 标记为用户上�?
    } else {
      // 如果是从其他工具传来的URL，直接使�?
      setInputImage(url, false); // 标记为用户上�?
    }
  };

  const refreshList = async (id: number, resultUrl: string) => {
    await dispatchGenerated(id);
    setResultImages(resultVideos => {
      const index = resultVideos.findIndex(d => d.id === id);
      resultVideos[index] = {
        id,
        url_path: resultUrl,
      };
      if (index > -1) {
        return [...resultVideos];
      }
      return resultVideos;
    });
  };

  const handleCustomStylePromptChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomStylePrompt(e.target.value);
  };

  useEffect(() => {
    setSubmitBtnText(t('button.convert', { style: selectedStyleName }));
  }, [selectedStyleName]);

  const handleSubmit = async () => {
    if (profile.credit < cost) {
      // toast.error(t('toast.purchaseZaps'), {
      //   position: "top-center",
      //   style: {
      //     background: "#555",
      //     color: "#fff",
      //   },
      // });
      openModal('pricing');
      return;
    }

    setLoading(true);
    try {
      const id = getId();
      setResultImages([
        {
          id,
          url_path: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultImages.filter(d => d.id !== -1),
      ]);
      setLoading(false);

      // Handle multi-image mode: stitch images together
      let imageToProcess = inputImage;

      if (isMultiImageMode && inputImages.length > 0) {
        if (inputImages.length > 1) {
          // Stitch multiple images into one
          const imageUrls = inputImages.map(img => img.url);
          const imageNames = inputImages.map(img => img.name);

          try {
            const stitchedBlob = await stitchImagesInBrowser({
              imageUrls,
              imageNames,
              aspectRatio: '16:9', // Default aspect ratio for stitching
            });

            // Convert blob to base64
            imageToProcess = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(stitchedBlob);
            });
          } catch (error) {
            console.error('Failed to stitch images:', error);
            toast.error(
              t('toast.stitchingFailed', 'Failed to process images'),
              {
                position: 'top-center',
                style: { background: '#555', color: '#fff' },
              },
            );
            setResultImages(resultVideos => {
              const index = resultVideos.findIndex(d => d.id === id);
              if (index > -1) {
                resultVideos.splice(index, 1);
                return [...resultVideos];
              }
              return resultVideos;
            });
            return;
          }
        } else if (inputImages.length === 1) {
          // Single image in multi-image mode, use it directly
          imageToProcess = inputImages[0].url;
        }
      }

      // compress image
      const imageSize = await getImageSize(imageToProcess);
      let finalImage = imageToProcess;
      if (
        imageToProcess.length > GEMINI_LIMITS.MAX_SIZE ||
        imageSize.width > GEMINI_LIMITS.MAX_WIDTH ||
        imageSize.height > GEMINI_LIMITS.MAX_HEIGHT
      ) {
        const compressedImage = await compressImage(
          imageToProcess,
          GEMINI_LIMITS.MAX_WIDTH,
          GEMINI_LIMITS.MAX_HEIGHT,
        );

        finalImage = compressedImage;
      }

      // 调用 API 处理图片
      const startTime = Date.now();

      // 构建变量对象
      const apiVariables = currentTemplateInputs
        ? {
            characterName,
            occupation,
            language,
            info: characterInfo,
            ...customFieldValues, // 添加自定义字段�?
          }
        : undefined;

      const result = await photoToAnimeAPI({
        inputImage: finalImage,
        selectedStyle,
        prompt: styleMode === 'prompt' ? customStylePrompt : '',
        needMiddleware: currentTemplateNeedMiddleware,
        variables: apiVariables,
      });

      if (result.error) {
        if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          toastWarn(t('toast:common.rateLimitExceeded'));
        } else {
          toast.error(result.error, {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setResultImages(resultVideos => {
          const index = resultVideos.findIndex(d => d.id === id);
          if (index > -1) {
            resultVideos.splice(index, 1);
            return [...resultVideos];
          }
          return resultVideos;
        });
        return;
      }

      setProfile(profile => ({
        ...profile,
        credit: profile.credit - cost,
      }));

      const resultUrl = result.output;
      await refreshList(id, resultUrl);

      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'photo_to_anime',
        url_path: resultUrl,
        id: null,
        prompt: styleMode === 'prompt' ? customStylePrompt : '',
        meta_data: JSON.stringify(
          styleMode === 'prompt'
            ? {
                mode: styleMode,
              }
            : {
                style_id: selectedStyle,
                style_name: selectedStyleName,
                mode: styleMode,
              },
        ),
      });

      if (response.data && response.data.length > 0) {
        console.log('generateVideo success');
        const data = response.data[0];
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index > -1) {
            resultImages[index] = {
              id: data.id,
              url_path: data.url_path,
              prompt: styleMode === 'prompt' ? customStylePrompt : '',
              meta_data: JSON.stringify(
                styleMode === 'prompt'
                  ? {
                      mode: styleMode,
                    }
                  : {
                      style_id: selectedStyle,
                      style_name: selectedStyleName,
                      mode: styleMode,
                    },
              ),
            };
            return [...resultImages];
          }
          return resultImages;
        });

        toast.success(t('toast.conversionDone'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error(t('toast.conversionFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('photo to anime failed:', error);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('toast.noZaps'), {
        //   position: "top-center",
        //   style: {
        //     background: "#555",
        //     color: "#fff",
        //   },
        // });
        openModal('pricing');
        return;
      }
      toast.error(t('toast.generateFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className='flex flex-col md:flex-row gap-4 md:gap-4 lg:gap-6'>
      {/* Left input area */}
      <div className='w-full md:flex-none md:w-5/12 lg:w-5/12'>
        <Card
          className={`p-4 md:p-6 md:pt-4 transition-all duration-300 ${TOOL_CARD_STYLES.inputCard}`}>
          <div className='flex justify-between items-center mb-3 md:mb-6'>
            <h2 className='flex items-center text-base font-bold text-primary-800 dark:text-primary-300'>
              {t('convertTitle')}
            </h2>

            <Tooltip content={t('infoTooltip')} color='primary'>
              <span>
                <BsInfoCircleFill className='text-primary-500 dark:text-primary-400' />
              </span>
            </Tooltip>
          </div>

          <div className='mb-2'>
            <Textarea
              placeholder={t('ui.prompt.placeholder')}
              value={customStylePrompt}
              onChange={handleCustomStylePromptChange}
              minRows={3}
              variant='flat'
              className='mb-2'
              classNames={{
                inputWrapper: 'dark:!bg-input',
                input: 'dark:!bg-transparent dark:!text-foreground',
              }}
            />
            <p className='text-xs text-muted-foreground'>
              {t('ui.prompt.example')}
            </p>
          </div>

          <div className='mb-4 md:mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-bold text-foreground text-sm'>
                {isMultiImageMode
                  ? t('ui.input.images.title', 'Images')
                  : t('ui.input.image.title', 'Image')}
              </h3>
              <ImportFromCharacterDropdown
                fetchFullData
                onSelect={char => {
                  setCharacterName(char.character_name || '');
                  setOccupation(char.profession || '');
                  setCharacterInfo(
                    char.intro || char.character_description || '',
                  );
                  if (char.character_pfp) {
                    const pfpUrl = char.character_pfp;
                    if (isMultiImageMode) {
                      // Check if max_count limit is reached before adding
                      const maxCount = currentInputMedia?.max_count || 3;
                      if (inputImages.length >= maxCount) {
                        toast.error(
                          t('toast.maxImagesReached', {
                            max: maxCount,
                            defaultValue: `Maximum ${maxCount} images allowed`,
                          }),
                          {
                            position: 'top-center',
                            style: { background: '#555', color: '#fff' },
                          },
                        );
                        return;
                      }
                      // Add to multi-image list
                      setInputImages(prev => [
                        ...prev,
                        {
                          id: `char-${Date.now()}`,
                          url: pfpUrl,
                          name: char.character_name || 'Character',
                        },
                      ]);
                    } else {
                      setInputImage(pfpUrl, false);
                    }
                  }
                }}
              />
            </div>
            {isMultiImageMode ? (
              <MultiImageUploadArea
                images={inputImages}
                onImagesChange={setInputImages}
                minCount={currentInputMedia?.min_count || 1}
                maxCount={currentInputMedia?.max_count || 3}
                accept='.png,.jpg,.jpeg,.webp'
              />
            ) : (
              <UploadFile
                onChange={handleChange}
                accept='.png,.jpg,.jpeg,.webp'
                initialImage={inputImage}
              />
            )}
          </div>

          {/* Character Input Section for Komiko Templates */}
          {currentTemplateInputs && currentTemplateInputs.length > 0 && (
            <div className='mb-4 md:mb-6'>
              <h3 className='font-bold text-foreground text-sm mb-2'>
                {t('ui.characterInfo', 'Character Info')}
              </h3>
              <div className='space-y-3'>
                {currentTemplateInputs?.map(inputField => {
                  const fieldName = inputField.input_field;
                  const fieldType = inputField.type || 'text';
                  const placeholder = inputField.placeholder;
                  const label = t(
                    `ui.${fieldName}`,
                    fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
                  ) as string;

                  // 处理选择
                  const hasChoices =
                    (fieldType === 'choice' && inputField.choices) ||
                    inputField.options;
                  const choiceOptions =
                    inputField.options || inputField.choices;

                  if (hasChoices && choiceOptions) {
                    // 如果有question字段，使用Select下拉�?
                    if (inputField.question) {
                      const getCurrentValue = () => {
                        switch (fieldName) {
                          case 'characterName':
                            return characterName ? [characterName] : [];
                          case 'occupation':
                            return occupation ? [occupation] : [];
                          case 'language':
                            return language ? [language] : [];
                          case 'characterInfo':
                            return characterInfo ? [characterInfo] : [];
                          default:
                            // 处理自定义字�?
                            return customFieldValues[fieldName]
                              ? [customFieldValues[fieldName]]
                              : [];
                        }
                      };

                      const handleSelectionChange = (keys: any) => {
                        const selected = Array.from(keys)[0] as string;
                        if (selected) {
                          switch (fieldName) {
                            case 'characterName':
                              setCharacterName(selected);
                              break;
                            case 'occupation':
                              setOccupation(selected);
                              break;
                            case 'language':
                              setLanguage(selected);
                              break;
                            case 'characterInfo':
                              setCharacterInfo(selected);
                              break;
                            default:
                              // 处理自定义字�?
                              setCustomFieldValues(prev => ({
                                ...prev,
                                [fieldName]: selected,
                              }));
                              break;
                          }
                        }
                      };

                      return (
                        <div key={fieldName} className='space-y-2'>
                          <label className='text-sm font-medium text-foreground block'>
                            {inputField.questionKey
                              ? t(inputField.questionKey)
                              : inputField.question}
                          </label>
                          <Select
                            radius='md'
                            placeholder={`Select...`}
                            selectedKeys={getCurrentValue()}
                            onSelectionChange={handleSelectionChange}
                            variant='flat'
                            size='sm'
                            classNames={{
                              value: 'whitespace-normal',
                            }}>
                            {choiceOptions.map((choice, index) => {
                              const label = choice?.labelKey
                                ? t(choice.labelKey)
                                : choice?.label ||
                                  choice?.text ||
                                  choice?.name ||
                                  choice?.value ||
                                  `option-${index}`;
                              const value =
                                choice?.value || choice?.id || label;
                              return (
                                <SelectItem
                                  key={value}
                                  classNames={{
                                    base: 'data-[hover=true]:bg-primary-50',
                                    title:
                                      'whitespace-normal break-words leading-relaxed',
                                  }}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </Select>
                        </div>
                      );
                    }
                  }

                  // 现有的字段处理逻辑
                  if (fieldName === 'characterName') {
                    return (
                      <Input
                        key={fieldName}
                        radius='md'
                        label={t('ui.characterName', 'Character Name')}
                        placeholder={
                          placeholder ||
                          t(
                            'ui.characterNamePlaceholder',
                            'Enter character name...',
                          )
                        }
                        value={characterName}
                        onValueChange={setCharacterName}
                        variant='flat'
                        size='sm'
                        isDisabled={isLoadingCharacter}
                        classNames={{
                          // dark mode: content2 层级�?374151），�?Card 背景 content1�?1f2937）稍亮，创造层次感
                          inputWrapper: 'dark:!bg-input',
                          input: 'dark:!bg-transparent dark:!text-foreground',
                        }}
                      />
                    );
                  }

                  if (fieldName === 'occupation') {
                    return (
                      <Input
                        key={fieldName}
                        radius='md'
                        label={t('ui.occupation', 'Occupation')}
                        placeholder={
                          placeholder ||
                          t(
                            'ui.occupationPlaceholder',
                            'e.g., Uber Driver, Student, Detective...',
                          )
                        }
                        value={occupation}
                        onValueChange={setOccupation}
                        variant='flat'
                        size='sm'
                        isDisabled={isLoadingCharacter}
                        classNames={{
                          // dark mode: content2 层级�?374151），�?Card 背景 content1�?1f2937）稍亮，创造层次感
                          inputWrapper: 'dark:!bg-input',
                          input: 'dark:!bg-transparent dark:!text-foreground',
                        }}
                      />
                    );
                  }

                  if (fieldName === 'language') {
                    return (
                      <Select
                        key={fieldName}
                        radius='md'
                        label={t('ui.language', 'Language')}
                        selectedKeys={[language]}
                        onSelectionChange={keys => {
                          const selected = Array.from(keys)[0] as string;
                          if (selected) setLanguage(selected);
                        }}
                        variant='flat'
                        size='sm'>
                        {languageOptions.map(option => (
                          <SelectItem key={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    );
                  }

                  if (fieldName === 'characterInfo') {
                    return (
                      <Textarea
                        key={fieldName}
                        radius='md'
                        label={t('ui.characterInfo', 'Character Info')}
                        placeholder={
                          placeholder ||
                          t(
                            'ui.characterInfoPlaceholder',
                            'Enter character background, story, or description...',
                          )
                        }
                        value={characterInfo}
                        onValueChange={setCharacterInfo}
                        variant='flat'
                        size='sm'
                        minRows={2}
                        maxRows={4}
                        isClearable
                        classNames={{
                          // dark mode: content2 层级�?374151），�?Card 背景 content1�?1f2937）稍亮，创造层次感
                          inputWrapper: 'dark:!bg-input',
                          input: 'dark:!bg-transparent dark:!text-foreground',
                        }}
                      />
                    );
                  }

                  // 处理未明确定义的自定义字�?
                  if (
                    ![
                      'characterName',
                      'occupation',
                      'language',
                      'characterInfo',
                    ].includes(fieldName)
                  ) {
                    const isTextarea =
                      fieldType === 'textarea' ||
                      (typeof placeholder === 'string' &&
                        placeholder.length > 50);

                    if (isTextarea) {
                      return (
                        <Textarea
                          key={fieldName}
                          radius='md'
                          label={label}
                          placeholder={placeholder || `Enter ${fieldName}...`}
                          value={customFieldValues[fieldName] || ''}
                          onValueChange={value => {
                            setCustomFieldValues(prev => ({
                              ...prev,
                              [fieldName]: value,
                            }));
                          }}
                          variant='flat'
                          size='sm'
                          minRows={2}
                          maxRows={4}
                          classNames={{
                            // dark mode: content2 层级�?374151），�?Card 背景 content1�?1f2937）稍亮，创造层次感
                            inputWrapper: 'dark:!bg-input',
                            input: 'dark:!bg-transparent dark:!text-foreground',
                          }}
                        />
                      );
                    } else {
                      return (
                        <Input
                          key={fieldName}
                          radius='md'
                          label={label}
                          placeholder={placeholder || `Enter ${fieldName}...`}
                          value={customFieldValues[fieldName] || ''}
                          onValueChange={value => {
                            setCustomFieldValues(prev => ({
                              ...prev,
                              [fieldName]: value,
                            }));
                          }}
                          variant='flat'
                          size='sm'
                          classNames={{
                            // dark mode: content2 层级�?374151），�?Card 背景 content1�?1f2937）稍亮，创造层次感
                            inputWrapper: 'dark:!bg-input',
                            input: 'dark:!bg-transparent dark:!text-foreground',
                          }}
                        />
                      );
                    }
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          <div className='mb-2'>
            <PublicVisibilityToggle
              isPublic={isPublic}
              onToggle={setIsPublic}
              label={t('common:publicVisibility.label')}
              tooltip={t('common:publicVisibility.tooltip')}
              variant='section'
            />
          </div>

          {/* Submit button */}
          <Button
            isLoading={loading}
            color='primary'
            className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
            size='lg'
            onPress={() => {
              if (!isAuth) {
                loginModal?.onOpen?.();
              } else {
                handleSubmit();
              }
            }}
            isDisabled={
              isMultiImageMode
                ? inputImages.length < (currentInputMedia?.min_count || 1)
                : !inputImage
            }>
            <span className='mr-2'>{t(submitBtnText)}</span>
            {isAuth && (
              <Chip
                startContent={
                  <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                }
                variant='bordered'
                color={'primary'}
                size='sm'
                className='bg-white dark:bg-background'
                classNames={{
                  content: 'dark:text-foreground',
                }}>
                {t('button.zaps', { cost, credit: profile.credit })}
              </Chip>
            )}
          </Button>
        </Card>
      </div>

      {/* Right output area */}
      <div className='w-full md:flex-1 md:relative h-[600px] md:h-auto'>
        <Card
          className={`p-4 md:p-6 md:pt-4 ${TOOL_CARD_STYLES.outputCard} h-full md:absolute md:inset-0 flex flex-col`}>
          <h2 className='flex items-center mb-4 text-base font-bold text-primary-800 dark:text-primary-300 flex-shrink-0'>
            <FaDownload className='mr-2 text-primary-600' />{' '}
            {t('results.title')}
          </h2>
          <div className='flex-1 overflow-hidden'>
            <div className='h-full overflow-y-auto rounded-lg pr-2'>
              {resultImages?.length > 0 ? (
                <div className='grid grid-cols-1 gap-2'>
                  {resultImages.map((video, index) => (
                    <ResultCard
                      key={video.id}
                      data={video}
                      handleDownload={handleDownload}
                      handleDelete={handleDeleteClick}
                      index={index}
                      videoRefs={videoRefs}
                      type='image'
                      showPrompt={true}
                      isExample={video.id === -1}
                      tool='photo_to_anime'
                    />
                  ))}
                </div>
              ) : (
                <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                  <MdOutlineAnimation
                    size={48}
                    className='mb-4 text-primary-300'
                  />
                  <p className='text-center'>{t('results.empty')}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      <Modal
        isOpen={deleteModalOpen}
        shouldBlockScroll={false}
        onClose={() => setDeleteModalOpen(false)}
        classNames={TOOL_CARD_STYLES.modalClassNames}>
        <ModalContent>
          <ModalHeader className='text-primary-800'>
            {t('deleteModal.title')}
          </ModalHeader>
          <ModalBody>
            <p>{t('deleteModal.message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setDeleteModalOpen(false)}
              className='transition-all duration-300 hover:bg-muted'>
              {t('deleteModal.cancel')}
            </Button>
            <Button
              color='danger'
              onPress={handleConfirmDelete}
              className='bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 hover:from-red-600 hover:to-pink-600'>
              {t('deleteModal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default memo(PhotoToAnimeConvert);
