# 批量生成指南 - Playground 变体页面

## 🎯 推荐工作流（使用预生成）

### 步骤 0：预生成所有 style 示例（一次性，推荐）

```bash
cd scripts/variant-generation

# 预生成所有 style 的示例图片（约 3-4 小时，一次性投入）
node pregenerate-style-examples.mjs

# 这会生成：
# - public/images/examples/playground/pregenerated/{style}/example_*.webp
# - scripts/variant-generation/pregenerated-styles-index.json
```

**优势：**
- ✅ 后续生成衍生页面时直接使用预生成的图片
- ✅ 不需要重复调用 API，节省成本
- ✅ 生成速度快（< 1 秒）
- ✅ 所有页面使用相同的高质量示例

**详细说明：** [PREGENERATION_GUIDE.md](./PREGENERATION_GUIDE.md)

---

## 📋 准备工作

### 1. 配置 variants.txt

在 `scripts/variant-generation/variants.txt` 中添加关键词，格式：

```
关键词
关键词|默认Style
```

**示例：**
```
AI Anime Filter
Photo to Line Art Converter|Line Art
AI Lego Filter|Lego
Pixar AI Generator|Pixar
AI Simpsons Generator|The Simpsons
```

### 2. 启动本地 API 服务器

批量生成需要本地 API 服务器来调用 AI 生成内容。

```bash
# 在项目根目录启动开发服务器
npm run dev
```

确保服务器运行在 `http://localhost:3000`

### 3. 配置 Session Token

```bash
cd scripts/variant-generation
node generate-variant-page.mjs setup
```

按提示输入：
- API Base URL: `http://localhost:3000`
- Session Token: 从浏览器开发者工具中获取
- Default Model: `Animagine`
- Images Per Variant: `8`

## 🚀 批量生成命令

### 基本用法

```bash
# 只生成文案（推荐先用这个测试）
node batch-generate.mjs --tool=playground --text-only

# 生成文案 + 图片（完整生成）
node batch-generate.mjs --tool=playground

# 只生成图片（为已有文案的页面）
node batch-generate.mjs --tool=playground --images-only

# 强制重新生成
node batch-generate.mjs --tool=playground --text-only --force
```

### 使用 Perplexity 模式（更好的 SEO）

```bash
# 配置 Perplexity API Key
node generate-variant-page.mjs setup

# 使用 Perplexity 批量生成
node batch-generate.mjs --tool=playground --text-only --mode=perplexity
```

## 📊 生成的内容结构

每个生成的页面都会包含：

### 1. 标准化的 JSON 结构

```json
{
  "seo": {
    "meta": { "title", "description", "keywords" },
    "hero": { "title" },
    "whatIs": { "title", "description" },
    "examples": { "title", "description" },
    "howToUse": { "title", "steps": [] },
    "benefits": { "title", "description", "features": [] },
    "faq": { "title", "description", "q1-q9", "a1-a9" },
    "cta": { "title", "description", "buttonText" }
  },
  "config": {},
  "placeholderText": "Transform your photo into XXX style",
  "originalKeyword": "XXX",
  "defaultStyle": "xxx-style",
  "examples": [],
  "pageStructure": ["whatIs", "examples", "howToUse", "whyUse", "moreAITools", "faq", "cta"]
}
```

### 2. 自动功能

- ✅ **随机化页面结构** - 每个页面的 section 顺序不同，避免内容农场检测
- ✅ **9个 FAQ 问题** - 完整的常见问题解答
- ✅ **SEO 友好标题** - 标准化的 section 标题格式
- ✅ **默认样式设置** - 自动从关键词中提取或使用提供的 style
- ✅ **占位符文本** - 自动生成的输入框提示文本

### 3. 默认样式处理

当你在 variants.txt 中使用 `关键词|Style` 格式时：

**输入：**
```
Photo to Line Art Converter|Line Art
```

**输出：**
```json
{
  "originalKeyword": "Photo to Line Art Converter",
  "defaultStyle": "line-art",
  "placeholderText": "Transform your photo into Photo to Line Art Converter style"
}
```

样式名称会自动转换为 kebab-case 格式（小写，用连字符分隔）。

## 📝 完整的 Playground 关键词列表

```
# 风格转换
AI Anime Filter
AI Manga Filter
AI Comic Book Filter
Photo to Sketch
Photo to Line Art Converter|Line Art
AI Cartoon Generator
Ghibli Filter|Ghibli Anime

# 特定IP风格
AI Simpsons Generator|The Simpsons
Pixar AI Generator|Pixar
Disney AI Generator|Pixar
South Park Person Creator|South Park
South Park Character Creator|South Park

# 游戏/像素风格
AI Lego Filter|Lego
AI Lego Generator|Toy Bricks
AI Minecraft Generator|Minecraft
PS2 AI Filter|PS Game

# 艺术风格
AI Pop Art Filter|Pop Art
AI Silhouette Maker|Silhouette
AI Caricature Maker|Caricature
AI Polaroid Maker|Polaroid

# 杂志/封面
AI Magazine Cover Maker|Magazine
Magazine AI Generator|Magazine
AI Album Cover Generator|Album Cover

# 人物特征
AI Fat Filter|Chubby
AI Skinny Filter|Skinny
Baby Filter|Baby
AI Aging Filter|Elderly
AI Blonde Hair Filter|Blonde Hair
AI Bald Filter|Bald
AI Beard Filter|Beard
What would i look like with bangs|Bangs
Bangs Filter Online|Bangs
Blue Eye Filter|Blue Eye
Babyface Filter|Baby

# 服装/造型
AI Bikini|Bikini
Pregnancy Filter|Pregnant
AI Pregnant|Pregnant
AI Costume Design|Costume Design

# 表情包/贴纸
Apple Emoji Generator|iOS Emoji
Memoji Generator|iOS Emoji
Anime Sticker|Chibi Sticker
AI Funko Pop Generator|Funko Pop

# 角色设计
Character Turnaround Sheet Template|Turnaround Sheet
Expression Sheet Template|Expression Sheet
Character Pose Sheet|Pose Sheet
Sprite Sheet Creator|Sprite Sheet

# 玩具/模型
AI Doll Generator|Plushie
AI Toy Generator|Toy Bricks
Gacha Card|Gacha Card
Snow Globe Maker|Snow Globe

# 头像/证件照
Anime Avatar Maker|Avatar
Anime Avatar Generator|Avatar
ID Photo Generator|ID Photo
Mugshot Generator|Mugshot
Mugshot Maker|Mugshot

# 其他
AI Isometric Generator|Dollhouse
Tarot Card Generator|Tarot Card
Random Tarot Card Generator|Tarot Card
Turn a picture into a paining|Anime
Image to Image AI Generator
AI Image to Image Generator
AI Image Style Changer
AI Filter
```

## ⚙️ 批量生成配置

在 `batch-generate.mjs` 中可以调整：

```javascript
const BATCH_SIZE = 3              // 每批处理3个
const DELAY_BETWEEN_BATCHES = 10000  // 批次间延迟10秒
const DELAY_BETWEEN_ITEMS = 3000     // 单个项目间延迟3秒
```

## 🎯 推荐工作流

### 第一阶段：测试（3个关键词）

```bash
# 1. 创建测试文件
cat > variants.txt << EOF
AI Anime Filter
Photo to Line Art Converter|Line Art
AI Lego Filter|Lego
EOF

# 2. 只生成文案测试
node batch-generate.mjs --tool=playground --text-only

# 3. 检查生成的文件
ls -la ../../src/data/variants/playground/
```

### 第二阶段：批量生成文案

```bash
# 1. 使用完整的关键词列表
# 复制上面的完整列表到 variants.txt

# 2. 批量生成文案
node batch-generate.mjs --tool=playground --text-only

# 3. 查看进度和结果
# 脚本会显示实时进度：
# 📊 进度: 15/67 (成功: 14, 失败: 1)
```

### 第三阶段：生成图片（可选）

```bash
# 为已有文案的页面生成图片
node batch-generate.mjs --tool=playground --images-only
```

## 🔍 检查生成结果

### 查看生成的文件

```bash
# 列出所有生成的文件
ls -la ../../src/data/variants/playground/

# 查看特定文件
cat ../../src/data/variants/playground/photo-to-line-art.json | jq .
```

### 验证关键字段

```bash
# 检查 defaultStyle
cat ../../src/data/variants/playground/photo-to-line-art.json | jq '.defaultStyle'

# 检查 pageStructure
cat ../../src/data/variants/playground/photo-to-line-art.json | jq '.pageStructure'

# 检查 FAQ 数量
cat ../../src/data/variants/playground/photo-to-line-art.json | jq '.seo.faq | keys | length'
```

## ❌ 常见问题

### 1. "fetch failed" 错误

**原因：** 本地 API 服务器没有运行

**解决：**
```bash
# 在另一个终端启动服务器
npm run dev
```

### 2. "AI API call failed: 500" 错误

**原因：** Session token 无效或过期

**解决：**
```bash
# 重新配置 session token
node generate-variant-page.mjs setup
```

### 3. 生成的 FAQ 只有 5-6 个问题

**原因：** AI 没有遵循 9 个问题的模板

**解决：** 这是已知问题，需要手动检查和补充。或者使用 Perplexity 模式：
```bash
node batch-generate.mjs --tool=playground --text-only --mode=perplexity
```

### 4. defaultStyle 没有正确设置

**原因：** 样式名称格式不正确

**解决：** 确保在 variants.txt 中使用正确的格式：
```
关键词|Style Name
```

样式名称会自动转换为 kebab-case。

## 📈 批量生成统计

生成完成后会显示统计信息：

```
🎉 批量生产完成!
==================================================
📊 总计: 67 个变体
✅ 成功: 65 个
❌ 失败: 2 个
⏱️ 耗时: 1234 秒
📈 成功率: 97%
```

## 🎨 样式名称映射

系统会自动识别以下样式关键词：

| 关键词 | 映射的 Style |
|--------|-------------|
| anime | anime |
| cartoon | cartoon |
| ghibli | ghibli-anime |
| manga | manga |
| sketch | sketch |
| line art | line-art |
| lego | lego |
| minecraft | pixel-art |
| pixar | pixar |
| simpsons | the-simpsons |
| naruto | naruto |
| claymation | claymation |

如果关键词中包含这些词，会自动设置对应的 defaultStyle。

## 🚀 下一步

生成完成后：

1. **检查内容质量** - 随机抽查几个生成的文件
2. **补充 FAQ** - 如果 FAQ 不足 9 个，手动补充
3. **生成图片** - 使用 `--images-only` 模式
4. **更新导航** - 将新页面添加到 `src/constants/index.tsx`
5. **添加 i18n** - 将翻译键添加到 `src/i18n/locales/en/common.json`
6. **测试页面** - 在浏览器中访问生成的页面
7. **部署** - 提交代码并部署到生产环境

