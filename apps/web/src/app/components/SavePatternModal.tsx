'use client';

import { useState } from 'react';
import { savePattern } from '@conways-game-of-life/api-client';
import type { Grid } from '@conways-game-of-life/types';
import { Modal } from './Modal';

function gridToLiveCells(grid: Grid): [number, number][] {
  const live: [number, number][] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.cells[y * grid.width + x] === 1) live.push([x, y]);
    }
  }
  return live;
}

interface SavePatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: Grid;
}

export function SavePatternModal({ isOpen, onClose, grid }: SavePatternModalProps) {
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = !grid.cells.some(Boolean);

  async function handleSave() {
    const name = saveName.trim();
    if (!name || isEmpty) return;
    setIsSaving(true);
    setError(null);
    try {
      await savePattern({
        name,
        width: grid.width,
        height: grid.height,
        liveCells: gridToLiveCells(grid),
      });
      setSaveName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  const btnBase =
    'rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Pattern">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
          placeholder="Pattern name…"
          disabled={isSaving}
          aria-label="Pattern name"
          autoFocus
          className={`${btnBase} w-full px-3 py-2 text-sm bg-white border-neutral-300
            text-neutral-700 placeholder-neutral-400 focus-visible:border-cyan-600
            disabled:opacity-40 disabled:cursor-not-allowed`}
        />

        {isEmpty && (
          <p className="text-xs text-amber-600">Grid is empty — paint some cells first.</p>
        )}
        {error && (
          <p className="text-xs text-red-600" role="alert">{error}</p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className={`${btnBase} px-4 py-2 text-sm bg-white border-neutral-300
              text-neutral-600 hover:border-neutral-400`}
          >
            Cancel
          </button>
          <button
            onClick={() => { void handleSave(); }}
            disabled={isSaving || !saveName.trim() || isEmpty}
            className={`${btnBase} px-4 py-2 text-sm bg-cyan-600 border-cyan-600 text-white
              hover:bg-cyan-700 hover:border-cyan-700
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
