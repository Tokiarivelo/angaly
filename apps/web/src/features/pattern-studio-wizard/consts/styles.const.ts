export interface StyleOption {
  id: string;
  label: string;
  description: string;
}

export const STYLES: StyleOption[] = [
  {
    id: 'CLASSIQUE',
    label: 'Classique & Intemporel',
    description: 'Lignes pures, proportions équilibrées et élégance discrète',
  },
  {
    id: 'MODERNE',
    label: 'Moderne & Contemporain',
    description: 'Coupes architecturales et détails innovants',
  },
  {
    id: 'ELEGANT',
    label: 'Élégant & Raffiné',
    description: 'Allure haute couture sublimée par des tombés fluides',
  },
  {
    id: 'MINIMALISTE',
    label: 'Minimaliste & Épuré',
    description: 'Sobriété des volumes, absence de superflu, accent sur la coupe',
  },
  {
    id: 'TRADITIONNEL',
    label: 'Traditionnel Malgache',
    description: 'Inspirations du lamba et artisanat textile de Madagascar',
  },
  {
    id: 'GLAMOUR',
    label: 'Glamour & Spectaculaire',
    description: 'Silhouettes affirmées, drapés voluptueux et prestance',
  },
];
