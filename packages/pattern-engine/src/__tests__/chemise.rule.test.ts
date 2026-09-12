import { describe, it, expect } from 'vitest';
import { ChemiseRule } from '../rules/chemise.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('ChemiseRule', () => {
  it('should apply to CHEMISE and AUTRE garment types', () => {
    const paramsChemise: PatternParameters = {
      garmentType: 'CHEMISE',
      cutType: 'AJUSTÉE',
      style: null,
      details: {},
    };
    const paramsAutre: PatternParameters = {
      garmentType: 'AUTRE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(ChemiseRule.appliesTo(paramsChemise)).toBe(true);
    expect(ChemiseRule.appliesTo(paramsAutre)).toBe(true);
  });

  it('should compute pieces correctly with valid measurements', () => {
    const params: PatternParameters = {
      garmentType: 'CHEMISE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 94,
      TOUR_TAILLE: 78,
      LONGUEUR_DOS: 43,
      LONGUEUR_BRAS: 60,
    };

    const pieces = ChemiseRule.computePieces(params, measurements);

    expect(pieces.length).toBe(5);
    expect(pieces.find((p) => p.name === 'Devant Chemise')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Dos Chemise')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Manche Chemise')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Col & Pied de col')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Poignet')).toBeDefined();

    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });
});
