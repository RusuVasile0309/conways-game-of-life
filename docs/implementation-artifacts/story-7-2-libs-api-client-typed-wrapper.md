# Story 7.2: `libs/api-client` typed wrapper

Status: done

## Story

As the web app,
I want a typed `libs/api-client` exporting `listPatterns`, `getPattern`, `savePattern`,
so that the Next.js code never calls `fetch` directly and the boundary is enforceable.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15, NFR8
**Estimated effort:** S

## Acceptance Criteria

**AC1 — Three typed functions exported from `libs/api-client`:**
Given `libs/api-client/src/lib/patterns.ts`,
When functions are imported by `apps/web`,
Then `listPatterns()`, `getPattern(id)`, and `savePattern(input)` are callable with full TypeScript types matching `SavedPattern` from `@conways-game-of-life/types`.

**AC2 — Zod response validation:**
Given zod schemas defined for `SavedPattern` and array variants,
When responses are parsed after fetch,
Then a malformed or unexpected API response throws a typed zod error rather than silently producing wrong data.

**AC3 — Module boundary enforced — no direct fetch from web:**
Given the Nx tag rules from story 1.2 (`scope:app` → no `scope:server` imports),
When any code in `apps/web` calls `fetch('/patterns')` directly or imports from `apps/api`,
Then `pnpm nx lint web` fails with a module-boundary violation.

**AC4 — Jest tests pass:**
Given jest specs for `libs/api-client`,
When `pnpm nx test api-client` runs,
Then specs cover: `listPatterns` happy path, `listPatterns` network error, `getPattern` found, `getPattern` 404 → null, `savePattern` creates pattern, zod parse error on bad response shape.

**AC5 — Typecheck and lint clean:**
Given `pnpm nx typecheck api-client` and `pnpm nx lint api-client`,
When both run,
Then zero errors.

## Tasks / Subtasks

- [x] Task 1: Install zod and wire jest + tsconfig.spec.json (AC4, AC5)
  - [x] `pnpm add zod -w`
  - [x] Copy jest.config.cts + .spec.swcrc from `libs/sim` pattern
  - [x] Create `tsconfig.spec.json` with `types: ["jest", "node"]`, include spec files
  - [x] Update `tsconfig.json` references to include `tsconfig.spec.json`
  - [x] `test` target auto-discovered by `@nx/jest/plugin` from `jest.config.cts` (no explicit target needed in package.json)
  - [x] Exclude spec files from `tsconfig.lib.json`

- [x] Task 2: Create `patterns.ts` with zod schemas and fetch functions (AC1, AC2)
  - [x] Define `savedPatternSchema` and `savedPatternArraySchema` with zod
  - [x] Implement `listPatterns(): Promise<SavedPattern[]>`
  - [x] Implement `getPattern(id: string): Promise<SavedPattern | null>` (404 → null)
  - [x] Implement `savePattern(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern>`
  - [x] Use `API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333'`

- [x] Task 3: Update barrel export (AC1)
  - [x] Replace placeholder `api-client.ts` export in `src/index.ts` with `patterns.ts` exports
  - [x] Delete or clear `src/lib/api-client.ts` placeholder

- [x] Task 4: Write Jest tests (AC4)
  - [x] Create `src/lib/patterns.spec.ts`
  - [x] Mock global `fetch` with `jest.fn()`
  - [x] Test: `listPatterns` returns parsed array on 200
  - [x] Test: `listPatterns` throws on non-ok response
  - [x] Test: `getPattern` returns pattern on 200
  - [x] Test: `getPattern` returns null on 404
  - [x] Test: `savePattern` returns created pattern on 201
  - [x] Test: zod parse error thrown on bad response shape
  - [x] Run `pnpm nx test api-client` — 8/8 pass

- [x] Task 5: Add `@conways-game-of-life/types` reference to tsconfig.lib.json (AC1, AC5)
  - [x] `pnpm nx sync` auto-wired `../types/tsconfig.lib.json` reference

- [x] Task 6: Verify module boundary enforcement (AC3)
  - [x] Run `pnpm nx lint web` — 0 errors
  - [x] Run `pnpm nx lint api-client` — 0 errors

## Dev Notes

### Architecture constraints (must follow)

From `docs/planning-artifacts/architecture.md §5.5` and `§5.6`:

**Function signatures (exact):**
```typescript
// libs/api-client/src/lib/patterns.ts
import type { SavedPattern } from '@conways-game-of-life/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

export async function listPatterns(): Promise<SavedPattern[]> { /* fetch + zod-validate */ }
export async function getPattern(id: string): Promise<SavedPattern | null> { /* ... */ }
export async function savePattern(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> { /* ... */ }
```

**Module boundary tag:** `libs/api-client` is `scope:api-client` and may only depend on `scope:types`. No NestJS, no React, no `apps/*` imports.

**`scope:api-client` allowed dependencies:**
```
scope:api-client → scope:types only
```

### Zod schema

```typescript
import { z } from 'zod';

const savedPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  liveCells: z.array(z.tuple([z.number(), z.number()])),
  createdAt: z.string(),
});

const savedPatternArraySchema = z.array(savedPatternSchema);
```

### Implementation pattern

```typescript
export async function listPatterns(): Promise<SavedPattern[]> {
  const res = await fetch(`${API_BASE}/patterns`);
  if (!res.ok) throw new Error(`listPatterns: ${res.status}`);
  return savedPatternArraySchema.parse(await res.json());
}

export async function getPattern(id: string): Promise<SavedPattern | null> {
  const res = await fetch(`${API_BASE}/patterns/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getPattern: ${res.status}`);
  return savedPatternSchema.parse(await res.json());
}

export async function savePattern(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> {
  const res = await fetch(`${API_BASE}/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`savePattern: ${res.status}`);
  return savedPatternSchema.parse(await res.json());
}
```

### `tsconfig.lib.json` moduleResolution note

`libs/api-client/tsconfig.lib.json` already uses `"module": "nodenext"` and `"moduleResolution": "nodenext"`. **Relative imports inside `libs/api-client/src/` must use `.js` extensions** (e.g. `import ... from './patterns.js'`). This is the same rule that caused failures in `libs/sim` and `api/` — apply it consistently here.

### Jest / tsconfig.spec.json pattern

Follow `libs/sim` exactly:
- `libs/sim/jest.config.cts` → copy to `libs/api-client/jest.config.cts` (change `displayName` to `'api-client'`)
- `libs/sim/.spec.swcrc` → copy to `libs/api-client/.spec.swcrc` (identical content)
- `libs/sim/tsconfig.spec.json` → copy to `libs/api-client/tsconfig.spec.json` (adjust references to point at `./tsconfig.lib.json`)
- `tsconfig.lib.json`: add `"exclude": ["jest.config.ts", "jest.config.cts", "src/**/*.spec.ts", "src/**/*.test.ts"]`
- `package.json` test target: same executor as `libs/sim` (`@nx/jest:jest`, jestConfig path `libs/api-client/jest.config.cts`)

### Testing approach

Mock global `fetch` in tests:

```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockReset());
```

Test `getPattern` 404 returns null — do NOT throw:
```typescript
mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
expect(await getPattern('nonexistent')).toBeNull();
```

Test zod parse error on malformed body:
```typescript
mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }); // id is number, not string
await expect(listPatterns()).rejects.toThrow(); // zod validation error
```

### Files to create/modify

| Path | Action |
|------|--------|
| `libs/api-client/src/lib/patterns.ts` | **Create** — three fetch functions + zod schemas |
| `libs/api-client/src/lib/patterns.spec.ts` | **Create** — ≥6 test cases |
| `libs/api-client/src/index.ts` | **Modify** — export from `./lib/patterns.js` (drop api-client.ts) |
| `libs/api-client/src/lib/api-client.ts` | **Delete or clear** — placeholder |
| `libs/api-client/jest.config.cts` | **Create** — from sim pattern |
| `libs/api-client/.spec.swcrc` | **Create** — from sim pattern |
| `libs/api-client/tsconfig.spec.json` | **Create** — jest types |
| `libs/api-client/tsconfig.lib.json` | **Modify** — add types reference, add spec excludes |
| `libs/api-client/tsconfig.json` | **Modify** — add tsconfig.spec.json reference |
| `libs/api-client/package.json` | **Modify** — add test target, add zod dependency |

### References

- [Source: docs/planning-artifacts/architecture.md#5.5] — exact function signatures, `API_BASE`, zod note
- [Source: docs/planning-artifacts/architecture.md#5.6] — module boundary tags (scope:api-client → scope:types only)
- [Source: docs/planning-artifacts/epics.md#Story-7.2] — ACs, user story
- [Source: libs/sim/] — jest.config.cts, .spec.swcrc, tsconfig.spec.json patterns to copy
- [Source: api/tsconfig.spec.json] — api project tsconfig.spec pattern (just fixed in 7.1 code review)
- [Source: libs/types/src/lib/types.ts] — SavedPattern interface

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

`pnpm nx sync` auto-wired the `../types/tsconfig.lib.json` reference in `tsconfig.lib.json` once `patterns.ts` imported from `@conways-game-of-life/types`. No manual reference edit required. Nx `@nx/jest/plugin` auto-discovered `jest.config.cts` — no explicit test target needed in `package.json`. The unused `/* eslint-disable */` in `jest.config.cts` was removed (same fix applied in 7.1 review).

### Completion Notes List

- `libs/api-client` scaffolded lib populated with `listPatterns`, `getPattern`, `savePattern` using `zod` for response validation
- `savedPatternSchema` and `savedPatternArraySchema` parse and type-check all API responses
- `getPattern` returns `null` on 404; all other non-ok statuses throw with the status code
- Jest infra wired following `libs/sim` pattern: `jest.config.cts` + `.spec.swcrc` + `tsconfig.spec.json`
- 8 passing Jest tests covering all three functions + zod error path
- `pnpm nx typecheck api-client`, `pnpm nx lint api-client`, `pnpm nx lint web` all clean

### File List

- `libs/api-client/src/lib/patterns.ts` — created (listPatterns, getPattern, savePattern + zod schemas)
- `libs/api-client/src/lib/patterns.spec.ts` — created (8 tests)
- `libs/api-client/src/index.ts` — modified (exports patterns.ts, drops api-client.ts)
- `libs/api-client/src/lib/api-client.ts` — deleted (placeholder)
- `libs/api-client/jest.config.cts` — created
- `libs/api-client/.spec.swcrc` — created
- `libs/api-client/tsconfig.spec.json` — created
- `libs/api-client/tsconfig.lib.json` — modified (spec file excludes, types reference)
- `libs/api-client/tsconfig.json` — modified (references tsconfig.spec.json)
- `libs/api-client/package.json` — modified (zod dependency)
- `package.json` — modified (zod added at workspace root via `pnpm add zod -w`)
- `pnpm-lock.yaml` — modified (lockfile updated)
- `docs/implementation-artifacts/story-7-2-libs-api-client-typed-wrapper.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified

## Senior Developer Review (AI)

**Reviewer:** claude-sonnet-4-6 — 2026-05-14
**Outcome:** Changes Requested → Fixed → Approved

### Findings Fixed

| Severity | Issue | Fix |
|----------|-------|-----|
| MEDIUM | AC4 gap: "network error" test was HTTP 500, not fetch rejection | Added `propagates network errors (fetch rejection)` test using `mockRejectedValueOnce` |
| MEDIUM | Task 1 subtask description implied manual test target in package.json | Updated subtask text to reflect auto-discovery by `@nx/jest/plugin` |
| MEDIUM | `package.json` + `pnpm-lock.yaml` missing from File List | Added both to File List |
| LOW | `savePattern` test didn't verify `Content-Type: application/json` header | Added header assertion to `objectContaining` check |
