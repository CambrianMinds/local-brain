Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/lobehub/lobehub/canary/.agents/skills/desktop/SKILL.md

---

---
name: desktop
description: Electron desktop development guide — IPC handlers, controllers, preload scripts, window/menu management.
disable-model-invocation: true
---

# Desktop Development Guide

## Architecture Overview

LobeHub desktop is built on Electron with main-renderer architecture:

1. **Main Process** (`apps/desktop/src/main`): App lifecycle, system APIs, window management
2. **Renderer Process**: Reuses web code from `src/`
3. **Preload Scripts** (`apps/desktop/src/preload`): Securely expose main process to renderer

## Adding New Desktop Features

### 1. Create Controller

Location: `apps/desktop/src/main/controllers/`

```typescript
import { ControllerModule, IpcMethod } from '@/controllers';

export default class NewFeatureCtr extends ControllerModule {
  static override readonly groupName = 'newFeature';

  @IpcMethod()
  async doSomething(params: SomeParams): Promise<SomeResult> {
    // Implementation
    return { success: true };
  }
}
```

Register in `apps/desktop/src/main/controllers/registry.ts`.

### 2. Define IPC

