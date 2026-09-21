import { describe, it, expect } from 'vitest';
import { CostumeRule } from '../rules/costume.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('CostumeRule', () => {
  it('should apply to COSTUME garment type', () => {
    const params: PatternParameters = {
      garmentType: 'COSTUME',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(CostumeRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to VESTE or PANTALON garment type', () => {
    const paramsVeste: PatternParameters = {
      garmentType: 'VESTE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const paramsPantalon: PatternParameters = {
      garmentType: 'PANTALON',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(CostumeRule.appliesTo(paramsVeste)).toBe(false);
    expect(CostumeRule.appliesTo(paramsPantalon)).toBe(false);
  });

  it('should compute a complete costume: jacket pieces AND trouser pieces', () => {
    const params: PatternParameters = {
      garmentType: 'COSTUME',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 100,
      TOUR_TAILLE: 84,
      TOUR_BASSIN: 98,
      LONGUEUR_DOS: 44,
      LONGUEUR_BRAS: 62,
      LONGUEUR_JAMBE: 102,
    };

    const pieces = CostumeRule.computePieces(params, measurements);

    expect(pieces.length).toBe(7);

    // Jacket half
    expect(pieces.find((p) => p.name === 'Devant Veste (Costume)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Dos Veste (Costume)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Manche Veste (Costume)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Col Tailleur (Costume)')).toBeDefined();

    // Trouser half — the part that used to be silently missing (bug fixed here)
    const devantPantalon = pieces.find((p) => p.name === 'Devant Pantalon (Costume)');
    const dosPantalon = pieces.find((p) => p.name === 'Dos Pantalon (Costume)');
    const ceinture = pieces.find((p) => p.name === 'Ceinture Pantalon (Costume)');
    expect(devantPantalon).toBeDefined();
    expect(dosPantalon).toBeDefined();
    expect(ceinture).toBeDefined();
    expect(devantPantalon?.quantity).toBe(2);
    expect(dosPantalon?.quantity).toBe(2);
    expect(ceinture?.quantity).toBe(1);

    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });

  it('should fall back to default measurements when optional ones are missing', () => {
    const params: PatternParameters = {
      garmentType: 'COSTUME',
      cutType: 'SLIM',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 96,
      TOUR_TAILLE: 80,
      TOUR_BASSIN: 95,
      LONGUEUR_DOS: 45,
    };

    const pieces = CostumeRule.computePieces(params, measurements);
    expect(pieces.length).toBe(7);
  });
});
