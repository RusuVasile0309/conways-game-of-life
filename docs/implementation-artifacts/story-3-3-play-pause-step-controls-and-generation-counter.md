---
story: "3.3"
title: "Play/Pause/Step controls and generation counter"
status: done
created: 2026-05-13
---

# Story 3.3: Play/Pause/Step controls and generation counter

## From epics.md

As Casey,
I want Play, Pause, and Step buttons plus a visible generation counter,
So that I can run the simulation, freeze it, advance one step at a time, and see how far it has progressed.

**Priority:** MVP
**FR/NFR coverage:** FR5, FR6, FR7, FR9
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the simulation is paused,
**When** the user activates Play,
**Then** generations begin advancing at the configured `genPerSec`, the control becomes Pause, and the gen counter increments.

**Given** the simulation is running,
**When** the user activates Pause,
**Then** advancement stops within one tick, the grid and counter are preserved, and the control returns to Play.

**Given** the simulation is paused,
**When** the user activates Step,
**Then** the grid advances by exactly one generation and the counter increments by 1.

**Given** the simulation is running,
**When** the user activates Step,
**Then** the action is a no-op or visually disabled.

**Given** the gen counter is rendered,
**When** at any supported viewport,
**Then** the counter is visible without scrolling and updates within one frame of each generation advance.

## Implementation Notes

Play/Pause is a single toggle button that switches label and icon based on the `running` state flag. Step is a separate button disabled while running. The generation counter is tracked in a `useReducer` and rendered with `data-testid="gen-count"` for the Playwright E2E spec in story 4.1.

The rAF loop was not yet introduced in this story — it landed in story 3.5. At this stage the simulation used a temporary `setInterval`-based loop that was replaced in 3.5. This is acceptable since the stories were sequenced so that 3.5 owns the rAF accumulator.

Delivered in commit `e359bb3` (`feat(story3.3): Play/Pause/Step controls and generation counter`).

## Deviations from Architecture

`setInterval` was used as a temporary stepping mechanism in this story's implementation, with the explicit intent of replacing it in story 3.5 with the rAF + accumulator pattern. The architecture forbids `setInterval` for the final loop (project-context.md §3 rule 7) and story 3.5 completes that requirement.

## AI Usage

AI generated the controls and generation counter. The `data-testid="gen-count"` attribute was added proactively to support the upcoming Playwright spec.
