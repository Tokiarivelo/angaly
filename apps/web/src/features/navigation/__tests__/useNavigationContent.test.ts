import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useNavigationContent } from '../hooks/useNavigationContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useNavigationContent', () => {
  it('falls back to the hardcoded default when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useNavigationContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.cta.label).toBe('Prendre rendez-vous');
  });

  it('uses the CMS CTA label for the cta section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/navigation-mobile`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'navigation-mobile',
              sectionKey: 'cta',
              locale: 'FR',
              titleText: null,
              subtitleText: null,
              bodyText: null,
              ctaPrimaryLabel: 'Libellé modifié depuis le CMS',
              ctaSecondaryLabel: null,
              dataJson: null,
              mediaId: null,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useNavigationContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.cta.label).toBe('Libellé modifié depuis le CMS');
  });

  it('falls back to the default for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/navigation-mobile`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => useNavigationContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.cta.label).toBe('Prendre rendez-vous');
  });
});
