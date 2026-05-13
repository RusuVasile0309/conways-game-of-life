'use client';

import { useState, useCallback, useRef } from 'react';
import { createGrid, toggleCell, step } from '@conways-game-of-life/sim';
import type { Grid } from '@conways-game-of-life/types';
import { GameCanvas } from './components/GameCanvas';
import { SizeForm } from './components/SizeForm';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { PlayIcon } from './svgs/Play';
import { PauseIcon } from './svgs/Pause';
import { ArrowRightIcon } from './svgs/ArrowRight';
import './game.css';

const DEFAULT_WIDTH = 40;
const DEFAULT_HEIGHT = 30;
const DEFAULT_GEN_PER_SEC = 10;

export default function Page() {
  const [grid, setGrid] = useState<Grid>(() =>
    createGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  );
  const [generation, setGeneration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const genPerSecRef = useRef(DEFAULT_GEN_PER_SEC);

  const onTick = useCallback(() => {
    setGrid((g) => step(g));
    setGeneration((n) => n + 1);
  }, []);

  useSimulationLoop(isRunning, genPerSecRef, onTick);

  function handleResize(width: number, height: number) {
    setGrid(createGrid(width, height));
    setGeneration(0);
  }

  function handleCellToggle(col: number, row: number) {
    setGrid((g) => toggleCell(g, col, row));
  }

  function handleStep() {
    if (isRunning) return;
    setGrid((g) => step(g));
    setGeneration((n) => n + 1);
  }

  const btnBase =
    'rounded p-2 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600';
  const btnPrimary = `${btnBase} bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700`;
  const btnSecondary = `${btnBase} bg-white border-neutral-300 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <h1 className="game-title mt-6 mb-4 text-xl font-semibold tracking-tight text-cyan-600 shrink-0">
        Conway&apos;s Game of Life
      </h1>

      <div className="game-content flex-1 flex flex-col lg:flex-row items-start gap-6 overflow-hidden pb-6">
        <div className="game-canvas-wrap border-2 border-cyan-600 rounded-md overflow-hidden shrink-0">
          <GameCanvas grid={grid} isRunning={isRunning} onCellToggle={handleCellToggle} />
        </div>

        <aside className="flex flex-col gap-6 w-full lg:flex-1">
          <p className="text-sm text-neutral-600">
            Generation:{' '}
            <span className="text-cyan-600 font-mono">{generation}</span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning((r) => !r)}
              className={btnPrimary}
              aria-label={isRunning ? 'Pause simulation' : 'Play simulation'}
            >
              <span style={{ display: 'block', position: 'relative', width: 20, height: 20 }}>
                <span style={{ position: 'absolute', inset: 0, opacity: isRunning ? 0 : 1, transition: 'opacity 150ms ease' }}>
                  <PlayIcon />
                </span>
                <span style={{ position: 'absolute', inset: 0, opacity: isRunning ? 1 : 0, transition: 'opacity 150ms ease' }}>
                  <PauseIcon />
                </span>
              </span>
            </button>
            <button
              onClick={handleStep}
              disabled={isRunning}
              className={btnSecondary}
              aria-label="Step one generation"
            >
              <span className="text-cyan-600">
                <ArrowRightIcon />
              </span>
            </button>
          </div>

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
