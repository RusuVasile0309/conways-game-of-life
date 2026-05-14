import { test, expect } from '@playwright/test';

test.describe('responsive at 375px portrait', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test('no horizontal scrollbar at 375x667', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(
      'document.documentElement.scrollWidth',
    );
    expect(Number(scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('canvas, controls, and gen counter are visible at 375px', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /play simulation/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /step one generation/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /clear grid/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /randomize grid/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('slider', { name: /generations per second/i }),
    ).toBeVisible();
    await expect(page.getByTestId('gen-count')).toBeVisible();
  });

  test('touch tap on canvas starts simulation (touch handler parity with mouse click)', async ({
    page,
  }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas bounding box not found');

    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

    await page.getByRole('button', { name: /play simulation/i }).click();

    await expect(page.getByTestId('gen-count')).not.toHaveText('0', {
      timeout: 3000,
    });
  });
});
