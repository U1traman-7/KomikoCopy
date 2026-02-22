import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTheaterMasks, FaPaintBrush, FaTshirt } from 'react-icons/fa';
import { FaChild, FaMountainSun } from 'react-icons/fa6';
import { GENERAL_STYLES } from '../../../api/_constants';
import { GenerationModel } from './types';

export const usePromptPresets = (model: GenerationModel) => {
  const { t } = useTranslation('create');

  // TODO: 后续合并
  // 修改kusaStyleData时也需要修改/api/_constants.ts中的KUSAS_TYLES
  // Memoized to avoid recreating on every render
  const kusaStyleData = useMemo(
    () => [
      {
        category: t('kusa_categories.art'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.vibrant_anime'),
            value: '[vibrant-anime-style]',
            image: '/images/kusa_styles/vibrant_anime.webp',
          },
          {
            label: t('kusa_styles.high_contrast_glossy'),
            value: '[high-contrast-glossy-style]',
            image: '/images/kusa_styles/high_contrast_glossy.webp',
          },
          {
            label: t('kusa_styles.lacquered_illustration'),
            value: '[lacquered-illustration-style]',
            image: '/images/kusa_styles/lacquered_illustration.webp',
          },
          {
            label: t('kusa_styles.semi_realistic_portrait'),
            value: '[semi-realistic-portrait-style]',
            image: '/images/kusa_styles/semi_realistic_portrait.webp',
          },
          {
            label: t('kusa_styles.soft_pastel'),
            value: '[soft-pastel-style]',
            image: '/images/kusa_styles/soft_pastel.webp',
          },
          {
            label: t('kusa_styles.soft_light_illustration'),
            value: '[soft-light-illustration-style]',
            image: '/images/kusa_styles/soft_light_illustration.webp',
          },
          {
            label: t('kusa_styles.iridescent'),
            value: '[iridescent-style]',
            image: '/images/kusa_styles/iridescent_new.webp',
          },
          // {
          //   label: t('kusa_styles.soft_glossy'),
          //   value: '[soft-glossy-style]',
          //   image: '/images/kusa_styles/soft_glossy.webp',
          // },
          // {
          //   label: t('kusa_styles.seductive'),
          //   value: '[seductive-style]',
          //   image: '/images/kusa_styles/seductive.webp',
          // },
          // {
          //   label: t('kusa_styles.vibrant_pop'),
          //   value: '[vibrant-pop-style]',
          //   image: '/images/kusa_styles/vibrant_pop.webp',
          // },
          {
            label: t('kusa_styles.watercolor_illustration'),
            value: '[watercolor-illustration-style]',
            image:
              'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/watercolor_Illustration.webp',
          },
          {
            label: t('kusa_styles.high_gloss_illustration'),
            value: '[high-gloss-illustration-style]',
            image: '/images/kusa_styles/high_gloss_illustration.webp',
          },
          {
            label: t('kusa_styles.sweet_pastel_style'),
            value: '[sweet-pastel-style]',
            image: '/images/kusa_styles/sweet_pastel.webp',
          },
          // {
          //   label: t('kusa_styles.prismatic_style'),
          //   value: '[prismatic-style]',
          //   image: '/images/kusa_styles/prismatic.webp',
          // },
          {
            label: t('kusa_styles.dazzling_illustration'),
            value: '[dazzling-illustration-style]',
            image: '/images/kusa_styles/dazzling_illustration.webp',
          },
          {
            label: t('kusa_styles.soft_shading'),
            value: '[soft-shading-style]',
            image: '/images/kusa_styles/soft_shading_new.webp',
          },
          {
            label: t('kusa_styles.desaturated_illustration'),
            value: '[desaturated-illustration-style]',
            image: '/images/kusa_styles/desaturated_illustration_new.webp',
          },
          {
            label: t('kusa_styles.glossy_anime'),
            value: '[glossy-anime-style]',
            image: '/images/kusa_styles/glossy_anime_new.webp',
          },
          {
            label: t('kusa_styles.clean_lines'),
            value: '[clean-lines-style]',
            image: '/images/kusa_styles/clean_lines.webp',
          },
          {
            label: t('kusa_styles.pop_toon_style'),
            value: '[pop-toon-style]',
            image: '/images/kusa_styles/pop_toon_style.webp',
          },
          {
            label: t('kusa_styles.soft_pixel_art'),
            value: '[soft-pixel-art-style]',
            image: '/images/kusa_styles/soft_pixel_art.webp',
          },
          // {
          //   label: t('kusa_styles.arcade_pixel_art'),
          //   value: '[arcade-pixel-art-style]',
          //   image: '/images/kusa_styles/arcade_pixel_art.webp',
          // },
          // {
          //   label: t('kusa_styles.dark_lolita_style'),
          //   value: '[dark-lolita-style]',
          //   image: '/images/kusa_styles/dark_lolita_style.webp',
          // },
          {
            label: t('kusa_styles.moody_glow_style'),
            value: '[moody-glow-style]',
            image: '/images/kusa_styles/moody_glow_style.webp',
          },
          {
            label: t('kusa_styles.soft_shaded_moe_style'),
            value: '[soft-shaded-moe-style]',
            image: '/images/kusa_styles/soft_shaded_moe_style.webp',
          },
          // {
          //   label: t('kusa_styles.pretty_boy'),
          //   value: '[pretty-boy-style]',
          //   image: '/images/kusa_styles/pretty_boy.webp',
          // },
          {
            label: t('kusa_styles.sensual_glossy_style'),
            value: '[sensual-glossy-style]',
            image: '/images/kusa_styles/sensual_glossy_style.webp',
          },
          {
            label: t('kusa_styles.ukiyo_e'),
            value: '[ukiyo-e-style]',
            image: '/images/kusa_styles/ukiyo_e.webp',
            requiresSeedream: true,
          },
          {
            label: t('kusa_styles.retro_comic_dots'),
            value: '[retro-comic-dots-style]',
            image: '/images/kusa_styles/retro_comic_dots.webp',
            requiresSeedream: true,
          },
          {
            label: t('kusa_styles.cyberpunk'),
            value: '[cyberpunk-style]',
            image: '/images/kusa_styles/cyberpunk.webp',
            requiresSeedream: true,
          },
          {
            label: t('kusa_styles.cyber_candy'),
            value: '[cyber-candy-style]',
            image: '/images/kusa_styles/cyber_candy.webp',
          },
          {
            label: t('kusa_styles.glimmer_anime_style'),
            value: '[glimmer-anime-style]',
            image: '/images/kusa_styles/glimmer_harajuku.webp',
          },
          {
            label: t('kusa_styles.soft_luminous_anime'),
            value: '[soft-luminous-anime-style]',
            image: '/images/kusa_styles/porcelain_glow.webp',
          },
          {
            label: t('kusa_styles.disney_style'),
            value: '[disney-style]',
            image: '/images/kusa_styles/pixar_esque_lighting.webp',
          },
          {
            label: t('kusa_styles.matte_velvet'),
            value: '[matte-velvet-style]',
            image: '/images/kusa_styles/mylkor_velvet.webp',
          },
          {
            label: t('kusa_styles.mischief_style'),
            value: '[mischief-style]',
            image: '/images/kusa_styles/mischiefstyle.webp',
          },
          {
            label: t('kusa_styles.smooth_render_style'),
            value: '[smooth-render-style]',
            image: '/images/kusa_styles/akaburo_style.webp',
          },
          {
            label: t('kusa_styles.stylized_cartoon_comic'),
            value: '[stylized-cartoon-comic-style]',
            image: '/images/kusa_styles/latin_comic_pin_up_style.webp',
          },
          {
            label: t('kusa_styles.warm_storybook'),
            value: '[warm-storybook-style]',
            image: '/images/kusa_styles/crimson_mix_style.webp',
          },
          {
            label: t('kusa_styles.classic_pixel_game_style'),
            value: '[classic-pixel-game-style]',
            image: '/images/kusa_styles/classic_pixel_game_style.webp',
          },
          {
            label: t('kusa_styles.morandi_color_style'),
            value: '[morandi-color-style]',
            image: '/images/kusa_styles/morandi_soda_style.webp',
          },
          {
            label: t('kusa_styles.refined_fantasy_style'),
            value: '[refined-fantasy-style]',
            image:
              '/images/kusa_styles/katsuya_terada_inspired_fantasy_art.webp',
          },
          {
            label: t('kusa_styles.layered_cel_anime'),
            value: '[layered-cel-anime-style]',
            image: '/images/kusa_styles/multicolor_shaded_sketch_style.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.meme'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.irastoya'),
            value: '[irasutoya-style]',
            image: '/images/kusa_styles/irasutoya.webp',
          },
          {
            label: t('kusa_styles.close_look'),
            value: '[close-look-style]',
            image: '/images/kusa_styles/close_look.webp',
          },
          {
            label: t('kusa_styles.helltalker_style'),
            value: '[helltalker-style]',
            image: '/images/kusa_styles/helltalker.webp',
          },
          {
            label: t('kusa_styles.deep_fried_meme'),
            value: '[deep-fried-meme-style]',
            image: '/images/kusa_styles/glitched_sketch.webp',
          },
          {
            label: t('kusa_styles.doro_style'),
            value: '[doro-style]',
            image: '/images/kusa_styles/doro_style.webp',
          },
          {
            label: t('kusa_styles.uplook_style'),
            value: '[uplook-style]',
            image: '/images/kusa_styles/uplook_style.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.painterly'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.sweet_painting_style'),
            value: '[sweet-painting-style]',
            image: '/images/kusa_styles/sweet_painting.webp',
          },
          {
            label: t('kusa_styles.soft_painterly_style'),
            value: '[soft-painterly-style]',
            image: '/images/kusa_styles/soft_painterly.webp',
          },
          {
            label: t('kusa_styles.radiant_coating'),
            value: '[radiant-coating-style]',
            image: '/images/kusa_styles/radiant_coating.webp',
          },
          {
            label: t('kusa_styles.gothic_oil_painting'),
            value: '[gothic-oil-painting-style]',
            image: '/images/kusa_styles/gothic_oil_painting.webp',
          },
          {
            label: t('kusa_styles.digital_painterly_style'),
            value: '[digital-painterly-style]',
            image: '/images/kusa_styles/digital_painterly_style.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.chibi'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.doodle'),
            value: '[doodle-style]',
            image: '/images/kusa_styles/doodle.webp',
          },
          {
            label: t('kusa_styles.chibi_sticker'),
            value: '[chibi-sticker-style]',
            image: '/images/kusa_styles/chibi_sticker.webp',
          },
          {
            label: t('kusa_styles.blocky_faced_chibi'),
            value: '[blocky-faced-chibi-style]',
            image: '/images/kusa_styles/blocky_faced_chibi.webp',
          },
          {
            label: t('kusa_styles.flat_chibi'),
            value: '[flat-chibi-style]',
            image: '/images/kusa_styles/flat_chibi.webp',
          },
          {
            label: t('kusa_styles.soft_chibi'),
            value: '[soft-chibi-style]',
            image: '/images/kusa_styles/soft_chibi_new.webp',
          },
          {
            label: t('kusa_styles.vintage_chibi'),
            value: '[vintage-chibi-style]',
            image: '/images/kusa_styles/vintage_chibi.webp',
          },
          {
            label: t('kusa_styles.glossy_chibi'),
            value: '[glossy-chibi-style]',
            image: '/images/kusa_styles/glossy_chibi.webp',
          },
          {
            label: t('kusa_styles.flat_outline_chibi'),
            value: '[flat-outline-chibi-style]',
            image: '/images/kusa_styles/flat_outline_chibi.webp',
          },
          {
            label: t('kusa_styles.pastel_chibi'),
            value: '[pastel-chibi-style]',
            image: '/images/kusa_styles/pastel_chibi.webp',
          },
          // {
          //   label: t('kusa_styles.shiny_eye_chibi'),
          //   value: '[shiny-eye-chibi-style]',
          //   image: '/images/kusa_styles/shiny_eye_chibi.webp',
          // },
          {
            label: t('kusa_styles.mini_chibi'),
            value: '[mini-chibi-style]',
            image: '/images/kusa_styles/mini_chibi.webp',
          },
          {
            label: t('kusa_styles.bubble_chibi_style'),
            value: '[bubble-chibi-style]',
            image: '/images/kusa_styles/bubble_chibi_style.webp',
          },
          {
            label: t('kusa_styles.powerpuff_girls_style'),
            value: '[powerpuff-girls-style]',
            image: '/images/kusa_styles/powerpuff_girls_style.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.male_focus'),
        isKusa: true,
        labels: [
          // {
          //   label: t('kusa_styles.handsome_lead'),
          //   value: '[handsome-lead-style]',
          //   image: '/images/kusa_styles/handsome_lead.webp',
          // },
          {
            label: t('kusa_styles.serious_man'),
            value: '[serious-man-style]',
            image: '/images/kusa_styles/serious_man.webp',
          },
          // {
          //   label: t('kusa_styles.mature_man'),
          //   value: '[mature-man-style]',
          //   image: '/images/kusa_styles/mature_man_new.webp',
          // },
          {
            label: t('kusa_styles.muscular_manhwa_style'),
            value: '[muscular-manhwa-style]',
            image: '/images/kusa_styles/muscular_manhwa_new.webp',
          },
          {
            label: t('kusa_styles.polished_illustration_style'),
            value: '[polished-illustration-style]',
            image: '/images/kusa_styles/porcelain_edge.webp',
          },
          {
            label: t('kusa_styles.high_contrast_manhwa'),
            value: '[high-contrast-manhwa-style]',
            image: '/images/kusa_styles/k_manhwa_luxe.webp',
          },
          {
            label: t('kusa_styles.silky_radiance'),
            value: '[silky-radiance-style]',
            image: '/images/kusa_styles/silky_radiance.webp',
          },
          {
            label: t('kusa_styles.vibrant_anime_male_style'),
            value: '[vibrant-anime-male-style]',
            image: '/images/kusa_styles/vibrant_anime_male_style.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.anime'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.toon_shaded'),
            value: '[toon-shaded-style]',
            image: '/images/kusa_styles/toon_shaded.webp',
          },
          {
            label: t('kusa_styles.retro_anime_style'),
            value: '[retro-anime-style]',
            image: '/images/kusa_styles/retro_anime.webp',
          },
          // {
          //   label: t('kusa_styles.sharp_line_anime'),
          //   value: '[sharp-line-anime-style]',
          //   image: '/images/kusa_styles/sharp_line_anime.webp',
          // },
          // {
          //   label: t('kusa_styles.anime_screenshot'),
          //   value: '[anime-screenshot-style]',
          //   image: '/images/kusa_styles/anime_screenshot_new.webp',
          // },
          {
            label: t('kusa_styles.90s_shojo_style'),
            value: '[90s-shojo-style]',
            image:
              'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/90s_shojo_style_new.webp',
          },
          {
            label: t('kusa_styles.flat_anime_style'),
            value: '[flat-anime-style]',
            image: '/images/kusa_styles/flat_anime_style.webp',
          },
          {
            label: t('kusa_styles.bright_anime_style'),
            value: '[bright-anime-style]',
            image: '/images/kusa_styles/bright_anime_style.webp',
          },
          {
            label: t('kusa_styles.pop_anime_style'),
            value: '[pop-anime-style]',
            image: '/images/kusa_styles/pop_anime.webp',
          },
          // {
          //   label: t('kusa_styles.90s_realistic_style'),
          //   value: '[90s-realistic-style]',
          //   image: '/images/kusa_styles/90s_realistic_style.webp',
          // },
          {
            label: t('kusa_styles.smooth_satin_illustration'),
            value: '[smooth-satin-illustration-style]',
            image: '/images/kusa_styles/glistening_lipid.webp',
          },
          {
            label: t('kusa_styles.vivid_oil_cel'),
            value: '[vivid-oil-cel-style]',
            image: '/images/kusa_styles/vivid_oil_cel.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.manga'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.grayscale_manga'),
            value: '[grayscale-manga-style]',
            image: '/images/kusa_styles/grayscale_manga.webp',
          },
          // {
          //   label: t('kusa_styles.horror_manga'),
          //   value: '[horror-manga-style]',
          //   image: '/images/kusa_styles/horror_manga.webp',
          // },
          {
            label: t('kusa_styles.action_manga'),
            value: '[action-manga-style]',
            image: '/images/kusa_styles/action_manga.webp',
          },
          {
            label: t('kusa_styles.hentai'),
            value: '[hentai-style]',
            image: '/images/kusa_styles/hentai.webp',
          },
          {
            label: t('kusa_styles.graphic_ink'),
            value: '[graphic-ink-style]',
            image: '/images/kusa_styles/graphic_ink.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.sketch'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.pop_sketch'),
            value: '[pop-sketch-style]',
            image: '/images/kusa_styles/pop_sketch.webp',
          },
          {
            label: t('kusa_styles.faded_sketchy_lines'),
            value: '[faded-sketchy-lines-style]',
            image: '/images/kusa_styles/faded_sketchy_lines.webp',
          },
          {
            label: t('kusa_styles.sketchy_painterly_style'),
            value: '[sketchy-painterly-style]',
            image: '/images/kusa_styles/sketchy_painterly_style.webp',
          },
          {
            label: t('kusa_styles.soft_wash_sketch'),
            value: '[soft-wash-sketch-style]',
            image: '/images/kusa_styles/soft_wash_sketch.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.furry'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.pokemon_style'),
            value: '[pokemon-style]',
            image: '/images/kusa_styles/pokemon_style.webp',
          },
          {
            label: t('kusa_styles.realistic_furry'),
            value: '[realistic-furry-style]',
            image: '/images/kusa_styles/realistic_furry.webp',
          },
          {
            label: t('kusa_styles.soft_furry'),
            value: '[soft-furry-style]',
            image: '/images/kusa_styles/soft_furry_new.webp',
          },
          {
            label: t('kusa_styles.flat_furry'),
            value: '[flat-furry-style]',
            image: '/images/kusa_styles/flat_furry.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.3d'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.3d_model'),
            value: '[3d-anime-style]',
            image: '/images/kusa_styles/3d_model.webp',
          },
          {
            label: t('kusa_styles.mmd_style'),
            value: '[mmd-style]',
            image: '/images/kusa_styles/mmd_style.webp',
          },
          {
            label: t('kusa_styles.3d_anime_game'),
            value: '[3d-anime-game-style]',
            image: '/images/kusa_styles/3d_anime_game_new.webp',
          },
        ],
      },
      {
        category: t('kusa_categories.flat'),
        isKusa: true,
        labels: [
          {
            label: t('kusa_styles.thick_outline'),
            value: '[thick-outline-style]',
            image: '/images/kusa_styles/thick_outline.webp',
          },
          {
            label: t('kusa_styles.flat_illustration'),
            value: '[flat-illustration-style]',
            image: '/images/kusa_styles/flat_illustration.webp',
          },
          {
            label: t('kusa_styles.flat_pastel_style'),
            value: '[flat-pastel-style]',
            image: '/images/kusa_styles/flat_pastel.webp',
          },
          {
            label: t('kusa_styles.minimalist'),
            value: '[minimalist-style]',
            image: '/images/kusa_styles/minimalist.webp',
          },
        ],
      },
    ],
    [t],
  );

  // Apply kusaSpecial tags based on GENERAL_STYLES
  const kusaStyleDataWithTags = useMemo(() => {
    const generalStyles = Object.keys(GENERAL_STYLES);
    return kusaStyleData.map(style => ({
      ...style,
      labels: style.labels.map(label => ({
        ...label,
        kusaSpecial: !generalStyles.includes(label.value),
      })),
    }));
  }, [kusaStyleData]);

  const gridData = useMemo(
    () => [
      {
        category: t('grid_categories.storyboard'),
        labels: [
          {
            label: t('grid_layouts.2x2_grid'),
            value: '<2x2-grid>',
            prompt:
              'Generate a 2x2 grid shotboards, with exactly 2 rows, and exactly 2 columns. All 4 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
            image: '/images/grid_templates/2x2-grid.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.3x3_grid'),
            value: '<3x3-grid>',
            prompt:
              'Generate a 3x3 grid shotboards, with exactly 3 rows, and exactly 3 columns. All 9 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
            image: '/images/grid_templates/3x3-grid.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.4x4_grid'),
            value: '<4x4-grid>',
            prompt:
              'Generate a 4x4 grid shotboards, with exactly 4 rows, and exactly 4 columns. All 16 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
            image: '/images/grid_templates/4x4-grid.webp',
            requiresBananaPro: true,
          },
          {
            label: t('grid_layouts.5x5_grid'),
            value: '<5x5-grid>',
            prompt:
              'Generate a 5x5 grid shotboards, with exactly 5 rows, and exactly 5 columns. All 25 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
            image: '/images/grid_templates/5x5-grid.webp',
            requiresBananaPro: true,
          },
          {
            label: t('grid_layouts.6x6_grid'),
            value: '<6x6-grid>',
            prompt:
              'Generate a 6x6 grid shotboards, with exactly 6 rows, and exactly 6 columns. All 36 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.',
            image: '/images/grid_templates/6x6-grid.webp',
            requiresBananaPro: true,
          },
        ],
      },
      {
        category: t('grid_categories.comic'),
        labels: [
          {
            label: t('grid_layouts.three_panel_strip'),
            value: '<three-panel-strip>',
            prompt:
              'Design a mobile-optimized vertical scroll layout with 3 panels (3 rows and 1 column).',
            image: '/images/grid_templates/three-panel-strip.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.four_panel_strip'),
            value: '<four-panel-strip>',
            prompt:
              'Design a mobile-optimized vertical scroll layout with 4 panels (4 rows and 1 column).',
            image: '/images/grid_templates/four-panel-strip.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.diagonal_panels'),
            value: '<diagonal-panels>',
            prompt:
              'Arrange 3-4 panels diagonally across the page from top-left to bottom-right with varying sizes. Maintain panel tilts for dynamic energy, ensuring text placement remains readable in angled panels.',
            image: '/images/grid_templates/diagonal-panels.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.dominant_panel'),
            value: '<dominant-panel>',
            prompt:
              'Compose a page with one oversized central panel (60%+ area) surrounded by 2-3 smaller supporting panels. Use the central panel for key action/moment, with smaller panels showing reactions or context.',
            image: '/images/grid_templates/dominant-panel.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.exploding_panel'),
            value: '<exploding-panel>',
            prompt:
              "Create a page with one 'exploding' panel - break its borders into 3-5 irregular shards overlapping adjacent panels. Use speed lines/impact effects while keeping 60% of the original panel area visible.",
            image: '/images/grid_templates/exploding-panel.webp',
            requiresSeedream: true,
          },
        ],
      },
      {
        category: t('grid_categories.manga'),
        labels: [
          {
            label: t('grid_layouts.right_to_left'),
            value: '<right-to-left>',
            prompt:
              'A Japanese manga panel, multiple right to left panels, read from right to left. Use screentone effects for shading and clean, bold line art.',
            image: '/images/grid_templates/right-to-left.webp',
            requiresSeedream: true,
          },
          {
            label: t('grid_layouts.exaggerated_right_to_left'),
            value: '<exaggerated-right-to-left>',
            prompt:
              'A Japanese manga panel in a right-to-left format. Two or more panels. Use bold outlines, exaggerated features.',
            image: '/images/grid_templates/exaggerated-right-to-left.webp',
            requiresSeedream: true,
          },
        ],
      },
    ],
    [t],
  );

  const promptPresets = useMemo(
    () => [
      {
        category: t('prompt_presets.character'),
        key: 'Character',
        icon: <FaTheaterMasks className='text-xl' />,
        labelData: [],
      },
      {
        category: t('prompt_presets.style'),
        key: 'Style',
        icon: <FaPaintBrush className='text-xl' />,
        labelData: [
          ...(model === 'Art Pro' ||
          model === 'Art Unlimited' ||
          model === 'Auto Model' ||
          model === 'Seedream 4.5' ||
          model === 'Seedream 4' ||
          model === 'Gemini' ||
          model === 'Gemini Pro'
            ? kusaStyleDataWithTags
                .map(item => {
                  return {
                    category: item.category,
                    isKusa: item.isKusa,
                    labels: item.labels.filter(label => {
                      const isAutoModel = model === 'Auto Model';
                      const isAnimeModel =
                        model === 'Art Pro' || model === 'Art Unlimited';
                      const isGeneralModel =
                        model === 'Gemini' ||
                        model === 'Seedream 4.5' ||
                        model === 'Seedream 4' ||
                        model === 'Gemini Pro';

                      // Auto Model: show all styles (will resolve at generation time)
                      if (isAutoModel) {
                        return true;
                      }

                      // Styles with requiresSeedream (✨ icon): only show for general models
                      if ((label as any).requiresSeedream) {
                        return isGeneralModel;
                      }

                      // Styles with kusaSpecial (🌸 icon): only show for anime models (Art Pro/Unlimited)
                      if ((label as any).kusaSpecial) {
                        return isAnimeModel;
                      }

                      // Styles without special tags (in GENERAL_STYLES): show for all models
                      return true;
                    }),
                  };
                })
                .filter(item => item.labels.length > 0)
            : []),
          {
            category: t('general'),
            key: 'General',
            labels: [
              {
                label: t('prompt_presets.anime_screencap'),
                value: 'anime screencap',
              },
              {
                label: t('prompt_presets.anime_coloring'),
                value: 'anime coloring',
              },
              {
                label: t('prompt_presets.black_and_white_manga_style'),
                value: 'black and white manga style',
              },
              {
                label: t('prompt_presets.comic_shading'),
                value: 'comic shading',
              },
              {
                label: t('prompt_presets.pixel_art'),
                value: 'pixel art',
              },
              {
                label: t('prompt_presets.3d'),
                value: '3d',
              },
              {
                label: t('prompt_presets.chibi'),
                value: 'chibi',
              },
              {
                label: t('prompt_presets.kawaii'),
                value: 'kawaii',
              },
              {
                label: t('prompt_presets.retro_style'),
                value: 'retro style',
              },
              {
                label: t('prompt_presets.gothic'),
                value: 'gothic',
              },
              {
                label: t('prompt_presets.painterly'),
                value: 'painterly',
              },
              {
                label: t('prompt_presets.soft_shadow'),
                value: 'soft shadow',
              },
              {
                label: t('prompt_presets.Minecraft'),
                value: 'Minecraft',
              },
              {
                label: t('prompt_presets.Genshin_Impact'),
                value: 'Genshin Impact',
              },
              {
                label: t('prompt_presets.watercolor'),
                value: 'watercolor (medium)',
              },
              {
                label: t('prompt_presets.millipen'),
                value: 'millipen (medium)',
              },
              {
                label: t('prompt_presets.acrylic_paint'),
                value: 'acrylic paint (medium)',
              },
              {
                label: t('prompt_presets.oil_painting'),
                value: 'oil painting (medium)',
              },
              {
                label: t('prompt_presets.colored_pencil'),
                value: 'colored pencil (medium)',
              },
              {
                label: t('prompt_presets.graphite'),
                value: 'graphite (medium)',
              },
              {
                label: t('prompt_presets.photo'),
                value: 'photo (medium)',
              },
              {
                label: t('prompt_presets.blender'),
                value: 'blender (medium)',
              },
              {
                label: t('prompt_presets.traditional_media'),
                value: 'traditional media',
              },
              {
                label: t('prompt_presets.faux_traditional_media'),
                value: 'faux traditional media',
              },
              {
                label: t('prompt_presets.hatching'),
                value: 'hatching (texture)',
              },
              {
                label: t('prompt_presets.flat_color'),
                value: 'flat color',
              },
              {
                label: t('prompt_presets.pale_color'),
                value: 'pale color',
              },
              {
                label: t('prompt_presets.vibrant_color'),
                value: 'vibrant color',
              },
              {
                label: t('prompt_presets.pastel_colors'),
                value: 'pastel colors',
              },
              {
                label: t('prompt_presets.grayscale'),
                value: 'grayscale',
              },
              {
                label: t('prompt_presets.monochrome'),
                value: 'monochrome',
              },
              {
                label: t('prompt_presets.chromatic_aberration'),
                value: 'chromatic aberration',
              },
              {
                label: t('prompt_presets.high_contrast'),
                value: 'high contrast',
              },
              {
                label: t('prompt_presets.limited_palette'),
                value: 'limited palette',
              },
              {
                label: t('prompt_presets.lineart'),
                value: 'lineart',
              },
              {
                label: t('prompt_presets.no_lineart'),
                value: 'no lineart',
              },
              {
                label: t('prompt_presets.thick_outline'),
                value: 'thick outline',
              },
              {
                label: t('prompt_presets.sketch'),
                value: 'sketch',
              },
            ],
          },
        ],
      },
      {
        category: t('prompt_presets.action'),
        key: 'Action',
        icon: <FaChild className='text-xl' />,
        labelData: [
          {
            category: t('prompt_presets.1_character'),
            labels: [
              { label: t('prompt_presets.waving'), value: 'waving' },
              { label: t('prompt_presets.singing'), value: 'singing' },
              { label: t('prompt_presets.dancing'), value: 'dancing' },
              { label: t('prompt_presets.heart_hands'), value: 'heart hands' },
              { label: t('prompt_presets.v_sign'), value: 'v sign' },
              {
                label: t('prompt_presets.holding_sign'),
                value: 'holding sign',
              },
              {
                label: t('prompt_presets.holding_sword'),
                value: 'holding sword',
              },
              { label: t('prompt_presets.holding_gun'), value: 'holding gun' },
              {
                label: t('prompt_presets.hands_in_pockets'),
                value: 'hands in pockets',
              },
              { label: t('prompt_presets.selfie'), value: 'selfie' },
              {
                label: t('prompt_presets.looking_at_phone'),
                value: 'looking at phone',
              },
              {
                label: t('prompt_presets.looking_back'),
                value: 'looking back',
              },
              {
                label: t('prompt_presets.sitting_on_the_ground'),
                value: 'sitting on the ground',
              },
              {
                label: t('prompt_presets.lie_on_stomache'),
                value: 'lie on stomache',
              },
              {
                label: t('prompt_presets.pointing_at_viewer'),
                value: 'pointing at viewer',
              },
              {
                label: t('prompt_presets.face_pinching'),
                value: 'face pinching',
              },
              {
                label: t('prompt_presets.wiping_tears'),
                value: 'wiping tears',
              },
              { label: t('prompt_presets.head_tilt'), value: 'head tilt' },
              {
                label: t('prompt_presets.jumping_from_rooftop'),
                value: 'jumping from rooftop',
              },
            ],
          },
          {
            category: t('prompt_presets.2+_characters'),
            labels: [
              { label: t('prompt_presets.2people'), value: '2people' },
              {
                label: t('prompt_presets.holding_hands'),
                value: 'holding hands',
              },
              { label: t('prompt_presets.high_five'), value: 'high five' },
              {
                label: t('prompt_presets.back_to_back'),
                value: 'back to back',
              },
              { label: t('prompt_presets.hugging'), value: 'hugging' },
              { label: t('prompt_presets.kissing'), value: 'kissing' },
              {
                label: t('prompt_presets.sitting_on_lap'),
                value: 'sitting on lap',
              },
              {
                label: t('prompt_presets.gathering_together'),
                value: 'gathering together',
              },
              { label: t('prompt_presets.picnic'), value: 'picnic' },
            ],
          },
          {
            category: t('prompt_presets.expression'),
            labels: [
              { label: t('prompt_presets.smile'), value: 'smile' },
              { label: t('prompt_presets.laughing'), value: 'laughing' },
              { label: t('prompt_presets.smirk'), value: 'smirk' },
              {
                label: t('prompt_presets.expressionless'),
                value: 'expressionless',
              },
              { label: t('prompt_presets.frown'), value: 'frown' },
              { label: t('prompt_presets.blush'), value: 'blush' },
              { label: t('prompt_presets.shocked'), value: 'shocked' },
              { label: t('prompt_presets.depressed'), value: 'depressed' },
              { label: t('prompt_presets.crying'), value: 'crying' },
              {
                label: t('prompt_presets.disappointed'),
                value: 'disappointed',
              },
              { label: t('prompt_presets.angry'), value: 'angry' },
              { label: t('prompt_presets.evil_smile'), value: 'evil smile' },
              { label: t('prompt_presets.open_mouth'), value: 'open mouth' },
              {
                label: t('prompt_presets.one_eye_closed'),
                value: 'one eye closed',
              },
            ],
          },
        ],
      },
      {
        category: t('prompt_presets.outfit'),
        key: 'Outfit',
        icon: <FaTshirt className='text-xl' />,
        labelData: [
          {
            category: t('prompt_presets.top'),
            labels: [
              { label: t('prompt_presets.t-shirt'), value: 't-shirt' },
              { label: t('prompt_presets.vest'), value: 'vest' },
              { label: t('prompt_presets.plaid_shirt'), value: 'plaid shirt' },
              {
                label: t('prompt_presets.striped_shirt'),
                value: 'striped shirt',
              },
              {
                label: t('prompt_presets.bohemian_shirt'),
                value: 'bohemian shirt',
              },
              {
                label: t('prompt_presets.henley_shirt'),
                value: 'henley shirt',
              },
              { label: t('prompt_presets.hoodie'), value: 'hoodie' },
              {
                label: t('prompt_presets.knitted_cardigan'),
                value: 'knitted cardigan',
              },
              { label: t('prompt_presets.lab_coat'), value: 'lab coat' },
              {
                label: t('prompt_presets.leather_jacket'),
                value: 'leather jacket',
              },
              {
                label: t('prompt_presets.punk_leather_jacket'),
                value: 'punk leather jacket',
              },
              {
                label: t('prompt_presets.varsity_jacket'),
                value: 'varsity jacket',
              },
              {
                label: t('prompt_presets.outdoor_adventure_jacket'),
                value: 'outdoor adventure jacket',
              },
              { label: t('prompt_presets.polo_shirt'), value: 'polo shirt' },
              {
                label: t('prompt_presets.knitted_vest'),
                value: 'knitted vest',
              },
              { label: t('prompt_presets.school_vest'), value: 'school vest' },
            ],
          },
          {
            category: t('prompt_presets.bottom'),
            labels: [
              { label: t('prompt_presets.jeans'), value: 'jeans' },
              { label: t('prompt_presets.overalls'), value: 'overalls' },
              { label: t('prompt_presets.suit_pants'), value: 'suit pants' },
              {
                label: t('prompt_presets.casual_pants'),
                value: 'casual pants',
              },
              { label: t('prompt_presets.cargo_pants'), value: 'cargo pants' },
              { label: t('prompt_presets.capri_pants'), value: 'capri pants' },
              {
                label: t('prompt_presets.wide-leg_pants'),
                value: 'wide-leg pants',
              },
              {
                label: t('prompt_presets.pleated_skirt'),
                value: 'pleated skirt',
              },
              {
                label: t('prompt_presets.pencil_skirt'),
                value: 'pencil skirt',
              },
              { label: t('prompt_presets.denim_skirt'), value: 'denim skirt' },
              {
                label: t('prompt_presets.beach_shorts'),
                value: 'beach shorts',
              },
            ],
          },
          {
            category: t('prompt_presets.set'),
            labels: [
              { label: t('prompt_presets.tracksuit'), value: 'tracksuit' },
              { label: t('prompt_presets.pajamas'), value: 'pajamas' },
              { label: t('prompt_presets.down_jacket'), value: 'down jacket' },
              {
                label: t('prompt_presets.school_uniform'),
                value: 'school uniform',
              },
              { label: t('prompt_presets.raincoat'), value: 'raincoat' },
              {
                label: t('prompt_presets.evening_dress'),
                value: 'evening dress',
              },
              {
                label: t('prompt_presets.little_black_dress'),
                value: 'little black dress',
              },
              { label: t('prompt_presets.suit'), value: 'suit' },
              { label: t('prompt_presets.tuxedo'), value: 'tuxedo' },
              { label: t('prompt_presets.spacesuit'), value: 'spacesuit' },
              { label: t('prompt_presets.diving_suit'), value: 'diving suit' },
              { label: t('prompt_presets.apron'), value: 'apron' },
            ],
          },
          {
            category: t('prompt_presets.material'),
            labels: [
              { label: t('prompt_presets.studs'), value: 'studs' },
              { label: t('prompt_presets.tassels'), value: 'tassels' },
              { label: t('prompt_presets.ruffles'), value: 'ruffles' },
              { label: t('prompt_presets.lace'), value: 'lace' },
              { label: t('prompt_presets.zebra_print'), value: 'zebra print' },
              { label: t('prompt_presets.plastic'), value: 'plastic' },
              { label: t('prompt_presets.sherpa'), value: 'sherpa' },
            ],
          },
          {
            category: t('prompt_presets.accessory'),
            labels: [
              { label: t('prompt_presets.headband'), value: 'headband' },
              { label: t('prompt_presets.hairpin'), value: 'hairpin' },
              {
                label: t('prompt_presets.hair_accessory'),
                value: 'hair accessory',
              },
              { label: t('prompt_presets.crown'), value: 'crown' },
              { label: t('prompt_presets.corsage'), value: 'corsage' },
              {
                label: t('prompt_presets.wedding_veil'),
                value: 'wedding veil',
              },
              { label: t('prompt_presets.angle_wings'), value: 'angle wings' },
              { label: t('prompt_presets.tie'), value: 'tie' },
              { label: t('prompt_presets.bow_tie'), value: 'bow tie' },
              { label: t('prompt_presets.scarf'), value: 'scarf' },
              { label: t('prompt_presets.bow'), value: 'bow' },
              { label: t('prompt_presets.earrings'), value: 'earrings' },
              { label: t('prompt_presets.necklace'), value: 'necklace' },
              { label: t('prompt_presets.choker'), value: 'choker' },
              { label: t('prompt_presets.beret'), value: 'beret' },
              {
                label: t('prompt_presets.baseball_cap'),
                value: 'baseball cap',
              },
              { label: t('prompt_presets.knit_hat'), value: 'knit hat' },
              { label: t('prompt_presets.top_hat'), value: 'top hat' },
              { label: t('prompt_presets.sun_hat'), value: 'sun hat' },
              { label: t('prompt_presets.bucket_hat'), value: 'bucket hat' },
              { label: t('prompt_presets.feather_hat'), value: 'feather hat' },
              { label: t('prompt_presets.cowboy_hat'), value: 'cowboy hat' },
              { label: t('prompt_presets.beanie'), value: 'beanie' },
              { label: t('prompt_presets.headscarf'), value: 'headscarf' },
              { label: t('prompt_presets.jewelry'), value: 'jewelry' },
              { label: t('prompt_presets.diamonds'), value: 'diamonds' },
              { label: t('prompt_presets.pearls'), value: 'pearls' },
              { label: t('prompt_presets.glasses'), value: 'glasses' },
              { label: t('prompt_presets.sunglasses'), value: 'sunglasses' },
              {
                label: t('prompt_presets.steampunk_goggles'),
                value: 'steampunk goggles',
              },
              { label: t('prompt_presets.eye_patch'), value: 'eye patch' },
              {
                label: t('prompt_presets.aviator_sunglasses'),
                value: 'aviator sunglasses',
              },
              { label: t('prompt_presets.headphones'), value: 'headphones' },
              { label: t('prompt_presets.bracelet'), value: 'bracelet' },
              {
                label: t('prompt_presets.knee-high_socks'),
                value: 'knee-high socks',
              },
              {
                label: t('prompt_presets.boxing_gloves'),
                value: 'boxing gloves',
              },
              { label: t('prompt_presets.fox_ears'), value: 'fox ears' },
              { label: t('prompt_presets.cat_ears'), value: 'cat ears' },
              { label: t('prompt_presets.rabbit_ears'), value: 'rabbit ears' },
              { label: t('prompt_presets.wolf_ears'), value: 'wolf ears' },
              {
                label: t('prompt_presets.mechanical_watch'),
                value: 'mechanical watch',
              },
              {
                label: t('prompt_presets.digital_watch'),
                value: 'digital watch',
              },
              {
                label: t('prompt_presets.quartz_watch'),
                value: 'quartz watch',
              },
            ],
          },
          {
            category: t('prompt_presets.hair'),
            labels: [
              { label: t('prompt_presets.blonde_hair'), value: 'blonde hair' },
              { label: t('prompt_presets.twin_tails'), value: 'twin tails' },
              { label: t('prompt_presets.spiky_hair'), value: 'spiky hair' },
              {
                label: t('prompt_presets.side_ponytail'),
                value: 'side ponytail',
              },
              {
                label: t('prompt_presets.high_ponytail'),
                value: 'high ponytail',
              },
              { label: t('prompt_presets.bun'), value: 'bun' },
              { label: t('prompt_presets.double_buns'), value: 'double buns' },
              {
                label: t('prompt_presets.straight_bangs'),
                value: 'straight bangs',
              },
              { label: t('prompt_presets.bob_cut'), value: 'bob cut' },
              { label: t('prompt_presets.side_part'), value: 'side part' },
              { label: t('prompt_presets.updo'), value: 'updo' },
              { label: t('prompt_presets.dreadlocks'), value: 'dreadlocks' },
              { label: t('prompt_presets.buzz_cut'), value: 'buzz cut' },
              { label: t('prompt_presets.mohawk'), value: 'mohawk' },
              { label: t('prompt_presets.pixie_cut'), value: 'pixie cut' },
              { label: t('prompt_presets.man_bun'), value: 'man bun' },
              { label: t('prompt_presets.bald'), value: 'bald' },
              { label: t('prompt_presets.mullet'), value: 'mullet' },
              {
                label: t('prompt_presets.slicked-back_hair'),
                value: 'slicked-back hair',
              },
              {
                label: t('prompt_presets.mushroom_cut'),
                value: 'mushroom cut',
              },
              { label: t('prompt_presets.afro'), value: 'afro' },
              {
                label: t('prompt_presets.spiral_curls'),
                value: 'spiral curls',
              },
              {
                label: t('prompt_presets.fluffy_curls'),
                value: 'fluffy curls',
              },
            ],
          },
          {
            category: t('prompt_presets.color'),
            labels: [
              { label: t('prompt_presets.navy_blue'), value: 'navy blue' },
              { label: t('prompt_presets.klein_blue'), value: 'klein blue' },
              { label: t('prompt_presets.burgundy'), value: 'burgundy' },
              { label: t('prompt_presets.neon_green'), value: 'neon green' },
              { label: t('prompt_presets.ivory_white'), value: 'ivory white' },
              { label: t('prompt_presets.fuchsia'), value: 'fuchsia' },
              { label: t('prompt_presets.khaki'), value: 'khaki' },
              { label: t('prompt_presets.olive_green'), value: 'olive green' },
              {
                label: t('prompt_presets.charcoal_black'),
                value: 'charcoal black',
              },
              { label: t('prompt_presets.gradient'), value: 'gradient' },
              { label: t('prompt_presets.rainbow'), value: 'rainbow' },
            ],
          },
        ],
      },
      {
        category: t('prompt_presets.scene'),
        key: 'Scene',
        icon: <FaMountainSun className='text-xl' />,
        labelData: [
          {
            category: t('prompt_presets.lens'),
            labels: [
              { label: t('prompt_presets.headshot'), value: 'headshot' },
              { label: t('prompt_presets.portrait'), value: 'portrait' },
              { label: t('prompt_presets.closeup'), value: 'closeup' },
              { label: t('prompt_presets.upper_body'), value: 'upper body' },
              { label: t('prompt_presets.full_body'), value: 'full body' },
              {
                label: t('prompt_presets.looking_at_viewer'),
                value: 'looking at viewer',
              },
              {
                label: t('prompt_presets.looking_away'),
                value: 'looking away',
              },
              {
                label: t('prompt_presets.panoramic_lens'),
                value: 'panoramic lens',
              },
              {
                label: t("prompt_presets.bird's-eye_view"),
                value: "bird's-eye view",
              },
              {
                label: t('prompt_presets.blurred_background'),
                value: 'blurred background',
              },
              {
                label: t('prompt_presets.medium_long_shot'),
                value: 'medium long shot',
              },
              { label: t('prompt_presets.cowboy_shot'), value: 'cowboy shot' },
              { label: t('prompt_presets.wide_shot'), value: 'wide shot' },
              {
                label: t('prompt_presets.ultra-wide_shot'),
                value: 'ultra-wide shot',
              },
              {
                label: t('prompt_presets.front_profile_photo'),
                value: 'front profile photo',
              },
              {
                label: t('prompt_presets.side_profile_photo'),
                value: 'side profile photo',
              },
              { label: t('prompt_presets.from_below'), value: 'from below' },
              { label: t('prompt_presets.from_above'), value: 'from above' },
              {
                label: t('prompt_presets.depth_of_field'),
                value: 'depth of field',
              },
            ],
          },
          {
            category: t('prompt_presets.lighting'),
            labels: [
              {
                label: t('prompt_presets.ambient_light'),
                value: 'ambient light',
              },
              { label: t('prompt_presets.backlight'), value: 'backlight' },
              { label: t('prompt_presets.top_light'), value: 'top light' },
              { label: t('prompt_presets.side_light'), value: 'side light' },
              { label: t('prompt_presets.rim_light'), value: 'rim light' },
              { label: t('prompt_presets.neon_lights'), value: 'neon lights' },
              { label: t('prompt_presets.city_lights'), value: 'city lights' },
              {
                label: t('prompt_presets.cinematic_lighting'),
                value: 'cinematic lighting',
              },
              { label: t('prompt_presets.stage_light'), value: 'stage light' },
              { label: t('prompt_presets.day'), value: 'day' },
              { label: t('prompt_presets.night'), value: 'night' },
              { label: t('prompt_presets.twilight'), value: 'twilight' },
              { label: t('prompt_presets.sparkle'), value: 'sparkle' },
            ],
          },
          {
            category: t('prompt_presets.background'),
            labels: [
              {
                label: t('prompt_presets.white_background'),
                value: 'white background',
              },
              {
                label: t('prompt_presets.clean_background'),
                value: 'clean background',
              },
              {
                label: t('prompt_presets.gradient_background'),
                value: 'gradient background',
              },
              { label: t('prompt_presets.cloud'), value: 'cloud' },
              { label: t('prompt_presets.blue_sky'), value: 'blue sky' },
              { label: t('prompt_presets.cafe'), value: 'cafe' },
              { label: t('prompt_presets.cityscape'), value: 'cityscape' },
              { label: t('prompt_presets.castle'), value: 'castle' },
              { label: t('prompt_presets.grassland'), value: 'grassland' },
              { label: t('prompt_presets.forest'), value: 'forest' },
              { label: t('prompt_presets.classroom'), value: 'classroom' },
              { label: t('prompt_presets.library'), value: 'library' },
              { label: t('prompt_presets.gym'), value: 'gym' },
              { label: t('prompt_presets.stage'), value: 'stage' },
              { label: t('prompt_presets.village'), value: 'village' },
              { label: t('prompt_presets.pier'), value: 'pier' },
              { label: t('prompt_presets.field'), value: 'field' },
              { label: t('prompt_presets.restaurant'), value: 'restaurant' },
              { label: t('prompt_presets.clock_tower'), value: 'clock tower' },
              {
                label: t('prompt_presets.convenience_store'),
                value: 'convenience store',
              },
              { label: t('prompt_presets.skyscraper'), value: 'skyscraper' },
              { label: t('prompt_presets.cave'), value: 'cave' },
              { label: t('prompt_presets.ocean'), value: 'ocean' },
              { label: t('prompt_presets.desert'), value: 'desert' },
              { label: t('prompt_presets.lake'), value: 'lake' },
              { label: t('prompt_presets.aquarium'), value: 'aquarium' },
              { label: t('prompt_presets.stadium'), value: 'stadium' },
              { label: t('prompt_presets.onsen'), value: 'onsen' },
              { label: t('prompt_presets.garden'), value: 'garden' },
              {
                label: t('prompt_presets.ferris_wheel'),
                value: 'ferris wheel',
              },
              { label: t('prompt_presets.church'), value: 'church' },
              { label: t('prompt_presets.bus_stop'), value: 'bus stop' },
              { label: t('prompt_presets.ruins'), value: 'ruins' },
              { label: t('prompt_presets.waterfall'), value: 'waterfall' },
              { label: t('prompt_presets.park'), value: 'park' },
              {
                label: t('prompt_presets.flower_field'),
                value: 'flower field',
              },
              {
                label: t('prompt_presets.leaves_falling'),
                value: 'leaves falling',
              },
              { label: t('prompt_presets.snowy'), value: 'snowy' },
              { label: t('prompt_presets.rainy'), value: 'rainy' },
              { label: t('prompt_presets.starry_sky'), value: 'starry sky' },
              {
                label: t('prompt_presets.cosmic_background'),
                value: 'cosmic background',
              },
            ],
          },
        ],
      },
    ],
    [model, t, kusaStyleDataWithTags],
  );

  // Filter gridData based on model
  const filteredGridData = useMemo(() => {
    const isAutoModel = model === 'Auto Model';
    const isGeminiPro = model === 'Gemini Pro';

    // Anime models (Art Pro, Art Unlimited, etc.): hide all grids
    const isAnimeModel =
      model === 'Art Pro' ||
      model === 'Art Unlimited' ||
      model === 'Animagine' ||
      model === 'Noobai' ||
      model === 'Illustrious' ||
      model === 'KusaXL';

    if (isAnimeModel) {
      return [];
    }

    // Auto Model: show all grids (will resolve at generation time)
    if (isAutoModel) {
      return gridData;
    }

    // General models: filter based on requirements
    return gridData
      .map(category => ({
        ...category,
        labels: category.labels.filter(label => {
          // requiresBananaPro (🍌 icon): only show for Gemini Pro
          if ((label as any).requiresBananaPro) {
            return isGeminiPro;
          }
          // requiresSeedream (✨ icon): show for all general models
          return true;
        }),
      }))
      .filter(category => category.labels.length > 0);
  }, [gridData, model]);

  return {
    promptPresets,
    kusaStyleData: kusaStyleDataWithTags,
    gridData: filteredGridData,
  };
};
