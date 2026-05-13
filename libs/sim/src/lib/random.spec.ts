import { createGrid } from './grid.js';
import { mulberry32, randomizeGrid } from './random.js';

describe('randomizeGrid — density boundaries', () => {
  it('density=0 produces an all-dead grid', () => {
    const g = randomizeGrid(createGrid(10, 10), 0, mulberry32(1));
    expect(g.cells.every((c) => c === 0)).toBe(true);
  });

  it('density=1 produces an all-alive grid', () => {
    const g = randomizeGrid(createGrid(10, 10), 1, mulberry32(1));
    expect(g.cells.every((c) => c === 1)).toBe(true);
  });
});

describe('randomizeGrid — determinism with seeded RNG', () => {
  it('produces byte-identical grids for the same seed', () => {
    const base = createGrid(20, 20);
    const a = randomizeGrid(base, 0.3, mulberry32(42));
    const b = randomizeGrid(base, 0.3, mulberry32(42));
    expect(a.cells).toEqual(b.cells);
  });

  it('produces different grids for different seeds', () => {
    const base = createGrid(20, 20);
    const a = randomizeGrid(base, 0.3, mulberry32(1));
    const b = randomizeGrid(base, 0.3, mulberry32(2));
    expect(a.cells).not.toEqual(b.cells);
  });
});

describe('randomizeGrid — approximate density', () => {
  it('live cell ratio is within 10% of requested density for a fixed seed', () => {
    const g = randomizeGrid(createGrid(100, 100), 0.3, mulberry32(99));
    const live = g.cells.reduce((sum, c) => sum + c, 0);
    const ratio = live / g.cells.length;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.4);
  });
});

describe('randomizeGrid — immutability', () => {
  it('does not mutate the input grid', () => {
    const original = createGrid(5, 5);
    randomizeGrid(original, 0.5, mulberry32(7));
    expect(original.cells.every((c) => c === 0)).toBe(true);
  });
});
