/* eslint-disable */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { genURLXML, languages } from './_utils/sitemap.js';

const baseURL = process.env.NEXT_PUBLIC_API_URL;
// const genCharactersMap = async (supabase: SupabaseClient) => {
//   const basePath = baseURL + '/character/';
//   // Get both regular characters and official characters for variant pages
//   const { data, error } = await supabase
//     .from('CustomCharacters')
//     .select('character_uniqid, is_official');
//   if (error) {
//     return '';
//   }
//   if (data) {
//     // Character variant types for official characters only
//     const variantTypes = ['fanart', 'pfp', 'oc', 'wallpaper', 'pictures'];
    
//     // Regular character pages (all characters)
//     const regularCharPages = data
//       .map(d =>
//         genURLXML(basePath + d.character_uniqid, {
//           changefreq: 'always',
//           priority: 0.8,
//         }),
//       )
//       .join('\n');
    
//     // Character variant pages (only official characters)
//     const variantPages = data
//       .filter(d => d.is_official) // Only official characters
//       .flatMap(d =>
//         variantTypes.map(variant =>
//           genURLXML(basePath + d.character_uniqid + '/' + variant, {
//             changefreq: 'always',
//             priority: 0.8,
//           }),
//         ),
//       )
//       .join('\n');
    
//     // i18n versions
//     const i18nStr = languages
//       .map(lang => {
//         const regularI18n = data
//           .map(d =>
//             genURLXML(
//               baseURL + '/' + lang + '/character/' + d.character_uniqid,
//               { changefreq: 'always', priority: 0.8 },
//             ),
//           )
//           .join('\n');
        
//         const variantI18n = data
//           .filter(d => d.is_official)
//           .flatMap(d =>
//             variantTypes.map(variant =>
//               genURLXML(
//                 baseURL + '/' + lang + '/character/' + d.character_uniqid + '/' + variant,
//                 { changefreq: 'always', priority: 0.8 },
//               ),
//             ),
//           )
//           .join('\n');
        
//         return regularI18n + '\n' + variantI18n;
//       })
//       .join('\n');
    
//     return regularCharPages + '\n' + variantPages + '\n' + i18nStr;
//   }
//   return '';
// };

const genPostsMap = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('AppPosts').select('uniqid');
  if (error) {
    return '';
  }

  if (data) {
    const i18nStr = languages
      .map(lang => {
        return data
          .map(d =>
            genURLXML(baseURL + '/' + lang + '/post/' + d.uniqid, {
              changefreq: 'always',
              priority: 0.8,
            }),
          )
          .join('\n');
      })
      .join('\n');
    return (
      data
        .map(d =>
          genURLXML(baseURL + '/post/' + d.uniqid, {
            changefreq: 'always',
            priority: 0.8,
          }),
        )
        .join('\n') + i18nStr
    );
  }
  return '';
};

const genWorldsMap = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('CustomCharacters')
    .select('character_uniqid');
  if (error) {
    return '';
  }
  if (data) {
    const i18nStr = languages
      .map(lang => {
        return data
          .map(d =>
            genURLXML(
              baseURL +
                '/' +
                lang +
                '/world?character_id=' +
                d.character_uniqid,
              { changefreq: 'always', priority: 0.8 },
            ),
          )
          .join('\n');
      })
      .join('\n');
    return (
      data
        .map(d =>
          genURLXML(baseURL + '/world?character_id=' + d.character_uniqid, {
            changefreq: 'always',
            priority: 0.8,
          }),
        )
        .join('\n') + i18nStr
    );
  }
  return '';
};

// const genTagsMap = async (supabase: SupabaseClient) => {
//   const { data, error } = await supabase.from('tags').select('name');
//   if (error) {
//     return '';
//   }
//   if (!data) {
//     return '';
//   }
//   const i18nStr = languages
//     .map(lang => {
//       return data
//         .map(d =>
//           genURLXML(
//             baseURL + '/' + lang + '/tags/' + encodeURIComponent(d.name),
//             {
//               changefreq: 'always',
//               priority: 0.8,
//             },
//           ),
//         )
//         .join('\n');
//     })
//     .join('\n');
//   return (
//     data
//       .map(d =>
//         genURLXML(baseURL + '/tags/' + encodeURIComponent(d.name), {
//           changefreq: 'always',
//           priority: 0.8,
//         }),
//       )
//       .join('\n') + i18nStr
//   );
// };

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const promises = [
    // genCharactersMap(supabase).catch(e => ''), // Moved to separate character sitemap due to large quantity
    genPostsMap(supabase).catch(e => ''),
    genWorldsMap(supabase).catch(e => ''),
    // genTagsMap(supabase).catch(e => ''), // Already in separate tag sitemap
  ];
  let xmls = await Promise.all(promises);
  let subPagesXml = '';
  if (xmls?.length) {
    subPagesXml = xmls.join('\n');
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://komiko.app</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
    </url>
    ${languages
      .map(
        lang => `<url>
        <loc>https://komiko.app/${lang}</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.8</priority>
    </url>`,
      )
      .join('\n')}
    <!--pages-->
    <url>
        <loc>https://komiko.app/blog</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://komiko.app/blog/20240820-10-best-websites-for-character-creation</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://komiko.app/blog/20240821-how-to-create-interactive-ai-characters-for-your-stories-and-games</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://komiko.app/blog/20240819-ai-character-drawing-step-by-step-instructions-on-how-to-draw-ai-oc</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://komiko.app/blog/aug17-oshi-no-ko-2nd-season</loc>
        <lastmod>2024-08-21</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
    ${subPagesXml}
</urlset>
  `;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
