# Playground 页面结构迁移总结

## 概述

本次迁移将 playground 相关页面的结构统一为与 video-to-video 页面相同的模式，实现了更好的 SEO 优化和代码复用。

## 主要更改

### 1. playground.json 结构重组

**旧结构：**
```json
{
  "meta": {...},
  "hero": {...},
  "howItWorks": {...},
  "examples": {...},
  "benefits": {...},
  "faqSection": {...},
  "faq": {...},
  "title": "...",
  "infoTooltip": "...",
  "styleSelection": {...},
  "button": {...},
  "results": {...},
  "deleteModal": {...},
  "toast": {...},
  "errors": {...},
  "styles": {...},
  "styleDescriptions": {...}
}
```

**新结构：**
```json
{
  "ui": {
    "title": "...",
    "infoTooltip": "...",
    "styleSelection": {...},
    "styleModes": {...},
    "prompt": {...},
    "button": {...},
    "results": {...},
    "deleteModal": {...},
    "toast": {...},
    "errors": {...},
    "styles": {...},
    "styleDescriptions": {...}
  },
  "seo": {
    "meta": {
      "title": "...",
      "description": "...",
      "keywords": "..."
    },
    "hero": {
      "title": "..."
    },
    "whatIs": {
      "title": "...",
      "description": "..."
    },
    "examples": {
      "title": "...",
      "description": "..."
    },
    "howToUse": {
      "title": "...",
      "steps": [...]
    },
    "benefits": {
      "title": "...",
      "description": "...",
      "features": [...]
    },
    "faq": {
      "title": "...",
      "description": "...",
      "q1": "...",
      "a1": "...",
      ...
    },
    "cta": {
      "title": "...",
      "description": "...",
      "buttonText": "..."
    }
  },
  "examples": []
}
```

**主要变化：**
- 将 UI 相关内容移到 `ui` 部分
- 将 SEO 相关内容移到 `seo` 部分
- `seo` 部分结构与 video-to-video.json 保持一致
- 添加了 `examples` 数组（顶层）

### 2. photo-to-anime.json 简化

**旧结构：**
包含完整的 meta、hero、howItWorks、examples、benefits、faqSection、faq 等 SEO 内容

**新结构：**
```json
{
  "ui": {
    "styleModes": {...},
    "prompt": {...}
  }
}
```

**变化说明：**
- 只保留 UI 相关内容
- 所有 SEO 内容已移至 playground.json

### 3. playground.tsx 页面重构

**主要变化：**
- 使用 `useTranslation('playground', { keyPrefix: 'seo' })` 模式
- 直接使用 SEO 组件（Hero, HowToUse, WhatIs, Benefits, FAQ, CTA）
- 移除了 ToolsPhotoToAnimePage 的使用
- 直接使用 PhotoToAnimeConvert 组件
- 页面结构与 video-to-video.tsx 保持一致

**代码示例：**
```tsx
const { t } = useTranslation('playground', { keyPrefix: 'seo' });
const { t: tData } = useTranslation('playground');

const seoData = tData('seo', { returnObjects: true }) as any;
const examples = tData('examples', { returnObjects: true }) as any[];

// 使用 SEO 组件
<Hero title={seoData.hero.title} description={seoData.meta.description} />
<PhotoToAnimeConvert />
<WhatIs title={seoData.whatIs.title} description={seoData.whatIs.description} />
<HowToUse title={seoData.howToUse.title} steps={seoData.howToUse.steps} />
<Benefits title={seoData.benefits.title} description={seoData.benefits.description} features={seoData.benefits.features} />
<FAQ title={seoData.faq.title} description={seoData.faq.description} faqs={[...]} />
<CTA title={seoData.cta.title} description={seoData.cta.description} buttonText={seoData.cta.buttonText} />
```

### 4. playground/[variant].tsx 页面重构

**主要变化：**
- 使用 `useSectionRenderer` hook 进行统一的 section 渲染
- 移除了 TemplateWrapper 和 ToolsPhotoToAnimePage
- 直接使用 PhotoToAnimeConvert 组件
- 使用 `loadVariantData` 从 JSON 文件加载数据
- 页面结构与 video-to-video/[variant].tsx 保持一致

**代码示例：**
```tsx
const { seo } = variantContent;
const examples = variantContent.examples || [];

const { renderSections } = useSectionRenderer({
  content: { seo, examples, pageStructure },
  toolName: 'playground',
  category: 'illustration',
});

// 渲染所有 SEO sections
<div className='flex flex-col gap-14 md:gap-24 mt-12 md:mt-20'>
  {renderSections()}
</div>
```

### 5. Variant 数据结构迁移

**旧结构（src/data/variants/playground/*.json）：**
```json
{
  "seo": {
    "title": "...",
    "description": "...",
    "keywords": "..."
  },
  "content": {
    "header": {...},
    "sections": {
      "whatIs": {...},
      "howToUse": {...},
      "whyUse": {...},
      "examples": {...},
      "faq": {...}
    },
    "examples": [...],
    "faq": [...],
    "cta": {...}
  },
  "config": {...}
}
```

**新结构：**
```json
{
  "seo": {
    "meta": {
      "title": "...",
      "description": "...",
      "keywords": "..."
    },
    "hero": {
      "title": "..."
    },
    "whatIs": {...},
    "examples": {...},
    "howToUse": {...},
    "benefits": {...},
    "faq": {
      "title": "...",
      "description": "...",
      "q1": "...",
      "a1": "...",
      ...
    },
    "cta": {...}
  },
  "examples": [...],
  "config": {...}
}
```

**变化说明：**
- `content.header` → `seo.hero`
- `content.sections.whatIs` → `seo.whatIs`
- `content.sections.howToUse` → `seo.howToUse`
- `content.sections.whyUse` → `seo.benefits`
- `content.sections.examples` → `seo.examples`
- `content.sections.faq` + `content.faq` → `seo.faq`（FAQ 数组转换为 q1/a1 格式）
- `content.examples` → `examples`（顶层）

## 迁移脚本

### 1. migrate-playground-variants.mjs

迁移 `src/data/variants/playground/` 目录下的所有 variant JSON 文件。

**功能：**
- 自动备份所有文件到 `src/data/variants/playground-backup/`
- 将旧结构转换为新结构
- 跳过已经迁移的文件
- 提供详细的迁移报告

**运行：**
```bash
node scripts/migrate-playground-variants.mjs
```

**结果：**
- ✅ 成功迁移：23 个文件
- ⏭️ 跳过：0 个文件
- ❌ 失败：0 个文件

### 2. migrate-playground-i18n.mjs

迁移所有语言的 `playground.json` 和 `photo-to-anime.json` 文件。

**功能：**
- 自动备份所有文件到 `src/i18n/locales-backup/`
- 迁移 playground.json 到新结构
- 简化 photo-to-anime.json（只保留 UI 内容）
- 支持所有语言（19 个 locale）

**运行：**
```bash
node scripts/migrate-playground-i18n.mjs
```

**结果：**
- playground.json：✅ 成功迁移 13 个，⏭️ 跳过 1 个（en 已迁移）
- photo-to-anime.json：✅ 成功迁移 13 个，⏭️ 跳过 1 个（en 已迁移）

## 受影响的文件

### 修改的文件：
1. `src/i18n/locales/*/playground.json` - 所有语言的 playground 翻译文件
2. `src/i18n/locales/*/photo-to-anime.json` - 所有语言的 photo-to-anime 翻译文件
3. `src/pages/playground.tsx` - Playground 主页面
4. `src/pages/playground/[variant].tsx` - Playground variant 页面
5. `src/data/variants/playground/*.json` - 所有 playground variant 数据文件

### 新增的文件：
1. `scripts/migrate-playground-variants.mjs` - Variant 数据迁移脚本
2. `scripts/migrate-playground-i18n.mjs` - i18n 文件迁移脚本
3. `MIGRATION_SUMMARY.md` - 本文档

### 备份文件：
1. `src/i18n/locales/en/playground.json.backup` - 英文 playground 原始文件
2. `src/i18n/locales-backup/` - 所有语言的 i18n 备份
3. `src/data/variants/playground-backup/` - 所有 variant 数据备份
4. `src/pages/playground/[variant].tsx.backup` - variant 页面原始文件

## 优势

1. **统一的结构**：playground 和 video-to-video 使用相同的结构模式
2. **更好的 SEO**：清晰分离 UI 和 SEO 内容，便于搜索引擎抓取
3. **代码复用**：使用 `useSectionRenderer` hook 统一渲染 SEO sections
4. **易于维护**：结构清晰，便于后续添加新的 variant 页面
5. **类型安全**：使用 TypeScript 类型定义，减少错误
6. **国际化支持**：所有语言的翻译文件都已迁移

## 测试建议

1. **功能测试**：
   - 访问 `/playground` 页面，确认所有 SEO sections 正常显示
   - 访问各个 variant 页面（如 `/playground/photo-to-anime`），确认内容正确
   - 测试图片转换功能是否正常工作
   - 测试不同语言的页面

2. **SEO 测试**：
   - 检查页面的 meta 标签是否正确
   - 使用 Google Search Console 测试页面抓取
   - 检查结构化数据是否正确

3. **性能测试**：
   - 检查页面加载速度
   - 确认没有不必要的重新渲染

## 回滚方案

如果需要回滚，可以使用备份文件：

```bash
# 回滚 i18n 文件
cp -r src/i18n/locales-backup/* src/i18n/locales/

# 回滚 variant 数据
cp -r src/data/variants/playground-backup/* src/data/variants/playground/

# 回滚页面文件
cp src/pages/playground/[variant].tsx.backup src/pages/playground/[variant].tsx
```

## 后续工作

1. 删除不再使用的组件（如果有）
2. 更新相关文档
3. 考虑为其他工具页面应用相同的模式
4. 添加更多的 variant 页面示例

