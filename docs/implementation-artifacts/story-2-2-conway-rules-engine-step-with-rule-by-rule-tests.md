---
story: "2.2"
title: "Conway rules engine step() with rule-by-rule tests"
status: done
created: 2026-05-13
---

# Story 2.2: Conway rules engine `step()` with rule-by-rule tests

## From epics.md

As a developer of the simulation core,
I want a pure `step(grid: Grid): Grid` that applies Conway's four rules with off-grid neighbors treated as dead,
So that FR10 has a single canonical implementation that both the web app and the API can reuse.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** M

**Acceptance Criteria:**

**Given** a 3×3 grid with a single live cell,
**When** `step()` is applied,
**Then** the resulting grid has zero live cells (rule 1: underpopulation).

**Given** a 3×3 grid with a 2×2 block of live cells,
**When** `step()` is applied repeatedly across five generations,
**Then** the grid is unchanged each generation (canonical still life).

**Given** a 5×5 grid with a horizontal blinker,
**When** `step()` is applied,
**Then** the next generation has a vertical blinker, returning to horizontal one step later (period-2 oscillator).

**Given** a live cell with 4+ live neighbors,
**When** `step()` is applied,
**Then** that cell is dead in the next generation (rule 3: overpopulation).

**Given** a canonical glider on a sufficiently large grid,
**When** `step()` is applied four times,
**Then** live-cell positions translate by `(1, 1)` relative to start.

**Given** the same input grid,
**When** `step()` is called 100 times in a loop on independent copies,
**Then** all 100 outputs are byte-identical (determinism).

## Implementation Notes

`step()` implemented in `libs/sim/src/lib/rules/conway.ts` as a pure function allocating exactly one new `Uint8Array` per call. Off-grid neighbors are treated as dead (no toroidal wrap). All four canonical Conway rules are directly asserted in `conway.spec.ts` co-located with the source.

A TypeScript project reference from `sim` to `types` was missing from the initial implementation, causing `tsc` to fail when resolving the `Grid` import. Fixed in a follow-up commit `98dc1dc` (`chore(story2.2): sync TypeScript project references for sim→types`).

## Deviations from Architecture

None. The function signature `step(grid: Grid): Grid`, single-new-Uint8Array allocation, and off-grid-is-dead invariant all match architecture §5.1.

## AI Usage

AI implemented `step()` and the full test suite in one pass. The missing TypeScript project reference (`98dc1dc`) was an AI omission caught by `tsc` in CI.
