import { HttpResponse, http } from 'msw';

const API_BASE_URL = 'http://localhost:3003/api';

/**
 * Catch-all for `GET /content/public/:page` — pages/components that read their copy through `useCmsPage`
 * (footer, menus, sur-mesure, Pattern Studio, contact channels…) get "no CMS rows" by default so they fall back
 * to their built-in copy. Registered after the per-page handlers, which take precedence; a test needing CMS
 * content overrides it with `server.use(...)`.
 */
export const cmsHandlers = [
  http.get(`${API_BASE_URL}/content/public/:page`, () => HttpResponse.json({ success: true, data: [] })),
];
