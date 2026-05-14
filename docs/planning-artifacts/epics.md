---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: [prd.md, architecture.md, product-brief.md, ASSIGNMENT.md]
---

# Conway's Game of Life - Epic Breakdown

## Overview

This document decomposes the PRD's 16 functional and 10 non-functional requirements, plus the take-home brief's process requirements (first-commit purity, branch protection, AI artifact retention), into eight epics and twenty-four stories sized for a 6–8 hour build by a mid-to-senior frontend engineer. Epics 1–4 constitute the MVP floor — without all four green, the README's "Required Functionality" line is not cleared. Epics 5–8 are stretch tiers, ordered by signal-per-hour against the hiring rubric (pattern library first, persistence last). Each story is sized to roughly one PR. The candidate runs at most twelve to sixteen PRs in MVP and another four to ten in stretch, so the budget is honestly held. Sequencing within each epic follows the Architect's Implementation Sequence (architecture §4) so downstream stories can rely on upstream ones without rework.

## Requirements Inventory

### Functional Requirements

- **FR1** — Define canvas size: user specifies width/height in cells with documented bounds (5×5–100×100 MVP).
- **FR2** — Toggle individual cells: click/tap toggles alive/dead while paused; <50ms perceived latency.
- **FR3** — Clear the grid: one-click reset to all-dead and gen counter to 0.
- **FR4** — Randomize the grid: one-click pseudo-random fill at documented density (~0.3) with gen counter reset.
- **FR5** — Play the simulation: advance generations at the configured rate from the current grid.
- **FR6** — Pause the simulation: stop advancement within one tick, preserving grid and counter.
- **FR7** — Step one generation: advance exactly one generation while paused.
- **FR8** — Adjust simulation speed mid-run: slider takes effect on the next tick without restart.
- **FR9** — Display generation count: visible at all times; resets on Clear/Randomize/resize.
- **FR10** — Apply Conway's rules deterministically: pure functions, four rules, edge cases, canonical patterns.
- **FR11** — Responsive layout: usable on desktop and 375px portrait without horizontal scroll.
- **FR12** — Keyboard-accessible controls: Tab order, Enter/Space activation, Arrow on slider, focus rings.
- **FR13** — Load a named pattern (in-scope-if-time): glider/blinker/Gosper gun selectable from a list.
- **FR14** — Save a starting pattern via NestJS (stretch): typed `api-client` call to NestJS REST.
- **FR15** — Load a saved starting pattern via NestJS (stretch): list and load through the same client.
- **FR16** — Switch rule sets (stretch): preset dropdown for Conway/HighLife etc., one typed `RuleSet` interface.

### Non-Functional Requirements

- **NFR1** — Responsive desktop and 375px mobile portrait, verified by a Playwright spec at mobile viewport.
- **NFR2** — Modern evergreen browser support only; ES2022, no polyfills.
- **NFR3** — Pure-function simulation core; zero React/DOM/framework imports; Jest tests <10s; behavior-first.
- **NFR4** — MVP perf budget: 50×50 at ≥30 gen/sec, <50ms input latency, FCP under 3s.
- **NFR5** — Stretch perf budget: 60fps on 200×200, measurement methodology documented.
- **NFR6** — WCAG 2.1 AA on controls; accessible names; visible focus; no color-only signals.
- **NFR7** — CI gates on every PR: lint, type-check, Jest, Playwright; failures block merge; auto-approve on green.
- **NFR8** — Module boundaries actually enforced; deliberate violation must fail CI; demonstration in README.
- **NFR9** — AI artifacts (`.claude/`, `.cursor/`, `.opencode/`, `_bmad/`) committed and substantive.
- **NFR10** — Reviewable git history; first commit is raw Nx generator output; one-sentence-summarizable commits.

### Additional Requirements

These come from the README (take-home brief) and CLAUDE.md, are not numbered FR/NFRs, but are evaluated:

- **AR1** — First commit is raw `create-nx-workspace --preset=next` output, untouched, with no authored edits mixed in. (Reinforces NFR10.)
- **AR2** — Branch protection on `main` requires PR + all four CI checks + at least one approving review; direct pushes are blocked. (Reinforces NFR7.)
- **AR3** — Auto-approve workflow fires on PRs where all four required checks pass. (Reinforces NFR7.)
- **AR4** — `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` remain in the repo across the entire build; not gitignored, not removed. (Reinforces NFR9.)
- **AR5** — README is a thinking document covering architecture rationale, trade-offs explicitly skipped, AI usage with concrete examples, "what's next," and honest self-critique. (Reinforces NFR9 and the hiring brief.)
- **AR6** — Local-runnable in one command from clone (per README §1). Deployed preview optional.
- **AR7** — Loom walkthrough (≤5 min) covering architecture, one trade-off, one AI hit, one AI miss. (Out of repo, but a deliverable.)

### FR Coverage Map

Every FR/NFR/AR maps to at least one story. MVP requirements map to epics 1–4; stretch requirements map to epics 5–8.

| Requirement | Story |
| --- | --- |
| FR1 | 3.1 (size form), 3.2 (canvas render hooks dimensions) |
| FR2 | 3.2 (canvas render + cell toggle) |
| FR3 | 3.4 (clear control) |
| FR4 | 3.4 (randomize control) |
| FR5 | 3.3 (play/pause/step) |
| FR6 | 3.3 (play/pause/step) |
| FR7 | 3.3 (play/pause/step) |
| FR8 | 3.5 (speed slider with rAF accumulator) |
| FR9 | 3.3 (gen counter) |
| FR10 | 2.1, 2.2, 2.3, 2.4 (sim core stories — rules + patterns + edge cases) |
| FR11 | 3.1 (responsive shell), 4.3 (responsive verification) |
| FR12 | 4.2 (a11y/keyboard) |
| FR13 | 5.1, 5.2 (`[STRETCH]` pattern library data + UI) |
| FR14 | 7.2, 7.3 (`[STRETCH]` save endpoint + client wiring) |
| FR15 | 7.3 (`[STRETCH]` load list + selection) |
| FR16 | 8.1, 8.2 (`[STRETCH]` `RuleSet` interface + HighLife + selector) |
| NFR1 | 3.1, 4.3 |
| NFR2 | 1.1 (Nx scaffold pins TS target) |
| NFR3 | 2.1, 2.2, 2.3, 2.4 (lib structure + tests inline with code) |
| NFR4 | 3.2, 3.5 (Canvas render + rAF accumulator) |
| NFR5 | 6.1, 6.2 (`[STRETCH]` Web Worker + OffscreenCanvas) |
| NFR6 | 4.2 |
| NFR7 | 1.3, 1.4, 1.5 (CI lint/typecheck, Jest, Playwright) + 1.6 (auto-approve) |
| NFR8 | 1.2 (tag config + deliberate-violation demo) |
| NFR9 | AR4 implicitly held by NOT having a story that removes those dirs; documented in 4.4 (README) |
| NFR10 | 1.1 (first-commit purity) |
| AR1 | 1.1 |
| AR2 | 1.6 (branch protection) |
| AR3 | 1.6 (auto-approve workflow) |
| AR4 | Held repo-wide; checked at AR5 in 4.4 |
| AR5 | 4.4 (README as thinking document) |
| AR6 | Implicit in 1.1; verified in 4.4 |
| AR7 | Out of scope for code stories; candidate-owned, called out in 4.4 |

All 16 FRs, all 10 NFRs, and all relevant ARs have a story. AR7 (Loom) is non-code and lives outside the backlog.

## Epic List

1. **Epic 1 — Scaffolding, module boundaries, and CI** *(MVP)* — Stand up the Nx workspace per the brief's first-commit rule, configure the tag taxonomy that makes NFR8 a real gate, and wire the four-check CI plus auto-approve workflow.
2. **Epic 2 — Pure simulation core (`libs/sim`)** *(MVP)* — Implement the Conway rules engine and grid utilities as pure functions, with Jest tests landing in the same PRs (no end-of-build coverage padding).
3. **Epic 3 — Web app interactive MVP** *(MVP)* — Wire the Next.js client to `libs/sim` with Canvas rendering, full controls, and the rAF + accumulator loop that solves PRD R7.
4. **Epic 4 — E2E, accessibility, and responsive polish** *(MVP)* — Cover the canonical happy path with Playwright, verify keyboard reachability, and close the README "thinking document" deliverable.
5. **Epic 5 — Pattern library** *(stretch)* — Named patterns (glider, blinker, Gosper gun) as typed data in `libs/sim`, surfaced through a small UI affordance.
6. **Epic 6 — Performance tier (Web Worker + OffscreenCanvas)** *(stretch)* — Move `step()` into a worker and render to OffscreenCanvas to clear the NFR5 200×200/60fps budget.
7. **Epic 7 — NestJS pattern persistence** *(stretch)* — `apps/api`, typed `libs/api-client`, in-memory then SQLite repository for save/load round-tripping.
8. **Epic 8 — Pluggable rule engine** *(stretch)* — `RuleSet` interface, HighLife implementation, preset dropdown.

## Epic 1: Scaffolding, module boundaries, and CI

Stand up the Nx workspace cleanly so the first commit is raw generator output, then add the surrounding apps and libs, lock the tag taxonomy, and put the four CI checks plus auto-approve in place. By the end of this epic, an empty PR can demonstrate green lint, type-check, Jest, Playwright; a deliberate cross-boundary import fails CI; and branch protection blocks direct pushes to `main`.

### Story 1.1: Initial Nx scaffolding committed untouched

As the candidate,
I want the very first commit on this repo to be the raw output of `create-nx-workspace --preset=next`,
So that the panel can read the git log and see exactly what was scaffolded versus what I authored.

**Priority:** MVP
**FR/NFR coverage:** NFR10, AR1, AR6
**Estimated effort:** S
**ACs are checklist-style because this story is mechanical scaffold.**

**Acceptance Criteria:**

- [ ] `npx create-nx-workspace@latest conways-game-of-life --preset=next --appName=web --style=css --nextAppDir=true --e2eTestRunner=playwright --packageManager=pnpm --ci=github` is run.
- [ ] The generator output is committed in a single commit titled `Initial Nx scaffolding (raw generator output)` with zero manual edits to generated files.
- [ ] No `.claude/`, `.cursor/`, `.opencode/`, `_bmad/`, `docs/`, or planning artifacts are removed by this commit (they are preserved alongside the new scaffold).
- [ ] `pnpm install` and `pnpm nx run web:dev` succeed locally on a freshly cloned working copy.
- [ ] `git log --oneline` shows this as the first repository commit on `main` (or, where pre-existing planning commits exist, the first commit on the implementation branch).
- [ ] Subsequent generator-only work (NestJS app, libs, Tailwind setup) lands in a separate follow-up commit on a feature branch behind a PR — not folded into this commit.

### Story 1.2: Configure Nx tags and prove module boundaries fire

As the candidate,
I want the Nx tag taxonomy plus `@nx/enforce-module-boundaries` configured and demonstrably failing on a deliberate violation,
So that NFR8 is a real, evaluated deliverable rather than a hand-wave.

**Priority:** MVP
**FR/NFR coverage:** NFR8
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the Nx workspace exists with `apps/web`, `apps/web-e2e`, `libs/sim`, `libs/types`, `libs/ui`, `libs/api-client` (and stretch `apps/api`),
**When** I configure each project's `tags` in `project.json` per the architecture §5.6 taxonomy (`scope:app`, `scope:e2e`, `scope:server`, `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types`),
**Then** the root ESLint config has `@nx/enforce-module-boundaries` with the depConstraints from architecture §5.6 and `pnpm nx lint` passes on the empty workspace.

**Given** the boundary rules are configured,
**When** I add a deliberately violating import — `import * as React from 'react'` in `libs/sim/src/index.ts` — on a throwaway branch,
**Then** `pnpm nx lint sim` fails with an `@nx/enforce-module-boundaries` error.
**And** the failure output is captured as a screenshot or log paste committed under `docs/implementation-artifacts/` and referenced from the README per NFR8.

**Given** the demonstration is captured,
**When** I revert the violation,
**Then** `pnpm nx lint sim` passes again and the violating import is not present in any merged commit.

### Story 1.3: CI workflow — lint and type-check on every PR

As the candidate,
I want a GitHub Actions workflow that runs lint and type-check on every PR into `main`,
So that style and TypeScript regressions cannot merge.

**Priority:** MVP
**FR/NFR coverage:** NFR7
**Estimated effort:** S

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` is configured to trigger on `pull_request` into `main`,
**When** a PR is opened or updated,
**Then** the `lint` job runs `pnpm install --frozen-lockfile` followed by `pnpm nx affected -t lint --base=origin/main` and reports a check status.
**And** the `typecheck` job runs `pnpm nx affected -t typecheck --base=origin/main` (or per-project `tsc --noEmit`) and reports a check status.

**Given** a PR introduces a TypeScript error or a lint violation,
**When** CI runs,
**Then** the corresponding check fails and the failure is visible in the PR's checks tab.

### Story 1.4: CI workflow — Jest unit tests on every PR

As the candidate,
I want the same workflow to run Jest across affected projects,
So that simulation rule regressions cannot merge.

**Priority:** MVP
**FR/NFR coverage:** NFR7, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` has a `test` job,
**When** a PR is opened or updated,
**Then** the job runs `pnpm nx affected -t test --base=origin/main --parallel=3` and reports a check status.
**And** test output (pass/fail counts, failure messages) is visible in the GitHub Actions logs.

**Given** a PR introduces a failing Jest test in any affected project,
**When** CI runs,
**Then** the `test` check fails and blocks merge.

### Story 1.5: CI workflow — Playwright E2E on every PR

As the candidate,
I want Playwright wired into CI with browser binaries installed,
So that E2E regressions cannot merge.

**Priority:** MVP
**FR/NFR coverage:** NFR7
**Estimated effort:** M

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` has an `e2e` job,
**When** a PR is opened or updated and affects `apps/web` or `apps/web-e2e`,
**Then** the job runs `pnpm exec playwright install --with-deps` followed by `pnpm nx e2e web-e2e` and reports a check status.
**And** Playwright HTML report or trace artifacts are uploaded on failure for diagnosis.

**Given** the Playwright spec passes locally,
**When** CI runs the same spec,
**Then** the `e2e` check passes within a reasonable wall-clock time (under five minutes for the MVP spec).

### Story 1.6: Branch protection and auto-approve workflow

As the candidate,
I want `main` protected with the four required checks plus the auto-approve workflow firing on green,
So that AR2 and AR3 are demonstrably configured per the brief.

**Priority:** MVP
**FR/NFR coverage:** NFR7, AR2, AR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** repository settings for `main`,
**When** I configure branch protection,
**Then** the four CI checks (`lint`, `typecheck`, `test`, `e2e`) are listed as required, at least one approving review is required, direct pushes are blocked, and the configuration is captured (screenshot or settings export) under `docs/implementation-artifacts/`.

**Given** `.github/workflows/auto-approve.yml` is configured,
**When** a PR's four required checks all conclude `success`,
**Then** the workflow uses `hmarr/auto-approve-action@v4` (or equivalent) to post an approving review from `github-actions[bot]`.
**And** the PR shows the auto-approval and is mergeable per branch-protection rules.

**Given** a PR has at least one failing check,
**When** the auto-approve workflow runs,
**Then** it does not approve the PR.

## Epic 2: Pure simulation core (`libs/sim`)

Implement the deterministic Conway rules engine and the grid primitives in `libs/sim`. Every story in this epic includes its own Jest tests in the same PR — no "tests later" stories. The lib has zero React, DOM, fetch, or NestJS imports; the boundary rule from epic 1 enforces this. By the end of the epic, the four canonical Conway rules, the canonical patterns (block, blinker, glider), edge cases (empty, single cell, all-alive, corners), and determinism are all directly asserted.

### Story 2.1: Grid types and primitives with tests

As a developer of the simulation core,
I want a `Grid` type backed by a flat `Uint8Array` plus pure helpers (`createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`),
So that the rules engine has a stable, allocation-controlled, framework-free data model to operate on.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the `Grid` interface is defined as `{ width: number; height: number; cells: Uint8Array }` in `libs/types` and re-exported from `libs/sim`,
**When** any helper is called,
**Then** it returns a new `Grid` rather than mutating the input (immutability invariant).
**And** `getCell(g, x, y)` returns `0` for any out-of-bounds `(x, y)` (off-grid is dead, per FR10).

**Given** Jest specs co-located with the source,
**When** `pnpm nx test sim` runs,
**Then** specs assert: `createGrid(w, h)` produces `cells.length === w*h` all-zero; `setCell` flips exactly the indexed cell; `toggleCell` is its own inverse; `clearGrid` zeroes every cell; `cloneGrid` returns a deep-equal but reference-distinct grid.

**Given** the boundary rule from story 1.2 is active,
**When** any of these source files imports React, `next/*`, `@nestjs/*`, or `fetch`,
**Then** lint fails (verified by an eslint `no-restricted-imports` rule scoped to `libs/sim`).

### Story 2.2: Conway rules engine `step()` with rule-by-rule tests

As a developer of the simulation core,
I want a pure `step(grid: Grid): Grid` that applies Conway's four rules with off-grid neighbors treated as dead,
So that FR10 has a single canonical implementation that both the web app and (stretch) the API can reuse.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** M

**Acceptance Criteria:**

**Given** a 3×3 grid with a single live cell,
**When** `step()` is applied,
**Then** the resulting grid has zero live cells (rule 1: underpopulation).

**Given** a 3×3 grid with a 2×2 block of live cells,
**When** `step()` is applied repeatedly across five generations,
**Then** the grid is unchanged each generation (rule 2: 2–3 neighbors survive; canonical still life).

**Given** a 5×5 grid with a horizontal blinker (three live cells in a row),
**When** `step()` is applied,
**Then** the next generation has a vertical blinker, and the generation after returns to horizontal (rule 4 reproduction + rule 1 underpopulation; period-2 oscillator).

**Given** a 5×5 grid where a live cell has 4+ live neighbors,
**When** `step()` is applied,
**Then** that cell is dead in the next generation (rule 3: overpopulation).

**Given** a grid configured per the canonical glider pattern on a sufficiently large grid,
**When** `step()` is applied four times,
**Then** the live-cell positions translate by `(1, 1)` relative to the start (canonical spaceship).

**Given** the same input grid,
**When** `step()` is called 100 times in a loop on independent copies,
**Then** all 100 outputs are byte-identical (determinism).

**Given** all the above tests are co-located in `libs/sim/src/lib/rules/conway.spec.ts`,
**When** `pnpm nx test sim` runs,
**Then** all tests pass and the suite completes in under 10 seconds.

### Story 2.3: Edge-case and boundary tests for `step()`

As a developer of the simulation core,
I want explicit Jest coverage of edge cases the four rules don't visibly exercise,
So that the test suite constrains real behavior, not just the happy path.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** an empty grid (all cells dead),
**When** `step()` is applied,
**Then** the result is still empty (no spontaneous life).

**Given** a 3×3 grid with all cells alive,
**When** `step()` is applied,
**Then** the four corner cells die (each has 3 live neighbors, but rule 3 applies once neighbors include >3 — verify the actual expected output cell-by-cell against a hand-computed reference).

**Given** a live cell at the corner `(0, 0)` of a 5×5 grid with no other live cells,
**When** `step()` is applied,
**Then** the cell dies (off-grid neighbors are treated as dead, so neighbor count is 0, rule 1).

**Given** a 1×1 grid with a single live cell,
**When** `step()` is applied,
**Then** the cell dies (rule 1, no neighbors).

### Story 2.4: Randomize with injectable RNG and tests

As a developer of the simulation core,
I want `randomizeGrid(grid, density?, rng?)` that accepts a seedable RNG,
So that production uses `Math.random` while tests use a deterministic seed for reproducibility.

**Priority:** MVP
**FR/NFR coverage:** FR4, FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the function signature `randomizeGrid(grid, density = 0.3, rng = Math.random): Grid`,
**When** called without arguments beyond `grid`,
**Then** each cell is independently alive with probability ~0.3 (verified statistically with a fixed seed in tests, not asserted on a single draw).

**Given** a deterministic seeded RNG (e.g., a tiny `mulberry32`),
**When** `randomizeGrid` is called twice with the same seed and same dimensions,
**Then** the two output grids are byte-identical.

**Given** `density = 0` or `density = 1`,
**When** `randomizeGrid` is called,
**Then** the grid is all-dead or all-alive respectively (boundary cases of the density parameter).

**Given** the spec lives at `libs/sim/src/lib/grid.spec.ts` (or sibling),
**When** `pnpm nx test sim` runs,
**Then** all randomize-related assertions pass.

## Epic 3: Web app interactive MVP

Wire the Next.js client to `libs/sim` so a user can size a canvas, paint cells, run the simulation with full controls, and adjust speed mid-run without restart. Render strategy is HTML Canvas with a flat `Uint8Array` per architecture §4.3. The simulation loop uses `requestAnimationFrame` plus a time accumulator with a fresh-read `genPerSec` ref per architecture §5.2 — this is what defeats PRD R7 (the speed-slider-needs-restart pitfall).

### Story 3.1: Page shell, canvas size form, and responsive layout

As Casey,
I want to land on a page with a sensible-default empty grid and a width × height form to resize it,
So that I can start interacting within seconds on either desktop or my 375px portrait phone.

**Priority:** MVP
**FR/NFR coverage:** FR1, FR11, NFR1
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the deployed (or locally running) page is loaded,
**When** the user opens it on a desktop ≥1280px viewport,
**Then** the canvas and all primary controls are visible together with no scrolling.

**Given** the page is loaded on a 375px portrait viewport,
**When** the page renders,
**Then** controls reflow vertically, the canvas scales to fit width, and there is no horizontal scrollbar.

**Given** the canvas size form,
**When** the user enters a valid width and height within `[5, 100]`,
**Then** the grid renders at the new dimensions and the generation counter resets to 0.

**Given** the canvas size form,
**When** the user enters a value outside `[5, 100]` (zero, negative, >100, non-numeric),
**Then** the input is rejected with a visible message and the previous size is retained.

**Given** the simulation is running,
**When** the user submits a new canvas size,
**Then** the simulation pauses and the grid resets per the documented choice (architecture §10 Open Question 1 — pause + clear).

### Story 3.2: Canvas render and click/tap-to-toggle cells

As Casey,
I want to click (or tap) a cell on the canvas to toggle it alive/dead before pressing play,
So that I can paint a starting state I'm interested in.

**Priority:** MVP
**FR/NFR coverage:** FR2, NFR4
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation is paused and the canvas has rendered the current grid,
**When** the user clicks a dead cell (mouse) or taps it (touch),
**Then** the cell becomes alive, is visibly distinguishable from dead cells (cyan-on-near-black per architecture §7.5), and the visible state change occurs within 50ms of the input event.

**Given** the simulation is paused,
**When** the user clicks an alive cell,
**Then** the cell becomes dead.

**Given** the simulation is running,
**When** the user clicks the canvas,
**Then** the toggle is a no-op (controls disabled while running, per FR2 default).

**Given** the rendering implementation,
**When** the grid state changes,
**Then** a `useEffect([grid])` triggers a Canvas redraw using `fillRect` per architecture §5.3 (no DOM-per-cell rendering).

**Given** the click→grid-coordinate conversion,
**When** the canvas is scaled by CSS to fit its container,
**Then** `getBoundingClientRect()` is used so coordinates remain accurate at any rendered size.

### Story 3.3: Play/Pause/Step controls and generation counter

As Casey,
I want Play, Pause, and Step buttons plus a visible generation counter,
So that I can run the simulation, freeze it, advance one step at a time, and see how far it has progressed.

**Priority:** MVP
**FR/NFR coverage:** FR5, FR6, FR7, FR9
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation is paused,
**When** the user activates Play,
**Then** generations begin advancing at the currently configured `genPerSec`, the Play control becomes Pause (or is visually toggled), and the gen counter increments by 1 per advanced generation.

**Given** the simulation is running,
**When** the user activates Pause,
**Then** advancement stops within one tick, the grid and gen counter are preserved exactly as of the last completed tick, and the control returns to Play.

**Given** the simulation is paused,
**When** the user activates Step,
**Then** the grid advances by exactly one generation per `step()` from `libs/sim` and the gen counter increments by 1.

**Given** the simulation is running,
**When** the user activates Step,
**Then** the action is a no-op (or is visually disabled), per FR7.

**Given** the gen counter is rendered,
**When** the page is at any supported viewport,
**Then** the counter is visible without scrolling and updates within one frame of each generation advance.

### Story 3.4: Clear and Randomize controls

As Casey,
I want one-click Clear and Randomize buttons,
So that I can reset to empty or jump to an interesting random starting state without painting cell-by-cell.

**Priority:** MVP
**FR/NFR coverage:** FR3, FR4
**Estimated effort:** S

**Acceptance Criteria:**

**Given** any grid state and either running or paused,
**When** the user activates Clear,
**Then** every cell is dead, the gen counter resets to 0, and if the simulation was running it is now paused.

**Given** any grid state and either running or paused,
**When** the user activates Randomize,
**Then** `randomizeGrid` from `libs/sim` is called with the default density (0.3), the gen counter resets to 0, and if the simulation was running it is now paused.

**Given** the controls are rendered,
**When** the page is at any supported viewport,
**Then** both buttons are reachable and operable via mouse, touch, or keyboard (Tab + Enter/Space).

### Story 3.5: Speed slider with rAF + accumulator (mid-run change without restart)

As Casey,
I want to drag the generations-per-second slider while the simulation is running and have the new rate take effect on the next tick,
So that I never have to pause and resume just to change speed.

**Priority:** MVP
**FR/NFR coverage:** FR8, NFR4 (and the explicit defeat of PRD R7)
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation loop is implemented as a `useSimulationLoop` hook driven by `requestAnimationFrame` plus a time accumulator per architecture §5.2,
**When** `genPerSec` changes,
**Then** the change is read fresh each frame via a `useRef` (not via a `useEffect` dependency), so the rAF loop is not torn down and rebuilt.

**Given** the slider is rendered with documented bounds (1–60 gen/sec, default 10),
**When** the user drags from one rate to another while the simulation is running,
**Then** the next advanced generation occurs at the new rate without any visible pause, restart, or counter discontinuity.

**Given** an integration test in `apps/web`,
**When** the user changes the slider mid-run,
**Then** the loop's underlying `useEffect` does not re-run (verified by hook-render assertions or a render-counter ref) and the simulation continues uninterrupted.

**Given** the slider is keyboard-focused,
**When** the user presses Arrow Left or Arrow Right,
**Then** the rate changes by one gen/sec per keypress (FR12 hookup).

## Epic 4: E2E, accessibility, and responsive polish

Cover the canonical happy path with Playwright (the README's specified flow), verify keyboard reachability and focus-visible behavior across all controls, verify the 375px responsive shell with a Playwright mobile-viewport spec, and write the README as a thinking document. By the end of this epic the MVP floor is clear.

### Story 4.1: Playwright happy-path E2E spec

As the panel,
I want a Playwright spec that drives the canonical happy path the README specifies,
So that I can verify end-to-end that the app actually works without running it manually.

**Priority:** MVP
**FR/NFR coverage:** NFR7 (the E2E half of the gate); README §3 "at least one Playwright E2E"
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the spec at `apps/web-e2e/src/e2e/happy-path.spec.ts`,
**When** the spec runs,
**Then** it navigates to `/`, sets the canvas size to 10×10, clicks three adjacent cells to form a horizontal blinker, clicks Play, and asserts that the generation counter (located by `data-testid="gen-count"`) reaches `>= 1` within a generous polling window.

**Given** the spec uses `expect.poll` or `toHaveText` with a generous timeout,
**When** CI runner timing varies,
**Then** the spec does not flake on exact-frame assertions (no hard-coded sleeps; no exact-counter assertions like "must equal 5").

**Given** the spec is wired into Nx,
**When** `pnpm nx e2e web-e2e` is run locally or in CI,
**Then** the spec passes.

### Story 4.2: Keyboard reachability and accessible-name audit

As a keyboard-only user,
I want every control reachable via Tab and operable via Enter/Space (or Arrow on the slider) with a visible focus indicator,
So that the app is usable without a mouse.

**Priority:** MVP
**FR/NFR coverage:** FR12, NFR6
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the page is loaded,
**When** the user presses Tab repeatedly from the document start,
**Then** focus moves through Width input, Height input, Submit, Play/Pause, Step, Clear, Randomize, Speed slider in a logical order, with each control receiving a visible focus ring meeting WCAG AA contrast.

**Given** keyboard focus on a button,
**When** the user presses Enter or Space,
**Then** the button activates.

**Given** keyboard focus on the speed slider,
**When** the user presses Arrow Left or Arrow Right,
**Then** the rate decrements or increments by one gen/sec.

**Given** an automated a11y check (e.g., `@axe-core/playwright` in the happy-path spec or as a sibling spec),
**When** the check runs against the loaded page,
**Then** zero serious or critical accessibility violations are reported, and any deviations from WCAG 2.1 AA are documented in the README per NFR6.

**Given** every interactive control,
**When** inspected,
**Then** it has a discernible accessible name (visible label or `aria-label`).

### Story 4.3: Responsive verification at 375px portrait

As a mobile user,
I want a Playwright spec that asserts the app is usable at 375px portrait,
So that NFR1 has a real, repeatable verification rather than a one-time manual check.

**Priority:** MVP
**FR/NFR coverage:** FR11, NFR1
**Estimated effort:** S

**Acceptance Criteria:**

**Given** a Playwright spec configured with a 375×667 viewport,
**When** the spec navigates to `/`,
**Then** it asserts no horizontal scrollbar (`document.documentElement.scrollWidth <= viewport width`).
**And** it asserts the canvas, controls, and gen counter are all visible (or reachable by vertical scroll).

**Given** the same spec,
**When** the user taps a cell on the canvas,
**Then** the cell toggles alive (verifies touch handler parity with mouse).

### Story 4.4: README as thinking document

As the panel,
I want a README that explains why the architecture looks like it does, what was traded off, how AI was used, what would come next, and what the candidate isn't proud of,
So that I get the "thinking document" the brief requires.

**Priority:** MVP
**FR/NFR coverage:** NFR9, AR4, AR5
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the repository root README,
**When** read top-to-bottom,
**Then** it contains sections for: one-command local startup; architecture overview (with a link to `docs/planning-artifacts/architecture.md`); module boundaries (with the deliberate-violation demonstration captured in story 1.2); explicit trade-offs and what was deliberately skipped (mirroring architecture §8); AI usage with at least one concrete "AI helped" example and at least one "I pushed back on AI" example (NFR9); "what's next with another 8 hours"; and an honest "what I'm not happy with."

**Given** the AI artifact directories,
**When** the README is reviewed,
**Then** it confirms `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` are committed, references their location, and is not gitignored (AR4).

**Given** `git log --oneline`,
**When** the README is reviewed,
**Then** the README does not duplicate the git history but cross-references the most consequential PRs/commits (e.g., the boundary-violation demo, the rAF accumulator implementation).

## Epic 5: [STRETCH] Pattern library

Named patterns (block, blinker, glider, Gosper glider gun) live as typed data exports in `libs/sim`. The Next.js app surfaces them via a small selector UI. The pattern-larger-than-grid behavior is auto-resize per architecture §10 Open Question 2 (recommended) — documented in the README either way.

### Story 5.1: [STRETCH] Pattern data and `placePattern()` in `libs/sim`

As Casey,
I want canonical patterns (block, blinker, glider, Gosper glider gun) available as typed data with a `placePattern(grid, pattern, anchorX, anchorY)` helper,
So that I can load a known interesting starting state without painting it cell-by-cell.

**Priority:** Stretch
**FR/NFR coverage:** FR13
**Estimated effort:** S

**Acceptance Criteria:**

**Given** `libs/sim/src/lib/patterns.ts`,
**When** the module is imported,
**Then** it exports typed `NamedPattern` records for `block`, `blinker`, `glider`, and `gosperGliderGun`, each with `id`, `name`, `width`, `height`, and `liveCells`.

**Given** `placePattern(grid, pattern, anchorX, anchorY)`,
**When** called with a pattern that fits within the grid relative to the anchor,
**Then** it returns a new grid with the pattern's live cells placed at offsets from the anchor.

**Given** Jest specs in `libs/sim/src/lib/patterns.spec.ts`,
**When** `pnpm nx test sim` runs,
**Then** specs verify (a) the canonical glider, when stepped four times after placement, has translated by `(1, 1)`; (b) the canonical blinker oscillates with period 2; (c) `placePattern` rejects (or anchor-clips per documented behavior) patterns that exceed grid bounds.

### Story 5.2: [STRETCH] Pattern selector UI in the web app

As Casey,
I want a pattern dropdown (or button list) in the web app,
So that I can pick a glider or Gosper gun and see it placed on the grid.

**Priority:** Stretch
**FR/NFR coverage:** FR13
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the patterns are exported from `libs/sim`,
**When** the user opens the pattern selector,
**Then** the available named patterns are listed with their human-readable names.

**Given** the user selects a pattern that fits the current grid,
**When** the selection is confirmed,
**Then** the pattern is placed at a documented anchor (centered) and the gen counter resets to 0.

**Given** the user selects a pattern that does NOT fit the current grid,
**When** the selection is confirmed,
**Then** the app auto-resizes the grid to fit the pattern (per the documented choice in the README), the pattern is placed centered, and the gen counter resets to 0.

## Epic 6: [STRETCH] Performance tier — Web Worker + OffscreenCanvas

Move `step()` into a dedicated Web Worker, transfer grid `ArrayBuffer`s to avoid copy cost, and (optionally) render to an `OffscreenCanvas` the worker draws to directly. Target: 60fps on 200×200 per NFR5. Architecture §5.3 documents the upgrade path.

### Story 6.1: [STRETCH] Move `step()` into a Web Worker with transferable grid buffers

As Casey,
I want the simulation to keep running smoothly when I bump the grid up to 100×100 or 200×200,
So that the toy still feels alive at large grid sizes.

**Priority:** Stretch
**FR/NFR coverage:** NFR5
**Estimated effort:** L

**Acceptance Criteria:**

**Given** `apps/web/app/workers/sim.worker.ts`,
**When** the main thread posts `{type: 'tick'}` with the current grid `ArrayBuffer` as a transferable,
**Then** the worker computes `step()` (importing from `libs/sim`) and posts back the next-generation `ArrayBuffer` as a transferable.

**Given** the simulation loop hook,
**When** the worker round-trip is wired in,
**Then** `genPerSec` adjustment mid-run still works (the rAF + accumulator pattern is preserved on the main thread).

**Given** Chrome DevTools Performance recording,
**When** running at 200×200 with `genPerSec = 30`,
**Then** sustained framerate is ≥ 60fps with no frame > 33ms over a 5-second window, and the measurement methodology is captured in the README per NFR5.

### Story 6.2: [STRETCH] Render via OffscreenCanvas from the worker

As Casey,
I want the worker to render directly to an OffscreenCanvas,
So that the main thread is free for input handling and the perf headroom doubles.

**Priority:** Stretch
**FR/NFR coverage:** NFR5
**Estimated effort:** M

**Acceptance Criteria:**

**Given** `<canvas>.transferControlToOffscreen()` is called once on mount,
**When** the resulting `OffscreenCanvas` is transferred to the worker,
**Then** the worker draws the grid each tick using the same `fillRect` strategy as architecture §5.3.

**Given** the main thread,
**When** measured with Chrome DevTools,
**Then** main-thread CPU during simulation is dominated by event handling (not render), and the README documents the before/after measurement.

## Epic 7: [STRETCH] NestJS pattern persistence

`apps/api` is a NestJS REST service exposing `GET /patterns`, `GET /patterns/:id`, `POST /patterns`. The Next.js app calls it through `libs/api-client` only — never via direct `fetch`. Persistence starts as `InMemoryPatternRepository` (full stretch falls back to it if Prisma stalls); SQLite via Prisma is the eventual goal.

### Story 7.1: [STRETCH] NestJS `apps/api` with in-memory pattern repository

As Casey,
I want a working NestJS API that holds saved patterns in memory,
So that save/load round-trips during a single server lifetime.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15 (foundation)
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the NestJS app at `apps/api`,
**When** started locally,
**Then** it listens on a documented port (default 3333) and exposes `GET /patterns`, `GET /patterns/:id`, `POST /patterns`.

**Given** `InMemoryPatternRepository` registered to the `PatternsModule`,
**When** a `POST /patterns` is received with a valid body,
**Then** the response is the saved pattern with a generated UUID and ISO-8601 `createdAt`.

**Given** validation via `class-validator` DTOs,
**When** a malformed body is posted (missing name, width out of bounds, etc.),
**Then** the API responds 400 with a structured error.

**Given** Jest specs for the repository and controller,
**When** `pnpm nx test api` runs,
**Then** specs verify list/get/create round-trips and 404 on missing id.

### Story 7.2: [STRETCH] `libs/api-client` typed wrapper

As the web app,
I want a typed `libs/api-client` exporting `listPatterns`, `getPattern`, `savePattern`,
So that the Next.js code never calls `fetch` directly and the boundary is enforceable.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15, NFR8
**Estimated effort:** S

**Acceptance Criteria:**

**Given** `libs/api-client/src/lib/patterns.ts`,
**When** functions are called from `apps/web`,
**Then** they hit the NestJS endpoints, parse responses with `zod` (5-line addition), and return typed `SavedPattern` records (or typed errors).

**Given** the Nx tag rules from story 1.2,
**When** any code in `apps/web` calls `fetch('/patterns')` or imports from `apps/api`,
**Then** lint fails (boundary enforcement).

### Story 7.3: [STRETCH] Save and Load UI in the web app

As Casey,
I want to save a starting state with a name and reload it later from a list,
So that I don't have to repaint patterns I want to come back to.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15
**Estimated effort:** M

**Acceptance Criteria:**

**Given** a non-empty grid and a name input,
**When** the user activates Save,
**Then** the web app calls `savePattern` from `libs/api-client` and the saved pattern appears in the saved-patterns list within the same session.

**Given** saved patterns exist,
**When** the user opens the saved-patterns list,
**Then** the list is fetched via `listPatterns` and each entry is selectable.

**Given** the user selects a saved pattern,
**When** the selection is confirmed,
**Then** the grid resizes to the pattern's dimensions (per documented choice), the pattern's live cells are placed, and the gen counter resets to 0.

**Given** a network or validation failure,
**When** Save or Load is attempted,
**Then** a visible error message is shown and no partial state persists (FR14 acceptance).

### Story 7.4: [STRETCH] SQLite repository via Prisma (full-stretch upgrade)

As the future maintainer,
I want a Prisma + SQLite-backed `PatternRepository` implementation,
So that saved patterns survive server restarts.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15
**Estimated effort:** M

**Acceptance Criteria:**

**Given** `apps/api/prisma/schema.prisma` matches the architecture §5.4 schema,
**When** `pnpm prisma migrate dev` is run,
**Then** the migration produces a `patterns.db` file at `apps/api/data/patterns.db`.

**Given** `SqlitePatternRepository` implements `PatternRepository`,
**When** registered to `PatternsModule` in place of the in-memory implementation,
**Then** all controller behavior from story 7.1 is preserved (the same Jest contract tests pass against either implementation).

**Given** the candidate runs out of time on Prisma,
**When** the in-memory implementation remains in place,
**Then** the README notes the SQLite tier as "designed but not landed; in-memory ships" — explicit and honest, not hidden.

## Epic 8: [STRETCH] Pluggable rule engine

Generalize `step()` to a `RuleSet` interface and ship a second rule set (HighLife: B36/S23). Surface a preset dropdown so users can pick. Conway remains the default.

### Story 8.1: [STRETCH] `RuleSet` interface and HighLife implementation with tests

As a developer of the simulation core,
I want `RuleSet` as a typed interface and `highLifeRules` as a second implementation alongside `conwayRules`,
So that adding a third rule set later is a one-PR job without restructuring.

**Priority:** Stretch
**FR/NFR coverage:** FR16
**Estimated effort:** M

**Acceptance Criteria:**

**Given** `RuleSet` defined as `{ id: string; name: string; step(grid: Grid): Grid }` in `libs/sim`,
**When** `conwayRules` and `highLifeRules` are exported,
**Then** both conform to the interface and are interchangeable at the call site.

**Given** Jest specs for HighLife (B36/S23),
**When** `pnpm nx test sim` runs,
**Then** specs verify HighLife replicator behavior on a known starting pattern (per the canonical HighLife reference) and assert the rule diverges from Conway on a 6-neighbor case (where HighLife reproduces but Conway doesn't).

**Given** the boundary rule remains active,
**When** the new rule set lands,
**Then** `libs/sim` still imports nothing outside `libs/types`.

### Story 8.2: [STRETCH] Rule-set selector in the web app

As Casey,
I want a dropdown to pick between Conway and HighLife,
So that I can compare how the same starting state evolves under different rules.

**Priority:** Stretch
**FR/NFR coverage:** FR16
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the selector is rendered,
**When** the user picks a rule set,
**Then** the selected `RuleSet`'s `step()` is used for the next advanced generation; the grid and gen counter are NOT reset (per FR16 acceptance — only the next-generation computation changes).

**Given** Conway is the default selection on first load,
**When** the user has not interacted with the selector,
**Then** behavior is identical to MVP.

**Given** there is no UI for authoring custom rules,
**When** the selector is inspected,
**Then** it offers only the preset rule sets exported from `libs/sim` (FR16 explicit out-of-scope).

## Open Questions

None that block implementation. Three micro-decisions documented as resolved by the Architect (architecture §10) and re-resolved here at story-acceptance level:

1. **Canvas-resize-mid-run behavior (FR1):** chose pause + clear (story 3.1).
2. **Pattern-doesn't-fit-current-grid behavior (FR13):** chose auto-resize (story 5.2).
3. **SQLite-vs-in-memory persistence fallback:** in-memory ships first; SQLite is its own follow-up story (7.1 → 7.4) with an explicit "if Prisma stalls, in-memory remains and the README is honest" out (story 7.4 AC).
