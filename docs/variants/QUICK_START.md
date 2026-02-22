# 快速开始 - Playground 衍生页面生成

## 🚀 5 分钟快速上手

### 步骤 1：配置（首次）

```bash
cd scripts/variant-generation
node generate-variant-page.mjs setup
```

输入：
- API Base URL: `http://localhost:3000`
- Session Token: 从浏览器开发者工具获取
- Default Model: `Animagine`
- Images Per Variant: `8`

---

### 步骤 2：预生成 Style 示例（推荐，一次性）

```bash
# 在另一个终端启动服务器
cd ../..
npm run dev

# 预生成所有 style 示例（约 3-4 小时）
cd scripts/variant-generation
node pregenerate-style-examples.mjs
```

**为什么要预生成？**
- ✅ 后续生成衍生页面时直接使用，不调用 API
- ✅ 节省成本和时间
- ✅ 质量一致

**可以跳过吗？**
- 可以，但每次生成都会调用 API（慢且贵）

---

### 步骤 3：准备关键词

创建 `variants.txt`：

```bash
cat > variants.txt << EOF
AI Anime Filter
Photo to Line Art Converter|Line Art
AI Lego Filter|Lego
Pixar AI Generator|Pixar
AI Simpsons Generator|The Simpsons
EOF
```

**格式：**
- `关键词` - 无默认 style，随机选择
- `关键词|Style` - 指定默认 style

---

### 步骤 4：批量生成

```bash
# 只生成文案（快速）
node batch-generate.mjs --tool=playground --text-only

# 生成文案 + 图片（如果没有预生成）
node batch-generate.mjs --tool=playground
```

---

### 步骤 5：检查结果

```bash
# 查看生成的文件
ls -lh ../../src/data/variants/playground/

# 查看 JSON 内容
cat ../../src/data/variants/playground/photo-to-line-art-converter.json | jq '.'

# 查看示例图片
cat ../../src/data/variants/playground/photo-to-line-art-converter.json | jq '.examples'
```

---

## 📚 常用命令

### 生成单个页面

```bash
# 只生成文案
node generate-variant-page.mjs playground "Photo to Line Art Converter|Line Art" --text-only

# 生成文案 + 图片
node generate-variant-page.mjs playground "Photo to Line Art Converter|Line Art"
```

### 批量生成

```bash
# 只生成文案
node batch-generate.mjs --tool=playground --text-only

# 强制重新生成
node batch-generate.mjs --tool=playground --text-only --force

# 使用 Perplexity 模式（更高质量）
node batch-generate.mjs --tool=playground --text-only --mode=perplexity
```

### 预生成管理

```bash
# 预生成所有 style 示例
node pregenerate-style-examples.mjs

# 强制重新生成
node pregenerate-style-examples.mjs --force

# 查看预生成的 styles
cat pregenerated-styles-index.json | jq 'keys'

# 查看某个 style 的示例
cat pregenerated-styles-index.json | jq '.["line-art"]'
```

---

## 🎯 推荐工作流

### 首次使用

```bash
# 1. 配置
node generate-variant-page.mjs setup

# 2. 启动服务器（另一个终端）
cd ../.. && npm run dev

# 3. 预生成（一次性，约 3-4 小时）
node pregenerate-style-examples.mjs

# 4. 准备关键词
vim variants.txt

# 5. 批量生成
node batch-generate.mjs --tool=playground --text-only
```

### 日常使用

```bash
# 1. 添加新关键词
echo "New Filter|Style" >> variants.txt

# 2. 批量生成（使用预生成的示例，快速）
node batch-generate.mjs --tool=playground --text-only

# 3. 检查结果
cat ../../src/data/variants/playground/new-filter.json | jq '.examples'
```

---

## 🔍 故障排除

### 问题 1：API 连接失败

```bash
# 检查服务器是否运行
curl http://localhost:3000/api/health

# 重新启动服务器
cd ../.. && npm run dev
```

### 问题 2：Session Token 过期

```bash
# 重新配置
node generate-variant-page.mjs setup

# 从浏览器获取新的 session token
# 开发者工具 → Application → Cookies → session_token
```

### 问题 3：预生成索引不存在

```bash
# 检查索引文件
ls -lh pregenerated-styles-index.json

# 如果不存在，运行预生成
node pregenerate-style-examples.mjs
```

### 问题 4：生成的图片不正确

```bash
# 检查预生成的图片
ls -lh ../../public/images/examples/playground/pregenerated/line-art/

# 重新生成特定 style
rm -rf ../../public/images/examples/playground/pregenerated/line-art/
node pregenerate-style-examples.mjs
```

---

## 📖 更多文档

- **[PREGENERATION_GUIDE.md](./PREGENERATION_GUIDE.md)** - 预生成系统详细指南
- **[BATCH_GENERATION_GUIDE.md](./BATCH_GENERATION_GUIDE.md)** - 批量生成完整指南
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - 最新改进总结
- **[LATEST_IMPROVEMENTS.md](./LATEST_IMPROVEMENTS.md)** - 之前的改进记录

---

## 💡 提示

1. **优先使用预生成**
   - 一次性投入，无限重用
   - 节省成本和时间

2. **分阶段生成**
   - 先用 `--text-only` 生成文案
   - 检查质量后再生成图片

3. **使用 Perplexity 模式**
   - 更高质量的内容
   - 需要 Perplexity API key

4. **定期更新预生成**
   - 添加新 style 后运行预生成
   - 更换输入图片后重新生成

---

## 🎉 开始使用

```bash
# 一键开始
cd scripts/variant-generation
node generate-variant-page.mjs setup
node pregenerate-style-examples.mjs
node batch-generate.mjs --tool=playground --text-only
```

祝你生成愉快！🚀

