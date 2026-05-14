import type { Grid } from '@conways-game-of-life/types';
import { cloneGrid } from './grid';

export interface NamedPattern {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly liveCells: ReadonlyArray<readonly [number, number]>;
}

export const block: NamedPattern = {
  id: 'block',
  name: 'Block',
  width: 2,
  height: 2,
  liveCells: [
    [0, 0], [1, 0],
    [0, 1], [1, 1],
  ],
};

export const blinker: NamedPattern = {
  id: 'blinker',
  name: 'Blinker',
  width: 3,
  height: 1,
  liveCells: [[0, 0], [1, 0], [2, 0]],
};

// Canonical glider (bottom-left corner anchor):
//   .X.
//   ..X
//   XXX
export const glider: NamedPattern = {
  id: 'glider',
  name: 'Glider',
  width: 3,
  height: 3,
  liveCells: [
    [1, 0],
    [2, 1],
    [0, 2], [1, 2], [2, 2],
  ],
};

// Gosper Glider Gun — 36×9
export const gosperGliderGun: NamedPattern = {
  id: 'gosper-glider-gun',
  name: 'Gosper Glider Gun',
  width: 36,
  height: 9,
  liveCells: [
    [24, 0],
    [22, 1], [24, 1],
    [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
    [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6],
    [11, 7], [15, 7],
    [12, 8], [13, 8],
  ],
};

export function placePattern(
  grid: Grid,
  pattern: NamedPattern,
  anchorX: number,
  anchorY: number,
): Grid {
  const next = cloneGrid(grid);
  for (const [dx, dy] of pattern.liveCells) {
    const x = anchorX + dx;
    const y = anchorY + dy;
    if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
      next.cells[y * grid.width + x] = 1;
    }
  }
  return next;
}
