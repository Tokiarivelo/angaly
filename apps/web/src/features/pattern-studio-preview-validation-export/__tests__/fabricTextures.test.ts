import { describe, expect, it } from 'vitest';
import { fabricMaterial, PRINT_TILE_M } from '../ui/fabricTextures';

describe('fabric look on the 3D garment', () => {
  it('keeps the technical zone colours when the photo gave no fabric', () => {
    expect(fabricMaterial(null)).toBeNull();
    expect(fabricMaterial({ fabricColor: 'white' })).toBeNull();
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
});
