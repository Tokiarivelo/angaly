import type { PatternPieceGeometry } from '../types';

export const DEFAULT_FABRIC_WIDTH_MM = 1400;
const WASTE_FACTOR = 1.12;

interface Box {
  w: number;
  h: number;
}

export function pieceBox(piece: PatternPieceGeometry): Box {
  const xs = piece.outlineMm.map((p) => p.x);
  const ys = piece.outlineMm.map((p) => p.y);
  const margin = piece.seamAllowanceMm * 2;
  return { w: Math.max(...xs) - Math.min(...xs) + margin, h: Math.max(...ys) - Math.min(...ys) + margin };
}

/**
 * Indicative fabric length for a 140 cm-wide fabric: area of every piece's bounding box (seam
 * allowance included) × quantity ÷ fabric width, plus 12 % for cutting waste, rounded up to 5 cm.
 * Pieces wider than the fabric (in both orientations) are reported so the caller can warn.
 */
export function estimateYardage(
  pieces: PatternPieceGeometry[],
  fabricWidthMm: number = DEFAULT_FABRIC_WIDTH_MM,
): { fabricWidthMm: number; lengthMm: number; method: string; oversize: Array<{ name: string; neededWidthMm: number }> } {
  let area = 0;
  const oversize: Array<{ name: string; neededWidthMm: number }> = [];
  for (const piece of pieces) {
    const { w, h } = pieceBox(piece);
    if (Math.min(w, h) > fabricWidthMm) {
      oversize.push({ name: piece.name, neededWidthMm: Math.ceil(Math.min(w, h)) });
    }
    area += w * h * piece.quantity;
  }
  const lengthMm = Math.ceil((area / fabricWidthMm) * WASTE_FACTOR / 50) * 50;
  return {
    fabricWidthMm,
    lengthMm,
    method: `somme des encombrements des pièces ÷ laize ${fabricWidthMm / 10} cm, +12 % de chutes`,
    oversize,
  };
}
