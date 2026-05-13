import { createGrid, cloneGrid, getCell, setCell, toggleCell, clearGrid } from './grid.js';

describe('createGrid', () => {
  it('produces a grid with width * height zero cells', () => {
    const g = createGrid(4, 3);
    expect(g.width).toBe(4);
    expect(g.height).toBe(3);
    expect(g.cells.length).toBe(12);
    expect(g.cells.every((c) => c === 0)).toBe(true);
  });
});

describe('cloneGrid', () => {
  it('returns a deep-equal but reference-distinct grid', () => {
    const g = createGrid(3, 3);
    const clone = cloneGrid(g);
    expect(clone).toEqual(g);
    expect(clone.cells).not.toBe(g.cells);
  });
});

describe('getCell', () => {
  it('returns the correct cell value', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    expect(getCell(g, 1, 1)).toBe(1);
    expect(getCell(g, 0, 0)).toBe(0);
  });

  it('returns 0 for out-of-bounds coordinates', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, -1, 0)).toBe(0);
    expect(getCell(g, 3, 0)).toBe(0);
    expect(getCell(g, 0, -1)).toBe(0);
    expect(getCell(g, 0, 3)).toBe(0);
  });
});

describe('setCell', () => {
  it('flips exactly the indexed cell without mutating the input', () => {
    const g = createGrid(3, 3);
    const next = setCell(g, 1, 2, 1);
    expect(getCell(next, 1, 2)).toBe(1);
    expect(getCell(g, 1, 2)).toBe(0);
    const liveCount = Array.from(next.cells).filter((c) => c === 1).length;
    expect(liveCount).toBe(1);
  });
});

describe('toggleCell', () => {
  it('is its own inverse', () => {
    const g = createGrid(3, 3);
    const toggled = toggleCell(g, 1, 1);
    expect(getCell(toggled, 1, 1)).toBe(1);
    const restored = toggleCell(toggled, 1, 1);
    expect(getCell(restored, 1, 1)).toBe(0);
  });
});

describe('clearGrid', () => {
  it('zeroes every cell without mutating the input', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 2, 2, 1);
    const cleared = clearGrid(g);
    expect(cleared.cells.every((c) => c === 0)).toBe(true);
    expect(getCell(g, 0, 0)).toBe(1);
  });
});
