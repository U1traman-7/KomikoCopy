/**
 * OC Maker 专用处理器 - 只处理图片生成相关的逻辑
 * 文案生成现在由流线型处理器统一处理
 */

/**
 * 获取风格关键词映射
 */
export function getStyleKeyword(variantKey) {
  const styleMapping = {
    'pokemon-oc-maker': 'Pokemon',
    'anime-oc-maker': 'anime',
    'anime-character-generator': 'anime',
    'vampire-oc-maker': 'vampire',
    'fantasy-oc-maker': 'fantasy',
    'superhero-oc-maker': 'superhero',
    'manga-oc-maker': 'manga',
    'cartoon-oc-maker': 'cartoon'
  }

  const normalizedKey = variantKey.toLowerCase().replace(/\s+/g, '-')
  
  if (styleMapping[normalizedKey]) {
    return styleMapping[normalizedKey]
  }

  // 从变体名称中提取风格
  return variantKey
    .replace(/-/g, ' ')
    .replace(/\b(oc maker|oc generator|character generator|generator|ai|creator|maker|builder)\b/gi, '')
    .trim() || 'character'
}

/**
 * 生成OC Maker专用的AI prompt
 */
export function generateAIPrompt(theme, count, variantKey) {
  return `You are an expert Danbooru prompt generator specializing in creating character generation prompts. Your task is to generate a list of high-quality, comma-separated Danbooru tags optimized for AI character models.

**Character Theme**: ${theme}
**Variant**: ${variantKey}
**Required Count**: ${count}

**Character Generation Guidelines:**
1. **Character Focus**: Each prompt should describe a complete character
2. **Appearance Details**: Include hair, eyes, clothing, accessories
3. **Personality Hints**: Add expressions or poses that suggest personality
4. **Style Consistency**: Maintain ${theme} aesthetic throughout
5. **Variety**: Create diverse characters within the theme

**Tag Structure**: character_type, hair_color, eye_color, clothing_style, pose/expression, background_hint, quality_tags

**Quality Tags to Include**: masterpiece, best quality, detailed, high resolution, original character

Generate ${count} unique character prompts now:`
}

/**
 * 处理图片比例配置
 */
export function getImageRatioConfig(keyword, isPfp) {
  if (isPfp) {
    return {
      square: { width: 512, height: 512 }
    }
  }
  
  // OC Maker通常使用竖屏比例，适合角色展示
  return {
    'portrait-2-3': { width: 512, height: 768 }
  }
}

/**
 * 增强prompt（OC Maker特定）
 */
export function enhancePrompt(basePrompt) {
  return `${basePrompt}, masterpiece, best quality, detailed, high resolution, original character design`
}

// 导出图片生成相关的函数
export default {
  getStyleKeyword,
  generateAIPrompt,
  getImageRatioConfig,
  enhancePrompt
}
