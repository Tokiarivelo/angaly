import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { usePage404Content } from '../hooks/usePage404Content';

const API_BASE_URL = 'http://localhost:3003/api';

describe('usePage404Content', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => usePage404Content(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.main.title).toBe("Cette création semble avoir disparu de l'atelier...");
    expect(result.current.data.main.subtitle).toBe("La page que vous cherchez n'existe plus ou a été déplacée.");
  });

  it('uses the CMS title/subtitle for the main section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/page-404`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'page-404',
              sectionKey: 'main',
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

    const { result } = renderHook(() => usePage404Content(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.main.title).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.main.subtitle).toBe('Sous-titre modifié depuis le CMS');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/page-404`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => usePage404Content(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.main.title).toBe("Cette création semble avoir disparu de l'atelier...");
  });
});
