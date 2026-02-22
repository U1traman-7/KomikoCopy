#!/usr/bin/env node
/**
 * 批量生产脚本 - 读取variants.txt批量生成衍生页和图片
 */
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const VARIANTS_FILE = path.join(__dirname, 'variants.txt')
const DEFAULT_TOOL_TYPE = 'playground' // 默认工具类型
const BATCH_SIZE = 3 // 每批处理数量
const DELAY_BETWEEN_BATCHES = 10000 // 批次间延迟 (10秒)
const DELAY_BETWEEN_ITEMS = 3000 // 单个项目间延迟 (3秒)

// 读取variants.txt文件
function readVariants() {
  try {
    if (!fs.existsSync(VARIANTS_FILE)) {
      console.log(`❌ 找不到文件: ${VARIANTS_FILE}`)
      console.log('💡 请创建 variants.txt 文件，每行一个关键词')
      console.log('示例内容:')
      console.log('Fantasy Character Maker')
      return []
    }

    const content = fs.readFileSync(VARIANTS_FILE, 'utf8')
    const variants = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    console.log(`📖 读取到 ${variants.length} 个变体关键词`)
    return variants
  } catch (error) {
    console.error('❌ 读取variants.txt失败:', error.message)
    return []
  }
}

// 执行单个生成命令 - 修复版本，失败时不抛出异常
function generateVariant(toolType, keyword, options = {}) {
  return new Promise((resolve) => {
    console.log(`\n🚀 开始生成: "${keyword}"`)

    const args = [
      path.join(__dirname, 'generate-variant-page.mjs'),
      toolType,
      keyword,
      '--text-only',
    ]

    // 添加选项
    if (options.textOnly) args.push('--text-only')
    if (options.imagesOnly) args.push('--images-only')
    if (options.force) args.push('--force')
    if (options.count) args.push(`--count=${options.count}`)
    if (options.model) args.push(`--model=${options.model}`)
    // 当用户传入 --model=perplexity 时，自动切换生成器模式
    if ((options.model || '').toLowerCase() === 'perplexity' && !options.mode) {
      args.push(`--mode=perplexity`)
    }
    if (options.mode) args.push(`--mode=${options.mode}`)

    console.log(`🔧 命令参数:`, args.join(' '))

    // 配置会在每次调用时加载，这是正常的

    const child = spawn('node', args, {
      stdio: 'pipe', // 改为 pipe 以便捕获输出
      cwd: process.cwd(),
    })

    let output = ''
    let errorOutput = ''

    // 捕获标准输出
    child.stdout.on('data', (data) => {
      const text = data.toString()
      output += text

      // 过滤掉不必要的日志
      const shouldSkip =
        text.includes('Extracted SEO object') ||
        text.includes('使用缓存的 SEO object') ||
        text.includes('使用 streamlined 生成器') ||
        text.includes('使用 Perplexity 生成器') ||
        text.includes('Keys:') ||
        text.includes('Title:') ||
        text.includes('继续生成流程')

      if (shouldSkip) {
        return // 跳过这些日志
      }

      // 只显示重要信息
      if (text.includes('✅') || text.includes('❌') || text.includes('🚀') || text.includes('📊') || text.includes('⏭️')) {
        process.stdout.write(text)
      }
    })

    // 捕获错误输出
    child.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      process.stderr.write(text)
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ 完成: "${keyword}"`)
        resolve({ success: true, keyword, output })
      } else {
        console.error(`❌ 失败: "${keyword}" (退出码: ${code})`)
        // 不抛出异常，而是返回失败结果
        resolve({ success: false, keyword, error: `退出码: ${code}`, output: errorOutput })
      }
    })

    child.on('error', error => {
      console.error(`❌ 执行错误: "${keyword}":`, error.message)
      // 不抛出异常，而是返回失败结果
      resolve({ success: false, keyword, error: error.message })
    })
  })
}

// 批量处理
async function processBatch(variants, toolType, options) {
  const total = variants.length
  let processed = 0
  let successful = 0
  let failed = 0
  let skipped = 0

  console.log(`\n🎯 开始批量处理 ${total} 个变体`)
  console.log(`📊 工具类型: ${toolType}`)
  console.log(`⚙️ 选项: ${JSON.stringify(options)}`)
  console.log(`📦 批次大小: ${BATCH_SIZE}`)

  if (!options.force) {
    console.log(`💡 提示: 已存在的完整页面将被跳过，使用 --force 强制重新生成`)
  }

  // 分批处理
  for (let i = 0; i < variants.length; i += BATCH_SIZE) {
    const batch = variants.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(variants.length / BATCH_SIZE)

    console.log(`\n📦 处理批次 ${batchNum}/${totalBatches} (${batch.length} 个项目)`)

    // 处理当前批次
    for (const variant of batch) {
      const result = await generateVariant(toolType, variant, options)

      // 检查是否被跳过（检查多个跳过标志）
      const wasSkipped = result.output && (
        result.output.includes('skipped: true') ||
        result.output.includes('页面完整，跳过生成') ||
        result.output.includes('✅ 页面完整')
      )

      if (wasSkipped) {
        skipped++
        console.log(`⏭️  跳过: "${variant}" (已存在完整页面)`)
      } else if (result.success) {
        successful++
      } else {
        failed++
        console.error(`❌ 处理失败: ${variant} - ${result.error || '未知错误'}`)
      }

      processed++
      console.log(`📊 进度: ${processed}/${total} (成功: ${successful}, 跳过: ${skipped}, 失败: ${failed})`)

      // 项目间延迟（跳过的项目也延迟，避免过快）
      if (processed < total) {
        const delay = wasSkipped ? DELAY_BETWEEN_ITEMS / 3 : DELAY_BETWEEN_ITEMS
        console.log(`⏳ 等待 ${delay/1000} 秒...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // 批次间延迟
    if (i + BATCH_SIZE < variants.length) {
      console.log(`\n⏸️ 批次完成，等待 ${DELAY_BETWEEN_BATCHES/1000} 秒后继续...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  return { total, successful, failed, skipped }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    toolType: DEFAULT_TOOL_TYPE,
    textOnly: false,
    imagesOnly: false,
    force: false,
    count: null,
    model: null,
    mode: null,
    generator: null
  }

  args.forEach(arg => {
    if (arg.startsWith('--tool=')) {
      options.toolType = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1]) || null
    } else if (arg.startsWith('--model=')) {
      options.model = arg.split('=')[1]
    } else if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1]
    } else if (arg.startsWith('--generator=')) {
      // 将 --generator 映射到 --mode
      options.mode = arg.split('=')[1]
    } else if (arg === '--text-only') {
      options.textOnly = true
    } else if (arg === '--images-only') {
      options.imagesOnly = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--help' || arg === '-h') {
      showHelp()
      process.exit(0)
    }
  })

  return options
}

// 显示帮助信息
function showHelp() {
  console.log(`
🚀 批量生产脚本

用法: node batch-generate.mjs [选项]

选项:
  --tool=TYPE        工具类型 (默认: ${DEFAULT_TOOL_TYPE})
  --count=N          每个变体生成N个提示词 (默认: 8)
  --model=MODEL      使用指定模型 (默认: AnimagineXL)
  --mode=MODE        文案生成模式: streamlined (默认) | perplexity
  --generator=TYPE   文案生成器 (等同于 --mode): streamlined | perplexity
  --text-only        只生成文案，不生成图片
  --images-only      只生成图片，跳过内容检测
  --force            强制重新生成，即使页面已存在
  --help, -h         显示此帮助信息

示例:
  node batch-generate.mjs                             # 使用默认设置
  node batch-generate.mjs --tool=oc-maker             # 指定工具类型
  node batch-generate.mjs --text-only --force         # 只生成文案，强制重新生成
  node batch-generate.mjs --images-only --count=10    # 只生成图片，每个10张
  node batch-generate.mjs --model=Gemini              # 使用Gemini模型
  node batch-generate.mjs --mode=perplexity           # 使用Perplexity生成器
  node batch-generate.mjs --generator=perplexity      # 使用Perplexity生成器 (等同于上面)

配置:
  - 批次大小: ${BATCH_SIZE} 个/批
  - 批次间延迟: ${DELAY_BETWEEN_BATCHES/1000} 秒
  - 项目间延迟: ${DELAY_BETWEEN_ITEMS/1000} 秒
  - 变体文件: variants.txt

variants.txt 格式:
  每行一个关键词，支持管道分隔的多关键词:
  Pokemon OC Maker|Pokemon Character Creator
  Anime Character Generator|Anime OC Creator
  Fantasy Character Maker
`)
}

// 主函数
async function main() {
  try {
    const options = parseArgs()
    const variants = readVariants()

    if (variants.length === 0) {
      console.log('❌ 没有找到要处理的变体')
      return
    }

    console.log('🎯 批量生产开始!')
    const startTime = Date.now()

    const result = await processBatch(variants, options.toolType, options)

    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)

    console.log('\n🎉 批量生产完成!')
    console.log('=' .repeat(50))
    console.log(`📊 总计: ${result.total} 个变体`)
    console.log(`✅ 成功: ${result.successful} 个`)
    console.log(`⏭️  跳过: ${result.skipped} 个 (已存在)`)
    console.log(`❌ 失败: ${result.failed} 个`)
    console.log(`⏱️ 耗时: ${duration} 秒`)

    const actualProcessed = result.successful + result.failed
    if (actualProcessed > 0) {
      console.log(`📈 成功率: ${Math.round(result.successful / actualProcessed * 100)}% (不含跳过)`)
    }

    if (result.skipped > 0 && !options.force) {
      console.log(`\n💡 提示: 有 ${result.skipped} 个页面已存在被跳过`)
      console.log(`   使用 --force 参数可以强制重新生成所有页面`)
    }

  } catch (error) {
    console.error('❌ 批量生产失败:', error.message)
    process.exit(1)
  }
}

// 运行
main()
