import { createGrid, setCell } from '../grid.js';
import { step } from './conway.js';

describe('step — empty grid', () => {
  it('produces no spontaneous life', () => {
    const g = createGrid(5, 5);
    expect(step(g).cells.every((c) => c === 0)).toBe(true);
  });
});

describe('step — 3×3 all-alive (hand-computed reference)', () => {
  it('corners survive (3 neighbours), edges and centre die (5 and 8 neighbours)', () => {
    // PRD rule 3: dies with *more than* 3 neighbours.
    // Corners have exactly 3 → survive. Story 2.3 AC says corners die — this
    // contradicts PRD §Domain Rules and Conway's canonical definition.
    const g = createGrid(3, 3);
    for (let i = 0; i < 9; i++) g.cells[i] = 1;
    const next = step(g);

    expect(next.cells[0 * 3 + 0]).toBe(1); // (0,0) corner — 3 neighbours, survives
    expect(next.cells[0 * 3 + 1]).toBe(0); // (1,0) edge   — 5 neighbours, dies
    expect(next.cells[0 * 3 + 2]).toBe(1); // (2,0) corner — 3 neighbours, survives
    expect(next.cells[1 * 3 + 0]).toBe(0); // (0,1) edge   — 5 neighbours, dies
    expect(next.cells[1 * 3 + 1]).toBe(0); // (1,1) centre — 8 neighbours, dies
    expect(next.cells[1 * 3 + 2]).toBe(0); // (2,1) edge   — 5 neighbours, dies
    expect(next.cells[2 * 3 + 0]).toBe(1); // (0,2) corner — 3 neighbours, survives
    expect(next.cells[2 * 3 + 1]).toBe(0); // (1,2) edge   — 5 neighbours, dies
    expect(next.cells[2 * 3 + 2]).toBe(1); // (2,2) corner — 3 neighbours, survives
  });
});

describe('step — corner cell with no neighbours', () => {
  it('dies because off-grid positions count as dead', () => {
    const g = setCell(createGrid(5, 5), 0, 0, 1);
    const next = step(g);
    expect(next.cells.every((c) => c === 0)).toBe(true);
  });
});

describe('step — 1×1 grid', () => {
  it('single live cell dies with no neighbours', () => {
    const g = setCell(createGrid(1, 1), 0, 0, 1);
    expect(step(g).cells[0]).toBe(0);
  });
});
