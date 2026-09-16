import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useAtelierDetailContent } from '../hooks/useAtelierDetailContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useAtelierDetailContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useAtelierDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.tagline).toBe('Le cœur de la création sur mesure');
    expect(result.current.data.hero.precisionTileLabel).toBe("L'art de la précision");
  });

  it('uses the CMS tagline/precisionTileLabel for the hero section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/atelier-detail`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'atelier-detail',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: null,
              subtitleText: 'Tagline modifiée depuis le CMS',
              bodyText: null,
              ctaPrimaryLabel: null,
              ctaSecondaryLabel: null,
              dataJson: { precisionTileLabel: 'Libellé modifié' },
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useAtelierDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.tagline).toBe('Tagline modifiée depuis le CMS');
    expect(result.current.data.hero.precisionTileLabel).toBe('Libellé modifié');
  });

  it('falls back to the default precisionTileLabel when dataJson has no precisionTileLabel field', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/atelier-detail`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'atelier-detail',
              sectionKey: 'hero',
              locale: 'FR',
              titleText: null,
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

    const { result } = renderHook(() => useAtelierDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.precisionTileLabel).toBe("L'art de la précision");
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/atelier-detail`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => useAtelierDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.hero.tagline).toBe('Le cœur de la création sur mesure');
  });
});
