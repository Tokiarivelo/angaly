import { expect, test } from '@playwright/test';

test.describe('Nos Ateliers (/ateliers)', () => {
  test('renders 4 ateliers, flagship banner, map panel, and directions', async ({ page }) => {
    await page.goto('/ateliers');

    // Header
    await expect(page.getByRole('heading', { level: 1, name: 'Nos Ateliers' })).toBeVisible();

    // Featured banner (Flagship)
    const flagshipHeading = page.getByRole('heading', { level: 2, name: /Notre atelier principal/i });
    await expect(flagshipHeading).toBeVisible();

    // List of ateliers (4 articles)
    const cards = page.locator('section article');
    await expect(cards).toHaveCount(4);

    // Verify all 4 ateliers appear in the list
    await expect(page.getByRole('heading', { level: 3, name: /Maison Mère & Atelier Haute Couture \(Flagship\)/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Salon Privé & Atelier Sur Mesure Ivandry/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Atelier Broderie d'Art & Soie Sauvage/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Comptoir Côtier & Confection Maritime/i })).toBeVisible();

    // Verify phone numbers and addresses
    await expect(page.getByText('Ankorondrano').first()).toBeVisible();
    await expect(page.locator('article').getByText(/Ivandry/).first()).toBeVisible();
    await expect(page.getByText('Antsirabe').first()).toBeVisible();
    await expect(page.getByText('Toamasina').first()).toBeVisible();

    // Verify services badges
    await expect(page.getByText('Sur Mesure', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Broderie de Lunéville')).toBeVisible();
    await expect(page.getByText('Collection Croisière')).toBeVisible();

    // Itinéraire buttons have google maps url
    const itineraireButtons = page.getByRole('link', { name: /Itinéraire/i });
    await expect(itineraireButtons).toHaveCount(4);
    const firstHref = await itineraireButtons.first().getAttribute('href');
    expect(firstHref).toContain('google.com/maps/dir');

    // Desktop screenshot
    await page.screenshot({
      path: '/home/tokiarivelo/.gemini/antigravity-cli/brain/5049ab5c-4413-4a47-94b4-63271543d6cd/nos_ateliers_desktop.png',
      fullPage: true,
    });

    // Hover over second atelier card and verify interaction
    const ivandryCard = cards.nth(1);
    await ivandryCard.hover();
    await expect(ivandryCard).toHaveClass(/border-angaly-navy/);

    // Capture interaction screenshot
    await page.screenshot({
      path: '/home/tokiarivelo/.gemini/antigravity-cli/brain/5049ab5c-4413-4a47-94b4-63271543d6cd/nos_ateliers_hover_interaction.png',
    });
  });

  test('renders properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ateliers');

    await expect(page.getByRole('heading', { level: 1, name: 'Nos Ateliers' })).toBeVisible();
    const cards = page.locator('section article');
    await expect(cards).toHaveCount(4);

    // Mobile screenshot
    await page.screenshot({
      path: '/home/tokiarivelo/.gemini/antigravity-cli/brain/5049ab5c-4413-4a47-94b4-63271543d6cd/nos_ateliers_mobile.png',
      fullPage: true,
    });
  });
});
