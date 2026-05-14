import type { Grid, RuleSet } from '@conways-game-of-life/types';
import { createGrid, getCell } from '../grid.js';

// HighLife B36/S23: born on 3 or 6 neighbors; survives on 2 or 3.
// Differs from Conway (B3/S23) only by the added B6 birth condition.
function highLifeStep(grid: Grid): Grid {
  const next = createGrid(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const n =
        getCell(grid, x - 1, y - 1) + getCell(grid, x, y - 1) + getCell(grid, x + 1, y - 1) +
        getCell(grid, x - 1, y)                                 + getCell(grid, x + 1, y) +
        getCell(grid, x - 1, y + 1) + getCell(grid, x, y + 1) + getCell(grid, x + 1, y + 1);
      const alive = getCell(grid, x, y) === 1;
      next.cells[y * grid.width + x] = (alive ? n === 2 || n === 3 : n === 3 || n === 6) ? 1 : 0;
    }
  }
  return next;
}

export const highLifeRules: RuleSet = {
  id: 'highlife',
  name: 'HighLife',
  step: highLifeStep,
};
