import { describe, it, expect } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
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

    it('keeps every outline closed', () => {
      for (const cut of ['DROITE', 'SIRENE', 'OVERSIZE']) {
        for (const piece of make(cut, { manches: 'BALLON' })) {
          expect(piece.outlineMm[0]).toEqual(piece.outlineMm[piece.outlineMm.length - 1]);
        }
      }
    });
  });
});
