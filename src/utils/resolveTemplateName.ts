import i18n, { type TFunction } from 'i18next';

/**
 * 解析模板名称：优先从 DB i18n 列读取对应语言翻译，回退到本地 i18n JSON 文件
 * @param t - i18next 翻译函数
 * @param nameKey - 模板的 name_key（如 'anime-mv', 'titles.xxx', 'style-templates:xxx'）
 * @param defaultValue - 可选的默认值，当所有翻译路径都失败时使用
 * @param dbI18n - 可选的数据库 i18n 数据，格式 { name: { en: "...", ja: "...", ... } }
 */
export const resolveTemplateName = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
  t: TFunction | ((...args: any) => string),
  nameKey: string,
  defaultValue?: string,
  dbI18n?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null,
): string => {
  // 运行时类型检查：nameKey 必须是非空字符串
  if (!nameKey || typeof nameKey !== 'string') {
    return defaultValue || '';
  }

  // 优先从 DB i18n 列读取对应语言的翻译
  if (dbI18n?.name) {
    const rawLang = i18n.language;
    const lang = typeof rawLang === 'string' && rawLang ? rawLang : 'en';
    const langBase = lang.includes('-') ? lang.split('-')[0] : lang;

    const name =
      dbI18n.name[lang] || dbI18n.name[langBase] || dbI18n.name['en'];
    if (name) {
      return name;
    }
  }

  // 如果已经包含命名空间（如 'style-templates:xxx'）
  if (nameKey.includes(':')) {
    const result = t(nameKey, { defaultValue: '' });
    if (result && result !== nameKey) {
      return result;
    }
  }

  // 尝试多个可能的翻译路径
  const fallbackKeys = [
    `style-templates:titles.${nameKey}`,
    `style-templates:effects.${nameKey}`,
    `style-templates:dances.${nameKey}`,
    `style-templates:${nameKey}`,
  ];

  for (const candidate of fallbackKeys) {
    const translated = t(candidate, { defaultValue: '' });
    if (translated && translated !== candidate) {
      return translated;
    }
  }

  // 如果都没有翻译，将 kebab-case 转换为 Title Case
  return (
    defaultValue ||
    nameKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

/**
 * 解析模板描述：优先从 DB i18n 列读取对应语言翻译，回退到原始 description 字段
 * @param dbI18n - 数据库 i18n 数据，格式 { description: { en: "...", ja: "...", ... } }
 * @param fallback - 原始 description 字段（英文）
 */
export const resolveTemplateDescription = (
  dbI18n?: { description?: Record<string, string> } | null,
  fallback?: string,
): string => {
  if (dbI18n?.description) {
    const rawLang = i18n.language;
    const lang = typeof rawLang === 'string' && rawLang ? rawLang : 'en';
    const langBase = lang.includes('-') ? lang.split('-')[0] : lang;

    const desc =
      dbI18n.description[lang] ||
      dbI18n.description[langBase] ||
      dbI18n.description['en'];
    if (desc) {
      return desc;
    }
  }
  return fallback || '';
};
