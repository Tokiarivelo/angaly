import { HttpResponse, http } from 'msw';

/**
 * `POST /api/ateliers/contact-messages` doesn't exist in `apps/api` yet (no `ContactMessage`
 * model — see docs/pages/contact.md "Points d'attention"). Same "mock the not-yet-real
 * endpoint" treatment as home.handlers.ts's newsletter/testimonials mocks.
 */
const API_BASE_URL = 'http://localhost:3003/api';

export const contactHandlers = [
  http.post(`${API_BASE_URL}/ateliers/contact-messages`, () =>
    HttpResponse.json({ success: true, data: { received: true } }),
  ),
];
