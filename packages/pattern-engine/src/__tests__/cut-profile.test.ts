import { describe, it, expect } from 'vitest';
import {
  resolveCutProfile,
  resolveNeckline,
  resolveSkirtLengthMm,
  resolveSleeve,
} from '../shared/cut-profile';
import { curveNeckline, SWEETHEART_POINTS } from '../shared/shapes';

describe('cut-profile', () => {
  it('falls back to the DROITE baseline for unknown or missing cuts', () => {
    expect(resolveCutProfile(undefined)).toEqual(resolveCutProfile('DROITE'));
    expect(resolveCutProfile('INCONNUE')).toEqual(resolveCutProfile('DROITE'));
    expect(resolveCutProfile('droite').hemFlareMm).toBe(0);
  });

  it('gives each wizard cut a distinct profile', () => {
    const cuts = ['DROITE', 'EVASEE', 'SIRENE', 'PRINCESSE', 'AJUSTEE', 'OVERSIZE'];
    const serialized = new Set(cuts.map((c) => JSON.stringify(resolveCutProfile(c))));
    expect(serialized.size).toBe(cuts.length);
    expect(resolveCutProfile('SIRENE').fishtail).toBe(true);
    expect(resolveCutProfile('OVERSIZE').bodiceDeltaMm).toBeGreaterThan(resolveCutProfile('AJUSTEE').bodiceDeltaMm);
  });

  it('maps the skirt length detail and ignores unknown values', () => {
    expect(resolveSkirtLengthMm('MINI')).toBeLessThan(resolveSkirtLengthMm('MIDI')!);
    expect(resolveSkirtLengthMm('MAXI')).toBeLessThan(resolveSkirtLengthMm('SOL')!);
    // Knee length sits between a mini and a midi.
    expect(resolveSkirtLengthMm('GENOU')).toBeGreaterThan(resolveSkirtLengthMm('MINI')!);
    expect(resolveSkirtLengthMm('GENOU')).toBeLessThan(resolveSkirtLengthMm('MIDI')!);
    // Scaled by the stature: shorter on a petite woman, longer on a tall one, within ±25 %.
    expect(resolveSkirtLengthMm('GENOU', 168)).toBe(resolveSkirtLengthMm('GENOU'));
    expect(resolveSkirtLengthMm('GENOU', 155)).toBeLessThan(resolveSkirtLengthMm('GENOU')!);
    expect(resolveSkirtLengthMm('GENOU', 182)).toBeGreaterThan(resolveSkirtLengthMm('GENOU')!);
    expect(resolveSkirtLengthMm('SOL', 400)).toBe(Math.round(resolveSkirtLengthMm('SOL')! * 1.25));
    expect(resolveSkirtLengthMm(undefined, 160)).toBeUndefined();
    expect(resolveSkirtLengthMm(undefined)).toBeUndefined();
    expect(resolveSkirtLengthMm('???')).toBeUndefined();
  });

  it('lets decollete win over col, with a neutral default', () => {
    expect(resolveNeckline({})).toEqual({ widthMm: 80, depthMm: 0 });
    expect(resolveNeckline({ col: 'EN_V' }).depthMm).toBeGreaterThan(100);
    // The décolleté sets the level; under a V collar line it is a V's depth (a « sage » V goes lower than a crew neck).
    expect(resolveNeckline({ col: 'EN_V', decollete: 'SAGE' })).toEqual({ widthMm: 75, depthMm: 100, shape: 'V' });
    expect(resolveNeckline({ col: 'ROND', decollete: 'SAGE' }).depthMm).toBe(75);
    expect(resolveNeckline({ col: 'BATEAU' }).widthMm).toBeGreaterThan(resolveNeckline({ col: 'ROND' }).widthMm);
    // A U: round, deeper than a crew or a moderate neck.
    const u = resolveNeckline({ decollete: 'EN_U' });
    expect(u.shape ?? 'ROUND').toBe('ROUND');
    expect(u.depthMm).toBeGreaterThan(resolveNeckline({ decollete: 'MOYEN' }).depthMm);
  });

  it('draws a sweetheart neckline as a lobe over the bust, then the strap edge up to the neck point', () => {
    expect(resolveNeckline({ decollete: 'COEUR' }).shape).toBe('SWEETHEART');
    const block = [{ x: 0, y: 140 }, { x: 110, y: 0 }, { x: 200, y: 20 }, { x: 0, y: 400 }, { x: 0, y: 140 }];
    const heart = curveNeckline(block, 'SWEETHEART');
    expect(heart).toHaveLength(block.length + SWEETHEART_POINTS);
    const edge = heart.slice(0, SWEETHEART_POINTS + 2);
    // Always rising from the notch to the neck point, and outwards.
    for (let i = 1; i < edge.length; i += 1) {
      expect(edge[i]!.y).toBeLessThanOrEqual(edge[i - 1]!.y);
      expect(edge[i]!.x).toBeGreaterThanOrEqual(edge[i - 1]!.x);
    }
    // Straight up out of the notch, level at the apex, steep again up the strap.
    expect(edge[1]!.x).toBeLessThan(edge[0]!.y - edge[1]!.y);
    const slopes = edge.slice(1).map((p, i) => (edge[i]!.y - p.y) / Math.max(1, p.x - edge[i]!.x));
    const apex = slopes.indexOf(Math.min(...slopes)) + 1;
    expect(apex).toBeGreaterThan(2);
    expect(apex).toBeLessThan(edge.length - 2);
    // The lobe stands above the V (centre → neck point), the strap side below it.
    const v = (x: number) => 140 - (140 * x) / 110;
    expect(edge.slice(1, apex).some((p) => p.y < v(p.x))).toBe(true);
    expect(edge.slice(apex, -1).every((p) => p.y > v(p.x))).toBe(true);
    expect(heart.slice(SWEETHEART_POINTS + 1)).toEqual(block.slice(1));
  });

  it('describes sleeves, none for sleeveless or unset', () => {
    expect(resolveSleeve(undefined)).toBeNull();
    expect(resolveSleeve('SANS_MANCHES')).toBeNull();
    expect(resolveSleeve('COURTES')!.lengthMm).toBeLessThan(resolveSleeve('LONGUES')!.lengthMm);
    expect(resolveSleeve('LONGUES', 610)!.lengthMm).toBe(610);
    expect(resolveSleeve('BALLON')!.topRatio).toBeGreaterThan(1);
    expect(resolveSleeve('PAPILLON')!.cuffRatio).toBeGreaterThan(1);
  });
});
