'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';
import type { Camera } from '../hooks/useSimWorker';

const SCALE_DESKTOP = 30;
const SCALE_MOBILE = 30;
const MIN_SCALE = 2;
const MAX_SCALE = 64;

interface Props {
  grid: Grid;
  isRunning: boolean;
  onCellToggle: (col: number, row: number) => void;
  onDraw: (grid: Grid, camera: Camera, canvasW: number, canvasH: number) => void;
  onCanvasMount: (canvas: OffscreenCanvas) => void;
}

export function GameCanvas({
  grid,
  isRunning,
  onCellToggle,
  onDraw,
  onCanvasMount,
}: Props) {
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
  const onDrawRef = useRef(onDraw);
  const onCanvasMountRef = useRef(onCanvasMount);

  gridRef.current = grid;
  isRunningRef.current = isRunning;
  onCellToggleRef.current = onCellToggle;
  onDrawRef.current = onDraw;
  onCanvasMountRef.current = onCanvasMount;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDrawRef.current(
      gridRef.current,
      cameraRef.current,
      canvas.width,
      canvas.height,
    );
  }, []);

  const fitToCanvas = useCallback(() => {
    const scale = window.innerWidth >= 1024 ? SCALE_DESKTOP : SCALE_MOBILE;
    cameraRef.current = { scale, offsetX: 0, offsetY: 0 };
  }, []);

  // Transfer canvas to worker once on mount — must run before ResizeObserver fires
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = canvas.transferControlToOffscreen();
    onCanvasMountRef.current(offscreen);
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

  // Redraw when grid changes (paused only — worker draws during simulation)
  const prevSizeRef = useRef({ w: grid.width, h: grid.height });
  useEffect(() => {
    const prev = prevSizeRef.current;
    if (prev.w !== grid.width || prev.h !== grid.height) {
      fittedRef.current = false;
      prevSizeRef.current = { w: grid.width, h: grid.height };
    }
    if (!isRunningRef.current) draw();
  }, [grid, draw]);

  // Redraw once when simulation stops so the last frame is crisp
  useEffect(() => {
    if (!isRunning) draw();
  }, [isRunning, draw]);

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
        data-cols={grid.width}
        data-rows={grid.height}
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
