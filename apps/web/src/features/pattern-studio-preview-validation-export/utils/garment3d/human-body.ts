import { bodyLandmarks, bodyScale, ellipseCircumference, ringAt, type BodyMeasurements, type BodyRing } from './body-model';
import { bodyLegRadius, SLEEVE_DROP } from './garment-model';

/**
 * Fits the scanned-quality human base mesh (apps/web/public/models/human-base.glb, built from the
 * CC0 MakeHuman assets by scripts/build-human-base.py) to the customer's measurements.
 * Pure number crunching on typed arrays — no three.js — so it is unit-testable and the viewer only
 * uploads the result to a BufferGeometry.
 *
 * Pipeline: 1. morphs (gender / weight / muscle) → 2. vertical warp onto the model's landmarks →
 * 3. torso & neck cross-sections scaled to the measured circumferences → 4. arms lowered to the
 * sleeve axis and sized to the arm length → 5. legs scaled to the thigh / knee / ankle girths.
 */

export interface HumanBaseData {
  /** Base shape (adult woman), metres, feet at y = 0, +z = front. xyz interleaved. */
  positions: Float32Array;
  /** Triangle indices. */
  indices: Uint32Array;
  /** Per-vertex displacement for each named morph (same layout as `positions`). */
  morphs: Record<string, Float32Array>;
  /** 0 torso / legs / head … 1 arm (smooth). */
  armWeights: Float32Array;
  /** Heights (m) of floor, crotch, hip, waist, bust, nape, top for the female and male shapes. */
  landmarksFemale: number[];
  landmarksMale: number[];
  landmarksFemaleChild: number[];
  landmarksMaleChild: number[];
}

export interface HumanMorph {
  /** 0 = female shape, 1 = male shape. */
  gender: number;
  /** -1 = lean, 0 = average, +1 = heavy. */
  weight: number;
  /** 0..1 */
  muscle: number;
  /** 0 = adult, 1 = child (about 10 years). */
  age: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Chooses the morphs that bring the base mesh closest to the measurements (the ring fit does the rest). */
export const morphFor = (body: BodyMeasurements, templateId: string): HumanMorph => {
  const male = templateId.startsWith('HOMME');
  const waistRatio = body.waist / body.height;
  const reference = male ? 0.48 : 0.41;
  const weight = clamp((waistRatio - reference) / 0.1, -1, 1);
  const muscle = templateId.includes('ATHLETIQUE') ? 0.9 : male ? 0.3 : 0.1;
  return { gender: male ? 1 : 0, weight, muscle, age: templateId.startsWith('ENFANT') ? 1 : 0 };
};

const applyMorphs = (data: HumanBaseData, morph: HumanMorph): Float32Array => {
  const out = new Float32Array(data.positions);
  const g = clamp(morph.gender, 0, 1);
  const weights: Array<[string, number]> = [
    ['gender', g],
    ['femaleHeavy', (1 - g) * Math.max(morph.weight, 0)],
    ['maleHeavy', g * Math.max(morph.weight, 0)],
    ['femaleLight', (1 - g) * Math.max(-morph.weight, 0)],
    ['maleLight', g * Math.max(-morph.weight, 0)],
    ['femaleMuscle', (1 - g) * clamp(morph.muscle, 0, 1)],
    ['maleMuscle', g * clamp(morph.muscle, 0, 1)],
    ['childFemale', (1 - g) * clamp(morph.age, 0, 1)],
    ['childMale', g * clamp(morph.age, 0, 1)],
  ];
  for (const [name, w] of weights) {
    const delta = data.morphs[name];
    if (!delta || w === 0) continue;
    for (let i = 0; i < out.length; i += 1) out[i]! += delta[i]! * w;
  }
  return out;
};

/** Piecewise-linear map of y through (from → to) landmark pairs, extrapolating with the end slopes. */
const warpY = (y: number, from: number[], to: number[]): number => {
  const last = from.length - 1;
  let i = 0;
  while (i < last - 1 && y > from[i + 1]!) i += 1;
  const span = from[i + 1]! - from[i]!;
  return to[i]! + ((y - from[i]!) / (span || 1)) * (to[i + 1]! - to[i]!);
};

interface Section {
  a: number;
  b: number;
  cx: number;
  cz: number;
  /** Convex-hull perimeter (m). */
  perimeter: number;
}

const DIRECTIONS = 48;

/** Convex-hull perimeter of a horizontal slice (Cauchy: perimeter = ∮ support function). */
const slicePerimeter = (xs: number[], zs: number[]): number => {
  if (xs.length < 3) return 0;
  const cx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const cz = zs.reduce((s, v) => s + v, 0) / zs.length;
  let total = 0;
  for (let d = 0; d < DIRECTIONS; d += 1) {
    const t = (d / DIRECTIONS) * Math.PI;
    const ux = Math.cos(t);
    const uz = Math.sin(t);
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k < xs.length; k += 1) {
      const p = (xs[k]! - cx) * ux + (zs[k]! - cz) * uz;
      if (p < lo) lo = p;
      if (p > hi) hi = p;
    }
    total += hi - lo; // the width along u; the mean width times pi is the perimeter
  }
  return (total / DIRECTIONS) * Math.PI;
};

/** The skin stays this fraction inside the torso ellipse the garment is built on. */
const INSIDE = 0.985;
const BIN = 0.02;
const WINDOW = 0.016;

const measureSection = (pos: Float32Array, indices: number[], y: number, side: 0 | 1 | -1): Section | null => {
  const xs: number[] = [];
  const zs: number[] = [];
  for (const i of indices) {
    if (Math.abs(pos[i * 3 + 1]! - y) > WINDOW) continue;
    if (side !== 0 && Math.sign(pos[i * 3]!) !== side) continue;
    xs.push(pos[i * 3]!);
    zs.push(pos[i * 3 + 2]!);
  }
  if (xs.length < 6) return null;
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  return {
    a: (xMax - xMin) / 2,
    b: (zMax - zMin) / 2,
    cx: (xMax + xMin) / 2,
    cz: (zMax + zMin) / 2,
    perimeter: slicePerimeter(xs, zs),
  };
};

export interface FitResult {
  positions: Float32Array;
  /** Hull perimeters (m) of the fitted torso at bust, waist and hip — for checks and the UI. */
  circumferences: { bust: number; waist: number; hip: number };
}

/** Indices of the vertices a region owns, from the arm weights and the (warped) height. */
const collect = (pos: Float32Array, arm: Float32Array, test: (y: number, aw: number, x: number) => boolean): number[] => {
  const out: number[] = [];
  for (let i = 0; i < arm.length; i += 1) if (test(pos[i * 3 + 1]!, arm[i]!, pos[i * 3]!)) out.push(i);
  return out;
};

interface Bin {
  y: number;
  /** Scale about the mesh section centre, target centre offset. */
  fa: number;
  fb: number;
  czMesh: number;
  dcz: number;
}

/** Linear lookup in a list of bins sorted by height (some heights may be missing), clamped at both ends. */
const lookup = <T extends { y: number }>(list: T[], y: number, mix: (a: T, b: T, t: number) => T): T => {
  if (y <= list[0]!.y) return list[0]!;
  const last = list[list.length - 1]!;
  if (y >= last.y) return last;
  let i = 0;
  while (i < list.length - 2 && list[i + 1]!.y < y) i += 1;
  const lo = list[i]!;
  const hi = list[i + 1]!;
  return mix(lo, hi, (y - lo.y) / (hi.y - lo.y || 1));
};

export const fitHumanBody = (
  data: HumanBaseData,
  body: BodyMeasurements,
  rings: BodyRing[],
  morph: HumanMorph,
): FitResult => {
  const n = data.armWeights.length;
  const pos = applyMorphs(data, morph);
  const arm = data.armWeights;
  const l = bodyLandmarks(body);
  const s = bodyScale(body);

  // 2. Vertical warp: the mesh's own landmarks land on the model's.
  const g = clamp(morph.gender, 0, 1);
  const age = clamp(morph.age, 0, 1);
  const from = data.landmarksFemale.map((v, i) =>
    lerp(lerp(v, data.landmarksMale[i]!, g), lerp(data.landmarksFemaleChild[i]!, data.landmarksMaleChild[i]!, g), age),
  );
  const to = [0, l.crotchY, l.hipY, l.waistY, l.bustY, l.napeY, body.height];
  for (let i = 1; i < to.length; i += 1) to[i] = Math.max(to[i]!, to[i - 1]! + 0.01);
  const sizeRatio = body.height / (from[6] ?? 1);
  for (let i = 0; i < n; i += 1) {
    pos[i * 3 + 1] = warpY(pos[i * 3 + 1]!, from, to);
    // Width and depth follow the stature; the sections below refine them.
    pos[i * 3]! *= sizeRatio;
    pos[i * 3 + 2]! *= sizeRatio;
  }

  // 3. Torso sections (crotch → just under the shoulders) scaled to the model's rings, and the neck
  //    to the neck girth. The shoulder line itself keeps the scanned slope (see 4).
  const blendLength = 0.1 * s;
  const torsoIdx = collect(pos, arm, (y, aw) => aw < 0.5 && y >= l.crotchY && y <= l.napeY + 0.1);
  const torsoTop = l.shoulderY - 0.1 * s;
  const neckBottom = l.napeY + 0.02 * s;
  const neckTop = l.napeY + 0.055 * s; // the neck ends under the chin; the jaw keeps its shape
  const neckRadius = body.neck / (2 * Math.PI);
  const neckIdx = collect(pos, arm, (y, aw, x) => aw < 0.5 && y >= neckBottom - 0.02 && y <= neckTop + 0.01 && Math.abs(x) < 0.1);
  const sectionBin = (y: number, target: { a: number; b: number; cz: number }, idx: number[] = torsoIdx, range: [number, number] = [0.4, 2.2]): Bin | null => {
    const section = measureSection(pos, idx, y, 0);
    if (!section) return null;
    const fa = clamp(target.a / Math.max(section.a, 1e-3), range[0], range[1]);
    const fb = clamp(target.b / Math.max(section.b, 1e-3), range[0], range[1]);
    // Mixed-axis scale → correct so the hull perimeter equals the ellipse circumference.
    const scaled = section.perimeter * Math.sqrt((fa * fa + fb * fb) / 2);
    const k = scaled > 1e-6 ? clamp(ellipseCircumference(target.a, target.b) / scaled, 0.8, 1.25) : 1;
    return { y, fa: fa * k, fb: fb * k, czMesh: section.cz, dcz: target.cz - section.cz };
  };
  const smoothBins = (raw: Bin[]): Bin[] =>
    raw.map((b, i) => {
      const prev = raw[Math.max(0, i - 1)]!;
      const next = raw[Math.min(raw.length - 1, i + 1)]!;
      return {
        y: b.y,
        fa: (prev.fa + 2 * b.fa + next.fa) / 4,
        fb: (prev.fb + 2 * b.fb + next.fb) / 4,
        czMesh: b.czMesh,
        dcz: (prev.dcz + 2 * b.dcz + next.dcz) / 4,
      };
    });
  const torsoRaw: Bin[] = [];
  for (let y = l.crotchY; y <= torsoTop; y += BIN) {
    const r = ringAt(rings, y);
    const bin = sectionBin(y, { a: r.a, b: r.b, cz: r.cz ?? 0 });
    if (bin) torsoRaw.push(bin);
  }
  const neckRaw: Bin[] = [];
  for (let y = neckBottom; y <= neckTop + 1e-6; y += BIN / 2) {
    const bin = sectionBin(y, { a: neckRadius * 0.95, b: neckRadius * 1.05, cz: 0 }, neckIdx, [0.85, 1.25]);
    if (bin) bin.dcz = 0;
    if (bin) neckRaw.push(bin);
  }
  const torsoBins = smoothBins(torsoRaw);
  const neckBins = smoothBins(neckRaw);
  const mixBin = (a: Bin, b: Bin, t: number): Bin => ({
    y: lerp(a.y, b.y, t),
    fa: lerp(a.fa, b.fa, t),
    fb: lerp(a.fb, b.fb, t),
    czMesh: lerp(a.czMesh, b.czMesh, t),
    dcz: lerp(a.dcz, b.dcz, t),
  });
  const fitSection = (i: number, b: Bin, strength: number, clampToRing: boolean): void => {
    const y = pos[i * 3 + 1]!;
    const tw = (1 - arm[i]!) * strength;
    if (tw <= 0) return;
    pos[i * 3] = pos[i * 3]! * (1 + (b.fa - 1) * tw);
    const z = pos[i * 3 + 2]!;
    pos[i * 3 + 2] = (z - b.czMesh) * (1 + (b.fb - 1) * tw) + b.czMesh + b.dcz * tw;
    if (!clampToRing) return;
    // Bumps (bust, buttocks) may not go beyond the model's ellipse, which the garment rings wrap.
    const r = ringAt(rings, y);
    const q = Math.hypot(pos[i * 3]! / r.a, (pos[i * 3 + 2]! - (r.cz ?? 0)) / r.b);
    if (q > INSIDE) {
      const pull = 1 - tw * (1 - INSIDE / q);
      pos[i * 3] = pos[i * 3]! * pull;
      pos[i * 3 + 2] = (r.cz ?? 0) + (pos[i * 3 + 2]! - (r.cz ?? 0)) * pull;
    }
  };
  for (let i = 0; i < n; i += 1) {
    const y = pos[i * 3 + 1]!;
    if (torsoBins.length > 0 && y >= l.crotchY - blendLength && y <= torsoTop + 0.12 * s) {
      // Full strength from the crotch up; fading out over 10 cm below it (the legs take over) and
      // over 6 cm above the shoulder-line limit.
      const below = y < l.crotchY ? 1 - smooth((l.crotchY - y) / blendLength) : 1;
      const above = 1 - smooth((y - torsoTop) / (0.12 * s));
      fitSection(i, lookup(torsoBins, clamp(y, l.crotchY, torsoTop), mixBin), below * above, true);
    }
    if (neckBins.length > 0 && y >= neckBottom - 0.015 * s) {
      const up = smooth((y - (neckBottom - 0.015 * s)) / (0.015 * s));
      const down = 1 - smooth((y - neckTop) / (0.025 * s));
      // Only the neck column: the shoulder line next to it keeps its slope.
      const column = 1 - smooth((Math.abs(pos[i * 3]!) - 0.06 * s) / (0.04 * s));
      fitSection(i, lookup(neckBins, clamp(y, neckBottom, neckTop), mixBin), up * down * column, false);
    }
  }

  // 4. Shoulders and arms. The shoulder line is widened/narrowed so the joint of this very mesh (where
  //    the arm weight crosses one half) lands on the sleeve start; then the arms are sized to the arm
  //    length and lowered onto the sleeve axis (right-arm frame, mirrored for the left one).
  const sleeveX = ringAt(rings, l.shoulderY).a + 0.012;
  const sleeveY = l.shoulderY - SLEEVE_DROP * s;
  const measureJoint = (): { x: number; y: number } | null => {
    let jx = 0;
    let jy = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      if (arm[i]! < 0.4 || arm[i]! > 0.6 || y < l.shoulderY - 0.1 * s || y > l.shoulderY + 0.05 * s) continue;
      jx += Math.abs(pos[i * 3]!);
      jy += y;
      count += 1;
    }
    return count > 0 ? { x: jx / count, y: jy / count } : null;
  };
  const joint0 = measureJoint();
  if (joint0) {
    const widen = clamp(sleeveX / Math.max(joint0.x, 1e-3), 0.75, 1.3);
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      const w = smooth((y - (l.shoulderY - 0.32 * s)) / (0.3 * s)) * (1 - smooth((y - l.shoulderY) / (0.1 * s)));
      // The neck column (|x| < 3.5 cm) is left alone; the widening fades in over the next 4 cm.
      const lateral = smooth((Math.abs(pos[i * 3]!) - 0.035 * s) / (0.04 * s));
      if (w > 0) pos[i * 3]! *= 1 + (widen - 1) * w * lateral;
    }
  }
  const joint = measureJoint();
  const pivotX = joint?.x ?? sleeveX;
  const pivotY = joint?.y ?? sleeveY;
  let reach = 0;
  for (let i = 0; i < n; i += 1) {
    if (arm[i]! < 0.95 || pos[i * 3]! <= 0) continue;
    const d = Math.hypot(pos[i * 3]! - pivotX, pos[i * 3 + 1]! - pivotY);
    if (d > reach) {
      reach = d;
    }
  }
  if (reach > 0.05) {
    // The scanned A-pose is kept (the sleeve axis follows it, see SLEEVE_TILT): the arms are only
    // sized to the arm length about the joint and anchored on the sleeve start.
    const scale = clamp((body.armLength + 0.17 * s) / reach, 0.92, 1.08);
    for (let i = 0; i < n; i += 1) {
      const aw = arm[i]!;
      if (aw <= 0) continue;
      const sign = pos[i * 3]! < 0 ? -1 : 1;
      const k = 1 + (scale - 1) * aw;
      const px = (Math.abs(pos[i * 3]!) - pivotX) * k;
      const py = (pos[i * 3 + 1]! - pivotY) * k;
      // The anchoring grows with the distance from the joint, so the shoulder cap is not torn.
      const along = smooth(Math.hypot(px, py) / (0.32 * s));
      pos[i * 3] = sign * (pivotX + px + (sleeveX - pivotX) * aw * along);
      pos[i * 3 + 1] = pivotY + py + (sleeveY - pivotY) * aw * along;
    }
  }

  // 5. Legs. The scanned legs are kept (calf, knee and thigh shapes are what make a body look real):
  //    only a gentle girth factor (±10 %) and the move of each leg under the pelvis, where the trousers
  //    expect it. Both are measured at three heights (thigh, knee, ankle) and blended in between.
  const ankleY = l.ankleY;
  for (const sign of [1, -1] as const) {
    const idx = collect(pos, arm, (y, aw, x) => aw < 0.05 && y < l.crotchY && (x < 0 ? -1 : 1) === sign);
    const heights = [ankleY + 0.04 * s, (l.crotchY + ankleY) / 2, l.crotchY - 0.12 * s];
    const controls = heights.map((y) => {
      const section = measureSection(pos, idx, y, sign);
      const cone = bodyLegRadius(body, y);
      const radius = section ? Math.sqrt(Math.max(section.a * section.b, 1e-6)) : 0;
      return {
        f: radius > 0 ? clamp((cone * 0.96) / radius, 0.9, 1.1) : 1,
        dx: section ? sign * Math.max(0.09 * s, cone * 0.95) - section.cx : 0,
        cx: section?.cx ?? sign * 0.09 * s,
        cz: section?.cz ?? 0,
      };
    });
    const blend = (y: number, pick: (c: (typeof controls)[number]) => number): number => {
      if (y <= heights[0]!) return pick(controls[0]!);
      if (y >= heights[2]!) return pick(controls[2]!);
      const k = y < heights[1]! ? 0 : 1;
      const t = smooth((y - heights[k]!) / (heights[k + 1]! - heights[k]!));
      return lerp(pick(controls[k]!), pick(controls[k + 1]!), t);
    };
    for (const i of idx) {
      const y = pos[i * 3 + 1]!;
      const upper = smooth((l.crotchY - y) / blendLength); // the torso fit hands over to the leg fit
      const f = 1 + (blend(y, (c) => c.f) - 1) * upper;
      const cx = blend(y, (c) => c.cx);
      const cz = blend(y, (c) => c.cz);
      pos[i * 3] = cx + blend(y, (c) => c.dx) * upper + (pos[i * 3]! - cx) * f;
      pos[i * 3 + 2] = cz + (pos[i * 3 + 2]! - cz) * f;
    }
  }

  const at = (y: number): number => measureSection(pos, torsoIdx, y, 0)?.perimeter ?? 0;
  return { positions: pos, circumferences: { bust: at(l.bustY), waist: at(l.waistY), hip: at(l.hipY) } };
};

export interface HairShell {
  positions: Float32Array;
  indices: Uint32Array;
}

/**
 * Hair cap: the triangles of the scalp (crown, back and sides above the nape, not the face),
 * pushed 7 mm out along the surface so it reads as hair volume over the skull.
 */
export const buildHairShell = (positions: Float32Array, indices: Uint32Array, body: BodyMeasurements): HairShell => {
  const s = bodyScale(body);
  const top = body.height;
  // Centre of the skull in z, from the vertices of the upper head.
  let sumZ = 0;
  let count = 0;
  for (let i = 0; i < positions.length / 3; i += 1) {
    const y = positions[i * 3 + 1]!;
    if (y > top - 0.12 * s && y < top - 0.03 * s) {
      sumZ += positions[i * 3 + 2]!;
      count += 1;
    }
  }
  const centreZ = count ? sumZ / count : 0;
  const inHair = (i: number): boolean => {
    const x = Math.abs(positions[i * 3]!);
    const y = positions[i * 3 + 1]!;
    const z = positions[i * 3 + 2]!;
    if (x > 0.074 * s || y < top - 0.25 * s) return false; // ears and the neck stay bare
    // Hairline: a plane tilted down at the back (hair reaches the nape) and up at the front (forehead).
    const dz = z - centreZ;
    const line = dz < 0 ? top - 0.07 * s + 1.5 * dz : top - 0.07 * s + 1.8 * dz;
    return y >= line;
  };
  const normals = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    const e1 = [0, 1, 2].map((k) => positions[b * 3 + k]! - positions[a * 3 + k]!);
    const e2 = [0, 1, 2].map((k) => positions[c * 3 + k]! - positions[a * 3 + k]!);
    const nx = e1[1]! * e2[2]! - e1[2]! * e2[1]!;
    const ny = e1[2]! * e2[0]! - e1[0]! * e2[2]!;
    const nz = e1[0]! * e2[1]! - e1[1]! * e2[0]!;
    for (const v of [a, b, c]) {
      normals[v * 3]! += nx;
      normals[v * 3 + 1]! += ny;
      normals[v * 3 + 2]! += nz;
    }
  }
  const out = new Float32Array(positions);
  for (let i = 0; i < positions.length / 3; i += 1) {
    const len = Math.hypot(normals[i * 3]!, normals[i * 3 + 1]!, normals[i * 3 + 2]!) || 1;
    for (let k = 0; k < 3; k += 1) out[i * 3 + k]! += (normals[i * 3 + k]! / len) * (0.008 + 0.006 * Math.max(0, centreZ - positions[i * 3 + 2]!) / (0.1 * s)) * s;
  }
  const kept: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    if (inHair(indices[t]!) && inHair(indices[t + 1]!) && inHair(indices[t + 2]!)) kept.push(indices[t]!, indices[t + 1]!, indices[t + 2]!);
  }
  return { positions: out, indices: Uint32Array.from(kept) };
};
