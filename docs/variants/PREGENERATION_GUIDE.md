# Style 示例预生成系统

## 📋 概述

为了避免重复调用 API 生成相同的 style 示例图片，我们实现了一个预生成系统：

1. **一次性生成**：批量生成所有 style 的示例图片
2. **重复使用**：生成衍生页面时直接使用预生成的图片
3. **节省成本**：避免重复调用 API
4. **保证质量**：所有页面使用相同的高质量示例

---

## 🚀 快速开始

### 步骤 1：预生成所有 style 示例

```bash
cd scripts/variant-generation

# 首次运行（生成所有 style）
node pregenerate-style-examples.mjs

# 强制重新生成（覆盖已存在的）
node pregenerate-style-examples.mjs --force
```

### 步骤 2：生成衍生页面

```bash
# 现在生成衍生页面时会自动使用预生成的示例
node batch-generate.mjs --tool=playground --text-only
```

---

## 📁 文件结构

```
scripts/variant-generation/
├── pregenerate-style-examples.mjs    # 预生成脚本
├── pregenerated-styles-index.json    # 索引文件（自动生成）
└── generators/
    └── image-generator.mjs           # 图片生成器（已更新）

public/images/examples/playground/
└── pregenerated/                     # 预生成的图片目录
    ├── anime/
    │   ├── example_1.webp
    │   ├── example_2.webp
    │   ├── example_3.webp
    │   └── example_4.webp
    ├── line-art/
    │   ├── example_1.webp
    │   ├── example_2.webp
    │   ├── example_3.webp
    │   └── example_4.webp
    └── ... (所有其他 styles)
```

---

## 🔧 工作原理

### 1. 预生成阶段

```javascript
// pregenerate-style-examples.mjs

// 1. 从 styles.ts 提取所有 style IDs
const styleIds = extractStyleIds()  // ['anime', 'line-art', 'lego', ...]

// 2. 使用 4 张预定义的输入图片
const INPUT_IMAGES = [
  '/images/examples/photo-to-anime/input2.jpg',
  '/images/examples/photo-to-anime/black_guy_photo.webp',
  '/images/examples/photo-to-anime/cat_photo.webp',
  '/images/examples/photo-to-anime/dog_photo.webp'
]

// 3. 对每个 style 调用 style-transfer API
for (const styleId of styleIds) {
  for (const inputImage of INPUT_IMAGES) {
    const output = await callStyleTransferAPI(inputImage, styleId)
    // 保存到 public/images/examples/playground/pregenerated/{styleId}/
  }
}

// 4. 生成索引文件
{
  "anime": [
    {
      "input": "/images/examples/photo-to-anime/input2.jpg",
      "output": "/images/examples/playground/pregenerated/anime/example_1.webp",
      "style": "anime"
    },
    ...
  ],
  "line-art": [...],
  ...
}
```

### 2. 使用阶段

```javascript
// generators/image-generator.mjs

export async function generatePlaygroundImages(keyword, config, defaultStyle = null) {
  // 1. 加载预生成索引
  const pregeneratedIndex = loadPregeneratedIndex()
  
  // 2. 如果有 defaultStyle 且在索引中
  if (defaultStyle && pregeneratedIndex[defaultStyle]) {
    console.log(`✅ 使用预生成的 ${defaultStyle} 示例`)
    return pregeneratedIndex[defaultStyle]  // 直接返回，不调用 API
  }
  
  // 3. 如果没有 defaultStyle，从索引中随机选择 4 种
  if (!defaultStyle && pregeneratedIndex) {
    const availableStyles = Object.keys(pregeneratedIndex)
    const selected = shuffled.slice(0, 4)
    
    // 从每个 style 中随机选择一个示例
    const examples = selected.map(styleId => {
      const styleExamples = pregeneratedIndex[styleId]
      return styleExamples[Math.floor(Math.random() * styleExamples.length)]
    })
    
    return examples  // 直接返回，不调用 API
  }
  
  // 4. 如果索引不存在或 style 不在索引中，回退到 API 生成
  // ... 原有的 API 调用逻辑
}
```

---

## 📊 优势对比

### 传统方式（每次调用 API）

```
生成 67 个页面 × 4 张图片 = 268 次 API 调用
- 时间：268 × 30秒 = 2.2 小时
- 成本：268 × credits
- 质量：每次生成可能不一致
```

### 预生成方式

```
预生成阶段：
- 100 个 styles × 4 张图片 = 400 次 API 调用（一次性）
- 时间：400 × 30秒 = 3.3 小时（一次性）
- 成本：400 × credits（一次性）

使用阶段：
- 生成 67 个页面 = 0 次 API 调用
- 时间：即时
- 成本：0
- 质量：完全一致
```

**总结：**
- ✅ 第一次投入更多时间和成本
- ✅ 后续生成完全免费且即时
- ✅ 可以生成无限多的衍生页面
- ✅ 所有页面使用相同的高质量示例

---

## 🎯 使用场景

### 场景 1：有指定 defaultStyle

**输入（variants.txt）：**
```
Photo to Line Art Converter|Line Art
```

**处理流程：**
```
1. 检查预生成索引
2. 找到 "line-art" 的 4 张预生成图片
3. 直接使用，不调用 API
4. 生成时间：< 1 秒
```

**输出：**
```json
{
  "originalKeyword": "Photo to Line Art Converter",
  "defaultStyle": "line-art",
  "examples": [
    {
      "input": "/images/examples/photo-to-anime/input2.jpg",
      "output": "/images/examples/playground/pregenerated/line-art/example_1.webp",
      "style": "line-art"
    },
    ...
  ]
}
```

### 场景 2：无指定 defaultStyle（随机）

**输入（variants.txt）：**
```
AI Filter
```

**处理流程：**
```
1. 检查预生成索引
2. 从所有可用 styles 中随机选择 4 种
3. 从每种 style 的 4 张图片中随机选择 1 张
4. 直接使用，不调用 API
5. 生成时间：< 1 秒
```

**输出：**
```json
{
  "originalKeyword": "AI Filter",
  "defaultStyle": "anime",
  "examples": [
    {
      "input": "/images/examples/photo-to-anime/input2.jpg",
      "output": "/images/examples/playground/pregenerated/anime/example_1.webp",
      "style": "anime"
    },
    {
      "input": "/images/examples/photo-to-anime/black_guy_photo.webp",
      "output": "/images/examples/playground/pregenerated/manga/example_2.webp",
      "style": "manga"
    },
    ...
  ]
}
```

### 场景 3：Style 不在预生成索引中

**输入（variants.txt）：**
```
New Custom Style|custom-style
```

**处理流程：**
```
1. 检查预生成索引
2. "custom-style" 不在索引中
3. 回退到 API 生成模式
4. 调用 style-transfer API 生成 4 张图片
5. 生成时间：~2 分钟
```

---

## 🔄 更新预生成示例

### 何时需要更新？

1. **添加了新的 style**
   ```bash
   # 只生成新的 style（已存在的会跳过）
   node pregenerate-style-examples.mjs
   ```

2. **想要更新所有示例**
   ```bash
   # 强制重新生成所有 style
   node pregenerate-style-examples.mjs --force
   ```

3. **更换了输入图片**
   - 修改 `pregenerate-style-examples.mjs` 中的 `INPUT_IMAGES`
   - 运行 `node pregenerate-style-examples.mjs --force`

---

## 📝 注意事项

### 1. 预生成需要时间

```bash
# 假设有 100 个 styles
100 styles × 4 images × 30 seconds = 3.3 小时

# 建议分批运行或在后台运行
nohup node pregenerate-style-examples.mjs > pregenerate.log 2>&1 &
```

### 2. 磁盘空间

```bash
# 每张图片约 200KB
100 styles × 4 images × 200KB = 80MB

# 确保有足够的磁盘空间
df -h public/images/examples/playground/pregenerated/
```

### 3. API 限制

```bash
# 如果 API 有速率限制，可以调整延迟
# 在 pregenerate-style-examples.mjs 中：
await new Promise(resolve => setTimeout(resolve, 2000))  // 2秒延迟
```

### 4. 索引文件

```bash
# 索引文件会自动生成和更新
# 不要手动编辑 pregenerated-styles-index.json

# 如果索引损坏，删除后重新生成
rm pregenerated-styles-index.json
node pregenerate-style-examples.mjs
```

---

## 🧪 测试

### 测试预生成

```bash
# 1. 预生成几个 style 测试
node pregenerate-style-examples.mjs

# 2. 检查生成的文件
ls -lh public/images/examples/playground/pregenerated/anime/
ls -lh public/images/examples/playground/pregenerated/line-art/

# 3. 检查索引文件
cat pregenerated-styles-index.json | jq '.anime'
```

### 测试使用预生成示例

```bash
# 1. 创建测试关键词
cat > variants.txt << EOF
Photo to Line Art Converter|Line Art
AI Anime Filter|Anime
EOF

# 2. 生成页面（应该使用预生成的示例）
node generate-variant-page.mjs playground "Photo to Line Art Converter|Line Art" --text-only

# 3. 检查日志
# 应该看到：✅ 使用预生成的 line-art 示例

# 4. 检查生成的 JSON
cat ../../src/data/variants/playground/photo-to-line-art-converter.json | jq '.examples'
```

---

## 🎉 总结

预生成系统让你可以：

1. ✅ **一次性投入**：预生成所有 style 示例
2. ✅ **无限重用**：生成任意数量的衍生页面
3. ✅ **零成本**：后续生成不调用 API
4. ✅ **即时生成**：从索引中读取，< 1 秒
5. ✅ **质量一致**：所有页面使用相同的示例
6. ✅ **灵活回退**：如果 style 不在索引中，自动回退到 API 生成

开始使用：
```bash
node pregenerate-style-examples.mjs
```

