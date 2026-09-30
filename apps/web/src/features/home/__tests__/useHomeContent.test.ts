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

  const section = (sectionKey: string, extra: Record<string, unknown>) => ({
    page: 'accueil',
    sectionKey,
    locale: 'FR',
    titleText: null,
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  });

  it('builds the univers tiles from the single editable list (label, image, alt, link), in order', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            section('univers', {
              titleText: 'Nos univers',
              dataJson: {
                items: [
                  { label: 'Cérémonie', imageUrl: 'https://cdn.example/a.jpg', imageAlt: 'Robe', href: '/creations' },
                  { label: 'Accessoires', imageUrl: null, href: null },
                  { label: '' },
                ],
              },
            }),
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data.categories.items).toHaveLength(2));
    expect(result.current.data.categories.headline).toBe('Nos univers');
    expect(result.current.data.categories.items[0]).toMatchObject({ label: 'Cérémonie', imageUrl: 'https://cdn.example/a.jpg', imageAlt: 'Robe', href: '/creations' });
    expect(result.current.data.categories.items[1]).toMatchObject({ label: 'Accessoires', href: '/creations' });
  });

  it('keeps the four default tiles when the CMS has no (or an empty) univers list', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({ success: true, data: [section('univers', { dataJson: { items: [] } })] }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.categories.items.map((item) => item.label)).toEqual(['Mariage', 'Costumes', 'Soirée', 'Sur Mesure']);
  });

  it('builds the sur-mesure steps from the editable list', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            section('sur-mesure', {
              titleText: 'Sur mesure',
              ctaPrimaryLabel: 'Commencer',
              dataJson: { steps: [{ label: 'Rencontre', description: 'On se voit' }, { label: 'Livraison', description: 'Prêt' }] },
            }),
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data.surMesure.steps).toHaveLength(2));
    expect(result.current.data.surMesure.headline).toBe('Sur mesure');
    expect(result.current.data.surMesure.cta).toBe('Commencer');
  });

  it('requests the content in the visitor’s locale', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('locale'));
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(seen).toContain('FR'));
  });

  it('uses the image chosen in the CMS (media) for a section, and keeps defaults for the others', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'accueil',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: null,
              subtitleText: null,
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: null,
              mediaId: 'media-1',
              media: { id: 'media-1', url: 'https://cdn.example/from-cms.jpg', altText: 'Choisie dans le CMS' },
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data.hero.imageUrl).toBe('https://cdn.example/from-cms.jpg'));
    expect(result.current.data.hero.imageAlt).toBe('Choisie dans le CMS');
    expect(result.current.data.maison.imageUrl).toMatch(/unsplash/);
  });

  it('lets the CMS image win over an alt-text-matched library media', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'accueil',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: null,
              subtitleText: null,
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: null,
              mediaId: 'media-1',
              media: { id: 'media-1', url: 'https://cdn.example/from-cms.jpg', altText: 'Choisie dans le CMS' },
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
      http.get(`${API_BASE_URL}/media`, () =>
        HttpResponse.json({
          success: true,
          data: {
            data: [
              { id: 'guess', url: 'https://cdn.example/guessed.jpg', altText: 'Robe haute couture', mimeType: 'image/jpeg', width: null, height: null, entityType: 'PAGE_SECTION', entityId: null, sortOrder: 0 },
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.hero.imageUrl).toBe('https://cdn.example/from-cms.jpg');
  });

  it('takes the remaining home titles (La Une, ateliers, journal, newsletter) from the CMS', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/accueil`, () =>
        HttpResponse.json({
          success: true,
          data: [
            section('la-une', { titleText: 'À la Une', ctaPrimaryLabel: 'Tout voir' }),
            section('ateliers', { titleText: 'Nos lieux' }),
            section('journal', { titleText: 'Actualités' }),
            section('newsletter', { titleText: 'Inscrivez-vous' }),
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useHomeContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data.laUne.headline).toBe('À la Une'));
    expect(result.current.data.laUne.cta).toBe('Tout voir');
    expect(result.current.data.ateliersTeaser.headline).toBe('Nos lieux');
    expect(result.current.data.journalTeaser.headline).toBe('Actualités');
    expect(result.current.data.newsletter.headline).toBe('Inscrivez-vous');
  });
});
