import { describe, expect, it } from 'vitest';

import { computePatternViewBox, toViewBoxAttribute } from '../utils/computePatternViewBox';

describe('computePatternViewBox', () => {
  it('returns a default viewBox when the outline is empty or missing', () => {
    expect(computePatternViewBox(undefined)).toEqual({ minX: 0, minY: 0, width: 240, height: 280 });
    expect(computePatternViewBox([])).toEqual({ minX: 0, minY: 0, width: 240, height: 280 });
  });

  it('fits a small piece that would sit inside the old fixed 240x280 canvas', () => {
    const outline = [
      { x: 50, y: 40 },
      { x: 150, y: 40 },
      { x: 180, y: 240 },
      { x: 20, y: 240 },
    ];

    const box = computePatternViewBox(outline);

    // Every point of the outline must lie within the computed viewBox.
    for (const p of outline) {
      expect(p.x).toBeGreaterThanOrEqual(box.minX);
      expect(p.x).toBeLessThanOrEqual(box.minX + box.width);
      expect(p.y).toBeGreaterThanOrEqual(box.minY);
      expect(p.y).toBeLessThanOrEqual(box.minY + box.height);
    }
  });

  it('fits a real generated piece far larger than the old fixed canvas without clipping', () => {
    // Mirrors packages/pattern-engine veste.rule.ts "Manche" outline, whose
    // x coordinates reach 400 — well beyond the previous hardcoded 240x280 viewBox.
    const outline = [
      { x: 0, y: 150 },
      { x: 160, y: 0 },
      { x: 320, y: 150 },
      { x: 400, y: 0 },
      { x: 390, y: 90 },
    ];

    const box = computePatternViewBox(outline);

    expect(box.width).toBeGreaterThan(400);
    expect(box.height).toBeGreaterThan(150);

    for (const p of outline) {
      expect(p.x).toBeGreaterThanOrEqual(box.minX);
      expect(p.x).toBeLessThanOrEqual(box.minX + box.width);
      expect(p.y).toBeGreaterThanOrEqual(box.minY);
      expect(p.y).toBeLessThanOrEqual(box.minY + box.height);
    }
  });

  it('fits a piece with negative coordinates (e.g. a raised back waistband)', () => {
    const outline = [
      { x: 20, y: -30 },
      { x: 220, y: 10 },
      { x: 200, y: 180 },
      { x: 0, y: 180 },
    ];

    const box = computePatternViewBox(outline);

    for (const p of outline) {
      expect(p.x).toBeGreaterThanOrEqual(box.minX);
      expect(p.x).toBeLessThanOrEqual(box.minX + box.width);
      expect(p.y).toBeGreaterThanOrEqual(box.minY);
      expect(p.y).toBeLessThanOrEqual(box.minY + box.height);
    }
  });

  it('formats a viewBox object into the SVG viewBox attribute string', () => {
    expect(toViewBoxAttribute({ minX: -10, minY: -5, width: 100, height: 50 })).toBe(
      '-10 -5 100 50',
    );
  });
});
