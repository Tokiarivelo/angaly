import type { PatternPieceDto, Trim } from '@angaly/types';
import { buildGarmentModel, type GarmentModelResult } from './garment-model';

/**
 * Draping a garment takes ~100 ms: the 3D view and the inspiration photo's overlay ask for the same one, and every
 * return to the 3D tab asked again. The last few results are kept, per pieces array (the draft's edits make a new one)
 * and per the other inputs.
 */
export const MODEL_CACHE_SIZE = 4;

const byPieces = new WeakMap<PatternPieceDto[], Map<string, GarmentModelResult>>();
const recent: Array<{ pieces: PatternPieceDto[]; key: string }> = [];
/** Trims arrays are compared by identity too (the page memoises them). */
const trimIds = new WeakMap<Trim[], number>();
let nextTrimId = 1;

const keyOf = (
  garmentType: string,
  measurements: Record<string, number> | null | undefined,
  templateId: string | null | undefined,
  fabricBehavior: string | null | undefined,
  trims: Trim[] | null | undefined,
): string => {
  let trimKey = 0;
  if (trims) {
    trimKey = trimIds.get(trims) ?? nextTrimId++;
    trimIds.set(trims, trimKey);
  }
  const m = measurements ? Object.keys(measurements).sort().map((k) => `${k}=${measurements[k]}`).join(',') : '';
  return `${garmentType}|${m}|${templateId ?? ''}|${fabricBehavior ?? ''}|${trimKey}`;
};

/** `buildGarmentModel`, remembered for the last MODEL_CACHE_SIZE inputs. */
export const buildGarmentModelCached = (
  pieces: PatternPieceDto[],
  garmentType: string,
  measurements: Record<string, number> | null | undefined,
  templateId?: string | null,
  fabricBehavior?: string | null,
  trims?: Trim[] | null,
): GarmentModelResult => {
  const key = keyOf(garmentType, measurements, templateId, fabricBehavior, trims);
  let entries = byPieces.get(pieces);
  const hit = entries?.get(key);
  if (hit) return hit;
  const result = buildGarmentModel(pieces, garmentType, measurements, templateId, fabricBehavior, trims);
  if (!entries) byPieces.set(pieces, (entries = new Map<string, GarmentModelResult>()));
  entries.set(key, result);
  recent.push({ pieces, key });
  while (recent.length > MODEL_CACHE_SIZE) {
    const old = recent.shift()!;
    byPieces.get(old.pieces)?.delete(old.key);
  }
  return result;
};
