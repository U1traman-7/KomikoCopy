import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LANGUAGES } from '../../../../language.mjs';
import { genURLXML } from '../../../../api/_utils/sitemap';

export const config = {
  api: {
    responseLimit: '8mb',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const languages = LANGUAGES;
const defaultLanguage = 'en';

// Helper function to create URL-friendly slug
const createUrlSlug = (id: string, type: string): string => {
  const baseName = id.replace(/-(v|i)$/, '');
  const typeSlugMap: { [key: string]: string } = {
    video: 'video',
    image: 'image',
    expression: 'expression',
    dance: 'dance',
  };
  const typeSuffix = typeSlugMap[type] || type;
  return `${baseName}-${typeSuffix}`;
};

const fetchTemplates = async (
  client: SupabaseClient,
  start: number,
  end: number,
) => {
  const { data, error } = await client
    .from('style_templates')
    .select('id, type')
    .order('id', { ascending: true })
    .range(start, end);
  if (error) {
    return null;
  }
  return data;
};

/**
 * Effects Sitemap Generator
 * 为所有 effect 模板生成 sitemap URL
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const SIZE = 1000;
    const LIMIT = 50000;

    // 设置响应头
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800',
    );

    // 写入 XML 头部
    res.write(`<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`);

    // 分批获取模板数据
    let currentOffset = 0;
    let hasMore = true;
    const seenSlugs = new Set<string>();

    while (hasMore && currentOffset < LIMIT) {
      const batchEnd = Math.min(currentOffset + SIZE - 1, LIMIT - 1);
      const data = await fetchTemplates(supabase, currentOffset, batchEnd);

      if (!data || data.length === 0) {
        break;
      }

      // 为每个模板生成 URL
      for (const template of data) {
        const urlSlug = createUrlSlug(template.id, template.type);

        // 去重（避免同一个模板生成多个 URL）
        if (seenSlugs.has(urlSlug)) {
          continue;
        }
        seenSlugs.add(urlSlug);

        // 默认语言（英文）
        res.write(
          genURLXML(`${baseURL}/effects/${urlSlug}`, {
            changefreq: 'always',
            priority: 0.8,
          }),
        );

        // 其他语言版本
        languages
          .filter(lang => lang !== defaultLanguage)
          .forEach(lang => {
            res.write(
              genURLXML(`${baseURL}/${lang}/effects/${urlSlug}`, {
                changefreq: 'always',
                priority: 0.8,
              }),
            );
          });
      }

      if (data.length < SIZE || batchEnd >= LIMIT - 1) {
        hasMore = false;
      }
      currentOffset = batchEnd + 1;
    }

    // 写入 XML 尾部
    res.write('</urlset>');
    res.end();
  } catch (error) {
    console.error('[Effects Sitemap] Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate effects sitemap' });
  }
}
