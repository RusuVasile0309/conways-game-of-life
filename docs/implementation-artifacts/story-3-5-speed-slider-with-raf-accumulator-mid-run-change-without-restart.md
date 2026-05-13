---
story: "3.5"
title: "Speed slider with rAF + accumulator (mid-run change without restart)"
status: done
created: 2026-05-13
---

# Story 3.5: Speed slider with rAF + accumulator (mid-run change without restart)

## From epics.md

As Casey,
I want to drag the generations-per-second slider while the simulation is running and have the new rate take effect on the next tick,
So that I never have to pause and resume just to change speed.

**Priority:** MVP
**FR/NFR coverage:** FR8, NFR4 (defeat of PRD R7)
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation loop is implemented as a `useSimulationLoop` hook driven by `requestAnimationFrame` plus a time accumulator per architecture §5.2,
**When** `genPerSec` changes,
**Then** the change is read fresh each frame via a `useRef`, so the rAF loop is not torn down and rebuilt.

**Given** the slider is rendered with bounds 1–60 gen/sec, default 10,
**When** the user drags from one rate to another while the simulation is running,
**Then** the next advanced generation occurs at the new rate without any visible pause, restart, or counter discontinuity.

**Given** the slider is keyboard-focused,
**When** the user presses Arrow Left or Arrow Right,
**Then** the rate changes by one gen/sec per keypress.

## Implementation Notes

The `setInterval`-based loop from story 3.3 was replaced with a `useSimulationLoop` custom hook using `requestAnimationFrame` and a time accumulator. `genPerSec` is stored in a `useRef` and updated synchronously on every render, so the rAF callback reads the fresh value each frame without the loop being torn down.

An integration test in `useSimulationLoop.spec.ts` verifies that changing the slider mid-run does not cause a `useEffect` re-run (no loop restart). The test uses a render-counter ref approach.

Two SVG icons (`Rabbit.tsx`, `Turtle.tsx`) were added as visual indicators at the slider extremes to communicate the speed range without relying on color alone.

Delivered in commit `ad7f5ff` (`feat(story3.5): speed slider with rAF accumulator and mid-run rate change`).

## Deviations from Architecture

None. The rAF + accumulator + `useRef` pattern matches architecture §5.2 exactly. The `setInterval` interim (story 3.3) was intentionally temporary and is fully replaced here.

## AI Usage

AI implemented `useSimulationLoop` following the architecture §5.2 pseudocode. The ref-based fresh read was applied correctly without needing correction. AI also suggested the rabbit/turtle visual metaphor for the slider endpoints, which was accepted.
