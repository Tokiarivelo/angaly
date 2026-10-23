import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeMarieeRule } from '../../../../../../packages/pattern-engine/src/rules/robe-mariee.rule';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

const M = { STATURE: 165, TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const pieces = (): PatternPieceDto[] =>
  RobeMarieeRule.computePieces(
    { garmentType: 'ROBE_MARIEE', cutType: 'PRINCESSE', style: null, details: { manches: 'CAP', longueur: 'SOL', decollete: 'COEUR' } },
    M,
  ).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );

const coords = (positions: Float32Array, axis: 0 | 1 | 2): number[] => Array.from(positions).filter((_, i) => i % 3 === axis);

describe('3D wedding dress train', () => {
  const built = buildGarmentModel(pieces(), 'ROBE_MARIEE', M);
  if (!built.ok) throw new Error('model not built');
  const skirt = built.model.panels.filter((p) => p.zone === 'skirt');

  it('never goes through the floor: the cloth longer than the way down lies on it', () => {
    expect(skirt.length).toBeGreaterThan(0);
    for (const panel of skirt) expect(Math.min(...coords(panel.positions, 1))).toBeGreaterThanOrEqual(0);
  });

  it('spreads the train out behind, further back than it spreads to the sides', () => {
    const back = skirt.find((p) => p.id === 'skirt-back')!;
    const behind = -Math.min(...coords(back.positions, 2));
    const across = Math.max(...coords(back.positions, 0).map(Math.abs));
    // The 90 cm train runs out well behind the hem.
    expect(behind).toBeGreaterThan(1);
    expect(behind).toBeGreaterThan(across);
  });
});

const asDto = (raw: ReturnType<typeof RobeMarieeRule.computePieces>): PatternPieceDto[] =>
  raw.map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: p.notches ?? [] }) as unknown as PatternPieceDto,
  );
const widthAt = (panels: { zone: string; positions: Float32Array }[], y: number): number => {
  let w = 0;
  for (const p of panels) {
    if (p.zone === 'sleeve') continue;
    for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(p.positions[i + 1]! - y) < 0.015) w = Math.max(w, 2 * Math.abs(p.positions[i]!));
  }
  return w;
};

describe('3D ball gown on its petticoat', () => {
  const ballGown = (fullness: number) => {
    const built = buildGarmentModel(
      asDto(
        RobeMarieeRule.computePieces(
          {
            garmentType: 'ROBE_MARIEE',
            cutType: 'PRINCESSE',
            style: null,
            details: { manches: 'COURTES', longueur: 'SOL' },
            ease: 'AJUSTE',
            fullness: { skirt: fullness },
            drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 40, depthMm: 80, type: 'KNIFE' }] },
          },
          M,
        ),
      ),
      'ROBE_MARIEE',
      M,
      undefined,
      'STRUCTURE',
    );
    if (!built.ok) throw new Error('model not built');
    return built.model;
  };

  it('draws the petticoat as an inner layer instead of ignoring it', () => {
    const model = ballGown(3);
    expect(model.ignored).not.toContain('Jupon / Doublure Jupe');
    expect(model.panels.some((p) => p.id === 'skirt-petticoat')).toBe(true);
  });

  it('holds the pleated skirt out in a dome: the hem as wide as the reading asks, the skirt down to the floor', () => {
    const model = ballGown(3);
    const skirt = model.panels.filter((p) => p.zone === 'skirt' && p.id !== 'skirt-petticoat');
    const bottom = Math.min(...skirt.flatMap((p) => coords(p.positions, 1)));
    expect(bottom).toBeLessThan(0.02);
    const waist = widthAt(model.panels, 1.02);
    const hem = widthAt(skirt, bottom + 0.05);
    expect(hem / waist).toBeGreaterThan(2.7);
    expect(hem / waist).toBeLessThan(3.4);
    // A dome: most of the width is reached by mid-length.
    expect(widthAt(skirt, 0.55)).toBeGreaterThan(0.75 * hem);
    // The petticoat stays inside the skirt and above its hem.
    const petticoat = model.panels.find((p) => p.id === 'skirt-petticoat')!;
    expect(Math.min(...coords(petticoat.positions, 1))).toBeGreaterThan(bottom);
  });
});

describe('3D train block', () => {
  it('lays the « Traîne (demi-ellipse) » on the floor behind the back skirt', () => {
    const pieces = RobeRule.computePieces(
      { garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL' }, drape: { blocks: [{ kind: 'TRAIN', lengthMm: 600 }] } },
      M,
    );
    const built = buildGarmentModel(asDto(pieces), 'ROBE', M);
    if (!built.ok) throw new Error('model not built');
    expect(built.model.ignored).toEqual([]);
    const train = built.model.panels.find((p) => p.id === 'skirt-train')!;
    expect(Math.min(...coords(train.positions, 1))).toBeGreaterThanOrEqual(0);
    const back = built.model.panels.find((p) => p.id === 'skirt-back')!;
    // 60 cm behind the back hem at the centre back.
    expect(Math.min(...coords(back.positions, 2)) - Math.min(...coords(train.positions, 2))).toBeGreaterThan(0.5);
  });
});
