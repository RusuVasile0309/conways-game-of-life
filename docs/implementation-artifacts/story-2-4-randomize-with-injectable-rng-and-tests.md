---
story: "2.4"
title: "Randomize with injectable RNG and tests"
status: done
created: 2026-05-13
---

# Story 2.4: Randomize with injectable RNG and tests

## From epics.md

As a developer of the simulation core,
I want `randomizeGrid(grid, density?, rng?)` that accepts a seedable RNG,
So that production uses `Math.random` while tests use a deterministic seed for reproducibility.

**Priority:** MVP
**FR/NFR coverage:** FR4, FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the function signature `randomizeGrid(grid, density = 0.3, rng = Math.random): Grid`,
**When** called without arguments beyond `grid`,
**Then** each cell is independently alive with probability ~0.3 (verified statistically in tests with a fixed seed).

**Given** a deterministic seeded RNG (e.g., `mulberry32`),
**When** `randomizeGrid` is called twice with the same seed and same dimensions,
**Then** the two output grids are byte-identical.

**Given** `density = 0` or `density = 1`,
**When** `randomizeGrid` is called,
**Then** the grid is all-dead or all-alive respectively.

## Implementation Notes

`randomizeGrid` implemented in `libs/sim` with the signature `randomizeGrid(grid, density = 0.3, rng = Math.random): Grid`. A `mulberry32` seeded PRNG was shipped alongside it for use in tests. The density boundary cases (`0` → all dead, `1` → all alive) and the reproducibility invariant are directly asserted in the co-located spec.

Delivered in commit `c73f28d` (`feat(story2.4): add randomizeGrid with injectable RNG and mulberry32 seeder`).

## Deviations from Architecture

None. The injectable-RNG signature matches the locked default from project-context.md §3 rule 11 exactly.

## AI Usage

AI generated `randomizeGrid`, the `mulberry32` implementation, and the test suite in one pass. No issues required pushback.
