import { describe, expect, it } from 'vitest';
import { loopSubdivide } from '../utils/garment3d/subdivide';

/** Octahedron (closed, every vertex of valence 4) of radius 1. */
const octahedron = () => ({
  positions: Float32Array.from([1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1]),
  indices: Uint32Array.from([0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5]),
});

describe('Loop subdivision', () => {
  it('splits every triangle in four and adds one vertex per edge', () => {
    const out = loopSubdivide(octahedron());
    expect(out.indices.length).toBe(8 * 3 * 4);
    expect(out.positions.length / 3).toBe(6 + 12);
    expect(Math.max(...out.indices)).toBeLessThan(out.positions.length / 3);
  });

  it('rounds the shape: the corners move in, the result stays inside the hull', () => {
    const out = loopSubdivide(octahedron());
    // Valence 4: β = 3/32, the corner (1,0,0) moves to (1 − 4β)·1 = 0.625.
    expect(out.positions[0]).toBeCloseTo(0.625, 5);
    for (let i = 0; i < out.positions.length; i += 3) {
      const l1 = Math.abs(out.positions[i]!) + Math.abs(out.positions[i + 1]!) + Math.abs(out.positions[i + 2]!);
      expect(l1).toBeLessThanOrEqual(1 + 1e-6);
    }
  });

  it('keeps an open boundary on its curve', () => {
    // A single triangle: all three edges are boundary edges.
    const out = loopSubdivide({ positions: Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0]), indices: Uint32Array.from([0, 1, 2]) });
    expect(out.indices.length).toBe(12);
    for (let i = 0; i < out.positions.length; i += 3) expect(out.positions[i + 2]).toBe(0);
  });
});
