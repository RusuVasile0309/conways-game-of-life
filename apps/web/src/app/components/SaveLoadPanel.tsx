'use client';

import { useState, useEffect } from 'react';
import { listPatterns, savePattern } from '@conways-game-of-life/api-client';
import type { SavedPattern } from '@conways-game-of-life/types';
import type { Grid } from '@conways-game-of-life/types';
import { gridToLiveCells } from '../lib/grid-utils';
import { btnBase, btnSecondary as btnSecondaryClass } from '../lib/button-classes';

interface SaveLoadPanelProps {
  grid: Grid;
  onLoadPattern: (pattern: SavedPattern) => void;
  disabled?: boolean;
}

export function SaveLoadPanel({ grid, onLoadPattern, disabled = false }: SaveLoadPanelProps) {
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isEmpty = !grid.cells.some(Boolean);

  async function fetchPatterns() {
    setIsLoadingPatterns(true);
    setErrorMsg(null);
    try {
      const patterns = await listPatterns();
      setSavedPatterns(patterns);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load patterns');
    } finally {
      setIsLoadingPatterns(false);
    }
  }

  useEffect(() => {
    void fetchPatterns();
  }, []);

  async function handleSave() {
    const name = saveName.trim();
    if (!name || isEmpty) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await savePattern({
        name,
        width: grid.width,
        height: grid.height,
        liveCells: gridToLiveCells(grid),
      });
      setSaveName('');
      setSaveSuccess(true);
      await fetchPatterns();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  const btnSecondary = btnSecondaryClass;

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Saved Patterns
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
          placeholder="Pattern name…"
          disabled={disabled || isSaving}
          aria-label="Pattern name"
          className={`${btnBase} flex-1 px-3 py-2 text-sm bg-white border-neutral-300
            text-neutral-700 placeholder-neutral-400 focus-visible:border-cyan-600
            disabled:opacity-40 disabled:cursor-not-allowed`}
        />
        <button
          onClick={() => { void handleSave(); }}
          disabled={disabled || isSaving || !saveName.trim() || isEmpty}
          className={`${btnSecondary} text-sm`}
          aria-label="Save current grid as named pattern"
          title={isEmpty ? 'Grid is empty — paint some cells first' : 'Save pattern'}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveSuccess && !errorMsg && (
        <p className="text-xs text-green-600" role="status">
          Pattern saved.
        </p>
      )}

      {errorMsg && (
        <p className="text-xs text-red-600" role="alert">
          {errorMsg}
        </p>
      )}

      {isLoadingPatterns && (
        <p className="text-xs text-neutral-400">Loading…</p>
      )}

      {!isLoadingPatterns && savedPatterns.length > 0 && (
        <ul
          className="flex flex-col gap-1 max-h-40 overflow-y-auto"
          aria-label="Saved patterns list"
        >
          {savedPatterns.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onLoadPattern(p)}
                disabled={disabled}
                className={`${btnBase} w-full text-left px-3 py-2 text-sm bg-white
                  border-neutral-200 text-neutral-700 hover:border-cyan-600
                  hover:text-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed truncate`}
                title={`${p.name} (${p.width}×${p.height})`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-neutral-400 text-xs">
                  {p.width}×{p.height}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isLoadingPatterns && savedPatterns.length === 0 && !errorMsg && (
        <p className="text-xs text-neutral-400">No saved patterns yet.</p>
      )}
    </div>
  );
}
