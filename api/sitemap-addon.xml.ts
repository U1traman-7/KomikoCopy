/* @deprecated
 * 全量数据， google 处理不了
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { genURLXML, languages } from './_utils/sitemap.js';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const SIZE = 1000;

const fetchTagsData = async (
  supabase: SupabaseClient,
  size: number,
  offset: number,
) => {
  const { data, error } = await supabase
    .from('tags')
    .select('name')
    .eq('is_nsfw', false)
    .order('id', { ascending: true })
    .range(offset, offset + size - 1);

  if (error) {
    return null;
  }
  return data;
};

const exhaustTagsData = async (
  supabase: SupabaseClient,
  controller: ReadableStreamDefaultController<string>,
) => {
  let offset = 0;
  let data = await fetchTagsData(supabase, SIZE, offset);
  // while (data && data.length >= SIZE) {
  while (data) {
    offset += SIZE;
    // data = await fetchTagsData(supabase, SIZE, offset);
    if (!data) {
      return;
    }
    controller.enqueue(genTagsMap(data));
    if (data.length < SIZE) {
      return;
    }
    data = await fetchTagsData(supabase, SIZE, offset + SIZE);
  }
};

const genTagsMap = (data: { name: string }[]) => {
  if (!data) {
    return '';
  }
  
  
  const i18nStr = languages
    .map(lang =>
      data
        .map(d =>
          genURLXML(`${baseURL}/${lang}/tags/${encodeURIComponent(d.name)}`, {
            changefreq: 'always',
            priority: 0.8,
          }),
        )
        .join('\n'),
    )
    .join('\n');
  return (
    data
      .map(d =>
        genURLXML(`${baseURL}/tags/${encodeURIComponent(d.name)}`, {
          changefreq: 'always',
          priority: 0.8,
        }),
      )
      .join('\n') + i18nStr
  );
};
const xmlFooter = '</urlset>';

export async function GET() {
  const stream = new ReadableStream<string>({
    async start(controller) {
      controller.enqueue(xmlHeader);
      await exhaustTagsData(supabase, controller);
      controller.enqueue(xmlFooter);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
