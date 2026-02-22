/**
 * 使用Perplexity进行SEO内容重写
 */

import { PerplexityResearch } from '../seo/perplexity-research.mjs'
import { ContentGenerator } from './content-generator.mjs'

export class EnhancedContentGenerator {
  constructor(config = {}) {
    this.config = config
    this.perplexityResearch = config.perplexityApiKey ?
      new PerplexityResearch(config.perplexityApiKey) : null
  }

  /**
   * 生成衍生页内容
   */
  async generateVariantContent(variantKey, toolType, keywords, config = {}) {
    console.log(`🚀 开始生成衍生页: ${variantKey}`)

    // 1. 获取原工具文案
    const originalContent = ContentGenerator.getBaseToolContent(toolType)
    console.log('✅ 获取原工具文案')

    // 2. 准备衍生页标题
    const title = this.parseTitle(variantKey)
    console.log(`✅ 衍生页标题: ${title}`)

    // 3. 准备工具描述
    const toolDescription = this.generateToolDescription(toolType, variantKey, originalContent)
    console.log('✅ 工具简洁描述')

    // 4. 使用Perplexity进行SEO内容重写
    let finalContent = originalContent
    if (this.perplexityResearch) {
      try {
        const rewrittenContent = await this.perplexityResearch.rewriteContentWithSEO(
          JSON.stringify(originalContent, null, 2),
          variantKey,
          toolType
        )
        if (rewrittenContent) {
          finalContent = rewrittenContent
          console.log('✅ Perplexity SEO重写完成')
        }
      } catch (error) {
        console.warn('⚠️ Perplexity重写失败，使用原内容:', error.message)
      }
    }

    // 5. 组装最终数据
    const variantData = {
      seo: {
        title: title, // 直接使用关键词作为标题
        description: toolDescription,
        keywords: this.parseKeywords(variantKey)
      },
      tool: {
        name: title,
        description: toolDescription,
        placeholderText: `Create amazing ${variantKey.toLowerCase()} with AI`
      },
      content: finalContent.content || finalContent,
      originalContent: originalContent, // 保留原工具文案引用
      variantKey,
      toolType,
      generatedAt: new Date().toISOString(),
      generationMethod: 'simplified-perplexity'
    }

    console.log('🎉 衍生页生成完成')
    return variantData
  }

  /**
   * 解析标题
   */
  parseTitle(variantKey) {
    // 如果是管道分隔的关键词，使用第一个作为主标题
    const parts = variantKey.split('|').map(k => k.trim())
    return parts[0]
  }

  /**
   * 生成工具简洁描述（我们提供，支持关键词替换）
   */
  generateToolDescription(toolType, variantKey, originalContent) {
    // 基于原工具的whatIs描述，进行关键词替换
    const whatIsDescription = originalContent?.sections?.whatIs?.description ||
                             originalContent?.whatIs?.description ||
                             `AI-powered ${variantKey.toLowerCase()} generator`

    // 简单替换关键词，保持原有描述的结构
    const description = whatIsDescription
      .replace(/OC Maker/gi, variantKey)
      .replace(/AI Anime Generator/gi, variantKey)
      .replace(/AI Comic Generator/gi, variantKey)
      .replace(/original character/gi, variantKey.toLowerCase())
      .replace(/anime character/gi, variantKey.toLowerCase())
      .replace(/comic/gi, variantKey.toLowerCase())

    return description
  }

  /**
   * 解析关键词
   */
  parseKeywords(variantKey) {
    const parts = variantKey.split('|').map(k => k.trim()).filter(k => k)
    return parts
  }
}

export default EnhancedContentGenerator
