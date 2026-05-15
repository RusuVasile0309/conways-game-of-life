/// <reference lib="webworker" />

import { conwayRules, highLifeRules } from '@conways-game-of-life/sim';
import type { Grid, RuleSet } from '@conways-game-of-life/types';

const ALIVE_COLOR = '#22d3ee';
const DEAD_COLOR = '#0a0a0a';
const GRID_COLOR = 'rgba(255, 255, 255, 1)';

const ruleSets: Record<string, RuleSet> = {
  [conwayRules.id]: conwayRules,
  [highLifeRules.id]: highLifeRules,
};

type Camera = { offsetX: number; offsetY: number; scale: number };

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let cachedCamera: Camera = { offsetX: 0, offsetY: 0, scale: 30 };
let cachedCanvasW = 0;
let cachedCanvasH = 0;

function drawGrid(
  renderCtx: OffscreenCanvasRenderingContext2D,
  grid: Grid,
  camera: Camera,
  canvasW: number,
  canvasH: number,
) {
  renderCtx.fillStyle = DEAD_COLOR;
  renderCtx.fillRect(0, 0, canvasW, canvasH);

  const { offsetX, offsetY, scale } = camera;
  const startCol = Math.max(0, Math.floor(offsetX));
  const startRow = Math.max(0, Math.floor(offsetY));
  const endCol = Math.min(grid.width, Math.ceil(offsetX + canvasW / scale));
  const endRow = Math.min(grid.height, Math.ceil(offsetY + canvasH / scale));

  if (scale >= 4) {
    const gridLeft = Math.max(0, -offsetX * scale);
    const gridTop = Math.max(0, -offsetY * scale);
    const gridRight = Math.min(canvasW, (grid.width - offsetX) * scale);
    const gridBottom = Math.min(canvasH, (grid.height - offsetY) * scale);
    renderCtx.strokeStyle = GRID_COLOR;
    renderCtx.lineWidth = 1;
    renderCtx.beginPath();
    for (let col = startCol; col <= endCol; col++) {
      const x = Math.round((col - offsetX) * scale) + 0.5;
      renderCtx.moveTo(x, gridTop);
      renderCtx.lineTo(x, gridBottom);
    }
    for (let row = startRow; row <= endRow; row++) {
      const y = Math.round((row - offsetY) * scale) + 0.5;
      renderCtx.moveTo(gridLeft, y);
      renderCtx.lineTo(gridRight, y);
    }
    renderCtx.stroke();
  }

  const pad = scale >= 4 ? 1 : 0;
  renderCtx.fillStyle = ALIVE_COLOR;
  renderCtx.beginPath();
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (grid.cells[row * grid.width + col] === 1) {
        const x = (col - offsetX) * scale;
        const y = (row - offsetY) * scale;
        renderCtx.rect(x + pad, y + pad, scale - pad, scale - pad);
      }
    }
  }
  renderCtx.fill();
}

type InboundMessage =
  | { type: 'init'; canvas: OffscreenCanvas }
  | {
      type: 'draw';
      cells: ArrayBuffer;
      width: number;
      height: number;
      camera: Camera;
      canvasW: number;
      canvasH: number;
    }
  | {
      type: 'tick';
      cells: ArrayBuffer;
      width: number;
      height: number;
      ruleSetId: string;
    };

self.onmessage = ({ data }: MessageEvent<InboundMessage>) => {
  if (data.type === 'init') {
    ctx = data.canvas.getContext('2d');
    return;
  }

  if (data.type === 'draw') {
    if (!ctx) return;
    cachedCamera = data.camera;
    cachedCanvasW = data.canvasW;
    cachedCanvasH = data.canvasH;
    if (ctx.canvas.width !== data.canvasW) ctx.canvas.width = data.canvasW;
    if (ctx.canvas.height !== data.canvasH) ctx.canvas.height = data.canvasH;
    const grid: Grid = {
      width: data.width,
      height: data.height,
      cells: new Uint8Array(data.cells),
    };
    drawGrid(ctx, grid, cachedCamera, cachedCanvasW, cachedCanvasH);
    return;
  }

  if (data.type === 'tick') {
    const grid: Grid = {
      width: data.width,
      height: data.height,
      cells: new Uint8Array(data.cells),
    };
    const ruleSet = ruleSets[data.ruleSetId] ?? conwayRules;
    const next = ruleSet.step(grid);
    if (ctx && cachedCanvasW > 0 && cachedCanvasH > 0) {
      drawGrid(ctx, next, cachedCamera, cachedCanvasW, cachedCanvasH);
    }
    self.postMessage(
      {
        type: 'grid',
        cells: next.cells.buffer,
        width: next.width,
        height: next.height,
      },
      [next.cells.buffer],
    );
  }
};
