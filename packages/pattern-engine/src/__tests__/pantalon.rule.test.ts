import { describe, it, expect } from 'vitest';
import { PantalonRule } from '../rules/pantalon.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('PantalonRule', () => {
  it('should apply to PANTALON garment type', () => {
    const params: PatternParameters = {
      garmentType: 'PANTALON',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(PantalonRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to ROBE or JUPE garment type', () => {
    const paramsRobe: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const paramsJupe: PatternParameters = {
      garmentType: 'JUPE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(PantalonRule.appliesTo(paramsRobe)).toBe(false);
    expect(PantalonRule.appliesTo(paramsJupe)).toBe(false);
  });

  it('should compute pieces correctly with valid measurements', () => {
    const params: PatternParameters = {
      garmentType: 'PANTALON',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_TAILLE: 72,
      TOUR_BASSIN: 96,
      LONGUEUR_JAMBE: 102,
    };

    const pieces = PantalonRule.computePieces(params, measurements);

    expect(pieces.length).toBe(4);
    const devant = pieces.find((p) => p.name === 'Devant Pantalon');
    const dos = pieces.find((p) => p.name === 'Dos Pantalon');
    const ceinture = pieces.find((p) => p.name === 'Ceinture');
    const poche = pieces.find((p) => p.name === 'Fond de Poche');

    expect(devant).toBeDefined();
    expect(dos).toBeDefined();
    expect(ceinture).toBeDefined();
    expect(poche).toBeDefined();

    expect(devant?.quantity).toBe(2);
    expect(dos?.quantity).toBe(2);
    expect(ceinture?.quantity).toBe(1);

    // Ceinture length = 720 + 80 = 800
    expect(ceinture?.outlineMm[1]?.x).toBe(800);

    // Closed outlines
    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });

  it('should adjust bottom leg width according to cutType', () => {
    const slimPieces = PantalonRule.computePieces(
      { garmentType: 'PANTALON', cutType: 'SLIM', style: null, details: {} },
      { TOUR_TAILLE: 70, TOUR_BASSIN: 90 },
    );
    const largePieces = PantalonRule.computePieces(
      { garmentType: 'PANTALON', cutType: 'LARGE', style: null, details: {} },
      { TOUR_TAILLE: 70, TOUR_BASSIN: 90 },
    );

    const devantSlim = slimPieces.find((p) => p.name === 'Devant Pantalon');
    const devantLarge = largePieces.find((p) => p.name === 'Devant Pantalon');

    // Hem width point 4 - point 5
    const widthSlim = (devantSlim?.outlineMm[4]?.x ?? 0) - (devantSlim?.outlineMm[5]?.x ?? 0);
    const widthLarge = (devantLarge?.outlineMm[4]?.x ?? 0) - (devantLarge?.outlineMm[5]?.x ?? 0);

    expect(widthLarge).toBeGreaterThan(widthSlim);
  });
});
