---
story: "4.1"
title: "Playwright happy-path E2E spec"
status: done
created: 2026-05-13
---

# Story 4.1: Playwright happy-path E2E spec

## From epics.md

As the panel,
I want a Playwright spec that drives the canonical happy path the README specifies,
So that I can verify end-to-end that the app actually works without running it manually.

**Priority:** MVP
**FR/NFR coverage:** NFR7 (E2E gate); README §3 "at least one Playwright E2E"
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the spec at `apps/web-e2e/src/e2e/happy-path.spec.ts`,
**When** the spec runs,
**Then** it navigates to `/`, sets the canvas size to 10×10, clicks three adjacent cells to form a horizontal blinker, clicks Play, and asserts that the generation counter (`data-testid="gen-count"`) reaches `>= 1` within a generous polling window.

**Given** the spec uses `expect.poll` or `toHaveText` with a generous timeout,
**When** CI runner timing varies,
**Then** the spec does not flake on exact-frame assertions.

**Given** the spec is wired into Nx,
**When** `pnpm nx e2e web-e2e` is run locally or in CI,
**Then** the spec passes.

## Implementation Notes

The spec lives at `apps/web-e2e/src/e2e/happy-path.spec.ts`. It navigates to `/`, resizes the grid to 10×10 via the size form labels, waits 300 ms for React to flush the resize, paints a horizontal blinker at cells (4,5)–(6,5) using the canvas bounding box and `SCALE_DESKTOP = 30px`, clicks the "Play simulation" button, and asserts that `data-testid="gen-count"` stops showing `'0'` within a 5 000 ms polling window (`not.toHaveText('0', { timeout: 5000 })`). No hard-coded sleep for frame counting; no exact-counter assertions.

`data-testid="gen-count"` was added to the generation counter `<span>` in `apps/web/src/app/page.tsx`.

The original implementation existed only as a dangling commit (`8310e1b`) that was never pushed or merged. This story was re-implemented cleanly on `feat/4-1-playwright-happy-path-e2e-spec` and passed locally (`2 passed, 0 failed`) before the PR was opened.

## Deviations from Architecture

None.

## AI Usage

AI recovered the spec content from the dangling commit and verified it against the current codebase (button aria-labels, scale constants, SizeForm label structure) before writing the file. The `keyboard.spec.ts` file from in-progress story 4.2 was present in the working tree and was removed from this branch to keep the 4-1 PR focused.
