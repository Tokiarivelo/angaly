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

export function buildSkirtBlock(
  block: SkirtBlock,
  waistMm: number,
  lengthMm: number,
  fabricRecommendation: string | null = null,
): PatternPieceGeometry[] {
  const input = { waistMm, lengthMm, fabricRecommendation };
  switch (block.kind) {
    case 'GATHERED_SKIRT':
      return computeGatheredSkirt({ ...input, fullness: block.fullness });
    case 'PLEATED_SKIRT':
      return computePleatedSkirt({ ...input, pleats: block.pleats, depthMm: block.depthMm, type: block.type });
    case 'CIRCLE_SKIRT':
      return computeCircleSkirt({ ...input, fraction: block.fraction });
  }
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
