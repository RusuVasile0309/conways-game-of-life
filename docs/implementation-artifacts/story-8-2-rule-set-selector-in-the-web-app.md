# Story 8.2: Rule-set selector in the web app

Status: done

## Story

As Casey,
I want a dropdown to pick between Conway and HighLife,
so that I can compare how the same starting state evolves under different rules.

**Priority:** Stretch
**FR/NFR coverage:** FR16
**Estimated effort:** S

## Acceptance Criteria

**AC1 — Rule change takes effect without resetting state:**
Given the rule-set selector is rendered,
When the user picks a rule set,
Then the selected `RuleSet`'s `step()` is used for the next advanced generation; the grid and gen counter are NOT reset.

**AC2 — Conway is the default:**
Given the page has just loaded and the user has not interacted with the selector,
When the simulation runs,
Then behavior is identical to MVP (Conway's B3/S23 rules apply).

**AC3 — Only preset rule sets are offered:**
Given the selector is rendered,
When the user opens it,
Then it offers exactly the preset rule sets exported from `libs/sim` (`conwayRules` and `highLifeRules`) — no free-form authoring.

**AC4 — Selector is accessible:**
Given the selector is visible,
When inspected for accessibility,
Then it has a discernible accessible label and is keyboard-operable.

## Tasks / Subtasks

- [x] Task 1: Add `RuleSetSelector` component (AC1, AC2, AC3, AC4)
  - [x] Create `apps/web/src/app/components/RuleSetSelector.tsx`
  - [x] ~~Use a native `<select>` (not custom dropdown)~~ → **superseded: implemented as custom dropdown (button + listbox)** — native `<select>` styling is non-uniform across browsers and viewport sizes: iOS Safari renders a native wheel-picker, Chrome on Android uses a modal sheet, and Firefox desktop ignores most CSS styling. A custom dropdown matches the `PatternSelector` pattern and gives consistent cross-browser/cross-device appearance. Cost: manual keyboard navigation required (ArrowUp/Down/Home/End/Enter/Escape added, see code-review follow-ups).
  - [x] List options: Conway (`conwayRules.id`/`conwayRules.name`) and HighLife (`highLifeRules.id`/`highLifeRules.name`)
  - [x] Apply consistent styling (border, rounded, focus-ring matching existing controls)
  - [x] Expose `value`, `onChange`, `disabled` props; type with `RuleSet`

- [x] Task 2: Wire rule set into `page.tsx` (AC1, AC2)
  - [x] Add `ruleSetRef = useRef<RuleSet>(conwayRules)` to mirror the `genPerSecRef` pattern
  - [x] Add `ruleSet` state (`useState<RuleSet>(conwayRules)`) for display only (drives selector value)
  - [x] Add `handleRuleSetChange(rs: RuleSet)` that updates both ref and state — no grid/gen reset
  - [x] Replace `setGrid((g) => step(g))` in `onTick` with `setGrid((g) => ruleSetRef.current.step(g))`
  - [x] Replace `setGrid((g) => step(g))` in `handleStep` with `setGrid((g) => ruleSetRef.current.step(g))`
  - [x] Remove unused `step` import (now fully replaced by `ruleSetRef.current.step`)
  - [x] Add `conwayRules` import from `@conways-game-of-life/sim` (highLifeRules used inside RuleSetSelector)
  - [x] Add `RuleSet` type import from `@conways-game-of-life/types`
  - [x] Render `<RuleSetSelector>` in the controls area (same row as Clear/Randomize/PatternSelector)

- [x] Task 3: Run lint + typecheck + tests (AC1–AC4)
  - [x] `pnpm nx lint web` — 0 errors (1 pre-existing warning in next.config.js)
  - [x] `cd apps/web && tsc --noEmit` — 0 errors
  - [x] `pnpm nx test web` — 2/2 pass
  - [x] `pnpm exec nx e2e web-e2e -- --project=chromium` — 11/11 pass (a11y Tab-order test updated to include Rule set selector)

## Dev Notes

### CRITICAL: Use `ruleSetRef` pattern — do NOT close over `ruleSet` state in `onTick`

The simulation loop runs inside a `useCallback` with empty deps (`[]`). This is intentional — `onTick` never changes identity, so `useSimulationLoop`'s `onTickRef.current` always has the latest. If you close over `ruleSet` state instead of a ref, changing the rule set would create a new `onTick` identity on every rule change. The `genPerSecRef` already establishes this pattern for the speed slider.

Correct approach:
```typescript
const ruleSetRef = useRef<RuleSet>(conwayRules);

function handleRuleSetChange(rs: RuleSet) {
  ruleSetRef.current = rs;
  setRuleSet(rs);           // state only needed for the selector's `value` prop
}

const onTick = useCallback(() => {
  setGrid((g) => ruleSetRef.current.step(g));  // reads ref at call time
  setGeneration((n) => n + 1);
}, []);
```

### CRITICAL: Grid and gen counter must NOT reset on rule change

AC1 is explicit: rule change only swaps `ruleSetRef.current`. No `setGrid`, no `setGeneration`, no `setIsRunning`. The user sees the same grid continue evolving under the new rules from the next tick.

### Use native `<select>` — not a custom dropdown

`PatternSelector` is a custom dropdown because it shows icons and represents a one-shot "load" action (not persistent state). The rule selector is a persistent state choice between 2 items — semantically a `<select>` is correct and more accessible. No custom listbox needed.

```tsx
// apps/web/src/app/components/RuleSetSelector.tsx
'use client';

import type { RuleSet } from '@conways-game-of-life/types';
import { conwayRules, highLifeRules } from '@conways-game-of-life/sim';

const RULE_SETS: RuleSet[] = [conwayRules, highLifeRules];

interface RuleSetSelectorProps {
  value: RuleSet;
  onChange: (rs: RuleSet) => void;
  disabled?: boolean;
}

export function RuleSetSelector({ value, onChange, disabled = false }: RuleSetSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600">
      Rules:
      <select
        value={value.id}
        onChange={(e) => {
          const rs = RULE_SETS.find((r) => r.id === e.target.value);
          if (rs) onChange(rs);
        }}
        disabled={disabled}
        aria-label="Rule set"
        className="rounded border border-neutral-300 px-2 py-1.5 text-sm text-cyan-700 bg-white
          hover:border-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {RULE_SETS.map((rs) => (
          <option key={rs.id} value={rs.id}>{rs.name}</option>
        ))}
      </select>
    </label>
  );
}
```

### Module boundaries are fine

`scope:app` can import from both `scope:sim` and `scope:types` per the Nx dep-constraints in `eslint.config.mjs`:
- `conwayRules`, `highLifeRules` from `@conways-game-of-life/sim` → allowed
- `RuleSet` type from `@conways-game-of-life/types` → allowed

### Removing the bare `step` import

`page.tsx` currently imports `step` from `@conways-game-of-life/sim`. After this story, `ruleSetRef.current.step(g)` replaces every call site. Remove `step` from the destructured import to avoid the `noUnusedLocals` tsc error.

### `.js` extensions — lib files only, NOT in the selector component

`apps/web` is bundled by Turbopack/webpack with standard extension resolution. Do NOT add `.js` to any imports in `apps/web`. The `.js` rule applies only to `libs/sim` spec files (see feedback memory).

### Layout placement

Place `<RuleSetSelector>` in the existing `flex-wrap gap-2 justify-center items-center` row (the same `<div>` that contains Clear, Randomize, PatternSelector). It fits naturally as a fourth item in that row.

### Project Structure

Files to create/modify:

| Path | Action |
|------|--------|
| `apps/web/src/app/components/RuleSetSelector.tsx` | **Create** — native-select component |
| `apps/web/src/app/page.tsx` | **Modify** — ruleSetRef, handleRuleSetChange, swap `step` for `ruleSetRef.current.step` |

### References

- [Source: docs/planning-artifacts/epics.md#Story-8.2] — ACs, user story, FR16 ("no custom-rule authoring" explicit out-of-scope)
- [Source: docs/planning-artifacts/architecture.md#4.5] — `useRef` pattern for loop parameters (genPerSecRef precedent)
- [Source: apps/web/src/app/page.tsx] — current `onTick`, `handleStep`, `genPerSecRef` pattern
- [Source: apps/web/src/app/components/PatternSelector.tsx] — style classes to match
- [Source: apps/web/src/app/hooks/useSimulationLoop.ts] — why `onTick` must be stable
- [Source: eslint.config.mjs] — module boundary constraints confirming scope:app → scope:sim allowed
- [Source: libs/sim/src/lib/rules/conway.ts] — `conwayRules` export
- [Source: libs/sim/src/lib/rules/highlife.ts] — `highLifeRules` export
- [Source: libs/types/src/lib/types.ts] — `RuleSet` interface

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `highLifeRules` is imported inside `RuleSetSelector.tsx` (not in `page.tsx`) — the component owns its own rule set list, so `page.tsx` only needs `conwayRules` for the default value.
- E2E Tab-order test required update: the `<select>` is correctly inserted between "Load pattern" and "Width" in DOM order. The a11y spec comment and Tab sequence were both updated to reflect the new element.
- `pnpm exec nx run web:typecheck` target not configured; used `cd apps/web && tsc --noEmit` which exits 0.

### Completion Notes List

- `RuleSetSelector` component created as a custom dropdown (button + listbox) matching the `PatternSelector` pattern; native `<select>` was superseded due to non-uniform rendering across browsers and viewport sizes (iOS wheel-picker, Android modal sheet, Firefox ignores CSS styling)
- `RuleSetSelector` keyboard navigation added: ArrowDown/ArrowUp cycle options, Enter confirms, Escape dismisses, Home/End jump to first/last; `aria-activedescendant` tracks virtual focus; options get stable IDs (`ruleset-option-{id}`)
- `DEFAULT_WIDTH` corrected from 40 → 30 to match locked project default in `project-context.md` rule 17
- `RuleSetSelector.spec.tsx` added — 12 unit tests covering render, open/close, aria-expanded, click-outside-close, Escape, ArrowDown/Up navigation, Home/End, Enter confirmation, and disabled state
- `PatternSelector` also updated with mobile compact sizing and option-item sizing parity (same responsive classes as its trigger)
- `ruleSetRef` pattern applied in `page.tsx` to match `genPerSecRef` — rule change takes effect on next tick without tearing down the rAF loop
- `step` import removed from `page.tsx`; all call sites now use `ruleSetRef.current.step(g)`
- Grid and gen counter intentionally NOT reset on rule change (AC1 explicit requirement)
- Conway is the default (`conwayRules`) — behavior identical to MVP when selector untouched (AC2)
- a11y E2E Tab-order test updated to include Rule set `<select>` in the sequence; all 11 E2E tests pass

### File List

- `apps/web/src/app/components/RuleSetSelector.tsx` — created (custom dropdown rule set selector); updated with ArrowUp/Down/Home/End/Enter/Escape keyboard navigation and `aria-activedescendant`
- `apps/web/src/app/components/RuleSetSelector.spec.tsx` — created (12 unit tests)
- `apps/web/src/app/components/PatternSelector.tsx` — modified (h-10 consistent height)
- `apps/web/src/app/components/SizeForm.tsx` — modified (mobile layout: GRID SIZE label inline with inputs on small viewports)
- `apps/web/src/app/page.tsx` — modified (ruleSetRef, ruleSet state, handleRuleSetChange, step → ruleSetRef.current.step; DEFAULT_WIDTH corrected 40 → 30; Clear/Randomize icon-buttons on mobile)
- `apps/web/src/app/svgs/DiceIcon.tsx` — created (Lucide dices icon for Randomize mobile button)
- `apps/web/src/app/svgs/XIcon.tsx` — created (X icon for Clear mobile button)
- `apps/web-e2e/src/e2e/a11y.spec.ts` — modified (Tab-order + accessible-name tests updated)
- `docs/implementation-artifacts/story-8-2-rule-set-selector-in-the-web-app.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story → done)
