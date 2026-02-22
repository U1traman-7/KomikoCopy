#!/usr/bin/env node

/**
 * 更新 constants 和 i18n
 * 
 * 用法:
 *   node update-constants-and-i18n.mjs --tool=playground
 *   node update-constants-and-i18n.mjs --tool=playground --keyword="AI Anime Filter"
 *   node update-constants-and-i18n.mjs --tool=playground --all
 */

import { PostGenerationHooks } from './core/post-generation-hooks.mjs'

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    tool: null,
    keyword: null,
    all: false
  }
  
  for (const arg of args) {
    if (arg.startsWith('--tool=')) {
      options.tool = arg.split('=')[1]
    } else if (arg.startsWith('--keyword=')) {
      options.keyword = arg.split('=')[1]
    } else if (arg === '--all') {
      options.all = true
    }
  }
  
  return options
}

// 主函数
async function main() {
  const options = parseArgs()
  
  console.log('🚀 更新 constants 和 i18n')
  console.log(`📁 工具类型: ${options.tool || '未指定'}`)
  console.log(`🔑 关键词: ${options.keyword || '全部'}`)
  console.log(`📋 处理所有: ${options.all ? '是' : '否'}`)
  
  if (!options.tool) {
    console.error('\n❌ 错误: 必须指定 --tool 参数')
    console.log('\n用法:')
    console.log('  node update-constants-and-i18n.mjs --tool=playground')
    console.log('  node update-constants-and-i18n.mjs --tool=playground --keyword="AI Anime Filter"')
    console.log('  node update-constants-and-i18n.mjs --tool=playground --all')
    process.exit(1)
  }
  
  // 加载变体
  const variants = PostGenerationHooks.loadVariantsFromDirectory(options.tool)
  
  if (variants.length === 0) {
    console.error(`\n❌ 没有找到任何变体文件`)
    process.exit(1)
  }
  
  console.log(`\n✅ 找到 ${variants.length} 个变体`)
  
  // 过滤变体
  let filteredVariants = variants
  if (options.keyword && !options.all) {
    filteredVariants = variants.filter(v => v.keyword === options.keyword)
    
    if (filteredVariants.length === 0) {
      console.error(`\n❌ 没有找到关键词: ${options.keyword}`)
      process.exit(1)
    }
  }
  
  console.log(`\n📋 将处理 ${filteredVariants.length} 个变体`)
  
  // 更新 constants 和 i18n
  const result = PostGenerationHooks.addToolsToConstantsAndI18n(options.tool, filteredVariants)
  
  console.log('\n✅ 完成!')
  console.log(`\n💡 提示:`)
  console.log(`  - 检查 src/constants/index.tsx`)
  console.log(`  - 检查 src/i18n/locales/en/common.json`)
  console.log(`  - 运行 npm run dev 测试`)
}

// 运行
main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})

