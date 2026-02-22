import { templateDataManager } from '../../../utils/templateCache';
import { TemplateInputField } from './index';

// Type definitions for API response
interface DBTemplateCategory {
  id: string;
  type: 'image' | 'video';
  name_key: string;
  icon?: string;
  emoji?: string;
  support_v2v: boolean;
  support_playground: boolean;
  templates: Array<{
    id: string;
    type: 'image' | 'video';
    name_key: string;
    url?: string;
    is_pro_model: boolean;
    support_v2v: boolean;
    support_playground: boolean;
    character_inputs?: TemplateInputField[];
    need_middleware?: boolean;
    input_media?: Array<{
      media_type: string;
      min_count: number;
      max_count: number;
    }>;
  }>;
}

// Helper function to clean template ID suffix for image templates
// Removes -i suffix specifically, as these are image templates
const cleanTemplateId = (id: string): string =>
  // For image templates, remove -i suffix if present
  id.replace(/-i$/, '');
// Transform database category to match existing interface
const transformCategory = (dbCategory: DBTemplateCategory) => ({
  category: `categories.${dbCategory.name_key}`,
  icon: dbCategory.icon || '',
  emoji: dbCategory.emoji || '',
  supportV2V: dbCategory.support_v2v,
  supportPlayground: dbCategory.support_playground,
  templates: dbCategory.templates.map(template => ({
    id: cleanTemplateId(template.id),
    nameKey: template.name_key,
    image: template.url || '',
    needsCharacterInputs: template.character_inputs,
    isProModel: template.is_pro_model,
    supportPlayground: template.support_playground,
    supportV2V: template.support_v2v,
    needMiddleware: template.need_middleware || false,
    input_media: template.input_media,
    i18n: (template as any).i18n || null,
  })),
});

// Static fallback data (keeping original structure as backup)
const i2iStyleTemplatesCategoriesStatic = [
  {
    category: 'categories.art',
    icon: 'pen',
    emoji: '🖌️ ',
    supportV2V: false,
    templates: [
      {
        id: 'line-art',
        nameKey: 'titles.lineArt',
        image: '/images/styles/lineart.webp',
      },
      {
        id: 'chibi',
        nameKey: 'titles.chibi',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/chibi_v2.webp',
      },
      {
        id: 'avatar-portrait',
        nameKey: 'titles.avatarPortrait',
        image:
          'https://d31cygw67xifd4.cloudfront.net/styles/avatar_portrait.webp',
      },
      {
        id: 'character-sheet',
        nameKey: 'titles.characterSheet',
        image:
          'https://d31cygw67xifd4.cloudfront.net/styles/character_sheet.webp',
      },
      {
        id: 'turnaround-sheet',
        nameKey: 'titles.turnaroundSheet',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/turnaround-sheet.webp',
      },
      {
        id: 'character-expression-sheet',
        nameKey: 'titles.expressionSheet',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/expression-sheet.webp',
      },
      {
        id: 'pose-sheet',
        nameKey: 'titles.poseSheet',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/pose-sheet.webp',
      },
      {
        id: 'costume-design',
        nameKey: 'titles.costumeDesign',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/costume-design.webp',
      },
      {
        id: 'sprite-sheet',
        nameKey: 'titles.spriteSheet',
        image: '/images/styles/sprite_sheet.webp',
      },
      {
        id: 'sketch-to-finish',
        nameKey: 'titles.sketchToFinish',
        image:
          'https://d31cygw67xifd4.cloudfront.net/styles/sketch-to-finish.webp',
      },
      {
        id: 'colorful-notes',
        nameKey: 'titles.colorfulNotes',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/colorful-notes.webp',
      },
      {
        id: '3d-model',
        nameKey: 'titles.3dModel',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/3d_model.webp',
      },
      {
        id: 'character-info-sheet',
        nameKey: 'titles.characterInfoSheet',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/info-sheet.webp',
        needsCharacterInputs: [
          { input_field: 'characterName', placeholder: null },
          { input_field: 'occupation', placeholder: null },
          { input_field: 'language', placeholder: null },
        ],
        isProModel: true,
      },
      {
        id: 'waifu-husbando-rating',
        nameKey: 'titles.waifuHusbandoRating',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/oc-rating.webp',
        isProModel: true,
      },
    ],
  },
  {
    category: 'categories.merch',
    icon: 'gift',
    emoji: '🎁 ',
    supportV2V: false,
    templates: [
      {
        id: 'sticker',
        nameKey: 'titles.sticker',
        image: '/images/styles/sticker.webp',
      },
      {
        id: 'chibi-stickers',
        nameKey: 'titles.chibiStickers',
        image: '/images/styles/chibi.webp',
      },
      {
        id: 'plushie',
        nameKey: 'titles.plushie',
        image: '/images/styles/plushie.webp',
      },
      {
        id: 'badge',
        nameKey: 'titles.badge',
        image: '/images/styles/badge.webp',
      },
      {
        id: 'standee',
        nameKey: 'titles.standee',
        image: '/images/styles/standee.jpg',
      },
      {
        id: 'body-pillow',
        nameKey: 'titles.bodyPillow',
        image: '/images/styles/body_pillow.webp',
      },
      {
        id: 'action-figure',
        nameKey: 'titles.actionFigure',
        image:
          'https://d31cygw67xifd4.cloudfront.net/styles/action_figure.webp',
      },
      {
        id: 'figure-in-box',
        nameKey: 'titles.figureBox',
        image: '/images/styles/figure_in_box.webp',
      },
      {
        id: 'figure-box-2',
        nameKey: 'titles.figureBox2',
        image: '/images/styles/action_box.webp',
      },
      {
        id: 'studio-render-figure',
        nameKey: 'titles.studioRenderFigure',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/studio-render-figure.webp',
      },
      {
        id: 'snow-globe',
        nameKey: 'titles.snowGlobe',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/snow_globe.webp',
      },
      {
        id: 'gachapon',
        nameKey: 'titles.gachapon',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/gachapon.webp',
      },
      {
        id: 'gacha-card',
        nameKey: 'titles.gachaCard',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/gacha_card.webp',
      },
      {
        id: 'funko-pop',
        nameKey: 'titles.funkoPop',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/funko_pop.webp',
      },
      {
        id: 'lego',
        nameKey: 'titles.lego',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/lego.webp',
      },
      {
        id: 'toy-bricks-v2',
        nameKey: 'titles.toyBricks',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/toy_bricks.webp',
      },
      {
        id: 'barbie-box',
        nameKey: 'titles.barbieBox',
        image: '/images/styles/barbie_doll.webp',
      },
      {
        id: 'bjd-doll',
        nameKey: 'titles.bjdDoll',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/bjd_doll.webp',
      },
      {
        id: 'dollhouse',
        nameKey: 'titles.dollhouse',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/doll_house.webp',
      },
      {
        id: 'mini-figure',
        nameKey: 'titles.miniFigure',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/mini_figure.webp',
      },
      {
        id: 'yarn-doll',
        nameKey: 'titles.yarnDoll',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/yarn_doll.webp',
      },
      {
        id: 'gundam-model',
        nameKey: 'titles.gundamModel',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/gundam_model.webp',
      },
      {
        id: 'bag-charm',
        nameKey: 'titles.bagCharm',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/bag_charm.webp',
      },
      {
        id: 'soda-can',
        nameKey: 'titles.sodaCan',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/soda_can.webp',
      },
      {
        id: 'id-photo',
        nameKey: 'titles.idPhoto',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/id-photo.webp',
      },
      {
        id: 'album-cover',
        nameKey: 'titles.albumCover',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/album-cover.webp',
      },
      {
        id: 'magazine',
        nameKey: 'titles.magazine',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/magazine.webp',
      },
      {
        id: 'magazine-article',
        nameKey: 'titles.magazineArticle',
        image:
          'https://d31cygw67xifd4.cloudfront.net/styles/magazine-article.webp',
        needsCharacterInputs: [
          { input_field: 'language', placeholder: null },
          { input_field: 'characterInfo', placeholder: null },
        ],
        isProModel: true,
      },
      {
        id: 'polaroid',
        nameKey: 'titles.polaroid',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/polaroid.webp',
      },
    ],
  },
  {
    category: 'categories.tStyleTransfer',
    icon: 'palette',
    emoji: '🎨',
    templates: [
      {
        id: 'anime',
        nameKey: 'titles.anime',
        image: '/images/styles/anime.webp',
      },
      {
        id: 'ghibli-anime',
        nameKey: 'titles.ghibliAnime',
        image: '/images/styles/studio_ghibli_anime.webp',
      },
      {
        id: 'cosplay',
        nameKey: 'titles.realisticCosplay',
        image: '/images/styles/cosplay.jpeg',
        supportV2V: false,
      },
      {
        id: 'comic',
        nameKey: 'titles.comic',
        image: '/images/styles/comic-v2.webp',
      },
      {
        id: 'pixar',
        nameKey: 'titles.pixar',
        image: '/images/styles/pixar.webp',
      },
      {
        id: 'x-ray',
        nameKey: 'titles.xRay',
        image: '/images/styles/x_ray.webp',
      },
      {
        id: 'korean-manhwa',
        nameKey: 'titles.koreanManhwa',
        image: '/images/styles/korean.webp',
      },
      {
        id: 'cartoon',
        nameKey: 'titles.cartoon',
        image: '/images/styles/cartoon-v2.webp',
      },
      {
        id: 'manga',
        nameKey: 'titles.manga',
        image: '/images/styles/manga.webp',
      },
      {
        id: 'vaporwave',
        nameKey: 'titles.vaporwave',
        image: '/images/styles/vaporwave-v2.webp',
      },
      {
        id: 'digital-illustration',
        nameKey: 'titles.digitalIllustration',
        image: '/images/styles/digital_illustration.webp',
      },
      {
        id: 'pencil-sketch',
        nameKey: 'titles.pencilSketch',
        image: '/images/styles/pencil_sketch.webp',
      },
      {
        id: 'neon-sign',
        nameKey: 'titles.neonSign',
        image: '/images/styles/neon_sign.webp',
      },
      // {
      //   id: 'western-animation',
      //   name: t('titles.westernAnimation'),
      //   image: '/images/styles/western_animation.webp',
      // },
      {
        id: 'watercolor',
        nameKey: 'titles.watercolor',
        image: '/images/styles/watercolor_v2v.webp',
      },
      {
        id: 'van-gogh',
        nameKey: 'titles.vanGogh',
        image: '/images/styles/van_gogh.webp',
      },
      {
        id: 'oil-painting',
        nameKey: 'titles.oilPainting',
        image: '/images/styles/oil_painting.webp',
      },
      {
        id: 'ios-emoji',
        nameKey: 'titles.iosEmoji',
        image: '/images/styles/ios_emoji.webp',
      },
      {
        id: 'pixel-art',
        nameKey: 'titles.pixelArt',
        image: '/images/styles/minecraft.webp',
        supportV2V: false,
      },
      {
        id: 'low-poly',
        nameKey: 'titles.lowPoly',
        image: '/images/styles/low_poly.webp',
        supportV2V: false,
      },
      {
        id: 'ink-wash-painting',
        nameKey: 'titles.inkWashPainting',
        image: '/images/styles/ink.webp',
        supportV2V: false,
      },
      {
        id: 'caricature',
        nameKey: 'titles.caricature',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/caricature.webp',
        supportV2V: false,
      },
      {
        id: 'pop-art',
        nameKey: 'titles.popArt',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/pop_art.webp',
        supportV2V: false,
      },
      {
        id: 'dark-fantasy',
        nameKey: 'titles.darkFantasy',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/dark_fantasy.webp',
        supportV2V: false,
      },
      {
        id: 'great-mosu',
        nameKey: 'titles.greatMosu',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/greate_mosu.webp',
        supportV2V: false,
      },
      {
        id: 'silhouette',
        nameKey: 'titles.silhouette',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/silhouette.webp',
      },
    ],
  },
  // Game Render
  {
    category: 'categories.game',
    icon: 'game',
    emoji: '🎮',
    templates: [
      {
        id: 'genshin-impact-dialogue',
        nameKey: 'titles.genshinImpactDialogue',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/skill.webp',
        needsCharacterInputs: [
          { input_field: 'characterName', placeholder: null },
          { input_field: 'language', placeholder: null },
        ],
        isProModel: true,
      },
      {
        id: 'genshin-impact-ultimate-skill',
        nameKey: 'titles.genshinImpactUltimateSkill',
        image: 'https://d31cygw67xifd4.cloudfront.net/styles/dialogue.webp',
        needsCharacterInputs: [
          { input_field: 'characterName', placeholder: null },
          { input_field: 'language', placeholder: null },
        ],
        isProModel: true,
      },
      {
        id: 'gta',
        nameKey: 'titles.gta',
        image: '/images/styles/gta.webp',
      },
      {
        id: 'call-of-duty',
        nameKey: 'titles.callOfDuty',
        image: '/images/styles/call_of_duty.webp',
      },
      {
        id: 'minecraft',
        nameKey: 'titles.minecraft',
        image: '/images/styles/minecraft-v2.webp',
      },
      {
        id: 'the-legend-of-zelda',
        nameKey: 'titles.theLegendOfZelda',
        image: '/images/styles/the_legend_of_zelda.webp',
      },
      {
        id: 'retro-game',
        nameKey: 'titles.retroGame',
        image: '/images/styles/retro_game.webp',
      },
      {
        id: 'mobile-game',
        nameKey: 'titles.mobileGame',
        image: '/images/styles/mobile_game.webp',
      },
      {
        id: 'ps-game',
        nameKey: 'titles.psGame',
        image: '/images/styles/ps_game.webp',
      },
      {
        id: 'signalis',
        nameKey: 'titles.signalis',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/signalis.webp',
        supportV2V: false,
      },
    ],
  },
  // Movie world
  {
    category: 'categories.movie',
    icon: 'film',
    emoji: '🎞️',
    templates: [
      {
        id: 'the-simpsons',
        nameKey: 'titles.theSimpsons',
        image: '/images/styles/simpson-v2.webp',
      },
      {
        id: 'rick-and-morty',
        nameKey: 'titles.rickAndMorty',
        image: '/images/styles/rick_and_morty_v2.webp',
      },
      {
        id: 'south-park',
        nameKey: 'titles.southPark',
        image: '/images/styles/south_park_v2.webp',
      },
      {
        id: 'harry-potter',
        nameKey: 'titles.harryPotter',
        image: '/images/styles/harry_potter.webp',
      },
      {
        id: 'barbie',
        nameKey: 'titles.barbie',
        image: '/images/styles/barbie-v2.webp',
      },
      {
        id: 'star-wars',
        nameKey: 'titles.starWars',
        image: '/images/styles/star_wars.webp',
      },
      {
        id: 'avatar',
        nameKey: 'titles.avatar',
        image: '/images/styles/avatar-v2.webp',
      },
      {
        id: 'dune',
        nameKey: 'titles.dune',
        image: '/images/styles/dune-v2.webp',
      },
      {
        id: 'the-lord-of-the-rings',
        nameKey: 'titles.theLordOfTheRings',
        image: '/images/styles/the_lord_of_the_rings-v2.webp',
      },
      {
        id: 'frozen',
        nameKey: 'titles.frozen',
        image: '/images/styles/frozen.webp',
      },
      {
        id: 'my-little-pony',
        nameKey: 'titles.myLittlePony',
        image: '/images/styles/my_little_pony.webp',
      },
    ],
  },

  // {
  //   category: 'categories.artist',
  //   icon: 'artist',
  //   emoji: '🎨',
  //   templates: [

  //   ],
  // },

  // Anime
  {
    category: 'categories.anime',
    icon: 'anime',
    emoji: '🎏',
    templates: [
      {
        id: 'anime-character',
        nameKey: 'titles.animeCharacter',
        image: '/images/styles/anime_character.webp',
      },
      {
        id: 'cat-girl',
        nameKey: 'titles.catGirlorBoy',
        image: '/images/styles/cat_girl.webp',
      },
      {
        id: 'maiden',
        nameKey: 'titles.maiden',
        image: '/images/styles/maiden.webp',
      },
      {
        id: 'bunny-girl',
        nameKey: 'titles.bunnyGirlorBoy',
        image: '/images/styles/bunny_girl.webp',
      },
      {
        id: 'fox-girl',
        nameKey: 'titles.foxGirlorBoy',
        image: '/images/styles/fox_girl.webp',
      },
      {
        id: 'wolf-girl',
        nameKey: 'titles.wolfGirlorBoy',
        image: '/images/styles/wolf_girl.webp',
      },
      {
        id: 'elf',
        nameKey: 'titles.elf',
        image: '/images/styles/elf.webp',
      },
      {
        id: 'magical-girl',
        nameKey: 'titles.magicalGirl',
        image: '/images/styles/magical_girl_v2.webp',
      },
      {
        id: 'idol',
        nameKey: 'titles.idol',
        image: '/images/styles/idol.webp',
      },
      {
        id: 'sailor-uniform',
        nameKey: 'titles.sailorUniform',
        image: '/images/styles/sailor_uniform_v2.webp',
      },
      {
        id: 'mecha-pilot',
        nameKey: 'titles.mechaPilot',
        image: '/images/styles/mecha_pilot.webp',
      },
      {
        id: 'samurai',
        nameKey: 'titles.samurai',
        image: '/images/styles/samurai.webp',
      },
      {
        id: 'ninja',
        nameKey: 'titles.ninja',
        image: '/images/styles/ninja.webp',
      },
    ],
  },
  // Change Material
  {
    category: 'categories.changeMaterial',
    icon: 'texture',
    emoji: '💎',
    templates: [
      {
        id: 'clay',
        nameKey: 'titles.clay',
        image: '/images/styles/clay.webp',
      },
      {
        id: 'playdoh',
        nameKey: 'titles.playdoh',
        image: '/images/styles/playdoh.webp',
      },
      {
        id: 'toy-bricks',
        nameKey: 'titles.toyBricks',
        image: '/images/styles/toy_bricks.webp',
        supportPlayground: false,
      },
      {
        id: 'skeleton',
        nameKey: 'titles.skeleton',
        image: '/images/styles/skeleton.webp',
      },
      {
        id: 'origami',
        nameKey: 'titles.origami',
        image: '/images/styles/origami_paper_art.webp',
        supportV2V: false,
      },
      {
        id: 'yarn',
        nameKey: 'titles.yarn',
        image: '/images/styles/yarn.webp',
      },
      // {
      //   id: 'fire',
      //   name: t('titles.fire'),
      //   image: '/images/styles/fire-v2.webp',
      // },
      {
        id: 'muscle',
        nameKey: 'titles.muscle',
        image: '/images/styles/muscle-v2.webp',
      },
      {
        id: 'metal',
        nameKey: 'titles.metal',
        image: '/images/styles/metal-v2.webp',
      },
      {
        id: 'marble',
        nameKey: 'titles.marble',
        image: '/images/styles/marble.webp',
      },
    ],
  },
  // 🗺️  Switch Scene
  {
    category: 'categories.switchScene',
    icon: 'map',
    emoji: '🗺️',
    templates: [
      {
        id: 'cyberpunk',
        nameKey: 'titles.cyberpunk',
        image: '/images/styles/cyberpunk-v2.webp',
      },
      {
        id: 'kpop-idol',
        nameKey: 'titles.kpopIdol',
        image: '/images/styles/kpop-v2.webp',
      },
      {
        id: 'mars',
        nameKey: 'titles.mars',
        image: '/images/styles/mars-v2.webp',
      },
      {
        id: 'underwater',
        nameKey: 'titles.underwater',
        image: '/images/styles/underwater-v2.webp',
      },
      {
        id: 'outer-space',
        nameKey: 'titles.outerSpace',
        image: '/images/styles/outer-space-v2.webp',
      },
      {
        id: 'apocalypse',
        nameKey: 'titles.apocalypse',
        image: '/images/styles/apocalypse-v2.webp',
      },
      {
        id: 'christmas',
        nameKey: 'titles.christmas',
        image: '/images/styles/christmas.webp',
      },
      {
        id: 'wizarding-world',
        nameKey: 'titles.wizardingWorld',
        image: '/images/styles/wizarding_world.webp',
      },
      {
        id: 'heaven',
        nameKey: 'titles.heaven',
        image: '/images/styles/heaven.webp',
      },
      {
        id: 'hell',
        nameKey: 'titles.hell',
        image: '/images/styles/hell.webp',
      },
    ],
  },

  // Cosplay
  {
    category: 'categories.cosplay',
    icon: 'wardrobe',
    emoji: '👘',
    templates: [
      {
        id: 'superhero',
        nameKey: 'titles.superhero',
        image: '/images/styles/superhero-v2.webp',
      },
      {
        id: 'captain-american',
        nameKey: 'titles.captainAmerican',
        image: '/images/styles/captain_american.webp',
      },
      {
        id: 'maleficent',
        nameKey: 'titles.maleficent',
        image: '/images/styles/maleficent.webp',
      },
      {
        id: 'tinkerbell',
        nameKey: 'titles.tinkerbell',
        image: '/images/styles/tinkerbell.webp',
      },
      {
        id: 'vampire',
        nameKey: 'titles.vampire',
        image: '/images/styles/vampire.webp',
      },
      {
        id: 'robot',
        nameKey: 'titles.robot',
        image: '/images/styles/robot.webp',
      },
      {
        id: 'cyborg',
        nameKey: 'titles.cyborg',
        image: '/images/styles/cyborg.webp',
      },
      {
        id: 'angel',
        nameKey: 'titles.angel',
        image: '/images/styles/angel.webp',
      },
      {
        id: 'zombie',
        nameKey: 'titles.zombie',
        image: '/images/styles/zombie.webp',
      },
      {
        id: 'miku-cosplay',
        nameKey: 'titles.mikuCosplay',
        image: '/images/styles/miku-cosplay.webp',
      },
      {
        id: 'naruto-cosplay',
        nameKey: 'titles.narutoCosplay',
        image: '/images/styles/naruto-cosplay.webp',
      },
      {
        id: 'sailor-moon-cosplay',
        nameKey: 'titles.sailorMoonCosplay',
        image: '/images/styles/sailor_moon_cosplay.webp',
      },
      {
        id: 'goku-cosplay',
        nameKey: 'titles.gokuCosplay',
        image: '/images/styles/goku-cosplay.webp',
      },
      {
        id: 'princess',
        nameKey: 'titles.princess',
        image: '/images/styles/princess-v2.webp',
      },
      {
        id: 'kimono',
        nameKey: 'titles.kimono',
        image: '/images/styles/kimono-v2.webp',
      },

      {
        id: 'cowboy',
        nameKey: 'titles.cowboy',
        image: '/images/styles/cowboy-v2.webp',
      },
      {
        id: 'pirate',
        nameKey: 'titles.pirate',
        image: '/images/styles/pirate.webp',
      },
      {
        id: 'medieval',
        nameKey: 'titles.medieval',
        image: '/images/styles/medieval.webp',
      },
      {
        id: 'knight',
        nameKey: 'titles.knight',
        image: '/images/styles/knight.webp',
      },
      {
        id: 'goblin',
        nameKey: 'titles.goblin',
        image: '/images/styles/goblin.webp',
      },
      {
        id: 'mugshot',
        nameKey: 'titles.mugshot',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/mugshot.webp',
        supportV2V: false,
      },
      {
        id: 'bikini',
        nameKey: 'titles.bikini',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/bikini.webp',
        supportV2V: false,
      },
    ],
  },
  // Body
  {
    category: 'categories.body',
    icon: 'face',
    emoji: '👤',
    supportV2V: false,
    templates: [
      {
        id: 'blonde-hair',
        nameKey: 'titles.blondeHair',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/blonde-hair.webp',
      },
      {
        id: 'blue-eye',
        nameKey: 'titles.blueEye',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/blue-eye.webp',
      },
      {
        id: 'chubby',
        nameKey: 'titles.chubby',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/chubby.webp',
      },
      {
        id: 'skinny',
        nameKey: 'titles.skinny',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/skinny.webp',
      },
      {
        id: 'elderly',
        nameKey: 'titles.elderly',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/elderly.webp',
      },
      {
        id: 'baby',
        nameKey: 'titles.baby',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/baby.webp',
      },
      {
        id: 'pregnant',
        nameKey: 'titles.pregnant',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/pregnant.webp',
      },
      {
        id: 'bald',
        nameKey: 'titles.bald',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/bald.webp',
      },
      {
        id: 'beard',
        nameKey: 'titles.beard',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/beard.webp',
      },
      {
        id: 'bangs',
        nameKey: 'titles.bangs',
        image:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/bangs.webp',
      },
    ],
  },

  // {
  //   category: 'categories.expression',
  //   icon: 'emoji',
  //   emoji: '😊',
  //   supportV2V: false,
  //   templates: [
  //     {
  //       id: 'smile',
  //       nameKey: 'titles.smile',
  //       image:
  //         'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/smile.webp',
  //     },
  //     {
  //       id: 'cry',
  //       nameKey: 'titles.cry',
  //       image:
  //         'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/style-templates/cry.webp',
  //     },
  //   ],
  // },

  // Animal
  {
    category: 'categories.animal',
    icon: 'animal',
    emoji: '🐱',
    supportPlayground: false,
    templates: [
      {
        id: 'beagle',
        nameKey: 'titles.beagle',
        image: '/images/styles/beagle.webp',
      },
      {
        id: 'poodle',
        nameKey: 'titles.poodle',
        image: '/images/styles/poodle.webp',
      },
      {
        id: 'werewolf',
        nameKey: 'titles.werewolf',
        image: '/images/styles/werewolf.webp',
      },
      {
        id: 'orange-cat',
        nameKey: 'titles.orangeCat',
        image: '/images/styles/orange_cat.webp',
      },
      {
        id: 'sphynx-cat',
        nameKey: 'titles.sphynxCat',
        image: '/images/styles/sphynx_cat.webp',
      },
    ],
  },

  // Replace Character
  {
    category: 'categories.replaceCharacter',
    icon: 'masks',
    emoji: '🎭',
    supportPlayground: false,
    templates: [
      {
        id: 'miku',
        nameKey: 'titles.miku',
        image: '/images/styles/miku-v2.webp',
      },
      {
        id: 'sailor-moon',
        nameKey: 'titles.sailorMoon',
        image: '/images/styles/sailor_moon_v2.webp',
      },
      {
        id: 'naruto',
        nameKey: 'titles.naruto',
        image: '/images/styles/naruto-v2.webp',
      },
      {
        id: 'monkey-d-luffy',
        nameKey: 'titles.monkeyDLuffy',
        image: '/images/styles/monkey_d_luffy.webp',
      },
      {
        id: 'goku',
        nameKey: 'titles.goku',
        image: '/images/styles/goku-v2.webp',
      },
      {
        id: 'gojo-satoru',
        nameKey: 'titles.gojoSatoru',
        image: '/images/styles/gojo_satoru.webp',
      },
    ],
  },
  // {
  //   category: 'categories.christmas',
  //   icon: 'christmas',
  //   emoji: '🎄',
  //   supportV2V: false,
  //   templates: [
  //     {
  //       id: 'christmas-avatar',
  //       nameKey: 'titles.christmasAvatar',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/christmas-avatar.webp',
  //     },
  //     {
  //       id: 'cozy-christmas-figure',
  //       nameKey: 'titles.cozyChristmasFigure',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/cozy-christmas-figure.webp',
  //     },
  //     {
  //       id: 'christmas-edition-info-sheet',
  //       nameKey: 'titles.christmasEditionInfoSheet',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/christmas-edition-info-sheet.webp',
  //       needsCharacterInputs: ['characterName', 'occupation', 'language'],
  //       isProModel: true,
  //     },
  //     {
  //       id: 'christmas-magazine',
  //       nameKey: 'titles.christmasMagazine',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/christmas-magazine.webp',
  //       needsCharacterInputs: ['language', 'characterInfo'],
  //       isProModel: true,
  //     },
  //     {
  //       id: 'felt-figure',
  //       nameKey: 'titles.feltFigure',
  //       image: 'https://d31cygw67xifd4.cloudfront.net/styles/felt-figure.webp',
  //     },
  //     {
  //       id: 'xmas-contrast',
  //       nameKey: 'titles.xmasContrast',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/xmas-contrast.webp',
  //       isProModel: true,
  //     },
  //     {
  //       id: 'acrylic-stand',
  //       nameKey: 'titles.acrylicStand',
  //       image:
  //         'https://d31cygw67xifd4.cloudfront.net/styles/acrylic-stand.webp',
  //     },
  //     {
  //       id: 'campus-cover',
  //       nameKey: 'titles.campusCover',
  //       image: 'https://d31cygw67xifd4.cloudfront.net/styles/campus-cover.webp',
  //     },
  //     {
  //       id: 'gift-box',
  //       nameKey: 'titles.giftBox',
  //       image: 'https://d31cygw67xifd4.cloudfront.net/styles/gift-box.webp',
  //     },
  //   ],
  // },
];

// Function to get style templates from global cache (secure)
export const getI2IStyleTemplatesCategories = async () => {
  // 服务端渲染时直接返回静态数据
  if (typeof window === 'undefined') {
    return i2iStyleTemplatesCategoriesStatic;
  }

  // 客户端：首先尝试从全局缓存获取
  const cachedImageTemplates = templateDataManager.getImageTemplates();
  if (cachedImageTemplates) {
    // 转换数据库响应格式，静默处理避免页面切换时的console噪音
    const transformedTemplates = Array.isArray(cachedImageTemplates)
      ? cachedImageTemplates.map((dbCategory: DBTemplateCategory) =>
          transformCategory(dbCategory),
        )
      : [];
    return transformedTemplates;
  }

  // 如果正在加载，返回null而不是静态数据，避免闪烁
  if (templateDataManager.isDataLoading()) {
    console.log('[Templates] Data is loading, returning null to avoid flash');
    return null;
  }

  // 如果缓存为空且未在加载，尝试加载数据
  if (!templateDataManager.isDataLoaded()) {
    console.log('[Templates] Loading image templates from global cache...');
    await templateDataManager.loadAllData();
    const imageTemplates = templateDataManager.getImageTemplates();
    if (imageTemplates) {
      const transformedTemplates = Array.isArray(imageTemplates)
        ? imageTemplates.map((dbCategory: DBTemplateCategory) =>
            transformCategory(dbCategory),
          )
        : [];
      console.log(
        '[Templates] Successfully loaded image templates from database:',
        transformedTemplates.length,
        'categories',
      );
      return transformedTemplates;
    }
  }

  // 如果仍然无法获取数据，使用静态数据作为fallback
  console.log('[Templates] Using static image template fallback');
  return i2iStyleTemplatesCategoriesStatic;
};

// Export async function that gets data from global cache (preferred) or static data as fallback
export const getI2IStyleTemplatesCategoriesAsync =
  getI2IStyleTemplatesCategories;

// Export static data for immediate use in other modules when global cache is not ready
export { i2iStyleTemplatesCategoriesStatic as i2iStyleTemplatesCategories };

// Static fallback trending image styles for playground
const trendingImageStylesIdStatic: string[] = [
  'anime',
  'chibi-stickers',
  'character-sheet',
  'turnaround-sheet',
  'character-info-sheet',
  'waifu-husbando-rating',
  'colorful-notes',
  'plushie',
  'dollhouse',
  'studio-render-figure',
  'x-ray',
  'neon-sign',
  'ios-emoji',
  'the-simpsons',
  'barbie',
];

// Cache for trending image styles
let trendingImageStylesCache: string[] = trendingImageStylesIdStatic;

// Function to get trending image styles from global cache
export const getTrendingImageStylesId = async (): Promise<string[]> => {
  // Server-side rendering: use static data
  if (typeof window === 'undefined') {
    console.log('[Trending Image Styles] Server-side, using static fallback');
    return trendingImageStylesIdStatic;
  }

  // Client-side: try to get from global cache first
  const cachedStyles = templateDataManager.getTrendingImageStyles();
  console.log('[Trending Image Styles] Cache check:', {
    cachedStyles,
    isArray: Array.isArray(cachedStyles),
    length: cachedStyles?.length,
    isDataLoaded: templateDataManager.isDataLoaded(),
    isDataLoading: templateDataManager.isDataLoading(),
  });

  if (cachedStyles && cachedStyles.length > 0) {
    // Clean template IDs (remove -i suffix) to match transformed template IDs
    const cleanedStyles = cachedStyles.map(cleanTemplateId);
    console.log('[Trending Image Styles] Using cached trending image styles:', {
      original: cachedStyles,
      cleaned: cleanedStyles,
    });
    // Update cache
    trendingImageStylesCache = cleanedStyles;
    return cleanedStyles;
  }

  // If loading, wait or return static data
  if (templateDataManager.isDataLoading()) {
    console.log(
      '[Trending Image Styles] Data is loading, using static fallback',
    );
    return trendingImageStylesIdStatic;
  }

  // If cache is empty and not loading, try to load data
  if (!templateDataManager.isDataLoaded()) {
    console.log(
      '[Trending Image Styles] Loading data from template manager...',
    );
    await templateDataManager.loadAllData();
    const trendingImageStyles = templateDataManager.getTrendingImageStyles();
    console.log('[Trending Image Styles] After loading:', {
      trendingImageStyles,
      length: trendingImageStyles?.length,
    });

    if (trendingImageStyles && trendingImageStyles.length > 0) {
      // Clean template IDs (remove -i suffix) to match transformed template IDs
      const cleanedStyles = trendingImageStyles.map(cleanTemplateId);
      console.log('[Trending Image Styles] Loaded trending image styles:', {
        original: trendingImageStyles,
        cleaned: cleanedStyles,
      });
      trendingImageStylesCache = cleanedStyles;
      return cleanedStyles;
    }
  }

  // Fallback to static data
  console.log('[Trending Image Styles] Falling back to static data');
  return trendingImageStylesIdStatic;
};

// Synchronous getter for latest cached trending image styles
export const getTrendingImageStylesIdSync = () => trendingImageStylesCache;
