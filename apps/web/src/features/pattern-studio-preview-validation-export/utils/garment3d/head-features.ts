import { bodyLandmarks, bodyScale, type BodyMeasurements } from './body-model';

/**
 * Face and hair of the fitted human mesh, all generated from its own geometry (no downloaded asset):
 * landmarks (eyes, nose, mouth) found on the skin, per-vertex face colouring (lips, blush, brows, lash
 * line) and a hair mesh (long wavy locks or a short cut) built over the skull. Pure numbers, no
 * three.js: the viewer only adds materials and textures.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FaceLandmarks {
  /** Centre of the left (+x) eye opening; the right eye is its mirror image. */
  eye: Vec3;
  /** Half width / half height of the eye opening (m). */
  eyeHalf: { w: number; h: number };
  /** Depth of the eyelid rim in front of the opening. */
  rimZ: number;
  noseTip: Vec3;
  /** Middle of the line between the lips. */
  mouth: Vec3;
  /** Centre of the skull (for the hair) and the top of the head. */
  skull: Vec3;
  top: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Indices of the head and neck vertices (above the nape, within the neck's width: no shoulders). */
const headVertices = (positions: Float32Array, armWeights: Float32Array, body: BodyMeasurements): number[] => {
  const l = bodyLandmarks(body);
  const s = bodyScale(body);
  const out: number[] = [];
  for (let i = 0; i < armWeights.length; i += 1) {
    if (armWeights[i]! >= 0.5 || positions[i * 3 + 1]! < l.napeY + 0.01 * s) continue;
    if (Math.abs(positions[i * 3]!) > 0.1 * s) continue;
    out.push(i);
  }
  return out;
};

/**
 * The eye opening around a rough centre (left eye): front-most depth of the skin per 1 mm cell, then per
 * column the run of cells much deeper than the lids around it. Returns the opening's centre, half
 * width and half height, and the depth of the lids' front surface.
 */
export const eyeOpening = (
  positions: Float32Array,
  indices: Uint32Array | undefined,
  face: number[],
  seed: Vec3,
  s: number,
): { x: number; y: number; w: number; h: number; lidZ: number } | null => {
  const CELL = 0.001;
  const NX = Math.round((0.05 * s) / CELL);
  const NY = Math.round((0.05 * s) / CELL);
  const x0 = seed.x - (NX / 2) * CELL;
  const y0 = seed.y - 0.02 * s;
  const depth = new Float32Array(NX * NY).fill(-Infinity);
  const mark = (px: number, py: number, pz: number): void => {
    const cx = Math.floor((Math.abs(px) - x0) / CELL);
    const cy = Math.floor((py - y0) / CELL);
    if (cx < 0 || cy < 0 || cx >= NX || cy >= NY) return;
    depth[cy * NX + cx] = Math.max(depth[cy * NX + cx]!, pz);
  };
  for (const i of face) mark(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!);
  // With the triangles, their surface is sampled every ~0.4 mm (the scan's vertices are 2–3 mm apart).
  if (indices) {
    const inFace = new Uint8Array(positions.length / 3);
    for (const i of face) inFace[i] = 1;
    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t]!;
      const b = indices[t + 1]!;
      const c = indices[t + 2]!;
      if (!inFace[a] || !inFace[b] || !inFace[c]) continue;
      const edge = Math.max(
        Math.hypot(positions[a * 3]! - positions[b * 3]!, positions[a * 3 + 1]! - positions[b * 3 + 1]!),
        Math.hypot(positions[b * 3]! - positions[c * 3]!, positions[b * 3 + 1]! - positions[c * 3 + 1]!),
        Math.hypot(positions[c * 3]! - positions[a * 3]!, positions[c * 3 + 1]! - positions[a * 3 + 1]!),
      );
      const n = Math.min(24, Math.ceil(edge / 0.0004));
      for (let u = 0; u <= n; u += 1) {
        for (let v = 0; u + v <= n; v += 1) {
          const wa = u / n;
          const wb = v / n;
          const wc = 1 - wa - wb;
          mark(
            positions[a * 3]! * wa + positions[b * 3]! * wb + positions[c * 3]! * wc,
            positions[a * 3 + 1]! * wa + positions[b * 3 + 1]! * wb + positions[c * 3 + 1]! * wc,
            positions[a * 3 + 2]! * wa + positions[b * 3 + 2]! * wb + positions[c * 3 + 2]! * wc,
          );
        }
      }
    }
  }
  // Without triangles, each cell reads the front-most skin within ±2 mm sideways (sparse vertices).
  const reach = indices ? 0 : 2;
  const at = (cx: number, cy: number): number => {
    let best = -Infinity;
    for (let dx = -reach; dx <= reach; dx += 1) {
      const nx = cx + dx;
      if (nx >= 0 && nx < NX) best = Math.max(best, depth[cy * NX + nx]!);
    }
    return best;
  };
  const cols: Array<{ x: number; top: number; bottom: number; lid: number }> = [];
  for (let cx = 0; cx < NX; cx += 1) {
    const zs: number[] = [];
    for (let cy = 0; cy < NY; cy += 1) zs.push(at(cx, cy));
    const finite = zs.filter((z) => Number.isFinite(z)).sort((a, b) => a - b);
    if (finite.length < NY / 2) continue;
    // The skin around: the column's median depth. The opening reaches ~2–3 cm behind it.
    const lid = finite[Math.floor(finite.length / 2)]!;
    // The run of deep cells nearest to the seed's height.
    const deep = zs.map((z) => !Number.isFinite(z) || z < lid - 0.015 * s);
    const seedCy = Math.round((seed.y - y0) / CELL);
    let best: [number, number] | null = null;
    for (let cy = 0; cy < NY; cy += 1) {
      if (!deep[cy]) continue;
      let end = cy;
      while (end + 1 < NY && deep[end + 1]) end += 1;
      const len = end - cy + 1;
      const centre = (cy + end) / 2;
      // An opening is 3–14 mm high and not at the window's border.
      if (len >= 3 && len <= 14 * s && cy > 0 && end < NY - 1) {
        if (!best || Math.abs(centre - seedCy) < Math.abs((best[0] + best[1]) / 2 - seedCy)) best = [cy, end];
      }
      cy = end;
    }
    // The lid margins' depth: just above and just below the opening.
    if (best) {
      const margin = (at(cx, Math.min(NY - 1, best[1] + 2)) + at(cx, Math.max(0, best[0] - 2))) / 2;
      cols.push({ x: x0 + (cx + 0.5) * CELL, top: y0 + (best[1] + 1) * CELL, bottom: y0 + best[0] * CELL, lid: margin });
    }
  }
  if (cols.length < 8) return null;
  // The longest contiguous set of columns is the opening.
  let run: typeof cols = [];
  let current: typeof cols = [];
  for (const c of cols) {
    if (current.length && c.x - current[current.length - 1]!.x > CELL * 1.5) current = [];
    current.push(c);
    if (current.length > run.length) run = current;
  }
  if (run.length < 8) return null;
  const xa = run[0]!.x;
  const xb = run[run.length - 1]!.x;
  const middle = run.filter((c) => Math.abs(c.x - (xa + xb) / 2) < (xb - xa) / 4);
  const y = middle.reduce((a, c) => a + (c.top + c.bottom) / 2, 0) / middle.length;
  const h = Math.max(...middle.map((c) => (c.top - c.bottom) / 2));
  const lidZ = middle.reduce((a, c) => a + c.lid, 0) / middle.length;
  if (!Number.isFinite(lidZ)) return null;
  return { x: (xa + xb) / 2, y, w: (xb - xa) / 2 + CELL / 2, h, lidZ };
};

/**
 * Finds the eyes (the deepest recesses of the upper face: the eye openings are closed by a membrane
 * set ~2–3 cm behind the lids), the nose tip (the most forward point under the eyes) and the mouth (the
 * crease between the lips, under the nose). Null when the mesh has no recognisable face.
 */
export const findFaceLandmarks = (
  positions: Float32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
  /** The mesh's triangles: the eye openings are then read on the surface, not only at the vertices. */
  indices?: Uint32Array,
): FaceLandmarks | null => {
  const s = bodyScale(body);
  const head = headVertices(positions, armWeights, body);
  if (head.length < 50) return null;
  let top = -Infinity;
  for (const i of head) top = Math.max(top, positions[i * 3 + 1]!);
  // Skull centre: middle of the head's box above the ears.
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  const crown = head.filter((i) => positions[i * 3 + 1]! > top - 0.1 * s);
  for (const i of crown) {
    x0 = Math.min(x0, positions[i * 3]!);
    x1 = Math.max(x1, positions[i * 3]!);
    z0 = Math.min(z0, positions[i * 3 + 2]!);
    z1 = Math.max(z1, positions[i * 3 + 2]!);
  }
  const skull = { x: (x0 + x1) / 2, y: top - 0.1 * s, z: (z0 + z1) / 2 };

  // Eyes: recess = (max z of the neighbours within 1.2 cm) − z, on the upper face.
  const face = head.filter((i) => {
    const y = positions[i * 3 + 1]!;
    return positions[i * 3 + 2]! > skull.z && y > top - 0.17 * s && y < top - 0.07 * s;
  });
  const recessed: number[] = [];
  for (const i of face) {
    const ax = Math.abs(positions[i * 3]!);
    if (ax < 0.015 * s || ax > 0.06 * s) continue;
    let around = -Infinity;
    for (const j of face) {
      const dx = positions[j * 3]! - positions[i * 3]!;
      const dy = positions[j * 3 + 1]! - positions[i * 3 + 1]!;
      if (dx * dx + dy * dy < (0.016 * s) ** 2) around = Math.max(around, positions[j * 3 + 2]!);
    }
    if (around - positions[i * 3 + 2]! > 0.018 * s) recessed.push(i);
  }
  const left = recessed.filter((i) => positions[i * 3]! > 0);
  const right = recessed.filter((i) => positions[i * 3]! < 0);
  if (left.length < 3 || right.length < 3) return null;
  // Both eyes averaged (mirrored) for a symmetric face.
  const both = [...left, ...right];
  const eye = {
    x: both.reduce((a, i) => a + Math.abs(positions[i * 3]!), 0) / both.length,
    y: both.reduce((a, i) => a + positions[i * 3 + 1]!, 0) / both.length,
    z: both.reduce((a, i) => a + positions[i * 3 + 2]!, 0) / both.length,
  };
  const spread = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.9)] ?? 0;
  };
  // The palpebral fissure is ~3 × 1 cm in adults: the measured opening is kept within that.
  let w = clamp(spread(both.map((i) => Math.abs(Math.abs(positions[i * 3]!) - eye.x))), 0.011 * s, 0.0145 * s);
  let h = clamp(spread(both.map((i) => Math.abs(positions[i * 3 + 1]! - eye.y))), 0.0035 * s, 0.0055 * s);
  let rimZ = -Infinity;
  for (const i of face) {
    const dx = Math.abs(positions[i * 3]!) - eye.x;
    const dy = positions[i * 3 + 1]! - eye.y;
    if (dx * dx + dy * dy < (w + 0.004 * s) ** 2) rimZ = Math.max(rimZ, positions[i * 3 + 2]!);
  }
  // The recess (the opening plus the tunnel walls behind the lids) sits lower than the opening itself:
  // the opening is read column by column, as the run of heights where the front surface is missing
  // (only the membrane far behind is there), between the upper and the lower lid.
  const opening = eyeOpening(positions, indices, face, eye, s);
  if (opening) {
    eye.x = opening.x;
    eye.y = opening.y;
    w = opening.w;
    h = opening.h;
    rimZ = opening.lidZ;
  }

  // Nose tip: most forward point near the midline under the eyes.
  let noseTip = { x: 0, y: eye.y - 0.03 * s, z: -Infinity };
  for (const i of head) {
    const y = positions[i * 3 + 1]!;
    if (Math.abs(positions[i * 3]!) > 0.012 * s || y > eye.y - 0.005 * s || y < eye.y - 0.06 * s) continue;
    if (positions[i * 3 + 2]! > noseTip.z) noseTip = { x: 0, y, z: positions[i * 3 + 2]! };
  }
  // Mouth: the line between the lips is too shallow to find on the scan; anthropometry places it ~9 mm
  // under the peak of the upper lip, itself under the base of the nose (the first hollow under the tip).
  const profile: Array<{ y: number; z: number }> = [];
  for (let y = noseTip.y - 0.004 * s; y > noseTip.y - 0.045 * s; y -= 0.002) {
    let z = -Infinity;
    for (const i of head) {
      if (Math.abs(positions[i * 3]!) < 0.008 * s && Math.abs(positions[i * 3 + 1]! - y) < 0.0025) z = Math.max(z, positions[i * 3 + 2]!);
    }
    if (Number.isFinite(z)) profile.push({ y, z });
  }
  let base = profile.findIndex((p, k) => k > 0 && k < profile.length - 1 && p.z <= profile[k - 1]!.z && p.z < profile[k + 1]!.z);
  if (base < 0) base = Math.min(profile.length - 1, 4);
  let peak = profile[base] ?? { y: noseTip.y - 0.02 * s, z: noseTip.z };
  for (const p of profile.slice(base, base + 10)) if (p.z > peak.z) peak = p;
  const mouth = { x: 0, y: peak.y - 0.009 * s, z: peak.z - 0.004 * s };
  return { eye, eyeHalf: { w, h }, rimZ, noseTip, mouth, skull, top };
};

/** Eyeball radius and centre (left eye) from the landmarks: the cornea just behind the lids. */
export const eyeball = (f: FaceLandmarks, body: BodyMeasurements): { radius: number; centre: Vec3 } => {
  // ~24 mm across in adults, barely smaller in children (the eye grows little after infancy).
  const radius = 0.012 * Math.pow(bodyScale(body), 0.3);
  // The cornea sits just behind the lids' front surface: the lids frame it, it never bulges through them.
  return { radius, centre: { x: f.eye.x, y: f.eye.y, z: f.rimZ - 0.0012 - radius } };
};

/**
 * Sculpts the scan's face towards a portrait model's (fuller lips, eyes opened a little): returns new
 * positions and the landmarks moved with them. Small, smooth displacements around the landmarks only.
 */
export const sculptFace = (
  positions: Float32Array,
  f: FaceLandmarks,
  body: BodyMeasurements,
): { positions: Float32Array; face: FaceLandmarks } => {
  const s = bodyScale(body);
  const out = Float32Array.from(positions);
  const { w, h } = f.eyeHalf;
  // Upper lid up, lower lid down: the scan's fissure (~2 × 0.7 cm) is narrower than a portrait's.
  const up = 0.0013 * s;
  const down = 0.0005 * s;
  // Lips: the upper lip comes forward (the scan's is thin and recessed), the lower a little less.
  const lipW = 0.023 * s;
  for (let i = 0; i < out.length; i += 3) {
    const z = out[i + 2]!;
    if (z < f.skull.z) continue;
    const x = Math.abs(out[i]!);
    const y = out[i + 1]!;
    // Eyes.
    const dx = x - f.eye.x;
    const dy = y - f.eye.y;
    const e = Math.hypot(dx / w, dy / h);
    if (e < 4) {
      const ring = e < 1 ? Math.abs(dy) / h : Math.exp(-(((e - 1) / 1.6) ** 2)) * (1 - smooth((Math.abs(dx) - w) / (0.008 * s)));
      out[i + 1] = y + (dy > 0 ? up : -down) * ring;
    }
    // Lips.
    const across = 1 - (x / lipW) ** 2;
    if (across > 0) {
      const my = y - f.mouth.y;
      const upper = Math.exp(-(((my - 0.0045 * s) / (0.0045 * s)) ** 2));
      const lower = Math.exp(-(((my + 0.0055 * s) / (0.005 * s)) ** 2));
      // Deeper corners and line between the lips.
      const line = Math.exp(-((my / (0.0018 * s)) ** 2));
      out[i + 2] = z + Math.pow(across, 0.6) * (0.0018 * s * upper + 0.0008 * s * lower - 0.0006 * s * line);
    }
  }
  const face: FaceLandmarks = {
    ...f,
    eye: { ...f.eye, y: f.eye.y + (up - down) / 2 },
    eyeHalf: { w, h: h + (up + down) / 2 },
  };
  return { positions: out, face };
};

const hex = (value: string): [number, number, number] => {
  const v = parseInt(value.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

/** Small deterministic hash noise in [0, 1). */
const noise = (x: number, y: number): number => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Per-vertex colours (linear RGB, as three.js expects vertex colours) of the skin: base tone, warm lips,
 * a soft blush on the cheeks, eyebrows and a darker lash line around the eyes.
 */
export const faceColors = (
  positions: Float32Array,
  f: FaceLandmarks | null,
  skin: string,
  hair: string,
  body: BodyMeasurements,
  /** Adult man: short stubble beard (jaw, chin, moustache), less colour on the lips and cheeks. */
  beard = false,
): Float32Array => {
  const s = bodyScale(body);
  const base = hex(skin);
  const lip: [number, number, number] = [0.76, 0.42, 0.41];
  const blush: [number, number, number] = [0.86, 0.55, 0.5];
  const brow = hex(hair);
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    let c: [number, number, number] = [base[0], base[1], base[2]];
    const mix = (to: [number, number, number], t: number): void => {
      if (t <= 0) return;
      c = [lerp(c[0], to[0], t), lerp(c[1], to[1], t), lerp(c[2], to[2], t)];
    };
    if (f && positions[i + 2]! > f.skull.z) {
      const x = Math.abs(positions[i]!);
      const y = positions[i + 1]!;
      // Lips: an ellipse around the mouth line, fuller under it.
      const lx = x / (0.024 * s);
      const ly = (y - f.mouth.y) / ((y > f.mouth.y ? 0.008 : 0.01) * s);
      const onLips = 1 - smooth((Math.hypot(lx, ly) - 0.7) / 0.35);
      mix(lip, (beard ? 0.4 : 0.68) * onLips);
      // Warmer nose tip.
      const nx = x / (0.012 * s);
      const ny = (y - f.noseTip.y) / (0.012 * s);
      mix(blush, 0.15 * Math.exp(-(nx * nx + ny * ny)));
      // Blush on the cheekbones.
      const bx = (x - f.eye.x * 1.15) / (0.022 * s);
      const by = (y - (f.eye.y - 0.028 * s)) / (0.016 * s);
      mix(blush, (beard ? 0.1 : 0.22) * Math.exp(-(bx * bx + by * by)));
      // Stubble: under a line from the sideburn to the corner of the mouth, down under the chin, and
      // the moustache; speckled like short hairs, never on the lips.
      if (beard) {
        const cheekLine = lerp(f.mouth.y + 0.014 * s, f.eye.y - 0.014 * s, smooth((x - 0.026 * s) / (0.038 * s)));
        const under = smooth((cheekLine - y) / (0.008 * s));
        // The beard stops under the jaw: low at the chin, rising towards the ears.
        const jaw = lerp(f.mouth.y - 0.058 * s, f.mouth.y - 0.02 * s, smooth((x - 0.02 * s) / (0.045 * s)));
        const chin = smooth((y - jaw) / (0.008 * s));
        const side = 1 - smooth((x - 0.07 * s) / (0.008 * s));
        const moustache =
          smooth((f.noseTip.y - 0.011 * s - y) / (0.004 * s)) * (1 - smooth((x - 0.026 * s) / (0.006 * s)));
        const area = Math.max(under, moustache) * chin * side * (1 - onLips);
        const speckle = 0.55 + 0.45 * noise(Math.round(x * 2500), Math.round(y * 2500));
        mix(brow, 0.38 * area * speckle);
      }
      // Eyebrows: an arch over each eye, thicker inside, with hair-like noise.
      const t = (x - (f.eye.x - 0.022 * s)) / (0.046 * s);
      if (t > 0 && t < 1) {
        const archY = f.eye.y + f.eyeHalf.h + 0.009 * s + 0.004 * s * Math.sin(Math.PI * Math.min(1, t * 1.3));
        const thick = (0.0042 - 0.0022 * t) * s;
        const d = Math.abs(y - archY) / thick;
        const strands = 0.75 + 0.25 * noise(Math.round(x * 4000), Math.round(y * 900));
        mix(brow, 0.85 * strands * (1 - smooth(d - 0.4)) * smooth(t / 0.08) * (1 - smooth((t - 0.88) / 0.12)));
      }
      // Lash line: a dark ring just around the opening (upper lid darker).
      const ex = (x - f.eye.x) / (f.eyeHalf.w * 1.08);
      const ey = (y - f.eye.y) / (f.eyeHalf.h * 1.25);
      const ring = Math.hypot(ex, ey);
      const lash = (1 - smooth(Math.abs(ring - 1) / 0.22)) * (y > f.eye.y ? 0.85 : 0.45);
      mix([0.12, 0.08, 0.07], lash);
    }
    // three.js vertex colours are linear: convert from sRGB.
    out[i] = c[0] ** 2.2;
    out[i + 1] = c[1] ** 2.2;
    out[i + 2] = c[2] ** 2.2;
  }
  return out;
};

export interface HairMesh {
  positions: Float32Array;
  indices: Uint32Array;
  /** u around a lock (or across the scalp), v along it (0 at the root, 1 at the tip). */
  uvs: Float32Array;
  /** Linear light factor per vertex (roots and the underside of each lock darker): sculpted depth. */
  shade: Float32Array;
  /** Coverage per vertex: the viewer cuts the hair where it is under ½ (the scalp layer's edge). */
  alpha: Float32Array;
}

/** Long wavy hair with a middle parting (women, girls) or a short textured cut (men, boys). */
export type HairStyle = 'long' | 'short';

/** Radial height field of the skull about its centre: the shell that hair lies on. */
const skullShell = (positions: Float32Array, head: number[], C: Vec3) => {
  const AZ = 72;
  const EL = 36;
  const field = new Float32Array(AZ * EL);
  for (const i of head) {
    const dx = positions[i * 3]! - C.x;
    const dy = positions[i * 3 + 1]! - C.y;
    const dz = positions[i * 3 + 2]! - C.z;
    const r = Math.hypot(dx, dy, dz);
    if (r < 1e-6) continue;
    const a = Math.round(((Math.atan2(dx, dz) + Math.PI) / (2 * Math.PI)) * AZ) % AZ;
    const e = clamp(Math.round(((Math.asin(clamp(dy / r, -1, 1)) + Math.PI / 2) / Math.PI) * (EL - 1)), 0, EL - 1);
    field[e * AZ + a] = Math.max(field[e * AZ + a]!, r);
  }
  // Fill empty bins and blur (the hair does not follow the ears or the hollows), never far under the
  // local maximum: a shell outside the head. Two passes only: more would smear the back of the skull
  // down over the neck (a skirt of hair standing off the nape).
  let grid = field;
  for (let pass = 0; pass < 6; pass += 1) {
    const fillOnly = pass >= 2;
    const next = new Float32Array(grid.length);
    for (let e = 0; e < EL; e += 1) {
      for (let a = 0; a < AZ; a += 1) {
        let sum = 0;
        let weight = 0;
        let peak = 0;
        for (let de = -1; de <= 1; de += 1) {
          for (let da = -1; da <= 1; da += 1) {
            const v = grid[clamp(e + de, 0, EL - 1) * AZ + ((a + da + AZ) % AZ)]!;
            if (v <= 0) continue;
            sum += v;
            weight += 1;
            peak = Math.max(peak, v);
          }
        }
        const own = grid[e * AZ + a]!;
        if (fillOnly) next[e * AZ + a] = own > 0 ? own : weight ? sum / weight : 0;
        else next[e * AZ + a] = weight ? Math.max(sum / weight, peak * 0.97) : 0;
      }
    }
    grid = next;
  }
  const radius = (dx: number, dy: number, dz: number): number => {
    const r = Math.hypot(dx, dy, dz) || 1;
    const fa = (((Math.atan2(dx, dz) + Math.PI) / (2 * Math.PI)) * AZ + AZ) % AZ;
    const fe = clamp(((Math.asin(clamp(dy / r, -1, 1)) + Math.PI / 2) / Math.PI) * (EL - 1), 0, EL - 1);
    const a0 = Math.floor(fa);
    const e0 = Math.min(EL - 2, Math.floor(fe));
    const g = (e: number, a: number): number => grid[e * AZ + (a % AZ)]!;
    return lerp(lerp(g(e0, a0), g(e0, a0 + 1), fa - a0), lerp(g(e0 + 1, a0), g(e0 + 1, a0 + 1), fa - a0), fe - e0);
  };
  /** Point of the shell (plus `lift`) in the direction (dx, dy, dz) from the skull centre. */
  return (dx: number, dy: number, dz: number, lift: number): Vec3 => {
    const len = Math.hypot(dx, dy, dz) || 1;
    const r = radius(dx, dy, dz) + lift;
    return { x: C.x + (dx / len) * r, y: C.y + (dy / len) * r, z: C.z + (dz / len) * r };
  };
};

/**
 * Radial hull of the body about the neck's vertical axis, per height and direction (head, neck,
 * shoulders, chest; not the arms): hanging hair is kept outside it, so it rests on the shoulders.
 */
const bodyHull = (positions: Float32Array, armWeights: Float32Array, axisZ: number, y0: number, y1: number) => {
  const STEP = 0.005;
  const NY = Math.max(2, Math.ceil((y1 - y0) / STEP) + 1);
  const NT = 72;
  let hull = new Float32Array(NY * NT);
  for (let i = 0; i < armWeights.length; i += 1) {
    if (armWeights[i]! >= 0.5) continue;
    const y = positions[i * 3 + 1]!;
    if (y < y0 || y > y1) continue;
    const x = positions[i * 3]!;
    const z = positions[i * 3 + 2]! - axisZ;
    const b = Math.round((y - y0) / STEP);
    const t = Math.round(((Math.atan2(x, z) + Math.PI) / (2 * Math.PI)) * NT) % NT;
    hull[b * NT + t] = Math.max(hull[b * NT + t]!, Math.hypot(x, z));
  }
  // Max over the neighbours (no hair slipping between two vertices), twice.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = new Float32Array(hull.length);
    for (let b = 0; b < NY; b += 1) {
      for (let t = 0; t < NT; t += 1) {
        let m = 0;
        for (let db = -1; db <= 1; db += 1) {
          for (let dt = -1; dt <= 1; dt += 1) m = Math.max(m, hull[clamp(b + db, 0, NY - 1) * NT + ((t + dt + NT) % NT)]!);
        }
        next[b * NT + t] = m;
      }
    }
    hull = next;
  }
  return (x: number, y: number, z: number): number => {
    const fb = clamp((y - y0) / STEP, 0, NY - 1.001);
    const ft = (((Math.atan2(x, z - axisZ) + Math.PI) / (2 * Math.PI)) * NT + NT) % NT;
    const b0 = Math.floor(fb);
    const t0 = Math.floor(ft);
    const g = (b: number, t: number): number => hull[b * NT + (t % NT)]!;
    return lerp(lerp(g(b0, t0), g(b0, t0 + 1), ft - t0), lerp(g(b0 + 1, t0), g(b0 + 1, t0 + 1), ft - t0), fb - b0);
  };
};

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vec3, b: Vec3, k = 1): Vec3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** One lock: its centre line (on the scalp, then hanging) and the outward direction at each point. */
interface Lock {
  path: Vec3[];
  out: Vec3[];
  /** Thickness factor per path point (thin where the lock lies on the head, full where it hangs). */
  scale: number[];
  width: number;
  thick: number;
  /** Fraction of the length over which the lock tapers to its tip. */
  taper: number;
  tint: number;
}

/** Resamples a polyline to n + 1 points evenly spaced along its length. */
const resample = (pts: Vec3[], n: number): Vec3[] => {
  const arc = [0];
  for (let q = 1; q < pts.length; q += 1) arc.push(arc[q - 1]! + Math.hypot(pts[q]!.x - pts[q - 1]!.x, pts[q]!.y - pts[q - 1]!.y, pts[q]!.z - pts[q - 1]!.z));
  const total = arc[arc.length - 1]! || 1e-9;
  const out: Vec3[] = [];
  let q = 0;
  for (let r = 0; r <= n; r += 1) {
    const target = (r / n) * total;
    while (q < arc.length - 2 && arc[q + 1]! < target) q += 1;
    const t = clamp((target - arc[q]!) / (arc[q + 1]! - arc[q]! || 1), 0, 1);
    const a = pts[q]!;
    const b = pts[Math.min(q + 1, pts.length - 1)]!;
    out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });
  }
  return out;
};

const SEGMENTS = 36;
const SIDES = 8;

/** Flattened tube around each lock's centre line, lying on its inner face, tapered to the tip. */
const lockMesh = (locks: Lock[]): HairMesh => {
  const pts: number[] = [];
  const uvs: number[] = [];
  const shade: number[] = [];
  const indices: number[] = [];
  for (const lock of locks) {
    if (lock.path.length < 2) continue;
    const path = resample(lock.path, SEGMENTS);
    const outs = resample(lock.out, SEGMENTS);
    const scales = resample(
      lock.scale.map((k) => ({ x: k, y: 0, z: 0 })),
      SEGMENTS,
    ).map((v) => v.x);
    const base = pts.length / 3;
    for (let r = 0; r <= SEGMENTS; r += 1) {
      const t = r / SEGMENTS;
      const p = path[r]!;
      const tangent = unit(sub(path[Math.min(SEGMENTS, r + 1)]!, path[Math.max(0, r - 1)]!));
      const o = outs[r]!;
      const n = unit(sub(o, { x: tangent.x * dot(o, tangent), y: tangent.y * dot(o, tangent), z: tangent.z * dot(o, tangent) }));
      const b = cross(tangent, n);
      // Narrow at the root, full in the length, a point at the tip.
      const body = (0.6 + 0.4 * smooth(t / 0.25)) * Math.pow(1 - smooth((t - (1 - lock.taper)) / lock.taper), 0.5);
      const w = (lock.width / 2) * body;
      const h = (lock.thick / 2) * Math.max(body, 0.15) * scales[r]!;
      for (let k = 0; k < SIDES; k += 1) {
        const phi = (k / SIDES) * 2 * Math.PI;
        // Lens-shaped section: rounded on the outside, flatter underneath.
        const sn = Math.sin(phi);
        const across = Math.cos(phi) * w;
        const up = (sn > 0 ? sn : sn * 0.6) * h + h * 0.6;
        pts.push(p.x + b.x * across + n.x * up, p.y + b.y * across + n.y * up, p.z + b.z * across + n.z * up);
        uvs.push(k / SIDES, t);
        // Underside and roots in shadow, the lock's own tone.
        shade.push(lock.tint * (0.7 + 0.3 * (0.5 + 0.5 * sn)) * (0.75 + 0.25 * smooth(t / 0.12)));
      }
    }
    for (let r = 0; r < SEGMENTS; r += 1) {
      for (let k = 0; k < SIDES; k += 1) {
        const a = base + r * SIDES + k;
        const b = base + r * SIDES + ((k + 1) % SIDES);
        const c = a + SIDES;
        const d = b + SIDES;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  return {
    positions: Float32Array.from(pts),
    indices: Uint32Array.from(indices),
    uvs: Float32Array.from(uvs),
    shade: Float32Array.from(shade),
    alpha: new Float32Array(shade.length).fill(1),
  };
};

const merge = (parts: HairMesh[]): HairMesh => {
  let nv = 0;
  let ni = 0;
  for (const m of parts) {
    nv += m.positions.length / 3;
    ni += m.indices.length;
  }
  const positions = new Float32Array(nv * 3);
  const uvs = new Float32Array(nv * 2);
  const shade = new Float32Array(nv);
  const alpha = new Float32Array(nv);
  const indices = new Uint32Array(ni);
  let ov = 0;
  let oi = 0;
  for (const m of parts) {
    positions.set(m.positions, ov * 3);
    uvs.set(m.uvs, ov * 2);
    shade.set(m.shade, ov);
    alpha.set(m.alpha, ov);
    for (let i = 0; i < m.indices.length; i += 1) indices[oi + i] = m.indices[i]! + ov;
    ov += m.positions.length / 3;
    oi += m.indices.length;
  }
  return { positions, indices, uvs, shade, alpha };
};

/**
 * Hair built over the skull from the mesh itself. A thin scalp layer covers the whole hair area (no
 * bald patch between the locks), and sculpted locks lie on it: from a middle parting, sweeping over the
 * head and falling in waves to the shoulders (long), or short on the sides and back with a textured top
 * brushed up and back (short).
 */
export const buildHair = (
  positions: Float32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
  f: FaceLandmarks,
  style: HairStyle,
): HairMesh => {
  // Head scale (1 for an adult): a child's head is nearly adult-sized, unlike the body.
  const s = (f.top - f.eye.y) / 0.111;
  const C = f.skull;
  const l = bodyLandmarks(body);
  const shell = skullShell(positions, headVertices(positions, armWeights, body), C);
  const rnd = (a: number, b: number): number => noise(a * 3.7 + 1.3, b * 5.1 + 2.9);
  const short = style === 'short';

  // Hairline: ~6 cm above the eyes, an almost flat arc that curves down at the temples.
  // A man's hairline recedes a little at the temples.
  const hairlineY = (ax: number): number =>
    f.eye.y +
    s * (0.058 - 0.02 * Math.min(1, ax / (0.066 * s)) ** 4) +
    (short ? 0.01 * s * Math.exp(-(((ax - 0.045 * s) / (0.016 * s)) ** 2)) : 0);
  // Lowest hair per direction around the head (0 = front): temples, in front of and over the ears, nape.
  const az = (p: Vec3): number => Math.abs(Math.atan2(p.x - C.x, p.z - C.z));
  const lowest = (a: number): number => {
    const deg = (a * 180) / Math.PI;
    const table: Array<[number, number]> = [
      [0, f.eye.y - 0.02 * s],
      [55, f.eye.y + 0.025 * s],
      [70, f.eye.y + 0.012 * s],
      [82, f.eye.y - 0.004 * s],
      [95, f.eye.y + 0.016 * s],
      [118, f.eye.y + 0.01 * s],
      [140, l.napeY + 0.065 * s],
      [180, l.napeY + (short ? 0.055 : 0.035) * s],
    ];
    for (let k = 1; k < table.length; k += 1) {
      if (deg <= table[k]![0]) {
        const [d0, y0] = table[k - 1]!;
        const [d1, y1] = table[k]!;
        return lerp(y0, y1, smooth((deg - d0) / (d1 - d0)));
      }
    }
    return table[table.length - 1]![1];
  };

  // Signed distance (m) from the edge of the hair area, positive inside it: above the hairline on the
  // forehead, above the temples, the ears and the nape elsewhere. A little noise: a natural hairline.
  const margin = (p: Vec3): number => {
    // The face: a half ellipse from the hairline down past the eyes, its sides rounding into the temples.
    const ax = Math.abs(p.x);
    const yc = f.eye.y - 0.02 * s;
    const fx = ax / (0.068 * s);
    const fy = (p.y - yc) / (hairlineY(ax) - yc);
    // A man's hairline is squarer (a superellipse), a woman's or a child's rounder.
    const n = short ? 4 : 2;
    const face = p.y < yc ? ax - 0.068 * s : ((fx ** n + Math.max(0, fy) ** n) ** (1 / n) - 1) * 0.05 * s;
    const fuzz = 0.0006 * s * Math.sin((Math.abs(p.x) * 420) / s) * Math.sin((p.y * 260 + Math.abs(p.x) * 150) / s);
    return Math.min(p.z - C.z < 0.012 * s ? Infinity : face, p.y - lowest(az(p))) + fuzz;
  };
  // Thickness of the hair mass over the scalp: volume on the top (and a front lift for the short cut).
  const volume = (dir: Vec3): number => {
    const top = smooth((Math.asin(clamp(dir.y, -1, 1)) - 0.15) / 0.7);
    if (!short) return s * (0.007 + 0.006 * top);
    // Short cut: grooves along the brushing (front to back on the top, downwards on the sides), as on a
    // sculpted head: the mass reads as hair, not as a cap.
    const across = Math.atan2(dir.x, Math.abs(dir.z) + 0.3) * 9 + 2.5 * noise(Math.round(dir.y * 12), 1);
    const groove = Math.pow(Math.abs(Math.sin(across * Math.PI)), 0.6);
    return s * (0.0025 + top * (0.007 + 0.006 * Math.max(0, dir.z)) * (0.75 + 0.25 * groove) + 0.0008 * groove);
  };

  // 1. Scalp layer over the hair area. Its edge is cut by the vertex alpha (alpha test at ½), so the
  // hairline follows the margin's zero line smoothly instead of the grid's cells.
  const scalp: HairMesh = (() => {
    const A = 160;
    const E = 72;
    const pts: number[] = [];
    const uvs: number[] = [];
    const shade: number[] = [];
    const alpha: number[] = [];
    const indices: number[] = [];
    const index = new Int32Array((A + 1) * (E + 1)).fill(-1);
    for (let e = 0; e <= E; e += 1) {
      const el = lerp(-0.45 * Math.PI, 0.5 * Math.PI, e / E);
      for (let a = 0; a <= A; a += 1) {
        const ang = (a / A) * 2 * Math.PI - Math.PI;
        const dir = { x: Math.sin(ang) * Math.cos(el), y: Math.sin(el), z: Math.cos(ang) * Math.cos(el) };
        const onSkin = shell(dir.x, dir.y, dir.z, 0);
        const m = margin(onSkin);
        if (m < -0.006 * s) continue;
        // The mass thins out over the last centimetre before the edge.
        const lift = Math.max(0.0008 * s, volume(dir) * smooth(m / ((short ? 0.022 : 0.025) * s)));
        const p = shell(dir.x, dir.y, dir.z, lift);
        index[e * (A + 1) + a] = pts.length / 3;
        pts.push(p.x, p.y, p.z);
        uvs.push((a / A) * 30, (e / E) * 3);
        shade.push(0.6 + 0.3 * smooth(m / (0.01 * s)));
        alpha.push(clamp(0.5 + m / (0.004 * s), 0, 1));
      }
    }
    for (let e = 0; e < E; e += 1) {
      for (let a = 0; a < A; a += 1) {
        const i0 = index[e * (A + 1) + a]!;
        const i1 = index[e * (A + 1) + a + 1]!;
        const i2 = index[(e + 1) * (A + 1) + a]!;
        const i3 = index[(e + 1) * (A + 1) + a + 1]!;
        if (i0 >= 0 && i1 >= 0 && i2 >= 0) indices.push(i0, i1, i2);
        if (i1 >= 0 && i3 >= 0 && i2 >= 0) indices.push(i1, i3, i2);
      }
    }
    return {
      positions: Float32Array.from(pts),
      indices: Uint32Array.from(indices),
      uvs: Float32Array.from(uvs),
      shade: Float32Array.from(shade),
      alpha: Float32Array.from(alpha),
    };
  })();
  // Locks curve down over the corners of the forehead (a curtain from the parting, as on a portrait) but
  // never over the face: a point under that curtain line goes up to it, then back on the shell.
  const curtainY = (ax: number): number => hairlineY(0) + 0.004 * s - 0.04 * s * Math.min(1, ax / (0.066 * s)) ** 2;
  const outOfFace = (p: Vec3, lift: number): Vec3 => {
    const ax = Math.abs(p.x);
    if (p.z - C.z < 0.012 * s || ax > 0.066 * s || p.y >= curtainY(ax)) return p;
    const q = { x: p.x, y: curtainY(ax), z: p.z };
    return shell(q.x - C.x, q.y - C.y, q.z - C.z, lift);
  };
  const radial = (p: Vec3): Vec3 => unit(sub(p, C));

  const locks: Lock[] = [];
  if (!short) {
    // 2. Long hair: locks from the parting over the head, then hanging in waves to the shoulders.
    let axisZ = 0;
    let count = 0;
    for (let i = 0; i < armWeights.length; i += 1) {
      const y = positions[i * 3 + 1]!;
      if (armWeights[i]! < 0.5 && Math.abs(y - l.napeY) < 0.015 * s && Math.abs(positions[i * 3]!) < 0.05 * s) {
        axisZ += positions[i * 3 + 2]!;
        count += 1;
      }
    }
    axisZ = count ? axisZ / count : C.z;
    const hemSide = f.mouth.y - 0.12 * s;
    const hemBack = f.mouth.y - 0.16 * s;
    const hull = bodyHull(positions, armWeights, axisZ, hemBack - 0.06 * s, f.top + 0.02 * s);
    const FRONT = 15;
    const BACK = 17;
    for (const layer of [0, 1]) {
      for (const side of [1, -1]) {
        for (let c = 0; c < FRONT + BACK; c += 1) {
          const front = c < FRONT;
          const k = front ? (c + 0.5 * layer + 0.25) / FRONT : (c - FRONT + 0.5 * layer + 0.25) / BACK;
          const seed = rnd(c + layer * 50, side);
          const above = (layer ? 0.003 : 0.001) * s;
          // On the head: from the parting (front locks) or the crown (back locks) down past the widest.
          // A front lock turns towards the side as it goes down: it frames the face, never crosses it.
          // Front locks: from a point of the parting (front hairline → crown) diagonally down to the side
          // of the head, over the corner of the forehead for the first ones.
          const phi = lerp(0.95, -0.15, k);
          const root = { x: 0, y: Math.cos(phi), z: Math.sin(phi) };
          const end = unit({ x: side, y: -0.12, z: lerp(0.6, -0.15, k) });
          const path: Vec3[] = [];
          const outs: Vec3[] = [];
          const scale: number[] = [];
          const STEPS = 40;
          for (let q = 0; q <= STEPS; q += 1) {
            const beta = (q / STEPS) * Math.PI * 0.52;
            let dir: Vec3;
            if (front) {
              // Along the great circle from the root to the end, bulging up (hair lifts off the parting).
              const t = q / STEPS;
              dir = {
                x: lerp(root.x, end.x, t),
                y: lerp(root.y, end.y, t) + 0.25 * Math.sin(Math.PI * t) * (1 - t),
                z: lerp(root.z, end.z, t),
              };
            } else {
              const g = (Math.PI / 2) * (1 + k);
              dir = { x: Math.sin(beta) * Math.sin(g) * side, y: Math.cos(beta), z: Math.sin(beta) * Math.cos(g) };
            }
            const lift = volume(unit(dir)) + above;
            const p = outOfFace(shell(dir.x, dir.y, dir.z, lift), lift);
            path.push(p);
            outs.push(radial(p));
            scale.push(lerp(0.18, 0.5, smooth((q / STEPS - 0.6) / 0.4)));
          }
          // Hanging: gravity bends the lock down; it slides over the cheeks and the neck, and stops where
          // it lands on the shoulders.
          const angle = az(path[path.length - 1]!);
          const hem = lerp(hemSide, hemBack, smooth((angle - Math.PI / 2) / (Math.PI / 2))) - (seed - 0.5) * 0.03 * s;
          let p = path[path.length - 1]!;
          let d = unit(add(unit(sub(p, path[path.length - 2]!)), { x: 0, y: -1, z: 0 }, 0.6));
          const step = 0.004 * s;
          const gap = (layer ? 0.008 : 0.005) * s;
          const hang: Vec3[] = [];
          // Pushed out by the shoulders by more than ~2 cm in all: the lock rests there and ends.
          let pushed = 0;
          for (let q = 0; q < 120 && p.y > hem; q += 1) {
            d = unit(add(d, { x: 0, y: -1, z: 0 }, 0.2));
            p = add(p, d, step);
            const r = Math.hypot(p.x, p.z - axisZ) || 1e-6;
            const min = hull(p.x, p.y, p.z) + gap;
            if (r < min) {
              if (p.y < f.mouth.y - 0.05 * s) pushed += min - r;
              if (pushed > 0.01 * s) break;
              p = { x: (p.x / r) * min, y: p.y, z: axisZ + ((p.z - axisZ) / r) * min };
            }
            hang.push(p);
          }
          // Waves: an S along the lock, growing towards the ends; neighbours in step (clumps).
          const wavelength = 0.075 * s;
          // Neighbours nearly in step: the hair waves as a mass, in clumps.
          const phase = c * 0.45 + seed * 0.7 + layer * 0.9;
          let travelled = 0;
          hang.forEach((h, q) => {
            if (q > 0) travelled += Math.hypot(h.x - hang[q - 1]!.x, h.y - hang[q - 1]!.y, h.z - hang[q - 1]!.z);
            const amp = 0.006 * s * smooth(travelled / (0.06 * s));
            const outPhase = (2 * Math.PI * travelled) / wavelength + c * 1.3 + layer * 2;
            const o = unit({ x: h.x, y: 0, z: h.z - axisZ });
            const along = { x: -o.z, y: 0, z: o.x };
            const w = (2 * Math.PI * travelled) / wavelength + phase;
            path.push(add(add(h, along, amp * Math.sin(w)), o, amp * 0.3 * (1 + Math.cos(outPhase))));
            outs.push(o);
            scale.push(lerp(0.5, 1, smooth(travelled / (0.07 * s))));
          });
          locks.push({
            path,
            out: outs,
            scale,
            width: (front ? 0.03 : 0.038) * s * (0.85 + 0.3 * seed),
            thick: 0.009 * s,
            taper: 0.25,
            tint: 0.85 + 0.25 * rnd(c * 2 + layer, side * 7),
          });
        }
      }
    }
  }
  return merge([scalp, lockMesh(locks)]);
};
