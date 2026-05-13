---
story: "2.1"
title: "Grid types and primitives with tests"
status: done
created: 2026-05-13
---

# Story 2.1: Grid types and primitives with tests

## From epics.md

As a developer of the simulation core,
I want a `Grid` type backed by a flat `Uint8Array` plus pure helpers (`createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`),
So that the rules engine has a stable, allocation-controlled, framework-free data model to operate on.

**Priority:** MVP
**FR/NFR coverage:** FR10, NFR3
**Estimated effort:** S

**Acceptance Criteria:**

**Given** the `Grid` interface is defined as `{ width: number; height: number; cells: Uint8Array }` in `libs/types` and re-exported from `libs/sim`,
**When** any helper is called,
**Then** it returns a new `Grid` rather than mutating the input.
**And** `getCell(g, x, y)` returns `0` for any out-of-bounds `(x, y)`.

**Given** Jest specs co-located with the source,
**When** `pnpm nx test sim` runs,
**Then** specs assert: `createGrid(w, h)` produces `cells.length === w*h` all-zero; `setCell` flips exactly the indexed cell; `toggleCell` is its own inverse; `clearGrid` zeroes every cell; `cloneGrid` returns a deep-equal but reference-distinct grid.

**Given** the boundary rule from story 1.2 is active,
**When** any source file imports React, `next/*`, `@nestjs/*`, or `fetch`,
**Then** lint fails.

## Implementation Notes

The `Grid` interface was defined in `libs/types/src/index.ts` and re-exported from `libs/sim`. All six helpers (`createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`) were implemented as pure functions with co-located Jest specs. Off-grid cell reads return `0` (no wrap). The flat `Uint8Array` layout is `cells[y * width + x]`.

Delivered in commit `370688a` (`Add Grid type and pure grid primitives with tests (story 2.1)`).

Note: this commit predates the `type(storyX.X): description` format convention adopted from story 2.2 onwards.

## Deviations from Architecture

None.

## AI Usage

AI generated the initial helper implementations and Jest specs. The `Uint8Array`-backed flat grid and `y * width + x` indexing were implemented as specified in architecture §4.4 without deviation.
