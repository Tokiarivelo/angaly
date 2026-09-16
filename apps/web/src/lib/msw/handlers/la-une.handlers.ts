import { HttpResponse, http } from 'msw';

/**
 * `/creations` is already mocked by home.handlers.ts (single featured item) —
 * reused here for the happy path. Only `/collections` is new: no other
 * feature calls it yet, so its default here is the global "no featured
 * collection" case; tests needing one use `server.use()` to override.
 */
const API_BASE_URL = 'http://localhost:3003/api';

const EMPTY_PAGE_META = {
  total: 0,
  page: 1,
  limit: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const laUneHandlers = [
  http.get(`${API_BASE_URL}/collections`, () => {
    return HttpResponse.json({
      success: true,
      data: { data: [], meta: EMPTY_PAGE_META },
    });
  }),

  /**
   * Real endpoint — see docs/features/content.md ("Endpoint public"). Empty
   * by default (no CMS rows in this hermetic test environment) so
   * `useLaUneContent` falls back to its hardcoded defaults — tests that need
   * CMS-present/draft-only scenarios override this with `server.use(...)`.
   */
  http.get(`${API_BASE_URL}/content/public/la-une`, () => {
    return HttpResponse.json({ success: true, data: [] });
  }),
];
