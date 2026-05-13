---
story: "1.6"
title: "Branch protection and auto-approve workflow"
status: done
created: 2026-05-13
---

# Story 1.6: Branch protection and auto-approve workflow

## From epics.md

As the candidate,
I want `main` protected with the four required checks plus the auto-approve workflow firing on green,
So that AR2 and AR3 are demonstrably configured per the brief.

**Priority:** MVP
**FR/NFR coverage:** NFR7, AR2, AR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** repository settings for `main`,
**When** I configure branch protection,
**Then** the four CI checks (`lint`, `typecheck`, `test`, `e2e`) are listed as required, at least one approving review is required, direct pushes are blocked, and the configuration is captured under `docs/implementation-artifacts/`.

**Given** `.github/workflows/auto-approve.yml` is configured,
**When** a PR's four required checks all conclude `success`,
**Then** the workflow posts an approving review from `github-actions[bot]`.
**And** the PR shows the auto-approval and is mergeable per branch-protection rules.

**Given** a PR has at least one failing check,
**When** the auto-approve workflow runs,
**Then** it does not approve the PR.

## Implementation Notes

Branch protection was configured in GitHub repository settings. The auto-approve workflow uses `hmarr/auto-approve-action@v4` and fires on `pull_request` when all required checks pass. Configuration screenshots and the required status check names are captured in `docs/implementation-artifacts/branch-protection.md`.

Delivered in commit `5f1412f` (`Add auto-approve workflow and document branch protection settings`).

## Deviations from Architecture

None.

## AI Usage

AI generated the `auto-approve.yml` workflow. The `hmarr/auto-approve-action@v4` action was the correct choice as specified in architecture §5.
