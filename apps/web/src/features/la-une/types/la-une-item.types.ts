/**
 * Prisma has no editorial-taxonomy field (spec §6.3) — only `isFeatured`
 * exists. `null` means the item genuinely can't be tagged from real data
 * (shows under "Tout" only) rather than guessing, see docs/pages/la-une.md
 * "Points d'attention".
 */
export type ContentType =
  | 'creation-du-mois'
  | 'collection-du-moment'
  | 'sur-mesure'
  | 'coulisses'
  | 'mariage'
  | 'costume'
  | 'collection';

/**
 * Filter pills matching the Stitch "La Une" screen.
 */
export type FilterPillValue =
  | 'all'
  | 'creation-du-mois'
  | 'collection-du-moment'
  | 'sur-mesure'
  | 'coulisses';

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
