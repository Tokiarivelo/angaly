import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { bodyLandmarks } from '../utils/garment3d/body-model';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const model = (details: Record<string, string>) => {
  const pieces = RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'AJUSTEE', style: null, details: { longueur: 'SOL', taille: 'BASSE', col: 'OFFICIER', manches: 'LONGUES', ...details } }, M).map(
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
  const built = buildGarmentModel(pieces, 'ROBE', M);
  if (!built.ok) throw new Error(built.reason);
  return built.model;
};

describe('3D bodice open over a gilet (cuirasse), buttoned, over a gored skirt with contrasting side gores', () => {
  const m = model({ devant: 'GILET', fermeture: 'BOUTONS', jupe: 'EN_LES' });

  it('shows the gilet in the bodice opening only: the skirt front is whole', () => {
    expect(m.panels.some((p) => p.id === 'bodice-plastron')).toBe(true);
    expect(m.panels.some((p) => p.id === 'skirt-plastron')).toBe(false);
    expect(m.panels.some((p) => p.zone === 'revers')).toBe(true);
    expect(m.ignored).toEqual([]);
  });

  it('sews the buttons down the middle of the gilet, from the collar to the basque', () => {
    const buttons = m.panels.find((p) => p.label === 'Boutons')!;
    expect(buttons.zone).toBe('beads');
    const n = buttons.positions.length / 3;
    expect(n).toBeGreaterThanOrEqual(10);
    const gilet = m.panels.find((p) => p.id === 'bodice-plastron')!;
    let giletFront = -Infinity;
    for (let i = 0; i < gilet.positions.length; i += 3) if (Math.abs(gilet.positions[i]!) < 0.01) giletFront = Math.max(giletFront, gilet.positions[i + 2]!);
    const ys: number[] = [];
    for (let i = 0; i < n; i += 1) {
      expect(Math.abs(buttons.positions[i * 3]!)).toBeLessThan(0.005);
      ys.push(buttons.positions[i * 3 + 1]!);
    }
    // Top to bottom, evenly spaced, below the waist at the end (the basque).
    for (let i = 1; i < n; i += 1) expect(ys[i - 1]! - ys[i]!).toBeGreaterThan(0.02);
    expect(Math.min(...ys)).toBeLessThan(bodyLandmarks(m.body).waistY - 0.05);
    expect(giletFront).toBeGreaterThan(-Infinity);
  });

  it('marks the side gores of the skirt as its accent part, the centre panels as the main fabric', () => {
    for (const id of ['skirt-front', 'skirt-back']) {
      const skirt = m.panels.find((p) => p.id === id)!;
      expect(skirt.accent).toBeDefined();
      const gore = Array.from(skirt.accent!).filter((a) => a === 1).length;
      expect(gore).toBeGreaterThan(skirt.accent!.length * 0.2);
      expect(gore).toBeLessThan(skirt.accent!.length * 0.8);
    }
  });

  it('draws no buttons without a buttoned closure, and no accent on a skirt that is not gored', () => {
    const plain = model({ devant: 'FERME', fermeture: 'ZIP_INVISIBLE' });
    expect(plain.panels.some((p) => p.label === 'Boutons')).toBe(false);
    expect(plain.panels.find((p) => p.id === 'skirt-front')!.accent).toBeUndefined();
  });
});
