import { describe, expect, it } from 'vitest';
import { ANGLES, supportMax } from '../utils/garment3d/body-envelope';
import { coussinProfile, paniersProfile, understructureKindOf, understructureSupport } from '../utils/garment3d/understructure';

const WAIST = 1.05;
const FRONT = 0;
const LEFT = ANGLES / 4;
const BACK = ANGLES / 2;
const RIGHT = (3 * ANGLES) / 4;
/** A hip cross-section: 18 cm to the sides, 11 cm in front, 13 cm behind (support function of an ellipse-ish shape). */
const torso = (() => {
  const h = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) {
    const t = (2 * Math.PI * k) / ANGLES;
    const depth = Math.cos(t) >= 0 ? 0.11 : 0.13;
    h[k] = Math.sqrt((0.18 * Math.sin(t)) ** 2 + (depth * Math.cos(t)) ** 2);
  }
  return h;
})();
const hull = (extra: Float32Array | null) => (extra ? supportMax([torso, extra]) : torso);

describe('understructure: hidden supports under the skirt', () => {
  it('side hoops widen the hips by most of the pocket, and leave front and back flat', () => {
    const at = understructureSupport({ kind: 'PANIERS', widthMm: 380, depthMm: 300 }, WAIST);
    const peak = hull(at(WAIST - 0.2, torso));
    const W = 0.3;
    for (const k of [LEFT, RIGHT]) expect(peak[k]! - torso[k]!).toBeGreaterThanOrEqual(0.8 * W);
    for (const k of [FRONT, BACK]) expect(Math.abs(peak[k]! - torso[k]!)).toBeLessThan(0.01);
    // Nothing above the waist, nor below the pocket.
    expect(at(WAIST + 0.05, torso)).toBeNull();
    expect(at(WAIST - 0.01, torso)).toBeNull();
    expect(at(WAIST - 0.5, torso)).toBeNull();
  });

  it('hoops stand out less over a straighter skirt (scale 0.6 – 1, clamped)', () => {
    const wide = understructureSupport({ kind: 'PANIERS', widthMm: 380, depthMm: 300, scale: 1 }, WAIST)(WAIST - 0.2, torso)!;
    const narrow = understructureSupport({ kind: 'PANIERS', widthMm: 380, depthMm: 300, scale: 0.2 }, WAIST)(WAIST - 0.2, torso)!;
    expect(wide[LEFT]! - torso[LEFT]!).toBeCloseTo(0.3, 2);
    expect(narrow[LEFT]! - torso[LEFT]!).toBeCloseTo(0.18, 2);
  });

  it('a bustle pad juts out at the back only, most just under the waist', () => {
    const at = understructureSupport({ kind: 'COUSSIN', widthMm: 340, depthMm: 120 }, WAIST);
    const bump = (d: number) => hull(at(WAIST - d, torso))[BACK]! - torso[BACK]!;
    expect(bump(0.05)).toBeCloseTo(0.12, 2);
    expect(bump(0.05)).toBeGreaterThan(bump(0.15));
    expect(bump(0.05)).toBeGreaterThan(bump(-0.01));
    const peak = hull(at(WAIST - 0.05, torso));
    for (const k of [FRONT, LEFT, RIGHT]) expect(peak[k]! - torso[k]!).toBeLessThan(0.005);
    expect(at(WAIST - 0.3, torso)).toBeNull();
    expect(at(WAIST + 0.1, torso)).toBeNull();
  });

  it('profiles: hoops rise to the peak and keep 70 % at the bottom; the pad rounds off to nothing', () => {
    expect(paniersProfile(0.03, 0.35)).toBe(0);
    expect(paniersProfile(0.2, 0.35)).toBe(1);
    expect(paniersProfile(0.35, 0.35)).toBeCloseTo(0.7, 5);
    expect(paniersProfile(0.4, 0.35)).toBe(0);
    expect(coussinProfile(0.05)).toBe(1);
    expect(coussinProfile(0.2)).toBeCloseTo(0, 5);
    expect(coussinProfile(-0.05)).toBe(0);
  });

  it('recognises the engine pieces by name', () => {
    expect(understructureKindOf('panier (poche de hanche)')).toBe('PANIERS');
    expect(understructureKindOf('coussin de tournure')).toBe('COUSSIN');
    expect(understructureKindOf('drape de tournure (pouf)')).toBeNull();
  });
});
