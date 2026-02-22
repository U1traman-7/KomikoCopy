import fs from 'fs'
import path from 'path'

// 类型定义
export interface VariantContent {
  header: {
    title: string
    subtitle: string
  }
  sections: {
    whatIs: {
      title: string
      description: string
    }
    howToUse: {
      title: string
      subtitle: string
      steps: Array<{
        title: string
        content: string
      }>
    }
    whyUse: {
      title: string
      subtitle: string
      features: Array<{
        title: string
        content: string
      }>
    }
    styles: {
      title: string
      items: Array<{
        title: string
        content: string
      }>
    }
    applications: {
      title: string
      items: Array<{
        title: string
        content: string
      }>
    }
  }
  examples: Array<{
    title: string
    image: string
    alt: string
    prompt?: string
  }>
  faq: Array<{
    question: string
    answer: string
  }>
  cta?: {
    title: string
    description: string
    buttonText: string
  }
  tips?: {
    title: string
    items: string[]
  }
}

export interface VariantData {
  seo: {
    title: string
    metaDescription: string
    metaKeywords: string
    ogDescription: string
  }
  placeholderText: string
  content: VariantContent
}

export interface ToolData {
  baseTemplate: string
  variants: Record<string, VariantData>
}

export interface ToolIndex {
  key: string
  name: string
  directory: string
  variantCount: number
}

export interface VariantIndex {
  tools: ToolIndex[]
  lastUpdated: string
}

// 文件路径
const VARIANTS_DIR = path.join(process.cwd(), 'src/data/variants')
const LEGACY_FILE = path.join(process.cwd(), 'src/data/variant-pages.json')

import { containsNsfwKeywords } from '../utilities/nsfw'

// 缓存
let indexCache: VariantIndex | null = null
let toolCache: Map<string, ToolData> = new Map()
let variantCache: Map<string, VariantData> = new Map()

// 检查是否使用新的精细化文件结构
export function usesSeparateFiles(): boolean {
  return fs.existsSync(path.join(VARIANTS_DIR, 'index.json'))
}

// 加载工具索引
export function loadVariantIndex(): VariantIndex {
  if (indexCache) {
    return indexCache
  }

  const indexPath = path.join(VARIANTS_DIR, 'index.json')
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('Variant index file not found. Please check your variants directory structure.')
  }

  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    indexCache = indexData
    return indexData
  } catch (error) {
    throw new Error(`Failed to load variant index: ${error}`)
  }
}

// 加载单个variant数据
export function loadVariantData(toolKey: string, variantKey: string, locale?: string): VariantData | null {
  const effectiveLocale = locale || 'en'
  const cacheKey = `${toolKey}/${variantKey}/${effectiveLocale}`
  
  // 检查是否包含NSFW关键词，如果包含则返回null以显示404
  if (containsNsfwKeywords(variantKey) || containsNsfwKeywords(toolKey)) {
    return null
  }
  
  // 检查缓存
  if (variantCache.has(cacheKey)) {
    return variantCache.get(cacheKey)!
  }

  // 如果使用新的精细化文件结构
  if (usesSeparateFiles()) {
    // 首先尝试加载基础variant数据
    const baseVariantPath = path.join(VARIANTS_DIR, toolKey, `${variantKey}.json`)
    
    if (!fs.existsSync(baseVariantPath)) {
      return null
    }

    try {
      const baseData = JSON.parse(fs.readFileSync(baseVariantPath, 'utf8')) as VariantData
      let variantData: VariantData = baseData
      
      // 如果不是英语，尝试加载翻译
      if (effectiveLocale !== 'en') {
        const i18nPath = path.join(process.cwd(), 'src/i18n/locales', effectiveLocale, 'variants', toolKey, `${variantKey}.json`)
        
        if (fs.existsSync(i18nPath)) {
          try {
            const translatedData = JSON.parse(
              fs.readFileSync(i18nPath, 'utf8'),
            ) as VariantData;

            variantData = {
              ...variantData,
              ...translatedData,
              content: {
                ...(variantData as any).content,
                ...(translatedData as any).content,
              } as any,
            };
          } catch (i18nError) {
            console.warn(`Failed to load translation for ${toolKey}/${variantKey} in ${effectiveLocale}, using base content`)
          }
        }
      }
      
      variantCache.set(cacheKey, variantData)
      return variantData
    } catch (error) {
      console.error(`Failed to load variant data for ${toolKey}/${variantKey}:`, error)
      return null
    }
  }

  // 回退到legacy文件或旧格式
  return loadLegacyVariantData(toolKey, variantKey)
}

// 加载单个工具的所有variants
export function loadToolData(toolKey: string): ToolData | null {
  // 检查是否包含NSFW关键词
  if (containsNsfwKeywords(toolKey)) {
    return null
  }
  
  // 检查缓存
  if (toolCache.has(toolKey)) {
    return toolCache.get(toolKey)!
  }

  // 如果使用新的精细化文件结构
  if (usesSeparateFiles()) {
    const toolDir = path.join(VARIANTS_DIR, toolKey)
    
    if (!fs.existsSync(toolDir)) {
      return null
    }

    try {
      const variants: Record<string, VariantData> = {}
      
      // 读取工具目录下的所有variant文件
      const files = fs.readdirSync(toolDir).filter(file => file.endsWith('.json'))
      
      for (const file of files) {
        const variantKey = file.replace('.json', '')
        
        // 跳过包含NSFW关键词的variants
        if (containsNsfwKeywords(variantKey)) {
          continue
        }
        
        const variantPath = path.join(toolDir, file)
        const variantData = JSON.parse(fs.readFileSync(variantPath, 'utf8'))
        variants[variantKey] = variantData
      }

      const toolData: ToolData = {
        baseTemplate: toolKey,
        variants
      }

      toolCache.set(toolKey, toolData)
      return toolData
    } catch (error) {
      console.error(`Failed to load tool data for ${toolKey}:`, error)
      return null
    }
  }

  // 回退到legacy文件
  return loadLegacyToolData(toolKey)
}

// 加载legacy格式数据
function loadLegacyVariantData(toolKey: string, variantKey: string): VariantData | null {
  const toolData = loadLegacyToolData(toolKey)
  return toolData?.variants?.[variantKey] || null
}

function loadLegacyToolData(toolKey: string): ToolData | null {
  if (!fs.existsSync(LEGACY_FILE)) {
    return null
  }

  try {
    const allData = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'))
    const toolData = allData[toolKey]
    
    if (toolData) {
      toolCache.set(toolKey, toolData)
    }
    
    return toolData || null
  } catch (error) {
    console.error(`Failed to load legacy tool data for ${toolKey}:`, error)
    return null
  }
}

// 加载所有工具数据
export function loadAllToolData(): Record<string, ToolData> {
  if (usesSeparateFiles()) {
    const index = loadVariantIndex()
    const allData: Record<string, ToolData> = {}

    index.tools.forEach(tool => {
      const toolData = loadToolData(tool.key)
      if (toolData) {
        allData[tool.key] = toolData
      }
    })

    return allData
  }

  // 回退到legacy文件
  if (!fs.existsSync(LEGACY_FILE)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'))
  } catch (error) {
    console.error('Failed to load legacy variant data:', error)
    return {}
  }
}

// 获取工具的变体数据
export function getVariantData(toolKey: string, variantKey: string): VariantData | null {
  return loadVariantData(toolKey, variantKey)
}

// 获取工具的所有变体键
export function getVariantKeys(toolKey: string): string[] {
  const toolData = loadToolData(toolKey)
  
  if (!toolData || !toolData.variants) {
    return []
  }

  return Object.keys(toolData.variants).filter(variantKey => !containsNsfwKeywords(variantKey))
}

// 检查工具是否存在
export function toolExists(toolKey: string): boolean {
  if (usesSeparateFiles()) {
    const index = loadVariantIndex()
    return index.tools.some(tool => tool.key === toolKey)
  }

  const toolData = loadToolData(toolKey)
  return toolData !== null
}

// 检查变体是否存在
export function variantExists(toolKey: string, variantKey: string): boolean {
  const toolData = loadToolData(toolKey)
  return toolData?.variants?.[variantKey] !== undefined
}

// 获取所有工具键
export function getAllToolKeys(): string[] {
  if (usesSeparateFiles()) {
    const index = loadVariantIndex()
    return index.tools.map(tool => tool.key)
  }

  const allData = loadAllToolData()
  return Object.keys(allData)
}

// 清除缓存
export function clearCache(): void {
  indexCache = null
  toolCache.clear()
  variantCache.clear()
}

// 统计信息
export function getStats() {
  const allData = loadAllToolData()
  const tools = Object.keys(allData).length
  const variants = Object.values(allData).reduce((total, tool) => 
    total + Object.keys(tool.variants || {}).length, 0
  )

  return {
    tools,
    variants,
    usingSeparateFiles: usesSeparateFiles(),
    cacheSize: toolCache.size
  }
} 