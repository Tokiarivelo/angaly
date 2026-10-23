import { describe, it, expect } from 'vitest';
import { PatternEngine } from '../pattern-engine';
import { RobeRule } from '../rules/robe.rule';
import { CUT_MIN_HEM_RATIO, fitSkirtBlockToCut } from '../blocks';
import type { DrapeBlock, PatternParameters } from '../types';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const WAIST = 780; // finished waist circumference (mm) used by the robe rule for this body
const engine = () => {
  const e = new PatternEngine();
  e.registerRule(RobeRule);
  return e;
};
const skirtWidth = (cutType: string, blocks: DrapeBlock[]): number => {
  const pieces = engine().generate(
    { garmentType: 'ROBE', cutType, style: null, details: {}, drape: { blocks } } as PatternParameters,
    M,
  ).pieces;
  const skirt = pieces.find((p) => p.name.startsWith('Jupe'))!;
  const xs = skirt.outlineMm.map((q) => q.x);
  return (Math.max(...xs) - Math.min(...xs)) * skirt.quantity;
};

describe('skirt block vs cut flare (hem width floor)', () => {
  it('widens a gathered block that is too narrow for an A-line (EVASEE) cut', () => {
    const block = fitSkirtBlockToCut({ kind: 'GATHERED_SKIRT', fullness: 1.5 }, WAIST, 'EVASEE');
    expect(block).toEqual({ kind: 'GATHERED_SKIRT', fullness: CUT_MIN_HEM_RATIO['EVASEE'] });
  });

  it('never narrows a block that is already wide enough, nor touches a circle skirt', () => {
    const wide: DrapeBlock = { kind: 'GATHERED_SKIRT', fullness: 3 };
    expect(fitSkirtBlockToCut(wide as never, WAIST, 'EVASEE')).toBe(wide);
    const circle: DrapeBlock = { kind: 'CIRCLE_SKIRT', fraction: 0.5 };
    expect(fitSkirtBlockToCut(circle as never, WAIST, 'PRINCESSE')).toBe(circle);
  });

  it('leaves straight and unknown cuts alone', () => {
    const block: DrapeBlock = { kind: 'GATHERED_SKIRT', fullness: 1.25 };
    expect(fitSkirtBlockToCut(block as never, WAIST, 'DROITE')).toBe(block);
    expect(fitSkirtBlockToCut(block as never, WAIST, null)).toBe(block);
  });

  it('deepens, then multiplies, pleats until the hem reaches the ratio (within block bounds)', () => {
    const fitted = fitSkirtBlockToCut({ kind: 'PLEATED_SKIRT', pleats: 12, depthMm: 40, type: 'KNIFE' }, WAIST, 'PRINCESSE');
    if (fitted.kind !== 'PLEATED_SKIRT') throw new Error('kind changed');
    expect(fitted.depthMm).toBeLessThanOrEqual(80);
    expect(fitted.pleats).toBeLessThanOrEqual(60);
    expect(fitted.pleats * fitted.depthMm).toBeGreaterThanOrEqual((CUT_MIN_HEM_RATIO['PRINCESSE']! - 1) * WAIST);
  });

  it('a box pleat takes twice the fabric, so it needs fewer or shallower pleats', () => {
    const knife = fitSkirtBlockToCut({ kind: 'PLEATED_SKIRT', pleats: 10, depthMm: 20, type: 'KNIFE' }, WAIST, 'EVASEE');
    const box = fitSkirtBlockToCut({ kind: 'PLEATED_SKIRT', pleats: 10, depthMm: 20, type: 'BOX' }, WAIST, 'EVASEE');
    if (knife.kind !== 'PLEATED_SKIRT' || box.kind !== 'PLEATED_SKIRT') throw new Error('kind changed');
    expect(box.depthMm).toBeLessThan(knife.depthMm);
  });

  it('a ROBE à jupe froncée évasée is cut wider than the same block on a straight cut', () => {
    const block: DrapeBlock = { kind: 'GATHERED_SKIRT', fullness: 1.5 };
    expect(skirtWidth('EVASEE', [block])).toBeGreaterThan(skirtWidth('DROITE', [block]) * 1.15);
  });
});

describe('gathered skirt on a flared cut is a trapezoid', () => {
  const outline = (cutType: string) => {
    const pieces = engine().generate(
      { garmentType: 'ROBE', cutType, style: null, details: {}, drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.2 }] } } as PatternParameters,
      M,
    ).pieces;
    return pieces.find((p) => p.name.startsWith('Jupe'))!.outlineMm;
  };

  it('is narrower at the seam than at the hem for EVASEE and PRINCESSE', () => {
    for (const cut of ['EVASEE', 'PRINCESSE']) {
      const o = outline(cut);
      const top = Math.max(...o.filter((p) => p.y === 0).map((p) => p.x));
      const hem = Math.max(...o.filter((p) => p.y > 0).map((p) => p.x));
      expect(hem).toBeGreaterThan(top * 1.2);
    }
  });

  it('stays a rectangle on a straight cut', () => {
    const o = outline('DROITE');
    const top = Math.max(...o.filter((p) => p.y === 0).map((p) => p.x));
    const hem = Math.max(...o.filter((p) => p.y > 0).map((p) => p.x));
    expect(hem).toBe(top);
  });
});
