/**
 * Real Stitch "Le Journal (Editorial Listing)" screen's filter pills (spec §43). Filtering
 * is client-side by category `slug` (see `useCategoryFilter.ts`) — no `GET /api/categories`
 * endpoint exists yet to resolve a slug to the `categoryId` the real `/blog-posts` endpoint
 * filters on, and the real article volume is small enough in Phase 1 that fetching
 * everything once and filtering client-side is the simpler, honest choice (same reasoning
 * as `la-une`'s `useContentTypeFilter.ts`).
 */
export const JOURNAL_CATEGORY_FILTERS = [
  { slug: null, label: 'Tout' },
  { slug: 'mariage-a-madagascar', label: 'Mariage à Madagascar' },
  { slug: 'conseils-mode', label: 'Conseils mode' },
  { slug: 'conseils-costume', label: 'Conseils costume' },
  { slug: 'tendances', label: 'Tendances' },
  { slug: 'coulisses-atelier', label: "Coulisses de l'atelier" },
  { slug: 'entretien-vetements', label: 'Entretien des vêtements' },
] as const;

export type JournalCategorySlug = (typeof JOURNAL_CATEGORY_FILTERS)[number]['slug'];

export const ARTICLES_PAGE_SIZE = 3;
