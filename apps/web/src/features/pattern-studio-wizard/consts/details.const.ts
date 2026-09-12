export interface DetailGroup {
  id: string;
  label: string;
  options: { id: string; label: string }[];
}

export const DETAIL_GROUPS: DetailGroup[] = [
  {
    id: 'manches',
    label: 'Manches',
    options: [
      { id: 'SANS_MANCHES', label: 'Sans manches' },
      { id: 'COURTES', label: 'Manches courtes' },
      { id: 'TROIS_QUARTS', label: 'Manches 3/4' },
      { id: 'LONGUES', label: 'Manches longues' },
      { id: 'BALLON', label: 'Manches ballon' },
      { id: 'PAPILLON', label: 'Manches papillon / évasées' },
    ],
  },
  {
    id: 'col',
    label: 'Col',
    options: [
      { id: 'SANS_COL', label: 'Sans col / Encolure simple' },
      { id: 'ROND', label: 'Col rond' },
      { id: 'EN_V', label: 'Col en V' },
      { id: 'BATEAU', label: 'Encolure bateau' },
      { id: 'CHEMISIER', label: 'Col chemisier classique' },
      { id: 'OFFICIER', label: 'Col officier / Mao' },
      { id: 'LAVALLIERE', label: 'Col lavallière' },
    ],
  },
  {
    id: 'decollete',
    label: 'Décolleté',
    options: [
      { id: 'SAGE', label: 'Sage / Ras du cou' },
      { id: 'MOYEN', label: 'Modéré' },
      { id: 'PLONGEANT', label: 'Plongeant' },
      { id: 'COEUR', label: 'En cœur' },
      { id: 'CARRE', label: 'Carré' },
    ],
  },
  {
    id: 'dos',
    label: 'Dos',
    options: [
      { id: 'FERME', label: 'Dos couvert' },
      { id: 'DECOLLETE_V', label: 'Décolleté en V' },
      { id: 'DOS_NU', label: 'Dos nu plongeant' },
      { id: 'GOUTTE', label: 'Ouverture goutte' },
      { id: 'TRANSPARENT', label: 'Dentelle illusion' },
    ],
  },
  {
    id: 'longueur',
    label: 'Longueur',
    options: [
      { id: 'MINI', label: 'Mini (au-dessus du genou)' },
      { id: 'MIDI', label: 'Midi (au genou / mi-mollet)' },
      { id: 'MAXI', label: 'Maxi (aux chevilles)' },
      { id: 'SOL', label: 'Longueur sol' },
      { id: 'ASYMETRIQUE', label: 'Asymétrique' },
    ],
  },
  {
    id: 'fermeture',
    label: 'Fermeture & Ceinture',
    options: [
      { id: 'ZIP_INVISIBLE', label: 'Zip invisible dos' },
      { id: 'BOUTONS', label: 'Boutonnage devant' },
      { id: 'CEINTURE_NOUEE', label: 'Ceinture à nouer amovible' },
      { id: 'CEINTURE_INTEGREE', label: 'Ceinture incrustée surpiquée' },
      { id: 'AUCUNE', label: 'Ligne pure sans découpe' },
    ],
  },
];
