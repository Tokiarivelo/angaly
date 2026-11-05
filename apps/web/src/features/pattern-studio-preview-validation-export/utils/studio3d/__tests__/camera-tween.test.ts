import { describe, expect, it } from 'vitest';
import { CAMERA_TWEEN_MS, cubicBezier, easeCameraMove, interpolatePose, poseAt } from '../camera-tween';
import type { CameraPose, Vec3 } from '../camera-tween';

const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const front: CameraPose = { position: [0, 0.88, 3.3], target: [0, 0.88, 0] };
const back: CameraPose = { position: [0, 0.88, -3.3], target: [0, 0.88, 0] };
const side: CameraPose = { position: [3.3, 0.88, 0], target: [0, 0.88, 0] };
const hem: CameraPose = { position: [0.35, 0.48, 1.3], target: [0, 0.3, 0] };

describe('easing', () => {
  it('starts at 0, ends at 1 and is symmetric for (0.65, 0, 0.35, 1)', () => {
    expect(easeCameraMove(0)).toBe(0);
    expect(easeCameraMove(1)).toBe(1);
    expect(easeCameraMove(-1)).toBe(0);
    expect(easeCameraMove(2)).toBe(1);
    expect(easeCameraMove(0.5)).toBeCloseTo(0.5, 5);
    expect(easeCameraMove(0.25) + easeCameraMove(0.75)).toBeCloseTo(1, 5);
    // Slow in, slow out.
    expect(easeCameraMove(0.1)).toBeLessThan(0.1);
    expect(easeCameraMove(0.9)).toBeGreaterThan(0.9);
  });

  it('never decreases', () => {
    let previous = 0;
    for (let i = 1; i <= 100; i += 1) {
      const y = easeCameraMove(i / 100);
      expect(y).toBeGreaterThanOrEqual(previous);
      previous = y;
    }
  });

  it('is the identity for a linear bezier', () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
    expect(linear(0.3)).toBeCloseTo(0.3, 5);
  });
});

describe('interpolatePose', () => {
  it('returns the exact end poses', () => {
    expect(interpolatePose(front, side, 0)).toBe(front);
    expect(interpolatePose(front, side, 1)).toBe(side);
  });

  it('keeps the distance to the target when both views are at the same distance', () => {
    for (const to of [side, back]) {
      for (let i = 1; i < 10; i += 1) {
        const pose = interpolatePose(front, to, i / 10);
        expect(distance(pose.position, pose.target)).toBeCloseTo(3.3, 6);
      }
    }
  });

  it('turns around the mannequin from front to back instead of cutting through it', () => {
    const middle = interpolatePose(front, back, 0.5);
    expect(Math.hypot(middle.position[0], middle.position[2])).toBeCloseTo(3.3, 6);
  });

  it('takes the shortest way round', () => {
    const fromLeft: CameraPose = { position: [-3.3 * Math.sin(0.2), 0.88, -3.3 * Math.cos(0.2)], target: [0, 0.88, 0] };
    const toRight: CameraPose = { position: [3.3 * Math.sin(0.2), 0.88, -3.3 * Math.cos(0.2)], target: [0, 0.88, 0] };
    const middle = interpolatePose(fromLeft, toRight, 0.5);
    // Through the back (z < 0), not round the front.
    expect(middle.position[2]).toBeLessThan(-3);
  });

  it('moves the target in a straight line and the distance monotonically', () => {
    let previous = distance(front.position, front.target);
    for (let i = 1; i <= 10; i += 1) {
      const pose = interpolatePose(front, hem, i / 10);
      expect(pose.target[1]).toBeCloseTo(0.88 + (0.3 - 0.88) * (i / 10), 6);
      const d = distance(pose.position, pose.target);
      expect(d).toBeLessThanOrEqual(previous + 1e-9);
      previous = d;
    }
  });
});

describe('poseAt', () => {
  it('eases over the move length and says when it is done', () => {
    expect(poseAt(front, side, 0)).toEqual({ pose: front, done: false });
    const half = poseAt(front, side, CAMERA_TWEEN_MS / 2);
    expect(half.done).toBe(false);
    expect(half.pose.position[0]).toBeGreaterThan(0);
    expect(poseAt(front, side, CAMERA_TWEEN_MS)).toEqual({ pose: side, done: true });
    expect(poseAt(front, side, CAMERA_TWEEN_MS * 3)).toEqual({ pose: side, done: true });
  });

  it('jumps straight to the end for a zero-length move', () => {
    expect(poseAt(front, side, 0, 0)).toEqual({ pose: side, done: true });
  });

  it('moves the camera monotonically along the way', () => {
    let previous = -Infinity;
    for (let ms = 0; ms <= CAMERA_TWEEN_MS; ms += 30) {
      const x = poseAt(front, side, ms).pose.position[0];
      expect(x).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = x;
    }
  });
});
