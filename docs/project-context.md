---
project_name: conways-game-of-life
user_name: BMad Master orchestration (Tech Writer sub-agent — Paige)
date: 2026-05-05
sections_completed: [technology_stack, critical_rules, conventions, gotchas, references]
inputDocuments: [architecture.md, prd.md, epics.md, CLAUDE.md, ASSIGNMENT.md]
---

# Project Context for AI Agents

## 1. Purpose

This file is the operational rulebook for any AI agent (Claude Code, Cursor, opencode, etc.) writing code in this repository. It captures the **non-obvious** rules a generic LLM would otherwise miss — the take-home brief's hiring tripwires, the Architect's locked technology decisions, and the patterns that make this codebase score signal rather than noise. Read it before you write code. When in doubt, defer to the canonical docs in §7. Do not restate things that are obvious from reading the code; this file exists to override defaults.

---

## 2. Technology Stack & Versions

Stack is **locked by the take-home brief** — substitutions are a fail signal, not a creative choice.

| Concern | Choice | Notes |
| --- | --- | --- |
| Frontend framework | **Next.js 14+ App Router** | Use `app/` directory. The simulation page is one client component (`'use client'`). Pages Router is the sunset path — do not use it. |
| Language | **TypeScript strict** | `"strict": true` AND `"noUncheckedIndexedAccess": true` in `tsconfig.base.json`. The latter forces explicit out-of-bounds handling in grid index math. |
| Runtime | React 18+, Node LTS, ES2022 | No ES5 transpile target. No polyfills. |
| Monorepo | **Nx (latest stable)** | Generators: `@nx/next:app` (web), `@nx/nest:app` (api stretch), `@nx/js:lib` (sim, api-client, types), `@nx/react:lib` (ui), `@nx/next:setup-tailwind`, `@nx/playwright`. |
| Backend (stretch only) | **NestJS** | REST, three endpoints under `/patterns`. Not on the MVP critical path. |
| Unit / integration tests | **Jest** (Nx-configured) | Co-located `*.spec.ts(x)` next to source. |
| E2E tests | **Playwright** via `@nx/playwright` | Lives in `apps/web-e2e`. |
| Styling | **Tailwind CSS** | Chosen over CSS Modules for shortest time-to-styled-UI in a 6–8h budget. Pick one and stick with it; do not mix in CSS Modules / styled-components. |
| Persistence (full-stretch only) | **SQLite via Prisma** | Behind a `PatternRepository` interface in `libs/types`. `InMemoryPatternRepository` ships first; SQLite is the upgrade. |
| State management | **`useState` / `useReducer` only** | No Zustand, Jotai, Redux, MobX. The page-level state surface is small and entirely page-scoped. |
| Render strategy | **HTML Canvas + flat `Uint8Array`** | `cells[y * width + x]`. Stretch upgrade path: OffscreenCanvas + Web Worker with transferable `ArrayBuffer`. Do not use `boolean[][]`, `Set<string>`, or DOM-per-cell rendering. |
| Run loop | **`requestAnimationFrame` + time accumulator** | Not `setInterval`. Read `genPerSec` via a `useRef` (fresh each frame), not via a `useEffect` dependency. |
| Package manager | **pnpm** | Set by `--packageManager=pnpm` on `create-nx-workspace`. |
| CI | **GitHub Actions** | Four required checks on every PR into `main`: lint, typecheck, test, e2e. Plus an `auto-approve.yml` workflow on green. |

### Forbidden substitutions (called out by the brief — do not propose any of these)

- **Vite, Vitest, Cypress, Turborepo** — wrong stack.
- **`create-next-app` then bolt on Nx** — wrong ordering, breaks the first-commit rule.
- **GraphQL** — REST is correct grain for three endpoints.
- **TypeORM** — Prisma is the choice.
- **Zustand / Jotai / Redux / MobX** — built-in React state suffices.
- **Express / Fastify / NestJS WebSocket gateway** — out of scope.
- **Yarn-only or Bun** — pnpm is the choice.

---

## 3. Critical Implementation Rules

Numbered, action-shaped, with a one-line "why" tag. These are the hiring tripwires plus the Architect's load-bearing patterns.

1. **First commit MUST be raw `create-nx-workspace --preset=next` output, untouched.** No edits to generated files mixed in. Run the generator, `git add -A && git commit` immediately, before any editor opens. *(Why: explicit hiring rule; first commit is read by reviewers to separate authored work from tool output.)*

2. **All work flows through PRs into `main`.** No direct pushes. Branch protection requires the four CI checks plus one approving review (the auto-approve workflow provides it on green). *(Why: brief mandate; AR2/AR3.)*

3. **Each commit is summarizable in one sentence.** No drive-by changes; no "fix typo + rewire reducer" combo commits. Reviewers read the git log. *(Why: brief mandate; signal of disciplined shipping.)*

4. **Simulation core lives in `libs/sim` as pure functions only.** Zero React, Next, NestJS, DOM, `fetch`, `window`, or `Date.now`/`Math.random` without an injectable RNG. The Nx tag rule (`scope:sim` → `scope:types` only) plus a project-level `no-restricted-imports` ESLint rule (per architecture §5/R2) close this gap together. **Do not remove `no-restricted-imports`** — the tag rule alone does not catch external packages like `react`. *(Why: FR10, NFR3; sim purity is the load-bearing architectural property.)*

5. **Module boundaries must actually fire in CI, not be aspirational.** The tag taxonomy is locked: `scope:app`, `scope:server`, `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types`, `scope:e2e`. Use the `@nx/enforce-module-boundaries` `depConstraints` snippet from architecture §5.6 verbatim. Story 1.2 includes a deliberate-violation demonstration (committed under `docs/implementation-artifacts/`) to prove the rule fires. *(Why: NFR8; "show enforced module boundaries that would actually catch a cross-boundary import in CI" is in the brief.)*

6. **rAF + accumulator with rate read via `useRef`.** The simulation loop reads `genPerSec` fresh every frame through a ref. Do **not** put `genPerSec` in a `useEffect` dependency array — that tears down and rebuilds the rAF loop on every slider change, which is exactly the failure mode PRD R7 calls out. The reference implementation is in architecture §5.2; copy its shape. *(Why: FR8 + PRD R7; the slider must take effect mid-run without restart.)*

7. **`setInterval` is forbidden for the run loop.** It is the seductive shortcut that produces the R7 bug. Use rAF. *(Why: closure-captured interval rate cannot react to slider changes mid-run.)*

8. **Grid is `{ width, height, cells: Uint8Array }` where `cells[y*width + x]` is `0` or `1`.** Do not "ergonomically" represent the grid as `boolean[][]`, `Set<string>`, or one DOM node per cell. The flat `Uint8Array` is required for cache-friendliness, zero per-cell allocation, `transferList`-friendly Worker upgrade, and clean serialization. *(Why: NFR4/NFR5 perf budgets; architecture §4.4.)*

9. **`step(grid: Grid): Grid` is pure and allocates exactly one new `Uint8Array` per call.** No mutation of input. Off-grid neighbors are dead (no toroidal wrap in MVP). Throws `RangeError` on programmer errors (negative dims, length mismatch) — never on user input. *(Why: FR10 determinism; architecture §5.1 invariants.)*

10. **Tests land in the same PR as the code they test.** Behavioral assertions of Conway's four rules + canonical patterns (block still-life over 5 generations, blinker period-2 oscillator, glider translates by `(1,1)` every 4 generations) + edge cases (empty, single cell, all-alive 3×3, corners) + determinism (same input → same output across 100 runs). Do **not** bulk-add tests in a final PR to chase coverage — the brief flags this as a fail signal by name. *(Why: NFR3; "Things to Avoid" in README.)*

11. **`randomizeGrid` accepts an injectable RNG.** Signature: `randomizeGrid(grid, density = 0.3, rng = Math.random)`. Tests pass a seeded `mulberry32` for reproducibility. Production uses `Math.random`. *(Why: FR4, FR10; keeps the sim deterministic from the test suite's POV.)*

12. **The Next.js app NEVER calls `fetch('/patterns')` directly.** All API I/O routes through `libs/api-client`. The `scope:app` → `scope:api-client` → `scope:types` chain is the only path from app to API. *(Why: FR14/FR15 + NFR8; without `libs/api-client`, a buried `fetch` tunnels through the boundary.)*

13. **`libs/api-client` is scaffolded in MVP commits even though it is empty until stretch.** Empty barrel + tag config lands in MVP. Cost: one empty lib. Benefit: no rework when the API arrives, and the boundary is locked from day one. *(Why: architecture §6 — locks the seam early.)*

14. **NestJS is staged STRETCH.** MVP must ship and be evaluable without it. Do not block MVP work waiting on `apps/api`. *(Why: PRD scope; architecture §6 MVP-vs-stretch table.)*

15. **AI artifacts in `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` are evaluation deliverables.** Never delete them, never `.gitignore` them, never treat them as throwaway tooling. They demonstrate AI direction and are scored. *(Why: NFR9, AR4; "no traces, no signal" — README.)*

16. **README is a thinking document, not a setup guide.** Required sections: one-command local startup; architecture overview (link to `docs/planning-artifacts/architecture.md`); module boundaries with the deliberate-violation demonstration; explicit trade-offs and what was deliberately skipped (mirror architecture §8); AI usage with at least one concrete "AI helped" example AND one "I pushed back on AI" example; "what's next with another 8 hours"; honest "what I'm not happy with." *(Why: NFR9, AR5; brief explicitly distinguishes this from setup steps.)*

17. **Locked default values — do not relitigate in implementing PRs.**
    - Canvas default on first load: **30×30**.
    - MVP grid bounds: **5×5 minimum, 100×100 maximum**. (200×200 is reserved for the NFR5 stretch perf tier.)
    - Speed slider range: **1–60 gen/sec**, default **10**.
    - Randomize density: **~0.3**.
    - Canvas-resize-mid-run behavior: **pause + clear** (architecture §10 Open Question 1, story 3.1).
    - Pattern-doesn't-fit-grid behavior: **auto-resize the grid** (architecture §10 Open Question 2, story 5.2).
    *(Why: PRD §Constraints; architecture §10; story acceptance criteria.)*

18. **Do not run `nx migrate` mid-build.** Pin the Nx version after the scaffold commit. If a generator misbehaves, work around it manually rather than upgrade. *(Why: R5 in architecture §9 — version drift pollutes the git log.)*

19. **Playwright assertions tolerate timing drift.** Use `expect.poll` / `toHaveText` against `data-testid="gen-count"` reaching `>= 1`, not against an exact value or hardcoded sleep. CI runner timing varies. *(Why: R4 in architecture §9.)*

20. **Path aliases for cross-lib imports.** Always `@conways-game-of-life/{sim,ui,api-client,types}` — never relative paths like `../../../libs/sim`. *(Why: architecture §6 path-aliases section.)*

---

## 4. Project Structure & Module Boundaries

### Workspace tree (after Epic 1 stories ship)

```
apps/
  web/              # Next.js client          tag: scope:app
  web-e2e/          # Playwright happy-path   tag: scope:e2e
  api/              # NestJS REST (STRETCH)   tag: scope:server
  api-e2e/          # (STRETCH)               tag: scope:e2e
libs/
  sim/              # Pure rules engine       tag: scope:sim       — NO framework imports
  ui/               # Presentational React    tag: scope:ui        — depends only on types
  api-client/       # Typed fetch wrappers    tag: scope:api-client— scaffold MVP, populate stretch
  types/            # Shared TS types         tag: scope:types     — leaf (no deps)
```

### Allowed dependency directions (canonical matrix from architecture §5.6)

| importer ↓ \ importee → | scope:app | scope:server | scope:sim | scope:ui | scope:api-client | scope:types | scope:e2e |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **scope:app**        | — | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **scope:server**     | ✗ | — | ✓ | ✗ | ✗ | ✓ | ✗ |
| **scope:sim**        | ✗ | ✗ | — | ✗ | ✗ | ✓ | ✗ |
| **scope:ui**         | ✗ | ✗ | ✗ | — | ✗ | ✓ | ✗ |
| **scope:api-client** | ✗ | ✗ | ✗ | ✗ | — | ✓ | ✗ |
| **scope:types**      | ✗ | ✗ | ✗ | ✗ | ✗ | — | ✗ |
| **scope:e2e**        | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | — |

Forbidden cells fail `pnpm nx lint <project>` via `@nx/enforce-module-boundaries`. The `libs/sim` row is the most-policed: it can depend ONLY on `scope:types`. This is what keeps the sim pure.

---

## 5. Conventions & Patterns

- **File naming:** kebab-case for files (`use-simulation-loop.ts`, `pattern-repository.ts`). PascalCase for React components (`Canvas.tsx`, `Controls.tsx`).
- **Test colocation:** `foo.spec.ts` sits next to `foo.ts` in libs. App-level integration tests live alongside their components in `apps/web/app/**/*.spec.tsx`.
- **Story files:** when the candidate authors story files, name them `{epic}-{story}-{kebab-title}.md` under `docs/implementation-artifacts/` (sprint-planning convention).
- **Commit messages:** imperative mood, one-sentence subject, body only when "why" needs explaining. Example: `Add rAF accumulator loop with ref-fresh genPerSec read`.
- **PR titles:** lead story key + capability summary. Example: `Story 3.5: speed slider with mid-run rate change (FR8)`.
- **TypeScript invariants:**
  - `Grid` is `readonly` everywhere it appears in public APIs.
  - Pure functions return new grids; never mutate input.
  - `getCell(grid, x, y)` returns `0 | 1`; out-of-bounds returns `0`.
- **Render trigger:** Canvas redraw is a `useEffect([grid])`. The rAF loop dispatches reducer actions; React's render cycle picks up the new grid.
- **Cell-toggle hit-testing:** use `getBoundingClientRect()` so coordinates remain accurate at any CSS-scaled canvas size.
- **A11y baseline:** real `<button>` elements; `<input type="range">` with `aria-label`/`aria-valuemin`/`aria-valuemax`/`aria-valuenow`; visible focus rings via `focus-visible:ring-2 focus-visible:ring-cyan-400`; cell color contrast ≥ 4.5:1.
- **CI command shape:** `pnpm nx affected -t {lint|typecheck|test} --base=origin/main`. E2E job runs only when `apps/web` or `apps/web-e2e` is affected.

---

## 6. Gotchas — Things AI Agents Trip On Here

Blunt list of mistakes a generic AI assistant is likely to make in this codebase if not warned. Each one corresponds to a real failure mode flagged in the architecture or PRD risks.

- **Suggesting Tailwind alternatives mid-build.** Styling is settled. Do not propose CSS Modules, styled-components, or vanilla CSS swaps after E3 has shipped.
- **Adding Zustand / Redux / Jotai for "scalability."** The page-level state surface is one component. Built-in `useState`/`useReducer` is sufficient; an external store reads as poor judgment.
- **Putting sim logic inside a React hook or component for "convenience."** All Conway logic lives in `libs/sim` as pure functions. Hooks consume `step()`; they do not embed it. The boundary rules will reject the import.
- **Reaching for `setInterval` to "simplify" the run loop.** This is PRD R7 verbatim. Use rAF + accumulator.
- **Reaching for `boolean[][]` "for ergonomics."** Blows the perf budget at 100×100 and breaks the Worker upgrade path. Use `Uint8Array`.
- **Generating tests at the end of the build to hit a coverage %.** README explicitly flags this as a fail signal. Tests land with their feature.
- **Pushing directly to `main`.** Branch protection rejects it; not the right behavior anyway.
- **Removing `.claude/` / `.cursor/` / `.opencode/` / `_bmad/` because they're "tooling clutter."** They are evaluation deliverables.
- **Treating NestJS as MVP scope.** It is stretch. MVP must ship without it.
- **Adding DELETE/PUT endpoints to the patterns API "for completeness."** Out of scope per PRD. Three endpoints only: `GET /patterns`, `GET /patterns/:id`, `POST /patterns`.
- **Adding toroidal wrap-around to `step()` "since it's standard."** PRD explicitly excludes wrap from MVP. Off-grid is dead.
- **Mixing the scaffolding generator output with authored fixes in one commit.** First commit is raw and untouched. Any "small fix" lives in commit 2 on a feature branch.
- **Running `nx migrate` mid-build to "stay current."** Forbidden post-scaffold. Pin Nx versions.
- **Asserting exact generation counts in Playwright (`expect(genCount).toBe(5)`).** Frame timing varies on CI runners. Use `>= 1` polling instead.
- **Importing sim helpers via relative paths (`../../../libs/sim`).** Use the `@conways-game-of-life/sim` alias. Relative cross-lib imports bypass the convention.

---

## 7. References

Canonical sources — when in doubt, read these instead of guessing.

- **PRD:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/docs/planning-artifacts/prd.md` — FR/NFR IDs, default values, R1–R7 risks.
- **Architecture:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/docs/planning-artifacts/architecture.md` — locked tech decisions, tag taxonomy (§5.6), rAF accumulator pseudocode (§5.2), repository pattern (§5.4), upgrade paths.
- **Epics & Stories:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/docs/planning-artifacts/epics.md` — implementation sequence, MVP-vs-stretch boundary, AC granularity.
- **Sprint status:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/docs/implementation-artifacts/sprint-status.yaml` — current story state (when populated).
- **Repo guidance for AI agents:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/CLAUDE.md` — hard constraints, BMAD command surface.
- **AGENTS guidance:** `/Users/arnoe/workspace-designpickle/conways-game-of-life/AGENTS.md` — short-form stack and delivery summary.
- **Take-home brief:** `ASSIGNMENT.md` — first-commit rule, CI rule, AI-traces rule, "Things to Avoid" list. The hiring rubric lives here.
- **Conway's rules reference:** https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life — canonical four rules and named patterns.
