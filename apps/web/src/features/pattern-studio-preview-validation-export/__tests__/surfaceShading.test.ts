import { describe, expect, it } from 'vitest';
import { cavityOcclusion, vertexNormals } from '../utils/garment3d/surface-shading';

/** A 21 × 21 grid (1 cm cells) in the xy plane, facing +z, with an optional groove along x = 0. */
const grid = (groove: number) => {
  const n = 21;
  const positions: number[] = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const x = (i - 10) * 0.01;
      positions.push(x, (j - 10) * 0.01, -groove * Math.exp(-((x / 0.012) ** 2)));
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < n - 1; j += 1) {
    for (let i = 0; i < n - 1; i += 1) {
      const a = j * n + i;
      indices.push(a, a + 1, a + n, a + 1, a + n + 1, a + n);
    }
  }
  return { positions: Float32Array.from(positions), indices: Uint32Array.from(indices) };
};

describe('surface shading', () => {
  it('computes unit normals facing the triangles', () => {
    const { positions, indices } = grid(0);
    const n = vertexNormals(positions, indices);
    const centre = (10 * 21 + 10) * 3;
    expect(n[centre + 2]).toBeCloseTo(1, 5);
  });

  it('leaves a flat surface lit and darkens the inside of a groove', () => {
    const flat = grid(0);
    const lightFlat = cavityOcclusion(flat.positions, flat.indices);
    const centre = 10 * 21 + 10;
    expect(lightFlat[centre]).toBeCloseTo(1, 5);

    const grooved = grid(0.006);
    const light = cavityOcclusion(grooved.positions, grooved.indices);
    // In the groove (x = 0) darker than on its sides (x = ±6 cm), never below 1 − Σ strength.
    expect(light[centre]!).toBeLessThan(0.85);
    expect(light[centre + 6]!).toBeGreaterThan(light[centre]!);
    expect(Math.min(...light)).toBeGreaterThanOrEqual(1 - 0.18 - 0.14 - 1e-6);
  });
});
