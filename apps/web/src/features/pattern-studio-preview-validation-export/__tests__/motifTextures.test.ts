import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  EMBROIDERY_SIZE,
  EMBROIDERY_TILE_M,
  embroideryMap,
  embroideryMaterialParameters,
  embroideryPixels,
  EMBROIDERY_COLOR,
  SMOCK_SIZE,
  SMOCK_TILE_M,
  smockHeight,
  smockingMaps,
  smockingPixels,
  threadColor,
} from '../ui/motifTextures';

const alphaShare = (rgba: Uint8Array): number => {
  let on = 0;
  for (let k = 3; k < rgba.length; k += 4) if (rgba[k]! > 127) on += 1;
  return on / (rgba.length / 4);
};

describe('embroidery motif', () => {
  it('is a see-through tile: thread on part of it, transparent ground elsewhere', () => {
    const px = embroideryPixels();
    expect(px.length).toBe(EMBROIDERY_SIZE * EMBROIDERY_SIZE * 4);
    const share = alphaShare(px);
    expect(share).toBeGreaterThan(0.08);
    expect(share).toBeLessThan(0.5);
    // Thread pixels are shaded (satin), never black: the material colour dyes them.
    let min = 255;
    for (let k = 0; k < px.length; k += 4) if (px[k + 3]! > 200) min = Math.min(min, px[k]!);
    expect(min).toBeGreaterThan(180);
  });

  it('is deterministic and tiles seamlessly (the scroll crosses the left and right edges at the same height)', () => {
    const px = embroideryPixels();
    expect(Buffer.from(embroideryPixels()).equals(Buffer.from(px))).toBe(true);
    const n = EMBROIDERY_SIZE;
    const column = (x: number) => Array.from({ length: n }, (_, y) => px[(y * n + x) * 4 + 3]!);
    const left = column(0);
    const right = column(n - 1);
    let diff = 0;
    for (let y = 0; y < n; y += 1) diff += Math.abs(left[y]! - right[y]!);
    expect(diff / n).toBeLessThan(40);
  });

  it('repeats every 8 cm of cloth (UVs in metres)', () => {
    const map = embroideryMap();
    expect(map).toBeInstanceOf(THREE.DataTexture);
    expect(map.repeat.x).toBeCloseTo(1 / EMBROIDERY_TILE_M);
    expect(map.wrapS).toBe(THREE.RepeatWrapping);
    map.dispose();
  });
});

describe('smocking relief', () => {
  it('puffs in the diamonds and is drawn in at the stitches', () => {
    expect(smockHeight(0, 0)).toBeLessThan(0.15);
    expect(smockHeight(0.5, 0.5)).toBeLessThan(0.15);
    expect(smockHeight(0.5, 0)).toBeGreaterThan(0.8);
    expect(smockHeight(0, 0.5)).toBeGreaterThan(0.8);
    // Periodic: one diamond lattice per tile.
    expect(smockHeight(0.3, 0.2)).toBeCloseTo(smockHeight(1.3, 2.2), 6);
  });

  it('gives a normal map (unit normals facing out) and an occlusion map darker at the stitches', () => {
    const { normal, ao } = smockingPixels();
    expect(normal.length).toBe(SMOCK_SIZE * SMOCK_SIZE * 4);
    let tilted = 0;
    let worstLength = 0;
    let minZ = 1;
    for (let k = 0; k < normal.length; k += 4) {
      const [x, y, z] = [normal[k]! / 127.5 - 1, normal[k + 1]! / 127.5 - 1, normal[k + 2]! / 127.5 - 1];
      worstLength = Math.max(worstLength, Math.abs(Math.hypot(x, y, z) - 1));
      minZ = Math.min(minZ, z);
      if (z < 0.95) tilted += 1;
    }
    expect(worstLength).toBeLessThan(0.05);
    expect(minZ).toBeGreaterThan(0);
    // Real relief: a good part of the surface is tilted.
    expect(tilted / (normal.length / 4)).toBeGreaterThan(0.2);
    const stitch = ao[0]!;
    const puff = ao[(0 * SMOCK_SIZE + SMOCK_SIZE / 2) * 4]!;
    expect(puff).toBeGreaterThan(stitch + 80);
    expect(Buffer.from(smockingPixels().normal).equals(Buffer.from(normal))).toBe(true);
  });

  it('repeats every 12 mm, in linear colour space', () => {
    const { normalMap, aoMap } = smockingMaps();
    expect(normalMap.repeat.x).toBeCloseTo(1 / SMOCK_TILE_M);
    expect(normalMap.colorSpace).toBe(THREE.NoColorSpace);
    expect(aoMap.repeat.y).toBeCloseTo(1 / SMOCK_TILE_M);
    normalMap.dispose();
    aoMap.dispose();
  });
});

describe('embroidery thread and material (shared by the preview and the realistic render)', () => {
  it('takes the pattern’s thread colour, else the contrast colour, else champagne gold', () => {
    expect(threadColor('#c0392b', '#eadcb8')).toBe('#c0392b');
    expect(threadColor(undefined, '#eadcb8')).toBe('#eadcb8');
    expect(threadColor(undefined, 'beige')).toBe(EMBROIDERY_COLOR);
    expect(threadColor(undefined, null)).toBe(EMBROIDERY_COLOR);
  });

  it('is blended over the cloth (never cut out), dyed and lit in the thread colour', () => {
    const map = embroideryMap();
    const material = new THREE.MeshPhysicalMaterial(embroideryMaterialParameters('#c0392b', map));
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.alphaTest).toBeLessThan(0.1);
    expect(material.map).toBe(map);
    expect(material.color.getHexString()).toBe('c0392b');
    expect(material.sheenColor.getHexString()).toBe('c0392b');
    material.dispose();
    map.dispose();
  });
});
