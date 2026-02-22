# 工具配置系统 (Tool Configuration System)

## 概述

新的工具配置系统将原本单一的工具类型配置拆分为按工具类型组织的模块化配置结构，使系统更易于维护和扩展。

## 目录结构

```
tool-configs/
├── README.md                    # 本文档
├── ai-anime-generator/         # AI动漫生成器配置
│   ├── config.mjs              # 基础配置
│   ├── examples.json           # Few-shot示例
│   ├── prompts.mjs             # 提示词配置
│   └── templates.json          # 内容模板
├── oc-maker/                   # OC角色制作器配置
│   ├── config.mjs
│   ├── examples.json
│   ├── prompts.mjs
│   └── templates.json
├── ai-comic-generator/         # AI漫画生成器配置
│   ├── config.mjs
│   ├── examples.json
│   ├── prompts.mjs
│   └── templates.json
└── playground/                 # AI风格转换配置
    ├── config.mjs
    ├── examples.json
    ├── prompts.mjs
    └── templates.json
```

## 配置文件说明

### 1. config.mjs - 基础配置
包含工具的基本信息和配置参数：
- `name`: 工具名称
- `description`: 工具描述
- `targetAudience`: 目标用户群体
- `contentType`: 内容类型 (art/character/comic/style)
- `placeholderTemplate`: 占位符模板
- `buttonTemplate`: 按钮文本模板
- `functionalDescription`: 功能描述模板
- `stepTemplates`: 使用步骤模板
- `seoStandard`: SEO标准
- `keywordFocus`: 关键词重点
- `tips`: 使用技巧
- `faq`: 常见问题
- `skipImages`: 是否跳过图片生成
- `ratioOverride`: 图片比例覆盖

### 2. examples.json - Few-shot示例
包含用于AI生成的示例数据：
- `fewShotExamples`: 按关键词分组的示例
- 工具特定的示例结构（如角色元素、风格模板等）

### 3. prompts.mjs - 提示词配置
包含AI生成所需的提示词模板：
- 基础模板
- 元素库（角色、场景、风格等）
- 主题特定提示词
- 提示词生成函数

### 4. templates.json - 内容模板
包含页面内容的模板结构：
- 内容模板（whatIs、howToUse、features等）
- SEO模板
- 可重用的内容片段

## 使用方法

### 加载工具配置
```javascript
import { ToolLoader } from './modules/tool-loader.mjs'

// 加载基础配置
const config = await ToolLoader.loadToolConfig('ai-anime-generator')

// 加载示例数据
const examples = await ToolLoader.loadToolExamples('ai-anime-generator')

// 加载提示词配置
const prompts = await ToolLoader.loadToolPrompts('ai-anime-generator')

// 加载内容模板
const templates = await ToolLoader.loadToolTemplates('ai-anime-generator')
```

### 获取支持的工具类型
```javascript
const supportedTypes = ToolLoader.getSupportedToolTypes()
console.log(supportedTypes) // ['ai-anime-generator', 'oc-maker', 'ai-comic-generator', 'playground']
```

### 清除缓存
```javascript
ToolLoader.clearToolConfigCache()
```

## 向后兼容性

系统保持与原有代码的向后兼容：
- `ToolTypeManager.getToolTypeConfigSync()` 继续使用legacy配置
- `ToolTypeManager.getToolTypeConfig()` 异步版本优先使用新配置，失败时回退到legacy配置
- 原有的`LEGACY_TOOL_TYPE_CONFIG`作为fallback保留

## 添加新工具类型

1. 在`tool-configs/`下创建新的工具目录
2. 创建四个配置文件：`config.mjs`、`examples.json`、`prompts.mjs`、`templates.json`
3. 按照现有工具的结构填写配置
4. 工具会自动被系统识别和加载

## 优势

1. **模块化**: 每个工具的配置独立管理
2. **可扩展**: 轻松添加新工具类型
3. **可维护**: 配置结构清晰，易于修改
4. **性能**: 支持缓存，避免重复加载
5. **向后兼容**: 不影响现有代码运行
6. **类型安全**: 使用ES模块，支持更好的开发体验

## 测试

运行测试脚本验证配置系统：
```bash
node test-tool-configs.mjs
```

该脚本会测试：
- 所有工具类型的配置加载
- 示例、提示词、模板文件加载
- 缓存功能
- 错误处理
