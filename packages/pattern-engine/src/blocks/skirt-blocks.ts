import type { PatternPieceGeometry } from '../types';

/**
 * Deterministic skirt blocks (Phase 5b S4). Pure functions: finished waist circumference and skirt
 * length in, closed flat pieces (millimetres) out. `waistMm` is the FULL waist circumference the
 * skirt must close around (body + ease), so a block never depends on a rule's own panel widths.
 */

export interface SkirtBlockInput {
  waistMm: number;
  lengthMm: number;
  fabricRecommendation?: string | null;
}

const SEAM_ALLOWANCE_MM = 10;
/** Segments per arc of a circle-skirt piece (65 sampled points per arc). */
export const CIRCLE_ARC_SEGMENTS = 64;

function rectangle(widthMm: number, heightMm: number): PatternPieceGeometry['outlineMm'] {
  return [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: heightMm },
    { x: 0, y: heightMm },
    { x: 0, y: 0 },
  ];
}

/** Gathered skirt: a rectangle `fullness` times the waist, gathered onto the waistband. */
export function computeGatheredSkirt(input: SkirtBlockInput & { fullness: number }): PatternPieceGeometry[] {
  const panelWidth = Math.round((input.waistMm * input.fullness) / 2);
  return [
    {
      name: 'Jupe froncée (panneau)',
      fabricRecommendation: input.fabricRecommendation ?? null,
      quantity: 2, // devant + dos
      seamAllowanceMm: SEAM_ALLOWANCE_MM,
      grainline: { angleDegrees: 90, originX: panelWidth / 2, originY: input.lengthMm / 2 },
      // Quarter marks along the waist edge: gather evenly between them.
      notches: [0.25, 0.5, 0.75].map((positionAlongEdge) => ({ positionAlongEdge, edgeIndex: 0 })),
      outlineMm: rectangle(panelWidth, input.lengthMm),
    },
  ];
}

/**
 * Pleated skirt: finished waist + the fabric each pleat takes. `depthMm` is the extra fabric one
 * pleat consumes; a box pleat (two folds) takes twice as much as a knife pleat. Pleat marks are
 * notches along the waist edge.
 */
export function computePleatedSkirt(
  input: SkirtBlockInput & { pleats: number; depthMm: number; type: 'KNIFE' | 'BOX' },
): PatternPieceGeometry[] {
  const extraPerPleat = input.type === 'BOX' ? input.depthMm * 2 : input.depthMm;
  const totalWidth = input.waistMm + input.pleats * extraPerPleat;
  const panelWidth = Math.round(totalWidth / 2);
  const perPanel = Math.max(1, Math.ceil(input.pleats / 2));
  return [
    {
      name: input.type === 'BOX' ? 'Jupe plissée plis creux (panneau)' : 'Jupe plissée plis plats (panneau)',
      fabricRecommendation: input.fabricRecommendation ?? null,
      quantity: 2,
      seamAllowanceMm: SEAM_ALLOWANCE_MM,
      grainline: { angleDegrees: 90, originX: panelWidth / 2, originY: input.lengthMm / 2 },
      notches: Array.from({ length: perPanel }, (_, i) => ({
        positionAlongEdge: (i + 0.5) / perPanel,
        edgeIndex: 0,
      })),
      outlineMm: rectangle(panelWidth, input.lengthMm),
    },
  ];
}

/**
 * Circle skirt: an annular sector whose inner arc equals the waist.
 * `r_in = waist / (2π · fraction)`; `fraction` 1 = full circle (cut as two half pieces, since a
 * ring cannot be a single closed outline), 0.5 = half circle, 0.25 = quarter circle.
 */
export function computeCircleSkirt(
  input: SkirtBlockInput & { fraction: 0.25 | 0.5 | 1 },
): PatternPieceGeometry[] {
  const innerRadius = input.waistMm / (2 * Math.PI * input.fraction);
  const outerRadius = innerRadius + input.lengthMm;
  const pieceAngle = input.fraction === 1 ? Math.PI : 2 * Math.PI * input.fraction;

  const arc = (radius: number, from: number, to: number) =>
    Array.from({ length: CIRCLE_ARC_SEGMENTS + 1 }, (_, i) => {
      const phi = from + ((to - from) * i) / CIRCLE_ARC_SEGMENTS;
      return { x: radius * Math.sin(phi), y: radius * Math.cos(phi) };
    });

  const half = pieceAngle / 2;
  const raw = [...arc(innerRadius, -half, half), ...arc(outerRadius, half, -half)];
  const minX = Math.min(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const outline = raw.map((p) => ({ x: Math.round(p.x - minX), y: Math.round(p.y - minY) }));
  outline.push({ ...outline[0]! });

  const width = Math.max(...outline.map((p) => p.x));
  const height = Math.max(...outline.map((p) => p.y));
  const names: Record<number, string> = {
    0.25: 'Jupe quart de cercle',
    0.5: 'Jupe demi-cercle',
    1: 'Jupe cercle (demi-pièce)',
  };
  return [
    {
      name: names[input.fraction]!,
      fabricRecommendation: input.fabricRecommendation ?? null,
      quantity: input.fraction === 1 ? 2 : 1,
      seamAllowanceMm: SEAM_ALLOWANCE_MM,
      grainline: { angleDegrees: 90, originX: width / 2, originY: height / 2 },
      // Centre-front / centre-back mark at the middle of the waist arc.
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
      outlineMm: outline,
    },
  ];
}
