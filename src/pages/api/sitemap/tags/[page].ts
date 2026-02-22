import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LANGUAGES } from '../../../../../language.mjs';
import { genURLXML } from '../../../../../api/_utils/sitemap';

export const config = {
  api: {
    responseLimit: '8mb',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const LIMIT = 50000;

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const SIZE = 1000;

const fetchTagsData = async (
  supabase: SupabaseClient,
  start: number,
  end: number,
) => {
  const { data, error } = await supabase
    .from('tags')
    .select('name, is_nsfw, post_count, tag_type')
    .gt('post_count', 100) // 只获取 post_count > 100 的热门标签
    .eq('is_nsfw', false) // 只获取非NSFW标签
    .order('id', { ascending: true })
    .range(start, end);

  if (error) {
    return null;
  }
  return data;
};

const languages = LANGUAGES;
const defaultLanguage = 'en';

// 生成单个 tag 的所有 URL，返回 URL 数组
const genTagUrls = (tag: {
  name: string;
  is_nsfw: boolean;
  post_count: number;
  tag_type: string | null;
}): string[] => {
  const urls: string[] = [];
  const variantTypes = ['fanart', 'pfp', 'oc', 'wallpaper', 'pictures'];
  const encodedName = encodeURIComponent(tag.name);
  // 只有 'ip' 和 'descriptor' 类型的 tag 才有 variant 页面
  const hasVariants = tag.tag_type === 'ip' || tag.tag_type === 'descriptor';

  // 主页面（所有语言）
  urls.push(
    genURLXML(`${baseURL}/tags/${encodedName}`, {
      changefreq: 'always',
      priority: 0.8,
    }),
  );

  languages
    .filter(lang => lang !== defaultLanguage)
    .forEach(lang => {
      urls.push(
        genURLXML(`${baseURL}/${lang}/tags/${encodedName}`, {
          changefreq: 'always',
          priority: 0.8,
        }),
      );
    });

  // Variant 页面（仅 'ip' 和 'descriptor' 类型的 tag）
  if (hasVariants) {
    variantTypes.forEach(variant => {
      urls.push(
        genURLXML(`${baseURL}/tags/${encodedName}/${variant}`, {
          changefreq: 'always',
          priority: 0.8,
        }),
      );

      languages
        .filter(lang => lang !== defaultLanguage)
        .forEach(lang => {
          urls.push(
            genURLXML(`${baseURL}/${lang}/tags/${encodedName}/${variant}`, {
              changefreq: 'always',
              priority: 0.8,
            }),
          );
        });
    });
  }

  return urls;
};

// 每页固定处理的 tag 数量
// 每个 tag 最多 84 个 URL（6 页面类型 × 14 语言），50000 / 84 ≈ 595
// 使用 200 作为安全值，减少生成时间避免 Google 爬虫超时
const PAGE_SIZE = 200;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { page } = req.query;
  const pageNo = Number(page) || 1;

  // 计算当前页面应该处理的 tag 范围
  const startOffset = (pageNo - 1) * PAGE_SIZE;
  const endOffset = startOffset + PAGE_SIZE - 1;

  // 先检查该页面是否有数据
  const initialData = await fetchTagsData(supabase, startOffset, startOffset);
  if (!initialData || initialData.length === 0) {
    // 该页面没有数据，返回 404
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  // 设置响应头
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

  // 写入XML头部
  res.write(`<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`);

  // 分批获取数据并动态统计 URL 数量
  let currentOffset = startOffset;
  let totalUrlCount = 0;

  while (currentOffset <= endOffset && totalUrlCount < LIMIT) {
    const batchEnd = Math.min(currentOffset + SIZE - 1, endOffset);
    const data = await fetchTagsData(supabase, currentOffset, batchEnd);

    if (!data || data.length === 0) {
      break;
    }

    // 逐个 tag 生成 URL，动态统计数量
    for (const tag of data) {
      const urls = genTagUrls(tag);

      // 检查是否会超过限制
      if (totalUrlCount + urls.length > LIMIT) {
        break;
      }

      res.write(urls.join('\n') + '\n');
      totalUrlCount += urls.length;
    }

    // 如果已达到限制或没有更多数据，停止
    if (totalUrlCount >= LIMIT || data.length < SIZE) {
      break;
    }

    currentOffset = batchEnd + 1;
  }

  // 写入XML尾部
  res.write('</urlset>');
  res.end();
}
