import type { Grid } from '@conways-game-of-life/types';

export function createGrid(width: number, height: number): Grid {
  return { width, height, cells: new Uint8Array(width * height) };
}

export function cloneGrid(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: grid.cells.slice() };
}

export function getCell(grid: Grid, x: number, y: number): number {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return 0;
  return grid.cells[y * grid.width + x];
}

export function setCell(grid: Grid, x: number, y: number, value: 0 | 1): Grid {
  const next = cloneGrid(grid);
  next.cells[y * next.width + x] = value;
  return next;
}

export function toggleCell(grid: Grid, x: number, y: number): Grid {
  return setCell(grid, x, y, getCell(grid, x, y) === 0 ? 1 : 0);
}

export function clearGrid(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: new Uint8Array(grid.width * grid.height) };
}
