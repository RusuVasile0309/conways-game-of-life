---
story: "4.3"
title: "Responsive verification at 375px portrait"
status: review
created: 2026-05-14
---

# Story 4.3: Responsive verification at 375px portrait

Status: review

## Story

As a mobile user,
I want a Playwright spec that asserts the app is usable at 375px portrait,
So that NFR1 has a real, repeatable verification rather than a one-time manual check.

**Priority:** MVP
**FR/NFR coverage:** FR11, NFR1
**Estimated effort:** S

## Acceptance Criteria

**AC1 — No horizontal scrollbar:**
Given a Playwright spec configured with a 375×667 viewport,
When the spec navigates to `/`,
Then `document.documentElement.scrollWidth <= 375` (viewport width).

**AC2 — Canvas, controls, and gen counter visible in-viewport:**
Given the same spec at 375×667,
When the page has loaded,
Then the canvas, all primary controls (Play/Pause, Step, Clear, Randomize, speed slider), and the gen counter are all visible in-viewport without scrolling.
The canvas must be rendered 20% smaller in height on small-height screens (≤ 667px, e.g. iPhone SE) so controls remain in-viewport (current `54vh` → `43.2vh`).

**AC3 — Touch cell toggle:**
Given the same spec with touch enabled (`hasTouch: true`),
When the user taps a cell on the canvas via `page.touchscreen.tap(x, y)`,
Then the cell toggles alive, verified by: Play starts and the gen counter advances (grid non-empty → loop does not auto-pause), proving touch handler parity with mouse click.

## Tasks / Subtasks

- [x] Task 0 — Reduce canvas height 20% on small-height screens (AC2 prerequisite)
  - [x] In `apps/web/src/app/game.css`, add `@media (max-height: 667px)` block overriding `.game-canvas-wrap { height: calc(54vh * 0.8) }` (= `43.2vh`)
  - [x] Verify locally at 375×667 that controls panel is visible below canvas

- [x] Task 1 — Create responsive Playwright spec (AC1, AC2, AC3)
  - [x] Create `apps/web-e2e/src/e2e/responsive.spec.ts`
  - [x] Use `test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true })` (see debug log — `devices['iPhone SE']` cannot be used in describe group)
  - [x] Test AC1: assert `document.documentElement.scrollWidth <= 375`
  - [x] Test AC2: assert canvas, all controls, and gen-count are visible
  - [x] Test AC3: `page.touchscreen.tap()` at canvas center → click Play → assert gen-count != '0'

- [x] Task 2 — Update sprint-status.yaml
  - [x] Updated to `review`

## Dev Notes

### Task 0 — Canvas height reduction on small-height screens

**Current canvas height** (from `apps/web/src/app/game.css`):
```css
.game-canvas-wrap {
  width: 100%;
  height: 54vh;   /* mobile default */
}
@media (min-width: 1024px) {
  .game-canvas-wrap {
    width: 70%;
    height: 70vh;   /* desktop */
  }
}
```

At 667px viewport height (iPhone SE): `54vh = 360px`. At 20% smaller: `360 × 0.8 = 288px = 43.2vh`.

**Add to `game.css`** — a `max-height` media query targeting small-height screens:

```css
@media (max-height: 667px) {
  .game-canvas-wrap {
    height: calc(54vh * 0.8);  /* 43.2vh on iPhone SE — 20% reduction */
  }
}
```

Place this block after the existing `@media (min-width: 1024px)` block to ensure correct cascade order. The `max-height` query is independent of `min-width`, so it applies at any width below 667px viewport height.

**Why this approach:**
- Surgical: only overrides `height`, nothing else
- No JS changes needed — pure CSS
- `calc(54vh * 0.8)` is explicit about the 20% intent
- Targets `≤ 667px` height which is the iPhone SE breakpoint; taller phones (iPhone 12 at 844px, SE 3rd gen at 667px) benefit cleanly

**No changes to GameCanvas.tsx or page.tsx required** — the canvas element fills its container via `ResizeObserver` on `containerRef`. Reducing the container height in CSS automatically reduces canvas height.

### Spec file location and naming

Place the new spec at: `apps/web-e2e/src/e2e/responsive.spec.ts`

The `nxE2EPreset` in `playwright.config.ts` uses `testDir: './src'` which matches `**/*.spec.ts` — no config changes needed. Existing config runs Chromium only.

### Mobile viewport and touch setup

Use explicit viewport/touch properties in `test.use()` inside the describe block:

```typescript
test.describe('responsive at 375px portrait', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
```

**Do NOT use `{ ...devices['iPhone SE'] }` inside a describe block.** `devices['iPhone SE']` includes `defaultBrowserType: 'webkit'` which Playwright forbids in a describe-scoped `test.use()` — it forces a new worker and throws at startup. Specifying `viewport`, `hasTouch`, and `isMobile` manually avoids this and gives equivalent behavior on Chromium.

`hasTouch: true` is required for `page.touchscreen.tap()` to fire real `touchstart/touchmove/touchend` events — touch events silently fail on desktop Chrome contexts without it.

### AC1 — Horizontal scrollbar assertion

```typescript
test('no horizontal scrollbar at 375×667', async ({ page }) => {
  await page.goto('/');
  const scrollWidth = await page.evaluate(
    'document.documentElement.scrollWidth',  // string form — avoids dom lib errors in e2e tsconfig
  );
  expect(Number(scrollWidth)).toBeLessThanOrEqual(375);
});
```

Use the string form of `page.evaluate` (not an arrow function) — story 4.2 debug log: arrow-function form causes TypeScript `dom` lib errors because the e2e tsconfig does not include `dom` lib types. String form bypasses this.

### AC2 — Visible elements

All controls are in a single-column flex layout at 375px (Tailwind `lg:flex-row` → `flex-col` below 1024px breakpoint). The `<main>` is `h-screen overflow-hidden`, so elements stay in-viewport rather than scrolling. Asserting `toBeVisible()` is sufficient — no scroll needed.

```typescript
test('canvas, controls, and gen counter are visible at 375px', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: /play simulation/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /step one generation/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /clear grid/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /randomize grid/i })).toBeVisible();
  await expect(page.getByRole('slider', { name: /generations per second/i })).toBeVisible();
  await expect(page.getByTestId('gen-count')).toBeVisible();
});
```

`data-testid="gen-count"` is the `<span>` wrapping `{generation}` in `page.tsx:126` — established in story 4.1.

### AC3 — Touch tap cell toggle

The touch handler in `GameCanvas.tsx` fires on `touchend` when: single touch, movement < 5px, and `!isRunningRef.current`. `page.touchscreen.tap(x, y)` satisfies all conditions.

**Strategy for verifying cell toggled alive:**

The page has this `useEffect`:
```tsx
useEffect(() => {
  if (isRunning && !grid.cells.some(Boolean)) {
    setIsRunning(false);  // auto-pause on empty grid
  }
}, [grid, isRunning]);
```

If the tap registers a live cell → Play runs → gen counter advances.
If the tap missed or touch didn't fire → grid stays empty → Play auto-pauses → gen stays at 0.

This gives a reliable, non-brittle behavioral assertion:

```typescript
test('tap on canvas toggles a cell alive (touch parity with mouse)', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas bounding box not found');

  // Tap at canvas center — well within any grid size (default 40×30)
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

  // Play the simulation — will auto-pause immediately if no cells alive
  await page.getByRole('button', { name: /play simulation/i }).click();

  // Gen counter must advance — proves at least one cell was alive after tap
  await expect(page.getByTestId('gen-count')).not.toHaveText('0', { timeout: 3000 });
});
```

**Why `not.toHaveText('0')` works:**
- Default genPerSec = 10 → first tick at ~100ms. At 3000ms timeout there are ~30 chances to advance.
- Auto-pause `useEffect` fires synchronously on the render after Play is clicked — well before the first rAF tick at 100ms. So gen stays at 0 if grid is empty.
- This is timing-tolerant per project-context rule 19 (`>= 1`, not exact count).

### Touch handler internals (GameCanvas.tsx)

The tap detection logic (lines 231–256):

```typescript
const onTouchEnd = (e: TouchEvent) => {
  if (
    tapStart &&
    e.changedTouches.length === 1 &&
    e.touches.length === 0 &&
    !isRunningRef.current          // must be paused
  ) {
    const t = e.changedTouches[0];
    const dx = t.clientX - tapStart.x;
    const dy = t.clientY - tapStart.y;
    if (Math.abs(dx) + Math.abs(dy) < 5) {   // movement < 5px = tap
      const rect = canvas.getBoundingClientRect();
      const { offsetX, offsetY, scale } = cameraRef.current;
      const col = Math.floor((t.clientX - rect.left) / scale + offsetX);
      const row = Math.floor((t.clientY - rect.top) / scale + offsetY);
      if (col >= 0 && col < g.width && row >= 0 && row < g.height) {
        onCellToggleRef.current(col, row);
      }
    }
  }
};
```

The canvas starts at `offsetX: 0, offsetY: 0, scale: 30` (SCALE_MOBILE = 30). Tapping at canvas center `(box.width/2, box.height/2)` maps to approximately `(col=7, row=5)` on a default 40×30 grid — well within bounds.

### Responsive layout details

At 375px, the Tailwind class `lg:flex-row` on `.game-content` falls back to `flex-col`, stacking the canvas and controls vertically. The `<main>` uses `h-screen overflow-hidden`, so:
- Canvas fills available width
- Controls panel is below the canvas
- No horizontal scrollbar (canvas scales to container width via ResizeObserver)
- No vertical scrollbar (everything fits in `h-screen` with `overflow-hidden`)

The `game.css` and `GameCanvas.tsx` use `ResizeObserver` to size the canvas to its container — at 375px the canvas container width is 375px minus any padding/border (current: `border-2` = 4px, so ~371px canvas width).

### Complete spec reference

```typescript
import { test, expect } from '@playwright/test';

test.describe('responsive at 375px portrait', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test('no horizontal scrollbar at 375×667', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(
      'document.documentElement.scrollWidth',
    );
    expect(Number(scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('canvas, controls, and gen counter are visible at 375px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('button', { name: /play simulation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /step one generation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear grid/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /randomize grid/i })).toBeVisible();
    await expect(page.getByRole('slider', { name: /generations per second/i })).toBeVisible();
    await expect(page.getByTestId('gen-count')).toBeVisible();
  });

  test('tap on canvas toggles a cell alive (touch parity with mouse)', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas bounding box not found');

    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

    await page.getByRole('button', { name: /play simulation/i }).click();

    await expect(page.getByTestId('gen-count')).not.toHaveText('0', { timeout: 3000 });
  });
});
```

### File locations

| Action | File |
|---|---|
| Canvas height CSS fix (20% reduction ≤667px height) | `apps/web/src/app/game.css` |
| New responsive spec | `apps/web-e2e/src/e2e/responsive.spec.ts` |
| Update sprint status | `docs/implementation-artifacts/sprint-status.yaml` |

### Project Structure Notes

- `apps/web-e2e/src/e2e/` is the spec directory — `nxE2EPreset` with `testDir: './src'` auto-discovers `**/*.spec.ts`
- No changes to `playwright.config.ts` needed — `devices` is imported in the spec itself via `test.use()`
- The `@temp-nx/web-e2e` package scope (from create-nx-workspace generator) — if installing additional deps, filter with `--filter @temp-nx/web-e2e`. No new deps required for this story.
- Nx tag for `web-e2e` remains `scope:e2e` — no boundary impact

### Architecture compliance

- Architecture §7.1: Playwright E2E lives in `apps/web-e2e/src/e2e/` ✓
- Architecture §7.5 / NFR1: responsive 375px portrait verification is the explicit scope of this story ✓
- Project-context rule 19: use `not.toHaveText('0')` with a generous timeout — not an exact gen count assertion ✓
- No new library dependencies, no changes to production code, no changes to `playwright.config.ts`

### Previous story intelligence (4.1 + 4.2)

**From 4.1 (happy-path.spec.ts):**
- Pattern: `page.click({position: {x, y}})` on canvas → Play → `expect.poll` on gen-count. We adapt this with touchscreen.tap instead of click.
- `data-testid="gen-count"` on `<span>` at `page.tsx:126`
- Playwright webServer: `reuseExistingServer: true` on port 3000

**From 4.2 (a11y.spec.ts):**
- Use string form of `page.evaluate()` — NOT arrow function — to avoid dom lib TypeScript errors
- `test.use()` at describe level works for per-describe settings (confirmed by a11y approach)
- `canvas.boundingBox()` is available — 4.1 used it for click coordinates
- The canvas element has no `data-testid` — locate via `page.locator('canvas')` (only one canvas in the DOM)

### References

- [Source: docs/planning-artifacts/epics.md#Story-4.3] — story ACs
- [Source: docs/planning-artifacts/architecture.md#7.5] — NFR1 responsive requirement
- [Source: docs/planning-artifacts/architecture.md#4.3] — Canvas + touch handler strategy
- [Source: docs/project-context.md#3, rule 19] — no exact gen count assertions
- [Source: apps/web/src/app/components/GameCanvas.tsx#170-267] — touch handler implementation
- [Source: apps/web/src/app/page.tsx#41-45] — empty-grid auto-pause useEffect
- Playwright devices: https://playwright.dev/docs/emulation#devices

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (story context creation + implementation, 2026-05-14)

### Debug Log References

- `devices['iPhone SE']` cannot be spread inside a `test.describe` `test.use()` — it includes `defaultBrowserType: 'webkit'` which Playwright forbids in describe-scoped overrides ("forces a new worker"). Fixed by using explicit `{ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true }` which gives identical behavior on Chromium.

### Completion Notes List

- All 3 ACs satisfied: AC1 (no horizontal scroll), AC2 (canvas + all controls + gen-count visible at 375×667), AC3 (touch tap → cell alive → gen advances)
- Task 0: `game.css` — added `@media (max-height: 667px)` reducing `.game-canvas-wrap` height by 20% (`calc(54vh * 0.8)`)
- Task 1: `responsive.spec.ts` — 3 tests, all pass in ~1s on Chromium
- Full regression suite: 11/11 pass (happy-path, a11y, responsive, example)
- No new npm dependencies; no changes to `playwright.config.ts`, `page.tsx`, or `GameCanvas.tsx`

### File List

- `apps/web/src/app/game.css` — added `@media (max-height: 667px)` block (canvas 20% smaller on small-height screens)
- `apps/web-e2e/src/e2e/responsive.spec.ts` — new responsive E2E spec (3 tests)
- `docs/implementation-artifacts/sprint-status.yaml` — story status → review
- `docs/implementation-artifacts/story-4-3-responsive-verification-at-375px-portrait.md` — this file
