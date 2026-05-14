import type { Grid } from '@conways-game-of-life/types';

export function gridToLiveCells(grid: Grid): [number, number][] {
  const live: [number, number][] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.cells[y * grid.width + x] === 1) live.push([x, y]);
    }
  }
  return live;
}
