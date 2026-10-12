/**
 * One level of Loop subdivision (C. Loop, 1987) of an indexed triangle mesh: every triangle becomes four
 * and every vertex moves towards the limit surface, so joints (shoulders, elbows, hips, knees) read as
 * smooth skin instead of facets. Boundary edges (eye sockets, the mouth) follow the curve rules.
 * Pure number crunching, no three.js.
 */
export interface IndexedMesh {
  positions: Float32Array;
  indices: Uint32Array;
}

export const loopSubdivide = ({ positions, indices }: IndexedMesh): IndexedMesh => {
  const n = positions.length / 3;
  const key = (a: number, b: number): number => (a < b ? a * n + b : b * n + a);
  // Edge → its opposite vertices (one on a boundary, two inside).
  const opposite = new Map<number, number[]>();
  const neighbours: Array<Set<number>> = Array.from({ length: n }, () => new Set<number>());
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = indices[t + e]!;
      const b = indices[t + ((e + 1) % 3)]!;
      const c = indices[t + ((e + 2) % 3)]!;
      const k = key(a, b);
      const list = opposite.get(k);
      if (list) list.push(c);
      else opposite.set(k, [c]);
      neighbours[a]!.add(b);
      neighbours[b]!.add(a);
    }
  }
  const boundary = new Uint8Array(n);
  const boundaryNeighbours: number[][] = Array.from({ length: n }, () => []);
  for (const [k, list] of opposite) {
    if (list.length !== 1) continue;
    const a = Math.floor(k / n);
    const b = k % n;
    boundary[a] = 1;
    boundary[b] = 1;
    boundaryNeighbours[a]!.push(b);
    boundaryNeighbours[b]!.push(a);
  }

  const edgeIndex = new Map<number, number>();
  const out = new Float32Array((n + opposite.size) * 3);
  // Edge points.
  let next = n;
  for (const [k, list] of opposite) {
    const a = Math.floor(k / n);
    const b = k % n;
    for (let c = 0; c < 3; c += 1) {
      out[next * 3 + c] =
        list.length === 2
          ? (3 / 8) * (positions[a * 3 + c]! + positions[b * 3 + c]!) +
            (1 / 8) * (positions[list[0]! * 3 + c]! + positions[list[1]! * 3 + c]!)
          : (positions[a * 3 + c]! + positions[b * 3 + c]!) / 2;
    }
    edgeIndex.set(k, next);
    next += 1;
  }
  // Moved original vertices.
  for (let v = 0; v < n; v += 1) {
    if (boundary[v] && boundaryNeighbours[v]!.length === 2) {
      const [p, q] = boundaryNeighbours[v]! as [number, number];
      for (let c = 0; c < 3; c += 1) {
        out[v * 3 + c] = (3 / 4) * positions[v * 3 + c]! + (1 / 8) * (positions[p * 3 + c]! + positions[q * 3 + c]!);
      }
      continue;
    }
    const ring = neighbours[v]!;
    const valence = ring.size;
    if (valence === 0 || boundary[v]) {
      for (let c = 0; c < 3; c += 1) out[v * 3 + c] = positions[v * 3 + c]!;
      continue;
    }
    // Warren's weights: β = 3/16 for valence 3, else 3/(8n).
    const beta = valence === 3 ? 3 / 16 : 3 / (8 * valence);
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (const u of ring) sum += positions[u * 3 + c]!;
      out[v * 3 + c] = (1 - valence * beta) * positions[v * 3 + c]! + beta * sum;
    }
  }

  const tris = new Uint32Array(indices.length * 4);
  let o = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    const ab = edgeIndex.get(key(a, b))!;
    const bc = edgeIndex.get(key(b, c))!;
    const ca = edgeIndex.get(key(c, a))!;
    tris.set([a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca], o);
    o += 12;
  }
  return { positions: out, indices: tris };
};
