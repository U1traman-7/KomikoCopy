/**
 * Playground (AI Style Transfer) - 只处理图片生成相关的逻辑
 *
 */

/**
 * 获取风格关键词映射
 */
export function getStyleKeyword(variantKey) {
  const styleMapping = {
    'anime-style-transfer': 'anime',
    'cartoon-style-transfer': 'cartoon',
    'oil-painting-filter': 'oil painting',
    'watercolor-filter': 'watercolor'
  }

  const normalizedKey = variantKey.toLowerCase().replace(/\s+/g, '-')
  
  if (styleMapping[normalizedKey]) {
    return styleMapping[normalizedKey]
  }

  return variantKey
    .replace(/-/g, ' ')
    .replace(/\b(ai|style|transfer|filter|converter)\b/gi, '')
    .trim() || 'artistic style'
}

/**
 * 生成AI prompt
 */
export function generateAIPrompt(theme, count, variantKey) {
  return `You are an expert style transfer prompt generator. Your task is to generate a list of high-quality image transformation descriptions optimized for AI style transfer models.

**Style Theme**: ${theme}
**Variant**: ${variantKey}
**Required Count**: ${count}

**Style Transfer Guidelines:**
1. **Transformation Focus**: Each prompt should describe a style transformation
2. **Visual Effects**: Include artistic techniques, color palettes, textures
3. **Style Consistency**: Maintain ${theme} aesthetic throughout
4. **Artistic Quality**: Focus on professional artistic results
5. **Variety**: Create diverse transformation examples within the theme

Generate ${count} unique style transfer prompts now:`
}

/**
 * 处理图片比例配置
 */
export function getImageRatioConfig(keyword, isPfp, isEnvironment) {
  // Style transfer通常保持原图比例，提供多种选择
  return {
    'square': { width: 512, height: 512 },
    'portrait-2-3': { width: 512, height: 768 },
    'landscape-16-9': { width: 768, height: 432 }
  }
}

/**
 * 增强prompt
 */
export function enhancePrompt(basePrompt) {
  return `${basePrompt}, high quality artistic style, professional transformation, detailed rendering`
}

// 导出图片生成相关的函数
export default {
  getStyleKeyword,
  generateAIPrompt,
  getImageRatioConfig,
  enhancePrompt
}
