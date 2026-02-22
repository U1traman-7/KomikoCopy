#!/usr/bin/env node
/**
 * CLI工具：保存Perplexity结果
 * 用法：
 *   node save-perplexity-results.mjs --keyword "Genshin Impact Character Generator" --tool-type "oc-maker"
 *   node save-perplexity-results.mjs --batch --keywords-file keywords.txt --tool-type "oc-maker"
 *   node save-perplexity-results.mjs --save-only --keyword "Test Generator" --tool-type "test" --seo-file seo-content.json
 */

import { PerplexityResearch } from './perplexity-research.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
dotenv.config()


/**
 * 显示使用帮助
 */
function showHelp() {
  console.log(`
🔧 Perplexity结果保存工具

用法:
  单个关键词生成并保存:
    node save-perplexity-results.mjs --keyword "关键词" --tool-type "工具类型"

  批量关键词生成并保存:
    node save-perplexity-results.mjs --batch --keywords-file keywords.txt --tool-type "工具类型"

  仅保存已有SEO内容:
    node save-perplexity-results.mjs --save-only --keyword "关键词" --tool-type "工具类型" --seo-file seo.json

参数:
  --keyword           单个关键词
  --tool-type         工具类型 (如: oc-maker, ai-anime-generator)
  --batch             批量模式
  --keywords-file     关键词文件路径 (每行一个关键词)
  --save-only         仅保存模式 (不调用API)
  --seo-file          SEO内容文件路径 (JSON格式)
  --original-content  原始内容文件路径 (JSON格式)
  --help              显示此帮助信息

环境变量:
  PERPLEXITY_API_KEY  Perplexity API密钥 (生成模式需要)

示例:
  node save-perplexity-results.mjs --keyword "Genshin Impact Character Generator" --tool-type "oc-maker"
  node save-perplexity-results.mjs --batch --keywords-file my-keywords.txt --tool-type "oc-maker"
  node save-perplexity-results.mjs --save-only --keyword "Test Generator" --tool-type "test" --seo-file test-seo.json
`)
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--keyword':
        options.keyword = args[++i]
        break
      case '--tool-type':
        options.toolType = args[++i]
        break
      case '--batch':
        options.batch = true
        break
      case '--keywords-file':
        options.keywordsFile = args[++i]
        break
      case '--save-only':
        options.saveOnly = true
        break
      case '--seo-file':
        options.seoFile = args[++i]
        break
      case '--original-content':
        options.originalContentFile = args[++i]
        break
      case '--help':
        options.help = true
        break
    }
  }

  return options
}

/**
 * 从文件加载关键词列表
 */
function loadKeywords(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
  } catch (error) {
    throw new Error(`无法读取关键词文件 ${filePath}: ${error.message}`)
  }
}

/**
 * 从文件加载JSON内容
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`无法读取JSON文件 ${filePath}: ${error.message}`)
  }
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs()

  // 显示帮助
  if (options.help || process.argv.length === 2) {
    showHelp()
    return
  }

  // 验证必需参数
  if (!options.toolType) {
    console.error('❌ 错误: 必须指定 --tool-type 参数')
    process.exit(1)
  }

  // 创建Perplexity实例
  const apiKey = options.saveOnly ? 'dummy-key' : process.env.PERPLEXITY_API_KEY
  if (!options.saveOnly && !apiKey) {
    console.error('❌ 错误: 请设置 PERPLEXITY_API_KEY 环境变量')
    process.exit(1)
  }

  const perplexity = new PerplexityResearch(apiKey)

  try {
    if (options.saveOnly) {
      // 仅保存模式
      if (!options.keyword) {
        console.error('❌ 错误: 仅保存模式需要指定 --keyword 参数')
        process.exit(1)
      }

      if (!options.seoFile) {
        console.error('❌ 错误: 仅保存模式需要指定 --seo-file 参数')
        process.exit(1)
      }

      const seoContent = loadJsonFile(options.seoFile)
      const result = await perplexity.saveResultsDirectly(
        options.toolType,
        options.keyword,
        seoContent
      )

      if (result.success) {
        console.log('✅ 保存成功!')
        console.log(`📁 文件位置: ${result.filePath}`)
      } else {
        console.error('❌ 保存失败:', result.error)
        process.exit(1)
      }

    } else if (options.batch) {
      // 批量模式
      if (!options.keywordsFile) {
        console.error('❌ 错误: 批量模式需要指定 --keywords-file 参数')
        process.exit(1)
      }

      const keywords = loadKeywords(options.keywordsFile)
      console.log(`📦 加载了 ${keywords.length} 个关键词`)

      const results = await perplexity.batchGenerateAndSave(
        JSON.stringify(originalContent),
        keywords,
        options.toolType
      )

      // 显示结果摘要
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      console.log(`\n📊 批量处理完成:`)
      console.log(`✅ 成功: ${successful} 个`)
      console.log(`❌ 失败: ${failed} 个`)

    } else {
      // 单个关键词模式
      if (!options.keyword) {
        console.error('❌ 错误: 需要指定 --keyword 参数')
        process.exit(1)
      }

      const result = await perplexity.generateAndSave(
        JSON.stringify(originalContent),
        options.keyword,
        options.toolType
      )

      if (result.success) {
        console.log('✅ 生成并保存成功!')
        console.log(`📁 文件位置: ${result.filePath}`)
      } else {
        console.error('❌ 生成并保存失败:', result.error)
        process.exit(1)
      }
    }

  } catch (error) {
    console.error('❌ 执行出错:', error.message)
    process.exit(1)
  }
}

// 运行主函数
main().catch(console.error)
