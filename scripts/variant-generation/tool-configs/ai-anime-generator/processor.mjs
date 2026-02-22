/**
 * AI Anime Generator 专用处理器 - 只处理图片生成相关的逻辑
 * 文案生成现在由流线型处理器统一处理
 */

/**
 * 获取风格关键词映射
 */
export function getStyleKeyword(variantKey) {
  const styleMapping = {
    'anime-art-generator': 'anime',
    'manga-art-generator': 'manga',
    'cartoon-art-generator': 'cartoon',
    'fantasy-art-generator': 'fantasy',
    'sci-fi-art-generator': 'sci-fi'
  }

  const normalizedKey = variantKey.toLowerCase().replace(/\s+/g, '-')
  
  if (styleMapping[normalizedKey]) {
    return styleMapping[normalizedKey]
  }

  return variantKey
    .replace(/-/g, ' ')
    .replace(/\b(ai|generator|art|creator|maker)\b/gi, '')
    .trim() || 'anime'
}

/**
 * 生成AI prompt
 */
export function generateAIPrompt(theme, count, variantKey) {
  return `You are an expert Danbooru prompt generator specializing in creating art generation prompts. Your task is to generate a list of high-quality, comma-separated Danbooru tags optimized for AI art models.

**Art Theme**: ${theme}
**Variant**: ${variantKey}
**Required Count**: ${count}

**Art Generation Guidelines:**
1. **Scene Focus**: Each prompt should describe a complete scene or artwork
2. **Visual Elements**: Include composition, lighting, colors, atmosphere
3. **Style Details**: Maintain ${theme} aesthetic throughout
4. **Artistic Quality**: Focus on visual appeal and artistic merit
5. **Variety**: Create diverse scenes within the theme

Generate ${count} unique art prompts now:`
}

/**
 * 处理图片比例配置
 */
export function getImageRatioConfig(keyword, isEnvironment) {
  if (isEnvironment) {
    return {
      'landscape-16-9': { width: 768, height: 432 }
    }
  }
  
  // 默认使用多种比例
  return {
    'portrait-2-3': { width: 512, height: 768 },
    'landscape-16-9': { width: 768, height: 432 },
    'square': { width: 512, height: 512 }
  }
}

/**
 * 增强prompt
 */
export function enhancePrompt(basePrompt) {
  return `${basePrompt}, masterpiece, best quality, detailed artwork, high resolution`
}

// 导出图片生成相关的函数
export default {
  getStyleKeyword,
  generateAIPrompt,
  getImageRatioConfig,
  enhancePrompt
}
