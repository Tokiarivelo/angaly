import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import {
  ellipseCircumference,
  ellipseSemiAxes,
  buildTorsoRings,
  loftRings,
  readBodyMeasurements,
  ringAt,
} from '../utils/garment3d/body-model';
import { buildGarmentModel, classifyPiece, fitStatus, rowExtent } from '../utils/garment3d/garment-model';

const piece = (
  id: string,
  name: string,
  outlineMm: Array<{ x: number; y: number }>,
  quantity = 1,
): PatternPieceDto => ({
  id,
  versionId: 'v1',
  name,
  dimensionsJson: { outlineMm },
  fabricRecommendation: null,
  quantity,
  grainlineJson: null,
  seamAllowanceCm: 1,
  notchesJson: [],
});

// Mirrors what RobeRule produces for bust 88 / waist 68 / hip 94 / back length 40 (DROITE).
const closed = (pts: Array<[number, number]>) => [...pts, pts[0]!].map(([x, y]) => ({ x, y }));
const robePieces = (hemFlare = 0, withSleeve = false): PatternPieceDto[] => [
  piece('cd', 'Corsage Devant', closed([[0, 0], [80, 0], [240, 50], [240, 242], [195, 440], [0, 440]]), 1),
  piece('cdos', 'Corsage Dos', closed([[0, 0], [75, 0], [210, 45], [210, 220], [165, 400], [0, 400]]), 2),
  piece('jd', 'Jupe Devant', closed([[0, 0], [195, 10], [250, 200], [250 + hemFlare, 650], [0, 650]]), 1),
  piece('jdos', 'Jupe Dos', closed([[0, 0], [165, 10], [225, 200], [225 + hemFlare, 650], [0, 650]]), 2),
  ...(withSleeve
    ? [piece('m', 'Manche', closed([[0, 150], [137, 0], [275, 150], [250, 580], [25, 580]]), 2)]
    : []),
];
const measurements = { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 };

describe('body-model', () => {
  it('reads cm measurements and clamps absurd or missing values', () => {
    const body = readBodyMeasurements({ TOUR_POITRINE: 9000, TOUR_TAILLE: -4 });
    expect(body.bust).toBe(1.5);
    expect(body.waist).toBe(0.68); // invalid → default
    expect(readBodyMeasurements(undefined).bust).toBe(0.88);
  });

  it('round-trips ellipse circumference and semi-axes', () => {
    const { a, b } = ellipseSemiAxes(0.88, 0.78);
    expect(ellipseCircumference(a, b)).toBeCloseTo(0.88, 4);
    expect(b / a).toBeCloseTo(0.78, 6);
  });

  it('builds torso rings strictly decreasing in height with the measured circumferences', () => {
    const body = readBodyMeasurements(measurements);
    const rings = buildTorsoRings(body);
    for (let i = 1; i < rings.length; i += 1) {
      expect(rings[i]!.y).toBeLessThan(rings[i - 1]!.y);
    }
    const waist = ringAt(rings, 1.42 - body.backLength);
    expect(ellipseCircumference(waist.a, waist.b)).toBeCloseTo(0.68, 3);
  });

  it('lofts closed rings into an indexed mesh', () => {
    const rings = buildTorsoRings(readBodyMeasurements(measurements));
    const mesh = loftRings(rings, 12);
    expect(mesh.positions.length).toBe(rings.length * 12 * 3);
    expect(mesh.indices.length).toBe((rings.length - 1) * 12 * 6);
    expect(Math.max(...mesh.indices)).toBeLessThan(rings.length * 12);
  });
});

describe('garment-model', () => {
  it('classifies pieces by name and garment type, ignoring accents and numbering', () => {
    expect(classifyPiece('Corsage Devant', 'ROBE')).toEqual({ role: 'front', zone: 'bodice' });
    expect(classifyPiece('02. Demi-Dos (×2)', 'CHEMISE')).toEqual({ role: 'back', zone: 'torso' });
    expect(classifyPiece('Devant', 'JUPE')).toEqual({ role: 'front', zone: 'skirt' });
    expect(classifyPiece('Manche', 'ROBE')).toEqual({ role: 'sleeve', zone: 'sleeve' });
    expect(classifyPiece('Ceinture', 'ROBE')).toBeNull();
    expect(classifyPiece('Devant', 'PANTALON')).toBeNull();
  });

  it('finds the extent of a polygon on a horizontal line', () => {
    const square = [
      { x: 10, y: 0 },
      { x: 110, y: 0 },
      { x: 110, y: 100 },
      { x: 10, y: 100 },
    ];
    expect(rowExtent(square, 50)).toEqual([10, 110]);
    expect(rowExtent(square, 500)).toBeNull();
  });

  it('refuses garments without recognisable front/back pieces', () => {
    const result = buildGarmentModel([piece('x', 'Ceinture', closed([[0, 0], [10, 0], [10, 10]]))], 'ROBE', measurements);
    expect(result.ok).toBe(false);
  });

  it('builds front/back panels per zone plus two sleeves, with valid indexed geometry', () => {
    const result = buildGarmentModel(robePieces(0, true), 'ROBE', measurements);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.model.panels.map((p) => p.id).sort()).toEqual([
      'bodice-back',
      'bodice-front',
      'skirt-back',
      'skirt-front',
      'sleeve-m-1',
      'sleeve-m--1',
    ].sort());
    for (const panel of result.model.panels) {
      expect(panel.positions.length % 3).toBe(0);
      expect(Math.max(...panel.indices)).toBeLessThan(panel.positions.length / 3);
      expect(panel.border.length % 6).toBe(0);
      expect(panel.positions.every(Number.isFinite)).toBe(true);
    }
  });

  it('places the front on +z and the back on -z, symmetric left/right', () => {
    const result = buildGarmentModel(robePieces(), 'ROBE', measurements);
    if (!result.ok) throw new Error('expected a model');
    const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;
    const axis = (id: string, offset: number): number[] => {
      const panel = result.model.panels.find((p) => p.id === id)!;
      return Array.from(panel.positions).filter((_, i) => i % 3 === offset);
    };
    expect(mean(axis('skirt-front', 2))).toBeGreaterThan(0);
    expect(mean(axis('skirt-back', 2))).toBeLessThan(0);
    expect(Math.abs(mean(axis('skirt-front', 0)))).toBeLessThan(1e-4);
  });

  it('reports the ease at bust, waist and hip from the real piece widths', () => {
    const result = buildGarmentModel(robePieces(), 'ROBE', measurements);
    if (!result.ok) throw new Error('expected a model');
    const labels = result.model.fit.map((f) => f.label);
    expect(labels).toEqual(['Poitrine', 'Taille', 'Bassin']);
    const bust = result.model.fit[0]!;
    // front 240 ×2 + back 210 ×2 = 90 cm of garment at the bust vs 88 cm of body
    expect(bust.garmentCm).toBeGreaterThan(88);
    expect(bust.easeCm).toBeCloseTo(bust.garmentCm - bust.bodyCm, 1);
  });

  it('shows a wider hem in 3D when the pattern is flared', () => {
    const hemWidth = (flare: number): number => {
      const result = buildGarmentModel(robePieces(flare), 'ROBE', measurements);
      if (!result.ok) throw new Error('expected a model');
      const skirt = result.model.panels.find((p) => p.id === 'skirt-front')!;
      const xs = Array.from(skirt.positions).filter((_, i) => i % 3 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(hemWidth(300)).toBeGreaterThan(hemWidth(0));
  });

  it('classifies ease levels', () => {
    expect(fitStatus(-2)).toBe('tight');
    expect(fitStatus(2)).toBe('fitted');
    expect(fitStatus(6)).toBe('comfortable');
    expect(fitStatus(14)).toBe('loose');
  });

  it('lists pieces that cannot be placed on the mannequin', () => {
    const result = buildGarmentModel(
      [...robePieces(), piece('b', 'Ceinture', closed([[0, 0], [700, 0], [700, 70], [0, 70]]))],
      'ROBE',
      measurements,
    );
    if (!result.ok) throw new Error('expected a model');
    expect(result.model.ignored).toEqual(['Ceinture']);
  });
});
