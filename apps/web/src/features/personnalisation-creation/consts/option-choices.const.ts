export const OPTION_CHOICES = {
  coupe: ['Droite', 'Évasée', 'Sirène', 'Princesse', 'Ajustée', 'Oversize'],
  longueur: ['Courte', 'Mi-longue', 'Longue', 'Sur-mesure'],
  manches: ['Sans manches', 'Courtes', 'Longues', 'Bouffantes', 'Dentelle'],
  decollete: ['Bateau', 'Cœur', 'Bustier', 'Col haut', 'Dos nu'],
  dos: ['Fermé', 'Dos nu', 'Dentelle', 'Boutonné'],
  couleur: ['Ivoire', 'Champagne', 'Marine', 'Blush', 'Noir', 'Personnalisée'], // Can have color hexes associated in UI if needed
  tissu: ['Satin duchesse', 'Dentelle Calais', 'Mousseline', 'Tulle', 'Velours'],
  broderies: ['Perles', 'Fil doré', 'Dentelle brodée', 'Sans broderie'],
  boutons: ['Sans', 'Perle', 'Tissu', 'Cristal', 'Métal'],
  ceinture: ['Sans', 'Fine', 'Large', 'Tissu', 'Bijou'],
  traine: ['Sans', 'Courte', 'Longue', 'Cathédrale', 'Détachable'],
} as const;
