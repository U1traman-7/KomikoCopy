# 衍生页面生成系统 (Variant Page Generation System)

## 快速开始

### 1. 配置系统

首次使用时，系统会自动创建配置文件：

```bash
cd scripts/variant-generation
node generate-variant-page.mjs
```

系统会提示你配置以下参数：

- **API服务器地址** (默认: `http://localhost:3000`)
- **会话令牌** (可选)
- **默认AI模型** (默认: `Animagine`)
- **每个变体的图片数量** (默认: 6)

### 2. 基本使用

```bash
# 生成完整页面（包含文案和图片）
node generate-variant-page.mjs [工具类型] "[关键词]"

# 只生成文案，不生成图片
node generate-variant-page.mjs [工具类型] "[关键词]" --text-only

# 跳过API调用（测试模式）
node generate-variant-page.mjs [工具类型] "[关键词]" --skip-api-call
```

### 3. 支持的工具类型

| 工具类型 | 描述 | 示例关键词 |
|---------|------|-----------|
| `ai-anime-generator` | AI动漫生成器 | "Genshin Impact Character" |
| `oc-maker` | 原创角色制作器 | "Pokemon OC Maker" |
| `ai-comic-generator` | AI漫画生成器 | "Superhero Comic Creator" |
| `playground` | AI风格转换 | "Anime Style Transfer" |

## 📖 详细使用指南

### 生成示例

```bash
# 生成Genshin Impact角色生成器页面
node generate-variant-page.mjs ai-anime-generator "Genshin Impact Character Generator"

# 生成Pokemon OC制作器页面
node generate-variant-page.mjs oc-maker "Pokemon OC Maker"

# 生成超级英雄漫画生成器页面
node generate-variant-page.mjs ai-comic-generator "Superhero Comic Creator"

# 生成动漫风格转换器页面
node generate-variant-page.mjs playground "Anime Style Transfer"
```

### 命令行参数

| 参数 | 描述 | 示例 |
|------|------|------|
| `--text-only` | 只生成文案内容，跳过图片生成 | `--text-only` |
| `--skip-api-call` | 跳过所有API调用，用于测试 | `--skip-api-call` |
| `--images=N` | 指定生成图片数量 | `--images=8` |
| `--model=MODEL` | 指定AI模型 | `--model=Animagine` |

### 配置文件

配置文件位于 `config.json`：

```json
{
  "apiBaseUrl": "http://localhost:3000",
  "sessionToken": "",
  "defaultModel": "Animagine",
  "imagesPerVariant": 6,
  "skipApiCall": false
}
```

## 🏗️ 系统架构

### 核心模块

```
scripts/variant-generation/
├── generate-variant-page.mjs     # 主入口脚本
├── config.json                   # 系统配置
├── modules/                      # 核心功能模块
│   ├── config-manager.mjs        # 配置管理
│   ├── content-generator.mjs     # 内容生成
│   ├── file-manager.mjs          # 文件管理
│   ├── image-generator.mjs       # 图片生成
│   ├── image-utils.mjs           # 图片工具
│   ├── prompt-generator.mjs      # Prompt生成
│   ├── tool-loader.mjs           # 工具配置加载
│   └── tool-type-manager.mjs     # 工具类型管理
└── tool-configs/                 # 工具配置目录
    ├── ai-anime-generator/       # AI动漫生成器配置
    ├── oc-maker/                 # OC制作器配置
    ├── ai-comic-generator/       # AI漫画生成器配置
    └── playground/               # 风格转换配置
```

### 工具配置结构

每个工具类型包含以下文件：

```
tool-configs/[tool-type]/
├── config.mjs          # 基础配置
├── examples.json       # Few-shot示例
├── prompts.mjs         # Prompt模板
└── templates.json      # 页面模板
```

## 🔧 高级功能

### 1. 自定义工具配置

创建新的工具类型：

```bash
# 1. 创建工具目录
mkdir tool-configs/my-new-tool

# 2. 创建配置文件
# config.mjs - 基础配置
# examples.json - Few-shot示例
# prompts.mjs - Prompt模板
# templates.json - 页面模板
```

### 2. 批量生成

```bash
# 使用专门的OC Maker批量生成脚本
node generate-oc-maker-variants.mjs
```

### 3. 验证和测试

```bash
# 验证示例文件
node validate-examples.mjs

# 测试工具配置
node test-tool-configs.mjs
```

## 📊 输出结果

### 生成的文件

系统会在相应的工具目录下生成：

```
public/tools/[tool-type]/[variant-slug]/
└── [variant-slug].json    # 包含页面内容和图片数据
```

### JSON结构

```json
{
  "seo": {
    "title": "页面标题",
    "description": "页面描述",
    "keywords": ["关键词1", "关键词2"]
  },
  "placeholderText": "占位符文本",
  "content": {
    "header": "页面头部内容",
    "examples": "使用示例",
    "tips": "使用技巧",
    // ... 其他内容部分
  },
  "examples": [
    {
      "prompt": "生成的prompt",
      "imageUrl": "图片URL",
      "metadata": { /* 图片元数据 */ }
    }
  ]
}
```

## 🛠️ 故障排除

### 常见问题

1. **API连接失败**

   ```
   解决方案: 检查config.json中的apiBaseUrl设置
   ```

2. **图片生成失败**

   ```
   解决方案: 使用--text-only参数先生成文案，再单独处理图片
   ```

3. **配置文件错误**

   ```
   解决方案: 删除config.json让系统重新生成
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=1 node generate-variant-page.mjs [参数]

# 跳过API调用进行测试
node generate-variant-page.mjs [工具类型] "[关键词]" --skip-api-call
```

## 🔄 更新和维护

### 更新工具配置

```bash
# 清除配置缓存
node -e "require('./modules/tool-loader.mjs').clearToolConfigCache()"

# 重新加载配置
node generate-variant-page.mjs [工具类型] "[关键词]"
```

### 3. 生成质量优化

```bash
# 高质量生成（更多图片）
node generate-variant-page.mjs ai-anime-generator "Genshin Impact" --images=12

# 快速测试（只生成文案）
node generate-variant-pge.mjs oc-maker "Pokemon OC" --text-only

# 调试模式（跳过API）
node generate-variant-page.mjs playground "Anime Filter" --skip-api-call
```

## 📚 扩展开发

### 添加新工具类型

**步骤详解：**

1. **创建目录结构**

```bash
mkdir tool-configs/my-new-tool
cd tool-configs/my-new-tool
```

2. **创建config.mjs**

```javascript
export const CONFIG = {
  placeholderTemplate: "Create amazing {keyword} with AI",
  buttonTemplate: "Generate {keyword}",
  functionalDescription: "AI-powered {keyword} generator",
  // ... 其他配置
}
```

3. **创建prompts.mjs**

```javascript
export const PROMPTS = {
  generateAIPrompt: function(theme, count, variantKey) {
    return `Your custom prompt template for ${theme}...`
  }
}
```

4. **创建examples.json**

```json
{
  "examples": [
    {
      "keyword": "example keyword",
      "prompt": "example prompt",
      "description": "example description"
    }
  ]
}
```

5. **测试新工具**

```bash
node generate-variant-page.mjs my-new-tool "Test Keyword" --text-only
```

### 自定义内容生成

**修改内容模板：**

1. 编辑 `tool-configs/[tool-type]/config.mjs`
2. 更新相应的模板字段
3. 重新生成页面测试效果

**示例：自定义按钮文本**

```javascript
// 在config.mjs中
export const CONFIG = {
  buttonTemplate: "🎨 Create Your {keyword} Now!",
  // ...
}
```

### 集成新的AI模型

**添加模型支持：**

1. **更新image-generator.mjs**

```javascript
// 添加新模型的配置
const MODEL_CONFIGS = {
  'NewModel': {
    endpoint: '/api/new-model',
    parameters: { /* 模型特定参数 */ }
  }
}
```

2. **更新配置选项**

```json
{
  "defaultModel": "NewModel",
  "supportedModels": ["Animagine", "NewModel"]
}
```

3. **测试新模型**

```bash
node generate-variant-page.mjs ai-anime-generator "Test" --model=NewModel
```

## 🔍 调试和监控

### 日志系统

系统提供详细的日志输出：

```bash
# 查看生成过程
node generate-variant-page.mjs ai-anime-generator "Test" 2>&1 | grep "✅\|❌\|⚠️"

# 查看API调用详情
DEBUG=api node generate-variant-page.mjs oc-maker "Test"

# 查看文件操作详情
DEBUG=file node generate-variant-page.mjs playground "Test"
```
