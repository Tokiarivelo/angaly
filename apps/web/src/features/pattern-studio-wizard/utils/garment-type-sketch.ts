/**
 * Thumbnails of the wizard's first choices: one flat per garment type, and the silhouette of each cut on the garment
 * chosen (a dress, a top, a skirt, trousers or a suit). Same 100 × 150 box and roles as `option-sketch.ts`.
 */
import type { SketchGarment } from '../consts/garment-details.const';
import { sketchGarmentFor } from '../consts/garment-details.const';
import { skirtSketch, trouserSketch } from './garment-sketch';
import { collarParts, HIP, NECK_HALF, NECK_Y, SHOULDER, sleeveParts, UNDERARM, WAIST } from './option-sketch';
import { both, CX, mirrorX, path, quad, type P, type Sketch, type SketchPart } from './sketch-geometry';

/** Silhouette of a cut: waist half-width, the side from the hips down, the hem (left half, y down). */
interface Silhouette {
  waist: number;
  /** Points of the side below the waist, ending at the hem's outer corner. */
  side: P[];
}

const DRESS_HEM_Y = 132;

const dressSilhouette = (cut: string): Silhouette => {
  const h = DRESS_HEM_Y;
  switch (cut) {
    case 'AJUSTEE':
      return { waist: 9.5, side: [[36, HIP[1]], [CX - 15, h]] };
    case 'EVASEE':
      return { waist: 10.5, side: [[34, HIP[1]], [CX - 30, h]] };
    case 'SIRENE':
      return { waist: 9.5, side: [[35.5, HIP[1]], [CX - 12.5, 106], ...quad([CX - 12.5, 106], [CX - 15, h - 6], [CX - 30, h], 5)] };
    case 'PRINCESSE':
      return { waist: 9.5, side: quad([CX - 9.5, WAIST[1]], [31, 82], [CX - 38, h], 7) };
    case 'OVERSIZE':
      return { waist: 14.5, side: [[33, HIP[1]], [CX - 25, h]] };
    default:
      return { waist: 10.5, side: [[35, HIP[1]], [CX - 19, h]] };
  }
};

const TOP_HEM_Y = 84;

const topSilhouette = (cut: string): Silhouette => {
  const h = TOP_HEM_Y;
  switch (cut) {
    case 'AJUSTEE':
      return { waist: 9.5, side: [[CX - 14.5, h]] };
    case 'EVASEE':
      return { waist: 12.5, side: [[CX - 20, h]] };
    case 'PRINCESSE':
      // A basque: fitted at the waist, flaring out over the hips.
      return { waist: 9.5, side: [[CX - 11, WAIST[1] + 4], ...quad([CX - 11, WAIST[1] + 4], [CX - 15, 74], [CX - 21, h], 4)] };
    case 'OVERSIZE':
      return { waist: 16.5, side: [[CX - 17.5, h]] };
    default:
      return { waist: 13.5, side: [[CX - 15, h]] };
  }
};

/** A front view: sleeves, the body from the neck to the silhouette's hem, a collar and the front opening if asked. */
const bodySketch = (sil: Silhouette, sleeves: string, extras: { collar?: string; opening?: boolean; buttons?: number; oversize?: boolean } = {}): Sketch => {
  const shoulder: P = extras.oversize ? [33, 24] : SHOULDER;
  const underarm: P = extras.oversize ? [32.5, 44] : UNDERARM;
  const neck: P = [CX - NECK_HALF, NECK_Y];
  const waist: P = [CX - sil.waist, WAIST[1]];
  const hem = sil.side.at(-1)!;
  const left: P[] = [
    [CX, NECK_Y + 6],
    ...quad([CX, NECK_Y + 6], [CX - 4, NECK_Y + 6], neck, 4),
    shoulder,
    ...quad(shoulder, [shoulder[0] + 1.5, 32], underarm, 4),
    ...quad(underarm, [underarm[0] + 2, 52], waist, 4),
    ...sil.side,
    [CX, hem[1]],
  ];
  const parts: SketchPart[] = [...sleeveParts(sleeves, false, shoulder)];
  parts.push({ d: path([...left, ...left.slice(1, -1).map(mirrorX).reverse()], true), role: 'garment' });
  if (extras.collar) parts.push(...collarParts(extras.collar));
  if (extras.opening) parts.push({ d: path([[CX, NECK_Y + 6], [CX, hem[1]]]), role: 'line' });
  for (let k = 0; k < (extras.buttons ?? 0); k += 1) {
    const y = NECK_Y + 12 + k * 9;
    parts.push({ d: `M${CX - 0.9} ${y} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0`, role: 'detailFill' });
  }
  return { view: 'front', parts };
};

/** The suit: trousers, the jacket over them (hip length, lapels, two buttons). */
const suitSketch = (cut: string): Sketch => {
  const trousers = trouserSketch('MAXI', cut === 'SIRENE' ? 'EVASEE' : cut, false);
  const jacket = bodySketch(topSilhouette(cut === 'PRINCESSE' ? 'AJUSTEE' : cut), 'LONGUES', { collar: 'CHALE', opening: true, oversize: cut === 'OVERSIZE' });
  const buttons: SketchPart[] = [62, 70].map((y) => ({ d: `M${CX - 0.9} ${y} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0`, role: 'detailFill' }));
  // The trousers below the jacket only.
  return { view: 'front', parts: [...trousers.parts.filter((p) => p.role === 'garment'), ...jacket.parts, ...buttons] };
};

/** The silhouette a cut gives the garment chosen. */
export const cutSketch = (garmentType: string, cut: string): Sketch => {
  const kind: SketchGarment = sketchGarmentFor(garmentType);
  switch (kind) {
    case 'trousers':
      return trouserSketch('MAXI', cut, false);
    case 'skirt':
      return skirtSketch('MIDI', cut, false);
    case 'suit':
      return suitSketch(cut);
    case 'top':
      return bodySketch(topSilhouette(cut), 'LONGUES', {
        opening: true,
        oversize: cut === 'OVERSIZE',
        ...(garmentType === 'CHEMISE' ? { collar: 'CHEMISIER', buttons: 6 } : { collar: 'CHALE' }),
      });
    default:
      return bodySketch(dressSilhouette(cut), 'COURTES', { oversize: cut === 'OVERSIZE' });
  }
};

/** A dress form on its stand: the garment still to be described (« Autre vêtement »). */
const dressForm = (): Sketch => {
  const left: P[] = [
    [CX, 16],
    ...quad([CX, 16], [CX - 5, 16], [CX - 6, 20], 3),
    [CX - 14, 24],
    ...quad([CX - 14, 24], [CX - 16, 40], [CX - 10.5, 62], 5),
    ...quad([CX - 10.5, 62], [CX - 16, 74], [CX - 14, 86], 4),
    [CX, 88],
  ];
  return {
    view: 'front',
    parts: [
      { d: path([...left, ...left.slice(1, -1).map(mirrorX).reverse()], true), role: 'garment' },
      { d: path([[CX, 88], [CX, 132]]), role: 'line' },
      { d: path([[CX - 14, 136], [CX, 130], [CX + 14, 136]]), role: 'line' },
      { d: path([[CX - 10, 62], [CX + 10, 62]]), role: 'dash' },
      { d: path([[CX - 15, 42], [CX + 15, 42]]), role: 'dash' },
    ],
  };
};

/** One flat per garment type of the first step (no option highlighted: collars and lapels in the second tone). */
export const garmentTypeSketch = (garmentType: string): Sketch => {
  const sketch = garmentTypeFlat(garmentType);
  return { ...sketch, parts: sketch.parts.map((p) => (p.role === 'detailFill' ? { ...p, role: 'contrast' } : p)) };
};

const garmentTypeFlat = (garmentType: string): Sketch => {
  switch (garmentType) {
    case 'ROBE':
      return cutSketch('ROBE', 'EVASEE');
    case 'JUPE':
      return skirtSketch('MIDI', 'EVASEE', false);
    case 'PANTALON':
      return trouserSketch('MAXI', 'DROITE', false);
    case 'VESTE':
      return {
        view: 'front',
        parts: [
          ...cutSketch('VESTE', 'AJUSTEE').parts,
          ...[62, 70].map((y) => ({ d: `M${CX - 0.9} ${y} a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0`, role: 'detailFill' as const })),
          ...both([[36, 74], [43, 74]], 'line', false),
        ],
      };
    case 'COSTUME':
      return suitSketch('DROITE');
    case 'CHEMISE':
      return cutSketch('CHEMISE', 'DROITE');
    case 'ROBE_MARIEE': {
      // A ball gown to the floor, long sleeves, a little train.
      const gown = bodySketch({ waist: 9.5, side: quad([CX - 9.5, WAIST[1]], [28, 84], [CX - 40, 144], 7) }, 'LONGUES');
      return { view: 'front', parts: [...gown.parts, { d: path([[CX - 9.5, WAIST[1]], [CX + 9.5, WAIST[1]]]), role: 'line' }] };
    }
    default:
      return dressForm();
  }
};
