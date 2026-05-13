---
story: "2.3"
title: "Edge-case and boundary tests for step()"
status: done
created: 2026-05-13
---

# Story 2.3: Edge-case and boundary tests for `step()`

## From epics.md

As a developer of the simulation core,
I want explicit Jest coverage of edge cases the four rules don't visibly exercise,
So that the test suite constrains real behavior, not just the happy path.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** an empty grid (all cells dead),
**When** `step()` is applied,
**Then** the result is still empty (no spontaneous life).

**Given** a 3×3 grid with all cells alive,
**When** `step()` is applied,
**Then** the four corner cells die (verify against a hand-computed reference).

**Given** a live cell at corner `(0, 0)` with no other live cells,
**When** `step()` is applied,
**Then** the cell dies (off-grid neighbors are dead, so neighbor count is 0).

**Given** a 1×1 grid with a single live cell,
**When** `step()` is applied,
**Then** the cell dies (rule 1, no neighbors).

## Implementation Notes

Tests added in `libs/sim/src/lib/rules/conway-edge.spec.ts`. Three of the four ACs were confirmed as-specified.

**AC discrepancy — 3×3 all-alive:** The story AC states "the four corner cells die." By Conway's rules (rule 3: dies with *more than* 3 neighbors), each corner cell has exactly 3 neighbors and therefore **survives**. The edge cells (5 neighbors) and the centre (8 neighbors) die. The test was written to match the correct rule, not the AC as written, and the comment in the test documents the discrepancy explicitly:

> "PRD rule 3: dies with *more than* 3 neighbours. Corners have exactly 3 → survive. Story 2.3 AC says corners die — this contradicts PRD §Domain Rules and Conway's canonical definition."

This is a case where the test and the implementation are correct, and the AC in epics.md contains an error. The correct output (corners survive, edges and centre die) is verified cell-by-cell.

Delivered in commits `3933001` and `872784f` (a `const` variable fix).

## Deviations from Architecture

None in implementation. The 3×3 AC deviation is documented above — the test follows the PRD domain rules, not the incorrect AC.

## AI Usage

AI generated the edge-case test suite. The 3×3 all-alive discrepancy was caught during review of the generated tests: AI included the correct assertion (corners survive) with a comment calling out the AC error, rather than silently following the wrong AC.
