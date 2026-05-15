# Story 6.2: [STRETCH] Render via OffscreenCanvas from the worker

Status: ready-for-dev

## Story

As Casey,
I want the worker to render directly to an OffscreenCanvas,
so that the main thread is free for input handling and the perf headroom doubles.

## Acceptance Criteria

**AC1 — Canvas transfer on mount:**
Given `<canvas>.transferControlToOffscreen()` is called exactly once on mount,
When the resulting `OffscreenCanvas` is transferred to the worker via `postMessage` with the OffscreenCanvas in the transfer list,
Then the worker holds the sole rendering context and the main thread never calls `getContext('2d')` again.

**AC2 — Worker draws each tick:**
Given the worker receives a `{ type: 'tick', cells, width, height, ruleSetId }` message,
When it computes `ruleSet.step(grid)`,
Then it draws the resulting grid to the OffscreenCanvas using the same batched `beginPath / rect / fill` + grid-line strategy currently in `GameCanvas.draw()`, and posts back `{ type: 'grid', cells, width, height }` so React state can update.

**AC3 — Worker draws on camera/size events (pan, zoom, resize):**
Given the user pans, zooms, or the container resizes while paused,
When `GameCanvas` previously called `draw()` directly,
Then it sends `{ type: 'draw', cells, width, height, camera, canvasW, canvasH }` to the worker instead, and the worker redraws with the updated viewport.

**AC4 — Main-thread render path eliminated:**
Given the simulation is running,
When measured with Chrome DevTools Performance tab,
Then the "Main" thread flame chart shows no canvas 2D drawing calls during the simulation loop — only event handling and React scheduling. The README "Performance (NFR5)" section documents the before/after.

**AC5 — All existing tests pass:**
Given the Jest + Playwright suite,
When `pnpm nx test web` and `pnpm nx e2e web-e2e` run,
Then 0 failures — the Worker mock and new `transferControlToOffscreen` JSDOM stub keep unit tests green, and E2E tests see unchanged simulation behaviour.

## Tasks / Subtasks

- [ ] Task 1: Extend `sim.worker.ts` to hold OffscreenCanvas context and draw (AC1, AC2, AC3)
  - [ ] Add module-scope state: `ctx`, `cachedCamera`, `cachedCanvasW/H`
  - [ ] Add colour constants (copy from GameCanvas): `ALIVE_COLOR`, `DEAD_COLOR`, `GRID_COLOR`
  - [ ] Implement `drawGrid(ctx, grid, camera, canvasW, canvasH)` — exact port of GameCanvas batched draw logic
  - [ ] Handle `{ type: 'init', canvas: OffscreenCanvas }` → store ctx, initialise cached dimensions
  - [ ] Handle `{ type: 'draw', cells, width, height, camera, canvasW, canvasH }` → update cache, drawGrid
  - [ ] In `{ type: 'tick' }` handler: after `ruleSet.step(grid)` call `drawGrid` with cached values, then postMessage grid

- [ ] Task 2: Update `useSimWorker.ts` return API (AC1, AC2, AC3)
  - [ ] Change return from single `tick` callback to `{ tick, draw, initCanvas }`
  - [ ] `initCanvas(canvas: OffscreenCanvas): void` — `postMessage({ type: 'init', canvas }, [canvas])`
  - [ ] `draw(grid, camera, canvasW, canvasH): void` — structured clone (no transfer, main thread keeps grid)
  - [ ] `tick(grid, ruleSetId): void` — same copy+transfer as before, NO camera in payload (worker uses cache)
  - [ ] Preserve `inFlight` guard and `onerror` handler

- [ ] Task 3: Refactor `GameCanvas.tsx` to delegate all drawing to worker (AC1, AC3, AC4)
  - [ ] Add new required props: `onDraw: (grid, camera, canvasW, canvasH) => void` and `onCanvasMount: (canvas: OffscreenCanvas) => void`
  - [ ] Add mount-only `useEffect` (deps `[]`) → `canvas.transferControlToOffscreen()` → call `onCanvasMount(offscreen)`
  - [ ] Replace internal `draw()` callback body: remove all `getContext('2d')` and ctx calls; call `onDraw(gridRef.current, cameraRef.current, canvas.width, canvas.height)`
  - [ ] In `useEffect([grid, draw])`: guard with `if (!isRunningRef.current)` — skip main-thread-triggered draw when simulation is running (worker drew it already)
  - [ ] Add `useEffect([isRunning, draw])`: when `!isRunning` (simulation stopped) fire `draw()` once so the final frame is crisp
  - [ ] ResizeObserver callback: still sets `canvas.width/height`, then calls `draw()` (which now routes to worker)
  - [ ] All pan/zoom/touch handlers unchanged — they call `draw()` which routes to worker
  - [ ] Export the `Camera` interface so page.tsx and useSimWorker can share the type

- [ ] Task 4: Wire new API in `page.tsx` (AC1, AC2)
  - [ ] Destructure `{ tick, draw, initCanvas }` from `useSimWorker`
  - [ ] `onTick` callback: call `tick(gridRef.current, ruleSetRef.current.id)` — signature unchanged from caller's POV
  - [ ] Pass `onDraw={draw}` and `onCanvasMount={initCanvas}` to `<GameCanvas>`

- [ ] Task 5: Update `jest.setup.ts` JSDOM stubs (AC5)
  - [ ] Add `HTMLCanvasElement.prototype.transferControlToOffscreen` mock returning a fake OffscreenCanvas object `{ getContext: () => null, width: 0, height: 0 }`
  - [ ] No changes needed to existing `MockWorker` (it's already a no-op that swallows all `postMessage` calls)

- [ ] Task 6: Lint, typecheck, tests (AC5)
  - [ ] `pnpm nx lint web` — 0 errors
  - [ ] `pnpm exec nx affected -t typecheck --base=origin/main` — passes
  - [ ] `pnpm nx test web` — all existing tests pass
  - [ ] `pnpm nx e2e web-e2e` — all Playwright specs pass

- [ ] Task 7: Update README "Performance (NFR5)" section (AC4)
  - [ ] Document that render now happens in worker thread
  - [ ] Add before/after main-thread frame-time measurement (DevTools Performance tab)

## Dev Notes

### Architecture context

Architecture §4.3 and §5.3 describe this as an optional single-PR upgrade once 6.1 lands:

> "replace `<canvas>` with `<canvas>` + `transferControlToOffscreen()` so the worker draws directly. Main thread does only event handling + slider state."

The key constraint: **once `transferControlToOffscreen()` is called, `canvas.getContext('2d')` throws**. All drawing must be routed through the worker from that point on. This is why `GameCanvas` switches from a direct ctx-based `draw()` to sending messages.

### Worker message protocol extension

```
Main → Worker (one-time init):
  { type: 'init'; canvas: OffscreenCanvas }           ← canvas in transferList

Main → Worker (user interaction — pan/zoom/resize/toggle while paused):
  { type: 'draw'; cells: ArrayBuffer; width: number; height: number;
    camera: { offsetX: number; offsetY: number; scale: number };
    canvasW: number; canvasH: number }                ← structured clone, NOT transfer

Main → Worker (simulation tick — hot path):
  { type: 'tick'; cells: ArrayBuffer; width: number; height: number; ruleSetId: string }
                                                       ← cells in transferList; NO camera (uses cached)

Worker → Main:
  { type: 'grid'; cells: ArrayBuffer; width: number; height: number }
                                                       ← cells in transferList (unchanged from 6.1)
```

**Why no camera in `tick`:** The worker caches the last camera received via `draw`. During simulation, the camera rarely changes. Sending 3 extra numbers per tick is fine but unnecessary; caching avoids the coupling and keeps the hot path lean.

**Why structured clone (not transfer) for `draw`:** `draw` fires on user interaction (pan, zoom, resize). The main thread must keep `grid.cells` intact for the next tick. Transferring would detach it. 40KB clone is negligible for an infrequent interaction.

### Worker state

```typescript
// sim.worker.ts — module scope additions
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let cachedCamera = { offsetX: 0, offsetY: 0, scale: 30 };
let cachedCanvasW = 0;
let cachedCanvasH = 0;
```

The initial `cachedCamera.scale = 30` matches `SCALE_DESKTOP` / `SCALE_MOBILE` in `GameCanvas.tsx`. The first `draw` message from the ResizeObserver will synchronise them immediately on mount.

### `drawGrid` function (port from GameCanvas.tsx `draw()`)

Copy the batched draw logic from `GameCanvas.tsx` lines 49–102 verbatim into `sim.worker.ts`:

```typescript
const ALIVE_COLOR = '#22d3ee';
const DEAD_COLOR = '#0a0a0a';
const GRID_COLOR = 'rgba(255, 255, 255, 1)';

function drawGrid(
  ctx: OffscreenCanvasRenderingContext2D,
  grid: { width: number; height: number; cells: Uint8Array },
  camera: { offsetX: number; offsetY: number; scale: number },
  canvasW: number,
  canvasH: number,
) {
  ctx.fillStyle = DEAD_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);
  const { offsetX, offsetY, scale } = camera;
  const startCol = Math.max(0, Math.floor(offsetX));
  const startRow = Math.max(0, Math.floor(offsetY));
  const endCol = Math.min(grid.width, Math.ceil(offsetX + canvasW / scale));
  const endRow = Math.min(grid.height, Math.ceil(offsetY + canvasH / scale));
  if (scale >= 4) {
    const gridLeft = Math.max(0, -offsetX * scale);
    const gridTop = Math.max(0, -offsetY * scale);
    const gridRight = Math.min(canvasW, (grid.width - offsetX) * scale);
    const gridBottom = Math.min(canvasH, (grid.height - offsetY) * scale);
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let col = startCol; col <= endCol; col++) {
      const x = Math.round((col - offsetX) * scale) + 0.5;
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridBottom);
    }
    for (let row = startRow; row <= endRow; row++) {
      const y = Math.round((row - offsetY) * scale) + 0.5;
      ctx.moveTo(gridLeft, y);
      ctx.lineTo(gridRight, y);
    }
    ctx.stroke();
  }
  const pad = scale >= 4 ? 1 : 0;
  ctx.fillStyle = ALIVE_COLOR;
  ctx.beginPath();
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (grid.cells[row * grid.width + col] === 1) {
        const x = (col - offsetX) * scale;
        const y = (row - offsetY) * scale;
        ctx.rect(x + pad, y + pad, scale - pad, scale - pad);
      }
    }
  }
  ctx.fill();
}
```

After porting, the `draw()` callback in `GameCanvas.tsx` becomes the thin shell:
```typescript
const draw = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  onDrawRef.current(gridRef.current, cameraRef.current, canvas.width, canvas.height);
}, []);
```
Remove all `ctx = canvas.getContext('2d')` and every `ctx.*` call from `GameCanvas.tsx`.

### GameCanvas.tsx — preventing double draw during simulation

When `isRunning`, the worker draws on every tick AND React state updates trigger `useEffect([grid, draw])`. Without a guard this sends a redundant `draw` message per tick (40KB clone + worker round-trip).

**Guard pattern:**
```typescript
// Replace existing useEffect([grid, draw]):
useEffect(() => {
  if (!isRunningRef.current) draw();
}, [grid, draw]);

// New effect — fire one redraw when simulation stops:
useEffect(() => {
  if (!isRunning) draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isRunning]); // draw is stable; intentional omission per exhaustive-deps
```

`isRunningRef.current` is kept in sync each render (already exists in the component). This ensures:
- Paused + grid changes → draw sent to worker ✅
- Running + grid tick updates → skipped (worker already drew) ✅
- Simulation stops → one final draw to ensure last frame is shown ✅

### GameCanvas.tsx — OffscreenCanvas mount effect

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const offscreen = canvas.transferControlToOffscreen();
  onCanvasMountRef.current(offscreen);
}, []); // runs once on mount — must be before ResizeObserver effect
```

Place this effect BEFORE the ResizeObserver `useEffect` in the component body, so the canvas is transferred before the first resize callback fires.

### TypeScript: OffscreenCanvas types

- `HTMLCanvasElement.prototype.transferControlToOffscreen` is in `lib: ["dom"]` (TS 4.4+). The existing tsconfig already includes `"dom"`. No changes needed.
- `OffscreenCanvasRenderingContext2D` is in `/// <reference lib="webworker" />` — already at the top of `sim.worker.ts`.
- The `OffscreenCanvas` parameter in `useSimWorker.initCanvas` is typed via the `dom` lib. No extra imports.

### jest.setup.ts addition

JSDOM does not implement `transferControlToOffscreen`. Add this mock:

```typescript
HTMLCanvasElement.prototype.transferControlToOffscreen = function () {
  return {
    getContext: () => null,
    width: this.width,
    height: this.height,
  } as unknown as OffscreenCanvas;
};
```

The existing `MockWorker` already swallows all `postMessage` calls with `jest.fn()`, so `initCanvas`, `tick`, and `draw` messages are silently absorbed — no additional Worker mock changes needed.

### page.tsx wiring

The only change is destructuring the new return shape and passing two new props to `GameCanvas`:

```typescript
// before
const workerTick = useSimWorker((newGrid) => { ... });
const onTick = useCallback(() => { workerTick(gridRef.current, ruleSetRef.current.id); }, [workerTick]);

// after
const { tick, draw, initCanvas } = useSimWorker((newGrid) => { ... });
const onTick = useCallback(() => { tick(gridRef.current, ruleSetRef.current.id); }, [tick]);
```

`<GameCanvas>` gets two new props:
```tsx
<GameCanvas
  grid={grid}
  isRunning={isRunning}
  onCellToggle={handleCellToggle}
  onDraw={draw}           // ← new
  onCanvasMount={initCanvas} // ← new
/>
```

### Module boundary

`apps/web/src/app/workers/sim.worker.ts` is `scope:app`.
It imports from `@conways-game-of-life/sim` (`scope:sim`) — already allowed. No new cross-boundary imports.

### Project Structure Notes

| Path | Action |
|------|--------|
| `apps/web/src/app/workers/sim.worker.ts` | **Modify** — add `init`, `draw` handlers; `drawGrid()`; cached camera state |
| `apps/web/src/app/hooks/useSimWorker.ts` | **Modify** — return `{ tick, draw, initCanvas }` |
| `apps/web/src/app/components/GameCanvas.tsx` | **Modify** — add props, transfer canvas on mount, route draw to worker |
| `apps/web/src/app/page.tsx` | **Modify** — destructure new API, pass new props |
| `apps/web/jest.setup.ts` | **Modify** — add `transferControlToOffscreen` JSDOM mock |
| `README.md` | **Modify** — update Performance (NFR5) section with OffscreenCanvas note |
| `docs/implementation-artifacts/sprint-status.yaml` | **Modify** — mark 6-2 done |

No changes to: `libs/sim`, `libs/types`, `libs/api-client`, `apps/api`, `apps/web-e2e` (behaviour is unchanged from user's perspective).

### References

- [Source: docs/planning-artifacts/epics.md#Story-6.2] — ACs, user story
- [Source: docs/planning-artifacts/architecture.md#4.3] — Render strategy, OffscreenCanvas upgrade path
- [Source: docs/planning-artifacts/architecture.md#5.3] — Render strategy detail and fillRect approach
- [Source: docs/implementation-artifacts/story-6-1-...md] — Worker patterns, `inFlight` guard, `onerror`, `buffer.slice(0)` rationale
- [Source: apps/web/src/app/workers/sim.worker.ts] — Current worker (extend, do not replace)
- [Source: apps/web/src/app/hooks/useSimWorker.ts] — Current hook (change return shape)
- [Source: apps/web/src/app/components/GameCanvas.tsx] — Current draw logic to port to worker

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
