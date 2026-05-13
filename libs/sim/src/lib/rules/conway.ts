import type { Grid } from '@conways-game-of-life/types';
import { createGrid, getCell } from '../grid';

export function step(grid: Grid): Grid {
  const next = createGrid(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const neighbors =
        getCell(grid, x - 1, y - 1) + getCell(grid, x, y - 1) + getCell(grid, x + 1, y - 1) +
        getCell(grid, x - 1, y)                                 + getCell(grid, x + 1, y) +
        getCell(grid, x - 1, y + 1) + getCell(grid, x, y + 1) + getCell(grid, x + 1, y + 1);
      const alive = getCell(grid, x, y) === 1;
      next.cells[y * grid.width + x] = (alive ? neighbors === 2 || neighbors === 3 : neighbors === 3) ? 1 : 0;
    }
  }
  return next;
}
