import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { PantalonRule } from '../../../../../../packages/pattern-engine/src/rules/pantalon.rule';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const pieces = (details: Record<string, string>): PatternPieceDto[] =>
  RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', ...details } }, M).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
const model = (details: Record<string, string>) => {
  const built = buildGarmentModel(pieces(details), 'ROBE', M);
  if (!built.ok) throw new Error('model not built');
  return built.model;
};

/** Highest y of the vertices of a panel lying near the centre front. */
const centreTop = (positions: Float32Array): number => {
  let top = -Infinity;
  for (let i = 0; i < positions.length; i += 3) if (Math.abs(positions[i]!) < 0.03 && positions[i + 2]! > 0) top = Math.max(top, positions[i + 1]!);
  return top;
};

describe('3D robe-manteau', () => {
  const coat = model({ devant: 'MANTEAU_OUVERT', fermeture: 'CORDELIERE' });

  it('leaves the centre front to the plastron: the fronts never cross it', () => {
    const fronts = coat.panels.filter((p) => p.role === 'front');
    expect(fronts.length).toBeGreaterThan(0);
    for (const front of fronts) {
      for (let i = 0; i < front.positions.length; i += 3) {
        if (front.positions[i + 2]! > 0) expect(Math.abs(front.positions[i]!)).toBeGreaterThan(0.012);
      }
    }
  });

  it('fills the opening with the plastron, from the bodice down to the hem', () => {
    const plastrons = coat.panels.filter((p) => p.zone === 'plastron');
    expect(plastrons.map((p) => p.id).sort()).toEqual(['bodice-plastron', 'skirt-plastron']);
    const skirt = plastrons.find((p) => p.id === 'skirt-plastron')!;
    expect(Math.min(...Array.from(skirt.positions).filter((_, i) => i % 3 === 1))).toBeLessThan(0.3);
  });

  it('meets the bodice at the waist: no gap at the centre front of the skirt', () => {
    const bodice = coat.panels.find((p) => p.id === 'bodice-plastron')!;
    const skirt = coat.panels.find((p) => p.id === 'skirt-plastron')!;
    const bodiceBottom = Math.min(...Array.from(bodice.positions).filter((_, i) => i % 3 === 1));
    expect(Math.abs(centreTop(skirt.positions) - bodiceBottom)).toBeLessThan(0.01);
  });

  it('ties a cord at the centre front of the waist', () => {
    const cord = coat.panels.find((p) => p.zone === 'cord');
    expect(cord).toBeDefined();
    expect(coat.ignored).not.toContain('Cordelière');
    expect(coat.ignored).not.toContain('Plastron (sous-robe)');
  });

  it('stops the plastron at the floor, where the fronts lie on it', () => {
    const plastron = coat.panels.find((p) => p.id === 'skirt-plastron')!;
    expect(Math.min(...Array.from(plastron.positions).filter((_, i) => i % 3 === 1))).toBeGreaterThanOrEqual(0);
  });

  it('a closed dress has no plastron and no cord', () => {
    const closed = model({});
    expect(closed.panels.some((p) => p.zone === 'plastron' || p.zone === 'cord')).toBe(false);
  });
});

describe('3D trousers', () => {
  it('lists the pocket bag as sewn inside, not as an unplaced piece', () => {
    const trousers = PantalonRule.computePieces({ garmentType: 'PANTALON', cutType: 'DROITE', style: null, details: {} }, { ...M, LONGUEUR_JAMBE: 102, HAUTEUR_FOURCHE: 27 }).map(
      (p, i) =>
        ({ id: `t${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
    );
    const built = buildGarmentModel(trousers, 'PANTALON', M);
    if (!built.ok) throw new Error('model not built');
    expect(built.model.ignored).not.toContain('Fond de Poche');
    expect(built.model.inside).toContain('Fond de Poche');
  });
});
