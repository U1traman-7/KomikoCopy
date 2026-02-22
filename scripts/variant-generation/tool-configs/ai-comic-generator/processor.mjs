/**
 * AI Comic Generator 专用处理器 - 只处理图片生成相关的逻辑
 * 文案生成现在由流线型处理器统一处理
 */

// 文案生成现在由流线型处理器统一处理

/**
 * 获取风格关键词映射
 */
export function getStyleKeyword(variantKey) {
  const styleMapping = {
    'manga-comic-generator': 'manga',
    'superhero-comic-generator': 'superhero',
    'fantasy-comic-generator': 'fantasy',
    'sci-fi-comic-generator': 'sci-fi'
  }

  const normalizedKey = variantKey.toLowerCase().replace(/\s+/g, '-')
  
  if (styleMapping[normalizedKey]) {
    return styleMapping[normalizedKey]
  }

  return variantKey
    .replace(/-/g, ' ')
    .replace(/\b(ai|generator|comic|creator|maker)\b/gi, '')
    .trim() || 'comic'
}

/**
 * 生成AI prompt
 */
export function generateAIPrompt(theme, count, variantKey) {
  return `You are an expert comic creation prompt generator. Your task is to generate a list of high-quality comic scene descriptions optimized for AI comic models.

**Comic Theme**: ${theme}
**Variant**: ${variantKey}
**Required Count**: ${count}

**Comic Generation Guidelines:**
1. **Story Focus**: Each prompt should describe a complete comic scene or panel
2. **Visual Narrative**: Include character actions, dialogue, panel composition
3. **Style Details**: Maintain ${theme} comic aesthetic throughout
4. **Sequential Art**: Focus on storytelling through visual sequences
5. **Variety**: Create diverse scenes within the theme

Generate ${count} unique comic scene prompts now:`
}

/**
 * 处理图片比例配置
 */
export function getImageRatioConfig(keyword, isPfp, isEnvironment) {
  // 漫画通常使用多种比例，包括竖屏和横屏
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
  return `${basePrompt}, masterpiece, best quality, detailed comic art, high resolution, professional comic style`
}

// 导出图片生成相关的函数
export default {
  getStyleKeyword,
  generateAIPrompt,
  getImageRatioConfig,
  enhancePrompt
}
