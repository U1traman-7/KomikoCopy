/**
 * Post-generation hooks
 * 自动更新 constants/index.tsx 和 i18n/locales/en/common.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '../../..')

/**
 * 将关键词转换为 slug
 */
function keywordToSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * 将 slug 转换为 i18n key
 */
function slugToI18nKey(slug) {
  return slug.replace(/-/g, '_')
}

/**
 * 获取下一个可用的 ID
 */
function getNextAvailableId(constantsContent) {
  const idMatches = constantsContent.match(/id:\s*(\d+)/g)
  if (!idMatches) return 170
  
  const ids = idMatches.map(match => parseInt(match.match(/\d+/)[0]))
  return Math.max(...ids) + 1
}

/**
 * 添加工具到 constants/index.tsx
 */
export function addToolToConstants(toolType, keyword, title) {
  const constantsPath = path.join(PROJECT_ROOT, 'src/constants/index.tsx')
  let content = fs.readFileSync(constantsPath, 'utf8')
  
  const slug = keywordToSlug(keyword)
  const i18nKey = slugToI18nKey(slug)
  const path_url = `/${toolType}/${slug}`
  
  // 检查是否已存在
  if (content.includes(`path: '${path_url}'`)) {
    console.log(`  ⏭️  已存在于 constants: ${path_url}`)
    return false
  }
  
  // 获取下一个 ID
  const nextId = getNextAvailableId(content)
  
  // 构建新条目
  const newEntry = `      {
        id: ${nextId},
        path: '${path_url}',
        title: '${title}',
        title_key: 'ai_tools.illustration.${i18nKey}.title',
        recommended: false,
        derivative: true,
      },`
  
  // 找到插入位置（在 illustration 分类的最后一个 derivative 条目之后）
  // 查找最后一个 playground 相关的条目
  const playgroundPattern = /\{\s*id:\s*\d+,\s*path:\s*'\/playground\/[^']+',[\s\S]*?derivative:\s*true,\s*\}/g
  const matches = [...content.matchAll(playgroundPattern)]
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    const insertPosition = lastMatch.index + lastMatch[0].length
    
    content = content.slice(0, insertPosition) + '\n' + newEntry + content.slice(insertPosition)
  } else {
    // 如果找不到 playground 条目，在 illustration 分类的末尾插入
    const illustrationEndPattern = /entries:\s*\[[\s\S]*?\]/
    const illustrationMatch = content.match(illustrationEndPattern)
    
    if (illustrationMatch) {
      const insertPosition = illustrationMatch.index + illustrationMatch[0].length - 1
      content = content.slice(0, insertPosition) + '\n' + newEntry + '\n    ' + content.slice(insertPosition)
    }
  }
  
  // 保存文件
  fs.writeFileSync(constantsPath, content, 'utf8')
  console.log(`  ✅ 已添加到 constants: ${path_url} (ID: ${nextId})`)
  
  return true
}

/**
 * 添加翻译到 i18n/locales/en/common.json
 */
export function addToolToI18n(keyword, title) {
  const i18nPath = path.join(PROJECT_ROOT, 'src/i18n/locales/en/common.json')
  const content = fs.readFileSync(i18nPath, 'utf8')
  const data = JSON.parse(content)
  
  const slug = keywordToSlug(keyword)
  const i18nKey = slugToI18nKey(slug)
  
  // 检查是否已存在
  if (data.ai_tools?.illustration?.[i18nKey]) {
    console.log(`  ⏭️  已存在于 i18n: ${i18nKey}`)
    return false
  }
  
  // 确保路径存在
  if (!data.ai_tools) data.ai_tools = {}
  if (!data.ai_tools.illustration) data.ai_tools.illustration = {}
  
  // 添加新条目
  data.ai_tools.illustration[i18nKey] = {
    title: title
  }
  
  // 按字母顺序排序 keys
  const sortedIllustration = {}
  Object.keys(data.ai_tools.illustration)
    .sort()
    .forEach(key => {
      sortedIllustration[key] = data.ai_tools.illustration[key]
    })
  data.ai_tools.illustration = sortedIllustration
  
  // 保存文件
  fs.writeFileSync(i18nPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`  ✅ 已添加到 i18n: ai_tools.illustration.${i18nKey}.title`)
  
  return true
}

/**
 * 批量添加工具
 */
export function addToolsToConstantsAndI18n(toolType, variants) {
  console.log('\n📝 更新 constants 和 i18n...')
  
  let constantsUpdated = 0
  let i18nUpdated = 0
  
  for (const variant of variants) {
    const { keyword, title } = variant
    
    console.log(`\n🔧 处理: ${keyword}`)
    
    // 添加到 constants
    if (addToolToConstants(toolType, keyword, title)) {
      constantsUpdated++
    }
    
    // 添加到 i18n
    if (addToolToI18n(keyword, title)) {
      i18nUpdated++
    }
  }
  
  console.log(`\n📊 更新统计:`)
  console.log(`  ✅ Constants: ${constantsUpdated} 个新条目`)
  console.log(`  ✅ I18n: ${i18nUpdated} 个新条目`)
  
  return { constantsUpdated, i18nUpdated }
}

/**
 * 从 variants 目录读取所有变体
 */
export function loadVariantsFromDirectory(toolType) {
  const variantsDir = path.join(PROJECT_ROOT, 'src/data/variants', toolType)
  
  if (!fs.existsSync(variantsDir)) {
    console.error(`❌ 目录不存在: ${variantsDir}`)
    return []
  }
  
  const files = fs.readdirSync(variantsDir).filter(f => f.endsWith('.json'))
  const variants = []
  
  for (const file of files) {
    const filePath = path.join(variantsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    
    const keyword = data.originalKeyword || file.replace('.json', '')
    const title = data.seo?.title || keyword
    
    variants.push({ keyword, title })
  }
  
  return variants
}

export const PostGenerationHooks = {
  addToolToConstants,
  addToolToI18n,
  addToolsToConstantsAndI18n,
  loadVariantsFromDirectory,
  keywordToSlug,
  slugToI18nKey
}

