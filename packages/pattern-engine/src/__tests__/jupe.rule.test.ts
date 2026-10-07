import { describe, it, expect } from 'vitest';
import { JupeRule } from '../rules/jupe.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('JupeRule', () => {
  it('should apply to JUPE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'JUPE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(JupeRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to ROBE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(JupeRule.appliesTo(params)).toBe(false);
  });

  it('should compute pieces correctly with valid measurements', () => {
    const params: PatternParameters = {
      garmentType: 'JUPE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_TAILLE: 70, // 700mm
      TOUR_BASSIN: 90, // 900mm
      LONGUEUR_DOS: 60, // 600mm
    };

    const pieces = JupeRule.computePieces(params, measurements);

    expect(pieces.length).toBe(2);
    const devant = pieces.find((p) => p.name === 'Devant');
    const dos = pieces.find((p) => p.name === 'Dos');

    expect(devant).toBeDefined();
    expect(dos).toBeDefined();

    // Devant: tb / 4 + 10 = 900 / 4 + 10 = 225 + 10 = 235
    // Dos: tb / 4 - 10 = 900 / 4 - 10 = 225 - 10 = 215
    // We check originX of grainline which is largeur / 2
    expect(devant?.grainline.originX).toBe(117.5); // 235 / 2
    expect(dos?.grainline.originX).toBe(107.5); // 215 / 2

    // Check height
    expect(devant?.grainline.originY).toBe(300); // 600 / 2
  });

  it('changes the skirt silhouette and length with the cut and the longueur detail', () => {
    const measurements: MeasurementSet = { TOUR_TAILLE: 70, TOUR_BASSIN: 90, LONGUEUR_DOS: 60 };
    const devant = (cutType: string, details: Record<string, string> = {}) =>
      JupeRule.computePieces({ garmentType: 'JUPE', cutType, style: null, details }, measurements).find(
        (p) => p.name === 'Devant',
      )!;
    const width = (cutType: string) => Math.max(...devant(cutType).outlineMm.map((p) => p.x));

    expect(width('EVASEE')).toBeGreaterThan(width('DROITE'));
    expect(width('AJUSTEE')).toBeLessThan(width('DROITE'));
    expect(devant('SIRENE').outlineMm.length).toBe(devant('DROITE').outlineMm.length + 1);

    const length = (longueur: string) => Math.max(...devant('DROITE', { longueur }).outlineMm.map((p) => p.y));
    expect(length('MINI')).toBeLessThan(length('MAXI'));
  });
});
