'use client';

import { useState } from 'react';
import { createGrid, toggleCell } from '@conways-game-of-life/sim';
import type { Grid } from '@conways-game-of-life/types';
import { GameCanvas } from './components/GameCanvas';
import { SizeForm } from './components/SizeForm';
import './game.css';

const DEFAULT_WIDTH = 40;
const DEFAULT_HEIGHT = 30;

export default function Page() {
  const [grid, setGrid] = useState<Grid>(() =>
    createGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  );
  const [generation, setGeneration] = useState(0);
  const [isRunning, _setIsRunning] = useState(false);

  function handleResize(width: number, height: number) {
    setGrid(createGrid(width, height));
    setGeneration(0);
  }

  function handleCellToggle(col: number, row: number) {
    setGrid((g) => toggleCell(g, col, row));
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <h1 className="game-title mt-6 mb-4 text-xl font-semibold tracking-tight text-cyan-400 shrink-0">
        Conway&apos;s Game of Life
      </h1>

      <div className="game-content flex-1 flex flex-col lg:flex-row items-start gap-6 overflow-hidden pb-6">
        <div className="game-canvas-wrap border-2 border-cyan-400 rounded-md overflow-hidden shrink-0">
          <GameCanvas grid={grid} isRunning={isRunning} onCellToggle={handleCellToggle} />
        </div>

        <aside className="flex flex-col gap-6 w-full lg:flex-1">
          <p className="text-sm text-neutral-400">
            Generation:{' '}
            <span className="text-cyan-400 font-mono">{generation}</span>
          </p>
          <SizeForm
            currentWidth={grid.width}
            currentHeight={grid.height}
            onResize={handleResize}
          />
        </aside>
      </div>
    </main>
  );
}
