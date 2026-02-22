import React from 'react';
import { GiSewingNeedle } from 'react-icons/gi';
import { HiSparkles } from 'react-icons/hi2';
import {
  IoMusicalNotes,
  IoFilm,
  IoColorPalette,
  IoGameController,
  IoBrush,
  IoShirt,
  IoVideocam,
  IoFlash,
} from 'react-icons/io5';
import { TbChristmasTreeFilled } from 'react-icons/tb';
import { IconStar } from '@tabler/icons-react';
export type TemplateTool =
  | 'playground'
  | 'videoToVideo'
  | 'videoEffects'
  | 'dance';

export interface TemplateMedia {
  type: 'image' | 'video';
  src: string;
  poster?: string;
}

export interface TemplateRoute {
  path: string;
  query?: Record<string, string>;
  hash?: string;
}

export interface FeaturedTemplate {
  id: string;
  nameKey: string;
  media: TemplateMedia;
  popularity?: number | string; // 可选字段，从 API 动态获取并格式化为字符串（如 "1.5k"）
  badge?: 'tiktok'; // 可选的角标，用于显示特殊标记（如 TikTok）
  tool: TemplateTool;
  route: TemplateRoute;
}

export interface TemplateCategory {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: React.ComponentType<{ className?: string }>;
  seeAllRoute?: string;
  templates: FeaturedTemplate[];
}

const baseTemplateCategories: TemplateCategory[] = [
  // Christmas
  // {
  //   id: 'christmas',
  //   titleKey: 'templates:categories.christmas.title',
  //   descriptionKey: 'templates:categories.christmas.description',
  //   icon: TbChristmasTreeFilled,
  //   seeAllRoute: '/playground',
  //   templates: [
  //     {
  //       id: 'christmas-avatar',
  //       nameKey: 'style-templates:titles.christmasAvatar',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/christmas-avatar.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'christmas-avatar' },
  //       },
  //     },
  //     {
  //       id: 'cozy-christmas-figure',
  //       nameKey: 'style-templates:titles.cozyChristmasFigure',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/cozy-christmas-figure.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'cozy-christmas-figure' },
  //       },
  //     },
  //     {
  //       id: 'christmas-edition-info-sheet',
  //       nameKey: 'style-templates:titles.christmasEditionInfoSheet',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/christmas-edition-info-sheet.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'christmas-edition-info-sheet' },
  //       },
  //     },
  //     {
  //       id: 'christmas-magazine',
  //       nameKey: 'style-templates:titles.christmasMagazine',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/christmas-magazine.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'christmas-magazine' },
  //       },
  //     },
  //     {
  //       id: 'felt-figure',
  //       nameKey: 'style-templates:titles.feltFigure',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/felt-figure.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'felt-figure' },
  //       },
  //     },
  //     {
  //       id: 'xmas-contrast',
  //       nameKey: 'style-templates:titles.xmasContrast',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/xmas-contrast.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'xmas-contrast' },
  //       },
  //     },
  //     {
  //       id: 'acrylic-stand',
  //       nameKey: 'style-templates:titles.acrylicStand',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/acrylic-stand.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'acrylic-stand' },
  //       },
  //     },
  //     {
  //       id: 'campus-cover',
  //       nameKey: 'style-templates:titles.campusCover',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/campus-cover.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'campus-cover' },
  //       },
  //     },
  //     {
  //       id: 'gift-box',
  //       nameKey: 'style-templates:titles.giftBox',
  //       media: {
  //         type: 'image',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/gift-box.webp',
  //       },
  //       tool: 'playground',
  //       route: {
  //         path: '/playground',
  //         query: { style: 'gift-box' },
  //       },
  //     },
  //     {
  //       id: 'christmas-dance',
  //       nameKey: 'style-templates:effects.christmasDance',
  //       media: {
  //         type: 'video',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-dance.webm',
  //       },
  //       tool: 'videoEffects',
  //       route: {
  //         path: '/ai-video-effects',
  //         query: { effect: 'christmas-dance' },
  //       },
  //     },
  //     {
  //       id: 'christmas-barbecue',
  //       nameKey: 'style-templates:effects.christmasBarbecue',
  //       media: {
  //         type: 'video',
  //         src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-barbecue.webm',
  //       },
  //       tool: 'videoEffects',
  //       route: {
  //         path: '/ai-video-effects',
  //         query: { effect: 'christmas-barbecue' },
  //       },
  //     },
  //   ],
  // },
  {
    id: 'art',
    titleKey: 'templates:categories.art.title',
    descriptionKey: 'templates:categories.art.description',
    icon: IoBrush,
    seeAllRoute: '/playground',
    templates: [
      {
        id: 'character-sheet',
        nameKey: 'style-templates:titles.characterSheet',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/character_sheet.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'character-sheet' },
        },
      },
      {
        id: 'sprite-sheet',
        nameKey: 'style-templates:titles.spriteSheet',
        media: {
          type: 'image',
          src: '/images/styles/sprite_sheet.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'sprite-sheet' },
        },
      },
      // costume-design
      {
        id: 'costume-design',
        nameKey: 'style-templates:titles.costumeDesign',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/costume-design.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'costume-design' },
        },
      },

      {
        id: 'pose-sheet',
        nameKey: 'style-templates:titles.poseSheet',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/pose-sheet.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'pose-sheet' },
        },
      },
      // chibi
      {
        id: 'chibi',
        nameKey: 'style-templates:titles.chibi',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/chibi_v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'chibi' },
        },
      },
      {
        id: 'avatar-portrait',
        nameKey: 'style-templates:titles.avatarPortrait',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/avatar_portrait.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'avatar-portrait' },
        },
      },
      {
        id: 'turnaround-sheet',
        nameKey: 'style-templates:titles.turnaroundSheet',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/turnaround-sheet.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'turnaround-sheet' },
        },
      },
      {
        id: 'character-info-sheet',
        nameKey: 'style-templates:titles.characterInfoSheet',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/info-sheet.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'character-info-sheet' },
        },
      },
      {
        id: 'waifu-husbando-rating',
        nameKey: 'style-templates:titles.waifuHusbandoRating',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/oc-rating.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'waifu-husbando-rating' },
        },
      },
      {
        id: 'colorful-notes',
        nameKey: 'style-templates:titles.colorfulNotes',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/colorful-notes.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'colorful-notes' },
        },
      },
    ],
  },
  {
    id: 'image-restyle',
    titleKey: 'templates:categories.imageRestyle.title',
    descriptionKey: 'templates:categories.imageRestyle.description',
    icon: IoColorPalette,
    seeAllRoute: '/playground',
    templates: [
      // anime
      {
        id: 'anime-classic',
        nameKey: 'style-templates:titles.anime',
        media: {
          type: 'image',
          src: '/images/styles/anime.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'anime' },
        },
      },
      {
        id: 'pixar-charm',
        nameKey: 'style-templates:titles.pixar',
        media: {
          type: 'image',
          src: '/images/styles/pixar.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'pixar' },
        },
      },
      {
        id: 'ghibli-scenes',
        nameKey: 'style-templates:titles.ghibliAnime',
        media: {
          type: 'image',
          src: '/images/styles/studio_ghibli_anime.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'ghibli-anime' },
        },
      },
      // line art
      {
        id: 'line-art',
        nameKey: 'style-templates:titles.lineArt',
        media: {
          type: 'image',
          src: '/images/styles/lineart.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'line-art' },
        },
      },
      {
        id: '3d-model',
        nameKey: 'style-templates:titles.3dModel',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/3d_model.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: '3d-model' },
        },
      },
      // pixel art
      {
        id: 'pixel-art',
        nameKey: 'style-templates:titles.pixelArt',
        media: {
          type: 'image',
          src: '/images/styles/minecraft.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'pixel-art' },
        },
      },
      {
        id: 'x-ray',
        nameKey: 'style-templates:titles.xRay',
        media: {
          type: 'image',
          src: '/images/styles/x_ray.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'x-ray' },
        },
      },
      {
        id: 'neon-sign',
        nameKey: 'style-templates:titles.neonSign',
        media: {
          type: 'image',
          src: '/images/styles/neon_sign.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'neon-sign' },
        },
      },
    ],
  },
  {
    id: 'merch',
    titleKey: 'templates:categories.merch.title',
    descriptionKey: 'templates:categories.merch.description',
    icon: GiSewingNeedle,
    seeAllRoute: '/playground',
    templates: [
      {
        id: 'plush-workshop',
        nameKey: 'style-templates:titles.plushie',
        media: {
          type: 'image',
          src: '/images/styles/plushie.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'plushie' },
        },
      },
      {
        id: 'action-figure-lab',
        nameKey: 'style-templates:titles.actionFigure',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/action_figure.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'action-figure' },
        },
      },
      // studio render figure
      {
        id: 'studio-render-figure',
        nameKey: 'style-templates:titles.studioRenderFigure',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/studio-render-figure.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'studio-render-figure' },
        },
      },
      {
        id: 'chibi-stickers',
        nameKey: 'style-templates:titles.chibiStickers',
        media: {
          type: 'image',
          src: '/images/styles/chibi.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'chibi-stickers' },
        },
      },
      {
        id: 'funko-pop',
        nameKey: 'style-templates:titles.funkoPop',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/funko_pop.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'funko-pop' },
        },
      },
      {
        id: 'gachapon',
        nameKey: 'style-templates:titles.gachapon',
        media: {
          type: 'image',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/gachapon.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'gachapon' },
        },
      },
      {
        id: 'dollhouse',
        nameKey: 'style-templates:titles.dollhouse',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/doll_house.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'dollhouse' },
        },
      },
    ],
  },
  {
    id: 'game-worlds',
    titleKey: 'templates:categories.game.title',
    descriptionKey: 'templates:categories.game.description',
    icon: IoGameController,
    seeAllRoute: '/ai-video-effects',
    templates: [
      {
        id: 'genshin-journey',
        nameKey: 'style-templates:effects.genshinImpact',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/genshin-impact.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'genshin-impact' },
        },
      },
      // dating sim
      {
        id: 'dating-sim',
        nameKey: 'style-templates:effects.datingSim',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/dating-sim.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'dating-sim' },
        },
      },
      {
        id: 'pokemon-evolution',
        nameKey: 'style-templates:effects.pokemonEvolution',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/pokemon-evolution.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'pokemon-evolution' },
        },
      },
      {
        id: 'game-promo-video',
        nameKey: 'style-templates:effects.gamePromoVideo',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/game-promo-video.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'game-promo-video' },
        },
      },
      {
        id: 'retro-game',
        nameKey: 'style-templates:effects.retroGame',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/retro-game.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'retro-game' },
        },
      },
      {
        id: 'minecraft-documentary',
        nameKey: 'style-templates:effects.minecraftDocumentary',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/minecraft-documentary.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/image-animation-generator',
          query: { effect: 'minecraft-documentary' },
        },
      },
    ],
  },
  // movie world
  {
    id: 'movie-world',
    titleKey: 'templates:categories.movie.title',
    descriptionKey: 'templates:categories.movie.description',
    icon: IoFilm,
    seeAllRoute: '/playground',
    templates: [
      {
        id: 'the-simpsons',
        nameKey: 'style-templates:titles.theSimpsons',
        media: {
          type: 'image',
          src: '/images/styles/simpson-v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'the-simpsons' },
        },
      },
      {
        id: 'harry-potter',
        nameKey: 'style-templates:titles.harryPotter',
        media: {
          type: 'image',
          src: '/images/styles/harry_potter.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'harry-potter' },
        },
      },
      // south park
      {
        id: 'south-park',
        nameKey: 'style-templates:titles.southPark',
        media: {
          type: 'image',
          src: '/images/styles/south_park_v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'south-park' },
        },
      },
      {
        id: 'rick-and-morty',
        nameKey: 'style-templates:titles.rickAndMorty',
        media: {
          type: 'image',
          src: '/images/styles/rick_and_morty_v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'rick-and-morty' },
        },
      },
      {
        id: 'my-little-pony',
        nameKey: 'style-templates:titles.myLittlePony',
        media: {
          type: 'image',
          src: '/images/styles/my_little_pony.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'my-little-pony' },
        },
      },
      {
        id: 'barbie',
        nameKey: 'style-templates:titles.barbie',
        media: {
          type: 'image',
          src: '/images/styles/barbie-v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'barbie' },
        },
      },
    ],
  },
  // cosplay
  {
    id: 'cosplay',
    titleKey: 'templates:categories.cosplay.title',
    descriptionKey: 'templates:categories.cosplay.description',
    icon: IoShirt,
    seeAllRoute: '/playground',
    templates: [
      {
        id: 'superhero',
        nameKey: 'style-templates:titles.superhero',
        media: {
          type: 'image',
          src: '/images/styles/superhero-v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'superhero' },
        },
      },
      {
        id: 'mugshot',
        nameKey: 'style-templates:titles.mugshot',
        media: {
          type: 'image',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/mugshot.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'mugshot' },
        },
      },
      {
        id: 'sailor-uniform',
        nameKey: 'style-templates:titles.sailorUniform',
        media: {
          type: 'image',
          src: '/images/styles/sailor_uniform_v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'sailor-uniform' },
        },
      },
      {
        id: 'cat-girl',
        nameKey: 'style-templates:titles.catGirlorBoy',
        media: {
          type: 'image',
          src: '/images/styles/cat_girl.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'cat-girl' },
        },
      },
      {
        id: 'maiden',
        nameKey: 'style-templates:titles.maiden',
        media: {
          type: 'image',
          src: '/images/styles/maiden.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'maiden' },
        },
      },
      {
        id: 'bunny-girl',
        nameKey: 'style-templates:titles.bunnyGirlorBoy',
        media: {
          type: 'image',
          src: '/images/styles/bunny_girl.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'bunny-girl' },
        },
      },
      {
        id: 'muscle',
        nameKey: 'style-templates:titles.muscle',
        media: {
          type: 'image',
          src: '/images/styles/muscle-v2.webp',
        },
        tool: 'playground',
        route: {
          path: '/playground',
          query: { style: 'muscle' },
        },
      },
    ],
  },
  {
    id: 'effects',
    titleKey: 'style-templates:categories.funEffects',
    descriptionKey: 'categories.effects.description',
    icon: HiSparkles,
    seeAllRoute: '/ai-video-effects',
    templates: [
      {
        id: 'twerk',
        nameKey: 'style-templates:effects.twerk',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/twerk.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'twerk' },
        },
        badge: 'tiktok',
      },
      // {
      //   id: 'christmas-dance',
      //   nameKey: 'style-templates:effects.christmasDance',
      //   media: {
      //     type: 'video',
      //     src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-dance.webm',
      //   },
      //   tool: 'videoEffects',
      //   route: {
      //     path: '/ai-video-effects',
      //     query: { effect: 'christmas-dance' },
      //   },
      // },
      // {
      //   id: 'christmas-barbecue',
      //   nameKey: 'style-templates:effects.christmasBarbecue',
      //   media: {
      //     type: 'video',
      //     src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/christmas-barbecue.webm',
      //   },
      //   tool: 'videoEffects',
      //   route: {
      //     path: '/ai-video-effects',
      //     query: { effect: 'christmas-barbecue' },
      //   },
      // },
      {
        id: 'live2d-breeze',
        nameKey: 'style-templates:effects.live2dBreeze',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/live2d-breeze.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'live2d-breeze' },
        },
      },
      // 360-view
      {
        id: '360-view',
        nameKey: 'style-templates:effects.360View',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/360-view.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: '360-view' },
        },
      },
      {
        id: 'magical-girl-transformation',
        nameKey: 'style-templates:effects.magicalGirlTransformation',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/magical-girl-transformation.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'magical-girl-transformation' },
        },
      },
      {
        id: 'super-saiyan',
        nameKey: 'style-templates:effects.superSaiyan',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/super-saiyan.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'super-saiyan' },
        },
      },
      // anime mv
      {
        id: 'anime-mv',
        nameKey: 'style-templates:effects.animeMv',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/anime-mv.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'anime-mv' },
        },
      },

      {
        id: 'manga-style-mv',
        nameKey: 'style-templates:effects.mangaStyleMv',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/manga-style-mv.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'manga-style-mv' },
        },
      },
      {
        id: 'bankai',
        nameKey: 'style-templates:effects.bankai',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/bankai.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'bankai' },
        },
        badge: 'tiktok',
      },
      {
        id: 'take-my-hand',
        nameKey: 'style-templates:effects.takeMyHand',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/take-my-hand.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'take-my-hand' },
        },
      },
      {
        id: 'streaming-vtuber',
        nameKey: 'style-templates:effects.streamingVtuber',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/streaming-vtuber.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'streaming-vtuber' },
        },
      },
    ],
  },
  {
    id: 'action',
    titleKey: 'style-templates:categories.action',
    descriptionKey: 'templates:categories.action.description',
    icon: IoFlash,
    seeAllRoute: '/ai-video-effects',
    templates: [
      {
        id: 'action-take-my-hand',
        nameKey: 'style-templates:effects.takeMyHand',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/take-my-hand.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'take-my-hand' },
        },
      },
      {
        id: 'wink',
        nameKey: 'style-templates:effects.wink',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/wink.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'wink' },
        },
      },
      {
        id: 'action-twerk',
        nameKey: 'style-templates:effects.twerk',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/twerk.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'twerk' },
        },
      },
      {
        id: 'sprite-attack-animation',
        nameKey: 'style-templates:effects.spriteAttackAnimation',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/sprite-attack-animation.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'sprite-attack-animation' },
        },
      },
      {
        id: 'sword-swing',
        nameKey: 'style-templates:effects.swordSwing',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/sword-swing.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'sword-swing' },
        },
      },
      {
        id: 'energy-ball',
        nameKey: 'style-templates:effects.energyBall',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/energy-ball.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'energy-ball' },
        },
      },
      {
        id: 'fire-magic',
        nameKey: 'style-templates:effects.fireMagic',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/fire-magic.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'fire-magic' },
        },
      },
      {
        id: 'bankai',
        nameKey: 'style-templates:effects.bankai',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/effects/bankai.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'bankai' },
        },
        badge: 'tiktok',
      },
      {
        id: 'bankai-fight',
        nameKey: 'style-templates:effects.1v1Fight',
        media: {
          type: 'video',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/bankai-fight-v_1770170666641_bankai-fight-v_1769154167623_bankai_fight.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'bankai-fight' },
        },
        badge: 'tiktok',
      },
      {
        id: 'Domain-Expansion',
        nameKey: 'style-templates:effects.domainExpansion',
        media: {
          type: 'video',
          src: 'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/Domain-Expansion-v_1770170799667_Domain-Expansion-v_1769127849031_domain.webm',
        },
        tool: 'videoEffects',
        route: {
          path: '/ai-video-effects',
          query: { effect: 'Domain-Expansion' },
        },
        badge: 'tiktok',
      },
    ],
  },
  {
    id: 'dance',
    titleKey: 'templates:categories.dance.title',
    descriptionKey: 'templates:categories.dance.description',
    icon: IoMusicalNotes,
    seeAllRoute: '/dance-video-generator',
    templates: [
      {
        id: 'mirror-dance',
        nameKey: 'style-templates:dances.mirrorDance',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/natalie-reybolds-mirror-dance.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'mirror-dance' },
        },
      },
      {
        id: 'lonely-lonely',
        nameKey: 'style-templates:dances.lonelyLonely',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/lonely.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'lonely-lonely' },
        },
        badge: 'tiktok',
      },
      {
        id: 'tyla-dance',
        nameKey: 'style-templates:dances.tylaDance',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/tyla-dance.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'tyla-dance' },
        },
      },
      {
        id: 'robot-dance',
        nameKey: 'style-templates:dances.robotDance',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/robot-dance.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'robot-dance' },
        },
      },
      {
        id: 'like-jennie',
        nameKey: 'style-templates:dances.likeJennie',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/like-jennie.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'like-jennie' },
        },
      },
      {
        id: 'crispey-spray-dance',
        nameKey: 'style-templates:dances.crispeySprayDance',
        media: {
          type: 'video',
          src: 'https://d31cygw67xifd4.cloudfront.net/styles/motions/crispey-spray-dance.webm',
        },
        tool: 'dance',
        route: {
          path: '/dance-video-generator',
          query: { dance: 'crispey-spray-dance' },
        },
      },
    ],
  },
  {
    id: 'video-restyle',
    titleKey: 'templates:categories.videoRestyle.title',
    descriptionKey: 'templates:categories.videoRestyle.description',
    icon: IoVideocam,
    seeAllRoute: '/video-to-video',
    templates: [
      {
        id: 'pencil-sketch',
        nameKey: 'style-templates:titles.pencilSketch',
        media: {
          type: 'image',
          src: '/images/styles/pencil_sketch.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'pencil-sketch' },
        },
      },
      // anime
      {
        id: 'anime',
        nameKey: 'style-templates:titles.anime',
        media: {
          type: 'image',
          src: '/images/styles/anime.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'anime' },
        },
      },
      // cartoon
      {
        id: 'cartoon',
        nameKey: 'style-templates:titles.cartoon',
        media: {
          type: 'image',
          src: '/images/styles/cartoon-v2.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'cartoon' },
        },
      },
      {
        id: 'ios-emoji',
        nameKey: 'style-templates:titles.iosEmoji',
        media: {
          type: 'image',
          src: '/images/styles/ios_emoji.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'ios-emoji' },
        },
      },
      {
        id: 'comic',
        nameKey: 'style-templates:titles.comic',
        media: {
          type: 'image',
          src: '/images/styles/comic-v2.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'comic' },
        },
      },
      // the simpsons
      {
        id: 'the-simpsons',
        nameKey: 'style-templates:titles.theSimpsons',
        media: {
          type: 'image',
          src: '/images/styles/simpson-v2.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'the-simpsons' },
        },
      },
      {
        id: 'x-ray',
        nameKey: 'style-templates:titles.xRay',
        media: {
          type: 'image',
          src: '/images/styles/x_ray.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'x-ray' },
        },
      },
      {
        id: 'neon-sign',
        nameKey: 'style-templates:titles.neonSign',
        media: {
          type: 'image',
          src: '/images/styles/neon_sign.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'neon-sign' },
        },
      },
      {
        id: 'call-of-duty',
        nameKey: 'style-templates:titles.callOfDuty',
        media: {
          type: 'image',
          src: '/images/styles/call_of_duty.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'call-of-duty' },
        },
      },
      {
        id: 'yarn',
        nameKey: 'style-templates:titles.yarn',
        media: {
          type: 'image',
          src: '/images/styles/yarn.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'yarn' },
        },
      },
      {
        id: 'muscle',
        nameKey: 'style-templates:titles.muscle',
        media: {
          type: 'image',
          src: '/images/styles/muscle-v2.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'muscle' },
        },
      },
      {
        id: 'mars',
        nameKey: 'style-templates:titles.mars',
        media: {
          type: 'image',
          src: '/images/styles/mars-v2.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'mars' },
        },
      },
      {
        id: 'orange-cat',
        nameKey: 'style-templates:titles.orangeCat',
        media: {
          type: 'image',
          src: '/images/styles/orange_cat.webp',
        },
        tool: 'videoToVideo',
        route: {
          path: '/video-to-video',
          query: { style: 'orange-cat' },
        },
      },
    ],
  },
];

const templateLookup = new Map<string, FeaturedTemplate>();
baseTemplateCategories.forEach(category => {
  category.templates.forEach(template => {
    if (!templateLookup.has(template.id)) {
      templateLookup.set(template.id, template);
    }
  });
});

const pickTemplates = (ids: string[]): FeaturedTemplate[] =>
  ids
    .map(id => templateLookup.get(id))
    .filter((template): template is FeaturedTemplate => Boolean(template));

const featuredCategory: TemplateCategory = {
  id: 'featured',
  titleKey: 'templates:categories.featured.title',
  icon: IconStar,
  templates: pickTemplates([
    'anime-classic',
    'chibi-stickers',
    'studio-render-figure',
    'bankai',
    'lonely-lonely',
    'twerk',
  ]),
};

export const featuredTemplateCategories: TemplateCategory[] = [
  featuredCategory,
  ...baseTemplateCategories,
];
