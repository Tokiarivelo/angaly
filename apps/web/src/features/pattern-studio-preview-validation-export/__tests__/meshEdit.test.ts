import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import {
  constrain,
  deletePoints,
  grabPoints,
  insertPointAt,
  offsetPoints,
  outlineInstances,
  parsePointKey,
  pointKey,
  resolveSelection,
  rotatePoints,
  scalePoints,
  screenToFlatTurn,
  selectionMedian,
  subdividePoints,
  type Proportional,
  type SelectedPoint,
} from '../utils/garment3d/mesh-edit';
import type { SculptAnchor } from '../utils/garment3d/sculpt';
import { pieceNotches, pieceOutline, withOutline } from '../utils/pattern-editing';
import type { Point } from '../utils/pattern-geometry';
import reference from './fixtures/robe-pois-maxi.pieces.json';

const pieces = reference.pieces as PatternPieceDto[];
const built = buildGarmentModel(pieces, 'ROBE', reference.measurements, 'FEMME_STANDARD');
if (!built.ok) throw new Error(built.reason);
const panels = built.model.panels;

const square = (id = 'sq'): PatternPieceDto =>
  withOutline(
    { id, versionId: 'v', name: 'Devant', dimensionsJson: {}, fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] },
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ],
    [{ edgeIndex: 1, positionAlongEdge: 0.5 }],
  );
/** Facing the camera, y up in the world, y down on the pattern: world x m → +1000 mm x; world y m → −1000 mm y. */
const facing: SculptAnchor = {
  pieceId: 'sq',
  flat: { x: 0, y: 0 },
  inverse: [1000, 0, 0, 0, -1000, 0],
  normal: [0, 0, 1],
  weight: 1,
  along: [
    [0.001, 0, 0],
    [0, -0.001, 0],
  ],
};
const sel = (index: number, anchor = facing, pieceId = 'sq'): SelectedPoint => ({ key: pointKey(pieceId, index), pieceId, index, anchor });
const off: Proportional = { enabled: false, radiusMm: 50, falloff: 'smooth' };
const outlineOf = (ps: PatternPieceDto[], id = 'sq'): Point[] => pieceOutline(ps.find((p) => p.id === id)!);

describe('point keys', () => {
  it('round-trips piece ids that contain #', () => {
    expect(parsePointKey(pointKey('a#b', 3))).toEqual({ pieceId: 'a#b', index: 3 });
  });
});

describe('outlineInstances', () => {
  const instances = outlineInstances(panels, pieces);

  it('places every outline point of the draped pieces on the garment', () => {
    for (const id of ['p0', 'p1', 'p2', 'p3', 'p4']) {
      const outline = pieceOutline(pieces.find((p) => p.id === id)!);
      const keys = new Set(instances.filter((i) => i.pieceId === id).map((i) => i.index));
      expect(keys.size).toBe(outline.length);
    }
  });

  it('shows a fold piece’s points on both halves, mirrored, and sleeves on both arms', () => {
    const front = instances.filter((i) => i.pieceId === 'p0' && i.index === 3);
    expect(front.length).toBeGreaterThanOrEqual(2);
    const xs = front.map((i) => i.position[0]).sort((a, b) => a - b);
    expect(xs[0]!).toBeCloseTo(-xs[xs.length - 1]!, 3);
    const sleeve = instances.filter((i) => i.pieceId === 'p4' && i.index === 0);
    expect(new Set(sleeve.map((i) => i.panelId)).size).toBe(2);
  });

  it('gives each instance an outward normal and the anchor at the pattern point', () => {
    for (const i of instances) {
      expect(i.normal[0] * i.position[0] + i.normal[2] * i.position[2]).toBeGreaterThanOrEqual(0);
      expect(i.anchor.flat).toEqual(pieceOutline(pieces.find((p) => p.id === i.pieceId)!)[i.index]);
    }
  });

  it('a 3D move read through an instance comes back as the pattern point it was draped from', () => {
    const one = instances.find((i) => i.pieceId === 'p3' && i.index === 2)!;
    // Moving the point 2 cm along the cloth's own flat x direction moves it 20 mm on the pattern.
    const [jx] = one.anchor.along!;
    const world = jx.map((v) => v * 20) as [number, number, number];
    const moved = grabPoints(pieces, [{ key: one.key, pieceId: 'p3', index: 2, anchor: one.anchor }], world, off);
    const before = pieceOutline(pieces[3]!)[2]!;
    const after = pieceOutline(moved[3]!)[2]!;
    expect(after.x - before.x).toBeCloseTo(20, 0);
    expect(after.y - before.y).toBeCloseTo(0, 0);
  });

  it('resolves a selection through the panel it was picked on', () => {
    const both = instances.filter((i) => i.pieceId === 'p4' && i.index === 0);
    const picked = resolveSelection(instances, new Map([[both[1]!.key, both[1]!.panelId]]));
    expect(picked).toHaveLength(1);
    expect(picked[0]!.anchor).toBe(both[1]!.anchor);
    expect(resolveSelection(instances, new Map([['ghost#0', null]]))).toEqual([]);
  });
});

describe('transforms', () => {
  it('constrain keeps one world axis', () => {
    expect(constrain([1, 2, 3], 'y')).toEqual([0, 2, 0]);
    expect(constrain([1, 2, 3], null)).toEqual([1, 2, 3]);
  });

  it('grab moves the selected point only, or its neighbours too with proportional editing', () => {
    const ps = [square()];
    const moved = grabPoints(ps, [sel(2)], [0.01, -0.02, 0], off);
    expect(outlineOf(moved)[2]).toEqual({ x: 110, y: 220 });
    expect(outlineOf(moved)[1]).toEqual({ x: 100, y: 0 });
    const prop = grabPoints(ps, [sel(2)], [0.01, 0, 0], { enabled: true, radiusMm: 150, falloff: 'linear' });
    // The point 100 mm away moves by (1 − 100/150) of the displacement.
    expect(outlineOf(prop)[3]!.x).toBeCloseTo(10 / 3);
    expect(outlineOf(prop)[1]!.x).toBe(100); // 200 mm away: out of reach
    // Notches and dimensions follow.
    expect(pieceNotches(moved[0]!)).toEqual([{ edgeIndex: 1, positionAlongEdge: 0.5 }]);
    expect((moved[0]!.dimensionsJson as { widthMm: number }).widthMm).toBe(110);
  });

  it('scale about the median of the selection, on one pattern axis if asked', () => {
    const ps = [square()];
    const both = [sel(1), sel(2)]; // right edge, median (100, 100)
    expect(outlineOf(scalePoints(ps, both, 2, null, off)).slice(1, 3)).toEqual([
      { x: 100, y: -100 },
      { x: 100, y: 300 },
    ]);
    expect(outlineOf(scalePoints(ps, both, 2, 'x', off)).slice(1, 3)).toEqual([
      { x: 100, y: 0 },
      { x: 100, y: 200 },
    ]);
    expect(outlineOf(scalePoints(ps, both, 0.5, 'z', off))[1]).toEqual({ x: 100, y: 50 });
  });

  it('rotate turns as seen on screen, mirrored halves the other way', () => {
    const ps = [square()];
    const pair = [sel(1), sel(2)];
    // A quarter turn counter-clockwise on screen: the top end of the right edge swings to the left.
    const out = outlineOf(rotatePoints(ps, pair, Math.PI / 2, [0, 0, 1], off));
    expect(out[1]!.x).toBeCloseTo(0);
    expect(out[1]!.y).toBeCloseTo(100);
    expect(out[2]!.x).toBeCloseTo(200);
    expect(screenToFlatTurn(facing, [0, 0, 1])).toBe(-1);
    const mirrored: SculptAnchor = { ...facing, along: [[-0.001, 0, 0], [0, -0.001, 0]] };
    expect(screenToFlatTurn(mirrored, [0, 0, 1])).toBe(1);
    expect(screenToFlatTurn({ ...facing, along: undefined }, [0, 0, 1])).toBe(-1);
  });

  it('offsets the selection and reads its median (single piece only)', () => {
    const ps = [square(), square('other')];
    expect(selectionMedian(ps, [sel(1), sel(2)])).toEqual({ x: 100, y: 100 });
    expect(selectionMedian(ps, [sel(1), sel(2, facing, 'other')])).toBeNull();
    expect(outlineOf(offsetPoints(ps, [sel(0)], 5, -5))[0]).toEqual({ x: 5, y: -5 });
  });
});

describe('topology', () => {
  it('deletes points but keeps a piece of at least 3', () => {
    const ps = [square()];
    expect(outlineOf(deletePoints(ps, [pointKey('sq', 3)]))).toHaveLength(3);
    expect(outlineOf(deletePoints(ps, ['sq#0', 'sq#1', 'sq#2', 'sq#3']))).toHaveLength(3);
  });

  it('subdivides the edges whose two ends are selected, keeping the result selected', () => {
    const ps = [square()];
    const { pieces: out, keys } = subdividePoints(ps, ['sq#1', 'sq#2', 'sq#3']);
    const outline = outlineOf(out);
    expect(outline).toHaveLength(6);
    expect(outline[2]).toEqual({ x: 100, y: 100 });
    expect(outline[4]).toEqual({ x: 50, y: 200 });
    expect(new Set(keys)).toEqual(new Set(['sq#1', 'sq#3', 'sq#5', 'sq#2', 'sq#4']));
    // The closing edge (last → first).
    expect(outlineOf(subdividePoints(ps, ['sq#3', 'sq#0']).pieces)[4]).toEqual({ x: 0, y: 100 });
  });

  it('inserts a point on the nearest seam, not in the middle of the piece', () => {
    const ps = [square()];
    const hit = insertPointAt(ps, 'sq', { x: 103, y: 60 }, 40)!;
    expect(hit.key).toBe('sq#2');
    expect(outlineOf(hit.pieces)[2]).toEqual({ x: 100, y: 60 });
    expect(insertPointAt(ps, 'sq', { x: 50, y: 100 }, 40)).toBeNull();
    expect(insertPointAt(ps, 'nope', { x: 0, y: 0 }, 40)).toBeNull();
  });
});
