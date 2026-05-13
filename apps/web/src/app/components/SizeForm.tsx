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

  function handleChange(
    rawWidth: string,
    rawHeight: string,
  ) {
    const w = validate(rawWidth);
    const h = validate(rawHeight);
    if (w === null || h === null) {
      setError('Width and height must be integers between 5 and 100.');
      return;
    }
    setError(null);
    onResize(w, h);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Grid Size</h2>
      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-neutral-600">Width</span>
          <input
            type="number"
            value={width}
            onChange={(e) => { setWidth(e.target.value); handleChange(e.target.value, height); }}
            min={5}
            max={100}
            className="bg-white border border-neutral-300 rounded px-2 py-1.5 text-sm text-neutral-900 w-full focus:outline-none focus:border-cyan-600"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-neutral-500">Height</span>
          <input
            type="number"
            value={height}
            onChange={(e) => { setHeight(e.target.value); handleChange(width, e.target.value); }}
            min={5}
            max={100}
            className="bg-white border border-neutral-300 rounded px-2 py-1.5 text-sm text-neutral-900 w-full focus:outline-none focus:border-cyan-600"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
