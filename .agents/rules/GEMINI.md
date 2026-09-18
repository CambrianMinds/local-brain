# Local Brain — Agent Coding Conventions

## Project Overview
Local Brain is an Electron desktop app (React + TypeScript) that provides AI-powered document management with vector search, auto-categorization, summaries, and wiki generation.

## Architecture Rules

### Process Separation
- **Main process** (`src/main/`): Node.js — file system, DB, AI calls, heavy computation
- **Preload** (`src/preload/`): Bridge — exposes typed APIs via `contextBridge`
- **Renderer** (`src/renderer/`): React UI — never import Node.js modules directly

### IPC Communication
- All main↔renderer communication goes through typed IPC channels defined in `src/preload/`
- Never use `ipcRenderer` directly in React components; use the `window.api` bridge
- Keep IPC handlers thin — delegate to service classes

### Database
- **SQLite** (better-sqlite3): Document metadata, categories, tags, summaries, wiki pages
- **LanceDB**: Vector embeddings for semantic search
- All DB operations happen in the main process only
- Use migrations for schema changes (`src/main/db/migrations/`)

### AI Providers
- Always go through the unified provider interface (`src/main/services/ai/provider.ts`)
- Support LM Studio (local, OpenAI-compatible at localhost:1234) and OpenRouter (cloud fallback)
- Never hardcode model names — use settings/config

## Code Style
- TypeScript strict mode everywhere
- Explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `async/await` over raw Promises
- Use named exports, avoid default exports (except React page components)

## File Organization
- Feature-first in renderer: `features/<name>/` with co-located components and CSS
- Service-first in main: `services/<domain>/` with clear single-responsibility classes
- Shared types go in `src/preload/types.ts`

## CSS
- Vanilla CSS only (no Tailwind)
- Design tokens defined as CSS custom properties in `index.css`
- Dark theme by default, glassmorphism accents
- BEM-style class naming: `.block__element--modifier`

## Error Handling
- Wrap all AI calls in try/catch with graceful fallbacks
- Show user-friendly toast notifications for errors
- Log detailed errors to console in development
