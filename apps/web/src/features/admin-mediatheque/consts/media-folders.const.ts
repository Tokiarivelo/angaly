import { MediaEntityType } from '@angaly/types';

/**
 * UI folder chips (stitch-prompts/31-*.md Écran B: "Toutes, Créations, Produits, Collections,
 * Ateliers, Blog, Patrons, Avatars") mapped to `MediaEntityType`. `GET /api/media` only
 * filters on a single `entityType`, so "Produits" queries `PRODUCT` only — `PRODUCT_VARIANT`
 * (colorway photos, see docs/features/products.md) stays visible under "Toutes" only, a
 * documented gap rather than a silent one (a future session can widen `ListMediaQueryDto` to
 * accept several entity types if this needs fixing).
 * `PAGE_SECTION` (admin-gestion-contenu content images) and `QUOTE_DOCUMENT` (sur-mesure
 * request attachments) have no dedicated chip in the Stitch prompt either — both stay visible
 * only under "Toutes", a decision documented in docs/pages/admin-mediatheque.md rather than
 * left silent, per that page's own open question.
 */
export interface MediaFolder {
  id: string;
  label: string;
  entityType: MediaEntityType | null;
}

export const MEDIA_FOLDERS: MediaFolder[] = [
  { id: 'toutes', label: 'Toutes', entityType: null },
  { id: 'creations', label: 'Créations', entityType: MediaEntityType.CREATION },
  { id: 'produits', label: 'Produits', entityType: MediaEntityType.PRODUCT },
  { id: 'collections', label: 'Collections', entityType: MediaEntityType.COLLECTION },
  { id: 'ateliers', label: 'Ateliers', entityType: MediaEntityType.ATELIER },
  { id: 'blog', label: 'Blog', entityType: MediaEntityType.BLOG_POST },
  { id: 'patrons', label: 'Patrons', entityType: MediaEntityType.PATTERN_EXPORT },
  { id: 'avatars', label: 'Avatars', entityType: MediaEntityType.CUSTOMER_AVATAR },
];
