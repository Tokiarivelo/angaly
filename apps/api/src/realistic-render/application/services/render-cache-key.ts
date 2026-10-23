import { createHash } from 'node:crypto';

import type { RenderSource } from '../../domain/repositories/render-source.reader';
import type { RealisticRenderPose } from '../../domain/value-objects/realistic-render-status.vo';

/** JSON with object keys sorted at every level: the same content always gives the same text. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/**
 * Cache key of a render: hash of what the simulation reads (pieces, measurements, pose, fabric) and of the simulator
 * revision. Piece ids and the version id are left out: a regenerated version with the same pieces reuses the render.
 */
export function renderCacheKey(
  source: RenderSource,
  pose: RealisticRenderPose,
  simulatorRevision: string,
): string {
  const pieces = source.pieces
    .map((piece) => ({
      name: piece.name,
      dimensions: piece.dimensionsJson,
      quantity: piece.quantity,
      grainline: piece.grainlineJson,
      seamAllowanceCm: piece.seamAllowanceCm,
      notches: piece.notchesJson,
    }))
    .map((piece) => ({ piece, text: canonicalJson(piece) }))
    .sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0))
    .map(({ piece }) => piece);

  const payload = canonicalJson({
    revision: simulatorRevision,
    garmentType: source.garmentType,
    pose,
    measurements: source.measurements,
    fabricBehavior: source.fabricBehavior,
    fit: source.fit,
    pieces,
  });
  return createHash('sha256').update(payload).digest('hex');
}
