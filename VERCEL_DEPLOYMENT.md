# Komiko 项目 Vercel 部署完整指南

> 文档版本：1.0
> 更新日期：2026-02-22
> 项目类型：Next.js 全栈应用 + Serverless Functions

---

## 目录

1. [项目整体架构分析](#1-项目整体架构分析)
2. [前端在 Vercel 上的部署流程](#2-前端在-vercel-上的部署流程)
3. [后端在 Vercel 上的部署流程](#3-后端在-vercel-上的部署流程)
4. [环境变量说明](#4-环境变量说明)
5. [数据库配置](#5-数据库配置)
6. [Vercel 部署特别注意事项](#6-vercel-部署特别注意事项)
7. [常见问题与解决方案](#7-常见问题与解决方案)

---

## 1. 项目整体架构分析

### 1.1 技术栈说明

#### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | ^14 | 全栈框架，Pages Router 架构 |
| React | ^18.2.0 | UI 框架 |
| TypeScript | ^5.6.2 | 类型系统 |
| Tailwind CSS | ^3.4.4 | 样式框架 |
| NextUI | ^2.4.2 | UI 组件库 |
| Konva.js | ^9.3.3 | Canvas 图形编辑（需特殊处理） |
| react-konva | 18.2.10 | React Konva 绑定 |
| Jotai | ^2.9.0 | 状态管理 |
| i18next | ^24.2.3 | 国际化（支持 16+ 语言） |
| Framer Motion | ^11.3.28 | 动画库 |

#### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vercel Functions | Serverless | 无服务器函数 |
| Supabase | ^2.45.0 | PostgreSQL 数据库 + 存储 + 认证 |
| NextAuth | 4.24.7 | 认证系统（GitHub + Google） |
| Stripe | ^17.5.0 | 支付处理 |
| Resend | ^4.0.1 | 邮件服务 |
| PostHog | ^4.11.3 | 事件分析 |

#### AI 服务集成

| 服务 | 主要功能 | SDK |
|------|---------|-----|
| FAL.ai | 图像/视频生成 | @fal-ai/client |
| Replicate | 图像/视频生成 | replicate |
| Google Gemini | 图像/文本生成 | @google/generative-ai |
| Google Vertex AI | 企业级 AI | @google/genai |
| Anthropic Claude | 文本生成 | @anthropic-ai/vertex-sdk |
| Luma AI | 视频生成 | @lumaai/sdk |
| RunwayML | 视频生成 | @runwayml/sdk |
| OpenAI | GPT 集成 | openai |
| Grok (X AI) | 文本/图像生成 | OpenRouter |

### 1.2 是否前后端分离

**答案：否 - 同仓库部署**

该项目采用 **Monorepo 单仓库架构**，前端和后端在同一个代码库中：
- 前端：`src/` 目录下的页面和组件
- 后端：`api/` 目录下的 API Routes（269 个文件）
- Vercel 会自动识别 `/api/*` 路由并部署为 Serverless Functions

**优点：**
- 统一的部署流程
- 简化的环境变量管理
- TypeScript 类型共享
- 开发体验更佳

### 1.3 API 调用方式

#### 相对路径调用（推荐）

```typescript
// 前端调用 API
const response = await fetch('/api/user/getUserInfo');
const data = await response.json();
```

#### 绝对路径调用（需配置环境变量）

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const response = await fetch(`${apiUrl}/api/user/getUserInfo`);
```

### 1.4 Serverless Function 使用方式

该项目大量使用 Vercel Serverless Functions：

```typescript
// api/generate.ts - 典型的 Serverless Function
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 业务逻辑
  const result = await processData(req.body);
  res.json(result);
}
```

**统计：**
- API 目录下共有 **269 个文件**
- 包含 60+ AI 模型配置
- 支持图片生成、视频生成、支付、用户管理等

### 1.5 是否使用 Edge Function

**当前配置：未明确使用 Edge Function**

项目使用的是标准 Serverless Functions（Node.js 运行时），而非 Edge Runtime。

**如需使用 Edge Function，可以在 API 路由中添加：**

```typescript
export const config = {
  runtime: 'edge',
};
```

**注意：**
- Edge Function 不支持所有 Node.js 模块（如 `canvas`, `sharp`）
- Edge Function 更适合全球边缘部署、低延迟场景
- 当前项目的大型依赖（Konva、Canvas）不适合 Edge Runtime

---

## 2. 前端在 Vercel 上的部署流程

### 2.1 Node 版本要求

**推荐版本：Node.js 20.x 或更高**

在项目根目录创建 `.nvmrc` 文件（如果不存在）：

```bash
# .nvmrc
20
```

**或在 `package.json` 中指定：**

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 2.2 构建命令（Build Command）

在 Vercel 项目设置中配置：

```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**实际构建流程：**

```json
// package.json 中的 scripts
{
  "scripts": {
    "dev": "NODE_ENV=development next dev --turbo",
    "prebuild": "npm run build:tools && npm run sitemap",
    "build": "NODE_ENV=production next build",
    "build:tools": "node scripts/build/prebuild.mjs",
    "sitemap": "node ./scripts/build/generatePagesSitemap.mjs"
  }
}
```

**构建步骤说明：**

1. **prebuild**（预构建）
   - 运行 `build:tools`：生成工具和常量
   - 运行 `sitemap`：生成 SEO sitemap

2. **build**（主构建）
   - `next build`：构建 Next.js 应用
   - 优化和压缩静态资源
   - 生成 Serverless Function bundles

### 2.3 输出目录（Output Directory）

```
Output Directory: .next
```

Next.js 会自动生成 `.next` 目录，包含：
- 构建后的页面
- 静态资源
- Serverless Functions
- 中间件配置

### 2.4 vercel.json 配置

**项目已包含 `vercel.json` 文件：**

```json
{
  "crons": [
    {
      "path": "/api/cron/classify-tags",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/sync-template-usage",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**配置说明：**
- `crons`：定义定时任务
- `path`：定时任务访问的 API 路径
- `schedule`：Cron 表达式（每天凌晨 3 点执行）

### 2.5 环境变量配置方式

#### Development（本地开发）

在项目根目录创建 `.env.local` 文件：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
STRIPE_API_KEY=your_stripe_api_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@komiko.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
OPEN_ROUTER_API_KEY=your_openrouter_api_key
# ... 其他环境变量
```

#### Preview（预览环境）

在 Vercel Dashboard 中配置：

1. 进入项目设置
2. 选择 **Environment Variables**
3. 添加环境变量
4. 选择环境：**Preview**
5. 保存

#### Production（生产环境）

在 Vercel Dashboard 中配置：

1. 进入项目设置
2. 选择 **Environment Variables**
3. 添加环境变量
4. 选择环境：**Production**
5. 保存

**关键区别：**

| 环境变量 | Dev | Preview | Production | 说明 |
|---------|-----|---------|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 本地 Supabase | 生产 Supabase | 生产 Supabase | 数据库连接 |
| `NEXTAUTH_URL` | localhost | 预览域名 | 生产域名 | 认证回调地址 |
| `NEXT_PUBLIC_APP_URL` | localhost | 预览域名 | komiko.app | 前端基础 URL |
| `NODE_ENV` | development | production | production | Node 运行环境 |

### 2.6 本地调试方式（vercel dev）

**安装 Vercel CLI：**

```bash
npm i -g vercel
```

**登录 Vercel：**

```bash
vercel login
```

**启动本地开发服务器：**

```bash
# 使用 Vercel 本地环境模拟
vercel dev

# 或使用 Next.js 原生开发服务器
npm run dev
```

**vercel dev 特点：**
- 模拟 Vercel Serverless 环境
- 支持本地调试 API Routes
- 环境变量从 Vercel Dashboard 同步

### 2.7 自动部署流程（GitHub 集成）

#### 配置步骤

1. **连接 GitHub 仓库**

   - 在 Vercel Dashboard 点击 "Add New Project"
   - 选择 GitHub 仓库
   - 导入项目

2. **配置构建设置**

   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   ```

3. **部署触发规则**

   - **推送到 `main` 分支** → 部署到 Production
   - **推送到其他分支** → 部署到 Preview
   - **Pull Request** → 自动创建 Preview 部署

4. **保护生产环境**

   - 在 Vercel Dashboard 中设置 **Production Branch**
   - 默认为 `main` 分支
   - 只有推送到此分支才会触发生产部署

#### Git 工作流示例

```bash
# 开发新功能
git checkout -b feature/new-feature

# 提交代码
git add .
git commit -m "Add new feature"

# 推送到远程分支（自动触发 Preview 部署）
git push origin feature/new-feature

# 功能测试通过后，合并到 main（自动触发 Production 部署）
git checkout main
git merge feature/new-feature
git push origin main
```

### 2.8 自定义域名绑定方式

#### 添加自定义域名

1. **在 Vercel Dashboard 中添加域名**

   - 进入项目设置
   - 选择 **Domains**
   - 输入域名：`komiko.app`
   - 点击 **Add**

2. **配置 DNS 记录**

   Vercel 会自动提供需要配置的 DNS 记录：

   ```
   类型：A
   名称：@
   值：76.76.21.21

   类型：CNAME
   名称：www
   值：cname.vercel-dns.com
   ```

3. **配置 HTTPS**

   - Vercel 自动为所有自定义域名提供免费 SSL 证书
   - Let's Encrypt 自动颁发和续期

#### 项目中的域名配置

在 `next.config.mjs` 中已配置：

```javascript
// next.config.mjs
async redirects() {
  const isProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV === 'production';

  // 生产环境域名重定向
  if (isProduction) {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.komiko.app' }],
        destination: 'https://komiko.app/:path*',
        permanent: true,
      },
      // ... 其他重定向规则
    ];
  }
}
```

### 2.9 常见错误及解决方案

#### 错误 1：构建失败 - 内存不足

**错误信息：**
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
```

**解决方案：**

在 Vercel 项目设置中，将 **Memory** 设置为 **4096 MB**（Hobby 计划支持）：

```json
// vercel.json
{
  "buildCommandSettings": {
    "maxLambdaSize": "50mb"
  }
}
```

#### 错误 2：超时错误

**错误信息：**
```
Error: Execution time exceeded 60s
```

**解决方案：**

- 检查是否有长时间的同步操作
- 使用异步任务队列（如 FAL.ai 的异步 API）
- 优化数据库查询

#### 错误 3：环境变量未定义

**错误信息：**
```
Error: Supabase URL is not defined
```

**解决方案：**

1. 检查环境变量名称是否正确
2. 在 Vercel Dashboard 中重新添加环境变量
3. 重新部署项目（环境变量变更需要重新部署）

#### 错误 4：CORS 错误

**错误信息：**
```
Access to fetch at '...' has been blocked by CORS policy
```

**解决方案：**

项目已在 `next.config.mjs` 中配置 CORS：

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
      ],
    },
  ];
}
```

---

## 3. 后端在 Vercel 上的部署流程

### 3.1 后端部署架构

**项目采用一体化部署：**

```
KomikoCopy/
├── src/pages/           # 前端页面
├── api/                 # 后端 API Routes（269 个文件）
│   ├── generation/      # AI 生成 API
│   ├── payment/         # 支付 API
│   ├── user/            # 用户 API
│   ├── tools/           # 工具 API
│   └── ...              # 其他 API
└── public/              # 静态资源
```

**Vercel 自动识别：**
- `/pages/*.tsx` → 静态页面或 ISR
- `/api/*.ts` → Serverless Functions

### 3.2 API 目录结构规范

#### 标准目录结构

```
api/
├── _models/                 # 数据模型（不作为 API）
│   ├── User.ts
│   ├── credit.ts
│   └── roles.ts
├── _utils/                  # 工具函数（不作为 API）
│   ├── middlewares/
│   ├── email.ts
│   └── index.ts
├── generation/              # 生成类 API
│   ├── submit.ts
│   ├── query.ts
│   └── webhook.ts
├── payment/                # 支付类 API
│   ├── create.ts
│   ├── webhook.ts
│   └── subscription/
├── user/                   # 用户类 API
│   ├── getUserInfo.ts
│   └── updateCharacter.ts
├── tools/                  # 工具类 API
│   ├── image-generation.ts
│   ├── video-generation.ts
│   └── ...
├── v2/                     # V2 API
│   ├── generateImage*.ts
│   └── generateComics*.ts
└── cron/                   # 定时任务（仅在 vercel.json 中配置）
    ├── classify-tags.ts
    └── sync-template-usage.ts
```

#### API 路由命名规范

```typescript
// ✅ 正确：直接导出 default handler
// api/user/getUserInfo.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.json({ message: 'Hello' });
}

// ❌ 错误：命名导出不会被 Vercel 识别
export async function handler() {}
```

### 3.3 Serverless Function 使用方式

#### 基本用法

```typescript
// api/example.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. 验证请求方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. 获取请求体
  const { prompt, model } = req.body;

  // 3. 业务逻辑
  try {
    const result = await processImage(prompt, model);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 中间件模式

```typescript
// api/protected-endpoint.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../_utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 认证中间件
  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 业务逻辑
  const userData = await getUserData(userId);
  res.json(userData);
}
```

#### 异步任务处理

```typescript
// api/generation/submit.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { prompt } = req.body;

  // 提交异步任务（如 FAL.ai）
  const taskId = await submitToFalAI(prompt);

  // 立即返回任务 ID
  res.json({ taskId, status: 'pending' });

  // 后台处理任务（Vercel 会继续执行直到超时）
}
```

### 3.4 请求超时限制

**Vercel Serverless Functions 限制：**

| 计划 | 超时时间 | 内存 |
|------|---------|------|
| Hobby（免费） | 10 秒 | 1024 MB |
| Pro | 60 秒 | 4096 MB |
| Enterprise | 900 秒 | 自定义 |

**项目最佳实践：**

```typescript
// ✅ 快速响应的 API
export default async function handler(req, res) {
  // 快速操作（如数据库查询、轻量计算）
  const data = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  res.json(data);
}

// ❌ 长时间运行的 API（会导致超时）
export default async function handler(req, res) {
  // 视频生成可能需要 5-10 分钟
  const video = await generateVideo(prompt); // 会超时
  res.json({ videoUrl });
}

// ✅ 异步任务模式
export default async function handler(req, res) {
  // 立即返回任务 ID
  const taskId = await queueTask(prompt);
  res.json({ taskId, status: 'pending' });
}

// 客户端轮询任务状态
// api/generation/query.ts
export default async function handler(req, res) {
  const { taskId } = req.query;
  const status = await getTaskStatus(taskId);
  res.json(status);
}
```

### 3.5 内存限制

**项目内存优化策略：**

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    // 排除大型依赖，减少内存占用
    serverComponentsExternalPackages: [
      'canvas',
      'sharp',
      'konva',
      'react-konva',
      'three',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 服务器端外部化大型依赖
      config.externals = [
        ...(config.externals || []),
        {
          canvas: 'commonjs canvas',
          sharp: 'commonjs sharp',
          konva: 'commonjs konva',
          'react-konva': 'commonjs react-konva',
          three: 'commonjs three',
        },
      ];
    }
    return config;
  },
};
```

### 3.6 冷启动问题说明

**什么是冷启动（Cold Start）：**

Serverless Function 在一段时间未被调用后，会被 Vercel 回收资源。下次调用时需要重新初始化，这会导致额外的延迟（通常 500ms - 3s）。

**影响冷启动的因素：**
- 函数代码体积
- 初始化时的依赖加载
- 数据库连接建立时间

**减少冷启动的策略：**

#### 1. 减少函数体积

```javascript
// next.config.mjs
webpack: (config, { isServer }) => {
  if (isServer) {
    // 排除不必要的依赖
    config.externals = [
      ...(config.externals || []),
      'sharp',  // 只在需要的函数中导入
    ];
  }
  return config;
}
```

#### 2. 延迟加载依赖

```typescript
// ❌ 错误：在文件顶部导入大型依赖
import sharp from 'sharp';

export default async function handler(req, res) {
  const image = await sharp(req.body.image);
  res.json({ processed: image });
}

// ✅ 正确：在函数内部按需导入
export default async function handler(req, res) {
  const sharp = await import('sharp');
  const image = await sharp(req.body.image);
  res.json({ processed: image });
}
```

#### 3. 连接池复用

```typescript
// api/_utils/db.ts
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
```

### 3.7 长连接 / WebSocket 是否支持

**答案：Vercel Serverless Functions 不支持 WebSocket**

**原因：**
- Serverless Function 是无状态的
- 请求-响应模型，不支持持久连接
- 函数执行完毕后立即销毁

**替代方案：**

#### 1. 使用第三方 WebSocket 服务

```typescript
// 使用 Supabase Realtime（推荐）
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(URL, KEY);

// 监听实时更新
supabase
  .channel('generation-status')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public' }, (payload) => {
    console.log('Status updated:', payload);
  })
  .subscribe();
```

#### 2. 使用 Pusher、Ably 等

```typescript
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'us2',
});

// 推送消息
pusher.trigger('generation-channel', 'status-update', { taskId, status });
```

#### 3. 使用 Server-Sent Events (SSE)

```typescript
// api/stream.ts
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送事件流
  res.write('data: {"message": "Started"}\n\n');

  // 定期发送更新
  const interval = setInterval(() => {
    res.write(`data: {"status": "processing"}\n\n`);
  }, 1000);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(interval);
  });
}
```

**注意：** SSE 在 Serverless 中也有超时限制（10-60秒），不适合长时间传输。

### 3.8 定时任务解决方案（Cron）

#### 使用 Vercel Cron Jobs

**项目已配置（`vercel.json`）：**

```json
{
  "crons": [
    {
      "path": "/api/cron/classify-tags",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/sync-template-usage",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**配置说明：**
- `path`：API 路由路径
- `schedule`：Cron 表达式（`分 时 日 月 周`）
  - `0 3 * * *` = 每天凌晨 3:00
  - `*/30 * * * *` = 每 30 分钟
  - `0 9 * * 1-5` = 工作日早上 9 点

#### 实现 Cron API 路由

```typescript
// api/cron/classify-tags.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyCron } from '../_utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. 验证 Cron 请求（防止未授权访问）
  const isValid = await verifyCron(req);
  if (!isValid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 2. 执行定时任务
  try {
    console.log('Starting classify-tags cron job...');
    await classifyTags();
    console.log('Cron job completed successfully');

    res.json({ success: true });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: 'Cron job failed' });
  }
}
```

#### 验证 Cron 请求

```typescript
// api/_utils/auth.ts
import crypto from 'crypto';

export async function verifyCron(req: NextApiRequest): Promise<boolean> {
  // 方法 1：检查 Vercel-Cron 头
  if (req.headers['x-vercel-cron'] === 'true') {
    return true;
  }

  // 方法 2：使用自定义密钥验证
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader === expectedAuth) {
    return true;
  }

  return false;
}
```

#### 监控 Cron 执行

在 Vercel Dashboard 中：
1. 进入项目设置
2. 选择 **Cron Jobs**
3. 查看执行历史和日志

**或在 PostHog 中记录：**

```typescript
// api/_utils/posthog.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
});

export function trackCronExecution(jobName: string, status: 'success' | 'error') {
  posthog.capture({
    event: 'cron_execution',
    distinctId: 'cron',
    properties: {
      jobName,
      status,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### 3.9 配置 Vercel Environment Variables

#### 在 Vercel Dashboard 中配置

1. **进入项目设置**
   - Vercel Dashboard → 选择项目
   - Settings → Environment Variables

2. **添加环境变量**
   - 点击 **Add New**
   - 输入变量名和值
   - 选择环境（Development / Preview / Production）
   - 点击 **Save**

3. **批量导入（JSON 格式）**

   可以使用 Vercel CLI 批量导入：

   ```bash
   vercel env pull .env.production
   ```

#### 环境变量分组

**按功能分组：**

| 组别 | 环境变量 | 说明 |
|------|---------|------|
| 数据库 | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 连接 |
| 认证 | `NEXTAUTH_URL`<br>`NEXTAUTH_SECRET`<br>`GITHUB_CLIENT_ID`<br>`GITHUB_CLIENT_SECRET`<br>`NEXT_PUBLIC_GOOGLE_CLIENT_ID` | NextAuth 配置 |
| 支付 | `STRIPE_API_KEY`<br>`STRIPE_WEBHOOK_SECRET` | Stripe 支付 |
| 邮件 | `RESEND_API_KEY`<br>`RESEND_FROM` | Resend 邮件 |
| AI 服务 | `OPEN_ROUTER_API_KEY`<br>`FAL_KEY` | AI 服务密钥 |
| 分析 | `NEXT_PUBLIC_POSTHOG_KEY`<br>`NEXT_PUBLIC_POSTHOG_HOST` | PostHog 分析 |

#### 环境变量类型

**Public 环境变量（浏览器可访问）：**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_APP_URL=https://komiko.app
```

**Private 环境变量（仅服务器端可访问）：**

```bash
NEXTAUTH_SECRET=xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
```

**安全原则：**
- 敏感信息（API Key、Secret）必须使用 Private 环境变量
- 公共信息（URL、Client ID）可以使用 `NEXT_PUBLIC_` 前缀

### 3.10 数据库连接注意事项

#### 连接池问题

**Serverless 环境下的挑战：**
- 每个函数实例可能创建多个数据库连接
- 连接数可能超过数据库限制
- 函数销毁时连接未正确释放

**解决方案：**

```typescript
// api/_utils/db.ts
import { createClient } from '@supabase/supabase-js';

// 单例模式
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  // 已有实例则复用
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 创建新实例
  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false, // Serverless 环境禁用会话持久化
      },
      global: {
        headers: {
          'x-client-info': 'komiko-api',
        },
      },
    }
  );

  return supabaseInstance;
}
```

#### 连接超时配置

```typescript
// 配置 Supabase 连接超时
const supabase = createClient(URL, KEY, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: (url, options = {}) => {
      // 设置全局超时
      const timeout = 8000; // 8 秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});
```

#### Supabase 连接限制

**Hobby 计划：**
- 并发连接数：60
- 适合小型项目

**Pro 计划：**
- 并发连接数：500+
- 适合中大型项目

**监控连接数：**

```typescript
// api/_utils/monitor.ts
export async function checkConnectionHealth() {
  const { data, error } = await supabase
    .from('_health_check_')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Database connection error:', error);
    posthog.capture('database_connection_error', { error });
    return false;
  }

  return true;
}
```

---

## 4. 环境变量说明

### 4.1 前端需要的环境变量

```bash
# ========== 公共环境变量（浏览器可访问） ==========

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 应用配置
NEXT_PUBLIC_APP_URL=https://komiko.app

# 分析服务
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Mixpanel（可选）
NEXT_PUBLIC_MIXPANEL_TOKEN=xxx

# ========== 私有环境变量（仅服务器端） ==========

# NextAuth
NEXTAUTH_URL=https://komiko.app
NEXTAUTH_SECRET=your_secret_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth（服务器端）
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe 支付
STRIPE_API_KEY=sk_test_xxx  # 生产环境使用 sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend 邮件
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@komiko.app
ADMIN_EMAIL=admin@komiko.app

# AI 服务密钥
OPEN_ROUTER_API_KEY=sk-or-xxx
FAL_KEY=fal_xxx

# 调试模式
IS_DEBUG=false
```

### 4.2 后端需要的环境变量

后端环境变量与前端基本相同，但额外包括：

```bash
# ========== 后端专用环境变量 ==========

# 数据库服务密钥（Supabase Service Key，需要更高权限）
# 注意：Service Key 应谨慎使用，仅在服务器端使用
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cron 任务密钥
CRON_SECRET=your_cron_secret

# 第三方 AI 服务（服务器端）
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_VERTEX_PROJECT_ID=your_project_id
GOOGLE_VERTEX_LOCATION=us-central1

# Luma AI
LUMA_API_KEY=luma_xxx

# RunwayML
RUNWAY_API_KEY=runway_xxx

# PostHog 服务器端
POSTHOG_PROJECT_API_KEY=phc_xxx
POSTHOG_HOST=https://us.i.posthog.com

# Redis（可选，用于缓存）
REDIS_URL=redis://xxx
```

### 4.3 Vercel 中如何配置

#### 方法 1：通过 Dashboard 配置

1. **进入项目设置**

   ```
   Vercel Dashboard → Project → Settings → Environment Variables
   ```

2. **添加变量**

   - 点击 **Add New**
   - 输入 **Name**（如 `NEXT_PUBLIC_SUPABASE_URL`）
   - 输入 **Value**
   - 选择 **Environment**（Production / Preview / Development）
   - 点击 **Save**

3. **批量导入**

   使用 `.env` 文件导入：

   ```bash
   # 本地创建 .env.production
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXTAUTH_SECRET=xxx
   # ...

   # 使用 Vercel CLI 导入
   vercel env pull .env.production
   ```

#### 方法 2：通过 Vercel CLI

```bash
# 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 输入值后回车

# 列出所有环境变量
vercel env ls

# 删除环境变量
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
```

#### 方法 3：通过 Vercel GitHub App（不推荐）

在项目根目录添加 `.env` 文件，但**不推荐**，因为：
- 安全风险：敏感信息会提交到 Git
- 无法区分环境（Dev / Preview / Production）
- Vercel Dashboard 更安全且易于管理

### 4.4 各环境的区别

| 环境变量 | Development | Preview | Production | 说明 |
|---------|-------------|---------|-----------|------|
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 | https://komiko-git-branch.vercel.app | https://komiko.app | 前端基础 URL |
| `NEXTAUTH_URL` | http://localhost:3000 | https://komiko-git-branch.vercel.app | https://komiko.app | 认证回调地址 |
| `NODE_ENV` | development | production | production | Node 运行环境 |
| `NEXT_PUBLIC_SUPABASE_URL` | 测试 Supabase | 生产 Supabase | 生产 Supabase | 数据库连接 |
| `STRIPE_API_KEY` | sk_test_xxx | sk_test_xxx | sk_live_xxx | Stripe 测试/正式密钥 |
| `IS_DEBUG` | true | false | false | 调试模式 |

**环境触发规则：**

```
本地开发 (npm run dev)           → Development
Git Pull Request                 → Preview
推送到 main 以外的分支            → Preview
推送到 main 分支                 → Production
手动触发 Preview Deployment      → Preview
手动触发 Production Deployment   → Production
```

### 4.5 示例 .env.example 文件模板

在项目根目录创建 `.env.example`：

```bash
# ========== 公共环境变量（浏览器可访问） ==========
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# ========== 认证服务 ==========
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ========== 支付服务 ==========
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ========== 邮件服务 ==========
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@komiko.app
ADMIN_EMAIL=admin@komiko.app

# ========== AI 服务 ==========
OPEN_ROUTER_API_KEY=sk-or-xxx
FAL_KEY=fal_xxx
ANTHROPIC_API_KEY=sk-ant-xxx
LUMA_API_KEY=luma_xxx
RUNWAY_API_KEY=runway_xxx

# ========== 数据库高级权限（谨慎使用） ==========
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ========== 定时任务 ==========
CRON_SECRET=your_cron_secret

# ========== 其他 ==========
IS_DEBUG=false
```

**使用说明：**

```bash
# 1. 复制示例文件
cp .env.example .env.local

# 2. 编辑 .env.local，填入实际值
# 3. 确保 .env.local 已添加到 .gitignore
# 4. 本地开发时，Next.js 会自动加载 .env.local
```

**验证环境变量：**

```typescript
// src/utilities/validateEnv.ts
import { env } from './env';

export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = required.filter(key => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ All required environment variables are set');
}
```

---

## 5. 数据库配置

### 5.1 数据库类型

**项目使用：Supabase（PostgreSQL）**

```
Supabase = PostgreSQL + 实时功能 + 认证 + 存储
```

**优点：**
- 托管服务，无需自维护
- 内置认证系统（Email / OAuth）
- 实时订阅功能
- 免费额度充足
- 与 Serverless 架构完美适配

### 5.2 建议使用托管数据库

**强烈推荐：使用 Supabase（当前方案）**

**其他可选方案：**

| 服务 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Supabase** | 功能全、免费额度大、易上手 | 企业级功能需付费 | 中小型项目、快速开发 |
| **Neon** | Serverless 原生、自动扩缩容 | 功能较少、社区较小 | Serverless 优先项目 |
| **PlanetScale** | MySQL、分支管理 | 不是 PostgreSQL、需付费 | 现有 MySQL 项目 |
| **Railway** | 一体化部署 | 价格较高 | 小型全栈项目 |

**建议：**
- 项目已使用 Supabase，继续使用
- Supabase 的 Serverless 友好特性与 Vercel 完美配合

### 5.3 需要提前创建哪些数据库

#### Supabase 项目设置

1. **创建 Supabase 项目**

   - 访问 https://supabase.com
   - 点击 "New Project"
   - 输入项目名称：`komiko-prod`
   - 选择数据库区域：建议 `Southeast Asia (Singapore)`
   - 设置密码：**保存密码，后续配置需要**

2. **获取连接信息**

   - API URL: `https://xxx.supabase.co`
   - anon key: `eyJxxx...`
   - service_role key: `eyJxxx...`（服务器端使用）

#### 数据库表结构

根据项目代码，主要表包括：

**必需表：**

```sql
-- 用户表
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  user_name TEXT,
  email TEXT UNIQUE
);

-- 订阅表
CREATE TABLE "Subscriptions" (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES "User"(id),
  plan_code INTEGER,
  expires BIGINT,
  period_expires BIGINT
);

-- 自定义角色表
CREATE TABLE "CustomCharacters" (
  character_uniqid TEXT PRIMARY KEY,
  character_description TEXT,
  alt_prompt TEXT
);

-- 帖子表
CREATE TABLE "Post" (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES "User"(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 标签表
CREATE TABLE "Tag" (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT
);

-- 信用记录表
CREATE TABLE "CreditRecord" (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES "User"(id),
  amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**完整表结构建议：**

参考项目中的 `api/_models/` 目录，查看所有数据模型定义。

### 5.4 是否需要初始化数据

**建议：创建测试数据**

```sql
-- 插入测试用户
INSERT INTO "User" (id, user_name, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@komiko.app'),
  ('00000000-0000-0000-0000-000000000002', 'testuser', 'test@komiko.app');

-- 插入测试标签
INSERT INTO "Tag" (id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'anime', 'Anime style'),
  ('00000000-0000-0000-0000-000000000002', 'portrait', 'Portrait style');
```

**初始化脚本：**

```typescript
// scripts/init-db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function initDatabase() {
  console.log('Initializing database...');

  // 插入默认数据
  const { error } = await supabase
    .from('Tag')
    .insert([
      { name: 'anime', description: 'Anime style' },
      { name: 'portrait', description: 'Portrait style' },
    ]);

  if (error) {
    console.error('Error initializing database:', error);
  } else {
    console.log('✅ Database initialized successfully');
  }
}

initDatabase();
```

### 5.5 迁移方案

#### 使用 Supabase Migrations

1. **创建迁移文件**

   ```bash
   # 在 Supabase Dashboard 中
   # Database → Migrations → New migration
   # 粘贴 SQL 代码并执行
   ```

2. **本地开发迁移**

   使用 Supabase CLI：

   ```bash
   # 安装 Supabase CLI
   npm install -g supabase

   # 登录
   supabase login

   # 链接项目
   supabase link --project-ref your_project_ref

   # 创建迁移
   supabase migration new init_schema

   # 应用迁移
   supabase db push
   ```

3. **迁移脚本示例**

   ```sql
   -- supabase/migrations/001_init_schema.sql

   -- 启用 UUID 扩展
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- 创建用户表
   CREATE TABLE "User" (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- 创建订阅表
   CREATE TABLE "Subscriptions" (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
     plan_code INTEGER NOT NULL,
     expires BIGINT NOT NULL,
     period_expires BIGINT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- 创建索引
   CREATE INDEX idx_user_email ON "User"(email);
   CREATE INDEX idx_subscriptions_user_id ON "Subscriptions"(user_id);
   ```

#### 数据迁移（从旧数据库）

```typescript
// scripts/migrate-data.ts
import { createClient } from '@supabase/supabase-js';

const oldDb = createClient(OLD_URL, OLD_KEY);
const newDb = createClient(NEW_URL, NEW_KEY);

async function migrateUsers() {
  const { data: users } = await oldDb.from('users').select('*');

  if (users) {
    for (const user of users) {
      await newDb.from('User').insert({
        id: user.id,
        user_name: user.name,
        email: user.email,
      });
    }
    console.log(`✅ Migrated ${users.length} users`);
  }
}

migrateUsers();
```

### 5.6 Serverless 环境下数据库连接的注意事项

#### 连接池管理

**问题：**
Serverless Functions 可能创建大量连接，导致数据库连接耗尽。

**解决方案：**

1. **使用连接池（Supabase 自动管理）**

   ```typescript
   // ✅ 推荐：使用 Supabase 客户端（内置连接池）
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(URL, KEY);
   ```

2. **避免在循环中创建连接**

   ```typescript
   // ❌ 错误：在循环中创建多个连接
   for (const userId of userIds) {
     const db = createClient(URL, KEY); // 每次创建新连接
     const user = await db.from('User').select('*').eq('id', userId);
   }

   // ✅ 正确：复用同一连接
   const supabase = createClient(URL, KEY);
   const { data: users } = await supabase
     .from('User')
     .select('*')
     .in('id', userIds);
   ```

3. **限制并发请求数**

   ```typescript
   import pLimit from 'p-limit';

   const limit = pLimit(5); // 最多 5 个并发请求

   const results = await Promise.all(
     tasks.map(task => limit(() => processTask(task)))
   );
   ```

#### 连接超时处理

```typescript
// api/_utils/db.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      global: {
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout));
        },
      },
    }
  );
}
```

#### 查询优化

**避免 N+1 查询：**

```typescript
// ❌ 错误：N+1 查询
for (const post of posts) {
  const user = await supabase.from('User').select('*').eq('id', post.user_id);
}

// ✅ 正确：使用 join 或 批量查询
const { data: users } = await supabase
  .from('User')
  .select('*')
  .in('id', posts.map(p => p.user_id));
```

**使用索引：**

```sql
-- 为常用查询添加索引
CREATE INDEX idx_posts_user_id ON "Post"(user_id);
CREATE INDEX idx_posts_created_at ON "Post"(created_at DESC);
CREATE INDEX idx_subscriptions_user_expires ON "Subscriptions"(user_id, expires);
```

#### 事务处理

```typescript
// Supabase 不支持多表事务，使用替代方案
async function transferCredits(fromUserId: string, toUserId: string, amount: number) {
  // 1. 扣除发送方
  const { error: fromError } = await supabase.rpc('transfer_credits', {
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
  });

  if (fromError) {
    throw fromError;
  }

  // 2. 记录交易
  await supabase.from('CreditRecord').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
  });
}
```

**创建 Supabase RPC 函数：**

```sql
-- 在 Supabase SQL Editor 中创建
CREATE OR REPLACE FUNCTION transfer_credits(
  from_user_id UUID,
  to_user_id UUID,
  amount INTEGER
) RETURNS VOID AS $$
BEGIN
  -- 扣除发送方
  UPDATE "CreditRecord"
  SET amount = amount - amount
  WHERE user_id = from_user_id;

  -- 增加接收方
  UPDATE "CreditRecord"
  SET amount = amount + amount
  WHERE user_id = to_user_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Vercel 部署特别注意事项

### 6.1 Serverless 超时限制

**限制说明：**

| 计划 | 函数超时 | 函数大小 | 说明 |
|------|---------|---------|------|
| Hobby（免费） | 10 秒 | 50 MB | 适合快速响应 API |
| Pro（$20/月） | 60 秒 | 50 MB | 适合大多数场景 |
| Enterprise | 900 秒 | 自定义 | 适合长时间任务 |

**项目应对策略：**

#### 1. 异步任务模式

```typescript
// ❌ 长时间任务会超时
export default async function handler(req, res) {
  const video = await generateVideo(prompt); // 需要 5-10 分钟
  res.json({ videoUrl });
}

// ✅ 提交异步任务
export default async function handler(req, res) {
  const { prompt } = req.body;

  // 提交到 FAL.ai（异步）
  const { requestId } = await fal.queue.submit('fal-ai/flux-pro', {
    input: { prompt },
  });

  // 立即返回任务 ID
  res.json({ requestId, status: 'pending' });
}

// 客户端轮询状态
export default async function handler(req, res) {
  const { requestId } = req.query;
  const status = await fal.queue.status('fal-ai/flux-pro', {
    requestId,
  });

  res.json(status);
}
```

#### 2. 使用 Vercel Background Jobs

```typescript
// 使用 @vercel/og 或类似工具处理长时间任务
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
  maxDuration: 60, // Edge Runtime 最多 60 秒
};

export default async function handler(req) {
  // 处理图像生成任务
  return new ImageResponse(/* ... */);
}
```

#### 3. 设置合理的超时

```typescript
// 配置 fetch 超时
async function fetchDataWithTimeout(url: string, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error('Request timeout');
  }
}
```

### 6.2 API 体积限制

**限制说明：**
- 单个 Serverless Function 体积上限：**50 MB**
- 包括代码和 node_modules

**项目优化策略：**

#### 1. 在 `next.config.mjs` 中配置

```javascript
// next.config.mjs
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 外部化大型依赖
      config.externals = [
        ...(config.externals || []),
        {
          canvas: 'commonjs canvas',
          sharp: 'commonjs sharp',
          konva: 'commonjs konva',
          'react-konva': 'commonjs react-konva',
          three: 'commonjs three',
        },
      ];

      // 使用 IgnorePlugin
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(canvas|sharp|konva|react-konva|three)$/,
        })
      );
    }
    return config;
  },
};
```

#### 2. 按需导入大型依赖

```typescript
// ❌ 错误：在文件顶部导入
import sharp from 'sharp';
import Konva from 'konva';

export default async function handler(req, res) {
  // ...
}

// ✅ 正确：动态导入
export default async function handler(req, res) {
  const sharp = await import('sharp');
  const Konva = await import('konva');

  // ...
}
```

#### 3. 使用 Vercel Edge Functions（适合小体积函数）

```typescript
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Edge Functions 体积更小，启动更快
  return new Response('Hello from Edge');
}
```

### 6.3 不能使用本地文件存储

**限制说明：**
Serverless Functions 是无状态的，函数执行完毕后，所有本地文件都会被删除。

**替代方案：**

#### 1. 使用 Supabase Storage（推荐）

```typescript
// api/uploadImage.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req, res) {
  const { file, fileName } = req.body;

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ url: data.path });
}
```

#### 2. 使用 Vercel Blob

```typescript
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const { file, fileName } = req.body;

  const blob = await put(fileName, file, {
    access: 'public',
  });

  res.json({ url: blob.url });
}
```

#### 3. 使用 AWS S3

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req, res) {
  const { file, fileName } = req.body;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileName,
    Body: file,
  });

  await s3Client.send(command);
  res.json({ url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}` });
}
```

### 6.4 日志查看方式

#### 1. 在 Vercel Dashboard 中查看

```
Vercel Dashboard → Project → Deployments → 选择部署 → Logs
```

**日志级别：**
- `INFO`：常规信息
- `WARN`：警告
- `ERROR`：错误
- `DEBUG`：调试信息

#### 2. 实时日志

```bash
# 使用 Vercel CLI
vercel logs --follow

# 查看特定函数的日志
vercel logs --follow --filter=/api/generate
```

#### 3. 结构化日志（推荐）

```typescript
// api/_utils/logger.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
});

export function logEvent(event: string, properties: Record<string, any>) {
  console.log(`[Event] ${event}`, JSON.stringify(properties));

  posthog.capture({
    event,
    distinctId: properties.userId || 'anonymous',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  });
}

// 使用示例
import { logEvent } from '../_utils/logger';

export default async function handler(req, res) {
  logEvent('api_request', {
    endpoint: '/api/generate',
    userId: req.headers['x-user-id'],
  });

  // ...
}
```

#### 4. 错误日志聚合

```typescript
// api/_utils/error-handler.ts
export function handleError(error: unknown, context: string) {
  console.error(`[${context}] Error:`, error);

  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }

  // 发送到错误追踪服务（如 Sentry）
  if (typeof window !== 'undefined') {
    Sentry.captureException(error);
  }
}
```

### 6.5 版本回滚方式

#### 1. 通过 Dashboard 回滚

```
Vercel Dashboard → Project → Deployments
→ 选择之前的部署 → 点击 "..." → Rollback
```

#### 2. 使用 Git 回滚

```bash
# 查看部署历史
git log --oneline

# 回滚到特定提交
git revert <commit-hash>
git push origin main

# 或直接回退
git reset --hard <commit-hash>
git push origin main --force
```

#### 3. 使用 Vercel CLI

```bash
# 列出所有部署
vercel list

# 推广特定部署为 Production
vercel promote <deployment-url> --scope your-team
```

#### 4. Git 分支保护

```
Vercel Dashboard → Project → Settings → Git
→ Protected Branches → 选择 main 分支
```

**优点：**
- 防止直接推送 main 分支
- 必须通过 Pull Request 合并
- 可以设置 Reviewer 审核

### 6.6 构建缓存问题

#### 问题描述

Vercel 默认缓存 `node_modules` 和 `.next` 目录，但有时会导致依赖版本不一致。

#### 解决方案

#### 1. 清除缓存重新部署

```bash
# 使用 Vercel CLI
vercel build --force

# 或在 Dashboard 中
# Deployments → 选择部署 → Redeploy → 勾选 "Clear cache"
```

#### 2. 配置 `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install --force",
  "framework": null
}
```

#### 3. 使用 `package-lock.json`

确保 `package-lock.json` 已提交到 Git，这样可以锁定依赖版本。

#### 4. 依赖更新策略

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 或使用 npm-check-updates
npx npm-check-updates -u
npm install
```

### 6.7 Edge 与 Serverless 的区别

| 特性 | Serverless Functions | Edge Functions |
|------|---------------------|----------------|
| **运行时** | Node.js | V8 (浏览器环境) |
| **启动时间** | 较慢（冷启动 500ms - 3s） | 极快（<100ms） |
| **超时限制** | Hobby 10s / Pro 60s | 30 秒 |
| **内存限制** | 1024 MB - 4096 MB | 128 MB |
| **Node.js 模块** | 完全支持 | 部分支持 |
| **数据库连接** | 支持完整客户端 | 需使用 HTTP API |
| **文件系统** | 只读 | 只读 |
| **适用场景** | 复杂业务逻辑、数据库操作 | 轻量逻辑、全球边缘部署 |

#### 使用 Serverless Functions（默认）

```typescript
// api/generate.ts
export default async function handler(req, res) {
  // 复杂业务逻辑
  const db = await connectDatabase();
  const result = await db.query('SELECT * FROM users');

  // 使用完整的 Node.js 生态
  const sharp = await import('sharp');
  const image = await sharp(req.body.image).resize(800).toBuffer();

  res.json({ result, imageUrl: image });
}
```

#### 使用 Edge Functions（适合轻量任务）

```typescript
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 轻量逻辑（如路由、重定向、验证）
  const url = new URL(req.url);
  const param = url.searchParams.get('q');

  // 直接返回，无需数据库
  return new Response(JSON.stringify({ result: param }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**项目建议：**
- 大部分 API 使用 Serverless Functions
- 简单的验证、重定向可以考虑 Edge Functions
- 当前项目的大型依赖（Canvas、Konva）不适合 Edge Runtime

### 6.8 生产环境调试建议

#### 1. 使用环境变量控制日志级别

```typescript
// api/_utils/logger.ts
const isProduction = process.env.NODE_ENV === 'production';
const isDebug = process.env.IS_DEBUG === 'true';

export function log(message: string, data?: any) {
  if (isProduction && !isDebug) {
    // 生产环境只记录关键信息
    console.log(`[INFO] ${message}`);
  } else {
    // 开发环境记录详细信息
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

export function error(message: string, error?: any) {
  console.error(`[ERROR] ${message}`);
  if (error) {
    console.error(error.stack || error);
  }
}
```

#### 2. 使用 PostHog 事件追踪

```typescript
// api/_utils/posthog.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
});

export function trackEvent(eventName: string, properties: Record<string, any>) {
  posthog.capture({
    event: eventName,
    distinctId: properties.userId || 'anonymous',
    properties: {
      ...properties,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
}
```

**使用示例：**

```typescript
import { trackEvent } from '../_utils/posthog';
import { log, error } from '../_utils/logger';

export default async function handler(req, res) {
  try {
    log('Starting image generation', { prompt: req.body.prompt });

    const result = await generateImage(req.body.prompt);

    trackEvent('image_generated', {
      userId: req.body.userId,
      model: req.body.model,
      promptLength: req.body.prompt.length,
    });

    res.json(result);
  } catch (err) {
    error('Image generation failed', err);
    trackEvent('image_generation_failed', {
      error: err.message,
    });
    res.status(500).json({ error: 'Failed to generate image' });
  }
}
```

#### 3. 使用 Sentry 错误追踪（可选）

```typescript
// api/_utils/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

export function captureException(error: Error) {
  Sentry.captureException(error);
}
```

#### 4. 性能监控

```typescript
// api/_utils/performance.ts
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();

  return fn().finally(() => {
    const duration = Date.now() - start;
    console.log(`[Performance] ${name} took ${duration}ms`);

    // 发送到 PostHog
    posthog.capture({
      event: 'performance_metric',
      distinctId: 'server',
      properties: {
        name,
        duration,
        environment: process.env.NODE_ENV,
      },
    });
  });
}

// 使用示例
export default async function handler(req, res) {
  const result = await measureAsync('generateImage', async () => {
    return await generateImage(req.body.prompt);
  });

  res.json(result);
}
```

---

## 7. 常见问题与解决方案

### 7.1 部署失败问题

#### 问题：构建超时

**错误信息：**
```
Build failed: Build timeout exceeded
```

**解决方案：**

1. **优化构建时间**

   ```javascript
   // next.config.mjs
   const nextConfig = {
     // 跳过 TypeScript 类型检查（如果不需要）
     typescript: {
       ignoreBuildErrors: true,
     },
     // 跳过 ESLint（如果不需要）
     eslint: {
       ignoreDuringBuilds: true,
     },
   };
   ```

2. **使用增量构建**

   ```json
   // package.json
   {
     "scripts": {
       "build": "next build"
     }
   }
   ```

3. **减少构建依赖**

   - 检查 `node_modules` 是否有不需要的包
   - 使用 `npm prune` 清理未使用的依赖

#### 问题：内存不足

**错误信息：**
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
```

**解决方案：**

1. **升级 Vercel 计划**

   ```
   Vercel Dashboard → Settings → Functions → Memory
   选择 4096 MB（Pro 计划）
   ```

2. **优化依赖**

   ```javascript
   // next.config.mjs
   const nextConfig = {
     webpack: (config, { isServer }) => {
       if (isServer) {
         config.externals = [
           ...(config.externals || []),
           'sharp',  // 外部化大型依赖
         ];
       }
       return config;
     },
   };
   ```

### 7.2 API 调用问题

#### 问题：CORS 错误

**错误信息：**
```
Access to fetch at 'https://komiko.app/api/...' has been blocked by CORS policy
```

**解决方案：**

项目已在 `next.config.mjs` 中配置 CORS，确保配置正确：

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Content-Type' },
      ],
    },
  ];
}
```

#### 问题：环境变量未定义

**错误信息：**
```
Error: Supabase URL is not defined
```

**解决方案：**

1. **检查环境变量名称**

   ```typescript
   // 确保变量名一致
   process.env.NEXT_PUBLIC_SUPABASE_URL  // ✅ 正确
   process.env.SUPABASE_URL              // ❌ 错误
   ```

2. **在 Vercel Dashboard 中重新添加**

   - Settings → Environment Variables
   - 添加变量并选择正确的环境（Production）

3. **重新部署**

   环境变量变更需要重新部署才能生效。

### 7.3 数据库连接问题

#### 问题：连接池耗尽

**错误信息：**
```
Error: Connection pool exhausted
```

**解决方案：**

1. **使用连接池（Supabase 自动管理）**

   ```typescript
   // 复用 Supabase 实例
   let supabaseInstance = null;
   export function getSupabase() {
     if (!supabaseInstance) {
       supabaseInstance = createClient(URL, KEY);
     }
     return supabaseInstance;
   }
   ```

2. **限制并发请求数**

   ```typescript
   import pLimit from 'p-limit';
   const limit = pLimit(5);
   ```

3. **升级 Supabase 计划**

   - Hobby：60 并发连接
   - Pro：500+ 并发连接

### 7.4 性能问题

#### 问题：冷启动延迟

**现象：**
首次调用 API 需要 2-3 秒响应。

**解决方案：**

1. **减少函数体积**

   ```javascript
   // next.config.mjs
   webpack: (config, { isServer }) => {
     if (isServer) {
       config.externals = [
         'sharp',  // 外部化大型依赖
       ];
     }
     return config;
   }
   ```

2. **延迟加载依赖**

   ```typescript
   export default async function handler(req, res) {
     const sharp = await import('sharp'); // 按需导入
     // ...
   }
   ```

3. **使用 Vercel Pro 计划**

   Pro 计划提供更快的冷启动。

#### 问题：响应慢

**解决方案：**

1. **启用 Next.js 缓存**

   ```typescript
   // 使用 ISR
   export async function getStaticProps() {
     return {
       revalidate: 60, // 每 60 秒重新生成
     };
   }
   ```

2. **优化数据库查询**

   ```typescript
   // 使用索引
   CREATE INDEX idx_posts_user_id ON "Post"(user_id);

   // 避免 N+1 查询
   const { data: users } = await supabase
     .from('User')
     .select('*')
     .in('id', userIds);
   ```

3. **使用 CDN**

   静态资源已通过 Vercel CDN 自动缓存。

### 7.5 支付问题

#### 问题：Stripe Webhook 验证失败

**错误信息：**
```
Error: No signatures found matching the expected signature
```

**解决方案：**

1. **确保 Webhook Secret 正确配置**

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

2. **获取 Webhook Secret**

   ```
   Stripe Dashboard → Developers → Webhooks
   → 选择 Webhook → Click to reveal
   ```

3. **验证 Webhook 签名**

   ```typescript
   import Stripe from 'stripe';
   import { buffer } from 'micro';

   const stripe = new Stripe(process.env.STRIPE_API_KEY!);

   export default async function handler(req, res) {
     const buf = await buffer(req);
     const sig = req.headers['stripe-signature']!;

     let event;

     try {
       event = stripe.webhooks.constructEvent(
         buf.toString(),
         sig,
         process.env.STRIPE_WEBHOOK_SECRET!
       );
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }

     // 处理事件
     res.json({ received: true });
   }

   export const config = {
     api: {
       bodyParser: false,
     },
   };
   ```

### 7.6 国际化问题

#### 问题：语言切换后内容未更新

**解决方案：**

1. **检查 i18n 配置**

   ```javascript
   // next.config.mjs
   const nextConfig = {
     i18n: {
       locales: ['en', 'ja', 'zh-CN', 'zh-TW', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'th', 'vi'],
       defaultLocale: 'en',
       localeDetection: false,
     },
   };
   ```

2. **使用 next-i18next**

   ```typescript
   import { useTranslation } from 'next-i18next';

   export default function Component() {
     const { t } = useTranslation('common');
     return <div>{t('hello')}</div>;
   }
   ```

3. **重新生成翻译文件**

   ```bash
   npm run i18n:sync
   ```

---

## 附录

### A. 快速部署清单

- [ ] 1. 创建 Vercel 账户并连接 GitHub
- [ ] 2. 在 Supabase 创建项目并获取连接信息
- [ ] 3. 配置 Vercel 环境变量
- [ ] 4. 配置 Supabase 数据库表结构
- [ ] 5. 配置 Stripe Webhook
- [ ] 6. 首次部署到 Vercel
- [ ] 7. 配置自定义域名
- [ ] 8. 测试所有功能
- [ ] 9. 配置 Cron Jobs
- [ ] 10. 设置监控和告警

### B. Vercel 推荐命令

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 本地开发
vercel dev

# 部署到 Preview
vercel

# 部署到 Production
vercel --prod

# 查看日志
vercel logs --follow

# 清除缓存重新构建
vercel build --force

# 列出部署
vercel list
```

### C. 有用链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Stripe 集成指南](https://stripe.com/docs/webhooks)
- [NextAuth.js 文档](https://next-auth.js.org/)

---

**文档结束**

如有任何问题，请参考 Vercel 官方文档或联系技术支持。
