import { useState } from 'react';
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
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const pattern = PATTERNS.find((p) => p.id === id);
    if (pattern) {
      setLastSelected(id);
      onSelect(pattern);
    }
    // Reset select to placeholder so same pattern can be re-selected
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-2">
      {lastSelected && (
        <span
          className="text-cyan-600 flex-shrink-0"
          aria-hidden="true"
        >
          {ICONS[lastSelected]}
        </span>
      )}
      <select
        defaultValue=""
        onChange={handleChange}
        disabled={disabled}
        aria-label="Load a named pattern"
        className="rounded border px-3 py-2 bg-white border-neutral-300 text-cyan-700 text-sm
          hover:border-cyan-600 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors"
      >
        <option value="" disabled>
          Load pattern…
        </option>
        {PATTERNS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
