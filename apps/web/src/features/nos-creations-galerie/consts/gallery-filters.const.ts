import type { GallerySort } from '../types/gallery.types';

export const GALLERY_PAGE_SIZE = 12;

export const GENRE_OPTIONS = ['Femme', 'Homme'] as const;

export const TYPE_OPTIONS = ['Mariage', 'Soirée', 'Costume', 'Sur mesure', 'Coulisses'] as const;

export const COLOR_OPTIONS = [
  'Blanc',
  'Ivoire',
  'Noir',
  'Bleu Nuit',
  'Doré',
  'Champagne',
  'Gris',
  'Or',
] as const;

export const STYLE_OPTIONS = [
  'Classique',
  'Moderne',
  'Glamour',
  'Minimaliste',
  'Traditionnel',
  'Artisanal',
] as const;

export const SORT_OPTIONS: { value: GallerySort; label: string }[] = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'featured', label: 'Mis en avant' },
];
