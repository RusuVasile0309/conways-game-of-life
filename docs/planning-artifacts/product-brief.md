---
stepsCompleted: [step-01-init, step-02-vision, step-03-users, step-04-metrics, step-05-scope, step-06-complete]
inputDocuments: [ASSIGNMENT.md]
date: 2026-05-05
author: BMad Master orchestration (Analyst sub-agent)
---

# Product Brief: Conway's Game of Life

## Executive Summary

We are building a single-page, responsive web app that lets a user play Conway's Game of Life: define a grid, paint a starting state, and run the simulation with play/pause/step and live speed control. The build is a Design Pickle frontend take-home, so the artifact has two simultaneous customers: a curious end-user who wants the toy to feel alive in their browser, and a hiring panel that will read the repo, the git history, the AI traces, and the README to evaluate frontend craft, judgment, and AI fluency. The product is small in surface area but deliberately exercises the full delivery pipeline: Next.js inside an Nx monorepo with a shared simulation library, enforced module boundaries, a NestJS service for pattern persistence, Jest unit tests pinning the rules engine, Playwright covering the happy path, and CI gates on every PR. Scope is tuned for 6–8 hours of focused work — a polished MVP that demonstrates engineering taste, not a long feature list.

---

## Problem & Opportunity

### Problem Statement

Conway's Game of Life is a classic cellular automaton with a tiny rule set and surprisingly rich emergent behavior. The user-facing problem is modest and well understood: a curious person wants to drop cells onto a grid, hit play, and watch patterns evolve, ideally fast enough to feel alive and big enough to host interesting structures. The deeper problem this project solves sits one level up: as a hiring exercise, it is a compact surface that forces engineers to make real decisions about state management, render performance, module boundaries, test strategy, and AI-assisted delivery — the same decisions they will make on real product work.

### Why This Surface Is Interesting

A Game of Life build is deceptively easy to start and surprisingly easy to get wrong. The rules are deterministic and pure, so test signal is genuinely earnable rather than performative. The render loop punishes naive React patterns (re-rendering 40,000 DOM nodes every tick), so performance choices show up immediately. The grid is visual, so UX shortcuts are visible. And because the floor is small, every additional feature is an explicit trade-off the candidate has to defend — exactly the judgment we want to evaluate.

### Opportunity (Hiring Context)

Design Pickle gets to see, in one repo, how a candidate scaffolds an Nx workspace, draws module boundaries that CI actually enforces, structures pure simulation logic as a shared lib, directs AI tooling with traceable artifacts, and ships through small focused PRs with green checks. That is materially more signal than a generic CRUD take-home produces, and it mirrors the real delivery flow at Design Pickle.

### Why Existing "Solutions" Don't Apply

There are dozens of working Game of Life implementations on the open web. None of them solve the actual problem here, which is to demonstrate how *this engineer* builds inside *this stack* with *AI in the loop*. Copying a finished implementation defeats the entire purpose of the exercise. The opportunity is in the build process and the artifacts left behind, not in the novelty of the end product.

---

## Vision & Strategic Alignment

### Vision Statement

A small, fast, honest Conway's Game of Life that any visitor can play in seconds — and a repository that reads like a senior engineer's portfolio in miniature: clean module boundaries, pure simulation core, real tests, focused commits, transparent AI use, and a README that explains *why*.

### Strategic Alignment

This brief explicitly serves Design Pickle's evaluation rubric. The product decisions encoded here trace directly back to the rubric the hiring brief publishes:

- **Frontend craft** — render performance, responsive layout, hooks design, state colocation. Addressed by treating the canvas render loop as a first-class concern in MVP and making the simulation core a pure, testable lib.
- **Code quality and modularity** — Nx workspace with a shared `sim` library and CI-enforced module boundaries; the Next.js app cannot reach into NestJS internals or vice versa.
- **Test signal** — Jest unit tests pin the deterministic rules; Playwright covers the canonical happy path. Tests are written alongside features, not bolted on at the end.
- **AI fluency** — `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` directories are committed as evaluation artifacts. The README documents where AI helped and where it failed.
- **Judgment** — explicit in-scope / stretch / out-of-scope sections, defended in the README.
- **Communication** — README is a thinking document; PRs are small enough to summarize in one sentence; Loom walkthrough is concise.

### Strategic Posture

When in doubt, choose **polish over feature count**. The hiring brief states this explicitly ("a polished MVP beats a broken full feature list"). This brief inherits that posture and applies it to every downstream scope decision.

---

## Target Users

### Primary User: "Casey, the Curious Player"

- **Role / context**: A developer, student, or hobbyist who has heard of Conway's Game of Life or stumbled onto the link. Lands on the page on desktop or phone with no onboarding patience.
- **Goal**: Get a satisfying interaction within seconds — paint some cells, press play, see something interesting happen, tweak it.
- **Pain points with naive implementations**: Tiny canvas, sluggish framerate, awkward mobile touch, no clear way to clear/randomize, speed slider that doesn't take effect until restart, no way to step one generation at a time to study a pattern.
- **What "good" looks like for Casey**:
  - First click toggles a cell within ~16ms; no perceptible input lag.
  - Play/pause is instant and obvious; speed slider takes effect immediately, mid-run.
  - Step button moves exactly one generation, useful for studying gliders / oscillators.
  - The page works on a phone in portrait without horizontal scrolling.
  - If a pattern library exists (stretch), loading a glider or Gosper gun is one click.

### Primary User: "The Hiring Panel"

- **Role / context**: Engineers and hiring managers at Design Pickle (Arno, Rafael, others) reviewing the submitted repo. They will spend a finite amount of time on each candidate, so artifacts must be skimmable.
- **Goal**: Form a confident hire/no-hire judgment from the repo, the running app, the git log, the AI artifacts, and the Loom — in roughly the order they are likely to look at them.
- **Pain points the candidate must avoid**:
  - Bloated initial commit that hides what was scaffolded vs. authored.
  - Tests added in one final commit to chase a coverage number.
  - AI-generated slop committed without review or context.
  - README that is just `pnpm install && pnpm dev`.
  - Framework-of-the-week substitutions (Vite/Vitest/Cypress/Turborepo). The brief forbids these.
  - Direct pushes to `main` or merges with red CI.
- **What "good" looks like for the panel**:
  - One-command local startup; deployed preview is a nice-to-have.
  - First commit is raw Nx generator output; subsequent commits are small, focused, one-sentence-summarizable.
  - Every PR shows green CI (lint, type-check, Jest, Playwright) and is auto-approved by the workflow.
  - `libs/sim` (or equivalent) contains pure rule functions with real Jest assertions covering the four canonical Conway rules plus edge cases.
  - At least one Playwright spec covers: set canvas size → paint cells → press play → assert generation count or expected pattern advances.
  - `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` are present and reflect actual use, not boilerplate.
  - README discusses architecture, trade-offs explicitly skipped, AI usage with concrete examples, and what the candidate would do next with another 8 hours.

### Secondary User: "The Future Maintainer"

The candidate themselves, or the next engineer to touch this code, six months from now. The Nx structure, module boundaries, and test suite should make it possible to add HighLife, Day & Night, or pattern import without rearchitecting. This user is implicit but justifies several stretch choices (pluggable rule engine, NestJS pattern service).

### User Journeys

**Casey's journey (90-second happy path):**
1. Lands on the page → sees an empty grid with sensible default size and minimal chrome.
2. Clicks a few cells (or hits Randomize) → cells toggle alive instantly.
3. Hits Play → simulation animates smoothly; generation counter ticks up.
4. Drags speed slider from slow to fast → speed responds in real time without restarting.
5. Hits Pause, then Step a few times → studies one generation at a time.
6. Hits Clear, redraws a glider → watches it traverse the grid.

**Panel's journey (15–25 minute review path):**
1. Opens repo README → reads architecture rationale and trade-offs.
2. Scans `git log --oneline` → confirms first commit is scaffolding, subsequent commits are small and focused.
3. Opens `libs/sim` → reads the rules engine and its tests; expects deterministic, exhaustive Conway rule coverage.
4. Opens `nx.json` / project tags → confirms module boundaries are configured to fail CI on a violation.
5. Opens `.github/workflows/` → confirms lint, type-check, Jest, Playwright run on every PR with auto-approve on green.
6. Opens `.claude/` and `.cursor/` (and `_bmad/`) → confirms AI artifacts exist and reflect real use.
7. Runs the app locally; pokes at the canvas; tries to break it.
8. Watches Loom → forms final judgment on communication and self-awareness.

---

## Success Metrics

Two distinct metric families, both required. Product metrics validate that Casey gets a satisfying experience; evaluation metrics validate that the panel gets the signal they need.

### Product Success Metrics (Casey-facing)

| Metric | Target | Notes |
| --- | --- | --- |
| Time-to-first-interaction | User toggles a cell within 5 seconds of page load | No onboarding, no modal, no auth |
| Input latency on cell toggle | < 50ms perceived | Click → visible state change |
| Simulation framerate, MVP grid (e.g. 50x50) | 60fps sustained on a mid-range laptop | Render strategy must accommodate this |
| Speed-slider responsiveness | Speed change applies on next tick, not on restart | Common implementation pitfall |
| Mobile usability | App is usable in portrait on a 375px-wide viewport without horizontal scroll | Touch toggles cells |
| Determinism | Same starting state + same generation count → same result, every time | Pure-function simulation guarantees this |

### Evaluation Success Metrics (Panel-facing)

| Metric | Target | Notes |
| --- | --- | --- |
| First commit | Raw Nx generator output, no edits mixed in | Per the hiring brief |
| Git history | Every commit summarizable in one sentence; no drive-by diffs | Panel reads this |
| CI status on merged PRs | 100% green at merge time | Lint + type-check + Jest + Playwright |
| Auto-approve workflow | Configured and demonstrably firing on green PRs | Required deliverable |
| Module boundary enforcement | A deliberate cross-boundary import would fail CI | Nx tags + `@nx/enforce-module-boundaries` |
| Simulation logic location | In a shared lib, not in the Next.js app | Required: "at least one shared library" |
| Simulation unit test coverage | 100% of Conway's four rules tested directly, plus edge cases (empty grid, all-alive grid, single-cell grid, boundary behavior) | Quality over % number |
| Playwright E2E | At least one spec covering the canonical happy path | Set size → paint → play → assert |
| AI artifacts present | `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` committed and non-trivially used | Evaluation artifact, not throwaway |
| README quality | Architecture rationale + trade-offs + AI usage examples + "what's next" + honest "what I'm not happy with" | Thinking document, not setup guide |
| Loom length | ≤ 5 minutes, walks architecture + one trade-off + AI hit + AI miss | Concise is respected |

### Anti-Metrics (things we will not optimize for)

- Total feature count.
- Visual polish as art (clean and functional is enough; pixel-perfect design is not the goal).
- Coverage percentage as a number, divorced from what is actually being asserted.
- Lines of code.

---

## Scope

### In-Scope (MVP / Floor) — Required

These are the non-negotiable items from the hiring brief plus the minimum surrounding work to make the app feel finished rather than skeletal.

1. **User-defined canvas size.** Width and height in cells, with documented sane bounds (e.g. 5×5 minimum, 100×100 maximum for MVP — bounds justified in README).
2. **Click-to-toggle starting state.** Mouse on desktop, touch on mobile.
3. **Clear and Randomize controls.** One click each.
4. **Play / Pause / Step controls.** Step advances exactly one generation while paused.
5. **Adjustable generations-per-second slider** that takes effect mid-simulation, without restart.
6. **Pure-function simulation core in a shared Nx lib** (e.g. `libs/sim`), with comprehensive Jest unit tests covering Conway's four rules and edge cases. This is required by both the brief and the architectural constraint.
7. **Responsive layout** that works on desktop and a 375px mobile viewport.
8. **Accessible controls** — keyboard-operable buttons, semantic labels, sufficient contrast. Canvas itself need not be screen-reader friendly in MVP, but controls must be.
9. **At least one Playwright E2E** covering the happy path: set canvas size → paint cells → press play → assert that the simulation advances.
10. **CI pipeline on every PR** running lint, type-check, Jest, Playwright, with auto-approve on all-green.
11. **Nx module boundaries enforced** via tags such that a cross-boundary import would fail CI.
12. **README as thinking document** — architecture rationale, trade-offs, AI usage with concrete examples, "what's next", honest self-critique.
13. **Committed AI artifacts** — `.claude/`, `.cursor/`, `.opencode/`, `_bmad/` directories preserved.

### Stretch (Priority Order)

Selected based on highest signal-per-hour against the evaluation rubric. Listed in the order we recommend the candidate attempt them. Depth in one beats breadth across all.

1. **Named pattern library (glider, blinker, Gosper glider gun, etc.).**
   *Rationale*: Cheap to implement, demonstrably delightful, exercises clean separation between simulation core and UI (patterns live as data in the shared lib). Highest demo value per hour.

2. **Performance tier — 60fps on a 200×200 grid.**
   *Rationale*: This is where frontend craft shows. Requires real decisions: canvas vs. SVG vs. DOM, render diffing, requestAnimationFrame strategy, possibly a Web Worker or OffscreenCanvas. The README is expected to show *how it was measured*, not just claim it. High signal on the "frontend craft" rubric line.

3. **NestJS service for saving and sharing starting patterns.**
   *Rationale*: The user has explicitly opted IN to NestJS. A small REST or GraphQL service that persists named patterns, exposed through the Next.js app via a typed client (in another shared lib like `libs/api-client`), demonstrates full-stack range and exercises a second module boundary (frontend ↔ backend). Pairs naturally with #1: the pattern library becomes a saveable, shareable thing rather than a hardcoded list. *Assumption*: persistence layer is the simplest thing that works — likely SQLite or in-memory for the take-home; absolutely no auth.

4. **Pluggable rule engine (HighLife, Day and Night, etc.).**
   *Rationale*: Demonstrates architectural thinking and pays off the pure-function design of the simulation core directly. Comparatively low effort *if* the simulation core was built cleanly from the start; potentially expensive if retrofitted late. Last in priority order because the value lands only if #1–#3 are solid.

#### Stretch items intentionally NOT prioritized for this build

- **Real-time collaborative editing via NestJS gateway.** Genuinely cool, genuinely out of scope for 6–8 hours given the auth, presence, and conflict-resolution surface area.
- **Server-side simulation for huge grids.** Interesting, but the client can comfortably handle the grid sizes Casey actually wants; the engineering effort goes into a corner of the design space the panel is not asking about.
- **Pan/zoom and elaborate keyboard shortcuts.** Worthwhile UX work, but hard to do well quickly; better to ship a small canvas that is excellent than a big canvas with janky navigation.

### Explicitly Out of Scope (we are not building this)

- **User accounts, authentication, authorization.** No login, no profile.
- **Multi-user real-time collaboration as MVP.** See above; out even as priority stretch.
- **Server-side simulation as MVP.** Client-side is sufficient for floor grid sizes.
- **Persistent user data beyond named patterns** (no game history, no replays, no leaderboards).
- **Visual design as a portfolio piece.** Clean, functional, accessible — not branded, not animated, not designer-grade.
- **Monetization, analytics, marketing surfaces.** Not a real product launch.
- **Cross-browser support beyond modern evergreens.** No IE11, no legacy Safari.
- **Internationalization.** English only.
- **Custom rule editor UI.** Even if the pluggable rule engine ships, switching rules is via a dropdown of preset rules, not a UI for authoring new rules.

---

## Constraints & Assumptions

### Hard Constraints (from the hiring brief — non-negotiable)

- **Stack is fixed**: Next.js (TypeScript), Nx monorepo with at least one shared library and CI-enforced module boundaries, Jest for unit/integration, Playwright for at least one E2E. NestJS is the only acceptable backend. **No** Vite, Turborepo, Vitest, Cypress, or framework substitutions.
- **First commit must be raw Nx scaffolding**, untouched, before any authored code.
- **All work flows through PRs into `main`.** Branch protection enforced. No direct pushes.
- **CI on every PR** runs lint, type-check, Jest, Playwright. Failures block merge. Green PRs auto-approve.
- **Simulation logic must be pure functions**, with real tests that constrain behavior, not coverage padding.
- **AI artifacts (`.claude/`, `.cursor/`, `.opencode/`, `_bmad/`) are committed deliverables**, not gitignored tooling.
- **README is a thinking document** about architecture, trade-offs, AI usage, and what's next — not a setup guide.

### Time & Effort Constraints

- **6–8 hours of focused work** by a single engineer, submitted within 7 calendar days.
- This brief assumes the engineer is mid-level or senior and comfortable with TypeScript, React/Next.js, Nx, and at least one AI coding assistant.

### Assumptions Made in This Brief (calling these out so the PM can challenge them)

- The user has opted IN to including NestJS services in the architecture, so the brief treats backend pattern persistence as a planned stretch goal rather than truly optional.
- "Sane" canvas bounds for MVP are 5×5 to 100×100, with 200×200 reserved for the performance stretch tier. The candidate documents and justifies the chosen bounds in the README.
- Styling is a candidate choice (Tailwind / CSS Modules / vanilla CSS all acceptable); this brief does not pick one.
- Deployment to Vercel (or equivalent) is appreciated but not required.
- The candidate has GitHub Actions experience sufficient to wire up branch protection and auto-approve workflows.

---

## Risks

### R1: Scope creep — the irresistible "one more stretch goal"

The stretch list is intentionally short, but Conway's Game of Life invites tinkering. The candidate may sink the last 2 hours into a half-finished pluggable rule engine instead of polishing what already works.
*Mitigation*: This brief and the downstream PRD ruthlessly order stretch goals. Every stretch goal must be self-contained: shippable as its own PR with its own tests. If a stretch goal can't ship cleanly in the remaining time, it is not started.

### R2: Performance cliff at larger grids

A naive React-per-cell render strategy will brick at 100×100, never mind 200×200. Discovering this in hour 6 is a disaster.
*Mitigation*: The MVP render strategy must be picked deliberately at scaffolding time (canvas-based or aggressively memoized DOM). The simulation lib stays pure and decoupled from render strategy, so the render layer can be swapped without touching tested logic.

### R3: Test theater — coverage padded at the end

The hiring brief calls this out by name and says they can tell. It is the single most damaging anti-pattern.
*Mitigation*: Tests for the simulation core land in the same PR as the simulation core itself, and behavioral assertions must come from Conway's actual rules (still life, blinker, glider, edge handling) — not from "every function returns a non-undefined value" coverage chasing.

### R4: AI-generated code committed without review

The hiring brief explicitly looks for engineers who *direct* AI rather than *paste* AI. Submitting a PR full of model output without a human review pass is a fail signal regardless of whether the code works.
*Mitigation*: PR descriptions explicitly call out where AI helped and where the human pushed back. The README has a section with concrete examples of both.

### R5: Framework-hopping urge

Mid-build temptation to "just try Vite, it's faster" or to swap Jest for Vitest will burn time and signal disregard for the brief's hard constraint.
*Mitigation*: The stack is fixed and this brief, the PRD, and the architecture document all reinforce that. If the candidate hits friction with the required stack, they document the friction in the README — that itself is signal — rather than swap it out.

---

## Open Questions / Blockers for Downstream

The orchestrator confirmed NestJS inclusion before this brief was written, removing the only open architectural question. The remaining questions are appropriate ones for the PM to answer in the PRD:

1. **Default canvas size on first load.** This brief assumes a sensible default exists (e.g., 30×30) but defers to the PRD/UX work.
2. **Whether the pattern library is hardcoded data in the shared lib (MVP-friendly) or persisted via the NestJS service from day one.** This brief implies the former for MVP and the latter as stretch #3, but the PM should confirm the staging.
3. **Persistence technology for the NestJS pattern service.** SQLite, in-memory, or JSON file. Defer to the architecture document — but note the brief assumes "simplest thing that works" and explicitly rules out anything needing real ops.
4. **Whether the deployed preview is a hard ask or genuinely optional.** The hiring brief says "appreciated but not required"; the PRD can decide whether to commit time to it.

None of these block downstream work. The brief is complete and consistent.

---

## Future Vision (post-take-home)

If this codebase were to live beyond the take-home, the natural growth path is: pluggable rule engine matures into a small library of well-known automata; the NestJS service grows into a shareable pattern gallery with permalinks; performance work unlocks larger grids and Web Worker–based simulation; and a thin collaboration layer turns it into a multiplayer sandbox. None of that is in scope now. It is documented here so the candidate can reference it in the README's "what would you do with another 8 hours" section without fabricating a roadmap on the spot.
