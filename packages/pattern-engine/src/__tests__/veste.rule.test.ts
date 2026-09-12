import { describe, it, expect } from 'vitest';
import { VesteRule } from '../rules/veste.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('VesteRule', () => {
  it('should apply to VESTE and COSTUME garment types', () => {
    const paramsVeste: PatternParameters = {
      garmentType: 'VESTE',
      cutType: 'CINTRÉE',
      style: null,
      details: {},
    };
    const paramsCostume: PatternParameters = {
      garmentType: 'COSTUME',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(VesteRule.appliesTo(paramsVeste)).toBe(true);
    expect(VesteRule.appliesTo(paramsCostume)).toBe(true);
  });

  it('should compute pieces correctly with valid measurements', () => {
    const params: PatternParameters = {
      garmentType: 'VESTE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 100,
      TOUR_TAILLE: 84,
      LONGUEUR_DOS: 44,
      LONGUEUR_BRAS: 62,
    };

    const pieces = VesteRule.computePieces(params, measurements);

    expect(pieces.length).toBe(4);
    expect(pieces.find((p) => p.name === 'Devant Veste')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Dos Veste')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Manche Veste')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Col Tailleur')).toBeDefined();

    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first.x).toBe(last.x);
      expect(first.y).toBe(last.y);
    }
  });
});
