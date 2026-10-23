import { bodyScale, type BodyMeasurements } from './body-model';
import type { FaceLandmarks } from './head-features';

/**
 * A woman's face reshaped like the atelier's reference sculpt (a clay bust with a high bun, read on its
 * front and profile views): a short oval face narrowing to a small rounded chin that comes forward
 * under the lips, a clean jaw line rising to under the ear, a slim nose and mouth, larger almond eyes,
 * ears close to the head and a rounder cranium. Pure numbers: positions in, positions out.
 *
 * Reference values are in eye spacings (pupil to pupil), from the eyes down (dy) and from the nose tip
 * forwards (dz), so the face keeps the person's own size.
 */

/** Profile of the reference (front of the face, on the midline). */
const REF_PROFILE = {
  noseTip: { dy: -0.451, dz: 0 },
  subnasale: { dy: -0.585, dz: -0.146 },
  upperLip: { dy: -0.732, dz: -0.11 },
  stomion: { dy: -0.805, dz: -0.183 },
  lowerLip: { dy: -0.89, dz: -0.146 },
  mentolabial: { dy: -1.0, dz: -0.204 },
  chinFront: { dy: -1.098, dz: -0.183 },
  chinBottom: { dy: -1.22, dz: -0.244 },
  throat: { dy: -1.42, dz: -0.6 },
} as const;

/** Half width of the face seen from the front (cheeks, jaw, chin), by height under the eyes. */
const REF_HALF_WIDTH: Array<[number, number]> = [
  [-0.244, 0.72],
  [-0.488, 0.683],
  [-0.732, 0.598],
  [-0.976, 0.5],
  [-1.134, 0.378],
  [-1.22, 0.256],
];

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Piecewise-linear lookup in a table sorted by decreasing key, held at both ends. */
const table = (rows: Array<[number, number]>, k: number): number => {
  if (k >= rows[0]![0]) return rows[0]![1];
  for (let i = 1; i < rows.length; i += 1) {
    const [k1, v1] = rows[i]!;
    if (k >= k1) {
      const [k0, v0] = rows[i - 1]!;
      return lerp(v0, v1, (k - k0) / (k1 - k0));
    }
  }
  return rows[rows.length - 1]![1];
};

type P2 = [number, number];

/**
 * Thin-plate spline through control points of the (y, z) plane: maps each source point exactly onto
 * its target, bending as little as possible in between.
 */
export const thinPlate = (src: P2[], dst: P2[]): ((y: number, z: number) => P2) => {
  const n = src.length;
  const U = (r2: number): number => (r2 < 1e-12 ? 0 : r2 * Math.log(r2) * 0.5);
  const N = n + 3;
  const solve = (rhs: number[]): number[] => {
    const A: number[][] = [];
    for (let i = 0; i < N; i += 1) A.push(new Array<number>(N + 1).fill(0));
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const dy = src[i]![0] - src[j]![0];
        const dz = src[i]![1] - src[j]![1];
        A[i]![j] = U(dy * dy + dz * dz);
      }
      const row = [1, src[i]![0], src[i]![1]];
      row.forEach((v, k) => {
        A[i]![n + k] = v;
        A[n + k]![i] = v;
      });
      A[i]![N] = rhs[i]!;
    }
    // Gaussian elimination with partial pivoting.
    for (let c = 0; c < N; c += 1) {
      let pivot = c;
      for (let r = c + 1; r < N; r += 1) if (Math.abs(A[r]![c]!) > Math.abs(A[pivot]![c]!)) pivot = r;
      [A[c], A[pivot]] = [A[pivot]!, A[c]!];
      const d = A[c]![c]!;
      if (Math.abs(d) < 1e-14) continue;
      for (let r = 0; r < N; r += 1) {
        if (r === c) continue;
        const k = A[r]![c]! / d;
        if (k === 0) continue;
        for (let cc = c; cc <= N; cc += 1) A[r]![cc] = A[r]![cc]! - k * A[c]![cc]!;
      }
    }
    return A.map((row, i) => (Math.abs(row[i]!) < 1e-14 ? 0 : row[N]! / row[i]!));
  };
  const wy = solve(dst.map((d, i) => d[0] - src[i]![0]).concat([0, 0, 0]));
  const wz = solve(dst.map((d, i) => d[1] - src[i]![1]).concat([0, 0, 0]));
  return (y: number, z: number): P2 => {
    let oy = wy[n]! + wy[n + 1]! * y + wy[n + 2]! * z;
    let oz = wz[n]! + wz[n + 1]! * y + wz[n + 2]! * z;
    for (let i = 0; i < n; i += 1) {
      const dy = y - src[i]![0];
      const dz = z - src[i]![1];
      const u = U(dy * dy + dz * dz);
      oy += wy[i]! * u;
      oz += wz[i]! * u;
    }
    return [y + oy, z + oz];
  };
};

/** Front-most depth of the midline (|x| < 6 mm, in front of zMin) per millimetre of height, gaps filled. */
const midline = (positions: Float32Array, y0: number, y1: number, zMin: number) => {
  const STEP = 0.001;
  const n = Math.ceil((y1 - y0) / STEP) + 1;
  const z = new Float32Array(n).fill(-Infinity);
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(positions[i]!) > 0.006 || positions[i + 2]! < zMin) continue;
    const k = Math.round((positions[i + 1]! - y0) / STEP);
    if (k >= 0 && k < n) z[k] = Math.max(z[k]!, positions[i + 2]!);
  }
  // Each vertex covers ±2 mm (the scan's rows are 2–3 mm apart; an inner vertex alone in a row would
  // dig a false hollow); rows still empty are interpolated.
  const spread = Float32Array.from(z);
  for (let k = 0; k < n; k += 1) {
    for (let d = -2; d <= 2; d += 1) if (k + d >= 0 && k + d < n) spread[k] = Math.max(spread[k]!, z[k + d]!);
  }
  let last = -1;
  for (let k = 0; k < n; k += 1) {
    if (!Number.isFinite(spread[k]!)) continue;
    if (last >= 0 && k - last > 1) for (let j = last + 1; j < k; j += 1) spread[j] = lerp(spread[last]!, spread[k]!, (j - last) / (k - last));
    if (last < 0) for (let j = 0; j < k; j += 1) spread[j] = spread[k]!;
    last = k;
  }
  if (last < 0) spread.fill(0);
  else for (let j = last + 1; j < n; j += 1) spread[j] = spread[last]!;
  return { at: (y: number): number => spread[clamp(Math.round((y - y0) / STEP), 0, n - 1)]!, step: STEP };
};

/** Landmarks of the profile, found on the midline below the nose tip (lips, chin, throat). */
export const profileLandmarks = (positions: Float32Array, f: FaceLandmarks, s: number) => {
  const prof = midline(positions, f.noseTip.y - 0.13 * s, f.noseTip.y + 0.005, f.skull.z + 0.01 * s);
  const scan = (from: number, to: number, pick: 'min' | 'max'): P2 => {
    let best: P2 = [from, prof.at(from)];
    for (let y = from; y >= to; y -= prof.step) {
      const z = prof.at(y);
      if (!Number.isFinite(z)) continue;
      if (!Number.isFinite(best[1]) || (pick === 'max' ? z > best[1] : z < best[1])) best = [y, z];
    }
    return best;
  };
  const tip: P2 = [f.noseTip.y, f.noseTip.z];
  const subnasale = scan(tip[0] - 0.006 * s, tip[0] - 0.022 * s, 'min');
  const upperLip = scan(subnasale[0] - 0.003 * s, subnasale[0] - 0.016 * s, 'max');
  const stomion = scan(upperLip[0] - 0.003 * s, upperLip[0] - 0.012 * s, 'min');
  const lowerLip = scan(stomion[0] - 0.002 * s, stomion[0] - 0.012 * s, 'max');
  const mentolabial = scan(lowerLip[0] - 0.004 * s, lowerLip[0] - 0.022 * s, 'min');
  const chinFront = scan(mentolabial[0] - 0.002 * s, mentolabial[0] - 0.022 * s, 'max');
  // Chin bottom: the last height before the profile falls back to the throat (> 2 cm in 6 mm).
  let chinBottom: P2 = [chinFront[0] - 0.014 * s, chinFront[1] - 0.01 * s];
  let throat: P2 = [chinBottom[0] - 0.008 * s, chinBottom[1] - 0.04 * s];
  for (let y = chinFront[0]; y > chinFront[0] - 0.035 * s; y -= prof.step) {
    if (prof.at(y) - prof.at(y - 0.006 * s) > 0.02 * s) {
      chinBottom = [y, prof.at(y)];
      throat = [y - 0.008 * s, prof.at(y - 0.008 * s)];
      break;
    }
  }
  return { tip, subnasale, upperLip, stomion, lowerLip, mentolabial, chinFront, chinBottom, throat };
};

/** Mean height and depth of the ears (the skin standing out at the sides of the head). */
const earCentre = (positions: Float32Array, f: FaceLandmarks, s: number): P2 => {
  let y = 0;
  let z = 0;
  let count = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const py = positions[i + 1]!;
    if (Math.abs(positions[i]!) < 0.068 * s || py < f.eye.y - 0.05 * s || py > f.eye.y + 0.035 * s) continue;
    if (positions[i + 2]! < f.skull.z - 0.05 * s || positions[i + 2]! > f.skull.z + 0.05 * s) continue;
    y += py;
    z += positions[i + 2]!;
    count += 1;
  }
  return count ? [y / count, z / count] : [f.eye.y - 0.007 * s, f.skull.z];
};

export const stylizeFace = (
  positions: Float32Array,
  f: FaceLandmarks,
  body: BodyMeasurements,
): { positions: Float32Array; face: FaceLandmarks } => {
  const s = bodyScale(body);
  const iod = 2 * f.eye.x;
  const P = profileLandmarks(positions, f, s);
  const [earY, earZ] = earCentre(positions, f, s);
  const C = f.skull;
  // Reference point → target (y, z): heights under the eyes, depths from the nose tip (kept in place).
  const ref = (k: keyof typeof REF_PROFILE): P2 => [f.eye.y + REF_PROFILE[k].dy * iod, f.noseTip.z + REF_PROFILE[k].dz * iod];

  // 1. Profile: lips, chin and jaw line moved onto the reference's, skull, ears and neck held.
  const moving: Array<[P2, P2]> = [
    [P.tip, ref('noseTip')],
    [P.subnasale, ref('subnasale')],
    [P.upperLip, ref('upperLip')],
    [P.stomion, ref('stomion')],
    [P.lowerLip, ref('lowerLip')],
    [P.mentolabial, ref('mentolabial')],
    [P.chinFront, ref('chinFront')],
    [P.chinBottom, ref('chinBottom')],
    // Under the chin: the throat a little forward and up (the head carried forward on a long neck).
    [P.throat, [lerp(P.throat[0], ref('throat')[0], 0.6), lerp(P.throat[1], ref('throat')[1], 0.4)]],
    // Inside the chin and the jaw: they move with it (no hollow behind the chin).
    [
      [P.chinBottom[0] + 0.012 * s, P.chinBottom[1] - 0.025 * s],
      [ref('chinBottom')[0] + 0.012 * s, ref('chinBottom')[1] - 0.025 * s],
    ],
    // Angle of the jaw: from ~6 cm under the ear to ~3.5 cm, a little in front of it.
    [
      [earY - 0.062 * s, earZ + 0.012 * s],
      [earY - 0.038 * s, earZ + 0.016 * s],
    ],
  ];
  const held: P2[] = [
    [f.eye.y + 0.03 * s, f.noseTip.z - 0.018 * s], // forehead
    [f.eye.y, f.rimZ + 0.008 * s], // bridge of the nose
    [f.eye.y, f.eye.z], // eyes
    [f.eye.y - 0.012 * s, f.eye.z - 0.01 * s], // cheekbones (inside)
    [C.y, C.z],
    [f.top, C.z],
    [C.y, C.z - 0.095 * s], // back of the head
    [C.y + 0.06 * s, C.z - 0.07 * s],
    [earY, earZ],
    [earY - 0.035 * s, earZ - 0.004 * s], // ear lobe
    [earY - 0.06 * s, C.z - 0.06 * s], // nape
    [P.throat[0] - 0.02 * s, C.z - 0.055 * s], // back of the neck
    [P.throat[0] - 0.045 * s, P.throat[1] - 0.008 * s], // front of the neck, low
    [P.throat[0] - 0.07 * s, P.throat[1] - 0.012 * s],
    [P.throat[0] - 0.045 * s, C.z], // inside the neck
  ];
  const warp = thinPlate(
    [...moving.map((m) => m[0]), ...held],
    [...moving.map((m) => m[1]), ...held],
  );
  const out = Float32Array.from(positions);
  // Only the head and the neck: nothing under the base of the neck moves.
  const neckBase = P.throat[0] - 0.06 * s;
  for (let i = 0; i < out.length; i += 3) {
    const y = out[i + 1]!;
    if (y < neckBase || Math.hypot(out[i]!, y - C.y, out[i + 2]! - C.z) > 0.2 * s) continue;
    const k = smooth((y - neckBase) / (0.025 * s));
    const [ny, nz] = warp(y, out[i + 2]!);
    out[i + 1] = lerp(y, ny, k);
    out[i + 2] = lerp(out[i + 2]!, nz, k);
  }

  // 2. Width: the front of the face scaled, height by height, onto the reference's oval. Measured on
  // the reshaped face, in front of the ears; the ears and the back of the head do not move.
  const chinY = ref('chinBottom')[0];
  const BAND = 0.002;
  const rows = Math.ceil((f.eye.y - (chinY - 0.03 * s)) / BAND);
  const width = new Float32Array(rows);
  for (let i = 0; i < out.length; i += 3) {
    const z = out[i + 2]!;
    if (z < earZ + 0.02 * s) continue;
    const r = Math.floor((f.eye.y - out[i + 1]!) / BAND);
    if (r >= 0 && r < rows) width[r] = Math.max(width[r]!, Math.abs(out[i]!));
  }
  const ratio = (y: number): number => {
    const dy = (y - f.eye.y) / iod;
    const r = clamp(Math.floor((f.eye.y - y) / BAND), 0, rows - 1);
    // Averaged over ±3 bands (the scan's rows are sparse).
    let w = 0;
    for (let d = -3; d <= 3; d += 1) w = Math.max(w, width[clamp(r + d, 0, rows - 1)]!);
    if (w <= 0) return 1;
    return clamp((table(REF_HALF_WIDTH, dy) * iod) / w, 0.55, 1);
  };
  const ratios = new Float32Array(rows);
  for (let r = 0; r < rows; r += 1) ratios[r] = ratio(f.eye.y - (r + 0.5) * BAND);
  for (let i = 0; i < out.length; i += 3) {
    const x = out[i]!;
    const y = out[i + 1]!;
    const z = out[i + 2]!;
    if (y > f.eye.y || y < neckBase || Math.abs(x) > 0.1 * s) continue;
    // Under the eyes only (the lower lids follow a little), fading out under the chin into the neck.
    const under = smooth((f.eye.y - 0.006 * s - y) / (0.022 * s)) * (1 - smooth((chinY - 0.004 * s - y) / (0.03 * s)));
    // In front of the ears; the ears themselves are left out.
    const front = smooth((z - (earZ - 0.004 * s)) / (0.022 * s));
    const ear = smooth((Math.abs(x) - 0.06 * s) / (0.006 * s)) * (1 - smooth((z - earZ - 0.02 * s) / (0.012 * s)));
    const r = ratios[clamp(Math.floor((f.eye.y - Math.max(y, chinY)) / BAND), 0, rows - 1)]!;
    out[i] = x * lerp(1, r, under * front * (1 - ear));
  }

  // 3. Eyes: the opening widened (outer corner further out and lifted) and opened a little.
  const { w, h } = f.eyeHalf;
  for (let i = 0; i < out.length; i += 3) {
    const z = out[i + 2]!;
    if (z < C.z) continue;
    const x = out[i]!;
    const ax = Math.abs(x);
    const dx = ax - f.eye.x;
    const dy = out[i + 1]! - f.eye.y;
    const e = Math.hypot(dx / (w * 1.7), dy / (h * 3.2));
    if (e > 2.4) continue;
    const fall = Math.exp(-((Math.max(0, e - 0.7) / 0.7) ** 2));
    out[i] = x + Math.sign(x) * 0.26 * dx * fall;
    out[i + 1] = out[i + 1]! + (0.12 * dy + 0.0015 * s * smooth(dx / w)) * fall;
  }

  // 4. Cranium and ears: ears closer to the head, the back of the skull and its top a little rounder.
  for (let i = 0; i < out.length; i += 3) {
    const x = out[i]!;
    const y = out[i + 1]!;
    const z = out[i + 2]!;
    const ax = Math.abs(x);
    if (Math.hypot(x, y - C.y, z - C.z) > 0.16 * s) continue;
    if (ax > 0.064 * s && y > earY - 0.05 * s && y < earY + 0.045 * s && Math.abs(z - earZ) < 0.04 * s) {
      const k = (1 - smooth((Math.abs(z - earZ) - 0.025 * s) / (0.015 * s))) * smooth((y - (earY - 0.05 * s)) / (0.01 * s));
      out[i] = Math.sign(x) * lerp(ax, 0.064 * s + (ax - 0.064 * s) * 0.4, k);
    }
    const above = smooth((y - (f.eye.y + 0.02 * s)) / (0.04 * s));
    // The occiput forwards (~2 cm at the back), fading towards the nape.
    const back = smooth((earZ - 0.01 * s - z) / (0.06 * s)) * smooth((y - (earY - 0.05 * s)) / (0.04 * s));
    out[i + 2] = z + 0.022 * s * back;
    out[i + 1] = y - 0.008 * s * above * smooth((y - (f.eye.y + 0.02 * s)) / (f.top - f.eye.y));
  }

  const at = (p: P2): P2 => {
    const [ny, nz] = warp(p[0], p[1]);
    return [ny, nz];
  };
  const tip = at(P.tip);
  const mouth = at(P.stomion);
  const face: FaceLandmarks = {
    ...f,
    eyeHalf: { w: w * 1.26, h: h * 1.12 },
    noseTip: { x: 0, y: tip[0], z: tip[1] },
    mouth: { x: 0, y: mouth[0], z: mouth[1] },
    top: f.top - 0.008 * s,
  };
  return { positions: out, face };
};
