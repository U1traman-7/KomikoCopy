/**
 * 多语言文本工具
 * 用于处理数据库中存储的多语言JSON字段
 */

export type I18nText = {
  en: string;
  'zh-CN'?: string;
  'zh-TW'?: string;
  ja?: string;
  ko?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  ru?: string;
  hi?: string;
  id?: string;
  th?: string;
  vi?: string;
};

export type SupportedLocale = keyof I18nText;

/**
 * 从角色数据中提取本地化文本
 * 支持两种数据格式：
 * 1. 直接多语言对象：{"en": "...", "zh-CN": "..."}
 * 2. i18n 列格式：从 charData.i18n[field] 中提取
 *
 * @param charData - 角色数据对象
 * @param field - 字段名（intro, personality 等）
 * @param locale - 当前语言代码
 * @returns 本地化后的文本
 */
export function getLocalizedField(
  charData: any,
  field:
    | 'intro'
    | 'personality'
    | 'interests'
    | 'gender'
    | 'profession'
    | 'description'
    | 'character_name'
    | 'name'
    | 'category',
  locale: string = 'en',
): string {
  if (!charData) {
    return '';
  }

  // 优先级 1: 检查 i18n 列
  if (charData.i18n && charData.i18n[field]) {
    const i18nValue = charData.i18n[field];
    if (i18nValue && typeof i18nValue === 'object') {
      // i18n 列中有翻译
      const translated = i18nValue[locale] || i18nValue.en;
      if (translated) return translated;
    }
  }

  // 优先级 2: 返回原始字符串值（向后兼容）
  const fieldValue = charData[field];
  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  return '';
}
