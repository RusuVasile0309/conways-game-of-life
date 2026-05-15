'use client';

import { useState, useRef, useEffect } from 'react';
import type { RuleSet } from '@conways-game-of-life/types';
import { conwayRules, highLifeRules } from '@conways-game-of-life/sim';

const RULE_SETS: RuleSet[] = [conwayRules, highLifeRules];

interface RuleSetSelectorProps {
  value: RuleSet;
  onChange: (rs: RuleSet) => void;
  disabled?: boolean;
}

export function RuleSetSelector({ value, onChange, disabled = false }: RuleSetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function close(e: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [isOpen]);

  function openDropdown() {
    if (disabled) return;
    const idx = RULE_SETS.findIndex((rs) => rs.id === value.id);
    setActiveIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  }

  function closeDropdown() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleSelect(rs: RuleSet) {
    onChange(rs);
    closeDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % RULE_SETS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + RULE_SETS.length) % RULE_SETS.length);
        break;
      case 'Enter': {
        e.preventDefault();
        const active = RULE_SETS[activeIndex];
        if (active) handleSelect(active);
        break;
      }
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(RULE_SETS.length - 1);
        break;
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0
      ? `ruleset-option-${RULE_SETS[activeIndex]?.id}`
      : undefined;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Rule set"
        aria-activedescendant={activeOptionId}
        className="flex items-center gap-2 h-10 rounded border px-3 bg-white border-neutral-300
          text-cyan-700 hover:border-cyan-600 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-cyan-600
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span>{value.name}</span>
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
          aria-label="Rule sets"
          className="absolute z-50 top-full mt-1 left-0 min-w-full bg-white
            border border-neutral-200 rounded shadow-lg overflow-hidden"
        >
          {RULE_SETS.map((rs, i) => (
            <li
              key={rs.id}
              id={`ruleset-option-${rs.id}`}
              role="option"
              aria-selected={value.id === rs.id}
            >
              <button
                type="button"
                onClick={() => handleSelect(rs)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm
                  text-neutral-700 hover:bg-cyan-50 hover:text-cyan-700
                  focus-visible:outline-none transition-colors
                  ${i === activeIndex ? 'bg-cyan-50 text-cyan-700' : ''}`}
              >
                <span>{rs.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
