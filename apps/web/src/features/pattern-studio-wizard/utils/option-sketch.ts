/**
 * Technical flat sketches of the detail options (sleeve, collar, neckline, length…), drawn from numbers: one base dress
 * whose only varying part is the option shown, so the customer sees what each choice changes. Pure geometry (no React):
 * `OptionSketch` renders the parts. Drawn for Angaly in a 100 × 150 box, front view (back view for the back options).
 */
import { PATTERN_DETAIL_OPTIONS, type PatternDetailGroup } from '@angaly/types';
import type { SketchGarment } from '../consts/garment-details.const';
import { BOTTOM_GROUPS, skirtSketch, trouserSketch, type BottomDetails, type BottomGroup } from './garment-sketch';
import { both, CX, lerpP, mirrorX, path, quad, type P, type Sketch, type SketchPart, type SketchRole } from './sketch-geometry';

export type { Sketch, SketchPart, SketchRole } from './sketch-geometry';

type Spec = { [G in PatternDetailGroup]: string };

const DEFAULT_SPEC: Spec = {
  manches: 'SANS_MANCHES',
  col: 'SANS_COL',
  decollete: '',
  dos: 'FERME',
  longueur: 'MIDI',
  fermeture: 'AUCUNE',
  corsage: 'LISSE',
  taille: 'NATURELLE',
  devant: 'FERME',
  jupe: 'DEUX_PANS',
  basque: 'AUCUNE',
  ceinture: 'DROITE',
  plis: 'AUCUN',
  poches: 'AUCUNE',
  poches_dos: 'AUCUNE',
  bas: 'OURLET',
  fente: 'AUCUNE',
};

/** Bottoms groups a dress also has (its waist seam, its closures), and the groups only trousers have. */
const DRESS_GROUPS_TOO = new Set<string>(['taille', 'fermeture']);
const TROUSER_ONLY = new Set<string>(['poches_dos', 'bas']);

/** Shown with short sleeves so a sleeveless armhole is not mistaken for the option. */
const BASE_SLEEVE: Partial<Record<PatternDetailGroup, string>> = {
  col: 'COURTES',
  decollete: 'COURTES',
  longueur: 'COURTES',
  fermeture: 'COURTES',
  corsage: 'COURTES',
  taille: 'COURTES',
  devant: 'LONGUES',
  jupe: 'COURTES',
  basque: 'LONGUES',
  dos: 'COURTES',
};

export const NECK_Y = 18;
export const NECK_HALF = 6;
export const SHOULDER: P = [36, 22];
/** Off the shoulders: where the edge meets the arm, below the shoulder point (and the centre front, as low). */
const OFF_SHOULDER_EDGE: P = [33.5, 28];
const offShoulder = (spec: Spec, view: 'front' | 'back'): boolean => view === 'front' && spec.decollete === 'HORS_EPAULES';
export const UNDERARM: P = [35.5, 40];
const BUST_Y = 46;
export const WAIST: P = [39.5, 62];
export const HIP: P = [35, 80];

const HEM_Y: Record<string, number> = { MINI: 98, GENOU: 108, MIDI: 120, MAXI: 136, SOL: 144, ASYMETRIQUE: 120 };
/** A top's hem (veste, chemise): crop above the waist, hips, below the hips, mid-thigh, coat length. */
const TOP_HEM_Y: Record<string, number> = { MINI: 58, GENOU: 82, MIDI: 90, MAXI: 102, SOL: 126, ASYMETRIQUE: 90 };
const TOP_HEM_DEFAULT = 82;


/** The neckline from the left neck point to the centre front (left half), by décolleté / collar line. */
const necklineLeft = (spec: Spec, view: 'front' | 'back'): P[] => {
  if (view === 'back') {
    const start: P = [CX - NECK_HALF, NECK_Y];
    switch (spec.dos) {
      case 'DECOLLETE_V':
        return [start, [CX - 7, NECK_Y + 2], [CX, 46]];
      case 'DOS_NU':
        return [start, [CX - 9, 26], ...quad([CX - 9, 26], [CX - 9, 60], [CX, 60])];
      default:
        return [start, ...quad(start, [CX - 3, NECK_Y + 2], [CX, NECK_Y + 2])];
    }
  }
  if (offShoulder(spec, view)) return [OFF_SHOULDER_EDGE, ...quad(OFF_SHOULDER_EDGE, [CX - 8, 29.5], [CX, 29.5])];
  const wide = spec.col === 'BATEAU';
  const start: P = [CX - (wide ? 11 : spec.decollete && spec.decollete !== 'SAGE' ? 8 : NECK_HALF), wide ? 20 : NECK_Y];
  switch (spec.decollete || spec.col) {
    case 'EN_V':
      return [start, [CX, 32]];
    case 'PLONGEANT':
      return [start, [CX, 42]];
    case 'MOYEN':
      return [start, ...quad(start, [CX - 7, 28], [CX, 28])];
    case 'EN_U':
      return [start, [start[0], 30], ...quad([start[0], 30], [start[0], 36], [CX, 36])];
    case 'CARRE':
      return [start, [start[0], 30], [CX, 30]];
    case 'COEUR':
      return [start, [start[0] - 1, 28], ...quad([start[0] - 1, 28], [CX - 5, 26], [CX, 33])];
    case 'BATEAU':
      return [start, ...quad(start, [CX - 6, 23], [CX, 23])];
    case 'OFFICIER':
      return [start, ...quad(start, [CX - 3, NECK_Y + 1.5], [CX, NECK_Y + 1.5])];
    case 'SANS_COL':
      // A plain neck opening at the base of the neck: shallower than a crew neck.
      return [start, ...quad(start, [CX - 4, NECK_Y + 4], [CX, NECK_Y + 4])];
    default:
      return [start, ...quad(start, [CX - 4, 25], [CX, 25])];
  }
};

/** Outline of the left half: neck → shoulder → armhole → side → hem → centre. */
const halfOutline = (spec: Spec, view: 'front' | 'back', isTop = false): P[] => {
  const hemY = hemYOf(spec, isTop);
  const hemHalf = hemHalfOf(hemY, isTop);
  const neck = necklineLeft(spec, view).reverse();
  const kimono = spec.manches === 'KIMONO';
  const top = offShoulder(spec, view) ? OFF_SHOULDER_EDGE : SHOULDER;
  if (isTop && hemY <= WAIST[1]) {
    // A crop top: the side stops between the underarm and the waist.
    const end: P = [lerpP(UNDERARM, WAIST, (hemY - UNDERARM[1]) / (WAIST[1] - UNDERARM[1]))[0], hemY];
    const side: P[] = kimono ? [top, [37, 46], end] : [top, ...quad(top, [37.5, 34], UNDERARM, 5), end];
    return [...neck, ...side, [CX, hemY]];
  }
  const side: P[] = kimono
    ? [top, [37, 46], WAIST]
    : [top, ...quad(top, [37.5, 34], UNDERARM, 5), ...quad(UNDERARM, [37.5, 52], WAIST, 5)];
  if (isTop) {
    // A top ends on the hips (or above them, or below as a tunic or a coat): straight hem.
    const hipY = Math.min(hemY, HIP[1]);
    const hip: P = [lerpP(WAIST, HIP, (hipY - WAIST[1]) / (HIP[1] - WAIST[1]))[0], hipY];
    const tail: P[] = hemY > HIP[1] ? [HIP, [CX - hemHalf, hemY]] : [hip];
    return [...neck, ...side, ...tail, [CX, hemY]];
  }
  const hemLeft: P = [CX - hemHalf, hemY];
  const hemCentre: P = [CX, hemY + 1.5];
  return [...neck, ...side, ...quad(WAIST, [HIP[0] - 0.5, HIP[1] - 8], HIP, 5), hemLeft, ...quad(hemLeft, [CX - hemHalf / 2, hemCentre[1] + 0.8], hemCentre, 5)];
};

/** An asymmetric hem: the skirt below the hip tilts, short on the left, long on the right. */
const ASYM_SLOPE = 0.45;
const asymmetric = ([x, y]: P): P => [x, y > HIP[1] ? y + ASYM_SLOPE * (x - CX) * Math.min(1, (y - HIP[1]) / 30) : y];

const hemYOf = (spec: Spec, isTop: boolean): number =>
  isTop ? (spec.longueur ? (TOP_HEM_Y[spec.longueur] ?? TOP_HEM_DEFAULT) : TOP_HEM_DEFAULT) : (HEM_Y[spec.longueur] ?? HEM_Y.MIDI!);
const hemHalfOf = (hemY: number, isTop: boolean): number =>
  isTop ? (hemY <= HIP[1] ? CX - HIP[0] : CX - HIP[0] + (hemY - HIP[1]) * 0.12) : 17 + (hemY - WAIST[1]) * 0.24;

const fullOutline = (spec: Spec, view: 'front' | 'back', isTop = false): string => {
  const left = halfOutline(spec, view, isTop);
  const outline = [...left, ...left.map(mirrorX).reverse()];
  return path(spec.longueur === 'ASYMETRIQUE' ? outline.map(asymmetric) : outline, true);
};

/** Left sleeve (from the shoulder and the underarm), by family. */
const sleeveLeft = (id: string, shoulder: P = SHOULDER): P[] | null => {
  const [sx, sy] = shoulder;
  const [ux, uy] = UNDERARM;
  switch (id) {
    case 'CAP':
      return [[sx, sy], ...quad([sx, sy], [29, 22], [30, 30]), [ux - 1, 31]];
    case 'COURTES':
      return [[sx, sy], [26, 46], [33, 49], [ux, uy]];
    case 'TROIS_QUARTS':
      return [[sx, sy], [22, 70], [28.5, 72], [ux, uy]];
    case 'LONGUES':
    case 'RAGLAN':
    case 'TAILLEUR':
      return [[sx, sy], [20, 86], [25.5, 87.5], [ux, uy]];
    case 'BALLON':
      return [[sx, sy], ...quad([sx, sy], [14, 24], [22, 54]), [21, 86], [25.5, 87.5], [30, 56], ...quad([30, 56], [33, 47], [ux, uy])];
    case 'PAPILLON':
      return [[sx, sy], [20, 44], ...quad([20, 44], [27, 51], [34, 46]), [ux, uy]];
    case 'EVEQUE':
      return [[sx, sy], ...quad([sx, sy], [22, 50], [14, 80]), [19, 84], [21, 89], [26, 89], [27, 84], [ux, uy]];
    case 'CLOCHE':
      return [[sx, sy], [24, 62], ...quad([24, 62], [17, 76], [14, 90]), ...quad([14, 90], [22, 94], [29, 89]), [29, 64], [ux, uy]];
    case 'LANTERNE':
      return [[sx, sy], ...quad([sx, sy], [16, 46], [24, 70]), [26, 72], ...quad([26, 72], [37, 55], [ux, uy])];
    case 'KIMONO':
      return [[sx, sy], [20, 54], [27, 58], [37, 46]];
    default:
      return null;
  }
};

export const sleeveParts = (id: string, highlight: boolean, shoulder: P = SHOULDER): SketchPart[] => {
  const pts = sleeveLeft(id, shoulder);
  if (!pts) return [];
  const parts = both(pts, highlight ? 'detailFill' : 'garment');
  if (id === 'TAILLEUR') {
    // The under-sleeve seam down the back of the arm, and the cuff.
    parts.push(...both([[30.5, 44], [24, 81]], highlight ? 'detail' : 'line', false));
    parts.push(...both([[20.3, 81], [20, 86], [25.5, 87.5], [26.2, 82.5]], highlight ? 'detailFill' : 'contrast'));
  }
  if (id === 'RAGLAN') parts.push(...both([[CX - NECK_HALF - 1, NECK_Y + 2], [UNDERARM[0], UNDERARM[1]]], highlight ? 'detail' : 'line', false));
  if (id === 'LANTERNE' || id === 'EVEQUE' || id === 'BALLON') {
    // Gathers at the gathered edges.
    const ys = id === 'LANTERNE' ? [26, 68] : [84];
    for (const y of ys) parts.push(...both([[y > 60 ? 21 : 31, y], [y > 60 ? 28 : 36, y + 1]], highlight ? 'detail' : 'line', false));
  }
  return parts;
};

export const collarParts = (id: string): SketchPart[] => {
  const nl: P = [CX - NECK_HALF, NECK_Y];
  switch (id) {
    case 'OFFICIER':
      return [{ d: path([[CX - 6.5, NECK_Y + 1], [CX - 6, 12.5], [CX + 6, 12.5], [CX + 6.5, NECK_Y + 1]], true), role: 'detailFill' }];
    case 'CHEMISIER':
      return both([nl, [CX - 7.5, 22], [CX - 3.5, 29], [CX, 25]], 'detailFill');
    case 'LAVALLIERE':
      return [
        ...both([[CX, 25], [CX - 7, 21], [CX - 7, 29]], 'detailFill'),
        ...both([[CX - 1, 26], [CX - 5, 44], [CX - 2, 45], [CX, 27]], 'detailFill'),
      ];
    case 'CHALE':
      return both([nl, [CX - 12, 26], [CX - 3, 56], [CX, 58], [CX, 30]], 'detailFill');
    default:
      return [];
  }
};

const closureParts = (id: string, waistY: number): SketchPart[] => {
  const dots = (to: number): SketchPart[] =>
    Array.from({ length: Math.floor((to - 28) / 8) + 1 }, (_, k) => {
      const y = 28 + k * 8;
      return { d: `M${CX - 0.9} ${y} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0`, role: 'detailFill' as const };
    });
  switch (id) {
    case 'BOUTONS':
      return dots(112);
    case 'BOUTONS_TAILLE':
      return dots(waistY);
    case 'ZIP_DEVANT':
      return [
        { d: path([[CX, 25], [CX, waistY + 10]]), role: 'detail' },
        { d: path([[CX - 1.2, 26], [CX + 1.2, 26], [CX + 1.2, 30], [CX - 1.2, 30]], true), role: 'detailFill' },
      ];
    case 'ZIP_INVISIBLE':
      return [{ d: path([[CX, 21], [CX, 78]]), role: 'dash' }];
    case 'CEINTURE_NOUEE':
      return [
        { d: path([[WAIST[0] - 0.5, waistY - 2.5], [100 - WAIST[0] + 0.5, waistY - 2.5], [100 - WAIST[0] + 0.5, waistY + 2.5], [WAIST[0] - 0.5, waistY + 2.5]], true), role: 'detailFill' },
        ...both([[CX, waistY], [CX - 7, waistY - 5], [CX - 7, waistY + 4]], 'detailFill'),
        ...both([[CX - 1, waistY + 1], [CX - 4, waistY + 18], [CX - 1.5, waistY + 18.5], [CX, waistY + 2]], 'detailFill'),
      ];
    case 'CEINTURE_INTEGREE':
      return [
        { d: path([[WAIST[0] - 0.5, waistY - 3], [100 - WAIST[0] + 0.5, waistY - 3], [100 - WAIST[0] + 0.5, waistY + 3], [WAIST[0] - 0.5, waistY + 3]], true), role: 'detailFill' },
        { d: path([[WAIST[0] + 0.5, waistY - 2], [100 - WAIST[0] - 0.5, waistY - 2]]), role: 'dash' },
        { d: path([[WAIST[0] + 0.5, waistY + 2], [100 - WAIST[0] - 0.5, waistY + 2]]), role: 'dash' },
      ];
    case 'CORDELIERE':
      return [
        { d: path([[WAIST[0], waistY], [100 - WAIST[0], waistY]]), role: 'detail' },
        { d: `M${CX - 1.5} ${waistY} a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0`, role: 'detailFill' },
        ...both([[CX - 0.5, waistY + 1], [CX - 3, waistY + 22]], 'detail', false),
      ];
    default:
      return [];
  }
};

const bodiceParts = (id: string, highlight: boolean): SketchPart[] => {
  const role: SketchRole = highlight ? 'detail' : 'line';
  switch (id) {
    case 'FRONCES_SOUS_POITRINE':
      return [
        { d: path([[37.5, 50], [62.5, 50], [61, 60], [39, 60]], true), role: highlight ? 'detailFill' : 'garment' },
        ...[42, 46, 50, 54, 58].map((x) => ({ d: path([[x, 38], [x + (x - CX) * 0.05, 49]]), role })),
      ];
    case 'CROISE_FRONCE':
      return [
        { d: path([[CX - NECK_HALF, NECK_Y + 1], [61, 60]]), role },
        { d: path([[CX + NECK_HALF, NECK_Y + 1], [39, 60]]), role },
        ...[44, 48, 52, 56].map((x) => ({ d: path([[x, 54], [x + 1, 60]]), role })),
      ];
    case 'PRINCESSE':
      // Curved seams from the armholes over the bust down to the waist.
      return both([[UNDERARM[0] + 0.5, 34], ...quad([UNDERARM[0] + 0.5, 34], [44, 40], [44, 61])], role, false);
    case 'BALEINE':
      // Boning: vertical lines down the bodice, the closest at the centre front.
      return [36.5, 41, 45.5, 54.5, 59, 63.5].map((x) => ({ d: path([[x, 30 + Math.abs(x - CX) * 0.05], [x + (x < CX ? 1.5 : -1.5), 59]]), role }));
    default:
      return [];
  }
};

const waistY = (spec: Spec): number => (spec.taille === 'HAUTE' ? BUST_Y + 4 : spec.taille === 'BASSE' ? 76 : WAIST[1]);

/**
 * The sketch of a detail option: the base garment with that option, the option's own parts highlighted. The base is
 * the garment chosen: a dress, a top (veste, chemise, the suit's jacket), a skirt or trousers (their length).
 */
export const sketchForOption = (
  group: PatternDetailGroup,
  id: string,
  garment: SketchGarment = 'dress',
  cut = '',
  /** The other details already chosen: every drawing shows them, only the option itself changes. */
  context: Partial<Record<string, string>> = {},
): Sketch => {
  // Trousers and skirts are drawn in the cut chosen on the « Coupe » step (a mermaid trouser leg is a bell-bottom).
  const legCut = cut || 'DROITE';
  const chosen = (g: string): string | undefined => (g === group ? undefined : context[g]);
  const bottomDetails = (): BottomDetails => {
    const out: BottomDetails = {};
    for (const g of BOTTOM_GROUPS) {
      const v = chosen(g);
      if (v) out[g] = v;
    }
    return out;
  };
  if (group === 'longueur' && (garment === 'trousers' || garment === 'suit')) return trouserSketch(id, legCut, true, bottomDetails());
  // The bottoms' construction (rise, band, fly, pleats, pockets, turn-up, vent) is drawn on trousers or a skirt.
  // On a dress or a top, `taille` and `fermeture` are the dress's own (waist seam, closures): drawn on the dress.
  const isBottom = garment === 'trousers' || garment === 'suit' || garment === 'skirt';
  const bottom =
    (BOTTOM_GROUPS as readonly string[]).includes(group) && (isBottom || !DRESS_GROUPS_TOO.has(group)) ? (group as BottomGroup) : undefined;
  const isBottomKind = garment === 'trousers' || garment === 'suit' || garment === 'skirt';
  if (bottom && (garment === 'trousers' || garment === 'suit' || (garment !== 'skirt' && TROUSER_ONLY.has(group)))) {
    return trouserSketch(chosen('longueur') ?? 'MAXI', legCut, false, { ...(isBottomKind ? bottomDetails() : {}), [bottom]: id }, bottom);
  }
  if (bottom) {
    return skirtSketch(chosen('longueur') ?? 'GENOU', garment === 'skirt' ? cut || 'EVASEE' : 'DROITE', false, { ...(isBottomKind ? bottomDetails() : {}), [bottom]: id }, bottom);
  }
  if (garment === 'skirt') return skirtSketch(group === 'longueur' ? id : (chosen('longueur') ?? 'GENOU'), cut || 'EVASEE', group === 'longueur', bottomDetails());
  if (garment === 'trousers') return trouserSketch(chosen('longueur') ?? 'MAXI', legCut, false, bottomDetails());
  const isTop = garment === 'top' || garment === 'suit';
  const view: 'front' | 'back' = group === 'dos' || (group === 'fermeture' && id === 'ZIP_INVISIBLE') ? 'back' : 'front';
  // The details already chosen (only the garment's own groups: a dress drawing ignores trouser pockets).
  const ownChoices: Partial<Spec> = {};
  for (const g of Object.keys(DEFAULT_SPEC) as PatternDetailGroup[]) {
    const v = chosen(g);
    // A suit's `longueur` is its trousers' length: the jacket keeps its own.
    if (garment === 'suit' && g === 'longueur') continue;
    if (v && !(BOTTOM_GROUPS as readonly string[]).includes(g)) ownChoices[g] = v;
    else if (v && DRESS_GROUPS_TOO.has(g)) ownChoices[g] = v;
  }
  const spec: Spec = {
    ...DEFAULT_SPEC,
    ...(isTop ? { longueur: '' } : {}),
    manches: isTop && group !== 'manches' ? 'LONGUES' : (BASE_SLEEVE[group] ?? DEFAULT_SPEC.manches),
    ...ownChoices,
    [group]: id,
  };
  const parts: SketchPart[] = [];
  parts.push(...sleeveParts(spec.manches, group === 'manches', offShoulder(spec, view) ? OFF_SHOULDER_EDGE : SHOULDER));
  parts.push({ d: fullOutline(spec, view, isTop), role: 'garment' });
  const wY = waistY(spec);
  const hemY = hemYOf(spec, isTop);
  const hemHalf = hemHalfOf(hemY, isTop);
  const highlight = (g: PatternDetailGroup): boolean => g === group;
  if (isTop) {
    // The front opening of a jacket or a shirt, from the neckline to the hem.
    const neckBottom = necklineLeft(spec, 'front').at(-1)![1];
    parts.push({ d: path([[CX, neckBottom], [CX, hemY]]), role: 'line' });
    parts.push(...collarParts(spec.col));
    if (group === 'decollete' || (group === 'col' && ['ROND', 'EN_V', 'BATEAU', 'SANS_COL'].includes(id))) {
      const left = necklineLeft(spec, 'front');
      parts.push({ d: path([...left, ...left.map(mirrorX).reverse()]), role: 'detail' });
    }
    if (group === 'longueur' && id !== 'ASYMETRIQUE') {
      parts.push({ d: path([[CX - hemHalf - 3, hemY + 1.5], [CX + hemHalf + 3, hemY + 1.5]]), role: 'dash' });
    }
    return { view, parts };
  }

  if (view === 'front' && spec.basque !== 'AUCUNE' && (group === 'basque' || spec.devant === 'GILET')) {
    // The gilet's points below the waist, and the crossed tabs over the top of the skirt.
    const role: SketchRole = highlight('basque') ? 'detailFill' : 'contrast';
    const bottom = wY + 8;
    parts.push(...both([[CX - 5, bottom], [CX - 2.5, bottom + 6], [CX, bottom]], role));
    if (spec.basque === 'PANS_CROISES') parts.push(...both([[CX - 13, bottom], [CX - 9, bottom], [CX + 1, bottom + 13], [CX - 3, bottom + 13]], role));
  }
  if (view === 'front' && spec.devant === 'GILET') {
    // The gilet between the bodice fronts, down to the basque; the skirt below stays closed.
    const bottom = wY + 8;
    parts.push({ d: path([[CX - 4, 26], [CX + 4, 26], [CX + 5, bottom], [CX - 5, bottom]], true), role: highlight('devant') ? 'detailFill' : 'contrast' });
    parts.push(...both([[CX - NECK_HALF, NECK_Y + 1], [CX - 9, 32], [CX - 3, wY - 2], [CX - 5, bottom]], 'detailFill'));
  } else if (view === 'front' && spec.devant !== 'FERME') {
    // The plastron between the fronts, then the fronts' edges (and the revers).
    parts.push({ d: path([[CX - 4, 26], [CX + 4, 26], [CX + 11, hemY - 1], [CX - 11, hemY - 1]], true), role: highlight('devant') ? 'detailFill' : 'contrast' });
    parts.push(...both([[CX - 4, 26], [CX - 3, wY], [CX - 11, hemY - 1]], highlight('devant') ? 'detail' : 'line', false));
    if (spec.devant === 'MANTEAU_REVERS') parts.push(...both([[CX - NECK_HALF, NECK_Y + 1], [CX - 11, 30], [CX - 3.5, wY - 2], [CX - 4, 26]], 'detailFill'));
  }
  if (view === 'front') {
    // The waist seam (bodice / skirt).
    const waistRole: SketchRole = highlight('taille') ? 'detail' : 'line';
    if (spec.taille === 'POINTE') {
      // The bodice falls to a point at the centre front, below the waist.
      parts.push({ d: path([[WAIST[0], wY], ...quad([WAIST[0], wY], [CX - 4, wY + 2], [CX, wY + 8]), ...quad([CX, wY + 8], [CX + 4, wY + 2], [100 - WAIST[0], wY])]), role: waistRole });
    } else {
      parts.push({ d: path([[WAIST[0] + (wY < WAIST[1] ? -2 : wY > WAIST[1] ? -4 : 0), wY], [100 - WAIST[0] - (wY < WAIST[1] ? -2 : wY > WAIST[1] ? -4 : 0), wY]]), role: waistRole });
    }
    if (spec.jupe === 'EN_LES') {
      for (const k of [0.32, 0.68]) {
        const top = WAIST[0] + (100 - 2 * WAIST[0]) * k;
        const bottom = CX - hemHalf + 2 * hemHalf * k;
        parts.push({ d: path([[top, wY], [bottom, hemY]]), role: highlight('jupe') ? 'detail' : 'line' });
      }
    }
    parts.push(...bodiceParts(spec.corsage, highlight('corsage')));
    parts.push(...collarParts(spec.col));
    if (group === 'decollete' || (group === 'col' && ['ROND', 'EN_V', 'BATEAU', 'SANS_COL'].includes(id))) {
      // The neckline itself is the option: trace it.
      const left = necklineLeft(spec, 'front');
      parts.push({ d: path([...left, ...left.map(mirrorX).reverse()]), role: 'detail' });
    }
    if (group === 'longueur' && id !== 'ASYMETRIQUE') {
      parts.push({ d: path([[CX - hemHalf - 3, hemY + 1.5], [CX + hemHalf + 3, hemY + 1.5]]), role: 'dash' });
    }
  } else {
    const left = necklineLeft(spec, 'back');
    if (group === 'dos') parts.push({ d: path([...left, ...left.map(mirrorX).reverse()]), role: 'detail' });
    if (spec.dos === 'GOUTTE') parts.push({ d: `M${CX} 24 Q${CX + 5} 32 ${CX} 36 Q${CX - 5} 32 ${CX} 24 Z`, role: 'detailFill' });
    if (spec.dos === 'TRANSPARENT') {
      parts.push({ d: path([[38, 24], [62, 24], [62, 40], [38, 40]], true), role: 'detail' });
      for (let x = 40; x <= 60; x += 4) parts.push({ d: path([[x, 24], [x - 2, 40]]), role: 'dash' });
    }
    parts.push({ d: path([[WAIST[0], WAIST[1]], [100 - WAIST[0], WAIST[1]]]), role: 'line' });
  }
  parts.push(...closureParts(spec.fermeture, wY));
  return { view, parts };
};

/** Every option that has a sketch (all of them). */
export const SKETCHED_GROUPS = Object.keys(PATTERN_DETAIL_OPTIONS) as PatternDetailGroup[];
