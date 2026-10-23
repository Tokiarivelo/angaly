import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const make = (details: Record<string, string>) =>
  RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'AJUSTEE', style: null, details: { longueur: 'SOL', taille: 'BASSE', ...details } }, M);
const named = (pieces: ReturnType<typeof make>, start: string) => pieces.find((p) => p.name.startsWith(start));

describe('RobeRule — corsage ouvert sur un gilet (devant GILET)', () => {
  const pieces = make({ devant: 'GILET', fermeture: 'BOUTONS', col: 'OFFICIER' });

  it('opens the bodice fronts over a plastron down to the basque, and leaves the skirt front whole', () => {
    const bodice = named(pieces, 'Corsage Devant')!;
    expect(bodice.name).toBe('Corsage Devant (ouvert sur gilet)');
    expect(bodice.quantity).toBe(2);
    expect(Math.min(...bodice.outlineMm.map((p) => p.x))).toBeGreaterThanOrEqual(30);
    expect(hasSelfIntersection(bodice.outlineMm)).toBe(false);
    const skirt = named(pieces, 'Jupe Devant')!;
    expect(skirt.name).toBe('Jupe Devant');
    expect(skirt.quantity).toBe(1);
    expect(Math.min(...skirt.outlineMm.map((p) => p.x))).toBe(0);
    expect(pieces.some((p) => p.name === 'Parementure Jupe Devant')).toBe(false);
  });

  it('cuts the gilet as long as the bodice (basque included), with the revers and the facings', () => {
    const bodice = named(pieces, 'Corsage Devant')!;
    const gilet = pieces.find((p) => p.name === 'Plastron (gilet)')!;
    const height = (o: Array<{ y: number }>) => Math.max(...o.map((p) => p.y)) - Math.min(...o.map((p) => p.y));
    const neck = bodice.outlineMm[0]!.y;
    expect(height(gilet.outlineMm)).toBeCloseTo(Math.max(...bodice.outlineMm.map((p) => p.y)) - neck, -1);
    expect(pieces.some((p) => p.name === 'Revers')).toBe(true);
    expect(pieces.some((p) => p.name === 'Parementure Devant')).toBe(true);
    expect(pieces.some((p) => p.name.startsWith('Plastron (sous-robe)'))).toBe(false);
  });

  it('places the buttons down the centre front, 35 mm apart, to the bodice’s lower edge', () => {
    const bodice = named(pieces, 'Corsage Devant')!;
    const row = bodice.internalLinesMm?.find((l) => l.buttons);
    expect(row?.buttons?.diameterMm).toBe(12);
    const ys = row!.points.map((p) => p.y);
    expect(row!.points.every((p) => p.x === 0)).toBe(true);
    for (let i = 1; i < ys.length; i += 1) expect(ys[i]! - ys[i - 1]!).toBeCloseTo(35, -1);
    expect(Math.max(...ys)).toBeGreaterThan(Math.max(...bodice.outlineMm.map((p) => p.y)) - 40);
  });

  it('stops the buttons at the waist with BOUTONS_TAILLE, and places none without a buttoned closure', () => {
    const toWaist = named(make({ devant: 'FERME', fermeture: 'BOUTONS_TAILLE', taille: 'NATURELLE' }), 'Corsage Devant')!;
    const ys = toWaist.internalLinesMm!.find((l) => l.buttons)!.points.map((p) => p.y);
    expect(Math.max(...ys)).toBeLessThan(Math.max(...toWaist.outlineMm.map((p) => p.y)));
    const zip = named(make({ devant: 'FERME', fermeture: 'ZIP_INVISIBLE' }), 'Corsage Devant')!;
    expect(zip.internalLinesMm?.some((l) => l.buttons) ?? false).toBe(false);
  });
});
