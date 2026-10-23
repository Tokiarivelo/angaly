import { describe, expect, it } from 'vitest';
import { PATTERN_DETAIL_OPTIONS, type PatternDetailGroup } from '@angaly/types';
import { CUTS } from '../consts/cuts.const';
import { GARMENT_TYPES } from '../consts/garment-types.const';
import { cutsFor, detailGroupsFor, detailsFor, sketchGarmentFor } from '../consts/garment-details.const';
import { cutSketch, garmentTypeSketch } from '../utils/garment-type-sketch';
import { sketchForOption } from '../utils/option-sketch';
import type { Sketch } from '../utils/sketch-geometry';

const numbers = (d: string): number[] => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const absolute = (d: string): number[] => numbers(d.split(/ a/)[0]!);
const inBox = (sketch: Sketch, what: string): void => {
  expect(sketch.parts.some((p) => p.role === 'garment'), what).toBe(true);
  for (const part of sketch.parts) {
    for (const n of absolute(part.d)) {
      expect(Number.isFinite(n), what).toBe(true);
      expect(n, what).toBeGreaterThanOrEqual(-2);
      expect(n, what).toBeLessThanOrEqual(150);
    }
  }
};
const lowest = (sketch: Sketch): number =>
  Math.max(...sketch.parts.filter((p) => p.role === 'garment').flatMap((p) => numbers(p.d).filter((_, i) => i % 2 === 1)));
const widest = (sketch: Sketch): number =>
  Math.max(...sketch.parts.filter((p) => p.role === 'garment').flatMap((p) => absolute(p.d).filter((_, i) => i % 2 === 0).map((x) => Math.abs(x - 50))));

describe('details offered per garment', () => {
  it('offers trousers their length and construction (rise, band, closure, pleats, pockets, hem), worded for trousers', () => {
    const groups = detailGroupsFor('PANTALON');
    expect(groups.map((g) => g.id)).toEqual(['longueur', 'taille', 'ceinture', 'fermeture', 'plis', 'poches', 'poches_dos', 'bas']);
    expect(groups[0]!.label).toBe('Longueur de jambe');
    expect(groups[0]!.options.map((o) => o.label)).toEqual(['Short', 'Bermuda', 'Pantacourt', 'Longueur cheville', 'Longueur sol (talons)']);
    // Trouser closures only, the rise without the dress's pointed waist.
    const closures = groups.find((g) => g.id === 'fermeture')!.options.map((o) => o.id);
    expect(closures).toEqual(['BRAGUETTE_ZIP', 'BRAGUETTE_BOUTONS', 'ZIP_COTE', 'ELASTIQUE']);
    expect(groups.find((g) => g.id === 'taille')!.options.map((o) => o.label)).toEqual(['Taille normale', 'Taille basse', 'Taille haute']);
  });

  it('offers a skirt its length, rise, band, skirt closures, darts, pockets and vent', () => {
    const groups = detailGroupsFor('JUPE');
    expect(groups.map((g) => g.id)).toEqual(['longueur', 'taille', 'ceinture', 'fermeture', 'plis', 'poches', 'fente']);
    expect(groups.find((g) => g.id === 'fermeture')!.options.map((o) => o.id)).toEqual(['ZIP_INVISIBLE', 'BOUTONS', 'ZIP_COTE', 'ELASTIQUE']);
    expect(groups.find((g) => g.id === 'plis')!.options.map((o) => o.id)).toEqual(['AUCUN', 'PINCES']);
  });

  it('offers a top its sleeves, collar, neckline and length, never a dress’s skirt or back', () => {
    for (const type of ['VESTE', 'CHEMISE', 'COSTUME']) {
      const ids = detailGroupsFor(type).map((g) => g.id);
      expect(ids.slice(0, 4), type).toEqual(['manches', 'col', 'decollete', 'longueur']);
      expect(detailGroupsFor(type).find((g) => g.id === 'decollete')!.options.map((o) => o.id), type).not.toContain('HORS_EPAULES');
    }
    // The suit's trousers: pleats, pockets, turn-up.
    expect(detailGroupsFor('COSTUME').map((g) => g.id).slice(4)).toEqual(['plis', 'poches', 'poches_dos', 'bas']);
  });

  it('keeps the dress groups for a dress (no fly), every group for a free brief', () => {
    expect(detailGroupsFor('ROBE').map((g) => g.id)).toEqual(['manches', 'col', 'decollete', 'dos', 'longueur', 'fermeture', 'corsage', 'taille', 'devant', 'jupe', 'basque']);
    expect(detailGroupsFor('ROBE').find((g) => g.id === 'fermeture')!.options.map((o) => o.id)).not.toContain('BRAGUETTE_ZIP');
    expect(detailGroupsFor('AUTRE').map((g) => g.id)).toEqual(Object.keys(PATTERN_DETAIL_OPTIONS));
  });

  it('describes every option offered, for every garment', () => {
    for (const { id } of GARMENT_TYPES) {
      for (const group of detailGroupsFor(id)) {
        for (const option of group.options) {
          expect(option.description.length, `${id}.${group.id}.${option.id}`).toBeGreaterThan(10);
          expect((PATTERN_DETAIL_OPTIONS[group.id] as readonly string[]).includes(option.id)).toBe(true);
        }
      }
    }
  });

  it('drops the details a garment does not take (a dress collar left on trousers)', () => {
    expect(detailsFor('PANTALON', { col: 'CHALE', longueur: 'MIDI' })).toEqual({ longueur: 'MIDI' });
    expect(detailsFor('PANTALON', { longueur: 'ASYMETRIQUE' })).toEqual({});
    expect(detailsFor('ROBE', { col: 'CHALE', dos: 'DOS_NU' })).toEqual({ col: 'CHALE', dos: 'DOS_NU' });
  });

  it('words the cuts for the garment, and leaves out those that do not apply', () => {
    expect(cutsFor('ROBE')).toEqual(CUTS);
    expect(cutsFor('PANTALON').map((c) => c.label)).toEqual(['Droit', 'Évasé / Bootcut', 'Pattes d’éléphant', 'Large / Palazzo', 'Slim / Cigarette', 'Oversize / Baggy']);
    expect(cutsFor('VESTE').map((c) => c.id)).not.toContain('SIRENE');
    // Every id stays one the engine knows.
    for (const { id } of GARMENT_TYPES) for (const cut of cutsFor(id)) expect(CUTS.map((c) => c.id)).toContain(cut.id);
  });
});

describe('garment sketches', () => {
  it('draws every garment type, every cut on it and every detail option on it, inside the box', () => {
    for (const { id } of GARMENT_TYPES) {
      inBox(garmentTypeSketch(id), id);
      for (const cut of cutsFor(id)) inBox(cutSketch(id, cut.id), `${id} ${cut.id}`);
      for (const group of detailGroupsFor(id)) {
        for (const option of group.options) inBox(sketchForOption(group.id as PatternDetailGroup, option.id, sketchGarmentFor(id), 'EVASEE'), `${id}.${group.id}.${option.id}`);
      }
    }
  });

  it('gives each garment type and each cut of a garment its own drawing', () => {
    const types = GARMENT_TYPES.map(({ id }) => JSON.stringify(garmentTypeSketch(id)));
    expect(new Set(types).size).toBe(types.length);
    for (const { id } of GARMENT_TYPES) {
      const cuts = cutsFor(id).map((c) => JSON.stringify(cutSketch(id, c.id)));
      expect(new Set(cuts).size, id).toBe(cuts.length);
    }
  });

  it('draws longer trouser legs lower, and a bell-bottom wider at the hem than a slim leg', () => {
    const leg = (id: string): Sketch => sketchForOption('longueur', id, 'trousers');
    expect(lowest(leg('MINI'))).toBeLessThan(lowest(leg('GENOU')));
    expect(lowest(leg('GENOU'))).toBeLessThan(lowest(leg('MIDI')));
    expect(lowest(leg('MIDI'))).toBeLessThan(lowest(leg('MAXI')));
    expect(lowest(leg('MAXI'))).toBeLessThan(lowest(leg('SOL')));
    expect(leg('MAXI').parts.some((p) => p.role === 'detail')).toBe(true);
    const hemHalf = (cut: string): number => {
      const sketch = cutSketch('PANTALON', cut);
      const outline = absolute(sketch.parts[0]!.d);
      const hemY = Math.max(...outline.filter((_, i) => i % 2 === 1));
      const xs = outline.filter((_, i) => i % 2 === 0 && outline[i + 1] === hemY);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(hemHalf('SIRENE')).toBeGreaterThan(hemHalf('AJUSTEE'));
  });

  it('draws a top shorter than a dress, and a longer top lower', () => {
    expect(lowest(sketchForOption('manches', 'LONGUES', 'top'))).toBeLessThan(lowest(sketchForOption('manches', 'LONGUES', 'dress')));
    expect(lowest(sketchForOption('longueur', 'MINI', 'top'))).toBeLessThan(lowest(sketchForOption('longueur', 'MAXI', 'top')));
  });

  it('draws a skirt in the cut chosen: a corolla wider than a pencil skirt', () => {
    expect(widest(sketchForOption('longueur', 'MIDI', 'skirt', 'PRINCESSE'))).toBeGreaterThan(widest(sketchForOption('longueur', 'MIDI', 'skirt', 'DROITE')));
  });
});
