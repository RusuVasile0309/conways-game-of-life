# Story 5.1: Pattern data and `placePattern()` in `libs/sim`

Status: review

## Story

As Casey,
I want canonical patterns (block, blinker, glider, Gosper glider gun) available as typed data with a `placePattern(grid, pattern, anchorX, anchorY)` helper,
so that I can load a known interesting starting state without painting it cell-by-cell.

**Priority:** Stretch
**FR/NFR coverage:** FR13
**Estimated effort:** S

## Acceptance Criteria

**AC1 — `NamedPattern` exports:**
Given `libs/sim/src/lib/patterns.ts`,
When the module is imported,
Then it exports typed `NamedPattern` records for `block`, `blinker`, `glider`, and `gosperGliderGun`, each with `id`, `name`, `width`, `height`, and `liveCells`.

**AC2 — `placePattern` happy path:**
Given `placePattern(grid, pattern, anchorX, anchorY)`,
When called with a pattern that fits within the grid relative to the anchor,
Then it returns a new grid with the pattern's live cells placed at offsets from the anchor (i.e. `anchorX + dx`, `anchorY + dy` for each `[dx, dy]` in `liveCells`).
The input grid is NOT mutated.

**AC3 — `placePattern` out-of-bounds behavior (anchor-clip, documented):**
Given `placePattern` called with a pattern that would exceed grid bounds,
When cells would fall outside the grid,
Then those out-of-bounds cells are silently skipped (anchor-clip behavior) — no throw, no truncation of in-bounds cells.
This is the documented choice (consistent with `getCell` returning 0 for out-of-bounds, AC stated in story).

**AC4 — Tests: glider translates (1,1) in 4 steps:**
Given Jest specs in `libs/sim/src/lib/patterns.spec.ts`,
When the canonical glider is placed at anchor (1,1) on a 10×10 grid and `step()` is applied four times,
Then the live-cell positions have translated by (+1, +1) relative to the start.

**AC5 — Tests: blinker oscillates period 2:**
Given Jest specs,
When the canonical blinker is placed on a 5×5 grid and `step()` is applied twice,
Then the grid returns to the original blinker placement (period-2 oscillator verified).

**AC6 — Tests: `placePattern` rejects/clips out-of-bounds:**
Given Jest specs,
When `placePattern` is called with an anchor that places some cells outside the grid,
Then out-of-bounds cells are skipped and in-bounds cells are correctly set.

**AC7 — `index.ts` barrel exports patterns:**
Given `libs/sim/src/index.ts`,
When updated,
Then it exports `NamedPattern`, `block`, `blinker`, `glider`, `gosperGliderGun`, and `placePattern` from `./lib/patterns`.

**AC8 — Boundary rule: no forbidden imports:**
Given the `scope:sim` lint rule,
When `patterns.ts` is linted,
Then it imports only from `@conways-game-of-life/types` and sibling sim files — no React, DOM, fetch, or NestJS imports.

## Tasks / Subtasks

- [x] Task 1: Define `NamedPattern` interface and four pattern constants (AC1)
  - [x] Create `libs/sim/src/lib/patterns.ts`
  - [x] Define `NamedPattern` interface with `id`, `name`, `width`, `height`, `liveCells: ReadonlyArray<readonly [number, number]>`
  - [x] Define and export `block` (2×2 still life)
  - [x] Define and export `blinker` (3×1 horizontal oscillator)
  - [x] Define and export `glider` (3×3 5-cell spaceship)
  - [x] Define and export `gosperGliderGun` (36×9 classic gun)

- [x] Task 2: Implement `placePattern()` helper (AC2, AC3)
  - [x] Implement `placePattern(grid, pattern, anchorX, anchorY): Grid`
  - [x] Use `cloneGrid` to start from a copy (no mutation of input)
  - [x] Iterate `pattern.liveCells`, compute `(anchorX + dx, anchorY + dy)`
  - [x] Skip cells where `x < 0 || x >= grid.width || y < 0 || y >= grid.height`
  - [x] Set surviving cells via direct `Uint8Array` mutation on the clone (avoid repeated `setCell` allocation chain)

- [x] Task 3: Write Jest specs (AC4, AC5, AC6)
  - [x] Create `libs/sim/src/lib/patterns.spec.ts`
  - [x] Test: glider placed at (1,1) on 10×10, step ×4 → translates (1,1)
  - [x] Test: blinker placed on 5×5, step ×1 → vertical; step ×2 → back to horizontal
  - [x] Test: `placePattern` with anchor that clips → out-of-bounds cells skipped, in-bounds cells set
  - [x] Test: `placePattern` result is reference-distinct from input grid

- [x] Task 4: Update barrel exports (AC7)
  - [x] Add `export * from './lib/patterns';` to `libs/sim/src/index.ts`

- [x] Task 5: Verify lint (AC8)
  - [x] Run `pnpm nx lint sim` — must pass
  - [x] Run `pnpm nx test sim` — all tests pass, suite < 10s

## Dev Notes

### What already exists in `libs/sim`

The sim library is complete for the MVP core. The following are directly reusable:

| File | Exports to use |
|------|---------------|
| `libs/sim/src/lib/grid.ts` | `createGrid`, `cloneGrid`, `getCell`, `setCell`, `clearGrid` |
| `libs/sim/src/lib/rules/conway.ts` | `step(grid): Grid` |
| `libs/types/src/lib/types.ts` | `Grid` interface |

`patterns.ts` does NOT yet exist. Create it from scratch.

### `NamedPattern` interface placement

Architecture §5.1 shows `NamedPattern` defined in `libs/sim/src/lib/patterns.ts` (not in `libs/types`). This is correct for now — Story 5.1 is a stretch story and `NamedPattern` is not needed by any other scope (`api-client`, `api`, `ui`) until epics 7–8. Keep it in `libs/sim` to avoid premature lib-types inflation. If Epic 7 (NestJS persistence) is attempted, `NamedPattern` can be promoted to `libs/types` at that point.

### `placePattern` implementation guidance

**Pattern: copy via `cloneGrid` then mutate the clone's `cells` directly.**

Doing a chain of `setCell` calls (each returns a new grid) for 36 cells of the Gosper gun is wasteful — 36 allocations. Clone once, write into the `Uint8Array` directly:

```typescript
export function placePattern(
  grid: Grid,
  pattern: NamedPattern,
  anchorX: number,
  anchorY: number,
): Grid {
  const next = cloneGrid(grid);
  for (const [dx, dy] of pattern.liveCells) {
    const x = anchorX + dx;
    const y = anchorY + dy;
    if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
      next.cells[y * grid.width + x] = 1;
    }
  }
  return next;
}
```

`cloneGrid` already returns a deep-equal reference-distinct grid (uses `.slice()`), so writing into `next.cells` is safe.

### Canonical pattern coordinates (0-indexed `[dx, dy]`)

**block** — 2×2 still life:
```
XX
XX
```
`liveCells: [[0,0],[1,0],[0,1],[1,1]]` — width: 2, height: 2

**blinker** — horizontal orientation:
```
XXX
```
`liveCells: [[0,0],[1,0],[2,0]]` — width: 3, height: 1

After one `step()` placed at anchor (1,1) on a 5×5: becomes vertical column at x=1, y=0..2.
After two `step()` calls: returns to horizontal.

**glider** — classic 5-cell spaceship (bottom-left anchor):
```
.X.
..X
XXX
```
`liveCells: [[1,0],[2,1],[0,2],[1,2],[2,2]]` — width: 3, height: 3

After 4 `step()` calls placed at anchor (1,1) on a 10×10: pattern reappears at anchor (2,2) — translated (+1, +1).

**gosperGliderGun** — 36×9:
```
.........................X..........
.......................X.X..........
.............XX......XX............XX
............X...X....XX............XX
.XX........X.....X...XX..............
.XX........X...X.XX....X.X..........
...........X.....X.......X..........
............X...X...................
.............XX.....................
```
width: 36, height: 9

liveCells (verified against canonical source):
```
[24,0],
[22,1],[24,1],
[12,2],[13,2],[20,2],[21,2],[34,2],[35,2],
[11,3],[15,3],[20,3],[21,3],[34,3],[35,3],
[0,4],[1,4],[10,4],[16,4],[20,4],[21,4],
[0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],
[10,6],[16,6],[24,6],
[11,7],[15,7],
[12,8],[13,8]
```

### Test strategy for glider translation

The glider translates by (+1,+1) every 4 generations. Place at anchor `(1,1)` on a `10×10` grid (gives it enough room). After 4 steps, collect live-cell positions and shift by `(-1,-1)` relative to initial positions — they should match.

Helper approach: extract live cells as a sorted `[x,y][]` array for easy comparison:

```typescript
function liveCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.cells[y * grid.width + x] === 1) cells.push([x, y]);
  return cells;
}
```

Compare `liveCells(stepped4)` with `liveCells(initial).map(([x,y]) => [x+1, y+1])`.

### Blinker period-2 test approach

Place blinker at anchor `(1,1)` on `5×5`. Initial horizontal live cells at `(1,1),(2,1),(3,1)`.
After step 1: vertical `(2,0),(2,1),(2,2)`.
After step 2: horizontal `(1,1),(2,1),(3,1)` — matches initial.

Use `liveCells()` helper for both comparisons.

### `placePattern` out-of-bounds test

Place the glider with anchor `(-1,-1)` on a `5×5` grid. Cell `[1,0]` in the pattern → `(0,-1)` which is out-of-bounds (skipped). Cell `[2,1]` → `(1,0)` — in bounds, should be set. Verify those specific cells.

### Architecture compliance checklist

- [ ] `libs/sim/src/lib/patterns.ts` imports only `Grid` from `@conways-game-of-life/types` and `cloneGrid` from `./grid` (both within `scope:sim` or `scope:types`)
- [ ] No React, Next.js, DOM, fetch, or NestJS imports anywhere in `patterns.ts` or `patterns.spec.ts`
- [ ] All functions are pure (no mutation of inputs, no I/O, no global state)
- [ ] `patterns.spec.ts` uses Jest (`describe`/`it`/`expect`) — no external test runners
- [ ] Suite completes in < 10 seconds (NFR3)

### Project Structure Notes

Files to create/modify:

| Path | Action |
|------|--------|
| `libs/sim/src/lib/patterns.ts` | **Create** — interface + constants + helper |
| `libs/sim/src/lib/patterns.spec.ts` | **Create** — Jest specs |
| `libs/sim/src/index.ts` | **Edit** — add `export * from './lib/patterns'` |

No changes to `libs/types`, `apps/web`, or any other project for this story.

### References

- [Source: docs/planning-artifacts/epics.md#Story-5.1] — acceptance criteria, pattern list
- [Source: docs/planning-artifacts/architecture.md#5.1] — `NamedPattern` interface shape, `placePattern` signature
- [Source: docs/planning-artifacts/architecture.md#5.6] — `scope:sim` boundary rules
- [Source: libs/sim/src/lib/grid.ts] — `cloneGrid`, `createGrid`, `getCell` (reuse, do not re-implement)
- [Source: libs/sim/src/lib/rules/conway.ts] — `step()` (used in tests)
- [Source: libs/sim/src/index.ts] — barrel to extend

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward; all tests passed on first run.

### Completion Notes List

- Created `libs/sim/src/lib/patterns.ts`: `NamedPattern` interface + 4 named patterns (block, blinker, glider, gosperGliderGun) + `placePattern()` helper
- `placePattern` clones once via `cloneGrid`, then mutates the clone's `Uint8Array` directly — avoids per-cell allocation overhead vs chained `setCell` calls
- Out-of-bounds cells are silently skipped (anchor-clip behavior, documented in AC3)
- Created `libs/sim/src/lib/patterns.spec.ts`: 11 tests covering all ACs — glider translation ×4 steps, blinker period-2 oscillation, clip behavior, reference-distinct output, shape/count assertions for all 4 patterns
- Updated `libs/sim/src/index.ts` barrel to export `*` from `./lib/patterns`
- Full suite: 35 tests, 6 suites, all green in 0.25s (well under 10s NFR3 budget)
- Lint: 0 errors (1 pre-existing warning in `jest.config.cts` — unrelated)

### File List

- `libs/sim/src/lib/patterns.ts` — created
- `libs/sim/src/lib/patterns.spec.ts` — created
- `libs/sim/src/index.ts` — modified (added patterns export)
- `docs/implementation-artifacts/story-5-1-pattern-data-and-placepattern-in-libs-sim.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified (epic-5 → in-progress, story → review)
