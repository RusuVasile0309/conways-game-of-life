import { test, expect } from '@playwright/test';

// Must match GameCanvas.tsx SCALE_DESKTOP (30 px/cell at initial load, camera offset (0,0)).
// Cell (col, row) centre in canvas-relative pixels: (col + 0.5) * CELL_PX, (row + 0.5) * CELL_PX.
const CELL_PX = 30;

test('set 10×10 grid, paint blinker, play, generation advances', async ({ page }) => {
  await page.goto('/');

  // Resize grid to 10×10 via the size form inputs
  await page.getByLabel('Width').fill('10');
  await page.getByLabel('Height').fill('10');

  // Wait for React to flush the grid resize: GameCanvas stamps data-cols/data-rows on the
  // canvas element after each render, so this is deterministic rather than a fixed sleep.
  await page.locator('canvas[data-cols="10"][data-rows="10"]').waitFor();

  // Locate the canvas
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!; // non-null: toBeVisible() asserted above

  // Paint a horizontal blinker: cells (4,5), (5,5), (6,5).
  // Row 5 keeps all 8 neighbours inside the 10×10 grid (minimum 1-cell margin from every edge).
  // Toggle fires on mouseup (stopDrag) when no drag movement occurred.
  for (const col of [4, 5, 6]) {
    await page.mouse.click(
      box.x + (col + 0.5) * CELL_PX,
      box.y + (5 + 0.5) * CELL_PX,
    );
  }

  // Start the simulation
  await page.getByRole('button', { name: 'Play simulation' }).click();

  // Generation counter must advance beyond 0 within a generous window
  await expect(page.getByTestId('gen-count')).not.toHaveText('0', { timeout: 5000 });
});
