/**
 * SEO 生成器管理器 - 支持多种 SEO 生成方案
 */

import { StreamlinedContentProcessor } from './streamlined-content-processor.mjs'
import { PerplexityResearch } from '../seo/perplexity-research.mjs'

// 可用的 SEO 生成方案
export const SEO_GENERATORS = {
  STREAMLINED: 'streamlined',
  PERPLEXITY: 'perplexity'
}

/**
 * SEO 生成器管理器类
 */
export class SEOGeneratorManager {
  constructor(config) {
    this.config = config
    this.currentGenerator = SEO_GENERATORS.STREAMLINED
    
    // 初始化生成器实例
    this.generators = {
      [SEO_GENERATORS.STREAMLINED]: new StreamlinedGenerator(config),
      [SEO_GENERATORS.PERPLEXITY]: new PerplexityGenerator(config)
    }
  }

  /**
   * 设置当前使用的生成器
   */
  setGenerator(generatorType) {
    if (!this.generators[generatorType]) {
      throw new Error(`不支持的生成器类型: ${generatorType}`)
    }
    
    this.currentGenerator = generatorType
    console.log(`🔄 切换到 ${generatorType} 生成器`)
  }

  /**
   * 获取当前生成器
   */
  getCurrentGenerator() {
    return this.generators[this.currentGenerator]
  }

  /**
   * 生成 SEO 内容
   */
  async generateSEOContent(toolType, variantKeyword, defaultStyle = null) {
    const generator = this.getCurrentGenerator()
    console.log(`🚀 使用 ${this.currentGenerator} 生成器生成 SEO 内容`)

    return await generator.generateContent(toolType, variantKeyword, defaultStyle)
  }

  /**
   * 获取可用的生成器列表
   */
  getAvailableGenerators() {
    return Object.values(SEO_GENERATORS)
  }

  /**
   * 检查生成器是否可用
   */
  isGeneratorAvailable(generatorType) {
    const generator = this.generators[generatorType]
    return generator && generator.isAvailable()
  }
}

/**
 * 流线型生成器包装类
 */
class StreamlinedGenerator {
  constructor(config) {
    this.config = config
    this.name = 'Streamlined Content Generator'
    this.description = '使用内置 AI 模型生成 SEO 内容'
  }

  /**
   * 检查是否可用
   */
  isAvailable() {
    return !!(this.config.apiBaseUrl && this.config.sessionToken)
  }

  /**
   * 生成内容
   */
  async generateContent(toolType, variantKeyword, defaultStyle = null) {
    console.log(`📝 使用Default文案生成器: ${variantKeyword}`)
    if (defaultStyle) {
      console.log(`🎨 使用默认样式: ${defaultStyle}`)
    }

    // Step 1: 提取原始 SEO 对象
    const originalSEO = StreamlinedContentProcessor.extractSEOObject(toolType)

    if (!originalSEO || Object.keys(originalSEO).length === 0) {
      throw new Error(`无法获取 ${toolType} 的原始 SEO 内容`)
    }

    // Step 2: 生成 AI 提示词
    const aiPrompt = await StreamlinedContentProcessor.generateStreamlinedAIPrompt(
      originalSEO,
      variantKeyword,
      toolType
    )

    // Step 3: 调用 AI 生成内容
    const aiResponse = await this.callAI(aiPrompt)

    // Step 4: 解析 AI 响应
    let variantSEO = StreamlinedContentProcessor.parseAIResponse(aiResponse)

    // Step 5: AI 反思和质量检查
    try {
      const reflectionPrompt = StreamlinedContentProcessor.generateReflectionPrompt(
        variantSEO,
        variantKeyword,
        toolType
      )

      const reflectionResponse = await this.callAI(reflectionPrompt)
      const improvedSEO = StreamlinedContentProcessor.parseReflectionResponse(reflectionResponse)

      if (improvedSEO) {
        variantSEO = improvedSEO
        console.log(`✅ AI反思完成，内容已优化`)
      }
    } catch (error) {
      console.warn(`⚠️ AI反思失败:`, error.message)
    }

    // Step 6: 创建变体文件内容
    const variantContent = await StreamlinedContentProcessor.createVariantFileContent(
      variantSEO,
      [], // Empty examples array
      toolType,
      variantKeyword,
      null, // pageStructure will be auto-generated
      defaultStyle // Pass the default style
    )

    return {
      success: true,
      content: variantContent,
      generator: 'streamlined',
      metadata: {
        variantKeyword,
        toolType,
        generatedAt: new Date().toISOString(),
        method: 'streamlined-ai',
        version: '2.0'
      }
    }
  }

  /**
   * 调用 AI API
   */
  async callAI(prompt) {
    const response = await fetch(`${this.config.apiBaseUrl}/api/generateText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `next-auth.session-token=${this.config.sessionToken}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        noNeedLogin: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`)
    }

    const result = await response.text()
    return result
  }
}

/**
 * Perplexity 生成器包装类
 */
class PerplexityGenerator {
  constructor(config) {
    this.config = config
    this.name = 'Perplexity Research Generator'
    this.description = '使用 Perplexity API 进行关键词研究和内容生成'
    
    // 初始化 Perplexity 研究实例
    if (config.perplexityApiKey) {
      this.perplexity = new PerplexityResearch(config.perplexityApiKey)
    }
  }

  /**
   * 检查是否可用
   */
  isAvailable() {
    return !!(this.config.perplexityApiKey && this.perplexity)
  }

  /**
   * 生成内容
   */
  async generateContent(toolType, variantKeyword, defaultStyle = null) {
    if (!this.isAvailable()) {
      throw new Error('Perplexity API key 未配置或不可用')
    }

    console.log(`🔍 使用 Perplexity 生成器: ${variantKeyword}`)
    if (defaultStyle) {
      console.log(`🎨 使用默认样式: ${defaultStyle}`)
    }

    // Step 1: 获取原始内容
    const originalSEO = StreamlinedContentProcessor.extractSEOObject(toolType)
    
    if (!originalSEO || Object.keys(originalSEO).length === 0) {
      throw new Error(`无法获取 ${toolType} 的原始 SEO 内容`)
    }

    // Step 2: 直接进行内容重写（包含关键词研究）
    console.log(`📝 使用 Perplexity 进行内容重写（包含关键词研究）...`)
    console.log('originalSEO', JSON.stringify(originalSEO))
    console.log('variantKeyword', variantKeyword)
    console.log('toolType', toolType)
    let rewrittenContent = await this.perplexity.rewriteContentWithSEO(
      JSON.stringify(originalSEO),
      variantKeyword,
      toolType
    )

    // 如果 Perplexity 重写失败或内容为空，使用 Streamlined 作为 fallback
    if (!rewrittenContent || this.isContentEmpty(rewrittenContent)) {
      console.warn('⚠️ Perplexity 内容重写失败或内容为空，使用 Streamlined 作为 fallback')

      // 使用 StreamlinedContentProcessor 作为 fallback
      const { StreamlinedContentProcessor } = await import('./streamlined-content-processor.mjs')

      const aiPrompt = await StreamlinedContentProcessor.generateStreamlinedAIPrompt(
        originalSEO,
        variantKeyword,
        toolType
      )

      const aiResponse = await this.callAI(aiPrompt)
      const fallbackSEO = StreamlinedContentProcessor.parseAIResponse(aiResponse)

      rewrittenContent = fallbackSEO
      console.log('✅ Streamlined fallback 生成成功')
    }

    // Step 4: 创建变体文件内容
    const seoContent = rewrittenContent.seo || rewrittenContent
    const examples = rewrittenContent.examples || []

    const variantContent = await StreamlinedContentProcessor.createVariantFileContent(
      seoContent,
      examples,
      toolType,
      variantKeyword,
      null, // pageStructure will be auto-generated
      defaultStyle // Pass the default style
    )

    return {
      success: true,
      content: variantContent,
      generator: 'perplexity',
      metadata: {
        variantKeyword,
        toolType,
        generatedAt: new Date().toISOString(),
        method: 'perplexity-direct',
        version: '2.0'
      }
    }
  }

  /**
   * 检查内容是否为空或无效
   */
  isContentEmpty(content) {
    if (!content || !content.seo) return true

    const seo = content.seo

    // 检查关键字段是否为空
    const isEmpty = (
      !seo.meta?.title?.trim() ||
      !seo.meta?.description?.trim() ||
      !seo.hero?.title?.trim() ||
      !seo.whatIs?.title?.trim() ||
      !seo.whatIs?.description?.trim()
    )

    return isEmpty
  }

  /**
   * AI API 调用函数
   */
  async callAI(prompt) {
    const response = await fetch(`${this.config.apiBaseUrl}/api/generateText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `next-auth.session-token=${this.config.sessionToken}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        noNeedLogin: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`)
    }

    const result = await response.text()
    return result
  }

  /**
   * 获取工具分类
   */
  getToolCategory(toolType) {
    const categories = {
      'video-to-video': 'Video Generation',
      'oc-maker': 'Character Creation',
      'ai-anime-generator': 'Anime Generation',
      'ai-comic-generator': 'Comic Creation',
      'playground': 'Style Transfer'
    }
    return categories[toolType] || 'AI Generation'
  }
}

export default SEOGeneratorManager
