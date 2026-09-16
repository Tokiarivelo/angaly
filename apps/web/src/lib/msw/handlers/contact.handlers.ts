import { HttpResponse, http } from 'msw';

/**
 * `POST /api/ateliers/contact-messages` doesn't exist in `apps/api` yet (no `ContactMessage`
 * model — see docs/pages/contact.md "Points d'attention"). Same "mock the not-yet-real
 * endpoint" treatment as home.handlers.ts's newsletter/testimonials mocks.
 *
 * `GET /content/public/contact` is a real endpoint (see docs/features/content.md) — empty by
 * default (no CMS rows in this hermetic test environment) so `useContactContent` falls back
 * to its hardcoded defaults; tests that need CMS-present/draft-only scenarios override this
 * with `server.use(...)`.
 */
const API_BASE_URL = 'http://localhost:3003/api';

export const contactHandlers = [
  http.post(`${API_BASE_URL}/ateliers/contact-messages`, () =>
    HttpResponse.json({ success: true, data: { received: true } }),
  ),
  http.get(`${API_BASE_URL}/content/public/contact`, () => HttpResponse.json({ success: true, data: [] })),
];
