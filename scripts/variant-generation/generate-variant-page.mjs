#!/usr/bin/env node

// Import modules
import { ImageUtils } from './generators/image-utils.mjs'
import { ConfigManager } from './core/config-manager.mjs'
import { ImageGenerator } from './generators/image-generator.mjs'
import { FileManager } from './core/file-manager.mjs'

import { ToolLoader } from './core/tool-loader.mjs'
import { SEOGeneratorManager } from './core/seo-generator-manager.mjs'

// Use module functions
const setupConfig = ConfigManager.setupConfig

// Use module constants
const IMAGE_RATIOS = ImageUtils.IMAGE_RATIOS

// Use module constants and functions
const getSupportedToolTypes = ToolLoader.getSupportedToolTypes
const generateImages = ImageGenerator.generateImages
const generateImagePrompts = ImageGenerator.generateImagePrompts
const updateVariantPages = FileManager.updateVariantPages
const checkExistingPage = FileManager.checkExistingPage
const keywordToSlug = FileManager.keywordToSlug

async function generatePageContent(toolType, keyword, config, mode = 'streamlined', defaultStyle = null) {
  console.log(`🚀 生成SEO文案内容 (${mode} 模式)`)

  const seoManager = new SEOGeneratorManager(config)

  // 设置生成器模式
  seoManager.setGenerator(mode)

  const result = await seoManager.generateSEOContent(toolType, keyword, defaultStyle)

  if (!result.success) {
    throw new Error('SEO内容生成失败')
  }

  console.log('✅ SEO内容生成完成')

  // 转换为预期格式
  return result.content
}

// 为 image-animation-generator 选择视频示例
async function selectVideoExamples(toolType, config) {
  if (toolType !== 'image-animation-generator') {
    return []
  }

  try {
    // 加载 image-animation-generator 配置
    const toolConfig = await ToolLoader.loadToolConfig('image-animation-generator')

    if (!toolConfig || !toolConfig.examples || !Array.isArray(toolConfig.examples)) {
      console.warn('⚠️ 未找到 image-animation-generator 的视频示例配置')
      return []
    }

    // 随机选择4个示例
    const shuffledExamples = [...toolConfig.examples].sort(() => Math.random() - 0.5)
    const selectedExamples = shuffledExamples.slice(0, 4)

    // 转换为 SingleVideoExamples 组件所需的格式
    const videoExamples = selectedExamples.map((example, index) => ({
      id: index + 1,
      title: `Model: ${example.model}`,
      description: `Prompt: ${example.Prompt}`,
      videoUrl: example.Video,
    }))

    videoExamples.forEach((example, index) => {
      console.log(`  ${index + 1}. ${example.title}: ${example.description.substring(0, 50)}...`)
    })

    return videoExamples
  } catch (error) {
    console.warn('⚠️ 选择视频示例时出错:', error.message)
    return []
  }
}

// 主函数 - 一键生成衍生页面
async function generateVariantPage(toolType, keywordWithStyle, options = {}) {
  // 分离关键词和默认 style
  const parts = keywordWithStyle.split('|').map(p => p.trim())
  const keyword = parts[0]
  const defaultStyle = parts[1] || null

  console.log(`\n🚀 开始生成衍生页面: ${toolType}/${keyword}`)
  if (defaultStyle) {
    console.log(`🎨 默认样式: ${defaultStyle}`)
  }

  // 检查页面是否已存在
  const existingPage = checkExistingPage(toolType, keyword)

  // 总是显示检查结果
  if (existingPage.exists) {
    console.log(`📄 页面已存在`)
  } else {
    console.log(`📄 页面不存在，将创建新页面`)
  }

  if (existingPage.exists) {
    console.log(`📝 内容: ${existingPage.hasContent ? '✅ 已有' : '❌ 缺失'}`)
    console.log(
      `🖼️  图片: ${
        existingPage.hasImages ? `✅ ${existingPage.imageCount}张` : '❌ 缺失'
      }`,
    )

    // 如果是 text-only 模式且内容已存在，直接跳过
    if (
      existingPage.hasContent &&
      options.textOnly &&
      !options.force
    ) {
      console.log(`⏭️  内容已存在，跳过生成 (text-only 模式)`)
      console.log(`   📄 页面: /tools/${toolType}/${keywordToSlug(keyword)}`)
      return {
        skipped: true,
        reason: 'Content already exists (text-only mode)',
        path: `/tools/${toolType}/${keywordToSlug(keyword)}`,
      }
    }

    // 如果内容和图片都存在，直接跳过（除非是强制模式或只生成图片模式）
    if (
      existingPage.hasContent &&
      existingPage.hasImages &&
      !options.force &&
      !options.imagesOnly
    ) {
      console.log(`⏭️  页面完整，跳过生成`)
      console.log(`   📄 页面: /tools/${toolType}/${keywordToSlug(keyword)}`)
      console.log(`   🖼️  图片: ${existingPage.imageCount} 张`)
      // 立即返回，不执行任何后续逻辑
      return {
        skipped: true,
        reason: 'Page already exists with content and images',
        path: `/tools/${toolType}/${keywordToSlug(keyword)}`,
        imageCount: existingPage.imageCount,
      }
    }

    // 如果只缺少图片，只生成图片
    if (
      existingPage.hasContent &&
      !existingPage.hasImages &&
      !options.textOnly
    ) {
      console.log(`📝 内容已存在，只生成图片`)
      options.contentOnly = false
      options.imagesOnly = true
    }

    // 如果只缺少内容，只生成内容
    if (
      !existingPage.hasContent &&
      existingPage.hasImages
    ) {
      console.log(`🖼️  图片已存在，只生成内容`)
      options.contentOnly = true
      options.imagesOnly = false
    }
  }

  // 加载配置
  const config = await setupConfig()

  console.log(
    `📊 配置: 文案模式=${options.mode || 'streamlined'}, 模型=${
      options.model || config.defaultModel || ConfigManager.DEFAULT_CONFIG.defaultModel
    }, 图片数量=${
      options.count ||
      Math.ceil(config.imagesPerVariant / Object.keys(IMAGE_RATIOS).length)
    }`,
  )

  if (!config.sessionToken) {
    throw new Error(
      '需要设置 sessionToken，请先运行: node generate-variant-page.mjs setup',
    )
  }

  const model =
    options.model || config.defaultModel || ConfigManager.DEFAULT_CONFIG.defaultModel
  const count = parseInt(options.count) || 8 // 默认10个不同的prompts，对应30张图片
  const textOnly = options.textOnly || false

  try {
    let pageContent = null

    // 模式1: 只生成图片 - 不需要生成内容
    if (options.imagesOnly) {
      console.log('📝 images-only模式：跳过内容生成')

      // 如果现有文件有 defaultStyle，使用它
      if (existingPage.exists && existingPage.data && existingPage.data.defaultStyle) {
        defaultStyle = existingPage.data.defaultStyle
        console.log(`🎨 从现有文件获取 defaultStyle: ${defaultStyle}`)
      }

      // images-only 模式不需要 pageContent
      pageContent = null
    }
    // 模式2: 只生成文案 或 模式3: 生成文案+图片
    else {
      console.log('📝 生成页面内容')
      pageContent = await generatePageContent(toolType, keyword, config, options.mode, defaultStyle)

      // 先保存页面内容（不含图片）
      console.log('💾 先保存页面内容...')
      updateVariantPages(toolType, keyword, pageContent, [])
      console.log('✅ 页面内容已保存')
    }

    let examples = []
    let prompts = []

    // 3. 处理图片生成
    if (textOnly) {
      console.log('📝 只生成文案模式，跳过图片生成')
      // 使用现有图片如果存在
      if (existingPage.exists && existingPage.hasImages) {
        examples = existingPage.data.content?.examples || []
      }
    } else {
      // 生成图片模式（imagesOnly 或 默认模式）
      if (toolType === 'playground') {
        // 对于playground类型，直接生成图片，不需要AI生成prompts
        console.log('🖼️  生成playground图片（跳过prompt生成）')
        examples = await generateImages([], keyword, model, config, toolType, defaultStyle)
      } else {
        console.log('🖼️  生成图片prompts')
        prompts = await generateImagePrompts(
          toolType,
          keyword,
          pageContent,
          config,
          count,
        )

        console.log('🖼️  生成图片')
        examples = await generateImages(prompts, keyword, model, config, toolType, defaultStyle)
      }
    }

    // 4. 处理视频示例（仅适用于 image-animation-generator）
    let videoExamples = []
    if (toolType === 'image-animation-generator') {
      console.log('🎬 为 image-animation-generator 选择视频示例...')
      videoExamples = await selectVideoExamples(toolType, config)
      console.log(`✅ 已选择 ${videoExamples.length} 个视频示例`)
    }

    // 5. 更新variant数据（添加图片和视频示例）
    if (examples.length > 0 || videoExamples.length > 0) {
      console.log('🔄 更新页面数据，添加内容...')
      updateVariantPages(toolType, keyword, pageContent, examples, videoExamples)
      console.log('✅ 内容数据已更新')
    }

    console.log(`\n🎉 衍生页面生成完成!`)
    console.log(`📄 页面: /tools/${toolType}/${keywordToSlug(keyword)}`)
    if (!textOnly) {
      console.log(`🖼️  图片: ${examples.length} 张`)
    } else {
      console.log(`📝 只生成文案，未生成图片`)
    }
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    throw error
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(
      '用法: node generate-variant-page.mjs <tool-type> <keyword> [options]',
    )
    console.log('\n生成模式:')
    console.log('  (默认)           生成文案 + 图片 (完整页面)')
    console.log('  --text-only      只生成文案，跳过图片生成')
    console.log('  --images-only    只生成图片，使用现有或生成基础文案')
    console.log('\n选项:')
    console.log(
      '  --count=N        生成N个提示词 (默认: 8, 总图片数 = N×3种比例)',
    )
    console.log('  --model=MODEL    使用指定模型 (默认: AnimagineXL)')
    console.log('  --mode=MODE      文案生成模式:')
    console.log('                   streamlined - 内置AI生成器 (默认)')
    console.log('                   perplexity  - Perplexity研究生成器')
    console.log('  --force          强制重新生成，即使页面已存在')
    console.log('\n命令:')
    console.log('  setup           设置API tokens')
    process.exit(1)
  }

  if (args[0] === 'setup') {
    return { action: 'setup' }
  }

  const toolType = args[0]
  const keyword = args[1]

  if (!toolType || !keyword) {
    console.error('❌ 错误: 需要提供工具类型和关键词')
    process.exit(1)
  }

  let promptCount = 8 // 默认8个提示词，对应24张图片
  let model = null // 改为null，让config.defaultModel生效
  let textOnly = false
  let imagesOnly = false
  let force = false
  let mode = 'streamlined' // 默认使用 streamlined 模式

  // 解析选项
  for (let i = 2; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--count=')) {
      promptCount = parseInt(arg.split('=')[1]) || 10
    } else if (arg.startsWith('--model=')) {
      model = arg.split('=')[1] || 'Gemini'
      // 当使用 --model=perplexity 时，自动切换到 perplexity 模式
      if (model && model.toLowerCase() === 'perplexity') {
        mode = 'perplexity'
      }
    } else if (arg.startsWith('--mode=')) {
      const requestedMode = arg.split('=')[1] || 'streamlined'
      if (requestedMode === 'streamlined' || requestedMode === 'perplexity') {
        mode = requestedMode
      } else {
        console.error(`❌ 错误: 不支持的模式 "${requestedMode}"，支持的模式: streamlined, perplexity`)
        process.exit(1)
      }
    } else if (arg === '--text-only') {
      textOnly = true
    } else if (arg === '--images-only') {
      imagesOnly = true
    } else if (arg === '--force') {
      force = true
    }
  }

  return {
    action: 'generate',
    toolType,
    keyword,
    promptCount,
    model,
    mode,
    textOnly,
    imagesOnly,
    force,
  }
}

// 主执行逻辑
async function main() {
  try {
    const args = parseArgs()

    if (args.action === 'setup') {
      await setupConfig()
      return
    }

    if (args.action === 'generate') {
      // generateVariantPage 函数内部会加载配置，所以这里不需要预先加载
      await generateVariantPage(args.toolType, args.keyword, {
        count: args.promptCount,
        model: args.model, // 直接传递，让 generateVariantPage 处理默认值
        mode: args.mode,
        textOnly: args.textOnly,
        imagesOnly: args.imagesOnly,
        force: args.force,
      })
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本，执行主函数
// Windows 兼容：normalize paths for comparison
const normalizeUrl = (url) => url.replace(/\\/g, '/').replace(/^file:\/\/\//, '').toLowerCase()
const currentUrl = normalizeUrl(import.meta.url)
const argUrl = normalizeUrl(`file:///${process.argv[1]}`)
if (currentUrl === argUrl) {
  main()
}
