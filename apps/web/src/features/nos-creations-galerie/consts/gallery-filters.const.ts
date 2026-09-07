import type { GallerySort } from '../types/gallery.types';

export const GALLERY_PAGE_SIZE = 12;

/**
 * Matches the real Stitch "Nos Créations (Gallery Portfolio)" screen's
 * filter bar labels exactly (GENRE/TYPE/CATÉGORIE/COULEUR/STYLE — no
 * "Événement" dropdown, unlike the 6-filter set stitch-prompts/03-nos-
 * creations-galerie.md alone implied). None of these map to a real Prisma
 * field yet except category (already covered by the real API's
 * `categoryId` param) — rendered as decorative labels for visual fidelity
 * until a taxonomy field exists, same limitation as la-une's inert pills
 * (docs/pages/nos-creations-galerie.md "Points d'attention").
 */
export const DECORATIVE_FILTER_LABELS = ['Genre', 'Type', 'Catégorie', 'Couleur', 'Style'] as const;

export const SORT_OPTIONS: { value: GallerySort; label: string }[] = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'featured', label: 'Mis en avant' },
];
