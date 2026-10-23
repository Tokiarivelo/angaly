import { describe, expect, it } from 'vitest';
import {
  fitViewport,
  gridStepFor,
  MAX_MM_PER_PX,
  MIN_MM_PER_PX,
  panByPx,
  screenToWorld,
  viewBoxOf,
  zoomAt,
  zoomPercent,
} from '../utils/studio-viewport';

const size = { width: 800, height: 600 };
const bounds = { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 };

describe('studio viewport', () => {
  it('fits the bounds centred with a margin', () => {
    const vp = fitViewport(bounds, size, 50);
    expect(vp.cx).toBe(200);
    expect(vp.cy).toBe(150);
    const box = viewBoxOf(vp, size);
    expect(box.w).toBeGreaterThanOrEqual(400);
    expect(box.h).toBeGreaterThanOrEqual(300);
    expect(box.w / box.h).toBeCloseTo(800 / 600);
  });

  it('falls back to a neutral viewport without bounds or size', () => {
    expect(fitViewport(null, size)).toEqual({ cx: 0, cy: 0, mmPerPx: 1 });
    expect(fitViewport(bounds, { width: 0, height: 0 })).toEqual({ cx: 0, cy: 0, mmPerPx: 1 });
  });

  it('maps screen to world and back through the viewBox', () => {
    const vp = { cx: 100, cy: 50, mmPerPx: 0.5 };
    expect(screenToWorld(vp, size, 400, 300)).toEqual({ x: 100, y: 50 });
    expect(screenToWorld(vp, size, 0, 0)).toEqual({ x: -100, y: -100 });
    const box = viewBoxOf(vp, size);
    expect(box).toEqual({ x: -100, y: -100, w: 400, h: 300 });
  });

  it('zooms about the cursor so the point under it does not move', () => {
    const vp = { cx: 100, cy: 100, mmPerPx: 1 };
    const before = screenToWorld(vp, size, 200, 150);
    const zoomed = zoomAt(vp, size, 200, 150, 2);
    expect(zoomed.mmPerPx).toBe(0.5);
    const after = screenToWorld(zoomed, size, 200, 150);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('clamps the zoom range', () => {
    const vp = { cx: 0, cy: 0, mmPerPx: 1 };
    expect(zoomAt(vp, size, 0, 0, 1e6).mmPerPx).toBe(MIN_MM_PER_PX);
    expect(zoomAt(vp, size, 0, 0, 1e-6).mmPerPx).toBe(MAX_MM_PER_PX);
  });

  it('pans opposite to the drag', () => {
    expect(panByPx({ cx: 0, cy: 0, mmPerPx: 2 }, 10, -5)).toEqual({ cx: -20, cy: 10, mmPerPx: 2 });
  });

  it('reports zoom and an adaptive grid', () => {
    expect(zoomPercent({ cx: 0, cy: 0, mmPerPx: 0.2645833 })).toBe(100);
    expect(gridStepFor({ cx: 0, cy: 0, mmPerPx: 0.05 }).minor).toBe(1);
    expect(gridStepFor({ cx: 0, cy: 0, mmPerPx: 1 }).minor).toBe(50);
    const { minor, major } = gridStepFor({ cx: 0, cy: 0, mmPerPx: 0.5 });
    expect(major).toBeGreaterThan(minor);
  });
});
