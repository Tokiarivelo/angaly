import { http, HttpResponse } from 'msw';

/**
 * Default `GET /collections/:slug` fallback — tests needing specific content use `server.use()`.
 *
 * `GET /content/public/collection-detail` is a real endpoint (see docs/features/content.md) —
 * empty by default (no CMS rows in this hermetic test environment) so
 * `useCollectionDetailContent` falls back to its hardcoded defaults; tests that need
 * CMS-present/draft-only scenarios override this with `server.use(...)`.
 */
const API_BASE_URL = 'http://localhost:3003/api';

export const collectionDetailHandlers = [
  http.get(`${API_BASE_URL}/collections/:slug`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'collection-default',
        slug: params['slug'],
        name: 'Collection',
        description: '',
        story: null,
        seasonYear: null,
        publishedAt: '2026-01-01T00:00:00.000Z',
        media: [],
        creationsCount: 0,
        creations: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  }),
  http.get(`${API_BASE_URL}/content/public/collection-detail`, () =>
    HttpResponse.json({ success: true, data: [] }),
  ),
];
