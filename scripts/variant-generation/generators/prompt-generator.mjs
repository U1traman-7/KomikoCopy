/**
 * AI Prompt Generator for Image Generation
 */

import { ConfigManager } from '../core/config-manager.mjs'

/**
 * Generate prompts for image generation
 */
export async function generatePrompts(keyword, pageContent, toolType, config, count = 6) {
  console.log(`🎨 生成 ${count} 个图片 prompts for ${keyword}`)
  
  try {
    // 基础 prompts 作为 fallback
    const basePrompts = generateBasePrompts(keyword, toolType, count)
    
    // 尝试使用 AI 生成更好的 prompts
    try {
      const aiPrompts = await generateAIPrompts(keyword, pageContent, toolType, config, count)
      if (aiPrompts && aiPrompts.length > 0) {
        console.log(`✅ AI 生成了 ${aiPrompts.length} 个 prompts`)
        return aiPrompts
      }
    } catch (error) {
      console.warn('⚠️ AI prompt 生成失败，使用基础 prompts:', error.message)
    }
    
    console.log(`✅ 使用基础 prompts: ${basePrompts.length} 个`)
    return basePrompts
    
  } catch (error) {
    console.error('❌ Prompt 生成失败:', error.message)
    return generateBasePrompts(keyword, toolType, count)
  }
}

/**
 * Generate base prompts as fallback
 */
function generateBasePrompts(keyword, toolType, count = 6) {
  const baseKeyword = keyword.split('|')[0].trim()
  
  const toolPrompts = {
    'video-to-video': [
      `${baseKeyword}, anime style transformation, video conversion, high quality`,
      `${baseKeyword}, cartoon style video, animated transformation, vibrant colors`,
      `${baseKeyword}, manga style video conversion, Japanese animation, detailed art`,
      `${baseKeyword}, manhwa style transformation, Korean animation, modern art style`,
      `${baseKeyword}, style transfer video, AI transformation, artistic conversion`,
      `${baseKeyword}, video to anime, animation style, professional quality`
    ],
    'oc-maker': [
      `${baseKeyword}, original character design, anime style, detailed artwork`,
      `${baseKeyword}, character creation, manga style, unique design`,
      `${baseKeyword}, OC design, cartoon style, creative character`,
      `${baseKeyword}, character maker, anime art, original design`,
      `${baseKeyword}, custom character, manga artwork, detailed illustration`,
      `${baseKeyword}, character generator, anime style, high quality art`
    ],
    'ai-anime-generator': [
      `${baseKeyword}, anime art generation, Japanese style, detailed illustration`,
      `${baseKeyword}, anime character, manga style, high quality artwork`,
      `${baseKeyword}, anime scene, Japanese animation, vibrant colors`,
      `${baseKeyword}, anime style art, manga illustration, professional quality`,
      `${baseKeyword}, anime generator, Japanese art, detailed design`,
      `${baseKeyword}, anime artwork, manga style, creative illustration`
    ],
    'ai-comic-generator': [
      `${baseKeyword}, comic book art, superhero style, dynamic illustration`,
      `${baseKeyword}, comic style artwork, graphic novel, detailed art`,
      `${baseKeyword}, comic book illustration, action scene, vibrant colors`,
      `${baseKeyword}, comic art generation, sequential art, professional quality`,
      `${baseKeyword}, comic book style, graphic art, dynamic composition`,
      `${baseKeyword}, comic illustration, graphic novel art, detailed design`
    ],
    'playground': [
      `${baseKeyword}, artistic style, creative design, high quality artwork`,
      `${baseKeyword}, digital art, creative illustration, vibrant colors`,
      `${baseKeyword}, artistic creation, unique style, detailed artwork`,
      `${baseKeyword}, creative art, digital illustration, professional quality`,
      `${baseKeyword}, art generation, creative design, artistic style`,
      `${baseKeyword}, digital artwork, creative illustration, high quality`
    ]
  }
  
  const prompts = toolPrompts[toolType] || toolPrompts['playground']
  return prompts.slice(0, count)
}

/**
 * Generate AI-powered prompts
 */
async function generateAIPrompts(keyword, pageContent, toolType, config, count = 6) {
  const promptText = `Generate ${count} detailed image prompts for "${keyword}" in ${toolType} style. 
Each prompt should be optimized for AI image generation and include relevant style keywords.

Context: ${pageContent?.seo?.description || pageContent?.tool?.description || 'AI-powered creative tool'}

Return only the prompts, one per line, without numbering or extra text.`

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/generateText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `next-auth.session-token=${config.sessionToken}`,
      },
      body: JSON.stringify({
        prompt: promptText,
        noNeedLogin: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`)
    }

    const result = await response.text()
    const prompts = result.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+\.?\s/)) // Remove numbered lines
      .slice(0, count)

    if (prompts.length === 0) {
      throw new Error('No valid prompts generated')
    }

    return prompts
  } catch (error) {
    console.warn('AI prompt generation failed:', error.message)
    return null
  }
}

/**
 * Validate generated prompts
 */
export function validatePrompts(prompts) {
  if (!Array.isArray(prompts)) {
    return false
  }
  
  return prompts.every(prompt => 
    typeof prompt === 'string' && 
    prompt.trim().length > 10 &&
    prompt.trim().length < 500
  )
}

/**
 * Clean and optimize prompts
 */
export function cleanPrompts(prompts) {
  return prompts.map(prompt => 
    prompt.trim()
      .replace(/^\d+\.?\s*/, '') // Remove numbering
      .replace(/^[-*]\s*/, '') // Remove bullet points
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  ).filter(prompt => prompt.length > 0)
}

export default {
  generatePrompts,
  validatePrompts,
  cleanPrompts
}
