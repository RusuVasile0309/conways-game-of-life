# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a take-home assignment to build **Conway's Game of Life** as a web app. As of this writing the repo contains only the assignment brief (`ASSIGNMENT.md`), BMAD methodology scaffolding (`_bmad/`, `.claude/`, `.cursor/`, `.opencode/`), and empty `docs/planning-artifacts` / `docs/implementation-artifacts` directories. **No application code, no `package.json`, no Nx workspace exists yet** — those land with the first authored commit. Do not fabricate build/test commands until the workspace has actually been scaffolded; instead, read `package.json` / `nx.json` once they exist.

## Hard constraints from the assignment brief

These come from `ASSIGNMENT.md` and override default instincts. Read them before suggesting an approach.

- **Required stack, no substitutions:** Next.js (TypeScript) inside an **Nx monorepo** with at least one shared library and **enforced module boundaries**, **Jest** for unit/integration, **Playwright** for at least one E2E. NestJS only if a backend is added. Do not propose Vite, Turborepo, Vitest, Cypress, etc.
- **First commit is Nx scaffolding, untouched.** The candidate must run Nx generators and commit the raw output as the very first commit before any authored code. If you are asked to "set up the project," produce that scaffolding commit cleanly with no edits to generated files mixed in. Subsequent commits show what the human authored vs. what the tool generated.
- **All work flows through PRs into `main`.** No direct pushes. Branch protection is expected. Each commit should be small enough to describe in one sentence — git log is part of the evaluation, so keep commits focused and avoid drive-by changes.
- **CI on every PR** must run lint, type-check, unit tests, and Playwright. Failing checks block merge. PRs with all green checks should auto-approve.
- **Simulation logic must be pure functions with real unit tests.** Conway's rules are deterministic — tests should constrain behavior, not just hit coverage. Do not pad the suite at the end.
- **AI traces are a deliverable.** Custom agents, prompts, and rules used during the build must be committed to the repo. The `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/` directories are not throwaway tooling — they are evaluation artifacts. Do not delete or `.gitignore` them.
- **README is a thinking document, not a setup guide.** Architecture rationale, trade-offs, what was deliberately skipped, how AI was used (with examples), and what would come next.

Things to actively avoid (called out in the brief): coverage-padding tests added at the end, framework hopping, committing AI output without review, and scope creep over polish.

## Repository layout

```
ASSIGNMENT.md                    # Assignment brief — re-read before scope decisions
README.md                        # Thinking document — architecture, trade-offs, AI usage
docs/
  planning-artifacts/            # PRDs, architecture, stories — output of BMAD planning workflows
  implementation-artifacts/      # Implementation notes, retrospectives — output of BMAD dev workflows
_bmad/                           # BMAD Method v6.0.2 install (modules: core, bmm; _memory sidecar)
  bmm/workflows/                 # 1-analysis, 2-plan-workflows, 3-solutioning, 4-implementation, etc.
  core/workflows/                # brainstorming, party-mode, advanced-elicitation
.claude/commands/                # BMAD slash commands for Claude Code (43 commands, prefixed `bmad-`)
.cursor/commands/                # Same command set, mirrored for Cursor
.opencode/{agent,command}/       # Same command set, mirrored for opencode
```

The application source tree (Nx workspace, apps, libs) does not exist yet and will be created by Nx generators.

## BMAD workflow tooling

This repo has the **BMAD Method** installed (`_bmad/_config/manifest.yaml`, v6.0.2, modules `core` + `bmm`). It provides a structured planning-and-implementation flow exposed as slash commands. Relevant entry points when the user asks to plan, scope, or implement:

- `/bmad-brainstorming` — open-ended idea generation
- `/bmad-bmm-create-product-brief`, `/bmad-bmm-create-prd`, `/bmad-bmm-create-architecture`, `/bmad-bmm-create-epics-and-stories` — staged planning artifacts (output to `docs/planning-artifacts/`)
- `/bmad-bmm-create-story`, `/bmad-bmm-dev-story`, `/bmad-bmm-quick-dev`, `/bmad-bmm-quick-spec` — story-level work
- `/bmad-bmm-code-review`, `/bmad-bmm-qa-generate-e2e-tests`, `/bmad-bmm-retrospective` — review/QA/retro
- Persona agents: `/bmad-agent-bmm-{analyst,architect,pm,sm,dev,qa,ux-designer,tech-writer,bmad-master,quick-flow-solo-dev}`
- `/bmad-help` — full menu

When invoking a BMAD command, follow its embedded instructions exactly — they reference workflow files under `_bmad/bmm/workflows/...` and `_bmad/core/workflows/...` and are prescriptive about loading those files in full. Planning output should land in `docs/planning-artifacts/`; implementation output in `docs/implementation-artifacts/` (per `_bmad/bmm/config.yaml`).

The same command set is mirrored across `.claude/`, `.cursor/`, and `.opencode/` so the candidate can switch tools without losing the workflow — keep them in sync if any are edited.

## Working in this repo

- **Before scaffolding exists:** Treat planning, architecture, and AI-config edits as the primary work. Do not invent a `package.json` or run `nx`/`npm` commands that would fail. If the user wants to start building, the right move is to scaffold the Nx workspace as its own clean first commit (per the brief), then read the generated config to learn the real commands.
- **After scaffolding exists:** Re-read `package.json`, `nx.json`, and any `project.json` files to discover the actual `nx`/`pnpm`/`npm` targets. Do not assume target names — Nx generators vary by preset.
- **Module boundaries are evaluated.** When adding code, respect (and if needed, configure) Nx tags + `@nx/enforce-module-boundaries` so a cross-boundary import would actually fail CI. The brief calls this out explicitly under "Architectural reasoning."
- **Simulation core belongs in a shared lib**, not inside the Next.js app — the brief requires "at least one shared library," and the pure-function rules engine is the natural fit.
