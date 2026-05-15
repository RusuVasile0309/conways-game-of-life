'use client';

import { useState, useRef, useEffect } from 'react';
import { block, blinker, glider, gosperGliderGun } from '@conways-game-of-life/sim';
import type { NamedPattern } from '@conways-game-of-life/sim';
import { BlockIcon } from '../svgs/BlockIcon';
import { BlinkerIcon } from '../svgs/BlinkerIcon';
import { GliderIcon } from '../svgs/GliderIcon';
import { GosperGliderGunIcon } from '../svgs/GosperGliderGunIcon';

const PATTERNS: NamedPattern[] = [block, blinker, glider, gosperGliderGun];

const ICONS: Record<string, React.ReactNode> = {
  block: <BlockIcon size={16} />,
  blinker: <BlinkerIcon size={16} />,
  glider: <GliderIcon size={16} />,
  'gosper-glider-gun': <GosperGliderGunIcon size={16} />,
};

interface PatternSelectorProps {
  onSelect: (pattern: NamedPattern) => void;
  disabled?: boolean;
}

export function PatternSelector({ onSelect, disabled = false }: PatternSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function close(e: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [isOpen]);

  function handleSelect(pattern: NamedPattern) {
    setLastSelected(pattern.id);
    onSelect(pattern);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { if (!disabled) setIsOpen((o) => !o); }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Load a named pattern"
        className="flex items-center gap-2 h-10 rounded border px-3 bg-white border-neutral-300
          text-cyan-700 hover:border-cyan-600 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-cyan-600
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {lastSelected && (
          <span className="text-cyan-600" aria-hidden="true">
            {ICONS[lastSelected]}
          </span>
        )}
        <span>Load pattern…</span>
        <svg
          className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Named patterns"
          className="absolute z-50 top-full mt-1 left-0 min-w-full bg-white
            border border-neutral-200 rounded shadow-lg overflow-hidden"
        >
          {PATTERNS.map((p) => (
            <li key={p.id} role="option" aria-selected={lastSelected === p.id}>
              <button
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm
                  text-neutral-700 hover:bg-cyan-50 hover:text-cyan-700
                  focus-visible:outline-none focus-visible:bg-cyan-50 transition-colors"
              >
                <span className="text-cyan-600">{ICONS[p.id]}</span>
                <span>{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
