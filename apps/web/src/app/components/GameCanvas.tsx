'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';

const ALIVE_COLOR = '#22d3ee';
const DEAD_COLOR = '#0a0a0a';
const GRID_COLOR = 'rgba(255, 255, 255, 1)';
const SCALE_DESKTOP = 30;
const SCALE_MOBILE = 30;
const MIN_SCALE = 2;
const MAX_SCALE = 64;

interface Camera {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface Props {
  grid: Grid;
  isRunning: boolean;
  onCellToggle: (col: number, row: number) => void;
}

export function GameCanvas({ grid, isRunning, onCellToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({
    offsetX: 0,
    offsetY: 0,
    scale: SCALE_DESKTOP,
  });
  const gridRef = useRef(grid);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const isRunningRef = useRef(isRunning);
  const onCellToggleRef = useRef(onCellToggle);

  gridRef.current = grid;
  isRunningRef.current = isRunning;
  onCellToggleRef.current = onCellToggle;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY, scale } = cameraRef.current;
    const g = gridRef.current;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = DEAD_COLOR;
    ctx.fillRect(0, 0, W, H);

    const startCol = Math.max(0, Math.floor(offsetX));
    const startRow = Math.max(0, Math.floor(offsetY));
    const endCol = Math.min(g.width, Math.ceil(offsetX + W / scale));
    const endRow = Math.min(g.height, Math.ceil(offsetY + H / scale));

    if (scale >= 4) {
      // Grid boundary in screen coords — lines must not exceed this
      const gridLeft = Math.max(0, -offsetX * scale);
      const gridTop = Math.max(0, -offsetY * scale);
      const gridRight = Math.min(W, (g.width - offsetX) * scale);
      const gridBottom = Math.min(H, (g.height - offsetY) * scale);

      const t = Math.max(0, Math.min(1, (scale - 10) / (30 - 10)));
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1 + t * 2;
      for (let col = startCol; col <= endCol; col++) {
        const x = Math.round((col - offsetX) * scale) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, gridTop);
        ctx.lineTo(x, gridBottom);
        ctx.stroke();
      }
      for (let row = startRow; row <= endRow; row++) {
        const y = Math.round((row - offsetY) * scale) + 0.5;
        ctx.beginPath();
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridRight, y);
        ctx.stroke();
      }
    }

    const pad = scale >= 4 ? 1 : 0;
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (g.cells[row * g.width + col] === 1) {
          const x = (col - offsetX) * scale;
          const y = (row - offsetY) * scale;
          ctx.fillRect(x + pad, y + pad, scale - pad, scale - pad);
        }
      }
    }
  }, []);

  const fitToCanvas = useCallback(() => {
    const scale = window.innerWidth >= 1024 ? SCALE_DESKTOP : SCALE_MOBILE;
    cameraRef.current = { scale, offsetX: 0, offsetY: 0 };
  }, []);

  // Resize canvas to fill container, fit grid on first paint
  const fittedRef = useRef(false);
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (!fittedRef.current) {
        fitToCanvas();
        fittedRef.current = true;
      }
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw, fitToCanvas]);

  // Redraw when grid changes; re-fit when grid size changes
  const prevSizeRef = useRef({ w: grid.width, h: grid.height });
  useEffect(() => {
    const prev = prevSizeRef.current;
    if (prev.w !== grid.width || prev.h !== grid.height) {
      fittedRef.current = false;
      prevSizeRef.current = { w: grid.width, h: grid.height };
    }
    draw();
  }, [grid, draw]);

  // Wheel zoom centred on cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cam = cameraRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, cam.scale * factor),
      );
      const wx = mx / cam.scale + cam.offsetX;
      const wy = my / cam.scale + cam.offsetY;
      cameraRef.current = {
        scale: newScale,
        offsetX: wx - mx / newScale,
        offsetY: wy - my / newScale,
      };
      draw();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [draw]);

  // Touch pan + pinch-zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTouches: React.Touch[] | Touch[] = [];
    let tapStart: { x: number; y: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      lastTouches = Array.from(e.touches);
      if (e.touches.length === 1) {
        tapStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        tapStart = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.touches);
      const cam = cameraRef.current;

      if (touches.length === 1 && lastTouches.length === 1) {
        const dx = touches[0].clientX - lastTouches[0].clientX;
        const dy = touches[0].clientY - lastTouches[0].clientY;
        cameraRef.current = {
          ...cam,
          offsetX: cam.offsetX - dx / cam.scale,
          offsetY: cam.offsetY - dy / cam.scale,
        };
      } else if (touches.length === 2 && lastTouches.length === 2) {
        const prevDist = Math.hypot(
          lastTouches[0].clientX - lastTouches[1].clientX,
          lastTouches[0].clientY - lastTouches[1].clientY,
        );
        const newDist = Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY,
        );
        const rect = canvas.getBoundingClientRect();
        const mx = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
        const my = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
        const factor = newDist / prevDist;
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, cam.scale * factor),
        );
        const wx = mx / cam.scale + cam.offsetX;
        const wy = my / cam.scale + cam.offsetY;
        cameraRef.current = {
          scale: newScale,
          offsetX: wx - mx / newScale,
          offsetY: wy - my / newScale,
        };
      }

      lastTouches = touches;
      draw();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (
        tapStart &&
        e.changedTouches.length === 1 &&
        e.touches.length === 0 &&
        !isRunningRef.current
      ) {
        const t = e.changedTouches[0];
        const dx = t.clientX - tapStart.x;
        const dy = t.clientY - tapStart.y;
        if (Math.abs(dx) + Math.abs(dy) < 5) {
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const { offsetX, offsetY, scale } = cameraRef.current;
            const col = Math.floor((t.clientX - rect.left) / scale + offsetX);
            const row = Math.floor((t.clientY - rect.top) / scale + offsetY);
            const g = gridRef.current;
            if (col >= 0 && col < g.width && row >= 0 && row < g.height) {
              onCellToggleRef.current(col, row);
            }
          }
        }
      }
      tapStart = null;
      lastTouches = Array.from(e.touches);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [draw]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: cameraRef.current.offsetX,
      oy: cameraRef.current.offsetY,
      moved: false,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, ox, oy } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragRef.current.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      dragRef.current.moved = true;
    }
    const scale = cameraRef.current.scale;
    cameraRef.current = {
      ...cameraRef.current,
      offsetX: ox - dx / scale,
      offsetY: oy - dy / scale,
    };
    draw();
  };

  const stopDrag = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag && !drag.moved && !isRunningRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const { offsetX, offsetY, scale } = cameraRef.current;
        const col = Math.floor((e.clientX - rect.left) / scale + offsetX);
        const row = Math.floor((e.clientY - rect.top) / scale + offsetY);
        const g = gridRef.current;
        if (col >= 0 && col < g.width && row >= 0 && row < g.height) {
          onCellToggleRef.current(col, row);
        }
      }
    }
    dragRef.current = null;
  };

  const cancelDrag = () => {
    dragRef.current = null;
  };

  return (
    <div ref={containerRef} className="w-full h-full  overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing"
        style={{ imageRendering: 'pixelated' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={cancelDrag}
      />
    </div>
  );
}
