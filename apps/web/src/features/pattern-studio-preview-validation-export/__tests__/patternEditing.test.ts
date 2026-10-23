import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import {
  constrainAngle,
  createDraftPiece,
  duplicatePiece,
  hasSelfIntersection,
  insertPoint,
  mirrorPolygon,
  nearestOnOutline,
  nearestVertex,
  perimeterMm,
  pieceAreaCm2,
  pieceOutline,
  removePoint,
  resizePolygon,
  rotatePolygon,
  scalePolygon,
  setEdgeLength,
  simplifyPolygon,
  smoothPolygon,
  snapPoint,
  snapValue,
  toggleNotch,
  withOutline,
} from '../utils/pattern-editing';

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const piece = (outlineMm: Array<{ x: number; y: number }>, extra: Partial<PatternPieceDto> = {}): PatternPieceDto => ({
  id: 'p1',
  versionId: 'v1',
  name: 'Devant',
  dimensionsJson: { widthMm: 100, heightMm: 100, outlineMm },
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: { angleDegrees: 90, originX: 50, originY: 50 },
  seamAllowanceCm: 1,
  notchesJson: [],
  ...extra,
});

describe('outline <-> piece', () => {
  it('drops the closing point and writes it back when the source was closed', () => {
    const closed = piece([...square, square[0]!]);
    expect(pieceOutline(closed)).toHaveLength(4);
    const edited = withOutline(closed, [...square.slice(0, 3), { x: 0, y: 150 }]);
    const out = (edited.dimensionsJson as { outlineMm: unknown[]; heightMm: number }).outlineMm;
    expect(out).toHaveLength(5);
    expect((edited.dimensionsJson as { heightMm: number }).heightMm).toBe(150);
  });

  it('keeps an open outline open and recomputes the size', () => {
    const edited = withOutline(piece(square), resizePolygon(square, 200, 50));
    expect((edited.dimensionsJson as { widthMm: number; heightMm: number })).toMatchObject({ widthMm: 200, heightMm: 50 });
    expect((edited.dimensionsJson as { outlineMm: unknown[] }).outlineMm).toHaveLength(4);
  });

  it('returns no outline for a degenerate piece', () => {
    expect(pieceOutline(piece([{ x: 0, y: 0 }]))).toEqual([]);
  });
});

describe('vertices', () => {
  it('finds the nearest edge point and the nearest vertex', () => {
    const hit = nearestOnOutline(square, { x: 50, y: -10 })!;
    expect(hit).toMatchObject({ edgeIndex: 0, t: 0.5, distance: 10 });
    expect(nearestVertex(square, { x: 98, y: 3 }, 5)?.index).toBe(1);
    expect(nearestVertex(square, { x: 50, y: 50 }, 5)).toBeNull();
  });

  it('inserts a point and splits notches around it', () => {
    const result = insertPoint(square, [{ edgeIndex: 0, positionAlongEdge: 0.25 }, { edgeIndex: 0, positionAlongEdge: 0.75 }, { edgeIndex: 2, positionAlongEdge: 0.5 }], 0, 0.5);
    expect(result.polygon).toHaveLength(5);
    expect(result.polygon[1]).toEqual({ x: 50, y: 0 });
    expect(result.index).toBe(1);
    expect(result.notches).toEqual([
      { edgeIndex: 0, positionAlongEdge: 0.5 },
      { edgeIndex: 1, positionAlongEdge: 0.5 },
      { edgeIndex: 3, positionAlongEdge: 0.5 },
    ]);
  });

  it('removes a point, merging notches, but never below 3 points', () => {
    const result = removePoint(square, [{ edgeIndex: 0, positionAlongEdge: 0.5 }, { edgeIndex: 1, positionAlongEdge: 0.5 }, { edgeIndex: 2, positionAlongEdge: 0.3 }], 1);
    expect(result.polygon).toHaveLength(3);
    expect(result.notches).toEqual([
      { edgeIndex: 0, positionAlongEdge: 0.25 },
      { edgeIndex: 0, positionAlongEdge: 0.75 },
      { edgeIndex: 1, positionAlongEdge: 0.3 },
    ]);
    const triangle = square.slice(0, 3);
    expect(removePoint(triangle, [], 0).polygon).toBe(triangle);
  });

  it('keeps notch indexes valid when removing vertex 0', () => {
    const result = removePoint(square, [{ edgeIndex: 3, positionAlongEdge: 0.5 }, { edgeIndex: 0, positionAlongEdge: 0.5 }], 0);
    expect(result.polygon).toHaveLength(3);
    expect(result.notches.every((n) => n.edgeIndex >= 0 && n.edgeIndex < 3)).toBe(true);
  });
});

describe('measurements', () => {
  it('sets an exact edge length by sliding the end vertex', () => {
    const next = setEdgeLength(square, 0, 150);
    expect(next[1]).toEqual({ x: 150, y: 0 });
    expect(setEdgeLength(square, 0, 0)).toBe(square);
  });

  it('resizes to exact width and height, scales, rotates', () => {
    const r = resizePolygon(square, 200, undefined);
    expect(r[1]).toEqual({ x: 200, y: 0 });
    expect(r[2]).toEqual({ x: 200, y: 100 });
    const s = scalePolygon(square, 2);
    expect(s[0]).toEqual({ x: -50, y: -50 });
    const turned = rotatePolygon(square, 90);
    expect(turned[0]!.x).toBeCloseTo(100);
    expect(turned[0]!.y).toBeCloseTo(0);
  });

  it('computes area and perimeter', () => {
    expect(pieceAreaCm2(square)).toBe(100);
    expect(perimeterMm(square)).toBe(400);
  });
});

describe('transforms', () => {
  it('mirrors horizontally and remaps notches', () => {
    const { polygon, notches } = mirrorPolygon(
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      [{ edgeIndex: 0, positionAlongEdge: 0.25 }],
    );
    expect(polygon[0]).toEqual({ x: 100, y: 100 });
    expect(notches[0]).toEqual({ edgeIndex: 2, positionAlongEdge: 0.75 });
    // The notch stays at the same physical spot: (25,0) -> (75,0), which lies on the new edge 2 (100,0)->(0,0).
    const a = polygon[2]!;
    const b = polygon[3]!;
    expect(a.x + (b.x - a.x) * 0.75).toBe(75);
  });

  it('smooths into twice as many points and simplifies back', () => {
    const smooth = smoothPolygon(square);
    expect(smooth).toHaveLength(8);
    const dense = Array.from({ length: 40 }, (_, i) => ({ x: i * 2.5, y: 0 })).concat([{ x: 100, y: 100 }, { x: 0, y: 100 }]);
    const simple = simplifyPolygon(dense, 0.5);
    expect(simple.length).toBeLessThan(dense.length);
    expect(simple.length).toBeGreaterThanOrEqual(3);
    expect(simplifyPolygon(square, 5)).toHaveLength(4);
  });
});

describe('snapping & constraints', () => {
  it('snaps to the grid and to a nearby vertex', () => {
    expect(snapValue(12.4, 5)).toBe(10);
    expect(snapValue(12.4, 0)).toBe(12.4);
    expect(snapPoint({ x: 52, y: 3 }, { gridMm: 5 })).toEqual({ x: 50, y: 5 });
    expect(snapPoint({ x: 98, y: 2 }, { gridMm: 5, vertices: square, vertexReach: 6 })).toEqual({ x: 100, y: 0 });
  });

  it('constrains to 45° steps', () => {
    const p = constrainAngle({ x: 0, y: 0 }, { x: 100, y: 12 });
    expect(p.x).toBeCloseTo(Math.hypot(100, 12));
    expect(p.y).toBeCloseTo(0);
    expect(constrainAngle({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
  });
});

describe('notches & validity', () => {
  it('toggles notches', () => {
    const added = toggleNotch([], { edgeIndex: 1, t: 0.4 });
    expect(added).toEqual([{ edgeIndex: 1, positionAlongEdge: 0.4 }]);
    expect(toggleNotch(added, { edgeIndex: 1, t: 0.41 })).toEqual([]);
  });

  it('detects a bow-tie as self-intersecting', () => {
    expect(hasSelfIntersection(square)).toBe(false);
    expect(hasSelfIntersection([{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 100, y: 0 }, { x: 0, y: 100 }])).toBe(true);
  });
});

describe('new pieces', () => {
  it('creates a draft piece with a centred grainline and a 1 cm allowance', () => {
    const draft = createDraftPiece(square, 'Poche', 'v1');
    expect(draft.id.startsWith('draft-')).toBe(true);
    expect(draft.seamAllowanceCm).toBe(1);
    expect(draft.grainlineJson).toMatchObject({ originX: 50, originY: 50 });
    expect((draft.dimensionsJson as { widthMm: number }).widthMm).toBe(100);
  });

  it('duplicates a piece with a unique id, an offset and a moved grainline', () => {
    const copy = duplicatePiece(piece(square), 'Devant (copie)');
    expect(copy.id).not.toBe('p1');
    expect(copy.name).toBe('Devant (copie)');
    expect(pieceOutline(copy)[0]).toEqual({ x: 20, y: 20 });
    expect(copy.grainlineJson).toMatchObject({ originX: 70, originY: 70 });
  });
});

describe('transformPiece & pointInPolygon', () => {
  it('keeps the grainline at the same relative spot after a resize', async () => {
    const { transformPiece, resizePolygon: resize } = await import('../utils/pattern-editing');
    const base = piece(square);
    const next = transformPiece(base, resize(square, 200, 100));
    expect(next.grainlineJson).toMatchObject({ originX: 100, originY: 50, angleDegrees: 90 });
  });

  it('turns the grainline with the piece', async () => {
    const { transformPiece, rotatePolygon: rotate } = await import('../utils/pattern-editing');
    const next = transformPiece(piece(square), rotate(square, 90), { rotateDegrees: 90 });
    expect(next.grainlineJson?.angleDegrees).toBe(180);
  });

  it('tests membership', async () => {
    const { pointInPolygon } = await import('../utils/pattern-editing');
    expect(pointInPolygon(square, { x: 50, y: 50 })).toBe(true);
    expect(pointInPolygon(square, { x: 150, y: 50 })).toBe(false);
  });
});
