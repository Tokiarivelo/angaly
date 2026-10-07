import { describe, it, expect } from 'vitest';
import {
  resolveCutProfile,
  resolveNeckline,
  resolveSkirtLengthMm,
  resolveSleeve,
} from '../shared/cut-profile';

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
    expect(resolveSkirtLengthMm(undefined)).toBeUndefined();
    expect(resolveSkirtLengthMm('???')).toBeUndefined();
  });

  it('lets decollete win over col, with a neutral default', () => {
    expect(resolveNeckline({})).toEqual({ widthMm: 80, depthMm: 0 });
    expect(resolveNeckline({ col: 'EN_V' }).depthMm).toBeGreaterThan(100);
    expect(resolveNeckline({ col: 'EN_V', decollete: 'SAGE' }).depthMm).toBe(0);
    expect(resolveNeckline({ col: 'BATEAU' }).widthMm).toBeGreaterThan(resolveNeckline({ col: 'ROND' }).widthMm);
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
