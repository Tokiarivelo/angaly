export interface GarmentTypeOption {
  id: string;
  label: string;
  description: string;
  iconName: string;
}

export const GARMENT_TYPES: GarmentTypeOption[] = [
  {
    id: 'ROBE',
    label: 'Robe',
    description: 'Robe de jour, cocktail ou réception',
    iconName: 'Shirt',
  },
  {
    id: 'JUPE',
    label: 'Jupe',
    description: 'Jupe droite, évasée ou plissée',
    iconName: 'Scissors',
  },
  {
    id: 'PANTALON',
    label: 'Pantalon',
    description: 'Pantalon tailleur, fluide ou cigarette',
    iconName: 'Sparkles',
  },
  {
    id: 'VESTE',
    label: 'Veste & Blazer',
    description: 'Veste cintrée, croisée ou kimono',
    iconName: 'Layers',
  },
  {
    id: 'COSTUME',
    label: 'Costume',
    description: 'Ensemble tailleur veste et pantalon/jupe',
    iconName: 'Crown',
  },
  {
    id: 'CHEMISE',
    label: 'Chemise & Blouse',
    description: 'Haut sur-mesure, col tailleur ou lavallière',
    iconName: 'Sparkles',
  },
  {
    id: 'ROBE_MARIEE',
    label: 'Robe de mariée',
    description: 'Création d’exception pour le grand jour',
    iconName: 'Heart',
  },
  {
    id: 'AUTRE',
    label: 'Autre vêtement',
    description: 'Pièce spéciale sur cahier des charges',
    iconName: 'Compass',
  },
];
