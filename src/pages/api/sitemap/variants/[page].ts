import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { LANGUAGES } from '../../../../../language.mjs';
import { genURLXML } from '../../../../../api/_utils/sitemap';

export const config = {
  api: {
    responseLimit: '8mb',
  },
};

const languageCount = LANGUAGES.length; // includes 'en'
const LIMIT = 50000; // Google sitemap single file hard limit
const SIZE = 1000; // batch size for streaming
const baseURL = process.env.NEXT_PUBLIC_API_URL;

import { containsNsfwKeywords } from '../../../../utilities/nsfw';

const VARIANT_ROOT = path.join(process.cwd(), 'src/data/variants');
const TOOLS = [
  'oc-maker',
  'playground',
  'ai-anime-generator',
  'ai-comic-generator',
  'image-animation-generator',
  'video-to-video',
];

function listVariantEntries(): Array<{ tool: string; slug: string }> {
  const entries: Array<{ tool: string; slug: string }> = [];
  for (const tool of TOOLS) {
    const dir = path.join(VARIANT_ROOT, tool);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const slug = f.replace(/\.json$/, '');
      // 跳过包含NSFW关键词的variants
      if (containsNsfwKeywords(slug)) {
        continue;
      }
      entries.push({ tool, slug });
    }
  }
  return entries;
}

// Generate XML for a batch of variant entries
function genVariantsXML(batch: Array<{ tool: string; slug: string }>): string {
  const defaultLang = 'en';
  const otherLangs = LANGUAGES.filter(l => l !== defaultLang);
  let xml = '';
  for (const { tool, slug } of batch) {
    // default language
    xml += genURLXML(`${baseURL}/${tool}/${slug}`, {
      changefreq: 'always',
      priority: 0.8,
    });
    // i18n
    for (const lang of otherLangs) {
      xml += genURLXML(`${baseURL}/${lang}/${tool}/${slug}`, {
        changefreq: 'always',
        priority: 0.8,
      });
    }
  }
  return xml;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  const pageNo = Number(page) || 1;

  const variants = listVariantEntries();
  const urlsPerVariant = languageCount; // one per locale incl en
  const maxVariantsPerPage = Math.floor(LIMIT / urlsPerVariant) || 1;

  const startIndex = (pageNo - 1) * maxVariantsPerPage;
  const endIndex = Math.min(startIndex + maxVariantsPerPage, variants.length);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

  // Write XML header
  res.write(`<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`);

  let cursor = startIndex;
  while (cursor < endIndex) {
    const batch = variants.slice(cursor, Math.min(cursor + SIZE, endIndex));
    const xmlChunk = genVariantsXML(batch);
    res.write(xmlChunk);
    cursor += batch.length;
  }

  // Footer
  res.write('</urlset>');
  res.end();
}

