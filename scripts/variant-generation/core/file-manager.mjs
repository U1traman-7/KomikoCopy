/**
 * File management utilities for variant pages
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ConfigManager } from './config-manager.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 将关键字转换为合适的slug格式（用于文件路径和URL）
export function keywordToSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // 将非字母数字字符替换为连字符
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
}

// 更新variant数据
export function updateVariantPages(toolType, keyword, pageContent, examples, videoExamples = []) {
  console.log('🔄 正在更新variant数据...')
  console.log(`📝 pageContent存在: ${!!pageContent}`)
  console.log(`🖼️ examples数量: ${examples.length}`)
  console.log(`🎬 videoExamples数量: ${videoExamples.length}`)

  // 如果没有pageContent，尝试加载现有数据或创建基本结构
  if (!pageContent) {
    console.log('⚠️ pageContent为空，尝试加载现有数据...')

    // 检查是否有现有的variant文件
    const existingPage = checkExistingPage(toolType, keyword)
    if (existingPage.exists && existingPage.data) {
      console.log('📄 使用现有页面数据')
      pageContent = existingPage.data
    } else {
      console.log('📝 创建基本页面结构（仅用于保存图片）')
      // 创建最基本的结构来保存图片
      pageContent = {
        seo: {},
        placeholderText: `Generate ${keyword} style artwork`,
        content: {
          header: {
            title: keyword,
            subtitle: `Generate ${keyword} style artwork with AI`,
          },
        },
        originalKeyword: keyword,
      }
    }
  }

  // 合并新旧examples，优先根级别 examples，其次 content.examples（兼容旧结构）
  const existingRootExamples = Array.isArray(pageContent.examples)
    ? pageContent.examples
    : []
  const existingContentExamples = Array.isArray(pageContent.content?.examples)
    ? pageContent.content.examples
    : []
  const existingExamples = existingRootExamples.length > 0
    ? existingRootExamples
    : existingContentExamples
  const mergedExamples = [...existingExamples, ...examples]

  console.log(
    `📊 examples合并: 原有${existingExamples.length}张 + 新增${examples.length}张 = 总计${mergedExamples.length}张`,
  )

  // 检测是否为SEO-only模式（新增examples为0且与原有examples相同）
  const isSeoOnlyMode =
    examples.length > 0 &&
    examples.length === existingExamples.length &&
    JSON.stringify(examples) === JSON.stringify(existingExamples)

  if (isSeoOnlyMode) {
    console.log('🔍 检测到SEO-only模式，保持examples不变')
  }

  // 准备内容（包含生成的图片）
  const contentWithExamples = {
    seo: pageContent.seo || {},
    placeholderText:
      pageContent.placeholderText || `Generate ${keyword} style artwork`,
    content: {
      ...pageContent.content,
      // 同步一份到 content.examples 以兼容旧前端
      examples: mergedExamples,
    },
    originalKeyword: pageContent.originalKeyword || keyword,
  }

  // 设置根级别 examples 为图片/视频的合并视图（优先包含视频示例）
  const hasAnyExamples = mergedExamples.length > 0 || videoExamples.length > 0
  if (hasAnyExamples) {
    contentWithExamples.examples = [
      ...videoExamples,
      ...mergedExamples,
    ]
  }

  console.log('📦 准备保存的内容结构:')
  console.log(
    `- seo: ${
      !!contentWithExamples.seo &&
      Object.keys(contentWithExamples.seo).length > 0
    }`,
  )
  console.log(`- placeholderText: ${!!contentWithExamples.placeholderText}`)
  console.log(`- content: ${!!contentWithExamples.content}`)
  console.log(`- content.header: ${!!contentWithExamples.content?.header}`)
  console.log(`- content.examples: ${contentWithExamples.content.examples?.length || 0}`)
  console.log(`- examples (root): ${contentWithExamples.examples?.length || 0}`)

  // 直接使用分离文件结构
  updateVariantFile(toolType, keyword, contentWithExamples)
}

// 更新variant文件
export function updateVariantFile(toolType, keyword, contentWithExamples) {
  // 工具文件夹路径
  const toolDir = path.join(ConfigManager.VARIANTS_DIR, toolType)

  // 确保工具目录存在
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true })
  }

  // 使用规范化的关键字作为文件名
  const keywordSlug = keywordToSlug(keyword)
  const variantFilePath = path.join(toolDir, `${keywordSlug}.json`)

  // 创建variant文件内容
  const variantData = {
    seo: contentWithExamples.seo,
    placeholderText: contentWithExamples.placeholderText,
    examples: contentWithExamples.examples,
    originalKeyword: contentWithExamples.originalKeyword,
    pageStructure: contentWithExamples.pageStructure,
  }

  // 总是写入根级别 examples（图片和/或视频），以便前端可直接读取
  if (contentWithExamples.examples) {
    variantData.examples = contentWithExamples.examples
  } else {
    // 没有根级别时，从 content.examples 同步一份（兼容性）
    const fromContent = contentWithExamples.content?.examples
    if (Array.isArray(fromContent) && fromContent.length > 0) {
      variantData.examples = fromContent
    }
  }

  // 生成 pageStructure（随机顺序，且确保 faq/cta 在最后）
  if (!variantData.pageStructure) {
    const has = (k) => Boolean(variantData.seo && variantData.seo[k])

    const baseSections = []
    if (has('whatIs')) baseSections.push('whatIs')
    if (has('howToUse')) baseSections.push('howToUse')
    if (has('benefits')) baseSections.push('whyUse')
    if (has('examples')) baseSections.push('examples')
    // moreAITools 一直展示
    baseSections.push('moreAITools')

    // Fisher-Yates shuffle
    for (let i = baseSections.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = baseSections[i]
      baseSections[i] = baseSections[j]
      baseSections[j] = tmp
    }

    const tail = []
    if (has('faq')) tail.push('faq')
    if (has('cta')) tail.push('cta')

    variantData.pageStructure = [...baseSections, ...tail]
  }

  // 保存variant文件
  fs.writeFileSync(variantFilePath, JSON.stringify(variantData, null, 2))
  console.log(`✅ ${toolType}/${keywordSlug}.json 已更新`)
}

// 检查页面是否已存在
export function checkExistingPage(toolType, keyword) {
  const keywordSlug = keywordToSlug(keyword)
  const variantFilePath = path.join(
    __dirname,
    `../../../src/data/variants/${toolType}/${keywordSlug}.json`,
  )

  if (!fs.existsSync(variantFilePath)) {
    return { exists: false }
  }

  try {
    const existingData = JSON.parse(fs.readFileSync(variantFilePath, 'utf8'))

    // 检查是否有内容：优先检查 seo 对象，其次检查 content 对象（兼容旧格式）
    const hasSeoContent = existingData.seo && Object.keys(existingData.seo).length > 0
    const hasContentObject = existingData.content && Object.keys(existingData.content).length > 0
    const hasContent = hasSeoContent || hasContentObject

    // 兼容：优先根级别 examples 判断是否有图片，否则回退到 content.examples
    const rootExamples = Array.isArray(existingData.examples) ? existingData.examples : []
    const contentExamples = Array.isArray(existingData.content?.examples) ? existingData.content.examples : []
    const combinedExamples = rootExamples.length > 0 ? rootExamples : contentExamples
    const hasImages = combinedExamples.length > 0

    return {
      exists: true,
      hasContent,
      hasImages,
      imageCount: combinedExamples.length,
      data: existingData,
    }
  } catch (error) {
    console.warn(`⚠️  读取现有文件失败: ${error.message}`)
    return { exists: false }
  }
}

/**
 * 保存变体文件
 */
export async function saveVariantFile(filePath, content) {
  const fullPath = path.resolve(filePath)
  const dir = path.dirname(fullPath)

  // 确保目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 保存文件
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8')
  console.log(`✅ 变体文件已保存: ${filePath}`)
}

/**
 * 保存文件（通用方法）
 */
export async function saveFile(filePath, content) {
  const fullPath = path.resolve(filePath)
  const dir = path.dirname(fullPath)

  // 确保目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 保存文件
  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`✅ 文件已保存: ${filePath}`)
}

/**
 * 确保目录存在
 */
export async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 创建目录: ${dirPath}`)
  }
}

export const FileManager = {
  keywordToSlug,
  updateVariantPages,
  updateVariantFile,
  checkExistingPage,
  saveVariantFile,
  saveFile,
  ensureDirectoryExists
}
