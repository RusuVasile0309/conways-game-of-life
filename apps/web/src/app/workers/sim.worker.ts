/// <reference lib="webworker" />

import { conwayRules, highLifeRules } from '@conways-game-of-life/sim';
import type { Grid, RuleSet } from '@conways-game-of-life/types';

const ruleSets: Record<string, RuleSet> = {
  [conwayRules.id]: conwayRules,
  [highLifeRules.id]: highLifeRules,
};

self.onmessage = ({
  data,
}: MessageEvent<{
  type: 'tick';
  cells: ArrayBuffer;
  width: number;
  height: number;
  ruleSetId: string;
}>) => {
  if (data.type !== 'tick') return;
  const grid: Grid = {
    width: data.width,
    height: data.height,
    cells: new Uint8Array(data.cells),
  };
  const ruleSet = ruleSets[data.ruleSetId] ?? conwayRules;
  const next = ruleSet.step(grid);
  self.postMessage(
    {
      type: 'grid',
      cells: next.cells.buffer,
      width: next.width,
      height: next.height,
    },
    [next.cells.buffer],
  );
};
