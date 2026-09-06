import { describe, expect, it } from 'vitest';

import { PatternEngine } from '../pattern-engine';
import { PatternEngineValidationError } from '../types';
import type { IPatternRule, PatternParameters } from '../types';

const baseParameters: PatternParameters = {
  garmentType: 'JUPE',
  cutType: 'DROITE',
  style: 'CLASSIQUE',
  details: {},
};

function createStubRule(overrides: Partial<IPatternRule> = {}): IPatternRule {
  return {
    garmentType: 'JUPE',
    requiredMeasurementKeys: ['TOUR_TAILLE', 'TOUR_HANCHES'],
    appliesTo: () => true,
    computePieces: () => [
      {
        name: 'Devant',
        fabricRecommendation: null,
        quantity: 1,
        outlineMm: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 200 },
          { x: 0, y: 200 },
          { x: 0, y: 0 },
        ],
        seamAllowanceMm: 10,
        grainline: { angleDegrees: 0, originX: 50, originY: 100 },
        notches: [],
      },
    ],
    ...overrides,
  };
}

describe('PatternEngine', () => {
  it('throws when no rule is registered for the requested garment type', () => {
    const engine = new PatternEngine();

    expect(() => engine.generate(baseParameters, { TOUR_TAILLE: 70, TOUR_HANCHES: 95 })).toThrow(
      PatternEngineValidationError,
    );
  });

  it('throws with the missing measurement keys when the measurement set is incomplete', () => {
    const engine = new PatternEngine();
    engine.registerRule(createStubRule());

    expect(() => engine.generate(baseParameters, { TOUR_TAILLE: 70 })).toThrowError(
      /TOUR_HANCHES/,
    );
  });

  it('delegates to the matching rule and returns its pieces with engine metadata', () => {
    const engine = new PatternEngine();
    engine.registerRule(createStubRule());

    const result = engine.generate(baseParameters, { TOUR_TAILLE: 70, TOUR_HANCHES: 95 });

    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0]?.name).toBe('Devant');
    expect(result.warnings).toEqual([]);
    expect(result.metadata.engineVersion).toMatch(/^\d+\.\d+\.\d+/);
  });
});
