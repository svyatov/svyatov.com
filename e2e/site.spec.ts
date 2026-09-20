import { expect, test } from '@playwright/test';
import { htmlRoutes, sampleRoutes } from '../scripts/routes';

// A post with images and code fences, for the clipboard and reflow checks.
const article = '/blog/learn-big-o-by-measuring-it-in-ruby/';

test('help has a name, traps focus, isolates shortcuts, and restores focus', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The footer help button is hidden on phones.');
  await page.goto('/');
  const help = page.getByRole('button', { name: '?', exact: true });
  await help.click();
  const dialog = page.getByRole('dialog', { name: 'Hotkeys' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('checkbox')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('b');
  await expect(page).toHaveURL('/');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(help).toBeFocused();
});

test('shortcut preference persists and help remains reachable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The footer help button is hidden on phones.');
  await page.goto('/');
  await page.keyboard.press('?');
  await page.getByRole('checkbox').uncheck();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.keyboard.press('b');
  await page.keyboard.press('?');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: '?', exact: true }).click();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('checkbox').check();
  await page.keyboard.press('Escape');
  await page.keyboard.press('b');
  await expect(page).toHaveURL('/blog/');
});

test('filters expose their state and row shortcuts skip hidden projects', async ({ page }) => {
  await page.goto('/projects/');
  const filter = page.locator('[data-filter] button[data-language="Ruby"]');
  await filter.focus();
  await page.keyboard.press('Enter');
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  const rows = page.locator('main a[data-item]:visible');
  expect(await rows.count()).toBeGreaterThan(0);
  await page.keyboard.press('j');
  await expect(rows.first()).toBeFocused();
  for (let i = 0; i < (await rows.count()); i++) {
    await expect(rows.nth(i)).toHaveAttribute('data-language', 'Ruby');
  }
  await page.locator('[data-filter] button[data-language=""]').click();
  await expect(page.locator('main a[data-item].hidden\\!')).toHaveCount(0);
});

test('banner supports keyboard activation and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const banner = page.getByRole('button', { name: 'Change banner font' });
  const before = await banner.textContent();
  const height = (await banner.boundingBox())?.height;
  await banner.focus();
  await page.keyboard.press('Enter');
  await expect(banner).not.toHaveText(before ?? '');
  expect((await banner.boundingBox())?.height).toBe(height);
  await expect(page.locator('.cursor-blink').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('h1 .invisible')).toHaveCount(0);
});

test('clipboard success and failure have live announcements', async ({ page }) => {
  await page.goto(article);
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    }),
  );
  await page.getByRole('button', { name: 'Copy code', exact: true }).first().click();
  await expect(page.getByRole('status')).toHaveText('Code copied to clipboard.');
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Permission denied');
        },
      },
    }),
  );
  await page.keyboard.press('y');
  await expect(page.getByRole('status')).toHaveText(
    'Copy failed. Select the text and copy it manually.',
  );
});

test('skip link is the first focus target and moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('404 has error status, no canonical and working help', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Hotkeys' })).toBeVisible();
});

test('mobile menu supports keyboard navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The mobile menu is hidden on desktop.');
  await page.goto('/');
  await expect(page.locator('summary')).toHaveAccessibleName('Open menu');
  await page.locator('summary').focus();
  await page.keyboard.press('Enter');
  await page.locator('details nav a[href="/projects/"]').click();
  await expect(page).toHaveURL('/projects/');
});

test('cursor motion ends within five seconds', async ({ page }) => {
  await page.goto('/');
  // CSS animations use the document timeline, which Playwright's JS clock does not advance.
  await page.waitForTimeout(5100);
  expect(
    await page
      .locator('.cursor-blink')
      .first()
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
});

for (const route of new Set([...sampleRoutes(), article, '/404.html'])) {
  test(`reflow and visual evidence: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await testInfo.attach('page', {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });
    await page.setViewportSize({ width: 320, height: 800 });
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('main *')]
        .filter((element) => element.getBoundingClientRect().right > innerWidth)
        .map((element) => element.outerHTML.slice(0, 300)),
    }));
    expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
    await page.setViewportSize({ width: 640, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.getBoundingClientRect().width <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press('?');
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
    await testInfo.attach('help-zoom', { body: await page.screenshot(), contentType: 'image/png' });
  });
}

for (const route of htmlRoutes()) {
  test(`page and local assets work: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const image of await page.locator('main img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(
        await image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      ).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });
}
