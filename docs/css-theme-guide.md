# CSS 主题系统使用指南

> 本文档基于 2025-02 的主题系统重构，说明如何在新页面/组件中正确使用颜色和样式。

## 核心原则

### ✅ 单一真值源：NextUI 主题
- **主题定义在 `tailwind.config.mjs` 的 NextUI 插件中**
- `caffelabs` 主题 = Light Mode
- `caffelabs-dark` 主题 = Dark Mode
- 色板 **50↔900 已反转**，无需手动写 `dark:` 覆盖

### ❌ 避免的做法
- ❌ **禁止写 `dark:border-primary-400`、`dark:bg-primary-200` 等**（色板已自动反转）
- ❌ **禁止硬编码 hex 颜色**（如 `#563AFA`、`#DFD7FE`）
- ❌ **禁止使用 `text-black`、`text-white`、`dark:text-white` 等硬编码颜色**（深色模式会失效，未来修改主题困难）
- ❌ **禁止写 `border-gray-200`**（深色模式边框不可见）

> ⚠️ **严格禁止硬编码规则**：任何 `text-white`、`text-black`、`bg-white`、`bg-black` 及其 `dark:` 变体都是**绝对禁止**的。必须使用语义化颜色类（`text-foreground`、`bg-card` 等）。

---

## 🚫 硬编码颜色禁止清单

**以下颜色类在项目中绝对禁止使用，违反者必须修改：**

### 禁止的文字颜色
- ❌ `text-white`
- ❌ `text-black`
- ❌ `dark:text-white`
- ❌ `dark:text-black`
- ❌ `text-gray-*`（如 `text-gray-600`、`text-gray-400` 等）
- ❌ `dark:text-gray-*`

**✅ 正确替代方案：**
- 主要文字 → `text-foreground`
- 次要文字 → `text-muted-foreground`
- 品牌色文字 → `text-primary-600`（自动反转）
- 在深色背景上的白色文字 → `text-primary-foreground` 或在按钮中使用 NextUI 的 `color` prop

### 禁止的背景颜色
- ❌ `bg-white`
- ❌ `bg-black`
- ❌ `dark:bg-white`
- ❌ `dark:bg-black`
- ❌ `bg-gray-*`（除非在特殊情况下使用 `dark:!bg-gray-700` 作为输入框背景）

**✅ 正确替代方案：**
- 页面背景 → `bg-background`
- 卡片背景 → `bg-card`
- Hover 态 → `bg-muted`
- 输入框背景（特例）→ `bg-input` 或 `dark:!bg-gray-700`（仅限 NextUI 组件覆盖）

### 禁止的边框颜色
- ❌ `border-white`
- ❌ `border-black`
- ❌ `border-gray-*`（如 `border-gray-200`、`border-gray-700` 等）
- ❌ `dark:border-gray-*`

**✅ 正确替代方案：**
- 通用边框 → `border-border`
- 品牌色边框 → `border-primary-200`（自动反转）

### 示例对比

```tsx
// ❌ 严格禁止
<div className="text-white dark:text-white">Title</div>
<button className="bg-white dark:bg-black">Click</button>
<input className="text-gray-600 dark:text-gray-400" />
<div className="border-gray-200 dark:border-gray-700">Content</div>

// ✅ 正确做法
<div className="text-foreground">Title</div>
<button className="bg-card">Click</button>
<input className="text-foreground" />
<div className="border-border">Content</div>
```

---

## 颜色系统分类

### 1. 品牌主色（Primary）- 自动反转色板

#### Light Mode (caffelabs)
```js
primary: {
  50:  '#f4f1fe',  // 极浅紫
  100: '#DFD7FE',  // 浅紫
  200: '#BFB0FE',
  300: '#9D88FD',
  400: '#826AFB',
  500: '#563AFA',  // 品牌主色
  600: '#402AD7',
  700: '#2E1DB3',
  800: '#1F1290',
  900: '#140B77',  // 极深紫
  DEFAULT: '#563AFA'
}
```

#### Dark Mode (caffelabs-dark) - **50↔900 反转**
```js
primary: {
  50:  '#140B77',  // 极深紫 (原900)
  100: '#1F1290',  // 深紫   (原800)
  200: '#2E1DB3',  //        (原700)
  300: '#402AD7',
  400: '#826AFB',
  500: '#563AFA',
  600: '#9D88FD',
  700: '#BFB0FE',
  800: '#DFD7FE',
  900: '#f4f1fe',  // 极浅紫 (原50)
  DEFAULT: '#826AFB'
}
```

#### 正确用法示例

```tsx
// ✅ 正确：无需 dark: 覆盖，自动适配
<div className="bg-primary-100 border border-primary-200">
  <span className="text-primary-700">Title</span>
</div>

// ❌ 错误：多余的 dark: 覆盖
<div className="bg-primary-100 dark:bg-primary-800 border border-primary-200 dark:border-primary-700">
  <span className="text-primary-700 dark:text-primary-300">Title</span>
</div>

// ❌ 错误：硬编码 hex
<div className="bg-[#DFD7FE] border-[#BFB0FE]">
  <span className="text-[#563AFA]">Title</span>
</div>
```

---

### 2. 语义色（Semantic Colors）- 使用 CSS 变量

这些颜色**已在 `global.css` 中针对 `.dark` 定义了不同值**，无需写 `dark:` 覆盖。

#### 背景与前景
| Token | 用途 | 示例 |
|-------|------|------|
| `bg-background` | 页面/容器背景 | `<div className="bg-background">` |
| `text-foreground` | 主要文字颜色 | `<span className="text-foreground">` |
| `bg-card` | 卡片背景 | `<Card className="bg-card">` |

#### 边框与输入
| Token | 用途 | 示例 |
|-------|------|------|
| `border-border` | 通用边框 | `<div className="border border-border">` |
| `bg-input` | 输入框背景 | `<input className="bg-input">` |

#### 弱化与高亮
| Token | 用途 | 示例 |
|-------|------|------|
| `bg-muted` | 弱化背景（hover 态） | `<button className="hover:bg-muted">` |
| `text-muted-foreground` | 次要文字/图标 | `<span className="text-muted-foreground">` |
| `bg-accent` | 强调/选中背景 | `<div className="bg-accent">` |

#### 状态色
| Token | 用途 | 示例 |
|-------|------|------|
| `bg-destructive` | 危险操作 | `<Button className="bg-destructive">Delete</Button>` |
| `bg-success` | 成功状态 | `<div className="bg-success">Saved!</div>` |
| `bg-warning` | 警告状态 | `<Alert className="bg-warning">` |
| `bg-info` | 信息提示 | `<div className="bg-info">` |

#### 正确用法示例

```tsx
// ✅ 正确：自动适配深色模式
<div className="bg-card border border-border">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ 错误：手动深色覆盖（多余）
<div className="bg-card dark:bg-gray-800 border border-border dark:border-gray-700">
  <h2 className="text-foreground dark:text-white">Title</h2>
</div>

// ❌ 错误：硬编码颜色
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
  <h2 className="text-black dark:text-white">Title</h2>
</div>
```

---

## 常见场景速查

### 场景 1: 卡片组件

```tsx
// ✅ 正确
<Card className="bg-card border border-border shadow-md">
  <CardHeader>
    <h3 className="text-foreground font-semibold">Card Title</h3>
  </CardHeader>
  <CardBody>
    <p className="text-muted-foreground">Card description</p>
  </CardBody>
</Card>

// ❌ 错误（硬编码 + 多余 dark:）
<Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
  <h3 className="text-black dark:text-white">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Card description</p>
</Card>
```

---

### 场景 2: 按钮样式

```tsx
// ✅ 正确：品牌主按钮（使用 NextUI color prop）
<Button color="primary">
  Submit
</Button>

// ✅ 正确：品牌主按钮（手动样式）
<Button className="bg-primary-500 text-primary-foreground hover:bg-primary-600">
  Submit
</Button>

// ✅ 正确：次要按钮
<Button className="bg-muted text-foreground hover:bg-accent">
  Cancel
</Button>

// ✅ 正确：危险按钮（使用 NextUI color prop）
<Button color="danger">
  Delete
</Button>

// ✅ 正确：危险按钮（手动样式）
<Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</Button>

// ❌ 错误（硬编码 text-white）
<Button className="bg-primary-500 text-white hover:bg-primary-600">
  Submit
</Button>

// ❌ 错误（硬编码 hex）
<Button className="bg-[#563AFA] hover:bg-[#402AD7] text-white">
  Submit
</Button>

// ❌ 错误（多余 dark:）
<Button className="bg-primary-500 dark:bg-primary-600 text-foreground">
  Submit
</Button>
```

---

### 场景 3: 边框与分割线

```tsx
// ✅ 正确：通用边框
<div className="border border-border rounded-lg">
  Content
</div>

// ✅ 正确：分割线
<div className="h-px bg-border" />

// ✅ 正确：品牌色边框（自动反转）
<div className="border-2 border-primary-200 rounded-lg">
  Highlighted content
</div>

// ❌ 错误（硬编码灰色）
<div className="border border-gray-200 dark:border-gray-700">
  Content
</div>

// ❌ 错误（硬编码 hex）
<div className="border border-[#9D88FD]">
  Content
</div>

// ❌ 错误（多余 dark:）
<div className="border border-primary-200 dark:border-primary-800">
  Content
</div>
```

---

### 场景 4: 文字颜色

```tsx
// ✅ 正确：主文字
<h1 className="text-foreground">Heading</h1>

// ✅ 正确：次要文字
<p className="text-muted-foreground">Description</p>

// ✅ 正确：品牌色文字（自动反转）
<span className="text-primary-600">Highlighted</span>

// ❌ 错误（黑白硬编码）
<h1 className="text-black dark:text-white">Heading</h1>

// ❌ 错误（硬编码灰色）
<p className="text-gray-600 dark:text-gray-400">Description</p>

// ❌ 错误（多余 dark:）
<span className="text-primary-600 dark:text-primary-400">Highlighted</span>
```

---

### 场景 5: 背景色与 Hover 态

```tsx
// ✅ 正确：hover 态使用 muted
<button className="bg-card hover:bg-muted transition-colors">
  Click me
</button>

// ✅ 正确：品牌色背景（自动反转）
<div className="bg-primary-100 border border-primary-200">
  Highlighted section
</div>

// ❌ 错误（硬编码灰色）
<button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
  Click me
</button>

// ❌ 错误（硬编码 hex）
<div className="bg-[#DFD7FE] border-[#BFB0FE]">
  Content
</div>
```

---

### 场景 6: 输入框与表单

```tsx
// ✅ 正确
<input
  type="text"
  className="bg-input border border-border text-foreground placeholder:text-muted-foreground"
  placeholder="Enter text..."
/>

// ✅ 正确：focus 态
<input
  type="text"
  className="bg-input border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
/>

// ❌ 错误（硬编码）
<input
  type="text"
  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-400"
/>
```

---

## NextUI 组件专用 Token

NextUI 组件会自动使用以下 CSS 变量（定义在 `caffelabs`/`caffelabs-dark` 主题中）：

| NextUI Token | 映射 | 用途 |
|--------------|------|------|
| `bg-default-100` | `--nextui-default-100` | 默认浅灰背景 |
| `text-default-400` | `--nextui-default-400` | 次要文字颜色 |
| `bg-content1` | `--nextui-content1` | 卡片内容背景 |

```tsx
// ✅ 正确：使用 NextUI default token
<Button variant="flat" className="bg-default-100">
  Cancel
</Button>

// ✅ 正确：使用 NextUI color prop
<Button color="primary">
  Submit
</Button>

// ❌ 错误：硬编码 + 多余 dark:
<Button className="bg-gray-100 dark:bg-gray-800">
  Cancel
</Button>
```

---

## 迁移旧代码 Checklist

遇到旧代码时，按以下顺序替换：

### 1. 替换硬编码 hex 颜色

| 旧代码 | 新代码 |
|--------|--------|
| `bg-[#563AFA]` | `bg-primary-500` |
| `bg-[#DFD7FE]` | `bg-primary-100` |
| `border-[#9D88FD]` | `border-primary-300` |
| `text-[#343434]` | `text-foreground` |

### 2. 替换硬编码黑白灰色 token

| 旧代码 | 新代码 | 说明 |
|--------|--------|------|
| `text-black` | `text-foreground` | 主要文字颜色 |
| `text-white` | `text-foreground` | **绝对禁止**，改用语义色 |
| `dark:text-white` | `text-foreground` | **绝对禁止**，语义色自动适配 |
| `text-gray-600` | `text-muted-foreground` | 次要文字颜色 |
| `dark:text-gray-400` | `text-muted-foreground` | **绝对禁止**，语义色自动适配 |
| `bg-white` | `bg-background` 或 `bg-card` | **绝对禁止**，改用语义色 |
| `bg-black` | `bg-background` | **绝对禁止**，改用语义色 |
| `bg-gray-100` | `bg-muted` 或 `bg-card` | 根据用途选择 |
| `dark:bg-gray-800` | `bg-card` | **绝对禁止**，语义色自动适配 |
| `border-gray-200` | `border-border` | 通用边框 |
| `dark:border-gray-700` | `border-border` | **绝对禁止**，语义色自动适配 |

### 3. 删除多余的 `dark:` 覆盖

| 旧代码 | 新代码 |
|--------|--------|
| `bg-primary-100 dark:bg-primary-800` | `bg-primary-100` |
| `border-primary-200 dark:border-primary-800` | `border-primary-200` |
| `text-primary-700 dark:text-primary-300` | `text-primary-700` |

### 4. 特殊情况：确实需要 `dark:` 的场景

**仅在以下情况才需要 `dark:` 覆盖：**

#### 情况 1: 使用 NextUI default token 时
```tsx
// ✅ 需要：default token 未反转
<Button className="bg-default-100 dark:bg-default-700">
  Button
</Button>
```

#### 情况 2: 透明度/渐变等特殊效果
```tsx
// ✅ 需要：opacity 不同
<div className="bg-primary-500/10 dark:bg-primary-500/20">
  Overlay
</div>
```

#### 情况 3: 使用非反转的自定义语义色
```tsx
// ✅ 需要：自定义变量在 global.css 中有不同定义
<div className="bg-card dark:bg-card">
  <!-- bg-card 在 :root 和 .dark 中值不同，但 Tailwind 不会自动切换 -->
</div>
```

> ⚠️ **99% 的情况下不需要写 `dark:`**，只在上述三种特殊场景才需要。

---

## FAQ

### Q1: 为什么不需要写 `dark:border-primary-800`？
**A:** 因为 `caffelabs-dark` 主题的 `primary-800` 本质上就是 light 模式的 `primary-100`（反转了）。当你写 `border-primary-200` 时：
- Light mode: `#BFB0FE` (浅紫)
- Dark mode: `#2E1DB3` (深紫) ← 自动使用 caffelabs-dark 的 `primary-200`

### Q2: 什么时候用 `bg-card`，什么时候用 `bg-background`？
**A:**
- `bg-background`: 页面/容器级背景（通常是 `<body>` 或 `<main>`）
- `bg-card`: 卡片/弹窗/面板背景（比 background 稍亮）

### Q3: `text-muted-foreground` 和 `text-foreground` 的区别？
**A:**
- `text-foreground`: 主要文字（标题、正文）
- `text-muted-foreground`: 次要文字（描述、占位符、图标）

### Q4: 遇到 NextUI 组件深色模式文字看不清怎么办？
**A:** 优先使用 NextUI 的 `color` prop，其次手动加 `text-foreground`：
```tsx
// 方案 1: 使用 NextUI color prop
<Button color="primary">Submit</Button>

// 方案 2: 手动加 text-foreground
<Button className="text-foreground">Submit</Button>
```

### Q5: 如何快速检查是否有硬编码颜色？
**A:** 搜索以下正则：
```bash
# 搜索 hex 颜色
text-\[#|bg-\[#|border-\[#

# 搜索多余的 dark:primary
dark:(bg|border|text)-primary-

# 搜索硬编码黑白（严格禁止）
text-white|text-black|bg-white|bg-black|dark:text-white|dark:text-black

# 搜索硬编码灰色（严格禁止）
text-gray-|bg-gray-|border-gray-|dark:text-gray-|dark:bg-gray-|dark:border-gray-
```

**检查命令示例：**
```bash
# 在整个 src 目录搜索硬编码颜色
grep -r "text-white\|text-black\|dark:text-white" src/

# 使用 ripgrep (更快)
rg "text-white|text-black|dark:text-white" src/
```

---

## 总结：四不原则（严格遵守）

1. ❌ **不硬编码 hex**：用 `primary-*` / `secondary-*` 色板
2. ❌ **不写 `dark:` 覆盖**：色板已反转，语义色已定义（99% 情况）
3. ❌ **不用 `text-black`/`text-white`/`bg-white`/`bg-black`**：**绝对禁止**，必须用语义色
4. ❌ **不写 `dark:text-white` 等 dark 前缀的硬编码颜色**：**绝对禁止**，语义色自动适配

### 为什么禁止硬编码？

1. **可维护性**：未来修改主题配色时，硬编码的颜色需要逐个文件修改
2. **一致性**：语义色确保整个应用的颜色使用一致，避免出现多种"白色"
3. **Dark Mode 支持**：语义色自动适配深色模式，硬编码会导致深色模式失效
4. **团队协作**：语义色名称清晰表达用途，新成员更容易理解代码

### 正确的开发流程

1. 需要主要文字颜色？ → 使用 `text-foreground`
2. 需要次要文字颜色？ → 使用 `text-muted-foreground`
3. 需要背景颜色？ → 使用 `bg-background`、`bg-card`、`bg-muted`
4. 需要边框颜色？ → 使用 `border-border`
5. 需要品牌色？ → 使用 `bg-primary-500`、`text-primary-600`（自动反转）
6. 需要按钮样式？ → 优先使用 NextUI 的 `color` prop

**记住：如果你想写 `text-white` 或 `dark:text-white`，停下来思考应该用哪个语义色！**

遵循这四原则，深色模式就能"自动生效"，代码更易维护，团队协作更顺畅。

---

**最后更新**: 2025-02
**维护者**: Mr. K
**相关文件**: `tailwind.config.mjs`, `src/styles/global.css`
