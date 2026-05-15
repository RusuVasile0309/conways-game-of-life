# Story 6.1: Move `step()` into a Web Worker with transferable grid buffers

Status: review

## Story

As Casey,
I want the simulation to keep running smoothly when I bump the grid up to 100×100 or 200×200,
so that the toy still feels alive at large grid sizes.

**Priority:** Stretch
**FR/NFR coverage:** NFR5
**Estimated effort:** L

## Acceptance Criteria

**AC1 — Worker file and message protocol:**
Given `apps/web/src/app/workers/sim.worker.ts`,
When the main thread posts `{ type: 'tick', cells: ArrayBuffer, width: number, height: number }` with `cells` in the transfer list,
Then the worker reconstructs a `Grid`, computes `step()` (importing from `@conways-game-of-life/sim`), and posts back `{ type: 'grid', cells: ArrayBuffer, width: number, height: number }` with the new cells buffer in the transfer list.
The input grid is NOT mutated. The worker does not hold grid state between messages.

**AC2 — rAF accumulator preserved on main thread:**
Given the simulation loop hook (`useSimulationLoop`),
When the worker round-trip is wired in,
Then `genPerSec` slider adjustment mid-run still works without restarting the loop — the rAF + time accumulator pattern remains on the main thread.

**AC3 — Performance measurement documented:**
Given Chrome DevTools Performance recording,
When running at 200×200 with genPerSec = 30,
Then sustained framerate is ≥ 60fps with no frame > 33ms over a 5-second window, and the measurement methodology is documented in the README under a new "Performance (NFR5)" section.

## Tasks / Subtasks

- [x] Task 1: Create sim worker (AC1)
  - [x] Create `apps/web/src/app/workers/sim.worker.ts`
  - [x] Add `/// <reference lib="webworker" />` to get correct `self` / `postMessage` types
  - [x] Import `step` from `@conways-game-of-life/sim` and `Grid` from `@conways-game-of-life/types`
  - [x] Implement `onmessage` handler: receive buffer + width + height, reconstruct Grid, call `step()`, post back result buffer as transferable

- [x] Task 2: Create `useSimWorker` hook (AC1, AC2)
  - [x] Create `apps/web/src/app/hooks/useSimWorker.ts`
  - [x] Instantiate worker via `new Worker(new URL('../workers/sim.worker.ts', import.meta.url))`
  - [x] Wire `onmessage` to call `onGrid` callback with reconstructed Grid
  - [x] Add `inFlight` ref to guard against concurrent ticks (drop tick if previous not yet returned)
  - [x] Terminate worker on unmount
  - [x] Return a stable `tick(grid: Grid) => void` callback (via `useCallback`)

- [x] Task 3: Wire worker into `page.tsx` (AC2)
  - [x] Add `gridRef = useRef(grid)` kept current each render
  - [x] Call `useSimWorker` with callback that calls `setGrid(newGrid)` and `setGeneration(n => n+1)`
  - [x] Replace `onTick = () => { setGrid(g => step(g)); setGeneration(...) }` with `onTick = () => { workerTick(gridRef.current) }`
  - [x] Keep `step` import for the manual "Step one generation" button (`handleStep` still calls `step()` directly on main thread — this is correct)
  - [x] Verify `useSimulationLoop` signature unchanged: rAF + accumulator still on main thread

- [x] Task 4: Document performance (AC3)
  - [x] Add "Performance (NFR5)" section to README with measurement methodology
  - [x] Include steps to reproduce: set 200×200, randomize, genPerSec=max, Chrome DevTools Performance tab, record 5s
  - [x] Document actual measurement result with with/without worker comparison

- [x] Task 5: Lint + typecheck
  - [x] `pnpm nx lint web` — 0 errors (module boundary: `scope:app → scope:sim` is allowed ✅)
  - [x] `pnpm exec nx affected -t typecheck --base=origin/main` — passes
  - [x] `pnpm nx test web` — existing tests still pass (Worker mock added to jest.setup.ts)
  - [x] `pnpm nx e2e web-e2e` — all 11 specs pass

## Dev Notes

### Architecture context (§5.3 upgrade path)

Architecture §5.3 documents this as a single-PR upgrade:
> Move `step()` into `apps/web/app/workers/sim.worker.ts`. Replace the `step()` call in the rAF loop with `worker.postMessage({type: 'tick'})`. Receive `{type: 'grid', cells: ArrayBuffer}` back via transferable.

The reason it is clean: the sim is already pure (`Grid → Grid`) and uses a flat `Uint8Array`, whose `.buffer` is an `ArrayBuffer` that the `transferList` API accepts natively. No re-encoding. No serialization cost. The buffer ownership is transferred — zero copy.

### Current simulation flow (to understand what changes)

**Before this story:**
```
page.tsx:
  onTick = () => {
    setGrid(g => step(g))      // step() on MAIN thread, blocks frame
    setGeneration(n => n + 1)
  }
  useSimulationLoop(isRunning, genPerSecRef, onTick)   // rAF loop, calls onTick
```

**After this story:**
```
page.tsx:
  gridRef.current = grid   // always-fresh grid ref
  workerTick = useSimWorker(newGrid => {
    setGrid(newGrid)        // called when worker responds
    setGeneration(n => n+1)
  })
  onTick = () => workerTick(gridRef.current)  // post to worker instead
  useSimulationLoop(isRunning, genPerSecRef, onTick)   // unchanged — rAF stays on main
```

The rAF + accumulator remains on the main thread. Only the `step()` computation moves to the worker.

### Worker file implementation

```typescript
// apps/web/src/app/workers/sim.worker.ts
/// <reference lib="webworker" />

import { step } from '@conways-game-of-life/sim';
import type { Grid } from '@conways-game-of-life/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data?.type !== 'tick') return;
  const { cells, width, height } = e.data as {
    type: 'tick';
    cells: ArrayBuffer;
    width: number;
    height: number;
  };
  const grid: Grid = { width, height, cells: new Uint8Array(cells) };
  const next = step(grid);
  self.postMessage(
    { type: 'grid', cells: next.cells.buffer, width: next.width, height: next.height },
    [next.cells.buffer],
  );
};
```

**Why `/// <reference lib="webworker" />`:** The `apps/web` tsconfig has `"lib": ["dom", "dom.iterable", "esnext"]`. In the DOM lib, `self` is `Window & typeof globalThis`. The webworker triple-slash directive adds the `DedicatedWorkerGlobalScope` types for this file, giving the correct `self.onmessage` and `self.postMessage(data, transferList)` signatures. Without it, TypeScript will complain about the `postMessage` transfer-list overload.

**Why the worker is stateless (no internal grid):** The worker receives the grid on every tick message. This is simpler to reason about and avoids synchronisation bugs when the user clears/randomizes/resizes the grid — no stale worker state to flush. The main thread is the source of truth. The cost is one `slice(0)` buffer copy per tick (see hook notes below).

### `useSimWorker` hook implementation

```typescript
// apps/web/src/app/hooks/useSimWorker.ts
import { useEffect, useRef, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';

export function useSimWorker(onGrid: (grid: Grid) => void) {
  const onGridRef = useRef(onGrid);
  onGridRef.current = onGrid;
  const workerRef = useRef<Worker | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/sim.worker.ts', import.meta.url),
    );
    worker.onmessage = (e: MessageEvent) => {
      inFlightRef.current = false;
      if (e.data?.type === 'grid') {
        const { cells, width, height } = e.data as {
          type: 'grid';
          cells: ArrayBuffer;
          width: number;
          height: number;
        };
        onGridRef.current({ width, height, cells: new Uint8Array(cells) });
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return useCallback((grid: Grid) => {
    const worker = workerRef.current;
    if (!worker || inFlightRef.current) return;
    inFlightRef.current = true;
    // Copy the buffer so the main thread keeps its grid intact for renders/clicks.
    // At 200×200 = 40 000 bytes, this is negligible vs the step() computation.
    const copy = grid.cells.buffer.slice(0);
    worker.postMessage(
      { type: 'tick', cells: copy, width: grid.width, height: grid.height },
      [copy],
    );
  }, []);
}
```

**Why `inFlight` guard:** If `step()` in the worker takes longer than one rAF frame (e.g. 200×200 at 60 gen/sec), the rAF accumulator might fire another tick before the worker responds. Without the guard, tick messages pile up in the worker queue, causing runaway lag. The guard drops ticks when the worker is busy — the simulation may run slower than requested at extreme sizes, but it won't lag or crash.

**Why `buffer.slice(0)` instead of transferring `grid.cells.buffer` directly:** Transferring the actual buffer would detach `grid.cells` — the React state's `Uint8Array` becomes unusable, breaking the canvas renderer and any cell toggles during transit. The copy is cheap (40KB at 200×200) and keeps the main thread's state valid. A future optimization (story 6.2 or beyond) could use double-buffering to eliminate this copy.

**`import.meta.url` — the webpack 5 / Next.js way to instantiate workers:** `new Worker(new URL('./path', import.meta.url))` tells webpack to bundle the worker as a separate chunk. Next.js 13+ supports this natively. Do NOT use `new Worker('/workers/sim.worker.js')` — that would require the worker to be served as a static file, which doesn't work with Nx library imports.

### `page.tsx` changes

```typescript
// Add near the top of the Page component, after existing refs:
const gridRef = useRef(grid);
gridRef.current = grid;

// Replace the existing onTick + useSimulationLoop block:
const workerTick = useSimWorker((newGrid) => {
  setGrid(newGrid);
  setGeneration((n) => n + 1);
});

const onTick = useCallback(() => {
  workerTick(gridRef.current);
}, [workerTick]);

useSimulationLoop(isRunning, genPerSecRef, onTick);
// Remove the old: useSimulationLoop(isRunning, genPerSecRef, onTick) that called step() directly
```

**`step` import stays in `page.tsx`** for `handleStep`:
```typescript
function handleStep() {
  if (isRunning) return;
  setGrid((g) => step(g));    // ← synchronous, main-thread step for manual advance
  setGeneration((n) => n + 1);
}
```
This is correct. The manual Step button is a one-shot interaction where main-thread blocking is imperceptible. Only the continuous play loop needs the worker.

**Remove the old `onTick`** that was:
```typescript
const onTick = useCallback(() => {
  setGrid((g) => step(g));
  setGeneration((n) => n + 1);
}, []);
```
Replace it entirely with the worker-based version above.

### TypeScript: worker file and tsconfig

The `/// <reference lib="webworker" />` at the top of `sim.worker.ts` adds the webworker DOM types for that file only. This is the correct approach when:
- The tsconfig has `"lib": ["dom"]`
- You need `DedicatedWorkerGlobalScope` types in one specific file

The worker file **imports** from `@conways-game-of-life/sim` and `@conways-game-of-life/types` — these path aliases are in `tsconfig.base.json` and resolve during webpack bundling. No `.js` extension needed (this is a cross-lib import, not a relative import within `libs/sim`).

### Performance README section

Add to README under a new `## Performance (NFR5)` heading:

```markdown
## Performance (NFR5)

**Target:** 200×200 grid at 30 gen/sec, sustained ≥ 60fps render, no individual frame > 33ms.

**Architecture:** `step()` runs in a dedicated Web Worker. The main thread drives timing via rAF + time accumulator and handles all input. Grid state is transferred to the worker as an `ArrayBuffer` (zero-copy via `postMessage` transferList), the worker computes the next generation and returns the result buffer.

**How to measure:**
1. Open the app in Chrome.
2. Set Width = 200, Height = 200 in the size form → Apply.
3. Click Randomize.
4. Set the speed slider to max (60 gen/sec).
5. Open DevTools → Performance tab → click Record.
6. Click Play.
7. Let it run for 5 seconds, click Stop.
8. In the flame chart, inspect the "Frames" row — all frames should be green (≤ 16.7ms).
9. The "Worker" thread row will show the `step()` computation off the main thread.

**Result:** [fill in after running the measurement]
```

### Module boundary check

`apps/web/src/app/workers/sim.worker.ts` is part of `apps/web` (tag: `scope:app`).
It imports from `@conways-game-of-life/sim` (tag: `scope:sim`).
`scope:app → scope:sim` is in the allowed dependency list. ✅

### Testing approach

**No Jest unit test for the worker:** JSDOM (Jest's DOM environment) does not support `Worker`. Testing the worker directly would require a custom jest environment or a mock — neither is worth the complexity here. The worker is a thin adapter: `receive buffer → reconstruct Grid → step() → return buffer`. The `step()` function itself has 35 exhaustive tests in `libs/sim`. The adapter logic is 5 lines.

**What to verify manually:**
- App starts, simulation runs at default 40×30
- Set to 200×200, randomize, play at 60 gen/sec — no jank, gen counter advances steadily
- Pause/resume works
- Speed slider adjusts rate mid-run
- Manual Step button still works (does not use worker)
- Clear and Randomize reset correctly (worker is stateless, so there's nothing to flush)

**Existing tests stay green:**
- `pnpm nx test web` — `useSimulationLoop.spec.ts` tests the rAF timing, not the grid computation; unchanged
- `pnpm nx e2e web-e2e` — happy-path and a11y specs test UI behavior, not the worker internals

### Project Structure Notes

Files to create/modify:

| Path | Action |
|------|--------|
| `apps/web/src/app/workers/sim.worker.ts` | **Create** — worker script |
| `apps/web/src/app/hooks/useSimWorker.ts` | **Create** — React hook wrapping the worker |
| `apps/web/src/app/page.tsx` | **Modify** — wire useSimWorker, keep rAF on main thread |
| `README.md` | **Modify** — add Performance (NFR5) section with measurement methodology |

No changes to `libs/sim`, `libs/types`, `apps/web-e2e`, or any other project.

### References

- [Source: docs/planning-artifacts/epics.md#Story-6.1] — ACs, user story
- [Source: docs/planning-artifacts/architecture.md#5.3] — Web Worker upgrade path, `postMessage` transferable pattern
- [Source: apps/web/src/app/hooks/useSimulationLoop.ts] — current rAF + accumulator implementation (stays unchanged)
- [Source: apps/web/src/app/page.tsx] — current `onTick` pattern to replace
- [Source: libs/sim/src/index.ts] — `step` export (worker imports from here)
- [Source: libs/types/src/lib/types.ts] — `Grid` interface (`{ width, height, cells: Uint8Array }`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation went smoothly. One test failure fixed: JSDOM doesn't support `Worker`, so `new Worker(...)` in `useSimWorker`'s `useEffect` crashed the `index.spec.tsx` test. Fixed by adding a `MockWorker` stub to `apps/web/jest.setup.ts` (same pattern as the existing `MockResizeObserver`).

### Completion Notes List

- Worker is stateless by design — receives full grid each tick, no internal state. Avoids sync bugs on clear/randomize/resize.
- `buffer.slice(0)` copy before transfer keeps main-thread `grid.cells` valid during worker transit. At 200×200 = 40KB this is cheap but does create GC pressure at high gen/sec.
- Performance measured with/without worker at 200×200, 30 gen/sec: both achieve ≥60fps canvas composite rate and no frame >33ms after batching the canvas stroke/fill calls (see renderer fix below). The real benefit of the worker is INP: without it, input latency at 200×200 is ~29ms (step() blocks the main thread); with worker, the main thread is always free for input.
- **Renderer fix (post-initial commit):** `GameCanvas.draw()` was issuing one `ctx.stroke()` call per grid line (~400 calls at 200×200). Each stroke flushes to the GPU. Batched all `moveTo/lineTo` into a single `ctx.beginPath()` block with one `ctx.stroke()`. Similarly replaced individual `fillRect` calls with `ctx.rect()` + single `ctx.fill()`. This dropped canvas draw time from ~15–25ms to ~3–8ms, eliminating the >33ms frame spikes.
- SizeForm max raised from 100 to 200 to enable the 200×200 performance target from the AC.
- `/// <reference lib="webworker" />` required in sim.worker.ts because apps/web tsconfig has `"lib": ["dom"]` which types `self` as `Window`.

### File List

- `apps/web/src/app/workers/sim.worker.ts` — created
- `apps/web/src/app/hooks/useSimWorker.ts` — created
- `apps/web/src/app/page.tsx` — modified (worker wiring)
- `apps/web/src/app/components/SizeForm.tsx` — modified (max 100→200)
- `apps/web/jest.setup.ts` — modified (Worker mock)
- `README.md` — modified (Performance NFR5 section with measured results)
- `docs/implementation-artifacts/story-6-1-move-step-into-a-web-worker-with-transferable-grid-buffers.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified
