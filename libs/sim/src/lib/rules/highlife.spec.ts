import { createGrid, setCell } from '../grid.js';
import { highLifeRules } from './highlife.js';
import { conwayRules } from './conway.js';

function place(w: number, h: number, coords: [number, number][]) {
  let g = createGrid(w, h);
  for (const [x, y] of coords) g = setCell(g, x, y, 1);
  return g;
}

function liveCells(grid: ReturnType<typeof createGrid>): [number, number][] {
  const result: [number, number][] = [];
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.cells[y * grid.width + x] === 1) result.push([x, y]);
  return result;
}

// Dead cell at (2,2) surrounded by exactly 6 live neighbors.
// (1,1),(2,1),(3,1),(1,2),(3,2),(1,3) are all neighbors of (2,2) — none are (2,2).
const sixNeighborGrid = place(5, 5, [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [1, 3]]);

describe('highLifeRules — B6 birth (HighLife-only)', () => {
  it('dead cell with exactly 6 live neighbors is born', () => {
    const next = highLifeRules.step(sixNeighborGrid);
    expect(next.cells[2 * 5 + 2]).toBe(1);
  });
});

describe('highLifeRules vs conwayRules — B6 divergence', () => {
  it('Conway leaves a 6-neighbor dead cell dead while HighLife births it', () => {
    expect(conwayRules.step(sixNeighborGrid).cells[2 * 5 + 2]).toBe(0);
    expect(highLifeRules.step(sixNeighborGrid).cells[2 * 5 + 2]).toBe(1);
  });
});

describe('highLifeRules — B3 birth (shared with Conway)', () => {
  it('dead cell with exactly 3 live neighbors is born', () => {
    // Centre (2,2) dead, 3 live neighbors: (1,1),(2,1),(3,1)
    const g = place(5, 5, [[1, 1], [2, 1], [3, 1]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(1);
  });
});

describe('highLifeRules — B4/B5 NOT a birth', () => {
  it('dead cell with 4 live neighbors stays dead', () => {
    const g = place(5, 5, [[1, 1], [2, 1], [3, 1], [1, 2]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });

  it('dead cell with 5 live neighbors stays dead', () => {
    const g = place(5, 5, [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });
});

describe('highLifeRules — S23 survival (shared with Conway)', () => {
  it('live cell with 2 live neighbors survives', () => {
    // (2,2) alive, 2 neighbors: (1,1),(2,1)
    const g = place(5, 5, [[2, 2], [1, 1], [2, 1]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(1);
  });

  it('live cell with 3 live neighbors survives', () => {
    // (2,2) alive, 3 neighbors: (1,1),(2,1),(3,1)
    const g = place(5, 5, [[2, 2], [1, 1], [2, 1], [3, 1]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(1);
  });
});

describe('highLifeRules — underpopulation', () => {
  it('live cell with 0 neighbors dies', () => {
    const g = place(5, 5, [[2, 2]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });

  it('live cell with 1 neighbor dies', () => {
    const g = place(5, 5, [[2, 2], [1, 1]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });
});

describe('highLifeRules — overpopulation', () => {
  it('live cell with 4 neighbors dies', () => {
    const g = place(5, 5, [[2, 2], [1, 1], [2, 1], [3, 1], [1, 2]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });

  it('live cell with 6 neighbors dies (B6 triggers birth for dead cells, NOT survival for live ones)', () => {
    // Same count that births a dead cell (B6) causes death of a live cell (overpopulation)
    const g = place(5, 5, [[2, 2], [1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [1, 3]]);
    expect(highLifeRules.step(g).cells[2 * 5 + 2]).toBe(0);
  });
});

describe('highLifeRules — empty grid', () => {
  it('produces no spontaneous life', () => {
    const g = createGrid(5, 5);
    expect(highLifeRules.step(g).cells.every((c) => c === 0)).toBe(true);
  });
});

describe('highLifeRules — determinism', () => {
  it('produces byte-identical output across 100 independent calls', () => {
    const g = place(10, 10, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]);
    const results = Array.from({ length: 100 }, () => {
      let copy = g;
      for (let i = 0; i < 10; i++) copy = highLifeRules.step(copy);
      return copy.cells.join(',');
    });
    expect(new Set(results).size).toBe(1);
  });
});

describe('highLifeRules — 2×2 block still life', () => {
  it('2×2 block survives unchanged (S23 shared with Conway)', () => {
    const g = place(6, 6, [[1, 1], [2, 1], [1, 2], [2, 2]]);
    const next = highLifeRules.step(g);
    expect(liveCells(next)).toEqual(expect.arrayContaining([[1, 1], [2, 1], [1, 2], [2, 2]]));
    expect(liveCells(next)).toHaveLength(4);
  });
});
