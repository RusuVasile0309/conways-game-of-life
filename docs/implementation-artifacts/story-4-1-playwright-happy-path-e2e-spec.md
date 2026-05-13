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

The spec was written in `apps/web-e2e/src/e2e/happy-path.spec.ts`. It navigates to `/`, resizes the canvas to 10×10, clicks three adjacent cells to form a blinker, clicks Play, and uses `expect.poll` to wait until `data-testid="gen-count"` shows a value `>= 1`. No hard-coded sleeps or exact counter assertions.

A `data-testid="gen-count"` attribute was added to the generation counter span in `page.tsx` as part of this story (`8310e1b`).

After the initial commit, CI revealed three additional failures that required a fix commit (`1ddb221`):
1. The Nx-generated `example.spec.ts` was navigating to a path that didn't exist — it was updated to navigate to `/`.
2. `useSimulationLoop.spec.ts` needed a `jest.setup.ts` adding `@testing-library/jest-dom` matchers, which was missing from `apps/web/jest.config.cts`.
3. The spec assertions were adjusted to use the correct Playwright `expect.poll` polling window.

Delivered in commits `8310e1b` and `1ddb221`.

## Deviations from Architecture

None.

## AI Usage

AI wrote the initial happy-path spec. The three CI failures (`1ddb221`) were diagnosed by reading the raw CI log rather than guessing from warnings — an example of directing AI to the root cause rather than letting it fix symptoms.
