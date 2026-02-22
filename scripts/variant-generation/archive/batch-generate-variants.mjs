#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const VARIANTS_FILE = path.join(__dirname, 'variants.txt')
// 工具类型
const TOOL_TYPE = 'video-to-video'
const DEFAULT_COUNT = 6 // 默认生成10个提示词，对应30张图片 (10×3种比例)
const GENERATOR_SCRIPT = path.join(
  __dirname,
  'variant-generation/generate-variant-page.mjs',
)

// 读取variants.txt文件
function readVariants() {
  try {
    const content = fs.readFileSync(VARIANTS_FILE, 'utf8')
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  } catch (error) {
    console.error('❌ 读取variants.txt失败:', error.message)
    process.exit(1)
  }
}

// 执行单个生成命令
function generateVariant(keyword, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 开始生成: "${keyword}"`)

    const args = [GENERATOR_SCRIPT, TOOL_TYPE, keyword, '--']

    // 添加count参数来生成更多图片
    const count = options.count || DEFAULT_COUNT
    args.push(`--count=${count}`)

    // 添加force参数来强制重新生成
    if (options.force) {
      args.push('--force')
    }

    const child = spawn('node', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ 完成: "${keyword}"`)
        resolve()
      } else {
        console.error(`❌ 失败: "${keyword}" (退出码: ${code})`)
        reject(new Error(`生成失败: ${keyword}`))
      }
    })

    child.on('error', error => {
      console.error(`❌ 执行错误: "${keyword}":`, error.message)
      reject(error)
    })
  })
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}

  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1]) || DEFAULT_COUNT
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
批量生成工具

用法: node batch-generate-variants.mjs [选项]

选项:
  --count=N    每个变体生成N个提示词 (默认: ${DEFAULT_COUNT}, 总图片数 = N×3种比例)
  --force      强制重新生成，即使页面已存在
  --help, -h   显示此帮助信息

示例:
  node batch-generate-variants.mjs                    # 使用默认设置 (12个提示词，36张图片)
  node batch-generate-variants.mjs --count=10         # 每个变体10个提示词 (30张图片)
  node batch-generate-variants.mjs --count=15 --force # 每个变体15个提示词 (45张图片)，强制重新生成
`)
      process.exit(0)
    }
  })

  return options
}

// 主函数
async function main() {
  const options = parseArgs()

  console.log('🎨 批量生成衍生页面')
  console.log(`📄 读取文件: ${VARIANTS_FILE}`)
  console.log(`🛠️  工具类型: ${TOOL_TYPE}`)

  const variants = readVariants()
  console.log(`📊 找到 ${variants.length} 个关键字`)
  console.log(
    `🖼️  每个变体将生成: ${options.count || DEFAULT_COUNT} 个提示词 (${(options.count || DEFAULT_COUNT) * 3} 张图片)`,
  )
  if (options.force) {
    console.log(`🔄 强制重新生成模式: 已启用`)
  }

  if (variants.length === 0) {
    console.log('⚠️  没有找到关键字，退出')
    return
  }

  // 显示将要生成的关键字
  console.log('\n📋 将要生成的关键字:')
  variants.forEach((keyword, index) => {
    console.log(`${index + 1}. ${keyword}`)
  })

  console.log('\n⏰ 开始批量生成...')

  let successCount = 0
  let failCount = 0
  const startTime = Date.now()

  // 逐个生成（避免并发太多导致API限制）
  for (let i = 0; i < variants.length; i++) {
    const keyword = variants[i]
    const progress = `[${i + 1}/${variants.length}]`

    try {
      console.log(`\n${progress} 处理: "${keyword}"`)
      await generateVariant(keyword, options)
      successCount++

      // 添加延迟避免API限制
      if (i < variants.length - 1) {
        console.log('⏳ 等待 3 秒...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`${progress} 生成失败: "${keyword}"`)
      failCount++

      // 询问是否继续
      console.log('⚠️  是否继续处理其他关键字？(Ctrl+C 退出)')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 生成报告
  const endTime = Date.now()
  const duration = Math.round((endTime - startTime) / 1000)

  console.log('\n🎉 批量生成完成!')
  console.log(`📊 总计: ${variants.length} 个关键字`)
  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失败: ${failCount}`)
  console.log(`⏰ 耗时: ${duration} 秒`)

  if (failCount > 0) {
    console.log('\n⚠️  部分生成失败，请检查日志')
  }
}

// 处理中断信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 用户中断，正在退出...')
  process.exit(0)
})

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error.message)
  process.exit(1)
})
