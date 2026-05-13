---
story: "3.2"
title: "Canvas render and click/tap-to-toggle cells"
status: done
created: 2026-05-13
---

# Story 3.2: Canvas render and click/tap-to-toggle cells

## From epics.md

As Casey,
I want to click (or tap) a cell on the canvas to toggle it alive/dead before pressing play,
So that I can paint a starting state I'm interested in.

**Priority:** MVP
**FR/NFR coverage:** FR2, NFR4
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation is paused and the canvas has rendered the current grid,
**When** the user clicks a dead cell,
**Then** the cell becomes alive with a visible state change within 50ms.

**Given** the simulation is paused,
**When** the user clicks an alive cell,
**Then** the cell becomes dead.

**Given** the simulation is running,
**When** the user clicks the canvas,
**Then** the toggle is a no-op.

**Given** the rendering implementation,
**When** the grid state changes,
**Then** a `useEffect([grid])` triggers a Canvas redraw using `fillRect`.

**Given** the click→grid-coordinate conversion,
**When** the canvas is CSS-scaled,
**Then** `getBoundingClientRect()` is used so coordinates remain accurate at any rendered size.

## Implementation Notes

Cell toggle implemented in `GameCanvas.tsx` using a `pointerdown` event handler (covers both mouse and touch). Hit-testing converts `clientX/clientY` to canvas-local coordinates via `getBoundingClientRect()` then divides by cell pixel size. The canvas redraw is driven by a `useEffect([grid])`. Delivered in commit `1dc86d5` (`feat(story3.2): click/tap to toggle cells when simulation is paused`).

## Deviations from Architecture

None. `getBoundingClientRect()`-based hit testing and `useEffect([grid])` redraw match architecture §5.3 exactly.

## AI Usage

AI generated the pointer event handler and hit-test coordinate conversion. No issues required pushback.
