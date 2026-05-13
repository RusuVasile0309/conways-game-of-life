---
story: "1.1"
title: "Initial Nx scaffolding committed untouched"
status: done
created: 2026-05-13
---

# Story 1.1: Initial Nx scaffolding committed untouched

## From epics.md

As the candidate,
I want the very first commit on this repo to be the raw output of `create-nx-workspace --preset=next`,
So that the panel can read the git log and see exactly what was scaffolded versus what I authored.

**Priority:** MVP
**FR/NFR coverage:** NFR10, AR1, AR6
**Estimated effort:** S

**Acceptance Criteria:**

- [ ] `npx create-nx-workspace@latest conways-game-of-life --preset=next --appName=web --style=css --nextAppDir=true --e2eTestRunner=playwright --packageManager=pnpm --ci=github` is run.
- [ ] The generator output is committed in a single commit titled `Initial Nx scaffolding (raw generator output)` with zero manual edits to generated files.
- [ ] No `.claude/`, `.cursor/`, `.opencode/`, `_bmad/`, `docs/`, or planning artifacts are removed by this commit.
- [ ] `pnpm install` and `pnpm nx run web:dev` succeed locally on a freshly cloned working copy.
- [ ] `git log --oneline` shows this as the first repository commit on `main`.
- [ ] Subsequent generator-only work lands in a separate follow-up commit on a feature branch behind a PR.

## Implementation Notes

The workspace was scaffolded with `npx create-nx-workspace@latest` using the `--preset=next` flag. Commit `25d9e38` (`Initial Nx scaffolding (raw generator output)`) contains only generator output — no authored edits.

A follow-up commit `4e7ba84` (`Pin CI runner to ubuntu-22.04 for Playwright 1.36 compatibility`) was added on the feature branch to pin the CI runner. The installed Playwright version (`1.36.0`) is incompatible with the latest ubuntu runner — locking to `ubuntu-22.04` was the minimal fix without upgrading Playwright and risking Nx peer dependency conflicts mid-build.

## Deviations from Architecture

None.

## AI Usage

No AI involvement in the scaffolding commit itself — the generator was run directly. The CI runner pin that followed was a manual judgment call after observing the Playwright version constraint.
