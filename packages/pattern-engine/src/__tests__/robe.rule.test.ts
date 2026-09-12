import { describe, it, expect } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('RobeRule', () => {
  it('should apply to ROBE and ROBE_MARIEE garment type', () => {
    const paramsRobe: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const paramsMariee: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    expect(RobeRule.appliesTo(paramsRobe)).toBe(true);
    expect(RobeRule.appliesTo(paramsMariee)).toBe(true);
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
});
