import type { PatternPieceGeometry } from '../types';

/** Smallest plausible pattern piece (mm²): below this a piece is almost certainly degenerate. */
const MIN_AREA_MM2 = 2_500; // 5 cm × 5 cm

function signedArea(outline: PatternPieceGeometry['outlineMm']): number {
  let sum = 0;
  for (let i = 0; i < outline.length - 1; i++) {
    const a = outline[i]!;
    const b = outline[i + 1]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function segmentsCross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const o = (p: typeof a, q: typeof a, r: typeof a) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = o(a, b, c);
  const d2 = o(a, b, d);
  const d3 = o(c, d, a);
  const d4 = o(c, d, b);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** True when two non-adjacent edges of the outline properly cross. */
export function hasSelfIntersection(outline: PatternPieceGeometry['outlineMm']): boolean {
  const n = outline.length - 1; // last point repeats the first
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent through the closing edge
      if (segmentsCross(outline[i]!, outline[i + 1]!, outline[j]!, outline[j + 1]!)) return true;
    }
  }
  return false;
}

/**
 * Non-throwing guard-rails run on every generation: a piece that is not closed, has non-finite
 * coordinates, a negligible area or a self-crossing outline is reported as a warning so the
 * couturière never mistakes it for a cuttable piece.
 */
export function checkPieceGeometry(pieces: PatternPieceGeometry[]): string[] {
  const warnings: string[] = [];
  for (const piece of pieces) {
    const outline = piece.outlineMm;
    if (outline.length < 4) {
      warnings.push(`Pièce « ${piece.name} » : contour insuffisant (${outline.length} points).`);
      continue;
    }
    if (outline.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
      warnings.push(`Pièce « ${piece.name} » : coordonnées invalides — ne pas découper.`);
      continue;
    }
    const first = outline[0]!;
    const last = outline[outline.length - 1]!;
    if (first.x !== last.x || first.y !== last.y) {
      warnings.push(`Pièce « ${piece.name} » : contour non fermé.`);
    }
    if (Math.abs(signedArea(outline)) < MIN_AREA_MM2) {
      warnings.push(`Pièce « ${piece.name} » : surface quasi nulle — vérifiez les mesures et réglages.`);
    }
    if (hasSelfIntersection(outline)) {
      warnings.push(`Pièce « ${piece.name} » : le contour se croise — vérifiez les mesures et réglages.`);
    }
  }
  return warnings;
}
