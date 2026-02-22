/**
 * Perplexity API集成模块 - 用于SEO内容生成
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class PerplexityResearch {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.perplexity.ai/chat/completions'
    // 设置变体文件保存目录
    this.variantsDir = path.join(__dirname, '../../../src/data/variants')
  }

  /**
   * 调用Perplexity API
   */
  async callAPI(messages, model = 'sonar') {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: false,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * 基于研究结果重写内容
   */
  async rewriteContentWithSEO(originalContent, keyword, toolType = 'ai-generator') {
    console.log(`✍️ 重写内容:`, keyword)

    const keywordParts = keyword.split('|').map(k => k.trim()).filter(k => k)
    const primaryKeyword = keywordParts[0]
    const additionalKeywords = keywordParts.slice(1)

    // Load tool configuration for better context
    let toolConfig = null
    try {
      const { ToolLoader } = await import('../core/tool-loader.mjs')
      toolConfig = await ToolLoader.loadToolConfig(toolType)
    } catch (error) {
      console.warn(`⚠️ 无法加载工具配置 ${toolType}:`, error.message)
    }

    const toolDescription = toolConfig ? `

**TOOL CONTEXT:**
${toolConfig.name} - ${toolConfig.description}

**Key Features:**
${toolConfig.keyFeatures ? toolConfig.keyFeatures.map(feature => `- ${feature}`).join('\n') : 'Advanced AI-powered generation capabilities'}

**Target Audience:**
${toolConfig.targetAudience ? toolConfig.targetAudience.join(', ') : 'Content creators, artists, and digital creators'}

**Primary Use Cases:**
${toolConfig.useCases ? toolConfig.useCases.slice(0, 3).map(useCase => `- ${useCase}`).join('\n') : 'Creative content generation and artistic projects'}` : ''

    const messages = [{
      role: 'user',
      content: `Act as an SEO expert. My website KomikoAI is an AI platform for creating comics, manhwa, manga, anime, animations, etc. I'm adding a new tool webpage to KomikoAI titled '${primaryKeyword}' to improve SEO, the new tool is a variation of the original ${toolType} tool, i.e., the same functionality but to optimize for another Google keyword.

I need you to do 2 steps:

1. Research about the new tool title as a new topic, extract the core set of keywords other websites are using
2. Reference those webpages you've found to rewrite the webpage copy about the new tool with great SEO. You should change the copy of the original tool so that it's about the new topic and the wording is very different from the original copy. However, for the How to use section, you should only change the wording but don't change too much as it's still the same functionality just a different name. You should have very natural and human-like language using, write very detailed content so the webpage is highly detailed, and make sure my webpage has high keyword density (according to the core keywords from the websites you've found). Don't mention KomikoAI's AI XXX, but directly say AI XXX. You only need to output the new webpage copy after editing and improving the SEO. No need to summarize what you've found.

**Analysis First:**

The webpage content copy of the original tool:
${originalContent}${toolDescription}

**STANDARDIZED SECTION HEADINGS (MUST USE EXACTLY):**
- "How to Use The ${primaryKeyword}"
- "${primaryKeyword} Examples"
- "Why Use The ${primaryKeyword}"
- "${primaryKeyword} FAQ"

**BENEFITS FEATURES FORMAT (MUST FOLLOW EXACTLY):**
- Each feature must have: "title", "content", and "icon"
- The "title" field should NOT include emoji - put emoji ONLY in the "icon" field
- Example: {"title": "Fast and Efficient", "content": "...", "icon": "⚡"}
- NOT like this: {"title": "⚡ Fast and Efficient", ...}

**STRICT FAQ TEMPLATE (MUST FOLLOW EXACTLY - 9 QUESTIONS):**
The FAQ section must include exactly 9 questions. Use "XXX" as a grammatically correct theme-related term (not just the tool name).

"faq": {
  "title": "${primaryKeyword} FAQ",
  "description": "[15-20 words FAQ section intro]",
  "q1": "What is XXX?",
  "a1": "XXX is an AI tool that [comprehensive explanation 45-55 words]",
  "q2": "How to [use XXX/create with XXX]?",
  "a2": "Using XXX is simple! First [step], then [step], and [step]. [Additional details 50-60 words total]",
  "q3": "How does XXX work?",
  "a3": "XXX uses [technology] technology to [process]. It works by [technical explanation 45-55 words total]",
  "q4": "What is the best [tool category]?",
  "a4": "KomikoAI provides the best [tool category] tool. Our goal is to be the leading AI creation platform by delivering professional-quality results, powerful and fun customization, and an intuitive workflow—completely free to try. With KomikoAI's ${primaryKeyword}, you can [list benefits], making it perfect for users who [target audience description]",
  "q5": "Is the KomikoAI ${primaryKeyword} free online?",
  "a5": "Yes, you can test out the ${primaryKeyword} on KomikoAI for free, without having to sign up to any subscription. Try our tool today!",
  "q6": "What can I do with ${primaryKeyword}?",
  "a6": "You can use ${primaryKeyword} on KomikoAI to create [list specific possibilities 45-55 words]",
  "q7": "Can I use ${primaryKeyword} on my phone?",
  "a7": "Yes, you can use ${primaryKeyword} as a web app on different devices, including smartphones and computers, making it convenient for everyone.",
  "q8": "Can I download my generation from ${primaryKeyword}?",
  "a8": "Yes, KomikoAI's ${primaryKeyword} allows you to export your generation in various formats, such as [list formats], for easy sharing.",
  "q9": "Why should I use ${primaryKeyword}?",
  "a9": "Using ${primaryKeyword} can [list benefits]. Our tool allows you to [list capabilities 45-55 words total]"
}

Return ONLY valid JSON in this exact format (no extra text, no code blocks, no explanations):
{
  "seo": {
    "meta": {
      "title": "${primaryKeyword}",
      "description": "SEO meta description (150-160 characters)",
      "keywords": "keyword1, keyword2, keyword3"
    },
    "hero": {
      "title": "${primaryKeyword}"
    },
    "whatIs": {
      "title": "What is ${primaryKeyword}?",
      "description": "Detailed description of what the tool is and does"
    },
    "examples": {
      "title": "${primaryKeyword} Examples",
      "description": "Examples description"
    },
    "howToUse": {
      "title": "How to Use The ${primaryKeyword}",
      "steps": [
        {"title": "Step 1 title", "content": "Step 1 detailed content"},
        {"title": "Step 2 title", "content": "Step 2 detailed content"},
        {"title": "Step 3 title", "content": "Step 3 detailed content"},
        {"title": "Step 4 title", "content": "Step 4 detailed content"}
      ]
    },
    "benefits": {
      "title": "Why Use The ${primaryKeyword}",
      "description": "Benefits overview description",
      "features": [
        {"title": "Feature 1 title", "content": "Feature 1 detailed description", "icon": "🎨"},
        {"title": "Feature 2 title", "content": "Feature 2 detailed description", "icon": "⚡"},
        {"title": "Feature 3 title", "content": "Feature 3 detailed description", "icon": "✨"},
        {"title": "Feature 4 title", "content": "Feature 4 detailed description", "icon": "🎯"},
        {"title": "Feature 5 title", "content": "Feature 5 detailed description", "icon": "👌"},
        {"title": "Feature 6 title", "content": "Feature 6 detailed description", "icon": "🚀"}
      ]
    },
    "faq": {
      "title": "${primaryKeyword} FAQ",
      "description": "FAQ section description (15-20 words)",
      "q1": "What is XXX?",
      "a1": "Answer 1 (45-55 words)",
      "q2": "How to use XXX?",
      "a2": "Answer 2 (50-60 words)",
      "q3": "How does XXX work?",
      "a3": "Answer 3 (45-55 words)",
      "q4": "What is the best [tool category]?",
      "a4": "Answer 4 (must include KomikoAI positioning)",
      "q5": "Is the KomikoAI ${primaryKeyword} free online?",
      "a5": "Answer 5",
      "q6": "What can I do with ${primaryKeyword}?",
      "a6": "Answer 6 (45-55 words)",
      "q7": "Can I use ${primaryKeyword} on my phone?",
      "a7": "Answer 7",
      "q8": "Can I download my generation from ${primaryKeyword}?",
      "a8": "Answer 8",
      "q9": "Why should I use ${primaryKeyword}?",
      "a9": "Answer 9 (45-55 words)"
    },
    "cta": {
      "title": "Transform for FREE with Our ${primaryKeyword} Today!",
      "description": "Motivational call-to-action message (12-16 words)",
      "buttonText": "Try Our ${primaryKeyword} Free"
    }
  },
  "examples": []
}`
    }]

    try {
      console.log('🚀 开始调用 Perplexity API 进行内容重写...')
      const result = await this.callAPI(messages)
      console.log('✅ 内容重写 API 调用成功')
      console.log('📝 准备解析重写结果...')
      return this.parseContentRewrite(result)
    } catch (error) {
      console.warn('⚠️ 内容重写失败:', error.message)
      console.error('🔍 内容重写错误详情:', error)
      return null
    }
  }

  /**
   * 解析内容重写结果
   */
  async parseContentRewrite(content) {
    try {
      console.log('🔍 解析 Perplexity 响应...')

      const jsonString = this.cleanAndExtractJSON(content)
      const parsed = JSON.parse(jsonString)

      console.log('✅ JSON 解析成功')
      console.log('📊 解析结果包含:', Object.keys(parsed).length, '个顶级字段')
      if (parsed.seo) {
        console.log('🎯 SEO对象包含:', Object.keys(parsed.seo).length, '个部分')
      }
      return parsed

    } catch (error) {
      console.warn('⚠️ 解析失败:', error.message)
      // 进一步保存清理后的中间结果，方便定位
      try {
        const extracted = this.extractJSONFromResponse(content.trim()) || ''
        const fixed = extracted ? this.fixJSONFormat(extracted) : ''
        this.saveDebugFile(content, extracted, fixed)
      } catch (_) {
        this.saveDebugFile(content)
      }
      return null
    }
  }

  /**
   * 清理并提取JSON字符串
   */
  cleanAndExtractJSON(content) {
    // 1. 基础清理
    let cleaned = content.trim()

    // 2. 移除markdown代码块
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```$/, '')
    }

    // 3. 提取JSON对象
    const extracted = this.extractJSONFromResponse(cleaned)
    if (!extracted) {
      throw new Error('未找到完整的JSON对象')
    }

    // 4. 如果已是有效JSON，直接返回
    try {
      JSON.parse(extracted)
      return extracted
    } catch (_) {}

    // 5. 进行容错修复
    console.log('🔧 开始修复JSON格式问题...')
    const fixed = this.fixJSONFormat(extracted)
    console.log('✅ JSON格式修复完成')
    return fixed;
  }

  /**
   * 修复JSON格式问题
   */
  fixJSONFormat(jsonString) {
    let fixed = jsonString

    try {
      // 如果本身已是有效 JSON，直接返回
      try {
        JSON.parse(fixed)
        return fixed
      } catch (_) {}

      // 0. 轻量预清理
      fixed = fixed
        .replace(/,\s*([}\]])/g, '$1') // 去尾随逗号
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // 去零宽/BOM
        .replace(/"\s*，\s*"/g, '", "') // 全角逗号为半角
        .replace(/\s*，\s*(?=[}\]])/g, '')

      // 1. 修复字符串中的换行符问题
      // 将属性名后的换行符修复为正确格式
      fixed = fixed.replace(/("\w+"\s*:\s*)\n\s+/g, '$1')

      // 2. 修复字符串值中的意外换行
      fixed = fixed.replace(/("(?:title|content|description)"\s*:\s*)\n\s*("[^"]*")/g, '$1$2')

      // 3. 修复未转义的反斜杠
      fixed = fixed.replace(/([^\\])\\([^\\"])/g, '$1\\\\$2')

      // 4. 修复缺少引号的值（特别是emoji）
      fixed = fixed.replace(/:\s*([🎨⚡⭐🌟])\s*([,}])/g, ':"$1"$2')

      // 5. 修复多行字符串问题
      fixed = fixed.replace(/("content"\s*:\s*"[^"]*),\s*([^"]*")/g, '$1 $2')

      // 6. 仅移除多余换行，不压缩普通空白，避免破坏内容
      fixed = fixed.replace(/\r?\n+/g, '\n')

      // 7. 修复数组和对象结构中的问题
      fixed = fixed.replace(/,\s*,/g, ',')
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

      // 8. 修复FAQ部分的字符串连接问题
      fixed = fixed.replace(/"([^"]*?)","([^"]*?)"/g, '"$1", "$2"')

      // 9. 确保所有字符串都正确闭合
      fixed = fixed.replace(/("[^"]*?)([,}])/g, (match, str, end) => {
        if (!str.endsWith('"')) {
          return str + '"' + end
        }
        return match
      })

      return fixed.trim()

    } catch (error) {
      console.warn('⚠️ JSON修复过程中出错，返回原始内容:', error.message)
      return jsonString
    }
  }

  /**
   * 保存调试文件
   */
  async saveDebugFile(content, extracted = null, fixed = null) {
    try {
      const fs = await import('fs')
      const ts = Date.now()
      const base = `debug-json-${ts}`
      const rawPath = `${base}.txt`
      fs.writeFileSync(rawPath, content)
      console.error(`🐛 调试原始已保存: ${rawPath}`)
      if (extracted) {
        const exPath = `${base}.extracted.json`
        fs.writeFileSync(exPath, extracted)
        console.error(`🐛 调试提取已保存: ${exPath}`)
      }
      if (fixed) {
        const fixPath = `${base}.fixed.json`
        fs.writeFileSync(fixPath, fixed)
        console.error(`🐛 调试修复已保存: ${fixPath}`)
      }
    } catch (e) {
      console.error('无法保存调试文件:', e.message)
    }
  }

  /**
   * 从响应中提取 JSON 对象
   */
  extractJSONFromResponse(response) {
    // 首先尝试简单的大括号匹配
    let braceCount = 0
    let startIndex = -1
    let inString = false
    let stringChar = null
    let escapeNext = false

    for (let i = 0; i < response.length; i++) {
      const char = response[i]

      // 处理转义字符
      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      // 处理字符串状态
      if ((char === '"' || char === "'") && !escapeNext) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
          stringChar = null
        }
      }

      // 只在非字符串状态下计算大括号
      if (!inString) {
        if (char === '{') {
          if (startIndex === -1) startIndex = i
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && startIndex !== -1) {
            return response.substring(startIndex, i + 1)
          }
        }
      }
    }

    // 如果没有找到完整的JSON，尝试修复截断的JSON
    if (startIndex !== -1 && braceCount > 0) {
      console.log('🔧 尝试修复不完整的JSON...')
      let truncated = response.substring(startIndex)

      // 移除末尾的垃圾字符和不完整的对象
      truncated = truncated.replace(/[^}]*$/, '').trim()

      // 如果仍然不平衡，手动添加缺失的闭合括号
      let fixedBraceCount = 0
      let fixedInString = false
      let fixedStringChar = null
      let fixedEscapeNext = false

      for (let i = 0; i < truncated.length; i++) {
        const char = truncated[i]

        if (fixedEscapeNext) {
          fixedEscapeNext = false
          continue
        }

        if (char === '\\') {
          fixedEscapeNext = true
          continue
        }

        if ((char === '"' || char === "'") && !fixedEscapeNext) {
          if (!fixedInString) {
            fixedInString = true
            fixedStringChar = char
          } else if (char === fixedStringChar) {
            fixedInString = false
            fixedStringChar = null
          }
        }

        if (!fixedInString) {
          if (char === '{') {
            fixedBraceCount++
          } else if (char === '}') {
            fixedBraceCount--
          }
        }
      }

      // 添加缺失的闭合括号
      while (fixedBraceCount > 0) {
        truncated += '}'
        fixedBraceCount--
      }

      // 验证修复后的JSON是否有效
      try {
        JSON.parse(truncated)
        console.log('✅ JSON修复成功')
        return truncated
      } catch (e) {
        console.log('❌ JSON修复失败:', e.message)
      }
    }

    return null
  }

  /**
   * 将关键字转换为合适的slug格式（用于文件路径和URL）
   */
  keywordToSlug(keyword) {
    return keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // 将非字母数字字符替换为连字符
      .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
  }

  /**
   * 直接保存Perplexity结果到变体文件
   */
  async saveResultsDirectly(toolType, keyword, seoContent, examples = []) {
    try {
      console.log(`💾 开始保存 ${toolType}/${keyword} 的结果...`)

      // 确保工具目录存在
      const toolDir = path.join(this.variantsDir, toolType)
      if (!fs.existsSync(toolDir)) {
        fs.mkdirSync(toolDir, { recursive: true })
        console.log(`📁 创建目录: ${toolDir}`)
      }

      // 生成文件名
      const keywordSlug = this.keywordToSlug(keyword)
      const variantFilePath = path.join(toolDir, `${keywordSlug}.json`)

      // 构建变体数据结构
      const variantData = {
        seo: seoContent.seo || {},
        placeholderText: seoContent.placeholderText || `Generate ${keyword} style artwork`,
        content: {
          header: {
            title: seoContent.seo?.hero?.title || keyword,
            subtitle: seoContent.seo?.hero?.subtitle || `Generate ${keyword} style artwork with AI`,
          },
          whatIs: seoContent.seo?.whatIs || {},
          howToUse: seoContent.seo?.howToUse || {},
          benefits: seoContent.seo?.benefits || {},
          faq: seoContent.seo?.faq || {},
          examples: examples
        },
        originalKeyword: keyword,
      }

      // 保存文件
      fs.writeFileSync(variantFilePath, JSON.stringify(variantData, null, 2), 'utf8')
      console.log(`✅ 变体文件已保存: ${variantFilePath}`)

      return {
        success: true,
        filePath: variantFilePath,
        data: variantData
      }

    } catch (error) {
      console.error(`❌ 保存结果失败:`, error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成并直接保存SEO内容
   */
  async generateAndSave(originalContent, keyword, toolType = 'ai-generator', examples = []) {
    try {
      console.log(`🚀 开始为 ${keyword} 生成并保存SEO内容...`)

      // 生成SEO内容
      const seoContent = await this.rewriteContentWithSEO(originalContent, keyword, toolType)

      if (!seoContent) {
        throw new Error('SEO内容生成失败')
      }

      // 直接保存结果
      const saveResult = await this.saveResultsDirectly(toolType, keyword, seoContent, examples)

      if (saveResult.success) {
        console.log(`🎉 ${keyword} 的SEO内容生成并保存成功!`)
        return saveResult
      } else {
        throw new Error(saveResult.error)
      }

    } catch (error) {
      console.error(`❌ 生成并保存失败:`, error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批量生成并保存多个关键词的SEO内容
   */
  async batchGenerateAndSave(originalContent, keywords, toolType = 'ai-generator') {
    const results = []

    console.log(`📦 开始批量处理 ${keywords.length} 个关键词...`)

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i]
      console.log(`\n🔄 处理第 ${i + 1}/${keywords.length} 个关键词: ${keyword}`)

      try {
        const result = await this.generateAndSave(originalContent, keyword, toolType)
        results.push({
          keyword,
          ...result
        })

        // 添加延迟以避免API限制
        if (i < keywords.length - 1) {
          console.log('⏳ 等待 2 秒后继续...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.error(`❌ 处理 ${keyword} 时出错:`, error.message)
        results.push({
          keyword,
          success: false,
          error: error.message
        })
      }
    }

    // 输出批量处理结果摘要
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`\n📊 批量处理完成:`)
    console.log(`✅ 成功: ${successful} 个`)
    console.log(`❌ 失败: ${failed} 个`)

    if (failed > 0) {
      console.log(`\n失败的关键词:`)
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.keyword}: ${r.error}`)
      })
    }

    return results
  }
}

export default PerplexityResearch
