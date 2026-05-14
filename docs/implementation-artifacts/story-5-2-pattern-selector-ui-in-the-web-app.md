# Story 5.2: Pattern selector UI in the web app

Status: review

## Story

As Casey,
I want a pattern dropdown (or button list) in the web app,
so that I can pick a glider or Gosper gun and see it placed on the grid.

**Priority:** Stretch
**FR/NFR coverage:** FR13
**Estimated effort:** S

## Acceptance Criteria

**AC1 — Patterns listed with names:**
Given the pattern selector is rendered,
When the user opens it,
Then the four named patterns (Block, Blinker, Glider, Gosper Glider Gun) are listed with their human-readable names and a small icon representing each.

**AC2 — Pattern fits grid → placed centered, gen counter resets:**
Given the user selects a pattern whose `width <= grid.width` AND `height <= grid.height`,
When the selection is confirmed,
Then `placePattern` is called with anchor `(Math.floor((grid.width - pattern.width) / 2), Math.floor((grid.height - pattern.height) / 2))`, the resulting grid is set as state, the simulation is paused, and the generation counter resets to 0.

**AC3 — Pattern doesn't fit → auto-resize grid, then place centered:**
Given the user selects a pattern whose `width > grid.width` OR `height > grid.height`,
When the selection is confirmed,
Then the grid is first resized to `Math.max(grid.width, pattern.width + 4)` × `Math.max(grid.height, pattern.height + 4)`, the pattern is placed centered on the new grid, the simulation is paused, and the generation counter resets to 0.
(The "+4" adds a two-cell border on each side so the pattern is not flush against the edge.)

**AC4 — SVG icons for all four patterns:**
Given `apps/web/src/app/svgs/`,
When inspected,
Then it contains `BlockIcon.tsx`, `BlinkerIcon.tsx`, `GliderIcon.tsx`, and `GosperGliderGunIcon.tsx`, each exporting a React component that renders a pixel-art SVG representation of that pattern using `<rect>` elements.
The icon style matches the existing SVG components (accepts an optional `size` prop, uses `aria-hidden="true"`).

**AC5 — Keyboard accessible:**
Given the pattern selector,
When the user navigates via Tab and activates via Enter/Space,
Then the control is fully keyboard-operable consistent with the rest of the controls (NFR6/FR12).

**AC6 — Selector is visible at both desktop and 375px portrait:**
Given the page at any supported viewport,
When rendered,
Then the pattern selector is visible and usable without horizontal scroll.

## Tasks / Subtasks

- [x] Task 1: Create SVG icon components (AC4)
  - [x] Create `apps/web/src/app/svgs/BlockIcon.tsx` — 2×2 pixel-art cells
  - [x] Create `apps/web/src/app/svgs/BlinkerIcon.tsx` — 3 horizontal cells
  - [x] Create `apps/web/src/app/svgs/GliderIcon.tsx` — 5-cell L-shape glider
  - [x] Create `apps/web/src/app/svgs/GosperGliderGunIcon.tsx` — stylised gun shape

- [x] Task 2: Create `PatternSelector` component (AC1, AC5, AC6)
  - [x] Create `apps/web/src/app/components/PatternSelector.tsx`
  - [x] Import `block`, `blinker`, `glider`, `gosperGliderGun` from `@conways-game-of-life/sim`
  - [x] Import the four new icon components
  - [x] Render a `<select>` (native, keyboard-native) with a blank first option ("Load pattern…") and one `<option>` per pattern
  - [x] Show the selected pattern's icon inline next to the `<select>` label area
  - [x] Accept `onSelect: (pattern: NamedPattern) => void` and `disabled?: boolean` props
  - [x] Style with Tailwind consistent with existing `btnSecondary` class family
  - [x] Reset `<select>` to blank after each selection (controlled, value always "")

- [x] Task 3: Wire into `page.tsx` (AC2, AC3)
  - [x] Import `placePattern`, `NamedPattern` from `@conways-game-of-life/sim`
  - [x] Implement `handlePatternSelect(pattern: NamedPattern)`:
    - Pause simulation (`setIsRunning(false)`)
    - Compute `newWidth = Math.max(grid.width, pattern.width + 4)`
    - Compute `newHeight = Math.max(grid.height, pattern.height + 4)`
    - Create new grid: `createGrid(newWidth, newHeight)` (or reuse current if same size)
    - Compute anchor: `anchorX = Math.floor((newWidth - pattern.width) / 2)`, same for Y
    - Call `placePattern(newGrid, pattern, anchorX, anchorY)` → set as grid state
    - Reset generation to 0
  - [x] Render `<PatternSelector onSelect={handlePatternSelect} disabled={isRunning} />` inside the aside controls section

- [x] Task 4: Verify lint + typecheck + tests
  - [x] Run `pnpm nx lint web` — 0 errors
  - [x] Run `pnpm exec nx affected -t typecheck --base=origin/main` — passes
  - [x] Run `pnpm nx test sim` — 35/35 still green (no regressions)

## Dev Notes

### Existing app structure

| File | Role |
|------|------|
| `apps/web/src/app/page.tsx` | Root `'use client'` component — owns all state, handlers |
| `apps/web/src/app/components/GameCanvas.tsx` | Canvas renderer + cell toggle |
| `apps/web/src/app/components/SizeForm.tsx` | Width/height resize form |
| `apps/web/src/app/svgs/*.tsx` | SVG icon React components with `size` prop + `aria-hidden` |
| `apps/web/src/app/game.css` | CSS for canvas sizing / responsive |

### SVG icon design guidance

Each icon should be a small pixel-art grid using `<rect>` elements on a transparent background. Recommended viewBox: `0 0 20 20` with cell size 4px and 1px gap.

**BlockIcon** — 2×2 block, centered on 20×20:
```
cells at: (7,7), (12,7), (7,12), (12,12) — each 4×4 rect
```

**BlinkerIcon** — 3 horizontal cells, centered:
```
cells at: (3,8), (8,8), (13,8) — each 4×4 rect
```

**GliderIcon** — canonical glider (5 cells):
```
.X.    → (8,4)
..X    → (12,8)
XXX    → (4,12),(8,12),(12,12)
cell size 4px on 20×20 viewBox
```

**GosperGliderGunIcon** — simplified representation (gun is 36×9, too large for pixel-perfect at 20×20 icon):
Use a stylised "gun barrel" shape — 3 staggered rows of dots suggesting the structure:
```
Row 0 (y=4):  one dot at x=14
Row 1 (y=8):  two dots at x=10, x=14
Row 2 (y=12): three dots at x=2, x=6, x=10
```

All icons use `fill="currentColor"` so they inherit text color, and `aria-hidden="true"`.

Match the existing pattern exactly:
```tsx
export function BlockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* rect elements */}
    </svg>
  );
}
```

### PatternSelector component design

Use a **native `<select>`** (not a custom dropdown) for these reasons:
- Keyboard-native out of the box (Tab, Enter, Arrow) — satisfies AC5 / FR12 without extra ARIA work
- Screen-reader compatible natively
- Matches the brief's "no external libraries for what the platform gives you free" posture

The pattern icons can be displayed adjacent to the select (not inside `<option>` — browsers don't support SVG inside options):

```tsx
// Conceptual layout:
<div className="flex items-center gap-2">
  {selectedPatternIcon && <span aria-hidden="true">{selectedPatternIcon}</span>}
  <select
    value=""
    onChange={(e) => { /* find pattern by id, call onSelect */ }}
    className="..."
    aria-label="Load a named pattern"
  >
    <option value="" disabled>Load pattern…</option>
    {PATTERNS.map((p) => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</div>
```

Because browsers don't render SVG in `<option>` elements, show the icon of the **last-selected** pattern next to the `<select>`. Reset `value` to `""` after each pick (uncontrolled reset trick: pass `value=""` always, handle in `onChange`).

### `handlePatternSelect` in page.tsx

```typescript
function handlePatternSelect(pattern: NamedPattern) {
  setIsRunning(false);
  const newWidth = Math.max(grid.width, pattern.width + 4);
  const newHeight = Math.max(grid.height, pattern.height + 4);
  const newGrid = createGrid(newWidth, newHeight);
  const anchorX = Math.floor((newWidth - pattern.width) / 2);
  const anchorY = Math.floor((newHeight - pattern.height) / 2);
  setGrid(placePattern(newGrid, pattern, anchorX, anchorY));
  setGeneration(0);
}
```

Note: always start from `createGrid(newWidth, newHeight)` (all-dead) so previously painted cells are cleared — clean slate for the pattern.

### Import path reminders

- `.js` extension is NOT needed for cross-lib imports (only for relative imports within `libs/sim`)
- `import { placePattern, block, ... } from '@conways-game-of-life/sim'` — no `.js`
- Relative imports within `apps/web/src/app/` — no `.js` required (Next.js/webpack handles them)

### Tailwind class consistency

Existing button classes for reference (from `page.tsx`):
```
btnBase:          'rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600'
btnSecondary:     `${btnBase} px-3 py-2 bg-white border-neutral-300 text-cyan-700 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed`
```

Style the `<select>` to match `btnSecondary` visually. Suggested classes:
```
'rounded border px-3 py-2 bg-white border-neutral-300 text-cyan-700 text-sm
 hover:border-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600
 disabled:opacity-40 disabled:cursor-not-allowed'
```

### Where to render PatternSelector in page.tsx

Add it to the aside, between the "Clear / Randomize" row and the `<SizeForm>`:

```tsx
<div className="flex gap-2 justify-center">
  <button onClick={handleClear} ...>Clear</button>
  <button onClick={handleRandomize} ...>Randomize</button>
</div>

{/* NEW */}
<PatternSelector onSelect={handlePatternSelect} disabled={isRunning} />

<SizeForm ... />
```

### Project Structure Notes

Files to create/modify:

| Path | Action |
|------|--------|
| `apps/web/src/app/svgs/BlockIcon.tsx` | **Create** |
| `apps/web/src/app/svgs/BlinkerIcon.tsx` | **Create** |
| `apps/web/src/app/svgs/GliderIcon.tsx` | **Create** |
| `apps/web/src/app/svgs/GosperGliderGunIcon.tsx` | **Create** |
| `apps/web/src/app/components/PatternSelector.tsx` | **Create** |
| `apps/web/src/app/page.tsx` | **Modify** — add handler + PatternSelector import + render |
| `docs/implementation-artifacts/story-5-2-pattern-selector-ui-in-the-web-app.md` | this file |
| `docs/implementation-artifacts/sprint-status.yaml` | **Modify** |

### References

- [Source: docs/planning-artifacts/epics.md#Story-5.2] — acceptance criteria
- [Source: docs/planning-artifacts/architecture.md#10] — auto-resize is the documented choice
- [Source: apps/web/src/app/page.tsx] — state management, button class patterns, handler conventions
- [Source: apps/web/src/app/svgs/Play.tsx] — SVG component pattern to match
- [Source: libs/sim/src/lib/patterns.ts] — `NamedPattern`, `placePattern`, 4 constants
- [Source: libs/sim/src/index.ts] — barrel exports (story 5.1 added `* from './lib/patterns'`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation pass.

### Completion Notes List

- Created 4 SVG icon components in `apps/web/src/app/svgs/`: BlockIcon, BlinkerIcon, GliderIcon, GosperGliderGunIcon — pixel-art style using `<rect>` elements, `fill="currentColor"`, optional `size` prop
- Created `PatternSelector.tsx`: native `<select>` with all 4 patterns (Block, Blinker, Glider, Gosper Glider Gun); shows last-selected pattern's icon alongside; resets to placeholder after each pick; `disabled` prop wired to `isRunning`
- Wired `handlePatternSelect` in `page.tsx`: auto-resizes grid to `pattern + 4` padding when needed, centers pattern with floor-division anchor, always starts from all-dead grid, pauses + resets gen counter
- Lint: 0 errors. Typecheck: passes. Sim tests: 35/35 green.

### File List

- `apps/web/src/app/svgs/BlockIcon.tsx` — created
- `apps/web/src/app/svgs/BlinkerIcon.tsx` — created
- `apps/web/src/app/svgs/GliderIcon.tsx` — created
- `apps/web/src/app/svgs/GosperGliderGunIcon.tsx` — created
- `apps/web/src/app/components/PatternSelector.tsx` — created
- `apps/web/src/app/page.tsx` — modified (imports, handler, PatternSelector render)
- `docs/implementation-artifacts/story-5-2-pattern-selector-ui-in-the-web-app.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story → review)
