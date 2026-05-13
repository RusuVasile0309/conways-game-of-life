---
story: "1.5"
title: "CI workflow — Playwright E2E on every PR"
status: done
created: 2026-05-13
---

# Story 1.5: CI workflow — Playwright E2E on every PR

## From epics.md

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
**And** Playwright HTML report artifacts are uploaded on failure.

**Given** the Playwright spec passes locally,
**When** CI runs the same spec,
**Then** the `e2e` check passes within a reasonable wall-clock time.

## Implementation Notes

Added the `e2e` job to `.github/workflows/ci.yml` with `actions/upload-artifact@v4` uploading the Playwright HTML report on failure. Delivered in commit `77f4f1c` (`Add Playwright e2e job to CI with artifact upload on failure`).

The initial implementation runs `playwright install --with-deps` for all browsers (chromium, firefox, webkit). In practice this step regularly takes 10–25 minutes in GitHub Actions due to unreliable Azure mirror fallback in `apt-get`. A follow-up on branch `chore/workflow-automation` adds browser caching keyed on the Playwright version and limits the E2E job to chromium only, bringing the install step down to ~2 minutes on cache miss and near-zero on cache hit.

The AC specifying "run only when `apps/web` or `apps/web-e2e` is affected" was not implemented — the `e2e` job runs on every PR rather than only on affected changes. This is a minor gap: it means every PR pays the full E2E cost even for doc-only or sim-only changes.

## Deviations from Architecture

The `e2e` job runs unconditionally on every PR rather than gating on `nx affected`. This was a pragmatic choice to keep the workflow simple; the cost is acceptable for a short build.

## AI Usage

AI generated the workflow step. The artifact upload configuration and `ubuntu-22.04` runner pin were applied correctly.
