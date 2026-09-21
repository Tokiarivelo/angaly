import { describe, it, expect } from 'vitest';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { RobeRule } from '../rules/robe.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('RobeMarieeRule', () => {
  it('should apply to ROBE_MARIEE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    expect(RobeMarieeRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to ROBE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(RobeMarieeRule.appliesTo(params)).toBe(false);
  });

  it('should compute a structured bustier + train construction, distinct from RobeRule', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'PRINCESSE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const pieces = RobeMarieeRule.computePieces(params, measurements);

    expect(pieces.length).toBe(7);
    expect(pieces.find((p) => p.name === 'Bustier Devant (Princesse)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Bustier Côté (Découpe Princesse)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Bustier Dos (Lacage)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Devant')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Côté')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Dos avec Traîne')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupon / Doublure Jupe')).toBeDefined();

    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });

  it('should give the back skirt a meaningfully longer hem than the front (train)', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const pieces = RobeMarieeRule.computePieces(params, measurements);
    const jupeDevant = pieces.find((p) => p.name === 'Jupe Devant');
    const jupeDosTraine = pieces.find((p) => p.name === 'Jupe Dos avec Traîne');

    const longueurDevant = jupeDevant?.outlineMm[3]?.y ?? 0; // hem point, front
    const longueurDos = jupeDosTraine?.outlineMm[4]?.y ?? 0; // train tip point

    expect(longueurDos).toBeGreaterThan(longueurDevant);
    // Default train length is 90cm = 900mm
    expect(longueurDos - longueurDevant).toBe(900);
  });

  it('should use a distinctly different (tighter) bodice construction than RobeRule', () => {
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const robePieces = RobeRule.computePieces(
      { garmentType: 'ROBE', cutType: 'DROITE', style: null, details: {} },
      measurements,
    );
    const marieePieces = RobeMarieeRule.computePieces(
      { garmentType: 'ROBE_MARIEE', cutType: 'DROITE', style: null, details: {} },
      measurements,
    );

    // RobeRule produces 4 pieces (no side panel, no train, no jupon).
    expect(robePieces.length).toBe(4);
    // RobeMarieeRule produces a structurally different, larger piece set.
    expect(marieePieces.length).toBe(7);
    expect(marieePieces.some((p) => p.name.includes('Côté'))).toBe(true);
    expect(marieePieces.some((p) => p.name.includes('Traîne'))).toBe(true);
  });
});
