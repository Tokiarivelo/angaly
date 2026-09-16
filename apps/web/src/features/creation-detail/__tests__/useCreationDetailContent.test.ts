import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCreationDetailContent } from '../hooks/useCreationDetailContent';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useCreationDetailContent', () => {
  it('falls back to the hardcoded defaults when the CMS has no rows yet (default MSW handler)', async () => {
    const { result } = renderHook(() => useCreationDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.savoirFaire.title).toBe('Le savoir-faire derrière cette création');
    expect(result.current.data.savoirFaire.paragraph).toBe(
      "Chaque pièce Angaly naît d'un dialogue entre la vision d'une couturière et le geste d'un artisan. Nos ateliers malgaches perpétuent des techniques transmises de génération en génération, du choix des matières les plus nobles jusqu'à la dernière retouche.",
    );
  });

  it('uses the CMS title/body for the savoir-faire section returned by the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/content/public/creation-detail`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              page: 'creation-detail',
              sectionKey: 'savoir-faire',
              locale: 'FR',
              titleText: 'Titre modifié depuis le CMS',
              subtitleText: null,
              bodyText: 'Paragraphe modifié depuis le CMS.',
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

    const { result } = renderHook(() => useCreationDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.savoirFaire.title).toBe('Titre modifié depuis le CMS');
    expect(result.current.data.savoirFaire.paragraph).toBe('Paragraphe modifié depuis le CMS.');
  });

  it('falls back to defaults for a section that only has a DRAFT row (never returned by the public endpoint)', async () => {
    // The public endpoint is PUBLISHED-only by construction — a DRAFT-only
    // section is indistinguishable from "not in the CMS yet" here, which is
    // exactly the fallback behavior under test (see docs/features/content.md).
    server.use(
      http.get(`${API_BASE_URL}/content/public/creation-detail`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const { result } = renderHook(() => useCreationDetailContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.savoirFaire.title).toBe('Le savoir-faire derrière cette création');
  });
});
