/**
 * Technical flats of the garments that are not a dress: trousers (leg length and leg shape) and a skirt (length and
 * cut), with the construction details of the bottoms (rise, waistband, closure, pleats, pockets, turn-up, vent). Same
 * 100 × 150 box and roles as `option-sketch.ts`; the option shown is highlighted.
 */
import { CX, lerpP, mirrorX, path, quad, type P, type Sketch, type SketchPart, type SketchRole } from './sketch-geometry';

/** Construction details of trousers / a skirt (`@angaly/types` groups); the one shown is `highlight`. */
export interface BottomDetails {
  taille?: string;
  ceinture?: string;
  fermeture?: string;
  plis?: string;
  poches?: string;
  poches_dos?: string;
  bas?: string;
  fente?: string;
}
export type BottomGroup = keyof BottomDetails;
export const BOTTOM_GROUPS: readonly BottomGroup[] = ['taille', 'ceinture', 'fermeture', 'plis', 'poches', 'poches_dos', 'bas', 'fente'];

/** Back view: the back pockets, the back vent and the back zip are seen from behind. */
const backViewOf = (highlight: BottomGroup | undefined, details: BottomDetails): boolean =>
  highlight === 'poches_dos' || (highlight === 'fente' && details.fente === 'DOS') || (highlight === 'fermeture' && details.fermeture === 'ZIP_INVISIBLE');

/** Trouser hem (y): short, bermuda, pantacourt, ankle, floor (as `resolveTrouserLengthFactor`: 0.45 → 1.04). */
const TROUSER_HEM_Y: Record<string, number> = { MINI: 60, GENOU: 80, MIDI: 100, MAXI: 132, SOL: 140, ASYMETRIQUE: 132 };

const T_WAIST_Y = 14;
/** The top edge for a high / low rise (the natural waist stays at T_WAIST_Y). */
const T_RISE: Record<string, number> = { HAUTE: -5, BASSE: 5 };
const T_HIP_Y = 32;
const T_CROTCH_Y = 50;
const T_KNEE_Y = 92;
const T_ANKLE_Y = 136;
const BAND_H = 4;

/** Half width of one leg at the thigh, knee and hem, by cut (as `LEG_PROFILES`: hem half width and knee ratio). */
const LEG: Record<string, { hip: number; thigh: number; knee: number; hem: number }> = {
  DROITE: { hip: 21, thigh: 10.6, knee: 8.6, hem: 8.2 },
  AJUSTEE: { hip: 20.4, thigh: 9.8, knee: 7.2, hem: 5.4 },
  EVASEE: { hip: 21, thigh: 10.4, knee: 7.2, hem: 10.6 },
  SIRENE: { hip: 20.8, thigh: 10, knee: 6.6, hem: 15.5 },
  PRINCESSE: { hip: 22.5, thigh: 12.8, knee: 14, hem: 15 },
  OVERSIZE: { hip: 23.5, thigh: 13.2, knee: 13.6, hem: 9.6 },
};

const roleOf = (on: boolean, base: SketchRole = 'line'): SketchRole => (on ? 'detail' : base);
const dot = (x: number, y: number, r = 0.9): SketchPart => ({ d: `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`, role: 'detailFill' });
/** A shape on the left and its mirror on the right. */
const mirrored = (pts: P[], role: SketchRole, closed = false): SketchPart[] => [
  { d: path(pts, closed), role },
  { d: path(pts.map(mirrorX), closed), role },
];

/** The waistband (or the facing line), across the top edge from `left` to its mirror; `top` its upper edge. */
const bandParts = (band: string, left: P, top: number, on: boolean): SketchPart[] => {
  const xl = left[0] - 0.3;
  const xr = 2 * CX - xl;
  const fill: SketchRole = on ? 'detailFill' : 'garment';
  const rect = (h: number): SketchPart => ({ d: path([[xl, top], [xr, top], [xr, top + h], [xl, top + h]], true), role: fill });
  switch (band) {
    case 'SANS':
      return [{ d: path([[xl + 1, top + 5], [xr - 1, top + 5]]), role: on ? 'detail' : 'dash' }];
    case 'FORMEE':
      return [{ d: path([[xl, top], ...quad([xl, top], [CX, top - 1.5], [xr, top]), [xr - 0.6, top + 6], ...quad([xr - 0.6, top + 6], [CX, top + 4.5], [xl + 0.6, top + 6])], true), role: fill }];
    case 'ELASTIQUEE':
    case 'COULISSE': {
      const parts: SketchPart[] = [rect(BAND_H)];
      for (let x = xl + 2; x < xr - 1; x += 2.2) parts.push({ d: path([[x, top + 0.6], [x + 0.5, top + BAND_H - 0.6]]), role: roleOf(on) });
      if (band === 'COULISSE') parts.push(...[-1, 1].map((s) => ({ d: path([[CX, top + 2], [CX + s * 2.5, top + 12]]), role: roleOf(on) })), dot(CX, top + 2, 1));
      return parts;
    }
    default:
      return [rect(BAND_H)];
  }
};

/** Closure of trousers or a skirt, from the band down (`depth`: how far it runs). */
const closureParts = (closure: string, top: number, depth: number, sideX: number, on: boolean): SketchPart[] => {
  const y0 = top + BAND_H;
  switch (closure) {
    case 'BRAGUETTE_ZIP':
      return [{ d: path([[CX, y0], [CX, y0 + depth], ...quad([CX, y0 + depth], [CX, y0 + depth + 4], [CX - 4, y0 + depth + 3], 3), [CX - 4, y0]]), role: on ? 'detail' : 'dash' }];
    case 'BRAGUETTE_BOUTONS':
      return [{ d: path([[CX, y0], [CX, y0 + depth + 2]]), role: on ? 'detail' : 'line' }, ...Array.from({ length: 4 }, (_, k) => dot(CX - 1.6, y0 + 3 + k * (depth / 4)))];
    case 'ZIP_COTE':
      return [{ d: path([[sideX + 0.6, y0], [sideX + 1.4, y0 + depth]]), role: on ? 'detail' : 'dash' }];
    case 'BOUTONS':
      return [{ d: path([[CX, y0], [CX, y0 + depth * 2.2]]), role: on ? 'detail' : 'line' }, ...Array.from({ length: 5 }, (_, k) => dot(CX, y0 + 3 + k * 6))];
    case 'ELASTIQUE':
      return on ? [{ d: path([[CX - 6, y0 + 1], [CX + 6, y0 + 1]]), role: 'detail' }] : [];
    case 'ZIP_INVISIBLE':
      // Seen from behind: the centre-back seam.
      return [{ d: path([[CX, y0], [CX, y0 + depth * 1.6]]), role: on ? 'detail' : 'dash' }];
    default:
      return [];
  }
};

/** Pleats or darts under the band, both sides; `waistHalf` the half width at the band. */
const pleatParts = (pleats: string, top: number, waistHalf: number, on: boolean): SketchPart[] => {
  const y0 = top + BAND_H;
  const at = (share: number): number => CX - waistHalf * share;
  switch (pleats) {
    case 'PINCES':
      return mirrored([[at(0.5) - 1, y0], [at(0.5), y0 + 9], [at(0.5) + 1, y0]], roleOf(on));
    case 'UN_PLI':
      return mirrored([[at(0.42), y0], [at(0.42) + 0.6, y0 + 11]], roleOf(on));
    case 'DEUX_PLIS':
      return [...mirrored([[at(0.38), y0], [at(0.38) + 0.6, y0 + 12]], roleOf(on)), ...mirrored([[at(0.62), y0], [at(0.62) + 0.4, y0 + 8]], roleOf(on))];
    default:
      return [];
  }
};

/** Front pockets (left one, mirrored) from the band at `top`, the side at x = `sideX` (left). */
const pocketParts = (pockets: string, top: number, sideX: number, on: boolean): SketchPart[] => {
  const y0 = top + BAND_H;
  switch (pockets) {
    case 'ITALIENNES':
      return mirrored([[sideX + 6, y0], [sideX + 1, y0 + 13]], roleOf(on));
    case 'COUTURE':
      return mirrored([[sideX + 0.8, y0 + 3], [sideX + 1.6, y0 + 14]], on ? 'detail' : 'dash');
    case 'PLAQUEES':
      return mirrored([[sideX + 3, y0 + 3], [sideX + 11, y0 + 3], [sideX + 11, y0 + 13], [sideX + 3, y0 + 13]], on ? 'detailFill' : 'line', true);
    default:
      return [];
  }
};

/** Back pockets (drawn on the back view). */
const backPocketParts = (pockets: string, top: number, on: boolean): SketchPart[] => {
  const y = top + BAND_H + 7;
  switch (pockets) {
    case 'PASSEPOIL':
      return mirrored([[CX - 15, y], [CX - 6, y], [CX - 6, y + 1.4], [CX - 15, y + 1.4]], on ? 'detailFill' : 'line', true);
    case 'PLAQUEES':
      return mirrored([[CX - 15, y - 1], [CX - 6, y - 1], [CX - 6.5, y + 9], [CX - 10.5, y + 11], [CX - 14.5, y + 9]], on ? 'detailFill' : 'line', true);
    default:
      // No pocket: the back yoke seam only.
      return on ? [{ d: path([[CX - 16, y + 4], [CX + 16, y + 4]]), role: 'dash' }] : [];
  }
};

/** Trousers front (or back) view: the leg length `longueur`, the leg shape `cut`, the construction details. */
export const trouserSketch = (longueur: string, cut: string, highlightHem: boolean, details: BottomDetails = {}, highlight?: BottomGroup): Sketch => {
  const leg = LEG[cut] ?? LEG.DROITE!;
  const hemY = TROUSER_HEM_Y[longueur] ?? TROUSER_HEM_Y.MAXI!;
  const top = T_WAIST_Y + (T_RISE[details.taille ?? ''] ?? 0);
  const back = backViewOf(highlight, details);
  const half = (y: number): number =>
    y <= T_KNEE_Y
      ? leg.thigh + (leg.knee - leg.thigh) * ((y - T_CROTCH_Y) / (T_KNEE_Y - T_CROTCH_Y))
      : leg.knee + (leg.hem - leg.knee) * Math.min(1, (y - T_KNEE_Y) / (T_ANKLE_Y - T_KNEE_Y));
  // The leg's centre line drifts in a little towards the ankle; a flared hem never meets the other leg's.
  const centre = (y: number): number => Math.min(CX - leg.thigh - 0.2 - ((y - T_CROTCH_Y) / (T_ANKLE_Y - T_CROTCH_Y)) * 0.6, CX - 1.5 - half(y));
  const ys = [T_CROTCH_Y, T_KNEE_Y, hemY].filter((y, k, all) => y <= hemY && all.indexOf(y) === k).sort((a, b) => a - b);
  const outer: P[] = ys.map((y) => [centre(y) - half(y), y]);
  const inner: P[] = [...ys].reverse().map((y) => [centre(y) + half(y), y]);
  // A low rise starts on the hips (wider), a high one above the waist (as narrow).
  const waistHalf = leg.hip - 3.5 + (top > T_WAIST_Y ? (top - T_WAIST_Y) * 0.35 : 0);
  const waist: P = [CX - waistHalf, top];
  const hip: P = [CX - leg.hip, T_HIP_Y];
  const crotch: P = [CX, T_CROTCH_Y - 1];
  const left: P[] = [waist, hip, ...outer, ...inner, crotch];
  const outline = [...left, ...left.slice(0, -1).map(mirrorX).reverse()];
  const parts: SketchPart[] = [{ d: path(outline, true), role: 'garment' }];
  const on = (g: BottomGroup): boolean => highlight === g;
  parts.push(...bandParts(details.ceinture ?? 'DROITE', waist, top, on('ceinture') || on('taille')));
  if (on('taille')) parts.push({ d: path([[CX - waistHalf - 2, T_WAIST_Y + (top === T_WAIST_Y ? 6 : 0)], [CX + waistHalf + 2, T_WAIST_Y + (top === T_WAIST_Y ? 6 : 0)]]), role: 'dash' });
  const sideAt = (t: number): number => lerpP(waist, hip, t)[0];
  if (back) {
    parts.push(...backPocketParts(details.poches_dos ?? 'AUCUNE', top, on('poches_dos')));
  } else {
    parts.push(...closureParts(details.fermeture ?? 'BRAGUETTE_ZIP', top, T_CROTCH_Y - 12 - top - BAND_H, sideAt(0.1), on('fermeture')));
    parts.push(...pleatParts(details.plis ?? 'AUCUN', top, waistHalf, on('plis')));
    parts.push(...pocketParts(details.poches ?? 'ITALIENNES', top, sideAt(0.05), on('poches')));
  }
  // The front crease of each leg.
  for (const side of [1, -1]) {
    const crease = (y: number): P => [side > 0 ? centre(y) : 2 * CX - centre(y), y];
    parts.push({ d: path([crease(T_HIP_Y + 4), crease(hemY - 1)]), role: 'dash' });
  }
  if (details.bas === 'REVERS') {
    for (const side of [1, -1]) {
      const a: P = [centre(hemY - 4) - half(hemY - 4) - 0.4, hemY - 4];
      const b: P = [centre(hemY) + half(hemY) + 0.4, hemY];
      const pts: P[] = [a, [b[0], a[1]], b, [a[0], b[1]]];
      parts.push({ d: path(side > 0 ? pts : pts.map(mirrorX), true), role: on('bas') ? 'detailFill' : 'line' });
    }
  } else if (on('bas')) {
    parts.push({ d: path([[CX - 30, hemY - 2], [CX + 30, hemY - 2]]), role: 'dash' });
  }
  if (highlightHem) {
    for (const side of [1, -1]) {
      const a: P = [centre(hemY) - half(hemY), hemY];
      const b: P = [centre(hemY) + half(hemY), hemY];
      parts.push({ d: path(side > 0 ? [a, b] : [mirrorX(a), mirrorX(b)]), role: 'detail' });
    }
    parts.push({ d: path([[CX - 36, hemY + 1.5], [CX + 36, hemY + 1.5]]), role: 'dash' });
  }
  return { view: back ? 'back' : 'front', parts };
};

/** Skirt hem (y), from a waist at y = 20: above the knee, knee, mid-calf, ankle, floor. */
const SKIRT_HEM_Y: Record<string, number> = { MINI: 66, GENOU: 84, MIDI: 104, MAXI: 130, SOL: 142, ASYMETRIQUE: 104 };
const S_WAIST_Y = 20;
const S_RISE: Record<string, number> = { HAUTE: -6, BASSE: 6 };
const S_HIP_Y = 40;
const S_KNEE_Y = 86;

/** Skirt front (or back) view by length and cut (as `CUT_PROFILES`), with its construction details. */
export const skirtSketch = (longueur: string, cut: string, highlightHem: boolean, details: BottomDetails = {}, highlight?: BottomGroup): Sketch => {
  const hemY = SKIRT_HEM_Y[longueur] ?? SKIRT_HEM_Y.GENOU!;
  const top = S_WAIST_Y + (S_RISE[details.taille ?? ''] ?? 0);
  const back = backViewOf(highlight, details);
  const drop = hemY - S_HIP_Y;
  const hip: P = [CX - (cut === 'OVERSIZE' ? 18.5 : cut === 'AJUSTEE' ? 16.5 : 17.2), S_HIP_Y];
  const waistHalf = (cut === 'OVERSIZE' ? 14.5 : 13) + (top > S_WAIST_Y ? (top - S_WAIST_Y) * 0.45 : 0);
  const waist: P = [CX - waistHalf, top];
  let side: P[];
  switch (cut) {
    case 'DROITE':
      side = [hip, [CX - 16.8, hemY]];
      break;
    case 'AJUSTEE':
      side = [hip, [CX - 15.2, hemY]];
      break;
    case 'SIRENE': {
      const knee: P = [CX - 14.5, Math.min(S_KNEE_Y, hemY - 6)];
      side = [hip, knee, ...quad(knee, [knee[0] - 2, hemY - 4], [CX - 15 - drop * 0.18, hemY], 5)];
      break;
    }
    case 'PRINCESSE':
      side = [...quad(waist, [hip[0] + 1, S_HIP_Y], [CX - 17.2 - drop * 0.42, hemY], 6)];
      break;
    case 'OVERSIZE':
      side = [hip, [CX - 18.5 - drop * 0.14, hemY]];
      break;
    default:
      side = [hip, [CX - 17.2 - drop * 0.28, hemY]];
  }
  const hemLeft = side.at(-1)!;
  const hemCentre: P = [CX, hemY + 1.5];
  const left: P[] = [waist, ...side, ...quad(hemLeft, [CX + (hemLeft[0] - CX) / 2, hemY + 2], hemCentre, 4)];
  let outline: P[] = [...left, ...left.slice(0, -1).map(mirrorX).reverse()];
  if (longueur === 'ASYMETRIQUE') outline = outline.map(([x, y]) => [x, y > S_HIP_Y + 10 ? y + 0.5 * (x - CX) * Math.min(1, (y - S_HIP_Y - 10) / 30) : y] as P);
  const parts: SketchPart[] = [{ d: path(outline, true), role: 'garment' }];
  const on = (g: BottomGroup): boolean => highlight === g;
  parts.push(...bandParts(details.ceinture ?? 'DROITE', waist, top, on('ceinture') || on('taille')));
  if (on('taille')) parts.push({ d: path([[CX - waistHalf - 2, S_WAIST_Y + (top === S_WAIST_Y ? 6 : 0)], [CX + waistHalf + 2, S_WAIST_Y + (top === S_WAIST_Y ? 6 : 0)]]), role: 'dash' });
  const sideAt = (t: number): number => lerpP(waist, hip, t)[0];
  const fente = details.fente ?? 'AUCUNE';
  const closure = details.fermeture ?? 'ZIP_INVISIBLE';
  if (back) {
    parts.push(...closureParts(closure === 'ZIP_INVISIBLE' ? closure : '', top, 14, sideAt(0.1), on('fermeture')));
    if (fente === 'DOS') parts.push({ d: path([[CX, hemY + 1], [CX, hemY - 16]]), role: on('fente') ? 'detail' : 'line' });
  } else {
    parts.push(...closureParts(closure === 'ZIP_INVISIBLE' ? '' : closure, top, 14, sideAt(0.1), on('fermeture')));
    parts.push(...pleatParts(details.plis ?? 'AUCUN', top, waistHalf, on('plis')));
    parts.push(...pocketParts(details.poches ?? 'AUCUNE', top, sideAt(0.08), on('poches')));
    if (fente === 'COTE') parts.push({ d: path([hemLeft, lerpP(hemLeft, side.length > 1 ? side.at(-2)! : hip, 0.25)]), role: on('fente') ? 'detail' : 'line' });
    if (fente === 'AUCUNE' && on('fente')) parts.push({ d: path([[hemLeft[0] - 2, hemY + 3], [2 * CX - hemLeft[0] + 2, hemY + 3]]), role: 'dash' });
  }
  if (highlightHem && longueur !== 'ASYMETRIQUE') {
    parts.push({ d: path([[hemLeft[0], hemY], ...quad(hemLeft, [CX + (hemLeft[0] - CX) / 2, hemY + 2], hemCentre, 4), ...quad(hemCentre, [CX - (hemLeft[0] - CX) / 2, hemY + 2], mirrorX(hemLeft), 4)]), role: 'detail' });
    parts.push({ d: path([[hemLeft[0] - 3, hemY + 3], [2 * CX - hemLeft[0] + 3, hemY + 3]]), role: 'dash' });
  }
  return { view: back ? 'back' : 'front', parts };
};
