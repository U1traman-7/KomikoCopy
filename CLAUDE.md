# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ComicEditor (Komiko) is an AI-powered comic and media creation platform built with Next.js 14, React, and Konva.js for canvas-based editing. The application supports character creation, AI-generated images/videos, social feeds, and real-time collaboration features.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server with Turbo (requires Vercel CLI for API routes)
npm run build            # Production build (runs prebuild → build:tools → sitemap)
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Build Scripts
```bash
npm run build:tools      # Extract tool metadata from comments
npm run sitemap          # Generate XML sitemap for SEO
```

### Internationalization
```bash
npm run i18n:init        # Initialize translations
npm run i18n:update      # Update existing translations
npm run i18n:sync        # Sync translation files
npm run i18n:translate-variants  # Translate variant pages
```

### Variant Generation
```bash
npm run gen              # Generate SEO variant pages
npm run gen:list         # List available tools
npm run gen:setup        # Setup variant generation
```

## Environment Requirements

- **Node.js**: v20.xx (newer versions may not work)
- **Platform**: macOS or Linux/WSL (Windows has directory structure issues)
- **Backend**: All API routes run on Vercel (use Vercel CLI for local development)
- **Required**: `.env` file with API keys (request from team)

## Architecture Overview

### Canvas System (Konva.js)

The canvas implementation is centered in `/src/Components/InfCanva/InfCanva.tsx` (86KB core file).

**Key Concepts:**

1. **CNode Abstraction Layer**: Custom node representation separate from Konva nodes
   - Defined in `/src/state/CNodeType.ts`
   - CNodes are the developer-facing abstraction for canvas elements
   - Each CNode may consist of multiple Konva.Shape/Konva.Node objects

2. **Node Types**:
   - `ComicPage`: Konva.Rect (background) + Konva.Group (containing images)
   - `ComicImage`: Single Konva.Image or grouped images
   - `ComicText`: Text elements
   - `ComicBubble`: Speech bubbles with Konva.Group wrapper
   - `ComicMarkArea`: Selection/marking areas

3. **State Synchronization**:
   - Konva maintains its own internal state for transformations
   - Listen to Konva events via `useListenTransform` and `onDragend` in InfCanva.tsx
   - Update `appStateAtom` whenever Konva.Shape updates
   - **Critical**: Transformer events target the outermost Konva.Group, not inner shapes

4. **Image Handling**:
   - Images go through `asyncImageFunc` for placeholder → async loading → update cycle
   - Image scaling considers: stage scale (STAGE_SCALE_VALUE), layer scale, image scale, parent group scale
   - Use `getClientRect()` to get rendered dimensions
   - Three image states:
     - Standalone on Layer (parent is layer, may lack width/height attrs)
     - Inside ComicPage (wrapped in `image-groups-xxxx` Konva.Group)
     - Inside ComicBubble (same wrapping pattern)

5. **History System**:
   - Undo/redo via `historyAtom`, `prevStepsAtom`, `redoStepsAtom`
   - Diff-based history tracking for performance

### State Management (Jotai)

Located in `/src/state/index.ts` (742 lines).

**Core Atoms:**
- `appStateAtom: CNode[]` - Canvas tree structure
- `historyAtom: HistoryItem[]` - Undo/redo stack
- `authAtom`, `profileAtom` - User authentication
- `characterListAtom` - User's characters
- `postListAtom`, `feedTagAtom` - Social feed
- `channelStateAtom` - Supabase Realtime connection

**Pattern**: Uses `atomWithStorage` for localStorage persistence. Variables should be extracted from InfCanva.tsx into `/src/store` directory over time.

**Hooks**: Reusable logic is encapsulated in `/src/hooks`. When adding new hooks, copy existing patterns and modify the return logic. Avoid unnecessary refactoring unless deeply familiar with React hooks rules.

### API Architecture

APIs are Vercel serverless functions in `/api` directory.

**Middleware Pattern** (`/api/_utils/withHandler.ts`):
```
Request → [auth] → [benefits] → [tryGenerate] → [canConsume]
       → [replaceCharacterPrompts] → [translate] → [improvePrompt]
       → Handler (4.5min timeout) → Response
```

**Key Middleware:**
- `auth`: Validates NextAuth session
- `benefits`: Applies subscription tier multipliers
- `tryGenerate`: Rate limiting for free tier
- `canConsume`: Credit validation
- `replaceCharacterPrompts`: Injects character descriptions into prompts
- `translate`: Prompt translation
- `improvePrompt`: Prompt enhancement

**API Structure:**
- `/api/_utils`: Core utilities, middleware, models
- `/api/_models`: User model, roles, credit management
- `/api/v2/generateImage*.ts`: 21+ AI generation endpoints (Flux, SDXL, Illustrious, etc.)
- `/api/tools/*.ts`: Image processing (upscale, background-removal, style-transfer)
- `/api/character`, `/api/post`, `/api/tag`: Resource endpoints

### Database (Supabase + PostgreSQL)

**Key Tables:**
- `User`: Authentication and profiles
- `CustomCharacters`: Character definitions (with `normalized_category`, `is_official`, `is_nsfw`)
- `CollectedCharacters`: Character adoption system
- `Post`: Social feed
- `messages`: Real-time messaging

**Patterns:**
- Row-Level Security (RLS) for authorization
- Soft deletes via `is_active` flag
- PostgreSQL functions for complex operations (rpc calls)
- Supabase Realtime for live updates (WebSocket-based)

### Path Aliases (tsconfig.json)

```
@/components or @/Components → src/Components
@/ui → src/Components/common
@/utils → src/utilities
@/state → src/state
@/hooks → src/hooks
@/api → src/api
@/lib → src/lib
@/styles → src/styles
```

## Critical Development Principles

### Code Modification Rules (from 开发原则.md)

1. **Do not modify working code**, especially backend code. If modification is necessary, consult the original author (use GitLens to identify).

2. **Add new code rather than modifying old code** when possible.

3. **Comprehensive test coverage is mandatory** before any refactoring.

4. **Write the simplest possible code**. Code should be understandable by new graduates to reduce cognitive load and prevent AI from over-complicating.

5. **Test extensively**. AI is not infallible—verify everything.

### Canvas Development Guidelines (from readme-cn.md)

1. **InfCanva.tsx contains the main logic** and needs refactoring:
   - Extract variables to atoms in `/src/store`
   - Extract reusable logic to hooks in `/src/hooks`

2. **Avoid react-konva** unless deeply familiar with Konva.js internals. Use vanilla Konva with refs.

3. **When transforming nodes**, remember:
   - ComicBubble and ComicPage: transformer acts on outer Konva.Group
   - ComicImage: transformer acts directly on Konva.Image
   - Always check which element receives the transform event

4. **Image dimension calculations** must account for:
   - `STAGE_SCALE_VALUE` constant (in `src/constants`)
   - Layer scale
   - Konva.Image scale attribute
   - Parent Konva.Group scale
   - Use `getClientRect()` when dimensions are unclear

5. **RightSidebar and Options components** have excessive prop drilling—refactor using hooks and state management.

## Important Configuration

### next.config.mjs

**Critical Settings:**
- `experimental.serverComponentsExternalPackages`: Excludes canvas/konva/three from SSR bundling
- `experimental.optimizePackageImports`: Code-splits lucide-react and date-fns
- `webpack.cacheGroups`: Splits heavy libs (canvas, konva, PoseEditor, InfCanva)
- `i18n`: Multi-domain support (komiko.app for English, komikoai.com for JP/KR)
- `redirects`, `rewrites`: URL routing and API proxying
- `images.remotePatterns`: Whitelists CDNs (Supabase, Ghost, etc.)

### Force Dynamic Rendering

Most pages use `export const dynamic = 'force-dynamic'` to prevent SSR caching issues with browser APIs (canvas, localStorage).

## Common Patterns

### Character System

- **Official Characters**: Immutable, globally accessible, curated by team
- **Custom Characters (OCs)**: User-created with adoption/collection tracking
- **NSFW Filtering**: Cookie-based (`relax_content` flag)
- Categories auto-normalized via `slugify`

### AI Generation Flow

1. User inputs prompt
2. Middleware: translate → character injection → improvement
3. Credit validation
4. Model selection (21+ options)
5. Async generation via FAL.ai, Replicate, or proprietary services
6. Result stored and displayed

### Async Component Loading

Pages use dynamic imports to delay loading heavy libraries:

```typescript
const loadCanvasUtils = async () => {
  const [Grids, utils] = await Promise.all([
    import('./Components/Grids'),
    import('./utils/canvas')
  ])
}
```

This reduces initial bundle size for pages that don't need canvas.

## Testing & Deployment

- **Build Process**: `prebuild` → `build:tools` → `sitemap` → `next build`
- **Deployment**: Vercel (serverless functions with 4.5min timeout)
- **Monitoring**: Mixpanel + PostHog analytics, Sentry for errors
- **Payment**: Stripe integration for subscriptions

## Key Files to Read First

1. `/src/state/index.ts` - All Jotai atoms
2. `/src/Components/InfCanva/InfCanva.tsx` - Canvas editor core
3. `/api/_utils/withHandler.ts` - API middleware system
4. `/src/pages/ai-comic-generator.tsx` - Example complex tool page
5. `/readme-cn.md` - Canvas implementation details (Chinese)
6. `/开发原则.md` - Development principles (Chinese)
7. `next.config.mjs` - Build and deployment config

## Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Jotai, Tailwind CSS, NextUI
- **Canvas**: Konva.js, react-konva
- **Backend**: Vercel Functions, Supabase (PostgreSQL), Supabase Realtime
- **AI APIs**: OpenAI, Google GenAI, FAL.ai, Replicate, Hedra, RunwayML
- **Auth**: NextAuth.js 4.24.7 (customized)
- **Analytics**: Mixpanel, PostHog, Vercel Analytics
- **Payments**: Stripe
- **i18n**: i18next (15+ languages)

## 代码风格
- 使用 TypeScript
- 使用 ESLint 和 Prettier 进行代码检查和格式化
- 考虑 .eslintrc.cjs 和 .prettierrc.cjs 文件的配置
- **每次改动代码后**请运行 `npx eslint {filename} --fix` filename为改动的文件


## 提交规范
- 遵守Git Commit Angular提交规范

## 称呼
- 请在每次回答中称呼我 Mr. K
- 回答使用中文，除非用户要求使用其他语言

