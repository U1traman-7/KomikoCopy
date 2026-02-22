/**
 * 简化的内容处理器
 * 
 * 简单流程：
 * 1. 从 i18n JSON 文件中提取整个对象
 * 2. 直接传给 AI
 * 3. AI 返回相同结构的变体内容
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 从 i18n JSON 文件中提取原始内容
 */
export function extractOriginalContent(toolType) {
  try {
    const translationPath = path.join(
      __dirname,
      `../../../src/i18n/locales/en/${toolType}.json`
    )
    
    if (!fs.existsSync(translationPath)) {
      console.warn(`⚠️ Translation file not found: ${toolType}.json`)
      return {}
    }

    const originalContent = JSON.parse(fs.readFileSync(translationPath, 'utf8'))
    console.log(`✅ Extracted original content from ${toolType}.json`)
    return originalContent

  } catch (error) {
    console.warn(`⚠️ Error reading ${toolType}.json:`, error.message)
    return {}
  }
}

/**
 * 生成简化的 AI prompt
 */
export function generateSimpleAIPrompt(originalContent, variantKeyword, toolType) {
  return `You are an expert content creator for AI tool landing pages. Create compelling, SEO-optimized content for a "${variantKeyword}" variant page.

**ORIGINAL TOOL CONTENT:**
${JSON.stringify(originalContent, null, 2)}

**TASK:**
Generate variant content with the EXACT SAME JSON structure as above, but adapted for "${variantKeyword}".

**REQUIREMENTS:**
1. **Maintain Structure**: Use the exact same JSON structure as the original
2. **Keyword Integration**: Replace the original tool name with "${variantKeyword}" throughout
3. **Quality Match**: Match the quality, depth, and style of the original content
4. **SEO Optimization**: Ensure high keyword density while maintaining readability
5. **Natural Language**: Make sure all text flows naturally

**IMPORTANT:**
- Keep the same JSON keys and structure
- Replace tool-specific terms with "${variantKeyword}" equivalents
- Maintain the same level of detail and professionalism
- Ensure all sections are complete and valuable

**OUTPUT:**
Return ONLY a valid JSON object with the same structure as the input, adapted for "${variantKeyword}".`
}
/**
 * 解析 AI 响应
 */
export function parseAIResponse(aiResponse) {
  try {
    // 尝试找到 JSON 内容
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const jsonContent = JSON.parse(jsonMatch[0])
    return jsonContent

  } catch (error) {
    console.error('Failed to parse AI response:', error.message)
    throw new Error('Invalid AI response format')
  }
}

/**
 * 创建标准化输出格式
 */
export function createStandardizedOutput(variantContent, variantKeyword, toolType, originalContent) {
  // 解析变体关键词
  const title = parseVariantTitle(variantKeyword)
  
  return {
    // SEO 元数据
    seo: {
      title: variantContent.title || title,
      description: variantContent.meta?.description || `Create ${variantKeyword.toLowerCase()} with AI`,
      keywords: variantContent.meta?.keywords || generateKeywords(variantKeyword)
    },
    // 完整的变体内容（保持原始结构）
    content: variantContent,
  }
}

/**
 * 解析变体标题
 */
function parseVariantTitle(variantKeyword) {
  // 如果是管道分隔的关键词，使用第一个
  const parts = variantKeyword.split('|').map(k => k.trim())
  return parts[0]
}

/**
 * 生成关键词
 */
function generateKeywords(variantKeyword) {
  const parts = variantKeyword.split('|').map(k => k.trim()).filter(k => k)
  return parts.join(', ')
}

export const SimpleContentProcessor = {
  extractOriginalContent,
  generateSimpleAIPrompt,
  parseAIResponse,
  createStandardizedOutput,
}
