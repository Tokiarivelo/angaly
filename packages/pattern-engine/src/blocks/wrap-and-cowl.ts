import type { PatternPieceGeometry } from '../types';

/** Share of the overlap the under-wrap piece keeps (the part hidden below the closure). */
const UNDERLAP_RATIO = 0.35;

function extendCentreFront(piece: PatternPieceGeometry, extensionMm: number): PatternPieceGeometry {
  const outlineMm = piece.outlineMm.map((p) => (p.x === 0 ? { x: -extensionMm, y: p.y } : { ...p }));
  // Closure marks on the extended centre-front edge (first vertical edge found there).
  const edgeIndex = outlineMm.findIndex(
    (p, i) => i < outlineMm.length - 1 && p.x === -extensionMm && outlineMm[i + 1]!.x === -extensionMm && outlineMm[i + 1]!.y !== p.y,
  );
  return {
    ...piece,
    outlineMm,
    grainline: { ...piece.grainline, originX: piece.grainline.originX - extensionMm / 2 },
    notches: [
      ...piece.notches,
      ...(edgeIndex >= 0
        ? [0.2, 0.8].map((positionAlongEdge) => ({ positionAlongEdge, edgeIndex }))
        : []),
    ],
  };
}

/**
 * Wrap front: a half front cut on the fold becomes two pieces — the over-wrap (centre front extended
 * by `overlapMm`, closure notches) and the under-wrap (smaller extension). `side` says which side
 * wraps over.
 */
export function applyWrapFront(
  front: PatternPieceGeometry,
  overlapMm: number,
  side: 'LEFT' | 'RIGHT',
): PatternPieceGeometry[] {
  const where = side === 'LEFT' ? 'gauche sur droite' : 'droite sur gauche';
  return [
    { ...extendCentreFront(front, overlapMm), name: `${front.name} — dessus croisé (${where})`, quantity: 1 },
    {
      ...extendCentreFront(front, Math.round(overlapMm * UNDERLAP_RATIO)),
      name: `${front.name} — dessous croisé`,
      quantity: 1,
    },
  ];
}

/**
 * Cowl neck (col bénitier): a trapezoid cut on the bias (grainline at 45°). The top edge is the neck
 * opening; the bottom is wider by 1.2 × the drape depth so the fabric falls in soft folds.
 */
export function computeCowlNeck(neckWidthMm: number, depthMm: number): PatternPieceGeometry {
  const top = Math.round(neckWidthMm * 2);
  const bottom = Math.round(top + depthMm * 1.2);
  const height = Math.round(depthMm + 120);
  const inset = Math.round((bottom - top) / 2);
  return {
    name: 'Col bénitier (taillé dans le biais)',
    fabricRecommendation: 'Jersey, crêpe ou satin fluide — coupe en biais',
    quantity: 1,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 45, originX: bottom / 2, originY: height / 2 },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    outlineMm: [
      { x: inset, y: 0 },
      { x: inset + top, y: 0 },
      { x: bottom, y: height },
      { x: 0, y: height },
      { x: inset, y: 0 },
    ],
  };
}
