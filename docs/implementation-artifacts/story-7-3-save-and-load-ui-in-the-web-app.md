# Story 7.3: Save and Load UI in the web app

Status: review

## Story

As Casey,
I want to save a starting state with a name and reload it later from a list,
so that I don't have to repaint patterns I want to come back to.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15
**Estimated effort:** M

## Acceptance Criteria

**AC1 — Save a non-empty grid:**
Given a non-empty grid and a name input,
When the user activates Save,
Then the web app calls `savePattern` from `@conways-game-of-life/api-client` and the saved pattern appears in the saved-patterns list within the same session.

**AC2 — Load saved patterns list:**
Given saved patterns exist,
When the user opens the saved-patterns list,
Then the list is fetched via `listPatterns` and each entry is selectable.

**AC3 — Select and load a saved pattern:**
Given the user selects a saved pattern,
When the selection is confirmed,
Then the grid resizes to the pattern's dimensions, the pattern's live cells are placed, and the gen counter resets to 0.

**AC4 — Error handling:**
Given a network or validation failure,
When Save or Load is attempted,
Then a visible error message is shown and no partial state persists (grid remains unchanged).

**AC5 — Boundary enforced:**
Given the Nx tag rules,
When `pnpm nx lint web` runs,
Then zero boundary errors (no direct `fetch` calls from `apps/web`).

**AC6 — Typecheck and lint clean:**
Given `pnpm nx typecheck web` and `pnpm nx lint web`,
When both run,
Then zero errors (including fixing the pre-existing typo on page.tsx:33).

## Tasks / Subtasks

- [x] Task 1: Fix pre-existing typo in `page.tsx` (AC6)
  - [x] Line 33: `t setGenPerSec(value)` → `setGenPerSec(value)` — stray `t ` character

- [x] Task 2: Create `SaveLoadPanel.tsx` component (AC1, AC2, AC3, AC4)
  - [x] Name input (`<input type="text">`) bound to `saveName` state
  - [x] Save button: disabled when `saveName.trim() === ''` or `isSaving`; calls `handleSave`
  - [x] Saved-patterns list: fetched via `listPatterns()` on mount + after each successful save
  - [x] Each list item is a clickable button calling `onLoad(pattern)` with the `SavedPattern`
  - [x] Error banner for save/load failures (non-null `errorMsg` state)
  - [x] No direct `fetch` calls — import only from `@conways-game-of-life/api-client`

- [x] Task 3: Add `handleSave` and `handleLoadSaved` to `page.tsx` (AC1, AC3)
  - [x] `handleSave(name: string)`: extract `liveCells` from current grid (see helper below), call `savePattern`, do NOT mutate grid on success
  - [x] `handleLoadSaved(pattern: SavedPattern)`: `createGrid(pattern.width, pattern.height)` + `setCell` loop, `setGeneration(0)`, `setIsRunning(false)`
  - [x] Import `setCell` from `@conways-game-of-life/sim` (already exported via `export * from './lib/grid'`)
  - [x] Import `listPatterns`, `savePattern` from `@conways-game-of-life/api-client`

- [x] Task 4: Wire `SaveLoadPanel` into `page.tsx` layout (AC1, AC2, AC3, AC4)
  - [x] Add `<SaveLoadPanel>` inside the `<aside>` after `<SizeForm>`, passing `onSave` and `onLoad` callbacks
  - [x] Pass `grid` as a prop (or `liveCells` derived from grid) for the save payload

- [x] Task 5: Verify all CI checks pass locally (AC5, AC6)
  - [x] `pnpm nx lint web` — 0 errors (1 pre-existing warning in next.config.js, not introduced here)
  - [x] `tsc --noEmit -p apps/web/tsconfig.json` — 0 errors
  - [x] `pnpm nx test web` — 2/2 pass, no regressions
  - [x] `pnpm nx test api-client` — 9/9 pass after moduleResolution fix
  - [x] `pnpm nx lint api-client` — 0 errors

## Dev Notes

### Critical helper: grid → liveCells

The `savePattern` API expects `{ name, width, height, liveCells: [number, number][] }`.
Extract live cells from the `Uint8Array` grid:

```typescript
function gridToLiveCells(grid: Grid): [number, number][] {
  const live: [number, number][] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.cells[y * grid.width + x] === 1) live.push([x, y]);
    }
  }
  return live;
}
```

Keep this as a module-level function in `page.tsx` or in `SaveLoadPanel.tsx` — **do NOT put it in `libs/sim`** (that lib is pure and has its own test surface; this is UI glue).

### Critical helper: SavedPattern → Grid

```typescript
function savedPatternToGrid(pattern: SavedPattern): Grid {
  let g = createGrid(pattern.width, pattern.height);
  for (const [x, y] of pattern.liveCells) {
    g = setCell(g, x, y, 1);
  }
  return g;
}
```

`setCell` is already exported from `@conways-game-of-life/sim` (`export * from './lib/grid'`). Add it to the existing import line in `page.tsx`.

### SavedPattern type

`SavedPattern.liveCells` is typed `ReadonlyArray<readonly [number, number]>` in `libs/types`. The `for...of` destructuring `const [x, y] of pattern.liveCells` works fine with this type — no cast needed.

### Pre-existing bug to fix (line 33 of page.tsx)

```typescript
// BEFORE (broken — stray 't ' prefix)
   t setGenPerSec(value);

// AFTER
    setGenPerSec(value);
```

Fix this in the same PR as the story implementation. It's the only change in `page.tsx` not related to Save/Load.

### API is in-memory — no persistence across server restarts

`apps/api` uses `InMemoryPatternRepository`. Saved patterns live only for the server's lifetime. This is by design for story 7.3; Prisma SQLite upgrade is story 7.4. Do not attempt to add persistence here.

### Error handling contract (AC4)

On `savePattern` failure:
- Show error message above/below the save button
- Do NOT clear `saveName` input
- Do NOT reload patterns list

On `listPatterns` failure:
- Show error message in the load section
- Leave the patterns list empty (or last-fetched state)

On `handleLoadSaved` failure (unexpected — `savedPatternToGrid` is pure):
- Wrap in try/catch; show error; do NOT update `grid` state if an error occurred

```typescript
async function handleSave(name: string) {
  setIsSaving(true);
  setSaveError(null);
  try {
    await savePattern({ name, width: grid.width, height: grid.height, liveCells: gridToLiveCells(grid) });
    // refresh list after successful save
    const updated = await listPatterns();
    setSavedPatterns(updated);
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Save failed');
  } finally {
    setIsSaving(false);
  }
}
```

### Save button guard: non-empty grid

Block Save (disable button or show inline message) when `!grid.cells.some(Boolean)` — an empty grid is valid to save technically but meaningless. AC1 says "non-empty grid" as the precondition.

### Tailwind class conventions in page.tsx

Reuse the established class variables — do not introduce new class strings:

```typescript
const btnBase = 'rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600';
const btnSecondary = `${btnBase} px-3 py-2 bg-white border-neutral-300 text-cyan-700 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed`;
```

For the `SaveLoadPanel` component, accept these as props or define locally using the same Tailwind pattern (same classes, not new ones). Do NOT introduce new Tailwind color tokens.

### Module boundary: api-client import

```typescript
// CORRECT — route through scope:api-client
import { listPatterns, savePattern } from '@conways-game-of-life/api-client';

// FORBIDDEN — direct fetch from scope:app
fetch('/patterns')   // ← lint error
fetch('http://localhost:3333/patterns')  // ← lint error
```

`NEXT_PUBLIC_API_BASE_URL` env var is consumed inside `libs/api-client/src/lib/patterns.ts` (already done in 7.2). The web app does NOT need to reference this env var directly.

### State wiring options

**Option A (recommended):** Move `savedPatterns`, `saveError`, `saveName` state into `SaveLoadPanel.tsx` as local state. The component receives `grid` and `onLoadPattern` as props. Keeps `page.tsx` clean.

```typescript
interface SaveLoadPanelProps {
  grid: Grid;
  onLoadPattern: (pattern: SavedPattern) => void;
  disabled?: boolean;
}
```

**Option B:** Keep all state in `page.tsx`, pass everything as props. More verbose but equally correct.

Option A is preferred — it follows the same isolation pattern as `PatternSelector.tsx`.

### Component file location

```
apps/web/src/app/components/SaveLoadPanel.tsx   ← new file
apps/web/src/app/page.tsx                       ← modify (typo fix + wire SaveLoadPanel)
```

No new lib file needed. `SaveLoadPanel.tsx` is purely presentational + async I/O glue. It must NOT be in `libs/ui` (that lib has no API-client dependency and cannot have one per tag rules).

### Project Structure Notes

- `apps/web` is `scope:app`. Can import from `scope:api-client`, `scope:sim`, `scope:ui`, `scope:types`.
- `libs/api-client` is `scope:api-client`. Already exports `listPatterns`, `getPattern`, `savePattern`.
- Do NOT add new Nx targets or project.json changes — the existing `web` targets (lint, typecheck, test) all run.
- The `NEXT_PUBLIC_API_BASE_URL` env var is optional at build time (defaults to `http://localhost:3333` inside `patterns.ts`).

### References

- [Source: docs/planning-artifacts/epics.md#Story-7.3] — ACs, user story, preconditions
- [Source: docs/planning-artifacts/architecture.md#5.5] — api-client function signatures
- [Source: docs/planning-artifacts/architecture.md#5.6] — module boundary tag rules
- [Source: docs/planning-artifacts/architecture.md#5.8] — error handling: "visible message, no partial state"
- [Source: libs/api-client/src/lib/patterns.ts] — savePattern, listPatterns, getPattern signatures
- [Source: libs/types/src/lib/types.ts] — SavedPattern interface (liveCells type)
- [Source: libs/sim/src/lib/grid.ts via export * from './lib/grid'] — setCell, createGrid
- [Source: apps/web/src/app/components/PatternSelector.tsx] — component structure to follow
- [Source: apps/web/src/app/page.tsx:33] — pre-existing typo to fix (`t setGenPerSec`)
- [Source: docs/implementation-artifacts/story-7-2-libs-api-client-typed-wrapper.md] — 7.2 dev notes, zod fix pattern

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `libs/api-client/tsconfig.lib.json` had `"moduleResolution": "nodenext"` which requires `.js` extensions on relative imports. This made `libs/api-client/src/index.ts` export `'./lib/patterns.js'` — webpack resolved it fine via `extensionAlias` but Turbopack (Next.js 15 default dev server) resolves extensions literally and threw `Module not found: Can't resolve './lib/patterns.js'`. Fixed by changing `tsconfig.lib.json` to `"module": "esnext" / "moduleResolution": "bundler"` (matching `libs/sim`), removing the `.js` extension from the barrel. Jest tests and tsc both continue to pass.
- `apps/web/tsconfig.json` was missing a `references` entry for `libs/api-client`. The path alias (`@conways-game-of-life/api-client`) was already there, but without the TypeScript project reference, `tsc --noEmit` threw TS6307. Added `{ "path": "../../libs/api-client" }` to `references`.

### Completion Notes List

- `SaveLoadPanel.tsx` created: self-contained component that manages its own save/load state; fetches `listPatterns()` on mount and after each successful save; shows error alert on failure without mutating grid; save button disabled on empty grid or empty name
- `handleLoadSaved` added to `page.tsx`: converts `SavedPattern.liveCells` → Grid via `createGrid` + `setCell` loop; resets generation counter and stops simulation
- `gridToLiveCells` helper in `SaveLoadPanel.tsx`: iterates `Uint8Array` to produce `[x, y][]` for the save payload
- Pre-existing typo on `page.tsx:33` (`t setGenPerSec`) fixed
- `libs/api-client/tsconfig.lib.json` changed from `nodenext` → `bundler` moduleResolution to fix Turbopack compatibility
- `apps/web/tsconfig.json` references extended to include `libs/api-client`
- All CI checks pass: `tsc --noEmit` (web), `pnpm nx lint web`, `pnpm nx test web` (2/2), `pnpm nx test api-client` (9/9), `pnpm nx lint api-client`

### File List

- `apps/web/src/app/components/SaveLoadPanel.tsx` — created (desktop save/load UI panel)
- `apps/web/src/app/components/Modal.tsx` — created (reusable modal wrapper with ESC + backdrop)
- `apps/web/src/app/components/SavePatternModal.tsx` — created (mobile save modal)
- `apps/web/src/app/components/LoadPatternModal.tsx` — created (mobile load modal)
- `apps/web/src/app/components/PatternSelector.tsx` — modified (replaced native `<select>` with custom accessible dropdown)
- `apps/web/src/app/svgs/SaveIcon.tsx` — created (floppy-disk SVG for mobile FAB)
- `apps/web/src/app/svgs/LoadIcon.tsx` — created (folder+arrow SVG for mobile FAB)
- `apps/web/src/app/lib/grid-utils.ts` — created (shared `gridToLiveCells` utility)
- `apps/web/src/app/lib/button-classes.ts` — created (shared Tailwind button class constants)
- `apps/web/src/app/page.tsx` — modified (typo fix, `handleLoadSaved`, mobile FABs, modal state, `SaveLoadPanel` wiring)
- `apps/web/tsconfig.json` — modified (added `libs/api-client` to `references`)
- `libs/api-client/src/index.ts` — modified (explicit named exports, removed `.js` extension)
- `libs/api-client/src/lib/patterns.ts` — modified (fixed `NEXT_PUBLIC_API_BASE_URL` env var name)
- `libs/api-client/tsconfig.lib.json` — modified (`nodenext` → `bundler` moduleResolution)
- `api/src/main.ts` — modified (CORS enabled with configurable comma-separated origin list)
- `docs/implementation-artifacts/story-7-3-save-and-load-ui-in-the-web-app.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story status updated)
