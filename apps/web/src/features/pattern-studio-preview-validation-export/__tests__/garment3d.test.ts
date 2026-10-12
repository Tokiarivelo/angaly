import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import {
  NAPE_Y,
  ellipseCircumference,
  ellipseSemiAxes,
  buildTorsoRings,
  loftRings,
  readBodyMeasurements,
  ringAt,
} from '../utils/garment3d/body-model';
import { BODY_TEMPLATES, getBodyTemplate, suggestTemplate } from '../utils/garment3d/body-templates';
import { bodyLandmarks } from '../utils/garment3d/body-model';
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
    const waist = ringAt(rings, NAPE_Y - body.backLength);
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
    expect(classifyPiece('Devant', 'PANTALON')).toEqual({ role: 'front', zone: 'legs' });
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

  it('refuses only when no piece has a usable outline', () => {
    const empty = piece('x', 'Ceinture', []);
    expect(buildGarmentModel([empty], 'ROBE', measurements).ok).toBe(false);
    expect(buildGarmentModel([], 'AUTRE', measurements).ok).toBe(false);
  });

  it('wraps the largest piece around the body when there are no front/back pieces (any garment can be worn)', () => {
    const lamba = piece('l', 'Lamba', closed([[0, 0], [1800, 0], [1800, 1100], [0, 1100]]));
    const result = buildGarmentModel([lamba], 'AUTRE', measurements);
    if (!result.ok) throw new Error('expected a model');
    expect(result.model.generic).toBe(true);
    expect(result.model.panels.map((p) => p.role).sort()).toEqual(['back', 'front']);
    // The wrap uses the piece width as circumference: 180 cm around a 94 cm hip is "loose".
    expect(result.model.fit.some((f) => f.status === 'loose')).toBe(true);
  });

  it('places a trousers pattern on two legs and reports waist/hip ease', () => {
    const leg = (name: string, w: number) =>
      piece(name, name, closed([[0, 0], [w, 0], [w - 20, 450], [w - 60, 1000], [w - 90, 1000], [0, 1000]]), 2);
    const result = buildGarmentModel([leg('Devant Pantalon', 260), leg('Dos Pantalon', 290)], 'PANTALON', {
      ...measurements,
      TOUR_TAILLE: 74,
    });
    if (!result.ok) throw new Error('expected a model');
    expect(result.model.generic).toBe(false);
    const legs = result.model.panels.filter((p) => p.zone === 'legs');
    expect(legs).toHaveLength(2);
    const meanX = (panel: (typeof legs)[number]) => {
      let sum = 0;
      for (let i = 0; i < panel.positions.length; i += 3) sum += panel.positions[i]!;
      return sum / (panel.positions.length / 3);
    };
    expect(Math.sign(meanX(legs[0]!))).toBe(-Math.sign(meanX(legs[1]!)));
    // Below the crotch the two legs are apart (a real crotch seam, not a tube).
    const l = bodyLandmarks(result.model.body);
    for (const panel of legs) {
      for (let i = 0; i < panel.positions.length; i += 3) {
        if (panel.positions[i + 1]! < l.crotchY - 0.1) expect(Math.abs(panel.positions[i]!)).toBeGreaterThan(0.002);
      }
    }
    expect(result.model.fit.map((f) => f.label)).toContain('Bassin');
    for (const panel of legs) expect(Math.max(...panel.indices)).toBeLessThan(panel.positions.length / 3);
  });

  it('classifies trousers and "other" garments', () => {
    expect(classifyPiece('Devant Pantalon', 'PANTALON')).toEqual({ role: 'front', zone: 'legs' });
    expect(classifyPiece('Dos Pantalon', 'PANTALON')).toEqual({ role: 'back', zone: 'legs' });
    expect(classifyPiece('Devant', 'AUTRE')).toEqual({ role: 'front', zone: 'torso' });
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

  it('drapes skirt blocks (gathered panels, circle skirts) instead of dropping them', () => {
    const bodice = robePieces().slice(0, 2);
    // Gathered: one 72 × 2 cm wide rectangle per side, 90 cm long.
    const gathered = buildGarmentModel(
      [...bodice, piece('g', 'Jupe froncée (panneau)', closed([[0, 0], [720, 0], [720, 900], [0, 900]]), 2)],
      'ROBE',
      { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 },
    );
    if (!gathered.ok) throw new Error(gathered.reason);
    expect(gathered.model.ignored).toEqual([]);
    expect(gathered.model.panels.filter((p) => p.zone === 'skirt').map((p) => p.role).sort()).toEqual(['back', 'front']);
    // The fabric is 1.44 m round, but the waist seam draws it in: the ring at the waist stays near the body.
    const ringWidth = (y: number): number => {
      let w = 0;
      for (const p of gathered.model.panels.filter((q) => q.zone === 'skirt')) {
        for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(p.positions[i + 1]! - y) < 0.01) w = Math.max(w, p.positions[i]!);
      }
      return w;
    };
    const waistY = bodyLandmarks(gathered.model.body).waistY;
    expect(2 * Math.PI * ringWidth(waistY - 0.01)).toBeLessThan(1.0);
    expect(ringWidth(waistY - 0.6)).toBeGreaterThan(ringWidth(waistY - 0.01) * 1.15);

    // Half circle for a 72 cm waist: inner radius 72 / π cm, 80 cm long.
    const inner = 720 / Math.PI;
    const arc = (r: number, from: number, to: number) =>
      Array.from({ length: 65 }, (_, i) => {
        const phi = from + ((to - from) * i) / 64;
        return { x: r * Math.sin(phi), y: r * Math.cos(phi) };
      });
    const sector = [...arc(inner, -Math.PI / 2, Math.PI / 2), ...arc(inner + 800, Math.PI / 2, -Math.PI / 2)];
    const circle = buildGarmentModel(
      [...bodice, piece('c', 'Jupe demi-cercle', [...sector, sector[0]!].map((p) => ({ x: p.x + 1200, y: p.y + 1200 })), 1)],
      'ROBE',
      { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 },
    );
    if (!circle.ok) throw new Error(circle.reason);
    expect(circle.model.ignored).toEqual([]);
    // Its circumference grows by π per unit of depth: ~72 cm at the waist, ~2.5 m at mid-length.
    const hip = circle.model.fit.find((f) => f.label === 'Bassin')!;
    const depth = (waistY - bodyLandmarks(circle.model.body).hipY) * 100;
    expect(hip.garmentCm).toBeGreaterThan(72 + Math.PI * depth * 0.85);
    expect(hip.garmentCm).toBeLessThan(72 + Math.PI * depth * 1.15);
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

describe('body templates', () => {
  it('offers several distinct morphologies with unique ids and plausible numbers', () => {
    expect(BODY_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(BODY_TEMPLATES.map((t) => t.id)).size).toBe(BODY_TEMPLATES.length);
    for (const t of BODY_TEMPLATES) {
      expect(t.waist).toBeLessThan(t.hip + 0.2);
      expect(t.height).toBeGreaterThan(1.2);
      expect(t.thigh).toBeGreaterThan(t.knee);
      expect(t.knee).toBeGreaterThan(t.ankle);
    }
    expect(getBodyTemplate('inconnu').id).toBe('FEMME_STANDARD');
  });

  it('fills missing measurements from the template and lets given ones win', () => {
    const athletic = readBodyMeasurements(undefined, 'HOMME_ATHLETIQUE');
    expect(athletic.shoulderWidth).toBeCloseTo(0.5);
    expect(athletic.bust).toBeCloseTo(1.08);

    // LARGEUR_EPAULE is one shoulder (neck base → shoulder point): the width adds the neck on both sides.
    const measured = readBodyMeasurements({ TOUR_POITRINE: 100, LARGEUR_EPAULE: 14 }, 'HOMME_ATHLETIQUE');
    expect(measured.bust).toBeCloseTo(1.0);
    expect(measured.shoulderWidth).toBeCloseTo(2 * (0.42 / (2 * Math.PI) + 0.14), 3);
    expect(measured.waist).toBeCloseTo(0.82); // not measured → template
  });

  it('scales every landmark with stature, deduced from the waist height when given', () => {
    const standard = readBodyMeasurements(undefined);
    const tall = readBodyMeasurements({ HAUTEUR_TAILLE_SOL: 114 });
    expect(tall.height).toBeCloseTo(1.9);
    expect(bodyLandmarks(tall).napeY).toBeGreaterThan(bodyLandmarks(standard).napeY);
    expect(bodyLandmarks(standard).napeY).toBeCloseTo(NAPE_Y);
    expect(readBodyMeasurements({ HAUTEUR_TAILLE_SOL: 9000 }).height).toBe(2.1);
  });

  it('suggests the closest female silhouette from bust/waist/hip, defaulting when unmeasured', () => {
    expect(suggestTemplate(undefined)).toBe('FEMME_STANDARD');
    expect(suggestTemplate({ TOUR_POITRINE: 97, TOUR_TAILLE: 69, TOUR_BASSIN: 99 })).toBe('FEMME_SABLIER');
    expect(suggestTemplate({ TOUR_POITRINE: 86, TOUR_TAILLE: 73, TOUR_BASSIN: 104 })).toBe('FEMME_POIRE');
    expect(suggestTemplate({ TOUR_POITRINE: 108, TOUR_TAILLE: 92, TOUR_BASSIN: 114 })).toBe('FEMME_RONDE');
  });
});

describe('haute couture mannequin & garment aesthetics', () => {
  it('shapes torso rings with anatomical sagittal curvature (bust forward, buttocks backward)', () => {
    const body = readBodyMeasurements(measurements);
    const rings = buildTorsoRings(body);
    const landmarks = bodyLandmarks(body);

    const bustRing = ringAt(rings, landmarks.bustY);
    const hipRing = ringAt(rings, landmarks.hipY);

    expect(bustRing.cz).toBeDefined();
    expect(bustRing.cz!).toBeGreaterThan(0.015);
    expect(hipRing.cz).toBeDefined();
    expect(hipRing.cz!).toBeLessThan(-0.015);
  });

  it('generates high-definition sculptured couture head geometry with valid indices and normals', async () => {
    const { createCoutureHeadGeometry } = await import('../utils/garment3d/mannequin-mesh');
    const head = createCoutureHeadGeometry(0.095);
    expect(head.getAttribute('position').count).toBeGreaterThan(100);
    expect(head.getIndex()).not.toBeNull();
    expect(head.getAttribute('normal')).toBeDefined();
    head.computeBoundingBox();
    const box = head.boundingBox!;
    expect(box.max.y - box.min.y).toBeGreaterThan(0.15);
  });

  it('generates stylized couture hand and foot geometries', async () => {
    const { createCoutureFootGeometry, createCoutureHandGeometry } = await import('../utils/garment3d/mannequin-mesh');
    const handLeft = createCoutureHandGeometry(1.0, 1);
    const handRight = createCoutureHandGeometry(1.0, -1);
    expect(handLeft.getAttribute('position').count).toBeGreaterThan(50);
    expect(handRight.getAttribute('position').count).toBeGreaterThan(50);

    const foot = createCoutureFootGeometry(1.0);
    expect(foot.getAttribute('position').count).toBeGreaterThan(10);
    expect(foot.getIndex()).not.toBeNull();
  });

  it('generates contoured limbs with anatomical muscle curvature', async () => {
    const { createContouredLimbGeometry } = await import('../utils/garment3d/mannequin-mesh');
    const arm = createContouredLimbGeometry(0.045, 0.035, 0.28, 'upperArm');
    const calf = createContouredLimbGeometry(0.06, 0.035, 0.38, 'calf');
    expect(arm.getAttribute('position').count).toBeGreaterThan(100);
    expect(calf.getAttribute('position').count).toBeGreaterThan(100);
  });

  it('builds Stockman Paris style markings (center seams and bust/waist ribbons)', async () => {
    const { createAtelierRibbons } = await import('../utils/garment3d/mannequin-mesh');
    const body = readBodyMeasurements(measurements);
    const rings = buildTorsoRings(body);
    const landmarks = bodyLandmarks(body);
    const ribbons = createAtelierRibbons(rings, landmarks);

    expect(ribbons.seamLines.getAttribute('position').count).toBeGreaterThan(0);
    expect(ribbons.tapeLines.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('generates styled hair coiffure geometry for realistic 3D human presence', async () => {
    const { createHairGeometry } = await import('../utils/garment3d/mannequin-mesh');
    const hair = createHairGeometry(0.095);
    expect(hair.getAttribute('position').count).toBeGreaterThan(100);
    expect(hair.getIndex()).not.toBeNull();
    expect(hair.getAttribute('normal')).toBeDefined();
    hair.computeBoundingBox();
    const box = hair.boundingBox!;
    expect(box.max.y - box.min.y).toBeGreaterThan(0.1);
  });
});
