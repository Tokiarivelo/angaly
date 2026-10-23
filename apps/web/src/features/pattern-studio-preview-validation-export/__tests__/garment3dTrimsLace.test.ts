import { describe, expect, it } from 'vitest';
import type { PatternPieceDto, Trim } from '@angaly/types';
import { createDefaultEngine } from '../../../../../../packages/pattern-engine/src/eval/fidelity';
import { bodyLandmarks } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { basqueDepthOf, buildGarmentModel, drapeGarment, waistRowOf, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { beadsAlong, bertheEdges, drapeFrill, yAt } from '../utils/garment3d/trims-model';
import { loadHumanBase } from './helpers/humanBase';

// The reference ball gown (project 207c1614, Met 108161) with everything the photo shows.
const M = { STATURE: 165, TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42, LONGUEUR_BRAS: 59 };
const TRIMS: Trim[] = [
  { kind: 'BERTHE', depthMm: 110, pointMm: 140, material: 'DENTELLE', color: '#ecdcb6' },
  { kind: 'SLEEVE_FRILL', tiers: 2, depthMm: 50, material: 'DENTELLE' },
  { kind: 'BEADING', place: 'ENCOLURE', beadMm: 6, rows: 1 },
  { kind: 'BEADING', place: 'BERTHE', beadMm: 5, rows: 1 },
];
const result = createDefaultEngine().generate(
  {
    garmentType: 'ROBE_MARIEE',
    cutType: 'PRINCESSE',
    style: null,
    details: { manches: 'COURTES', longueur: 'SOL', decollete: 'HORS_EPAULES', taille: 'POINTE', corsage: 'BALEINE' },
    fullness: { skirt: 3, sleeve: 1.75 },
    lengths: { sleevePct: 20 },
    drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 40, depthMm: 80, type: 'KNIFE' }] },
    trims: { items: TRIMS },
  },
  M,
);
const pieces = result.pieces.map(
  (p, i) =>
    ({
      id: `p${i}`,
      versionId: 'v',
      name: p.name,
      dimensionsJson: { outlineMm: p.outlineMm, ...(p.internalLinesMm ? { internalLinesMm: p.internalLinesMm } : {}) },
      fabricRecommendation: null,
      quantity: p.quantity,
      grainlineJson: null,
      seamAllowanceCm: 1,
      notchesJson: [],
    }) as unknown as PatternPieceDto,
);
const base = loadHumanBase();
const built = buildGarmentModel(pieces, 'ROBE_MARIEE', M, 'FEMME_STANDARD', 'STRUCTURE', TRIMS);
if (!built.ok) throw new Error(built.reason);
const { body, torsoRings, layout } = built.model;
const fit = fitHumanBody(base, body, torsoRings, morphFor(body, 'FEMME_STANDARD'));
const env = envelopeFromMesh(fit.positions, base.indices, base.armWeights, body);
const panels = drapeGarment(layout, body, env);
const l = bodyLandmarks(body);
const ys = (p: PanelMeshData): number[] => Array.from(p.positions).filter((_, i) => i % 3 === 1);
const near = (p: PanelMeshData, x: number, band = 0.01): number[] => {
  const out: number[] = [];
  for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(p.positions[i]! - x) < band && p.positions[i + 2]! > env.axisZ) out.push(p.positions[i + 1]!);
  return out;
};

describe('3D garnitures of the reference ball gown', () => {
  it('places every piece: the berthe and the frills are drawn, the boning channels are inside', () => {
    expect(built.model.ignored).toEqual([]);
    expect(built.model.inside).toContain('Coulisse de baleine');
    expect(panels.filter((p) => p.zone === 'lace').map((p) => p.id).sort()).toEqual([
      'lace-berthe-back',
      'lace-berthe-front',
      'lace-frill-0-0',
      'lace-frill-0-1',
      'lace-frill-1-0',
      'lace-frill-1-1',
    ]);
  });

  it('lays the lace berthe on the bodice, below its edge and falling to a point at the centre front', () => {
    const berthe = panels.find((p) => p.id === 'lace-berthe-front')!;
    const bodice = panels.find((p) => p.id === 'bodice-front')!;
    expect(berthe.trimColor).toBe('#ecdcb6');
    expect(berthe.material).toBe('DENTELLE');
    // Never above the bodice's own top, never through the body: at the centre front it reaches far lower than at the side.
    expect(Math.max(...ys(berthe))).toBeLessThanOrEqual(Math.max(...ys(bodice)) + 0.005);
    const centreLow = Math.min(...near(berthe, 0));
    const sideLow = Math.min(...near(berthe, 0.12, 0.015));
    expect(sideLow - centreLow).toBeGreaterThan(0.08);
    for (let i = 0; i < berthe.positions.length; i += 3) {
      const y = berthe.positions[i + 1]!;
      const r = Math.hypot(berthe.positions[i]!, berthe.positions[i + 2]! - env.axisZ);
      const h = env.torso(y);
      // A little out from the torso hull (the hull at the front angle is a lower bound of the body's reach there).
      expect(r).toBeGreaterThan(Math.min(...Array.from(h)) - 0.01);
    }
  });

  it('hangs the frills round the sleeve hems, the first one lowest', () => {
    const sleeve = panels.find((p) => p.zone === 'sleeve' && p.id.endsWith('-1') && !p.id.endsWith('--1'))!;
    const low = panels.find((p) => p.id === 'lace-frill-0-0')!;
    const high = panels.find((p) => p.id === 'lace-frill-1-0')!;
    expect(Math.min(...ys(low))).toBeLessThan(Math.min(...ys(sleeve)));
    expect(Math.min(...ys(high))).toBeGreaterThan(Math.min(...ys(low)));
  });

  it('threads the bead rows: round the neckline (front and back) and along the berthe’s point', () => {
    const neck = panels.find((p) => p.id === 'beads-ENCOLURE')!;
    const point = panels.find((p) => p.id === 'beads-BERTHE')!;
    expect(neck.beadRadius).toBeCloseTo(0.003);
    expect(neck.positions.length / 3).toBeGreaterThan(100);
    expect(point.positions.length / 3).toBeGreaterThan(40);
    // Pearls lie on the shoulders' level or below: the neckline is off the shoulders.
    expect(Math.max(...ys(neck))).toBeLessThan(l.shoulderY);
  });

  it('draws the bones down the bodice and keeps the skirt at the waist under the pointed bodice', () => {
    const bodice = layout.zones.find((z) => z.zone === 'bodice')!;
    expect(bodice.front?.seamLines?.length).toBeGreaterThanOrEqual(3);
    expect(basqueDepthOf(bodice.front!)).toBeLessThan(5);
    expect(bodice.front!.maxY - waistRowOf(bodice.front!)).toBeGreaterThan(50);
    expect(layout.zones.find((z) => z.zone === 'skirt')!.topY).toBeCloseTo(l.waistY, 3);
    // The point goes below the waist at the centre front.
    const front = panels.find((p) => p.id === 'bodice-front')!;
    expect(Math.min(...near(front, 0))).toBeLessThan(l.waistY - 0.04);
  });
});

describe('trims-model helpers', () => {
  it('splits a berthe outline and interpolates its edges', () => {
    const outline = [{ x: 0, y: 10 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 80 }];
    const edges = bertheEdges(outline)!;
    expect(edges.top).toHaveLength(2);
    expect(yAt(edges.bottom, 50)).toBe(65);
    expect(yAt(edges.top, -5)).toBe(10);
    expect(yAt(edges.top, 500)).toBe(0);
    expect(bertheEdges([{ x: 0, y: 0 }])).toBeNull();
  });

  it('opens a frill out and down, and spaces beads one diameter apart', () => {
    const ring = Array.from({ length: 16 }, (_, j) => [Math.cos((2 * Math.PI * j) / 16) * 0.05, 1, Math.sin((2 * Math.PI * j) / 16) * 0.05] as [number, number, number]);
    const frill = drapeFrill(ring, [0, -2, 0], 0.05);
    const last = frill.positions.slice(-3);
    expect(last[1]).toBeCloseTo(0.95);
    expect(frill.indices.length).toBeGreaterThan(0);
    const beads = beadsAlong([[0, 0, 0], [0.1, 0, 0]], 0.005, -1, 0);
    expect(beads.length).toBe(18);
    expect(beadsAlong(ring, 0.01, 0, 0, true).length).toBeGreaterThan(25);
  });
});
