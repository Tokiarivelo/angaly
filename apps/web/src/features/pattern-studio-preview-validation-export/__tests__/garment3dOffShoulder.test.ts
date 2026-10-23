import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeMarieeRule } from '../../../../../../packages/pattern-engine/src/rules/robe-mariee.rule';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { bodyLandmarks } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { loadHumanBase } from './helpers/humanBase';

const M = { STATURE: 165, TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const base = loadHumanBase();

const drape = (garment: 'ROBE' | 'ROBE_MARIEE', details: Record<string, string>) => {
  const rule = garment === 'ROBE' ? RobeRule : RobeMarieeRule;
  const pieces = rule
    .computePieces({ garmentType: garment, cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', manches: 'COURTES', ...details } }, M)
    .map(
      (p, i) =>
        ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
    );
  const built = buildGarmentModel(pieces, garment, M, 'FEMME_STANDARD');
  if (!built.ok) throw new Error(built.reason);
  const { body, torsoRings, layout } = built.model;
  const fit = fitHumanBody(base, body, torsoRings, morphFor(body, 'FEMME_STANDARD'));
  const env = envelopeFromMesh(fit.positions, base.indices, base.armWeights, body);
  return { panels: drapeGarment(layout, body, env), l: bodyLandmarks(body), env, ignored: built.model.ignored };
};

/** Highest cloth (m) of the zone's panels within `band` of |x|. */
const topAt = (panels: PanelMeshData[], zone: string, x: number, band = 0.015): number => {
  let top = -Infinity;
  for (const p of panels.filter((q) => q.zone === zone)) {
    for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(Math.abs(p.positions[i]!) - x) < band) top = Math.max(top, p.positions[i + 1]!);
  }
  return top;
};

/** Highest cloth (m) of a zone over the whole width. */
const top = (panels: PanelMeshData[], zone: string): number => {
  let y = -Infinity;
  for (const p of panels.filter((q) => q.zone === zone)) for (let i = 1; i < p.positions.length; i += 3) y = Math.max(y, p.positions[i]!);
  return y;
};

describe('3D off-the-shoulder neckline (decollete HORS_EPAULES)', () => {
  for (const garment of ['ROBE', 'ROBE_MARIEE'] as const) {
    it(`${garment}: the bodice edge stays under the shoulders, the sleeve sets in under it`, () => {
      const off = drape(garment, { decollete: 'HORS_EPAULES' });
      expect(off.ignored).toEqual([]);
      const { l } = off;
      // Nothing rests on the shoulders: the whole edge (front and back) and the sleeve's top stay below their line.
      expect(top(off.panels, 'bodice')).toBeLessThan(l.shoulderY - 0.01);
      expect(top(off.panels, 'sleeve')).toBeLessThan(l.shoulderY - 0.02);
      // Centre front: well under the base of the neck (a few cm below the shoulder line), above the armpit.
      const centre = topAt(off.panels.filter((p) => p.id.includes('front')), 'bodice', 0, 0.01);
      expect(centre).toBeLessThan(l.shoulderY - 0.03);
      expect(centre).toBeGreaterThan(off.env.armpitY);
      // At the sides the edge runs on the upper arm, out past the neck to the sleeve.
      expect(topAt(off.panels, 'bodice', 0.16)).toBeGreaterThan(off.env.armpitY);

      // The same dress with a boat neck rests on the shoulders, rising above their line.
      const boat = drape(garment, { col: 'BATEAU' });
      expect(top(boat.panels, 'bodice')).toBeGreaterThan(l.shoulderY);
      expect(top(boat.panels, 'sleeve')).toBeGreaterThan(l.shoulderY);
    });
  }
});
