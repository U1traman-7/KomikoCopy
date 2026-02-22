/**
 * Playground (AI Style Transfer) 提示词配置
 */

export const PLAYGROUND_PROMPTS = {
  // 基础风格转换模板
  baseTemplates: [
    "Style: {style_name}",
    "Transform to {style_name} style",
    "Convert to {style_name}",
    "Apply {style_name} filter",
    "{style_name} transformation",
    "Artistic style: {style_name}"
  ],

  // 支持的风格类型
  supportedStyles: {
    anime: [
      "Anime Style", "Manga Style", "Chibi Style", "Kawaii Style",
      "Shoujo Style", "Shounen Style", "Seinen Style", "Josei Style"
    ],
    artistic: [
      "Watercolor", "Oil Painting", "Sketch Style", "Digital Art",
      "Impressionist", "Abstract Art", "Pop Art", "Minimalist"
    ],
    character: [
      "Cosplay", "Plushie", "Chibi", "Sprite Sheet",
      "Pixel Art", "Cartoon Style", "Caricature", "Mascot Style"
    ],
    effects: [
      "Vintage Filter", "Sepia Tone", "Black and White", "Neon Glow",
      "Retro Style", "Cyberpunk", "Steampunk", "Fantasy Art"
    ]
  },

  // 输入类型描述
  inputTypes: [
    "photo", "portrait", "character art", "illustration", "3D render",
    "sketch", "digital art", "screenshot", "drawing", "painting"
  ],

  // 转换特性
  transformationFeatures: {
    styleTransfer: [
      "artistic style transfer", "neural style transfer", "AI-powered transformation",
      "creative filter application", "artistic enhancement", "visual style conversion"
    ],
    qualityEnhancement: [
      "high-quality output", "detailed transformation", "professional results",
      "enhanced visual appeal", "artistic refinement", "creative enhancement"
    ],
    preservation: [
      "maintain composition", "preserve subject", "keep facial features",
      "retain structure", "preserve details", "maintain proportions"
    ]
  },

  // 特定风格的详细配置
  styleConfigs: {
    cosplay: {
      description: "Transform photos into cosplay-style artwork",
      features: ["costume enhancement", "character styling", "dramatic effects"],
      bestFor: ["character photos", "portrait shots", "costume photos"]
    },
    plushie: {
      description: "Convert images into cute plushie toy style",
      features: ["soft textures", "rounded features", "toy-like appearance"],
      bestFor: ["character art", "portraits", "cute subjects"]
    },
    chibi: {
      description: "Transform into adorable chibi character style",
      features: ["enlarged head", "simplified features", "cute proportions"],
      bestFor: ["character designs", "portraits", "anime characters"]
    },
    pixelArt: {
      description: "Convert to retro pixel art style",
      features: ["pixelated effect", "limited colors", "retro gaming aesthetic"],
      bestFor: ["characters", "scenes", "portraits"]
    },
    spriteSheet: {
      description: "Generate game sprite sheet style",
      features: ["multiple poses", "game-ready format", "consistent style"],
      bestFor: ["character designs", "game development", "animation frames"]
    }
  },

  // 处理步骤描述
  processingSteps: [
    "Upload your source image (photo, artwork, or illustration)",
    "Select your desired artistic style from available options",
    "AI analyzes composition and applies style transformation",
    "Download your transformed artwork in high resolution"
  ],

  // 质量和效果标签
  qualityTags: [
    "high quality transformation", "professional results", "detailed conversion",
    "artistic enhancement", "creative filter", "style preservation",
    "enhanced visual appeal", "AI-powered transformation"
  ],

  // 生成风格特定的提示词
  generateStylePrompt: function(styleName, inputType = "photo") {
    const template = this.baseTemplates[Math.floor(Math.random() * this.baseTemplates.length)]
    return template.replace('{style_name}', styleName)
  },

  // 获取风格配置
  getStyleConfig: function(styleName) {
    const normalizedName = styleName.toLowerCase().replace(/\s+/g, '').replace('-', '')
    return this.styleConfigs[normalizedName] || {
      description: `Transform to ${styleName} style`,
      features: ["artistic transformation", "style conversion", "visual enhancement"],
      bestFor: ["photos", "artwork", "illustrations"]
    }
  },

  // 验证风格是否支持
  isSupportedStyle: function(styleName) {
    const allStyles = [
      ...this.supportedStyles.anime,
      ...this.supportedStyles.artistic,
      ...this.supportedStyles.character,
      ...this.supportedStyles.effects
    ]
    return allStyles.some(style =>
      style.toLowerCase().includes(styleName.toLowerCase()) ||
      styleName.toLowerCase().includes(style.toLowerCase())
    )
  },

  /**
   * 生成AI prompt用于动态生成图片prompts
   */
  generateAIPrompt: function(theme, count, variantKey) {
    return `You are an expert AI style transfer prompt generator specializing in Danbooru tag-based prompts for photo-to-art transformations.

THEME: "${theme}"
TOOL TYPE: AI Style Transfer Playground

**STYLE TRANSFER PROMPT STRUCTURE:**
1. **Source Description:** Describe the input type (photo, portrait, landscape, etc.)
2. **Target Style:** Specify the desired artistic style transformation
3. **Visual Effects:** Include style-specific visual elements and techniques
4. **Quality Enhancement:** Professional transformation quality indicators

**STYLE CATEGORIES:**
- **Anime Style:** Convert photos to anime/manga art style
- **Artistic Styles:** Oil painting, watercolor, digital art, sketch
- **Character Styles:** Portrait enhancement, character design
- **Special Effects:** Artistic filters, creative transformations

**INSTRUCTIONS:**
1. Analyze the theme "${theme}" and generate ${count} unique style transfer prompts
2. Each prompt must be a single line of comma-separated tags
3. Focus on transformation effects and artistic enhancement
4. Include appropriate style indicators and quality tags
5. Every prompt must include quality tags like \`high quality transformation, professional results, detailed conversion\`

**FORMATTING REQUIREMENTS:**
- Output ONLY the comma-separated tag prompts
- Each prompt on a new line, no numbering
- Use precise Danbooru tags with spaces for multi-word tags

Now, generate ${count} style transfer prompts for the theme "${theme}".`
  }
}

export default PLAYGROUND_PROMPTS
