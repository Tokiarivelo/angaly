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
];
