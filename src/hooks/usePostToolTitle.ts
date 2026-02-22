import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { toolsMappingData } from '../utilities/tools';
import {
  getI2iStyleNameKeyMappingSync,
  getEffectNameKeyMappingSync,
} from '../Components/StyleTemplatePicker/styles/index';
import { getEffectTemplatesSync } from '../Components/StyleTemplatePicker/styles/video';
import { expressionNameKeyMapping } from '../Components/StyleTemplatePicker/StyleGirds/styles';

/**
 * Helper function to clean styleId by removing -v suffix
 * This matches the cleanTemplateId logic in video.ts
 */
const cleanStyleId = (styleId: string): string => styleId.replace(/-v$/, '');

/**
 * Helper function to format styleId to readable name
 * e.g., "super-saiyan" -> "Super Saiyan", "bankai" -> "Bankai"
 */
const formatStyleIdToReadableName = (styleId: string): string =>
  cleanStyleId(styleId)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Helper function to find nameKey from effect templates
 * Fallback when mapping cache is not updated yet
 */
const findEffectNameKey = (styleId: string): string | undefined => {
  const cleanedId = cleanStyleId(styleId);

  // First try the mapping cache
  const mapping = getEffectNameKeyMappingSync();
  if (mapping[cleanedId]) {
    return mapping[cleanedId];
  }

  // Fallback: search in templates directly (like EffectCard does)
  const templates = getEffectTemplatesSync();
  for (const category of templates) {
    for (const template of category.templates) {
      if (template.id === cleanedId) {
        return template.nameKey;
      }
    }
  }

  return undefined;
};

/**
 * Hook to get internationalized tool title based on tool type and metadata
 */
export const usePostToolTitle = () => {
  const { t } = useTranslation('common');
  const { t: styleT } = useTranslation('style-templates');

  const getToolI18nTitle = (
    tool: string,
    meta_data?: string,
    prompt?: string,
  ) => {
    if (!meta_data) {
      return t(toolsMappingData[tool]?.title_key || tool);
    }

    const metaData = typeof meta_data === 'string' ? JSON.parse(meta_data) : {};
    const styleId = metaData.style_id;

    // Helper function to get style name with smart fallback
    const getStyleName = (key?: string): string => {
      // Priority 1: Use template_i18n if available
      if (metaData.template_i18n?.name) {
        const lang = i18n.language || 'en';
        const name =
          metaData.template_i18n.name[lang] ||
          metaData.template_i18n.name[lang.split('-')[0]] ||
          metaData.template_i18n.name.en ||
          metaData.template_i18n.name[
            Object.keys(metaData.template_i18n.name)[0]
          ];
        if (name) {
          return name;
        }
      }

      // Priority 2: Try translation from JSON files if we have a key
      if (key) {
        const translated = styleT(key, { defaultValue: '' });
        // Check if translation succeeded (doesn't look like an i18n key)
        if (translated && !translated.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/)) {
          return translated;
        }
      }

      // Priority 3: Use style_name as final fallback (should be English)
      // Only use if it's not an i18n key format
      if (metaData.style_name) {
        const looksLikeI18nKey = metaData.style_name.match(
          /^[a-z_]+\.[a-zA-Z0-9_]+$/,
        );
        if (!looksLikeI18nKey) {
          return metaData.style_name;
        }
      }

      // Final fallback: format styleId
      return formatStyleIdToReadableName(styleId);
    };

    if (styleId) {
      let key = getI2iStyleNameKeyMappingSync()[styleId];

      if (tool === 'photo_to_anime') {
        if (styleId.startsWith('expression-')) {
          key = expressionNameKeyMapping[styleId];
          const styleName = getStyleName(
            key ? `expressions.${key}` : undefined,
          );
          return `${styleName} ${t('post_card.expression')}`;
        }

        // 兼容旧数据
        return prompt
          ? t(toolsMappingData[tool]?.title_key || tool)
          : `${t('post_card.turn_into')} ${getStyleName(key)}`;
      }

      if (tool === 'video-to-video') {
        return `${t('post_card.video_to')} ${getStyleName(key)}`;
      }

      if (tool === 'image_animation') {
        if (['effect', 'template'].includes(metaData?.mode)) {
          const nameKey = findEffectNameKey(styleId);
          const effectName = getStyleName(
            nameKey ? `effects.${nameKey}` : undefined,
          );
          return `${effectName} ${t('post_card.effect')}`;
        }

        if (metaData.mode === 'dance') {
          return t('post_card.dance_video_generator');
        }
      }

      if (tool === 'video-effect') {
        const nameKey = findEffectNameKey(styleId);
        const effectName = getStyleName(
          nameKey ? `effects.${nameKey}` : undefined,
        );
        return `${effectName} ${t('post_card.effect')}`;
      }

      if (tool === 'dance-video-generator') {
        return t('post_card.dance_video_generator');
      }
    }

    return t(toolsMappingData[tool]?.title_key || tool);
  };

  return { getToolI18nTitle };
};
