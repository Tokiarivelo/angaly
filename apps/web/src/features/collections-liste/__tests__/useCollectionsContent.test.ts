import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCollectionsContent } from '../hooks/useCollectionsContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useCollectionsContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useCollectionsContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.header.title).toBe('Nos Collections');
    expect(result.current.data.header.subtitle).toBe(
      'Chaque collection raconte une histoire, une saison, une inspiration.',
    );
  });

  it('uses the CMS title/subtitle for the header section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/collections-liste`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'collections-liste',
              sectionKey: 'header',
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

    const { result } = renderHook(() => useCollectionsContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.header.title).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.header.subtitle).toBe('Sous-titre modifié depuis le CMS');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/collections-liste`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => useCollectionsContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.header.title).toBe('Nos Collections');
  });
});
