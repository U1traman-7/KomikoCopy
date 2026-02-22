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

// const languageCount = LANGUAGES.length;

const LIMIT = 50000;

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const SIZE = 1000;

type CharacterRow = {
  character_uniqid: string;
};

const defaultLanguage = 'en';

const fetchOfficialCharacters = async (
  client: SupabaseClient,
  start: number,
  end: number,
) => {
  const { data, error } = await client
    .from('CustomCharacters')
    .select('character_uniqid')
    .eq('is_official', true)
    .order('id', { ascending: true })
    .range(start, end);
  if (error) return null;
  return data as CharacterRow[];
};

const genCharactersMap = (rows: CharacterRow[]) => {
  if (!rows || rows.length === 0) return '';
  // const i18nStr = LANGUAGES.filter(l => l !== defaultLanguage)
  //   .map(lang =>
  //     rows
  //       .map(r =>
  //         genURLXML(
  //           `${baseURL}/${lang}/character/${encodeURIComponent(r.character_uniqid)}`,
  //           {
  //             changefreq: 'always',
  //             priority: 0.8,
  //           },
  //         ),
  //       )
  //       .join('\n'),
  //   )
  //   .join('\n');

  return rows
    .map(r =>
      genURLXML(
        `${baseURL}/character/${encodeURIComponent(r.character_uniqid)}`,
        {
          changefreq: 'always',
          priority: 0.8,
        },
      ),
    )
    .join('\n');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Each character contributes languageCount URLs. Keep total under LIMIT
  const maxCharacters = LIMIT;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

  res.write(
    `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`,
  );

  let currentOffset = 0;
  const endOffset = maxCharacters - 1;
  let hasMore = true;

  while (hasMore && currentOffset <= endOffset) {
    const batchEnd = Math.min(currentOffset + SIZE - 1, endOffset);
    const data = await fetchOfficialCharacters(
      supabase,
      currentOffset,
      batchEnd,
    );
    if (!data || data.length === 0) break;

    const urlXml = genCharactersMap(data);
    res.write(urlXml);

    if (data.length < SIZE || batchEnd >= endOffset) {
      hasMore = false;
    }
    currentOffset = batchEnd + 1;
  }

  res.write('</urlset>');
  res.end();
}
