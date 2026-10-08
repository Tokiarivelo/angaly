import { describe, expect, it } from 'vitest';
import {
  comparePatterns,
  contourIoU,
  createDefaultEngine,
  evaluateFidelityCase,
  normalizedHausdorff,
  summarizeFidelity,
} from '../eval/fidelity';
import type { PatternParameters } from '../types';

const rect = (w: number, h: number, ox = 0, oy = 0) => [
  { x: ox, y: oy },
  { x: ox + w, y: oy },
  { x: ox + w, y: oy + h },
  { x: ox, y: oy + h },
  { x: ox, y: oy },
];

const measurements = {
  TOUR_POITRINE: 92,
  TOUR_TAILLE: 74,
  TOUR_HANCHES: 98,
  TOUR_BASSIN: 98,
  LONGUEUR_DOS: 40,
  LONGUEUR_JUPE: 60,
  LONGUEUR_ROBE: 110,
  LONGUEUR_MANCHE: 60,
  LARGEUR_EPAULES: 38,
  HAUTEUR_TAILLE: 100,
};

const robe = (over: Partial<PatternParameters> = {}): PatternParameters => ({
  garmentType: 'ROBE',
  cutType: 'EVASEE',
  style: null,
  details: {},
  ...over,
});

describe('contourIoU / normalizedHausdorff', () => {
  it('identical shapes (even translated) score a perfect match', () => {
    expect(contourIoU(rect(400, 600), rect(400, 600, 900, -50))).toBeCloseTo(1, 5);
    expect(normalizedHausdorff(rect(400, 600), rect(400, 600, 900, -50))).toBeCloseTo(0, 5);
  });

  it('a half-width piece has IoU 0.5 and a visible Hausdorff gap', () => {
    expect(contourIoU(rect(400, 600), rect(200, 600))).toBeCloseTo(0.5, 1);
    const h = normalizedHausdorff(rect(400, 600), rect(200, 600));
    expect(h).toBeGreaterThan(0.2);
    expect(h).toBeLessThan(0.5);
  });

  it('is symmetric in the Hausdorff sense and handles open or degenerate rings', () => {
    const a = rect(300, 500);
    const b = rect(300, 650);
    expect(normalizedHausdorff(a, b) * Math.hypot(300, 500)).toBeCloseTo(
      normalizedHausdorff(b, a) * Math.hypot(300, 650),
      3,
    );
    expect(normalizedHausdorff([{ x: 1, y: 1 }], rect(10, 10))).toBe(1);
    expect(contourIoU([{ x: 0, y: 0 }], [{ x: 0, y: 0 }])).toBe(0);
    // un-closed ring (first point not repeated) behaves like the closed one
    expect(contourIoU(rect(300, 300).slice(0, -1), rect(300, 300))).toBeCloseTo(1, 5);
  });
});

describe('comparePatterns / evaluateFidelityCase', () => {
  const engine = createDefaultEngine();

  it('the same profile reproduces the pattern exactly (determinism)', () => {
    const result = evaluateFidelityCase(
      { id: 'same', expected: robe(), predicted: robe(), measurements },
      engine,
    );
    expect(result.failed).toBe(false);
    expect(result.comparison!.meanIoU).toBeCloseTo(1, 5);
    expect(result.comparison!.maxHausdorff).toBeCloseTo(0, 5);
    expect(result.comparison!.unmatched).toBe(0);
  });

  it('a wrong skirt length lowers the score; a wrong length costs more than a small one', () => {
    const near = evaluateFidelityCase(
      { id: 'near', expected: robe(), predicted: robe({ lengths: { skirtPct: 95 } }), measurements },
      engine,
    ).comparison!;
    const far = evaluateFidelityCase(
      { id: 'far', expected: robe(), predicted: robe({ lengths: { skirtPct: 60 } }), measurements },
      engine,
    ).comparison!;
    expect(near.meanIoU).toBeLessThan(1);
    expect(far.meanIoU).toBeLessThan(near.meanIoU);
    expect(far.maxHausdorff).toBeGreaterThan(near.maxHausdorff);
  });

  it('pieces present on one side only count as unmatched (IoU 0, Hausdorff 1)', () => {
    const withSleeves = engine.generate(robe({ details: { manches: 'LONGUES' } }), measurements);
    const sleeveless = engine.generate(robe({ details: { manches: 'SANS_MANCHES' } }), measurements);
    const cmp = comparePatterns(withSleeves, sleeveless);
    const reverse = comparePatterns(sleeveless, withSleeves);
    expect(cmp.unmatched).toBeGreaterThan(0);
    expect(reverse.unmatched).toBe(cmp.unmatched);
    expect(cmp.maxHausdorff).toBe(1);
    expect(comparePatterns({ ...withSleeves, pieces: [] }, { ...withSleeves, pieces: [] }).meanIoU).toBe(0);
  });

  it('reports an engine failure instead of throwing (missing measurements)', () => {
    const result = evaluateFidelityCase({ id: 'bad', expected: robe(), predicted: robe(), measurements: {} }, engine);
    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/Missing required measurements/);
    expect(result.comparison).toBeUndefined();
  });
});

describe('summarizeFidelity', () => {
  it('aggregates failure rate, mean IoU and the faithful share', () => {
    const engine = createDefaultEngine();
    const results = [
      evaluateFidelityCase({ id: 'a', expected: robe(), predicted: robe(), measurements }, engine),
      evaluateFidelityCase(
        { id: 'b', expected: robe(), predicted: robe({ lengths: { skirtPct: 60 } }), measurements },
        engine,
      ),
      evaluateFidelityCase({ id: 'c', expected: robe(), predicted: robe(), measurements: {} }, engine),
    ];
    const summary = summarizeFidelity(results);
    expect(summary.cases).toBe(3);
    expect(summary.engineFailureRate).toBeCloseTo(1 / 3);
    expect(summary.faithfulRate).toBe(0.5);
    expect(summary.meanIoU!).toBeGreaterThan(0.5);
    expect(summary.meanIoU!).toBeLessThan(1);
    expect(summarizeFidelity([])).toMatchObject({ cases: 0, meanIoU: null, faithfulRate: null, meanGenerationMs: 0 });
  });
});
