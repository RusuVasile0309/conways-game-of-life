'use client';

import { useState } from 'react';

interface Props {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
}

export function SizeForm({ currentWidth, currentHeight, onResize }: Props) {
  const [width, setWidth] = useState(String(currentWidth));
  const [height, setHeight] = useState(String(currentHeight));
  const [error, setError] = useState<string | null>(null);

  function validate(raw: string): number | null {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 5 || n > 100) return null;
    return n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = validate(width);
    const h = validate(height);
    if (w === null || h === null) {
      setError('Width and height must be integers between 5 and 100.');
      return;
    }
    setError(null);
    onResize(w, h);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Grid Size</h2>
      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-neutral-500">Width</span>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            min={5}
            max={100}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 w-full focus:outline-none focus:border-cyan-500"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-neutral-500">Height</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min={5}
            max={100}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 w-full focus:outline-none focus:border-cyan-500"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="bg-neutral-900 border border-neutral-700 hover:border-cyan-500 hover:text-cyan-400 rounded px-3 py-1.5 text-sm transition-colors"
      >
        Resize
      </button>
    </form>
  );
}
