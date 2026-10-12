type Vec = [number, number, number];

/** Triangles of several meshes in a uniform 3 cm grid, for ray hits (Möller–Trumbore). */
export const rayCaster = (meshes: Array<{ positions: ArrayLike<number>; indices: ArrayLike<number> }>) => {
  const tris: number[][] = [];
  for (const m of meshes) {
    for (let t = 0; t < m.indices.length; t += 3) {
      const tri: number[] = [];
      for (let e = 0; e < 3; e += 1) {
        const v = m.indices[t + e]! * 3;
        tri.push(m.positions[v]!, m.positions[v + 1]!, m.positions[v + 2]!);
      }
      tris.push(tri);
    }
  }
  const CELL = 0.03;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number): string => `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
  tris.forEach((t, i) => {
    const lo = [0, 1, 2].map((a) => Math.min(t[a]!, t[a + 3]!, t[a + 6]!));
    const hi = [0, 1, 2].map((a) => Math.max(t[a]!, t[a + 3]!, t[a + 6]!));
    for (let x = Math.floor(lo[0]! / CELL); x <= Math.floor(hi[0]! / CELL); x += 1) {
      for (let y = Math.floor(lo[1]! / CELL); y <= Math.floor(hi[1]! / CELL); y += 1) {
        for (let z = Math.floor(lo[2]! / CELL); z <= Math.floor(hi[2]! / CELL); z += 1) {
          const k = `${x},${y},${z}`;
          const list = grid.get(k);
          if (list) list.push(i);
          else grid.set(k, [i]);
        }
      }
    }
  });
  /** True when the ray o + s·d (unit d) meets a triangle for s in (minS, maxS). */
  return (o: Vec, d: Vec, maxS: number, minS = -0.01): boolean => {
    const seen = new Set<number>();
    for (let s = 0; s <= maxS + CELL; s += CELL / 2) {
      const list = grid.get(key(o[0] + d[0] * s, o[1] + d[1] * s, o[2] + d[2] * s));
      if (!list) continue;
      for (const i of list) {
        if (seen.has(i)) continue;
        seen.add(i);
        const t = tris[i]!;
        const e1: Vec = [t[3]! - t[0]!, t[4]! - t[1]!, t[5]! - t[2]!];
        const e2: Vec = [t[6]! - t[0]!, t[7]! - t[1]!, t[8]! - t[2]!];
        const p: Vec = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
        const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
        if (Math.abs(det) < 1e-12) continue;
        const tv: Vec = [o[0] - t[0]!, o[1] - t[1]!, o[2] - t[2]!];
        const u = (tv[0] * p[0] + tv[1] * p[1] + tv[2] * p[2]) / det;
        if (u < 0 || u > 1) continue;
        const q: Vec = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]];
        const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
        if (v < 0 || u + v > 1) continue;
        const hit = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
        if (hit > minS && hit < maxS) return true;
      }
    }
    return false;
  };
};
