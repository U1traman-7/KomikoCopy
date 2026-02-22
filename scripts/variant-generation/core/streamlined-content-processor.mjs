/**
 * Streamlined Content Processor
 *
 * Implements the new standardized workflow:
 * 1. Extract only the `seo` object from original tool JSON
 * 2. Pass complete `seo` object directly to AI
 * 3. Generate simplified variant files with {seo: {}, examples: []} structure
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 缓存已提取的 SEO 对象
const seoCache = new Map()

/**
 * Extract the complete SEO object from original tool JSON
 * No processing, filtering, or transformation - just direct extraction
 *
 * 使用缓存避免重复读取和解析文件
 */
export function extractSEOObject(toolType) {
  // 检查缓存
  if (seoCache.has(toolType)) {
    console.log(`✅ 使用缓存的 SEO object (${toolType}.json)`)
    return seoCache.get(toolType)
  }

  try {
    const translationPath = path.join(
      __dirname,
      `../../../src/i18n/locales/en/${toolType}.json`
    )

    if (!fs.existsSync(translationPath)) {
      console.warn(`⚠️ Translation file not found: ${toolType}.json`)
      return {}
    }

    const toolData = JSON.parse(fs.readFileSync(translationPath, 'utf8'))

    // Simply extract the complete seo object
    const seoObject = toolData.seo || {}

    // 存入缓存
    seoCache.set(toolType, seoObject)

    console.log(`✅ Extracted SEO object from ${toolType}.json (已缓存)`)
    console.log(`   - Keys: ${Object.keys(seoObject).length}`)
    console.log(`   - Title: ${seoObject.meta?.title || 'N/A'}`)

    return seoObject

  } catch (error) {
    console.warn(`⚠️ Error extracting SEO object from ${toolType}.json:`, error.message)
    return {}
  }
}

/**
 * 清除 SEO 缓存（用于测试或强制重新加载）
 */
export function clearSEOCache(toolType = null) {
  if (toolType) {
    seoCache.delete(toolType)
    console.log(`🗑️  已清除 ${toolType} 的 SEO 缓存`)
  } else {
    seoCache.clear()
    console.log(`🗑️  已清除所有 SEO 缓存`)
  }
}

// 缓存已提取的 examples
const examplesCache = new Map()

/**
 * Extract examples array from original tool JSON
 *
 * 使用缓存避免重复读取和解析文件
 */
export function extractExamples(toolType) {
  // 检查缓存
  if (examplesCache.has(toolType)) {
    console.log(`✅ 使用缓存的 examples (${toolType}.json)`)
    return examplesCache.get(toolType)
  }

  try {
    const translationPath = path.join(
      __dirname,
      `../../../src/i18n/locales/en/${toolType}.json`
    )

    if (!fs.existsSync(translationPath)) {
      return []
    }

    const toolData = JSON.parse(fs.readFileSync(translationPath, 'utf8'))
    const examples = toolData.examples || []

    // 存入缓存
    examplesCache.set(toolType, examples)

    console.log(`✅ Extracted ${examples.length} examples from ${toolType}.json (已缓存)`)

    return examples

  } catch (error) {
    console.warn(`⚠️ Error extracting examples from ${toolType}.json:`, error.message)
    return []
  }
}

/**
 * 清除 examples 缓存
 */
export function clearExamplesCache(toolType = null) {
  if (toolType) {
    examplesCache.delete(toolType)
    console.log(`🗑️  已清除 ${toolType} 的 examples 缓存`)
  } else {
    examplesCache.clear()
    console.log(`🗑️  已清除所有 examples 缓存`)
  }
}

/**
 * Generate streamlined AI prompt with tool configuration context
 * Input: Complete SEO object
 * Output: Same structure SEO object adapted for variant
 */
export async function generateStreamlinedAIPrompt(seoObject, variantKeyword, toolType) {
  // Load tool configuration for better context
  const { ToolLoader } = await import('./tool-loader.mjs')
  let toolConfig = null

  try {
    toolConfig = await ToolLoader.loadToolConfig(toolType)
  } catch (error) {
    console.warn(`⚠️ 无法加载工具配置 ${toolType}:`, error.message)
  }

  const keywords = variantKeyword.split('|').map(k => k.trim()).filter(k => k)
  const primaryKeyword = keywords[0]
  const additionalKeywords = keywords.slice(1)

  const toolDescription = toolConfig ? `

**TOOL CONTEXT:**
${toolConfig.name} - ${toolConfig.description}

**Key Features:**
${toolConfig.keyFeatures ? toolConfig.keyFeatures.map(feature => `- ${feature}`).join('\n') : 'Advanced AI-powered generation capabilities'}

**Target Audience:**
${toolConfig.targetAudience ? toolConfig.targetAudience.join(', ') : 'Content creators, artists, and digital creators'}

**Primary Use Cases:**
${toolConfig.useCases ? toolConfig.useCases.slice(0, 3).map(useCase => `- ${useCase}`).join('\n') : 'Creative content generation and artistic projects'}` : ''

  return `Act as an SEO expert. My website KomikoAI is an AI platform for creating comics, manhwa, manga, anime, animations, etc. I'm adding a new tool webpage to KomikoAI titled '${primaryKeyword}' to improve SEO, the new tool is a variation of the original ${toolType} tool, i.e., the same functionality but to optimize for another Google keyword.

**TARGET AUDIENCE:** Content creators, artists, comic enthusiasts, anime fans, and digital creators looking for AI-powered creative tools.${toolDescription}

**ORIGINAL SEO CONTENT (for structure reference):**
${JSON.stringify(seoObject, null, 2)}

**TASK:**
Rewrite all content for "${primaryKeyword}" while maintaining the same JSON structure and depth. Use the tool context above to ensure accurate descriptions of functionality and features.

**SEO REQUIREMENTS:**
1. **Keyword Integration**: Naturally integrate "${primaryKeyword}" throughout all content with high keyword density
2. **User Intent**: Address the search intent of users looking for "${primaryKeyword}" tools
3. **Natural Language**: Maintain human-like, readable content while maximizing SEO value
4. **KomikoAI Branding**: Reference "AI ${primaryKeyword}" directly (not "KomikoAI's AI ${primaryKeyword}")
5. **Tool Accuracy**: Use the tool context to ensure accurate descriptions of functionality

**CONTENT GUIDELINES:**
- Replace all tool-specific terms with "${primaryKeyword}" equivalents
- Maintain the same content depth and professionalism
- Ensure all sections provide genuine value for "${primaryKeyword}" users
- Focus on actionable information that matches user search intent
- Use the tool's actual features and capabilities in descriptions

**STANDARDIZED SECTION HEADINGS (MUST USE EXACTLY):**
- meta.title: "${primaryKeyword}"
- hero.title: "${primaryKeyword}"
- whatIs.title: "What is ${primaryKeyword}?"
- examples.title: "${primaryKeyword} Examples"
- howToUse.title: "How to Use The ${primaryKeyword}"
- benefits.title: "Why Use The ${primaryKeyword}"
- faq.title: "${primaryKeyword} FAQ"
- cta.title: "Transform for FREE with Our ${primaryKeyword} Today!" (or similar action phrase)

**BENEFITS FEATURES FORMAT (MUST FOLLOW EXACTLY):**
- Each feature must have: "title", "content", and "icon"
- The "title" field should NOT include emoji - put emoji ONLY in the "icon" field
- Example:
  {
    "title": "Fast and Efficient",
    "content": "Generate results in seconds...",
    "icon": "⚡"
  }
- NOT like this: {"title": "⚡ Fast and Efficient", ...}

**STRICT FAQ & CTA TEMPLATE (MUST FOLLOW EXACTLY):**
- Use "XXX" as a grammatically correct theme-related term (not just the tool name) in FAQ questions
- Use EXACT keys below for faq: title, description, q1..q9, a1..a9
- Use EXACT keys below for cta: title, description, buttonText
- Keep wording patterns and word-count ranges as noted

JSON TEMPLATE (copy this structure exactly into the output JSON):
"faq": {
  "title": "Frequently Asked Questions",
  "description": "[15-20 words FAQ section intro]",
  "q1": "What is [Tool Name]?",
  "a1": "[Tool Name] is an AI tool that [comprehensive explanation 45-55 words]",
  "q2": "How to [use Tool Name/create videos with Tool Name]?",
  "a2": "Using [Tool Name] is simple! First [step], then [step], and [step]. [Additional details 50-60 words total]",
  "q3": "How does [Tool Name] work?",
  "a3": "[Tool Name] uses [technology] technology to [process]. It works by [technical explanation 45-55 words total]",
  "q4": "What is the best [tool category: e.g., image to video generator]?",
  "a4": "KomikoAI provides the best [tool category] tool. Our goal is to be the leading AI creation platform by delivering professional-quality results, powerful and fun customization, and an intuitive workflow—completely free to try. With KomikoAI's [Tool Name], you can [list benefits], making it perfect for users who [target audience description]",
  "q5": "Is the KomikoAI [Tool Name] free online?",
  "a5": "Yes, you can test out the [Tool Name] on KomikoAI for free, without having to sign up to any subscription. Try our [tool] today!",
  "q6": "What can I do with [Tool Name]?",
  "a6": "You can use [Tool Name] on KomikoAI to create [list specific possibilities 45-55 words]",
  "q7": "Can I use [Tool Name] on my phone?",
  "a7": "Yes, you can use [Tool Name] as a web app on different devices, including smartphones and computers, making it convenient for everyone.",
  "q8": "Can I download my generation from [Tool Name]?",
  "a8": "Yes, KomikoAI's [Tool Name] allows you to export your generation in various formats, such as [list formats], for easy sharing.",
  "q9": "Why should I use [Tool Name]?",
  "a9": "Using [Tool Name] can [list benefits]. Our [tool] allows you to [list capabilities 45-55 words total]"
},
"cta": {
  "title": "[Action phrase] for FREE with Our [Tool Name] Today!",
  "description": "[Motivational call-to-action message 12-16 words]",
  "buttonText": "Try Our [Tool Name] Free"
}

**OUTPUT:**
Return the complete JSON object with all content rewritten for "${primaryKeyword}"${additionalKeywords.length > 0 ? ` and related keywords (${additionalKeywords.join(', ')})` : ''}.
**IMPORTANT**: Ensure that all double quotes inside JSON string values are properly escaped with a backslash (e.g., "key": "value with \\"quotes\\""). This is critical for the JSON to be valid.`
}

/**
 * Generate AI reflection prompt to check content quality
 */
export function generateReflectionPrompt(generatedContent, variantKeyword, toolType) {
  const keywords = variantKeyword.split('|').map(k => k.trim()).filter(k => k)
  const primaryKeyword = keywords[0]
  const additionalKeywords = keywords.slice(1)

  return `You are a quality assurance expert reviewing AI-generated SEO content for KomikoAI. Review the following content for a "${primaryKeyword}" tool page and provide improvements.

**GENERATED CONTENT TO REVIEW:**
${JSON.stringify(generatedContent, null, 2)}

**QUALITY STANDARDS:**
1. **SEO Title**: Should be exactly "${primaryKeyword} | AI-Powered Tool" - no additional text
2. **Meta Description**: Must be 150-160 characters, clearly summarize the page, highlight key benefits, include strong call-to-action, and align with user search intent for "${primaryKeyword}"
3. **Keyword Integration**: "${primaryKeyword}" should appear naturally throughout all content with high density${additionalKeywords.length > 0 ? `. Also integrate: ${additionalKeywords.join(', ')}` : ''}
4. **KomikoAI Branding**: Use "AI ${primaryKeyword}" directly (not "KomikoAI's AI ${primaryKeyword}")
5. **Content Quality**: All sections should provide specific value for "${primaryKeyword}" users, avoid generic content
6. **Natural Language**: Content should flow naturally while maintaining SEO optimization
7. **Completeness**: All sections (meta, whatIs, howToUse, benefits, faq, cta) should be complete and valuable
8. **FAQ Template**: faq must include title, description, q1..q9 and a1..a9 exactly; keep placeholders like [Tool Name], [step], etc., and respect word ranges (desc 15-20; a1 45-55; a2 50-60; a3 45-55; a6 45-55)
9. **CTA Template**: cta must include title, description (12-16 words), and buttonText; preserve placeholders and exact phrasing

**REVIEW INSTRUCTIONS:**
1. First, identify specific issues in the current content
2. Then provide the corrected JSON with improvements
3. Focus on making content more specific to "${primaryKeyword}" and removing generic language

**OUTPUT FORMAT:**
First provide your analysis, then output the improved JSON:

ISSUES FOUND:
- Issue 1: [describe specific problem]
- Issue 2: [describe specific problem]

IMPROVED CONTENT:
\`\`\`json
{corrected json here}
\`\`\`

Begin your review:`
}

/**
 * Parse AI response to extract SEO JSON
 */
export function parseAIResponse(aiResponse) {
  try {
    console.log('🔍 解析 AI 响应...');
    console.log('📝 响应长度:', aiResponse.length, '字符');

    let contentToParse = aiResponse.trim();

    // 1. 如果响应以引号开头和结尾，去掉它们
    if (contentToParse.startsWith('"') && contentToParse.endsWith('"')) {
      contentToParse = contentToParse.substring(1, contentToParse.length - 1);
      // 在去掉外层引号后，需要处理内部的转义字符
      contentToParse = contentToParse.replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }

    // 2. 提取 ```json ... ``` 代码块中的内容
    const jsonMatch = contentToParse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      contentToParse = jsonMatch[1];
    } else {
      // 如果没有找到 markdown 代码块，尝试直接匹配 JSON 对象
      const plainJsonMatch = contentToParse.match(/\{[\s\S]*\}/);
      if (plainJsonMatch) {
        contentToParse = plainJsonMatch[0];
      } else {
        throw new Error('未找到有效的 JSON 内容');
      }
    }

    // 在解析前进行一次容错清理：移除对象/数组尾随逗号，移除零宽字符
    contentToParse = contentToParse
      .replace(/,\s*([}\]])/g, '$1') // 去掉尾随逗号
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 去掉零宽字符/BOM
      .trim();

    // 某些模型会错误输出中文全角逗号作为分隔，尽量修正常见场景
    // 仅修正在属性或数组元素结束位置的全角逗号
    contentToParse = contentToParse
      .replace(/"\s*，\s*"/g, '", "')
      .replace(/\s*，\s*(?=[}\]])/g, '');

    const jsonContent = JSON.parse(contentToParse);
    console.log('✅ JSON 解析成功');

    // Validate the output structure
    validateSEOStructure(jsonContent);
    console.log('✅ 结构验证通过');

    return jsonContent;

  } catch (error) {
    console.error('❌ AI 响应解析失败:', error.message);

    // 保存debug信息 - 简单直接
    const debugInfo = {
      originalResponse: aiResponse,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    };

    try {
      const debugPath = `debug-json-error-${Date.now()}.json`;
      fs.writeFileSync(debugPath, JSON.stringify(debugInfo, null, 2));
      console.error(`🐛 Debug信息已保存: ${debugPath}`);
    } catch (debugError) {
      console.error('无法保存debug信息:', debugError.message);
    }

    // 提供更详细的错误信息
    if (error instanceof SyntaxError) {
      console.error('JSON 语法错误，可能的原因:');
      console.error('- AI 返回了不完整的 JSON');
      console.error('- JSON 中包含特殊字符或格式错误');
      console.error('- 响应被截断或包含额外内容');
    }

    throw new Error('Invalid AI response format');
  }
}

/**
 * Validate SEO content structure
 */
function validateSEOStructure(seoContent) {
  const requiredSections = ['meta', 'hero', 'whatIs', 'howToUse', 'benefits', 'faq']
  const missingSections = []

  for (const section of requiredSections) {
    if (!seoContent[section]) {
      missingSections.push(section)
    }
  }

  if (missingSections.length > 0) {
    console.warn(`⚠️ Missing SEO sections: ${missingSections.join(', ')}`)
  }

  // Validate meta section
  if (seoContent.meta) {
    if (!seoContent.meta.title) {
      console.warn('⚠️ Missing meta.title')
    }
    if (!seoContent.meta.description) {
      console.warn('⚠️ Missing meta.description')
    }
    if (!seoContent.meta.keywords) {
      console.warn('⚠️ Missing meta.keywords')
    }
  }

  // Validate benefits features array
  if (seoContent.benefits && seoContent.benefits.features) {
    if (!Array.isArray(seoContent.benefits.features)) {
      console.warn('⚠️ benefits.features should be an array')
    }
  }

  // Validate howToUse steps array
  if (seoContent.howToUse && seoContent.howToUse.steps) {
    if (!Array.isArray(seoContent.howToUse.steps)) {
      console.warn('⚠️ howToUse.steps should be an array')
    }
  }

  // Validate FAQ exact template structure and lengths
  if (seoContent.faq) {
    const faq = seoContent.faq
    const requiredFaqKeys = ['title', 'description']
    for (let i = 1; i <= 9; i++) {
      requiredFaqKeys.push(`q${i}`)
      requiredFaqKeys.push(`a${i}`)
    }
    const missingFaq = requiredFaqKeys.filter(k => !(k in faq))
    if (missingFaq.length > 0) {
      console.warn(`⚠️ Missing FAQ keys: ${missingFaq.join(', ')}`)
    }
  }

  // Validate CTA presence and fields
  if (seoContent.cta) {
    const cta = seoContent.cta
    const requiredCta = ['title', 'description', 'buttonText']
    const missingCta = requiredCta.filter(k => !(k in cta))
    if (missingCta.length > 0) {
      console.warn(`⚠️ Missing CTA keys: ${missingCta.join(', ')}`)
    }
  } else {
    console.warn('⚠️ Missing cta section')
  }

  console.log('✅ SEO structure validation completed')
}

/**
 * Parse AI reflection response to extract improved JSON
 */
export function parseReflectionResponse(reflectionResponse) {
  try {
    // Find improved JSON in the reflection response
    const improvedJsonMatch = reflectionResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/)
    if (improvedJsonMatch) {
      const improvedContent = JSON.parse(improvedJsonMatch[1])
      console.log('✅ AI reflection completed, content improved')
      return improvedContent
    } else {
      console.warn('⚠️ No improved JSON found in reflection response')
      return null
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse reflection response:', error.message)
    return null
  }
}

/**
 * Extract default style from keyword
 */
function extractDefaultStyle(keyword, toolType) {
  const lowerKeyword = keyword.toLowerCase()

  // AI Video Effects style mappings
  const videoEffectsStyleMap = {
    'bankai': 'bankai',
    'super saiyan': 'super-saiyan',
    'saiyan': 'super-saiyan',
    'rasengan': 'rasengan',
    'sharingan': 'sharingan',
    'gear 5': 'gear-5',
    'gear5': 'gear-5',
    'jujutsu': 'jujutsu-kaisen',
    'domain expansion': 'domain-expansion',
    'thunder breathing': 'thunder-breathing',
    'titan': 'titan-transformation',
    'nen': 'nen-activation',
    'quirk': 'quirk-awakening',
    'chakra': 'chakra-mode',
    'hollow': 'hollow-transformation',
    'stand': 'stand-power',
    'kamehameha': 'kamehameha',
    'ghibli': 'ghibli',
    'cyberpunk': 'cyberpunk',
    'cartoon': 'cartoon',
    'anime dance': 'anime-dance',
  }

  // Common style mappings for playground
  const playgroundStyleMap = {
    'anime': 'anime',
    'cartoon': 'cartoon',
    'ghibli': 'ghibli-anime',
    'studio ghibli': 'ghibli-anime',
    'manga': 'manga',
    'sketch': 'sketch',
    'claymation': 'claymation',
    'clay': 'claymation',
    'pixel': 'pixel-art',
    'minecraft': 'pixel-art',
    'naruto': 'naruto',
    'simpsons': 'the-simpsons',
    'cosplay': 'cosplay',
    'sprite': 'sprite-sheet',
    'aging': 'elderly',
    'elderly': 'elderly',
    'old': 'elderly',
    'baby': 'baby',
    'young': 'baby',
    'fat': 'fat',
    'chubby': 'fat',
    'skinny': 'skinny',
    'thin': 'skinny',
    'blonde': 'blonde',
    'bald': 'bald',
    'beard': 'beard',
    'lego': 'lego',
    'disney': 'disney',
    'pixar': 'pixar',
    'funko': 'funko-pop',
    'pop art': 'pop-art',
    'silhouette': 'silhouette',
    'polaroid': 'polaroid',
    'caricature': 'caricature',
    'mugshot': 'mugshot',
    'bikini': 'bikini',
    'pregnant': 'pregnant',
    'pregnancy': 'pregnant',
    'bangs': 'bangs',
    'blue eye': 'blue-eye',
    'memoji': 'memoji',
    'emoji': 'apple-emoji',
    'isometric': 'isometric',
    'turnaround': 'character-turnaround',
    'expression sheet': 'expression-sheet',
    'pose sheet': 'pose-sheet',
    'costume': 'costume-design',
    'id photo': 'id-photo',
    'doll': 'doll',
    'toy': 'toy',
    'gacha': 'gacha',
    'snow globe': 'snow-globe',
    'avatar': 'anime-avatar',
    'tarot': 'tarot-card',
    'comic': 'comic-book',
    'line art': 'line-art',
    'album cover': 'album-cover',
    'magazine': 'magazine',
    'south park': 'south-park',
    'ps2': 'ps2',
  }

  // Select the right style map based on tool type
  const styleMap = toolType === 'ai-video-effects' ? videoEffectsStyleMap : playgroundStyleMap

  // Find matching style
  for (const [key, value] of Object.entries(styleMap)) {
    if (lowerKeyword.includes(key)) {
      return value
    }
  }

  // Default fallback based on tool type
  switch (toolType) {
    case 'playground':
      return 'anime'
    case 'ai-video-effects':
      return 'ghibli' // default for video effects
    case 'video-to-video':
      return 'anime'
    default:
      return null
  }
}

/**
 * Create variant file structure
 * Format: {seo: {}, examples: [], config: {}, pageStructure: []}
 */
export async function createVariantFileContent(seoContent, examples = [], toolType, variantKeyword, pageStructure = null, providedDefaultStyle = null) {
  const config = generateVariantConfig(toolType, variantKeyword)
  const keywords = variantKeyword.split('|').map(k => k.trim()).filter(k => k)
  const primaryKeyword = keywords[0]

  // Generate page structure if not provided
  if (!pageStructure) {
    const { PageStructureRandomizer } = await import('./page-structure-randomizer.mjs')
    pageStructure = PageStructureRandomizer.generateRandomPageStructure()
    console.log(`📋 Generated random page structure:`, pageStructure.join(' → '))
  }

  // Generate placeholder text
  const placeholderText = `Transform your photo into ${primaryKeyword} style`

  // Determine default style - use provided style first, then extract from keyword
  let defaultStyle = providedDefaultStyle
  if (!defaultStyle) {
    defaultStyle = extractDefaultStyle(primaryKeyword, toolType)
  }

  // Convert style name to kebab-case for consistency
  if (defaultStyle) {
    defaultStyle = defaultStyle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  return {
    seo: seoContent,
    config: config,
    placeholderText: placeholderText,
    originalKeyword: primaryKeyword,
    ...(defaultStyle && { defaultStyle: defaultStyle }),
    examples: examples,
    pageStructure: pageStructure
  }
}


/**
 * Generate variant config object
 */
function generateVariantConfig(toolType, variantKeyword) {
  const keywords = variantKeyword.split('|').map(k => k.trim()).filter(k => k)
  const primaryKeyword = keywords[0]

  return {
    name: primaryKeyword,
    description: `AI-powered ${primaryKeyword.toLowerCase()} generator`,
    category: getToolCategory(toolType),
    keywords: keywords,
    toolType: toolType,
    features: [
      'AI-powered generation',
      'High-quality output',
      'Easy to use',
      'Fast processing'
    ],
    pricing: {
      free: true,
      premium: false
    },
    limits: {
      daily: 10,
      monthly: 100
    }
  }
}

/**
 * Get tool category based on tool type
 */
function getToolCategory(toolType) {
  const categories = {
    'video-to-video': 'Video Generation',
    'oc-maker': 'Character Creation',
    'ai-anime-generator': 'Anime Generation',
    'ai-comic-generator': 'Comic Creation',
    'playground': 'Style Transfer'
  }
  return categories[toolType] || 'AI Generation'
}

/**
 * Generate variant file name based on keyword
 */
export function generateVariantFileName(toolType, variantKeyword) {
  // Convert variant keyword to slug format
  const slug = variantKeyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${toolType}-${slug}.json`
}

export const StreamlinedContentProcessor = {
  extractSEOObject,
  extractExamples,
  clearSEOCache,
  clearExamplesCache,
  generateStreamlinedAIPrompt,
  generateReflectionPrompt,
  parseAIResponse,
  parseReflectionResponse,
  createVariantFileContent,
  generateVariantFileName
}
