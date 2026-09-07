/**
 * Prisma has no editorial-taxonomy field (spec §6.3) — only `isFeatured`
 * exists. `null` means the item genuinely can't be tagged from real data
 * (shows under "Tout" only) rather than guessing, see docs/pages/la-une.md
 * "Points d'attention".
 */
export type ContentType = 'creation-du-mois' | 'collection-du-moment' | 'mariage' | 'costume' | 'collection';

/**
 * Real Stitch screen filter bar (screen `aa4b25a90d8d44c1975e8b86c4898854`) has
 * exactly 5 pills — "Sur Mesure" and "Coulisses" have no backing taxonomy
 * field yet (see content-type-filters.const.ts), so they never match a real
 * item until a dedicated field exists.
 */
export type FilterPillValue = ContentType | 'sur-mesure' | 'coulisses';

export interface LaUneItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  contentType: ContentType | null;
  date: string | null;
  href: string;
}
