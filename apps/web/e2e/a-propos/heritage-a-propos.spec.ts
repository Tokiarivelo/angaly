import { expect, test } from '@playwright/test';

test.describe('Héritage / À propos (/a-propos)', () => {
  test('renders all 7 sections with rich imagery, chronology, founder portrait, and CTAs on desktop', async ({
    page,
  }) => {
    await page.goto('/a-propos');

    // Section 1 — Hero
    const heroHeading = page.getByRole('heading', { level: 1, name: 'Notre histoire' });
    await expect(heroHeading).toBeVisible();
    await expect(
      page.getByText('Une maison de couture née à Madagascar, pensée pour durer.'),
    ).toBeVisible();
    const heroImage = page.locator('section').first().locator('img');
    await expect(heroImage).toBeVisible();

    // Section 2 — Notre Histoire & Chronology
    await expect(page.getByRole('heading', { level: 2, name: 'Comment tout a commencé' })).toBeVisible();
    await expect(page.getByText(/Fondée au cœur d'Antananarivo/)).toBeVisible();
    await expect(page.getByText('1998')).toBeVisible();
    await expect(page.getByText('La première esquisse')).toBeVisible();
    await expect(page.getByText('2010')).toBeVisible();
    await expect(page.getByText("L'expansion")).toBeVisible();
    const historyImage = page.getByAltText(/Origines de la maison ANGALY/i);
    await expect(historyImage).toBeVisible();

    // Section 3 — La Fondatrice
    await expect(page.getByRole('heading', { level: 2, name: 'Qui est Angaly ?' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: "L'âme de la maison" })).toBeVisible();
    await expect(
      page.getByText(/Un vêtement n'est pas qu'une parure, c'est une architecture intime/),
    ).toBeVisible();
    const founderImage = page.getByAltText(/Portrait de Madame Angaly/i);
    await expect(founderImage).toBeVisible();

    // Section 4 — Notre Savoir-Faire
    await expect(page.getByRole('heading', { level: 2, name: 'Notre Savoir-Faire' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Couture main' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Patronage sur mesure' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Broderie' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Finitions artisanales' })).toBeVisible();
    await expect(page.getByAltText('Couture main')).toBeVisible();
    await expect(page.getByAltText('Patronage sur mesure')).toBeVisible();

    // Section 5 — Philosophie
    await expect(
      page.getByText(/Nous ne créons pas de la mode pour l'instant présent/),
    ).toBeVisible();

    // Section 6 — L'Atelier Gallery
    await expect(page.getByRole('heading', { level: 2, name: "L'Atelier" })).toBeVisible();
    await expect(page.getByText('Dans les coulisses de la création')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Matières Nobles' })).toBeVisible();

    // Section 7 — Vision & CTAs
    await expect(page.getByRole('heading', { level: 2, name: "Incarnez l'élégance" })).toBeVisible();
    const creationsCta = page.getByRole('link', { name: 'Découvrir nos créations' });
    const rdvCta = page.getByRole('link', { name: 'Prendre rendez-vous' });
    await expect(creationsCta).toBeVisible();
    await expect(rdvCta).toBeVisible();
    await expect(creationsCta).toHaveAttribute('href', '/creations');
    await expect(rdvCta).toHaveAttribute('href', '/prendre-rendez-vous');

    // Verify "Valeurs" section does not exist (fidelity with real Stitch screen)
    await expect(page.locator('text="Excellence"')).toHaveCount(0);

    // Scroll to trigger lazy loading of all images below the fold
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    // Capture desktop screenshot
    await page.screenshot({
      path: '/home/tokiarivelo/.gemini/antigravity-cli/brain/5049ab5c-4413-4a47-94b4-63271543d6cd/heritage_a_propos_desktop.png',
      fullPage: true,
    });
  });

  test('renders responsively on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/a-propos');

    await expect(page.getByRole('heading', { level: 1, name: 'Notre histoire' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Comment tout a commencé' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Qui est Angaly ?' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Notre Savoir-Faire' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: "L'Atelier" })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: "Incarnez l'élégance" })).toBeVisible();

    // Scroll to trigger lazy loading of mobile images
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    // Capture mobile screenshot
    await page.screenshot({
      path: '/home/tokiarivelo/.gemini/antigravity-cli/brain/5049ab5c-4413-4a47-94b4-63271543d6cd/heritage_a_propos_mobile.png',
      fullPage: true,
    });
  });
});
