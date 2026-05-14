# AGENTS.md

## Project status

This repo is a **take-home assessment** (Conway's Game of Life). As of initial setup, no application code exists yet — only the brief (`ASSIGNMENT.md`) and BMAD scaffolding (`_bmad/`).

## Required stack (no substitutions)

- **Next.js (TypeScript)** — frontend app
- **Nx monorepo** — at least one shared library, enforced module boundaries
- **Jest** — unit and integration tests
- **Playwright** — at least one E2E test
- **NestJS (TypeScript)** — only if adding a backend (optional)

## Key delivery constraints

- All work via **pull requests into `main`**; no direct pushes.
- **First commit must be unmodified Nx generator output** — run generators, commit as-is, then start authoring.
- GitHub Actions CI required on every PR: lint → typecheck → unit tests → Playwright.
- PRs with all checks green must be **auto-approved** (configure in workflow).
- **AI artifacts must be committed** (rules, agents, prompts, configs) — evaluators will look for them.

## BMAD framework

BMAD v6.0.2 is installed in `_bmad/`. It is configured for claude-code, cursor, and opencode (`_bmad/_config/manifest.yaml`). Use BMAD agents/tasks for planning workflows. Planning and implementation artifacts go in `docs/planning-artifacts/` and `docs/implementation-artifacts/`.

## Simulation logic

The Game of Life rules are pure functions — they must have dedicated unit tests. Correctness is a hard requirement, not a stretch goal.

## Module boundary enforcement

Nx module boundaries must be **enforced in CI** (i.e., a cross-boundary import must fail the lint check, not just be warned).

## README expectation

The final README is a **thinking document** (architecture, trade-offs, AI usage with concrete examples), not a setup guide. Do not conflate it with `AGENTS.md`.
