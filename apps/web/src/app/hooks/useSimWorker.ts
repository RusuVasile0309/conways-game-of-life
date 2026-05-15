import { useCallback, useEffect, useRef } from 'react';
import type { Grid } from '@conways-game-of-life/types';

export function useSimWorker(onGrid: (grid: Grid) => void) {
  const onGridRef = useRef(onGrid);
  onGridRef.current = onGrid;

  const workerRef = useRef<Worker | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/sim.worker.ts', import.meta.url),
    );

    worker.onmessage = (
      e: MessageEvent<{
        type: 'grid';
        cells: ArrayBuffer;
        width: number;
        height: number;
      }>,
    ) => {
      inFlightRef.current = false;
      if (e.data?.type === 'grid') {
        const { cells, width, height } = e.data;
        onGridRef.current({ width, height, cells: new Uint8Array(cells) });
      }
    };

    worker.onerror = (e) => {
      console.error('[sim.worker] error:', e.message);
      inFlightRef.current = false;
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return useCallback((grid: Grid, ruleSetId: string) => {
    const worker = workerRef.current;
    if (!worker || inFlightRef.current) return;
    inFlightRef.current = true;
    const copy = grid.cells.buffer.slice(0);
    worker.postMessage(
      { type: 'tick', cells: copy, width: grid.width, height: grid.height, ruleSetId },
      [copy],
    );
  }, []);
}
