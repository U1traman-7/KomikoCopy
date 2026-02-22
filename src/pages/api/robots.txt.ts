export const runtime = 'edge';

// 简化的 robots.txt - 只指向 sitemap-index，由 sitemap-index 列出所有子 sitemap
const robotsTxt = `User-agent: *
Allow: /

# Disallow NSFW variant pages from search indexing
Disallow: /*nsfw*
Disallow: /*porn*
Disallow: /*sexy*
Disallow: /*sex*
Disallow: /*erotic*
Disallow: /*adult*
Disallow: /*nude*
Disallow: /*r18*

# Canonical domain
Host: https://komiko.app

# Sitemap index - 包含所有子 sitemap (tags, characters, variants, etc.)
Sitemap: https://komiko.app/v2/api/sitemap-index.xml
`;

export default async function handler() {
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
