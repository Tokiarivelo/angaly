import { describe, it, expect } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { NECK_CURVE_SEGMENTS } from '../shared/shapes';
import type { PatternParameters, MeasurementSet } from '../types';

describe('RobeRule', () => {
  it('should apply to ROBE garment type', () => {
    const paramsRobe: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(RobeRule.appliesTo(paramsRobe)).toBe(true);
  });

  it('should no longer apply to ROBE_MARIEE garment type (has its own dedicated rule)', () => {
    const paramsMariee: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    expect(RobeRule.appliesTo(paramsMariee)).toBe(false);
  });

  it('should not apply to JUPE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'JUPE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(RobeRule.appliesTo(params)).toBe(false);
  });

  it('should compute pieces correctly with valid measurements', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const pieces = RobeRule.computePieces(params, measurements);

    expect(pieces.length).toBe(4);
    expect(pieces.find((p) => p.name === 'Corsage Devant')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Corsage Dos')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Devant')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Dos')).toBeDefined();
  });

  describe('design choices change the geometry', () => {
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };
    const make = (cutType: string, details: Record<string, string> = {}) =>
      RobeRule.computePieces({ garmentType: 'ROBE', cutType, style: null, details }, measurements);
    const maxX = (pieces: ReturnType<typeof make>, name: string) =>
      Math.max(...pieces.find((p) => p.name === name)!.outlineMm.map((pt) => pt.x));
    const maxY = (pieces: ReturnType<typeof make>, name: string) =>
      Math.max(...pieces.find((p) => p.name === name)!.outlineMm.map((pt) => pt.y));

    it('produces a different outline for every cut', () => {
      const cuts = ['DROITE', 'EVASEE', 'SIRENE', 'PRINCESSE', 'AJUSTEE', 'OVERSIZE'];
      const outlines = new Set(cuts.map((c) => JSON.stringify(make(c))));
      expect(outlines.size).toBe(cuts.length);
    });

    it('flares the hem for EVASEE/PRINCESSE and keeps DROITE straight', () => {
      expect(maxX(make('EVASEE'), 'Jupe Devant')).toBeGreaterThan(maxX(make('DROITE'), 'Jupe Devant'));
      expect(maxX(make('PRINCESSE'), 'Jupe Devant')).toBeGreaterThan(maxX(make('EVASEE'), 'Jupe Devant'));
    });

    it('adds a knee point to the SIRENE skirt', () => {
      const droite = make('DROITE').find((p) => p.name === 'Jupe Devant')!;
      const sirene = make('SIRENE').find((p) => p.name === 'Jupe Devant')!;
      expect(sirene.outlineMm.length).toBe(droite.outlineMm.length + 1);
    });

    it('gives OVERSIZE more room than AJUSTEE', () => {
      expect(maxX(make('OVERSIZE'), 'Corsage Devant')).toBeGreaterThan(maxX(make('AJUSTEE'), 'Corsage Devant'));
    });

    it('follows the longueur detail', () => {
      expect(maxY(make('DROITE', { longueur: 'MINI' }), 'Jupe Devant')).toBeLessThan(
        maxY(make('DROITE', { longueur: 'MAXI' }), 'Jupe Devant'),
      );
    });

    it('deepens the front neckline with a plunging decolleté', () => {
      const depth = (details: Record<string, string>) =>
        make('DROITE', details).find((p) => p.name === 'Corsage Devant')!.outlineMm[0]!.y;
      expect(depth({ decollete: 'PLONGEANT' })).toBeGreaterThan(depth({}));
    });

    it('adds a sleeve piece only when sleeves are chosen', () => {
      expect(make('DROITE').some((p) => p.name === 'Manche')).toBe(false);
      expect(make('DROITE', { manches: 'SANS_MANCHES' }).some((p) => p.name === 'Manche')).toBe(false);
      const longues = make('DROITE', { manches: 'LONGUES' }).find((p) => p.name === 'Manche')!;
      const courtes = make('DROITE', { manches: 'COURTES' }).find((p) => p.name === 'Manche')!;
      expect(longues.quantity).toBe(2);
      expect(Math.max(...longues.outlineMm.map((p) => p.y))).toBeGreaterThan(
        Math.max(...courtes.outlineMm.map((p) => p.y)),
      );
    });

    it('draws the neckline as a curve, square to the centre front and rising to the shoulder', () => {
      const front = make('DROITE', { col: 'ROND' }).find((p) => p.name === 'Corsage Devant')!.outlineMm;
      const curve = front.slice(0, NECK_CURVE_SEGMENTS + 1);
      expect(curve[0]).toEqual({ x: 0, y: 75 });
      expect(curve[NECK_CURVE_SEGMENTS]).toEqual({ x: 75, y: 0 });
      for (let i = 1; i < curve.length; i += 1) {
        expect(curve[i]!.x).toBeGreaterThan(curve[i - 1]!.x);
        expect(curve[i]!.y).toBeLessThan(curve[i - 1]!.y);
      }
      // A quarter ellipse: flat at the centre front, steep at the shoulder.
      expect(curve[1]!.y).toBeGreaterThan(70);
      expect(curve[NECK_CURVE_SEGMENTS - 1]!.x).toBeGreaterThan(70);
    });

    it('gathers the front onto a midriff band under the bust (corsage FRONCES_SOUS_POITRINE)', () => {
      const plain = make('DROITE', { corsage: 'LISSE' });
      const gathered = make('DROITE', { corsage: 'FRONCES_SOUS_POITRINE' });
      expect(plain.some((p) => p.name === 'Empiècement Devant')).toBe(false);
      const upper = gathered.find((p) => p.name === 'Corsage Devant')!.outlineMm;
      const band = gathered.find((p) => p.name === 'Empiècement Devant')!.outlineMm;
      const fullHeight = maxY(plain, 'Corsage Devant');
      const bandHeight = Math.max(...band.map((p) => p.y));
      // The band is a sixth to a quarter of the front, from the seam (y = 0) to the waist.
      expect(bandHeight).toBeGreaterThanOrEqual(60);
      expect(bandHeight).toBeLessThanOrEqual(110);
      expect(Math.max(...band.map((p) => p.x))).toBeGreaterThan(150);
      // The upper part's lower edge is ~1.3 times the seam it is gathered onto, the centre front a fold line.
      const seamY = fullHeight - bandHeight;
      const seam = Math.max(...band.filter((p) => p.y === 0).map((p) => p.x));
      const edge = upper.filter((p) => p.y >= seamY);
      let length = 0;
      for (let i = 1; i < edge.length; i += 1) length += Math.hypot(edge[i]!.x - edge[i - 1]!.x, edge[i]!.y - edge[i - 1]!.y);
      expect(length / seam).toBeGreaterThan(1.25);
      expect(length / seam).toBeLessThan(1.35);
      expect(upper.filter((p) => p.x === 0).length).toBeGreaterThanOrEqual(2);
      expect(Math.max(...upper.map((p) => p.y))).toBeLessThanOrEqual(seamY + 40);
      expect(upper[0]).toEqual(upper[upper.length - 1]);
    });

    it('keeps a neckline without depth straight', () => {
      const front = make('DROITE').find((p) => p.name === 'Corsage Devant')!.outlineMm;
      expect(front.slice(0, 2)).toEqual([{ x: 0, y: 0 }, { x: 80, y: 0 }]);
    });

    it('lowers the centre back neck point by 2 cm', () => {
      const back = make('DROITE').find((p) => p.name === 'Corsage Dos')!.outlineMm;
      expect(back[0]).toEqual({ x: 0, y: 20 });
      expect(back.some((pt) => pt.x === 75 && pt.y === 0)).toBe(true);
    });

    it('builds the polka-dot maxi dress of ml/data/references/robe-pois-maxi.json', () => {
      const pieces = RobeRule.computePieces(
        {
          garmentType: 'ROBE',
          cutType: 'EVASEE',
          style: 'CLASSIQUE',
          details: { manches: 'COURTES', col: 'ROND', longueur: 'MAXI', corsage: 'FRONCES_SOUS_POITRINE' },
          ease: 'CONFORT',
          fullness: { skirt: 1.25, sleeve: 1.25 },
          lengths: { skirtPct: 94, sleevePct: 40 },
        },
        measurements,
      );
      expect(pieces.map((p) => p.name)).toEqual(['Corsage Devant', 'Empiècement Devant', 'Corsage Dos', 'Jupe Devant', 'Jupe Dos', 'Manche']);
      // Skirt: 94 % of the 95 cm maxi length; the hem flares beyond the plain EVASEE one.
      expect(maxY(pieces, 'Jupe Devant')).toBe(Math.round(950 * 0.94));
      expect(maxX(pieces, 'Jupe Devant')).toBeGreaterThan(maxX(make('EVASEE'), 'Jupe Devant'));
      // Short sleeve: 8 cm under the cap (40 % of 20 cm), a quarter wider at the top.
      const sleeve = pieces.find((p) => p.name === 'Manche')!.outlineMm;
      const cap = sleeve[0]!.y;
      expect(Math.max(...sleeve.map((pt) => pt.y)) - cap).toBe(80);
      const plain = make('EVASEE', { manches: 'COURTES' }).find((p) => p.name === 'Manche')!.outlineMm;
      expect(Math.max(...sleeve.map((pt) => pt.x))).toBeCloseTo(1.25 * Math.max(...plain.map((pt) => pt.x)), 0);
    });

    it('keeps every outline closed', () => {
      for (const cut of ['DROITE', 'SIRENE', 'OVERSIZE']) {
        for (const piece of make(cut, { manches: 'BALLON' })) {
          expect(piece.outlineMm[0]).toEqual(piece.outlineMm[piece.outlineMm.length - 1]);
        }
      }
    });
  });
});
