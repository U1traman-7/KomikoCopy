# 模板使用统计同步方案

## 概述

为了在展示模板时按照**使用热度**排序，同时保持良好的查询性能，我们采用了**数据库字段同步**的方案。

## 排序规则

模板按照以下优先级排序：

1. **order 字段**：优先按 order 升序排列（有 order 的在前）
2. **usage_count 字段**：order 相同时，按使用热度降序排列
3. **created_at 字段**：都没有 order 且热度相同时，按创建时间升序排列

## 数据库变更

### 添加字段到 `style_templates` 表

```sql
ALTER TABLE style_templates
ADD COLUMN usage_count INTEGER DEFAULT 0;

-- 添加索引以提升查询性能
CREATE INDEX idx_style_templates_usage_count ON style_templates(usage_count DESC);
```

## 同步机制

### 1. 定时任务（Vercel Cron）

Cron Job 每 6 小时自动执行一次，将 `style_usage_stats` 表中的数据同步到 `style_templates.usage_count`。

**配置文件**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-template-usage",
      "schedule": "0 */6 * * *" // 每6小时执行
    }
  ]
}
```

**API 端点**: `/api/cron/sync-template-usage`

### 2. 手动同步脚本

用于本地开发或紧急更新：

```bash
# 运行同步脚本
npx tsx scripts/sync-template-usage.ts

# 或使用 node
node --loader ts-node/esm scripts/sync-template-usage.ts
```

## ID 格式处理

- `style_templates.id`: `neon-sign-i` 或 `neon-sign-v`（带后缀）
- `style_usage_stats.style_id`: `neon-sign`（不带后缀）

同步脚本使用 `cleanTemplateId()` 函数自动处理 ID 差异：

```typescript
const cleanTemplateId = (id: string) => id.replace(/-(v|i)$/, '');
```

## 性能优化

### 缓存机制

- API 响应缓存 5 分钟
- 减少数据库查询频率
- 用户感知不到数据延迟

### 查询优化

- 单表查询，无需连表
- 使用索引加速排序
- 批量更新减少数据库压力

### 性能对比

| 方案                 | 查询复杂度 | 响应时间  | 数据实时性    |
| -------------------- | ---------- | --------- | ------------- |
| 实时连表             | 高         | ~500ms    | 实时          |
| **字段同步（当前）** | **低**     | **~50ms** | **5分钟延迟** |
| 客户端排序           | 中         | ~200ms    | 实时但前端慢  |

## 工具映射关系

同步脚本会查询以下工具的使用统计：

```typescript
const TOOL_MAPPING = {
  playground: 'playground',
  'video-to-video': 'video-to-video',
  'ai-video-effect': 'ai-video-effect',
  'ai-animation-generator': 'ai-animation-generator',
  'ai-expression-changer': 'ai-expression-changer',
  'dance-video-generator': 'dance-video-generator',
};
```

## 监控与调试

### 查看同步日志

**Vercel Dashboard**:

- Functions → Cron Jobs → sync-template-usage

### 手动触发同步

```bash
# 使用 curl 手动触发（需要 CRON_SECRET）
curl -X GET https://your-domain.com/api/cron/sync-template-usage \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 检查同步结果

```sql
-- 查看有使用数据的模板
SELECT id, name_key, usage_count, "order"
FROM style_templates
WHERE usage_count > 0
ORDER BY usage_count DESC
LIMIT 20;

-- 对比原始统计数据
SELECT tool, style_id, usage_count
FROM style_usage_stats
ORDER BY usage_count DESC
LIMIT 20;
```

## 环境变量

确保配置以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_secret_key_for_cron  # 用于验证 Cron Job 请求
```

## 故障排查

### 问题：usage_count 未更新

**检查步骤：**

1. 确认 Cron Job 是否正常执行
2. 查看 Vercel Logs 是否有错误
3. 手动运行同步脚本测试
4. 检查数据库字段是否存在

### 问题：排序不符合预期

**检查步骤：**

1. 确认 `order` 字段是否正确设置
2. 清除 API 缓存（等待 5 分钟）
3. 检查 `usage_count` 是否为最新值

## 未来优化

- [ ] 使用 Redis 缓存热门模板列表
- [ ] 实现增量同步而非全量同步
- [ ] 添加数据库触发器实时更新热度
- [ ] 添加 Webhook 通知同步状态

## 相关文件

- `api/getStyleTemplates.ts` - 模板查询 API（已更新排序逻辑）
- `api/cron/sync-template-usage.ts` - Cron Job 同步脚本
- `scripts/sync-template-usage.ts` - 手动同步脚本
- `api/tools/style-usage-stats.ts` - 使用统计记录 API
- `vercel.json` - Vercel Cron 配置
