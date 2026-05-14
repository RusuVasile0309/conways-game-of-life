---
stepsCompleted: [step-01-init, step-01b-continue, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: [product-brief.md, ASSIGNMENT.md]
workflowType: 'prd'
---

# Product Requirements Document - Conway's Game of Life

**Author:** BMad Master orchestration (PM sub-agent — John)
**Date:** 2026-05-05

---

## Executive Summary

A single-page, responsive web app implementation of Conway's Game of Life. The user defines a grid, paints a starting state, and runs the simulation with play/pause/step controls and live speed adjustment. The artifact is a Design Pickle frontend take-home, so it serves two audiences simultaneously: a curious end-user who wants the toy to feel alive, and a hiring panel evaluating frontend craft, judgment, and AI fluency through code, git history, tests, and AI artifacts.

The product surface is small and the domain rules are deterministic — that is deliberate. The exercise demonstrates how an engineer scaffolds an Nx workspace, draws module boundaries that CI actually enforces, isolates pure simulation logic in a shared library, directs AI tooling with traceable artifacts, and ships through small focused PRs with green checks. Stack is locked: Next.js (TypeScript), Nx monorepo with at least one shared library and enforced module boundaries, NestJS (TypeScript) for backend services, Jest for unit/integration, Playwright for E2E. Time budget: 6–8 hours. Posture: polish over feature count.

---

## Problem Statement & Vision

### Problem Statement

A curious person wants to drop cells onto a grid, hit play, and watch patterns evolve — fast enough to feel alive and big enough to host interesting structures. That is the surface problem. The deeper problem is the hiring evaluation: this exercise compresses real engineering decisions (state management, render performance, module boundaries, test strategy, AI direction) into a small, well-understood domain so the panel can read signal cleanly.

Naive implementations fail in predictable ways: tiny canvas, sluggish framerate, awkward mobile touch, no clear/randomize, speed slider that requires restart, no single-step. We are not solving novel cellular-automaton problems; we are demonstrating that this engineer, in this stack, with AI in the loop, ships clean.

### Vision

A small, fast, honest Conway's Game of Life that any visitor can play in seconds — and a repository that reads like a senior engineer's portfolio in miniature: clean module boundaries, pure simulation core, real tests, focused commits, transparent AI use, a README that explains *why*, and CI that actually catches what it claims to.

### Strategic Posture

When in doubt, choose **polish over feature count**. The brief states this explicitly. Every downstream scope decision inherits this posture.

---

## Goals & Success Metrics

Two metric families, both required. Product metrics validate the user-facing experience; evaluation metrics validate the hiring signal.

### Product Success Metrics (end-user-facing)

| Metric | Target |
| --- | --- |
| Time-to-first-interaction | User can toggle a cell within 5 seconds of page load (no onboarding, no modal, no auth). |
| Input latency on cell toggle | < 50ms perceived from click/tap to visible state change. |
| Simulation framerate (MVP grid up to 50×50) | 60fps sustained on a mid-range laptop at the maximum supported gen/sec. |
| Speed-slider responsiveness | Speed change applies on the next tick, mid-run, without restart. |
| Mobile usability | Usable in portrait at 375px viewport with no horizontal scroll; touch toggles cells. |
| Determinism | Same starting state + same generation count → same result, every time. |

### Evaluation Success Metrics (panel-facing)

| Metric | Target |
| --- | --- |
| First commit | Raw Nx generator output, no edits mixed in. |
| Git history | Every commit summarizable in one sentence; no drive-by diffs. |
| CI status on merged PRs | 100% green at merge (lint, type-check, Jest, Playwright). |
| Auto-approve workflow | Configured and demonstrably firing on green PRs. |
| Module boundary enforcement | A deliberate cross-boundary import would fail CI. |
| Simulation logic location | In a shared Nx library, not inside the Next.js app. |
| Simulation unit test signal | Conway's four rules tested directly, plus edge cases (empty grid, all-alive grid, single-cell grid, boundary behavior). |
| Playwright E2E | At least one spec covers: set canvas size → paint cells → play → assert advance. |
| AI artifacts present | `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` committed and reflect actual use. |
| README quality | Architecture rationale + trade-offs + AI usage examples + "what's next" + honest self-critique. |

### Anti-Metrics (we will not optimize for these)

- Total feature count.
- Visual polish as art.
- Coverage percentage as a number, divorced from what is asserted.
- Lines of code.
- Tests added in one final PR to chase a coverage number (this is a fail signal, not a neutral one).

---

## Target Users / Personas

### Primary: "Casey, the Curious Player"

A developer, student, or hobbyist who has heard of Conway's Game of Life or stumbled onto the link. Lands on the page on desktop or phone with no onboarding patience. Wants a satisfying interaction within seconds: paint cells, press play, see something interesting, tweak it. Sensitive to input lag, awkward mobile touch, speed sliders that don't take effect mid-run, and grids too small for interesting structures.

### Primary: "The Hiring Panel"

Engineers and hiring managers at Design Pickle reviewing the submitted repo on a finite time budget. Reads the README, scans the git log, opens `libs/sim` and its tests, opens `nx.json`, opens `.github/workflows/`, opens `.claude/` / `.cursor/` / `.opencode/` / `_bmad/`, runs the app locally, watches the Loom. Forms a hire/no-hire judgment from the artifacts in roughly the order listed. Allergic to: bloated initial commits, coverage-padding tests, AI slop committed without review, README-as-setup-guide, framework-of-the-week substitutions, direct pushes to `main`, red CI.

### Secondary: "The Future Maintainer"

The candidate themselves or the next engineer to touch the code six months out. Justifies several stretch choices (pluggable rule engine, NestJS pattern service) by ensuring the structure is extensible without rearchitecting.

---

## User Journeys

### Journey 1: First-time visitor (Casey, 90-second happy path)

- **Trigger:** Casey opens the deployed URL (or runs locally).
- **Steps:**
  1. Lands on an empty grid at a sensible default size with minimal chrome.
  2. Adjusts the canvas size to taste via a width × height input (or accepts default).
  3. Clicks/taps cells to toggle alive — or hits Randomize.
  4. Hits Play; the grid animates and a generation counter ticks up.
  5. Drags the speed slider from slow to fast; speed updates on the very next tick.
  6. Hits Pause, then Step a few times to study one generation at a time.
- **Success criteria:** No restart required to change speed. No perceptible input lag on toggles. Generation counter is visible and accurate. Simulation is paused-and-resumable with no state loss.

### Journey 2: Returning explorer loads a known pattern (in-scope-if-time)

- **Trigger:** Casey wants to watch a glider or Gosper gun without hand-painting it.
- **Steps:**
  1. Hits Clear.
  2. Selects a named pattern from the pattern library (glider, blinker, Gosper glider gun).
  3. Pattern loads, centered or in a sensible position on the current grid.
  4. Hits Play; observes the canonical evolution.
- **Success criteria:** Pattern loads in one click. Pattern data lives as a typed export from the shared simulation library, not in app code. The app gracefully handles a pattern larger than the current grid (rejects with a message or auto-resizes — candidate's call, documented).

### Journey 3: Save and reload a starting pattern (stretch)

- **Trigger:** Casey paints a pattern they want to share or revisit.
- **Steps:**
  1. Casey paints an interesting starting state.
  2. Hits Save, names the pattern.
  3. Next.js client POSTs to NestJS pattern service via a typed client.
  4. Service persists the pattern (simplest thing that works — SQLite, in-memory, or JSON file).
  5. Later, Casey reloads the page, opens the saved-patterns list, picks the pattern, and it loads onto the grid.
- **Success criteria:** Save and load round-trip preserves the exact starting state. No auth. The Next.js app talks to NestJS through a shared `api-client` library — never directly. The boundary is enforced by Nx tags.

---

## Domain Rules

Conway's Game of Life is a deterministic cellular automaton on a two-dimensional grid of cells. Each cell is either alive or dead. The next generation is computed simultaneously for all cells from the current generation using the cell's eight neighbors (Moore neighborhood: orthogonal + diagonal). The rules are exactly four:

1. A live cell with **fewer than 2** live neighbors dies (underpopulation).
2. A live cell with **2 or 3** live neighbors survives.
3. A live cell with **more than 3** live neighbors dies (overpopulation).
4. A dead cell with **exactly 3** live neighbors becomes alive (reproduction).

These four rules are the canonical domain contract. All simulation unit tests must encode them directly. Boundary behavior is finite: cells outside the grid are treated as permanently dead (no toroidal wrap-around in MVP). If wrap-around or other boundary modes are added, they ship as an explicit option, not a silent default.

Reference: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life

---

## Project Type & Architectural Style

**Project type:** Single-page responsive web application. Modern evergreen browsers (current Chrome, Firefox, Safari, Edge). Desktop and mobile (down to 375px portrait).

**Architectural style:**

- **Frontend:** Next.js (TypeScript), client-side rendered simulation loop. Server-side rendering is acceptable for the page shell but the simulation runs in the browser.
- **Backend (stretch):** NestJS (TypeScript) service for pattern persistence. REST or GraphQL — candidate's call. Persistence is the simplest thing that works (SQLite, in-memory, or JSON file). No auth.
- **Monorepo:** Nx workspace. At least one shared library (`libs/sim` for the simulation core is the canonical fit). Stretch adds `libs/api-client` for the typed NestJS client and optionally `libs/patterns` for named pattern data.
- **Module boundaries:** Configured via Nx tags + `@nx/enforce-module-boundaries` so a cross-boundary import (e.g., the Next.js app importing NestJS internals, or the sim lib importing React) fails CI. The candidate must commit a brief demonstration in the README that the rule actually fires.
- **Testing:** Jest for unit and integration; Playwright for at least one E2E. CI runs all four checks (lint, type-check, Jest, Playwright) on every PR with auto-approve on green.

The simulation core lives in a shared Nx library — pure functions, no React, no DOM, no NestJS imports — usable by both the Next.js client and (optionally) the NestJS server.

---

## Scope

### In-Scope (MVP / Floor) — Required

1. User-defined canvas size (width × height in cells, with documented bounds).
2. Click/tap to toggle alive/dead before play.
3. Clear and Randomize controls.
4. Play, Pause, Step controls (Step advances exactly one generation while paused).
5. Generations-per-second slider that takes effect mid-run, without restart.
6. Pure-function simulation core in a shared Nx library, with Jest unit tests pinning the four Conway rules and edge cases.
7. Responsive layout — desktop and 375px mobile portrait.
8. Accessible controls — keyboard-operable, semantic labels, sufficient contrast.
9. At least one Playwright E2E covering the canonical happy path.
10. CI on every PR (lint, type-check, Jest, Playwright) with auto-approve on green.
11. Nx module boundaries configured so a cross-boundary import would fail CI.
12. README as a thinking document.
13. Committed AI artifacts (`.claude/`, `.cursor/`, `.opencode/`, `_bmad/`).

### In-Scope-If-Time-Permits

1. **Named pattern library** (glider, blinker, Gosper glider gun) — patterns as typed data in the shared lib.
2. **Performance tier** — 60fps on a 200×200 grid. Requires deliberate render strategy (canvas vs. memoized DOM, possibly OffscreenCanvas or a Web Worker). README documents how it was measured.

### Stretch (post-MVP)

3. **NestJS service for saving and sharing starting patterns** (REST or GraphQL). Talks to the Next.js app through a typed client in a separate shared library.
4. **Pluggable rule engine** (HighLife, Day and Night, etc.) — pays off the pure-function design directly. Switching rules is via a preset dropdown; no UI for authoring custom rules.

### Explicitly Out of Scope (we are not building this)

- User accounts, authentication, authorization.
- Multi-user real-time collaboration.
- Server-side simulation as MVP.
- Persistent user data beyond named patterns (no game history, replays, leaderboards).
- Visual design as a portfolio piece (clean and functional, not branded or designer-grade).
- Monetization, analytics, marketing surfaces.
- Cross-browser support beyond modern evergreens.
- Internationalization (English only).
- Custom rule editor UI.
- Pan/zoom and elaborate keyboard navigation in MVP.

---

## Functional Requirements

Every FR below is atomic, testable, and traces back to at least one user journey or domain rule. IDs are stable — downstream Architecture and Epics workflows reference them by number.

### Canvas & Grid

#### FR1 — Define canvas size

**Statement:** The user can specify the canvas width and height in cells before or between simulation runs.
**Acceptance criteria:**
- Given the app is loaded, When the user enters a valid width and height within bounds, Then the grid renders at the specified dimensions.
- Given the user enters a value outside the documented bounds (e.g., 0, negative, or above the MVP cap), When they submit, Then the input is rejected with a visible message and the previous size is retained.
- Given the user changes the canvas size mid-run, Then the simulation pauses and the grid resets (or — candidate's documented choice — preserves overlapping cells).
**Bounds (MVP):** 5×5 minimum, 100×100 maximum. The 200×200 case belongs to the performance stretch tier.
**Traces to:** Journey 1.

#### FR2 — Toggle individual cells

**Statement:** While the simulation is paused (including before first play), the user can toggle any cell between alive and dead by clicking (desktop) or tapping (mobile).
**Acceptance criteria:**
- Given the simulation is paused, When the user clicks a dead cell, Then it becomes alive and is visibly distinguishable from dead cells.
- Given the simulation is paused, When the user clicks an alive cell, Then it becomes dead.
- Given the simulation is running, Then cell toggles are disabled (or queued — documented choice; default is disabled).
- Visible state change occurs within 50ms of the input event.
**Traces to:** Journey 1.

#### FR3 — Clear the grid

**Statement:** The user can clear all cells to dead in one action.
**Acceptance criteria:**
- Given any grid state, When the user activates Clear, Then every cell is dead and the generation counter resets to 0.
- Clear is available whether the simulation is running or paused; if running, the simulation pauses.
**Traces to:** Journey 1, Journey 2.

#### FR4 — Randomize the grid

**Statement:** The user can populate the grid with a pseudo-random alive/dead distribution in one action.
**Acceptance criteria:**
- Given any grid state, When the user activates Randomize, Then each cell is independently alive with a documented probability (default ~0.3) and the generation counter resets to 0.
- Randomize is available whether the simulation is running or paused; if running, the simulation pauses.
**Traces to:** Journey 1.

### Simulation Control

#### FR5 — Play the simulation

**Statement:** The user can start the simulation from the current grid state.
**Acceptance criteria:**
- Given the simulation is paused, When the user activates Play, Then generations advance at the currently configured generations-per-second rate.
- The generation counter increments by exactly 1 per advanced generation.
- The Play control becomes Pause (or is visually disabled) while running.
**Traces to:** Journey 1.

#### FR6 — Pause the simulation

**Statement:** The user can pause a running simulation, preserving the current grid state and generation count.
**Acceptance criteria:**
- Given the simulation is running, When the user activates Pause, Then advancement stops within one tick.
- The grid state and generation counter are preserved exactly as of the last completed tick.
- After Pause, the user can resume with Play, single-step with Step, or modify the grid.
**Traces to:** Journey 1.

#### FR7 — Step one generation

**Statement:** While paused, the user can advance the simulation by exactly one generation.
**Acceptance criteria:**
- Given the simulation is paused, When the user activates Step, Then the grid advances exactly one generation per the Conway rules and the generation counter increments by 1.
- Step is disabled (or no-op) while the simulation is running.
**Traces to:** Journey 1.

#### FR8 — Adjust simulation speed mid-run

**Statement:** The user can change the generations-per-second rate at any time, including while the simulation is running, and the change takes effect on the next tick.
**Acceptance criteria:**
- Given the simulation is running at rate R, When the user changes the slider to rate R', Then the next generation advances at R' without requiring Pause/Play.
- The slider supports a documented range (e.g., 1–60 gen/sec); the chosen range is justified in the README.
**Traces to:** Journey 1.

#### FR9 — Display generation count

**Statement:** The current generation number is visible at all times.
**Acceptance criteria:**
- Generation counter starts at 0 on Clear, Randomize, or canvas resize.
- Counter increments by 1 per advanced generation (Play or Step).
- Counter is visible without scrolling on both desktop and 375px portrait viewports.
**Traces to:** Journey 1.

### Correctness & Determinism

#### FR10 — Apply Conway's rules deterministically

**Statement:** The simulation core implements Conway's four rules exactly as defined in the Domain Rules section, in pure functions that take a grid and return the next grid.
**Acceptance criteria:**
- Given any starting grid, the next grid is computed only from the current grid (no hidden state).
- Given identical inputs, repeated calls return identical outputs (deterministic).
- Tests directly assert each of the four rules, plus the canonical patterns: still life (block), oscillator (blinker period 2), spaceship (glider translates by (1,1) every 4 generations).
- Tests cover boundary behavior: cells at the grid edge treat off-grid neighbors as dead.
- Tests cover edge cases: empty grid stays empty; all-alive grid evolves correctly per rules.
**Traces to:** Domain Rules; Journey 1.

### Layout & Accessibility

#### FR11 — Responsive layout

**Statement:** The UI adapts to viewport width such that the app is usable on desktop and on a 375px portrait mobile viewport without horizontal scroll.
**Acceptance criteria:**
- Given a 1280px+ desktop viewport, all controls and the grid are visible together (no scrolling required to access primary controls).
- Given a 375px portrait viewport, controls reflow vertically; the grid scales to fit width; no horizontal scrollbar appears.
- Touch targets meet at least 24×24px effective hit area on mobile.
**Traces to:** Journey 1.

#### FR12 — Keyboard-accessible controls

**Statement:** All simulation controls (Play, Pause, Step, Clear, Randomize, speed slider, canvas size inputs) are reachable and operable via keyboard.
**Acceptance criteria:**
- Given the app is loaded, every control is reachable via Tab in a logical order.
- Given keyboard focus on a control, Enter or Space activates buttons; Arrow keys adjust the slider.
- Each control has a discernible accessible name (label or `aria-label`).
- Visible focus indicator is present and meets contrast requirements.
**Note:** Cell-level keyboard editing of the grid is out of scope for MVP; controls only.
**Traces to:** Journey 1.

### Pattern Library (in-scope-if-time)

#### FR13 — Load a named pattern

**Priority:** In-scope-if-time — only if it does not jeopardize MVP polish.
**Statement:** The user can select a named pattern (e.g., glider, blinker, Gosper glider gun) from a list and load it onto the current grid.
**Acceptance criteria:**
- Given the user opens the pattern library, Then a list of available named patterns is displayed.
- Given the user selects a pattern, When the pattern fits the current grid, Then it is placed on the grid (centered or in a documented anchor position) and the generation counter resets to 0.
- Given the user selects a pattern that does not fit the current grid, Then the app either rejects with a visible message or auto-resizes — the chosen behavior is documented in the README.
- Patterns are exported as typed data from the shared simulation library (or a sibling `libs/patterns`), not embedded in app code.
**Traces to:** Journey 2.

### Pattern Persistence (stretch)

#### FR14 — Save a starting pattern via NestJS

**Priority:** Stretch — only if time permits after MVP and pattern library are polished.
**Statement:** The user can save the current grid state as a named starting pattern via a NestJS-backed REST or GraphQL service.
**Acceptance criteria:**
- Given a non-empty grid and a name, When the user submits Save, Then the Next.js client calls the NestJS service through a typed client in `libs/api-client`.
- On success, the saved pattern is retrievable in the same session and after a page reload.
- On failure (network error, validation error), a visible message is shown and no partial state persists.
- The service stores width, height, and live cell coordinates (or equivalent) — not arbitrary user data.
- No auth.
**Traces to:** Journey 3.

#### FR15 — Load a saved starting pattern via NestJS

**Priority:** Stretch — paired with FR14.
**Statement:** The user can list and load previously saved patterns through the same NestJS service.
**Acceptance criteria:**
- Given saved patterns exist, When the user opens the saved-patterns list, Then the list is fetched from the NestJS service via the typed client.
- Selecting a saved pattern loads it onto the grid, resizing the grid to fit the pattern (or rejecting if disallowed — documented choice).
- Generation counter resets to 0 on load.
**Traces to:** Journey 3.

### Pluggable Rule Engine (stretch)

#### FR16 — Switch rule sets

**Priority:** Stretch — last in priority order.
**Statement:** The user can choose between Conway's standard rules and at least one alternative rule set (e.g., HighLife) via a preset dropdown.
**Acceptance criteria:**
- Given the rule selector is exposed, When the user selects a different rule set, Then the next advanced generation is computed under the new rules.
- Each rule set is a separate pure function in the shared simulation library, conforming to a single typed interface.
- Switching rule sets does not clear the grid; only the next-generation computation changes.
- No UI exists for authoring custom rule sets.
**Traces to:** Architectural reasoning (brief, "Stretch Areas").

---

## Non-Functional Requirements

### NFR1 — Responsive across desktop and mobile

The app is fully usable on modern evergreen browsers (current Chrome, Firefox, Safari, Edge) on desktop (≥1280px) and on a 375px portrait mobile viewport. No horizontal scroll on mobile. Touch interactions toggle cells without requiring a long-press. Verified manually and by at least one Playwright spec running at a mobile viewport size.

### NFR2 — Browser compatibility

Modern evergreen browsers only. Last-two-versions rule. No IE, no legacy Safari (<17), no transpilation targeting ES5. The candidate may rely on standard browser APIs (Canvas, requestAnimationFrame, ResizeObserver, fetch).

### NFR3 — Simulation correctness verifiable by pure-function unit tests

The simulation library contains zero React, DOM, or framework imports. Its public API takes a grid (and optionally a rule set, for FR16) and returns the next grid. All Conway rules and edge cases are unit-tested with Jest. Coverage percentage is not the metric; behavioral assertions of the four rules and canonical patterns (block, blinker, glider) are. Tests must run in under 10 seconds locally.

### NFR4 — Performance budget — MVP

For MVP grid sizes (up to 50×50), the simulation runs at the user-selected gen/sec up to 30 gen/sec on a mid-range laptop without dropped frames. Cell toggle input latency is < 50ms. The app reaches first interactive within 3 seconds on a cold load over a typical broadband connection.

### NFR5 — Performance budget — stretch

If the performance tier (in-scope-if-time #2) is attempted, the target is **60fps on a 200×200 grid** on a mid-range laptop. The README documents how it was measured (Chrome DevTools Performance tab, fps counter, or equivalent), what render strategy was chosen (Canvas / OffscreenCanvas / Web Worker / memoized DOM), and what was traded off. The performance result must be reproducible by the panel locally.

### NFR6 — Accessibility

All interactive controls meet WCAG 2.1 AA for keyboard operability, focus visibility, and color contrast. Each control has an accessible name. The app does not rely on color alone to convey state. The canvas grid itself is not required to be screen-reader navigable in MVP, but controls must be. Deviations from AA are documented with rationale.

### NFR7 — CI quality gates on every PR

Every PR into `main` runs lint, type-check, Jest unit tests, and Playwright E2E. Failing checks block merge. Branch protection on `main` is configured to require these checks plus at least one approving review. Auto-approve is configured to fire on PRs where all checks pass.

### NFR8 — Module boundaries actually enforced

Nx tags are configured (e.g., `scope:app`, `scope:sim`, `scope:api-client`, `scope:server`) with `@nx/enforce-module-boundaries` rules such that a cross-boundary import would fail `lint` or `build`. The README includes a one-line demonstration (or commit reference) showing the rule firing on a deliberate violation.

### NFR9 — AI artifacts committed and substantive

`.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` directories are committed and reflect actual use during the build. The README has a section listing which AI tools were used, with at least one concrete example of where AI helped meaningfully and at least one example of where the candidate pushed back on AI output.

### NFR10 — Deterministic, reviewable git history

Every commit's intent is summarizable in one sentence. The first commit is raw Nx generator output, untouched, with no authored code mixed in. No drive-by edits. No squash-merges that erase the per-PR history if the per-PR history is cleaner. Direct pushes to `main` are forbidden; branch protection is configured to enforce this.

---

## Constraints & Assumptions

### Hard Constraints (from the take-home brief — non-negotiable)

- **Stack is fixed:** Next.js (TypeScript), Nx monorepo with at least one shared library, Jest for unit/integration, Playwright for at least one E2E, NestJS (TypeScript) for any backend. No Vite, Turborepo, Vitest, Cypress, or framework substitutions.
- **First commit is raw Nx scaffolding,** untouched, before any authored code.
- **All work flows through PRs into `main`.** Branch protection enforced. No direct pushes.
- **CI on every PR** runs lint, type-check, Jest, Playwright. Failures block merge. Green PRs auto-approve.
- **Simulation logic must be pure functions** with real tests that constrain behavior.
- **AI artifacts are committed deliverables,** not gitignored tooling.
- **README is a thinking document.**

### Time & Effort

- **6–8 hours of focused work** by a single mid-to-senior frontend engineer.
- **7 calendar days** from receipt of the brief to submission.

### Assumptions (decided in this PRD)

- **NestJS is in scope.** The README treats backend as optional; the orchestrator confirmed inclusion. Pattern persistence (FR14, FR15) is the chosen backend surface.
- **Canvas size bounds for MVP:** 5×5 minimum, 100×100 maximum. The 200×200 case is reserved for the performance stretch tier.
- **Default canvas on first load:** 30×30. Justified as large enough to host a glider's traversal without immediate edge interaction, small enough to render without strain on any target device.
- **Default speed slider range:** 1–60 generations/second. Default value: 10 gen/sec.
- **Default randomize alive probability:** ~0.3. Justified as producing visually interesting starting states without immediate die-out or saturation.
- **Persistence technology for the NestJS pattern service:** simplest thing that works (in-memory or SQLite) — the architecture document picks. Absolutely no auth and no operational footprint.
- **Deployed preview is optional.** The candidate decides whether to commit time to Vercel deployment; local-runnable is the requirement.
- **Styling library is the candidate's call** (Tailwind, CSS Modules, vanilla CSS — all acceptable).

---

## Out of Scope (Explicit, Re-Stated for Clarity)

- User accounts, authentication, authorization.
- Multi-user real-time collaboration (NestJS gateways, WebSockets, presence).
- Server-side simulation as MVP.
- Persistent user data beyond named patterns (no game history, replays, leaderboards, telemetry).
- Visual design as a portfolio piece.
- Monetization, analytics, marketing surfaces.
- Cross-browser support for legacy browsers (IE, Safari <17).
- Internationalization.
- Custom rule editor UI (even if FR16 ships, switching rules is via a preset dropdown).
- Pan/zoom and elaborate keyboard navigation.
- Cell-level keyboard editing of the grid.

---

## Risks & Mitigations

### R1 — Scope creep ("one more stretch goal")

The Game of Life invites tinkering. The candidate may sink the last 2 hours into a half-finished pluggable rule engine instead of polishing what already works.
**Mitigation:** Stretch goals are ordered (1: pattern library, 2: perf, 3: NestJS persistence, 4: pluggable rules). Each must ship as its own PR with its own tests. If a stretch goal cannot ship cleanly in the remaining time, it is not started.

### R2 — Performance cliff at larger grids

A naive React-per-cell render strategy will brick at 100×100, never mind 200×200. Discovering this in hour 6 is a disaster.
**Mitigation:** Render strategy is chosen deliberately at scaffolding time (canvas-based or aggressively memoized DOM). The simulation library stays decoupled from render strategy so the render layer can be swapped without touching tested logic. The performance stretch tier (NFR5) is opt-in, not assumed.

### R3 — Test theater (coverage padded at the end)

The take-home brief calls this out by name. Adding tests in the final PR to chase a number is the single most damaging anti-pattern on this evaluation.
**Mitigation:** Tests for the simulation core land in the same PR as the simulation core itself. Behavioral assertions encode Conway's actual rules (still life, blinker, glider, edge handling), not "every function returns a non-undefined value" coverage chasing. The PRD's NFR3 is explicit that coverage % is not the metric.

### R4 — AI-generated code committed without review

The brief looks for engineers who *direct* AI rather than *paste* AI. Submitting a PR full of model output without a human review pass is a fail signal.
**Mitigation:** PR descriptions explicitly call out where AI helped and where the human pushed back. The README has a section with concrete examples of both. NFR9 makes this a quality gate.

### R5 — Framework-hopping urge

Mid-build temptation to swap Vite for Next.js or Vitest for Jest will burn time and signal disregard for the brief.
**Mitigation:** Stack is fixed. If the candidate hits friction with the required stack, they document the friction in the README — that itself is signal — rather than swap it out.

### R6 — Module boundary configured but never tested

Configuring Nx tags is easy; actually proving the rule fires is the deliverable. A boundary that never catches anything is not a boundary.
**Mitigation:** NFR8 requires a demonstration (committed proof or README reference) that a deliberate cross-boundary import fails CI.

### R7 — Speed slider that requires restart

A common implementation pitfall: changing the slider only takes effect after Pause → Play, because the tick interval is captured in a closure or `setInterval` that isn't re-derived. This is called out specifically because it shows up in many naive implementations.
**Mitigation:** FR8 makes mid-run speed adjustment explicit. The architecture should drive the simulation off `requestAnimationFrame` with an accumulator that reads the current rate fresh each frame, or equivalent.

---

## Dependencies

- **Conway's Game of Life rules reference:** https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life — canonical source for the four rules and named patterns.
- **Required runtimes & tooling:** Node.js LTS, pnpm or npm (candidate's call), Nx CLI, Next.js, NestJS (for stretch), Jest, Playwright, GitHub Actions.
- **Styling library:** candidate's choice (Tailwind / CSS Modules / vanilla CSS — all acceptable).
- **Persistence (stretch):** SQLite or in-memory store, decided in the architecture document.
- **Hosting (optional):** Vercel for the Next.js app; NestJS service local-only for the take-home unless the candidate elects otherwise.
- **CI:** GitHub Actions, with branch protection and auto-approve workflow configured by the candidate.

---

## Open Questions

The orchestrator confirmed NestJS inclusion and the staging of stretch goals before this PRD was written, so most prior open questions are resolved here. The remaining items are appropriate for the architecture document, not blockers for downstream PRD work:

1. **Persistence technology for the NestJS pattern service** — SQLite vs. in-memory vs. JSON file. Defer to the architecture document; constraint is "simplest thing that works, no ops."
2. **Render strategy for the simulation grid** — Canvas vs. memoized DOM vs. SVG. Defer to architecture; constrained by NFR4 (MVP) and NFR5 (stretch).
3. **Whether canvas resize mid-run preserves overlapping cells** (FR1) — small UX call; architecture or first implementing PR decides and documents in the README.

None of these block the Architecture or Epics-and-Stories workflows.
