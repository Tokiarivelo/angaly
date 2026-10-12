import type { PatternPieceDto } from '@angaly/types';
import { getBounds, openPolygon, polygonAreaCm2, type Point } from '../pattern-geometry';
import {
  ANGLES,
  envelopeFromRings,
  pointAt,
  pushOutside,
  ringCurve,
  ringForCircumference,
  ringFromDelta,
  supportMax,
  supportPerimeter,
  type BodyEnvelope,
  type RingCurve,
  type Support,
} from './body-envelope';
import {
  bodyLandmarks,
  bodyScale,
  buildTorsoRings,
  ellipseCircumference,
  readBodyMeasurements,
  ringAt,
  type BodyMeasurements,
  type BodyRing,
} from './body-model';
import { getBodyTemplate } from './body-templates';

export type PanelRole = 'front' | 'back' | 'sleeve';
export type GarmentZone = 'bodice' | 'skirt' | 'torso' | 'legs';

export interface PanelMeshData {
  id: string;
  label: string;
  role: PanelRole;
  zone: GarmentZone | 'sleeve';
  /** Ids of the PatternPiece(s) this panel is built from (for highlighting). */
  pieceIds: string[];
  positions: Float32Array;
  indices: Uint32Array;
  /** Closed polylines (xyz triplets) outlining the panel, drawn as seam lines. */
  border: Float32Array;
  /** Position of each vertex on the flat fabric (m): a print laid on the cloth follows the pattern. */
  uvs: Float32Array;
  /** Direction the panel travels when the assembly is exploded. */
  explode: { x: number; y: number; z: number };
}

export type FitStatus = 'tight' | 'fitted' | 'comfortable' | 'loose';

export interface FitLine {
  label: 'Poitrine' | 'Taille' | 'Bassin';
  bodyCm: number;
  garmentCm: number;
  easeCm: number;
  status: FitStatus;
}

/** The classified pattern, ready to be draped on any body envelope (see drapeGarment). */
export interface GarmentLayout {
  zones: ZoneGroup[];
  sleeves: Classified[];
  /** Ids per zone/role, for highlighting. */
  pieceIds: Record<string, string[]>;
}

export interface GarmentModel {
  body: BodyMeasurements;
  torsoRings: BodyRing[];
  /** Panels draped on the procedural mannequin; the viewer re-drapes them on the human mesh. */
  panels: PanelMeshData[];
  layout: GarmentLayout;
  fit: FitLine[];
  /** Pieces that were not placed on the mannequin (collars, belts, trains…). */
  ignored: string[];
  /** True when no front/back pieces exist and the largest piece is wrapped around the body instead. */
  generic: boolean;
  /** Morphology template the body was filled from (also picks the human mesh's gender/muscle). */
  templateId: string;
}

export type GarmentModelResult =
  | { ok: true; model: GarmentModel }
  | { ok: false; reason: string };

interface Classified {
  piece: PatternPieceDto;
  polygon: Point[];
  role: PanelRole;
  zone: GarmentZone | 'sleeve';
  minY: number;
  maxY: number;
  /** Overrides the fold factor (generic wraps: the piece is the whole width). */
  fold?: number;
  /** Gathered or pleated onto the waist seam: the width beyond the seam is taken up by folds there. */
  gathered?: boolean;
  /** Depth (m) of the gathers at a flat height (a bodice gathered onto a midriff band). */
  gatherAt?: (flatY: number) => number;
  /** Flat heights of inner seams drawn across the panel (the midriff seam of a stacked bodice). */
  seamsFlatY?: number[];
}

const normalize = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const TORSO_GARMENTS = new Set(['CHEMISE', 'VESTE', 'COSTUME', 'AUTRE']);

export const classifyPiece = (
  name: string,
  garmentType: string,
): { role: PanelRole; zone: GarmentZone | 'sleeve' } | null => {
  const n = normalize(name);
  if (n.includes('manche')) return { role: 'sleeve', zone: 'sleeve' };

  const role: PanelRole | null = n.includes('devant') ? 'front' : n.includes('dos') ? 'back' : null;
  if (!role) return null;

  if (n.includes('corsage') || n.includes('buste') || n.includes('haut') || n.includes('empiecement')) return { role, zone: 'bodice' };
  if (n.includes('jupe')) return { role, zone: 'skirt' };
  if (garmentType === 'JUPE') return { role, zone: 'skirt' };
  if (garmentType === 'PANTALON') return { role, zone: 'legs' };
  if (TORSO_GARMENTS.has(garmentType)) return { role, zone: 'torso' };
  return null;
};

/** [minX, maxX] of the polygon on the horizontal line `y`, or null when the line misses it. */
export const rowExtent = (polygon: Point[], y: number): [number, number] | null => {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const x = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return min === Infinity ? null : [min, max];
};

const ROWS = 48;
const COLUMNS = 28;
const LEG_RADIAL = 48;
const SLEEVE_RADIAL = 32;
const FLAT_EPSILON = 0.5;
const STATUS_THRESHOLDS = { tight: 0, fitted: 4, comfortable: 10 };
/** Air + fabric thickness between the skin hull and the garment (m). */
const GAP = 0.004;
/** How far above itself a fabric row can hang from (bust → under-bust, hips → hem…), m. */
const HANG = 0.3;

export const fitStatus = (easeCm: number): FitStatus => {
  if (easeCm < STATUS_THRESHOLDS.tight) return 'tight';
  if (easeCm < STATUS_THRESHOLDS.fitted) return 'fitted';
  if (easeCm < STATUS_THRESHOLDS.comfortable) return 'comfortable';
  return 'loose';
};

interface ZoneGroup {
  zone: GarmentZone;
  /** World height the zone starts from (the nape, the waist, or the top of a generic wrap). */
  topY: number;
  front?: Classified | undefined;
  back?: Classified | undefined;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const foldFactor = (c: Classified): number => c.fold ?? (c.piece.quantity === 1 ? 2 : c.piece.quantity);

const inFlatRange = (c: Classified, flatY: number): boolean => flatY >= c.minY - 1 && flatY <= c.maxY + 1;

const halfWidthAt = (c: Classified, flatY: number): number => {
  const y = Math.min(c.maxY - FLAT_EPSILON, Math.max(c.minY + FLAT_EPSILON, flatY));
  const extent = rowExtent(c.polygon, y);
  return extent ? extent[1] : 0;
};

/** Full width (mm) of a piece on a flat row — a trouser leg panel is one whole leg side, not a half. */
const fullWidthAt = (c: Classified, flatY: number): number => {
  const y = Math.min(c.maxY - FLAT_EPSILON, Math.max(c.minY + FLAT_EPSILON, flatY));
  const extent = rowExtent(c.polygon, y);
  return extent ? extent[1] - extent[0] : 0;
};

/**
 * Fabric above the armpit moved by the shoulder lift is pushed back out of the body at its new height:
 * radially (a sleeve cap), or straight forwards / backwards (`towards` +1 / −1, a front / back panel),
 * so a neckline stays as wide as the pattern cuts it instead of sliding along the shoulders.
 */
const pushOutOfTorso = (
  mesh: Mesh,
  env: BodyEnvelope,
  towards: 0 | 1 | -1 = 0,
  placed?: Float32Array,
  neckR?: number,
): void => {
  const p = mesh.positions;
  for (let o = 0; o < p.length; o += 3) {
    if (p[o + 1]! < env.armpitY) continue;
    const h = env.torso(p[o + 1]!);
    const x = p[o]!;
    const z = p[o + 2]! - env.axisZ;
    if (towards === 0) {
      const out = pushOutside(h, GAP, x, z);
      p[o] = out.x;
      p[o + 2] = env.axisZ + out.z;
      continue;
    }
    // The hull's section at this x: zMin ≤ z ≤ zMax (empty when x is beyond the hull).
    let zMin = -Infinity;
    let zMax = Infinity;
    for (let k = 0; k < ANGLES; k += 1) {
      const a = (2 * Math.PI * k) / ANGLES;
      const c = Math.cos(a);
      const bound = h[k]! + GAP - x * Math.sin(a);
      if (c > 1e-6) zMax = Math.min(zMax, bound / c);
      else if (c < -1e-6) zMin = Math.max(zMin, bound / c);
      else if (bound < 0) zMax = -Infinity;
    }
    const keep = placed?.[o / 3] ?? 0;
    // Away from the neck (whose column the conservative height map would reach) …
    const slope = neckR === undefined ? 1 : smooth((Math.abs(x) - neckR - 0.035) / 0.02);
    if (keep > 0 && env.top && slope > 0) {
      // … fabric resting on the shoulder (the hull bridges the slope under it) stays above the skin.
      const skin = env.top(x, p[o + 2]!);
      if (skin !== null) p[o + 1] = p[o + 1]! + clamp(skin + GAP - p[o + 1]!, 0, 0.015) * keep * slope;
    }
    if (zMin > zMax || z < zMin || z > zMax) continue;
    p[o + 2] = env.axisZ + lerp(towards > 0 ? zMax : zMin, z, keep);
  }
};

/** One trouser leg circumference (m) at a flat row: front width + back width. */
const legCircumference = (group: ZoneGroup, flatY: number): number => {
  const f = group.front ? fullWidthAt(group.front, flatY) / 1000 : 0;
  const b = group.back ? fullWidthAt(group.back, flatY) / 1000 : 0;
  return (f || b) + (b || f);
};

const pickLargest = (items: Classified[]): Classified | undefined =>
  [...items].sort((a, b) => polygonAreaCm2(b.polygon) - polygonAreaCm2(a.polygon))[0];

/** Radius (m) of the mannequin's leg at height y — thigh at the crotch, knee, then ankle. */
export const bodyLegRadius = (body: BodyMeasurements, y: number): number => {
  const l = bodyLandmarks(body);
  const kneeY = (l.crotchY + l.ankleY) / 2;
  const t = (value: number) => value / (2 * Math.PI);
  if (y >= l.crotchY) return t(body.thigh);
  if (y >= kneeY) return t(body.thigh) + ((t(body.knee) - t(body.thigh)) * (l.crotchY - y)) / (l.crotchY - kneeY);
  return t(body.knee) + ((t(body.ankle) - t(body.knee)) * (kneeY - Math.max(y, l.ankleY))) / (kneeY - l.ankleY);
};

/** Arm/sleeve axis tilt away from vertical, for the procedural mannequin's arms. */
export const SLEEVE_TILT = (36 * Math.PI) / 180;
/** How far below the shoulder line the procedural arm starts, per metre of stature scale. */
const SLEEVE_DROP = 0.06;

/** The procedural mannequin as an envelope (before / without the human mesh). */
export const proceduralEnvelope = (body: BodyMeasurements, rings: BodyRing[]): BodyEnvelope => {
  const l = bodyLandmarks(body);
  const shoulder = ringAt(rings, l.shoulderY);
  return envelopeFromRings(body, rings, (y) => bodyLegRadius(body, y), {
    start: { x: shoulder.a + 0.012, y: l.shoulderY - SLEEVE_DROP * bodyScale(body), z: 0 },
    dir: { x: Math.sin(SLEEVE_TILT), y: -Math.cos(SLEEVE_TILT), z: 0 },
  });
};

/* ------------------------------------------------------------------------------------------------ */
/* Draping                                                                                          */

interface Mesh {
  positions: number[];
  indices: number[];
  border: number[];
  /** Flat fabric coordinates (m) per vertex. */
  uvs: number[];
}

/** Adds the mirror image (x → −x) of the vertices from `from`, with the winding flipped. */
const addMirror = (mesh: Mesh): void => {
  const count = mesh.positions.length / 3;
  for (let i = 0; i < count; i += 1) mesh.positions.push(-mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!);
  // The other half of a piece cut on the fold: the fabric continues past the centre line.
  for (let i = 0; i < count; i += 1) mesh.uvs.push(-mesh.uvs[i * 2]!, mesh.uvs[i * 2 + 1]!);
  const tris = mesh.indices.length;
  for (let t = 0; t < tris; t += 3) mesh.indices.push(mesh.indices[t]! + count, mesh.indices[t + 2]! + count, mesh.indices[t + 1]! + count);
  const lines = mesh.border.length;
  for (let k = 0; k < lines; k += 3) mesh.border.push(-mesh.border[k]!, mesh.border[k + 1]!, mesh.border[k + 2]!);
};

/** Grid (rows × cols, row-major) → triangles, plus its outline as seam lines. */
const gridMesh = (mesh: Mesh, base: number, rows: number, cols: number, closed: boolean, outline: boolean): void => {
  const width = closed ? cols : cols + 1;
  const at = (i: number, j: number): number => base + i * width + (closed ? j % cols : j);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const p = at(i, j);
      const q = at(i + 1, j);
      const p1 = at(i, j + 1);
      const q1 = at(i + 1, j + 1);
      mesh.indices.push(p, q, p1, p1, q, q1);
    }
  }
  if (!outline) return;
  const segment = (a: number, b: number): void => {
    mesh.border.push(...mesh.positions.slice(a * 3, a * 3 + 3), ...mesh.positions.slice(b * 3, b * 3 + 3));
  };
  for (let j = 0; j < cols; j += 1) segment(at(rows, j), at(rows, j + 1)); // hem / cuff
  if (closed) {
    for (let i = 0; i < rows; i += 1) segment(at(i, 0), at(i + 1, 0)); // the seam
    return;
  }
  for (let i = 0; i < rows; i += 1) {
    segment(at(i, 0), at(i + 1, 0));
    segment(at(i, cols), at(i + 1, cols));
  }
  for (let j = 0; j < cols; j += 1) segment(at(0, j), at(0, j + 1));
};

/** Support about one centre re-expressed about another (the shape moved by −(dx, dz)). */
const shifted = (h: Support, dx: number, dz: number): Support => {
  const out = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) {
    const a = (2 * Math.PI * k) / ANGLES;
    out[k] = h[k]! + dx * Math.sin(a) + dz * Math.cos(a);
  }
  return out;
};

/** Max of `sample` over [from, to] every 1.5 cm: what the fabric at `from` can hang from. */
const hangOver = (sample: (v: number) => Support, from: number, to: number): Support => {
  const list: Support[] = [sample(from)];
  const step = to >= from ? 0.015 : -0.015;
  for (let v = from + step; step > 0 ? v <= to : v >= to; v += step) list.push(sample(v));
  return supportMax(list);
};

/** Maps a panel's flat height (mm) to a world height along its centre line, measured on the body. */
interface Mapping {
  toY: (flatY: number) => number;
  toFlat: (y: number) => number | null;
}

const buildMapping = (
  panel: Classified,
  group: ZoneGroup,
  env: BodyEnvelope,
  body: BodyMeasurements,
  ceiling: number,
): Mapping => {
  const l = bodyLandmarks(body);
  const up = group.zone === 'bodice';
  const anchorY = group.zone === 'bodice' || group.zone === 'skirt' || group.zone === 'legs' ? l.waistY : group.topY;
  const anchorFlat = up ? panel.maxY : panel.minY;
  const k0 = panel.role === 'back' ? ANGLES / 2 : 0;
  const lengthM = (panel.maxY - panel.minY) / 1000 + 0.05;
  // Centre line of the fabric: front (or back) support of the body, hanging from above.
  const profile = (y: number): number =>
    group.zone === 'legs' ? 0 : hangOver(env.torso, y, Math.min(y + HANG, ceiling))[k0]! + GAP;
  const ys: number[] = [anchorY];
  const ss: number[] = [0];
  const step = 0.005;
  let y = anchorY;
  let r = profile(y);
  while (ss[ss.length - 1]! < lengthM && ys.length < 2000) {
    const ny = y + (up ? step : -step);
    const nr = ny > ceiling + 0.02 || ny < 0.01 ? r : profile(ny);
    ss.push(ss[ss.length - 1]! + Math.hypot(step, nr - r));
    ys.push(ny);
    y = ny;
    r = nr;
  }
  const toY = (flatY: number): number => {
    const d = Math.abs(flatY - anchorFlat) / 1000;
    let i = 0;
    while (i < ss.length - 2 && ss[i + 1]! < d) i += 1;
    const t = (d - ss[i]!) / (ss[i + 1]! - ss[i]! || 1);
    return lerp(ys[i]!, ys[i + 1]!, t);
  };
  const top = toY(up ? panel.minY : panel.minY);
  const bottom = toY(panel.maxY);
  const toFlat = (wy: number): number | null => {
    if (wy > Math.max(top, bottom) + 1e-4 || wy < Math.min(top, bottom) - 1e-4) return null;
    let i = 0;
    while (i < ys.length - 2 && (up ? ys[i + 1]! < wy : ys[i + 1]! > wy)) i += 1;
    const t = (wy - ys[i]!) / (ys[i + 1]! - ys[i]! || 1);
    const d = lerp(ss[i]!, ss[i + 1]!, clamp(t, 0, 1)) * 1000;
    return up ? anchorFlat - d : anchorFlat + d;
  };
  return { toY, toFlat };
};

interface ZoneDrape {
  group: ZoneGroup;
  mappings: Map<Classified, Mapping>;
  ceiling: number;
  /** Garment circumference and front share at a world height (null: no panel there). */
  circumference: (y: number) => { total: number; frontShare: number } | null;
}

const zoneDrape = (group: ZoneGroup, env: BodyEnvelope, body: BodyMeasurements): ZoneDrape => {
  const l = bodyLandmarks(body);
  const ceiling = group.zone === 'skirt' || group.zone === 'legs' ? l.waistY : group.zone === 'bodice' ? l.napeY + 0.03 : group.topY;
  const mappings = new Map<Classified, Mapping>();
  for (const panel of [group.front, group.back]) if (panel) mappings.set(panel, buildMapping(panel, group, env, body, ceiling));
  const circumference = (y: number): { total: number; frontShare: number } | null => {
    const width = (panel: Classified | undefined): number => {
      if (!panel) return 0;
      const flat = mappings.get(panel)!.toFlat(y);
      if (flat === null || !inFlatRange(panel, flat)) return 0;
      return group.zone === 'legs' ? fullWidthAt(panel, flat) / 1000 : (halfWidthAt(panel, flat) * foldFactor(panel)) / 1000;
    };
    const front = width(group.front);
    const back = width(group.back);
    if (front === 0 && back === 0) return null;
    // A missing half is assumed symmetrical so the ring stays closed.
    const f = front || back;
    const b = back || front;
    return { total: f + b, frontShare: f / (f + b) };
  };
  return { group, mappings, ceiling, circumference };
};

interface FabricRing {
  curve: RingCurve;
  /** Arc length from the centre front to the centre back, along the +x side. */
  half: number;
  /** Arc length from the centre front to the side seam. */
  seam: number;
  /** Garment perimeter minus the body hull perimeter, relative (0 = skin-tight). */
  excess: number;
}

const fabricRing = (body: Support, hang: Support, circumference: number | null, delta: number, frontShare: number): { ring: FabricRing; delta: number } => {
  const solved = circumference !== null ? ringForCircumference(body, hang, GAP, circumference) : { ring: ringFromDelta(body, hang, GAP, delta), delta };
  const curve = ringCurve(solved.ring);
  const half = curve.arc[ANGLES / 2]!;
  const bodyPerimeter = supportPerimeter(body);
  const perimeter = curve.arc[ANGLES]!;
  return {
    ring: { curve, half, seam: half * frontShare, excess: Math.max(0, (perimeter - bodyPerimeter) / perimeter) },
    delta: solved.delta,
  };
};

/**
 * Soft vertical folds (godets) where the fabric has more width than the body under it. `count` is fixed
 * per panel and the phase follows the fraction of the ring, so each fold runs straight down to the hem.
 */
const folds = (ring: FabricRing, s: number, fall: number, count: number, amplitude?: number): number => {
  const a = amplitude ?? (ring.excess < 0.06 ? 0 : Math.min(0.03, (ring.excess - 0.06) * 0.1) * fall);
  if (a <= 0) return 0;
  const perimeter = ring.curve.arc[ANGLES]!;
  // Outward only (0 … amplitude): a fold never pushes the fabric into the body.
  return a * (0.5 - 0.5 * Math.cos((2 * Math.PI * count * s) / perimeter));
};

/** How far below the waist seam gathered fabric takes to open into its hanging width (m). */
const GATHER_OPEN = 0.3;
/** Share of a gathered skirt's fabric width its folds' mid-line keeps once open (the rest is in folds). */
const GATHER_HANG = 0.7;

/** Front or back panel of a torso / bodice / skirt zone, both halves. */
const drapeHalfPanel = (zd: ZoneDrape, panel: Classified, env: BodyEnvelope, body: BodyMeasurements): Mesh => {
  const { group } = zd;
  const mapping = zd.mappings.get(panel)!;
  const fullAlways = group.zone === 'skirt';
  const isFull = (y: number): boolean => fullAlways || y <= env.armpitY;
  const hang = (y: number): Support => hangOver(env.torso, y, Math.min(y + HANG, zd.ceiling));

  // The ease above the armpit (armhole, shoulders) follows the one at the armpit.
  const armpit = zd.circumference(env.armpitY);
  const ref = armpit
    ? fabricRing(env.torso(env.armpitY), hang(env.armpitY), armpit.total, 0, armpit.frontShare)
    : null;
  const refShare = armpit?.frontShare ?? 0.5;

  interface Row {
    y: number;
    flatY: number;
    x0: number;
    x1: number;
    ring: FabricRing;
    full: boolean;
    /** Gathered fabric only: depth of the folds (m). */
    gather?: number;
  }
  // Gathers: at the waist seam the fabric is drawn in to the seam's length; below it, it opens up to
  // hang at GATHER_HANG of its width, the rest standing out as folds.
  const waistY = bodyLandmarks(body).waistY;
  const seamLength = panel.gathered ? supportPerimeter(env.torso(waistY)) + 2 * Math.PI * GAP + 0.03 : 0;
  const rows: Row[] = [];
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const extent = rowExtent(panel.polygon, flatY) ?? [0, 0];
    const y = mapping.toY(flatY);
    const c = zd.circumference(y);
    const full = isFull(y) && c !== null;
    if (full && panel.gathered && c.total > seamLength) {
      const open = smooth((waistY - y) / GATHER_OPEN);
      const hangs = Math.min(c.total, lerp(seamLength, Math.max(seamLength, c.total * GATHER_HANG), open));
      const { ring } = fabricRing(env.torso(y), hang(y), hangs, 0, c.frontShare);
      const depth = Math.min(0.045, 0.3 * (c.total - hangs) / Math.max(1, Math.round(hangs / 0.07))) * (0.4 + 0.6 * open);
      rows.push({ y, flatY, x0: Math.max(0, extent[0]), x1: Math.max(extent[1], 1e-6), ring, full, gather: depth });
      continue;
    }
    const gather = panel.gatherAt?.(flatY);
    const { ring } = full
      ? fabricRing(env.torso(y), hang(y), c.total, 0, c.frontShare)
      : fabricRing(env.torso(y), hang(y), null, ref?.delta ?? 0, refShare);
    rows.push({ y, flatY, x0: Math.max(0, extent[0]), x1: Math.max(extent[1], 1e-6), ring, full, ...(gather ? { gather } : {}) });
  }
  const firstFull = rows.find((r) => r.full);
  const kRef = firstFull ? firstFull.ring.seam / (firstFull.x1 / 1000) : 1;
  const topY = rows[0]!.y;
  const length = Math.max(0.1, Math.abs(topY - rows[ROWS]!.y));

  // Folds per ring, from the hem (the widest row): about one every 12 cm, an even number per half.
  const hem = Math.max(...rows.map((r) => r.ring.curve.arc[ANGLES]!));
  // Gathers fold every ~7 cm along the ring (finer at the seam, where the ring is shorter).
  const count = panel.gathered ? 2 * Math.max(6, Math.round(hem / 0.14)) : 2 * Math.max(3, Math.round(hem / 0.24));
  // Gathers onto a band: small folds every ~2.5 cm.
  const gatherCount = 2 * Math.max(6, Math.round(hem / 0.05));
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  for (const row of rows) {
    const k = row.full ? row.ring.seam / (row.x1 / 1000) : kRef;
    const limit = row.full ? row.ring.seam : row.ring.half * (panel.role === 'front' ? refShare : 1 - refShare);
    const fall = smooth(Math.abs(topY - row.y) / length);
    for (let j = 0; j <= COLUMNS; j += 1) {
      const x = (row.x0 + ((row.x1 - row.x0) * j) / COLUMNS) / 1000;
      const along = Math.min(x * k, limit);
      const s = panel.role === 'front' ? along : row.ring.half - along;
      const p = pointAt(row.ring.curve, s);
      // Folds along the outward direction from the axis; zero at the centre lines and the side seam.
      const fold =
        folds(row.ring, s, fall, panel.gatherAt && !panel.gathered ? gatherCount : count, row.gather) *
        Math.sin((Math.PI * along) / Math.max(limit, 1e-3));
      const len = Math.hypot(p.x, p.z) || 1;
      mesh.positions.push(p.x + (p.x / len) * fold, row.y, env.axisZ + p.z + (p.z / len) * fold);
      // Along the cloth's width as draped (a short first row of a sloped edge would stretch the print).
      mesh.uvs.push(along, row.flatY / 1000);
    }
  }
  if (group.zone !== 'skirt') {
    const placed = restOnShoulders(mesh, env, body, panel);
    pushOutOfTorso(mesh, env, panel.role === 'back' ? -1 : 1, placed, body.neck / (2 * Math.PI));
  }
  gridMesh(mesh, 0, ROWS, COLUMNS, false, true);
  for (const seamY of panel.seamsFlatY ?? []) {
    const i = Math.round(((seamY - panel.minY) / Math.max(1e-6, panel.maxY - panel.minY)) * ROWS);
    if (i <= 0 || i >= ROWS) continue;
    for (let j = 0; j < COLUMNS; j += 1) {
      const a = (i * (COLUMNS + 1) + j) * 3;
      mesh.border.push(...mesh.positions.slice(a, a + 6));
    }
  }
  addMirror(mesh);
  return mesh;
};

/**
 * The shoulder seam of a bodice lies on the shoulder ridge, where the front and the back meet. The seam
 * is the panel's edge from the neck point to the armhole tip (the last column of the rows above the
 * tip, and the first row); each seam vertex moves onto the ridge at its own |x|, and the fabric under it
 * follows, fading out ~8 cm away. Vertices close to the neck (a curved neckline) stay where the pattern
 * puts them.
 */
const restOnShoulders = (mesh: Mesh, env: BodyEnvelope, body: BodyMeasurements, panel: Classified): Float32Array => {
  const neckR = body.neck / (2 * Math.PI);
  const width = COLUMNS + 1;
  const p = mesh.positions;
  // Armhole tip: the widest pattern point in the top quarter of the piece.
  const span = panel.maxY - panel.minY;
  let tipY = panel.minY;
  let tipX = -Infinity;
  for (const pt of panel.polygon) {
    if (pt.y <= panel.minY + span * 0.25 && pt.x > tipX) {
      tipX = pt.x;
      tipY = pt.y;
    }
  }
  const seam: Array<{ x: number; y: number; z: number; dy: number; dz: number }> = [];
  const placed = new Float32Array(p.length / 3);
  const onSeam = new Set<number>();
  const addSeam = (o: number): void => {
    if (p[o + 1]! < env.armpitY) return;
    // Next to the neck the ridge climbs the neck column: there the seam follows the shoulder's own
    // slope (measured 3.5–6 cm out from the neck) instead, so the neck point does not stand up.
    const x = Math.abs(p[o]!);
    const near = neckR + 0.035;
    const a = env.shoulder(Math.max(x, near));
    if (!a) return;
    const b = env.shoulder(near + 0.025);
    const ridge = x >= near || !b ? a : { y: a.y + ((a.y - b.y) / 0.025) * (near - x), z: a.z };
    onSeam.add(o);
    seam.push({ x: p[o]!, y: p[o + 1]!, z: p[o + 2]!, dy: ridge.y + GAP - p[o + 1]!, dz: ridge.z - p[o + 2]! });
  };
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((span - 2 * FLAT_EPSILON) * i) / ROWS;
    if (flatY > tipY + FLAT_EPSILON) break;
    addSeam((i * width + COLUMNS) * 3);
  }
  for (let j = 0; j < COLUMNS; j += 1) addSeam(j * 3);
  if (seam.length === 0) return placed;
  // One seam point per 3 mm of |x| (the first row crowds at the neck point), sorted along the seam.
  seam.sort((u, v) => u.x - v.x);
  const line = seam.filter((v, k) => k === 0 || v.x - seam[k - 1]!.x > 0.003);
  const along = (x: number): { dy: number; dz: number } => {
    let k = 0;
    while (k < line.length - 2 && line[k + 1]!.x < x) k += 1;
    const a = line[k]!;
    const b = line[Math.min(k + 1, line.length - 1)]!;
    const t = b.x > a.x ? clamp((x - a.x) / (b.x - a.x), 0, 1) : 0;
    return { dy: lerp(a.dy, b.dy, t), dz: lerp(a.dz, b.dz, t) };
  };
  const reach = 0.08;
  for (let o = 0; o < p.length; o += 3) {
    let near = Infinity;
    for (const v of line) near = Math.min(near, Math.hypot(p[o]! - v.x, p[o + 1]! - v.y, p[o + 2]! - v.z));
    // The seam itself always lands on the ridge (front and back meet there, the neck point included).
    const w = onSeam.has(o) ? 1 : (1 - smooth(near / reach)) * smooth((Math.abs(p[o]!) - neckR) / 0.025);
    if (w <= 0) continue;
    const d = along(p[o]!);
    placed[o / 3] = w;
    p[o + 1] = p[o + 1]! + d.dy * w;
    p[o + 2] = p[o + 2]! + d.dz * w;
  }
  return placed;
};

/** One trouser leg (left, +x), mirrored for the right one: legs below the crotch, pelvis above. */
const drapeLeg = (zd: ZoneDrape, env: BodyEnvelope, body: BodyMeasurements): Mesh => {
  const { group } = zd;
  const panel = (group.front ?? group.back)!;
  const l = bodyLandmarks(body);
  const band = 0.035 * bodyScale(body);
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  const legHang = (y: number): Support => {
    const c = env.legCentre(y);
    return hangOver(
      (v) => {
        const cv = env.legCentre(v);
        return shifted(env.leg(v), cv.x - c.x, cv.z - c.z);
      },
      y,
      Math.min(y + HANG, l.crotchY - 0.02),
    );
  };
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const y = l.waistY - (flatY - panel.minY) / 1000;
    const legC = legCircumference(group, flatY);
    const w = smooth((y - (l.crotchY - band)) / (2 * band)); // 0 = leg, 1 = pelvis
    const leg =
      w < 1
        ? (() => {
            const c = env.legCentre(Math.min(y, l.crotchY));
            const ly = Math.min(y, l.crotchY - 0.01);
            return { c, ring: fabricRing(env.leg(ly), legHang(ly), legC, 0, 0.5).ring };
          })()
        : null;
    const pelvis = w > 0 ? fabricRing(env.torso(y), hangOver(env.torso, y, Math.min(y + HANG, l.waistY)), 2 * legC, 0, 0.5).ring : null;
    for (let j = 0; j < LEG_RADIAL; j += 1) {
      const f = j / LEG_RADIAL;
      let x = 0;
      let z = 0;
      if (leg) {
        const p = pointAt(leg.ring.curve, f * leg.ring.curve.arc[ANGLES]!);
        x = leg.c.x + p.x;
        z = leg.c.z + p.z;
      }
      if (pelvis) {
        // Outer half: centre front → side → centre back; inner half: the crotch seam on x = 0.
        let px: number;
        let pz: number;
        if (f <= 0.5) {
          const p = pointAt(pelvis.curve, 2 * f * pelvis.half);
          px = p.x;
          pz = p.z;
        } else {
          const back = pointAt(pelvis.curve, pelvis.half);
          const front = pointAt(pelvis.curve, 0);
          px = 0;
          pz = lerp(back.z, front.z, (f - 0.5) * 2);
        }
        x = lerp(x, px, w);
        z = lerp(z, env.axisZ + pz, w);
      }
      mesh.positions.push(x, y, z);
      mesh.uvs.push(f * legC, flatY / 1000);
    }
  }
  gridMesh(mesh, 0, ROWS, LEG_RADIAL, true, true);
  addMirror(mesh);
  return mesh;
};

/** A sleeve (left arm), mirrored for the right one, along the arm's own axis. */
const drapeSleeve = (panel: Classified, env: BodyEnvelope): Mesh | null => {
  const arm = env.arm;
  if (!arm) return null;
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  const at = (t: number): Support => arm.support(clamp(t, 0, arm.length));
  // The underarm seam starts at the armpit: the cap (from its top down to its widest row) wraps the
  // deltoid between the top of the shoulder and the armpit, the rest of the sleeve runs down the arm.
  const side = env.torso(env.armpitY)[ANGLES / 4]!;
  const armpit = clamp(
    (side - arm.start.x) * arm.dir.x + (env.armpitY - arm.start.y) * arm.dir.y + (env.axisZ - arm.start.z) * arm.dir.z,
    0,
    0.06,
  );
  let capY = panel.minY;
  let widest = 0;
  for (let k = 0; k <= 40; k += 1) {
    const y = panel.minY + ((panel.maxY - panel.minY) * k) / 40;
    const e = rowExtent(panel.polygon, Math.min(panel.maxY - FLAT_EPSILON, Math.max(panel.minY + FLAT_EPSILON, y)));
    const w = e ? e[1] - e[0] : 0;
    if (w > widest + 0.5) {
      widest = w;
      capY = y;
    }
  }
  /** The armhole seam seen from the arm: at the armpit under the arm, over the deltoid on the outside. */
  const CAP_TOP = -0.075;
  const toWorld = (t: number, u: number, v: number): [number, number, number] => [
    arm.start.x + arm.dir.x * t + arm.side.x * u + arm.front.x * v,
    arm.start.y + arm.dir.y * t + arm.side.y * u + arm.front.y * v,
    arm.start.z + arm.dir.z * t + arm.side.z * u + arm.front.z * v,
  ];
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const extent = rowExtent(panel.polygon, flatY) ?? [0, 0];
    // Cap rows: 0 at the widest row (underarm), 1 at the top of the cap (the armhole seam).
    const cap = flatY < capY && capY > panel.minY ? (capY - flatY) / (capY - panel.minY) : 0;
    const along = armpit + (cap > 0 ? 0 : (flatY - capY) / 1000);
    // A sleeve longer than the arm stacks up at the wrist (as fabric does) instead of covering the hand.
    const t = along > arm.wrist ? arm.wrist + (along - arm.wrist) * 0.2 : along;
    // The cap is as wide as the widest row: it is set into the armhole all round.
    const width = Math.max(cap > 0 ? widest : extent[1] - extent[0], 0) / 1000;
    for (let j = 0; j < SLEEVE_RADIAL; j += 1) {
      // 0 under the arm, 1 over the front, the top and the back of the shoulder.
      const outside = smooth(((1 - Math.cos((2 * Math.PI * j) / SLEEVE_RADIAL)) / 2) * 2.2);
      const tj = cap > 0 ? lerp(t, lerp(armpit, CAP_TOP, outside), cap) : t;
      // Around the shoulder the sleeve goes round the whole deltoid, not just the arm's section.
      const near = arm.cap && tj < armpit + 0.03 ? supportMax([at(tj), arm.cap]) : at(tj);
      const { ring } = fabricRing(near, supportMax([near, hangOver(at, tj, Math.max(0, tj - 0.15))]), width, 0, 0.5);
      const seam = ring.curve.arc[(3 * ANGLES) / 4]!; // underarm, towards the body
      const p = pointAt(ring.curve, seam + (j / SLEEVE_RADIAL) * ring.curve.arc[ANGLES]!);
      mesh.positions.push(...toWorld(tj, p.x, p.z));
      mesh.uvs.push((j / SLEEVE_RADIAL) * width, flatY / 1000);
    }
  }
  pushOutOfTorso(mesh, env); // the cap rests on the shoulder, never inside it
  gridMesh(mesh, 0, ROWS, SLEEVE_RADIAL, true, true);
  return mesh;
};

const toPanel = (mesh: Mesh, data: Omit<PanelMeshData, 'positions' | 'indices' | 'border' | 'uvs'>): PanelMeshData => ({
  ...data,
  positions: Float32Array.from(mesh.positions),
  indices: Uint32Array.from(mesh.indices),
  border: Float32Array.from(mesh.border),
  uvs: Float32Array.from(mesh.uvs),
});

/**
 * Drapes the pattern on a body envelope. Every fabric row has the pattern's own circumference (front +
 * back widths at that height), rests on the body's convex hull and hangs from what is above it (bust,
 * hips, thighs); lengths are measured along the body, so a front cut longer than the back goes over the
 * bust. The side seams of front and back panels lie on the same ring, so they meet.
 */
export const drapeGarment = (layout: GarmentLayout, body: BodyMeasurements, env: BodyEnvelope): PanelMeshData[] => {
  const panels: PanelMeshData[] = [];
  for (const group of layout.zones) {
    const zd = zoneDrape(group, env, body);
    if (group.zone === 'legs') {
      const mesh = drapeLeg(zd, env, body);
      // One mesh holds both legs; split it so each leg keeps its own explode direction.
      const half = mesh.positions.length / 2;
      const halfIdx = mesh.indices.length / 2;
      const halfBorder = mesh.border.length / 2;
      const ref = (group.front ?? group.back)!;
      for (const side of [1, -1] as const) {
        const offset = side === 1 ? 0 : 1;
        panels.push(
          toPanel(
            {
              positions: mesh.positions.slice(offset * half, (offset + 1) * half),
              indices: mesh.indices.slice(offset * halfIdx, (offset + 1) * halfIdx).map((v) => v - offset * (half / 3)),
              border: mesh.border.slice(offset * halfBorder, (offset + 1) * halfBorder),
              uvs: mesh.uvs.slice((offset * mesh.uvs.length) / 2, ((offset + 1) * mesh.uvs.length) / 2),
            },
            {
              id: `legs-${side}`,
              label: side === 1 ? 'Jambe gauche' : 'Jambe droite',
              role: 'front',
              zone: 'legs',
              pieceIds: layout.pieceIds['legs'] ?? [],
              explode: { x: side, y: 0, z: ref.role === 'front' ? 0.3 : -0.3 },
            },
          ),
        );
      }
      continue;
    }
    for (const panel of [group.front, group.back]) {
      if (!panel) continue;
      panels.push(
        toPanel(drapeHalfPanel(zd, panel, env, body), {
          id: `${group.zone}-${panel.role}`,
          label: panel.piece.name,
          role: panel.role,
          zone: group.zone,
          pieceIds: layout.pieceIds[`${group.zone}-${panel.role}`] ?? [],
          explode: { x: 0, y: group.zone === 'skirt' ? -0.6 : 0, z: panel.role === 'front' ? 1 : -1 },
        }),
      );
    }
  }
  for (const sleeve of layout.sleeves) {
    const left = drapeSleeve(sleeve, env);
    if (!left) continue;
    const right: Mesh = { positions: [], indices: [], border: [], uvs: [] };
    for (let i = 0; i < left.positions.length; i += 3) right.positions.push(-left.positions[i]!, left.positions[i + 1]!, left.positions[i + 2]!);
    right.uvs.push(...left.uvs);
    for (let t = 0; t < left.indices.length; t += 3) right.indices.push(left.indices[t]!, left.indices[t + 2]!, left.indices[t + 1]!);
    for (let k = 0; k < left.border.length; k += 3) right.border.push(-left.border[k]!, left.border[k + 1]!, left.border[k + 2]!);
    for (const [side, mesh] of [[1, left], [-1, right]] as const) {
      panels.push(
        toPanel(mesh, {
          id: `sleeve-${sleeve.piece.id}-${side}`,
          label: sleeve.piece.name,
          role: 'sleeve',
          zone: 'sleeve',
          pieceIds: [sleeve.piece.id],
          explode: { x: side, y: 0, z: 0 },
        }),
      );
    }
  }
  return panels;
};

/** Height of the gathers above a midriff seam (m of fabric, measured flat). */
const GATHER_ZONE_MM = 70;

/**
 * A bodice gathered onto a midriff band (« fronces sous la poitrine ») is two pieces: the upper one
 * (its lower edge longer than the seam) and the band. The 3D drape needs one panel from the neck to the
 * waist: the band is stacked under the upper piece's seam, the upper piece's extra width just above the
 * seam is drawn in to the band's width and stands out as folds instead. Null when there is no band.
 */
export const stackMidriff = (upper: Classified, band: Classified): Classified | null => {
  const height = (pts: Point[]): number => Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
  const upperTop = Math.min(...upper.polygon.map((p) => p.y));
  const upperMaxY = Math.max(...upper.polygon.map((p) => p.y));
  // The seam meets the side at the widest point of the lower part of the upper piece.
  let seamY = upperMaxY;
  let side = -Infinity;
  for (const p of upper.polygon) {
    if (p.y > upperTop + 0.6 * (upperMaxY - upperTop) && p.x > side) {
      side = p.x;
      seamY = p.y;
    }
  }
  const bandTop = Math.min(...band.polygon.map((p) => p.y));
  const bandHeight = height(band.polygon);
  const bandWidth = (dy: number): [number, number] =>
    rowExtent(band.polygon, Math.min(bandTop + bandHeight - FLAT_EPSILON, Math.max(bandTop + FLAT_EPSILON, bandTop + dy))) ?? [0, 0];
  const seamWidth = bandWidth(0)[1];
  if (!(seamWidth > 0) || seamY <= upperTop) return null;
  const extentAt = (y: number): { x0: number; x1: number; extra: number } => {
    if (y >= seamY) {
      const [x0, x1] = bandWidth(y - seamY);
      return { x0, x1, extra: 0 };
    }
    const e = rowExtent(upper.polygon, Math.max(upperTop + FLAT_EPSILON, y)) ?? [0, 0];
    const t = smooth((y - (seamY - GATHER_ZONE_MM)) / GATHER_ZONE_MM);
    const x1 = lerp(e[1], Math.min(e[1], seamWidth), t);
    return { x0: e[0], x1, extra: e[1] - x1 };
  };
  const total = seamY + bandHeight;
  const rights: Point[] = [];
  const lefts: Point[] = [];
  for (let y = upperTop; y <= total + 1e-6; y += 5) {
    const e = extentAt(Math.min(y, total - FLAT_EPSILON));
    rights.push({ x: e.x1, y });
    lefts.push({ x: e.x0, y });
  }
  const polygon = [...rights, ...lefts.reverse()];
  return {
    ...upper,
    polygon,
    minY: upperTop,
    maxY: total,
    seamsFlatY: [seamY],
    // Folds as deep as a third of the drawn-in width, spread over the gathered part of the row.
    gatherAt: (flatY) => (flatY < seamY ? Math.min(0.012, (extentAt(flatY).extra / 1000) * 0.35) : 0),
  };
};

/** Segments per arc of a circle-skirt piece (mirrors packages/pattern-engine's skirt blocks). */
const CIRCLE_ARC_SEGMENTS = 64;

const pathLength = (points: Point[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
  return total;
};

/**
 * Skirt blocks (pattern-engine drape blocks) name no front or back: a gathered or pleated skirt is one
 * rectangle per side, a circle skirt an annular sector for the whole skirt (or half of it). Each becomes
 * a front and a back stand-in — a half-width outline per flat height, cut on the fold — whose widths
 * add up to the real fabric circumference at each depth below the waist. Null for any other piece.
 */
export const skirtBlockPanels = (piece: PatternPieceDto, polygon: Point[]): [Classified, Classified] | null => {
  const n = normalize(piece.name);
  if (!n.includes('jupe') || n.includes('devant') || n.includes('dos')) return null;
  const bounds = getBounds(polygon);
  const quantity = Math.max(1, piece.quantity);
  let waist: number;
  let hem: number;
  let length: number;
  let gathered = false;
  const half = CIRCLE_ARC_SEGMENTS + 1;
  if (n.includes('cercle') && polygon.length >= 2 * half) {
    // Inner arc (the waist), outer arc (the hem), joined by the straight side edges.
    waist = pathLength(polygon.slice(0, half)) * quantity;
    hem = pathLength(polygon.slice(half, 2 * half)) * quantity;
    length = Math.hypot(polygon[half]!.x - polygon[half - 1]!.x, polygon[half]!.y - polygon[half - 1]!.y);
  } else if (n.includes('fronc') || n.includes('pliss')) {
    waist = bounds.width * quantity;
    hem = waist;
    length = bounds.height;
    gathered = true;
  } else {
    return null;
  }
  const outline: Point[] = [
    { x: 0, y: 0 },
    { x: waist / 4, y: 0 },
    { x: hem / 4, y: length },
    { x: 0, y: length },
  ];
  const make = (role: 'front' | 'back'): Classified => ({
    piece,
    polygon: outline,
    role,
    zone: 'skirt',
    minY: 0,
    maxY: length,
    fold: 2,
    ...(gathered ? { gathered } : {}),
  });
  return [make('front'), make('back')];
};

/**
 * Turns the generated pattern pieces into 3D panels draped on a body that has the customer's
 * measurements. The panels come from the REAL piece widths (front + back = circumference at each
 * height), so ease, flare and length seen in 3D are the pattern's own — not a decorative guess.
 */
export const buildGarmentModel = (
  pieces: PatternPieceDto[],
  garmentType: string,
  measurements: Record<string, number> | null | undefined,
  templateId?: string | null,
): GarmentModelResult => {
  const body = readBodyMeasurements(measurements, templateId);
  const landmarks = bodyLandmarks(body);
  const rings = buildTorsoRings(body);

  const classified: Classified[] = [];
  /** Pieces with a usable outline that no front/back rule recognised (candidates for the generic wrap). */
  const unrecognised: Classified[] = [];
  const ignored: string[] = [];
  for (const piece of pieces) {
    const outline = (piece.dimensionsJson as { outlineMm?: Point[] } | null)?.outlineMm;
    const role = classifyPiece(piece.name, garmentType);
    if (!outline || outline.length < 3) {
      ignored.push(piece.name);
      continue;
    }
    const polygon = openPolygon(outline);
    const bounds = getBounds(polygon);
    if (bounds.height <= 1 || bounds.width <= 1) {
      ignored.push(piece.name);
      continue;
    }
    const block = role ? null : skirtBlockPanels(piece, polygon);
    if (block) {
      classified.push(...block);
      continue;
    }
    if (!role) {
      unrecognised.push({
        piece,
        polygon: polygon.map((pt) => ({ x: pt.x - bounds.minX, y: pt.y })),
        role: 'front',
        zone: 'torso',
        minY: bounds.minY,
        maxY: bounds.maxY,
        fold: 0.5,
      });
      continue;
    }
    classified.push({ piece, polygon, role: role.role, zone: role.zone, minY: bounds.minY, maxY: bounds.maxY });
  }

  let generic = false;
  let genericTopY: number | null = null;
  if (classified.filter((c) => c.role !== 'sleeve').length === 0) {
    // Any garment can be worn: with no front/back pieces (saris, capes, free drapes, "other"), the
    // largest piece is wrapped around the body, its width being the circumference.
    const wrap = pickLargest(unrecognised);
    if (!wrap) {
      return {
        ok: false,
        reason: 'Aucune pièce du patron ne peut être posée sur le mannequin (contours manquants ou vides).',
      };
    }
    generic = true;
    const heightM = (wrap.maxY - wrap.minY) / 1000;
    genericTopY = Math.min(landmarks.napeY, heightM + 0.05);
    classified.push({ ...wrap, role: 'front', zone: 'torso' }, { ...wrap, role: 'back', zone: 'torso' });
    unrecognised.splice(unrecognised.indexOf(wrap), 1);
  }
  for (const rest of unrecognised) ignored.push(rest.piece.name);

  const zones: ZoneGroup[] = [];
  const pieceIds: Record<string, string[]> = {};
  for (const zone of ['bodice', 'torso', 'legs', 'skirt'] as const) {
    const inZone = classified.filter((c) => c.zone === zone);
    let front = pickLargest(inZone.filter((c) => c.role === 'front'));
    const midriff = inZone.find((c) => c.role === 'front' && normalize(c.piece.name).includes('empiecement'));
    if (front && midriff && front !== midriff) front = stackMidriff(front, midriff) ?? front;
    const back = pickLargest(inZone.filter((c) => c.role === 'back'));
    if (!front && !back) continue;
    const topY =
      zone === 'skirt' || zone === 'legs'
        ? landmarks.waistY
        : generic && genericTopY !== null
          ? genericTopY
          : landmarks.napeY;
    zones.push({ zone, topY, front, back });
    pieceIds[zone] = inZone.map((c) => c.piece.id);
    for (const role of ['front', 'back'] as const) pieceIds[`${zone}-${role}`] = inZone.filter((c) => c.role === role).map((c) => c.piece.id);
  }
  const layout: GarmentLayout = { zones, sleeves: classified.filter((c) => c.role === 'sleeve'), pieceIds };

  const env = proceduralEnvelope(body, rings);
  const panels = drapeGarment(layout, body, env);

  const drapes = zones.map((group) => zoneDrape(group, env, body));
  const circumferenceCmAt = (worldY: number, zoneNames: GarmentZone[]): number | null => {
    for (const zd of drapes) {
      if (!zoneNames.includes(zd.group.zone)) continue;
      const c = zd.circumference(worldY);
      if (!c) continue;
      // Both legs together make the trouser circumference.
      return c.total * (zd.group.zone === 'legs' ? 2 : 1) * 100;
    }
    return null;
  };

  const bodyCmAt = (worldY: number): number => {
    const ring = ringAt(rings, worldY);
    return ellipseCircumference(ring.a, ring.b) * 100;
  };

  const fit: FitLine[] = [];
  const candidates: Array<[FitLine['label'], number, GarmentZone[]]> = [
    ['Poitrine', landmarks.bustY, ['bodice', 'torso']],
    ['Taille', landmarks.waistY + 0.005, ['bodice', 'torso', 'skirt', 'legs']],
    ['Bassin', landmarks.hipY, ['skirt', 'torso', 'legs']],
  ];
  for (const [label, y, zoneNames] of candidates) {
    const garmentCm = circumferenceCmAt(y, zoneNames);
    if (garmentCm === null) continue;
    const bodyCm = bodyCmAt(y);
    const easeCm = garmentCm - bodyCm;
    fit.push({
      label,
      bodyCm: Math.round(bodyCm * 10) / 10,
      garmentCm: Math.round(garmentCm * 10) / 10,
      easeCm: Math.round(easeCm * 10) / 10,
      status: fitStatus(easeCm),
    });
  }

  return {
    ok: true,
    model: { body, torsoRings: rings, panels, layout, fit, ignored, generic, templateId: getBodyTemplate(templateId).id },
  };
};
