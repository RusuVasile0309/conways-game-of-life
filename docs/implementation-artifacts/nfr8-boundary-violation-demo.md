# NFR8: Module boundary violation demonstration

**Story:** 1-2 — Configure Nx tags and prove module boundaries fire
**Date:** 2026-05-12

## What was done

Added a deliberate cross-boundary import to `libs/sim/src/index.ts`:

```ts
import { listPatterns } from '@conways-game-of-life/api-client';
```

`scope:sim` is only allowed to depend on `scope:types` per the architecture §5.6 allow-list.
Importing from `scope:api-client` is a forbidden boundary crossing.

## Lint output (exit code 1)

```
/Users/vasilerusu/Desktop/Projects/conways-game-of-life/libs/sim/src/index.ts
  2:1  error  A project tagged with "scope:sim" can only depend on libs tagged with "scope:types"  @nx/enforce-module-boundaries

✖ 2 problems (1 error, 1 warning)
```

The violation was reverted immediately and does not appear in any merged commit.

## Tag taxonomy in effect

| Project         | Tag(s)            |
|-----------------|-------------------|
| `apps/web`      | `scope:app`       |
| `apps/web-e2e`  | `scope:e2e`       |
| `libs/sim`      | `scope:sim`       |
| `libs/types`    | `scope:types`     |
| `libs/ui`       | `scope:ui`        |
| `libs/api-client` | `scope:api-client` |

## Allowed dependency directions

```
scope:app        → scope:sim, scope:ui, scope:api-client, scope:types
scope:server     → scope:sim, scope:types
scope:api-client → scope:types
scope:ui         → scope:types
scope:sim        → scope:types  (sim must stay pure — no React, no fetch, no Nest)
scope:types      → (leaf, no dependencies)
scope:e2e        → scope:app, scope:types
```
