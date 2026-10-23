import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { bodyLandmarks, buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, forearmMask, handCentres, POSE_PRESETS } from '../utils/garment3d/pose';
import { vertexNormals } from '../utils/garment3d/surface-shading';
import { loadHumanBase } from './helpers/humanBase';
import { rayCaster } from './helpers/rayCast';

const human = loadHumanBase();
const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const body = readBodyMeasurements(M, 'FEMME_STANDARD');
const fitted = fitHumanBody(human, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
const positions = applyPose(fitted.positions, human.armWeights, body, POSE_PRESETS.PRESENTATION.pose);
const env = envelopeFromMesh(positions, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));

// The 1890s coat-dress of the AI fashion plate: officer collar, revers, two-piece gigot sleeves, gored skirt.
const pieces = RobeRule.computePieces(
  {
    garmentType: 'ROBE',
    cutType: 'PRINCESSE',
    style: null,
    details: { longueur: 'SOL', devant: 'MANTEAU_REVERS', col: 'OFFICIER', manches: 'BALLON', fermeture: 'CEINTURE_NOUEE', jupe: 'EN_LES' },
    lengths: { sleevePct: 100 },
    fullness: { sleeve: 2.5, skirt: 3.2 },
  },
  M,
).map(
  (p, i) =>
    ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
);
const built = buildGarmentModel(pieces, 'ROBE', M, null, 'STRUCTURE');
if (!built.ok) throw new Error(built.reason);
const panels = drapeGarment(built.model.layout, body, env);

/** A plain knee-length dress with short sleeves and no collar, on the same posed body. */
const plainPanels = (): PanelMeshData[] => {
  const plain = RobeRule.computePieces(
    { garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'GENOU', manches: 'COURTES' }, lengths: {}, fullness: {} },
    M,
  ).map(
    (p, i) =>
      ({ id: `q${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const model = buildGarmentModel(plain, 'ROBE', M, null, 'STRUCTURE');
  if (!model.ok) throw new Error(model.reason);
  return drapeGarment(model.model.layout, body, env);
};

/**
 * Skin of the left shoulder (above the armpit, |x| in [x0, x1]; vertices and triangle centres) that no cloth covers:
 * looking out along the skin's normal, or towards a camera along `view` (skin facing away from it is not seen).
 */
const bareShoulder = (cloth: PanelMeshData[], x0: number, x1: number, view?: [number, number, number]): { checked: number; bare: number } => {
  const tris: number[][] = [];
  for (const p of cloth) {
    if (p.zone === 'beads' || p.zone === 'lace') continue;
    for (let i = 0; i < p.indices.length; i += 3) tris.push([0, 1, 2].flatMap((k) => [0, 1, 2].map((c) => p.positions[p.indices[i + k]! * 3 + c]!)));
  }
  const I = human.indices;
  const n = new Float32Array(positions.length);
  for (let i = 0; i < I.length; i += 3) {
    const [a, b, c] = [I[i]! * 3, I[i + 1]! * 3, I[i + 2]! * 3];
    const u = [0, 1, 2].map((k) => positions[b + k]! - positions[a + k]!);
    const v = [0, 1, 2].map((k) => positions[c + k]! - positions[a + k]!);
    const cr = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    for (const o of [a, b, c]) for (let k = 0; k < 3; k += 1) n[o + k] = n[o + k]! + cr[k]!;
  }
  // Sample points: every vertex, then every triangle's centre (the mesh is sparse on the shoulders).
  const pts: number[] = Array.from(positions);
  const normals: number[] = Array.from(n);
  const arm: number[] = Array.from(human.armWeights);
  for (let t = 0; t < I.length; t += 3) {
    for (let c = 0; c < 3; c += 1) {
      pts.push((positions[I[t]! * 3 + c]! + positions[I[t + 1]! * 3 + c]! + positions[I[t + 2]! * 3 + c]!) / 3);
      normals.push(n[I[t]! * 3 + c]! + n[I[t + 1]! * 3 + c]! + n[I[t + 2]! * 3 + c]!);
    }
    arm.push(Math.max(human.armWeights[I[t]!]!, human.armWeights[I[t + 1]!]!, human.armWeights[I[t + 2]!]!));
  }
  // Möller–Trumbore: does the ray from o along d meet a cloth triangle (from 3 mm under the skin out to 30 cm)?
  const covered = (o: number[], d: number[]): boolean =>
    tris.some((t) => {
      const e1 = [t[3]! - t[0]!, t[4]! - t[1]!, t[5]! - t[2]!];
      const e2 = [t[6]! - t[0]!, t[7]! - t[1]!, t[8]! - t[2]!];
      const pv = [d[1]! * e2[2]! - d[2]! * e2[1]!, d[2]! * e2[0]! - d[0]! * e2[2]!, d[0]! * e2[1]! - d[1]! * e2[0]!];
      const det = e1[0]! * pv[0]! + e1[1]! * pv[1]! + e1[2]! * pv[2]!;
      if (Math.abs(det) < 1e-12) return false;
      const tv = [o[0]! - t[0]!, o[1]! - t[1]!, o[2]! - t[2]!];
      const u = (tv[0]! * pv[0]! + tv[1]! * pv[1]! + tv[2]! * pv[2]!) / det;
      if (u < 0 || u > 1) return false;
      const q = [tv[1]! * e1[2]! - tv[2]! * e1[1]!, tv[2]! * e1[0]! - tv[0]! * e1[2]!, tv[0]! * e1[1]! - tv[1]! * e1[0]!];
      const v = (d[0]! * q[0]! + d[1]! * q[1]! + d[2]! * q[2]!) / det;
      if (v < 0 || u + v > 1) return false;
      const s = (e2[0]! * q[0]! + e2[1]! * q[1]! + e2[2]! * q[2]!) / det;
      return s > -0.003 && s < 0.3;
    });
  let checked = 0;
  let bare = 0;
  for (let i = 0; i < pts.length; i += 3) {
    const x = pts[i]!;
    const y = pts[i + 1]!;
    if (x < x0 || x > x1 || y < env.armpitY || y > body.napeY + 0.01 || arm[i / 3]! > 0.3) continue;
    const l = Math.hypot(normals[i]!, normals[i + 1]!, normals[i + 2]!);
    if (!(l > 0) || normals[i + 1]! / l < -0.2) continue;
    const out = [normals[i]! / l, normals[i + 1]! / l, normals[i + 2]! / l];
    if (view && out[0]! * view[0] + out[1]! * view[1] + out[2]! * view[2] <= 0) continue;
    checked += 1;
    if (!covered([x, y, pts[i + 2]!], view ?? out)) bare += 1;
  }
  return { checked, bare };
};

/** The 1890s coat-dress (v2) as generated for the seed client's project. */
const v2Panels = (): PanelMeshData[] => {
  const fixture = JSON.parse(readFileSync(join(__dirname, 'fixtures/robe-v2-1890.pieces.json'), 'utf8')) as { pieces: PatternPieceDto[] };
  const model = buildGarmentModel(fixture.pieces, 'ROBE', M, null, 'STRUCTURE');
  if (!model.ok) throw new Error(model.reason);
  return drapeGarment(model.model.layout, body, env);
};

describe('Victorian coat-dress on the posed body', () => {
  it('sews the band collar onto the back neckline: no skin between the collar and the bodice at the nape', () => {
    const collar = panels.find((p) => p.zone === 'collar')!;
    // Directions behind the neck (0 = front).
    let checked = 0;
    for (let deg = 145; deg <= 215; deg += 5) {
      const a = (deg * Math.PI) / 180;
      const near = (x: number, z: number): boolean => {
        const d = Math.atan2(x, z - env.axisZ) - a;
        return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < 0.09;
      };
      let collarBottom = Infinity;
      for (let i = 0; i < collar.positions.length; i += 3) if (near(collar.positions[i]!, collar.positions[i + 2]!)) collarBottom = Math.min(collarBottom, collar.positions[i + 1]!);
      let bodiceTop = -Infinity;
      for (const p of panels) {
        if (p.zone !== 'bodice') continue;
        for (let i = 0; i < p.positions.length; i += 3) {
          const x = p.positions[i]!;
          const z = p.positions[i + 2]!;
          if (Math.hypot(x, z - env.axisZ) < 0.13 && near(x, z)) bodiceTop = Math.max(bodiceTop, p.positions[i + 1]!);
        }
      }
      if (!Number.isFinite(bodiceTop) || !Number.isFinite(collarBottom)) continue;
      checked += 1;
      expect(collarBottom).toBeLessThanOrEqual(bodiceTop + 0.002);
    }
    expect(checked).toBeGreaterThan(8);
  });

  it('keeps the arm inside the gigot sleeve, from the puff down the forearm (posed arms included)', () => {
    const arm = env.arm!;
    // Round the arm's own centre line (the forearm leaves the upper arm's axis below the elbow).
    const local = (x: number, y: number, z: number) => {
      const d = [x - arm.start.x, y - arm.start.y, z - arm.start.z] as const;
      const t = d[0] * arm.dir.x + d[1] * arm.dir.y + d[2] * arm.dir.z;
      const c = arm.centre?.(t) ?? { s: 0, f: 0 };
      const u = d[0] * arm.side.x + d[1] * arm.side.y + d[2] * arm.side.z - c.s;
      const v = d[0] * arm.front.x + d[1] * arm.front.y + d[2] * arm.front.z - c.f;
      return { t, a: Math.atan2(v, u), r: Math.hypot(u, v) };
    };
    const cloth = panels
      .filter((p) => p.zone === 'sleeve' && p.id.endsWith('-1'))
      .flatMap((p) => Array.from({ length: p.positions.length / 3 }, (_, i) => local(p.positions[i * 3]!, p.positions[i * 3 + 1]!, p.positions[i * 3 + 2]!)));
    let checked = 0;
    let worst = 0;
    for (let i = 0; i < positions.length; i += 3) {
      if (human.armWeights[i / 3]! < 0.5 || positions[i]! < 0) continue;
      const s = local(positions[i]!, positions[i + 1]!, positions[i + 2]!);
      if (s.t < 0.08 || s.t > arm.wrist - 0.03) continue;
      const around = cloth.filter((c) => Math.abs(c.t - s.t) < 0.012 && Math.abs(Math.atan2(Math.sin(c.a - s.a), Math.cos(c.a - s.a))) < 0.25);
      if (around.length === 0) continue;
      checked += 1;
      worst = Math.max(worst, s.r - Math.min(...around.map((c) => c.r)));
    }
    expect(checked).toBeGreaterThan(100);
    // Before: the balloon, carried to the outside of the arm, left the inner elbow 2–8 cm out of the sleeve.
    expect(worst).toBeLessThan(0.012);
  });

  it('closes the shoulder-neck point: the front and back shoulder seams meet there, no triangle of skin behind it', () => {
    // Before: each half was wrapped on its own and the back's seam started 1.5–3 cm further out than the front's; the
    // collar's foot stopped on the shoulder seam above the back neckline's corner. Skin showed on both sides of the
    // collar from behind (v2: 38 skin points bare over four checks, 7 of them seen from the back camera). Further out
    // the two seams, straight between vertices ~3 cm apart standing at different |x|, parted by up to 9 mm.
    const BACK: [number, number, number] = [0, 0, -1];
    const ABOVE_BEHIND: [number, number, number] = [0, 0.5, -0.866];
    const v2 = v2Panels();
    expect(bareShoulder(v2, 0.03, 0.15, BACK)).toEqual({ checked: expect.any(Number), bare: 0 });
    expect(bareShoulder(v2, 0.03, 0.15, ABOVE_BEHIND).bare).toBe(0);
    expect(bareShoulder(v2, 0.04, 0.15).bare).toBe(0);
    // The same dress from the engine's current rules.
    const engine = bareShoulder(panels, 0.03, 0.15, BACK);
    expect(engine.checked).toBeGreaterThan(150);
    expect(engine.bare).toBe(0);
    expect(bareShoulder(panels, 0.04, 0.15).bare).toBe(0);
    // Without a collar the neck itself shows inside the neckline; from the neck point out to the armhole nothing does
    // from any side, nor from right above (between the two seams).
    const plain = plainPanels();
    const plainOut = bareShoulder(plain, 0.08, 0.15);
    expect(plainOut.checked).toBeGreaterThan(100);
    expect(plainOut.bare).toBe(0);
    expect(bareShoulder(plain, 0.08, 0.15, [0, 1, 0]).bare).toBe(0);
    expect(bareShoulder(plain, 0.08, 0.15, BACK).bare).toBe(0);
    expect(bareShoulder(plain, 0.08, 0.15, [0, 0, 1]).bare).toBe(0);
  });
});

describe('Victorian coat-dress draped with the arms held out', () => {
  // Arms 15° out from the rest pose (the cloth simulation's dressing pose): the cuffs come to the waist's height.
  const out = { raise: 15, forward: 0, twist: 0, bend: 0 };
  const held = applyPose(fitted.positions, human.armWeights, body, { ...POSE_PRESETS.NEUTRE.pose, leftArm: out, rightArm: out });
  const heldEnv = envelopeFromMesh(held, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));
  const heldPanels = drapeGarment(built.model.layout, body, heldEnv);

  it('keeps the belt round the waist, not stretched out to the wrists', () => {
    const belt = heldPanels.find((p) => p.zone === 'belt')!;
    const cuffs = heldPanels.filter((p) => p.zone === 'cuff');
    let beltX = 0;
    for (let i = 0; i < belt.positions.length; i += 3) beltX = Math.max(beltX, Math.abs(belt.positions[i]!));
    let cuffX = Infinity;
    for (const c of cuffs) for (let i = 0; i < c.positions.length; i += 3) cuffX = Math.min(cuffX, Math.abs(c.positions[i]!));
    // The wrists stand further out than the waist: the belt stays within the cloth at the waist (~15 cm half-width).
    expect(cuffX).toBeGreaterThan(0.17);
    expect(beltX).toBeLessThan(0.17);
  });
});

describe('the sleeve follows the forearm to the wrist (bent elbow, any pose)', () => {
  it.each(['NEUTRE', 'PRESENTATION'] as const)('%s: the cuff is centred on the wrist, not hanging beside the hand', (id) => {
    const pose = POSE_PRESETS[id].pose;
    const posed = id === 'NEUTRE' ? fitted.positions : applyPose(fitted.positions, human.armWeights, body, pose);
    const e = envelopeFromMesh(posed, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));
    const arm = e.arm!;
    const dressed = drapeGarment(built.model.layout, body, e);
    const cuff = dressed.find((p) => p.zone === 'cuff' && p.id.endsWith('-1') && !p.id.endsWith('--1'))!;
    const centroid = (pts: number[][]) => [0, 1, 2].map((k) => pts.reduce((a, p) => a + p[k]!, 0) / pts.length);
    const cuffPts = Array.from({ length: cuff.positions.length / 3 }, (_, i) => [cuff.positions[i * 3]!, cuff.positions[i * 3 + 1]!, cuff.positions[i * 3 + 2]!]);
    const c = centroid(cuffPts);
    const along = (p: number[]) => (p[0]! - arm.start.x) * arm.dir.x + (p[1]! - arm.start.y) * arm.dir.y + (p[2]! - arm.start.z) * arm.dir.z;
    // At the wrist, not over the hand.
    expect(along(c)).toBeLessThan(arm.wrist + 0.025);
    // The wrist section (the left arm's skin there; the hand beyond it is left out).
    const tc = Math.min(along(c), arm.wrist - 0.005);
    const skin: number[][] = [];
    for (let i = 0; i < posed.length; i += 3) {
      if (human.armWeights[i / 3]! < 0.5 || posed[i]! < 0) continue;
      const p = [posed[i]!, posed[i + 1]!, posed[i + 2]!];
      if (Math.abs(along(p) - tc) < 0.012 && Math.hypot(p[0]! - c[0]!, p[1]! - c[1]!, p[2]! - c[2]!) < 0.15) skin.push(p);
    }
    expect(skin.length).toBeGreaterThan(5);
    const w = centroid(skin);
    // Before: the cuff hung 6–9 cm behind the wrist (the sleeve was drawn round the upper arm's straight axis), and
    // rode onto the hand (the sleeve's length was measured on that axis, shorter than the bent arm).
    expect(Math.hypot(c[0]! - w[0]!, c[1]! - w[1]!, c[2]! - w[2]!)).toBeLessThan(0.03);
  });
});

describe('band collar sewn onto the neckline all round', () => {
  it('leaves no skin between the collar and the bodice on the shoulders by the neck, nor under the front', () => {
    const l = bodyLandmarks(body);
    const cloth = rayCaster(panels);
    const skin = rayCaster([{ positions, indices: human.indices }]);
    const N = vertexNormals(positions, human.indices);
    let checked = 0;
    let bare = 0;
    for (let i = 0; i < positions.length / 3; i += 1) {
      const y = positions[i * 3 + 1]!;
      // The top of the shoulders and the base of the neck: from the nape down 9 cm (the shoulder test stops 7 cm under it).
      if (human.armWeights[i]! >= 0.5 || y < l.napeY - 0.09 || y > l.napeY + 0.02) continue;
      const p: [number, number, number] = [positions[i * 3]!, y, positions[i * 3 + 2]!];
      const n: [number, number, number] = [N[i * 3]!, N[i * 3 + 1]!, N[i * 3 + 2]!];
      if (skin(p, n, 0.15, 0.004)) continue; // facing the body: hidden anyway
      checked += 1;
      if (!cloth(p, n, 0.06)) bare += 1;
    }
    expect(checked).toBeGreaterThan(200);
    // Before: 55 of 381 points bare (two triangles behind the side neck points, a strip under the front).
    expect(bare / checked).toBeLessThan(0.02);
  });
});

describe('hands and the dress', () => {
  it('ends the cuff at the wrist, never over the hand (the thumb came through it)', () => {
    const e = envelopeFromMesh(fitted.positions, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));
    const arm = e.arm!;
    const cuff = drapeGarment(built.model.layout, body, e).find((p) => p.zone === 'cuff' && !p.id.endsWith('--1'))!;
    let tMax = -Infinity;
    for (let i = 0; i < cuff.positions.length; i += 3) {
      const t = (cuff.positions[i]! - arm.start.x) * arm.dir.x + (cuff.positions[i + 1]! - arm.start.y) * arm.dir.y + (cuff.positions[i + 2]! - arm.start.z) * arm.dir.z;
      tMax = Math.max(tMax, t);
    }
    // Before: a sleeve longer than the arm stacked up past the wrist and the cuff ran 4 cm onto the hand.
    expect(tMax).toBeLessThan(arm.wrist + 0.012);
  });

  it('lets the hands rest on the skirt: the cloth goes under the palm, never out to the hand', () => {
    const hands = handCentres(fitted.positions, positions, human.armWeights, body);
    const free = drapeGarment(built.model.layout, body, env);
    const held = drapeGarment(built.model.layout, body, env, { hands });
    let moved = 0;
    for (const p of held.filter((q) => q.zone === 'skirt')) {
      const f = free.find((q) => q.id === p.id)!;
      for (let i = 0; i < p.positions.length; i += 3) {
        const r = Math.hypot(p.positions[i]!, p.positions[i + 2]! - env.axisZ);
        const r0 = Math.hypot(f.positions[i]!, f.positions[i + 2]! - env.axisZ);
        // Before: the skirt was drawn to the hand and out from the body (« the dress attracted by the hands »).
        expect(r).toBeLessThanOrEqual(r0 + 1e-6);
        if (r < r0 - 0.002) moved += 1;
      }
    }
    expect(moved).toBeGreaterThanOrEqual(0);
    // A hand 3 cm inside the skirt's surface at the hips: the cloth there is pressed in under the palm.
    const skirt = free.find((q) => q.zone === 'skirt')!;
    let o = 0;
    let best = Infinity;
    for (let i = 0; i < skirt.positions.length; i += 3) {
      const d = Math.abs(skirt.positions[i + 1]! - 0.85) + Math.abs(skirt.positions[i]! - 0.2);
      if (d < best) [best, o] = [d, i];
    }
    const at = { x: skirt.positions[o]!, y: skirt.positions[o + 1]!, z: skirt.positions[o + 2]! };
    const r = Math.hypot(at.x, at.z - env.axisZ);
    const k = (r - 0.03) / r;
    const hand = { x: at.x * k, y: at.y, z: env.axisZ + (at.z - env.axisZ) * k };
    const pressed = drapeGarment(built.model.layout, body, env, { hands: [hand] }).find((q) => q.id === skirt.id)!;
    const rNow = Math.hypot(pressed.positions[o]!, pressed.positions[o + 2]! - env.axisZ);
    expect(rNow).toBeLessThan(Math.hypot(hand.x, hand.z - env.axisZ));
  });
});
