import { describe, it, expect } from 'vitest';
import { AutreRule } from '../rules/autre.rule';
import type { PatternParameters, MeasurementSet } from '../types';

describe('AutreRule', () => {
  it('should apply to AUTRE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'AUTRE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(AutreRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to CHEMISE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'CHEMISE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(AutreRule.appliesTo(params)).toBe(false);
  });

  it('should compute a generic rectangular base block (front + back)', () => {
    const params: PatternParameters = {
      garmentType: 'AUTRE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 92,
      TOUR_TAILLE: 76,
      LONGUEUR_DOS: 42,
    };

    const pieces = AutreRule.computePieces(params, measurements);

    expect(pieces.length).toBe(2);
    expect(pieces.find((p) => p.name === 'Bloc de Base — Devant (générique, à adapter)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Bloc de Base — Dos (générique, à adapter)')).toBeDefined();

    for (const piece of pieces) {
      // Purely rectangular outline (4 corners + closing point) — no darts, no armhole.
      expect(piece.outlineMm.length).toBe(5);
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });
});
