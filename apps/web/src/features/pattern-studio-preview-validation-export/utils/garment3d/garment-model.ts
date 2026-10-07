import type { PatternPieceDto } from '@angaly/types';
import { getBounds, openPolygon, polygonAreaCm2, type Point } from '../pattern-geometry';
import {
  bodyLandmarks,
  buildTorsoRings,
  ellipseCircumference,
  ellipseSemiAxes,
  readBodyMeasurements,
  ringAt,
  type BodyMeasurements,
  type BodyRing,
} from './body-model';

export type PanelRole = 'front' | 'back' | 'sleeve';
export type GarmentZone = 'bodice' | 'skirt' | 'torso';

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

export interface GarmentModel {
  body: BodyMeasurements;
  torsoRings: BodyRing[];
  panels: PanelMeshData[];
  fit: FitLine[];
  /** Pieces that were not placed on the mannequin (collars, belts, trains…). */
  ignored: string[];
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
}

const normalize = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const TORSO_GARMENTS = new Set(['CHEMISE', 'VESTE', 'COSTUME']);

export const classifyPiece = (
  name: string,
  garmentType: string,
): { role: PanelRole; zone: GarmentZone | 'sleeve' } | null => {
  const n = normalize(name);
  if (n.includes('manche')) return { role: 'sleeve', zone: 'sleeve' };

  const role: PanelRole | null = n.includes('devant') ? 'front' : n.includes('dos') ? 'back' : null;
  if (!role) return null;

  if (n.includes('corsage') || n.includes('buste') || n.includes('haut')) return { role, zone: 'bodice' };
  if (n.includes('jupe')) return { role, zone: 'skirt' };
  if (garmentType === 'JUPE') return { role, zone: 'skirt' };
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

const ROWS = 28;
const COLUMNS = 14;
const FLAT_EPSILON = 0.5;
const STATUS_THRESHOLDS = { tight: 0, fitted: 4, comfortable: 10 };

export const fitStatus = (easeCm: number): FitStatus => {
  if (easeCm < STATUS_THRESHOLDS.tight) return 'tight';
  if (easeCm < STATUS_THRESHOLDS.fitted) return 'fitted';
  if (easeCm < STATUS_THRESHOLDS.comfortable) return 'comfortable';
  return 'loose';
};

interface ZoneGroup {
  zone: GarmentZone;
  topY: number;
  front?: Classified | undefined;
  back?: Classified | undefined;
}

const foldFactor = (c: Classified): number => (c.piece.quantity === 1 ? 2 : c.piece.quantity);

const halfWidthAt = (c: Classified, flatY: number): number => {
  const y = Math.min(c.maxY - FLAT_EPSILON, Math.max(c.minY + FLAT_EPSILON, flatY));
  const extent = rowExtent(c.polygon, y);
  return extent ? extent[1] : 0;
};

/** Total garment circumference (m) at a flat-y position of a zone, summing front and back panels. */
const zoneCircumference = (group: ZoneGroup, flatY: number): { total: number; frontShare: number } => {
  const front = group.front ? (halfWidthAt(group.front, flatY) * foldFactor(group.front)) / 1000 : 0;
  const back = group.back ? (halfWidthAt(group.back, flatY) * foldFactor(group.back)) / 1000 : 0;
  // A missing half is assumed symmetrical so the ring stays closed.
  const f = front || back;
  const b = back || front;
  return { total: f + b, frontShare: f + b === 0 ? 0.5 : f / (f + b) };
};

const pickLargest = (items: Classified[]): Classified | undefined =>
  [...items].sort((a, b) => polygonAreaCm2(b.polygon) - polygonAreaCm2(a.polygon))[0];

const buildHalfStrips = (
  group: ZoneGroup,
  panel: Classified,
  rings: BodyRing[],
): { positions: number[]; indices: number[]; border: number[] } => {
  const role = panel.role;
  const positions: number[] = [];
  const indices: number[] = [];
  const border: number[] = [];

  const rows: Array<{ y: number; x0: number; x1: number; a: number; b: number; half: number }> = [];
  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const extent = rowExtent(panel.polygon, flatY) ?? [0, 0];
    const worldY = group.topY - flatY / 1000;
    const { total, frontShare } = zoneCircumference(group, flatY);
    const bodyRing = ringAt(rings, worldY);
    const bodyC = ellipseCircumference(bodyRing.a, bodyRing.b);
    // Visual guard only: a garment narrower than the body would be hidden inside it.
    const circumference = Math.max(total, bodyC * 1.012);
    const { a, b } = ellipseSemiAxes(circumference, bodyRing.b / bodyRing.a);
    const half = role === 'front' ? Math.PI * frontShare : Math.PI * (1 - frontShare);
    rows.push({ y: worldY, x0: Math.max(0, extent[0]), x1: Math.max(extent[1], 1e-6), a, b, half });
  }

  for (const side of [1, -1]) {
    const base = positions.length / 3;
    for (const row of rows) {
      for (let j = 0; j <= COLUMNS; j += 1) {
        const x = row.x0 + ((row.x1 - row.x0) * j) / COLUMNS;
        const u = x / row.x1;
        const phi =
          role === 'front' ? side * u * row.half : Math.PI - side * u * row.half;
        positions.push(row.a * Math.sin(phi), row.y, row.b * Math.cos(phi));
      }
    }
    for (let i = 0; i < ROWS; i += 1) {
      for (let j = 0; j < COLUMNS; j += 1) {
        const p = base + i * (COLUMNS + 1) + j;
        const q = p + COLUMNS + 1;
        indices.push(p, q, p + 1, p + 1, q, q + 1);
      }
    }
    // Border: inner edge down, bottom across, outer edge up (closed back to the first point).
    const at = (i: number, j: number): number => (base + i * (COLUMNS + 1) + j) * 3;
    const loop: number[] = [];
    for (let i = 0; i <= ROWS; i += 1) loop.push(at(i, 0));
    for (let j = 1; j <= COLUMNS; j += 1) loop.push(at(ROWS, j));
    for (let i = ROWS - 1; i >= 0; i -= 1) loop.push(at(i, COLUMNS));
    for (let j = COLUMNS - 1; j >= 0; j -= 1) loop.push(at(0, j));
    for (let k = 0; k < loop.length; k += 1) {
      const from = loop[k]!;
      const to = loop[(k + 1) % loop.length]!;
      border.push(
        positions[from]!, positions[from + 1]!, positions[from + 2]!,
        positions[to]!, positions[to + 1]!, positions[to + 2]!,
      );
    }
  }

  return { positions, indices, border };
};

/** Arm/sleeve axis tilt away from vertical, shared with the mannequin arms. */
export const SLEEVE_TILT = (16 * Math.PI) / 180;
const SLEEVE_RADIAL = 20;

const buildSleeve = (
  panel: Classified,
  side: 1 | -1,
  body: BodyMeasurements,
  rings: BodyRing[],
): { positions: number[]; indices: number[]; border: number[] } => {
  const landmarks = bodyLandmarks(body);
  const shoulderRing = ringAt(rings, landmarks.shoulderY);
  const start = { x: side * (shoulderRing.a + 0.012), y: landmarks.shoulderY - 0.01, z: 0 };
  const dir = { x: side * Math.sin(SLEEVE_TILT), y: -Math.cos(SLEEVE_TILT), z: 0 };
  // Basis of the plane perpendicular to the arm axis.
  const u1 = { x: 0, y: 0, z: 1 };
  const u2 = { x: dir.y * u1.z - dir.z * u1.y, y: dir.z * u1.x - dir.x * u1.z, z: dir.x * u1.y - dir.y * u1.x };

  const positions: number[] = [];
  const indices: number[] = [];
  const ringStarts: number[] = [];

  for (let i = 0; i <= ROWS; i += 1) {
    const flatY = panel.minY + FLAT_EPSILON + ((panel.maxY - panel.minY - 2 * FLAT_EPSILON) * i) / ROWS;
    const extent = rowExtent(panel.polygon, flatY) ?? [0, 0];
    // The flat sleeve is one piece: its width at this height is the tube circumference.
    const radius = Math.max(extent[1] - extent[0], 0) / 1000 / (2 * Math.PI);
    const along = ((flatY - panel.minY) / 1000) * 0.95;
    const cx = start.x + dir.x * along;
    const cy = start.y + dir.y * along;
    const cz = start.z + dir.z * along;
    ringStarts.push(positions.length / 3);
    for (let j = 0; j < SLEEVE_RADIAL; j += 1) {
      const t = (j / SLEEVE_RADIAL) * Math.PI * 2;
      positions.push(
        cx + radius * (Math.cos(t) * u1.x + Math.sin(t) * u2.x),
        cy + radius * (Math.cos(t) * u1.y + Math.sin(t) * u2.y),
        cz + radius * (Math.cos(t) * u1.z + Math.sin(t) * u2.z),
      );
    }
  }

  for (let i = 0; i < ROWS; i += 1) {
    for (let j = 0; j < SLEEVE_RADIAL; j += 1) {
      const next = (j + 1) % SLEEVE_RADIAL;
      const a = ringStarts[i]! + j;
      const b = ringStarts[i]! + next;
      const c = ringStarts[i + 1]! + j;
      const d = ringStarts[i + 1]! + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Seam lines: cuff ring and the underarm seam.
  const border: number[] = [];
  const cuff = ringStarts[ROWS]!;
  for (let j = 0; j < SLEEVE_RADIAL; j += 1) {
    const from = (cuff + j) * 3;
    const to = (cuff + ((j + 1) % SLEEVE_RADIAL)) * 3;
    border.push(positions[from]!, positions[from + 1]!, positions[from + 2]!, positions[to]!, positions[to + 1]!, positions[to + 2]!);
  }
  for (let i = 0; i < ROWS; i += 1) {
    const from = ringStarts[i]! * 3;
    const to = ringStarts[i + 1]! * 3;
    border.push(positions[from]!, positions[from + 1]!, positions[from + 2]!, positions[to]!, positions[to + 1]!, positions[to + 2]!);
  }
  return { positions, indices, border };
};

/**
 * Turns the generated pattern pieces into 3D panels wrapped around a mannequin that has the customer's
 * measurements. The panels are lofted from the REAL piece widths (front + back = circumference at each
 * height), so ease, flare and length seen in 3D are the pattern's own — not a decorative guess.
 */
export const buildGarmentModel = (
  pieces: PatternPieceDto[],
  garmentType: string,
  measurements: Record<string, number> | null | undefined,
): GarmentModelResult => {
  const body = readBodyMeasurements(measurements);
  const landmarks = bodyLandmarks(body);
  const rings = buildTorsoRings(body);

  const classified: Classified[] = [];
  const ignored: string[] = [];
  for (const piece of pieces) {
    const outline = (piece.dimensionsJson as { outlineMm?: Point[] } | null)?.outlineMm;
    const role = classifyPiece(piece.name, garmentType);
    if (!role || !outline || outline.length < 3) {
      ignored.push(piece.name);
      continue;
    }
    const polygon = openPolygon(outline);
    const bounds = getBounds(polygon);
    if (bounds.height <= 1 || bounds.width <= 1) {
      ignored.push(piece.name);
      continue;
    }
    classified.push({ piece, polygon, role: role.role, zone: role.zone, minY: bounds.minY, maxY: bounds.maxY });
  }

  const bodyPanels = classified.filter((c) => c.role !== 'sleeve');
  if (bodyPanels.length === 0) {
    return {
      ok: false,
      reason:
        'La prévisualisation 3D est disponible pour les robes, jupes, chemises, vestes et costumes. ' +
        'Ce vêtement n’a pas de pièces devant/dos reconnaissables.',
    };
  }

  const zones: ZoneGroup[] = [];
  for (const zone of ['bodice', 'torso', 'skirt'] as const) {
    const inZone = classified.filter((c) => c.zone === zone);
    const front = pickLargest(inZone.filter((c) => c.role === 'front'));
    const back = pickLargest(inZone.filter((c) => c.role === 'back'));
    if (!front && !back) continue;
    zones.push({ zone, topY: zone === 'skirt' ? landmarks.waistY : landmarks.napeY, front, back });
  }

  const panels: PanelMeshData[] = [];
  for (const group of zones) {
    for (const panel of [group.front, group.back]) {
      if (!panel) continue;
      const mesh = buildHalfStrips(group, panel, rings);
      panels.push({
        id: `${group.zone}-${panel.role}`,
        label: panel.piece.name,
        role: panel.role,
        zone: group.zone,
        pieceIds: classified.filter((c) => c.zone === group.zone && c.role === panel.role).map((c) => c.piece.id),
        positions: Float32Array.from(mesh.positions),
        indices: Uint32Array.from(mesh.indices),
        border: Float32Array.from(mesh.border),
        explode: { x: 0, y: group.zone === 'skirt' ? -0.6 : 0, z: panel.role === 'front' ? 1 : -1 },
      });
    }
  }

  for (const sleeve of classified.filter((c) => c.role === 'sleeve')) {
    for (const side of [1, -1] as const) {
      const mesh = buildSleeve(sleeve, side, body, rings);
      panels.push({
        id: `sleeve-${sleeve.piece.id}-${side}`,
        label: sleeve.piece.name,
        role: 'sleeve',
        zone: 'sleeve',
        pieceIds: [sleeve.piece.id],
        positions: Float32Array.from(mesh.positions),
        indices: Uint32Array.from(mesh.indices),
        border: Float32Array.from(mesh.border),
        explode: { x: side, y: 0, z: 0 },
      });
    }
  }

  const circumferenceCmAt = (worldY: number, zoneNames: GarmentZone[]): number | null => {
    for (const group of zones) {
      if (!zoneNames.includes(group.zone)) continue;
      const ref = group.front ?? group.back;
      if (!ref) continue;
      const flatY = (group.topY - worldY) * 1000;
      if (flatY < ref.minY || flatY > ref.maxY) continue;
      return zoneCircumference(group, flatY).total * 100;
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
    ['Taille', landmarks.waistY - 0.005, ['bodice', 'torso', 'skirt']],
    ['Bassin', landmarks.hipY, ['skirt', 'torso']],
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

  return { ok: true, model: { body, torsoRings: rings, panels, fit, ignored } };
};
