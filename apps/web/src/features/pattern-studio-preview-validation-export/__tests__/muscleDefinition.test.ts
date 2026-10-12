import { describe, expect, it } from 'vitest';
import { bodyLandmarks, readBodyMeasurements } from '../utils/garment3d/body-model';
import { defineMuscles } from '../utils/garment3d/muscle-definition';

/** A torso-like elliptic cylinder (front at +z) sampled every 5 mm. */
const torso = (y0: number, y1: number) => {
  const pts: number[] = [];
  for (let y = y0; y <= y1; y += 0.005) {
    for (let k = 0; k < 120; k += 1) {
      const a = (k / 120) * 2 * Math.PI;
      pts.push(0.16 * Math.sin(a), y, 0.11 * Math.cos(a));
    }
  }
  return Float32Array.from(pts);
};

describe('muscle definition', () => {
  const body = readBodyMeasurements({}, 'HOMME_COSTAUD');
  const l = bodyLandmarks(body);
  const positions = torso(l.hipY - 0.1, l.bustY + 0.15);

  it('changes nothing with no muscle tone', () => {
    expect(Array.from(defineMuscles(positions, body, 0))).toEqual(Array.from(positions));
  });

  it('carves the abdominal midline on the front only, never the back', () => {
    const out = defineMuscles(positions, body, 1);
    let midline = 0;
    let back = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const dz = out[i + 2]! - positions[i + 2]!;
      const y = positions[i + 1]!;
      if (Math.abs(positions[i]!) < 0.003 && positions[i + 2]! > 0 && y > l.waistY && y < l.bustY - 0.06) midline = Math.min(midline, dz);
      if (positions[i + 2]! < 0) back = Math.max(back, Math.abs(dz));
      expect(out[i]).toBe(positions[i]);
      expect(out[i + 1]).toBe(positions[i + 1]);
    }
    expect(midline).toBeLessThan(-0.001);
    expect(back).toBe(0);
  });
});
