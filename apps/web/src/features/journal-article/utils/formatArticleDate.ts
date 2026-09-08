/**
 * Same implementation as journal-liste's own `formatArticleDate` — kept feature-local per
 * feature-sliced isolation (same precedent as nos-ateliers-liste/atelier-detail's duplicated
 * `buildDirectionsUrl`), unlike `ArticleCard` below which the page doc explicitly asks to
 * reuse rather than duplicate.
 */
export function formatArticleDate(publishedAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(publishedAt));
}
