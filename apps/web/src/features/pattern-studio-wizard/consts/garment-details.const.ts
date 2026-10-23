import { DETAIL_GROUPS_BY_GARMENT, type PatternDetailGroup } from '@angaly/types';
import { CUTS, type CutOption } from './cuts.const';
import { DETAIL_GROUPS, type DetailGroup } from './details.const';

/** Which base the wizard draws for a garment type: the sketches follow the garment chosen. */
export type SketchGarment = 'dress' | 'top' | 'skirt' | 'trousers' | 'suit';

export const sketchGarmentFor = (garmentType: string): SketchGarment => {
  switch (garmentType) {
    case 'JUPE':
      return 'skirt';
    case 'PANTALON':
      return 'trousers';
    case 'VESTE':
    case 'CHEMISE':
      return 'top';
    case 'COSTUME':
      return 'suit';
    default:
      return 'dress';
  }
};

/** Detail groups each garment's pattern rule reads: one list shared with the API (`@angaly/types`). */
const GROUPS_BY_GARMENT = DETAIL_GROUPS_BY_GARMENT;

/** A dress's closures and waist seam, which trousers and skirts do not have (and the other way round). */
const DRESS_CLOSURES = ['ZIP_INVISIBLE', 'BOUTONS', 'CEINTURE_NOUEE', 'CEINTURE_INTEGREE', 'AUCUNE', 'CORDELIERE', 'ZIP_DEVANT', 'BOUTONS_TAILLE'];
const BOTTOM_CLOSURES = ['BRAGUETTE_ZIP', 'BRAGUETTE_BOUTONS', 'ZIP_COTE', 'ELASTIQUE'];

/** Options that do not exist on a garment (an off-the-shoulder jacket, an asymmetric trouser hem…). */
const HIDDEN_OPTIONS: Partial<Record<SketchGarment, Partial<Record<PatternDetailGroup, readonly string[]>>>> = {
  dress: { fermeture: BOTTOM_CLOSURES },
  top: { decollete: ['HORS_EPAULES'], fermeture: BOTTOM_CLOSURES },
  suit: { decollete: ['HORS_EPAULES'], longueur: ['ASYMETRIQUE'] },
  trousers: { longueur: ['ASYMETRIQUE'], fermeture: DRESS_CLOSURES, taille: ['POINTE'] },
  skirt: {
    fermeture: DRESS_CLOSURES.filter((c) => c !== 'ZIP_INVISIBLE' && c !== 'BOUTONS').concat(['BRAGUETTE_ZIP', 'BRAGUETTE_BOUTONS']),
    taille: ['POINTE'],
    plis: ['UN_PLI', 'DEUX_PLIS'],
  },
};

type OptionText = { label?: string; description?: string };

/** What a group or an option means on this garment, when it differs from the dress's wording. */
const GROUP_LABELS: Partial<Record<SketchGarment, Partial<Record<PatternDetailGroup, string>>>> = {
  trousers: { longueur: 'Longueur de jambe', taille: 'Hauteur de taille', fermeture: 'Fermeture' },
  suit: {
    longueur: 'Longueur du pantalon',
    manches: 'Manches de la veste',
    col: 'Col de la veste',
    decollete: 'Encolure de la veste',
    plis: 'Plis du pantalon',
    poches: 'Poches devant du pantalon',
    poches_dos: 'Poches dos du pantalon',
    bas: 'Bas du pantalon',
  },
  skirt: { longueur: 'Longueur de jupe', taille: 'Hauteur de taille', fermeture: 'Fermeture', plis: 'Pinces' },
  top: { longueur: 'Longueur du haut' },
};

/** Rise of trousers and skirts (the dress's `taille` is its waist seam). */
const BOTTOM_RISE: Record<string, OptionText> = {
  NATURELLE: { label: 'Taille normale', description: 'Le haut du vêtement se pose à la taille naturelle.' },
  HAUTE: { label: 'Taille haute', description: 'Monte d’environ 4 cm au-dessus de la taille : allonge la jambe.' },
  BASSE: { label: 'Taille basse', description: 'Se pose environ 4 cm sous la taille, sur les hanches.' },
};

const OPTION_TEXT: Partial<Record<SketchGarment, Partial<Record<PatternDetailGroup, Record<string, OptionText>>>>> = {
  skirt: {
    taille: BOTTOM_RISE,
    fermeture: {
      ZIP_INVISIBLE: { label: 'Zip invisible dos', description: 'Fermeture à glissière cachée dans la couture du milieu dos.' },
      BOUTONS: { label: 'Boutonnage devant', description: 'Jupe boutonnée sur toute la hauteur du devant.' },
    },
    plis: {
      AUCUN: { label: 'Sans pince', description: 'Devant lisse : l’ajustement se fait par les coutures de côté.' },
      PINCES: { label: 'Pinces', description: 'Pinces sous la ceinture qui ajustent la taille sur les hanches.' },
    },
  },
  trousers: {
    taille: BOTTOM_RISE,
    longueur: {
      MINI: { label: 'Short', description: 'Jambe coupée en haut de cuisse, environ 45 % de la longueur.' },
      GENOU: { label: 'Bermuda', description: 'Jambe arrêtée juste au-dessus du genou.' },
      MIDI: { label: 'Pantacourt', description: 'Jambe arrêtée à mi-mollet.' },
      MAXI: { label: 'Longueur cheville', description: 'Longueur classique, l’ourlet effleure la cheville.' },
      SOL: { label: 'Longueur sol (talons)', description: 'Un peu plus long que la cheville : couvre le talon des chaussures.' },
    },
  },
  suit: {
    longueur: {
      MINI: { label: 'Short', description: 'Pantalon du costume coupé en haut de cuisse.' },
      GENOU: { label: 'Bermuda', description: 'Pantalon arrêté juste au-dessus du genou.' },
      MIDI: { label: 'Pantacourt', description: 'Pantalon arrêté à mi-mollet.' },
      MAXI: { label: 'Longueur cheville', description: 'Pantalon de costume classique, à la cheville.' },
      SOL: { label: 'Longueur sol (talons)', description: 'Pantalon couvrant le talon des chaussures.' },
    },
  },
  top: {
    longueur: {
      MINI: { label: 'Courte (crop)', description: 'S’arrête au-dessus de la taille.' },
      GENOU: { label: 'Aux hanches', description: 'Longueur classique d’une veste ou d’une chemise.' },
      MIDI: { label: 'Sous les hanches', description: 'Couvre les hanches, un peu plus longue que la normale.' },
      MAXI: { label: 'Mi-cuisse (tunique)', description: 'Descend à mi-cuisse : tunique, veste longue.' },
      SOL: { label: 'Longue (manteau)', description: 'Descend vers le genou et au-delà : redingote, manteau.' },
      ASYMETRIQUE: { label: 'Asymétrique', description: 'Plus courte d’un côté que de l’autre.' },
    },
  },
};

/** What each option does to the pattern (the dress's wording; garments with their own wording override it). */
const OPTION_DESCRIPTIONS: Record<PatternDetailGroup, Record<string, string>> = {
  manches: {
    SANS_MANCHES: 'Emmanchure finie sans manche : épaules et bras dégagés.',
    COURTES: 'Manche courte montée, arrêtée au-dessus du coude.',
    TROIS_QUARTS: 'Manche arrêtée entre le coude et le poignet.',
    LONGUES: 'Manche montée jusqu’au poignet, ajustée au bras.',
    BALLON: 'Manche gigot : très ample et bouffante en haut, ajustée sur l’avant-bras.',
    PAPILLON: 'Manche courte évasée qui s’ouvre en volant sur le haut du bras.',
    EVEQUE: 'Manche longue qui s’élargit vers le bas, froncée dans un poignet.',
    CLOCHE: 'Manche qui s’évase en trompette vers le poignet, sans poignet.',
    LANTERNE: 'Manche bouffante froncée en haut et en bas, renflée au milieu.',
    RAGLAN: 'Manche taillée d’un seul tenant jusqu’au col, couture en biais.',
    KIMONO: 'Manche coupée dans le corsage, sans couture d’emmanchure.',
    CAP: 'Petite manche qui couvre juste le haut de l’épaule.',
    TAILLEUR: 'Manche longue ajustée en deux pièces, coude marqué, finie par un poignet rapporté.',
  },
  col: {
    SANS_COL: 'Encolure simple à la base du cou, sans pièce de col.',
    ROND: 'Encolure ronde, sans pièce de col.',
    EN_V: 'Encolure en pointe sur le devant.',
    BATEAU: 'Encolure large et peu profonde, d’une épaule à l’autre.',
    CHEMISIER: 'Col rabattu à pointes, avec pied de col.',
    OFFICIER: 'Col droit montant autour du cou, sans rabat.',
    LAVALLIERE: 'Col prolongé de deux pans noués en lavallière.',
    CHALE: 'Col et revers d’un seul tenant, arrondi, croisé sur le devant.',
  },
  decollete: {
    SAGE: 'Encolure haute, près du cou.',
    MOYEN: 'Encolure arrondie, quelques centimètres sous le cou.',
    PLONGEANT: 'V profond jusqu’au milieu de la poitrine.',
    COEUR: 'Bord en double arrondi qui dessine un cœur sur la poitrine.',
    CARRE: 'Encolure à angles droits, bord horizontal sur la poitrine.',
    EN_U: 'Encolure profonde aux côtés droits et au fond arrondi.',
    HORS_EPAULES: 'Bord qui passe sous les épaules, laissées nues (bardot).',
  },
  dos: {
    FERME: 'Dos entièrement couvert jusqu’au cou.',
    DECOLLETE_V: 'Dos ouvert en V entre les omoplates.',
    DOS_NU: 'Dos largement dégagé jusqu’à la taille.',
    GOUTTE: 'Petite ouverture en goutte sous la nuque.',
    TRANSPARENT: 'Empiècement de dentelle ou de tulle sur le haut du dos.',
  },
  longueur: {
    MINI: 'Ourlet au-dessus du genou.',
    GENOU: 'Ourlet au niveau du genou.',
    MIDI: 'Ourlet à mi-mollet.',
    MAXI: 'Ourlet aux chevilles.',
    SOL: 'Ourlet qui touche le sol.',
    ASYMETRIQUE: 'Ourlet plus court d’un côté que de l’autre.',
  },
  fermeture: {
    ZIP_INVISIBLE: 'Fermeture à glissière cachée dans la couture du milieu dos.',
    BOUTONS: 'Boutonnage sur toute la hauteur du devant.',
    CEINTURE_NOUEE: 'Ceinture à nouer, amovible, posée à la taille.',
    CEINTURE_INTEGREE: 'Ceinture cousue à la taille, surpiquée.',
    AUCUNE: 'Ligne pure, sans fermeture apparente.',
    CORDELIERE: 'Cordon noué à la taille, pans retombants.',
    ZIP_DEVANT: 'Fermeture à glissière apparente au milieu devant.',
    BOUTONS_TAILLE: 'Boutonnage du col jusqu’à la taille seulement.',
    BRAGUETTE_ZIP: 'Braguette au milieu devant fermée par une glissière, patte surpiquée en J.',
    BRAGUETTE_BOUTONS: 'Braguette au milieu devant fermée par une rangée de boutons cachés.',
    ZIP_COTE: 'Devant lisse : glissière invisible dans la couture de côté.',
    ELASTIQUE: 'À enfiler, sans fermeture : la taille est froncée par un élastique.',
  },
  corsage: {
    LISSE: 'Corsage sans fronces ni baleines.',
    FRONCES_SOUS_POITRINE: 'Fronces de poitrine reprises dans un empiècement sous le buste.',
    CROISE_FRONCE: 'Deux devants croisés et froncés, façon cache-cœur.',
    BALEINE: 'Corsage structuré par des baleines, façon corset.',
    PRINCESSE: 'Coutures courbes de l’emmanchure à la taille, devant et dos : corsage en panneaux, sans pince.',
  },
  taille: {
    NATURELLE: 'Couture corsage / jupe à la taille naturelle.',
    BASSE: 'Couture abaissée sur les hanches (basque).',
    HAUTE: 'Couture remontée sous la poitrine (empire).',
    POINTE: 'Corsage qui descend en pointe au milieu devant.',
  },
  devant: {
    FERME: 'Devant d’une seule pièce, fermé.',
    MANTEAU_OUVERT: 'Devants ouverts sur un plastron d’une autre étoffe.',
    MANTEAU_REVERS: 'Devants ouverts sur un plastron, bords rabattus en revers.',
    GILET: 'Corsage ouvert sur un gilet boutonné jusqu’aux hanches, jupe fermée devant.',
  },
  jupe: {
    DEUX_PANS: 'Jupe en deux panneaux : un devant, un dos.',
    EN_LES: 'Jupe en lés (devant, côtés, dos) : évasement régulier tout autour.',
  },  basque: {
    AUCUNE: 'Bas du corsage droit, sans pointes.',
    POINTES: 'Le gilet finit en deux pointes sous la taille.',
    PANS_CROISES: 'Pointes du gilet et deux pans croisés en V sur le haut de la jupe.',
  },

  ceinture: {
    DROITE: 'Bande rapportée de 4 cm, boutonnée ou agrafée devant.',
    FORMEE: 'Ceinture de 5 cm coupée en arrondi : elle suit la courbe des hanches.',
    ELASTIQUEE: 'Bande froncée par un élastique : le vêtement s’enfile sans fermeture.',
    COULISSE: 'Bande froncée par un cordon noué devant.',
    SANS: 'Pas de ceinture : le haut est fini par une parementure, bord net.',
  },
  plis: {
    AUCUN: 'Devant plat, sans pli ni pince.',
    PINCES: 'Pinces sous la ceinture : ajustent la taille sans ajouter d’ampleur.',
    UN_PLI: 'Un pli couché de chaque côté : un peu d’aisance aux hanches.',
    DEUX_PLIS: 'Deux plis de chaque côté : ampleur généreuse aux hanches, tombé large.',
  },
  poches: {
    AUCUNE: 'Pas de poche devant.',
    ITALIENNES: 'Ouverture oblique de la ceinture vers la couture de côté.',
    COUTURE: 'Poches invisibles glissées dans la couture de côté.',
    PLAQUEES: 'Poches cousues sur le devant, bords visibles.',
  },
  poches_dos: {
    AUCUNE: 'Dos lisse, sans poche.',
    PASSEPOIL: 'Fente bordée d’un passepoil, ton sur ton, sous la ceinture.',
    PLAQUEES: 'Poches cousues sur le dos, façon jean ou chino.',
  },
  bas: {
    OURLET: 'Bas de jambe fini par un ourlet invisible.',
    REVERS: 'Bas de jambe retroussé en revers de 4 cm.',
  },
  fente: {
    AUCUNE: 'Ourlet continu, sans fente.',
    DOS: 'Fente au milieu dos pour marcher dans une jupe droite.',
    COTE: 'Fente dans la couture de côté.',
  },
};

export interface DetailOptionView {
  id: string;
  label: string;
  description: string;
}

export interface DetailGroupView {
  id: PatternDetailGroup;
  label: string;
  options: DetailOptionView[];
}

/** The detail groups (and their options, worded for this garment) the wizard offers for a garment type. */
export const detailGroupsFor = (garmentType: string): DetailGroupView[] => {
  const ids = GROUPS_BY_GARMENT[garmentType];
  const kind = sketchGarmentFor(garmentType);
  const groups = ids ? ids.map((id) => DETAIL_GROUPS.find((g) => g.id === id)).filter((g): g is DetailGroup => g !== undefined) : DETAIL_GROUPS;
  return groups.map((group) => {
    const id = group.id as PatternDetailGroup;
    const hidden = HIDDEN_OPTIONS[kind]?.[id] ?? [];
    const text = OPTION_TEXT[kind]?.[id] ?? {};
    return {
      id,
      label: GROUP_LABELS[kind]?.[id] ?? group.label,
      options: group.options
        .filter((o) => !hidden.includes(o.id))
        .map((o) => ({
          id: o.id,
          label: text[o.id]?.label ?? o.label,
          description: text[o.id]?.description ?? OPTION_DESCRIPTIONS[id][o.id] ?? '',
        })),
    };
  });
};

/** The chosen details that apply to this garment (a dress's collar left over on a trouser project is dropped). */
export const detailsFor = (garmentType: string, details: Record<string, string>): Record<string, string> => {
  const allowed = new Map(detailGroupsFor(garmentType).map((g) => [g.id as string, new Set(g.options.map((o) => o.id))]));
  return Object.fromEntries(Object.entries(details).filter(([group, value]) => allowed.get(group)?.has(value) ?? false));
};

/** Cut wording per garment (`resolveLegProfile` for trousers, `resolveCutProfile` for skirts and tops). */
const CUT_TEXT: Partial<Record<SketchGarment, Record<string, Omit<CutOption, 'id'> | null>>> = {
  trousers: {
    DROITE: { label: 'Droit', description: 'Jambe droite, même largeur du genou à l’ourlet' },
    AJUSTEE: { label: 'Slim / Cigarette', description: 'Jambe étroite, ajustée jusqu’à la cheville' },
    EVASEE: { label: 'Évasé / Bootcut', description: 'Ajusté au genou, légèrement ouvert vers le bas' },
    SIRENE: { label: 'Pattes d’éléphant', description: 'Serré au genou, très ouvert à l’ourlet' },
    PRINCESSE: { label: 'Large / Palazzo', description: 'Jambe ample et fluide depuis les hanches' },
    OVERSIZE: { label: 'Oversize / Baggy', description: 'Aisance généreuse à la taille, aux hanches et à la jambe' },
  },
  suit: {
    DROITE: { label: 'Droit', description: 'Veste droite, pantalon à jambe droite' },
    AJUSTEE: { label: 'Ajusté / Slim', description: 'Veste cintrée, pantalon étroit' },
    EVASEE: { label: 'Évasé', description: 'Veste à peine évasée, pantalon bootcut' },
    SIRENE: null,
    PRINCESSE: { label: 'Large / Palazzo', description: 'Veste cintrée, pantalon ample et fluide' },
    OVERSIZE: { label: 'Oversize', description: 'Veste et pantalon amples, décontractés' },
  },
  skirt: {
    DROITE: { label: 'Droite / Crayon', description: 'Tombé vertical, près des hanches' },
    EVASEE: { label: 'Évasée / Trapèze', description: 'S’ouvre progressivement depuis les hanches' },
    SIRENE: { label: 'Sirène', description: 'Ajustée jusqu’aux genoux puis évasée' },
    PRINCESSE: { label: 'Corolle', description: 'Taille marquée, jupe très ample' },
    AJUSTEE: { label: 'Ajustée', description: 'Épouse la taille et les hanches' },
    OVERSIZE: { label: 'Ample / Fluide', description: 'Aisance généreuse, tombé souple' },
  },
  top: {
    DROITE: { label: 'Droite', description: 'Tombé vertical, sans cintrage' },
    EVASEE: { label: 'Évasée / Trapèze', description: 'S’élargit doucement vers le bas' },
    SIRENE: null,
    PRINCESSE: { label: 'Cintrée à basque', description: 'Taille marquée, bas qui s’évase sur les hanches' },
    AJUSTEE: { label: 'Ajustée / Cintrée', description: 'Épouse le buste et la taille' },
    OVERSIZE: { label: 'Oversize / Fluide', description: 'Aisance généreuse, épaules et corps amples' },
  },
};

/** The cuts offered for a garment type, worded for it (null = the cut does not apply). */
export const cutsFor = (garmentType: string): CutOption[] => {
  const text = CUT_TEXT[sketchGarmentFor(garmentType)];
  if (!text) return CUTS;
  return CUTS.flatMap((cut) => {
    const own = text[cut.id];
    if (own === null) return [];
    return [own ? { id: cut.id, ...own } : cut];
  });
};
