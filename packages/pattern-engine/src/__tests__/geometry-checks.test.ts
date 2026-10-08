import { describe, it, expect } from 'vitest';
import { checkPieceGeometry, hasSelfIntersection } from '../shared/geometry-checks';
import type { PatternPieceGeometry } from '../types';

const piece = (outlineMm: PatternPieceGeometry['outlineMm'], name = 'P'): PatternPieceGeometry => ({
  name,
  fabricRecommendation: null,
  quantity: 1,
  outlineMm,
  seamAllowanceMm: 10,
  grainline: { angleDegrees: 90, originX: 0, originY: 0 },
  notches: [],
});

const square = [
  { x: 0, y: 0 },
  { x: 300, y: 0 },
  { x: 300, y: 300 },
  { x: 0, y: 300 },
  { x: 0, y: 0 },
];

describe('checkPieceGeometry', () => {
  it('accepts a sound piece', () => {
    expect(checkPieceGeometry([piece(square)])).toEqual([]);
  });

  it('flags an open contour', () => {
    expect(checkPieceGeometry([piece([...square.slice(0, 4), { x: 5, y: 5 }])])[0]).toMatch(/non fermé/);
  });

  it('flags NaN coordinates and tiny outlines', () => {
    expect(checkPieceGeometry([piece([...square.slice(0, 3), { x: Number.NaN, y: 1 }, square[0]!])])[0]).toMatch(/invalides/);
    expect(checkPieceGeometry([piece([{ x: 0, y: 0 }, { x: 1, y: 0 }])])[0]).toMatch(/insuffisant/);
  });

  it('flags a negligible area', () => {
    const flat = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0 }];
    expect(checkPieceGeometry([piece(flat)])[0]).toMatch(/surface quasi nulle/);
  });

  it('flags a bow-tie outline', () => {
    const bow = [{ x: 0, y: 0 }, { x: 300, y: 300 }, { x: 300, y: 0 }, { x: 0, y: 300 }, { x: 0, y: 0 }];
    expect(hasSelfIntersection(bow)).toBe(true);
    expect(hasSelfIntersection(square)).toBe(false);
    expect(checkPieceGeometry([piece(bow, 'Noeud')]).some((w) => /Noeud.*se croise/.test(w))).toBe(true);
  });
});
