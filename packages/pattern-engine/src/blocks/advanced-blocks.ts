import type { PatternPieceGeometry } from '../types';

/**
 * Lot 2 of the deterministic drape blocks (Phase 5b S5): train, overskirt, draped bodice, asymmetric
 * hem. Pure functions, millimetres, closed outlines. Balloon and butterfly sleeves are NOT blocks:
 * they are the `manches` details (BALLON / PAPILLON) tuned by `fullness.sleeve` (see shared/fit.ts).
 */

const SEAM_ALLOWANCE_MM = 10;
export const TRAIN_ARC_SEGMENTS = 32;

type Outline = PatternPieceGeometry['outlineMm'];

function bboxOf(outline: Outline) {
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * Train: a half-ellipse hanging from a straight attachment edge. `attachWidthMm` is the width it is
 * sewn to (the back hem), `lengthMm` is how far it extends beyond the attachment (semi-major axis).
 */
export function computeTrain(attachWidthMm: number, lengthMm: number): PatternPieceGeometry {
  const a = attachWidthMm / 2;
  const outline: Outline = [{ x: 0, y: 0 }, { x: attachWidthMm, y: 0 }];
  for (let i = 1; i <= TRAIN_ARC_SEGMENTS - 1; i++) {
    const theta = (Math.PI * i) / TRAIN_ARC_SEGMENTS; // 0 → π, right to left
    outline.push({ x: Math.round(a + a * Math.cos(theta)), y: Math.round(lengthMm * Math.sin(theta)) });
  }
  outline.push({ x: 0, y: 0 });
  // The lowest point is at theta = π/2 — mirrored sampling keeps the half-ellipse symmetric.
  const rounded = outline.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  return {
    name: 'Traîne (demi-ellipse)',
    fabricRecommendation: 'Tulle, organza, dentelle ou crêpe fluide',
    quantity: 1,
    seamAllowanceMm: SEAM_ALLOWANCE_MM,
    grainline: { angleDegrees: 90, originX: attachWidthMm / 2, originY: lengthMm / 2 },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }], // centre-back mark on the attachment edge
    outlineMm: rounded,
  };
}

/**
 * Overskirt: an asymmetric panel that crosses the skirt on one side. Top = 60 % of the waist, hem =
 * 1.8 × the top; the high side of the diagonal hem sits at 70 % of the length.
 */
export function computeOverskirt(
  waistMm: number,
  skirtLengthMm: number,
  lengthPct: number,
  side: 'LEFT' | 'RIGHT',
): PatternPieceGeometry {
  const length = Math.round((skirtLengthMm * lengthPct) / 100);
  const top = Math.round(waistMm * 0.6);
  const hem = Math.round(top * 1.8);
  const inset = Math.round((hem - top) / 2);
  const high = Math.round(length * 0.7);
  const low = length;
  // LEFT: the longer hem corner is on the left; RIGHT mirrors it.
  const leftY = side === 'LEFT' ? low : high;
  const rightY = side === 'LEFT' ? high : low;
  return {
    name: `Surjupe asymétrique (${side === 'LEFT' ? 'gauche' : 'droite'})`,
    fabricRecommendation: 'Organza, tulle ou crêpe fluide',
    quantity: 1,
    seamAllowanceMm: SEAM_ALLOWANCE_MM,
    grainline: { angleDegrees: 90, originX: hem / 2, originY: length / 2 },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    outlineMm: [
      { x: inset, y: 0 },
      { x: inset + top, y: 0 },
      { x: hem, y: rightY },
      { x: 0, y: leftY },
      { x: inset, y: 0 },
    ],
  };
}

/**
 * Draped bodice: adds `pleats` pleat marks along the side seam of a front bodice piece and widens that
 * seam by 18 mm per pleat (the fabric the pleats consume). Returns a new piece.
 */
export function applyDrapedBodice(
  front: PatternPieceGeometry,
  pleats: number,
  side: 'LEFT' | 'RIGHT',
): PatternPieceGeometry {
  const extra = pleats * 18;
  const { maxX } = bboxOf(front.outlineMm);
  // The side seam = the points at the widest x (right of the half-front). Pushed outward; LEFT/RIGHT
  // only names where the pleats sit on the finished garment (mirrored when cut), geometry is the same.
  const outlineMm = front.outlineMm.map((p) => (p.x === maxX ? { x: p.x + extra, y: p.y } : { ...p }));
  const sideEdge = outlineMm.findIndex(
    (p, i) => i < outlineMm.length - 1 && p.x === maxX + extra && outlineMm[i + 1]!.x === maxX + extra && outlineMm[i + 1]!.y !== p.y,
  );
  const notches = [
    ...front.notches,
    ...(sideEdge >= 0
      ? Array.from({ length: pleats }, (_, i) => ({ positionAlongEdge: (i + 0.5) / pleats, edgeIndex: sideEdge }))
      : []),
  ];
  return {
    ...front,
    name: `${front.name} — drapé (${side === 'LEFT' ? 'plis à gauche' : 'plis à droite'})`,
    outlineMm,
    notches,
  };
}

/**
 * Asymmetric hem: lengthens one side of a skirt panel by up to `dropMm`, growing linearly from the
 * centre edge (x = 0) to the side. Applies to the hem points only (the bottom 10 % of the piece).
 */
export function applyAsymmetricHem(piece: PatternPieceGeometry, dropMm: number): PatternPieceGeometry {
  const { maxX, maxY, minY } = bboxOf(piece.outlineMm);
  if (maxX <= 0) return piece;
  const hemBand = maxY - (maxY - minY) * 0.1;
  const outlineMm = piece.outlineMm.map((p) =>
    p.y >= hemBand ? { x: p.x, y: Math.round(p.y + (dropMm * p.x) / maxX) } : { ...p },
  );
  return { ...piece, outlineMm, name: `${piece.name} — ourlet asymétrique` };
}
