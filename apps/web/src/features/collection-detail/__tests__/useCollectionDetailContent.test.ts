import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCollectionDetailContent } from '../hooks/useCollectionDetailContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useCollectionDetailContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useCollectionDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.closingCta.headline).toBe('Vous souhaitez porter une pièce de cette collection ?');
    expect(result.current.data.closingCta.ctaPrimaryLabel).toBe('Prendre rendez-vous');
    expect(result.current.data.closingCta.ctaSecondaryLabel).toBe('Voir toutes les collections');
  });

  it('uses the CMS headline/CTA labels for the closing-cta section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/collection-detail`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'collection-detail',
              sectionKey: 'closing-cta',
              locale: 'FR',
              titleText: 'Titre modifié depuis le CMS',
              subtitleText: null,
              bodyText: null,
              ctaPrimaryLabel: 'CTA primaire modifié',
              ctaSecondaryLabel: 'CTA secondaire modifié',
              dataJson: null,
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useCollectionDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.closingCta.headline).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.closingCta.ctaPrimaryLabel).toBe('CTA primaire modifié');
    expect(result.current.data.closingCta.ctaSecondaryLabel).toBe('CTA secondaire modifié');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/collection-detail`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => useCollectionDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.closingCta.ctaPrimaryLabel).toBe('Prendre rendez-vous');
  });
});
