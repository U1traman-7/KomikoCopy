# i18n 列方案 - 完整指南

## 📖 方案概述

添加一个独立的 `i18n` 列来存储所有翻译，保留原始文本列不变。

### 数据结构

```javascript
// 数据库中的一条记录
{
  id: 123,
  character_name: "Aria",
  intro: "A brave warrior",           // ← 原始列保持不变
  personality: "Kind and gentle",     // ← 原始列保持不变
  interests: "Reading",               // ← 原始列保持不变

  // 新增 i18n 列 ↓
  i18n: {
    "intro": {
      "en": "A brave warrior",
      "zh-CN": "一位勇敢的战士",
      "ja": "勇敢な戦士",
      "ko": "용감한 전사"
    },
    "personality": {
      "en": "Kind and gentle",
      "zh-CN": "善良温柔",
      "ja": "優しくて穏やか"
    },
    "interests": {
      "en": "Reading",
      "zh-CN": "阅读",
      "ja": "読書"
    }
  }
}
```


## 🚀 实施步骤

### 步骤 1: 添加 i18n 列

在 Supabase SQL Editor 中运行：

```sql
-- 添加 i18n 列
ALTER TABLE "CustomCharacters"
ADD COLUMN IF NOT EXISTS i18n jsonb DEFAULT NULL;

-- 添加索引（可选但推荐）
CREATE INDEX IF NOT EXISTS idx_characters_i18n
ON "CustomCharacters" USING gin(i18n);
```

**执行时间：** < 1 秒
**影响：** 零风险，不影响现有功能

### 步骤 2: 初始化现有数据（可选）

```sql
-- 为已有角色初始化英文版本
UPDATE "CustomCharacters"
SET i18n = jsonb_build_object(
  'intro', CASE
    WHEN intro IS NOT NULL AND intro != ''
    THEN jsonb_build_object('en', intro)
    ELSE NULL
  END,
  'personality', CASE
    WHEN personality IS NOT NULL AND personality != ''
    THEN jsonb_build_object('en', personality)
    ELSE NULL
  END,
  'interests', CASE
    WHEN interests IS NOT NULL AND interests != ''
    THEN jsonb_build_object('en', interests)
    ELSE NULL
  END
)
WHERE i18n IS NULL
  AND (intro IS NOT NULL OR personality IS NOT NULL);
```

**执行时间：** 取决于数据量（1000条约1-2秒）
**说明：** 可以跳过此步骤，只在需要翻译时才添加

### 步骤 3: 批量翻译

使用 `translate-with-i18n-column.cjs` 脚本进行批量翻译：

```bash
# 基本用法
node scripts/db-character-i18n/translate-with-i18n-column.cjs [limit] [offset]

# 参数说明
#   --id=<uniqid>       翻译指定角色
#   --is-official       只翻译官方角色
#   --skip-translated   跳过已有 forceTranslate 的记录（增量翻译）
#   --limit=<n>         限制翻译数量
#   [limit] [offset]    位置参数方式指定限制和偏移
```

**使用示例：**

```bash
# 翻译全部官方角色
node scripts/db-character-i18n/translate-with-i18n-column.cjs --is-official

# 翻译官方角色，限制100条
node scripts/db-character-i18n/translate-with-i18n-column.cjs --is-official --limit=100

# 增量翻译：只翻译还没翻译过的记录
node scripts/db-character-i18n/translate-with-i18n-column.cjs --skip-translated

# 翻译指定角色
node scripts/db-character-i18n/translate-with-i18n-column.cjs --id=abc123

# 结合多个参数
node scripts/db-character-i18n/translate-with-i18n-column.cjs --is-official --skip-translated --limit=50
```

**`--skip-translated` 参数说明：**

当启用此参数时，脚本会检查每条记录的 `i18n.forceTranslate` 字段：
- 如果 `forceTranslate` 存在且为 `true`，表示该记录已经翻译过，将跳过
- 如果 `forceTranslate` 不存在，表示该记录未翻译，将进行翻译

这对于增量翻译非常有用，避免重复翻译已处理的记录。

### 步骤 4: 测试翻译功能

```bash
# 先测试少量数据
node scripts/db-character-i18n/translate-with-i18n-column.cjs --limit=5
```

### 步骤 5: 验证前端显示

访问任意角色页面，切换语言查看效果。

## 💻 前端代码示例

### 读取翻译数据

```typescript
import { getLocalizedField } from '../../utils/i18nText';
import { useTranslation } from 'react-i18next';

function CharacterCard({ charData }) {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language || 'en';

  // 自动处理 i18n 列、多语言对象和普通字符串
  const intro = getLocalizedField(charData, 'intro', currentLocale);
  const personality = getLocalizedField(charData, 'personality', currentLocale);

  return (
    <div>
      <p>{intro}</p>
      <p>{personality}</p>
    </div>
  );
}
```

### 优先级处理

`getLocalizedField` 函数会按以下优先级查找：

1. **i18n 列** - `charData.i18n.intro['zh-CN']` ← 优先
2. **多语言对象** - `charData.intro['zh-CN']` ← 兼容旧格式
3. **原始字符串** - `charData.intro` ← 向后兼容

## 🔄 数据同步策略

### 方案 A: 按需翻译（推荐）

只在用户请求时才翻译，节省成本：

```typescript
// 角色编辑页面添加"翻译"按钮
const handleTranslate = async () => {
  const translations = await translateFields({
    intro: charData.intro,
    personality: charData.personality,
    interests: charData.interests,
  });

  // 更新 i18n 列
  await updateCharacter({
    id: charData.id,
    i18n: translations
  });
};
```

### 方案 B: 自动翻译

在创建/更新角色时自动翻译：

```typescript
// API 中自动处理
async function createCharacter(data) {
  // 创建角色
  const character = await db.insert(data);

  // 后台异步翻译
  translateCharacterInBackground(character.id);

  return character;
}
```

### 方案 C: 批量翻译

定期批量翻译热门角色：

```bash
# 翻译浏览量 > 1000 的角色
node scripts/translate-popular-characters.cjs
```

## 📊 查询示例

### SQL 查询

```sql
-- 1. 获取中文简介（有翻译用翻译，没有用原文）
SELECT
  character_name,
  COALESCE(
    i18n->'intro'->>'zh-CN',  -- 优先中文翻译
    i18n->'intro'->>'en',     -- 其次英文翻译
    intro                      -- 最后原文
  ) AS intro_cn
FROM "CustomCharacters";

-- 2. 查找已翻译的角色
SELECT character_name, i18n
FROM "CustomCharacters"
WHERE i18n IS NOT NULL
  AND i18n->'intro' ? 'zh-CN';

-- 3. 统计翻译覆盖率
SELECT
  COUNT(*) as total,
  COUNT(i18n) as translated,
  ROUND(COUNT(i18n)::numeric / COUNT(*)::numeric * 100, 2) as coverage_pct
FROM "CustomCharacters";
```

### JavaScript/TypeScript 查询

```typescript
// 使用 Supabase 查询
const { data } = await supabase
  .from('CustomCharacters')
  .select('*, i18n')
  .eq('character_uniqid', id);

// 前端自动处理
const intro = getLocalizedField(data, 'intro', currentLocale);
```

## 🎯 最佳实践

### 1. 渐进式翻译

```typescript
// 优先翻译热门角色
const popularCharacters = await db
  .from('CustomCharacters')
  .select('*')
  .order('num_gen', { descending: true })
  .limit(100);

for (const char of popularCharacters) {
  await translateAndUpdateCharacter(char);
}
```

### 2. 缓存翻译结果

```typescript
// 翻译一次，永久使用
if (!charData.i18n || !charData.i18n.intro['zh-CN']) {
  const translated = await translateText(charData.intro, 'zh-CN');
  await updateI18n(charData.id, { intro: { 'zh-CN': translated } });
}
```

### 3. 手动优化

在管理后台提供编辑界面，让用户手动优化AI翻译：

```typescript
<TranslationEditor
  field="intro"
  translations={charData.i18n?.intro}
  onSave={(updatedTranslations) => {
    updateI18n(charData.id, { intro: updatedTranslations });
  }}
/>
```

## 🔧 维护和监控

### 检查数据完整性

```sql
-- 查找 i18n 和原文不一致的记录
SELECT id, character_name
FROM "CustomCharacters"
WHERE i18n->'intro'->>'en' IS NOT NULL
  AND i18n->'intro'->>'en' != intro;
```

### 清理无效翻译

```sql
-- 删除空翻译
UPDATE "CustomCharacters"
SET i18n = i18n - 'intro'
WHERE i18n->'intro'->>'en' = '';
```

## 📈 性能优化

### 1. 使用 GIN 索引

```sql
CREATE INDEX idx_i18n_intro ON "CustomCharacters"
USING gin((i18n->'intro'));
```

### 2. 按需加载

```typescript
// 只在需要时查询 i18n
const { data } = await supabase
  .from('CustomCharacters')
  .select('id, character_name, intro')  // 基础查询
  .eq('id', id);

// 切换语言时才加载 i18n
if (locale !== 'en') {
  const { data: i18nData } = await supabase
    .from('CustomCharacters')
    .select('i18n')
    .eq('id', id)
    .single();
}
```

### 3. CDN 缓存

```typescript
// 缓存热门角色的翻译
const cacheKey = `character:${id}:${locale}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

## 🔄 迁移到生产环境

### 完整流程

```sql
-- 1. 添加列（立即执行，零风险）
ALTER TABLE "CustomCharacters"
ADD COLUMN IF NOT EXISTS i18n jsonb;

-- 2. 创建索引（立即执行）
CREATE INDEX idx_characters_i18n
ON "CustomCharacters" USING gin(i18n);

-- 3. 初始化数据（可选，可以跳过）
-- 见步骤 2

-- 4. 批量翻译（逐步执行，可中断）
-- 使用脚本分批翻译
```

### 回滚方案

如果需要回滚：

```sql
-- 删除索引
DROP INDEX IF EXISTS idx_characters_i18n;

-- 删除列
ALTER TABLE "CustomCharacters"
DROP COLUMN IF EXISTS i18n;
```

完全无风险！

## 💰 成本估算

假设你有 10,000 个角色：

- **存储成本**：约增加 20MB（可忽略）
- **翻译成本**：使用 Gemini 免费（有配额）
- **API 调用**：10,000 × 5 字段 × 13 语言 = 650,000 次
- **执行时间**：约 3-5 小时（批量翻译）

**推荐策略**：只翻译访问量 > 100 的角色（约 10-20%）

## 🎉 总结

### 为什么选择 i18n 列方案？

1. ✅ **零风险** - 不影响现有功能
2. ✅ **可回滚** - 随时可以删除
3. ✅ **渐进式** - 逐步添加翻译
4. ✅ **灵活性** - 可以混合使用
5. ✅ **易维护** - 代码改动最小

### 下一步

1. 运行 `add-i18n-column.sql`
2. 翻译 5 条测试数据
3. 验证前端显示
4. 逐步推广到更多角色

需要帮助随时告诉我！
