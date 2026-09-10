import type { ContentType, FilterPillValue } from '../types/la-une-item.types';

export interface ContentTypeFilterOption {
  value: FilterPillValue;
  label: string;
}

/**
 * Matches the real Stitch "La Une" screen's filter bar (5 pills):
 * Tout, Création du mois, Collection du moment, Sur Mesure, Coulisses.
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
  'sur-mesure': 'Sur Mesure',
  coulisses: 'Coulisses',
  mariage: 'Mariage',
  costume: 'Costume',
  collection: 'Collection',
};

export function contentTypeLabel(contentType: ContentType | null): string | null {
  return contentType ? CONTENT_TYPE_LABELS[contentType] : null;
}
