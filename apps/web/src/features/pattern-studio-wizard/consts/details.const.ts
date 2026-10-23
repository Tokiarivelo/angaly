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
      { id: 'EVEQUE', label: 'Manches évêque' },
      { id: 'CLOCHE', label: 'Manches cloche / trompette' },
      { id: 'LANTERNE', label: 'Manches lanterne' },
      { id: 'RAGLAN', label: 'Manches raglan' },
      { id: 'KIMONO', label: 'Manches kimono' },
      { id: 'CAP', label: 'Manches cap (épaule)' },
      { id: 'TAILLEUR', label: 'Manches tailleur (deux pièces, poignet)' },
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
      { id: 'CHALE', label: 'Col châle / revers' },
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
      { id: 'EN_U', label: 'En U' },
      { id: 'HORS_EPAULES', label: 'Hors épaules (bardot)' },
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
      { id: 'GENOU', label: 'Au genou' },
      { id: 'MIDI', label: 'Midi (mi-mollet)' },
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
      { id: 'CORDELIERE', label: 'Cordelière nouée' },
      { id: 'ZIP_DEVANT', label: 'Zip apparent devant' },
      { id: 'BOUTONS_TAILLE', label: 'Boutonnage jusqu’à la taille' },
      { id: 'BRAGUETTE_ZIP', label: 'Braguette zippée' },
      { id: 'BRAGUETTE_BOUTONS', label: 'Braguette à boutons' },
      { id: 'ZIP_COTE', label: 'Zip invisible côté' },
      { id: 'ELASTIQUE', label: 'À enfiler (élastique)' },
    ],
  },
  {
    id: 'corsage',
    label: 'Corsage',
    options: [
      { id: 'LISSE', label: 'Corsage lisse' },
      { id: 'FRONCES_SOUS_POITRINE', label: 'Fronces sous la poitrine (empiècement)' },
      { id: 'CROISE_FRONCE', label: 'Devant croisé froncé (cache-cœur)' },
      { id: 'BALEINE', label: 'Corsage baleiné (corset)' },
      { id: 'PRINCESSE', label: 'Découpes princesse (corsage en panneaux)' },
    ],
  },
  {
    id: 'taille',
    label: 'Taille',
    options: [
      { id: 'NATURELLE', label: 'Couture à la taille naturelle' },
      { id: 'BASSE', label: 'Taille basse (basque sur les hanches)' },
      { id: 'HAUTE', label: 'Taille haute / empire (couture sous la poitrine)' },
      { id: 'POINTE', label: 'Taille en pointe (corsage en V au milieu devant)' },
    ],
  },
  {
    id: 'devant',
    label: 'Devant',
    options: [
      { id: 'FERME', label: 'Devant fermé' },
      { id: 'MANTEAU_OUVERT', label: 'Robe-manteau ouverte sur un plastron' },
      { id: 'MANTEAU_REVERS', label: 'Robe-manteau à revers rabattus sur un plastron' },
      { id: 'GILET', label: 'Corsage ouvert sur un gilet (cuirasse)' },
    ],
  },
  {
    id: 'jupe',
    label: 'Jupe',
    options: [
      { id: 'DEUX_PANS', label: 'Deux panneaux (devant et dos)' },
      { id: 'EN_LES', label: 'En lés (devant, côtés, dos)' },
    ],
  },
  {
    id: 'basque',
    label: 'Basque',
    options: [
      { id: 'AUCUNE', label: 'Sans basque' },
      { id: 'POINTES', label: 'Gilet terminé en pointes' },
      { id: 'PANS_CROISES', label: 'Pointes et pans croisés sur la jupe' },
    ],
  },
  {
    id: 'ceinture',
    label: 'Ceinture',
    options: [
      { id: 'DROITE', label: 'Ceinture droite' },
      { id: 'FORMEE', label: 'Ceinture large galbée' },
      { id: 'ELASTIQUEE', label: 'Ceinture élastiquée' },
      { id: 'COULISSE', label: 'Coulisse à cordon' },
      { id: 'SANS', label: 'Sans ceinture (parementure)' },
    ],
  },
  {
    id: 'plis',
    label: 'Plis & pinces',
    options: [
      { id: 'AUCUN', label: 'Devant plat' },
      { id: 'PINCES', label: 'Pinces' },
      { id: 'UN_PLI', label: 'Un pli' },
      { id: 'DEUX_PLIS', label: 'Deux plis' },
    ],
  },
  {
    id: 'poches',
    label: 'Poches devant',
    options: [
      { id: 'AUCUNE', label: 'Sans poche' },
      { id: 'ITALIENNES', label: 'Poches italiennes (en biais)' },
      { id: 'COUTURE', label: 'Poches dans la couture' },
      { id: 'PLAQUEES', label: 'Poches plaquées' },
    ],
  },
  {
    id: 'poches_dos',
    label: 'Poches dos',
    options: [
      { id: 'AUCUNE', label: 'Sans poche dos' },
      { id: 'PASSEPOIL', label: 'Poches passepoilées' },
      { id: 'PLAQUEES', label: 'Poches plaquées dos' },
    ],
  },
  {
    id: 'bas',
    label: 'Bas de jambe',
    options: [
      { id: 'OURLET', label: 'Ourlet simple' },
      { id: 'REVERS', label: 'Revers' },
    ],
  },
  {
    id: 'fente',
    label: 'Fente',
    options: [
      { id: 'AUCUNE', label: 'Sans fente' },
      { id: 'DOS', label: 'Fente milieu dos' },
      { id: 'COTE', label: 'Fente côté' },
    ],
  },
];
