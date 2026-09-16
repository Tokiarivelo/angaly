import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useHomeContent } from '../hooks/useHomeContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useHomeContent', () => {
  it('returns the home content with hero, categories and images', () => {
    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    expect(result.current.data.hero.headline).toBe('ANGALY');
    expect(result.current.data.hero.imageUrl).toBeDefined();
    expect(result.current.data.maison.imageUrl).toBeDefined();
    expect(result.current.data.categories.items).toHaveLength(4);
    expect(result.current.data.categories.items[0]?.imageUrl).toBeDefined();
    expect(result.current.data.patternStudio.imageUrl).toBeDefined();
    expect(result.current.data.surMesure.steps).toHaveLength(7);
  });

  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.headline).toBe('ANGALY');
    expect(result.current.data.maison.headline).toBe('Une maison de couture pensée pour vous.');
  });

  it('uses the CMS text for a section returned by the public endpoint (hero + pattern-studio)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'accueil',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: 'Titre modifié depuis le CMS',
              subtitleText: 'Sous-titre modifié depuis le CMS',
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: { eyebrow: 'EYEBROW MODIFIÉ' },
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              page: 'accueil',
              sectionKey: 'pattern-studio',
              locale: 'FR',
              titleText: 'Studio modifié',
              subtitleText: 'EYEBROW STUDIO',
              bodyText: 'Paragraphe modifié.',
              ctaPrimaryLabel: 'CTA modifié',
              ctaSecondaryLabel: null,
              dataJson: null,
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.headline).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.hero.subheading).toBe('Sous-titre modifié depuis le CMS');
    expect(result.current.data.hero.eyebrow).toBe('EYEBROW MODIFIÉ');
    expect(result.current.data.patternStudio.headline).toBe('Studio modifié');
    expect(result.current.data.patternStudio.eyebrow).toBe('EYEBROW STUDIO');
    expect(result.current.data.patternStudio.paragraph).toBe('Paragraphe modifié.');
    expect(result.current.data.patternStudio.cta).toBe('CTA modifié');
    // A section the CMS didn't return (maison) still falls back to its hardcoded default.
    expect(result.current.data.maison.headline).toBe('Une maison de couture pensée pour vous.');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () => HttpResponse.json({ success: true, data: [] })),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.headline).toBe('ANGALY');
    expect(result.current.data.hero.subheading).toBe("L'élégance, créée pour vous.");
  });

  it('maps the univers-* sections onto the matching categories.items label by index', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'accueil',
              sectionKey: 'univers-mariage',
              locale: 'FR',
              titleText: 'Mariage modifié',
              subtitleText: null,
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

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.categories.items[0]?.label).toBe('Mariage modifié');
    expect(result.current.data.categories.items[1]?.label).toBe('Costumes');
  });
});
