import { describe, expect, it } from 'vitest';
import { bodyLandmarks, buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, clampPose, isNeutral, NEUTRAL_POSE, POSE_PRESETS, type BodyPose } from '../utils/garment3d/pose';
import { loadHumanBase } from './helpers/humanBase';

const base = loadHumanBase();
const body = readBodyMeasurements({}, 'FEMME_STANDARD');
const fit = hb();
function hb() {
  return fitHumanBody(base, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
}
const l = bodyLandmarks(body);

/** Centre of the firmly weighted arm vertices of one side whose rest height is in [lo, hi]. */
const armCentre = (p: Float32Array, side: 1 | -1, lo: number, hi: number): [number, number, number] => {
  const c: [number, number, number] = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < base.armWeights.length; i += 1) {
    const y = fit.positions[i * 3 + 1]!;
    if (base.armWeights[i]! < 0.95 || Math.sign(fit.positions[i * 3]!) !== side || y < lo || y > hi) continue;
    c[0] = c[0] + p[i * 3]!;
    c[1] = c[1] + p[i * 3 + 1]!;
    c[2] = c[2] + p[i * 3 + 2]!;
    n += 1;
  }
  return [c[0] / n, c[1] / n, c[2] / n];
};

describe('posable mannequin', () => {
  it('leaves the body untouched in the neutral pose', () => {
    expect(isNeutral(NEUTRAL_POSE)).toBe(true);
    expect(applyPose(fit.positions, base.armWeights, body, NEUTRAL_POSE)).toEqual(fit.positions);
  });

  it('keeps every joint within its anatomical range', () => {
    const wild: BodyPose = { ...NEUTRAL_POSE, leftArm: { raise: 500, forward: -500, twist: 0, bend: 999 } };
    expect(clampPose(wild).leftArm).toEqual({ raise: 90, forward: -30, twist: 0, bend: 150 });
  });

  it('brings the hand up to the face for the mirror selfie of the photo, the other arm staying down', () => {
    const posed = applyPose(fit.positions, base.armWeights, body, POSE_PRESETS.MIROIR.pose);
    const hand = armCentre(posed, 1, 0, l.waistY - 0.15);
    const restHand = armCentre(fit.positions, 1, 0, l.waistY - 0.15);
    expect(hand[1]).toBeGreaterThan(l.napeY - 0.08); // chin level
    expect(hand[0]).toBeLessThan(restHand[0]); // towards the midline
    expect(hand[2]).toBeGreaterThan(0.05); // in front of the chest
    const other = armCentre(posed, -1, 0, l.waistY - 0.15);
    expect(other[1]).toBeLessThan(l.waistY);
  });

  it('the presentation pose brings the arms in along the body (hands nearer the thighs than at rest)', () => {
    const posed = applyPose(fit.positions, base.armWeights, body, POSE_PRESETS.PRESENTATION.pose);
    const lo = l.waistY - 0.25;
    const hi = l.waistY - 0.05;
    expect(Math.abs(armCentre(posed, 1, lo, hi)[0])).toBeLessThan(Math.abs(armCentre(fit.positions, 1, lo, hi)[0]) - 0.02);
    expect(clampPose(POSE_PRESETS.PRESENTATION.pose)).toEqual(POSE_PRESETS.PRESENTATION.pose);
  });

  it('bends the elbow without stretching the arm: the upper arm keeps its length', () => {
    const pose: BodyPose = { ...NEUTRAL_POSE, leftArm: { raise: 0, forward: 0, twist: 0, bend: 90 } };
    const posed = applyPose(fit.positions, base.armWeights, body, pose);
    // The upper arm does not move; the forearm comes forward.
    const upper = armCentre(posed, 1, l.bustY - 0.02, l.bustY + 0.04);
    const restUpper = armCentre(fit.positions, 1, l.bustY - 0.02, l.bustY + 0.04);
    expect(Math.hypot(upper[0] - restUpper[0], upper[1] - restUpper[1], upper[2] - restUpper[2])).toBeLessThan(0.01);
    const fore = armCentre(posed, 1, l.hipY - 0.05, l.hipY + 0.05);
    const restFore = armCentre(fit.positions, 1, l.hipY - 0.05, l.hipY + 0.05);
    expect(fore[2] - restFore[2]).toBeGreaterThan(0.06);
  });

  it('bends a knee and keeps the body standing on the floor', () => {
    const pose: BodyPose = { ...NEUTRAL_POSE, rightLeg: { raise: 0, forward: 10, twist: 0, bend: 30 } };
    const posed = applyPose(fit.positions, base.armWeights, body, pose);
    let lowest = Infinity;
    for (let i = 1; i < posed.length; i += 3) lowest = Math.min(lowest, posed[i]!);
    expect(lowest).toBeGreaterThanOrEqual(-1e-6);
    expect(lowest).toBeLessThan(0.01);
    // The shin folds backwards: the right foot goes behind where it stood.
    const foot = (p: Float32Array): number => {
      let z = 0;
      let n = 0;
      for (let i = 0; i < base.armWeights.length; i += 1) {
        if (base.armWeights[i]! >= 0.05 || fit.positions[i * 3]! > 0 || fit.positions[i * 3 + 1]! > 0.08) continue;
        z += p[i * 3 + 2]!;
        n += 1;
      }
      return z / n;
    };
    expect(foot(posed)).toBeLessThan(foot(fit.positions) - 0.05);
  });
});
