---
story: "3.4"
title: "Clear and Randomize controls"
status: done
created: 2026-05-13
---

# Story 3.4: Clear and Randomize controls

## From epics.md

As Casey,
I want one-click Clear and Randomize buttons,
So that I can reset to empty or jump to an interesting random starting state without painting cell-by-cell.

**Priority:** MVP
**FR/NFR coverage:** FR3, FR4
**Estimated effort:** S

**Acceptance Criteria:**

**Given** any grid state and either running or paused,
**When** the user activates Clear,
**Then** every cell is dead, the gen counter resets to 0, and if the simulation was running it is now paused.

**Given** any grid state and either running or paused,
**When** the user activates Randomize,
**Then** `randomizeGrid` from `libs/sim` is called with the default density (0.3), the gen counter resets to 0, and if the simulation was running it is now paused.

**Given** the controls are rendered,
**When** at any supported viewport,
**Then** both buttons are reachable and operable via mouse, touch, or keyboard.

## Implementation Notes

Both buttons dispatch reducer actions that reset the grid and counter and set `running: false`. Randomize calls `randomizeGrid` from `libs/sim` with `Math.random` as the RNG.

An additional guard was added beyond the story AC: Play and Step were disabled when the grid has no alive cells, preventing users from "playing" a blank grid. This guard was later revisited in story 4.2 (accessibility) because it prevented Tab from reaching those buttons on a fresh page load. See `story-4-2-keyboard-reachability-and-accessible-name-audit.md` for the resolution.

Delivered in commit `defb545` (`feat(story3.4): add Clear and Randomize controls with auto-pause on empty grid`).

## Deviations from Architecture

None. Both buttons correctly route through `randomizeGrid` from `libs/sim` rather than reimplementing randomization logic in the app.

## AI Usage

AI generated the Clear and Randomize handlers. The empty-grid disable guard was AI-suggested as a UX improvement; it created the accessibility issue resolved in story 4.2.
