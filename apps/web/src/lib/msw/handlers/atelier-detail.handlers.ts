import { HttpResponse, http } from 'msw';

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Empty
 * by default (no CMS rows in this hermetic test environment) so
 * `useAtelierDetailContent` falls back to its hardcoded defaults — tests
 * that need CMS-present/draft-only scenarios override this with
 * `server.use(...)`.
 */
const API_BASE_URL = 'http://localhost:3003/api';

export const atelierDetailHandlers = [
  http.get(`${API_BASE_URL}/content/public/atelier-detail`, () => {
    return HttpResponse.json({ success: true, data: [] });
  }),
];
