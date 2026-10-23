import type { PatternPieceDto, Trim } from '@angaly/types';
import { featherGridOffsets, taubinSmooth } from './smooth-mesh';
import { detailAreasOf, drapePatch, isLining, mirrorPatch, piecesNamed, type DetailSpec, type PatchMesh } from './detail-patch';
import { closeDarts, getBounds, openPolygon, polygonAreaCm2, type Point } from '../pattern-geometry';
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
  type LimbFrame,
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
import { beadsAlong, drapeBerthe, drapeFrill, FRILL_SHOW, withMirrorBeads, type ClothMap, type TrimMesh } from './trims-model';
import { constructionRoleOf, drapeConstruction, type ConstructionPiece } from './construction-model';
import { understructureKindOf, understructureSupport, type Understructure } from './understructure';
import { collarKindOf, drapeBelt, drapeCollar, drapeCord, drapeCuff, drapeRevers, type CollarMesh, type CollarSpec } from './collar-model';

export type PanelRole = 'front' | 'back' | 'sleeve' | 'collar' | 'trim';
export type GarmentZone = 'bodice' | 'skirt' | 'torso' | 'legs';

export interface PanelMeshData {
  id: string;
  label: string;
  role: PanelRole;
  zone: GarmentZone | 'sleeve' | 'collar' | 'plastron' | 'cord' | 'belt' | 'cuff' | 'revers' | 'lace' | 'beads' | 'detail';
  /** A detail piece cut in lining (a pocket bag): drawn in the lining's colour. */
  lining?: boolean;
  /** A detail piece cut in the contrasting fabric (a gilet's points, crossed tabs): drawn in the plastron's fabric. */
  contrast?: boolean;
  /** Beads (zone `beads`): `positions` are the bead centres, each a sphere of this radius (m). */
  beadRadius?: number;
  /** Colour of a garniture (lace, beads) as chosen on the pattern (#rrggbb); absent: its default. */
  trimColor?: string;
  /** Lace or tulle (zone `lace`): drawn as a see-through, patterned layer. */
  material?: 'DENTELLE' | 'TISSU' | 'TULLE';
  /** A detail drawn as a motif (zone `detail`): embroidery in its thread colour (`trimColor`), or smocking's honeycomb. */
  motif?: 'BRODERIE' | 'SMOCKS';
  /** 1 per vertex cut in the accent fabric (a sleeve's puff), when part of the panel is. */
  accent?: Uint8Array;
  /** Ambient occlusion per vertex (1 = open cloth, less in the hollows of the folds). */
  ao?: Float32Array;
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
  /** Where each vertex lies on the pattern, for modelling the pattern on the 3D garment (absent: not editable). */
  edit?: PanelEditMap | undefined;
}

/**
 * Per vertex, the pattern piece and the point of its outline coordinates (mm) the vertex was draped from.
 * `piece[v]` indexes `pieceIds` (NOT_EDITABLE: the vertex comes from no piece, e.g. a plastron's fill).
 */
export interface PanelEditMap {
  pieceIds: string[];
  piece: Uint8Array;
  /** x, y (mm, the piece's own outline coordinates) per vertex. */
  flat: Float32Array;
}

export const NOT_EDITABLE = 255;

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
  /** Collar pieces (band, shirt, shawl, lavallière), draped round the neck and down the chest. */
  collars: Classified[];
  /** Plastron, cord, belt, bow and cuffs: drawn from the fronts' opening, at the waist and the wrists, not as panels. */
  trims: Classified[];
  /** Ids per zone/role, for highlighting. */
  pieceIds: Record<string, string[]>;
  /** The petticoat under the skirt (« Jupon »): drawn as an inner layer, and what the skirt rests on. */
  petticoat?: Classified;
  /** A train block (« Traîne (demi-ellipse) »): sewn along the back hem, it lies on the floor behind. */
  train?: Classified;
  /** Berthe pieces (« Berthe Devant / Dos »): laid on the bodice along its neckline edge. */
  berthe?: { front?: Classified; back?: Classified };
  /** Sleeve frills (« Volant de manche k/n »), sewn round the sleeve hems, the first one lowest. */
  frills?: Classified[];
  /** The garnitures chosen on the pattern (colours, bead rows): what the pieces alone do not say. */
  trimSpecs?: Trim[];
  /** Pieces sewn onto or inside another (fly, pockets, welts, turn-up): laid where the engine's detail areas put them. */
  detailPieces?: Array<{ id: string; name: string }>;
  /** Construction pieces that stand off the garment (flounces, godets, peplum, capelet, bows, pouf, engageantes). */
  construction?: ConstructionPiece[];
  /** Hidden supports under the skirt (side hoops, bustle pad): never draped, they push the skirt out. */
  understructure?: Understructure[];
}

export interface GarmentModel {
  body: BodyMeasurements;
  torsoRings: BodyRing[];
  /** Panels draped on the procedural mannequin; the viewer re-drapes them on the human mesh. */
  panels: PanelMeshData[];
  layout: GarmentLayout;
  fit: FitLine[];
  /** Pieces that were not placed on the mannequin (trains, unknown pieces…). */
  ignored: string[];
  /** Pieces sewn inside the garment (facings): part of the pattern, never seen on the mannequin. */
  inside: string[];
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
  zone: GarmentZone | 'sleeve' | 'collar' | 'plastron';
  minY: number;
  maxY: number;
  /** Overrides the fold factor (generic wraps: the piece is the whole width). */
  fold?: number;
  /** Gathered or pleated onto the waist seam: the width beyond the seam is taken up by folds there. */
  gathered?: boolean;
  /** Pleated skirt: number of pleats round the whole skirt (one fold each). */
  pleats?: number;
  /** Depth (m) of the gathers at a flat height (a bodice gathered onto a midriff band). */
  gatherAt?: (flatY: number) => number;
  /** Flat heights of inner seams drawn across the panel (the midriff seam of a stacked bodice). */
  seamsFlatY?: number[];
  /** Inner seams running down the panel (between joined pieces: a gored skirt's gores), as flat polylines. */
  seamLines?: Point[][];
  /** Index (in `toPiece.ids`) of the piece of a joined panel that may be cut in the contrasting fabric (a side gore). */
  accentPiece?: number;
  /**
   * Joined from pieces cut side by side that keep their own coordinates (gores, princess panels): a point of the first
   * piece has the same flat x, y on the joined panel, so what the engine places on it (details, buttons) still lands.
   */
  keepsFrame?: boolean;
  /** The other piece a joined panel is made of (two-piece sleeve): part of the drape cache's key. */
  partner?: PatternPieceDto;
  /**
   * Crossover front (cache-cœur): the edge of the side that crosses over, from the centre-front neck
   * point to the seam on the other side (flat coordinates; x < 0 lies across the centre front).
   */
  crossLine?: Point[];
  /** Robe-manteau front: flat height where the opening over the plastron starts (its centre-front neck point). */
  opensAtFlatY?: number;
  /**
   * The panel's flat coordinates are not the piece's own (a skirt block, a stacked midriff, a generic wrap):
   * where a panel point lies on the real pieces. Absent ⇒ the polygon IS the piece's outline.
   */
  toPiece?: PieceMapping;
}

/** A panel's flat point → [index in `ids`, x, y] on the piece it was cut from, or null (not editable). */
interface PieceMapping {
  ids: string[];
  map: (x: number, y: number) => [number, number, number] | null;
}

/** Flat point of a panel → its place on the pattern piece, pushed as (piece index, x, y). */
const pushFlat = (out: number[], c: Classified, x: number, y: number): void => {
  if (!c.toPiece) {
    out.push(0, x, y);
    return;
  }
  const hit = c.toPiece.map(x, y);
  if (hit) out.push(hit[0], hit[1], hit[2]);
  else out.push(NOT_EDITABLE, 0, 0);
};

/** Points this close (mm) to a coat-dress front's smallest x lie on its opening edge. */
const OPENING_EDGE_MM = 30;

/** Pieces sewn inside or too small to drape: listed with the pattern, never shown on the mannequin. */
const INSIDE_NAMES = [
  'parementure',
  'fond de poche',
  'coulisse de baleine',
  'sous-patte',
  'garniture de poche',
  'passepoil',
  'poche plaquee',
  'cordon de serrage',
  'bande de revers',
  // A long dress's waist stay is sewn inside (« Ceinture intérieure », not a belt).
  'ceinture interieure',
  // A gilet's crossed tabs are laid on the skirt through the skirt's detail areas (see detail-patch.ts).
  'pan croise',
  // A sheer back's tulle: not draped (the back bodice shows its low neckline).
  'tulle du dos',
  // Construction pieces (pattern-engine `shared/construction.ts`): linings and interfacings keep the name of the piece
  // they line (« Doublure — Corsage Devant ») and must never be draped as that panel; the others are hidden supports.
  'doublure',
  'entoilage',
  'balayeuse',
  'soutien de bouffant',
  'coussin de tournure',
  'panier (poche de hanche)',
  'lien de',
  'biais d',
  'gousset',
  'jabot — patte',
  'engageante — bracelet',
];

/** Flat y (mm) of the natural waist line the engine draws inside a piece cut above or below it, or null. */
const waistLineOf = (c: Classified): number | null => {
  const lines = (c.piece.dimensionsJson as { internalLinesMm?: Array<{ kind?: string; points?: Point[] }> } | null)?.internalLinesMm;
  const waist = lines?.find((line) => line.kind === 'WAIST' && Array.isArray(line.points) && line.points.length > 0);
  return waist ? waist.points![0]!.y : null;
};

/** Pieces drawn as trims (not draped as panels): plastron, cord, tied belt and its bow, cuffs. */
const TRIM_NAMES = ['plastron', 'cordeliere', 'ceinture', 'noeud', 'poignet', 'revers'];
/** Finished height of a belt and of a cuff (m), when the piece's own cannot be read. */
const BELT_HEIGHT = 0.045;
const CUFF_HEIGHT = 0.035;

const pieceIdsOf = (c: Classified): string[] => c.toPiece?.ids ?? [c.piece.id];

const normalize = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').toLowerCase();

const TORSO_GARMENTS = new Set(['CHEMISE', 'VESTE', 'COSTUME', 'AUTRE']);

export const classifyPiece = (
  name: string,
  garmentType: string,
): { role: PanelRole; zone: GarmentZone | 'sleeve' } | null => {
  const n = normalize(name);
  if (n.includes('manche')) return { role: 'sleeve', zone: 'sleeve' };

  // A princess side panel (« Bustier Côté », « Jupe Côté ») is neither front nor back: it is sewn to the front
  // (joinPieces puts them together), so the front reaches the side seam.
  const role: PanelRole | null = n.includes('devant') ? 'front' : n.includes('dos') ? 'back' : n.includes('cote') ? 'front' : null;
  if (!role) return null;

  if (n.includes('corsage') || n.includes('buste') || n.includes('bustier') || n.includes('haut') || n.includes('empiecement')) return { role, zone: 'bodice' };
  if (n.includes('jupe')) return { role, zone: 'skirt' };
  // A suit's trousers (« Devant Pantalon (Costume) »): legs, not part of the jacket's torso.
  if (n.includes('pantalon')) return { role, zone: 'legs' };
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
  /** Length of the seam a gathered / pleated skirt is sewn onto (the bodice's lower edge), m. */
  seamLength?: number;
  /** A bodice that ends above the waist (empire line): it hangs from the neck, and the skirt starts at its lower edge. */
  hanging?: boolean;
  /** Stiff cloth (STRUCTURE / RIGIDE): gathers and pleats keep their volume instead of falling in. */
  structured?: boolean;
  /** Skirt only: the petticoat (« Jupon ») worn under it, which holds the skirt out (a ball gown's dome). */
  petticoat?: Classified;
  /** Skirt only: side hoops or a bustle pad under it (see understructure.ts). */
  understructure?: Understructure[];
}

/** A bodice shorter than this share of the nape-to-waist length ends above the waist (empire / cropped). */
const SHORT_BODICE_RATIO = 0.85;

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

/** Most the fabric next to the neck is lifted onto the skin under it (m); higher skin there is the neck itself. */
const NECK_SEAT_MAX = 0.012;

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
    if (neckR !== undefined && env.skinTop && slope < 1) {
      // Next to the neck the trapezius rises under the shoulder seam's ends: the skin right under the fabric (not the
      // neck column beside it, which stands higher than NECK_SEAT_MAX) would show through it.
      const skin = env.skinTop(x, p[o + 2]!);
      const lift = skin === null ? 0 : skin + GAP - p[o + 1]!;
      if (lift > 0 && lift < NECK_SEAT_MAX) p[o + 1] = p[o + 1]! + lift * (1 - slope);
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
  const kneeY = l.kneeY;
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
  /** Piece index, x, y (mm) on the pattern per vertex (see PanelEditMap); absent ⇒ not editable. */
  flat?: number[];
  /** Ids the piece indices of `flat` refer to. */
  flatIds?: string[];
  /** Robe-manteau: the plastron seen through the opening between the two fronts (front panels only). */
  fill?: Mesh;
  /** Flat height (mm, the front piece's) of each row of `fill`. */
  fillFlatY?: number[];
  /** 1 per vertex on the part cut in the accent fabric (the puff of a sleeve), else 0. */
  accent?: number[];
  /** Light reaching each vertex (1 = open cloth, less in the hollow of a fold): ambient occlusion. */
  ao?: number[];
  /** Offsets (into `positions`, the +x half) of the shoulder seam's vertices, from the neck point to the armhole tip. */
  shoulderSeam?: number[];
  /** Trousers (+x leg, before the mirror): each piece's marks, the marks drawn once, and the detail pieces on them. */
  legParts?: LegParts;
}

interface LegParts {
  /** Mark segments (xyz pairs) per piece of the leg (0: front, 1: back). */
  marks: number[][];
  /** Marks drawn on one leg only (the fly). */
  single: number[];
  /** Detail pieces laid on the leg, by the piece that carries them. */
  patches: Array<{ side: number; spec: DetailSpec; patch: PatchMesh }>;
}

/** Darkest hollow of a fold (share of the light that still reaches it). */
const FOLD_AO = 0.45;
/** A hollow this deep (m) under the crests round it is as dark as FOLD_AO. */
const FOLD_AO_DEPTH = 0.03;

/** A sleeve row this puffed (0 → 1, see PUFF_RING_*) is the puff, cut in the accent fabric when there is one. */
const ACCENT_PUFF = 0.25;

/** Adds the mirror image (x → −x) of the vertices from `from`, with the winding flipped. */
const addMirror = (mesh: Mesh): void => {
  const count = mesh.positions.length / 3;
  for (let i = 0; i < count; i += 1) mesh.positions.push(-mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!);
  // The other half of a piece cut on the fold: the fabric continues past the centre line.
  for (let i = 0; i < count; i += 1) mesh.uvs.push(-mesh.uvs[i * 2]!, mesh.uvs[i * 2 + 1]!);
  // Both halves are cut from the same place of the pattern.
  if (mesh.flat) mesh.flat.push(...mesh.flat.slice(0, count * 3));
  if (mesh.ao) mesh.ao.push(...mesh.ao.slice(0, count));
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
  body: BodyMeasurements,
  ceiling: number,
  hang: (y: number) => Support,
): Mapping => {
  const l = bodyLandmarks(body);
  const up = group.zone === 'bodice' && !group.hanging;
  // A skirt hangs from its seam: the waist, or lower under a bodice that runs on over the hips.
  const anchorY = up ? l.waistY : group.topY;
  // A bodice is anchored at its waist row; what lies below it (a basque) goes down over the hips.
  const anchorFlat = up ? waistRowOf(panel) : panel.minY;
  const below = up ? panel.maxY - anchorFlat : 0;
  const k0 = panel.role === 'back' ? ANGLES / 2 : 0;
  const lengthM = (panel.maxY - panel.minY) / 1000 + 0.05;
  // Centre line of the fabric: front (or back) support of the body, hanging from above.
  const profile = (y: number): number =>
    group.zone === 'legs' ? 0 : hang(y)[k0]! + GAP;
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
    if (up && flatY > anchorFlat) return anchorY - (flatY - anchorFlat) / 1000;
    const d = Math.abs(flatY - anchorFlat) / 1000;
    let i = 0;
    while (i < ss.length - 2 && ss[i + 1]! < d) i += 1;
    const t = (d - ss[i]!) / (ss[i + 1]! - ss[i]! || 1);
    return lerp(ys[i]!, ys[i + 1]!, t);
  };
  const top = toY(up ? panel.minY : panel.minY);
  const bottom = toY(panel.maxY);
  const toFlat = (wy: number): number | null => {
    if (up && below > 0 && wy < anchorY) return wy < anchorY - below / 1000 - 1e-4 ? null : anchorFlat + (anchorY - wy) * 1000;
    if (wy > Math.max(top, bottom) + 1e-4 || wy < Math.min(top, bottom) - 1e-4) return null;
    let i = 0;
    while (i < ys.length - 2 && (up ? ys[i + 1]! < wy : ys[i + 1]! > wy)) i += 1;
    const t = (wy - ys[i]!) / (ys[i + 1]! - ys[i]! || 1);
    const d = lerp(ss[i]!, ss[i + 1]!, clamp(t, 0, 1)) * 1000;
    return up ? anchorFlat - d : anchorFlat + d;
  };
  return { toY, toFlat };
};

/** Hem ÷ top width of a skirt panel from which it hangs from its fullest point all the way down (see zoneDrape). */
const FLARE_HANG_FROM = 1.8;

/** Hem width ÷ top width of a panel (1 for a straight one). */
const flareOf = (c: Classified): number => {
  const top = rowExtent(c.polygon, c.minY + Math.min(SKIRT_TOP_SLOPE_MM, (c.maxY - c.minY) / 4));
  const hem = rowExtent(c.polygon, c.maxY - FLAT_EPSILON);
  return top && hem && top[1] - top[0] > 1 ? (hem[1] - hem[0]) / (top[1] - top[0]) : 1;
};

/**
 * Hoops stand out 60 % of their pocket over a skirt 1.5 × the body round its seam (the waist, or the hips under a
 * dropped waist) at the hem, all of it over one 3 × (a full pleated or gathered skirt: cut straight, but wide).
 */
const withHoopScale = (u: Understructure, front: Classified | undefined, back: Classified | undefined, waist: number): Understructure => {
  if (u.kind !== 'PANIERS' || (!front && !back)) return u;
  const hem = (c: Classified | undefined): number => (c ? (halfWidthAt(c, c.maxY) * foldFactor(c)) / 1000 : 0);
  const f = hem(front) || hem(back);
  const b = hem(back) || hem(front);
  return { ...u, scale: clamp(0.6 + (0.4 * ((f + b) / Math.max(0.3, waist) - 1.5)) / 1.5, 0.6, 1) };
};

/**
 * Radius (m) of the petticoat at a world height, or null outside it. Its pieces are cut on the fold (a front and a
 * back, `quantity` 2): the circumference at a flat height is 2 × quantity × the piece's half-width there. Round, about
 * the body's axis: a crinoline stands clear of the legs. The flat length runs along its slope (a dome is longer than
 * it is high): walking down the piece, each step drops by what the widening leaves of it.
 */
const petticoatRadius = (petticoat: Classified, topY: number): ((y: number) => number | null) => {
  const radiusAt = (flatY: number): number => (2 * Math.max(1, petticoat.piece.quantity) * halfWidthAt(petticoat, flatY)) / 1000 / (2 * Math.PI);
  const step = 5;
  const ys: number[] = [topY];
  const rs: number[] = [radiusAt(petticoat.minY)];
  for (let flat = petticoat.minY + step; flat <= petticoat.maxY + 1e-6; flat += step) {
    const r = radiusAt(flat);
    const dr = r - rs[rs.length - 1]!;
    ys.push(ys[ys.length - 1]! - Math.sqrt(Math.max(0, (step / 1000) ** 2 - dr * dr)));
    rs.push(r);
  }
  const bottom = ys[ys.length - 1]!;
  return (y: number): number | null => {
    if (y > topY || y < bottom) return null;
    let i = 0;
    while (i < ys.length - 2 && ys[i + 1]! > y) i += 1;
    const t = (ys[i]! - y) / (ys[i]! - ys[i + 1]! || 1);
    return lerp(rs[i]!, rs[i + 1]!, clamp(t, 0, 1));
  };
};

/** How far above the floor a floor-length petticoat ends (m). */
const PETTICOAT_FLOOR_CLEARANCE = 0.01;

/** World height of the petticoat's hem (see petticoatRadius). */
const petticoatBottom = (radius: (y: number) => number | null, topY: number): number => {
  let y = topY;
  while (y > 0 && radius(y - 0.005) !== null) y -= 0.005;
  // A floor-length petticoat stops just above the floor, under the skirt that lies on it.
  return Math.max(FLOOR_Y + PETTICOAT_FLOOR_CLEARANCE, y);
};

/** The petticoat as a closed ring of cloth from the waist down to its hem, just inside the skirt. */
const drapePetticoat = (zd: ZoneDrape, petticoat: Classified, env: BodyEnvelope): Mesh => {
  const radius = petticoatRadius(petticoat, zd.group.topY);
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  const length = zd.group.topY - petticoatBottom(radius, zd.group.topY);
  for (let i = 0; i <= ROWS; i += 1) {
    const depth = (length * i) / ROWS;
    const y = zd.group.topY - depth;
    const r = radius(y) ?? 0;
    const curve = ringCurve(ringFromDelta(env.torso(y), new Float32Array(ANGLES).fill(r), PETTICOAT_GAP, 0));
    const perimeter = curve.arc[ANGLES]!;
    for (let j = 0; j < PETTICOAT_COLUMNS; j += 1) {
      const p = pointAt(curve, (perimeter * j) / PETTICOAT_COLUMNS);
      mesh.positions.push(p.x, y, env.axisZ + p.z);
      mesh.uvs.push((perimeter * j) / PETTICOAT_COLUMNS, depth);
    }
  }
  gridMesh(mesh, 0, ROWS, PETTICOAT_COLUMNS, true, false);
  // Its hem, seen under the skirt.
  const hem = ROWS * PETTICOAT_COLUMNS;
  for (let j = 0; j < PETTICOAT_COLUMNS; j += 1) {
    const a = (hem + j) * 3;
    const b = (hem + ((j + 1) % PETTICOAT_COLUMNS)) * 3;
    mesh.border.push(...mesh.positions.slice(a, a + 3), ...mesh.positions.slice(b, b + 3));
  }
  return mesh;
};

/** Petticoat: columns round its ring, and how far it lies off the body where it hugs it (inside the skirt's GAP). */
const PETTICOAT_COLUMNS = 96;
/** Cloth over a petticoat: its ring is at most this much longer than the petticoat's; deepest fold it falls into (m). */
const PETTICOAT_EASE = 1.06;
const PETTICOAT_FOLD_MAX = 0.06;
const PETTICOAT_GAP = 0.0015;

/**
 * A train block (a half-ellipse sewn along the whole back hem) on the floor: it starts at the back skirt's hem row
 * (both halves, side seam to side seam) and runs out behind, each column as long as the ellipse is deep there
 * (√(1 − u²) of its length, u = −1 … 1 across the hem), in the floor's backward-fanned direction.
 */
const drapeTrain = (back: Mesh, train: Classified, env: BodyEnvelope): Mesh => {
  const count = (ROWS + 1) * (COLUMNS + 1);
  const hem = ROWS * (COLUMNS + 1);
  const point = (k: number): [number, number, number] => [back.positions[k * 3]!, back.positions[k * 3 + 1]!, back.positions[k * 3 + 2]!];
  // Mirrored half from its side seam to the centre back, then this half from the centre back to its side seam.
  const edge: Array<[number, number, number]> = [];
  for (let j = COLUMNS; j >= 1; j -= 1) edge.push(point(count + hem + j));
  for (let j = 0; j <= COLUMNS; j += 1) edge.push(point(hem + j));
  const length = (train.maxY - train.minY) / 1000;
  const width = Math.max(...train.polygon.map((p) => p.x)) - Math.min(...train.polygon.map((p) => p.x));
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  for (let k = 0; k <= TRAIN_ROWS; k += 1) {
    const t = k / TRAIN_ROWS;
    edge.forEach(([x, y, z], i) => {
      const u = (2 * i) / (edge.length - 1) - 1;
      const reach = length * t * Math.sqrt(Math.max(0, 1 - u * u));
      const fan = Math.atan2(x, -(z - env.axisZ)) * FLOOR_FAN;
      mesh.positions.push(x + Math.sin(fan) * reach, k === 0 ? y : FLOOR_Y, z - Math.cos(fan) * reach);
      mesh.uvs.push((u * width) / 2000, t * length);
    });
  }
  gridMesh(mesh, 0, TRAIN_ROWS, edge.length - 1, false, true);
  return mesh;
};

/** Rows of a train lying on the floor. */
const TRAIN_ROWS = 16;

interface ZoneDrape {
  group: ZoneGroup;
  /** What the cloth at height y may not go inside: the body, and under a skirt its petticoat. */
  support: (y: number) => Support;
  /** What the cloth at height y rests and hangs on (the body above it, and over a posed leg a tent). */
  hang: (y: number) => Support;
  mappings: Map<Classified, Mapping>;
  ceiling: number;
  /** Garment circumference and front share at a world height (null: no panel there). */
  circumference: (y: number) => { total: number; frontShare: number } | null;
}

const zoneDrape = (group: ZoneGroup, env: BodyEnvelope, body: BodyMeasurements, options: DrapeOptions = {}): ZoneDrape => {
  const l = bodyLandmarks(body);
  const ceiling =
    group.zone === 'skirt'
      ? Math.max(l.waistY, group.topY)
      : group.zone === 'legs'
        ? Math.max(l.waistY, group.topY)
        : group.zone === 'bodice'
          ? l.napeY + 0.03
          : group.topY;
  // A skirt over a lifted or bent leg: the cloth runs in straight lines from its seam down to whatever
  // stands out below (a knee), like a tent, and hangs from it all the way down, not only 30 cm under it.
  const posedSkirt = group.zone === 'skirt' && options.legsPosed === true;
  // A flared skirt (heavy, wide at the hem) falls straight down from the fullest point above it — hips, seat — all
  // the way to the hem, instead of following the body's hollows below it (a mermaid line).
  const flared = group.zone === 'skirt' && [group.front, group.back].some((c) => c && flareOf(c) >= FLARE_HANG_FROM);
  // Over hoops or a bustle pad the cloth falls straight down from them to the hem. They are tied at the skirt's seam
  // when it is sewn below the waist (a dropped waist: 1920s hip panniers).
  const underTop = Math.min(l.waistY, group.topY);
  const under = group.zone === 'skirt' ? (group.understructure ?? []).map((u) => understructureSupport(u, underTop)) : [];
  const reach = posedSkirt || flared || under.length > 0 ? 2 : HANG;
  const seamSupport = posedSkirt ? env.torso(group.topY) : null;
  const tent = (y: number): Support | null => {
    if (!seamSupport || y >= group.topY) return null;
    const list: Support[] = [];
    for (let below = y; below > 0.02; below -= 0.02) {
      const t = (group.topY - y) / (group.topY - below);
      const h = env.torso(below);
      const blend = new Float32Array(ANGLES);
      for (let k = 0; k < ANGLES; k += 1) blend[k] = (1 - t) * seamSupport[k]! + t * h[k]!;
      list.push(blend);
    }
    return list.length > 0 ? supportMax(list) : null;
  };
  const petticoat = group.zone === 'skirt' && group.petticoat ? petticoatRadius(group.petticoat, group.topY) : null;
  const support = (y: number): Support => {
    const r = petticoat?.(y) ?? null;
    const base = r === null ? env.torso(y) : supportMax([env.torso(y), new Float32Array(ANGLES).fill(r)]);
    if (under.length === 0) return base;
    const torso = env.torso(y);
    const extra = under.map((f) => f(y, torso)).filter((h): h is Support => h !== null);
    return extra.length > 0 ? supportMax([base, ...extra]) : base;
  };
  const hang = (y: number): Support => {
    const above = hangOver(support, y, Math.min(y + reach, ceiling));
    const slope = tent(y);
    return slope ? supportMax([above, slope]) : above;
  };
  const mappings = new Map<Classified, Mapping>();
  for (const panel of [group.front, group.back]) if (panel) mappings.set(panel, buildMapping(panel, group, body, ceiling, hang));
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
  return { group, support, hang, mappings, ceiling, circumference };
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
/** Depth (m) of the folds of a row: given (gathers), or from the cloth's excess over the body (godets). */
const foldAmplitude = (ring: FabricRing, fall: number, amplitude?: number): number =>
  amplitude ?? (ring.excess < 0.06 ? 0 : Math.min(GODET_MAX, (ring.excess - 0.06) * GODET_GAIN) * fall);

const folds = (ring: FabricRing, s: number, fall: number, count: number, amplitude?: number): number => {
  const a = foldAmplitude(ring, fall, amplitude);
  if (a <= 0) return 0;
  const perimeter = ring.curve.arc[ANGLES]!;
  // Outward only (0 … amplitude): a fold never pushes the fabric into the body. Godets (no amplitude given) have
  // rounded crests and narrow valleys, as heavy cloth falls; gathers stay a plain wave.
  const wave = 0.5 - 0.5 * Math.cos((2 * Math.PI * count * s) / perimeter);
  return a * (amplitude === undefined ? Math.sqrt(Math.max(0, wave)) : wave);
};

/** Deepest godet (m) and how fast it deepens with the cloth's excess width over the body. */
const GODET_MAX = 0.055;
const GODET_GAIN = 0.16;
/** One godet every this much of the hem (m). */
const GODET_SPACING = 0.3;

/** Height (m) the cloth lying on the floor rests at (the floor is y = 0). */
const FLOOR_Y = 0.006;
/** Lowest the cloth lies on the floor (m): just above it, so it never shows through. */
const FLOOR_REST_Y = 0.0015;
/** Distance (m) over the floor in which a godet turns from standing out to rising up. */
const FLOOR_FOLD_TURN = 0.12;
/** Share of a godet's depth that rises as a ripple once the cloth lies on the floor. */
const FLOOR_RIPPLE = 0.5;
/** Cloth on the floor runs out at this share of its angle from the centre back (0: all straight back, 1: outward). */
const FLOOR_FAN = 0.08;

/** Plastron of a robe-manteau: columns across the opening, how far it runs under each front (m), how far behind. */
const PLASTRON_COLUMNS = 12;
/** Share of the plastron's print (its middle) seen through the narrow bodice opening. */
const PLASTRON_BODICE_SHARE = 0.45;
/** Depth (mm) below a skirt's top in which its waist edge may slope up towards the side. */
const SKIRT_TOP_SLOPE_MM = 25;
const PLASTRON_UNDERLAP = 0.025;
const PLASTRON_INSET = 0.992;

/** How far below the waist seam gathered fabric takes to open into its hanging width (m). */
const GATHER_OPEN = 0.3;
/** A long gathered skirt opens over this share of its length at least (a maxi skirt is not a balloon at the hips). */
const GATHER_OPEN_SHARE = 0.4;
/** Share of a gathered skirt's fabric width its folds' mid-line keeps once open (the rest is in folds). */
const GATHER_HANG = 0.85;
/** Same for stiff cloth, which holds its volume out to the hem. */
const STRUCTURED_HANG = 0.9;
/** Pleats stitched down at the seam are fully open at the hem: the hem keeps nearly all of its width. */
const PLEAT_HANG = 0.92;

/** Front or back panel of a torso / bodice / skirt zone, both halves. */
const drapeHalfPanel = (
  zd: ZoneDrape,
  panel: Classified,
  env: BodyEnvelope,
  body: BodyMeasurements,
): Mesh => {
  const { group } = zd;
  const mapping = zd.mappings.get(panel)!;
  const fullAlways = group.zone === 'skirt';
  const isFull = (y: number): boolean => fullAlways || y <= env.armpitY;
  const hang = zd.hang;

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
  const waistY = group.zone === 'skirt' ? group.topY : bodyLandmarks(body).waistY;
  const seamLength = panel.gathered ? (group.seamLength ?? supportPerimeter(env.torso(waistY)) + 2 * Math.PI * GAP + 0.03) : 0;
  const skirtLength = Math.max(0.2, (panel.maxY - panel.minY) / 1000);
  const rows: Row[] = [];
  // A skirt's waist edge rises a centimetre towards the hip: the rows across that slope are slivers, not the
  // cloth's width. They take the width of the first full row (otherwise an opened front would leave a gap).
  const seamRow = group.zone === 'skirt' ? rowExtent(panel.polygon, panel.minY + SKIRT_TOP_SLOPE_MM) : null;
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const own = rowExtent(panel.polygon, flatY) ?? [0, 0];
    const extent =
      seamRow && flatY < panel.minY + SKIRT_TOP_SLOPE_MM && own[1] - own[0] < 0.7 * (seamRow[1] - seamRow[0]) ? seamRow : own;
    const y = mapping.toY(flatY);
    const c = zd.circumference(y);
    const full = isFull(y) && c !== null;
    if (full && panel.gathered && c.total > seamLength) {
      // Pleats stitched down at the seam release gradually down to the hem (an A-line, not a balloon);
      // gathers open within the first ~30 cm.
      const open = panel.pleats
        ? Math.pow(clamp((waistY - y) / skirtLength, 0, 1), 0.75)
        : smooth((waistY - y) / Math.max(GATHER_OPEN, GATHER_OPEN_SHARE * skirtLength));
      const hangShare = panel.pleats ? PLEAT_HANG : group.structured ? STRUCTURED_HANG : GATHER_HANG;
      const free = Math.min(c.total, lerp(seamLength, Math.max(seamLength, c.total * hangShare), open));
      // Over a petticoat the cloth rests on it: the ring stays close round it and the width beyond falls into deep
      // folds (a ball gown's pleats), instead of standing off it as one smooth wide ring.
      // Over hoops or a bustle pad the gathers open as far as the cloth allows to go round them, and hang from them.
      const hangs = group.petticoat
        ? Math.min(free, Math.max(seamLength, (supportPerimeter(zd.support(y)) + 2 * Math.PI * GAP) * PETTICOAT_EASE))
        : group.understructure
          ? Math.min(c.total, Math.max(free, supportPerimeter(hang(y)) + 2 * Math.PI * GAP))
          : free;
      const { ring } = fabricRing(zd.support(y), hang(y), hangs, 0, c.frontShare);
      const foldCount = Math.max(1, Math.round(hangs / 0.07));
      // Over a petticoat, the cloth left over rounds into folds as deep as a wave that long: a wave of length λ and
      // depth A runs ≈ π²A²/λ longer than λ, so A = √(extra × λ) / π per fold (a ball gown's organ pleats).
      const depth = group.petticoat
        ? Math.min(PETTICOAT_FOLD_MAX, Math.sqrt(Math.max(0, c.total - hangs) / foldCount * (hangs / foldCount)) / Math.PI) * (0.4 + 0.6 * open)
        : Math.min(0.045, 0.3 * (c.total - hangs) / foldCount) * (0.4 + 0.6 * open);
      rows.push({ y, flatY, x0: Math.max(0, extent[0]), x1: Math.max(extent[1], 1e-6), ring, full, gather: depth });
      continue;
    }
    const gather = panel.gatherAt?.(flatY);
    const { ring } = full
      ? fabricRing(zd.support(y), hang(y), c.total, 0, c.frontShare)
      : fabricRing(zd.support(y), hang(y), null, ref?.delta ?? 0, refShare);
    rows.push({ y, flatY, x0: Math.max(0, extent[0]), x1: Math.max(extent[1], 1e-6), ring, full, ...(gather ? { gather } : {}) });
  }
  const firstFull = rows.find((r) => r.full);
  const kRef = firstFull ? firstFull.ring.seam / (firstFull.x1 / 1000) : 1;
  const topY = rows[0]!.y;
  const length = Math.max(0.1, Math.abs(topY - rows[ROWS]!.y));

  // Folds per ring, from the hem (the widest row): about one every 12 cm, an even number per half.
  const hem = Math.max(...rows.map((r) => r.ring.curve.arc[ANGLES]!));
  // Gathers fold every ~7 cm along the ring (finer at the seam, where the ring is shorter).
  // A pleated skirt folds once per pleat.
  const count =
    panel.pleats ?? (panel.gathered ? 2 * Math.max(6, Math.round(hem / 0.14)) : 2 * Math.max(3, Math.round(hem / GODET_SPACING)));
  // Gathers onto a band: small folds every ~2.5 cm.
  const gatherCount = 2 * Math.max(6, Math.round(hem / 0.05));
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [], flat: [], flatIds: pieceIdsOf(panel), ao: [] };
  const godets = panel.zone !== 'bodice';
  // A skirt longer than the way down to the floor (a train, a puddle hem) lies on the floor: below the last row that
  // still hangs, each row takes that row's ring and spreads outward on the floor by the length it has left. Hanging on
  // down, a train went through the floor as a narrow tube (only the longer pieces reach that far).
  const hanging = group.zone === 'skirt' ? rows.filter((r) => r.y >= FLOOR_Y) : [];
  const floorRow = hanging.length > 0 && hanging.length < rows.length ? hanging[hanging.length - 1]! : null;
  for (const row of rows) {
    const rowFolds: number[] = [];
    const onFloor = floorRow !== null && row.y < FLOOR_Y;
    const at = onFloor ? floorRow : row;
    const k = at.full ? at.ring.seam / (at.x1 / 1000) : kRef;
    const limit = at.full ? at.ring.seam : at.ring.half * (panel.role === 'front' ? refShare : 1 - refShare);
    const fall = smooth(Math.abs(topY - at.y) / length);
    // Length of cloth beyond the floor, and how much of a fold still stands out sideways rather than up.
    const spread = onFloor ? FLOOR_Y - row.y : 0;
    const sideways = Math.exp(-spread / FLOOR_FOLD_TURN);
    for (let j = 0; j <= COLUMNS; j += 1) {
      const x = (row.x0 + ((row.x1 - row.x0) * j) / COLUMNS) / 1000;
      const along = Math.min(x * k, limit);
      const s = panel.role === 'front' ? along : at.ring.half - along;
      const p = pointAt(at.ring.curve, s);
      // Folds along the outward direction from the axis; zero at the centre lines and the side seam.
      // A bodice does not fall into godets (they hang from a skirt's or a tunic's width): only its gathers fold. A straight
      // bodice a little wider than the waist got two or three broad shaded godets across the midriff.
      const envelope = godets || at.gather !== undefined ? Math.sin((Math.PI * along) / Math.max(limit, 1e-3)) : 0;
      const fold = envelope > 0 ? folds(at.ring, s, fall, panel.gatherAt && !panel.gathered ? gatherCount : count, at.gather) * envelope : 0;
      const len = Math.hypot(p.x, p.z) || 1;
      // The hollow: how far the cloth lies under the crests of the folds round it (0 on flat cloth).
      rowFolds.push(Math.max(0, foldAmplitude(at.ring, fall, at.gather) * envelope - fold));
      // On the floor a fold turns from standing out to rising up as a soft ripple, and the cloth runs out behind: its
      // direction swings from the outward one towards the centre back (a train sweeps back, not out to the sides).
      const out = fold * sideways;
      const fan = Math.atan2(p.x, -p.z) * FLOOR_FAN;
      mesh.positions.push(
        p.x + (p.x / len) * out + Math.sin(fan) * spread,
        // A ripple's trough rests on the floor, never under it.
        onFloor ? Math.max(FLOOR_REST_Y, FLOOR_Y + fold * (1 - sideways) * FLOOR_RIPPLE) : row.y,
        env.axisZ + p.z + (p.z / len) * out - Math.cos(fan) * spread,
      );
      // Along the cloth's width as draped (a short first row of a sloped edge would stretch the print).
      mesh.uvs.push(along, row.flatY / 1000);
      pushFlat(mesh.flat!, panel, x * 1000, row.flatY);
    }
    // The hollow between two folds gets less light than their crests, the more so the deeper it is. Not normalised
    // per row: that darkened the centre front and the side seams (where folds fade to nothing, the cloth is flat)
    // and switched whole rows on at 4 mm of fold — a fitted bodice showed a "six-pack" of dark grooves.
    for (const hollow of rowFolds) mesh.ao!.push(1 - (1 - FOLD_AO) * smooth(Math.min(1, hollow / FOLD_AO_DEPTH)));
  }
  // A coat-dress front stands off the centre line: the plastron fills the opening, a little behind the fronts.
  if (panel.role === 'front' && panel.opensAtFlatY !== undefined) {
    const fill: Mesh = { positions: [], indices: [], border: [], uvs: [] };
    let count = 0;
    // Down to the floor: below it the fronts lie on it (see `floorRow`) and the plastron stops at the hem it shows.
    const open = rows.filter((row) => row.flatY >= panel.opensAtFlatY! && row.x0 >= 1 && (group.zone !== 'skirt' || row.y >= FLOOR_Y));
    // A row cut across a sloped edge (the waist seam, the hem) is not the opening: keep each row's edge within
    // its neighbours' (median of 7), so the plastron never spreads sideways along a seam.
    const edges = open.map((row, i) => {
      const near = open.slice(Math.max(0, i - 3), i + 4).map((r) => r.x0).sort((a, b) => a - b);
      return Math.min(row.x0, near[Math.floor(near.length / 2)]! * 1.15 + 5);
    });
    for (const [i, row] of open.entries()) {
      const k = row.full ? row.ring.seam / (row.x1 / 1000) : kRef;
      const edge = (edges[i]! / 1000) * k + PLASTRON_UNDERLAP;
      for (let j = 0; j <= PLASTRON_COLUMNS; j += 1) {
        const s = -edge + (2 * edge * j) / PLASTRON_COLUMNS;
        const p = pointAt(row.ring.curve, s);
        fill.positions.push(p.x * PLASTRON_INSET, row.y, env.axisZ + p.z * PLASTRON_INSET);
        // Across the opening from one front to the other (0 → 1): the plastron's print is laid out on it — its
        // borders show on the skirt, where the opening is wide; on the bodice only its middle shows.
        const u = j / PLASTRON_COLUMNS;
        fill.uvs.push(group.zone === 'skirt' ? u : 0.5 + (u - 0.5) * PLASTRON_BODICE_SHARE, row.flatY / 1000);
      }
      count += 1;
    }
    if (count >= 2) {
      if (group.zone !== 'skirt') pushOutOfTorso(fill, env, 1);
      gridMesh(fill, 0, count - 1, PLASTRON_COLUMNS, false, true);
      mesh.fill = fill;
      mesh.fillFlatY = open.map((row) => row.flatY);
    }
  }
  if (group.zone !== 'skirt') {
    // Off the shoulders there is no shoulder seam: the edge stays where the pattern puts it, on the arms and the chest.
    const placed = isOffShoulder(panel) ? new Float32Array(mesh.positions.length / 3) : restOnShoulders(mesh, env, body, panel);
    pushOutOfTorso(mesh, env, panel.role === 'back' ? -1 : 1, placed, body.neck / (2 * Math.PI));
  }
  gridMesh(mesh, 0, ROWS, COLUMNS, false, true);
  // A flat point of the panel → its place on the draped half (bilinear in the grid of rows × columns).
  const span = panel.maxY - panel.minY - 2 * FLAT_EPSILON;
  const onCloth = (fx: number, fy: number): [number, number, number] => {
    const fi = clamp(((fy - panel.minY - FLAT_EPSILON) / span) * ROWS, 0, ROWS);
    const i = Math.min(ROWS - 1, Math.floor(fi));
    const ti = fi - i;
    const at = (r: number): [number, number, number] => {
      const row = rows[r]!;
      const fj = clamp(((fx - row.x0) / Math.max(1e-6, row.x1 - row.x0)) * COLUMNS, 0, COLUMNS);
      const j = Math.min(COLUMNS - 1, Math.floor(fj));
      const tj = fj - j;
      const a = (r * (COLUMNS + 1) + j) * 3;
      const q = mesh.positions;
      return [lerp(q[a]!, q[a + 3]!, tj), lerp(q[a + 1]!, q[a + 4]!, tj), lerp(q[a + 2]!, q[a + 5]!, tj)];
    };
    const a = at(i);
    const b = at(i + 1);
    return [lerp(a[0], b[0], ti), lerp(a[1], b[1], ti), lerp(a[2], b[2], ti)];
  };
  clothMaps.set(mesh, onCloth);
  // The crossover edge lies on the other half (x < 0 on the flat piece): placed by its mirror point.
  const cross: number[] = [];
  const line = panel.crossLine;
  if (line && line.length >= 2) {
    const STEPS = 24;
    let prev: [number, number, number] | null = null;
    for (let k = 0; k <= STEPS; k += 1) {
      const t = k / STEPS;
      const seg = Math.min(line.length - 2, Math.floor(t * (line.length - 1)));
      const u = t * (line.length - 1) - seg;
      const fx = lerp(line[seg]!.x, line[seg + 1]!.x, u);
      const fy = lerp(line[seg]!.y, line[seg + 1]!.y, u);
      const p = onCloth(Math.abs(fx), fy);
      // Mirrored onto the other half, a few millimetres proud of it: the layer that crosses over.
      const len = Math.hypot(p[0], p[2] - env.axisZ) || 1;
      const out: [number, number, number] = [-Math.sign(fx || 1) * Math.abs(p[0]) * (1 + 0.003 / len), p[1], env.axisZ + (p[2] - env.axisZ) * (1 + 0.003 / len)];
      if (fx > 0) out[0] = p[0];
      if (prev) cross.push(...prev, ...out);
      prev = out;
    }
  }
  for (const seamY of panel.seamsFlatY ?? []) {
    const i = Math.round(((seamY - panel.minY) / Math.max(1e-6, panel.maxY - panel.minY)) * ROWS);
    if (i <= 0 || i >= ROWS) continue;
    for (let j = 0; j < COLUMNS; j += 1) {
      const a = (i * (COLUMNS + 1) + j) * 3;
      mesh.border.push(...mesh.positions.slice(a, a + 6));
    }
  }
  // Sampled along their length so they follow the cloth round the body rather than cutting across it.
  for (const seam of panel.seamLines ?? []) {
    const points = densify(seam, DETAIL_STEP_MM);
    for (let k = 1; k < points.length; k += 1) mesh.border.push(...onCloth(points[k - 1]!.x, points[k - 1]!.y), ...onCloth(points[k]!.x, points[k]!.y));
  }
  addMirror(mesh);
  mesh.border.push(...cross);
  return mesh;
};

/** How far round the shoulder-neck point (m) the fabric follows it when the front's and the back's are brought together. */
const NECK_JOIN_REACH = 0.08;

/**
 * The front's and the back's shoulder seams start at the same shoulder-neck point once sewn. Each half panel is wrapped
 * round the body on its own, and their neck points land apart (the back's ~1.5–3 cm further out, the trapezius wider
 * than the front of the neck), leaving a triangle of skin between the two seams: both move to their midpoint, the cloth
 * round them following (both halves, seam lines included) and kept above the skin it is drawn onto.
 */
const joinNeckPoints = (front: Mesh, back: Mesh, env: BodyEnvelope, neckR: number): void => {
  // The neck point is the inner end of the shoulder seam: the last column of the first row.
  const at = (m: Mesh): [number, number, number] => [m.positions[COLUMNS * 3]!, m.positions[COLUMNS * 3 + 1]!, m.positions[COLUMNS * 3 + 2]!];
  const a = at(front);
  const b = at(back);
  if (a[0] <= 0 || b[0] <= 0) return;
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as const;
  const shift = (m: Mesh, own: [number, number, number]): void => {
    const d = [mid[0] - own[0], mid[1] - own[1], mid[2] - own[2]] as const;
    // What sliding along the ridge leaves of the way to the midpoint, at the neck point itself.
    const r0 = ridgeAt(env, neckR, own[0]);
    const r1 = ridgeAt(env, neckR, mid[0]);
    const rest = r0 && r1 ? [d[1] - (r1.y - r0.y), d[2] - (r1.z - r0.z)] : [d[1], d[2]];
    for (const list of [m.positions, m.border]) {
      for (let o = 0; o < list.length; o += 3) {
        const side = list[o]! < 0 ? -1 : 1;
        const w = 1 - smooth(Math.hypot(Math.abs(list[o]!) - own[0], list[o + 1]! - own[1], list[o + 2]! - own[2]) / NECK_JOIN_REACH);
        if (w <= 0) continue;
        // Along the shoulder: the cloth slides with the ridge's own rise and depth (both seams stay on it, closed).
        const x = Math.abs(list[o]!);
        const from = ridgeAt(env, neckR, x);
        const to = ridgeAt(env, neckR, x + d[0] * w);
        list[o] = list[o]! + side * d[0] * w;
        list[o + 1] = list[o + 1]! + (from && to ? to.y - from.y + rest[0]! * w : d[1] * w);
        list[o + 2] = list[o + 2]! + (from && to ? to.z - from.z + rest[1]! * w : d[2] * w);
        // Drawn towards the neck, the cloth meets the shoulder rising to it: it stays on the skin.
        const skin = env.skinTop?.(list[o]!, list[o + 2]!) ?? null;
        const lift = skin === null ? 0 : skin + GAP - list[o + 1]!;
        if (lift > 0 && lift < NECK_SEAT_MAX) list[o + 1] = list[o + 1]! + lift;
      }
    }
  };
  shift(front, a);
  shift(back, b);
  sewShoulderSeams(front, back, env, mid[0]);
};

/** Rounds of averaging that bring the two shoulder seams together (each one halves what still parts them). */
const SEAM_SEW_ROUNDS = 6;
/** How far from the shoulder seam (m) the fabric follows it when it is sewn to the other half's. */
const SEAM_SEW_REACH = 0.05;

/**
 * Each shoulder seam lies on the ridge at its own vertices, ~3 cm apart along the shoulder, and is straight between them;
 * the front's and the back's vertices stand at different |x| on a ridge that is not straight, so the two seams part by
 * up to ~1 cm between them and the skin shows through from above. Both move to the line halfway between them (again,
 * until they agree), the cloth round them following.
 */
const sewShoulderSeams = (front: Mesh, back: Mesh, env: BodyEnvelope, neckX: number): void => {
  const seamOf = (m: Mesh): number[] =>
    (m.shoulderSeam ?? []).filter((o) => m.positions[o]! >= neckX - 1e-4).sort((u, v) => m.positions[u]! - m.positions[v]!);
  const meshes = [front, back];
  const seams = meshes.map(seamOf);
  if (seams.some((s) => s.length < 2)) return;
  // Working copies of each seam: [x, y, z] per vertex, sorted along x.
  const lines = seams.map((s, k) => s.map((o) => [meshes[k]!.positions[o]!, meshes[k]!.positions[o + 1]!, meshes[k]!.positions[o + 2]!]));
  const at = (line: number[][], x: number, c: number): number => {
    if (x <= line[0]![0]!) return line[0]![c]!;
    for (let k = 1; k < line.length; k += 1) {
      const q = line[k]!;
      if (x <= q[0]!) {
        const p = line[k - 1]!;
        return lerp(p[c]!, q[c]!, q[0]! > p[0]! ? (x - p[0]!) / (q[0]! - p[0]!) : 0);
      }
    }
    return line[line.length - 1]![c]!;
  };
  const start = lines.map((line) => line.map((v) => [...v]));
  for (let round = 0; round < SEAM_SEW_ROUNDS; round += 1) {
    const next = lines.map((line) => line.map((v) => [v[0]!, (at(lines[0]!, v[0]!, 1) + at(lines[1]!, v[0]!, 1)) / 2, (at(lines[0]!, v[0]!, 2) + at(lines[1]!, v[0]!, 2)) / 2]));
    for (let k = 0; k < 2; k += 1) lines[k] = next[k]!;
  }
  meshes.forEach((m, k) => {
    // How far each seam vertex moved, along |x| (between vertices: in proportion).
    const moved = lines[k]!.map((v, i) => [v[0]!, v[1]! - start[k]![i]![1]!, v[2]! - start[k]![i]![2]!]);
    const seamPts = start[k]!;
    for (const list of [m.positions, m.border]) {
      for (let o = 0; o < list.length; o += 3) {
        const x = Math.abs(list[o]!);
        let near = Infinity;
        for (let i = 1; i < seamPts.length; i += 1) {
          const p = seamPts[i - 1]!;
          const q = seamPts[i]!;
          const e = [q[0]! - p[0]!, q[1]! - p[1]!, q[2]! - p[2]!];
          const len2 = e[0]! * e[0]! + e[1]! * e[1]! + e[2]! * e[2]!;
          const t = len2 > 0 ? clamp(((x - p[0]!) * e[0]! + (list[o + 1]! - p[1]!) * e[1]! + (list[o + 2]! - p[2]!) * e[2]!) / len2, 0, 1) : 0;
          near = Math.min(near, Math.hypot(x - p[0]! - t * e[0]!, list[o + 1]! - p[1]! - t * e[1]!, list[o + 2]! - p[2]! - t * e[2]!));
        }
        const w = 1 - smooth(near / SEAM_SEW_REACH);
        if (w <= 0) continue;
        list[o + 1] = list[o + 1]! + at(moved, x, 1) * w;
        list[o + 2] = list[o + 2]! + at(moved, x, 2) * w;
        const skin = env.skinTop?.(list[o]!, list[o + 2]!) ?? null;
        const lift = skin === null ? 0 : skin + GAP - list[o + 1]!;
        if (lift > 0 && lift < NECK_SEAT_MAX) list[o + 1] = list[o + 1]! + lift;
      }
    }
  });
};

/** A bodice piece or sleeve cut off the shoulders (the engine's « (hors épaules) » suffix): no shoulder seam. */
const isOffShoulder = (panel: Classified): boolean => normalize(panel.piece.name).includes('hors epaules');
/**
 * How much lower (m, along the arm) an off-the-shoulder sleeve's top edge lies than a set-in cap's crown: the engine
 * cuts the cap 5 cm under its crown (decollete HORS_EPAULES), so the edge runs on round the upper arm.
 */
const OFF_SHOULDER_SLEEVE_DROP = 0.05;

/** Each draped half panel's map from its pattern (mm) to its cloth: garnitures are laid on the cloth through it. */
const clothMaps = new WeakMap<Mesh, ClothMap>();

/** Default colours of the garnitures: antique ivory lace, champagne pearls. */
const LACE_COLOR = '#EFE2C2';
const PEARL_COLOR = '#F3E7CC';
/** Beads sit this far (m) out from the cloth (on top of a berthe, further). */
const BEAD_ON_CLOTH = 0.001;
const BEAD_ON_LACE = 0.009;

const trimPanel = (mesh: TrimMesh, data: Omit<PanelMeshData, 'positions' | 'indices' | 'border' | 'uvs'>): PanelMeshData => ({
  ...data,
  // Smoothed (edges fixed): the facets and zigzags of the draped grid go, the folds and the seams stay.
  positions: data.zone === 'beads' ? Float32Array.from(mesh.positions) : taubinSmooth(mesh.positions, mesh.indices),
  indices: Uint32Array.from(mesh.indices),
  border: Float32Array.from(mesh.border),
  uvs: Float32Array.from(mesh.uvs),
});

const beadPanel = (id: string, label: string, centres: Array<[number, number, number]>, beadMm: number, color: string | undefined, pieceIds: string[]): PanelMeshData => ({
  id,
  label,
  role: 'trim',
  zone: 'beads',
  pieceIds,
  positions: Float32Array.from(centres.flat()),
  indices: new Uint32Array(0),
  border: new Float32Array(0),
  uvs: new Float32Array(0),
  beadRadius: beadMm / 2000,
  ...(color ? { trimColor: color } : {}),
  explode: { x: 0, y: 0, z: 0.6 },
});

/**
 * The neckline edge of a bodice panel (flat, centre line first, x growing): its highest cloth across, stopping at the
 * shoulder-neck point on a shouldered neckline (the shoulder seam is no neckline), out to the armhole off the shoulders.
 */
const necklineEdgeOf = (panel: Classified, offShoulder: boolean): Point[] => {
  const xs = panel.polygon.map((p) => p.x);
  const maxX = Math.max(...xs);
  const edge: Point[] = [];
  for (let k = 0; k <= 40; k += 1) {
    const x = Math.min(maxX - 1, (maxX * k) / 40);
    let top = Infinity;
    for (let i = 0; i < panel.polygon.length; i += 1) {
      const a = panel.polygon[i]!;
      const b = panel.polygon[(i + 1) % panel.polygon.length]!;
      if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) top = Math.min(top, a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y));
    }
    if (Number.isFinite(top)) edge.push({ x, y: top });
  }
  if (offShoulder || edge.length < 2) return edge;
  // Up to the highest point (the shoulder-neck point); beyond it the edge is the shoulder seam.
  let high = 0;
  edge.forEach((p, i) => {
    if (p.y < edge[high]!.y - 0.5) high = i;
  });
  return edge.slice(0, high + 1);
};

/**
 * The shoulder ridge a shoulder seam rests on, at lateral distance |x|. Next to the neck the ridge climbs the neck
 * column: there it follows the shoulder's own slope (measured 3.5–6 cm out from the neck) instead, so the neck point
 * does not stand up.
 */
const ridgeAt = (env: BodyEnvelope, neckR: number, x: number): { y: number; z: number } | null => {
  const ax = Math.abs(x);
  const near = neckR + 0.035;
  const a = env.shoulder(Math.max(ax, near));
  if (!a) return null;
  const b = env.shoulder(near + 0.025);
  return ax >= near || !b ? a : { y: a.y + ((a.y - b.y) / 0.025) * (near - ax), z: a.z };
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
    const ridge = ridgeAt(env, neckR, p[o]!);
    if (!ridge) return;
    onSeam.add(o);
    seam.push({ x: p[o]!, y: p[o + 1]!, z: p[o + 2]!, dy: ridge.y + GAP - p[o + 1]!, dz: ridge.z - p[o + 2]! });
  };
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((span - 2 * FLAT_EPSILON) * i) / ROWS;
    if (flatY > tipY + FLAT_EPSILON) break;
    addSeam((i * width + COLUMNS) * 3);
  }
  for (let j = 0; j < COLUMNS; j += 1) addSeam(j * 3);
  mesh.shoulderSeam = [...onSeam];
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

/** Waist of wide / pull-on trousers: ease kept over the body, gathers round half the waist, their depth (m) and gain. */
const WAIST_GATHER_EASE = 0.08;
const WAIST_GATHERS = 9;
const WAIST_GATHER_MAX = 0.012;
const WAIST_GATHER_GAIN = 0.03;
/** A leg this much longer round than the body leg starts to hang loose, fully this much more. */
const LEG_LOOSE_FROM = 1.06;
const LEG_LOOSE_FULL = 0.3;
/** How far (m per m of drop) a fully loose leg's side may draw in (÷ looseness: freer as the leg fits closer). */
const LEG_FALL_TAPER = 0.12;
const LEG_FALL_FREE = 3;
/** A loose leg's ring moves out at most this far (m) to fall straight from the hip. */
const LEG_FALL_MAX = 0.06;
/** The pelvis ring keeps at least this share of the legs' width (the fork never takes it all). */
const PELVIS_MIN_SHARE = 0.6;
/** A leg this much wider than at the knee starts to fold, and folds fully this much wider again. */
const LEG_FLARE_FROM = 1.12;
const LEG_FLARE_FULL = 0.45;
/** A leg widening below the knee rounds out (towards a circle) by this share, fully once this much wider. */
const LEG_ROUND = 0.75;
const LEG_ROUND_FULL = 0.35;
/** Folds round one leg's hem, and their deepest (m). */
const LEG_GODETS = 6;
const LEG_GODET_MAX = 0.018;
/** Inner side of a leg once the thighs part: nearest the body's middle it comes (m), and the softness of that stop. */
const LEG_APART_MIN = 0.004;
const LEG_APART_SOFT = 0.015;
/** Height (m) under the crotch over which the legs may come apart (where the thighs do). */
/** Where the thighs touch, the inner side up to this far from the middle (m) is drawn past it by up to this much (m). */
const LEG_CLOSE_REACH = 0.012;
const LEG_CLOSE_OVERLAP = 0.006;
const LEG_APART_RAMP = 0.06;

/** The ease round the pelvis goes to the front and the sides (pleats, pockets); the back stays on the seat. */
const PELVIS_FRONT_BIAS = 0.6;
const PELVIS_EASE_WEIGHT = Float32Array.from({ length: ANGLES }, (_, k) => 1 + PELVIS_FRONT_BIAS * Math.cos((2 * Math.PI * k) / ANGLES));

/** The trousers' ring round the pelvis for a circumference, its ease weighted towards the front (bisection). */
const pelvisRing = (body: Support, hang: Support, circumference: number): { curve: RingCurve; half: number } => {
  const ringAtDelta = (delta: number): Support => {
    const out = new Float32Array(ANGLES);
    for (let k = 0; k < ANGLES; k += 1) out[k] = Math.max(body[k]! + GAP, hang[k]! + delta * PELVIS_EASE_WEIGHT[k]!);
    return out;
  };
  let lo = -0.3;
  let hi = 0.3 + circumference / Math.PI;
  for (let it = 0; it < 36; it += 1) {
    const mid = (lo + hi) / 2;
    if (supportPerimeter(ringAtDelta(mid)) < circumference) lo = mid;
    else hi = mid;
  }
  const curve = ringCurve(ringAtDelta(hi));
  return { curve, half: curve.arc[ANGLES / 2]! };
};

/** One trouser leg (left, +x), mirrored for the right one: legs below the crotch, pelvis above. */
const drapeLeg = (zd: ZoneDrape, env: BodyEnvelope, body: BodyMeasurements): Mesh => {
  const { group } = zd;
  const panel = (group.front ?? group.back)!;
  const l = bodyLandmarks(body);
  const band = 0.035 * bodyScale(body);
  // Round the leg: the front piece's width, then the back's (each from its side seam edge across).
  const sides = [group.front, group.back].filter((c): c is Classified => c !== undefined);
  const flatIds = sides.flatMap(pieceIdsOf);
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [], flat: [], flatIds };
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
  // Where each piece's crotch seam stands at the hip line; below it the seam runs inwards over the fork extension.
  const hipFlat = (y: number): number => panel.minY + (group.topY - y) * 1000;
  const seamXAt = (c: Classified, flatY: number): number | null => {
    const ownY = c.minY + (flatY - panel.minY);
    const e = rowExtent(c.polygon, clamp(ownY, c.minY + FLAT_EPSILON, c.maxY - FLAT_EPSILON));
    return e ? e[0] : null;
  };
  const hipSeam = sides.map((c) => seamXAt(c, hipFlat(l.hipY)));
  const forkWidth = (flatY: number): number =>
    sides.reduce((sum, c, k) => {
      const at = seamXAt(c, flatY);
      const ref = hipSeam[k];
      return at === null || ref === null || ref === undefined ? sum : sum + Math.max(0, ref - at) / 1000;
    }, 0) * (sides.length === 1 ? 2 : 1);
  // The knee's width: a leg wider than it below (bootcut, bell-bottoms) falls in soft folds towards the hem.
  const kneeY = l.kneeY;
  const kneeFlat = clamp(panel.minY + (l.waistY - kneeY) * 1000, panel.minY + FLAT_EPSILON, panel.maxY - FLAT_EPSILON);
  const kneeC = legCircumference(group, kneeFlat);
  // Outer reach (x) of the row above: a loose leg falls straight from it.
  let outerAbove = -Infinity;
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const y = group.topY - (flatY - panel.minY) / 1000;
    const legC = legCircumference(group, flatY);
    const widening = y < kneeY && kneeC > 0 ? legC / kneeC : 1;
    const flare = clamp((widening - LEG_FLARE_FROM) / LEG_FLARE_FULL, 0, 1);
    const round = clamp((widening - 1) / LEG_ROUND_FULL, 0, 1) * LEG_ROUND;
    // Below the crotch the inner side of the leg stays clear of the other leg's.
    const apart = smooth((l.crotchY - band - y) / LEG_APART_RAMP);
    const w = smooth((y - (l.crotchY - band)) / (2 * band)); // 0 = leg, 1 = pelvis
    const leg =
      w < 1
        ? (() => {
            const c = env.legCentre(Math.min(y, l.crotchY));
            const ly = Math.min(y, l.crotchY - 0.01);
            const bodyLeg = env.leg(ly);
            const ring = fabricRing(bodyLeg, legHang(ly), legC, 0, 0.5).ring;
            // Centre of the ring: a widening leg falls round about it, like a cone from the knee.
            let cx = 0;
            let cz = 0;
            for (let k = 0; k < ANGLES; k += 1) {
              cx += ring.curve.xs[k]! / ANGLES;
              cz += ring.curve.zs[k]! / ANGLES;
            }
            // How far from the middle the inner thigh is (0 or less: the thighs touch).
            const innerX = c.x - bodyLeg[(3 * ANGLES) / 4]!;
            // A loose leg falls straight from the hip: its ring moves out (the cloth it has to spare on the inner side
            // goes to the outer one), never past the row above and never off the inner leg.
            let rMin = Infinity;
            let rMax = -Infinity;
            for (let k = 0; k < ANGLES; k += 1) {
              rMin = Math.min(rMin, ring.curve.xs[k]!);
              rMax = Math.max(rMax, ring.curve.xs[k]!);
            }
            const spare = -bodyLeg[(3 * ANGLES) / 4]! - rMin - GAP;
            const shift = Number.isFinite(outerAbove) ? clamp(Math.min(outerAbove - (c.x + rMax), spare), 0, LEG_FALL_MAX) : 0;
            return { c, ring, bodyLeg, cx, cz, innerX, shift };
          })()
        : null;
    let rowOuter = -Infinity;
    // How loose the leg is over the body leg here (0: close-fitting, 1: wide).
    const looseness = leg ? clamp((legC / Math.max(1e-6, supportPerimeter(leg.bodyLeg)) - LEG_LOOSE_FROM) / LEG_LOOSE_FULL, 0, 1) : 0;
    // Round the pelvis only what goes round it: the fork extensions (the crotch seam's run beyond its line at the hips)
    // pass between the legs, under the body — counted round the hips they stood out as a bulge on each side.
    const pelvisC = 2 * Math.max(legC * PELVIS_MIN_SHARE, legC - forkWidth(flatY));
    // Above the hips, cloth wider than the body is gathered in (elastic, drawstring) or folded (pleats) to the waist:
    // drawn as soft gathers round a ring that keeps a little ease, not as a stiff shelf as wide as the hips.
    const gatherT = y > l.hipY ? smooth((y - l.hipY) / Math.max(0.05, l.waistY - l.hipY)) : 0;
    const bodyC = w > 0 && gatherT > 0 ? supportPerimeter(env.torso(y)) : 0;
    const capC = bodyC * (1 + WAIST_GATHER_EASE);
    const ringC = gatherT > 0 && pelvisC > capC ? lerp(pelvisC, capC, gatherT) : pelvisC;
    const gatherDepth = Math.min(WAIST_GATHER_MAX, ((pelvisC - ringC) / Math.max(ringC, 1e-6)) * WAIST_GATHER_GAIN);
    const pelvis = w > 0 ? pelvisRing(env.torso(y), hangOver(env.torso, y, Math.min(y + HANG, l.waistY)), ringC) : null;
    // Round the hips the front piece goes from the centre front to the side seam, the back from there to the centre
    // back, each over its own share of the half girth (as cut).
    const widthOf = (c: Classified | undefined): number => (c ? fullWidthAt(c, c.minY + (flatY - panel.minY)) : 0);
    const pelvisFrontShare = sides.length === 2 ? clamp(widthOf(sides[0]) / Math.max(1, widthOf(sides[0]) + widthOf(sides[1])), 0.3, 0.7) : 0.5;
    for (let j = 0; j < LEG_RADIAL; j += 1) {
      const f = j / LEG_RADIAL;
      const column = legColumn(f, sides.length);
      let x = 0;
      let z = 0;
      if (leg) {
        let p = pointAt(leg.ring.curve, f * leg.ring.curve.arc[ANGLES]!);
        if (round > 0) {
          // Towards a circle of the same perimeter about the ring's centre, never into the leg.
          const dx = p.x - leg.cx;
          const dz = p.z - leg.cz;
          const d = Math.hypot(dx, dz);
          if (d > 1e-6) {
            const radius = leg.ring.curve.arc[ANGLES]! / (2 * Math.PI);
            const k = lerp(d, radius, round) / d;
            p = pushOutside(leg.bodyLeg, GAP, leg.cx + dx * k, leg.cz + dz * k);
          }
        }
        // Godets of a flared leg: outward only, running straight down (fixed count, phase by the ring's fraction).
        const r = Math.hypot(p.x, p.z);
        const fold = flare > 0 && r > 1e-6 ? LEG_GODET_MAX * flare * (0.5 - 0.5 * Math.cos(2 * Math.PI * LEG_GODETS * f)) : 0;
        x = leg.c.x + leg.shift + p.x * (1 + fold / Math.max(r, 1e-6));
        z = leg.c.z + p.z * (1 + fold / Math.max(r, 1e-6));
        if (y < l.crotchY && x < LEG_CLOSE_REACH) {
          // Where the thighs touch, the legs' inner sides meet past the middle (no slit between them); lower down,
          // where the legs part, each stays on its own side — but never off the inner thigh under it.
          const touching = 1 - smooth((leg.innerX - LEG_APART_MIN) / LEG_APART_SOFT);
          if (touching > 0) x -= (LEG_CLOSE_OVERLAP * touching * (LEG_CLOSE_REACH - x)) / LEG_CLOSE_REACH;
        }
        // Below the knee the legs are always apart (a wide hem must not run into the other leg's).
        const parted = y < kneeY ? 1 : smooth((leg.innerX - LEG_APART_MIN) / LEG_APART_SOFT);
        const floorX = y < kneeY ? LEG_APART_MIN : Math.min(LEG_APART_MIN, leg.innerX);
        if (y < l.crotchY && x < floorX + LEG_APART_SOFT) {
          const clear = floorX + LEG_APART_SOFT * Math.exp((x - floorX - LEG_APART_SOFT) / LEG_APART_SOFT);
          x = lerp(x, clear, apart * parted);
        }
      }
      if (pelvis) {
        // The half girth from the centre front (the front piece's crotch edge) round the side to the centre back (the
        // back piece's): where this column's cloth lies on it.
        const seamArc = pelvis.half * pelvisFrontShare;
        const arc =
          sides.length === 1
            ? column.share * pelvis.half
            : column.side === 0
              ? column.share * seamArc
              : pelvis.half - column.share * (pelvis.half - seamArc);
        const p = pointAt(pelvis.curve, arc);
        // Gathers: outward only, a fixed number round the half so each runs straight down.
        const r = Math.hypot(p.x, p.z);
        const t = arc / Math.max(pelvis.half, 1e-6);
        const g = gatherDepth > 0 && r > 1e-6 ? (gatherDepth * (0.5 - 0.5 * Math.cos(2 * Math.PI * WAIST_GATHERS * t))) / r : 0;
        x = lerp(x, p.x * (1 + g), w);
        z = lerp(z, env.axisZ + p.z * (1 + g), w);
      }
      // A loose leg hangs from the seat, the front of the thigh and the hip: below the crotch its back, front and outer
      // side draw in no faster than cloth falls (a close-fitting leg follows the body under the seat).
      if (leg && i > 0 && y < l.crotchY && looseness > 0) {
        const o = ((i - 1) * LEG_RADIAL + j) * 3;
        const above = mesh.positions;
        const dy = Math.max(0, above[o + 1]! - y);
        const limit = dy * Math.min(LEG_FALL_FREE, LEG_FALL_TAPER / looseness);
        const a = 2 * Math.PI * f;
        const front = Math.max(0, Math.cos(a));
        const back = Math.max(0, -Math.cos(a));
        const outer = Math.max(0, Math.sin(a));
        if (back > 0.2) z = lerp(z, Math.min(z, above[o + 2]! + limit), smooth((back - 0.2) / 0.4));
        if (front > 0.2) z = lerp(z, Math.max(z, above[o + 2]! - limit), smooth((front - 0.2) / 0.4));
        if (outer > 0.2) x = lerp(x, Math.max(x, above[o]! - limit), smooth((outer - 0.2) / 0.4));
      }
      rowOuter = Math.max(rowOuter, x);
      // Floor-length trousers break on the floor, never through it.
      mesh.positions.push(x, Math.max(y, FLOOR_Y), z);
      mesh.uvs.push(f * legC, flatY / 1000);
      const sideIndex = column.side;
      const own = sides[sideIndex]!;
      const ownY = own.minY + (flatY - panel.minY);
      const e = rowExtent(own.polygon, clamp(ownY, own.minY + FLAT_EPSILON, own.maxY - FLAT_EPSILON)) ?? [0, 0];
      const share = column.share;
      const at = mesh.flat!.length;
      pushFlat(mesh.flat!, own, e[0] + (e[1] - e[0]) * share, ownY);
      if (mesh.flat![at] !== NOT_EDITABLE) mesh.flat![at] = mesh.flat![at]! + (sideIndex === 1 ? pieceIdsOf(sides[0]!).length : 0);
    }
    outerAbove = rowOuter;
  }
  // What the pattern marks on the outside of the trousers (fly, pockets, welts, turn-up), drawn on the cloth: each mark
  // point found on the draped grid through the same row / share of the row the cloth was laid out with.
  const single: number[] = [];
  const parts: LegParts = { marks: sides.map(() => []), single, patches: [] };
  sides.forEach((own, sideIndex) => {
    for (const line of detailLinesOf(own.piece)) {
      const ownMarks = parts.marks[sideIndex]!;
      let prev: [number, number, number] | null = null;
      for (const p of densify(line.points, DETAIL_STEP_MM)) {
        const q = legPoint(mesh, panel, own, sideIndex, sides.length, p.x, p.y);
        if (q && prev) {
          if (line.single) single.push(...prev, ...q);
          else {
            mesh.border.push(...prev, ...q);
            ownMarks.push(...prev, ...q);
          }
        }
        prev = q;
      }
    }
    // The detail pieces this piece carries, laid on its cloth (a fly's facing under it, a pocket on it…).
    for (const spec of detailAreasOf(own.piece.dimensionsJson)) {
      const patch = drapePatch(spec.area, (x, y, lift) => legPoint(mesh, panel, own, sideIndex, sides.length, x, y, lift), spec.inside);
      if (patch) parts.patches.push({ side: sideIndex, spec, patch });
    }
  });
  mesh.legParts = parts;
  gridMesh(mesh, 0, ROWS, LEG_RADIAL, true, true);
  addMirror(mesh);
  // The fly is on one front only.
  mesh.border.push(...single);
  return mesh;
};

/**
 * Which piece a column of the leg ring is cut from, and where across it (share 0 = its crotch / inseam edge, 1 = its side
 * seam). The ring runs from the front of the leg (f = 0) to the outer side (0.25), the back (0.5) and the inside (0.75):
 * the front piece goes from the inseam through the front to the side seam, the back piece from the side seam through
 * the back to the inseam — so the seams fall at the side and between the legs, as sewn.
 */
const legColumn = (f: number, sideCount: number): { side: 0 | 1; share: number } => {
  if (sideCount === 1) return { side: 0, share: f };
  if (f >= 0.75 || f < 0.25) return { side: 0, share: (((f - 0.75 + 1) % 1) / 0.5) };
  // The back's last column (one before the centre front's) is its centre back / inseam edge: share 0 there. With share 0
  // only at f = 0.75 — the front's column — the back stopped a column (~1 cm) short of the centre back, and a slit of
  // skin showed between the two legs from the waist down the seat.
  return { side: 1, share: clamp((BACK_EDGE_F - f) / (BACK_EDGE_F - 0.25), 0, 1) };
};

/** Ring position of the back piece's centre-back / inseam edge: the last column before the front's. */
const BACK_EDGE_F = 0.75 - 1 / LEG_RADIAL;

/** The ring position (f, 0 … 1) of a piece's point across its row: the inverse of `legColumn`. */
const legColumnOf = (side: number, share: number, sideCount: number): number =>
  sideCount === 1 ? share : side === 0 ? (0.75 + 0.5 * share) % 1 : BACK_EDGE_F - (BACK_EDGE_F - 0.25) * share;

/** Marks are sampled this often along their length (mm) so they follow the drape. */
const DETAIL_STEP_MM = 12;
/** Marks stand this far proud of the cloth (m), so they are never hidden in it. */
const DETAIL_LIFT = 0.0025;

/** Points along a polyline, at most `step` apart. */
const densify = (points: Point[], step: number): Point[] => {
  const out: Point[] = [];
  for (let k = 0; k < points.length - 1; k += 1) {
    const a = points[k]!;
    const b = points[k + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let i = 0; i < n; i += 1) out.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
  }
  if (points.length > 0) out.push(points[points.length - 1]!);
  return out;
};

/**
 * A point of a trouser piece (its own mm frame) on the draped leg grid (rows × LEG_RADIAL, before the mirror): the row
 * from its height, the column from its share of the row's width (front piece: the first half of the ring, back: the
 * second, as `drapeLeg` lays them), lifted off the cloth.
 */
const legPoint = (
  mesh: Mesh,
  panel: Classified,
  own: Classified,
  sideIndex: number,
  sideCount: number,
  x: number,
  y: number,
  lift = DETAIL_LIFT,
): [number, number, number] | null => {
  const span = panel.maxY - panel.minY - 2 * FLAT_EPSILON;
  const flatY = y - own.minY + panel.minY;
  const r = clamp(((flatY - panel.minY - FLAT_EPSILON) / Math.max(span, 1e-6)) * ROWS, 0, ROWS);
  const e = rowExtent(own.polygon, clamp(y, own.minY + FLAT_EPSILON, own.maxY - FLAT_EPSILON));
  if (!e || e[1] - e[0] < 1) return null;
  const share = clamp((x - e[0]) / (e[1] - e[0]), 0, 1);
  const c = legColumnOf(sideIndex, share, sideCount) * LEG_RADIAL;
  const at = (i: number, j: number): [number, number, number] => {
    const o = (i * LEG_RADIAL + (((j % LEG_RADIAL) + LEG_RADIAL) % LEG_RADIAL)) * 3;
    return [mesh.positions[o]!, mesh.positions[o + 1]!, mesh.positions[o + 2]!];
  };
  const i0 = Math.min(ROWS - 1, Math.floor(r));
  const j0 = Math.floor(c);
  const u = r - i0;
  const v = c - j0;
  const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  const p = mix(mix(at(i0, j0), at(i0, j0 + 1), v), mix(at(i0 + 1, j0), at(i0 + 1, j0 + 1), v), u);
  // Lift along the row's outward direction (from the row's centre through the point).
  let cx = 0;
  let cz = 0;
  for (let j = 0; j < LEG_RADIAL; j += 1) {
    const q = at(Math.round(r), j);
    cx += q[0] / LEG_RADIAL;
    cz += q[2] / LEG_RADIAL;
  }
  const dx = p[0] - cx;
  const dz = p[2] - cz;
  const len = Math.hypot(dx, dz) || 1;
  return [p[0] + (dx / len) * lift, p[1], p[2] + (dz / len) * lift];
};

/** How much of the usual crown height a puffed sleeve keeps above the shoulder. */
const PUFF_CROWN_SHARE = 0.6;

/** A sleeve head may be this much longer than the deltoid it wraps before the rest counts as puff. */
const SLEEVE_HEAD_EASE = 1.25;

/** A sleeve row this much wider than the arm starts to hold a round puff; fully round from the second value. */
/** Gathered puffs fall into soft folds from the head to the cuff: how many, and how deep (share of the radius). */
const PUFF_FOLDS = 9;
const PUFF_FOLD_DEPTH = 0.3;
/** A gathered puff sags under its own weight: its fullest part hangs this far (m) below the arm's line. */
const PUFF_SAG_M = 0.05;
/** Twist of the folds along the sleeve (radians over its length): gathers never run perfectly straight. */
const PUFF_FOLD_TWIST = 1.1;

/** A sleeve this much wider than its head is a puff; its cap spreads over this share of the length below it (at most 7 cm). */
const PUFF_HEAD_FROM = 1.3;
const PUFF_BLOOM_SHARE = 0.4;
const PUFF_BLOOM_MAX = 0.07;

/**
 * Balloon of a very full puff (gigot): the fabric is gathered into a round volume, not a cylinder as wide as the
 * cloth. Down the puff (u 0 at the head → 1 where it closes on the arm) the ring's girth follows
 * head + (widest × BALLOON_MAX − head) × sin(π (BALLOON_FROM + (1 − BALLOON_FROM) u))^BALLOON_ROUND; the rest of the
 * row's width is gathered into deeper folds.
 */
const BALLOON_MAX = 0.82;
/** A puff closing on the arm this far (mm of pattern) above the wrist is a gigot: fitted forearm below. */
const GIGOT_FOREARM_MM = 150;
/** A gigot's crown stands up over the shoulder (1 = a plain sleeve's), and sags only this share of a puff's. */
const GIGOT_CROWN_SHARE = 1.25;
const GIGOT_SAG_SHARE = 0.3;
/** Share of a gigot ring's radius beyond the arm's that is shifted to the outside of the arm. */
const GIGOT_OUTSET = 0.55;
const BALLOON_FROM = 0.02;
const BALLOON_ROUND = 0.9;
/** Extra fold depth per unit of a row's gathered width (share of its draped width). */
const BALLOON_GATHER_DEPTH = 0.12;

const PUFF_RING_FROM = 1.2;
const PUFF_RING_FULL = 1.8;

/** Depth (mm) of the pattern, from the top of a sleeve, in which its cap (the widest row) is looked for. */
const CAP_SEARCH_MM = 200;

/** A sleeve (left arm), mirrored for the right one, along the arm's own axis. */
/** Draped sleeves per arm and per piece: a piece left untouched while another is modelled is not draped again. */
const sleeveCache = new WeakMap<object, WeakMap<PatternPieceDto, { mesh: Mesh | null; partner: PatternPieceDto | undefined; endBefore: number }>>();

/** `endBefore` (m): length a cuff takes on past the sleeve's end; the sleeve stops that much before the wrist. */
const drapeSleeve = (panel: Classified, env: BodyEnvelope, arm = env.arm, endBefore = 0): Mesh | null => {
  if (!arm) return null;
  // Pieces are never mutated (edits create new objects): the piece and the arm identify the result.
  let byPiece = sleeveCache.get(arm);
  if (!byPiece) {
    byPiece = new WeakMap();
    sleeveCache.set(arm, byPiece);
  }
  const cached = byPiece.get(panel.piece);
  if (cached && cached.partner === panel.partner && cached.endBefore === endBefore) return cached.mesh;
  const mesh = drapeSleeveOn(panel, env, arm, endBefore);
  byPiece.set(panel.piece, { mesh, partner: panel.partner, endBefore });
  return mesh;
};

/** Least slant (rad, from straight down) of the axis a sleeve cap climbs along above the shoulder joint. */
const CAP_MIN_TILT = 0.34;

/** The arm's direction, slanted out (towards `side`, ±1) to at least CAP_MIN_TILT when the arm hangs nearly straight down. */
const capAxis = (dir: { x: number; y: number; z: number }, side: number): { x: number; y: number; z: number } => {
  // Outwards is the side of the body the arm is on (a hanging arm may point a little inwards).
  const out = dir.x * side;
  if (dir.y > -0.5 || (out > 0 && Math.atan2(out, -dir.y) >= CAP_MIN_TILT)) return dir;
  const horizontal = Math.hypot(dir.x, dir.y);
  const x = side * Math.sin(CAP_MIN_TILT) * horizontal;
  const y = -Math.cos(CAP_MIN_TILT) * horizontal;
  return { x, y, z: dir.z };
};

type V = { x: number; y: number; z: number };

/** Rotates v about the unit axis k by the angle whose cosine / sine are c / sn (Rodrigues). */
const rotateAbout = (v: V, k: V, c: number, sn: number): V => {
  const dot = k.x * v.x + k.y * v.y + k.z * v.z;
  const cx = k.y * v.z - k.z * v.y;
  const cy = k.z * v.x - k.x * v.z;
  const cz = k.x * v.y - k.y * v.x;
  return {
    x: v.x * c + cx * sn + k.x * dot * (1 - c),
    y: v.y * c + cy * sn + k.y * dot * (1 - c),
    z: v.z * c + cz * sn + k.z * dot * (1 - c),
  };
};

/** The arm's frame (dir, side, front) turned so that its axis is `to`. */
const turnedFrame = (arm: { dir: V; side: V; front: V }, to: V): { dir: V; side: V; front: V } => {
  const d = arm.dir;
  const len = Math.hypot(to.x, to.y, to.z) || 1;
  const t = { x: to.x / len, y: to.y / len, z: to.z / len };
  const ax = { x: d.y * t.z - d.z * t.y, y: d.z * t.x - d.x * t.z, z: d.x * t.y - d.y * t.x };
  const sn = Math.hypot(ax.x, ax.y, ax.z);
  if (sn < 1e-9) return arm;
  const k = { x: ax.x / sn, y: ax.y / sn, z: ax.z / sn };
  const c = d.x * t.x + d.y * t.y + d.z * t.z;
  return { dir: t, side: rotateAbout(arm.side, k, c, sn), front: rotateAbout(arm.front, k, c, sn) };
};

/** Rows up the sleeve over which the cuff takes the arm's direction. */
const CUFF_DIR_ROWS = 12;
/** Most (m) a sleeve longer than the arm runs on past where it stacks up (towards the hand). */
const STACK_MAX = 0.008;
/** Height of arm (m) above and below a sleeve row that its cloth keeps covering. */
const ARM_SPAN = 0.015;

const drapeSleeveOn = (panel: Classified, env: BodyEnvelope, arm: LimbFrame, endBefore = 0): Mesh => {
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [], flat: [], flatIds: pieceIdsOf(panel), accent: [], ao: [] };
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
  // Only the top 20 cm can be the cap (a sleeve cap is ~15 cm deep): a bell or butterfly sleeve is widest at the
  // cuff, and taking that row for the cap would draw the whole sleeve as one wide board over the shoulder.
  const capSearch = Math.min(panel.maxY - panel.minY, CAP_SEARCH_MM);
  for (let k = 0; k <= 40; k += 1) {
    const y = panel.minY + (capSearch * k) / 40;
    const e = rowExtent(panel.polygon, Math.min(panel.maxY - FLAT_EPSILON, Math.max(panel.minY + FLAT_EPSILON, y)));
    const w = e ? e[1] - e[0] : 0;
    if (w > widest + 0.5) {
      widest = w;
      capY = y;
    }
  }
  // A puffed sleeve (ballon, gigot) is wider than the armhole it is set into: the head keeps the armhole's size
  // (the extra is gathered into it) and the volume opens down the upper arm, not out above the shoulder.
  const deltoid = arm.cap ? supportMax([at(armpit), arm.cap]) : at(armpit);
  const headWidthMm = supportPerimeter(deltoid) * 1000 * SLEEVE_HEAD_EASE;
  // A puff blooms below the shoulder: its cap rows spread down the arm over `bloom` (m), and the rest of the sleeve
  // is drawn in by as much, so the hem stays where the pattern puts it.
  const puffed = widest > headWidthMm * PUFF_HEAD_FROM;
  const below = Math.max(0.001, (panel.maxY - capY) / 1000);
  const capWidthMm = (cap: number): number => (widest > headWidthMm ? lerp(headWidthMm, widest, smooth(1 - cap)) : widest);
  // Where a puff closes back onto the arm (the first row below the cap narrower than a gathered head).
  let puffEndY = panel.maxY;
  if (puffed) {
    for (let y = capY; y < panel.maxY; y += 5) {
      const e = rowExtent(panel.polygon, y);
      if (e && e[1] - e[0] < headWidthMm * 1.15) {
        puffEndY = y;
        break;
      }
    }
  }
  // A gigot closes on the arm at the elbow: the balloon stands on the shoulder and ends there (no bloom down the
  // arm, hardly any sag), leaving the fitted forearm to show; any other puff blooms below the shoulder.
  const gigot = puffed && panel.maxY - puffEndY > GIGOT_FOREARM_MM;
  const bloom = puffed && !gigot ? Math.min(PUFF_BLOOM_MAX, below * PUFF_BLOOM_SHARE) : 0;
  /** Girth (mm) the puff's ring may take at a flat height; Infinity outside a puff. */
  const balloon = (flatY: number): number => {
    if (!puffed || flatY >= puffEndY) return Infinity;
    const u = clamp((flatY - panel.minY) / Math.max(1, puffEndY - panel.minY), 0, 1);
    return headWidthMm + (widest * BALLOON_MAX - headWidthMm) * Math.sin(Math.PI * (BALLOON_FROM + (1 - BALLOON_FROM) * u)) ** BALLOON_ROUND;
  };
  /** The armhole seam seen from the arm: at the armpit under the arm, over the deltoid on the outside. */
  const CAP_TOP = -0.075;
  // A raised arm (posed) tips its axis back over the shoulder: the cap's crown rises less above the joint.
  // A puff sits down on the shoulder and spreads sideways rather than standing up above it.
  const capTop =
    CAP_TOP * clamp(-arm.dir.y, 0.3, 1) * (gigot ? GIGOT_CROWN_SHARE : widest > headWidthMm ? PUFF_CROWN_SHARE : 1) +
    (isOffShoulder(panel) ? OFF_SHOULDER_SLEEVE_DROP : 0);
  // Round the section's own centre: below the elbow the forearm leaves the upper arm's axis (see LimbFrame.centre),
  // and a sleeve drawn round that axis ended 9 cm behind the wrist, the cuff hanging beside the hand.
  // Above the joint (t < 0) the cap climbs over the shoulder towards the neck. Along the arm's own axis it did so only
  // while the arm hung out (19.6° in the neutral pose): with the arms straight down (pose Présentation) the cap rose
  // straight up off the sloping shoulder, a square box outside and bare skin inside. It keeps at least that slant.
  // The whole frame turns with it (the side axis too, which lifts the cap's outside over the deltoid).
  const capDir = capAxis(arm.dir, Math.sign(arm.start.x) || 1);
  const capFrame = capDir === arm.dir ? { dir: arm.dir, side: arm.side, front: arm.front } : turnedFrame(arm, capDir);
  const toWorld = (t: number, u0: number, v0: number): [number, number, number] => {
    const c = arm.centre?.(clamp(t, 0, arm.length)) ?? { s: 0, f: 0 };
    const u = u0 + c.s;
    const v = v0 + c.f;
    const f = t < 0 ? capFrame : arm;
    return [
      arm.start.x + f.dir.x * t + f.side.x * u + f.front.x * v,
      arm.start.y + f.dir.y * t + f.side.y * u + f.front.y * v,
      arm.start.z + f.dir.z * t + f.side.z * u + f.front.z * v,
    ];
  };
  // The fabric ring depends only on the place along the arm and the row's width: below the cap every column of a
  // row shares one, and in the cap the columns pair up (left/right of the seam). Solved once per key (the costly
  // part of the drape, which reruns live while the pattern is being modelled in 3D).
  const rings = new Map<string, { ring: FabricRing; puff: number }>();
  const sleeveRing = (tj: number, width: number): { ring: FabricRing; puff: number } => {
    const key = `${tj}|${width}`;
    const cached = rings.get(key);
    if (cached) return cached;
    // Around the shoulder the sleeve goes round the whole deltoid, not just the arm's section.
    const near = arm.cap && tj < armpit + 0.03 ? supportMax([at(tj), arm.cap]) : at(tj);
    // Gathered fabric (a puff) holds a round volume around the arm; only a close-fitting sleeve hangs from the
    // arm above it, which would stretch a wide ring into a flat blade along the shoulder-to-elbow slope.
    const hung = supportMax([near, hangOver(at, tj, Math.max(0, tj - 0.15))]);
    const puff = clamp((width / supportPerimeter(near) - PUFF_RING_FROM) / (PUFF_RING_FULL - PUFF_RING_FROM), 0, 1);
    const hang = puff === 0 ? hung : Float32Array.from(hung, (h, k) => lerp(h, near[k]!, puff));
    const solved = { ring: fabricRing(near, hang, width, 0, 0.5).ring, puff };
    rings.set(key, solved);
    return solved;
  };
  // The arm round a row, over the height between two rows (the skin between them must stay under the cloth too).
  const arms = new Map<number, Support>();
  const armAround = (tj: number): Support => {
    const cached = arms.get(tj);
    if (cached) return cached;
    const around = supportMax([at(tj - ARM_SPAN), at(tj), at(tj + ARM_SPAN)]);
    arms.set(tj, around);
    return around;
  };
  for (let i = 0; i <= ROWS; i += 1) {
    rings.clear();
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const extent = rowExtent(panel.polygon, flatY) ?? [0, 0];
    // Cap rows: 0 at the widest row (underarm), 1 at the top of the cap (the armhole seam).
    const cap = flatY < capY && capY > panel.minY ? (capY - flatY) / (capY - panel.minY) : 0;
    const along = armpit + (cap > 0 ? (1 - cap) * bloom : bloom + ((flatY - capY) / 1000) * (1 - bloom / below));
    // Lengths are measured along the arm (round the bent elbow), then placed on the axis.
    const onAxis = arm.atLength ? arm.atLength(along) : along;
    // A sleeve longer than the arm stacks up at the wrist (as fabric does) instead of covering the hand; with a cuff
    // it stacks above it, so that the cuff, which carries on from the sleeve's end, ends at the wrist.
    // The stack is bounded (STACK_MAX): a sleeve 18 cm longer than the arm carried the cuff 4 cm onto the hand, and
    // the thumb came through it.
    const stackAt = arm.wrist - endBefore;
    const t = onAxis > stackAt ? stackAt + STACK_MAX * (1 - Math.exp(-((onAxis - stackAt) * 0.2) / STACK_MAX)) : onAxis;
    // The cap is as wide as the widest row: it is set into the armhole all round.
    const cloth = Math.max(cap > 0 ? capWidthMm(cap) : extent[1] - extent[0], 0);
    const width = Math.min(cloth, balloon(flatY)) / 1000;
    // The cloth beyond the balloon's girth is gathered: deeper folds round the ring.
    const gathered = cloth > 0 ? clamp(1 - (width * 1000) / cloth, 0, 0.6) : 0;
    for (let j = 0; j < SLEEVE_RADIAL; j += 1) {
      // 0 under the arm, 1 over the front, the top and the back of the shoulder.
      const outside = smooth(((1 - Math.cos((2 * Math.PI * Math.min(j, SLEEVE_RADIAL - j)) / SLEEVE_RADIAL)) / 2) * 2.2);
      const tj = cap > 0 ? lerp(t, lerp(armpit, capTop, outside), cap) : t;
      const { ring, puff } = sleeveRing(tj, width);
      const seam = ring.curve.arc[(3 * ANGLES) / 4]!; // underarm, towards the body
      const p = pointAt(ring.curve, seam + (j / SLEEVE_RADIAL) * ring.curve.arc[ANGLES]!);
      // Folds: the radius breathes in and out around the ring, strongest on the upper sleeve and gone at the cuff
      // and at the very top of the head, where the fabric is held by the armhole seam.
      const progress = i / ROWS;
      const fade = Math.sin(Math.PI * clamp(progress * 1.25, 0, 1)) ** 0.6 * (cap > 0 ? 1 - cap * 0.7 : 1);
      const fold = 0.5 - 0.5 * Math.cos(2 * Math.PI * PUFF_FOLDS * (j / SLEEVE_RADIAL) + PUFF_FOLD_TWIST * progress);
      const k = 1 + (PUFF_FOLD_DEPTH * puff + gathered * BALLOON_GATHER_DEPTH * 4) * fade * (fold - 0.5);
      const sag = PUFF_SAG_M * (gigot ? GIGOT_SAG_SHARE : 1) * puff * Math.sin(Math.PI * clamp(progress * 1.3, 0, 1)) ** 1.5;
      // A balloon stands out from the body: its girth beyond the arm's is carried to the outside of the arm (the
      // arm runs through its inner part), so the two puffs never meet over the back like a cape.
      const outset = gigot ? GIGOT_OUTSET * Math.max(0, width / (2 * Math.PI) - supportPerimeter(at(tj)) / (2 * Math.PI)) : 0;
      // Shifted outwards and drawn into folds, the ring may cut into the arm on its inner side: the cloth always
      // stays on the arm (the elbow and the forearm never show through the sleeve).
      const onArm = pushOutside(armAround(tj), GAP, p.x * k + outset, p.z * k);
      const world = toWorld(tj, onArm.x, onArm.z);
      mesh.positions.push(world[0], world[1] - sag, world[2]);
      mesh.uvs.push((j / SLEEVE_RADIAL) * width, flatY / 1000);
      // The cap and the puff are the accent fabric; the fitted forearm is plain.
      // The folds of a puff: dark in their hollows, the more so the deeper they are.
      const depth = (PUFF_FOLD_DEPTH * puff + gathered * BALLOON_GATHER_DEPTH * 4) * fade;
      mesh.ao!.push(1 - Math.min(1 - FOLD_AO, depth * 2.2) * (1 - fold));
      mesh.accent!.push(cap > 0 || (puffed ? flatY < puffEndY : puff > ACCENT_PUFF) ? 1 : 0);
      // Round the arm from the underarm seam: across the piece from one edge to the other.
      pushFlat(mesh.flat!, panel, extent[0] + ((extent[1] - extent[0]) * j) / SLEEVE_RADIAL, flatY);
    }
  }
  // The cap rests on the shoulder, never inside it. Pushed one by one, the vertices by the armpit stood out of the
  // head as a 1 cm point: the push is spread over the neighbouring rows and columns, then checked again.
  const unpushed = Float32Array.from(mesh.positions);
  pushOutOfTorso(mesh, env);
  mesh.positions = Array.from(featherGridOffsets(unpushed, mesh.positions, ROWS, SLEEVE_RADIAL, true));
  pushOutOfTorso(mesh, env);
  gridMesh(mesh, 0, ROWS, SLEEVE_RADIAL, true, true);
  return mesh;
};

const editMapOf = (mesh: Mesh): PanelEditMap | undefined => {
  const count = mesh.positions.length / 3;
  if (!mesh.flat || !mesh.flatIds || mesh.flatIds.length === 0 || mesh.flat.length !== count * 3) return undefined;
  const piece = new Uint8Array(count);
  const flat = new Float32Array(count * 2);
  for (let v = 0; v < count; v += 1) {
    piece[v] = mesh.flat[v * 3]!;
    flat[v * 2] = mesh.flat[v * 3 + 1]!;
    flat[v * 2 + 1] = mesh.flat[v * 3 + 2]!;
  }
  return { pieceIds: mesh.flatIds, piece, flat };
};

/** Colour of buttons (a dark bronze) and how far they stand off the cloth beyond their radius (m). */
const BUTTON_COLOR = '#7A5A3A';
const BUTTON_LIFT = 0.001;

/**
 * The buttons the engine placed down a front piece's centre (x = 0): on the plastron when the front opens over one,
 * else on the cloth's centre line. A bead row (one sphere per button).
 */
const buttonsOn = (draped: Mesh, panel: Classified, rows: Array<{ points: Point[]; diameterMm: number }>): PanelMeshData | null => {
  if (rows.length === 0) return null;
  const cloth = clothMaps.get(draped);
  const centres: number[] = [];
  let onPlastron = false;
  let radius = 0;
  for (const row of rows) {
    const r = row.diameterMm / 2000;
    radius = Math.max(radius, r);
    for (const p of row.points) {
      let at: [number, number, number] | null = null;
      const fill = draped.fill;
      const flatYs = draped.fillFlatY;
      if (fill && flatYs && flatYs.length > 1 && p.y >= flatYs[0]! && p.y <= flatYs[flatYs.length - 1]!) {
        // The plastron's middle column, on the row nearest the button.
        let k = 0;
        for (let i = 1; i < flatYs.length; i += 1) if (Math.abs(flatYs[i]! - p.y) < Math.abs(flatYs[k]! - p.y)) k = i;
        const o = (k * (PLASTRON_COLUMNS + 1) + PLASTRON_COLUMNS / 2) * 3;
        at = [fill.positions[o]!, fill.positions[o + 1]!, fill.positions[o + 2]!];
        onPlastron = true;
      } else if (cloth && p.y >= panel.minY && p.y <= panel.maxY) {
        at = cloth(Math.abs(p.x), p.y);
      }
      if (at) centres.push(at[0], at[1], at[2] + r + BUTTON_LIFT);
    }
  }
  if (centres.length === 0) return null;
  return {
    id: `buttons-${panel.piece.id}`,
    label: 'Boutons',
    role: 'trim',
    zone: 'beads',
    beadRadius: radius,
    trimColor: BUTTON_COLOR,
    pieceIds: [panel.piece.id],
    positions: Float32Array.from(centres),
    indices: new Uint32Array(0),
    border: new Float32Array(0),
    uvs: new Float32Array(0),
    // With the plastron they are sewn on (it travels less than the fronts), a little further.
    explode: { x: 0, y: 0, z: onPlastron ? 0.5 : 1.1 },
  };
};

/** Exploded trousers: each leg to its side, its front piece forwards and its back piece backwards. */
const legExplode = (side: 1 | -1, piece: number): { x: number; y: number; z: number } => ({ x: side * 0.8, y: 0, z: piece === 0 ? 0.7 : -0.7 });
/** A detail piece goes this much further than the piece carrying it, so the exploded view shows it on its own. */
const DETAIL_EXPLODE = 1.7;
/** A detail piece round a whole leg (a turn-up) drops this far down in the exploded view (share of the distance). */
const LEG_BAND_DROP = -0.6;

const mirroredX = (segments: number[]): number[] => segments.map((v, k) => (k % 3 === 0 ? -v : v));

/**
 * The quads of one leg (rows × LEG_RADIAL, as drapeLeg lays them) whose column `keep` accepts, as a mesh of its own:
 * one trouser piece. Its outline (every edge but the waist, which the waistband covers) is its seam line.
 */
const legPieceMesh = (
  leg: { positions: number[]; indices: number[]; uvs: number[]; flat?: number[]; flatIds?: string[] },
  keep: (column: number) => boolean,
): Mesh => {
  const out: Mesh = { positions: [], indices: [], border: [], uvs: [], ...(leg.flat && leg.flatIds ? { flat: [], flatIds: leg.flatIds } : {}) };
  const remap = new Map<number, number>();
  const use = (v: number): number => {
    let k = remap.get(v);
    if (k === undefined) {
      k = out.positions.length / 3;
      remap.set(v, k);
      out.positions.push(leg.positions[v * 3]!, leg.positions[v * 3 + 1]!, leg.positions[v * 3 + 2]!);
      out.uvs.push(leg.uvs[v * 2]!, leg.uvs[v * 2 + 1]!);
      if (leg.flat && out.flat) out.flat.push(leg.flat[v * 3]!, leg.flat[v * 3 + 1]!, leg.flat[v * 3 + 2]!);
    }
    return k;
  };
  const edges = new Map<number, { a: number; b: number; uses: number }>();
  const count = leg.positions.length / 3;
  for (let t = 0; t * 3 + 2 < leg.indices.length; t += 1) {
    // gridMesh: two triangles per quad, row by row.
    if (!keep(Math.floor(t / 2) % LEG_RADIAL)) continue;
    const tri = [leg.indices[t * 3]!, leg.indices[t * 3 + 1]!, leg.indices[t * 3 + 2]!];
    // Above the crotch the ring's last quad bridges the centre back to the centre front under the body: hidden on the
    // assembled garment, but taken apart it hung off the back piece as a strip reaching to the front.
    if (longestEdge(leg.positions, tri) > LEG_BRIDGE_M) continue;
    out.indices.push(...tri.map(use));
    for (let e = 0; e < 3; e += 1) {
      const a = tri[e]!;
      const b = tri[(e + 1) % 3]!;
      const key = a < b ? a * count + b : b * count + a;
      const edge = edges.get(key);
      if (edge) edge.uses += 1;
      else edges.set(key, { a, b, uses: 1 });
    }
  }
  for (const { a, b, uses } of edges.values()) {
    if (uses !== 1 || (a < LEG_RADIAL && b < LEG_RADIAL)) continue;
    out.border.push(...leg.positions.slice(a * 3, a * 3 + 3), ...leg.positions.slice(b * 3, b * 3 + 3));
  }
  return out;
};

/** A leg quad's edge longer than this (m) is the bridge from the centre back to the centre front, not cloth. */
const LEG_BRIDGE_M = 0.08;

const longestEdge = (positions: number[], tri: number[]): number => {
  let longest = 0;
  for (let e = 0; e < 3; e += 1) {
    const a = tri[e]! * 3;
    const b = tri[(e + 1) % 3]! * 3;
    longest = Math.max(longest, Math.hypot(positions[a]! - positions[b]!, positions[a + 1]! - positions[b + 1]!, positions[a + 2]! - positions[b + 2]!));
  }
  return longest;
};

/** Several patches as one mesh (the parts of one detail piece). */
const joinPatches = (patches: PatchMesh[]): PatchMesh => {
  const out: PatchMesh = { positions: [], indices: [], border: [], uvs: [] };
  for (const p of patches) {
    const base = out.positions.length / 3;
    out.positions.push(...p.positions);
    out.indices.push(...p.indices.map((v) => v + base));
    out.border.push(...p.border);
    out.uvs.push(...p.uvs);
  }
  return out;
};

/** A detail piece's panel: named after the pattern pieces it stands for, so selecting one highlights it. */
const detailPanel = (
  patch: PatchMesh,
  spec: DetailSpec,
  layout: GarmentLayout,
  id: string,
  host: { x: number; y: number; z: number },
): PanelMeshData => {
  const pieces = piecesNamed(layout.detailPieces ?? [], spec.pieces);
  return toPanel(
    { positions: patch.positions, indices: patch.indices, border: patch.border, uvs: patch.uvs },
    {
      id,
      label: (pieces.length > 0 ? pieces.map((p) => p.name) : spec.pieces).join(' + '),
      role: 'trim',
      zone: 'detail',
      pieceIds: pieces.map((p) => p.id),
      ...(isLining(spec.pieces) ? { lining: true } : {}),
      ...(spec.contrast ? { contrast: true } : {}),
      ...(spec.motif ? { motif: spec.motif } : {}),
      ...(spec.motif && spec.color ? { trimColor: spec.color } : {}),
      explode: { x: host.x * DETAIL_EXPLODE, y: host.y, z: host.z * DETAIL_EXPLODE },
    },
  );
};

const toPanel = (mesh: Mesh, data: Omit<PanelMeshData, 'positions' | 'indices' | 'border' | 'uvs'>): PanelMeshData => ({
  ...data,
  positions: Float32Array.from(mesh.positions),
  indices: Uint32Array.from(mesh.indices),
  border: Float32Array.from(mesh.border),
  uvs: Float32Array.from(mesh.uvs),
  edit: editMapOf(mesh),
  ...(mesh.accent && mesh.accent.length * 3 === mesh.positions.length ? { accent: Uint8Array.from(mesh.accent) } : {}),
  ...(mesh.ao && mesh.ao.length * 3 === mesh.positions.length ? { ao: Float32Array.from(mesh.ao) } : {}),
});

/**
 * Drapes the pattern on a body envelope. Every fabric row has the pattern's own circumference (front +
 * back widths at that height), rests on the body's convex hull and hangs from what is above it (bust,
 * hips, thighs); lengths are measured along the body, so a front cut longer than the back goes over the
 * bust. The side seams of front and back panels lie on the same ring, so they meet.
 */
/** What the posed body does to the garment beyond resting on it. */
export interface DrapeOptions {
  /** Hands of the posed body: a hand that comes onto the skirt rests on it (the cloth lies under the palm). */
  hands?: Array<{ x: number; y: number; z: number }>;
  /** Legs lifted or bent: the skirt hangs over the knee down to the hem instead of closing in under it. */
  legsPosed?: boolean;
}

/** Height (m) and angle bins of `skirtSurface`. */
const SURFACE_STEP_Y = 0.02;
const SURFACE_ANGLES = 36;

/**
 * Outer surface of the draped skirt: its radius about the body axis (m) at a height and an angle (atan2(x, z)), from
 * the furthest skirt vertex in that bin; null where the skirt does not reach. Lets the arms be posed on the skirt.
 */
export const skirtSurface = (panels: PanelMeshData[], axisZ: number): ((y: number, angle: number) => number | null) => {
  const bins = new Map<number, number>();
  const key = (y: number, a: number): number =>
    Math.round(y / SURFACE_STEP_Y) * SURFACE_ANGLES + (((Math.round((a / (2 * Math.PI)) * SURFACE_ANGLES) % SURFACE_ANGLES) + SURFACE_ANGLES) % SURFACE_ANGLES);
  for (const p of panels) {
    if (p.zone !== 'skirt' && p.zone !== 'plastron') continue;
    for (let o = 0; o < p.positions.length; o += 3) {
      const x = p.positions[o]!;
      const z = p.positions[o + 2]! - axisZ;
      const k = key(p.positions[o + 1]!, Math.atan2(x, z));
      bins.set(k, Math.max(bins.get(k) ?? 0, Math.hypot(x, z)));
    }
  }
  return (y, a) => bins.get(key(y, a)) ?? null;
};

/** Cloth this close (m) to a hand, across and up/down, rests under it. */
const HAND_REACH = 0.07;
/** Half the thickness of a hand (m): cloth under a hand lies this far inside its centre. */
const PALM_DEPTH = 0.018;

/**
 * A hand resting on the skirt (arms by the hips, a flared skirt): the cloth that would run over the hand is pressed
 * in under the palm, smoothly over ~7 cm round it, so the hand lies on the skirt. The skirt is never drawn out to the
 * hand: holding it (the cloth pulled to the hand and hanging from it) made the dress look « attracted » by the hands
 * as soon as the hands came near a bell skirt. Applied to the skirt panels in place.
 */
const restHandOnSkirt = (panels: PanelMeshData[], hand: { x: number; y: number; z: number }, axisZ: number): void => {
  const handR = Math.hypot(hand.x, hand.z - axisZ);
  const limit = handR - PALM_DEPTH;
  if (limit <= 0) return;
  const press = (q: Float32Array, o: number): void => {
    const x = q[o]!;
    const z = q[o + 2]! - axisZ;
    const r = Math.hypot(x, z);
    if (r <= limit || r === 0) return;
    const d = Math.hypot(x - hand.x, q[o + 1]! - hand.y, q[o + 2]! - hand.z);
    if (d > HAND_REACH * 2) return;
    const w = Math.exp(-((d / HAND_REACH) ** 2));
    const k = (r - (r - limit) * w) / r;
    q[o] = x * k;
    q[o + 2] = axisZ + z * k;
  };
  for (const p of panels) {
    if (p.zone !== 'skirt' && p.zone !== 'plastron') continue;
    for (let o = 0; o < p.positions.length; o += 3) press(p.positions, o);
    for (let o = 0; o < p.border.length; o += 3) press(p.border, o);
  }
};

/** Only cloth this close to the torso axis (m) and this far below the nape counts as the bodice's neckline. */
const SEAT_RADIUS = 0.13;
const SEAT_DEPTH = 0.08;

/** Bodice / torso / plastron cloth points round the neck (a band collar's foot is sewn onto the highest ones). */
const necklineSeat = (panels: PanelMeshData[], env: BodyEnvelope, napeY: number): Array<[number, number, number]> => {
  const seat: Array<[number, number, number]> = [];
  for (const p of panels) {
    if (p.zone !== 'bodice' && p.zone !== 'torso' && p.zone !== 'plastron') continue;
    for (let i = 0; i < p.positions.length; i += 3) {
      const x = p.positions[i]!;
      const y = p.positions[i + 1]!;
      const z = p.positions[i + 2]!;
      // Behind the neck the neckline is the back's: a coat front running round to the neck point is no edge there.
      if (p.role === 'front' && z < env.axisZ) continue;
      if (y >= napeY - SEAT_DEPTH && Math.hypot(x, z - env.axisZ) <= SEAT_RADIUS) seat.push([x, y, z]);
    }
  }
  return seat;
};

export const drapeGarment = (
  layout: GarmentLayout,
  body: BodyMeasurements,
  env: BodyEnvelope,
  options: DrapeOptions = {},
): PanelMeshData[] => {
  const panels: PanelMeshData[] = [];
  const bodiceCloth: { front?: { panel: Classified; cloth: ClothMap }; back?: { panel: Classified; cloth: ClothMap } } = {};
  const sleeveHems: Array<{ ring: Array<[number, number, number]>; dir: [number, number, number]; rings: (row: number) => Array<[number, number, number]>; rowMm: number }> = [];
  const bodiceGroup = layout.zones.find((z) => z.zone === 'bodice');
  const bodiceDrape = bodiceGroup ? zoneDrape(bodiceGroup, env, body) : null;
  for (let group of layout.zones) {
    // Empire line: the bodice hangs from the neck and stops above the waist; the skirt starts at its lower edge.
    if (group.zone === 'skirt' && bodiceGroup?.hanging && bodiceDrape) {
      const ref = bodiceGroup.front ?? bodiceGroup.back;
      const mapping = ref ? bodiceDrape.mappings.get(ref) : undefined;
      if (ref && mapping) group = { ...group, topY: mapping.toY(ref.maxY) };
    }
    // A gathered / pleated skirt is sewn onto the bodice's lower edge: its seam is that long.
    if (group.zone === 'skirt' && bodiceDrape) {
      const c = bodiceDrape.circumference(group.topY + 0.003);
      if (c) group = { ...group, seamLength: c.total };
    }
    const zd = zoneDrape(group, env, body, options);
    if (group.zone === 'legs') {
      const mesh = drapeLeg(zd, env, body);
      // One mesh holds both legs; split it so each leg keeps its own explode direction.
      const half = mesh.positions.length / 2;
      const halfIdx = mesh.indices.length / 2;
      const ref = (group.front ?? group.back)!;
      const legPieces = [group.front, group.back].filter((c): c is Classified => c !== undefined);
      const parts = mesh.legParts;
      // A front and a back piece: each is a panel of its own, so the exploded view takes the leg apart as it is cut.
      const split = legPieces.length === 2 && parts !== undefined;
      // Lines go to the leg they lie on (a mark drawn once — the fly — is on one leg only).
      const borderOf = (side: 1 | -1): number[] => {
        const out: number[] = [];
        for (let k = 0; k + 5 < mesh.border.length; k += 6) {
          if (Math.sign(mesh.border[k]! + mesh.border[k + 3]! || side) === side) out.push(...mesh.border.slice(k, k + 6));
        }
        return out;
      };
      for (const side of [1, -1] as const) {
        const offset = side === 1 ? 0 : 1;
        const legHalf = {
          positions: mesh.positions.slice(offset * half, (offset + 1) * half),
          indices: mesh.indices.slice(offset * halfIdx, (offset + 1) * halfIdx).map((v) => v - offset * (half / 3)),
          uvs: mesh.uvs.slice((offset * mesh.uvs.length) / 2, ((offset + 1) * mesh.uvs.length) / 2),
          ...(mesh.flat && mesh.flatIds
            ? { flat: mesh.flat.slice((offset * mesh.flat.length) / 2, ((offset + 1) * mesh.flat.length) / 2), flatIds: mesh.flatIds }
            : {}),
        };
        const name = side === 1 ? 'gauche' : 'droite';
        if (split) {
          legPieces.forEach((piece, s) => {
            const sub = legPieceMesh(legHalf, (j) => legColumn((j + 0.5) / LEG_RADIAL, 2).side === s);
            const marks = parts.marks[s] ?? [];
            sub.border.push(...(side === 1 ? marks : mirroredX(marks)));
            // The fly: on the front of one leg only.
            if (side === 1 && s === 0) sub.border.push(...parts.single);
            panels.push(
              toPanel(sub, {
                id: `legs-${side}-${s === 0 ? 'front' : 'back'}`,
                label: `${piece.piece.name} — jambe ${name}`,
                role: s === 0 ? 'front' : 'back',
                zone: 'legs',
                pieceIds: pieceIdsOf(piece),
                explode: legExplode(side, s),
              }),
            );
          });
        } else {
          panels.push(
            toPanel(
              { ...legHalf, border: borderOf(side) },
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
        // A detail piece laid over both the front and the back (a turn-up round the hem) is one piece: one panel.
        const byPiece = new Map<string, { spec: DetailSpec; patches: PatchMesh[]; hosts: Array<{ x: number; y: number; z: number }> }>();
        for (const { side: s, spec, patch } of parts?.patches ?? []) {
          if (spec.single && side !== 1) continue;
          const key = `${spec.pieces.join('|')}|${spec.inside}`;
          const entry = byPiece.get(key) ?? { spec, patches: [], hosts: [] };
          entry.patches.push(side === 1 ? patch : mirrorPatch(patch));
          entry.hosts.push(split ? legExplode(side, s) : { x: side, y: 0, z: ref.role === 'front' ? 0.3 : -0.3 });
          byPiece.set(key, entry);
        }
        [...byPiece.values()].forEach(({ spec, patches, hosts }, k) => {
          const host = {
            x: hosts.reduce((sum, h) => sum + h.x, 0) / hosts.length,
            // Round the whole leg (a turn-up): it slides down off the leg, neither forwards nor backwards.
            y: hosts.length > 1 ? LEG_BAND_DROP : hosts[0]!.y,
            z: hosts.reduce((sum, h) => sum + h.z, 0) / hosts.length,
          };
          panels.push(detailPanel(joinPatches(patches), spec, layout, `legs-${side}-detail-${k}`, host));
        });
      }
      continue;
    }
    if (group.petticoat) {
      panels.push(
        toPanel(drapePetticoat(zd, group.petticoat, env), {
          id: 'skirt-petticoat',
          label: group.petticoat.piece.name,
          role: 'back',
          zone: 'skirt',
          pieceIds: [group.petticoat.piece.id],
          explode: { x: 0, y: -0.6, z: 0 },
        }),
      );
    }
    const drapes = [group.front, group.back].flatMap((panel) => (panel ? [{ panel, draped: drapeHalfPanel(zd, panel, env, body) }] : []));
    const [first, second] = drapes;
    if ((group.zone === 'bodice' || group.zone === 'torso') && first && second && !isOffShoulder(first.panel) && !isOffShoulder(second.panel)) {
      joinNeckPoints(first.draped, second.draped, env, body.neck / (2 * Math.PI));
    }
    for (const { panel, draped } of drapes) {
      if (group.zone === 'bodice' || group.zone === 'torso') bodiceCloth[panel.role === 'back' ? 'back' : 'front'] = { panel, cloth: clothMaps.get(draped)! };
      if (group.zone === 'skirt' && panel.role === 'back' && layout.train) {
        panels.push(
          toPanel(drapeTrain(draped, layout.train, env), {
            id: 'skirt-train',
            label: layout.train.piece.name,
            role: 'back',
            zone: 'skirt',
            pieceIds: [layout.train.piece.id],
            explode: { x: 0, y: -0.6, z: -1.2 },
          }),
        );
      }
      if (draped.fill) {
        panels.push(
          toPanel(draped.fill, {
            id: `${group.zone}-plastron`,
            label: 'Plastron',
            role: 'trim',
            zone: 'plastron',
            pieceIds: layout.trims.filter((t) => normalize(t.piece.name).includes('plastron')).map((t) => t.piece.id),
            explode: { x: 0, y: group.zone === 'skirt' ? -0.6 : 0, z: 0.4 },
          }),
        );
      }
      // A side gore of a gored skirt: marked as the accent part (the viewer cuts it in the contrasting fabric when asked).
      if (panel.accentPiece !== undefined && draped.flat?.length === draped.positions.length) {
        draped.accent = [];
        for (let v = 0; v < draped.flat.length; v += 3) draped.accent.push(draped.flat[v] === panel.accentPiece ? 1 : 0);
      }
      if (panel.role === 'front' && (!panel.toPiece || panel.keepsFrame)) {
        const buttons = buttonsOn(draped, panel, buttonRowsOf(panel.piece));
        if (buttons) panels.push(buttons);
      }
      panels.push(
        toPanel(draped, {
          id: `${group.zone}-${panel.role}`,
          label: panel.piece.name,
          role: panel.role,
          zone: group.zone,
          pieceIds: layout.pieceIds[`${group.zone}-${panel.role}`] ?? [],
          explode: { x: 0, y: group.zone === 'skirt' ? -0.6 : 0, z: panel.role === 'front' ? 1 : -1 },
        }),
      );
      // Detail pieces on this piece (a skirt's pockets): laid on its cloth, on both halves unless drawn once.
      const cloth = clothMaps.get(draped);
      if (cloth && (!panel.toPiece || panel.keepsFrame)) {
        const host = { x: 0, y: group.zone === 'skirt' ? -0.6 : 0, z: panel.role === 'front' ? 1 : -1 };
        const place = (x: number, y: number, lift: number): [number, number, number] => {
          const p = cloth(x, y);
          const dz = p[2] - env.axisZ;
          const len = Math.hypot(p[0], dz) || 1;
          return [p[0] + (p[0] / len) * lift, p[1], p[2] + (dz / len) * lift];
        };
        detailAreasOf(panel.piece.dimensionsJson).forEach((spec, k) => {
          const patch = drapePatch(spec.area, place, spec.inside, spec.layer);
          if (!patch) return;
          const id = `${group.zone}-${panel.role}-detail-${k}`;
          panels.push(detailPanel(patch, spec, layout, `${id}-1`, { ...host, x: 0.4 }));
          if (!spec.single) panels.push(detailPanel(mirrorPatch(patch), spec, layout, `${id}--1`, { ...host, x: -0.4 }));
        });
      }
    }
  }
  const revers = layout.trims.find((t) => normalize(t.piece.name) === 'revers');
  const reversPanel = revers ? drapeReversOn(panels, revers) : null;
  if (reversPanel) panels.push(reversPanel);
  const cuff = layout.trims.find((t) => normalize(t.piece.name).includes('poignet'));
  // The cuff is cut folded: its finished height is half the piece's — unless it is cut single with a facing of its own
  // (a tailored sleeve's « Parementure de poignet »).
  const facedCuff = (layout.detailPieces ?? []).some((p) => normalize(p.name).includes('parementure de poignet'));
  const cuffHeight = cuff ? Math.max(0.015, (cuff.maxY - cuff.minY) / (facedCuff ? 1000 : 2000)) : CUFF_HEIGHT;
  for (const sleeve of layout.sleeves) {
    const endBefore = cuff ? cuffHeight : 0;
    const left = drapeSleeve(sleeve, env, env.arm, endBefore);
    if (!left) continue;
    // The right arm, when posed on its own, gets its own sleeve (draped as a left one, then mirrored).
    const own = env.armRight ? drapeSleeve(sleeve, env, env.armRight, endBefore) : null;
    const source = own ?? left;
    const right: Mesh = {
      positions: [],
      indices: [],
      border: [],
      uvs: [...source.uvs],
      ...(source.flat && source.flatIds ? { flat: source.flat, flatIds: source.flatIds } : {}),
      ...(source.accent ? { accent: source.accent } : {}),
      ...(source.ao ? { ao: source.ao } : {}),
    };
    for (let i = 0; i < source.positions.length; i += 3) right.positions.push(-source.positions[i]!, source.positions[i + 1]!, source.positions[i + 2]!);
    for (let t = 0; t < source.indices.length; t += 3) right.indices.push(source.indices[t]!, source.indices[t + 2]!, source.indices[t + 1]!);
    for (let k = 0; k < source.border.length; k += 3) right.border.push(-source.border[k]!, source.border[k + 1]!, source.border[k + 2]!);
    for (const [side, mesh] of [[1, left], [-1, right]] as const) {
      {
        const ringOf = (row: number): Array<[number, number, number]> =>
          Array.from({ length: SLEEVE_RADIAL }, (_, j) => {
            const v = (row * SLEEVE_RADIAL + j) * 3;
            return [mesh.positions[v]!, mesh.positions[v + 1]!, mesh.positions[v + 2]!];
          });
        const mean = (r: Array<[number, number, number]>, k: number): number => r.reduce((s, p) => s + p[k]!, 0) / r.length;
        const hem = ringOf(ROWS);
        const before = ringOf(ROWS - Math.min(CUFF_DIR_ROWS, ROWS));
        sleeveHems.push({
          ring: hem,
          dir: [0, 1, 2].map((k) => mean(hem, k) - mean(before, k)) as [number, number, number],
          rings: ringOf,
          rowMm: (sleeve.maxY - sleeve.minY) / ROWS,
        });
      }
      if (cuff) {
        // The last row of the sleeve goes round the wrist; the cuff carries on from it towards the hand.
        const ringAt = (row: number): Array<[number, number, number]> =>
          Array.from({ length: SLEEVE_RADIAL }, (_, j) => {
            const v = (row * SLEEVE_RADIAL + j) * 3;
            return [mesh.positions[v]!, mesh.positions[v + 1]!, mesh.positions[v + 2]!];
          });
        // The arm's direction over the last ~quarter of the sleeve: its very last rows are stacked at the wrist, too
        // close together to tell a direction (the cuff lay down across the wrist).
        const last = ringAt(ROWS);
        const before = ringAt(ROWS - CUFF_DIR_ROWS);
        const mean = (r: Array<[number, number, number]>, k: number): number => r.reduce((s, p) => s + p[k]!, 0) / r.length;
        const dir: [number, number, number] = [0, 1, 2].map((k) => mean(last, k) - mean(before, k)) as [number, number, number];
        panels.push(
          toPanel(drapeCuff(last, dir, cuffHeight), {
            id: `cuff-${cuff.piece.id}-${side}`,
            label: cuff.piece.name,
            role: 'trim',
            zone: 'cuff',
            pieceIds: [cuff.piece.id],
            explode: { x: side * 1.2, y: -0.3, z: 0 },
          }),
        );
      }
      panels.push(
        toPanel(mesh, {
          id: `sleeve-${sleeve.piece.id}-${side}`,
          label: sleeve.piece.name,
          role: 'sleeve',
          zone: 'sleeve',
          pieceIds: pieceIdsOf(sleeve),
          explode: { x: side, y: 0, z: 0 },
        }),
      );
    }
  }
  for (const collar of layout.collars) {
    const kind = collarKindOf(collar.piece.name);
    if (!kind) continue;
    const xs = collar.polygon.map((pt) => pt.x);
    const spec: CollarSpec = {
      kind,
      lengthMm: Math.max(...xs) - Math.min(...xs),
      heightMm: collar.maxY - collar.minY,
    };
    const seat = kind === 'BAND' ? necklineSeat(panels, env, body.napeY) : [];
    const draped = drapeCollar(spec, env, { napeY: body.napeY, neck: body.neck, backLength: body.backLength, seat });
    if (!draped) continue;
    const sides = draped.mirrored ? ([1, -1] as const) : ([1] as const);
    for (const side of sides) {
      const source = draped.mesh;
      const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [...source.uvs] };
      for (let i = 0; i < source.positions.length; i += 3) mesh.positions.push(source.positions[i]! * side, source.positions[i + 1]!, source.positions[i + 2]!);
      for (let t = 0; t < source.indices.length; t += 3) {
        mesh.indices.push(source.indices[t]!, ...(side === 1 ? [source.indices[t + 1]!, source.indices[t + 2]!] : [source.indices[t + 2]!, source.indices[t + 1]!]));
      }
      for (let k = 0; k < source.border.length; k += 3) mesh.border.push(source.border[k]! * side, source.border[k + 1]!, source.border[k + 2]!);
      panels.push(
        toPanel(mesh, {
          id: `collar-${collar.piece.id}-${side}`,
          label: collar.piece.name,
          role: 'collar',
          zone: 'collar',
          pieceIds: [collar.piece.id],
          explode: { x: 0, y: 0.6, z: 0.3 },
        }),
      );
    }
  }
  const cord = layout.trims.find((t) => normalize(t.piece.name).includes('cordeliere'));
  if (cord) {
    // Tied at the centre front at the waist, on top of the fronts.
    const waistY = bodyLandmarks(body).waistY;
    let front = env.axisZ + 0.1;
    let found = false;
    for (const panel of panels) {
      if (panel.role !== 'front' && panel.role !== 'trim') continue;
      for (let i = 0; i < panel.positions.length; i += 3) {
        if (Math.abs(panel.positions[i]!) < 0.07 && Math.abs(panel.positions[i + 1]! - waistY) < 0.03) {
          front = found ? Math.max(front, panel.positions[i + 2]!) : panel.positions[i + 2]!;
          found = true;
        }
      }
    }
    panels.push(
      toPanel(drapeCord(waistY, front + 0.006), {
        id: `cord-${cord.piece.id}`,
        label: cord.piece.name,
        role: 'trim',
        zone: 'cord',
        pieceIds: [cord.piece.id],
        explode: { x: 0, y: 0, z: 0.8 },
      }),
    );
  }
  const belt = layout.trims.find((t) => normalize(t.piece.name) === 'ceinture');
  const bow = layout.trims.filter((t) => normalize(t.piece.name).includes('noeud'));
  if (belt || bow.length > 0) {
    // Round the cloth at the waist: the furthest the bodice / skirt / plastron reaches from the axis, per angle.
    // Not the arms: with the hands at the waist (arms held out, hands on the hips), a cuff there drew the belt out to
    // the wrists in a straight bar.
    // Trousers / a skirt without a bodice: the band sits on their top edge (a low or high rise), not at the waist.
    const bottomsOnly = panels.every((p) => p.zone !== 'bodice' && p.zone !== 'torso');
    const topOfBottoms = Math.max(
      -Infinity,
      ...panels.filter((p) => p.zone === 'legs' || p.zone === 'skirt').map((p) => {
        let m = -Infinity;
        for (let i = 1; i < p.positions.length; i += 3) m = Math.max(m, p.positions[i]!);
        return m;
      }),
    );
    const waistY = bottomsOnly && Number.isFinite(topOfBottoms) ? topOfBottoms - BELT_HEIGHT / 2 : bodyLandmarks(body).waistY;
    const bins = new Float64Array(BELT_BINS);
    for (const panel of panels) {
      if (panel.role === 'sleeve' || panel.zone === 'cuff' || panel.zone === 'cord' || panel.zone === 'collar') continue;
      for (let i = 0; i < panel.positions.length; i += 3) {
        if (Math.abs(panel.positions[i + 1]! - waistY) > 0.025) continue;
        const x = panel.positions[i]!;
        const z = panel.positions[i + 2]! - env.axisZ;
        const k = Math.round(((Math.atan2(x, z) + 2 * Math.PI) % (2 * Math.PI)) / ((2 * Math.PI) / BELT_BINS)) % BELT_BINS;
        bins[k] = Math.max(bins[k]!, Math.hypot(x, z));
      }
    }
    const radiusAt = beltRadius(bins);
    const height = belt ? Math.max(0.02, (belt.maxY - belt.minY) / 2000) : BELT_HEIGHT;
    const ids = [...(belt ? [belt.piece.id] : []), ...bow.map((t) => t.piece.id)];
    panels.push(
      toPanel(drapeBelt(waistY, env.axisZ, radiusAt, height, bow.length > 0), {
        id: `belt-${ids[0]}`,
        label: belt?.piece.name ?? bow[0]!.piece.name,
        role: 'trim',
        zone: 'belt',
        pieceIds: ids,
        explode: { x: 0, y: -0.2, z: 0.9 },
      }),
    );
  }
  if (layout.construction && layout.construction.length > 0) {
    panels.push(...drapeConstruction(layout.construction, panels, { axisZ: env.axisZ, napeY: body.napeY, waistY: bodyLandmarks(body).waistY, sleeveHems }));
  }
  panels.push(...drapeTrims(layout, bodiceCloth, sleeveHems, env.axisZ));
  for (const hand of options.hands ?? []) restHandOnSkirt(panels, hand, env.axisZ);
  return panels;
};

/**
 * Garnitures on the draped garment: the lace berthe laid on the bodice, the frills round the sleeve hems (the first
 * one lowest, each next one higher by FRILL_SHOW of a frill), the bead rows along their places.
 */
const drapeTrims = (
  layout: GarmentLayout,
  bodice: { front?: { panel: Classified; cloth: ClothMap }; back?: { panel: Classified; cloth: ClothMap } },
  sleeves: Array<{ ring: Array<[number, number, number]>; dir: [number, number, number]; rings: (row: number) => Array<[number, number, number]>; rowMm: number }>,
  axisZ: number,
): PanelMeshData[] => {
  const out: PanelMeshData[] = [];
  const specs = layout.trimSpecs ?? [];
  const bertheSpec = specs.find((t) => t.kind === 'BERTHE');
  const frillSpec = specs.find((t) => t.kind === 'SLEEVE_FRILL');
  const laceData = (spec: Trim | undefined) => ({
    ...(spec && spec.kind !== 'BEADING' ? { material: spec.material } : {}),
    trimColor: spec?.color ?? LACE_COLOR,
  });
  // Berthe halves, front and back, on their bodice panels.
  const bertheMeshes: Partial<Record<'front' | 'back', { piece: Classified; mesh: TrimMesh }>> = {};
  for (const role of ['front', 'back'] as const) {
    const piece = layout.berthe?.[role];
    const on = bodice[role];
    if (!piece || !on) continue;
    const mesh = drapeBerthe(piece.polygon, on.cloth, axisZ);
    if (!mesh) continue;
    bertheMeshes[role] = { piece, mesh };
    out.push(
      trimPanel(mesh, {
        id: `lace-berthe-${role}`,
        label: piece.piece.name,
        role: 'trim',
        zone: 'lace',
        pieceIds: [piece.piece.id],
        explode: { x: 0, y: 0.1, z: role === 'front' ? 1.3 : -1.3 },
        ...laceData(bertheSpec),
      }),
    );
  }
  // Sleeve frills, lowest first.
  const frills = layout.frills ?? [];
  sleeves.forEach((sleeve, s) => {
    frills.forEach((frill, k) => {
      const depthMm = frill.maxY - frill.minY;
      const up = Math.round((k * depthMm * FRILL_SHOW) / Math.max(1, sleeve.rowMm));
      const ring = sleeve.rings(Math.max(0, ROWS - up));
      out.push(
        trimPanel(drapeFrill(ring, sleeve.dir, depthMm / 1000), {
          id: `lace-frill-${k}-${s}`,
          label: frill.piece.name,
          role: 'trim',
          zone: 'lace',
          pieceIds: [frill.piece.id],
          explode: { x: s % 2 === 0 ? 1.2 : -1.2, y: -0.1, z: 0 },
          ...laceData(frillSpec),
        }),
      );
    });
  });
  // Bead rows.
  for (const spec of specs) {
    if (spec.kind !== 'BEADING') continue;
    const beadM = spec.beadMm / 1000;
    const centres: Array<[number, number, number]> = [];
    for (let row = 0; row < spec.rows; row += 1) {
      const down = (row + 0.5) * spec.beadMm + 2;
      if (spec.place === 'ENCOLURE') {
        for (const role of ['front', 'back'] as const) {
          const on = bodice[role];
          if (!on) continue;
          const edge = necklineEdgeOf(on.panel, normalize(on.panel.piece.name).includes('hors epaules'));
          const lift = bertheMeshes[role] ? BEAD_ON_LACE : BEAD_ON_CLOTH;
          centres.push(...withMirrorBeads(beadsAlong(edge.map((p) => on.cloth(p.x, p.y + down)), beadM, axisZ, lift + beadM / 2)));
        }
      } else if (spec.place === 'BERTHE') {
        const b = bertheMeshes.front;
        const on = bodice.front;
        if (!b || !on) continue;
        // Along the berthe's point, a little above its scalloped bottom edge.
        const ring = b.piece.polygon;
        const top: Point[] = [];
        for (const p of ring) {
          if (top.length > 0 && p.x <= top[top.length - 1]!.x) break;
          top.push(p);
        }
        const bottom = ring.slice(top.length).reverse();
        centres.push(...withMirrorBeads(beadsAlong(bottom.map((p) => on.cloth(p.x, p.y - 14 - down)), beadM, axisZ, BEAD_ON_LACE + beadM / 2)));
      } else if (spec.place === 'MANCHES') {
        // Round the sleeve just above its hem (each further row higher up the sleeve).
        for (const sleeve of sleeves) {
          const ring = sleeve.rings(Math.max(0, ROWS - Math.round(down / Math.max(1, sleeve.rowMm))));
          centres.push(...beadsAlong(ring, beadM, axisZ, BEAD_ON_CLOTH + beadM / 2, true));
        }
      } else {
        const on = [bodice.front, bodice.back];
        for (const b of on) {
          if (!b) continue;
          const waist = waistRowOf(b.panel);
          const maxX = Math.max(...b.panel.polygon.map((p) => p.x));
          const line = Array.from({ length: 25 }, (_, k) => b.cloth((maxX * k) / 24, waist - down));
          centres.push(...withMirrorBeads(beadsAlong(line, beadM, axisZ, BEAD_ON_CLOTH + beadM / 2)));
        }
      }
    }
    if (centres.length > 0) {
      out.push(beadPanel(`beads-${spec.place}`, `Perles (${spec.place.toLowerCase()})`, centres, spec.beadMm, spec.color ?? PEARL_COLOR, []));
    }
  }
  return out;
};

/** Angles sampled round the waist for a belt. */
const BELT_BINS = 48;

/**
 * Radius of the cloth round the waist as a smooth function of the angle, from the furthest vertex per angle bin
 * (empty bins take their neighbours' values, then a light smoothing removes the folds' jags).
 */
export const beltRadius = (bins: Float64Array): ((theta: number) => number) => {
  const n = bins.length;
  const filled = Float64Array.from(bins);
  if (!bins.some((r) => r > 0)) return () => 0.12;
  for (let k = 0; k < n; k += 1) {
    if (filled[k]! > 0) continue;
    // Nearest sampled bins before and after, round the circle.
    let back = 1;
    while (bins[(k - back + n * 2) % n]! <= 0) back += 1;
    let ahead = 1;
    while (bins[(k + ahead) % n]! <= 0) ahead += 1;
    const ra = bins[(k - back + n * 2) % n]!;
    const rb = bins[(k + ahead) % n]!;
    filled[k] = ra + ((rb - ra) * back) / (back + ahead);
  }
  const smoothed = Float64Array.from(filled, (_, k) => (filled[(k - 1 + n) % n]! + 2 * filled[k]! + filled[(k + 1) % n]!) / 4);
  return (theta: number) => {
    const u = ((((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)) * n;
    const k = Math.floor(u) % n;
    return smoothed[k]! + (smoothed[(k + 1) % n]! - smoothed[k]!) * (u - Math.floor(u));
  };
};

/**
 * Flat height of a bodice's waist: its narrowest row in the lower 45 % of the piece (the bottom edge for
 * a bodice that stops at the waist; higher for one that runs on over the hips, widening again).
 */
export const waistRowOf = (c: Classified): number => {
  let best = c.maxY;
  let narrowest = Infinity;
  // A pointed waist (taille en pointe) narrows to its point below the waist: rows much narrower than the widest of the
  // lower part are the point, not the waist.
  let widest = 0;
  for (let k = 0; k <= 45; k += 1) {
    const e = rowExtent(c.polygon, c.maxY - FLAT_EPSILON - ((c.maxY - c.minY) * 0.45 * k) / 45);
    if (e) widest = Math.max(widest, e[1]);
  }
  for (let k = 0; k <= 45; k += 1) {
    const y = c.maxY - FLAT_EPSILON - ((c.maxY - c.minY) * 0.45 * k) / 45;
    const e = rowExtent(c.polygon, y);
    if (!e || e[1] < WAIST_POINT_ROW_SHARE * widest) continue;
    if (e[1] < narrowest - 0.5) {
      narrowest = e[1];
      best = y;
    }
  }
  return best >= c.maxY - 3 ? c.maxY : best;
};

/** A row narrower than this share of the bodice's lower part is its pointed waist's point, not its waist. */
const WAIST_POINT_ROW_SHARE = 0.7;

/**
 * How far (mm, flat) a bodice runs on below its waist at full width (a basque, taille basse) — 0 for a pointed waist,
 * whose point alone goes lower: the skirt still starts at the waist and is sewn along the point.
 */
export const basqueDepthOf = (c: Classified): number => {
  const waist = waistRowOf(c);
  const at = rowExtent(c.polygon, Math.max(c.minY + FLAT_EPSILON, waist - FLAT_EPSILON));
  if (!at) return c.maxY - waist;
  for (let y = c.maxY - FLAT_EPSILON; y > waist; y -= 2) {
    const e = rowExtent(c.polygon, y);
    if (e && e[1] >= WAIST_POINT_ROW_SHARE * at[1]) return y - waist;
  }
  return 0;
};

/** Height of the gathers above a midriff seam (m of fabric, measured flat). */
const GATHER_ZONE_MM = 70;

/** One side of a mesh and its mirror (x → −x, triangles turned back the right way), as one mesh. */
const withMirror = (one: CollarMesh): CollarMesh => {
  const count = one.positions.length / 3;
  const out: CollarMesh = { positions: [...one.positions], indices: [...one.indices], border: [...one.border], uvs: [...one.uvs, ...one.uvs] };
  for (let i = 0; i < count; i += 1) out.positions.push(-one.positions[i * 3]!, one.positions[i * 3 + 1]!, one.positions[i * 3 + 2]!);
  for (let t = 0; t < one.indices.length; t += 3) out.indices.push(one.indices[t]! + count, one.indices[t + 2]! + count, one.indices[t + 1]! + count);
  for (let k = 0; k < one.border.length; k += 3) out.border.push(-one.border[k]!, one.border[k + 1]!, one.border[k + 2]!);
  return out;
};

/**
 * The revers of a coat-dress (`Revers` piece, cut in the bodice front's own coordinates along its opening): laid on
 * the draped bodice front from its opening edge, as wide at each row as the piece is there. Null without a bodice
 * front that can be read back to its piece.
 */
const drapeReversOn = (panels: PanelMeshData[], revers: Classified): PanelMeshData | null => {
  const front = panels.find((p) => p.zone === 'bodice' && p.role === 'front' && p.edit);
  if (!front?.edit) return null;
  const { edit, positions } = front;
  const width = COLUMNS + 1;
  const half = (ROWS + 1) * width;
  if (positions.length / 3 < half) return null;
  const at = (v: number): [number, number, number] => [positions[v * 3]!, positions[v * 3 + 1]!, positions[v * 3 + 2]!];
  const edge: Parameters<typeof drapeRevers>[0] = [];
  for (let r = 0; r <= ROWS; r += 1) {
    const v0 = r * width;
    const v1 = v0 + 2;
    if (edit.piece[v0] === NOT_EDITABLE || edit.piece[v1] === NOT_EDITABLE) continue;
    const fx0 = edit.flat[v0 * 2]!;
    const fx1 = edit.flat[v1 * 2]!;
    const fy = edit.flat[v0 * 2 + 1]!;
    const e = extentIn(revers, fy);
    if (!e || Math.abs(fx1 - fx0) < 1e-3) continue;
    const a = at(v0);
    const b = at(v1);
    const across: [number, number, number] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    // Metres of draped cloth per millimetre of pattern across this row.
    const k = Math.hypot(...across) / Math.abs(fx1 - fx0);
    const radial = Math.hypot(a[0], a[2]) || 1;
    edge.push({ p: a, w: across, n: [a[0] / radial, 0, a[2] / radial], width: (e[1] - e[0]) * k });
  }
  const one = drapeRevers(edge);
  if (!one) return null;
  return toPanel(withMirror(one), {
    id: `revers-${revers.piece.id}`,
    label: revers.piece.name,
    role: 'trim',
    zone: 'revers',
    pieceIds: [revers.piece.id],
    explode: { x: 0, y: 0.2, z: 1.1 },
  });
};

/** Rows sampled when pieces are joined side by side into one panel (mm). */
const JOIN_STEP_MM = 5;

/** A piece's share of each row of a joined panel: [start, end] on the piece itself, or null where it has none. */
export interface RowPart {
  c: Classified;
  /** Index of the piece in the joined panel's `toPiece.ids`. */
  index: number;
  range: (y: number) => [number, number] | null;
}

/** [x0, x1] of a classified piece on the row `y`, or null outside its heights. */
const extentIn = (c: Classified, y: number): [number, number] | null =>
  y < c.minY - FLAT_EPSILON || y > c.maxY + FLAT_EPSILON
    ? null
    : rowExtent(c.polygon, clamp(y, c.minY + FLAT_EPSILON, c.maxY - FLAT_EPSILON));

/**
 * Pieces sewn side by side down their length (a gored skirt's centre panel and side gore, the upper and under
 * sleeve of a two-piece sleeve) drape as ONE panel: each row is as wide as their rows put end to end, starting at
 * `startAt(y)`. Every point maps back to the piece it lies on (modelling stays exact), and the seams between them
 * are kept as flat polylines. The pieces must share their heights (the pattern engine cuts them so).
 */
export const joinRows = (base: Classified, parts: RowPart[], ids: string[], startAt: (y: number) => number): Classified => {
  const minY = Math.min(...parts.map((p) => p.c.minY));
  const maxY = Math.max(...parts.map((p) => p.c.maxY));
  const rights: Point[] = [];
  const lefts: Point[] = [];
  const seams: Point[][] = parts.slice(1).map(() => []);
  for (let y = minY; ; y = Math.min(maxY, y + JOIN_STEP_MM)) {
    let x = startAt(y);
    lefts.push({ x, y });
    for (const [k, part] of parts.entries()) {
      const r = part.range(y);
      if (r) x += Math.max(0, r[1] - r[0]);
      // A seam exists where pieces lie on both sides of it.
      if (k < parts.length - 1 && r && parts.slice(k + 1).some((q) => q.range(y))) seams[k]!.push({ x, y });
    }
    rights.push({ x, y });
    if (y >= maxY) break;
  }
  return {
    ...base,
    polygon: [...rights, ...lefts.reverse()],
    minY,
    maxY,
    seamLines: seams.filter((line) => line.length >= 2),
    toPiece: {
      ids,
      map: (x, y) => {
        let acc = startAt(y);
        let last: [number, number, number] | null = null;
        for (const part of parts) {
          const r = part.range(y);
          if (!r) continue;
          const w = Math.max(0, r[1] - r[0]);
          last = [part.index, r[1], y];
          if (x <= acc + w) return [part.index, r[0] + Math.max(0, x - acc), y];
          acc += w;
        }
        return last;
      },
    },
  };
};

/** Points the dipped top edge of a block skirt's front is drawn with (see `dipBlockSkirtUnderPoint`). */
const SKIRT_DIP_POINTS = 8;
const BASQUE_TOLERANCE_MM = 10;

/**
 * A skirt cut as a block (gathered, pleated) under a pointed waist: its front stand-in is a trapezoid whose top edge is
 * the waist, so the skirt covered the bodice's point. The skirt is sewn along the point: its top edge dips to the
 * point's depth at the centre front, as the engine's own front skirt does under a pointed waist (`pointSkirtTop`).
 */
export const dipBlockSkirtUnderPoint = (classified: Classified[]): void => {
  const bodice = classified.find((c) => c.zone === 'bodice' && c.role === 'front');
  const skirt = classified.find((c) => c.zone === 'skirt' && c.role === 'front' && c.gathered && c.polygon.length === 4);
  // A basque (taille basse) runs on at full width: the skirt starts below it. A few mm are the waist's own rounding.
  if (!bodice || !skirt || basqueDepthOf(bodice) > BASQUE_TOLERANCE_MM) return;
  const waist = waistRowOf(bodice);
  const drop = bodice.maxY - waist;
  const waistWidth = rowExtent(bodice.polygon, waist - FLAT_EPSILON)?.[1] ?? 0;
  const pointWidth = rowExtent(bodice.polygon, waist + drop * 0.5)?.[1] ?? 0;
  if (drop < 20 || !(waistWidth > 0)) return;
  const [, top, hem, bottom] = skirt.polygon as [Point, Point, Point, Point];
  // Across the skirt's top: as deep as the bodice's point at the same share of the waist's width.
  const edge: Point[] = [];
  for (let k = 0; k <= SKIRT_DIP_POINTS; k += 1) {
    const t = k / SKIRT_DIP_POINTS;
    const share = clamp(1 - t * (waistWidth / Math.max(1, Math.max(pointWidth * 2, waistWidth * 0.6))), 0, 1);
    edge.push({ x: top.x * t, y: drop * share * share });
  }
  skirt.polygon = [...edge, hem, bottom];
};

/**
 * Puts back together, for the drape, the pieces a pattern cuts one panel into: a two-piece sleeve (« Manche
 * extérieure » + « Manche intérieure »: the under sleeve's back half, the upper sleeve, its front half) and a gored
 * skirt (« Jupe Devant » + « Jupe Côté Devant », same for the back) and a princess bodice or skirt (« Bustier Devant »
 * + « Bustier Côté »). Replaces them in `classified`.
 */
const joinPieces = (classified: Classified[]): void => {
  const named = (part: string) => (c: Classified) => normalize(c.piece.name).includes(part);
  const replace = (joined: Classified, gone: Classified[]): void => {
    const at = classified.indexOf(gone[0]!);
    for (const g of gone) classified.splice(classified.indexOf(g), 1);
    classified.splice(Math.max(0, at), 0, joined);
  };
  const sleeves = classified.filter((c) => c.role === 'sleeve');
  const upper = sleeves.find(named('exterieure'));
  const under = sleeves.find(named('interieure'));
  if (upper && under && !upper.toPiece && !under.toPiece) {
    const ext = (y: number) => extentIn(under, y);
    replace(
      {
        ...joinRows(
          upper,
          [
            { c: under, index: 1, range: (y) => { const e = ext(y); return e ? [Math.max(0, e[0]), Math.max(0, e[1])] : null; } },
            { c: upper, index: 0, range: (y) => extentIn(upper, y) },
            { c: under, index: 1, range: (y) => { const e = ext(y); return e ? [Math.min(0, e[0]), Math.min(0, e[1])] : null; } },
          ],
          [upper.piece.id, under.piece.id],
          () => 0,
        ),
        partner: under.piece,
      },
      [upper, under],
    );
  }
  for (const [zone, role] of [['skirt', 'front'], ['skirt', 'back'], ['bodice', 'front'], ['bodice', 'back']] as const) {
    const panels = classified.filter((c) => c.zone === zone && c.role === role && !c.toPiece);
    // The centre panel (milieu devant / dos), then its side panels outwards in the pattern's order (a skirt cut in
    // gores has several: côté devant, côté…).
    const centre = panels.find((c) => !named('cote')(c));
    const sides = panels.filter((c) => c !== centre && named('cote')(c));
    if (!centre || sides.length === 0) continue;
    const parts = [centre, ...sides];
    // Lines drawn inside the pieces (bones) carry over, each piece's moved past the pieces before it.
    const inner = parts.flatMap((part, k) =>
      (part.seamLines ?? []).map((line) =>
        line.map((p) => {
          if (k === 0) return { x: p.x, y: p.y };
          let x = p.x + (extentIn(centre, p.y)?.[0] ?? 0);
          for (const before of parts.slice(0, k)) {
            const e = extentIn(before, p.y);
            if (e) x += Math.max(0, e[1] - e[0]);
          }
          const own = extentIn(part, p.y);
          return { x: x - (own ? own[0] : 0), y: p.y };
        }),
      ),
    );
    const joinedPanel = joinRows(
      centre,
      parts.map((c, index) => ({ c, index, range: (y: number) => extentIn(c, y) })),
      parts.map((c) => c.piece.id),
      (y) => extentIn(centre, y)?.[0] ?? 0,
    );
    // Only a skirt's side gores can be cut in the contrasting fabric (`contrastGores`); a princess side panel is the dress fabric.
    replace({ ...joinedPanel, ...(zone === 'skirt' ? { accentPiece: 1 } : {}), keepsFrame: true, seamLines: [...(joinedPanel.seamLines ?? []), ...inner] }, parts);
  }
};

/**
 * Lines drawn inside a piece by the engine (`dimensionsJson.internalLinesMm`) that show on the outside of the garment:
 * bones (BONE) and detail marks (PLACEMENT: pleats, darts, fly, pockets, welts, turn-up). Not the natural waist line.
 */
const detailLinesOf = (piece: PatternPieceDto): Array<{ points: Point[]; single: boolean }> => {
  const lines = (piece.dimensionsJson as { internalLinesMm?: Array<{ kind?: string; points?: Point[]; single?: boolean; buttons?: unknown }> } | null)?.internalLinesMm;
  return (lines ?? [])
    // Button placements are not stitched lines: they are drawn as buttons (see buttonRowsOf).
    .filter((l) => (l.kind === 'BONE' || l.kind === 'PLACEMENT') && !l.buttons && Array.isArray(l.points) && l.points.length >= 2)
    .map((l) => ({ points: l.points!.map((p) => ({ x: p.x, y: p.y })), single: l.single === true }));
};

/** Rows of buttons the engine placed on a piece (`internalLinesMm[].buttons`): their centres (mm) and diameter. */
const buttonRowsOf = (piece: PatternPieceDto): Array<{ points: Point[]; diameterMm: number }> => {
  const lines = (piece.dimensionsJson as { internalLinesMm?: Array<{ points?: Point[]; buttons?: { diameterMm?: unknown } }> } | null)?.internalLinesMm;
  return (lines ?? []).flatMap((l) => {
    const d = l.buttons?.diameterMm;
    return typeof d === 'number' && d > 0 && Array.isArray(l.points) && l.points.length > 0 ? [{ points: l.points.map((p) => ({ x: p.x, y: p.y })), diameterMm: d }] : [];
  });
};

/** The same lines as flat polylines (half panels draw them on both halves). */
const boneLinesOf = (piece: PatternPieceDto): Point[][] => detailLinesOf(piece).map((l) => l.points);

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
    // Above the seam: the upper piece (the drawn-in width stretched back to its own); below: the band.
    toPiece: {
      ids: [upper.piece.id, band.piece.id],
      map: (x, y) => {
        if (y >= seamY) return [1, x, bandTop + (y - seamY)];
        const e = extentAt(y);
        const k = e.x1 > e.x0 ? (e.x1 + e.extra - e.x0) / (e.x1 - e.x0) : 1;
        return [0, e.x0 + (x - e.x0) * k, y];
      },
    },
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
  let pleats = 0;
  const half = CIRCLE_ARC_SEGMENTS + 1;
  if (n.includes('cercle') && polygon.length >= 2 * half) {
    // Inner arc (the waist), outer arc (the hem), joined by the straight side edges.
    waist = pathLength(polygon.slice(0, half)) * quantity;
    hem = pathLength(polygon.slice(half, 2 * half)) * quantity;
    length = Math.hypot(polygon[half]!.x - polygon[half - 1]!.x, polygon[half]!.y - polygon[half - 1]!.y);
  } else if (n.includes('fronc') || n.includes('pliss')) {
    // A rectangle (straight cut) or a trapezoid (A-line cut): read the widths at the top and at the hem rows.
    const widthAt = (y: number): number => {
      const e = rowExtent(polygon, y);
      return e ? e[1] - e[0] : bounds.width;
    };
    waist = widthAt(bounds.minY + FLAT_EPSILON) * quantity;
    hem = widthAt(bounds.maxY - FLAT_EPSILON) * quantity;
    length = bounds.height;
    gathered = true;
    // Pleat marks along the waist edge, one per pleat (pattern-engine's pleated block).
    if (n.includes('pliss') && Array.isArray(piece.notchesJson)) pleats = piece.notchesJson.length * quantity;
  } else {
    return null;
  }
  const outline: Point[] = [
    { x: 0, y: 0 },
    { x: waist / 4, y: 0 },
    { x: hem / 4, y: length },
    { x: 0, y: length },
  ];
  // A straight or A-line block: the stand-in's width at a depth is the block's own, scaled. A circle's sector is
  // not a row-by-row shape: it is shown but not modelled.
  const toPiece: PieceMapping = gathered
    ? {
        ids: [piece.id],
        map: (x, y) => {
          const own = bounds.minY + clamp(y, 0, length);
          const e = rowExtent(polygon, clamp(own, bounds.minY + FLAT_EPSILON, bounds.maxY - FLAT_EPSILON)) ?? [bounds.minX, bounds.maxX];
          const standIn = lerp(waist, hem, clamp(y / Math.max(length, 1), 0, 1)) / 4;
          return [0, e[0] + (standIn > 0 ? x / standIn : 0) * (e[1] - e[0]), own];
        },
      }
    : { ids: [piece.id], map: () => null };
  const make = (role: 'front' | 'back'): Classified => ({
    piece,
    polygon: outline,
    role,
    zone: 'skirt',
    minY: 0,
    maxY: length,
    fold: 2,
    toPiece,
    ...(gathered ? { gathered } : {}),
    ...(pleats > 0 ? { pleats } : {}),
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
  fabricBehavior?: string | null,
  trimSpecs?: Trim[] | null,
): GarmentModelResult => {
  const { body, rings } = bodyFor(measurements, templateId);
  const landmarks = bodyLandmarks(body);

  const classified: Classified[] = [];
  /** Pieces with a usable outline that no front/back rule recognised (candidates for the generic wrap). */
  const unrecognised: Classified[] = [];
  const collars: Classified[] = [];
  const trims: Classified[] = [];
  const petticoats: Classified[] = [];
  const trains: Classified[] = [];
  const ignored: string[] = [];
  const inside: string[] = [];
  const detailPieces: Array<{ id: string; name: string }> = [];
  const construction: ConstructionPiece[] = [];
  const understructure: Understructure[] = [];
  const berthe: { front?: Classified; back?: Classified } = {};
  const frills: Classified[] = [];
  for (const piece of pieces) {
    const outline = (piece.dimensionsJson as { outlineMm?: Point[] } | null)?.outlineMm;
    const role = classifyPiece(piece.name, garmentType);
    if (!outline || outline.length < 3) {
      ignored.push(piece.name);
      continue;
    }
    // Darts sewn: the cloth is draped as worn, not as cut.
    const polygon = closeDarts(openPolygon(outline));
    const bounds = getBounds(polygon);
    if (bounds.height <= 1 || bounds.width <= 1) {
      ignored.push(piece.name);
      continue;
    }
    const trimName = normalize(piece.name);
    // A train block is sewn along the back skirt's hem (a back skirt cut with its train is a skirt panel).
    if (trimName.includes('traine') && !trimName.includes('jupe')) {
      trains.push({ piece, polygon, role: 'back', zone: 'skirt', minY: bounds.minY, maxY: bounds.maxY });
      continue;
    }
    // The petticoat is worn under the skirt: it holds the skirt out, it is not one of its panels.
    if (trimName.includes('jupon')) {
      petticoats.push({ piece, polygon, role: 'back', zone: 'skirt', minY: bounds.minY, maxY: bounds.maxY });
      continue;
    }
    // A berthe lies on the bodice along its neckline; sleeve frills go round the sleeve hems (drawn from those).
    if (trimName.startsWith('berthe')) {
      berthe[trimName.includes('dos') ? 'back' : 'front'] = { piece, polygon: openPolygon(outline), role: 'trim', zone: 'plastron', minY: bounds.minY, maxY: bounds.maxY };
      continue;
    }
    if (trimName.startsWith('volant de manche')) {
      frills.push({ piece, polygon, role: 'trim', zone: 'plastron', minY: bounds.minY, maxY: bounds.maxY });
      continue;
    }
    // Side hoops and a bustle pad: listed as inside pieces, but they push the skirt out (one structure per kind).
    const underKind = understructureKindOf(trimName);
    if (underKind && !understructure.some((u) => u.kind === underKind)) {
      understructure.push({ kind: underKind, widthMm: bounds.width, depthMm: bounds.height });
    }
    // Facings, pocket bags and boning channels are sewn inside: part of the pattern, never seen on the mannequin.
    // So are a fly's pieces, pocket facings and welts, a drawstring and a turn-up band (the bottoms' construction).
    if (INSIDE_NAMES.some((n) => trimName.includes(n))) {
      inside.push(piece.name);
      detailPieces.push({ id: piece.id, name: piece.name });
      continue;
    }
    // Construction pieces (pattern-engine `shared/construction.ts`): draped over the garment, or laid on its cloth
    // where the engine's detail areas put them.
    const constructionRole = constructionRoleOf(piece.name);
    if (constructionRole === 'procedural') {
      construction.push({ id: piece.id, name: piece.name, quantity: piece.quantity, polygon: openPolygon(outline), fabricRecommendation: piece.fabricRecommendation ?? null });
      continue;
    }
    if (constructionRole === 'applied') {
      detailPieces.push({ id: piece.id, name: piece.name });
      continue;
    }
    if (TRIM_NAMES.some((t) => trimName.includes(t))) {
      trims.push({ piece, polygon, role: 'trim', zone: 'plastron', minY: bounds.minY, maxY: bounds.maxY });
      continue;
    }
    if (collarKindOf(piece.name)) {
      collars.push({ piece, polygon, role: 'collar', zone: 'collar', minY: bounds.minY, maxY: bounds.maxY });
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
        toPiece: { ids: [piece.id], map: (x, y) => [0, x + bounds.minX, y] },
        role: 'front',
        zone: 'torso',
        minY: bounds.minY,
        maxY: bounds.maxY,
        fold: 0.5,
      });
      continue;
    }
    // A crossover front reaches past the centre front (x < 0): its crossing edge runs from the
    // centre-front neck point to the piece's furthest point across.
    const across = polygon.reduce((m, p) => (p.x < m.x ? p : m), polygon[0]!);
    const neck = polygon.filter((p) => p.x === 0).reduce((m, p) => (p.y < m.y ? p : m), { x: 0, y: Infinity });
    const crossLine = across.x < -1 && Number.isFinite(neck.y) ? [neck, across] : undefined;
    // A front cut off the fold (robe-manteau) opens over a plastron from its centre-front neck point down.
    // The opening's edge is the run of points near the piece's smallest x (it may widen towards the neck, as under a
    // band collar): its highest point is where the opening starts.
    const opensAtFlatY =
      role.role === 'front' && (normalize(piece.name).includes('manteau') || normalize(piece.name).includes('gilet'))
        ? polygon
            .filter((p) => p.y <= bounds.minY + (bounds.maxY - bounds.minY) * 0.4 && p.x <= bounds.minX + OPENING_EDGE_MM)
            .reduce((m, p) => (p.y < m.y ? p : m), { x: 0, y: Infinity }).y
        : undefined;
    // A corset's bones show as lines down the bodice (stitched channels).
    const bones = boneLinesOf(piece);
    // Skirt gores gathered onto the waist (« lé froncé », a ball gown's organ pleats): their top is wider than the
    // waist seam, drawn in to it there like a gathered block.
    const gathered = role.zone === 'skirt' && trimName.includes('fronc');
    classified.push({
      piece,
      polygon,
      role: role.role,
      zone: role.zone,
      minY: bounds.minY,
      maxY: bounds.maxY,
      ...(gathered ? { gathered } : {}),
      ...(bones.length > 0 ? { seamLines: bones } : {}),
      ...(crossLine ? { crossLine } : {}),
      ...(opensAtFlatY !== undefined && Number.isFinite(opensAtFlatY) ? { opensAtFlatY } : {}),
    });
  }

  joinPieces(classified);
  dipBlockSkirtUnderPoint(classified);

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
    // Trousers and skirts cut above (taille haute) or below (taille basse) the waist: their top edge sits that far
    // from it (the engine draws the natural waist line inside the piece).
    const waistLine = front ? waistLineOf(front) : null;
    const topY =
      zone === 'skirt' || zone === 'legs'
        ? landmarks.waistY + (waistLine !== null && front ? (waistLine - front.minY) / 1000 : 0)
        : generic && genericTopY !== null
          ? genericTopY
          : landmarks.napeY;
    const shortBodice =
      zone === 'bodice' && front !== undefined && (front.maxY - front.minY) / 1000 < SHORT_BODICE_RATIO * (landmarks.napeY - landmarks.waistY);
    zones.push({
      zone,
      topY,
      front,
      back,
      ...(shortBodice ? { hanging: true } : {}),
      ...(fabricBehavior === 'STRUCTURE' || fabricBehavior === 'RIGIDE' ? { structured: true } : {}),
      ...(zone === 'skirt' && petticoats[0] ? { petticoat: petticoats[0] } : {}),
    });
    // Under a bodice that runs on below the waist (taille basse), the skirt starts that much lower.
    if (zone === 'skirt') {
      const bodiceGroup = zones.find((z) => z.zone === 'bodice');
      const bodice = bodiceGroup?.front;
      const drop = bodice && !bodiceGroup?.hanging ? basqueDepthOf(bodice) / 1000 : 0;
      if (drop > 0.005) zones[zones.length - 1]!.topY = topY - drop;
      // Hoops or a bustle pad under the skirt, sized against the body round the skirt's seam.
      if (understructure.length > 0) {
        const seamBody = zones[zones.length - 1]!.topY < landmarks.waistY - 0.05 ? body.hip : body.waist;
        zones[zones.length - 1]!.understructure = understructure.map((u) => withHoopScale(u, front, back, seamBody));
      }
    }
    pieceIds[zone] = inZone.flatMap(pieceIdsOf);
    for (const role of ['front', 'back'] as const) pieceIds[`${zone}-${role}`] = inZone.filter((c) => c.role === role).flatMap(pieceIdsOf);
  }
  const petticoat = zones.find((z) => z.zone === 'skirt')?.petticoat;
  if (petticoat) pieceIds['skirt-petticoat'] = [petticoat.piece.id];
  else for (const p of petticoats) ignored.push(p.piece.name);
  const train = zones.find((z) => z.zone === 'skirt')?.back ? trains[0] : undefined;
  if (train) pieceIds['skirt-train'] = [train.piece.id];
  for (const t of trains) if (t !== train) ignored.push(t.piece.name);
  const layout: GarmentLayout = {
    zones,
    sleeves: classified.filter((c) => c.role === 'sleeve'),
    collars,
    trims,
    pieceIds,
    ...(petticoat ? { petticoat } : {}),
    ...(train ? { train } : {}),
    ...(berthe.front || berthe.back ? { berthe } : {}),
    ...(frills.length > 0 ? { frills: [...frills].sort((a, b) => normalize(a.piece.name).localeCompare(normalize(b.piece.name))) } : {}),
    ...(trimSpecs && trimSpecs.length > 0 ? { trimSpecs } : {}),
    ...(detailPieces.length > 0 ? { detailPieces } : {}),
    ...(construction.length > 0 ? { construction } : {}),
    ...(understructure.length > 0 ? { understructure } : {}),
  };

  const env = proceduralEnvelope(body, rings);

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

  // Draped on the procedural mannequin on first read only: the viewer drapes the layout on the human body
  // itself, and skipping this keeps live modelling cheap.
  let panels: PanelMeshData[] | null = null;
  const model: GarmentModel = {
    body,
    torsoRings: rings,
    get panels() {
      panels ??= drapeGarment(layout, body, env);
      return panels;
    },
    layout,
    fit,
    ignored,
    inside,
    generic,
    templateId: getBodyTemplate(templateId).id,
  };
  return { ok: true, model };
};

/**
 * The body for these measurements, the same object as long as they do not change: while the pattern is edited
 * the viewer keeps its fitted human body (and its costly subdivided mesh) instead of rebuilding it each time.
 */
let lastBody: { key: string; body: BodyMeasurements; rings: BodyRing[] } | null = null;
const bodyFor = (
  measurements: Record<string, number> | null | undefined,
  templateId: string | null | undefined,
): { body: BodyMeasurements; rings: BodyRing[] } => {
  const key = JSON.stringify([measurements ?? null, templateId ?? null]);
  if (lastBody?.key !== key) {
    const body = readBodyMeasurements(measurements, templateId);
    lastBody = { key, body, rings: buildTorsoRings(body) };
  }
  return lastBody;
};
