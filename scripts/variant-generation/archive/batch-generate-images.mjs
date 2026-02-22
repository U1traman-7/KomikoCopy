#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const IMAGES_FILE = path.join(__dirname, 'image.txt')
const TOOL_TYPE = 'oc-maker'
const GENERATOR_SCRIPT = path.join(
  __dirname,
  'variant-generation/generate-variant-page.mjs',
)

// 读取image.txt文件
function readImageKeywords() {
  try {
    const content = fs.readFileSync(IMAGES_FILE, 'utf8')
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  } catch (error) {
    console.error('❌ 读取image.txt失败:', error.message)
    process.exit(1)
  }
}

// 执行单个图片生成命令
function generateImage(keyword) {
  return new Promise((resolve, reject) => {
    console.log(`\n🖼️  开始生成图片: "${keyword}"`)

    const child = spawn(
      'node',
      [GENERATOR_SCRIPT, TOOL_TYPE, keyword, '--images-only'],
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      },
    )

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ 完成: "${keyword}"`)
        resolve()
      } else {
        console.error(`❌ 失败: "${keyword}" (退出码: ${code})`)
        reject(new Error(`图片生成失败: ${keyword}`))
      }
    })

    child.on('error', error => {
      console.error(`❌ 执行错误: "${keyword}":`, error.message)
      reject(error)
    })
  })
}

// 主函数
async function main() {
  console.log('🎨 批量生成图片')
  console.log(`📄 读取文件: ${IMAGES_FILE}`)
  console.log(`🛠️  工具类型: ${TOOL_TYPE}`)
  console.log(`🖼️  模式: 仅生成图片`)

  const keywords = readImageKeywords()
  console.log(`📊 找到 ${keywords.length} 个关键字`)

  if (keywords.length === 0) {
    console.log('⚠️  没有找到关键字，退出')
    return
  }

  // 显示将要生成的关键字
  console.log('\n📋 将要生成图片的关键字:')
  keywords.forEach((keyword, index) => {
    console.log(`${index + 1}. ${keyword}`)
  })

  console.log('\n⏰ 开始批量生成图片...')

  let successCount = 0
  let failCount = 0
  const startTime = Date.now()

  // 逐个生成（避免并发太多导致API限制）
  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i]
    const progress = `[${i + 1}/${keywords.length}]`

    try {
      console.log(`\n${progress} 处理: "${keyword}"`)
      await generateImage(keyword)
      successCount++

      // 添加延迟避免API限制
      if (i < keywords.length - 1) {
        console.log('⏳ 等待 3 秒...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`${progress} 图片生成失败: "${keyword}"`)
      failCount++

      // 询问是否继续
      console.log('⚠️  是否继续处理其他关键字？(Ctrl+C 退出)')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 生成报告
  const endTime = Date.now()
  const duration = Math.round((endTime - startTime) / 1000)

  console.log('\n🎉 批量图片生成完成!')
  console.log(`📊 总计: ${keywords.length} 个关键字`)
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
