import { describe, expect, it } from 'vitest';
import { VIEW_DISTANCE, hemHeight, viewPose } from '../camera-views';
import type { ViewName } from '../camera-views';

const panel = (role: string, zone: string, ys: number[]) => ({ role, zone, positions: ys.flatMap((y) => [0, y, 0]) });

describe('hemHeight', () => {
  it('is the lowest point of the main panels', () => {
    expect(hemHeight([panel('front', 'skirt', [0.9, 0.42, 0.6]), panel('back', 'skirt', [0.45])], 0.5)).toBeCloseTo(0.42);
  });

  it('ignores trims (a train on the floor), sleeves and details', () => {
    const panels = [panel('front', 'skirt', [0.9, 0.4]), panel('trim', 'skirt', [0.01]), panel('sleeve', 'sleeve', [0.7]), panel('front', 'detail', [0.1])];
    expect(hemHeight(panels, 0.5)).toBeCloseTo(0.4);
  });

  it('falls back when there is no main panel', () => {
    expect(hemHeight([], 0.47)).toBe(0.47);
  });
});

describe('viewPose', () => {
  const ctx = { stature: 1.7, hemY: 0.4 };

  it('keeps the classic views at the usual distance', () => {
    for (const view of ['front', 'back', 'side', 'top'] as ViewName[]) {
      const { position, target } = viewPose(view, ctx);
      expect(Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2])).toBeCloseTo(VIEW_DISTANCE, 2);
    }
  });

  it('puts the 3/4 view 35° round from the front, above the target', () => {
    const { position, target } = viewPose('threeQuarter', ctx);
    expect((Math.atan2(position[0], position[2]) * 180) / Math.PI).toBeCloseTo(35, 5);
    expect(position[1]).toBeGreaterThan(target[1]);
  });

  it('frames the hem close up at its height', () => {
    const { position, target } = viewPose('hem', ctx);
    expect(target).toEqual([0, 0.4, 0]);
    expect(position[1]).toBeGreaterThan(0.4);
    expect(Math.hypot(position[0], position[1] - 0.4, position[2])).toBeLessThan(1.5);
    expect(viewPose('hem', { stature: 1.7, hemY: -0.2 }).target[1]).toBe(0.05);
  });

  it('lowers the face close-up for a shorter body', () => {
    expect(viewPose('face', { stature: 1.2, hemY: 0 }).target[1]).toBeLessThan(viewPose('face', ctx).target[1]);
  });

  it('frames reset slightly higher than front', () => {
    expect(viewPose('reset', ctx).position[1]).toBeGreaterThan(viewPose('front', ctx).position[1]);
  });
});
