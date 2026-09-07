import type { ContentType, FilterPillValue } from '../types/la-une-item.types';

export interface ContentTypeFilterOption {
  value: FilterPillValue | 'all';
  label: string;
}

/**
 * Matches the real Stitch "La Une" screen's filter bar exactly (5 pills) —
 * not the 8-pill set implied by stitch-prompts/02-la-une.md alone. "Sur
 * Mesure" and "Coulisses" have no backing taxonomy field yet (no `Creation`
 * ever resolves to them) — visual-only filters until a dedicated field
 * exists, per docs/pages/la-une.md "Points d'attention".
 */
export const CONTENT_TYPE_FILTERS: ContentTypeFilterOption[] = [
  { value: 'all', label: 'Tout' },
  { value: 'creation-du-mois', label: 'Création du mois' },
  { value: 'collection-du-moment', label: 'Collection du moment' },
  { value: 'sur-mesure', label: 'Sur Mesure' },
  { value: 'coulisses', label: 'Coulisses' },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'creation-du-mois': 'Création du mois',
  'collection-du-moment': 'Collection du moment',
  mariage: 'Mariage',
  costume: 'Costume',
  collection: 'Collection',
};

export function contentTypeLabel(contentType: ContentType | null): string | null {
  return contentType ? CONTENT_TYPE_LABELS[contentType] : null;
}
