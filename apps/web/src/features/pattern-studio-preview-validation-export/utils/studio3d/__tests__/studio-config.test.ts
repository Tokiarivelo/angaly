import { describe, expect, it } from 'vitest';
import {
  IDLE_GAP_MS,
  LIGHTING_PRESETS,
  QUALITY_TIERS,
  SLOW_FRAME_MS,
  SLOW_FRAME_WINDOW,
  TIER_ORDER,
  dprRange,
  nextTierOnSlowFrames,
  pickInitialTier,
  pushFrameTime,
} from '../studio-config';

const frames = (ms: number, n = SLOW_FRAME_WINDOW): number[] => Array.from({ length: n }, () => ms);

describe('QUALITY_TIERS', () => {
  it('gets cheaper from high to low', () => {
    const [high, medium, low] = TIER_ORDER.map((name) => QUALITY_TIERS[name]);
    expect(high).toMatchObject({ samples: 8, ao: true, shadowMap: 4096, maxDpr: 2 });
    expect(medium).toMatchObject({ samples: 4, ao: false, shadowMap: 2048, maxDpr: 1.5 });
    expect(low).toMatchObject({ samples: 0, ao: false, shadowMap: 1024, maxDpr: 1 });
    for (const name of TIER_ORDER) expect(QUALITY_TIERS[name].name).toBe(name);
  });
});

describe('pickInitialTier', () => {
  it('starts phones, small windows and low-memory devices in low', () => {
    expect(pickInitialTier({ coarsePointer: true, minSide: 1200 })).toBe('low');
    expect(pickInitialTier({ coarsePointer: false, minSide: 600 })).toBe('low');
    expect(pickInitialTier({ coarsePointer: false, minSide: 1000, deviceMemory: 2 })).toBe('low');
  });

  it('starts a 4 GB machine in medium and a desktop in high', () => {
    expect(pickInitialTier({ coarsePointer: false, minSide: 1000, deviceMemory: 4 })).toBe('medium');
    expect(pickInitialTier({ coarsePointer: false, minSide: 1000, deviceMemory: 8 })).toBe('high');
    expect(pickInitialTier({ coarsePointer: false, minSide: 1000 })).toBe('high');
  });
});

describe('nextTierOnSlowFrames', () => {
  it('keeps the tier until a full window was measured', () => {
    expect(nextTierOnSlowFrames('high', frames(50, SLOW_FRAME_WINDOW - 1))).toBe('high');
  });

  it('keeps the tier while frames are fast enough', () => {
    expect(nextTierOnSlowFrames('high', frames(SLOW_FRAME_MS))).toBe('high');
  });

  it('steps down one tier at a time on slow frames, never below low', () => {
    expect(nextTierOnSlowFrames('high', frames(40))).toBe('medium');
    expect(nextTierOnSlowFrames('medium', frames(40))).toBe('low');
    expect(nextTierOnSlowFrames('low', frames(40))).toBe('low');
  });

  it('looks only at the last window', () => {
    expect(nextTierOnSlowFrames('high', [...frames(200, 30), ...frames(10)])).toBe('high');
  });
});

describe('pushFrameTime', () => {
  it('drops idle gaps and invalid times', () => {
    expect(pushFrameTime([16], IDLE_GAP_MS + 1)).toEqual([16]);
    expect(pushFrameTime([16], 0)).toEqual([16]);
    expect(pushFrameTime([16], Number.NaN)).toEqual([16]);
    expect(pushFrameTime([16], 20)).toEqual([16, 20]);
  });

  it('keeps the last window only', () => {
    const times = pushFrameTime(frames(10), 30);
    expect(times).toHaveLength(SLOW_FRAME_WINDOW);
    expect(times.at(-1)).toBe(30);
  });
});

describe('LIGHTING_PRESETS', () => {
  it('describes complete setups', () => {
    for (const [name, preset] of Object.entries(LIGHTING_PRESETS)) {
      expect(preset.name).toBe(name);
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.key.intensity).toBeGreaterThan(0);
      expect(preset.key.shadowRadius).toBeGreaterThan(0);
      // The key is above the floor and on the front side: the shadow falls behind the body, on the floor.
      expect(preset.key.position[1]).toBeGreaterThan(1);
      expect(preset.key.position[2]).toBeGreaterThan(0);
      expect(preset.softboxes.length).toBeGreaterThan(0);
      for (const box of preset.softboxes) expect(box.intensity).toBeGreaterThan(1);
      expect(preset.floorShadowOpacity).toBeGreaterThan(0);
      expect(preset.floorShadowOpacity).toBeLessThan(1);
      for (const c of [preset.key.color, ...preset.fills.map((f) => f.color), preset.hemisphere.sky, preset.hemisphere.ground])
        expect(c).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('gives each preset its own character', () => {
    // Soft: the widest shadow; contrast: the lowest, raking key.
    const radii = Object.values(LIGHTING_PRESETS).map((p) => p.key.shadowRadius);
    expect(LIGHTING_PRESETS.soft.key.shadowRadius).toBe(Math.max(...radii));
    const heights = Object.values(LIGHTING_PRESETS).map((p) => p.key.position[1]);
    expect(LIGHTING_PRESETS.contrast.key.position[1]).toBe(Math.min(...heights));
  });
});

describe('dprRange', () => {
  it('caps the pixel ratio by tier', () => {
    expect(dprRange('high', 3)).toEqual([1, 2]);
    expect(dprRange('medium', 2)).toEqual([1, 1.5]);
    expect(dprRange('low', 2)).toEqual([1, 1]);
    expect(dprRange('high', 1)).toEqual([1, 1]);
    expect(dprRange('high', 0.5)).toEqual([1, 1]);
  });
});
