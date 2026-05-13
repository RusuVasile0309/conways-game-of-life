import { createGrid, setCell, cloneGrid } from '../grid.js';
import { step } from './conway.js';

// Helpers
function liveCells(grid: ReturnType<typeof createGrid>): [number, number][] {
  const result: [number, number][] = [];
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.cells[y * grid.width + x] === 1) result.push([x, y]);
  return result;
}

function place(width: number, height: number, coords: [number, number][]) {
  let g = createGrid(width, height);
  for (const [x, y] of coords) g = setCell(g, x, y, 1);
  return g;
}

describe('step — rule 1: underpopulation', () => {
  it('a single live cell dies', () => {
    const g = place(3, 3, [[1, 1]]);
    expect(liveCells(step(g))).toHaveLength(0);
  });
});

describe('step — rule 2: survival', () => {
  it('2×2 block is a still life across 5 generations', () => {
    let g = place(6, 6, [[1, 1], [2, 1], [1, 2], [2, 2]]);
    for (let i = 0; i < 5; i++) g = step(g);
    expect(liveCells(g)).toEqual(expect.arrayContaining([[1, 1], [2, 1], [1, 2], [2, 2]]));
    expect(liveCells(g)).toHaveLength(4);
  });
});

describe('step — rule 4: reproduction / blinker oscillator', () => {
  it('horizontal blinker becomes vertical then returns to horizontal', () => {
    const g = place(5, 5, [[1, 2], [2, 2], [3, 2]]);
    const gen1 = step(g);
    expect(liveCells(gen1)).toEqual(expect.arrayContaining([[2, 1], [2, 2], [2, 3]]));
    expect(liveCells(gen1)).toHaveLength(3);
    const gen2 = step(gen1);
    expect(liveCells(gen2)).toEqual(expect.arrayContaining([[1, 2], [2, 2], [3, 2]]));
    expect(liveCells(gen2)).toHaveLength(3);
  });
});

describe('step — rule 3: overpopulation', () => {
  it('a live cell with 4+ live neighbors dies', () => {
    // Centre cell (2,2) has 4 live neighbors: N, S, E, W
    const g = place(5, 5, [[2, 1], [2, 2], [2, 3], [1, 2], [3, 2]]);
    const next = step(g);
    expect(next.cells[2 * 5 + 2]).toBe(0);
  });
});

describe('step — glider', () => {
  it('translates (1,1) after 4 generations', () => {
    const start: [number, number][] = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
    let g = place(10, 10, start);
    for (let i = 0; i < 4; i++) g = step(g);
    const expected = start.map(([x, y]): [number, number] => [x + 1, y + 1]);
    expect(liveCells(g)).toEqual(expect.arrayContaining(expected));
    expect(liveCells(g)).toHaveLength(5);
  });
});

describe('step — determinism', () => {
  it('produces byte-identical output across 100 independent calls', () => {
    const g = place(10, 10, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]);
    const results = Array.from({ length: 100 }, () => {
      let copy = cloneGrid(g);
      for (let i = 0; i < 10; i++) copy = step(copy);
      return copy.cells.join(',');
    });
    expect(new Set(results).size).toBe(1);
  });
});
