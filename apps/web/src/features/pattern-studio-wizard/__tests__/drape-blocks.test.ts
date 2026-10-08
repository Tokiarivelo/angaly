import { describe, expect, it } from 'vitest';
import { DRAPE_BLOCK_KINDS, validatePatternExtParameters, type DrapeSpec } from '@angaly/types';
import { DEFAULT_DRAPE_BLOCKS, findDrapeBlock, toggleDrapeBlock, updateDrapeBlock } from '../utils/drape-blocks';
import { applyFitChange, suggestedFitFrom, buildFitRows } from '../utils/fit-parameters';
import type { GarmentProfile } from '@angaly/types';

describe('drape defaults', () => {
  it('every default is a valid block', () => {
    for (const kind of DRAPE_BLOCK_KINDS) {
      const { issues, value } = validatePatternExtParameters({ drape: { blocks: [DEFAULT_DRAPE_BLOCKS[kind]] } });
      expect(issues, kind).toEqual([]);
      expect(value.drape?.blocks[0]).toEqual(DEFAULT_DRAPE_BLOCKS[kind]);
    }
  });
});

describe('toggleDrapeBlock', () => {
  it('switches a block on with its defaults, and off again (leaving an explicit empty list)', () => {
    const on = toggleDrapeBlock(undefined, 'TRAIN');
    expect(on.blocks).toEqual([DEFAULT_DRAPE_BLOCKS.TRAIN]);
    expect(toggleDrapeBlock(on, 'TRAIN')).toEqual({ blocks: [] });
  });

  it('a skirt block replaces another skirt block but keeps the other families', () => {
    let spec: DrapeSpec = toggleDrapeBlock(undefined, 'GATHERED_SKIRT');
    spec = toggleDrapeBlock(spec, 'TRAIN');
    spec = toggleDrapeBlock(spec, 'CIRCLE_SKIRT');
    expect(spec.blocks.map((b) => b.kind)).toEqual(['TRAIN', 'CIRCLE_SKIRT']);
  });
});

describe('updateDrapeBlock', () => {
  it('changes one parameter and snaps it', () => {
    const spec = toggleDrapeBlock(undefined, 'GATHERED_SKIRT');
    expect(findDrapeBlock(updateDrapeBlock(spec, 'GATHERED_SKIRT', { fullness: 3.1 }), 'GATHERED_SKIRT')?.fullness).toBe(3);
  });

  it('keeps the previous block when the value would be rejected', () => {
    const spec = toggleDrapeBlock(undefined, 'TRAIN');
    expect(updateDrapeBlock(spec, 'TRAIN', { lengthMm: 99999 })).toEqual(spec);
    const pleats = toggleDrapeBlock(undefined, 'PLEATED_SKIRT');
    expect(updateDrapeBlock(pleats, 'PLEATED_SKIRT', { type: 'ACCORDION' })).toEqual(pleats);
  });

  it('does nothing for a block that is not enabled', () => {
    const spec = toggleDrapeBlock(undefined, 'TRAIN');
    expect(updateDrapeBlock(spec, 'COWL_NECK', { depthMm: 100 })).toEqual(spec);
  });
});

describe('applyFitChange — drape', () => {
  it('stores a spec, replaces it, clears it, and never mutates the input', () => {
    const spec = toggleDrapeBlock(undefined, 'COWL_NECK');
    const fit = applyFitChange({ ease: 'AMPLE' }, { field: 'drape', value: spec });
    expect(fit).toEqual({ ease: 'AMPLE', drape: spec });
    expect(applyFitChange(fit, { field: 'drape', value: null })).toEqual({ ease: 'AMPLE' });
    expect(applyFitChange(fit, { field: 'ease', value: 'AJUSTE' }).drape).toEqual(spec);
    expect(applyFitChange(undefined, { field: 'drape', value: { blocks: [] } })).toEqual({ drape: { blocks: [] } });
  });
});

describe('suggested drape from the photo', () => {
  const profile = (over: Partial<GarmentProfile>): GarmentProfile =>
    ({ isGarment: true, garmentType: 'ROBE', occasion: null, style: null, cutType: null, details: {}, ...over }) as GarmentProfile;

  it('uses the validated blocks, drops invalid ones, and ignores a free drape', () => {
    expect(
      suggestedFitFrom(profile({ drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }, { kind: 'TRAIN', lengthMm: 99999 }] }))?.drape?.blocks,
    ).toEqual([{ kind: 'TRAIN', lengthMm: 900 }]);
    expect(suggestedFitFrom(profile({ constructionMethod: 'DRAPING', drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }] }))).toBeUndefined();
    expect(suggestedFitFrom(profile({ isGarment: false, drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }] }))).toBeUndefined();
  });

  it('lists the suggested blocks on the garment sheet', () => {
    const rows = buildFitRows(profile({ drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }, { kind: 'COWL_NECK', depthMm: 120 }] }));
    expect(rows).toContainEqual({ label: 'Drapé suggéré', value: 'Traîne, Col bénitier' });
  });
});
