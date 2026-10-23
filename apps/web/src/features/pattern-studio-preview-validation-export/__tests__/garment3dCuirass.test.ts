import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { RobeMarieeRule } from '../../../../../../packages/pattern-engine/src/rules/robe-mariee.rule';
import { bodyLandmarks } from '../utils/garment3d/body-model';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import { PATCH_LAYER_LIFT, PATCH_LIFT } from '../utils/garment3d/detail-patch';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
type Pieces = ReturnType<typeof RobeRule.computePieces>;
const build = (pieces: Pieces, garmentType: string) => {
  const dto = pieces.map(
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
  const built = buildGarmentModel(dto, garmentType, M);
  if (!built.ok) throw new Error(built.reason);
  return built.model;
};

describe('3D cuirasse dress: princess bodice, tailored sleeves, gilet basque over a gored skirt', () => {
  const m = build(
    RobeRule.computePieces(
      {
        garmentType: 'ROBE',
        cutType: 'AJUSTEE',
        style: null,
        fullness: { skirt: 2 },
        details: { longueur: 'SOL', taille: 'BASSE', col: 'OFFICIER', manches: 'TAILLEUR', devant: 'GILET', fermeture: 'BOUTONS', jupe: 'EN_LES', corsage: 'PRINCESSE', basque: 'PANS_CROISES' },
      },
      M,
    ),
    'ROBE',
  );

  it('drapes every piece: nothing is left aside, the inside pieces are listed', () => {
    expect(m.ignored).toEqual([]);
    for (const name of ['Pan croisé', 'Ceinture intérieure (gros-grain)', 'Parementure de poignet']) expect(m.inside).toContain(name);
  });

  it('keeps the buttons on the gilet although the bodice front is joined from its princess panels', () => {
    expect(m.panels.some((p) => p.label === 'Boutons')).toBe(true);
  });

  it('lays the gilet points and the crossed tabs on the skirt front, in the contrasting fabric, points on top', () => {
    const details = m.panels.filter((p) => p.zone === 'detail' && p.id.startsWith('skirt-front'));
    expect(details.map((p) => p.label).sort()).toEqual(['Pan croisé', 'Pan croisé', 'Plastron (gilet)', 'Plastron (gilet)']);
    expect(details.every((p) => p.contrast === true)).toBe(true);
    // Both halves (mirrored), below the waist.
    const waistY = bodyLandmarks(m.body).waistY;
    for (const p of details) for (let i = 1; i < p.positions.length; i += 3) expect(p.positions[i]!).toBeLessThan(waistY);
    expect(PATCH_LIFT + PATCH_LAYER_LIFT).toBeGreaterThan(PATCH_LIFT);
  });

  it('finishes the tailored sleeves with a cuff as high as the piece (it is faced, not folded)', () => {
    const cuff = m.panels.find((p) => p.zone === 'cuff')!;
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 1; i < cuff.positions.length; i += 3) {
      lo = Math.min(lo, cuff.positions[i]!);
      hi = Math.max(hi, cuff.positions[i]!);
    }
    expect(hi - lo).toBeGreaterThan(0.025);
  });

  it('never cuts a princess side panel in the accent fabric (only side gores can be)', () => {
    expect(m.panels.find((p) => p.id === 'bodice-front')!.accent).toBeUndefined();
    expect(m.panels.find((p) => p.id === 'skirt-front')!.accent).toBeDefined();
  });
});

describe('3D pointed waist over a pleated skirt block (ball gown)', () => {
  const m = build(
    RobeMarieeRule.computePieces(
      {
        garmentType: 'ROBE_MARIEE',
        cutType: 'PRINCESSE',
        style: null,
        ease: 'AJUSTE',
        fullness: { skirt: 3, sleeve: 1.8 },
        lengths: { sleevePct: 20 },
        drape: { blocks: [{ kind: 'PLEATED_SKIRT', type: 'KNIFE', pleats: 40, depthMm: 80 }] },
        details: { taille: 'POINTE', corsage: 'BALEINE', manches: 'COURTES', longueur: 'SOL', decollete: 'HORS_EPAULES' },
      },
      M,
    ),
    'ROBE_MARIEE',
  );
  const lowestNear = (id: string, maxX: number, top: boolean): number => {
    const p = m.panels.find((q) => q.id === id)!;
    let v = top ? -Infinity : Infinity;
    for (let i = 0; i < p.positions.length; i += 3) {
      if (Math.abs(p.positions[i]!) > maxX || p.positions[i + 2]! < 0) continue;
      v = top ? Math.max(v, p.positions[i + 1]!) : Math.min(v, p.positions[i + 1]!);
    }
    return v;
  };

  it('dips the skirt top to the bodice point at the centre front, and keeps it at the waist at the side', () => {
    const waistY = bodyLandmarks(m.body).waistY;
    const point = lowestNear('bodice-front', 0.01, false);
    expect(point).toBeLessThan(waistY - 0.04);
    const skirtTopCentre = lowestNear('skirt-front', 0.01, true);
    expect(skirtTopCentre).toBeLessThan(waistY - 0.03);
    expect(Math.abs(skirtTopCentre - point)).toBeLessThan(0.03);
    expect(lowestNear('skirt-front', 0.3, true)).toBeGreaterThan(waistY - 0.01);
  });
});
