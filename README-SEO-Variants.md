# SEO 衍生页面管理指南

## 概览

本系统允许基于现有工具页面（如 `ai-anime-generator`）快速生成SEO优化的衍生页面，无需编写重复代码。

## 架构说明

```
src/
├── pages/
│   └── ai-anime-generator/
│       └── [variant].tsx          # 动态路由处理变体页面
├── data/
│   └── variant-pages.json         # 所有变体页面的内容数据
├── Components/ToolsPage/
│   └── TemplateWrapper.tsx        # 模板包装器和数据注入逻辑
└── pages/
    └── ai-anime-generator.tsx     # 原始模板页面
```

## 快速开始

### 1. 添加新的衍生页面

编辑 `src/data/variant-pages.json`，添加新的变体：

```json
{
  "ai-anime-generator": {
    "baseTemplate": "ai-anime-generator",
    "variants": {
      "your-new-variant": {
        "seo": {
          "title": "你的页面标题",
          "metaDescription": "页面描述",
          "metaKeywords": "关键词1, 关键词2",
          "ogDescription": "社交媒体分享描述"
        },
        "content": {
          "header": {
            "title": "页面主标题",
            "subtitle": "页面副标题"
          },
          "sections": {
            "whatIs": {
              "title": "What is 标题",
              "description": "详细描述..."
            }
          },
          "examples": [
            {
              "title": "示例标题",
              "image": "/images/examples/your-variant/example1.webp",
              "alt": "图片描述"
            }
          ]
        }
      }
    }
  }
}
```

### 2. 页面访问

保存后，页面会自动在以下URL可访问：
- `baseURL/ai-anime-generator/your-new-variant`

## 详细流程

### 步骤 1: 关键词研究

1. **使用SEO工具分析**
   - Ahrefs, SEMrush, 或 Google Keyword Planner
   - 分析竞争对手关键词
   - 确定搜索量和竞争度

2. **关键词优先级评估**
   - 参考文档：[SEO Strategy Notion](https://www.notion.so/azurevision8/SEO-Strategy-1bf4d853a19f80cf8c5cc252cef5d8fd?pvs=4)
   - 评估标准：搜索量、竞争度、相关性、转化潜力

### 步骤 2: 内容创建

#### 2.1 编写文案内容

在 `variant-pages.json` 中填写以下内容：

**必填字段：**
- `seo.title` - 页面标题 (50-60字符)
- `seo.metaDescription` - 页面描述 (150-160字符)  
- `seo.metaKeywords` - 关键词列表
- `content.header.title` - 页面主标题
- `content.header.subtitle` - 页面副标题

**可选字段：**
- `content.sections.whatIs` - "What is" 章节
- `content.sections.howToUse` - "How to Use" 步骤
- `content.sections.whyUse` - "Why Use" 功能特点
- `content.sections.styles` - 样式类型说明
- `content.sections.applications` - 应用场景

#### 2.2 内容模板示例

```json
{
  "content": {
    "sections": {
      "howToUse": {
        "subtitle": "创建你的完美[主题]角色的4个简单步骤",
        "steps": [
          {
            "title": "描述你的角色",
            "content": "输入详细的角色描述，包括外观、特技等。"
          },
          {
            "title": "选择[主题]风格",
            "content": "从多种[主题]艺术风格中选择。"
          },
          {
            "title": "生成AI艺术",
            "content": "我们的AI创建你的角色，具有惊人的细节。"
          },
          {
            "title": "下载并分享",
            "content": "保存高分辨率的角色艺术并分享。"
          }
        ]
      }
    }
  }
}
```

### 步骤 3: 生成示例图片

#### 3.1 图片要求
- 格式：WebP（推荐）或 JPG
- 尺寸：最小 512x512，推荐 1024x1024
- 数量：每个变体至少3-6张示例图
- 命名规范：`/images/examples/[variant-name]/[character-name].webp`

#### 3.2 生成方式

**方式1：手动生成**
```bash
# 使用现有的AI工具生成
1. 打开 ai-anime-generator 页面
2. 输入相关prompt
3. 生成图片
4. 下载并保存到正确路径
```

**方式2：批量生成脚本（可选）**
```bash
# 创建图片生成脚本
node scripts/generate-images.mjs [variant-name]
```

#### 3.3 图片路径配置

在 `variant-pages.json` 中配置图片：

```json
{
  "examples": [
    {
      "title": "角色名称 Style",
      "image": "/images/examples/jujutsu-kaisen/yuji-itadori.webp",
      "alt": "AI generated Yuji Itadori character"
    }
  ]
}
```

### 步骤 4: 测试和验证

#### 4.1 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问页面
http://localhost:3001/ai-anime-generator/[variant-name]
```

#### 4.2 内容检查清单
- [ ] 页面标题正确显示
- [ ] SEO meta标签完整
- [ ] 所有文案内容正确替换
- [ ] 示例图片正常加载
- [ ] 移动端适配正常
- [ ] 页面加载速度合理

#### 4.3 SEO验证
```bash
# 检查页面SEO
- 使用 Lighthouse 分析
- 验证 meta 标签
- 检查结构化数据
- 确认内部链接
```

### 步骤 5: 批量管理

#### 5.1 批量生成工具
```bash
# 运行内容生成脚本
node scripts/generate-content.mjs

# 生成多个变体
node scripts/batch-generate.mjs --variants="variant1,variant2,variant3"
```

#### 5.2 内容更新脚本
```bash
# 更新现有变体内容
node scripts/update-variant.mjs [variant-name] [field-path] [new-value]

# 示例：更新标题
node scripts/update-variant.mjs jujutsu-kaisen content.header.title "新标题"
```

## 最佳实践

### 内容优化
1. **标题优化**
   - 包含主要关键词
   - 保持在60字符以内
   - 突出独特卖点

2. **描述优化**
   - 自然融入关键词
   - 描述具体功能和益处
   - 包含行动号召

3. **结构化内容**
   - 使用清晰的层次结构
   - 包含相关的长尾关键词
   - 保持内容的原创性

### 图片优化
1. **文件优化**
   - 使用 WebP 格式
   - 压缩文件大小
   - 添加描述性 alt 文本

2. **内容相关性**
   - 确保图片与主题高度相关
   - 展示多样化的风格
   - 包含受欢迎的角色/元素

### 维护管理
1. **定期更新**
   - 监控关键词排名
   - 更新过时的内容
   - 添加新的热门变体

2. **性能监控**
   - 跟踪页面访问量
   - 分析用户行为
   - 优化转化率

## 故障排除

### 常见问题

**问题1：页面显示默认内容，变体数据没有生效**
```bash
解决方案：
1. 检查 variant-pages.json 语法
2. 清除浏览器缓存
3. 重启开发服务器
4. 检查路由文件位置
```

**问题2：图片无法加载**
```bash
解决方案：
1. 检查图片路径是否正确
2. 确认图片文件存在
3. 检查文件权限
4. 验证图片格式支持
```

**问题3：SEO标签不生效**
```bash
解决方案：
1. 检查 Head 组件配置
2. 验证 meta 标签语法
3. 使用开发者工具检查
4. 测试社交媒体分享
```

## 扩展其他工具页面

### 添加新的基础模板

1. **创建新的模板包装**
```typescript
// 在现有工具页面中添加 useVariantData hook
import { useVariantData } from '../Components/ToolsPage/TemplateWrapper';

export default function YourToolPage() {
  const { isVariant, data, getContent } = useVariantData();
  // ... 使用变体数据
}
```

2. **添加到 variant-pages.json**
```json
{
  "your-tool-name": {
    "baseTemplate": "your-tool-name",
    "variants": {
      // ... 变体配置
    }
  }
}
```

3. **创建动态路由**
```typescript
// src/pages/your-tool-name/[variant].tsx
// 复制并修改现有的 [variant].tsx 文件
```

## 团队协作

### 角色分工
- **SEO专员**：关键词研究、内容策略
- **内容编辑**：文案编写、内容优化  
- **设计师**：示例图片生成、视觉优化
- **开发者**：技术实现、性能优化

### 工作流程
1. SEO专员提供关键词清单
2. 内容编辑编写页面文案
3. 设计师生成示例图片
4. 开发者更新JSON配置
5. 团队协作测试验证
6. 发布上线并监控效果

---

## 快速参考

### 文件路径
- 内容配置：`src/data/variant-pages.json`
- 图片目录：`public/images/examples/[variant-name]/`
- 路由文件：`src/pages/[tool-name]/[variant].tsx`

### 常用命令
```bash
# 开发服务器
npm run dev

# 构建项目
npm run build

# 生成内容
node scripts/generate-content.mjs

# 批量处理
node scripts/batch-operations.mjs
```

### 检查清单
- [ ] JSON语法正确
- [ ] 图片路径有效
- [ ] SEO标签完整
- [ ] 内容质量合格
- [ ] 页面功能正常 