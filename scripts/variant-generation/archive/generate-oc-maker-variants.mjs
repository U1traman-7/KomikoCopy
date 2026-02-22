#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const VARIANTS_FILE = path.join(__dirname, '../oc-variants.txt')
const TOOL_TYPE = 'oc-maker'
const BATCH_SIZE = 5 // 每批处理的数量
const DELAY_BETWEEN_BATCHES = 30000 // 批次间延迟 (30秒)
const DELAY_BETWEEN_ITEMS = 5000 // 单个项目间延迟 (5秒)

// 读取variants.txt文件
function readVariants() {
  try {
    const content = fs.readFileSync(VARIANTS_FILE, 'utf8')
    const variants = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')) // 过滤空行和注释

    console.log(`📋 从 ${VARIANTS_FILE} 读取到 ${variants.length} 个变体关键词`)
    return variants
  } catch (error) {
    console.error(`❌ 无法读取变体文件: ${error.message}`)
    process.exit(1)
  }
}

// 执行单个变体生成
function generateVariant(keyword, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 开始生成: ${keyword}`)

    const args = ['generate-variant-page.mjs', TOOL_TYPE, keyword]

    // 添加选项
    if (options.model) args.push(`--model=${options.model}`)
    if (options.count) args.push(`--count=${options.count}`)
    if (options.textOnly) args.push('--text-only')
    if (options.imagesOnly) args.push('--images-only')
    if (options.seoOnly) args.push('--seo-only')
    if (options.force) args.push('--force')

    const child = spawn('node', args, {
      cwd: __dirname,
      stdio: 'inherit',
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${keyword} 生成完成`)
        resolve({ keyword, success: true })
      } else {
        console.error(`❌ ${keyword} 生成失败，退出码: ${code}`)
        resolve({ keyword, success: false, code })
      }
    })

    child.on('error', error => {
      console.error(`❌ ${keyword} 执行错误: ${error.message}`)
      resolve({ keyword, success: false, error: error.message })
    })
  })
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 批量生成变体
async function generateVariantsBatch(variants, options = {}) {
  const results = []
  const totalBatches = Math.ceil(variants.length / BATCH_SIZE)

  console.log(`📊 总计 ${variants.length} 个变体，分 ${totalBatches} 批处理`)
  console.log(
    `⚙️ 配置: 批大小=${BATCH_SIZE}, 批间延迟=${DELAY_BETWEEN_BATCHES}ms, 项目间延迟=${DELAY_BETWEEN_ITEMS}ms`,
  )

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * BATCH_SIZE
    const endIndex = Math.min(startIndex + BATCH_SIZE, variants.length)
    const batch = variants.slice(startIndex, endIndex)

    console.log(
      `\n📦 处理批次 ${batchIndex + 1}/${totalBatches} (${batch.length} 个项目)`,
    )
    console.log(`📝 当前批次: ${batch.join(', ')}`)

    // 处理当前批次的每个项目
    for (let i = 0; i < batch.length; i++) {
      const keyword = batch[i]

      try {
        const result = await generateVariant(keyword, options)
        results.push(result)

        // 项目间延迟（除了批次中的最后一个）
        if (i < batch.length - 1) {
          console.log(`⏳ 等待 ${DELAY_BETWEEN_ITEMS}ms...`)
          await delay(DELAY_BETWEEN_ITEMS)
        }
      } catch (error) {
        console.error(`❌ ${keyword} 处理异常: ${error.message}`)
        results.push({ keyword, success: false, error: error.message })
      }
    }

    // 批次间延迟（除了最后一批）
    if (batchIndex < totalBatches - 1) {
      console.log(`\n⏸️ 批次完成，等待 ${DELAY_BETWEEN_BATCHES}ms 后继续...`)
      await delay(DELAY_BETWEEN_BATCHES)
    }
  }

  return results
}

// 生成报告
function generateReport(results) {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log('\n📊 生成报告')
  console.log('='.repeat(50))
  console.log(`✅ 成功: ${successful.length}/${results.length}`)
  console.log(`❌ 失败: ${failed.length}/${results.length}`)

  if (successful.length > 0) {
    console.log('\n✅ 成功生成的变体:')
    successful.forEach(r => console.log(`  - ${r.keyword}`))
  }

  if (failed.length > 0) {
    console.log('\n❌ 失败的变体:')
    failed.forEach(r => {
      console.log(`  - ${r.keyword} (${r.error || `退出码: ${r.code}`})`)
    })
  }

  // 保存报告到文件
  const reportPath = path.join(
    __dirname,
    `oc-maker-generation-report-${Date.now()}.json`,
  )
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        toolType: TOOL_TYPE,
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results,
      },
      null,
      2,
    ),
  )

  console.log(`\n📄 详细报告已保存到: ${reportPath}`)
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
OC Maker 变体批量生成工具

用法: node generate-oc-maker-variants.mjs [选项]

选项:
  --model=MODEL        使用指定模型 (默认: AnimagineXL)
  --count=N           每个变体生成N个提示词 (默认: 10)
  --text-only         只生成文案，不生成图片
  --images-only       只生成图片，跳过内容检测
  --seo-only          只重新生成SEO内容，保留其他内容
  --force             强制重新生成，即使页面已存在
  --batch-size=N      每批处理的数量 (默认: ${BATCH_SIZE})
  --delay=MS          批次间延迟毫秒数 (默认: ${DELAY_BETWEEN_BATCHES})
  --help, -h          显示此帮助信息

示例:
  node generate-oc-maker-variants.mjs
  node generate-oc-maker-variants.mjs --model=Gemini --count=4
  node generate-oc-maker-variants.mjs --text-only --batch-size=3
  node generate-oc-maker-variants.mjs --seo-only --force
`)
    process.exit(0)
  }

  const options = {}

  args.forEach(arg => {
    if (arg.startsWith('--model=')) {
      options.model = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1]) || 10
    } else if (arg === '--text-only') {
      options.textOnly = true
    } else if (arg === '--images-only') {
      options.imagesOnly = true
    } else if (arg === '--seo-only') {
      options.seoOnly = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg.startsWith('--batch-size=')) {
      const batchSize = parseInt(arg.split('=')[1])
      if (batchSize > 0) {
        global.BATCH_SIZE = batchSize
      }
    } else if (arg.startsWith('--delay=')) {
      const delayMs = parseInt(arg.split('=')[1])
      if (delayMs >= 0) {
        global.DELAY_BETWEEN_BATCHES = delayMs
      }
    }
  })

  return options
}

// 主函数
async function main() {
  console.log('🎨 OC Maker 变体批量生成工具')
  console.log('='.repeat(50))

  const options = parseArgs()
  const variants = readVariants()

  if (variants.length === 0) {
    console.log('⚠️ 没有找到变体关键词，退出')
    process.exit(0)
  }

  console.log(`🎯 目标工具: ${TOOL_TYPE}`)
  console.log(`📋 变体数量: ${variants.length}`)
  console.log(`⚙️ 生成选项:`, options)

  const startTime = Date.now()

  try {
    const results = await generateVariantsBatch(variants, options)
    generateReport(results)

    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    console.log(`\n⏱️ 总耗时: ${duration} 秒`)
    console.log('🎉 批量生成完成！')
  } catch (error) {
    console.error('❌ 批量生成过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error.message)
  process.exit(1)
})
