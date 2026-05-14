'use client';

import { useState, useEffect } from 'react';
import { listPatterns } from '@conways-game-of-life/api-client';
import type { SavedPattern } from '@conways-game-of-life/types';
import { Modal } from './Modal';

interface LoadPatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPattern: (pattern: SavedPattern) => void;
}

export function LoadPatternModal({ isOpen, onClose, onLoadPattern }: LoadPatternModalProps) {
  const [patterns, setPatterns] = useState<SavedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    listPatterns()
      .then(setPatterns)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  function handleSelect(pattern: SavedPattern) {
    onLoadPattern(pattern);
    onClose();
  }

  const btnBase =
    'rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Load Pattern">
      {isLoading && (
        <p className="text-sm text-neutral-400 py-2">Loading…</p>
      )}
      {!isLoading && error && (
        <p className="text-sm text-red-600 py-2" role="alert">{error}</p>
      )}
      {!isLoading && !error && patterns.length === 0 && (
        <p className="text-sm text-neutral-400 py-2">No saved patterns yet.</p>
      )}
      {!isLoading && patterns.length > 0 && (
        <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto" aria-label="Saved patterns">
          {patterns.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => handleSelect(p)}
                className={`${btnBase} w-full text-left px-3 py-2 text-sm bg-white
                  border-neutral-200 text-neutral-700 hover:border-cyan-600
                  hover:text-cyan-700 truncate`}
                title={`${p.name} (${p.width}×${p.height})`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-neutral-400 text-xs">{p.width}×{p.height}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
