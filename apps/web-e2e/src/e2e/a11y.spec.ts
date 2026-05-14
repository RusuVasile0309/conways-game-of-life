import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('keyboard reachability and accessible names', () => {
  test('has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      serious,
      serious.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  test('all interactive controls are reachable via Tab in DOM order', async ({
    page,
  }) => {
    await page.goto('/');
    // Give the document a focus starting point before Tab navigation.
    // Without this, WebKit does not respond to page.keyboard.press('Tab')
    // because no element holds focus. Setting tabindex="-1" on body makes it
    // programmatically focusable without adding it to the natural Tab order.
    await page.evaluate(
      'document.body.setAttribute("tabindex", "-1"); document.body.focus()',
    );
    // DOM order: Play → Step → Speed slider → Clear → Randomize → Load pattern → Width → Height
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /play simulation/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /step one generation/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('slider', { name: /generations per second/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /clear grid/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /randomize grid/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Load a named pattern')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Width')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Height')).toBeFocused();
  });

  test('Enter activates the Play button', async ({ page }) => {
    await page.goto('/');
    // Randomize first so the grid has alive cells — prevents the empty-grid
    // auto-pause effect from immediately cancelling Play.
    await page.getByRole('button', { name: /randomize grid/i }).click();
    const playBtn = page.getByRole('button', { name: /play simulation/i });
    await playBtn.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('button', { name: /pause simulation/i }),
    ).toBeVisible();
  });

  test('Space activates the Play button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /randomize grid/i }).click();
    const playBtn = page.getByRole('button', { name: /play simulation/i });
    await playBtn.focus();
    await page.keyboard.press('Space');
    await expect(
      page.getByRole('button', { name: /pause simulation/i }),
    ).toBeVisible();
  });

  test('Arrow keys adjust speed slider by 1 gen/sec', async ({ page }) => {
    await page.goto('/');
    const slider = page.getByRole('slider', { name: /generations per second/i });
    await slider.focus();
    const before = Number(await slider.inputValue());
    await page.keyboard.press('ArrowRight');
    expect(Number(await slider.inputValue())).toBe(before + 1);
    await page.keyboard.press('ArrowLeft');
    expect(Number(await slider.inputValue())).toBe(before);
  });

  test('every interactive control has a discernible accessible name', async ({
    page,
  }) => {
    await page.goto('/');
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
    await expect(page.getByLabel('Width')).toBeVisible();
    await expect(page.getByLabel('Height')).toBeVisible();
    await expect(page.getByLabel('Load a named pattern')).toBeVisible();
  });
});
