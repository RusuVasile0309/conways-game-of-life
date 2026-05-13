import { test, expect } from '@playwright/test';

// GameCanvas renders each cell at SCALE_DESKTOP = 30px with camera offset (0,0) on load.
// Cell (col, row) center in canvas-relative pixels: (col + 0.5) * 30, (row + 0.5) * 30.
const CELL_PX = 30;

test('set 10×10 grid, paint blinker, play, generation advances', async ({ page }) => {
  await page.goto('/');

  // Resize grid to 10×10 via the size form inputs
  await page.getByLabel('Width').fill('10');
  await page.getByLabel('Height').fill('10');

  // Wait for React to flush the grid resize before clicking cells,
  // otherwise clicks may land on the old grid which is then wiped by the resize.
  await page.waitForTimeout(300);

  // Locate the canvas
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box not found');

  // Paint a horizontal blinker: cells (4,5), (5,5), (6,5).
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
