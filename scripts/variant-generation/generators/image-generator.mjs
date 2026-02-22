/**
 * Image generation utilities for variant pages
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ImageUtils } from './image-utils.mjs'
import { ConfigManager } from '../core/config-manager.mjs'
import { ToolTypeManager } from '../core/tool-type-manager.mjs'
import { FileManager } from '../core/file-manager.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 生成图片prompts
export async function generateImagePrompts(
  toolType,
  keyword,
  pageContent,
  config,
  count = 6,
) {
  try {
    // 使用新的prompt生成器
    const { generatePrompts, validatePrompts } = await import('./prompt-generator.mjs')

    const configWithTool = { ...config, currentTool: toolType }

    const prompts = await generatePrompts(
      keyword,
      { content: pageContent },
      count,
      configWithTool,
      toolType,
    )

    const finalPrompts = validatePrompts(prompts)

    return finalPrompts
  } catch (error) {
    console.warn('⚠️ [Prompt Generator] 生成失败，使用基础prompts作为fallback')
    console.error('🔍 详细错误信息:', error.message)
    console.error('🔍 错误堆栈:', error.stack)

    // 回退到基础prompts
    const title = pageContent.content?.header?.title || keyword

    const fallbackPrompts = [
      `${title} example showcase, high quality anime art, professional demonstration`,
      `${title} character design, detailed illustration, masterpiece quality`,
      `${title} style artwork, vibrant colors, clean composition`,
      `${title} demonstration, before and after comparison, technical excellence`,
      `${title} gallery display, multiple variations, portfolio quality`,
      `${title} professional example, industry standard, high resolution art`,
    ]

    return fallbackPrompts
  }
}

// 加载预生成的 style 示例索引
function loadPregeneratedIndex() {
  const indexPath = path.join(__dirname, '../pregenerated-styles-index.json')

  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  预生成索引文件不存在，将使用 API 生成')
    return null
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('⚠️  读取预生成索引失败:', error.message)
    return null
  }
}

// 为playground生成图片（优先使用预生成的示例）
export async function generatePlaygroundImages(keyword, config, defaultStyle = null) {
  console.log(`🎨 为playground生成${keyword}风格的图片...`)
  if (defaultStyle) {
    console.log(`🎨 使用默认样式: ${defaultStyle}`)
  }

  // 尝试加载预生成的索引
  const pregeneratedIndex = loadPregeneratedIndex()

  // 定义可用的随机风格（排除VIP风格，使用基础风格）
  // 注意：这些 style 名称必须与 api/tools/_styleTransferPrompts.ts 中的 key 匹配
  const randomStyles = [
    'anime',
    'korean-manhwa',
    'ghibli-anime',
    'manga',
    'cartoon',
    'watercolor',
    'line-art',
    'sticker',
    'action-figure',
    'pixel-art',
    'lego',
    'cyberpunk',
    'sketch',
    'claymation',
    'the-simpsons',
    'naruto',
    'south-park'
  ]

  let selectedStyles = []

  // 如果提供了 defaultStyle，使用它
  if (defaultStyle) {
    // 检查预生成索引中是否有这个 style
    if (pregeneratedIndex && pregeneratedIndex[defaultStyle]) {
      console.log(`✅ 使用预生成的 ${defaultStyle} 示例`)
      return pregeneratedIndex[defaultStyle]
    }

    // 如果没有预生成，4张图片都使用同一种风格
    selectedStyles = [defaultStyle, defaultStyle, defaultStyle, defaultStyle]
    console.log(`🎨 使用提供的默认风格: ${defaultStyle}（将调用 API 生成）`)
  } else {
    // 如果有预生成索引，优先从中随机选择
    if (pregeneratedIndex) {
      const availableStyles = Object.keys(pregeneratedIndex)
      if (availableStyles.length >= 4) {
        // 随机选择 4 种不同的风格
        const shuffled = [...availableStyles].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, 4)

        console.log(`✅ 从预生成索引中随机选择4种风格: ${selected.join(', ')}`)

        // 从每个 style 中随机选择一个示例
        const examples = []
        for (const styleId of selected) {
          const styleExamples = pregeneratedIndex[styleId]
          if (styleExamples && styleExamples.length > 0) {
            // 随机选择一个示例
            const randomExample = styleExamples[Math.floor(Math.random() * styleExamples.length)]
            examples.push(randomExample)
          }
        }

        if (examples.length === 4) {
          return examples
        }
      }
    }

    // 如果没有预生成或数量不足，随机选择4种不同的风格
    const shuffledStyles = [...randomStyles].sort(() => Math.random() - 0.5)
    selectedStyles = shuffledStyles.slice(0, 4)
    console.log(`🎲 没有预设风格，随机选择4种风格: ${selectedStyles.join(', ')}（将调用 API 生成）`)
  }

  // 使用规范化的关键字作为文z件夹名
  const keywordSlug = FileManager.keywordToSlug(keyword)

  // 定义输入图片
  const inputImages = [
    { input: '/images/examples/photo-to-anime/input2.jpg' },
    { input: '/images/examples/photo-to-anime/black_guy_photo.webp' },
    { input: '/images/examples/photo-to-anime/cat_photo.webp' },
    { input: '/images/examples/photo-to-anime/dog_photo.webp' }
  ]

  // 创建输出目录
  const outputDir = path.join(
    __dirname,
    '../../../public/images/examples/playground',
    keywordSlug,
    )
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const results = []
  let totalCost = 0

  // 为每个输入图片生成对应风格的输出
  for (let i = 0; i < inputImages.length; i++) {
    const inputImage = inputImages[i]
    const inputPath = path.join(__dirname, '../../../public', inputImage.input)
    const currentStyle = selectedStyles[i] // 使用对应的风格

    try {
      console.log(`🎨 处理图片 ${i + 1}/${inputImages.length}: ${inputImage.input} (风格: ${currentStyle})`)

      // 跳过API调用模式 - 直接跳过，不生成任何图片
      if (config.skipApiCall) {
        console.log(`⏭️ 跳过API调用，不生成图片`)
        continue
      }

      // 读取输入图片并转换为base64
      const imageBuffer = fs.readFileSync(inputPath)

      // 根据文件扩展名确定MIME类型
      const ext = path.extname(inputPath).toLowerCase()
      let mimeType = 'image/jpeg'
      if (ext === '.png') mimeType = 'image/png'
      else if (ext === '.webp') mimeType = 'image/webp'
      else if (ext === '.gif') mimeType = 'image/gif'

      const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`
      console.log(`📷 图片格式: ${mimeType}, 大小: ${Math.round(imageBuffer.length / 1024)}KB`)

      // 获取图片尺寸信息
      const imageSize = await ImageUtils.getImageSizeFromBuffer(imageBuffer)
      const MAX_WIDTH = 4096
      const MAX_HEIGHT = 4096
      
      const aspectRatio = imageSize.width / (imageSize.height || 1)
      let width = imageSize.width
      let height = imageSize.height
      
      if (width > MAX_WIDTH) {
        width = MAX_WIDTH
        height = width / aspectRatio
      }
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT
        width = height * aspectRatio
      }

      console.log(`📐 原始尺寸: ${imageSize.width}x${imageSize.height}, 调整后: ${Math.round(width)}x${Math.round(height)}`)

      // 调用photo-to-anime API
      console.log(`🔗 API调用: ${config.apiBaseUrl}/api/tools/photo-to-anime`)
      console.log(`🎨 使用风格: ${currentStyle}`)

      // 创建一个带超时的fetch请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2分钟超时

      const response = await fetch(`${config.apiBaseUrl}/api/tools/photo-to-anime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `next-auth.session-token=${config.sessionToken}`,
        },
        body: JSON.stringify({
          image: base64Image,
          style: currentStyle,
          width: Math.round(width),
          height: Math.round(height),
          model: 'BASIC'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log(`📡 API响应状态: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`⚠️ 图片${i + 1}生成失败: ${response.status} - ${errorText}`)
        console.log(`⏭️ 跳过此图片，继续处理下一张`)
        continue
      }

      const result = await response.json()
      console.log(`📦 API返回结果:`, {
        hasOutput: !!result.output,
        hasError: !!result.error,
        keys: Object.keys(result)
      })

      if (result.error) {
        console.warn(`⚠️ 图片${i + 1}生成失败: ${result.error}`)
        console.log(`⏭️ 跳过此图片，继续处理下一张`)
        continue
      }

      if (result.output) {
        // 下载图片
        const imageUrl = result.output
        const imageResponse = await fetch(imageUrl)

        if (!imageResponse.ok) {
          console.warn(
            `⚠️ 图片${i + 1}下载失败: ${imageResponse.statusText}`,
          )
          continue
        }

        const imageBuffer = await imageResponse.arrayBuffer()

        // 保存生成的图片
        const outputFileName = `example_${i + 1}.webp`
        const outputPath = path.join(outputDir, outputFileName)

        fs.writeFileSync(outputPath, Buffer.from(imageBuffer))

        results.push({
          input: inputImage.input,
          image: `/images/examples/playground/${keywordSlug}/${outputFileName}`,
          prompt: `Style: ${currentStyle}`,
        })

        totalCost += 30 // photo-to-anime的基本成本
        console.log(
          `✅ 图片${i + 1}生成成功: ${outputFileName} (${currentStyle} 风格)`,
        )
      } else {
        console.warn(`⚠️ 图片${i + 1}生成失败: 无输出`)
        console.log(`⏭️ 跳过此图片，继续处理下一张`)
      }
    } catch (error) {
      console.warn(`⚠️ 图片${i + 1}生成出错:`, error.message)

      if (error.name === 'AbortError') {
        console.warn(`⏰ 图片${i + 1}生成超时（2分钟）`)
      }
      
      console.log(`⏭️ 跳过此图片，继续处理下一张`)
    }
  }

  console.log(`✅ playground图片生成完成，共生成${results.length}张图片，总成本: ${totalCost} zaps`)
  return results
}

// 生成图片
export async function generateImages(prompts, keyword, model, config, toolType, defaultStyle = null) {
  // 对于playground，使用特殊的图片生成逻辑
  if (toolType === 'playground') {
    return await generatePlaygroundImages(keyword, config, defaultStyle)
  }

  const modelConfig = ConfigManager.getModelConfig(model)
  if (!modelConfig) {
    throw new Error(`不支持的模型: ${model}`)
  }

  // 使用工具特定处理器获取比例配置
  let ratioConfig
  let ratioDescription = '默认'

  try {
    const processorPath = `../tool-configs/${toolType}/processor.mjs`
    const processor = await import(processorPath)

    if (processor.getImageRatioConfig) {
      const isEnvironment = ImageUtils.isEnvironmentKeyword(keyword)
      const isPfp = ImageUtils.isPfpKeyword(keyword)

      ratioConfig = processor.getImageRatioConfig(keyword, isPfp, isEnvironment)
      ratioDescription = `${toolType}专用`
      console.log(`📐 使用${toolType}处理器的比例配置`)
    }
  } catch (error) {
    console.warn(`⚠️ 无法加载${toolType}处理器，使用默认比例配置`)
  }

  // 回退到默认配置
  if (!ratioConfig) {
    const isEnvironment = ImageUtils.isEnvironmentKeyword(keyword)
    const isPfp = ImageUtils.isPfpKeyword(keyword)

    if (isPfp) {
      ratioConfig = { square: ImageUtils.IMAGE_RATIOS.square }
      ratioDescription = 'PFP方形'
    } else if (isEnvironment) {
      ratioConfig = ImageUtils.LANDSCAPE_RATIOS
      ratioDescription = '横屏'
    } else {
      ratioConfig = ImageUtils.IMAGE_RATIOS
      ratioDescription = '竖屏'
    }
  }

  const ratioKeys = Object.keys(ratioConfig)
  const isEnvironment = ImageUtils.isEnvironmentKeyword(keyword)
  const isPfp = ImageUtils.isPfpKeyword(keyword)

  if (isPfp) {
    console.log(`📐 使用PFP专用1:1方形比例配置`)
  } else {
    console.log(
      `📐 使用${ratioDescription}比例配置 (检测到${isEnvironment ? '环境' : '角色'}类关键词)`,
    )
  }

  // 计算总图片数量：每个prompt对应一张图片，随机比例
  const totalImages = prompts.length

  console.log(
    `🎨 开始生成 ${totalImages} 张图片 (每个prompt随机选择一种比例，共${ratioKeys.length}种比例可选)...`,
  )

  // 使用规范化的关键字作为文件夹名
  const keywordSlug = FileManager.keywordToSlug(keyword)
  const outputDir = path.join(
    __dirname,
    '../../../public/images/examples/' + toolType,
    keywordSlug,
  )
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const results = []
  let totalCost = 0
  let imageIndex = 1

  // 为每个prompt生成一张随机比例的图片
  for (let promptIndex = 0; promptIndex < prompts.length; promptIndex++) {
    const basePrompt = prompts[promptIndex]

    // 使用工具特定处理器增强prompt
    let enhancedPrompt = basePrompt

    try {
      const processorPath = `../tool-configs/${toolType}/processor.mjs`
      const processor = await import(processorPath)

      if (processor.enhancePrompt) {
        enhancedPrompt = processor.enhancePrompt(basePrompt)
      }
    } catch (error) {
      // 使用默认增强
      enhancedPrompt = `${basePrompt}, masterpiece, best quality, detailed, high resolution`
    }

    // 随机选择一种比例
    const randomRatioKey =
      ratioKeys[Math.floor(Math.random() * ratioKeys.length)]
    const ratioConfigItem = ratioConfig[randomRatioKey]

    try {
      console.log(
        `🎨 生成图片 ${imageIndex}/${totalImages} - ${ratioConfigItem.name} (随机选择)...`,
      )

      // 根据OC Maker的实际API调用方式构建请求
      const requestBody = {
        prompt: enhancedPrompt,
        negative_prompt:
          'bad quality, blurry, low resolution, duplicate, extra limbs, deformed, worst quality, low score, bad score, average score, signature, watermark, username',
        size: {
          width: ratioConfigItem.width,
          height: ratioConfigItem.height,
        },
        num_images: 1,
        ip_adapter_images: [],
        init_images: undefined,
        store_supabase: false,
        tool: 'variant-page-generator',
      }

      const response = await fetch(
        `${config.apiBaseUrl}${modelConfig.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `next-auth.session-token=${config.sessionToken}`,
          },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API错误响应: ${errorText}`)
        throw new Error(`API失败: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // 检查API返回的错误
      if (data.error) {
        throw new Error(`API返回错误: ${data.error}`)
      }

      if (!Array.isArray(data) || !data[0]) {
        console.error('API返回数据:', data)
        throw new Error('API未返回有效的图片URL')
      }

      // 下载并保存图片
      const imageUrl = data[0]
      const imageResponse = await fetch(imageUrl)

      if (!imageResponse.ok) {
        throw new Error(`图片下载失败: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()

      // 使用新的命名规则：序号_尺寸名_随机数.webp
      const randomId = Math.floor(Math.random() * 9999)
      // 简化尺寸名称，支持横屏和竖屏
      const sizeNameMap = {
        'portrait-tall': 'portrait',
        portrait: 'portrait',
        square: 'square',
        landscape: 'landscape',
        'landscape-wide': 'wide',
      }
      const sizeName = sizeNameMap[randomRatioKey] || randomRatioKey
      const fileName = `${imageIndex}_${sizeName}_${randomId}.webp`
      const outputPath = path.join(outputDir, fileName)
      fs.writeFileSync(outputPath, Buffer.from(imageBuffer))

      results.push({
        image: `/images/examples/${toolType}/${keywordSlug}/${fileName}`,
        alt: `AI generated ${keyword} ${ratioConfigItem.name} style`,
        prompt: basePrompt,
        ratio: randomRatioKey, // 添加比例信息用于统计
      })

      totalCost += modelConfig.cost
      console.log(`✅ 图片 ${imageIndex} 完成 - ${ratioConfigItem.name}`)
      imageIndex++

      // 延迟避免API限制
      if (imageIndex <= totalImages) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(
        `❌ 图片 ${imageIndex} 失败 (${ratioConfigItem.name}): ${error.message}`,
      )
      imageIndex++
    }
  }
  console.log(`📊 成功生成: ${results.length}/${totalImages} 张图片`)

  // 按比例分组展示结果
  console.log('\n📋 生成结果汇总 (随机比例分布):')
  const ratioStats = {}
  results.forEach(result => {
    const ratio = result.ratio
    if (!ratioStats[ratio]) {
      ratioStats[ratio] = 0
    }
    ratioStats[ratio]++
  })

  Object.keys(ratioStats).forEach(ratioKey => {
    const count = ratioStats[ratioKey]
    const ratioName = ratioConfig[ratioKey]?.name || ratioKey
    console.log(`  ${ratioName}: ${count} 张`)
  })

  // 压缩生成的图片
  if (results.length > 0) {
    try {
      console.log('\n🗜️ 正在压缩图片...')
      const { spawn } = await import('child_process')

      const compressProcess = spawn('mogrify', ['-quality', '80', '*.webp'], {
        cwd: outputDir,
        shell: true,
        stdio: 'inherit',
      })

      await new Promise((resolve, reject) => {
        compressProcess.on('close', code => {
          if (code === 0) {
            console.log('✅ 图片压缩完成')
            resolve()
          } else {
            console.warn(`⚠️ 图片压缩失败，退出码: ${code}`)
            resolve() // 不阻塞主流程
          }
        })
        compressProcess.on('error', error => {
          console.warn(`⚠️ 图片压缩命令执行失败: ${error.message}`)
          resolve() // 不阻塞主流程
        })
      })
    } catch (error) {
      console.warn(`⚠️ 图片压缩过程出错: ${error.message}`)
    }
  }

  return results
}

export const ImageGenerator = {
  generateImagePrompts,
  generatePlaygroundImages,
  generateImages
}
