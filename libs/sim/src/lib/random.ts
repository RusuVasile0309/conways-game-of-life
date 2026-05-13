import type { Grid } from '@conways-game-of-life/types';
import { cloneGrid } from './grid';

export function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

export function randomizeGrid(
  grid: Grid,
  density = 0.3,
  rng: () => number = Math.random,
): Grid {
  const next = cloneGrid(grid);
  for (let i = 0; i < next.cells.length; i++) {
    next.cells[i] = rng() < density ? 1 : 0;
  }
  return next;
}
