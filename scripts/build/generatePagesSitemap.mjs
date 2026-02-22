import { LANGUAGES } from '../../language.mjs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const generatePagesSitemap = async () => {
  const pages = []
  const excludePages = ['blog', 'api']
  const pagesPath = path.join(__dirname, '../../src/pages')
  const recursiveReadDir = async (dir, prefix = '') => {
    const files = await fs.readdir(dir)
    for (const file of files) {
      if (excludePages.includes(file)) continue
      if (file.startsWith('_')) continue
      const stat = await fs.stat(path.join(dir, file))
      if (stat.isDirectory()) {
        await recursiveReadDir(
          path.join(dir, file),
          prefix ? `${prefix}/${file}` : file
        )
      } else {
        if (!file.endsWith('.tsx')) continue
        if (file.match(/^\[.+?\].tsx$/)) continue
        if (prefix && file === 'index.tsx') {
          pages.push(prefix)
        } else {
          pages.push(
            prefix
              ? `${prefix}/${file.replace('.tsx', '')}`
              : file.replace('.tsx', '')
          )
        }
      }
    }
  }
  await recursiveReadDir(pagesPath)
  // 读入 /api/sitemap.xml.ts
  const sitemap = await fs.readFile(
    path.join(__dirname, '../../api/sitemap.xml.ts'),
    'utf-8'
  )
  // 替换 <!--pages-->
  const languages = LANGUAGES.filter((lang) => lang !== 'en')
  const sitemapStr = pages
    .map(
      (page) => `<url>
    <loc>https://komiko.app/${page}</loc>
    <lastmod>2024-08-21</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>
  ${languages
    .map(
      (lang) => `<url>
    <loc>https://komiko.app/${lang}/${page}</loc>
    <lastmod>2024-08-21</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n')}
  `
    )
    .join('\n')
  let newSitemap = sitemap
    .replace('<!--pages-->', sitemapStr);
  const siteUtilsFile = await fs.readFile(
    path.join(__dirname, '../../api/_utils/sitemap.ts'),
    'utf-8'
  );
  const siteUtilsStr = siteUtilsFile
    .replace('/* languages */', languages.map((lang) => `"${lang}"`).join(','));
  await fs.writeFile(
    path.join(__dirname, '../../api/_utils/sitemap.ts'),
    siteUtilsStr
  );
  await fs.writeFile(
    path.join(__dirname, '../../api/sitemap.xml.ts'),
    newSitemap
  )
}

generatePagesSitemap()
