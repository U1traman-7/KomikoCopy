import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  enUS,
  ja,
  zhCN,
  zhTW,
  ko,
  de,
  fr,
  es,
  pt,
  ru,
  th,
  vi,
  hi,
  id,
} from 'date-fns/locale';
import i18n from 'i18next';
import { Post } from '../../state';

// Map i18n language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  en: enUS,
  'en-US': enUS,
  ja,
  'ja-JP': ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  'ko-KR': ko,
  de,
  'de-DE': de,
  fr,
  'fr-FR': fr,
  es,
  'es-ES': es,
  pt,
  'pt-BR': pt,
  ru,
  'ru-RU': ru,
  th,
  'th-TH': th,
  vi,
  'vi-VN': vi,
  hi,
  'hi-IN': hi,
  id,
  'id-ID': id,
};

/**
 * Get date-fns locale based on current i18n language
 */
function getDateFnsLocale(): Locale {
  const currentLang = i18n.language || 'en';
  return localeMap[currentLang] || localeMap[currentLang.split('-')[0]] || enUS;
}

/**
 * Format timestamp to relative time string with i18n support
 */
export function formatRelativeTime(timestamp: string) {
  const date = parseISO(timestamp);
  const locale = getDateFnsLocale();
  return formatDistanceToNow(date, { addSuffix: true, locale });
}

/**
 * Copy text to clipboard (fallback for older browsers)
 */
export const copyText = (text: string) => {
  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.setAttribute('readonly', '');
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
};

/**
 * Check if generation prompt is hidden
 */
export const isHiddenPrompt = (generation: unknown) => {
  if (!generation?.tool || generation?.prompt) {
    return false;
  }

  let metaData = (generation as any)?.meta_data;
  if (typeof metaData === 'string') {
    try {
      metaData = JSON.parse(metaData);
    } catch {
      metaData = null;
    }
  }

  // Hidden if no style_id in meta_data
  return !metaData?.style_id;
};

/**
 * Check if post has OC character ID
 */
export const hasOCCharacterId = (item: Post): boolean => {
  if (item.oc_id) {
    return true;
  }

  if (!item.post_tags || item.post_tags.length === 0) {
    return false;
  }

  // 收集所有可能的 OC 角色 ID（@xxx 和 <xxx>）
  const characterIds: string[] = [];
  item.post_tags.forEach(tag => {
    if (tag.name.startsWith('@')) {
      const id = tag.name.slice(1).trim();
      if (id) {
        characterIds.push(id);
      }
    } else if (tag.name.includes('<') && tag.name.includes('>')) {
      const match = tag.name.match(/<([^>]+)>/);
      if (match && match[1]) {
        characterIds.push(match[1]);
      }
    }
  });

  const uniqueCount = new Set(characterIds).size;
  // 0 个或多个不同角色，都不显示 Adopt OC
  if (uniqueCount !== 1) {
    return false;
  }

  return true;
};

/**
 * Get character ID from post tags
 * Support both @character-id (new format) and <character-id> (old format)
 */
export const getCharacterIdFromTags = (item: Post): string | null => {
  if (item.oc_id) {
    return item.oc_id;
  }

  if (item.post_tags) {
    // Try new @character-id format first
    const atTag = item.post_tags.find(tag => tag.name.startsWith('@'));
    if (atTag) {
      const charId = atTag.name.slice(1).trim();
      if (charId) {
        return charId;
      }
    }

    // Fallback to old <character-id> format
    const angleBracketTag = item.post_tags.find(
      tag => tag.name.includes('<') && tag.name.includes('>'),
    );
    if (angleBracketTag) {
      const match = angleBracketTag.name.match(/<([^>]+)>/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
};

/**
 * Check if post is an OC post
 */
export const isOCPost = (item: Post): boolean => {
  if (item.media_type === 'video') {
    return false;
  }

  if (item.oc_id) {
    return true;
  }

  if (item.generations && item.generations.length > 0) {
    return false;
  }

  return hasOCCharacterId(item);
};
