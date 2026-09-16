import { HttpResponse, http } from 'msw';

/** Default `GET /creations/:slug` fallback — tests needing specific content use `server.use()`. */
const API_BASE_URL = 'http://localhost:3003/api';

export const creationDetailHandlers = [
  http.get(`${API_BASE_URL}/creations/:slug`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'creation-default',
        slug: params['slug'],
        name: 'Création',
        description: '',
        materials: null,
        techniques: null,
        availability: 'DISPONIBLE',
        reproducible: true,
        isFeatured: false,
        featuredFrom: null,
        featuredUntil: null,
        category: { id: 'cat-default', slug: 'creations', name: 'Créations' },
        collection: null,
        media: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  }),

  /**
   * Real endpoint — see docs/features/content.md ("Endpoint public"). Empty
   * by default (no CMS rows in this hermetic test environment) so
   * `useCreationDetailContent` falls back to its hardcoded defaults — tests
   * that need CMS-present/draft-only scenarios override this with
   * `server.use(...)`.
   */
  http.get(`${API_BASE_URL}/content/public/creation-detail`, () => {
    return HttpResponse.json({ success: true, data: [] });
  }),
];
