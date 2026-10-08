import type { PatternPieceGeometry } from '../types';
import type { SleeveSpec } from './cut-profile';
import { fitSleeveDims } from './fit';

type Outline = PatternPieceGeometry['outlineMm'];

/** Skirt panel: straight, A-line/flared, or fishtail (narrow to the knee, flaring below). */
export function skirtOutline(
  waistWidth: number,
  hipWidth: number,
  hemWidth: number,
  length: number,
  fishtail: boolean,
): Outline {
  const hipDepth = Math.min(200, length / 2);
  const points = [
    { x: 0, y: 0 },
    { x: waistWidth, y: 10 },
    { x: hipWidth, y: hipDepth },
  ];
  if (fishtail) {
    points.push({ x: hipWidth * 0.9, y: length * 0.55 });
  }
  points.push({ x: hemWidth, y: length }, { x: 0, y: length }, { x: 0, y: 0 });
  return points;
}

/** Flat sleeve: cap, then a trapezoid down to the cuff. `topWidthMm` is the full circumference. */
export function sleeveOutline(
  topWidthMm: number,
  cuffWidthMm: number,
  capHeightMm: number,
  lengthMm: number,
): Outline {
  const inset = (topWidthMm - cuffWidthMm) / 2;
  return [
    { x: 0, y: capHeightMm },
    { x: topWidthMm / 2, y: 0 },
    { x: topWidthMm, y: capHeightMm },
    { x: topWidthMm - inset, y: capHeightMm + lengthMm },
    { x: inset, y: capHeightMm + lengthMm },
    { x: 0, y: capHeightMm },
  ];
}

export function sleevePiece(
  name: string,
  tourPoitrineMm: number,
  sleeve: SleeveSpec,
  fabricRecommendation: string | null = null,
  seamAllowanceMm = 10,
  measurements: Record<string, number> = {},
): PatternPieceGeometry {
  const dims = fitSleeveDims(
    {
      topMm: (tourPoitrineMm / 3.2) * sleeve.topRatio,
      cuffMm: (tourPoitrineMm / 3.2) * sleeve.cuffRatio,
      capMm: 150,
    },
    measurements,
  );
  const capHeight = dims.capMm;
  const top = dims.topMm;
  const cuff = dims.cuffMm;
  return {
    name,
    fabricRecommendation,
    quantity: 2,
    seamAllowanceMm,
    grainline: { angleDegrees: 90, originX: top / 2, originY: (capHeight + sleeve.lengthMm) / 2 },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    outlineMm: sleeveOutline(top, cuff, capHeight, sleeve.lengthMm),
  };
}
