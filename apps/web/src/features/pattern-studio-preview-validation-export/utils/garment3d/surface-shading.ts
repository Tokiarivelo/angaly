/**
 * Baked shading of a triangle mesh: how far each vertex lies inside a crease or hollow (eye sockets,
 * nostrils, the line between the lips, the nasolabial folds, armpits, the muscles' grooves). A viewer
 * multiplies the vertex colours by it, which gives the relief that a real-time light alone flattens
 * (an approximation of ambient occlusion, as used for sculpt previews). Pure numbers, no three.js.
 */

/** Vertex → neighbours, compressed (offsets into a flat list). */
const adjacency = (count: number, indices: Uint32Array): { start: Uint32Array; list: Uint32Array } => {
  const degree = new Uint32Array(count + 1);
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const v = indices[t + e]!;
      degree[v] = degree[v]! + 2;
    }
  }
  const start = new Uint32Array(count + 1);
  for (let v = 0; v < count; v += 1) start[v + 1] = start[v]! + degree[v]!;
  const fill = start.slice(0, count);
  const list = new Uint32Array(start[count]!);
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = indices[t + e]!;
      list[fill[a]!++] = indices[t + ((e + 1) % 3)]!;
      list[fill[a]!++] = indices[t + ((e + 2) % 3)]!;
    }
  }
  return { start, list };
};

/** Area-weighted vertex normals (unit length). */
export const vertexNormals = (positions: Float32Array, indices: Uint32Array): Float32Array => {
  const n = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]! * 3;
    const b = indices[t + 1]! * 3;
    const c = indices[t + 2]! * 3;
    const ux = positions[b]! - positions[a]!;
    const uy = positions[b + 1]! - positions[a + 1]!;
    const uz = positions[b + 2]! - positions[a + 2]!;
    const vx = positions[c]! - positions[a]!;
    const vy = positions[c + 1]! - positions[a + 1]!;
    const vz = positions[c + 2]! - positions[a + 2]!;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      n[v] = n[v]! + nx;
      n[v + 1] = n[v + 1]! + ny;
      n[v + 2] = n[v + 2]! + nz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i]!, n[i + 1]!, n[i + 2]!) || 1;
    n[i] = n[i]! / l;
    n[i + 1] = n[i + 1]! / l;
    n[i + 2] = n[i + 2]! / l;
  }
  return n;
};

export interface CavityScale {
  /** Smoothing passes: the wider the crease to detect, the more passes. */
  passes: number;
  /** Depth (m) under the smoothed surface at which the shading is full. */
  depth: number;
  /** Darkening at full depth (0–1). */
  strength: number;
}

/** Fine creases (lips, nostrils, eyelids) and broad hollows (eye sockets, armpits, muscle grooves). */
export const DEFAULT_CAVITY: CavityScale[] = [
  { passes: 4, depth: 0.0015, strength: 0.18 },
  { passes: 14, depth: 0.006, strength: 0.14 },
];

const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Light factor per vertex in [1 − Σstrength, 1]: 1 on open surfaces, lower the deeper the vertex sits
 * under its smoothed neighbourhood (along its normal), at each scale.
 */
export const cavityOcclusion = (
  positions: Float32Array,
  indices: Uint32Array,
  scales: CavityScale[] = DEFAULT_CAVITY,
): Float32Array => {
  const count = positions.length / 3;
  const { start, list } = adjacency(count, indices);
  const normals = vertexNormals(positions, indices);
  const light = new Float32Array(count).fill(1);
  const passesMax = Math.max(0, ...scales.map((s) => s.passes));
  let current = Float32Array.from(positions);
  let next = new Float32Array(positions.length);
  for (let pass = 1; pass <= passesMax; pass += 1) {
    for (let v = 0; v < count; v += 1) {
      const s = start[v]!;
      const e = start[v + 1]!;
      if (e === s) {
        next[v * 3] = current[v * 3]!;
        next[v * 3 + 1] = current[v * 3 + 1]!;
        next[v * 3 + 2] = current[v * 3 + 2]!;
        continue;
      }
      let x = 0;
      let y = 0;
      let z = 0;
      for (let k = s; k < e; k += 1) {
        const u = list[k]! * 3;
        x += current[u]!;
        y += current[u + 1]!;
        z += current[u + 2]!;
      }
      const m = e - s;
      next[v * 3] = x / m;
      next[v * 3 + 1] = y / m;
      next[v * 3 + 2] = z / m;
    }
    [current, next] = [next, current];
    for (const scale of scales) {
      if (scale.passes !== pass) continue;
      for (let v = 0; v < count; v += 1) {
        const i = v * 3;
        const depth =
          (current[i]! - positions[i]!) * normals[i]! +
          (current[i + 1]! - positions[i + 1]!) * normals[i + 1]! +
          (current[i + 2]! - positions[i + 2]!) * normals[i + 2]!;
        light[v] = light[v]! * 1 - scale.strength * smoothstep(depth / scale.depth);
      }
    }
  }
  return light;
};
