---
story: "1.4"
title: "CI workflow — Jest unit tests on every PR"
status: done
created: 2026-05-13
---

# Story 1.4: CI workflow — Jest unit tests on every PR

## From epics.md

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

## Implementation Notes

Added a `test` job to `.github/workflows/ci.yml` with `--parallel=3` to run Jest across all affected projects concurrently. Delivered in commit `8151c55` (`Add Jest test job to CI using nx affected with parallel=3`).

## Deviations from Architecture

None.

## AI Usage

Straightforward addition alongside the lint/typecheck jobs. No notable AI behaviour.
