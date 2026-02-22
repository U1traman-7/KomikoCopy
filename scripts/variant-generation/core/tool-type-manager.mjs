/**
 * Tool type configuration and management
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ToolLoader } from './tool-loader.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// 获取工具类型配置
export async function getToolTypeConfig(toolType) {
  try {
    const config = await ToolLoader.loadToolConfig(toolType)
    if (config) {
      return config
    }
  } catch (error) {
    console.warn(`⚠️ 无法从新配置加载 ${toolType}，使用legacy配置`)
  }

  // 回退到默认配置
  console.warn(`⚠️ 使用默认回退配置: ${toolType}`)
  return null
}

// 支持的工具类型 - 从index.json文件动态获取并合并配置
export function getSupportedToolTypes() {
  try {
    const indexPath = path.join(__dirname, '../../../src/data/variants/index.json')
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    const toolTypes = {}

    indexData.tools.forEach(tool => {
      toolTypes[tool.key] = {
        name: tool.name,
        description: '',
        category: 'AI Generation',
        baseTemplate: tool.key, 
        config: null
      }
    })

    return toolTypes
  } catch (error) {
    console.warn('⚠️ 无法读取variants/index.json，返回空配置')
    return {}
  }
}

export const ToolTypeManager = {
  getToolTypeConfig,
  getSupportedToolTypes
}
