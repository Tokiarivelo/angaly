import {
  SKIRT_DRAPE_KINDS,
  validatePatternExtParameters,
  type DrapeBlock,
  type DrapeBlockKind,
  type DrapeSpec,
} from '@angaly/types';

/** Sensible starting values when a customer switches a block on (all inside the validated bounds). */
export const DEFAULT_DRAPE_BLOCKS: { [K in DrapeBlockKind]: Extract<DrapeBlock, { kind: K }> } = {
  GATHERED_SKIRT: { kind: 'GATHERED_SKIRT', fullness: 2 },
  PLEATED_SKIRT: { kind: 'PLEATED_SKIRT', pleats: 24, depthMm: 25, type: 'KNIFE' },
  CIRCLE_SKIRT: { kind: 'CIRCLE_SKIRT', fraction: 0.5 },
  WRAP_FRONT: { kind: 'WRAP_FRONT', overlapMm: 100, side: 'LEFT' },
  COWL_NECK: { kind: 'COWL_NECK', depthMm: 150 },
  TRAIN: { kind: 'TRAIN', lengthMm: 600 },
  OVERSKIRT: { kind: 'OVERSKIRT', lengthPct: 80, side: 'LEFT' },
  DRAPED_BODICE: { kind: 'DRAPED_BODICE', pleats: 6, side: 'LEFT' },
  ASYMMETRIC_HEM: { kind: 'ASYMMETRIC_HEM', dropMm: 200, side: 'LEFT' },
};

export function findDrapeBlock<K extends DrapeBlockKind>(
  spec: DrapeSpec | undefined,
  kind: K,
): Extract<DrapeBlock, { kind: K }> | undefined {
  return spec?.blocks.find((b): b is Extract<DrapeBlock, { kind: K }> => b.kind === kind);
}

/**
 * Switches a block on (with its defaults) or off. A skirt block replaces any other skirt block.
 * Always returns a valid spec; an empty list means "no drape blocks" on purpose.
 */
export function toggleDrapeBlock(spec: DrapeSpec | undefined, kind: DrapeBlockKind): DrapeSpec {
  const blocks = spec?.blocks ?? [];
  if (blocks.some((b) => b.kind === kind)) {
    return { blocks: blocks.filter((b) => b.kind !== kind) };
  }
  const isSkirt = SKIRT_DRAPE_KINDS.includes(kind);
  const kept = isSkirt ? blocks.filter((b) => !SKIRT_DRAPE_KINDS.includes(b.kind)) : blocks;
  return { blocks: [...kept, DEFAULT_DRAPE_BLOCKS[kind]] };
}

/**
 * Changes one parameter of an enabled block. The result is re-validated: an out-of-range value keeps the
 * previous block, so the UI can never save something the API would reject.
 */
export function updateDrapeBlock(
  spec: DrapeSpec | undefined,
  kind: DrapeBlockKind,
  patch: Record<string, number | string>,
): DrapeSpec {
  const current = spec ?? { blocks: [] };
  const next = current.blocks.map((b) => (b.kind === kind ? ({ ...b, ...patch } as DrapeBlock) : b));
  const { value, issues } = validatePatternExtParameters({ drape: { blocks: next } });
  return issues.length > 0 || !value.drape ? current : value.drape;
}
