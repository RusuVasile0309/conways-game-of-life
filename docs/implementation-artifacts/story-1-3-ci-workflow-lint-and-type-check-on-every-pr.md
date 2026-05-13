---
story: "1.3"
title: "CI workflow — lint and type-check on every PR"
status: done
created: 2026-05-13
---

# Story 1.3: CI workflow — lint and type-check on every PR

## From epics.md

As the candidate,
I want a GitHub Actions workflow that runs lint and type-check on every PR into `main`,
So that style and TypeScript regressions cannot merge.

**Priority:** MVP
**FR/NFR coverage:** NFR7
**Estimated effort:** S

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` triggers on `pull_request` into `main`,
**When** a PR is opened or updated,
**Then** the `lint` job runs `pnpm install --frozen-lockfile` followed by `pnpm nx affected -t lint --base=origin/main` and reports a check status.
**And** the `typecheck` job runs `pnpm nx affected -t typecheck --base=origin/main` and reports a check status.

**Given** a PR introduces a TypeScript error or lint violation,
**When** CI runs,
**Then** the corresponding check fails and is visible in the PR's checks tab.

## Implementation Notes

Implemented as two parallel jobs (`lint` and `typecheck`) in `.github/workflows/ci.yml` using `pnpm/action-setup@v4` and `actions/setup-node@v4` with pnpm caching. Both jobs use `pnpm nx affected -t <target> --base=origin/main` to only run against changed projects. Both also require `fetch-depth: 0` and `filter: tree:0` on checkout so Nx can correctly compute the affected project graph.

Delivered in commit `bdcb773` (`Split CI into separate lint and typecheck jobs using nx affected`).

## Deviations from Architecture

None.

## AI Usage

AI generated the initial workflow YAML. The `fetch-depth: 0` + `filter: tree:0` checkout options required to make `nx affected` work correctly were included without prompting.
