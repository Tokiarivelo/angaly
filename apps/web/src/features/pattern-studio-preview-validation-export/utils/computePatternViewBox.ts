export interface PatternOutlinePoint {
  x: number;
  y: number;
}

export interface PatternViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const DEFAULT_VIEW_BOX: PatternViewBox = { minX: 0, minY: 0, width: 240, height: 280 };

/**
 * Computes an SVG viewBox that fits the full outline of a pattern piece.
 * Real pattern pieces (from packages/pattern-engine or the AI service) span
 * mm coordinates far beyond any single fixed canvas size, so the viewBox
 * must be derived from the actual outline bounds — a fixed viewBox clips
 * pieces larger than it, and CSS-transform zoom cannot recover content the
 * SVG already clipped at its own boundary.
 */
export const computePatternViewBox = (
  outline: PatternOutlinePoint[] | undefined | null,
  paddingRatio = 0.15,
): PatternViewBox => {
  if (!outline || outline.length === 0) {
    return DEFAULT_VIEW_BOX;
  }

  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;
  const padding = Math.max(boundsWidth, boundsHeight) * paddingRatio || 20;

  return {
    minX: minX - padding,
    minY: minY - padding,
    width: boundsWidth + padding * 2,
    height: boundsHeight + padding * 2,
  };
};

export const toViewBoxAttribute = (box: PatternViewBox): string =>
  `${box.minX} ${box.minY} ${box.width} ${box.height}`;
