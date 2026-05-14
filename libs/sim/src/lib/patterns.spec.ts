import { createGrid } from './grid.js';
import { step } from './rules/conway.js';
import {
  block,
  blinker,
  glider,
  gosperGliderGun,
  placePattern,
  type NamedPattern,
} from './patterns.js';

function liveCells(grid: ReturnType<typeof createGrid>): string[] {
  const result: string[] = [];
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.cells[y * grid.width + x] === 1) result.push(`${x},${y}`);
  return result.sort();
}

describe('NamedPattern exports', () => {
  it('block has correct shape and live-cell count', () => {
    expect(block.id).toBe('block');
    expect(block.width).toBe(2);
    expect(block.height).toBe(2);
    expect(block.liveCells).toHaveLength(4);
  });

  it('blinker has correct shape and live-cell count', () => {
    expect(blinker.id).toBe('blinker');
    expect(blinker.width).toBe(3);
    expect(blinker.height).toBe(1);
    expect(blinker.liveCells).toHaveLength(3);
  });

  it('glider has correct shape and live-cell count', () => {
    expect(glider.id).toBe('glider');
    expect(glider.width).toBe(3);
    expect(glider.height).toBe(3);
    expect(glider.liveCells).toHaveLength(5);
  });

  it('gosperGliderGun has correct shape and live-cell count', () => {
    expect(gosperGliderGun.id).toBe('gosper-glider-gun');
    expect(gosperGliderGun.width).toBe(36);
    expect(gosperGliderGun.height).toBe(9);
    expect(gosperGliderGun.liveCells).toHaveLength(36);
  });

  it('all patterns have required fields', () => {
    const patterns: NamedPattern[] = [block, blinker, glider, gosperGliderGun];
    for (const p of patterns) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.width).toBe('number');
      expect(typeof p.height).toBe('number');
      expect(Array.isArray(p.liveCells)).toBe(true);
    }
  });
});

describe('placePattern', () => {
  it('returns a reference-distinct grid (no input mutation)', () => {
    const grid = createGrid(5, 5);
    const result = placePattern(grid, blinker, 1, 2);
    expect(result).not.toBe(grid);
    expect(result.cells).not.toBe(grid.cells);
    // input is unchanged
    expect(liveCells(grid)).toHaveLength(0);
  });

  it('places blinker cells at anchor offset', () => {
    const grid = createGrid(5, 5);
    const result = placePattern(grid, blinker, 1, 2);
    // blinker liveCells: [0,0],[1,0],[2,0] → at anchor(1,2): (1,2),(2,2),(3,2)
    expect(liveCells(result)).toEqual(['1,2', '2,2', '3,2']);
  });

  it('clips cells that fall outside the grid boundary (AC3)', () => {
    const grid = createGrid(5, 5);
    // anchor (-1,-1): glider cell [1,0] → (0,-1) out of bounds
    //                             [2,1] → (1,0) in bounds
    //                             [0,2] → (-1,1) out of bounds
    //                             [1,2] → (0,1) in bounds
    //                             [2,2] → (1,1) in bounds
    const result = placePattern(grid, glider, -1, -1);
    const cells = liveCells(result);
    expect(cells).toContain('1,0');
    expect(cells).toContain('0,1');
    expect(cells).toContain('1,1');
    expect(cells).toHaveLength(3);
  });

  it('places block as still life — survives one step unchanged', () => {
    // Block needs 2-wide padding; place at (1,1) on 6×6
    const grid = createGrid(6, 6);
    const withBlock = placePattern(grid, block, 1, 1);
    const afterStep = step(withBlock);
    expect(liveCells(afterStep)).toEqual(liveCells(withBlock));
  });
});

// AC5 — blinker oscillates with period 2
describe('blinker oscillation (AC5)', () => {
  it('returns to horizontal after two steps', () => {
    const grid = createGrid(5, 5);
    // anchor (1,2): horizontal live cells at (1,2),(2,2),(3,2)
    const initial = placePattern(grid, blinker, 1, 2);
    const initialCells = liveCells(initial);

    const step1 = step(initial);
    // After one step → vertical: (2,1),(2,2),(2,3)
    expect(liveCells(step1)).toEqual(['2,1', '2,2', '2,3']);

    const step2 = step(step1);
    // After two steps → back to horizontal
    expect(liveCells(step2)).toEqual(initialCells);
  });
});

// AC4 — glider translates (1,1) in 4 steps
describe('glider translation (AC4)', () => {
  it('translates (+1,+1) after four steps on a 10×10 grid', () => {
    const grid = createGrid(10, 10);
    // Place at anchor (1,1): initial live cells at (2,1),(3,2),(1,3),(2,3),(3,3)
    let current = placePattern(grid, glider, 1, 1);
    const initialCells = liveCells(current);

    for (let i = 0; i < 4; i++) current = step(current);

    const translated = initialCells.map((s) => {
      const [x, y] = s.split(',').map(Number);
      return `${x + 1},${y + 1}`;
    });
    expect(liveCells(current)).toEqual(translated.sort());
  });
});
