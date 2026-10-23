import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { buildGarmentModel, NOT_EDITABLE, type PanelMeshData } from '../utils/garment3d/garment-model';
import {
  anchorOnTriangle,
  densifyForStroke,
  falloffWeight,
  flatDelta,
  neighbourAnchors,
  preparePiece,
  pushOf,
  sculptOutline,
  strokePiece,
  type Stroke,
  type Vec3,
} from '../utils/garment3d/sculpt';
import { pieceNotches, pieceOutline, withOutline } from '../utils/pattern-editing';
import { getBounds, type Point } from '../utils/pattern-geometry';
import reference from './fixtures/robe-pois-maxi.pieces.json';

const pieces = reference.pieces as PatternPieceDto[];
const built = buildGarmentModel(pieces, 'ROBE', reference.measurements, 'FEMME_STANDARD');
if (!built.ok) throw new Error(built.reason);
const panels = built.model.panels;
const panel = (id: string): PanelMeshData => panels.find((p) => p.id === id)!;

const rect = (w: number, h: number): Point[] => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
];
const stroke = (over: Partial<Stroke>): Stroke => ({
  tool: 'grab',
  radiusMm: 50,
  falloff: 'smooth',
  center: { x: 0, y: 0 },
  delta: { x: 0, y: 0 },
  push: 0,
  ...over,
});
const piece = (polygon: Point[]): PatternPieceDto =>
  withOutline(
    {
      id: 'p',
      versionId: 'v',
      name: 'Devant',
      dimensionsJson: {},
      fabricRecommendation: null,
      quantity: 1,
      grainlineJson: null,
      seamAllowanceCm: 1,
      notchesJson: [],
    },
    polygon,
    [{ edgeIndex: 1, positionAlongEdge: 0.5 }],
  );

/** A triangle of the panel well inside the cloth, every vertex cut from the same piece. */
const innerTriangle = (row = 20, col = 14, columns = 28): [number, number, number] => {
  const at = (i: number, j: number): number => i * (columns + 1) + j;
  return [at(row, col), at(row + 1, col), at(row, col + 1)];
};
const position = (p: PanelMeshData, v: number): Vec3 => [p.positions[v * 3]!, p.positions[v * 3 + 1]!, p.positions[v * 3 + 2]!];

describe('falloffWeight', () => {
  it('is 1 at the centre, 0 at and beyond the radius, decreasing in between', () => {
    for (const f of ['smooth', 'linear', 'sharp'] as const) {
      expect(falloffWeight(f, 0)).toBeCloseTo(1);
      expect(falloffWeight(f, 1)).toBe(0);
      expect(falloffWeight(f, 0.3)).toBeGreaterThan(falloffWeight(f, 0.6));
    }
    expect(falloffWeight('constant', 0.99)).toBe(1);
    expect(falloffWeight('smooth', 2)).toBe(0);
  });
});

describe('edit map of the draped panels', () => {
  it('tells, per vertex, the piece and the point of its outline it was draped from', () => {
    const front = panel('bodice-front');
    expect(front.edit).toBeDefined();
    const edit = front.edit!;
    expect(edit.flat).toHaveLength((front.positions.length / 3) * 2);
    expect(edit.pieceIds).toContain('p0');
    // Stacked midriff: the upper rows come from the bodice, the lower ones from the band.
    expect(edit.pieceIds).toEqual(['p0', 'p1']);
    const used = new Set(edit.piece);
    expect(used.has(0)).toBe(true);
    expect(used.has(1)).toBe(true);
    const bounds = getBounds(pieceOutline(pieces[0]!));
    for (let v = 0; v < edit.piece.length; v += 1) {
      if (edit.piece[v] !== 0) continue;
      expect(edit.flat[v * 2 + 1]!).toBeGreaterThanOrEqual(bounds.minY - 1);
      expect(edit.flat[v * 2 + 1]!).toBeLessThanOrEqual(bounds.maxY + 1);
    }
  });

  it('maps sleeves and the pleated skirt block back to their pieces', () => {
    const sleeve = panels.find((p) => p.zone === 'sleeve')!;
    expect(sleeve.edit?.pieceIds).toEqual(['p4']);
    const skirt = panel('skirt-front');
    expect(skirt.edit?.pieceIds).toEqual(['p3']);
    const b = getBounds(pieceOutline(pieces[3]!));
    for (let v = 0; v < skirt.edit!.piece.length; v += 1) {
      expect(skirt.edit!.piece[v]).not.toBe(NOT_EDITABLE);
      expect(skirt.edit!.flat[v * 2]!).toBeGreaterThanOrEqual(b.minX - 1);
      expect(skirt.edit!.flat[v * 2]!).toBeLessThanOrEqual(b.maxX + 1);
    }
  });
});

describe('anchorOnTriangle / flatDelta', () => {
  const front = panel('bodice-front');
  const tri = innerTriangle();
  const at = position(front, tri[0]);
  const anchor = anchorOnTriangle(front, tri, at, [0, 0, 1])!;

  it('finds the piece and the flat point held', () => {
    expect(anchor).not.toBeNull();
    expect(anchor.pieceId).toBe('p0');
    expect(anchor.flat.x).toBeCloseTo(front.edit!.flat[tri[0] * 2]!, 3);
    expect(anchor.flat.y).toBeCloseTo(front.edit!.flat[tri[0] * 2 + 1]!, 3);
    // The normal faces the viewer (front panel, camera in front).
    expect(anchor.normal[2]).toBeGreaterThan(0);
  });

  it('reads a displacement along the draped cloth back as the flat one', () => {
    const [a, b] = tri;
    const e = [0, 1, 2].map((k) => (front.positions[b * 3 + k]! - front.positions[a * 3 + k]!) * 0.5) as Vec3;
    const d = flatDelta(anchor, e);
    expect(d.x).toBeCloseTo((front.edit!.flat[b * 2]! - front.edit!.flat[a * 2]!) * 0.5, 1);
    expect(d.y).toBeCloseTo((front.edit!.flat[b * 2 + 1]! - front.edit!.flat[a * 2 + 1]!) * 0.5, 1);
    // Pulling straight off the cloth is not a flat displacement, but a push.
    const off = anchor.normal.map((n) => n * 0.01) as Vec3;
    expect(Math.hypot(flatDelta(anchor, off).x, flatDelta(anchor, off).y)).toBeLessThan(1);
    expect(pushOf(anchor, off)).toBeCloseTo(10, 3);
  });

  it('refuses a panel without an edit map', () => {
    const { edit: _drop, ...bare } = front;
    expect(anchorOnTriangle(bare, tri, at, [0, 0, 1])).toBeNull();
  });

  it('reaches the back piece across the side seam', () => {
    // Side seam of the front at the bust: last column of the grid.
    const seam = 15 * 29 + 28;
    const side = position(front, seam);
    const held = anchorOnTriangle(front, [seam, seam - 1, seam + 29], side, [1, 0, 0])!;
    const others = neighbourAnchors(panels, held, side, 60, 'smooth');
    const back = others.find((a) => a.pieceId === 'p2');
    expect(back).toBeDefined();
    expect(back!.weight).toBeGreaterThan(0.5);
    // Nothing far away (the skirt hem, the other side).
    expect(others.every((a) => a.pieceId !== 'p3')).toBe(true);
  });
});

describe('sculptOutline', () => {
  const square = rect(200, 400);

  it('grab: moves the outline under the brush, not beyond its radius', () => {
    const out = sculptOutline(square, stroke({ center: { x: 200, y: 400 }, delta: { x: 20, y: 10 } }));
    expect(out[2]).toEqual({ x: 220, y: 410 });
    expect(out[0]).toEqual(square[0]);
    expect(out[1]).toEqual(square[1]);
  });

  it('width: lets out only the side held, over a band of heights', () => {
    const dense = densifyForStroke(square, [], { tool: 'width', radiusMm: 100, falloff: 'smooth', center: { x: 200, y: 200 } }).polygon;
    const out = sculptOutline(dense, stroke({ tool: 'width', radiusMm: 100, center: { x: 200, y: 200 }, delta: { x: 15, y: 40 } }));
    const at200 = out.find((_, i) => dense[i]!.x === 200 && dense[i]!.y === 200)!;
    expect(at200.x).toBeCloseTo(215);
    expect(at200.y).toBe(200);
    // The other side and the far ends of the held side stay.
    out.forEach((p, i) => {
      if (dense[i]!.x === 0 || Math.abs(dense[i]!.y - 200) >= 100) expect(p).toEqual(dense[i]);
    });
    // Pulling off the body lets out as well (a quarter-circumference per side: π/2).
    const pushed = sculptOutline(dense, stroke({ tool: 'width', radiusMm: 100, center: { x: 200, y: 200 }, push: 10 }));
    expect(pushed.find((_, i) => dense[i]!.x === 200 && dense[i]!.y === 200)!.x).toBeCloseTo(200 + 5 * Math.PI);
  });

  it('length: moves everything beyond the point, the cloth before it stretching', () => {
    const out = sculptOutline(square, stroke({ tool: 'length', radiusMm: 100, center: { x: 100, y: 350 }, delta: { x: 30, y: 50 } }));
    expect(out[2]).toEqual({ x: 200, y: 450 });
    expect(out[3]).toEqual({ x: 0, y: 450 });
    expect(out[0]).toEqual(square[0]);
    // Held near the top: the top moves instead.
    const up = sculptOutline(square, stroke({ tool: 'length', radiusMm: 100, center: { x: 100, y: 20 }, delta: { x: 0, y: -30 } }));
    expect(up[0]!.y).toBe(-30);
    expect(up[2]!.y).toBe(400);
  });

  it('smooth: flattens a spike under the brush', () => {
    const spiky = [...square.slice(0, 2), { x: 260, y: 200 }, ...square.slice(2)];
    const out = sculptOutline(spiky, stroke({ tool: 'smooth', radiusMm: 80, center: { x: 260, y: 200 }, delta: { x: 80, y: 0 } }));
    expect(out[2]!.x).toBeLessThan(240);
  });
});

describe('densifyForStroke / strokePiece', () => {
  it('splits only the edges the brush bends, keeping notches where they were', () => {
    const p = piece(rect(200, 400));
    const notchBefore = { x: 200, y: 200 }; // notch at mid right edge
    const prepared = preparePiece(p, { tool: 'grab', radiusMm: 80, falloff: 'smooth' }, { x: 200, y: 300 });
    expect(prepared.polygon.length).toBeGreaterThan(4);
    // The top edge (out of reach) is not split.
    expect(prepared.polygon.filter((q) => q.y === 0)).toHaveLength(2);
    const [notch] = pieceNotches(prepared.piece);
    const a = prepared.polygon[notch!.edgeIndex]!;
    const b = prepared.polygon[(notch!.edgeIndex + 1) % prepared.polygon.length]!;
    expect(a.x + (b.x - a.x) * notch!.positionAlongEdge).toBeCloseTo(notchBefore.x);
    expect(a.y + (b.y - a.y) * notch!.positionAlongEdge).toBeCloseTo(notchBefore.y);
  });

  it('bends a straight seam smoothly and refuses an outline that would cross itself', () => {
    const p = piece(rect(200, 400));
    const prepared = preparePiece(p, { tool: 'grab', radiusMm: 80, falloff: 'smooth' }, { x: 200, y: 200 });
    const bent = strokePiece(prepared, stroke({ radiusMm: 80, center: { x: 200, y: 200 }, delta: { x: 30, y: 0 } }))!;
    const outline = pieceOutline(bent);
    expect(Math.max(...outline.map((q) => q.x))).toBeCloseTo(230);
    expect(outline.filter((q) => q.x > 200 && q.x < 230).length).toBeGreaterThan(2);
    expect((bent.dimensionsJson as { widthMm: number }).widthMm).toBeCloseTo(230);
    // Dragged right across the piece: the seam would cross the other side.
    expect(strokePiece(prepared, stroke({ radiusMm: 80, falloff: 'constant', center: { x: 200, y: 200 }, delta: { x: -300, y: 0 } }))).toBeNull();
  });
});
