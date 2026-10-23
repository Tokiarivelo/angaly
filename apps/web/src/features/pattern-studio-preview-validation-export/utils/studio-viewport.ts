/**
 * Pan/zoom maths for the pattern studio canvas. The viewport is a centre (mm) plus a scale (mm per CSS
 * pixel), so the SVG viewBox always has the same aspect ratio as the element and screen ↔ world
 * conversions are plain linear maps (no getScreenCTM, cheap enough for every pointer move).
 */
import type { Bounds, Point } from './pattern-geometry';

export interface Viewport {
  cx: number;
  cy: number;
  mmPerPx: number;
}

export interface Size {
  width: number;
  height: number;
}

export const MIN_MM_PER_PX = 0.05;
export const MAX_MM_PER_PX = 25;

const clampScale = (v: number): number => Math.min(MAX_MM_PER_PX, Math.max(MIN_MM_PER_PX, v));

export const fitViewport = (bounds: Bounds | null, size: Size, marginPx = 56): Viewport => {
  if (!bounds || size.width <= 0 || size.height <= 0) return { cx: 0, cy: 0, mmPerPx: 1 };
  const usableW = Math.max(size.width - marginPx * 2, 40);
  const usableH = Math.max(size.height - marginPx * 2, 40);
  const mmPerPx = clampScale(Math.max(bounds.width / usableW, bounds.height / usableH, MIN_MM_PER_PX));
  return { cx: bounds.minX + bounds.width / 2, cy: bounds.minY + bounds.height / 2, mmPerPx };
};

export const viewBoxOf = (vp: Viewport, size: Size): { x: number; y: number; w: number; h: number } => {
  const w = size.width * vp.mmPerPx;
  const h = size.height * vp.mmPerPx;
  return { x: vp.cx - w / 2, y: vp.cy - h / 2, w, h };
};

/** `sx`/`sy` are relative to the element's top-left corner. */
export const screenToWorld = (vp: Viewport, size: Size, sx: number, sy: number): Point => ({
  x: vp.cx + (sx - size.width / 2) * vp.mmPerPx,
  y: vp.cy + (sy - size.height / 2) * vp.mmPerPx,
});

/** Zooms by `factor` (>1 zooms in) keeping the world point under (sx, sy) fixed. */
export const zoomAt = (vp: Viewport, size: Size, sx: number, sy: number, factor: number): Viewport => {
  const before = screenToWorld(vp, size, sx, sy);
  const mmPerPx = clampScale(vp.mmPerPx / factor);
  const next = { ...vp, mmPerPx };
  const after = screenToWorld(next, size, sx, sy);
  return { cx: vp.cx + (before.x - after.x), cy: vp.cy + (before.y - after.y), mmPerPx };
};

export const panByPx = (vp: Viewport, dxPx: number, dyPx: number): Viewport => ({
  ...vp,
  cx: vp.cx - dxPx * vp.mmPerPx,
  cy: vp.cy - dyPx * vp.mmPerPx,
});

/** Zoom as a percentage of "1 px = 1 mm × 0.2646" i.e. real size on a 96 dpi screen. */
export const zoomPercent = (vp: Viewport): number => Math.round((0.2645833 / vp.mmPerPx) * 100);

/** Grid spacing (mm) that stays between ~8 and ~40 px on screen: 1, 5, 10, 50, 100… mm. */
export const gridStepFor = (vp: Viewport): { minor: number; major: number } => {
  const targetMm = vp.mmPerPx * 14;
  const steps = [1, 5, 10, 50, 100, 500];
  const minor = steps.find((s) => s >= targetMm) ?? 500;
  const major = minor >= 100 ? minor * 5 : minor * (minor === 1 ? 5 : minor === 5 ? 2 : 5);
  return { minor, major };
};
