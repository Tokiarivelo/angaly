import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { accentMaterial, contrastMaterial, fabricMaterial, glow, plastronMaterial, PRINT_TILE_M } from '../ui/fabricTextures';

describe('fabric look on the 3D garment', () => {
  it('keeps the technical zone colours when the photo gave no fabric', () => {
    expect(fabricMaterial(null)).toBeNull();
    expect(fabricMaterial({ fabricColor: 'white' })).toBeNull();
  });

  it('cuts contrasting gores in the contrast fabric, printed at the same scale as the main one', () => {
    expect(contrastMaterial({ fabricColor: '#2a4566' })).toBeNull();
    expect(contrastMaterial({ contrastColor: '#163640' })).toEqual({ color: '#163640', map: null, finish: undefined });
    const dotted = contrastMaterial({ contrastColor: '#163640', contrastPrint: 'POIS', contrastMotifColor: '#07161b', fabricFinish: 'SATIN' })!;
    expect(dotted.finish).toBe('SATIN');
    // Same tiling as the main fabric's dots (UVs in metres), not the plastron's across-the-opening layout. Without a
    // 2D canvas (jsdom) neither draws a map, and the ground colour is used alone.
    const main = fabricMaterial({ fabricColor: '#163640', fabricPrint: 'POIS', motifColor: '#07161b' })!;
    if (dotted.map && main.map) {
      expect(dotted.map).toBeInstanceOf(THREE.Texture);
      expect(dotted.map.repeat.x).toBeCloseTo(main.map.repeat.x, 6);
    } else {
      expect(dotted.color).toBe('#163640');
      expect(main.map).toBeNull();
    }
  });

  it('dyes a plain fabric in its ground colour', () => {
    expect(fabricMaterial({ fabricPrint: 'UNI', fabricColor: '#123456' })).toEqual({ color: '#123456', map: null });
  });

  it('prints dots that repeat every 5 cm of fabric over a white material', () => {
    const cloth = fabricMaterial({ fabricPrint: 'POIS', fabricColor: '#f4f2ee', motifColor: '#5a1a22' });
    expect(cloth).not.toBeNull();
    // Without a 2D canvas (jsdom) the ground colour is used alone; with one, a repeating map.
    if (cloth!.map) {
      expect(cloth!.color).toBe('#ffffff');
      expect(cloth!.map.repeat.x).toBeCloseTo(1 / PRINT_TILE_M);
    } else {
      expect(cloth!.color).toBe('#f4f2ee');
    }
  });

  it('carries the surface (velvet) and dresses the accent parts only when an accent print is given', () => {
    expect(fabricMaterial({ fabricColor: '#141B38', fabricFinish: 'VELOURS' })?.finish).toBe('VELOURS');
    expect(accentMaterial({ fabricColor: '#141B38' })).toBeNull();
    expect(accentMaterial({ fabricColor: '#141B38', accentPrint: 'UNI' })).toBeNull();
    const accent = accentMaterial({ fabricColor: '#141B38', accentPrint: 'ARABESQUE', motifColor: '#D2AE5C' });
    // jsdom has no 2D canvas: no map can be drawn, so nothing to dress.
    if (accent) expect(accent.map).not.toBeNull();
  });

  it('dyes the plastron in the contrast colour (its fallback without one)', () => {
    expect(plastronMaterial({ contrastColor: '#EADCB8' }, '#ffffff')).toEqual({ color: '#EADCB8', map: null });
    expect(plastronMaterial(null, '#E9DFC6').color).toBe('#E9DFC6');
  });

  it('lights velvet in its own hue: lighter, same colour family', () => {
    const base = new THREE.Color('#0E1534');
    const lit = new THREE.Color(glow('#0E1534', 0.3));
    const a = { h: 0, s: 0, l: 0 };
    const b = { h: 0, s: 0, l: 0 };
    base.getHSL(a);
    lit.getHSL(b);
    expect(b.l).toBeGreaterThan(a.l + 0.2);
    expect(Math.abs(b.h - a.h)).toBeLessThan(0.02);
  });
});

describe('printTileM (repeat of a print from the motif size read on the photo)', () => {
  it('keeps the usual repeat without a size, and sizes it from the motif otherwise', async () => {
    const { printTileM, PRINT_TILE_M } = await import('../ui/fabricTextures');
    expect(printTileM('POIS')).toBe(PRINT_TILE_M);
    expect(printTileM('BROCART')).toBeCloseTo(0.09);
    // A 15 cm embroidered lily: one flower takes ~36 % of its repeat.
    expect(printTileM('FLEURI', 15)).toBeCloseTo(0.15 / 0.36);
    expect(printTileM('POIS', 1.5)).toBeCloseTo(0.05);
    // Bounded (0.5–60 cm), and nonsense ignored.
    expect(printTileM('FLEURI', 500)).toBeCloseTo(0.6 / 0.36);
    expect(printTileM('FLEURI', -2)).toBe(PRINT_TILE_M);
  });
});
