import { describe, expect, it } from 'vitest';
import {
  ANGLES,
  buildEnvelope,
  pointAt,
  pushOutside,
  REGION,
  ringCurve,
  ringForCircumference,
  supportMax,
  supportPerimeter,
} from '../utils/garment3d/body-envelope';

const circle = (r: number): Float32Array => new Float32Array(ANGLES).fill(r);

/** Points of an upright cylinder of radius r around (cx, cz), from y0 to y1. */
const cylinder = (r: number, cx: number, cz: number, y0: number, y1: number): number[] => {
  const out: number[] = [];
  for (let y = y0; y <= y1 + 1e-9; y += 0.005) {
    for (let k = 0; k < 64; k += 1) {
      const a = (2 * Math.PI * k) / 64;
      out.push(cx + r * Math.sin(a), y, cz + r * Math.cos(a));
    }
  }
  return out;
};

describe('body envelope', () => {
  it('measures the perimeter of a support function (Cauchy)', () => {
    expect(supportPerimeter(circle(0.1))).toBeCloseTo(2 * Math.PI * 0.1, 6);
  });

  it('solves the fabric ring for a circumference, never inside the body', () => {
    const body = circle(0.12);
    const loose = ringForCircumference(body, body, 0.004, 1.0);
    expect(supportPerimeter(loose.ring)).toBeCloseTo(1.0, 3);
    // Narrower than the body (negative ease): the fabric hugs the body + gap.
    const tight = ringForCircumference(body, body, 0.004, 0.5);
    for (const h of tight.ring) expect(h).toBeGreaterThanOrEqual(0.124 - 1e-6);
  });

  it('hangs the fabric from the widest support above it', () => {
    const narrow = circle(0.08);
    const wide = circle(0.16);
    const ring = ringForCircumference(narrow, supportMax([narrow, wide]), 0.004, 2 * Math.PI * 0.165);
    // The ring follows the wide support (offset), not the narrow body under it.
    expect(Math.min(...ring.ring)).toBeGreaterThan(0.16);
  });

  it('rebuilds the boundary from the support and walks it by arc length', () => {
    const curve = ringCurve(circle(0.1));
    expect(curve.arc[ANGLES]!).toBeCloseTo(2 * Math.PI * 0.1, 3);
    const quarter = pointAt(curve, curve.arc[ANGLES]! / 4);
    expect(quarter.x).toBeCloseTo(0.1, 3); // θ = 90° is +x
    expect(Math.abs(quarter.z)).toBeLessThan(1e-3);
  });

  it('pushes a point out of the shape along its ray, leaves outside points alone', () => {
    const inside = pushOutside(circle(0.1), 0, 0.05, 0);
    expect(inside.x).toBeCloseTo(0.1, 6);
    const outside = pushOutside(circle(0.1), 0, 0.2, 0);
    expect(outside.x).toBeCloseTo(0.2, 6);
  });

  it('builds torso, leg and arm envelopes from tagged points', () => {
    const torso = cylinder(0.14, 0, 0, 0.8, 1.4);
    const leg = cylinder(0.07, 0.09, 0, 0.05, 0.79);
    const arm: number[] = [];
    for (let t = 0; t <= 0.5; t += 0.01) {
      for (let k = 0; k < 16; k += 1) {
        const a = (2 * Math.PI * k) / 16;
        arm.push(0.2 + 0.04 * Math.sin(a), 1.35 - t, 0.04 * Math.cos(a));
      }
    }
    const positions = Float32Array.from([...torso, ...leg, ...arm]);
    const region = Uint8Array.from([
      ...torso.filter((_, i) => i % 3 === 0).map(() => REGION.TORSO),
      ...leg.filter((_, i) => i % 3 === 0).map(() => REGION.LEG),
      ...arm.filter((_, i) => i % 3 === 0).map(() => REGION.ARM),
    ]);
    const env = buildEnvelope({ positions, region, joint: { x: 0.2, y: 1.35, z: 0 }, crotchY: 0.8, armpitY: 1.3 });
    expect(supportPerimeter(env.torso(1.0))).toBeCloseTo(2 * Math.PI * 0.14, 2);
    expect(env.legCentre(0.4).x).toBeCloseTo(0.09, 2);
    expect(supportPerimeter(env.leg(0.4))).toBeCloseTo(2 * Math.PI * 0.07, 2);
    expect(env.arm).not.toBeNull();
    expect(env.arm!.dir.y).toBeLessThan(-0.95); // hangs down
    expect(env.arm!.length).toBeGreaterThan(0.45);
    expect(env.shoulder(0.1)?.y).toBeGreaterThan(1.39);
  });
});
