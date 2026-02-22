# Video Pipeline Type 架构文档

## 概述

视频模板支持多种生成管线（Pipeline），通过数据库字段 `video_pipeline_type` 控制不同的预处理流程。最终生成视频的模型由用户选定（SORA、VIDU、Seedance 等），Pipeline 只负责预处理阶段（图片生成、Prompt 增强等）。

---

## Pipeline 类型

| Pipeline Type | 流程                                                                                                                  | 适用场景                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **type1**     | 模板 prompt → Gemini 翻译/增强 → 用户选定模型 text-to-video                                                           | 纯文本生成视频，需要 Prompt 增强     |
| **type2**     | 用户图片 + prompt1 → Gemini 生成新图片 → 新图片 + prompt2 → 用户选定模型 image-to-video                               | 需要对用户图片做风格转换后再生成视频 |
| **type3**     | 并行：(图片 + prompt1 → Gemini 生新图) + (图片 + prompt2 → Gemini 生文本 prompt3) → 新图 + prompt3 → 用户选定模型 i2v | 同时需要图片转换和智能 Prompt 生成   |
| **无/null**   | 走原有流程（`prepareVideoParams` + `getEffectInfo`）                                                                  | 旧模板，向后兼容                     |

---

## 数据流

```
┌─────────────────────────────────────────────────────────┐
│  前端                                                    │
│  选择模板 + 上传图片 + 选择视频模型 → 提交请求            │
│  meta_data 包含: video_pipeline_type, target_model       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  api/generation/submit.ts                                │
│  透传 params（含 video_pipeline_type）到 model.parseParams│
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  各视频模型 parseParams (models.ts)                       │
│  调用 processVideoPipeline(params)                        │
│  ├─ 返回 null → 走原有流程，不受影响                      │
│  └─ 返回 { imageUrl, prompt } → 覆盖 image/prompt        │
│     后续走模型正常的视频生成流程                           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  api/generation/_common/videoPipeline.ts                  │
│  统一入口: processVideoPipeline(params)                   │
│  根据 pipeline type 路由到对应处理函数                    │
│  ├─ type2: processType2()                                │
│  └─ type3: processType3()                                │
└─────────────────────────────────────────────────────────┘
```

---

## Prompt JSON 格式

数据库 `style_templates.prompt` 字段支持以下格式：

```jsonc
// 旧格式（向后兼容，无 pipeline type 或 type1）
{ "prompt": "a cat running in the rain" }

// type1：文本增强
{ "type1": { "prompt": "a cat running in {weather}" } }

// type2：图片生成 + 视频生成
{ "type2": { "prompt1": "图片生成prompt", "prompt2": "视频生成prompt" } }

// type3：图片生成 + 文本生成（并行）
{ "type3": { "prompt1": "图片生成prompt", "prompt2": "Gemini文本生成指令prompt" } }
```

---

## 关键文件

| 文件                                                    | 职责                                                     |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `api/generation/_common/videoPipeline.ts`               | Pipeline 预处理核心逻辑，独立模块                        |
| `api/generation/_common/models.ts`                      | 各视频模型的 `parseParams` 中调用 `processVideoPipeline` |
| `api/tools/_effectPrompts.ts`                           | `getVideoPipelinePrompts()` 解析模板 prompt 并做变量替换 |
| `api/_utils/index.ts`                                   | `fetchGeminiImageEdit()` 调用 Gemini 图片编辑 API        |
| `api/_utils/videoHelper.ts`                             | `STANDARD_META_FIELDS` 中包含 `video_pipeline_type`      |
| `api/getAllStyleTemplates.ts`                           | API 返回模板数据时包含 `video_pipeline_type` 字段        |
| `src/Components/ToolsPage/UnifiedTemplateGenerator.tsx` | 前端提交时将 `video_pipeline_type` 写入 `meta_data`      |
| `src/Components/StyleTemplatePicker/styles/video.ts`    | 前端模板数据转换时透传 `video_pipeline_type`             |

---

## Pipeline 处理详情

### type2 流程

```
用户图片 ──┐
           ├─→ fetchGeminiImageEdit(prompt1, 用户图片) → 新图片
prompt1 ───┘                                              │
                                                          ├─→ 视频模型 i2v → 最终视频
prompt2 ──────────────────────────────────────────────────┘
```

1. 从模板获取 `prompt1`（图片生成指令）和 `prompt2`（视频 prompt）
2. 用户图片 + prompt1 → 调用 Gemini 图片编辑 API → 生成新图片
3. 上传新图片到 Supabase Storage
4. 新图片 URL + prompt2 → 返回给模型走正常 i2v 流程

### type3 流程

```
用户图片 ──┬─→ fetchGeminiImageEdit(prompt1, 用户图片) → 新图片 ──┐
           │                                                       ├─→ 视频模型 i2v → 最终视频
           └─→ generateWithGemini(prompt2, 用户图片)  → prompt3 ──┘
```

1. 从模板获取 `prompt1`（图片生成指令）和 `prompt2`（Gemini 文本生成指令）
2. **并行执行**：
   - 用户图片 + prompt1 → Gemini 生成新图片
   - 用户图片 + prompt2 → Gemini 生成文本 prompt3
3. 新图片 URL + prompt3 → 返回给模型走正常 i2v 流程

---

## 扩展新 Pipeline

在 `videoPipeline.ts` 中添加新的处理函数即可，无需修改其他文件：

```typescript
// videoPipeline.ts
const pipelineHandlers: Record<string, PipelineHandler> = {
  type2: processType2,
  type3: processType3,
  // 新增 pipeline：
  type4: processType4,
};

async function processType4(params, prompts): Promise<PipelineResult> {
  // 你的新逻辑
  return { imageUrl, prompt };
}
```

同时在数据库对应模板中设置 `video_pipeline_type = 'type4'`，并在 prompt 字段中使用对应格式。

---

## 向后兼容

- **无 `video_pipeline_type` 的模板**：`processVideoPipeline` 返回 `null`，完全走现有流程
- **旧 prompt 格式 `{ prompt: "..." }`**：`getEffectInfo` 继续正常工作
- **`need_middleware=true` 但无 pipeline type**：继续走现有 `PromptMiddlewareProcessor` 流程
- **模型无关性**：Pipeline 只做预处理，任何支持 i2v 的视频模型都可以使用
