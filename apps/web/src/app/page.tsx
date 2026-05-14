'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createGrid,
  toggleCell,
  randomizeGrid,
  placePattern,
  setCell,
  conwayRules,
} from '@conways-game-of-life/sim';
import type { Grid, RuleSet } from '@conways-game-of-life/types';
import type { SavedPattern } from '@conways-game-of-life/types';
import type { NamedPattern } from '@conways-game-of-life/sim';
import { GameCanvas } from './components/GameCanvas';
import { SizeForm } from './components/SizeForm';
import { PatternSelector } from './components/PatternSelector';
import { RuleSetSelector } from './components/RuleSetSelector';
import { SaveLoadPanel } from './components/SaveLoadPanel';
import { SavePatternModal } from './components/SavePatternModal';
import { LoadPatternModal } from './components/LoadPatternModal';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { useSimWorker } from './hooks/useSimWorker';
import { PlayIcon } from './svgs/Play';
import { PauseIcon } from './svgs/Pause';
import { ArrowRightIcon } from './svgs/ArrowRight';
import { TurtleIcon } from './svgs/Turtle';
import { RabbitIcon } from './svgs/Rabbit';
import { SaveIcon } from './svgs/SaveIcon';
import { LoadIcon } from './svgs/LoadIcon';
import { XIcon } from './svgs/XIcon';
import { DiceIcon } from './svgs/DiceIcon';
import './game.css';

const DEFAULT_WIDTH = 30;
const DEFAULT_HEIGHT = 30;
const DEFAULT_GEN_PER_SEC = 10;

export default function Page() {
  const [grid, setGrid] = useState<Grid>(() =>
    createGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  );
  const [generation, setGeneration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [genPerSec, setGenPerSec] = useState(DEFAULT_GEN_PER_SEC);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [ruleSet, setRuleSet] = useState<RuleSet>(conwayRules);
  const ruleSetRef = useRef<RuleSet>(conwayRules);
  const genPerSecRef = useRef(DEFAULT_GEN_PER_SEC);

  function handleSpeedChange(value: number) {
    genPerSecRef.current = value;
    setGenPerSec(value);
  }

  function handleRuleSetChange(rs: RuleSet) {
    ruleSetRef.current = rs;
    setRuleSet(rs);
  }

  const gridRef = useRef(grid);
  gridRef.current = grid;

  const workerTick = useSimWorker((newGrid) => {
    setGrid(newGrid);
    setGeneration((n) => n + 1);
  });

  const onTick = useCallback(() => {
    workerTick(gridRef.current, ruleSetRef.current.id);
  }, [workerTick]);

  useSimulationLoop(isRunning, genPerSecRef, onTick);

  useEffect(() => {
    if (isRunning && !grid.cells.some(Boolean)) {
      setIsRunning(false);
    }
  }, [grid, isRunning]);

  function handleResize(width: number, height: number) {
    setIsRunning(false);
    setGrid(createGrid(width, height));
    setGeneration(0);
  }

  function handleCellToggle(col: number, row: number) {
    setGrid((g) => toggleCell(g, col, row));
  }

  function handleStep() {
    if (isRunning) return;
    setGrid((g) => ruleSetRef.current.step(g));
    setGeneration((n) => n + 1);
  }

  function handleClear() {
    setIsRunning(false);
    setGrid((g) => createGrid(g.width, g.height));
    setGeneration(0);
  }

  function handleRandomize() {
    setIsRunning(false);
    setGrid((g) => randomizeGrid(g));
    setGeneration(0);
  }

  function handleLoadSaved(pattern: SavedPattern) {
    setIsRunning(false);
    let g = createGrid(pattern.width, pattern.height);
    for (const [x, y] of pattern.liveCells) {
      g = setCell(g, x, y, 1);
    }
    setGrid(g);
    setGeneration(0);
  }

  function handlePatternSelect(pattern: NamedPattern) {
    setIsRunning(false);
    const newWidth = Math.max(grid.width, pattern.width + 4);
    const newHeight = Math.max(grid.height, pattern.height + 4);
    const newGrid = createGrid(newWidth, newHeight);
    const anchorX = Math.floor((newWidth - pattern.width) / 2);
    const anchorY = Math.floor((newHeight - pattern.height) / 2);
    setGrid(placePattern(newGrid, pattern, anchorX, anchorY));
    setGeneration(0);
  }

  const btnBase =
    'rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600';
  const btnIcon = `${btnBase} w-9 h-9 flex items-center justify-center`;
  const btnPrimary = `${btnIcon} bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed`;
  const btnSecondary = `${btnBase} h-10 px-3 flex items-center justify-center text-cyan-700 bg-white border-neutral-300 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed`;
  const btnSecondaryIcon = `${btnIcon} bg-white border-neutral-300 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      {/* Mobile-only floating save/load buttons — top-right corner */}
      <div className="fixed top-3 right-4 z-40 flex gap-2 lg:hidden">
        <button
          onClick={() => setShowSaveModal(true)}
          aria-label="Save pattern"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white
            border border-neutral-200 text-cyan-700 shadow-md hover:border-cyan-600
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600
            transition-colors"
        >
          <SaveIcon size={18} />
        </button>
        <button
          onClick={() => setShowLoadModal(true)}
          aria-label="Load pattern"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white
            border border-neutral-200 text-cyan-700 shadow-md hover:border-cyan-600
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600
            transition-colors"
        >
          <LoadIcon size={18} />
        </button>
      </div>

      <SavePatternModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        grid={grid}
      />
      <LoadPatternModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadPattern={handleLoadSaved}
      />
      <h1 className="game-title mt-6 mb-4 text-xl font-semibold tracking-tight text-cyan-800 shrink-0">
        Conway&apos;s Game of Life
      </h1>

      <div className="game-content flex-1 flex flex-col lg:flex-row items-center gap-6 pb-6">
        <div className="game-canvas-wrap border-2 border-cyan-600 rounded-md overflow-hidden shrink-0">
          <GameCanvas
            grid={grid}
            isRunning={isRunning}
            onCellToggle={handleCellToggle}
          />
        </div>

        <aside className="flex flex-col gap-4 w-full lg:flex-1">
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center w-full">
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRunning((r) => !r)}
                  className={btnPrimary}
                  aria-label={
                    isRunning ? 'Pause simulation' : 'Play simulation'
                  }
                >
                  <span
                    style={{
                      display: 'block',
                      position: 'relative',
                      width: 20,
                      height: 20,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: isRunning ? 0 : 1,
                        transition: 'opacity 150ms ease',
                      }}
                    >
                      <PlayIcon />
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: isRunning ? 1 : 0,
                        transition: 'opacity 150ms ease',
                      }}
                    >
                      <PauseIcon />
                    </span>
                  </span>
                </button>
                <button
                  onClick={handleStep}
                  disabled={isRunning}
                  className={btnSecondaryIcon}
                  aria-label="Step one generation"
                >
                  <span className="text-cyan-600">
                    <ArrowRightIcon />
                  </span>
                </button>
              </div>
              <div className="flex-1 flex justify-end">
                <p className="text-sm text-neutral-600">
                  Generation:{' '}
                  <span
                    className="text-cyan-600 font-mono"
                    data-testid="gen-count"
                  >
                    {generation}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <span className="text-neutral-400">
                <TurtleIcon />
              </span>
              <input
                type="range"
                min={1}
                max={60}
                value={genPerSec}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="flex-1 accent-cyan-600 speed-slider"
                aria-label="Generations per second"
              />
              <span className="text-neutral-400">
                <RabbitIcon />
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 justify-center items-center">
            <button
              onClick={handleClear}
              className={btnSecondary}
              aria-label="Clear grid"
            >
              <span className="sm:hidden"><XIcon size={18} /></span>
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={handleRandomize}
              className={btnSecondary}
              aria-label="Randomize grid"
            >
              <span className="sm:hidden"><DiceIcon size={18} /></span>
              <span className="hidden sm:inline">Randomize</span>
            </button>
            <PatternSelector
              onSelect={handlePatternSelect}
              disabled={isRunning}
            />
            <RuleSetSelector
              value={ruleSet}
              onChange={handleRuleSetChange}
              disabled={isRunning}
            />
          </div>

          <SizeForm
            currentWidth={grid.width}
            currentHeight={grid.height}
            onResize={handleResize}
          />

          <div className="hidden lg:block w-full">
            <SaveLoadPanel
              grid={grid}
              onLoadPattern={handleLoadSaved}
              disabled={isRunning}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
