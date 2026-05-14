---
stepsCompleted: []
story: 4-4-readme-as-thinking-document
status: review
branch: feat/4-4-readme-as-thinking-document
---

# Story 4.4: README as thinking document

## Story

As the panel,
I want a README that explains why the architecture looks like it does, what was traded off, how AI was used, what would come next, and what the candidate isn't proud of,
So that I get the "thinking document" the brief requires.

**Priority:** MVP
**FR/NFR coverage:** NFR9, AR4, AR5
**Estimated effort:** M

## Acceptance Criteria

**AC1 — Full sections present:**
Given the repository root README,
When read top-to-bottom,
Then it contains sections for:
- one-command local startup
- architecture overview (with a link to `docs/planning-artifacts/architecture.md`)
- module boundaries (with the deliberate-violation demonstration captured in story 1.2)
- explicit trade-offs and what was deliberately skipped (mirroring architecture §8)
- AI usage with at least one concrete "AI helped" example and at least one "I pushed back on AI" example (NFR9)
- "what's next with another 8 hours"
- an honest "what I'm not happy with"

**AC2 — AI artifact directories confirmed:**
Given the AI artifact directories,
When the README is reviewed,
Then it confirms `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` are committed, references their location, and is not gitignored (AR4).

**AC3 — Git history cross-referenced, not duplicated:**
Given `git log --oneline`,
When the README is reviewed,
Then the README does not duplicate the git history but cross-references the most consequential PRs/commits (e.g., the boundary-violation demo, the rAF accumulator implementation).

## Tasks

- [x] Replace `README.md` content with the thinking document (current content is the assignment brief)
- [x] Write `START_HERE.md` — one-command setup guide (quick reference for the interviewer)
- [x] Fill remaining empty sections in `docs/implementation-artifacts/ai-usage.md` (sections 3, "Where AI was most/least valuable", "If you started over")
- [x] Update `docs/implementation-artifacts/sprint-status.yaml` — set `4-4-readme-as-thinking-document: done`
- [x] Present README draft to user for review **before** committing anything

## Dev Notes

### Context: what README.md currently is

`README.md` currently contains the verbatim assignment brief. It must be completely replaced with the thinking document. The panel expects the thinking document at the repo root; a copy of the brief is not needed elsewhere (it was authored before any code, so git history has it).

A separate `START_HERE.md` is a required deliverable (referenced in the brief as "Local-runnable in one command from clone, per README §1"). It serves as the quick-reference for the interviewer: clone → install → serve, one command each.

### README sections and content guidance

**1. One-command local startup**
- Clone, `pnpm install`, `pnpm nx serve web` — three commands at most
- Also mention: `pnpm nx test sim`, `pnpm nx e2e web-e2e` for test verification
- Playwright requires `pnpm exec playwright install --with-deps` on first clone

**2. Architecture overview**
- Nx monorepo: `apps/web` (Next.js 14 App Router), `apps/web-e2e` (Playwright), `libs/sim` (pure rules engine), `libs/types` (shared types), `libs/ui`, `libs/api-client` (stubs for stretch)
- Pure separation: `libs/sim` has zero React/DOM/network imports — enforced by `@nx/enforce-module-boundaries`
- Link to `docs/planning-artifacts/architecture.md`
- Canvas rendering via direct 2D context, no intermediate library

**3. Module boundaries**
- Tag taxonomy: `scope:app`, `scope:sim`, `scope:types`, `scope:ui`, `scope:api-client`, `scope:e2e`
- `scope:sim → scope:types` only (sim stays pure)
- Deliberate violation demo: `docs/implementation-artifacts/nfr8-boundary-violation-demo.md`
- PR #2 (`feat/1-2-module-boundaries`) is where boundaries were wired

**4. Trade-offs and deliberate skips**
- No NestJS backend (stretch tier, epics 7–8); in-memory pattern store if added
- No Web Worker / OffscreenCanvas for rendering (stretch tier, epic 6); 50×50 at 30fps comfortably within budget
- No pattern library UI (stretch tier, epic 5)
- Grid size is fixed at runtime (configured once via form on start, not resizable mid-run)
- No SQLite / Prisma — deliberate; the architecture documents the path

**5. AI usage** — see user-provided content below

**6. What's next with another 8 hours**
- Pattern library (epic 5): glider, blinker, Gosper gun as typed data in `libs/sim` + selector UI
- Web Worker (epic 6): move `step()` off main thread; OffscreenCanvas for zero-jank render
- NestJS API (epic 7): save/load named starting grids, typed `api-client`, SQLite via Prisma
- Pluggable rule engine (epic 8): `RuleSet` interface, HighLife preset

**7. What I'm not happy with**
- Grid-size form is shown on load but can only be set once; there's no mid-run resize
- No dark-mode consideration; `prefers-color-scheme` wiring would take 30 min but wasn't scoped
- Speed slider UX: a numeric label showing actual gen/sec would be clearer than a bare slider
- `ai-usage.md` started as a separate artifact but overlaps with this README — ideally one source of truth

### User-provided AI usage content (verbatim, lightly edited)

The user described their experience with AI-assisted development as follows (preserve this voice):

> AI was about 80% accurate. Frontend knowledge was necessary to catch bugs — AI would generate code that looked right but had subtle issues in how React state interacted with the canvas, or how CSS cascade worked across breakpoints.
>
> The biggest AI input was in Epic 3. I had to explain how the UI should look and how it should work — grid rendering, button layout, the play/pause state machine. AI could scaffold the structure but the product decisions were mine.
>
> In terms of AI adherence to docs: around 50–60%. For the first three epics there were no BMAD story files by default, so AI was working from looser context. Starting from Epic 4, constant reminders and the create-story workflow dramatically improved adherence.
>
> This work style was cool and interesting. I'll test it more in the following epics.
>
> On architecture: the overall structure was already imposed by the brief (Nx monorepo, libs/sim, Next.js app). My contribution was separating the UI into functional components where each one has a single purpose, and deciding what state lives where.

### Key PR cross-references

| PR | What it shows |
|----|---------------|
| PR #1 | First commit = raw Nx generator output, untouched |
| PR #2 | Module boundary tag taxonomy wired; deliberate violation demo |
| PR #6 | Epic 2 pure sim core: Conway rules + randomize with injectable RNG |
| PR #7 | Epic 3 web app: canvas render, rAF accumulator, speed slider, all controls |
| PR #10 | Story 4.1: happy-path Playwright E2E |
| PR #11 | Story 4.2: keyboard a11y audit + WCAG fixes |
| PR #12 | Story 4.3: responsive Playwright at 375×667; canvas height media query fix |

### ai-usage.md remaining sections to fill

Sections 1 and 2 already filled (baseUrl bug, dependency cascade misdiagnosis). Need to fill:

**Section 3 — "Three times AI was wrong":**
Candidate for item 3: CSS cascade issue in story 4.3 — AI added `@media (max-height: 667px)` without the `and (max-width: 1023px)` scope guard, which would have overridden the desktop `height: 70vh` on short-height desktop viewports (e.g., DevTools open at 1280×640).

**Where AI was most valuable:**
Epic 2 sim core — pure functions with no framework entanglement. AI generated the four Conway rules accurately, and the test scaffolding was solid. No surprises here; deterministic domain → predictable AI output.

**Where AI was least valuable:**
Epic 3 canvas + state wiring. The interaction between React state, `useRef` for the canvas context, and the `rAF` accumulator loop required careful explanation and multiple correction cycles. AI's default instinct was to put too much logic inside `useEffect` and not enough in stable refs.

**If I started over:**
Start with BMAD story files from Epic 1. The story template forces AC specificity upfront, which significantly improved AI adherence in Epic 4. The quality gap between "AI working from an epic description" vs. "AI working from a story file with explicit ACs" was large and visible.

## Debug Log

_Empty — fill as needed during implementation._

## File List

- `README.md` — **replaced** (was assignment brief)
- `START_HERE.md` — **created** (one-command setup guide)
- `docs/implementation-artifacts/ai-usage.md` — **updated** (sections 3, most/least valuable, if started over)
- `docs/implementation-artifacts/sprint-status.yaml` — **updated** (`4-4: done`)
- `docs/implementation-artifacts/story-4-4-readme-as-thinking-document.md` — this file
