---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
inputDocuments: [prd.md, product-brief.md, ASSIGNMENT.md]
workflowType: 'architecture'
project_name: 'conways-game-of-life'
user_name: 'BMad Master orchestration (Architect sub-agent — Winston)'
date: '2026-05-05'
---

# Architecture Decision Document - Conway's Game of Life

**Author:** BMad Master orchestration (Architect sub-agent — Winston)
**Date:** 2026-05-05

---

## 1. Architecture Overview

Conway's Game of Life is a single-page Next.js application that runs a deterministic cellular-automaton simulation entirely in the browser, with the rules engine isolated in a shared Nx library so it can be exhaustively unit-tested without React, DOM, or framework noise. The Next.js client renders the grid to an HTML Canvas and drives the loop with `requestAnimationFrame` plus a time accumulator, so the speed slider takes effect mid-run without restarting the loop. A NestJS API (post-MVP stretch) exposes a small REST surface for saving and loading named patterns; the Next.js client only ever talks to it through a typed wrapper in `libs/api-client`, never directly. Nx tags + `@nx/enforce-module-boundaries` make the boundaries real: the simulation library cannot import React, the Next.js app cannot import NestJS internals, and a deliberate violation fails CI lint. Persistence for the stretch tier is SQLite via Prisma behind a `PatternRepository` interface, with an in-memory implementation as the MVP-stretch fallback. Styling is Tailwind. Testing is Jest for unit and integration, Playwright for one E2E spec covering the happy path. CI is GitHub Actions, blocking merge on any of lint, type-check, Jest, or Playwright failing.

---

## 2. Project Context Analysis

### Requirements Overview

**Functional Requirements (16 total):**

The PRD defines 16 FRs grouped into six clusters. The architecture must address each:

| Cluster | FRs | Architectural impact |
| --- | --- | --- |
| Canvas & grid | FR1, FR2, FR3, FR4 | Grid state + cell-toggle handler in the Next.js app; randomize and clear are pure functions in `libs/sim` |
| Simulation control | FR5, FR6, FR7, FR8 | rAF + accumulator loop in the Next.js app; `step()` lives in `libs/sim` |
| Generation count | FR9 | Single piece of state in the Next.js app, derived from tick count |
| Correctness & determinism | FR10 | Pure-function `step(grid: Grid): Grid` in `libs/sim`, framework-free, exhaustively Jest-tested |
| Layout & accessibility | FR11, FR12 | Tailwind responsive utilities; semantic HTML controls; visible focus rings |
| Pattern library (in-scope-if-time) | FR13 | Patterns as typed exports in `libs/sim` (or sibling `libs/patterns` — kept inside `libs/sim` to avoid lib sprawl) |
| Pattern persistence (stretch) | FR14, FR15 | NestJS REST in `apps/api`, typed wrapper in `libs/api-client`, repository in `apps/api/src/patterns/` |
| Pluggable rules (stretch) | FR16 | `RuleSet` interface in `libs/sim`; Conway is the default implementation, HighLife slots in alongside |

**Non-Functional Requirements (10 total):**

| NFR | Architectural decision it forces |
| --- | --- |
| NFR1 — Responsive desktop + 375px mobile | Tailwind responsive grid; Canvas sized to container via ResizeObserver; touch handlers |
| NFR2 — Modern evergreens only | TS target ES2022; rely on Canvas, rAF, ResizeObserver, fetch, no polyfills |
| NFR3 — Pure-function sim, framework-free | `libs/sim` tagged `scope:sim` with import rules forbidding React/DOM/Next/Nest |
| NFR4 — MVP perf (50×50 ≥ 30 gen/sec, < 50ms input) | HTML Canvas render; flat `Uint8Array` grid; double-buffer to avoid per-tick allocation |
| NFR5 — Stretch perf (200×200 @ 60fps) | Documented upgrade path: OffscreenCanvas + Web Worker simulation |
| NFR6 — WCAG 2.1 AA on controls | Semantic buttons, `aria-label`, visible focus, color-not-the-only-signal |
| NFR7 — CI on every PR | GitHub Actions matrix: lint, typecheck, Jest, Playwright |
| NFR8 — Module boundaries actually fire | Nx tags + `@nx/enforce-module-boundaries` ESLint rule; demonstration commit referenced in README |
| NFR9 — AI artifacts committed | `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` checked in (already are) |
| NFR10 — Reviewable git history | First commit is raw Nx generator output; all subsequent work via PR |

### Scale & Complexity

- **Primary domain:** Web (single-page interactive client) with optional REST backend.
- **Complexity level:** Low product surface, medium engineering surface. Domain logic is small but the boundary discipline, render-perf considerations, and CI quality gates are doing the heavy lifting.
- **Estimated architectural components:** 2 apps (web, api-stretch) + 4 libs (sim, ui, api-client, types).

### Technical Constraints & Dependencies

- Stack is locked by the brief — Next.js, Nx, Jest, Playwright, NestJS-only-if-backend. No substitutions.
- Time budget 6–8 hours forces ruthless minimalism; every dependency must justify itself.
- First commit must be raw Nx generator output, untouched.

### Cross-Cutting Concerns

- Module boundaries (NFR8) — must be enforced in CI, not aspirational.
- Determinism (FR10) — sim must be pure; React state must never leak in.
- Render performance (NFR4/NFR5) — render strategy is decided at scaffold time, not retrofitted.
- AI artifacts (NFR9) — already committed; architecture must not delete or `.gitignore` them.

---

## 3. Starter Template Evaluation

### Primary Technology Domain

Web application, monorepo. Brief mandates Nx + Next.js + (optional) NestJS, so the only "starter" decision is the Nx preset. No third-party starter applies — the brief explicitly forbids alternatives.

### Starter Options Considered

| Option | Verdict |
| --- | --- |
| `create-nx-workspace` with `--preset=next` | **Selected.** Generates Nx workspace with a Next.js app preconfigured, Jest, ESLint, Playwright optional add. Native to Nx, minimal surface, well-documented. |
| `create-nx-workspace` with `--preset=ts` then add Next.js manually | Rejected. More manual steps, more authored code in the scaffolding commit, contradicts "first commit is raw generator output." |
| `create-next-app` then bolt on Nx | Rejected. Doesn't satisfy the "first commit is Nx scaffolding" requirement cleanly; ordering is wrong. |
| T3 / RedwoodJS / Blitz | Rejected. The brief locks the stack. Substitutions are a fail signal. |

### Selected Starter: Nx Workspace, Next.js preset

**Rationale:** It is the canonical, documented path for the locked stack. It produces a clean first commit consisting entirely of generator output, which is exactly what the brief asks for as commit #1.

**Initialization Command Sequence (the literal commit-1 actions):**

```bash
# Commit 1 — raw Nx scaffolding, untouched
npx create-nx-workspace@latest conways-game-of-life \
  --preset=next \
  --appName=web \
  --style=css \
  --nextAppDir=true \
  --e2eTestRunner=playwright \
  --packageManager=pnpm \
  --ci=github

# (after committing the above as the first commit, on a feature branch:)

# Add a NestJS app for the stretch backend
pnpm nx g @nx/nest:app api --frontendProject=web --tags=scope:server

# Add the shared simulation library (the canonical "shared lib" required by the brief)
pnpm nx g @nx/js:lib sim --directory=libs/sim --bundler=tsc --tags=scope:sim

# Add a UI components library (presentational React components for the web app)
pnpm nx g @nx/react:lib ui --directory=libs/ui --bundler=none --tags=scope:ui

# Add the typed API client wrapper (used by web; talks to NestJS)
pnpm nx g @nx/js:lib api-client --directory=libs/api-client --bundler=tsc --tags=scope:api-client

# Add shared TypeScript types (Grid, Pattern, RuleSet — consumed by sim, web, api-client, api)
pnpm nx g @nx/js:lib types --directory=libs/types --bundler=tsc --tags=scope:types

# Add Tailwind to the web app (post-scaffold, in its own PR)
pnpm nx g @nx/next:setup-tailwind web
```

**Note:** Generator names and exact flags reflect Nx 18+ conventions. The candidate verifies the precise generator surface against the installed Nx version at scaffold time and adjusts (e.g., `--style=css` vs `--style=tailwind`). The principle is fixed: commit 1 is the `create-nx-workspace` output untouched; subsequent generators (api, sim, ui, api-client, types, tailwind) each land as their own focused commit on a feature branch behind a PR.

**Architectural Decisions Provided by the Starter:**

- **Language & runtime:** TypeScript strict, Node LTS, ES2022 target.
- **Framework:** Next.js 14+ App Router (recommended by Nx defaults; see §4 for justification).
- **Test runner:** Jest pre-wired with Nx targets (`nx test sim`, etc.).
- **E2E runner:** Playwright pre-wired in `apps/web-e2e`.
- **Lint:** ESLint with `@nx/eslint-plugin` enabled — required for the `enforce-module-boundaries` rule.
- **Package manager:** pnpm (faster, deterministic, plays well with Nx).
- **CI scaffold:** `--ci=github` produces a starter GitHub Actions workflow we extend.

---

## 4. Core Architectural Decisions (Technology Decisions)

### Decision Priority Analysis

**Critical (block implementation):** Next.js routing mode, sim data structure, render strategy, Nx tag taxonomy, persistence tech (stretch).

**Important (shape architecture):** State management, styling library, CI pipeline shape.

**Deferred (post-MVP-stretch):** Web Worker for simulation (only if the 200×200/60fps stretch tier is attempted), GraphQL vs REST (REST chosen — GraphQL not pursued).

### 4.1 Frontend Framework Routing — Next.js App Router

- **Chosen:** Next.js 14+ **App Router** (`app/` directory).
- **Why:** It is the current default for new Next.js projects, has the longer support horizon, and works cleanly with Nx's `--nextAppDir=true` flag. The simulation page is a single client component, so RSC capabilities are not load-bearing — but choosing Pages Router would be choosing a sunset path against the prevailing direction of the framework, which signals poor stack judgment. App Router with one `page.tsx` marked `'use client'` is the smallest viable footprint.
- **Alternatives rejected:**
  - **Pages Router:** Older, sunset-direction. No upside for this project.
  - **Static export only (no Next.js):** Would violate the "Next.js required" hard constraint.

### 4.2 Language — TypeScript Strict

- **Chosen:** TypeScript with `"strict": true` and `"noUncheckedIndexedAccess": true` in `tsconfig.base.json`.
- **Why:** The brief mandates TypeScript. `strict` catches the classes of bugs (null-undef, implicit-any) that the panel will look at first. `noUncheckedIndexedAccess` matters specifically because the sim does grid index math; it forces the candidate to handle out-of-bounds explicitly, which is the same defensive posture the boundary rule (FR10) requires.
- **Alternatives rejected:** TypeScript non-strict (loses the signal); JSDoc-typed JS (forbidden by stack lock).

### 4.3 Render Strategy — HTML Canvas (with documented OffscreenCanvas + Web Worker upgrade path)

- **Chosen for MVP:** A single `<canvas>` element. The grid is a `Uint8Array` of length `width × height`. Each frame, draw only changed cells (delta-render) on top of a pre-cleared background, OR redraw the full grid using `fillRect` per live cell — both are fast enough for 50×50 at 30 gen/sec. Recommended primary approach: full redraw with `fillRect` at MVP scale, because it is simpler and the profiler will not complain at 50×50.
- **Why:** The PRD's NFR4 budget (50×50 @ ≥30 gen/sec, <50ms input latency) is trivially achievable on Canvas with a flat-array grid. Memoized DOM (one `<div>` per cell) survives 50×50 but starts to wobble approaching 100×100 and is dead at 200×200 — exactly the cliff R2 in the PRD warns about. SVG is even worse for this access pattern. Canvas is the only choice that preserves a clean upgrade path to the stretch budget.
- **Stretch upgrade path (NFR5 — 200×200 @ 60fps):** Move the simulation `step()` call into a **Web Worker** that owns the `Uint8Array`. The main thread sends `{type: 'tick'}` messages and the worker posts back the next-generation buffer (or, ideally, transfers an `ArrayBuffer`). Render to an **OffscreenCanvas** the worker draws to directly; main thread compositing only. This is a single PR's worth of work *because the sim is already pure and array-based* — the design pays off here.
- **Alternatives rejected:**
  - **Memoized DOM cells (`React.memo` per cell):** Survives MVP, dies under stretch. Switching strategies mid-build is exactly the failure R2 warns about.
  - **SVG:** Worst of both worlds — DOM-node-per-cell cost without the styling flexibility that justifies SVG elsewhere.
  - **Plain Canvas without flat array (e.g., 2D `boolean[][]`):** Works but allocates more, complicates Worker transfer (can't `transferList` a nested array). Flat `Uint8Array` is strictly better.

### 4.4 Grid Data Structure — Flat `Uint8Array`

- **Chosen:** `type Grid = { width: number; height: number; cells: Uint8Array }` where `cells[y * width + x]` is `1` for alive, `0` for dead.
- **Why:** Cache-friendly, `transferList`-friendly (Worker), zero per-cell allocation, trivially serializable for the persistence stretch (just store width, height, and the indices of live cells).
- **Alternatives rejected:**
  - **`boolean[][]`:** Idiomatic JS but allocates per row, fragments memory, cannot be transferred to a Worker without re-encoding.
  - **`Set<string>` of `"x,y"`:** Sparse-grid-friendly but Conway grids saturate quickly; the constant cost of string hashing dominates.

### 4.5 State Management — `useState` + `useReducer`, no external store

- **Chosen:** Built-in React state. The page-level component owns: `grid: Grid`, `running: boolean`, `genCount: number`, `genPerSec: number`, `dimensions: {w, h}`. Use `useReducer` for the grid+gen-count pair so transitions are atomic (one reducer dispatch per tick, not two `setState` calls).
- **Why:** The state surface is small and entirely page-scoped. Adding Zustand/Jotai/Redux for one component's state is over-engineering, and the panel reads that as poor judgment. If, post-stretch, save/load adds enough cross-cutting state, lift to a Context with a `useReducer`. **Do not** install an external store for MVP.
- **Alternatives rejected:**
  - **Zustand/Jotai:** Solves a problem we don't have. Imports state into the bundle for no win.
  - **Redux:** Definitely not. The brief calls out scope creep.
  - **React Context for everything:** Premature abstraction; nothing is shared across distant components yet.

### 4.6 Styling — Tailwind CSS

- **Chosen:** Tailwind CSS via `@nx/next:setup-tailwind`.
- **Why:** Time-to-styled-UI is the shortest of any reasonable option for a 6–8h build. No CSS file plumbing, no class-name discipline meetings with yourself, no specificity wars. Responsive utilities (`sm:`, `md:`, `lg:`) make NFR1 (375px portrait) trivial. The candidate's brief explicitly leaves styling open; Tailwind is the most defensible default for this scope.
- **Alternatives considered:**
  - **CSS Modules:** Fine, but adds a small per-component file overhead. Acceptable; not chosen because Tailwind is faster for this build.
  - **Vanilla CSS:** Works but invites ad-hoc class-name decisions.
  - **styled-components / Emotion:** Adds a runtime dependency for no gain at this scope.
- **Pick one and stick with it.** The architecture standardizes on Tailwind; do not mix in CSS Modules or `<style>` tags except in the rare case where Tailwind genuinely cannot express something.

### 4.7 Backend Framework (stretch only) — NestJS

- **Chosen:** NestJS for `apps/api` (REST, no GraphQL).
- **Why:** The brief mandates NestJS *if* a backend is added. REST is sufficient — three endpoints, no nested-relation traversal, no client-driven query shapes that GraphQL exists to solve. GraphQL would be cargo-cult complexity for this scope.
- **Alternatives rejected:**
  - **GraphQL:** Over-engineered for three endpoints and a single resource shape.
  - **Express/Fastify:** Forbidden by the stack lock.
  - **NestJS WebSocket gateway:** Out of scope per PRD.

### 4.8 Persistence (stretch only) — SQLite via Prisma, behind a `PatternRepository` interface

- **Chosen:** SQLite stored at `apps/api/data/patterns.db`, accessed via Prisma. Behind a `PatternRepository` TypeScript interface defined in `libs/types`. An `InMemoryPatternRepository` ships first (MVP-stretch), `SqlitePatternRepository` lands second (full stretch). The NestJS module wires whichever is registered.
- **Why:**
  - **SQLite over Postgres/MySQL:** Zero ops, zero connection-string config, file-on-disk. Matches the PRD's "simplest thing that works, no ops" constraint exactly.
  - **Prisma over TypeORM:** Prisma's schema-first DX is materially faster for someone scaffolding from cold. Generated types flow into the NestJS controller for free. TypeORM's decorator-heavy entity files would burn time relative to the Prisma `schema.prisma` + `prisma migrate dev` flow. The panel reads "Prisma" as a current-best-practice signal; "TypeORM" reads as 2018-era choice unless deeply justified.
  - **Repository interface gate:** Even if the candidate never reaches the SQLite implementation, the in-memory repo behind the same interface is enough to demo the boundary. The seam is what matters.
- **Alternatives rejected:**
  - **TypeORM:** Heavier DX, slower scaffold, no advantage for this scope.
  - **JSON file on disk:** Acceptable fallback if Prisma scaffolding stalls — `JsonFilePatternRepository` is a 30-line class behind the same interface. Documented as the contingency, not the default.
  - **Postgres in Docker:** Real ops surface, time-killing for a 6–8h build.

### 4.9 API Style — REST, three endpoints

- **Chosen:** REST under `/patterns`:
  - `GET /patterns` → `Pattern[]`
  - `GET /patterns/:id` → `Pattern`
  - `POST /patterns` → `Pattern` (body: `{name, width, height, liveCells: [x,y][]}`)
- **Why:** Smallest possible surface that satisfies FR14/FR15. No update, no delete (PRD doesn't require either — keep them out).
- **Alternatives rejected:** GraphQL (see §4.7), DELETE/PUT endpoints (out of scope, scope-creep risk).

### 4.10 CI — GitHub Actions, four required checks

- **Chosen:** Single `ci.yml` workflow on `pull_request` into `main`. Jobs: `lint`, `typecheck`, `test` (Jest, all projects), `e2e` (Playwright on `apps/web-e2e`). Plus an `auto-approve.yml` workflow that approves PRs when all four required checks have passed (using `hmarr/auto-approve-action` or equivalent).
- **Why:** Mirrors NFR7 exactly. Branch protection on `main` requires all four to pass before merge.
- **Alternatives rejected:** Single mega-job (slower, harder to read failure cause); Nx Cloud / DTE (out of scope for take-home; would add account-coupling).

### 4.11 Package Manager — pnpm

- **Chosen:** pnpm.
- **Why:** Fastest install on cold-clone, deterministic by default, integrates cleanly with Nx. The `--packageManager=pnpm` flag on `create-nx-workspace` makes this the smallest change.
- **Alternatives rejected:** npm (slower); yarn (yarn-classic is sunset, yarn-berry adds a PnP discovery problem with Nx).

### Decision Impact Analysis

**Implementation sequence (order in which decisions land in PRs):**

1. Nx scaffold (commit 1, no PR — direct push by the candidate before branch protection is enabled).
2. NestJS + lib generators (`api`, `sim`, `ui`, `api-client`, `types`) — one PR, raw generator output.
3. Tailwind setup — one PR.
4. Nx tag config + `enforce-module-boundaries` ESLint rule — one PR with a deliberately-failing demo commit (then reverted) to prove the rule fires (NFR8).
5. `libs/sim` rules engine + Jest tests — one PR (FR10 lands with its tests).
6. Web app: grid render + cell toggle (FR1, FR2) — one PR.
7. Web app: play/pause/step/randomize/clear + speed slider (FR3–FR9) — one PR.
8. Responsive + a11y polish (FR11, FR12) — one PR.
9. Playwright E2E — one PR.
10. CI workflow + auto-approve + branch protection — one PR.
11. (Stretch) pattern library FR13 — one PR.
12. (Stretch) NestJS API + api-client + persistence — one PR per concern.

**Cross-component dependencies:**

- `libs/sim` depends on `libs/types` only.
- `apps/web` depends on `libs/sim`, `libs/ui`, `libs/api-client`, `libs/types`.
- `apps/api` depends on `libs/sim` (for validation), `libs/types`. Never on `libs/api-client` or `libs/ui`.
- `libs/api-client` depends on `libs/types` only.
- `libs/ui` depends on `libs/types` only (no `libs/sim` imports — UI is presentational).

---

## 5. Implementation Patterns & Consistency Rules

These are the patterns AI agents and the candidate must follow consistently. They are the load-bearing parts of the design.

### 5.1 Pure-Function Simulation Core

Lives in `libs/sim`. Contains zero React, DOM, fetch, or NestJS imports. The lint config enforces this.

**Public API (the candidate implements exactly this surface):**

```typescript
// libs/sim/src/lib/types.ts (re-exported from libs/types for cross-lib use)
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: Uint8Array; // length === width * height; 1 = alive, 0 = dead
}

export interface RuleSet {
  readonly id: string;          // 'conway' | 'highlife' | ...
  readonly name: string;
  /** Pure function: given current grid, return next generation. */
  step(grid: Grid): Grid;
}

// libs/sim/src/lib/grid.ts
export function createGrid(width: number, height: number): Grid;
export function cloneGrid(grid: Grid): Grid;
export function getCell(grid: Grid, x: number, y: number): 0 | 1; // off-grid returns 0
export function setCell(grid: Grid, x: number, y: number, alive: 0 | 1): Grid; // returns new grid
export function toggleCell(grid: Grid, x: number, y: number): Grid;
export function clearGrid(grid: Grid): Grid;
export function randomizeGrid(grid: Grid, density?: number, rng?: () => number): Grid; // density default 0.3

// libs/sim/src/lib/rules/conway.ts
export const conwayRules: RuleSet;
export function step(grid: Grid): Grid; // alias for conwayRules.step, the canonical Conway

// libs/sim/src/lib/patterns.ts
export interface NamedPattern { id: string; name: string; width: number; height: number; liveCells: ReadonlyArray<readonly [number, number]>; }
export const blinker: NamedPattern;
export const block: NamedPattern;
export const glider: NamedPattern;
export const gosperGliderGun: NamedPattern;
export function placePattern(grid: Grid, pattern: NamedPattern, anchorX: number, anchorY: number): Grid;
```

**Invariants:**

- Every function is pure: no I/O, no `Date.now`, no `Math.random` without an injectable RNG (so tests can seed determinism).
- `step` allocates exactly one new `Uint8Array` per call. No mutation of the input grid.
- Off-grid neighbors are dead. No toroidal wrap in MVP. (FR10 acceptance.)

**Test coverage requirements (Jest, in `libs/sim/src/**/*.spec.ts`):**

- The four Conway rules, each as its own `describe` block, each with a minimal grid asserting the rule directly.
- Canonical patterns: block (still life across 5 generations), blinker (period-2 oscillator across 4 generations), glider (translates by (1,1) every 4 generations on a sufficiently large grid).
- Edge cases: empty grid stays empty; single-cell-alive grid dies in one tick; all-alive 3×3 grid evolves correctly per rules; corner cell with no off-grid neighbors.
- Determinism: same input → same output, run 100 times.

### 5.2 Render Loop — `requestAnimationFrame` + Time Accumulator

Drives the simulation forward. Reads the current `genPerSec` fresh every frame so the slider works mid-run (FR8, R7). Lives in `apps/web/app/components/SimulationLoop.tsx` (or as a `useSimulationLoop` hook in `apps/web/app/hooks/`).

**Pattern (pseudocode, near-implementation):**

```typescript
function useSimulationLoop(opts: {
  running: boolean;
  genPerSec: number;            // read fresh every frame via ref
  step: () => void;             // dispatches reducer to advance one generation
}) {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const genPerSecRef = useRef(opts.genPerSec);
  genPerSecRef.current = opts.genPerSec; // always-fresh read, no closure capture

  useEffect(() => {
    if (!opts.running) return;
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    const tick = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumulatorRef.current += dt;
      const tickInterval = 1000 / genPerSecRef.current; // re-derived each frame
      while (accumulatorRef.current >= tickInterval) {
        opts.step();
        accumulatorRef.current -= tickInterval;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [opts.running, opts.step]);
}
```

**Why this shape:** Reading `genPerSec` through a `useRef` instead of as a `useEffect` dependency means changing the slider does not tear down and rebuild the rAF loop — it just changes the rate the next frame computes against. No restart. This is the exact failure mode R7 calls out.

**Cap:** If `genPerSec > 60`, the inner `while` loop catches up by running multiple `step()` calls per frame (the accumulator handles this naturally). The slider tops out at 60 per the PRD anyway, so the inner loop runs at most once per frame in normal use.

### 5.3 Render Strategy

Render is a pure read of `grid` to `<canvas>`. Lives next to the loop in `apps/web/app/components/Canvas.tsx`.

**MVP pattern:**

```typescript
function renderGrid(ctx: CanvasRenderingContext2D, grid: Grid, cellSize: number) {
  ctx.fillStyle = '#0a0a0a'; // dead background
  ctx.fillRect(0, 0, grid.width * cellSize, grid.height * cellSize);
  ctx.fillStyle = '#22d3ee'; // alive (Tailwind cyan-400)
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.cells[y * grid.width + x] === 1) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}
```

Renders are triggered by an `useEffect([grid])`, so the render is reactive to state, not to the rAF tick. The rAF tick advances `grid`; React's render cycle picks it up.

**Cell toggle:** `onPointerDown` on the canvas → translate `clientX/clientY` into grid coords via `getBoundingClientRect()` → dispatch `toggleCell` reducer.

**Stretch upgrade path (NFR5 — 200×200 @ 60fps):**

1. Move `step()` into `apps/web/app/workers/sim.worker.ts` (Web Worker).
2. Replace the `step()` call in the rAF loop with `worker.postMessage({type: 'tick'})`; receive `{type: 'grid', cells: ArrayBuffer}` back via transferable.
3. (Optionally) replace `<canvas>` with `<canvas>` + `transferControlToOffscreen()` so the worker draws directly. Main thread does only event handling + slider state.

This upgrade is one focused PR *because the sim is already pure and array-based*. That is the architectural payoff.

### 5.4 Repository Pattern for Pattern Persistence (stretch)

Defined in `libs/types` as a TypeScript interface. Implemented in `apps/api/src/patterns/`.

```typescript
// libs/types/src/lib/pattern-repository.ts
export interface SavedPattern {
  id: string;
  name: string;
  width: number;
  height: number;
  liveCells: ReadonlyArray<readonly [number, number]>;
  createdAt: string; // ISO 8601
}

export interface PatternRepository {
  list(): Promise<SavedPattern[]>;
  get(id: string): Promise<SavedPattern | null>;
  create(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern>;
}
```

**MVP-stretch implementation — `InMemoryPatternRepository`:** plain `Map<string, SavedPattern>` in module scope, `crypto.randomUUID()` for IDs. Lives in `apps/api/src/patterns/in-memory.repository.ts`. Lost on restart — acceptable per "no ops" constraint.

**Full-stretch implementation — `SqlitePatternRepository`:** Prisma client. Schema:

```prisma
// apps/api/prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = "file:./data/patterns.db" }

model Pattern {
  id        String   @id @default(uuid())
  name      String
  width     Int
  height    Int
  liveCells String   // JSON-encoded [number, number][]
  createdAt DateTime @default(now())
}
```

The NestJS `PatternsModule` registers whichever implementation is bound. The controller is identical either way.

**REST surface (NestJS controller):**

```
GET    /patterns           → SavedPattern[]
GET    /patterns/:id       → SavedPattern (404 if not found)
POST   /patterns           body: { name, width, height, liveCells } → SavedPattern (201)
```

Validation via `class-validator` DTOs in `apps/api/src/patterns/dto/`. Width and height bounds match the MVP grid bounds (5..100) to reject pathological payloads.

### 5.5 Typed API Client — `libs/api-client`

The Next.js app NEVER calls `fetch('/api/patterns')` directly. It calls a typed function in `libs/api-client`:

```typescript
// libs/api-client/src/lib/patterns.ts
import type { SavedPattern } from '@conways-game-of-life/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

export async function listPatterns(): Promise<SavedPattern[]> { /* fetch + zod-validate */ }
export async function getPattern(id: string): Promise<SavedPattern | null> { /* ... */ }
export async function savePattern(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> { /* ... */ }
```

Why this layer: it is *the* mechanism that makes the Next.js ↔ NestJS boundary visible and enforceable. Without it, an `fetch` call buried in a component would tunnel through any tag rule. With it, only `scope:api-client` can talk to the API surface, and the app must depend on `scope:api-client` to do so. This is also where response validation with `zod` (a 5-line addition) catches API-contract drift early.

### 5.6 Nx Module Boundaries — Tag Taxonomy and Allow-list

This is the architecture's most-evaluated piece (NFR8, brief: "Show enforced Nx module boundaries that would actually catch a cross-boundary import in CI").

**Tag taxonomy (locked):**

| Project | Tag(s) |
| --- | --- |
| `apps/web` | `scope:app` |
| `apps/web-e2e` | `scope:e2e` |
| `apps/api` (stretch) | `scope:server` |
| `libs/sim` | `scope:sim` |
| `libs/ui` | `scope:ui` |
| `libs/api-client` | `scope:api-client` |
| `libs/types` | `scope:types` |

**Allowed dependency directions:**

```
scope:app        → scope:sim, scope:ui, scope:api-client, scope:types
scope:server     → scope:sim, scope:types
scope:api-client → scope:types
scope:ui         → scope:types
scope:sim        → scope:types
scope:types      → (no dependencies — leaf)
scope:e2e        → scope:app, scope:types
```

**Forbidden (would fail CI lint):**

- `scope:sim` → anything other than `scope:types`. (Keeps sim pure — no React, no fetch, no Nest.)
- `scope:app` → `scope:server`. (No tunneling into NestJS internals; the app talks to the API only via `scope:api-client`.)
- `scope:server` → `scope:app`, `scope:ui`, `scope:api-client`. (Backend cannot reach frontend code.)
- `scope:ui` → `scope:sim`, `scope:app`, `scope:api-client`. (UI is presentational.)
- Any non-types lib → another non-types lib *not* in its allow-list above.

**ESLint config snippet (lands in the root `eslint.config.js` or `.eslintrc.json`):**

```json
{
  "files": ["**/*.ts", "**/*.tsx"],
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "enforceBuildableLibDependency": true,
        "allow": [],
        "depConstraints": [
          { "sourceTag": "scope:app",
            "onlyDependOnLibsWithTags": ["scope:sim", "scope:ui", "scope:api-client", "scope:types"] },
          { "sourceTag": "scope:server",
            "onlyDependOnLibsWithTags": ["scope:sim", "scope:types"] },
          { "sourceTag": "scope:api-client",
            "onlyDependOnLibsWithTags": ["scope:types"] },
          { "sourceTag": "scope:ui",
            "onlyDependOnLibsWithTags": ["scope:types"] },
          { "sourceTag": "scope:sim",
            "onlyDependOnLibsWithTags": ["scope:types"] },
          { "sourceTag": "scope:types",
            "onlyDependOnLibsWithTags": [] },
          { "sourceTag": "scope:e2e",
            "onlyDependOnLibsWithTags": ["scope:app", "scope:types"] }
        ]
      }
    ]
  }
}
```

**Demonstrating the rule fires (NFR8 deliverable):**

The candidate creates a deliberate violation on a throwaway branch — e.g., add `import * as React from 'react'` to `libs/sim/src/lib/grid.ts`, or add `import { listPatterns } from '@conways-game-of-life/api-client'` to `libs/sim/src/index.ts`. Run `pnpm nx lint sim`. The rule fires:

```
A project tagged with "scope:sim" can only depend on libs tagged with "scope:types".
Found dependency on lib tagged with "scope:api-client".
```

Capture the failure as a screenshot or paste into the README (per NFR8). Do NOT merge the violation; it is a demonstration commit on a throwaway branch.

### 5.7 Determinism & RNG Discipline

`randomizeGrid` accepts an optional `rng: () => number` parameter (defaults to `Math.random`). Tests pass a seeded PRNG (e.g., a tiny `mulberry32`) so the random fixture is reproducible. Production passes `Math.random`. This makes the sim *fully* deterministic from the test suite's point of view — there is no place where global state leaks in.

### 5.8 Error Handling

- **Sim core:** Pure, can't throw on valid inputs. Throws `RangeError` on negative dimensions or `width*height !== cells.length` (programmer error, never reaches users).
- **Web app:** Cell-toggle math is bounds-checked before grid mutation. Canvas-resize input validation happens at the form layer (FR1) — invalid inputs are rejected with a visible message; the previous size is retained.
- **API client:** `fetch` rejection or non-2xx → typed error result; UI shows a toast/message (FR14 acceptance: "On failure, a visible message is shown and no partial state persists").
- **NestJS API:** Standard NestJS exception filters; `class-validator` returns 400 on bad payload; not-found returns 404.

### 5.9 Logging

Minimal. `console.error` for unexpected failures in the web app. NestJS default Logger for the API. No external logging service for this scope — would be operational debt with no payoff.

---

## 6. Project Structure & Boundaries

### Repository Tree

```
conways-game-of-life/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # lint + typecheck + test + e2e on every PR
│       └── auto-approve.yml            # auto-approve PRs with all green checks
├── .claude/                            # AI artifacts (committed, NFR9)
├── .cursor/                            # AI artifacts
├── .opencode/                          # AI artifacts
├── _bmad/                              # BMAD methodology install (committed)
├── apps/
│   ├── web/                            # Next.js app (MVP). tag: scope:app
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # 'use client' — the simulation page
│   │   │   ├── components/
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── Controls.tsx        # play/pause/step/clear/randomize
│   │   │   │   ├── SpeedSlider.tsx
│   │   │   │   └── GridSizeForm.tsx
│   │   │   └── hooks/
│   │   │       └── useSimulationLoop.ts
│   │   ├── public/
│   │   ├── project.json                # tags: ["scope:app"]
│   │   └── tsconfig.json
│   ├── web-e2e/                        # Playwright E2E. tag: scope:e2e
│   │   ├── src/e2e/
│   │   │   └── happy-path.spec.ts      # set size → paint → play → assert advance
│   │   └── playwright.config.ts
│   └── api/                            # NestJS (STRETCH). tag: scope:server
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   └── patterns/
│       │       ├── patterns.controller.ts
│       │       ├── patterns.service.ts
│       │       ├── patterns.module.ts
│       │       ├── in-memory.repository.ts
│       │       ├── prisma.repository.ts        # full-stretch
│       │       └── dto/
│       │           ├── create-pattern.dto.ts
│       │           └── pattern.dto.ts
│       ├── prisma/
│       │   └── schema.prisma                   # full-stretch
│       └── project.json                # tags: ["scope:server"]
├── libs/
│   ├── sim/                            # MVP. tag: scope:sim. Pure functions only.
│   │   ├── src/
│   │   │   ├── index.ts                # public API barrel
│   │   │   └── lib/
│   │   │       ├── grid.ts
│   │   │       ├── grid.spec.ts
│   │   │       ├── rules/
│   │   │       │   ├── conway.ts
│   │   │       │   ├── conway.spec.ts
│   │   │       │   └── highlife.ts             # stretch FR16
│   │   │       └── patterns.ts                 # in-scope-if-time FR13
│   │   └── project.json                # tags: ["scope:sim"]
│   ├── ui/                             # MVP. tag: scope:ui. Presentational only.
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── lib/
│   │   │       ├── Button.tsx
│   │   │       └── Slider.tsx
│   │   └── project.json                # tags: ["scope:ui"]
│   ├── api-client/                     # STRETCH. tag: scope:api-client.
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── lib/
│   │   │       └── patterns.ts
│   │   └── project.json                # tags: ["scope:api-client"]
│   └── types/                          # MVP. tag: scope:types. Leaf — no deps.
│       ├── src/
│       │   ├── index.ts
│       │   └── lib/
│       │       ├── grid.ts
│       │       ├── pattern-repository.ts
│       │       └── named-pattern.ts
│       └── project.json                # tags: ["scope:types"]
├── docs/
│   ├── planning-artifacts/             # PRD, brief, this architecture doc, epics
│   └── implementation-artifacts/       # retrospectives, dev notes
├── nx.json                             # default tags, target defaults, named inputs
├── tsconfig.base.json                  # paths: '@conways-game-of-life/*' → libs/*/src/index.ts
├── eslint.config.js                    # @nx/enforce-module-boundaries config
├── package.json
├── pnpm-lock.yaml
├── README.md                           # the thinking document
├── CLAUDE.md
└── AGENTS.md
```

### MVP vs Stretch Components

| Component | Tier | FR/NFR served |
| --- | --- | --- |
| `apps/web` | MVP | FR1–FR12 |
| `apps/web-e2e` | MVP | FR (E2E spec); NFR7 |
| `libs/sim` | MVP | FR10; NFR3 |
| `libs/types` | MVP | foundational |
| `libs/ui` | MVP (small surface) | FR12 (consistent button/slider primitives) |
| `libs/sim` patterns export | In-scope-if-time | FR13 |
| `libs/api-client` | Stretch (scaffolded MVP, populated stretch) | FR14, FR15 |
| `apps/api` (NestJS) | Stretch | FR14, FR15 |
| `libs/sim` HighLife rules | Stretch | FR16 |
| Web Worker + OffscreenCanvas | Stretch | NFR5 |

**Key decision:** `libs/api-client` is **scaffolded as part of the MVP commits** (empty barrel + tag config) even though its functions aren't called until the stretch. This locks the boundary in place and lets the candidate add the API later without restructuring tags. Cost: one empty lib. Benefit: no rework when stretch arrives.

### Path Aliases

In `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@conways-game-of-life/sim":         ["libs/sim/src/index.ts"],
      "@conways-game-of-life/ui":          ["libs/ui/src/index.ts"],
      "@conways-game-of-life/api-client":  ["libs/api-client/src/index.ts"],
      "@conways-game-of-life/types":       ["libs/types/src/index.ts"]
    }
  }
}
```

Imports in app code always use the `@conways-game-of-life/*` aliases. Direct relative imports across libs (`../../../libs/sim`) are an anti-pattern and the lint rule will not catch them — but the path alias convention plus code review does.

---

## 7. Cross-Cutting Concerns

### 7.1 Testing Strategy

**Unit tests — Jest, in `libs/sim/src/**/*.spec.ts`** (and any other lib):

- Co-located with source. Each `.ts` has a sibling `.spec.ts`.
- The four Conway rules each get a dedicated `it()` block with a minimal grid.
- Canonical patterns (block, blinker, glider) tested over multiple generations.
- Edge cases: empty grid, single cell, all-alive, corners.
- Determinism test: same seed → same output.
- Run via `pnpm nx test sim`. Must complete < 10 seconds (NFR3).

**Integration tests — Jest, in `apps/web/**/*.spec.tsx`**:

- React Testing Library against `apps/web` components.
- Coverage focus: Controls toggle the right reducer actions; the speed slider updates state without restarting the loop; cell toggle on canvas dispatches `toggleCell`.
- Use `@testing-library/react` and `@testing-library/user-event`. The simulation core is *not* re-tested here — it has its own suite.

**E2E tests — Playwright, in `apps/web-e2e/src/e2e/`**:

- One canonical happy-path spec (NFR/FR requirement): `happy-path.spec.ts`:
  1. Navigate to `/`.
  2. Set canvas size to 10×10.
  3. Click cells to form a blinker (three in a row).
  4. Click Play.
  5. Wait for generation count to reach 1.
  6. Assert generation counter shows ≥ 1.
- Run via `pnpm nx e2e web-e2e`.
- Avoid timing-flake: assert against `data-testid="gen-count"` reaching `>= 1`, not against an exact frame state.

**Coverage philosophy:** The PRD explicitly says coverage % is not the metric; behavioral assertion is. The README documents this. Aim for 100% of the `step()` rules covered by behavior, not 100% lines.

### 7.2 CI Workflow Outline

**`.github/workflows/ci.yml`** (triggered on `pull_request` into `main`):

- **Job 1 — `lint`:** `pnpm install --frozen-lockfile` → `pnpm nx affected -t lint --base=origin/main`. The `@nx/enforce-module-boundaries` rule lives here; a violating import fails this job.
- **Job 2 — `typecheck`:** `pnpm nx affected -t typecheck --base=origin/main` (or `tsc --noEmit` per project).
- **Job 3 — `test`:** `pnpm nx affected -t test --base=origin/main --parallel=3`. Runs Jest across affected projects.
- **Job 4 — `e2e`:** `pnpm exec playwright install --with-deps` → `pnpm nx e2e web-e2e`. Only runs on PRs that affect `web` or `web-e2e`.

All four jobs are **required checks** in branch protection. Any failure blocks merge.

**`.github/workflows/auto-approve.yml`** (triggered on `pull_request` into `main`, runs after CI):

- Uses `hmarr/auto-approve-action@v4` (or equivalent), conditioned on the four required checks all having `conclusion === 'success'`. Approves the PR with a `github-actions[bot]` review.

**Branch protection on `main`** (configured in repo settings, documented in README):

- Require PR before merging.
- Require all four checks to pass.
- Require at least 1 approving review (the auto-approve provides this on green).
- Block direct pushes.

### 7.3 Error Handling — see §5.8

### 7.4 Logging — see §5.9

### 7.5 Accessibility (NFR6, FR12)

- All controls are real `<button>` elements with `aria-label` where the visible label is iconic.
- Speed slider is `<input type="range">` with `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- Visible focus rings (Tailwind: `focus-visible:ring-2 focus-visible:ring-cyan-400`).
- Cell color contrast vs background ≥ 4.5:1 (Tailwind `cyan-400` on `neutral-950` clears this).
- The grid itself is not screen-reader navigable in MVP — documented deviation.

### 7.6 Performance Measurement (NFR4, NFR5)

The README documents how performance was measured:

- **NFR4:** Chrome DevTools Performance tab, record 5 seconds at 30 gen/sec on 50×50, assert no frame > 33ms. Or use `console.time` instrumentation around `step()` and the render call.
- **NFR5 (if attempted):** Same method, 60fps target on 200×200. Measurement methodology in README.

---

## 8. Validation / Trade-offs

### Architecture Validation Results

**Coverage of PRD requirements:** All 16 FRs and 10 NFRs are addressed by a specific architectural component (mapped in §2). No FR or NFR is unaddressed. No FR is split awkwardly across components.

**Coverage of the brief's "Things to Avoid":**

- ✅ No coverage-padding tests — test plan is behavior-first, lands with feature PRs.
- ✅ No framework hopping — stack lock is honored end-to-end.
- ✅ AI artifacts committed — `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` already in repo and not gitignored.
- ✅ README is a thinking document — outline in §10.
- ✅ No scope creep — stretch tier explicitly stated, ordered, and gated.

### Deliberate Non-Choices (and why)

| Not chosen | Why not |
| --- | --- |
| **Redux / MobX / Zustand / Jotai** | Page-level state is small. External store is over-engineering and reads as poor judgment for this scope. |
| **GraphQL** | Three endpoints. REST is the correct grain. |
| **TypeORM** | Prisma's DX is materially faster for cold scaffolding; types flow into Nest controllers for free. |
| **CSS Modules / styled-components / Emotion** | Tailwind's time-to-styled-UI is shorter. Pick one and stick with it. |
| **Memoized DOM cell rendering** | Survives MVP, dies under stretch. Switching strategies mid-build is the R2 failure mode. |
| **SSR data fetching for the sim** | Sim is pure client-side. SSR offers nothing here and introduces complexity. The page is `'use client'`. |
| **Toroidal grid wrap-around** | PRD explicitly excludes from MVP. Off-grid = dead. |
| **Real-time collaboration / WebSocket gateway** | Out of scope per PRD. |
| **Custom rule editor UI** | Out of scope. FR16 (stretch) is preset dropdown only. |
| **Pan/zoom on canvas** | Out of scope per PRD. |
| **Cell-level keyboard editing** | Out of scope per PRD (controls are keyboard-accessible; cells are not). |
| **Vercel deploy** | Optional per PRD. Local-runnable is the requirement. |
| **Server-side simulation as MVP** | Client handles MVP grid sizes comfortably. SSR sim is engineering effort in the wrong direction. |

### Trade-offs Made

- **Tailwind over CSS Modules.** Faster to ship. Cost: tag soup in JSX. Acceptable at this scope.
- **App Router over Pages Router.** One client component is simpler in Pages Router; App Router is the future direction. Choosing the future direction is the senior signal.
- **Prisma over TypeORM.** Faster scaffold; better generated types. Cost: one more dev-dep, one more codegen step. Worth it.
- **`useState`/`useReducer` over a store.** Smaller surface, less to read for the panel. Cost: if the stretch surface explodes, refactor to Context. Accepted.
- **Canvas over DOM cells.** Forces a bit more code for cell-toggle hit-testing. Wins on perf and on stretch upgrade path. Easy call.
- **In-memory repo first, SQLite second.** Lets the candidate ship the seam in one PR and the persistence in another. Fail-soft: if Prisma scaffolding stalls, the in-memory implementation is enough to demo the boundary.
- **`libs/api-client` scaffolded in MVP, populated in stretch.** Empty lib cost is trivial; locks the boundary early. No rework when the API arrives.

---

## 9. Risks & Mitigations

### R1 — Render performance cliff at 200×200

The stretch tier (NFR5) demands 60fps at 200×200. A naive Canvas full-redraw at 60fps × 40,000 cells × `fillRect` per live cell will hit budget on a mid-range laptop in modern Chrome — but barely.

**Mitigation:** The architecture pre-commits the upgrade path (Web Worker + OffscreenCanvas + transferable `ArrayBuffer`). The sim is already pure and array-based, so the upgrade is a single PR. The README documents the measurement methodology so the panel can verify locally. If the candidate runs out of time, the stretch is simply not attempted; MVP remains intact.

### R2 — Sim purity drift (React state leaks into `libs/sim`)

A common failure mode: a hook gets imported into `libs/sim` for "convenience," and the lib is no longer pure.

**Mitigation:** Two layers. (a) The Nx tag rule for `scope:sim` allows depending only on `scope:types`. Importing React (`react` is an external package, not a lib) won't be caught by the tag rule alone — so (b) add a project-level ESLint rule in `libs/sim/.eslintrc.json` that bans `react`, `next`, `@nestjs/*`, and `fetch` imports outright via `no-restricted-imports`. Both rules together close the gap.

### R3 — Module boundary configured but never fires

NFR8 explicitly asks for proof. A boundary configured in `eslint.config.js` that no one ever validates is theater.

**Mitigation:** During the boundary-config PR, the candidate creates a deliberately violating import on a throwaway branch, runs `pnpm nx lint sim`, captures the failure output, reverts the violation, and pastes the output into the README under "Module boundaries actually fire." This is a one-PR deliverable.

### R4 — Playwright flake on timing-based assertions

The happy-path E2E asserts that the generation counter advances. If the spec hardcodes "wait 1000ms then assert genCount === 5" against a 5 gen/sec setting, frame-timing variance on CI runners will flake.

**Mitigation:** The spec asserts `genCount >= 1` (or `>= 2`) using Playwright's `expect.poll` or `toHaveText` with a generous timeout, not against an exact value. Tests are tolerant of timing drift, strict on behavior. Document this in the README as a deliberate trade-off.

### R5 — Nx generator version drift over the 7-day window

The first commit is `npx create-nx-workspace@latest`. The candidate runs this, commits the output, then doesn't pin Nx versions in subsequent PRs. A `pnpm nx migrate` mid-build re-shapes generated files and pollutes the git log.

**Mitigation:** After the scaffold commit, the candidate explicitly does NOT run `nx migrate` for the rest of the build. Nx versions are pinned in `package.json`. If a generator misbehaves, the candidate works around it manually rather than upgrading Nx.

### R6 — First-commit purity slips

The brief is explicit: commit 1 is raw generator output, untouched. The candidate's instinct will be to also fix a typo in the generated `README.md` before committing.

**Mitigation:** The candidate runs `create-nx-workspace`, runs `git add -A && git commit -m "Initial Nx scaffolding (raw generator output)"` *immediately*, before any editor opens. Any "small fix" to the generator output happens in commit 2 on a feature branch.

### R7 — Speed slider regression to a `setInterval`-based loop (PRD R7)

A common mid-build temptation: "rAF feels heavy for this; a `setInterval(tick, 1000/genPerSec)` is one line." The interval is captured in a closure, the slider has no effect mid-run, and the panel marks it.

**Mitigation:** The patterns section above (§5.2) is prescriptive and the candidate references it directly. The integration test for the speed slider (in `apps/web/**/*.spec.tsx`) asserts that changing `genPerSec` mid-run does not unmount/remount the loop hook. Test enforces design.

---

## 10. Open Questions

By the end of the architecture document the open-question count should be near zero. The PRD already resolved persistence-tech-undecided (architecture picked SQLite + Prisma) and render-strategy-undecided (architecture picked Canvas + Web Worker upgrade). Remaining items are micro-decisions appropriate for the first implementing PR, not blockers:

1. **Canvas-resize mid-run behavior (FR1 acceptance).** Two options: (a) on resize, pause the simulation and clear the grid; (b) on resize, preserve overlapping cells and trim/zero-pad the rest. Recommendation: **(a) pause + clear**, because it's simpler, has unambiguous behavior, and the user can always randomize again. Document the choice in the README. The architecture supports either; this is a one-line product decision in the implementing PR.

2. **Pattern-doesn't-fit-current-grid behavior (FR13 acceptance).** Two options: (a) reject with a visible message; (b) auto-resize the grid to fit the pattern. Recommendation: **(b) auto-resize**, because it's friendlier and matches the PRD's "polish over feature count" posture. Document in the README.

3. **README "thinking document" outline.** Recommended sections: Architecture overview (link to this doc); module boundaries with the demonstration screenshot; trade-offs explicitly skipped (mirror §8); AI usage with at least one concrete "AI helped" example and one "I pushed back on AI" example (NFR9); what would come next (link to PRD's "Future Vision"); honest "what I'm not happy with."

None of the above block downstream Epics-and-Stories work. The Architecture is complete.

---

## Architecture Validation Summary

- ✅ All 16 FRs and 10 NFRs traced to specific architectural components or patterns.
- ✅ Stack lock honored end-to-end (Next.js, Nx, Jest, Playwright, NestJS).
- ✅ First commit defined as raw `create-nx-workspace --preset=next` output, untouched.
- ✅ Pure-function simulation core specified with public API surface.
- ✅ rAF + accumulator render loop specified to satisfy FR8 / R7.
- ✅ Canvas render strategy chosen with documented Web Worker upgrade path for NFR5.
- ✅ Nx tag taxonomy locked; allow-list matrix and ESLint snippet provided to satisfy NFR8.
- ✅ Repository pattern + REST API + Prisma persistence designed for stretch FR14/FR15 without being on the MVP critical path.
- ✅ Tailwind chosen and standardized.
- ✅ Risks and mitigations identified and concrete.
- ✅ Open questions are micro-decisions for the implementing PR, not architectural ambiguities.

The architecture is ready to drive the Epics-and-Stories workflow.
