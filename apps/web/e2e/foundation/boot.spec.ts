import { expect, test } from '@playwright/test';

// Smoke test for Phase 0 — confirms the app boots and serves the foundation
// placeholder. Replaced by real home-page e2e coverage in Phase 1
// (docs/pages/home.md).
test('the app boots and serves the ANGALY placeholder at /', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'ANGALY' })).toBeVisible();
});
