/**
 * Configuration management for variant page generation
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '../config.json')
const VARIANT_DATA_FILE = path.join(__dirname, '../../src/data/variant-pages.json')
const VARIANTS_DIR = path.join(__dirname, '../../../src/data/variants')

// 默认配置
const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:3000',
  sessionToken: process.env.SESSION_TOKEN,
  defaultModel: 'AnimagineXL',
  imagesPerVariant: 4, // 修改为4张图片
  skipApiCall: false, // 是否跳过API调用，直接使用占位符图片
  perplexityApiKey: process.env.PERPLEXITY_API_KEY, // Perplexity API密钥，用于关键词研究
  enableSEOOptimization: true, // 是否启用SEO优化
  enablePerplexityResearch: false, // 是否启用Perplexity研究（需要API密钥）
}

// 模型配置 - 根据OC Maker实际使用的模型
const MODELS = {
  AnimagineXL: { endpoint: '/api/generateImageAnimagineXL3_1', cost: 30 },
  Animagine: { endpoint: '/api/generateImageAnimagineXL3_1', cost: 30 },
  Gemini: { endpoint: '/api/generateCanvasImageGemini', cost: 30 },
  'Gemini Mini': { endpoint: '/api/generateCanvasImageGeminiMini', cost: 15 },
  'Flux Mini': { endpoint: '/api/generateImageFluxKontextProMini', cost: 20 },
  GPT: { endpoint: '/api/generateImageGPT4O', cost: 50 },
  'GPT Mini': { endpoint: '/api/generateImageGPT4OMini', cost: 25 },
  Neta: { endpoint: '/api/generateImageNeta', cost: 10 },
}

// 加载配置函数
export function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
    return {
      ...DEFAULT_CONFIG,
      ...JSON.parse(configData || '{}'),
    }
  } catch (error) {
    console.warn('⚠️  无法读取配置文件，使用默认配置')
    return DEFAULT_CONFIG
  }
}

// 设置配置函数
export async function setupConfig() {
  // console.log('🔧 配置设置')
  // console.log('请在 config.json 文件中设置以下配置:')
  // console.log('- apiBaseUrl: API服务器地址')
  // console.log('- sessionToken: 会话令牌')
  // console.log('- defaultModel: 默认AI模型')
  // console.log('- imagesPerVariant: 每个变体的图片数量')
  // console.log('- perplexityApiKey: Perplexity API密钥（可选，用于关键词研究）')
  // console.log('- enableSEOOptimization: 是否启用SEO优化')
  // console.log('- enablePerplexityResearch: 是否启用Perplexity研究')

  const configExists = fs.existsSync(CONFIG_FILE)
  if (configExists) {
    // console.log(`✅ 配置文件已存在: ${CONFIG_FILE}`)
    const config = loadConfig()
    // console.log('当前配置:')
    // console.log(JSON.stringify(config, null, 2))
    return config
  } else {
    console.log(`❌ 配置文件不存在: ${CONFIG_FILE}`)
    console.log('创建默认配置文件...')
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2))
    console.log('✅ 默认配置文件已创建')
    return loadConfig()
  }
}

// 获取模型配置
export function getModelConfig(model) {
  return MODELS[model]
}

// 获取所有可用模型
export function getAvailableModels() {
  return Object.keys(MODELS)
}

// 验证配置
export function validateConfig(config) {
  if (!config.sessionToken) {
    throw new Error(
      '需要设置 sessionToken，请先运行: node generate-variant-page.mjs setup',
    )
  }
  
  if (config.defaultModel && !MODELS[config.defaultModel]) {
    console.warn(`⚠️ 未知的默认模型: ${config.defaultModel}，使用 AnimagineXL`)
    config.defaultModel = 'AnimagineXL'
  }
  
  return config
}

export const ConfigManager = {
  loadConfig,
  setupConfig,
  getModelConfig,
  getAvailableModels,
  validateConfig,
  DEFAULT_CONFIG,
  MODELS,
  CONFIG_FILE,
  VARIANT_DATA_FILE,
  VARIANTS_DIR
}
