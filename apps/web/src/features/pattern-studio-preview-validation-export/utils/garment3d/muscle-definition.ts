import { bodyLandmarks, bodyScale, type BodyMeasurements } from './body-model';

/**
 * Muscle definition of an athletic or muscular build, sculpted on the front of the torso: the lower
 * edge of the pectorals and the sternum, the abdominal wall (linea alba, three tendinous lines, the
 * lateral borders) and the iliac "V". Soft, centimetre-wide hollows and bulges (the subdivided scan is
 * ~1 cm between vertices there): under a studio light they read as the relief of a muscular body.
 * Pure numbers, no three.js. `amount` 0 leaves the body unchanged, 1 is a muscular build.
 */
export const defineMuscles = (positions: Float32Array, body: BodyMeasurements, amount: number): Float32Array => {
  const out = Float32Array.from(positions);
  if (amount <= 0) return out;
  const s = bodyScale(body);
  const l = bodyLandmarks(body);
  const top = l.bustY + 0.1 * s;
  const bottom = l.hipY - 0.06 * s;
  // Middle depth of the torso per 1 cm of height (front half: in front of it).
  const BIN = 0.01;
  const lo = new Map<number, number>();
  const hi = new Map<number, number>();
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1]!;
    if (y < bottom || y > top || Math.abs(positions[i]!) > 0.1 * s) continue;
    const b = Math.round(y / BIN);
    lo.set(b, Math.min(lo.get(b) ?? Infinity, positions[i + 2]!));
    hi.set(b, Math.max(hi.get(b) ?? -Infinity, positions[i + 2]!));
  }
  // The navel sits ~2 cm under the natural waist.
  const navel = l.waistY - 0.02 * s;
  const g = (d: number, w: number): number => Math.exp(-((d / w) ** 2));
  const smooth = (t: number): number => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };
  // Lower edge of the pectorals: rises towards the armpits.
  const pecEdge = (ax: number): number => l.bustY - 0.03 * s + 0.035 * s * (ax / (0.11 * s)) ** 2;
  for (let i = 0; i < out.length; i += 3) {
    const y = positions[i + 1]!;
    const ax = Math.abs(positions[i]!);
    if (y < bottom || y > top || ax > 0.15 * s) continue;
    const b = Math.round(y / BIN);
    const zFront = hi.get(b);
    const zBack = lo.get(b);
    if (zFront === undefined || zBack === undefined) continue;
    const front = smooth((positions[i + 2]! - (zFront + zBack) / 2) / (0.04 * s));
    if (front <= 0) continue;
    const edge = pecEdge(ax);
    let d = 0;
    // Pectorals: a fuller mass above their lower edge, a hollow under it, the sternum between them.
    d += 0.004 * s * g(ax - 0.065 * s, 0.045 * s) * g(y - (edge + 0.035 * s), 0.035 * s);
    d -= 0.0035 * s * g(y - (edge - 0.008 * s), 0.011 * s) * smooth((ax - 0.01 * s) / (0.02 * s)) * (1 - smooth((ax - 0.12 * s) / (0.02 * s)));
    d -= 0.0025 * s * g(ax, 0.01 * s) * smooth((y - edge) / (0.02 * s)) * (1 - smooth((y - (l.bustY + 0.08 * s)) / (0.02 * s)));
    // Abdominals, from under the pectorals to below the navel.
    const abs = smooth((edge - 0.015 * s - y) / (0.015 * s)) * smooth((y - (navel - 0.06 * s)) / (0.02 * s));
    d -= 0.003 * s * g(ax, 0.009 * s) * abs; // linea alba
    for (const yi of [navel + 0.015 * s, navel + 0.06 * s, navel + 0.105 * s]) {
      d -= 0.0022 * s * g(y - (yi + 0.006 * s * (ax / (0.05 * s)) ** 2), 0.008 * s) * (1 - smooth((ax - 0.05 * s) / (0.015 * s))) * abs;
    }
    d += 0.0015 * s * g(ax - 0.035 * s, 0.022 * s) * abs; // the blocks between the lines
    d -= 0.0025 * s * g(ax - 0.07 * s, 0.01 * s) * abs; // lateral borders
    // The iliac "V": from the side of the waist down to the pubis.
    const ax0 = 0.085 * s;
    const ay0 = navel + 0.01 * s;
    const ax1 = 0.028 * s;
    const ay1 = navel - 0.095 * s;
    const vx = ax1 - ax0;
    const vy = ay1 - ay0;
    const t = Math.min(1, Math.max(0, ((ax - ax0) * vx + (y - ay0) * vy) / (vx * vx + vy * vy)));
    const dist = Math.hypot(ax - (ax0 + t * vx), y - (ay0 + t * vy));
    d -= 0.003 * s * g(dist, 0.01 * s) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05));
    out[i + 2] = positions[i + 2]! + d * front * amount;
  }
  return out;
};
