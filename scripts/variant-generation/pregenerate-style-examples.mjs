#!/usr/bin/env node
/**
 * 预生成所有 style 的示例图片
 * 
 * 这个脚本会：
 * 1. 读取所有 style templates
 * 2. 使用预定义的输入图片
 * 3. 调用 style-transfer API 生成每种 style 的示例
 * 4. 将结果保存为 JSON 索引文件
 * 
 * 使用方法：
 * node pregenerate-style-examples.mjs
 * node pregenerate-style-examples.mjs --force  # 强制重新生成
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ConfigManager } from './core/config-manager.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const INPUT_IMAGES = [
  // '/tmp/girl.webp',
  // '/tmp/man.jpg',
  // '/tmp/komiko.png',
  // '/tmp/girl2.jpg'
  '/tmp/woman-photo.webp',
  '/tmp/man-photo.webp'
]

const OUTPUT_DIR = path.join(__dirname, '../../public/images/examples/playground/pregenerated')
const INDEX_FILE = path.join(__dirname, 'pregenerated-styles-index.json')
const FAILED_LOG_FILE = path.join(__dirname, 'pregenerated-failed.json')

// 从 styles.ts 提取所有 style IDs
function extractStyleIds() {
  const stylesPath = path.join(__dirname, '../../src/Components/StyleTemplatePicker/styles.ts')
  const content = fs.readFileSync(stylesPath, 'utf8')
  
  const styles = []
  const idRegex = /id:\s*['"]([^'"]+)['"]/g
  let match
  
  while ((match = idRegex.exec(content)) !== null) {
    const styleId = match[1]
    // 只包含支持 playground 的 style（默认都支持，除非明确标记 supportPlayground: false）
    styles.push(styleId)
  }
  
  return [...new Set(styles)] // 去重
}

// 调用 style-transfer API
async function callStyleTransferAPI(inputImagePath, style, config) {
  console.log(`  📡 调用 API: ${style}`)

  try {
    // 读取输入图片并转换为 base64
    const imageBuffer = fs.readFileSync(inputImagePath)

    // 根据文件扩展名确定 MIME 类型
    const ext = path.extname(inputImagePath).toLowerCase()
    let mimeType = 'image/jpeg'
    if (ext === '.png') mimeType = 'image/png'
    else if (ext === '.webp') mimeType = 'image/webp'
    else if (ext === '.gif') mimeType = 'image/gif'

    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`

    // 调用 style-transfer API
    const apiUrl = `${config.apiBaseUrl}/api/tools/style-transfer`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${config.sessionToken}`
      },
      body: JSON.stringify({
        image_url: base64Image,
        style_id: style,
        mode: 'template',
        aspect_ratio: '2:3'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 返回错误: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    // style-transfer API 返回格式: { output: "url", request_id: "..." }
    if (!result.output) {
      throw new Error(`API 返回失败: ${JSON.stringify(result)}`)
    }

    return result.output
  } catch (error) {
    console.error(`  ❌ API 调用失败:`, error.message)
    return null
  }
}

// 下载并保存图片
async function downloadAndSaveImage(imageUrl, outputPath) {
  try {
    // 如果是 base64，直接保存
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      fs.writeFileSync(outputPath, buffer)
      return true
    }
    
    // 如果是 URL，下载
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    
    const buffer = await response.arrayBuffer()
    fs.writeFileSync(outputPath, Buffer.from(buffer))
    return true
  } catch (error) {
    console.error(`  ❌ 保存图片失败:`, error.message)
    return false
  }
}

// 生成单个 style 的所有示例
async function generateStyleExamples(styleId, config, force = false) {
  console.log(`\n🎨 处理 style: ${styleId}`)

  const styleDir = path.join(OUTPUT_DIR, styleId)

  // 检查是否已存在
  if (!force && fs.existsSync(styleDir)) {
    const files = fs.readdirSync(styleDir)
    if (files.length >= INPUT_IMAGES.length) {
      console.log(`  ✅ 已存在 ${files.length} 张图片，跳过`)
      return loadExistingExamples(styleId)
    }
  }

  // 创建目录
  if (!fs.existsSync(styleDir)) {
    fs.mkdirSync(styleDir, { recursive: true })
  }

  const examples = []
  const failedImages = []

  for (let i = 0; i < INPUT_IMAGES.length; i++) {
    const inputImage = INPUT_IMAGES[i]
    const outputFilename = `example_${i + 1}.webp`
    const outputPath = path.join(styleDir, outputFilename)

    console.log(`  📸 生成图片 ${i + 1}/${INPUT_IMAGES.length}`)

    // 将相对路径转换为绝对路径
    const inputImagePath = path.join(__dirname, '../../public', inputImage)

    // 检查输入图片是否存在
    if (!fs.existsSync(inputImagePath)) {
      console.log(`  ⚠️ 输入图片不存在: ${inputImagePath}`)
      failedImages.push({
        imageIndex: i + 1,
        inputImage,
        reason: 'Input image not found'
      })
      continue
    }

    // 调用 API
    const outputImage = await callStyleTransferAPI(inputImagePath, styleId, config)

    if (!outputImage) {
      console.log(`  ⚠️ 跳过图片 ${i + 1}`)
      failedImages.push({
        imageIndex: i + 1,
        inputImage,
        reason: 'API call failed'
      })
      continue
    }

    // 保存图片
    const saved = await downloadAndSaveImage(outputImage, outputPath)

    if (saved) {
      examples.push({
        input: inputImage,
        output: `/images/examples/playground/pregenerated/${styleId}/${outputFilename}`,
        style: styleId
      })
      console.log(`  ✅ 保存成功: ${outputFilename}`)
    } else {
      failedImages.push({
        imageIndex: i + 1,
        inputImage,
        outputImage,
        reason: 'Failed to save image'
      })
    }

    // 延迟避免过载
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return { examples, failedImages }
}

// 加载已存在的示例
function loadExistingExamples(styleId) {
  const styleDir = path.join(OUTPUT_DIR, styleId)
  const files = fs.readdirSync(styleDir).filter(f => f.endsWith('.webp'))
  
  return files.map((file, index) => ({
    input: INPUT_IMAGES[index] || INPUT_IMAGES[0],
    output: `/images/examples/playground/pregenerated/${styleId}/${file}`,
    style: styleId
  }))
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const retryFailed = args.includes('--retry-failed')

  // 过滤出非选项参数（即 style 名称）
  const requestedStyles = args.filter(arg => !arg.startsWith('--'))

  console.log('🚀 开始预生成 style 示例图片')
  console.log(`📁 输出目录: ${OUTPUT_DIR}`)
  console.log(`📄 索引文件: ${INDEX_FILE}`)
  console.log(`🔄 强制重新生成: ${force ? '是' : '否'}`)
  console.log(`🔄 重试失败: ${retryFailed ? '是' : '否'}`)

  if (requestedStyles.length > 0) {
    console.log(`🎯 指定的 styles: ${requestedStyles.join(', ')}`)
  }

  // 加载配置
  const config = await ConfigManager.setupConfig()

  if (!config.sessionToken) {
    console.error('❌ 错误: 需要配置 session token')
    console.log('请运行: node generate-variant-page.mjs setup')
    process.exit(1)
  }

  console.log(`✅ API Base URL: ${config.apiBaseUrl}`)
  console.log(`✅ Session Token: ${config.sessionToken.substring(0, 10)}...`)

  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // 提取所有 style IDs
  let styleIds
  if (retryFailed) {
    // 只处理失败的 styles
    if (!fs.existsSync(FAILED_LOG_FILE)) {
      console.log('\n❌ 没有找到失败日志文件')
      console.log('请先运行一次完整的预生成')
      process.exit(1)
    }

    const failedLog = JSON.parse(fs.readFileSync(FAILED_LOG_FILE, 'utf8'))
    styleIds = Object.keys(failedLog)
    console.log(`\n📋 从失败日志加载 ${styleIds.length} 个 styles`)
  } else if (requestedStyles.length > 0) {
    // 使用命令行指定的 styles
    console.log('\n📋 使用指定的 styles')
    styleIds = requestedStyles
    console.log(`✅ 将处理 ${styleIds.length} 个 styles`)
  } else {
    // 提取所有 style IDs
    console.log('\n📋 提取所有 style IDs...')
    styleIds = extractStyleIds()
    console.log(`✅ 找到 ${styleIds.length} 个 styles`)
  }
  
  // 生成每个 style 的示例
  const index = {}
  const failedLog = {}
  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (const styleId of styleIds) {
    try {
      const result = await generateStyleExamples(styleId, config, force)

      // 处理返回结果（可能是数组或对象）
      let examples, failedImages
      if (Array.isArray(result)) {
        // 旧格式：直接返回 examples 数组
        examples = result
        failedImages = []
      } else {
        // 新格式：返回 { examples, failedImages }
        examples = result.examples
        failedImages = result.failedImages || []
      }

      if (examples.length > 0) {
        index[styleId] = examples
        successCount++
      } else {
        failCount++
      }

      // 记录失败的图片
      if (failedImages.length > 0) {
        failedLog[styleId] = {
          timestamp: new Date().toISOString(),
          failedImages
        }
        console.log(`  ⚠️ ${failedImages.length} 张图片失败`)
      }
    } catch (error) {
      console.error(`❌ 处理 ${styleId} 时出错:`, error.message)
      failCount++
      failedLog[styleId] = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      }
    }
  }
  
  // 保存索引文件
  console.log('\n💾 保存索引文件...')
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
  console.log(`✅ 索引文件已保存: ${INDEX_FILE}`)

  // 保存失败日志
  if (Object.keys(failedLog).length > 0) {
    console.log('\n💾 保存失败日志...')
    fs.writeFileSync(FAILED_LOG_FILE, JSON.stringify(failedLog, null, 2))
    console.log(`✅ 失败日志已保存: ${FAILED_LOG_FILE}`)
    console.log(`⚠️  ${Object.keys(failedLog).length} 个 styles 有失败记录`)
  }

  // 统计
  console.log('\n📊 生成统计:')
  console.log(`✅ 成功: ${successCount} 个 styles`)
  console.log(`⏭️  跳过: ${skipCount} 个 styles`)
  console.log(`❌ 失败: ${failCount} 个 styles`)
  console.log(`📁 总计: ${Object.keys(index).length} 个 styles 在索引中`)

  // 计算总图片数
  const totalImages = Object.values(index).reduce((sum, examples) => sum + examples.length, 0)
  console.log(`🖼️  总图片数: ${totalImages} 张`)

  // 失败统计
  if (Object.keys(failedLog).length > 0) {
    const totalFailedImages = Object.values(failedLog).reduce((sum, log) => {
      return sum + (log.failedImages?.length || 0)
    }, 0)
    console.log(`\n⚠️  失败详情:`)
    console.log(`   ${Object.keys(failedLog).length} 个 styles 有失败`)
    console.log(`   ${totalFailedImages} 张图片生成失败`)
    console.log(`\n💡 查看失败详情: cat ${FAILED_LOG_FILE}`)
    console.log(`💡 重试失败的: node pregenerate-style-examples.mjs --retry-failed`)
  }
}

// 运行
main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})

