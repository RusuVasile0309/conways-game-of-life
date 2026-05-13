---
story: "3.1"
title: "Page shell, canvas size form, and responsive layout"
status: done
created: 2026-05-13
---

# Story 3.1: Page shell, canvas size form, and responsive layout

## From epics.md

As Casey,
I want to land on a page with a sensible-default empty grid and a width × height form to resize it,
So that I can start interacting within seconds on either desktop or my 375px portrait phone.

**Priority:** MVP
**FR/NFR coverage:** FR1, FR11, NFR1
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the deployed page is loaded on a desktop ≥1280px viewport,
**When** the user opens it,
**Then** the canvas and all primary controls are visible together with no scrolling.

**Given** the page is loaded on a 375px portrait viewport,
**When** the page renders,
**Then** controls reflow vertically, canvas scales to fit width, no horizontal scrollbar.

**Given** the canvas size form,
**When** the user enters a valid width and height within [5, 100],
**Then** the grid renders at the new dimensions and the generation counter resets to 0.

**Given** the canvas size form,
**When** the user enters a value outside [5, 100],
**Then** the input is rejected with a visible message and the previous size is retained.

**Given** the simulation is running,
**When** the user submits a new canvas size,
**Then** the simulation pauses and the grid resets (pause + clear per architecture §10 Open Question 1).

## Implementation Notes

Tailwind CSS was added via `@nx/next:setup-tailwind` generator (`f779209`) before any authored component code, keeping generator output separate from authored changes.

The main page shell (`GameCanvas.tsx`, `SizeForm.tsx`) was built in `9a6d8ac`. The canvas uses a zoom/pan viewport metaphor — the canvas element is fixed-size and a CSS transform scales it to fit the container — which was not explicitly specified in the story AC but was judged to be the cleanest approach for keeping pixel coordinates stable under CSS scaling.

**Submit button removed:** An initial version included an explicit "Resize" submit button. After review this was removed in `9145d72` in favor of resizing immediately on valid `onChange` input, which felt more responsive and removed an unnecessary interaction step. The AC describes a "canvas size form" without prescribing a submit button, so this was within scope.

Several visual polish commits followed: mobile canvas height reduced to 54vh (`8c32159`), light-grey background (`90f6a28`), and 1px grid lines that remain consistent regardless of browser zoom level (`389f38f`).

## Deviations from Architecture

The page uses a CSS zoom/pan approach to scale the canvas to its container rather than resizing the canvas element's pixel dimensions. This keeps hit-testing trivial (`getBoundingClientRect()` already accounts for the transform) and is consistent with the architecture §5.3 recommendation. No deviation from the underlying data model or render strategy.

## AI Usage

AI generated the initial `GameCanvas.tsx` and `SizeForm.tsx` components. The submit-button removal was a deliberate human decision after reviewing the generated UX. Grid-line consistency fix (`389f38f`) was AI-generated after reproducing the zoom-level regression.
