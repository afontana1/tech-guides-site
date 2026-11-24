import { test, expect } from '@playwright/test';

const base = '/tech-guides-site';

test('homepage, concepts, and reading pages are navigable', async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next idea');
  await page.getByRole('link', { name: 'PCA', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Principal component analysis');
  await page.locator('.guide-card h3 a').first().click();
  await expect(page.locator('.prose')).not.toBeEmpty();
  await expect(page.locator('.article-toc a').first()).toBeVisible();
  await expect(page.locator('.copy-code').first()).toBeVisible();
  await page.getByRole('button', { name: 'Switch color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/);
});

test('production full-text search supports aliases and combined filters', async ({ page }) => {
  await page.goto(`${base}/search/?q=PCA`);
  await expect(page.locator('.search-result').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#search-notice')).toBeHidden();
  await page.locator('#filter-topic').selectOption('from-scratch');
  await page.locator('#filter-format').selectOption('Implementation');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await expect.poll(async () => [...new Set(await page.locator('.search-result .card-meta span:first-child').allTextContents())]).toEqual(['Build from scratch']);
  await expect.poll(async () => [...new Set(await page.locator('.search-result .card-meta span:last-child').allTextContents())]).toEqual(['Implementation']);
  await page.getByRole('button', { name: 'Clear search & filters' }).click();
  await page.locator('#query').fill('LOOCV');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.search-result').first()).toBeVisible();
  await expect(page.locator('#search-notice')).toBeHidden();
});

test('concept filtering and the mobile layout work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/concepts/`);
  await page.locator('#concept-filter').fill('QLoRA');
  await expect(page.locator('.concept-card:visible')).toHaveCount(1);
  await expect(page.locator('.concept-card:visible h2')).toHaveText('Fine-tuning & alignment');
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
});
