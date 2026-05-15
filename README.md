# Conway's Game of Life

A browser-based implementation of Conway's Game of Life, built as a take-home engineering exercise. This document explains architectural decisions, trade-offs, how AI was used, and what comes next.

---

## Quick start

```bash
# clone and install
git clone <repo-url>
cd conways-game-of-life
pnpm install
pnpm exec playwright install --with-deps   # first clone only

# run the app
pnpm nx serve web                           # → http://localhost:4200

# run tests
pnpm nx test sim                            # Jest unit tests (pure sim core)
pnpm nx e2e web-e2e                         # Playwright E2E
pnpm nx lint web                            # ESLint + boundary check
```

See [START_HERE.md](START_HERE.md) for the interviewer quick-reference.

---

## Architecture

Full detail lives in [docs/planning-artifacts/architecture.md](docs/planning-artifacts/architecture.md). The short version:

```
conways-game-of-life/
├── apps/
│   ├── web/          Next.js 14 (App Router) — UI, canvas, controls
│   └── web-e2e/      Playwright E2E specs
└── libs/
    ├── sim/          Pure Conway rules engine — zero React/DOM/network
    ├── types/        Shared TypeScript types (Grid, Cell, etc.)
    ├── ui/           Shared UI components (stub, ready for stretch)
    └── api-client/   Typed NestJS client (stub, ready for stretch)
```

The key boundary: `libs/sim` contains only pure functions. It cannot import React, DOM APIs, or anything from `apps/`. This is enforced by `@nx/enforce-module-boundaries` — a lint violation fails CI, not just a convention. The canvas rendering and the `requestAnimationFrame` accumulator loop live in `apps/web`, which imports `step()` and `randomize()` from `libs/sim`.

The rAF accumulator pattern (PR #7) is what allows the speed slider to take effect mid-run without restarting the loop. Rather than `setInterval`, every animation frame accumulates elapsed time against a per-second budget, then calls `step()` as many times as the budget allows. Changing the speed slider updates the budget; the loop never stops.

---

## Module boundaries

The Nx tag taxonomy:

| Project | Tag | Can depend on |
|---------|-----|---------------|
| `apps/web` | `scope:app` | `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types` |
| `apps/web-e2e` | `scope:e2e` | `scope:app`, `scope:types` |
| `libs/sim` | `scope:sim` | `scope:types` only |
| `libs/types` | `scope:types` | (leaf) |
| `libs/ui` | `scope:ui` | `scope:types` |
| `libs/api-client` | `scope:api-client` | `scope:types` |

The enforcement is real, not aspirational. PR #2 (`feat/1-2-module-boundaries`) added the ESLint rule and a deliberate violation to prove it fires. The violation output is captured in [docs/implementation-artifacts/nfr8-boundary-violation-demo.md](docs/implementation-artifacts/nfr8-boundary-violation-demo.md).

---

## Trade-offs and deliberate skips

**No NestJS backend shipped.** The architecture document describes it in detail (epics 7–8) and `libs/api-client` is stubbed and tagged correctly. It's not scope creep to add it — it's one clear epic — but adding a backend that the canvas doesn't yet need felt like complexity without signal in the MVP window.

**No OffscreenCanvas (yet).** `step()` now runs in a dedicated Web Worker (epic 6.1, story complete). The main thread handles timing, input, and canvas rendering; the worker handles the simulation computation. OffscreenCanvas (story 6.2) would move rendering into the worker too, freeing the main thread entirely — but that is a separate story.

**No pattern library.** Patterns (glider, Gosper gun, blinker) would live in `libs/sim` as typed exports (epic 5). The sim library is already shaped to receive them — `placePattern(grid, pattern, origin)` is a natural pure function there.

**Grid is fixed at load time.** The size form runs on first load; there's no mid-run resize. This was a deliberate simplicity call. Resize would require invalidating the current grid and resetting the counter, which is easy but adds a state transition that needs its own tests.

---

## AI usage

I used Claude Code (with BMAD workflow commands, on epic 4) throughout. The methodology: plan with BMAD story files, implement with `/bmad-bmm-dev-story`, then run `/bmad-bmm-code-review` on each PR before merge.

**AI was roughly 80% accurate.** Frontend knowledge was necessary to catch the remaining 20%. AI would generate code that looked right but had subtle issues how React state interacted with canvas refs, or how CSS cascade worked across breakpoints. The AI sometimes entered very long thinking loops when trying to solve errors that it signaled.

**My biggest input was Epic 3.** I had to explain how the UI should look and how it should work — the grid rendering, the button layout, the play/pause state machine. AI could scaffold the structure but the product decisions were mine.

**AI adherence to docs hovered around 50–60% for the first three epics.** There were no BMAD story files for epics 1–3 by default, so AI was working from the epic description and my verbal direction. Starting from epic 4, constant reminders and the create-story workflow dramatically improved adherence. The quality gap between "AI working from an epic description" and "AI working from a story file with explicit ACs" was large and visible. My only observation here is that it took more time to work while following the BMAD procedures.

**A concrete AI miss:** In story 4.3 (responsive verification), AI added `@media (max-height: 667px)` to shrink the canvas on short-height screens. The rule was correct for mobile but had no width constraint, so it would also fire on a desktop with DevTools open (e.g. 1280×640). Code review caught it and we added `and (max-width: 1023px)` to scope it correctly.

**A concrete AI hit:** The pure Conway rules engine in Epic 2. Deterministic, framework-free domain → predictable AI output. The four rule implementations were accurate and the test scaffolding was solid. I reviewed and accepted with one correction to the underpopulation threshold.

**AI artifact directories** — `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` — are all committed and substantive. The BMAD workflow commands live in `.claude/commands/` and are what drove the structured planning-to-implementation loop. They are not throwaway scaffolding.

---

## What's next with another 8 hours

1. **Pattern library (epic 5):** ✅ Shipped. Block, Blinker, Glider, and Gosper Glider Gun as typed data exports in `libs/sim`. Pattern selector UI in `apps/web` with auto-resize and SVG icons.

2. **Web Worker — simulation (epic 6.1):** ✅ Shipped. `step()` runs in a dedicated Web Worker. Grid `ArrayBuffer`s are transferred (zero-copy) to the worker each tick; the result is transferred back. Main thread drives timing and rendering.

3. **OffscreenCanvas (epic 6.2):** Move canvas rendering into the worker so the main thread only handles input. The `<canvas>` element is transferred once via `transferControlToOffscreen()`; the worker draws each tick using the same `fillRect` strategy.

3. **NestJS API (epic 7):** `apps/api` with an in-memory pattern repository, a typed `libs/api-client`, and save/load endpoints. SQLite via Prisma as a follow-up story — the architecture documents the `PatternRepository` interface that makes the swap mechanical.

4. **Pluggable rule engine (epic 8):** `RuleSet` interface in `libs/sim`, HighLife implementation alongside Conway, preset dropdown in the UI.

---

## What I'm not happy with

**The grid size form runs once and that's it.** There's no mid-run resize. It works, but a more polished experience would let you change grid dimensions at any time and reset cleanly.

**The speed slider has no numeric label.** The slider range is 1–30 gen/sec but the UI doesn't show the current value. A visible number next to the thumb would be a 20-minute addition and would make the control self-explanatory without the accessible name.

**`ai-usage.md` and this README overlap.** The `docs/implementation-artifacts/ai-usage.md` artifact started as a separate detailed log, but its most important content ended up here. Ideally there would be one source of truth for AI reflections, not two.

**BMAD story files didn't start until epic 4.** The planning was thorough but the structured story workflow (with explicit ACs as a dev contract) only kicked in at epic 4. Had it started at epic 1, AI adherence would have been higher throughout, and the story files would tell a cleaner implementation story.

---

## Performance (NFR5)

**Target:** 200×200 grid at 30 gen/sec, sustained ≥ 60fps render, no individual frame > 33ms.

**Architecture:** `step()` runs in a dedicated Web Worker (`apps/web/src/app/workers/sim.worker.ts`). The main thread drives timing via the rAF + time accumulator and handles all input and canvas rendering. On each tick the current grid's `ArrayBuffer` is copied and `postMessage`-transferred to the worker; the worker computes the next generation and transfers the result buffer back. The main thread reconstructs a `Grid` from the returned buffer and calls `setGrid`, triggering a canvas redraw.

**How to measure:**
1. Open the app in Chrome.
2. Set Width = 200, Height = 200 in the size form → Apply.
3. Click Randomize.
4. Set the speed slider to max (60 gen/sec).
5. Open DevTools → Performance tab → click Record.
6. Click Play.
7. Let it run for 5 seconds, then click Stop.
8. Inspect the **Frames** row — all frames should appear green (≤ 16.7ms each).
9. The **Worker** thread row shows `step()` computation off the main thread.
10. Check the **Main** thread — it should be dominated by canvas `fillRect` calls and input handling, not simulation.

**Measured results (200×200, 60 gen/sec, Chrome):**

| Metric | With Worker | Without Worker |
|--------|-------------|----------------|
| FPS (live overlay) | 55.2 fps | 60.0 fps |
| Frames row | All green, no drops | All green, no drops |
| Worker thread | Visible, active | Not present |
| INP (input latency) | Not flagged | 29ms |
| JS heap pressure | 25–111 MB (GC) | 25–125 MB (GC) |

**Honest finding:** At 200×200, raw FPS is marginally higher without the worker (60 vs 55). The `postMessage` round-trip and `ArrayBuffer.slice(0)` copy per tick (~40KB × 60/sec = 2.4MB/s of GC pressure) introduce overhead that at this grid size exceeds the computation savings. The worker becomes a clear FPS win at larger grids (500×500+) where `step()` dominates the budget.

**What the worker does give at 200×200** is a 29ms reduction in input latency (INP). Without the worker, `step()` runs on the main thread and blocks button clicks, slider drags, and cell toggles for up to 29ms per tick. With the worker, the main thread is always free for input — interactions are handled immediately regardless of simulation speed.

---

## Repository layout

```
README.md                          this file
START_HERE.md                      quick-start reference for the reviewer
docs/
  planning-artifacts/              PRD, architecture, epics — BMAD planning output
  implementation-artifacts/        Story files, retros, boundary demo — BMAD dev output
_bmad/                             BMAD Method v6.0.2 (core + bmm modules)
.claude/commands/                  Claude Code slash commands (43 BMAD commands)
.cursor/commands/                  Same, mirrored for Cursor
.opencode/                         Same, mirrored for opencode
apps/
  web/                             Next.js 14 app (App Router, Tailwind)
  web-e2e/                         Playwright E2E specs
libs/
  sim/                             Pure simulation core (Conway rules + grid utils)
  types/                           Shared TypeScript types
  ui/                              Shared React components (stub)
  api-client/                      NestJS client wrapper (stub)
```
