import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useLaUneContent } from '../hooks/useLaUneContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useLaUneContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useLaUneContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.header.eyebrow).toBe('Éditorial');
    expect(result.current.data.header.title).toBe('LA UNE');
    expect(result.current.data.header.subtitle).toBe(
      "Les créations qui incarnent l'univers Angaly — sélectionnées et renouvelées par la maison.",
    );
  });

  it('uses the CMS title/subtitle/eyebrow for the header section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/la-une`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'la-une',
              sectionKey: 'header',
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
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useLaUneContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.header.title).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.header.subtitle).toBe('Sous-titre modifié depuis le CMS');
    expect(result.current.data.header.eyebrow).toBe('EYEBROW MODIFIÉ');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/la-une`, () => HttpResponse.json({ success: true, data: [] })),
    );

    const { result } = renderHook(() => useLaUneContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.header.title).toBe('LA UNE');
  });

  it('falls back to the default eyebrow when dataJson has no eyebrow field', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/la-une`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'la-une',
              sectionKey: 'header',
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

    const { result } = renderHook(() => useLaUneContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.header.eyebrow).toBe('Éditorial');
  });
});
