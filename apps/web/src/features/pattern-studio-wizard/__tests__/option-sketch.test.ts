import { describe, expect, it } from 'vitest';
import { PATTERN_DETAIL_OPTIONS, type PatternDetailGroup } from '@angaly/types';
import { detailGroupsFor, sketchGarmentFor } from '../consts/garment-details.const';
import { sketchForOption } from '../utils/option-sketch';

const GROUPS = Object.keys(PATTERN_DETAIL_OPTIONS) as PatternDetailGroup[];
const numbers = (d: string): number[] => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
/** Absolute coordinates only (the dots are drawn with relative arcs). */
const absolute = (d: string): number[] => numbers(d.split(/ a/)[0]!);

describe('sketchForOption', () => {
  it('draws every option of every group, inside the 100 × 150 box', () => {
    for (const group of GROUPS) {
      for (const id of PATTERN_DETAIL_OPTIONS[group]) {
        const sketch = sketchForOption(group, id);
        expect(sketch.parts.length, `${group}.${id}`).toBeGreaterThan(0);
        expect(sketch.parts.some((p) => p.role === 'garment'), `${group}.${id}`).toBe(true);
        for (const part of sketch.parts) {
          for (const n of absolute(part.d)) {
            expect(Number.isFinite(n)).toBe(true);
            expect(n, `${group}.${id}`).toBeGreaterThanOrEqual(-2);
            expect(n, `${group}.${id}`).toBeLessThanOrEqual(150);
          }
        }
      }
    }
  });

  it('gives two options of a group two different drawings, on every garment that offers the group', () => {
    for (const type of ['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME']) {
      const garment = sketchGarmentFor(type);
      for (const group of detailGroupsFor(type)) {
        const drawings = group.options.map((o) => JSON.stringify(sketchForOption(group.id, o.id, garment)));
        expect(new Set(drawings).size, `${type}.${group.id}`).toBe(drawings.length);
      }
    }
  });

  it('draws the bottoms options on trousers and skirts (back view for the back pockets and the vent)', () => {
    expect(sketchForOption('poches_dos', 'PASSEPOIL', 'trousers').view).toBe('back');
    expect(sketchForOption('fente', 'DOS', 'skirt').view).toBe('back');
    expect(sketchForOption('fermeture', 'BRAGUETTE_ZIP', 'trousers').view).toBe('front');
    const highlighted = (g: PatternDetailGroup, id: string, garment: 'trousers' | 'skirt'): boolean =>
      sketchForOption(g, id, garment).parts.some((p) => p.role === 'detail' || p.role === 'detailFill');
    expect(highlighted('plis', 'DEUX_PLIS', 'trousers')).toBe(true);
    expect(highlighted('bas', 'REVERS', 'trousers')).toBe(true);
    expect(highlighted('ceinture', 'COULISSE', 'skirt')).toBe(true);
  });

  it('highlights the option itself, except for the plain choices', () => {
    const highlighted = (g: PatternDetailGroup, id: string): boolean =>
      sketchForOption(g, id).parts.some((p) => p.role === 'detail' || p.role === 'detailFill');
    expect(highlighted('manches', 'BALLON')).toBe(true);
    expect(highlighted('col', 'OFFICIER')).toBe(true);
    expect(highlighted('decollete', 'EN_U')).toBe(true);
    expect(highlighted('fermeture', 'BOUTONS_TAILLE')).toBe(true);
    expect(highlighted('manches', 'SANS_MANCHES')).toBe(false);
    expect(highlighted('fermeture', 'AUCUNE')).toBe(false);
  });

  it('shows the back for the back options and the back zip', () => {
    expect(sketchForOption('dos', 'DOS_NU').view).toBe('back');
    expect(sketchForOption('fermeture', 'ZIP_INVISIBLE').view).toBe('back');
    expect(sketchForOption('fermeture', 'ZIP_DEVANT').view).toBe('front');
  });

  it('draws longer dresses lower', () => {
    const lowest = (id: string): number =>
      Math.max(...sketchForOption('longueur', id).parts.filter((p) => p.role === 'garment').flatMap((p) => numbers(p.d).filter((_, i) => i % 2 === 1)));
    expect(lowest('MINI')).toBeLessThan(lowest('GENOU'));
    expect(lowest('GENOU')).toBeLessThan(lowest('MIDI'));
    expect(lowest('MAXI')).toBeLessThan(lowest('SOL'));
  });

  it('buttons up to the waist only for BOUTONS_TAILLE', () => {
    const buttons = (id: string): number => sketchForOption('fermeture', id).parts.filter((p) => p.d.includes('a0.9')).length;
    expect(buttons('BOUTONS_TAILLE')).toBeGreaterThan(0);
    expect(buttons('BOUTONS_TAILLE')).toBeLessThan(buttons('BOUTONS'));
  });

  it('draws every option with the details already chosen (a short stays a short on the pocket options)', () => {
    const lowest = (sk: ReturnType<typeof sketchForOption>): number =>
      Math.max(...sk.parts.filter((p) => p.role === 'garment').flatMap((p) => (p.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 1)));
    const short = sketchForOption('poches', 'PLAQUEES', 'trousers', 'DROITE', { longueur: 'MINI' });
    const long = sketchForOption('poches', 'PLAQUEES', 'trousers', 'DROITE', { longueur: 'SOL' });
    expect(lowest(short)).toBeLessThan(lowest(long));
    // The option's own group is never taken from the context, the others are drawn.
    expect(JSON.stringify(sketchForOption('longueur', 'MINI', 'trousers', 'DROITE', { longueur: 'SOL' }))).toBe(
      JSON.stringify(sketchForOption('longueur', 'MINI', 'trousers', 'DROITE')),
    );
    const withPleats = sketchForOption('poches', 'AUCUNE', 'trousers', 'DROITE', { plis: 'DEUX_PLIS' });
    expect(withPleats.parts.length).toBeGreaterThan(sketchForOption('poches', 'AUCUNE', 'trousers', 'DROITE').parts.length);
    // A dress: the sleeves chosen show on the collar options; a skirt: its length on the vent options.
    expect(JSON.stringify(sketchForOption('col', 'OFFICIER', 'dress', '', { manches: 'BALLON' }))).not.toBe(JSON.stringify(sketchForOption('col', 'OFFICIER')));
    expect(lowest(sketchForOption('fente', 'COTE', 'skirt', 'DROITE', { longueur: 'SOL' }))).toBeGreaterThan(lowest(sketchForOption('fente', 'COTE', 'skirt', 'DROITE')));
    // A suit's trouser length does not lengthen its jacket.
    expect(JSON.stringify(sketchForOption('col', 'CHALE', 'suit', 'DROITE', { longueur: 'SOL' }))).toBe(JSON.stringify(sketchForOption('col', 'CHALE', 'suit', 'DROITE')));
  });
});
