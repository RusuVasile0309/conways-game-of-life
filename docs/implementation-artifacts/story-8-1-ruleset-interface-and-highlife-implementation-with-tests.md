# Story 8.1: `RuleSet` interface and HighLife implementation with tests

Status: done

## Story

As a developer of the simulation core,
I want `RuleSet` as a typed interface and `highLifeRules` as a second implementation alongside `conwayRules`,
so that adding a third rule set later is a one-PR job without restructuring.

**Priority:** Stretch
**FR/NFR coverage:** FR16
**Estimated effort:** M

## Acceptance Criteria

**AC1 — `RuleSet` interface defined:**
Given `RuleSet` defined as `{ id: string; name: string; step(grid: Grid): Grid }` in `libs/types`,
When `conwayRules` and `highLifeRules` are exported from `libs/sim`,
Then both conform to the interface and are interchangeable at the call site.

**AC2 — Conway wrapped in `conwayRules: RuleSet`:**
Given `conwayRules` exported from `libs/sim/src/lib/rules/conway.ts`,
When `conwayRules.step(grid)` is called,
Then it produces the same output as the existing standalone `step(grid)` export (alias parity).

**AC3 — HighLife B36/S23 implementation:**
Given `highLifeRules` exported from `libs/sim/src/lib/rules/highlife.ts`,
When applied to a dead cell with exactly 6 live neighbors (a scenario Conway ignores),
Then that cell is born (B6 — unique to HighLife, proving divergence from Conway's B3 only).

**AC4 — Behavioral divergence test:**
Given the same starting grid with a dead cell having 6 live neighbors,
When `conwayRules.step()` and `highLifeRules.step()` are each applied,
Then `conwayRules.step()` leaves the cell dead and `highLifeRules.step()` makes it alive.

**AC5 — Known HighLife pattern test:**
Given Jest specs for `highLifeRules`,
When `pnpm nx test sim` runs,
Then specs verify: B3 birth (shared with Conway), S23 survival (shared), B6 birth (HighLife-only), and that a dead cell with 4 or 5 neighbors remains dead under HighLife (confirming only B3 and B6 trigger birth).

**AC6 — Module boundary preserved:**
Given `libs/sim` has tag `scope:sim` and the existing boundary rules,
When the new rule set lands,
Then `pnpm nx lint sim` passes — `libs/sim` still imports nothing outside `@conways-game-of-life/types`.

**AC7 — All existing tests still pass:**
Given the existing 35 tests in `libs/sim`,
When `pnpm nx test sim` runs,
Then all 35 + new HighLife tests pass with 0 regressions.

## Tasks / Subtasks

- [x] Task 1: Add `RuleSet` interface to `libs/types` (AC1)
  - [x] Open `libs/types/src/lib/types.ts`
  - [x] Add `RuleSet` interface: `{ readonly id: string; readonly name: string; step(grid: Grid): Grid; }`
  - [x] Re-export from `libs/types/src/index.ts` if not already covered by `export * from './lib/types'`

- [x] Task 2: Wrap existing `conway.ts` step with `conwayRules: RuleSet` (AC2)
  - [x] Import `RuleSet` from `@conways-game-of-life/types` in `conway.ts`
  - [x] Add `export const conwayRules: RuleSet = { id: 'conway', name: 'Conway\'s Game of Life', step };`
  - [x] Keep existing `export function step()` unchanged (backwards compatibility — web app calls it directly)

- [x] Task 3: Create `libs/sim/src/lib/rules/highlife.ts` (AC3, AC5)
  - [x] Implement `highLifeRules: RuleSet` with HighLife B36/S23 logic:
    - Dead cell born if neighbors === 3 OR neighbors === 6
    - Live cell survives if neighbors === 2 OR neighbors === 3
    - All other cases: dead
  - [x] Export `highLifeRules` as named export

- [x] Task 4: Create `libs/sim/src/lib/rules/highlife.spec.ts` (AC3, AC4, AC5)
  - [x] `describe('highLifeRules — B3 birth (shared with Conway)')`: dead cell with 3 neighbors → born
  - [x] `describe('highLifeRules — B6 birth (HighLife-only)')`: dead cell with exactly 6 neighbors → born
  - [x] `describe('highLifeRules — B4/B5 NOT a birth')`: dead cell with 4 or 5 neighbors → stays dead
  - [x] `describe('highLifeRules — S23 survival')`: live cell with 2 or 3 neighbors → survives
  - [x] `describe('highLifeRules — underpopulation')`: live cell with 0 or 1 neighbors → dies
  - [x] `describe('highLifeRules — overpopulation')`: live cell with 4+ neighbors → dies
  - [x] `describe('highLifeRules vs conwayRules — B6 divergence')`: same 6-neighbor grid produces different outputs
  - [x] `describe('highLifeRules — 2×2 block still life')`: block survives (S23 shared with Conway)

- [x] Task 5: Export new symbols from `libs/sim/src/index.ts` (AC1, AC6)
  - [x] `export * from './lib/rules/conway'` already present — `conwayRules` will be included automatically
  - [x] Add `export * from './lib/rules/highlife.js'`
  - [x] Verify `RuleSet` is re-exported: it flows via `@conways-game-of-life/types`, not through `libs/sim`

- [x] Task 6: Run tests and lint (AC6, AC7)
  - [x] `pnpm nx test sim` — 46/46 pass (35 existing + 11 new HighLife tests)
  - [x] `pnpm nx lint sim` — 0 errors (1 pre-existing warning in jest.config.cts, not introduced here)
  - [x] No `typecheck` target configured for `libs/sim`

## Dev Notes

### CRITICAL: `RuleSet` goes in `libs/types`, not `libs/sim`

The architecture doc (§5.1) specifies: `"libs/sim/src/lib/types.ts (re-exported from libs/types for cross-lib use)"`. The `RuleSet` interface will be consumed by the web app in Story 8.2 (to type the selected rule set in state). If it lives only in `libs/sim`, `apps/web` cannot import it without a boundary violation (`scope:app` cannot import from `scope:sim` directly for types). It must live in `libs/types` (tag: `scope:types`), which everything can depend on.

Add to `libs/types/src/lib/types.ts`:
```typescript
export interface RuleSet {
  readonly id: string;
  readonly name: string;
  step(grid: Grid): Grid;
}
```

### CRITICAL: `.js` extensions on ALL relative imports in `libs/sim`

`libs/sim` uses `"moduleResolution": "nodenext"` in `tsconfig.lib.json`. Every relative import **must** use `.js` extension:

```typescript
// CORRECT
import type { RuleSet } from '@conways-game-of-life/types'; // path alias — no .js needed
import { createGrid, getCell } from '../grid.js';           // relative — .js required

// WRONG — tsc will fail CI
import { createGrid, getCell } from '../grid';
```

The existing `conway.ts` uses `import { createGrid, getCell } from '../grid'` **without** `.js` — this works for Jest (which uses `@swc/jest` transform and doesn't care) but will fail `tsc`. The existing code already has this issue but is not caught because there's no `typecheck` target for `libs/sim` yet. When adding imports in `highlife.ts`, **use `.js` extensions**.

### CRITICAL: Web worker constraint — `step` must be a stateless pure function

The `step` call in Story 6.1 was moved into a Web Worker. `RuleSet.step()` is passed by reference — it cannot close over mutable React state, browser APIs, or any non-serializable value. Both `conwayRules.step` and `highLifeRules.step` must be stateless pure functions. The current `conway.ts` `step()` is already pure. `highlife.ts` must follow the same pattern.

### HighLife rules B36/S23 — exact logic

HighLife birth-survive notation: **B36/S23**
- **B** orn when: dead cell has exactly **3** or **6** live neighbors
- **S** urvives when: live cell has exactly **2** or **3** live neighbors

This differs from Conway (B3/S23) only in the added B6 birth condition. Implementation:

```typescript
import type { Grid, RuleSet } from '@conways-game-of-life/types';
import { createGrid, getCell } from '../grid.js';

function highLifeStep(grid: Grid): Grid {
  const next = createGrid(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const n =
        getCell(grid, x-1, y-1) + getCell(grid, x, y-1) + getCell(grid, x+1, y-1) +
        getCell(grid, x-1, y)                            + getCell(grid, x+1, y) +
        getCell(grid, x-1, y+1) + getCell(grid, x, y+1) + getCell(grid, x+1, y+1);
      const alive = getCell(grid, x, y) === 1;
      // B36/S23: born on 3 or 6; survives on 2 or 3
      next.cells[y * grid.width + x] = (alive
        ? n === 2 || n === 3
        : n === 3 || n === 6) ? 1 : 0;
    }
  }
  return next;
}

export const highLifeRules: RuleSet = {
  id: 'highlife',
  name: 'HighLife',
  step: highLifeStep,
};
```

### `conwayRules` wrapper — minimal change to `conway.ts`

```typescript
// Add to the BOTTOM of libs/sim/src/lib/rules/conway.ts
import type { RuleSet } from '@conways-game-of-life/types';

export const conwayRules: RuleSet = {
  id: 'conway',
  name: "Conway's Game of Life",
  step,
};
```

The existing `step` function body is unchanged. The `export function step()` stays in place — `apps/web` currently imports `step` directly from `@conways-game-of-life/sim` and that must keep working without any web app changes.

### B6 divergence test — exact coordinates

Place 6 live cells around a dead cell at (2,2) in a 5×5 grid. The following 6 cells are all neighbors of (2,2):
```
(1,1), (2,1), (3,1)  ← top row
(1,2),         (3,2) ← sides
(1,3)                ← one bottom corner
```

That gives exactly 6 neighbors of (2,2). Conway leaves (2,2) dead; HighLife births it:

```typescript
function place(w: number, h: number, coords: [number, number][]) {
  let g = createGrid(w, h);
  for (const [x, y] of coords) g = setCell(g, x, y, 1);
  return g;
}

// Dead cell at (2,2) with 6 live neighbors
const sixNeighborGrid = place(5, 5, [[1,1],[2,1],[3,1],[1,2],[3,2],[1,3]]);

it('dead cell with 6 live neighbors is born (B6)', () => {
  const next = highLifeRules.step(sixNeighborGrid);
  expect(next.cells[2 * 5 + 2]).toBe(1); // (2,2) born in HighLife
});

it('Conway leaves the same 6-neighbor cell dead', () => {
  const next = conwayRules.step(sixNeighborGrid);
  expect(next.cells[2 * 5 + 2]).toBe(0); // (2,2) stays dead in Conway
});
```

### `index.ts` update

Current `libs/sim/src/index.ts`:
```typescript
export * from './lib/grid';
export * from './lib/rules/conway';
export * from './lib/random';
export * from './lib/patterns';
```

Add one line (note `.js` extension):
```typescript
export * from './lib/rules/highlife.js';
```

**Note:** The existing lines lack `.js` extensions — do NOT fix them as part of this story to avoid scope creep and possible regressions. Only new lines must use `.js`.

### Test file pattern — follow `conway.spec.ts` exactly

```typescript
// libs/sim/src/lib/rules/highlife.spec.ts
import { createGrid, setCell } from '../grid.js';
import { highLifeRules } from './highlife.js';
import { conwayRules } from './conway.js';

function place(w: number, h: number, coords: [number, number][]) {
  let g = createGrid(w, h);
  for (const [x, y] of coords) g = setCell(g, x, y, 1);
  return g;
}

function liveCells(grid: ReturnType<typeof createGrid>): [number, number][] {
  const result: [number, number][] = [];
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.cells[y * grid.width + x] === 1) result.push([x, y]);
  return result;
}
```

### Project Structure

Files to create/modify:

| Path | Action |
|------|--------|
| `libs/types/src/lib/types.ts` | **Modify** — add `RuleSet` interface |
| `libs/sim/src/lib/rules/conway.ts` | **Modify** — add `conwayRules: RuleSet` export |
| `libs/sim/src/lib/rules/highlife.ts` | **Create** — `highLifeRules: RuleSet` |
| `libs/sim/src/lib/rules/highlife.spec.ts` | **Create** — ≥8 tests |
| `libs/sim/src/index.ts` | **Modify** — add highlife export |

### References

- [Source: docs/planning-artifacts/architecture.md#5.1] — `RuleSet` interface definition, `conwayRules`, `highLifeRules` paths
- [Source: docs/planning-artifacts/architecture.md#5.6] — module boundary tags (scope:sim → scope:types allowed)
- [Source: docs/planning-artifacts/epics.md#Story-8.1] — ACs, user story, FR16
- [Source: libs/sim/src/lib/rules/conway.ts] — existing `step` function to wrap
- [Source: libs/sim/src/lib/rules/conway.spec.ts] — test patterns to follow
- [Source: libs/types/src/lib/types.ts] — file to extend with `RuleSet`
- [Source: libs/sim/src/index.ts] — barrel to update

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `libs/types/src/index.ts` re-exports via `export * from './lib/types'` — `RuleSet` is automatically re-exported once added to `types.ts`, no barrel edit needed.
- `conway.ts` had `import type { Grid }` — widened to `import type { Grid, RuleSet }` in the same import statement.
- `highlife.ts` uses `.js` extensions on relative imports (`'../grid.js'`) as required by `moduleResolution: nodenext`.
- `index.ts`: only the new `highlife` line uses `.js` extension; existing lines left untouched to avoid unrelated scope creep.

### Completion Notes List

- `RuleSet` interface (`{ id, name, step }`) added to `libs/types/src/lib/types.ts`; automatically re-exported via existing barrel
- `conwayRules: RuleSet` export added to `conway.ts` as a thin wrapper over the existing `step()` function; `step` export preserved for backwards compatibility
- `highLifeRules: RuleSet` created in `highlife.ts` implementing B36/S23 — identical to Conway except dead cells also born on exactly 6 neighbors
- 11 new tests in `highlife.spec.ts` covering: B6 birth, Conway divergence (same grid, different output), B3 birth, B4/B5 non-birth, S23 survival (×2), underpopulation (×2), overpopulation, 2×2 block still life
- `index.ts` updated to barrel-export `highlife.ts` symbols
- Final: `pnpm nx test sim` → 46/46 (7 suites), `pnpm nx lint sim` → 0 errors

### File List

- `libs/types/src/lib/types.ts` — modified (added `RuleSet` interface)
- `libs/sim/src/lib/rules/conway.ts` — modified (added `conwayRules: RuleSet` export, widened import)
- `libs/sim/src/lib/rules/highlife.ts` — created (`highLifeRules: RuleSet`, B36/S23)
- `libs/sim/src/lib/rules/highlife.spec.ts` — created (11 tests)
- `libs/sim/src/index.ts` — modified (added highlife export)
- `docs/implementation-artifacts/story-8-1-ruleset-interface-and-highlife-implementation-with-tests.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story → done)

## Senior Developer Review (AI)

**Reviewer:** claude-sonnet-4-6 — 2026-05-14
**Outcome:** Changes Requested → Fixed → Approved

### Findings Fixed

| Severity | Issue | Fix |
|----------|-------|-----|
| MEDIUM | `conway.ts:2` — missing `.js` extension on `'../grid'` import; file was modified in this story, creating asymmetry with `highlife.ts` | Changed to `from '../grid.js'` |
| MEDIUM | `index.ts` — only `highlife.js` had `.js` extension; four other barrel entries lacked it | Added `.js` to all four remaining barrel entries |
| MEDIUM | `highlife.spec.ts` — no test for live cell with 6 neighbors dying (B6 births dead cells but kills live ones — non-obvious distinction) | Added explicit overpopulation test with comment documenting the dual behaviour |
| LOW | `highlife.spec.ts` — no empty-grid test (pattern from `conway-edge.spec.ts`) | Added `describe('highLifeRules — empty grid')` |
| LOW | `highlife.spec.ts` — no determinism test (pattern from `conway.spec.ts`) | Added `describe('highLifeRules — determinism')` with 100-run check |
