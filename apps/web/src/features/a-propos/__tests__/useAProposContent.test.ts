import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useAProposContent } from '../hooks/useAProposContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useAProposContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.title).toBe('Notre histoire');
    expect(result.current.data.histoire.chronology).toHaveLength(2);
    expect(result.current.data.savoirFaire.items).toHaveLength(4);
    expect(result.current.data.atelier.items).toHaveLength(4);
  });

  it('keeps exactly 2 decorative icon tiles and 2 real-photo tiles in "Notre Savoir-Faire"', async () => {
    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const withPhoto = result.current.data.savoirFaire.items.filter((item) => item.imageUrl !== null);
    const withIcon = result.current.data.savoirFaire.items.filter((item) => item.icon !== null);

    expect(withPhoto).toHaveLength(2);
    expect(withIcon).toHaveLength(2);
  });

  it('provides high-resolution media URLs for hero, histoire, fondatrice, and atelier', async () => {
    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.imageUrl).toBeTruthy();
    expect(result.current.data.hero.imageUrl).toMatch(/^https?:\/\//);
    expect(result.current.data.histoire.imageUrl).toBeTruthy();
    expect(result.current.data.fondatrice.imageUrl).toBeTruthy();
    expect(result.current.data.atelier.items.filter((i) => i.imageUrl !== null).length).toBe(3);
  });

  it('uses the CMS title/subtitle for a section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/a-propos`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'a-propos',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: 'Titre modifié depuis le CMS',
              subtitleText: 'Sous-titre modifié depuis le CMS',
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: null,
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.title).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.hero.subtitle).toBe('Sous-titre modifié depuis le CMS');
    // Sections the CMS didn't return still fall back to their hardcoded defaults.
    expect(result.current.data.vision.title).toBe("Incarnez l'élégance");
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/a-propos`, () => HttpResponse.json({ success: true, data: [] })),
    );

    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.vision.title).toBe("Incarnez l'élégance");
    expect(result.current.data.vision.paragraph).toBe(
      'Découvrez des pièces uniques où chaque détail a été pensé pour sublimer votre allure.',
    );
  });

  it('merges the CMS chronology/quote/items dataJson for histoire, fondatrice, and savoir-faire', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/a-propos`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'a-propos',
              sectionKey: 'histoire',
              locale: 'FR',
              titleText: null,
              subtitleText: null,
              bodyText: 'Premier paragraphe modifié.\n\nSecond paragraphe modifié.',
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: { chronology: [{ year: '2026', title: 'Nouvelle étape', description: 'Description.' }] },
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              page: 'a-propos',
              sectionKey: 'fondatrice',
              locale: 'FR',
              titleText: null,
              subtitleText: null,
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: { quote: 'Nouvelle citation.' },
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useAProposContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.histoire.paragraphs).toEqual(['Premier paragraphe modifié.', 'Second paragraphe modifié.']);
    expect(result.current.data.histoire.chronology).toEqual([
      { year: '2026', title: 'Nouvelle étape', description: 'Description.' },
    ]);
    expect(result.current.data.fondatrice.quote).toBe('Nouvelle citation.');
    // savoirFaire wasn't in this CMS response — falls back entirely.
    expect(result.current.data.savoirFaire.items).toHaveLength(4);
  });
});
