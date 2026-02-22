import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const baseURL = process.env.NEXT_PUBLIC_API_URL;

// 与 tags/[page].ts 和 characters/[page].ts 保持一致
// 每个 tag/character 最多 84 个 URL，50000 / 84 ≈ 595
// 使用 200 作为安全值，减少生成时间避免 Google 爬虫超时
const PAGE_SIZE = 200;

const getTagsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .gt('post_count', 100) // 只计算 post_count > 100 的热门标签
    .eq('is_nsfw', false);

  if (error) {
    console.error('Error fetching tags count:', error);
    return 0;
  }
  return count || 0;
};

const getCharactersCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('CustomCharacters')
    .select('*', { count: 'exact', head: true })
    .eq('is_official', true);

  if (error) {
    console.error('Error fetching characters count:', error);
    return 0;
  }
  return count || 0;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const [tagsCount, charactersCount] = await Promise.all([
    getTagsCount(),
    getCharactersCount(),
  ]);

  const tagsPages = Math.ceil(tagsCount / PAGE_SIZE);
  const charactersPages = Math.ceil(charactersCount / PAGE_SIZE);

  const now = new Date().toISOString().split('T')[0];

  // 生成 sitemap 列表
  const sitemaps: string[] = [];

  // 主 sitemap
  sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);

  // Official characters sitemap
  sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/v2/api/sitemap/official-characters</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);

  // Tags sitemaps
  for (let i = 1; i <= tagsPages; i++) {
    sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/v2/api/sitemap/tags/${i}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);
  }

  // Characters sitemaps
  for (let i = 1; i <= charactersPages; i++) {
    sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/v2/api/sitemap/characters/${i}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);
  }

  // Variants sitemap (tool landing pages)
  sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/v2/api/sitemap/variants/1</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);

  // Effects sitemap
  sitemaps.push(`
  <sitemap>
    <loc>${baseURL}/v2/api/sitemap/effects</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps.join('')}
</sitemapindex>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=604800',
  );
  res.status(200).send(xml);
}
