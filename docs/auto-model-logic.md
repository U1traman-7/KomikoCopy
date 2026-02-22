# Auto Model 切换逻辑

## 概述

Auto Model 是一个智能模型选择功能，根据用户的输入内容（prompt、参考图片、角色提及等）自动选择最合适的图片生成模型。

## 核心文件

- **检测逻辑**: `src/Components/InfCanva/utils.tsx` 中的 `parseAutoModel` 函数 (line 764-901)
- **UI 显示**: `src/Components/RightSidebar/RightSidebar.tsx` (line 1154-1244)
- **角色数据**: `src/Components/RightSidebar/CharactersSelector.tsx`

## 决策优先级

Auto Model 按以下优先级检测并选择模型：

### 1. 多参考图片 → `Seedream`
```typescript
const hasMultipleRefs = Array.isArray(referenceImage) && referenceImage.length > 1;
if (hasMultipleRefs) {
  return 'Seedream';
}
```
- **触发条件**: 用户上传了 2 张或更多参考图片
- **选择模型**: Seedream
- **原因**: 多参考图片需要 Seedream 的多图片融合能力

### 2. 样式预设 `[...]` → `Art Pro` 或 `Gemini`
```typescript
const hasStylePreset = prompt.match(/\[.+?\]/);
if (hasStylePreset && hasGeneralStyle(prompt)) {
  return 'Gemini';
} else if (hasStylePreset) {
  return 'Art Pro';
}
```
- **触发条件**: prompt 中包含 `[风格名称]` 格式
- **选择模型**:
  - General styles (如 `[realistic]`, `[cinematic]` 等) → `Gemini`
  - 其他样式预设 → `Art Pro`
- **原因**: 样式预设是专门为动漫风格设计的，Art Pro 能更好地处理这些预设

### 3. 角色提及 `@` → 根据 `alt_prompt` 决定 ⭐️ **最高优先级**
```typescript
if (prompt.includes('@')) {
  // 检查角色是否有 alt_prompt
  // 有 alt_prompt → Art Pro
  // 无 alt_prompt → Seedream
  // ⚠️ 直接 return，不再检查参考图片！
}
```

**判断逻辑**:
- 提取 prompt 中所有 `@角色ID` 格式的提及
- 检查每个角色的 `alt_prompt` 字段：
  - **有 `alt_prompt`**: 角色有标准提示词，使用 `Art Pro` 生成
  - **无 `alt_prompt`**: 角色需要参考图片识别，使用 `Seedream`

**重要特性**:
- ⭐️ **角色提及优先于参考图片**：即使用户上传了参考图片，只要提及了有 `alt_prompt` 的角色，就会使用 Art Pro
- 理由：角色身份比参考图片更重要，用户通过 `@角色` 明确指定了角色，应该尊重这个选择

**特殊启发式规则**:
- 如果角色 ID 不在数据库中，会根据命名格式判断：
  - 包含括号 `(IP名称)` → 可能是官方角色 → 等待数据加载
  - 以 `-xxxx` 结尾 → 可能是 OC（自创角色）→ 使用 Seedream

**角色数据来源**:
1. `availableCharacters`: 用户已 collect/owned 的角色（完整数据）
2. `characterInfo`: 通过 API `/api/getCharacterAltPrompt` 获取的补充数据

### 4. 单参考图片 → `Seedream`
```typescript
const hasSingleRef = Array.isArray(referenceImage)
  ? referenceImage.length === 1
  : !!referenceImage;

if (hasSingleRef) {
  return 'Seedream';
}
```
- **触发条件**: 用户上传了 1 张参考图片，且**没有角色提及**
- **选择模型**: Seedream
- **原因**: 参考图片通常用于角色或风格参考，Seedream 能更好地保持一致性
- ⚠️ **注意**: 如果同时有角色提及（有 alt_prompt），会优先使用 Art Pro，忽略参考图片

### 5. 特殊语法 `<` → `Gemini`
```typescript
if (!prompt.includes('<')) {
  return 'Art Pro';
} else if ((prompt.match(/</g) || []).length === 1) {
  return 'Gemini';
} else {
  return 'Gemini';
}
```
- **触发条件**: prompt 中包含 `<` 符号（通常用于结构化提示）
- **选择模型**: Gemini
- **原因**: `<>` 语法通常用于复杂的结构化提示，Gemini 能更好地理解

### 6. 默认 → `Art Pro`
```typescript
return 'Art Pro';
```
- **触发条件**: 没有任何特殊条件
- **选择模型**: Art Pro
- **原因**: Art Pro 是通用的动漫风格模型，适合大多数场景

## UI 显示逻辑

### Sticky Auto Model
```typescript
const stickyAutoModelRef = useRef<GenerationModel | null>(null);
```

**特性**:
- 当 Auto Model 升级到非默认模型（如 Seedream）时，会记住这个选择
- 即使用户移除了触发条件，也会保持在该模型（"粘性"）
- 用户需要手动选择 "Auto Model" 才能重置

**原因**:
- 避免频繁切换模型造成用户困惑
- 保持生成结果的一致性

### 显示规则
- **默认模型 (Art Pro)**: 显示 "Auto Model"
- **非默认模型**: 显示实际模型名称（如 "Seedream", "Gemini"）

## 角色数据要求

所有角色数据源必须包含以下字段才能正确判断：

```typescript
interface Character {
  character_uniqid: string;        // 必需
  character_name: string;          // 必需
  character_pfp: string;           // 必需
  alt_prompt?: string;             // 关键字段！
  character_description?: string;  // 可选
}
```

### 重要说明
- `alt_prompt` 字段对 Auto Model 判断至关重要
- 所有角色数据来源都需要包含此字段：
  - Popular tab 角色
  - IP 分类角色
  - 缓存的角色数据
  - 用户 owned/collected 角色

## 调试

### 检查 Auto Model 决策
在浏览器控制台查看以下日志：
```javascript
// parseAutoModel 返回值
console.log('Detected model:', model);

// 角色数据
console.log('Available characters:', availableCharacters);
console.log('Character info:', characterInfo);
```

### 常见问题

**Q: 为什么角色提及后没有切换到正确的模型？**
A: 检查角色数据是否包含 `alt_prompt` 字段。如果缺失，Auto Model 会默认使用 Seedream。

**Q: 为什么模型一直停留在 Seedream？**
A: 这是 Sticky Auto Model 特性。用户需要手动选择 "Auto Model" 来重置。

**Q: Popular tab 的角色为什么行为不一致？**
A: 确保 Popular 角色数据包含 `alt_prompt` 字段（已在 CharactersSelector.tsx line 298-299 修复）。

**Q: 为什么角色提及 + 参考图片时，优先使用角色判断而不是参考图片？**
A: 设计理念是**用户意图优先**：
- 用户通过 `@角色` 明确指定了角色身份，这是**显式的选择**
- 参考图片可能只是用于姿势、场景或其他辅助参考
- 如果角色有 alt_prompt（标准提示词），Art Pro 可以直接生成，不需要依赖参考图片
- 这样的设计让用户体验更可预测：选择角色 → 使用该角色的推荐模型

## 测试场景

1. **多参考图片**: 上传 2+ 张图片 → 应显示 Seedream
2. **样式预设**: 输入 `[漫画风格]` → 应显示 Art Pro
3. **角色提及 (有 alt_prompt)**: 输入 `@Anya_(Spy_X_Family)` → 应显示 Art Pro
4. **角色提及 (无 alt_prompt)**: 输入 `@MyOC-1234` → 应显示 Seedream
5. **角色提及 + 参考图片 (有 alt_prompt)**: 输入 `@Ganyu_(Genshin_Impact)` + 1 张参考图 → 应显示 **Art Pro**（不是 Seedream！）
6. **角色提及 + 参考图片 (无 alt_prompt)**: 输入 `@MyOC-1234` + 1 张参考图 → 应显示 Seedream
7. **单参考图片 (无角色)**: 上传 1 张图片，无角色提及 → 应显示 Seedream
8. **默认**: 普通文本输入 → 应显示 Auto Model (实际使用 Art Pro)

## 更新日志

### 2024-12-23

**Bug 修复 #1: 角色数据缺少 alt_prompt 字段（CharactersSelector）**
- 修复 Popular tab 角色缺少 `alt_prompt` 字段的问题
- 修复 IP 分类角色缺少 `alt_prompt` 字段的问题
- 修复缓存加载角色缺少 `alt_prompt` 字段的问题
- 更新 `SingleCharacter` 接口定义
- **文件**: `src/Components/RightSidebar/CharactersSelector.tsx`

**Bug 修复 #2: 角色提及被参考图片优先级覆盖**
- **问题**: 当用户同时使用角色提及（有 alt_prompt）和参考图片时，单参考图片的判断会覆盖角色 alt_prompt 的判断，导致错误地切换到 Seedream
- **示例**: `@Ganyu_(Genshin_Impact)` (有 alt_prompt) + 1 张参考图 → 错误显示 Seedream，应该显示 Art Pro
- **修复**: 角色提及判断后直接 return，不再继续检查参考图片
- **理由**: 角色身份比参考图片更重要，用户通过 `@角色` 明确指定了角色，应该优先尊重这个选择
- **影响**: 现在角色提及（Priority 3）实际上是除了多参考图片（Priority 1）和样式预设（Priority 2）之外的最高优先级
- **文件**: `src/Components/InfCanva/utils.tsx`

**Bug 修复 #3: getOwnedCharacters API 缺少 alt_prompt 字段** ⭐️ **根本原因**
- **问题**: `/api/getOwnedCharacters` API 默认只返回基本字段，不包含 `alt_prompt`
  - `BASIC_OWNED_FIELDS` 缺少 `alt_prompt` 和 `character_description`
  - 导致 `useOwnedCharacters` → `useCharacterMention` → `availableCharacters` 数据缺少 `alt_prompt`
  - Auto Model 判断时 `!!character.alt_prompt` 为 `false`，错误地使用 Seedream
- **调试发现**:
  - Popular API 返回的 Ganyu: `alt_prompt: "Ganyu (Genshin Impact)"` ✓
  - Owned Characters API 返回的 Ganyu: `alt_prompt: undefined` ✗
- **修复**:
  - 将 `alt_prompt` 和 `character_description` 添加到 `BASIC_OWNED_FIELDS` 和 `BASIC_COLLECTED_FIELDS`
  - 在基本模式的数据转换中也包含这两个字段
  - 添加注释说明这些字段对 Auto Model 检测至关重要
- **文件**: `api/getOwnedCharacters.ts`
- **影响**: 所有 owned/collected 角色现在都会正确返回 `alt_prompt`，Auto Model 能正确判断
