#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 导入config.mjs中的examples
const configPath = path.join(__dirname, 'tool-configs/image-animation-generator/config.mjs')
const { toolConfig } = await import(configPath)

// 数据目录路径
const variantsDir = path.join(__dirname, '../../src/data/variants/image-animation-generator')

/**
 * 从config中随机选择6个examples并转换格式
 */
function getRandomExamples(configExamples, count = 6) {
  // 打乱数组
  const shuffled = [...configExamples].sort(() => 0.5 - Math.random())
  
  // 选择前count个
  const selected = shuffled.slice(0, count)
  
  // 转换格式
  return selected.map((example, index) => ({
    id: index + 1,
    title: `Model: ${example.model}`,
    description: `Prompt: ${example.Prompt}`,
    videoUrl: example.Video
  }))
}

/**
 * 处理单个JSON文件
 */
function processJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    
    let modified = false
    
    // 检查根级别的examples
    if (data.examples && Array.isArray(data.examples) && data.examples.length === 0) {
      console.log(`🔄 填充根级别 examples: ${path.basename(filePath)}`)
      data.examples = getRandomExamples(toolConfig.examples)
      modified = true
    }
    
    // 检查content.examples
    if (data.content && data.content.examples && Array.isArray(data.content.examples) && data.content.examples.length === 0) {
      console.log(`🔄 填充 content.examples: ${path.basename(filePath)}`)
      data.content.examples = getRandomExamples(toolConfig.examples)
      modified = true
    }
    
    // 如果没有examples字段但文件看起来需要它们，添加examples
    if (!data.examples && !data.content?.examples && data.seo) {
      console.log(`➕ 添加缺失的 examples: ${path.basename(filePath)}`)
      data.examples = getRandomExamples(toolConfig.examples)
      modified = true
    }
    
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      console.log(`✅ 已更新: ${path.basename(filePath)}`)
    } else {
      console.log(`⏭️  跳过 (已有examples): ${path.basename(filePath)}`)
    }
    
    return modified
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message)
    return false
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始处理 image-animation-generator variants...\n')
  console.log(`📁 目录: ${variantsDir}`)
  console.log(`📊 Config examples 总数: ${toolConfig.examples.length}\n`)
  
  if (!fs.existsSync(variantsDir)) {
    console.error(`❌ 目录不存在: ${variantsDir}`)
    process.exit(1)
  }
  
  const files = fs.readdirSync(variantsDir).filter(file => file.endsWith('.json'))
  console.log(`📋 找到 ${files.length} 个JSON文件\n`)
  
  let processedCount = 0
  let modifiedCount = 0
  
  for (const file of files) {
    const filePath = path.join(variantsDir, file)
    const wasModified = processJsonFile(filePath)
    
    processedCount++
    if (wasModified) {
      modifiedCount++
    }
    
    // 添加分隔线
    if (processedCount < files.length) {
      console.log('---')
    }
  }
  
  console.log(`\n🎉 处理完成!`)
  console.log(`📊 处理文件总数: ${processedCount}`)
  console.log(`✏️  修改文件数量: ${modifiedCount}`)
  console.log(`⏭️  跳过文件数量: ${processedCount - modifiedCount}`)
}

// 运行脚本
main().catch(console.error)
