import { expect, test } from '@playwright/test';

test.describe('Nos Créations Galerie (/creations)', () => {
  test('renders initial page with 12 items, loads more to 19, filters by category, and opens quick view', async ({
    page,
  }) => {
    await page.goto('/creations');

    // Check page header and title
    await expect(page.getByRole('heading', { level: 1, name: 'Nos Créations' })).toBeVisible();
    await expect(page.getByText(/\d+\s+créations/i)).toBeVisible();

    // Verify initial 12 cards
    const articles = page.locator('article');
    await expect(articles).toHaveCount(12);

    // Verify Load More button is visible
    const loadMoreBtn = page.getByRole('button', { name: /Voir plus de créations/i });
    await expect(loadMoreBtn).toBeVisible();

    // Click Load More to load all 19 creations
    await loadMoreBtn.scrollIntoViewIfNeeded();
    await loadMoreBtn.click();

    // Verify all 19 cards are rendered
    await expect(articles).toHaveCount(19);
    await expect(loadMoreBtn).not.toBeVisible();

    // Category filter: select 'Robes de mariée'
    await page.evaluate(() => window.scrollTo(0, 0));
    const categorySelect = page.locator('select[aria-label="Catégorie"]').first();
    const marieeOption = await categorySelect.locator('option', { hasText: 'Robes de mariée' }).getAttribute('value');
    if (marieeOption) {
      await categorySelect.selectOption(marieeOption);

      // Verify filtered results
      await expect(articles).toHaveCount(4);
      await expect(page.getByText('4 créations')).toBeVisible();

      // Verify active filter chip
      const activeChip = page.getByRole('button', { name: /Robes de mariée/i }).first();
      await expect(activeChip).toBeVisible();

      // Test Quick View modal on first filtered creation
      const firstCard = articles.first();
      await firstCard.hover();
      const quickViewBtn = firstCard.getByRole('button', { name: /Aperçu rapide/i });
      await quickViewBtn.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('link', { name: /Voir la création/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /Ajouter aux favoris/i })).toBeVisible();

      // Close modal
      await modal.getByRole('button', { name: /Fermer l'aperçu rapide/i }).click();
      await expect(modal).not.toBeVisible();

      // Reset filters
      await page.getByRole('button', { name: /Réinitialiser les filtres/i }).click();
      await expect(articles).toHaveCount(12);
    }
  });
});
