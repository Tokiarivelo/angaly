import type { DrapeBlock, PatternParameters, PatternPieceGeometry } from '../types';
import { computeCircleSkirt, computeGatheredSkirt, computePleatedSkirt } from './skirt-blocks';
import { applyWrapFront, computeCowlNeck } from './wrap-and-cowl';

export * from './skirt-blocks';
export * from './wrap-and-cowl';

type SkirtBlock = Extract<DrapeBlock, { kind: 'GATHERED_SKIRT' | 'PLEATED_SKIRT' | 'CIRCLE_SKIRT' }>;
type WrapBlock = Extract<DrapeBlock, { kind: 'WRAP_FRONT' }>;
type CowlBlock = Extract<DrapeBlock, { kind: 'COWL_NECK' }>;

export interface ResolvedDrape {
  skirt?: SkirtBlock;
  wrap?: WrapBlock;
  cowl?: CowlBlock;
}

/** First block of each family wins (validation upstream already allows at most one of each). */
export function resolveDrape(parameters: Pick<PatternParameters, 'drape'>): ResolvedDrape {
  const resolved: ResolvedDrape = {};
  for (const block of parameters.drape?.blocks ?? []) {
    if (block.kind === 'WRAP_FRONT') resolved.wrap ??= block;
    else if (block.kind === 'COWL_NECK') resolved.cowl ??= block;
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
