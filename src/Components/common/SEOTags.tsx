export const getSafeLocale = (routerLocale?: string): string => {
  const supportedLocales = [
    'en', 'ja', 'id', 'hi', 'zh-CN', 'zh-TW', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'th', 'vi'
  ];
  
  if (routerLocale && supportedLocales.includes(routerLocale)) {
    return routerLocale;
  }
  
  return 'en'; // 默认语言
};

interface SEOTagsProps {
  canonicalPath: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  structuredData?: any;
  locale?: string;
}

const LANGUAGES = [
  'en',
  'ja',
  'id',
  'hi',
  'zh-CN',
  'zh-TW',
  'ko',
  'es',
  'fr',
  'de',
  'pt',
  'ru',
  'th',
  'vi',
];

export function SEOTags({
  canonicalPath,
  title,
  description,
  keywords,
  ogImage = '/images/social.webp',
  structuredData,
  locale: propLocale,
}: SEOTagsProps) {
  const baseUrl = 'https://komiko.app';
  
  const locale = propLocale || 'en';
  
  if (!LANGUAGES.includes(locale) && locale !== 'en') {
    console.warn(`Unsupported locale: ${locale}, falling back to 'en'`);
  }
  
  const isDefaultLocale = locale === 'en';

  // 每个语言版本都有自己的canonical URL
  const canonicalUrl = isDefaultLocale
    ? `${baseUrl}${canonicalPath}`
    : `${baseUrl}/${locale}${canonicalPath}`;

  const ogUrl = isDefaultLocale
    ? `${baseUrl}${canonicalPath}`
    : `${baseUrl}/${locale}${canonicalPath}`;

  return (
    <>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}
      <link rel='canonical' href={canonicalUrl} />

      {/* Hreflang tags */}
      <link
        rel='alternate'
        hrefLang='x-default'
        href={`${baseUrl}${canonicalPath}`}
      />
      {LANGUAGES.map(lang => (
        <link
          key={lang}
          rel='alternate'
          hrefLang={lang}
          href={
            lang === 'en'
              ? `${baseUrl}${canonicalPath}`
              : `${baseUrl}/${lang}${canonicalPath}`
          }
        />
      ))}

      {/* Open Graph */}
      <meta property='og:type' content='website' />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={ogUrl} />
      <meta property='og:image' content={ogImage} />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={ogImage} />

      {/* 结构化数据 */}
      {structuredData && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </>
  );
}
