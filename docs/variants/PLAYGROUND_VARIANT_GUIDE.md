# Playground Variant 页面创建指南

本指南说明如何创建新的 playground variant 页面，使用与 video-to-video 相同的结构模式。

## 快速开始

### 1. 创建 Variant 数据文件

在 `src/data/variants/playground/` 目录下创建新的 JSON 文件，例如 `my-new-style.json`：

```json
{
  "seo": {
    "meta": {
      "title": "My New Style Generator - KomikoAI",
      "description": "Transform your images into amazing new style with AI technology.",
      "keywords": "new style, AI generator, image transformation"
    },
    "hero": {
      "title": "My New Style Generator"
    },
    "whatIs": {
      "title": "What is My New Style Generator?",
      "description": "Detailed description of what this style generator does and how it works."
    },
    "examples": {
      "title": "My New Style Examples",
      "description": "See how our AI transforms images into this amazing style."
    },
    "howToUse": {
      "title": "How to Use My New Style Generator",
      "steps": [
        {
          "title": "Upload Your Image",
          "content": "Upload any image (JPG, PNG, WEBP) to get started."
        },
        {
          "title": "Select Style Options",
          "content": "Choose from various style options and customizations."
        },
        {
          "title": "Generate",
          "content": "Click generate and watch the AI transform your image."
        },
        {
          "title": "Download & Share",
          "content": "Download your transformed image and share it with friends."
        }
      ]
    },
    "benefits": {
      "title": "Why Use My New Style Generator?",
      "description": "Our generator offers the best quality and fastest processing.",
      "features": [
        {
          "title": "🎨 High Quality Output",
          "content": "Generate stunning high-resolution images with authentic style.",
          "icon": "🎨"
        },
        {
          "title": "⚡ Fast Processing",
          "content": "Get your results in seconds with our optimized AI models.",
          "icon": "⚡"
        },
        {
          "title": "🎯 Accurate Style Transfer",
          "content": "Preserve your original composition while applying the new style.",
          "icon": "🎯"
        }
      ]
    },
    "faq": {
      "title": "My New Style Generator FAQ",
      "description": "Common questions about our style generator.",
      "q1": "What image formats are supported?",
      "a1": "We support JPG, PNG, and WEBP formats with high-resolution outputs.",
      "q2": "How long does it take to generate?",
      "a2": "Most images are processed in 10-30 seconds depending on size.",
      "q3": "Can I use this for commercial projects?",
      "a3": "Yes, all generated images can be used for commercial purposes."
    },
    "cta": {
      "title": "Start Creating with My New Style Today!",
      "description": "Transform your images with our advanced AI technology.",
      "buttonText": "Try It Free"
    }
  },
  "examples": [
    {
      "id": 1,
      "layout": "comparison",
      "type": "image",
      "input": "/images/examples/playground/input-1.webp",
      "output": "/images/examples/playground/my-new-style-1.webp",
      "inputLabel": "Original",
      "outputLabel": "Transformed",
      "description": "Example transformation"
    }
  ],
  "config": {
    "defaultStyle": "MY_NEW_STYLE"
  }
}
```

### 2. 添加样式映射（如果需要）

如果你的 variant 需要预选特定的样式，在 `src/pages/playground/[variant].tsx` 中添加映射：

```typescript
const styleMapping: Record<string, AnimeStyle> = {
  // ... 现有映射
  'my-new-style': AnimeStyle.MY_NEW_STYLE, // 添加你的映射
};
```

### 3. 添加样式常量（如果是新样式）

如果是全新的样式，需要在 `api/tools/_constants.ts` 中添加：

```typescript
export enum AnimeStyle {
  // ... 现有样式
  MY_NEW_STYLE = 'myNewStyle',
}
```

### 4. 添加翻译文件

在 `src/i18n/locales/en/playground.json` 的 `ui.styles` 和 `ui.styleDescriptions` 中添加：

```json
{
  "ui": {
    "styles": {
      "myNewStyle": "My New Style"
    },
    "styleDescriptions": {
      "myNewStyle": "Description of the new style and what it does."
    }
  }
}
```

### 5. 测试页面

访问 `http://localhost:3000/playground/my-new-style` 查看你的新 variant 页面。

## 数据结构详解

### SEO 部分

#### meta（必需）
页面的基本 SEO 信息：
```json
{
  "title": "页面标题 - 显示在浏览器标签和搜索结果中",
  "description": "页面描述 - 显示在搜索结果中",
  "keywords": "关键词1, 关键词2, 关键词3"
}
```

#### hero（必需）
页面顶部的标题：
```json
{
  "title": "主标题"
}
```

#### whatIs（可选）
"这是什么"部分：
```json
{
  "title": "标题",
  "description": "详细描述"
}
```

#### examples（可选）
示例部分的标题：
```json
{
  "title": "示例标题",
  "description": "示例描述"
}
```

#### howToUse（必需）
使用步骤：
```json
{
  "title": "如何使用标题",
  "steps": [
    {
      "title": "步骤标题",
      "content": "步骤内容"
    }
  ]
}
```

#### benefits（必需）
优势特性：
```json
{
  "title": "优势标题",
  "description": "优势描述",
  "features": [
    {
      "title": "特性标题（可包含 emoji）",
      "content": "特性描述",
      "icon": "🎨"
    }
  ]
}
```

#### faq（必需）
常见问题：
```json
{
  "title": "FAQ 标题",
  "description": "FAQ 描述",
  "q1": "问题1",
  "a1": "答案1",
  "q2": "问题2",
  "a2": "答案2"
  // 可以添加更多 q3/a3, q4/a4 等
}
```

#### cta（可选）
行动号召：
```json
{
  "title": "CTA 标题",
  "description": "CTA 描述",
  "buttonText": "按钮文字"
}
```

### Examples 部分

示例数组，支持图片对比展示：

```json
{
  "examples": [
    {
      "id": 1,
      "layout": "comparison",  // 或 "single"
      "type": "image",
      "input": "/path/to/input.webp",
      "output": "/path/to/output.webp",
      "inputLabel": "原图",
      "outputLabel": "转换后",
      "description": "示例描述"
    }
  ]
}
```

### Config 部分

配置选项：

```json
{
  "config": {
    "defaultStyle": "STYLE_NAME",  // 预选的样式
    "pageStructure": [  // 可选：自定义 section 顺序
      "whatIs",
      "examples",
      "howToUse",
      "benefits",
      "moreAITools",
      "faq",
      "cta"
    ]
  }
}
```

## 页面结构顺序

默认的 section 渲染顺序：
1. Hero
2. Convert Component（转换组件）
3. What Is
4. Examples
5. How to Use
6. Benefits
7. More AI Tools
8. FAQ
9. CTA

可以通过 `config.pageStructure` 自定义顺序。

## 多语言支持

为了支持多语言，需要为每个语言创建对应的 variant 文件：

```
src/data/variants/playground/
  ├── my-new-style.json          # 英文（默认）
  └── locales/
      ├── zh-CN/
      │   └── my-new-style.json  # 简体中文
      ├── ja/
      │   └── my-new-style.json  # 日文
      └── ...
```

或者使用 `loadVariantData` 函数的 locale 参数自动加载对应语言的文件。

## 最佳实践

1. **SEO 优化**：
   - 确保 meta.title 包含关键词
   - meta.description 应该简洁明了（150-160 字符）
   - 使用相关的 keywords

2. **内容质量**：
   - 提供清晰的步骤说明
   - 添加真实的示例图片
   - FAQ 应该回答用户最关心的问题

3. **性能优化**：
   - 使用 WebP 格式的图片
   - 优化图片大小
   - 使用 CDN 托管图片

4. **用户体验**：
   - 确保 CTA 按钮清晰可见
   - 提供足够的示例
   - 步骤说明要简单易懂

## 常见问题

### Q: 如何添加新的 section？

A: 在 `src/hooks/useSectionRenderer.tsx` 中添加新的 section 配置，然后在 variant 数据的 `config.pageStructure` 中引用。

### Q: 如何自定义 section 顺序？

A: 在 variant 数据的 `config.pageStructure` 中指定顺序：

```json
{
  "config": {
    "pageStructure": [
      "examples",
      "howToUse",
      "whatIs",
      "benefits",
      "faq"
    ]
  }
}
```

### Q: 如何隐藏某个 section？

A: 只需不在 `config.pageStructure` 中包含该 section，或者不提供该 section 的数据。

### Q: 如何添加自定义样式？

A: 需要在以下位置添加：
1. `api/tools/_constants.ts` - 添加样式枚举
2. `src/i18n/locales/*/playground.json` - 添加样式名称和描述
3. 后端 API - 实现样式转换逻辑

## 参考示例

查看现有的 variant 文件作为参考：
- `src/data/variants/playground/photo-to-anime.json`
- `src/data/variants/playground/ai-sticker-generator.json`
- `src/data/variants/playground/photo-to-pixel-art.json`

## 相关文件

- `src/pages/playground/[variant].tsx` - Variant 页面组件
- `src/hooks/useSectionRenderer.tsx` - Section 渲染 hook
- `src/lib/variant-loader.ts` - Variant 数据加载器
- `src/Components/SEO/` - SEO 组件目录


AI Anime Filter	False	False		AI Playground 图生图	
AI Manga Filter	False	False		AI Playground 图生图	
AI Comic Book Filter	False	False		AI Playground 图生图	
Photo to Sketch	False	False		AI Playground 图生图	
Photo to Line Art Converter	False	False		AI Playground 图生图	Line Art
AI Simpsons Generator	False	False		AI Playground 图生图	
AI Cartoon Generator	False	False		AI Playground 图生图	
AI Lego Filter	False	False		AI Playground 图生图	Lego
AI Minecraft Generator	False	False		AI Playground 图生图	
Pixar AI Generator	False	False		AI Playground 图生图	Pixar
PS2 AI Filter	False	False		AI Playground 图生图	PS Game
AI Pop Art Filter	False	False		AI Playground 图生图	Pop Art
AI Silhouette Maker	False	False		AI Playground 图生图	Silhouette
AI Magazine Cover Maker	False	False		AI Playground 图生图	Magazine
Magazine AI Generator	False	False		AI Playground 图生图	Magazine
AI Fat Filter	False	False		AI Playground 图生图	Chubby
AI Skinny Filter	False	False		AI Playground 图生图	Skinny
Baby Filter	False	False		AI Playground 图生图	Baby
AI Aging Filter	False	False		AI Playground 图生图	Elderly
AI Caricature Maker	False	False		AI Playground 图生图	Caricature
AI Polaroid Maker	False	False		AI Playground 图生图	Polaroid
AI Blonde Hair Filter	False	False		AI Playground 图生图	Blonde Hair
AI Bald Filter	False	False		AI Playground 图生图	Bald
AI Beard Filter	False	False		AI Playground 图生图	Beard
Image to Image AI Generator	False	False		AI Playground 图生图	
AI Image to Image Generator	False	False		AI Playground 图生图	
AI Image Style Changer	False	False		AI Playground 图生图	
	False	False		AI Playground 图生图	
AI Bikini	False	False		AI Playground 图生图	Bikini
Mugshot Generator	False	False		AI Playground 图生图	Mugshot
Mugshot Maker	False	False		AI Playground 图生图	Mugshot
AI Album Cover Generator	False	False		AI Playground 图生图	Album Cover
AI Filter	False	False		AI Playground 图生图	
Disney AI Generator	False	False		AI Playground 图生图	Pixar
Pixar Style Image Generator AI	False	False		AI Playground 图生图	Pixar
South Park Person Creator	False	False		AI Playground 图生图	South Park
Pregnancy Filter	False	False		AI Playground 图生图	Pregnant
South Park Character Creator	False	False		AI Playground 图生图	South Park
Sprite Sheet Creator	False	False		AI Playground 图生图	
AI Pregnant	False	False		AI Playground 图生图	
Chubby AI	False	False		AI Playground 图生图	Chubby
Simpsons Character Creator	False	False		AI Playground 图生图	
What would i look like with bangs	False	False		AI Playground 图生图	Bangs
Babyface Filter	False	False		AI Playground 图生图	Baby
Blue Eye Filter	False	False		AI Playground 图生图	Blue Eye
Bangs Filter Online	False	False		AI Playground 图生图	Bangs
Apple Emoji Generator	False	False		AI Playground 图生图	iOS Emoji
Memoji Generator	False	False		AI Playground 图生图	iOS Emoji
Anime Sticker	False	False		AI Playground 图生图	Chibi Sticker
AI Isometric Generator	False	False		AI Playground 图生图	Dollhouse
Character Turnaround Sheet Template	False	False		AI Playground 图生图	Turnaround Sheet
Expression Sheet Template	False	False		AI Playground 图生图	Expression Sheet
Character Pose Sheet	False	False		AI Playground 图生图	Pose Sheet
AI Costume Design	False	False		AI Playground 图生图	Costume Design
ID Photo Generator	False	False		AI Playground 图生图	ID Photo
AI Funko Pop Generator	False	False		AI Playground 图生图	Funko Pop
AI Lego Generator	False	False		AI Playground 图生图	Toy Bricks
AI Doll Generator	False	False		AI Playground 图生图	Plushie
AI Toy Generator	False	False		AI Playground 图生图	Toy Bricks
Gacha Card	False	False		AI Playground 图生图	Gacha Card
Snow Globe Maker	False	False		AI Playground 图生图	Snow Globe
Anime Avatar Maker	False	False		AI Playground 图生图	Avatar
Anime Avatar Generator	False	False		AI Playground 图生图	Avatar
Turn a picture into a paining	False	False		AI Playground 图生图	anime
Ghibli Filter	False	False		AI Playground 图生图	Ghibli Anime
Tarot Card Generator	False	False		AI Playground 图生图	Tarot Card
Random Tarot Card Generator	False	False		AI Playground 图生图	Tarot Card
