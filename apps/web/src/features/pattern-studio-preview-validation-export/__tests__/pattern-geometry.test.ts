import { describe, expect, it } from 'vitest';
import {
  findFoldEdge,
  formatCm,
  getBounds,
  getEdges,
  getNotchMarks,
  layoutBoxes,
  niceScaleLengthMm,
  offsetPolygon,
  openPolygon,
  polygonAreaCm2,
  signedArea,
} from '../utils/pattern-geometry';

const rect = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 400 },
  { x: 0, y: 400 },
];

describe('pattern-geometry', () => {
  it('drops the closing point repeated by the engine', () => {
    expect(openPolygon([...rect, { x: 0, y: 0 }])).toHaveLength(4);
    expect(openPolygon(rect)).toHaveLength(4);
  });

  it('computes bounds, area (cm²) and edge lengths', () => {
    expect(getBounds(rect)).toMatchObject({ width: 200, height: 400, minX: 0, maxY: 400 });
    expect(polygonAreaCm2(rect)).toBe(800);
    expect(getEdges(rect).map((e) => e.lengthMm)).toEqual([200, 400, 200, 400]);
  });

  it('points edge normals OUT of the polygon whatever the winding', () => {
    const clockwise = getEdges(rect);
    const counter = getEdges([...rect].reverse());
    // top edge of the clockwise rect: outside is up (y negative)
    expect(clockwise[0]!.normal.y).toBeLessThan(0);
    expect(signedArea(rect)).toBeGreaterThan(0);
    // reversed polygon: the first edge goes from (0,400) to (0... ) — every normal must still point away from the centre
    for (const e of counter) {
      const toEdge = { x: e.midpoint.x - 100, y: e.midpoint.y - 200 };
      expect(e.normal.x * toEdge.x + e.normal.y * toEdge.y).toBeGreaterThan(0);
    }
  });

  it('offsets the sewing line outward by the seam allowance with mitered corners', () => {
    const cut = offsetPolygon(rect, 10);
    const bounds = getBounds(cut);
    expect(bounds).toMatchObject({ minX: -10, minY: -10, maxX: 210, maxY: 410 });
    expect(cut).toHaveLength(4);
  });

  it('keeps the polygon untouched for a null allowance or a degenerate input', () => {
    expect(offsetPolygon(rect, 0)).toBe(rect);
    expect(offsetPolygon(rect.slice(0, 2), 10)).toHaveLength(2);
  });

  it('places notches on the right edge and points them outward', () => {
    const [mark] = getNotchMarks(rect, [{ positionAlongEdge: 0.5, edgeIndex: 1 }]);
    expect(mark!.at).toEqual({ x: 200, y: 200 });
    expect(mark!.direction.x).toBeGreaterThan(0);
    expect(getNotchMarks(rect, [{ positionAlongEdge: 0.5, edgeIndex: 99 }])).toEqual([]);
    expect(getNotchMarks(rect, null)).toEqual([]);
  });

  it('detects the fold edge only for single pieces with a long vertical edge on the left', () => {
    expect(findFoldEdge(rect, 1)?.index).toBe(3);
    expect(findFoldEdge(rect, 2)).toBeNull();
    const slanted = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 150, y: 400 },
      { x: 40, y: 400 },
    ];
    expect(findFoldEdge(slanted, 1)).toBeNull();
  });

  it('picks nice scale bar lengths', () => {
    expect(niceScaleLengthMm(230)).toBe(200);
    expect(niceScaleLengthMm(90)).toBe(50);
    expect(niceScaleLengthMm(1000)).toBe(1000);
    expect(niceScaleLengthMm(0)).toBe(10);
  });

  it('formats lengths in French centimetres', () => {
    expect(formatCm(125)).toBe('12,5 cm');
    expect(formatCm(1500)).toBe('150 cm');
  });

  it('packs boxes in rows without exceeding the row width', () => {
    const { placed, width, height } = layoutBoxes(
      [
        { item: 'a', width: 300, height: 100 },
        { item: 'b', width: 300, height: 200 },
        { item: 'c', width: 300, height: 50 },
      ],
      700,
      20,
    );
    expect(placed.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [320, 0],
      [0, 220],
    ]);
    expect(width).toBe(620);
    expect(height).toBe(270);
  });
});
