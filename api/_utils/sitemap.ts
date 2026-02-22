export const genSitemapTemplate = (
  urlset: string,
) => `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

export const languages = [
  /* languages */
];

export const genURLXML = (
  url: string,
  addon?:
    | { lastmod?: string; changefreq?: string; priority?: number }
    | { [key: string]: string | number },
) => {
  addon = addon || {};
  return `
<url>
  <loc>${url}</loc>
  ${Object.keys(addon)
    .map(key => `<${key}>${(addon as any)[key]}</${key}>`)
    .join('\n ')}
</url>
  `;
};
