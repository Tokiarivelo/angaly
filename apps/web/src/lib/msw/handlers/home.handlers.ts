import { HttpResponse, http } from 'msw';

/**
 * MSW mocks every endpoint `home` calls, including the real ones
 * (`creations`/`ateliers`/`blog-posts` have a working backend — see
 * docs/features/*.md — but unit tests must stay hermetic, no live API).
 * `testimonials`/`newsletter` mock endpoints that don't exist yet
 * (`reviews`/`notifications` are Phase 2+ — see docs/pages/home.md).
 */
const API_BASE_URL = 'http://localhost:3003/api';

const PAGINATED_META = {
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const homeHandlers = [
  http.get(`${API_BASE_URL}/creations`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          {
            id: 'creation-1',
            slug: 'robe-eternelle',
            name: 'Robe Éternelle',
            description: 'Une robe de mariée intemporelle.',
            materials: null,
            techniques: null,
            availability: 'PIECE_UNIQUE',
            reproducible: true,
            isFeatured: true,
            featuredFrom: null,
            featuredUntil: null,
            category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
            collection: null,
            media: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: PAGINATED_META,
      },
    });
  }),

  http.get(`${API_BASE_URL}/ateliers`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'atelier-1',
          slug: 'antananarivo-centre',
          name: 'Atelier Antananarivo Centre',
          address: '12 Rue de la Paix',
          city: 'Antananarivo',
          phone: null,
          openingHours: null,
          services: [],
          latitude: null,
          longitude: null,
          media: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/blog-posts`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          {
            id: 'post-1',
            slug: 'choisir-sa-robe-de-mariee',
            title: 'Choisir sa robe de mariée',
            excerpt: 'Nos conseils pratiques.',
            publishedAt: '2026-01-01T00:00:00.000Z',
            category: { id: 'cat-2', slug: 'conseils-mode', name: 'Conseils mode' },
            author: { id: 'user-1', email: 'redaction@angaly.mg' },
            media: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: PAGINATED_META,
      },
    });
  }),

  http.get(`${API_BASE_URL}/media`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [],
        meta: PAGINATED_META,
      },
    });
  }),

  /**
   * Real endpoint — see docs/features/content.md ("Endpoint public"). Empty
   * by default (no CMS rows in this hermetic test environment) so
   * `useHomeContent` falls back to `DEFAULT_HOME_CONTENT` — tests that need
   * CMS-present/draft-only scenarios override this with `server.use(...)`.
   */
  http.get(`${API_BASE_URL}/content/public/accueil`, () => {
    return HttpResponse.json({ success: true, data: [] });
  }),

  http.get(`${API_BASE_URL}/testimonials`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'testimonial-1',
          clientName: 'Nirina',
          creationLabel: 'Robe de mariée — Collection Éternelle',
          quote: 'Angaly a su donner vie à la robe dont je rêvais depuis toujours.',
          verified: true,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fm=jpg',
        },
        {
          id: 'testimonial-2',
          clientName: 'Hery',
          creationLabel: 'Costume sur mesure',
          quote: 'Un savoir-faire rare et une écoute attentive à chaque étape.',
          verified: true,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fm=jpg',
        },
        {
          id: 'testimonial-3',
          clientName: 'Fara',
          creationLabel: 'Robe de soirée',
          quote: "Une élégance intemporelle, exactement ce que j'imaginais.",
          verified: false,
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80&fm=jpg',
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/newsletter/subscribe`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'email is required' },
          statusCode: 400,
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({ success: true, data: { subscribed: true } });
  }),
];
