/**
 * 工具模板生成器 - 创建可复用的工具描述模板
 */

/**
 * 工具模板生成器类
 */
export class ToolTemplateGenerator {
  constructor() {
    this.templates = this.initializeTemplates()
  }

  /**
   * 初始化模板库
   */
  initializeTemplates() {
    return {
      // 基础模板
      basic: {
        placeholderTemplate: "Create amazing {keyword} with AI",
        buttonTemplate: "Generate {keyword}",
        titleTemplate: "{keyword} Generator - Free AI Tool",
        descriptionTemplate: "Create unique {keyword} instantly with our AI-powered generator. Free, fast, and easy to use.",
        functionalDescription: "AI-powered {keyword} generator that creates unique, high-quality results"
      },

      // 角色创建模板
      character: {
        placeholderTemplate: "Design your perfect {keyword} character",
        buttonTemplate: "Create {keyword}",
        titleTemplate: "{keyword} Character Creator - AI Generator",
        descriptionTemplate: "Design unique {keyword} characters with our advanced AI character creator. Customize appearance, personality, and more.",
        functionalDescription: "Advanced AI character creator for {keyword} with customizable features and instant generation"
      },

      // 艺术生成模板
      art: {
        placeholderTemplate: "Generate stunning {keyword} artwork",
        buttonTemplate: "Create {keyword} Art",
        titleTemplate: "{keyword} Art Generator - AI Artist Tool",
        descriptionTemplate: "Transform your ideas into beautiful {keyword} artwork using cutting-edge AI technology.",
        functionalDescription: "Professional AI art generator specializing in {keyword} with multiple artistic styles"
      },

      // 游戏资产模板
      game: {
        placeholderTemplate: "Create {keyword} game assets",
        buttonTemplate: "Generate {keyword} Assets",
        titleTemplate: "{keyword} Game Asset Generator - AI Tool",
        descriptionTemplate: "Generate high-quality {keyword} game assets instantly with our AI-powered creation tool.",
        functionalDescription: "Game-ready {keyword} asset generator with multiple formats and styles"
      },

      // 头像模板
      avatar: {
        placeholderTemplate: "Create your {keyword} avatar",
        buttonTemplate: "Generate {keyword} Avatar",
        titleTemplate: "{keyword} Avatar Maker - Free AI Generator",
        descriptionTemplate: "Create personalized {keyword} avatars with our AI avatar generator. Perfect for profiles and social media.",
        functionalDescription: "Personalized {keyword} avatar creator with social media optimization"
      },

      // 风格转换模板
      style: {
        placeholderTemplate: "Transform images to {keyword} style",
        buttonTemplate: "Apply {keyword} Style",
        titleTemplate: "{keyword} Style Transfer - AI Image Converter",
        descriptionTemplate: "Convert any image to {keyword} style using advanced AI style transfer technology.",
        functionalDescription: "AI-powered style transfer tool for {keyword} with high-quality results"
      }
    }
  }

  /**
   * 根据关键词自动选择最佳模板
   */
  selectBestTemplate(keyword, toolType = 'ai-anime-generator') {
    const lowerKeyword = keyword.toLowerCase()
    
    // 基于关键词内容选择模板
    if (lowerKeyword.includes('character') || lowerKeyword.includes('oc') || 
        lowerKeyword.includes('persona') || toolType === 'oc-maker') {
      return 'character'
    }
    
    if (lowerKeyword.includes('avatar') || lowerKeyword.includes('pfp') || 
        lowerKeyword.includes('profile')) {
      return 'avatar'
    }
    
    if (lowerKeyword.includes('art') || lowerKeyword.includes('artwork') || 
        lowerKeyword.includes('painting') || lowerKeyword.includes('drawing')) {
      return 'art'
    }
    
    if (lowerKeyword.includes('game') || lowerKeyword.includes('asset') || 
        lowerKeyword.includes('sprite')) {
      return 'game'
    }
    
    if (lowerKeyword.includes('style') || lowerKeyword.includes('filter') || 
        lowerKeyword.includes('transfer') || toolType === 'playground') {
      return 'style'
    }
    
    // 默认使用基础模板
    return 'basic'
  }

  /**
   * 生成工具描述
   */
  generateToolDescription(keyword, templateType = null, customOptions = {}) {
    const selectedTemplate = templateType || this.selectBestTemplate(keyword)
    const template = this.templates[selectedTemplate] || this.templates.basic
    
    // 解析关键词
    const parsedKeyword = this.parseKeyword(keyword)
    
    // 应用模板
    const result = {
      templateType: selectedTemplate,
      keyword: parsedKeyword.primary,
      placeholderText: this.applyTemplate(template.placeholderTemplate, parsedKeyword),
      buttonText: this.applyTemplate(template.buttonTemplate, parsedKeyword),
      title: this.applyTemplate(template.titleTemplate, parsedKeyword),
      description: this.applyTemplate(template.descriptionTemplate, parsedKeyword),
      functionalDescription: this.applyTemplate(template.functionalDescription, parsedKeyword),
      ...customOptions
    }
    
    return result
  }

  /**
   * 解析关键词
   */
  parseKeyword(keyword) {
    // 处理管道分隔的关键词
    if (keyword.includes('|')) {
      const parts = keyword.split('|').map(k => k.trim())
      return {
        primary: parts[0],
        secondary: parts.slice(1),
        all: parts,
        hasMultiple: true
      }
    }
    
    // 单个关键词
    return {
      primary: keyword.trim(),
      secondary: [],
      all: [keyword.trim()],
      hasMultiple: false
    }
  }

  /**
   * 应用模板替换
   */
  applyTemplate(template, parsedKeyword) {
    let result = template.replace(/\{keyword\}/g, parsedKeyword.primary)
    
    // 如果有多个关键词，可以进行更复杂的替换
    if (parsedKeyword.hasMultiple && parsedKeyword.secondary.length > 0) {
      // 可以在这里添加更复杂的模板逻辑
      result = result.replace(/\{secondary\}/g, parsedKeyword.secondary[0] || '')
    }
    
    return result
  }

  /**
   * 生成批量工具描述
   */
  generateBatchDescriptions(keywords, templateType = null) {
    return keywords.map(keyword => {
      return {
        keyword,
        ...this.generateToolDescription(keyword, templateType)
      }
    })
  }

  /**
   * 创建自定义模板
   */
  createCustomTemplate(name, templateConfig) {
    this.templates[name] = {
      placeholderTemplate: templateConfig.placeholderTemplate || "Create {keyword} with AI",
      buttonTemplate: templateConfig.buttonTemplate || "Generate {keyword}",
      titleTemplate: templateConfig.titleTemplate || "{keyword} Generator",
      descriptionTemplate: templateConfig.descriptionTemplate || "Create {keyword} with AI technology",
      functionalDescription: templateConfig.functionalDescription || "AI-powered {keyword} generator",
      ...templateConfig
    }
    
    return this.templates[name]
  }

  /**
   * 获取所有可用模板
   */
  getAvailableTemplates() {
    return Object.keys(this.templates)
  }

  /**
   * 获取模板详情
   */
  getTemplate(templateName) {
    return this.templates[templateName] || null
  }

  /**
   * 生成SEO友好的变体
   */
  generateSEOVariants(keyword, count = 5) {
    const parsedKeyword = this.parseKeyword(keyword)
    const templateType = this.selectBestTemplate(keyword)
    
    const variants = []
    const baseTemplate = this.templates[templateType]
    
    // 生成不同的标题变体
    const titleVariants = [
      `Free ${parsedKeyword.primary} Generator - AI Tool`,
      `${parsedKeyword.primary} Creator - Online AI Generator`,
      `AI ${parsedKeyword.primary} Maker - Free Tool`,
      `Generate ${parsedKeyword.primary} Online - AI Creator`,
      `${parsedKeyword.primary} AI Generator - Free Online Tool`
    ]
    
    // 生成不同的描述变体
    const descriptionVariants = [
      `Create unique ${parsedKeyword.primary} instantly with our AI-powered generator.`,
      `Generate amazing ${parsedKeyword.primary} using advanced AI technology.`,
      `Design custom ${parsedKeyword.primary} with our intelligent AI creator.`,
      `Make professional ${parsedKeyword.primary} with our free AI generator.`,
      `Transform your ideas into ${parsedKeyword.primary} with AI magic.`
    ]
    
    for (let i = 0; i < Math.min(count, titleVariants.length); i++) {
      variants.push({
        title: titleVariants[i],
        description: descriptionVariants[i],
        placeholderText: this.applyTemplate(baseTemplate.placeholderTemplate, parsedKeyword),
        buttonText: this.applyTemplate(baseTemplate.buttonTemplate, parsedKeyword),
        functionalDescription: this.applyTemplate(baseTemplate.functionalDescription, parsedKeyword)
      })
    }
    
    return variants
  }

  /**
   * 验证模板质量
   */
  validateTemplate(templateConfig) {
    const required = ['placeholderTemplate', 'buttonTemplate', 'titleTemplate', 'descriptionTemplate']
    const missing = required.filter(field => !templateConfig[field])
    
    if (missing.length > 0) {
      throw new Error(`模板缺少必需字段: ${missing.join(', ')}`)
    }
    
    // 检查是否包含关键词占位符
    const hasKeywordPlaceholder = required.every(field => 
      templateConfig[field].includes('{keyword}')
    )
    
    if (!hasKeywordPlaceholder) {
      console.warn('⚠️ 模板可能缺少 {keyword} 占位符')
    }
    
    return true
  }
}

export default ToolTemplateGenerator
