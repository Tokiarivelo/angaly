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
          details: { manches: 'COURTES', col: 'ROND', longueur: 'MAXI', corsage: 'FRONCES_SOUS_POITRINE', taille: 'BASSE' },
          ease: 'CONFORT',
          fullness: { sleeve: 1.5 },
          lengths: { skirtPct: 94, sleevePct: 25 },
          drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 20, depthMm: 55, type: 'BOX' }] },
        },
        measurements,
      );
      expect(pieces.map((p) => p.name)).toEqual([
        'Corsage Devant',
        'Empiècement Devant',
        'Corsage Dos',
        'Jupe plissée plis creux (panneau)',
        'Manche',
      ]);
      // The midriff runs from under the bust to 11 cm below the waist; the pleated skirt starts there.
      const band = pieces.find((p) => p.name === 'Empiècement Devant')!.outlineMm;
      expect(Math.max(...band.map((p) => p.y))).toBeGreaterThan(110 + 60);
      const skirt = pieces.find((p) => p.name.startsWith('Jupe plissée'))!;
      expect(Math.max(...skirt.outlineMm.map((p) => p.y))).toBe(Math.round(950 * 0.94) - 110);
      // 20 box pleats over lés no wider than the fabric (≈ 3 m of cloth: four lés of 140 cm laize).
      expect(skirt.quantity).toBe(4);
      expect(skirt.notches.length * skirt.quantity).toBeGreaterThanOrEqual(20);
      expect(Math.max(...skirt.outlineMm.map((p) => p.x))).toBeLessThanOrEqual(1400 - 20);
      // Short puffed sleeve: a quarter of the arm under the cap (25 % of 59 cm), half as wide again at the top.
      const sleeve = pieces.find((p) => p.name === 'Manche')!.outlineMm;
      expect(Math.max(...sleeve.map((pt) => pt.y)) - sleeve[0]!.y).toBe(148);
      const plain = make('EVASEE', { manches: 'COURTES' }).find((p) => p.name === 'Manche')!.outlineMm;
      expect(Math.max(...sleeve.map((pt) => pt.x))).toBeCloseTo(1.5 * Math.max(...plain.map((pt) => pt.x)), 0);
    });

    it('drops the waist seam over the hips with taille BASSE', () => {
      const natural = make('EVASEE', { longueur: 'MAXI' });
      const low = make('EVASEE', { longueur: 'MAXI', taille: 'BASSE' });
      for (const name of ['Corsage Devant', 'Corsage Dos']) {
        expect(maxY(low, name) - maxY(natural, name)).toBe(110);
        const bottom = low.find((p) => p.name === name)!.outlineMm.filter((p) => p.y === maxY(low, name));
        const waist = natural.find((p) => p.name === name)!.outlineMm.filter((p) => p.y === maxY(natural, name));
        // Wider at the basque's lower edge than at the waist: it follows the hips.
        expect(Math.max(...bottom.map((p) => p.x))).toBeGreaterThan(Math.max(...waist.map((p) => p.x)));
      }
      expect(maxY(natural, 'Jupe Devant') - maxY(low, 'Jupe Devant')).toBe(110);
      // The skirt's top edge is as wide as the basque's lower edge.
      const top = low.find((p) => p.name === 'Jupe Devant')!.outlineMm[1]!.x;
      const basque = Math.max(...low.find((p) => p.name === 'Corsage Devant')!.outlineMm.filter((p) => p.y === maxY(low, 'Corsage Devant')).map((p) => p.x));
      expect(top).toBe(basque);
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

describe('RobeRule — taille haute (empire)', () => {
  const run = (taille: 'NATURELLE' | 'HAUTE') => {
    const pieces = RobeRule.computePieces(
      { garmentType: 'ROBE', cutType: 'EVASEE', style: null, details: { longueur: 'MAXI', taille } },
      { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 },
    );
    const height = (name: string) => {
      const p = pieces.find((q) => q.name === name)!;
      const ys = p.outlineMm.map((q) => q.y);
      return Math.max(...ys) - Math.min(...ys);
    };
    return { bodice: height('Corsage Dos'), skirt: height('Jupe Dos') };
  };

  it('shortens the bodice and lengthens the skirt by the same rise, so the hem stays put', () => {
    const natural = run('NATURELLE');
    const empire = run('HAUTE');
    expect(natural.bodice - empire.bodice).toBe(120);
    expect(empire.skirt - natural.skirt).toBe(120);
  });
});

describe('RobeRule collars', () => {
  const names = (col?: string) =>
    RobeRule.computePieces(
      { garmentType: 'ROBE', cutType: 'DROITE', style: null, details: col ? { col } : {} },
      { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 },
    ).map((p) => p.name);

  it('adds the collar piece the detail asks for, and none otherwise', () => {
    expect(names('OFFICIER')).toContain('Col officier');
    expect(names('CHALE')).toContain('Col châle');
    expect(names('ROND').some((n) => n.startsWith('Col'))).toBe(false);
    expect(names().some((n) => n.startsWith('Col'))).toBe(false);
  });
});

describe('RobeRule — neckline shapes (V, square, round)', () => {
  const M2 = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
  const front = (details: Record<string, string>) => {
    const pieces = RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'DROITE', style: null, details }, M2);
    const o = pieces.find((p) => p.name === 'Corsage Devant')!.outlineMm;
    // The neckline: from the centre-front point (x = 0) to the first point at the top (y = 0).
    const end = o.findIndex((p) => p.y === 0);
    return o.slice(0, end + 1);
  };

  it('a V neckline runs straight from the centre front to the shoulder', () => {
    const neck = front({ col: 'EN_V' });
    expect(neck).toHaveLength(2);
    expect(neck[0]).toEqual({ x: 0, y: 170 });
  });

  it('keeps the V of the collar line under a chosen décolleté level, at the depth of a V (MOYEN 13 cm, SAGE 10)', () => {
    const neck = front({ col: 'EN_V', decollete: 'MOYEN' });
    expect(neck).toHaveLength(2);
    expect(neck[0]).toEqual({ x: 0, y: 130 });
    expect(front({ col: 'EN_V', decollete: 'SAGE' })[0]).toEqual({ x: 0, y: 100 });
    // A round neckline at the same level keeps its depth; a plunging V its own.
    expect(front({ col: 'ROND', decollete: 'MOYEN' })[0]).toEqual({ x: 0, y: 80 });
    expect(front({ col: 'EN_V', decollete: 'PLONGEANT' })[0]).toEqual({ x: 0, y: 220 });
  });

  it('a square neckline goes across, then straight up', () => {
    const neck = front({ decollete: 'CARRE' });
    expect(neck).toEqual([{ x: 0, y: 120 }, { x: 110, y: 120 }, { x: 110, y: 0 }]);
  });

  it('a round neckline is still a curve', () => {
    const neck = front({ col: 'ROND' });
    expect(neck.length).toBeGreaterThan(4);
  });
});
