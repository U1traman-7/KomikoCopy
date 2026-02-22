export enum TaskType {
  LINE_ART_COLORIZE = 'line_art_colorize',
  UNDER_COLORING = 'under_coloring',
  SKETCH_SIMPLIFIER = 'sketch_simplifier',
}
export const imageIndex: Record<string, number> = {
  [TaskType.LINE_ART_COLORIZE]: 101,
  [TaskType.UNDER_COLORING]: 44,
  [TaskType.SKETCH_SIMPLIFIER]: 101,
};

/**
 * anime style
 * Korean manhwa style
 * Ghibli anime style
 * Action figure
 * Figure in box
 * Sticker
 * Origami paper art
 * Line art
 * Cartoon
 * Rick and Morty
 * South Park
 * Lego
 * Clay
 * Minecraft
 * Watercolor
 * 水墨
 * 吉卜力
 */

export enum AnimeStyle {
  ANIME = 'anime',
  KOREAN_MANHWA = 'korean_manhwa',
  MANGA = 'manga',
  CHIBI = 'chibi',
  GHIBLI_ANIME = 'ghibli_anime',
  ACTION_FIGURE = 'action_figure',
  FIGURE_IN_BOX = 'figure_in_box',
  STICKER = 'sticker',
  ORIGAMI_PAPER_ART = 'origami_paper_art',
  LINE_ART = 'line_art',
  CARTOON = 'cartoon',
  RICK_AND_MORTY = 'rick_and_morty',
  SOUTH_PARK = 'south_park',
  LEGO = 'lego',
  CLAY = 'claymation',
  PIXEL_ART = 'pixel_art',
  WATERCOLOR = 'watercolor',
  INK_WASH = 'ink_wash',
  SIMPSONS = 'simpsons',
  NARUTO = 'naruto',
  ONE_PIECE = 'one_piece',
  MY_LITTLE_PONY = 'my_little_pony',
  VAPORWAVE = 'vaporwave',
  LOW_POLY = 'low_poly',
  BARBIE_DOLL = 'barbie_doll',
  DOLL_BOX = 'doll_box',
  CHARACTER_SHEET = 'character_sheet',
  SPRITE_SHEET = 'sprite_sheet',
  PLUSHIE = 'plushie',
  BADGE = 'badge',
  STANDEE = 'standee',
  BODY_PILLOW = 'body_pillow',
  CYBERPUNK = 'cyberpunk',
  COSPLAY = 'cosplay',
}

export const serverUrl = 'http://34.67.156.195:12580';

// vip style: ink (水墨), chibi sticker, rick and morty, my little pony
// figure box, origami paper art, low poly, claymation
export const VipAnimeStyles = [
  AnimeStyle.INK_WASH,
  // AnimeStyle.CHIBI,
  AnimeStyle.RICK_AND_MORTY,
  AnimeStyle.MY_LITTLE_PONY,
  AnimeStyle.FIGURE_IN_BOX,
  AnimeStyle.ORIGAMI_PAPER_ART,
  AnimeStyle.LOW_POLY,
  AnimeStyle.CLAY,
] as const;
