import { ANGLES, pointAt, ringCurve, type BodyEnvelope } from './body-envelope';

/** Raw triangle mesh of a collar half (same layout as a draped panel). */
export interface CollarMesh {
  positions: number[];
  indices: number[];
  border: number[];
  uvs: number[];
}

/** What a collar piece of the pattern looks like once reduced to what the 3D needs. */
export type CollarKind = 'BAND' | 'SHIRT' | 'SHAWL' | 'TIE';

export interface CollarSpec {
  kind: CollarKind;
  /** Length of the piece (mm): the neck circumference of a band, the whole run of a shawl or a tie. */
  lengthMm: number;
  /** Width of the piece (mm). */
  heightMm: number;
}

const normalize = (name: string): string => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Collar kind of a piece, from its name; null when the piece is not a collar. */
export const collarKindOf = (name: string): CollarKind | null => {
  const n = normalize(name);
  if (n.includes('lavalliere')) return 'TIE';
  if (n.includes('chale')) return 'SHAWL';
  if (n.includes('officier')) return 'BAND';
  if (n.startsWith('col') && !n.includes('benitier')) return n.includes('chemise') || n.includes('pied') ? 'SHIRT' : 'BAND';
  return null;
};

/** A band collar: its lower edge this far above the nape at the back, this much lower at the front (m). */
const BAND_NAPE_RISE = 0.004;
const BAND_FRONT_DROP = 0.03;
/** A band collar's lower edge is at most this much wider than its upper edge. */
const BAND_FLARE = 1.12;
/** ...and this much more behind the neck (where it widens into the upper back), at its very bottom. */
const BAND_BACK_FLARE = 0.45;
/** Share of the band's height (from its bottom) over which it flares out behind the neck. */
const BAND_FLARE_SHARE = 0.4;
/** Air + cloth between the neck and a band collar (m), and the extra at the nape. */
const BAND_LIFT = 0.005;
const BAND_NAPE_LIFT = 0.012;
/** Lift of a collar above the cloth under it (m): it is sewn on the neckline, on top of the bodice. */
const COLLAR_LIFT = 0.012;
/** Segments around a band collar, and along / across a shawl collar. */
const BAND_AROUND = 36;
/** The foot of a band collar goes this far under the bodice's neck edge (m), and always at least this far down. */
const SEAT_TUCK = 0.006;
const SEAT_MIN = 0.004;
/** The flared rim of the foot sits this far (m) under the band's bottom. */
const SEAT_RIM = 0.002;
/** ...and never more than this below its bottom (m). */
const SEAT_MAX_DROP = 0.045;
/** Bodice points within this angle (rad) of a collar column, and at most this much further out (m), carry its foot. */
const SEAT_ANGLE = 0.09;
const SEAT_REACH = 0.05;
/** Cloth points this close (m) to the nearest one from the neck are all on the neck edge. */
const SEAT_EDGE = 0.004;
/** The foot lies this far outside the bodice's edge (m): it covers it. */
const SEAT_LIFT = 0.003;
/** Rows of a band collar's foot, from the bodice's neck edge up to the neck. */
const SEAT_ROWS = 4;
const RIBBON_ALONG = 40;
const RIBBON_ACROSS = 6;
/** A shawl's lapel falls to this far below the nape (m, scaled by the body's back length). */
const SHAWL_DROP_RATIO = 0.62;
/** Shawl collar: stand up the back of the neck under the roll line, and the fall turned down over it (m). */
const SHAWL_STAND_MAX = 0.03;
const SHAWL_FALL_MAX = 0.055;

interface Frame {
  p: [number, number, number];
  /** Unit direction of the width, from the inner edge to the outer one. */
  w: [number, number, number];
  /** Unit outward normal (the cloth rolls towards it). */
  n: [number, number, number];
  width: number;
}

const unit = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** z of the front surface of a support (about the torso axis) at lateral position x, or the nearest point's. */
const frontZ = (support: Float32Array, x: number): number => {
  const curve = ringCurve(support);
  let best = 0;
  let bestDist = Infinity;
  for (let k = 0; k < ANGLES; k += 1) {
    const x0 = curve.xs[k]!;
    const x1 = curve.xs[k + 1]!;
    const z0 = curve.zs[k]!;
    const z1 = curve.zs[k + 1]!;
    if (z0 < -0.005 && z1 < -0.005) continue; // the back of the ring
    if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1) return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0);
    const d = Math.abs(x0 - x);
    if (d < bestDist) {
      bestDist = d;
      best = z0;
    }
  }
  return best;
};

/** Triangulated grid (rows × columns, row-major), with its outline as seam lines. */
const gridMesh = (mesh: CollarMesh, rows: number, cols: number, closed: boolean): void => {
  const width = closed ? cols : cols + 1;
  const at = (i: number, j: number): number => i * width + (closed ? j % cols : j);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < (closed ? cols : cols); j += 1) {
      mesh.indices.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1));
    }
  }
  const segment = (a: number, b: number): void => {
    for (const v of [a, b]) mesh.border.push(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!);
  };
  for (let j = 0; j < cols; j += 1) {
    segment(at(0, j), at(0, j + 1));
    segment(at(rows, j), at(rows, j + 1));
  }
  if (!closed) {
    for (let i = 0; i < rows; i += 1) {
      segment(at(i, 0), at(i + 1, 0));
      segment(at(i, cols), at(i + 1, cols));
    }
  }
};

/** A ribbon of cloth across `frames`: `ACROSS` steps from each frame's inner edge to its outer edge. */
const ribbon = (frames: Frame[], roll: number, closed: boolean): CollarMesh => {
  const mesh: CollarMesh = { positions: [], indices: [], border: [], uvs: [] };
  let run = 0;
  const runs = frames.map((f, i) => {
    if (i > 0) {
      const a = frames[i - 1]!.p;
      run += Math.hypot(f.p[0] - a[0], f.p[1] - a[1], f.p[2] - a[2]);
    }
    return run;
  });
  for (let i = 0; i <= RIBBON_ACROSS; i += 1) {
    const c = i / RIBBON_ACROSS;
    for (const [j, f] of frames.entries()) {
      // The cloth rolls outwards in the middle of its width (a collar never lies flat on the neck).
      const lift = roll * Math.sin(Math.PI * c);
      mesh.positions.push(
        f.p[0] + f.w[0] * f.width * c + f.n[0] * lift,
        f.p[1] + f.w[1] * f.width * c + f.n[1] * lift,
        f.p[2] + f.w[2] * f.width * c + f.n[2] * lift,
      );
      mesh.uvs.push(runs[j]!, f.width * c);
    }
  }
  gridMesh(mesh, RIBBON_ACROSS, frames.length - (closed ? 0 : 1), closed);
  return mesh;
};

/** Neck ellipse (about the torso axis) from the neck circumference (m). */
const neckSupport = (neckM: number, depth: number): { a: number; b: number; cz: number } => {
  const r = neckM / (2 * Math.PI);
  return { a: r * 1.02, b: r * 1.1, cz: depth };
};

/**
 * Collar halves: a closed band for a band / shirt collar (one mesh), the two lapels of a shawl collar or the
 * two tails of a lavallière (left, then mirrored by the caller as a sleeve is).
 */
export const drapeCollar = (
  spec: CollarSpec,
  env: BodyEnvelope,
  body: {
    napeY: number;
    neck: number;
    backLength: number;
    /** Points of the bodice cloth round the neck: a band collar is sewn onto its neck edge. */
    seat?: Array<[number, number, number]>;
  },
): { mesh: CollarMesh; mirrored: boolean } | null => {
  const heightM = Math.max(0.02, spec.heightMm / 1000);
  const neck = neckSupport(body.neck, env.axisZ + 0.012);
  const baseY = body.napeY - 0.03;

  if (spec.kind === 'SHIRT') {
    // A shirt collar: a low stand round the neck, then the collar turns down over it and lies on the
    // shoulders, its points falling onto the chest at the front. One half (back centre → front), mirrored.
    const stand: Frame[] = [];
    const fall: Frame[] = [];
    const standH = Math.min(0.03, heightM * 0.35);
    const fallW = Math.max(0.04, heightM * 0.9);
    for (let k = 0; k <= RIBBON_ALONG; k += 1) {
      const t = k / RIBBON_ALONG;
      const theta = Math.PI * (1 - t * 0.94);
      const nx = Math.sin(theta);
      const nz = Math.cos(theta);
      const r = COLLAR_LIFT * 0.4;
      // The front of the neck sits lower than the nape.
      const y = baseY - 0.025 * t * t;
      const p: [number, number, number] = [nx * (neck.a + r), y, neck.cz + nz * (neck.b + r)];
      stand.push({ p, w: [0, 1, 0], n: [nx, 0, nz], width: standH });
      const top: [number, number, number] = [p[0] + nx * 0.004, y + standH, p[2] + nz * 0.004];
      // Pointed at the front: the last fifth grows longer and turns down onto the chest.
      const point = Math.max(0, (t - 0.8) / 0.2);
      fall.push({
        p: top,
        w: unit([nx, -0.9 - point * 0.8, nz + point * 0.3]),
        n: [nx * 0.3, 1, nz * 0.3],
        width: fallW * (1 + point * 0.45),
      });
    }
    const a = ribbon(stand, 0.002, false);
    const b = ribbon(fall, 0.006, false);
    const base = a.positions.length / 3;
    a.positions.push(...b.positions);
    a.uvs.push(...b.uvs);
    a.indices.push(...b.indices.map((i) => i + base));
    a.border.push(...b.border);
    return { mesh: a, mirrored: true };
  }

  if (spec.kind === 'BAND') {
    // Wrapped round the neck itself (the body's own section at each height, from the envelope): it starts at the
    // base of the neck — lower in front, where the neck springs from the chest, than at the nape — and stands
    // straight up from there, hugging the neck all round.
    // Its foot is sewn onto the bodice's neck edge: where that edge runs lower than the neck (the back neckline
    // drops to the nape, below the side neck points), the foot follows the body down to it — no skin in between.
    const seat = body.seat ?? [];
    /** Where the bodice's neck edge is under a band bottom point: its highest cloth point there, a little lower. */
    // All round the neck: the side and the front of the neckline lie wider than the band too (an 8 cm wide neckline
    // under a 5.5 cm band left two triangles of skin on the shoulders by the neck, and a strip under the front).
    const seatUnder = (bottom: [number, number, number], bottomY: number): [number, number, number] | null => {
      const angle = Math.atan2(bottom[0], bottom[2] - env.axisZ);
      const r = Math.hypot(bottom[0], bottom[2] - env.axisZ);
      // The neck edge is the cloth nearest the neck in that direction (the shoulder seam beyond it runs higher by the
      // neck points: taking the highest cloth there stopped the foot above the back neckline's corner, skin showing).
      let best: [number, number, number] | null = null;
      let bestR = Infinity;
      for (const q of seat) {
        const d = Math.atan2(q[0], q[2] - env.axisZ) - angle;
        if (Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) > SEAT_ANGLE) continue;
        const qr = Math.hypot(q[0], q[2] - env.axisZ);
        if (qr - r > SEAT_REACH) continue;
        // Within a few millimetres of the nearest, the highest one (the edge, not the cloth just under it).
        if (qr < bestR - SEAT_EDGE || (qr < bestR + SEAT_EDGE && (!best || q[1] > best[1]))) {
          if (qr < bestR - SEAT_EDGE) bestR = qr;
          best = q;
        }
      }
      if (!best || best[1] > bottomY - SEAT_MIN) return null;
      const y = Math.max(bottomY - SEAT_MAX_DROP, best[1] - SEAT_TUCK);
      const out = Math.max(r, Math.hypot(best[0], best[2] - env.axisZ)) + SEAT_LIFT;
      return [Math.sin(angle) * out, y, env.axisZ + Math.cos(angle) * out];
    };
    const columns: Array<Array<[number, number, number]>> = [];
    for (let k = 0; k < BAND_AROUND; k += 1) {
      const theta = (2 * Math.PI * k) / BAND_AROUND;
      const front = Math.max(0, Math.cos(theta)) ** 2;
      const bottomY = body.napeY + BAND_NAPE_RISE - BAND_FRONT_DROP * front;
      const at = (y: number): [number, number, number] => {
        // Evenly spaced round the neck (the back of the neck is flat: equal angles would bunch the columns up).
        const curve = ringCurve(env.torso(y));
        const { x, z } = pointAt(curve, (k / BAND_AROUND) * curve.arc[ANGLES]!);
        const len = Math.hypot(x, z) || 1;
        // The envelope runs a little inside the nape (its vertices count as the head's): more air at the back.
        const lift = BAND_LIFT + BAND_NAPE_LIFT * Math.max(0, -z / len);
        return [x + (x / len) * lift, y, env.axisZ + z + (z / len) * lift];
      };
      const top = at(bottomY + heightM);
      // A band is a cylinder: where the neck already widens into the shoulders, its lower edge stays on the neck.
      const low = at(bottomY);
      const rTop = Math.hypot(top[0], top[2] - env.axisZ);
      const rLow = Math.hypot(low[0], low[2] - env.axisZ) || 1;
      const shrink = Math.min(1, (rTop * BAND_FLARE) / rLow);
      const scaled = (p: [number, number, number], s: number): [number, number, number] => [p[0] * s, p[1], env.axisZ + (p[2] - env.axisZ) * s];
      const bottom = scaled(low, shrink);
      // Behind the side neck points the neck flows into the trapezius: the foot's top flares out over it, just
      // under the band (a cylindrical band's edge would run under the skin there and leave it showing).
      const behind = Math.min(1, Math.max(0, -(low[2] - env.axisZ) / rLow / 0.3));
      const flare = scaled(low, Math.min(1, (rTop * (BAND_FLARE + BAND_BACK_FLARE * behind)) / rLow));
      const rim: [number, number, number] = [flare[0], bottomY - SEAT_RIM, flare[2]];
      const foot = seatUnder(rim, bottomY);
      const footAt: [number, number, number] = foot ?? [rim[0], bottomY - SEAT_MIN, rim[2]];
      const column: Array<[number, number, number]> = [];
      // The foot: a straight run from the bodice's neck edge (just under it) up to the rim, then in to the band.
      for (let r = 0; r < SEAT_ROWS; r += 1) {
        const c = r / (SEAT_ROWS - 1);
        column.push([footAt[0] + (rim[0] - footAt[0]) * c, Math.min(rim[1], footAt[1] + (rim[1] - footAt[1]) * c), footAt[2] + (rim[2] - footAt[2]) * c]);
      }
      // The band: straight up from its bottom, rolling out a little in the middle of its height.
      // Behind the neck its lowest part flares out to the rim (over the trapezius), the rest stands on the neck.
      const n = unit([bottom[0], 0, bottom[2] - env.axisZ]);
      for (let r = 0; r <= RIBBON_ACROSS; r += 1) {
        const c = r / RIBBON_ACROSS;
        const lift = 0.002 * Math.sin(Math.PI * c);
        const out = (1 - Math.min(1, c / BAND_FLARE_SHARE)) ** 2;
        column.push([
          bottom[0] + (top[0] - bottom[0]) * c + n[0] * lift + (flare[0] - bottom[0]) * out,
          bottom[1] + (top[1] - bottom[1]) * c,
          bottom[2] + (top[2] - bottom[2]) * c + n[2] * lift + (flare[2] - bottom[2]) * out,
        ]);
      }
      columns.push(column);
    }
    const mesh: CollarMesh = { positions: [], indices: [], border: [], uvs: [] };
    const rows = columns[0]!.length;
    // u: round the neck (along the band's bottom row), v: height above it.
    let around = 0;
    const runs = columns.map((column, k) => {
      if (k > 0) {
        const a = columns[k - 1]![SEAT_ROWS]!;
        around += Math.hypot(column[SEAT_ROWS]![0] - a[0], column[SEAT_ROWS]![2] - a[2]);
      }
      return around;
    });
    for (let r = 0; r < rows; r += 1) {
      for (const [k, column] of columns.entries()) {
        mesh.positions.push(...column[r]!);
        mesh.uvs.push(runs[k]!, column[r]![1] - column[SEAT_ROWS]![1]);
      }
    }
    gridMesh(mesh, rows - 1, BAND_AROUND, true);
    return { mesh, mirrored: false };
  }

  // Shawl collar / lavallière: from the middle of the back of the neck, round it, then down the front.
  const frames: Frame[] = [];
  const dropM = body.backLength * SHAWL_DROP_RATIO;
  const bottomY = body.napeY - 0.05 - dropM;
  const frontNeckY = body.napeY - 0.05;
  const neckSteps = Math.round(RIBBON_ALONG * 0.4);
  const fallSteps = RIBBON_ALONG - neckSteps;
  const shawl = spec.kind === 'SHAWL';
  // A shawl collar folds on its roll line: a short stand up the neck, then the fall turned down over it, covering the
  // neckline seam. Only the fall shows; it starts at the top of the stand. (A stand of half the piece's height, its
  // width pointing up, stood behind the head like a hood.)
  const rollH = shawl ? Math.min(SHAWL_STAND_MAX, heightM * 0.3) : 0;
  const fallW = shawl ? Math.min(SHAWL_FALL_MAX, heightM * 0.45) : 0;
  const lapelW = shawl ? Math.min(0.12, heightM) : Math.min(0.05, heightM);
  for (let k = 0; k <= neckSteps; k += 1) {
    // Back centre (angle π) round to the throat (angle 0) on the +x side.
    const theta = Math.PI - (Math.PI * k) / neckSteps * 0.9;
    const nx = Math.sin(theta);
    const nz = Math.cos(theta);
    const t = k / neckSteps;
    const y = baseY + (frontNeckY - baseY) * t * t + rollH * (1 - t);
    const front: [number, number, number] = [nx * 0.2 + 0.9, 0.1, nz * 0.2];
    // Shawl: the fall turns outwards and down at the back, then lies open on the chest. Lavallière: a flat band.
    const back: [number, number, number] = shawl ? [nx, -0.7, nz] : [nx * 0.2, 1, nz * 0.2];
    frames.push({
      p: [nx * (neck.a + COLLAR_LIFT * 0.4), y, neck.cz + nz * (neck.b + COLLAR_LIFT * 0.4)],
      w: unit([back[0] + (front[0] - back[0]) * t, back[1] + (front[1] - back[1]) * t, back[2] + (front[2] - back[2]) * t]),
      n: [nx, 0.2, nz],
      width: fallW + (lapelW - fallW) * t,
    });
  }
  const start = frames[frames.length - 1]!;
  const throatX = start.p[0];
  for (let k = 1; k <= fallSteps; k += 1) {
    const t = k / fallSteps;
    // The lapel opens in a V: from the throat down to just off the centre line, on the chest surface.
    const y = frontNeckY + (bottomY - frontNeckY) * t;
    const x = throatX + (0.012 - throatX) * t + 0.02 * Math.sin(Math.PI * t);
    const z = env.axisZ + frontZ(env.torso(y), x) + COLLAR_LIFT * 2;
    // Widest at the chest, pointed at the end of the fall.
    const taper = spec.kind === 'SHAWL' ? Math.max(0.15, 1 - t ** 3) : Math.max(0.2, 1 - t * 0.6);
    frames.push({
      p: [x, y, z],
      w: unit([1, 0.15 * (1 - t), -0.05]),
      n: [0.2, 0, 1],
      width: Math.max(0.006, lapelW * (0.85 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.4))) * taper),
    });
  }
  return { mesh: ribbon(frames, 0.012, false), mirrored: true };
};

/** Sections round a cord, and its radius (m). */
const CORD_SIDES = 8;
const CORD_RADIUS = 0.0045;

/** A tube of radius `r(t)` along a polyline (t = 0 … 1 along it). */
const tube = (mesh: CollarMesh, path: Array<[number, number, number]>, r: (t: number) => number): void => {
  const base = mesh.positions.length / 3;
  for (const [i, p] of path.entries()) {
    const q = path[Math.min(path.length - 1, i + 1)]!;
    const o = path[Math.max(0, i - 1)]!;
    const d = unit([q[0] - o[0], q[1] - o[1], q[2] - o[2]]);
    // Two normals to the direction (the cords hang mostly downwards, so z is never parallel to it).
    const a = unit([d[1] * 1 - d[2] * 0, d[2] * 0 - d[0] * 1, 0]);
    const b: [number, number, number] = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]];
    const radius = r(i / Math.max(1, path.length - 1));
    for (let k = 0; k < CORD_SIDES; k += 1) {
      const t = (2 * Math.PI * k) / CORD_SIDES;
      mesh.positions.push(
        p[0] + radius * (Math.cos(t) * a[0] + Math.sin(t) * b[0]),
        p[1] + radius * (Math.cos(t) * a[1] + Math.sin(t) * b[1]),
        p[2] + radius * (Math.cos(t) * a[2] + Math.sin(t) * b[2]),
      );
      mesh.uvs.push(k / CORD_SIDES, i / path.length);
    }
  }
  for (let i = 0; i < path.length - 1; i += 1) {
    for (let k = 0; k < CORD_SIDES; k += 1) {
      const a = base + i * CORD_SIDES + k;
      const b = base + i * CORD_SIDES + ((k + 1) % CORD_SIDES);
      mesh.indices.push(a, a + CORD_SIDES, b, b, a + CORD_SIDES, b + CORD_SIDES);
    }
  }
};

/**
 * A cordelière tied at the centre front: a small bow-knot on the waist line and two tails hanging from it
 * (one a little longer), ending in tassels. `frontZ` is the front surface of the cloth there.
 */
export const drapeCord = (waistY: number, frontZ: number): CollarMesh => {
  const mesh: CollarMesh = { positions: [], indices: [], border: [], uvs: [] };
  const knot: Array<[number, number, number]> = [];
  for (let k = 0; k <= 16; k += 1) {
    const t = (2 * Math.PI * k) / 16;
    knot.push([0.012 * Math.cos(t), waistY + 0.009 * Math.sin(t), frontZ + 0.004]);
  }
  tube(mesh, knot, () => CORD_RADIUS * 1.2);
  // Each tail runs along the waist a little, then falls; it ends in a tassel (thicker last 3 cm).
  for (const [side, drop] of [[1, 0.2], [-1, 0.17]] as const) {
    const path: Array<[number, number, number]> = [];
    for (let k = 0; k <= 14; k += 1) {
      const t = k / 14;
      path.push([side * (0.01 + 0.035 * Math.sin(t * Math.PI * 0.5)), waistY - 0.004 - drop * t, frontZ + 0.006 + 0.01 * t]);
    }
    tube(mesh, path, (t) => (t > 0.86 ? CORD_RADIUS * 2.2 : CORD_RADIUS));
  }
  return mesh;
};

const merge = (target: CollarMesh, part: CollarMesh): CollarMesh => {
  const base = target.positions.length / 3;
  target.positions.push(...part.positions);
  target.uvs.push(...part.uvs);
  target.indices.push(...part.indices.map((i) => i + base));
  target.border.push(...part.border);
  return target;
};

/** Segments round a belt; size of the bow's loops, knot and tails (m). */
const BELT_AROUND = 48;
const BOW_LOOP_W = 0.085;
const BOW_LOOP_H = 0.06;
const BOW_TAIL_DROP = 0.2;
const BOW_TAIL_W = 0.05;
/** Belt lift off the cloth under it (m). */
const BELT_LIFT = 0.004;

/**
 * A tied belt: a band of `heightM` round the waist, on the cloth (`radiusAt(θ)`: distance of the cloth's surface
 * from the torso axis at angle θ, 0 = centre front, π/2 = the wearer's left), and a bow at the centre front —
 * two loops pinched in a knot, two tails falling from it.
 */
export const drapeBelt = (
  waistY: number,
  axisZ: number,
  radiusAt: (theta: number) => number,
  heightM: number,
  bow: boolean,
): CollarMesh => {
  const frames: Frame[] = [];
  for (let k = 0; k < BELT_AROUND; k += 1) {
    const theta = (2 * Math.PI * k) / BELT_AROUND;
    const nx = Math.sin(theta);
    const nz = Math.cos(theta);
    const r = radiusAt(theta) + BELT_LIFT;
    frames.push({ p: [nx * r, waistY - heightM / 2, axisZ + nz * r], w: [0, 1, 0], n: [nx, 0, nz], width: heightM });
  }
  const mesh = ribbon(frames, 0.002, true);
  if (!bow) return mesh;
  const z0 = axisZ + radiusAt(0) + BELT_LIFT + 0.004;
  for (const side of [1, -1] as const) {
    // A loop: out from the knot to the side and back, round in plan (x, z), wide at its end, pinched at the knot.
    const loop: Frame[] = [];
    const cx = side * (0.012 + BOW_LOOP_W / 2);
    for (let k = 0; k < 28; k += 1) {
      const phi = (2 * Math.PI * k) / 28;
      const x = side * (0.012 + (BOW_LOOP_W / 2) * (1 - Math.cos(phi)));
      const z = z0 + 0.012 + 0.012 * Math.sin(phi * side);
      const height = BOW_LOOP_H * (0.45 + 0.55 * Math.sin(phi / 2));
      loop.push({ p: [x, waistY - height / 2, z], w: [0, 1, 0], n: unit([x - cx, 0, z - z0 - 0.012]), width: height });
    }
    merge(mesh, ribbon(loop, 0.004, true));
    // A tail: from under the knot down and a little outwards.
    const tail: Frame[] = [];
    for (let k = 0; k <= 12; k += 1) {
      const t = k / 12;
      tail.push({
        p: [side * (0.006 + 0.045 * t) - BOW_TAIL_W / 2, waistY - 0.015 - BOW_TAIL_DROP * (side === 1 ? 1 : 0.88) * t, z0 + 0.02 + 0.012 * t],
        w: [1, 0, 0],
        n: [0, 0, 1],
        width: BOW_TAIL_W * (1 - 0.15 * t),
      });
    }
    merge(mesh, ribbon(tail, 0.003, false));
  }
  // The knot: a short band wrapped round the middle of the bow.
  const knot: Frame[] = [];
  for (let k = 0; k < 16; k += 1) {
    const phi = (2 * Math.PI * k) / 16;
    const nx = Math.sin(phi);
    const nz = Math.cos(phi);
    knot.push({ p: [nx * 0.016, waistY - 0.018, z0 + 0.016 + nz * 0.014], w: [0, 1, 0], n: [nx, 0, nz], width: 0.036 });
  }
  return merge(mesh, ribbon(knot, 0.002, true));
};

/**
 * A cuff round the end of a sleeve: `ring` is the sleeve's last row (round the wrist), `dir` the arm's
 * direction there (towards the hand). The band starts just over the sleeve's edge and runs `heightM` on.
 */
export const drapeCuff = (ring: Array<[number, number, number]>, dir: [number, number, number], heightM: number): CollarMesh => {
  const c = ring.reduce<[number, number, number]>((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length, s[2] + p[2] / ring.length], [0, 0, 0]);
  const d = unit(dir);
  const frames: Frame[] = ring.map((q) => {
    const n = unit([q[0] - c[0], q[1] - c[1], q[2] - c[2]]);
    return {
      p: [q[0] + n[0] * 0.003 - d[0] * 0.006, q[1] + n[1] * 0.003 - d[1] * 0.006, q[2] + n[2] * 0.003 - d[2] * 0.006],
      w: d,
      n,
      width: heightM + 0.006,
    };
  });
  return ribbon(frames, 0.002, true);
};

/** Lift of a revers off the front it is turned back onto (m). */
const REVERS_LIFT = 0.004;

/**
 * A revers turned back along a coat-dress's opening: a band lying on the front, from its opening edge inwards.
 * `edge` lists, down the opening, the edge point on the cloth, the unit direction across the cloth (away from
 * the opening), the outward normal and the revers' width there (m). One side; the caller mirrors it.
 */
export const drapeRevers = (
  edge: Array<{ p: [number, number, number]; w: [number, number, number]; n: [number, number, number]; width: number }>,
): CollarMesh | null => {
  if (edge.length < 2) return null;
  const frames: Frame[] = edge.map((e) => ({
    p: [e.p[0] + e.n[0] * REVERS_LIFT, e.p[1] + e.n[1] * REVERS_LIFT, e.p[2] + e.n[2] * REVERS_LIFT],
    w: unit(e.w),
    n: unit(e.n),
    width: Math.max(0.004, e.width),
  }));
  // The fold along the opening stands a little proud: the revers rolls outwards in the middle of its width.
  return ribbon(frames, 0.003, false);
};
