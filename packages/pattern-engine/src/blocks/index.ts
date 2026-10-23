import type { DrapeBlock, PatternParameters, PatternPieceGeometry } from '../types';
import { computeCircleSkirt, computeGatheredSkirt, computePleatedSkirt } from './skirt-blocks';
import { applyWrapFront, computeCowlNeck } from './wrap-and-cowl';
import { applyAsymmetricHem, applyDrapedBodice, computeOverskirt, computeTrain } from './advanced-blocks';

export * from './skirt-blocks';
export * from './wrap-and-cowl';
export * from './advanced-blocks';

type SkirtBlock = Extract<DrapeBlock, { kind: 'GATHERED_SKIRT' | 'PLEATED_SKIRT' | 'CIRCLE_SKIRT' }>;
type WrapBlock = Extract<DrapeBlock, { kind: 'WRAP_FRONT' }>;
type CowlBlock = Extract<DrapeBlock, { kind: 'COWL_NECK' }>;
type TrainBlock = Extract<DrapeBlock, { kind: 'TRAIN' }>;
type OverskirtBlock = Extract<DrapeBlock, { kind: 'OVERSKIRT' }>;
type BodiceBlock = Extract<DrapeBlock, { kind: 'DRAPED_BODICE' }>;
type HemBlock = Extract<DrapeBlock, { kind: 'ASYMMETRIC_HEM' }>;

export interface ResolvedDrape {
  skirt?: SkirtBlock;
  wrap?: WrapBlock;
  cowl?: CowlBlock;
  train?: TrainBlock;
  overskirt?: OverskirtBlock;
  bodice?: BodiceBlock;
  hem?: HemBlock;
}

/** First block of each family wins (validation upstream already allows at most one of each). */
export function resolveDrape(parameters: Pick<PatternParameters, 'drape'>): ResolvedDrape {
  const resolved: ResolvedDrape = {};
  for (const block of parameters.drape?.blocks ?? []) {
    if (block.kind === 'WRAP_FRONT') resolved.wrap ??= block;
    else if (block.kind === 'COWL_NECK') resolved.cowl ??= block;
    else if (block.kind === 'TRAIN') resolved.train ??= block;
    else if (block.kind === 'OVERSKIRT') resolved.overskirt ??= block;
    else if (block.kind === 'DRAPED_BODICE') resolved.bodice ??= block;
    else if (block.kind === 'ASYMMETRIC_HEM') resolved.hem ??= block;
    else resolved.skirt ??= block;
  }
  return resolved;
}

/** How much narrower a gathered panel is at the seam than at the hem, per cut (0 = straight rectangle). */
export const CUT_HEM_SPREAD: Record<string, number> = { EVASEE: 0.25, PRINCESSE: 0.35 };

export function buildSkirtBlock(
  block: SkirtBlock,
  waistMm: number,
  lengthMm: number,
  fabricRecommendation: string | null = null,
  cutType: string | null = null,
): PatternPieceGeometry[] {
  const input = { waistMm, lengthMm, fabricRecommendation };
  switch (block.kind) {
    case 'GATHERED_SKIRT':
      return computeGatheredSkirt({
        ...input,
        fullness: block.fullness,
        hemSpread: CUT_HEM_SPREAD[(cutType ?? '').toUpperCase()] ?? 0,
      });
    case 'PLEATED_SKIRT':
      return computePleatedSkirt({ ...input, pleats: block.pleats, depthMm: block.depthMm, type: block.type });
    case 'CIRCLE_SKIRT':
      return computeCircleSkirt({ ...input, fraction: block.fraction });
  }
}

/**
 * Smallest hem ÷ waist ratio a cut implies once a gathered / pleated block stands in for the cut's own
 * flared panels (an EVASEE panel skirt measures about 2.8×, PRINCESSE more; these floors keep ~65 %; a measured fullness above them is kept).
 * Without it a gathered block of 1.5 on an A-line dress hangs as a straight sheath.
 */
export const CUT_MIN_HEM_RATIO: Record<string, number> = { EVASEE: 1.8, PRINCESSE: 2.2 };

const PLEAT_DEPTH_MAX_MM = 80;
const PLEATS_MAX = 60;
const GATHER_MAX = 4;

/**
 * Widens a gathered / pleated skirt block so its hem is at least the cut's ratio of the waist. Never narrows,
 * never touches a circle skirt (its flare is its geometry) and stays inside the validated block bounds.
 */
export function fitSkirtBlockToCut(block: SkirtBlock, waistMm: number, cutType: string | null | undefined): SkirtBlock {
  const ratio = CUT_MIN_HEM_RATIO[(cutType ?? '').toUpperCase()];
  if (!ratio) return block;
  if (block.kind === 'GATHERED_SKIRT') {
    return block.fullness >= ratio ? block : { ...block, fullness: Math.min(GATHER_MAX, ratio) };
  }
  if (block.kind === 'PLEATED_SKIRT') {
    const perPleat = block.type === 'BOX' ? 2 : 1;
    const needed = (ratio - 1) * waistMm;
    if (block.pleats * block.depthMm * perPleat >= needed) return block;
    const depthMm = Math.min(PLEAT_DEPTH_MAX_MM, Math.max(block.depthMm, Math.ceil(needed / (block.pleats * perPleat))));
    const pleats = Math.min(PLEATS_MAX, Math.max(block.pleats, Math.ceil(needed / (depthMm * perPleat))));
    return { ...block, depthMm, pleats };
  }
  return block;
}

/** Replaces the named front piece by its wrapped pair, in place of the original. */
export function wrapFrontPiece(
  pieces: PatternPieceGeometry[],
  frontName: string,
  wrap: WrapBlock,
): PatternPieceGeometry[] {
  return pieces.flatMap((piece) =>
    piece.name === frontName ? applyWrapFront(piece, wrap.overlapMm, wrap.side) : [piece],
  );
}

export { computeCowlNeck };

/** Replaces the named piece (and its wrap variants) by its draped-bodice version (pleat marks + extra fabric on the side seam). */
export function drapeBodicePiece(
  pieces: PatternPieceGeometry[],
  frontName: string,
  bodice: BodiceBlock,
): PatternPieceGeometry[] {
  return pieces.map((piece) =>
    piece.name === frontName || piece.name.startsWith(`${frontName} —`)
      ? applyDrapedBodice(piece, bodice.pleats, bodice.side)
      : piece,
  );
}

/** Applies the asymmetric hem to every piece whose name starts with one of `prefixes` (skirt panels). */
export function asymmetricHemPieces(
  pieces: PatternPieceGeometry[],
  prefixes: string[],
  hem: HemBlock,
): PatternPieceGeometry[] {
  return pieces.map((piece) =>
    !/cercle/i.test(piece.name) && // a circle sector's hem is an arc: not supported
    prefixes.some((prefix) => piece.name === prefix || piece.name.startsWith(`${prefix} `))
      ? applyAsymmetricHem(piece, hem.dropMm)
      : piece,
  );
}

export function buildTrainPiece(train: TrainBlock, attachWidthMm: number): PatternPieceGeometry {
  return computeTrain(attachWidthMm, train.lengthMm);
}

export function buildOverskirtPiece(
  overskirt: OverskirtBlock,
  waistMm: number,
  skirtLengthMm: number,
): PatternPieceGeometry {
  return computeOverskirt(waistMm, skirtLengthMm, overskirt.lengthPct, overskirt.side);
}
