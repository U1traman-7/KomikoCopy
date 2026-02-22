/**
 * 工具配置加载器 - 按tool type组织的配置管理
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 工具配置缓存
const toolConfigCache = new Map()

/**
 * 获取所有支持的工具类型
 * @returns {Array} 工具类型列表
 */
export function getSupportedToolTypes() {
  const toolConfigsDir = path.join(__dirname, '../tool-configs')
  
  if (!fs.existsSync(toolConfigsDir)) {
    return []
  }

  return fs.readdirSync(toolConfigsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

/**
 * 加载工具配置文件
 * @param {string} toolType - 工具类型
 * @returns {Object|null} 工具配置
 */
export async function loadToolConfig(toolType) {
  try {
    const configPath = path.join(__dirname, `../tool-configs/${toolType}/config.mjs`)

    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ 工具配置文件不存在: ${configPath}`)
      return null
    }

    // 动态导入配置
    const configModule = await import(`file://${configPath}?t=${Date.now()}`)
    const config = configModule.default || configModule.toolConfig

    return config
  } catch (error) {
    console.warn(`⚠️ 加载工具配置失败 (${toolType}):`, error.message)
    return null
  }
}


/**
 * 加载工具的提示词配置
 * @param {string} toolType - 工具类型
 * @returns {Object|null} 提示词配置
 */
export async function loadToolPrompts(toolType) {
  try {
    const promptsPath = path.join(__dirname, `../tool-configs/${toolType}/prompts.mjs`)
    
    if (!fs.existsSync(promptsPath)) {
      return null
    }

    const promptsModule = await import(`file://${promptsPath}?t=${Date.now()}`)
    return promptsModule.default || promptsModule
  } catch (error) {
    console.warn(`⚠️ 加载工具提示词失败 (${toolType}):`, error.message)
    return null
  }
}

/**
 * 加载变体页面作为 few-shot example
 * @param {string} toolType - 工具类型
 * @param {string} variantName - 变体名称
 * @returns {Object|null} 变体页面数据
 */
export async function loadVariantExample(toolType, variantName) {
  try {
    const variantPath = path.join(__dirname, `../../../src/data/variants/${toolType}/${variantName}.json`)

    if (!fs.existsSync(variantPath)) {
      console.warn(`⚠️ 变体页面文件不存在: ${variantName}`)
      return null
    }

    const variantData = JSON.parse(fs.readFileSync(variantPath, 'utf8'))
    return variantData
  } catch (error) {
    console.warn(`⚠️ 加载变体页面失败 (${toolType}/${variantName}):`, error.message)
    return null
  }
}

/**
 * 清除工具配置缓存
 * @param {string} toolType - 工具类型，如果不提供则清除所有缓存
 */
export function clearToolConfigCache(toolType = null) {
  if (toolType) {
    toolConfigCache.delete(toolType)
  } else {
    toolConfigCache.clear()
  }
}

export const ToolLoader = {
  getSupportedToolTypes,
  loadToolConfig,
  loadToolPrompts,
  loadVariantExample,
  clearToolConfigCache
}
