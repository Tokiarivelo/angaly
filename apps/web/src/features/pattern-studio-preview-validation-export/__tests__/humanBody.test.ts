import { describe, expect, it } from 'vitest';
import { bodyLandmarks, buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh, findJoint } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment } from '../utils/garment3d/garment-model';
import { fitHumanBody, JOINT_INSET, morphFor, POSE } from '../utils/garment3d/human-body';
import { loadHumanBase } from './helpers/humanBase';
import { buildHair, eyeball, faceColors, findFaceLandmarks, sculptFace } from '../utils/garment3d/head-features';

const human = loadHumanBase();
const base = { ...human, raw: { indices: human.indices } };

const fit = (templateId: string, measurements: Record<string, number> = {}) => {
  const body = readBodyMeasurements(measurements, templateId);
  const rings = buildTorsoRings(body);
  return { body, rings, result: fitHumanBody(base, body, rings, morphFor(body, templateId)) };
};

describe('human body fit', () => {
  it('ships the CC0 base mesh with its morphs', () => {
    expect(base.positions.length / 3).toBeGreaterThan(10000);
    expect(Object.keys(base.morphs)).toEqual(expect.arrayContaining(['gender', 'childFemale', 'femaleHeavy']));
  });

  it('matches the stature of the template', () => {
    for (const id of ['FEMME_STANDARD', 'HOMME_ATHLETIQUE', 'ENFANT_10_ANS']) {
      const { body, result } = fit(id);
      let top = 0;
      for (let i = 1; i < result.positions.length; i += 3) top = Math.max(top, result.positions[i]!);
      expect(top).toBeGreaterThan(body.height * 0.97);
      expect(top).toBeLessThan(body.height * 1.06);
    }
  });

  it.each(['FEMME_STANDARD', 'FEMME_RONDE', 'HOMME_STANDARD'])('brings bust, waist and hip within 5 %% of the measured girths (%s)', (id) => {
    const { body, result } = fit(id);
    for (const key of ['bust', 'waist', 'hip'] as const) {
      expect(result.circumferences[key] / body[key]).toBeGreaterThan(0.95);
      expect(result.circumferences[key] / body[key]).toBeLessThan(1.05);
    }
  });

  it('puts the shoulder joints at the measured shoulder width, keeping the arms attached', () => {
    const { body, result } = fit('FEMME_STANDARD', { LARGEUR_EPAULE: 13, TOUR_COU: 35 });
    const l = bodyLandmarks(body);
    const joint = findJoint(result.positions, base.armWeights, l.shoulderY, body.height / 1.7);
    expect(joint).not.toBeNull();
    // The hinge sits JOINT_INSET inside the shoulder seam point (the deltoid lies beyond it).
    const s = body.height / 1.7;
    expect(Math.abs(joint!.x - (body.shoulderWidth / 2 - JOINT_INSET * s))).toBeLessThan(0.015);
  });

  it('drapes a dress over the fitted body: no skin through the bodice, sleeves along the arms', () => {
    const measurements = { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 };
    const closed = (pts: Array<[number, number]>) => [...pts, pts[0]!].map(([x, y]) => ({ x, y }));
    const piece = (id: string, name: string, pts: Array<[number, number]>, quantity: number) => ({
      id,
      versionId: 'v',
      name,
      dimensionsJson: { outlineMm: closed(pts) },
      fabricRecommendation: null,
      quantity,
      grainlineJson: null,
      seamAllowanceCm: 1,
      notchesJson: [],
    });
    const built = buildGarmentModel(
      [
        piece('cd', 'Corsage Devant', [[0, 0], [80, 0], [200, 50], [240, 242], [195, 440], [0, 440]], 1),
        piece('cdos', 'Corsage Dos', [[0, 0], [75, 0], [190, 45], [210, 220], [165, 400], [0, 400]], 2),
        piece('m', 'Manche', [[0, 150], [137, 0], [275, 150], [250, 580], [25, 580]], 2),
      ],
      'ROBE',
      measurements,
    );
    if (!built.ok) throw new Error(built.reason);
    const { body, rings, result } = fit('FEMME_STANDARD', measurements);
    const env = envelopeFromMesh(result.positions, base.raw.indices, base.armWeights, body);
    const panels = drapeGarment(built.model.layout, body, env);
    const l = bodyLandmarks(body);
    expect(rings.length).toBeGreaterThan(0);

    // Every torso skin vertex between the waist and the bust is inside the bodice ring at its height.
    const garment = panels.filter((p) => p.zone === 'bodice').flatMap((p) => {
      const out: Array<{ y: number; a: number; r: number }> = [];
      for (let i = 0; i < p.positions.length; i += 3) {
        const x = p.positions[i]!;
        const z = p.positions[i + 2]! - env.axisZ;
        out.push({ y: p.positions[i + 1]!, a: Math.atan2(x, z), r: Math.hypot(x, z) });
      }
      return out;
    });
    let checked = 0;
    let through = 0;
    for (let i = 0; i < base.armWeights.length; i += 7) {
      const y = result.positions[i * 3 + 1]!;
      if (base.armWeights[i]! >= 0.5 || y < l.waistY + 0.03 || y > l.bustY) continue;
      const x = result.positions[i * 3]!;
      const z = result.positions[i * 3 + 2]! - env.axisZ;
      const a = Math.atan2(x, z);
      const near = garment.filter((g) => Math.abs(g.y - y) < 0.006 && Math.abs(g.a - a) < 0.1);
      if (near.length === 0) continue;
      checked += 1;
      if (Math.max(...near.map((g) => g.r)) < Math.hypot(x, z) - 0.003) through += 1;
    }
    expect(checked).toBeGreaterThan(50);
    expect(through / checked).toBeLessThan(0.02);

    // The left sleeve's centre is close to the left arm's centre.
    const sleeve = panels.find((p) => p.zone === 'sleeve' && p.id.endsWith('-1') && !p.id.endsWith('--1'))!;
    const mean = (arr: Float32Array, k: number) => {
      let sum = 0;
      for (let i = k; i < arr.length; i += 3) sum += arr[i]!;
      return sum / (arr.length / 3);
    };
    expect(mean(sleeve.positions, 0)).toBeGreaterThan(0.15);
    expect(mean(sleeve.positions, 1)).toBeLessThan(l.shoulderY);
  });

  it('follows the measurements: a larger waist gives a larger body', () => {
    const slim = fit('FEMME_STANDARD', { TOUR_TAILLE: 62 }).result.circumferences.waist;
    const wide = fit('FEMME_STANDARD', { TOUR_TAILLE: 90 }).result.circumferences.waist;
    expect(wide).toBeGreaterThan(slim * 1.15);
  });

  it.each(['FEMME_STANDARD', 'HOMME_STANDARD', 'FEMME_RONDE', 'ENFANT_10_ANS'])(
    'does not tear the mesh (%s): (almost) no edge stretched far beyond its scanned length',
    (id) => {
      const { result } = fit(id);
      const { positions } = result;
      const idx = base.raw.indices;
      let torn = 0;
      const len = (a: Float32Array, i: number, j: number) =>
        Math.hypot(a[i * 3]! - a[j * 3]!, a[i * 3 + 1]! - a[j * 3 + 1]!, a[i * 3 + 2]! - a[j * 3 + 2]!);
      for (let t = 0; t < idx.length; t += 3) {
        for (const [u, v] of [[0, 1], [1, 2], [2, 0]] as const) {
          const i = idx[t + u]!;
          const j = idx[t + v]!;
          // The stature alone stretches an edge by at most ~1.4x (child ↔ adult morphs excluded): 2.2x is a tear.
          if (len(positions, i, j) > 2.2 * len(base.positions, i, j) + 0.01) torn += 1;
        }
      }
      expect(torn).toBeLessThan(20); // a handful of seam edges at most, out of ~80 000
    },
  );

  it.each([
    ['FEMME_STANDARD', 0],
    ['HOMME_STANDARD', 1],
  ] as const)('stands in the reference pose (%s): knees and hands at the measured distances, legs apart', (id, g) => {
    const { body, result } = fit(id);
    const p = result.positions;
    const kneeY = 0.285 * body.height;
    let kneeMin = Infinity;
    let kneeMax = -Infinity;
    let handX = 0;
    let handCount = 0;
    let innerAnkle = Infinity;
    for (let i = 0; i < base.armWeights.length; i += 1) {
      const x = p[i * 3]!;
      const y = p[i * 3 + 1]!;
      if (x > 0 && base.armWeights[i]! < 0.05 && Math.abs(y - kneeY) < 0.01) {
        kneeMin = Math.min(kneeMin, x);
        kneeMax = Math.max(kneeMax, x);
      }
      if (x > 0 && base.armWeights[i]! < 0.05 && y < 0.08) innerAnkle = Math.min(innerAnkle, x);
      if (x > 0 && base.armWeights[i]! > 0.95 && y < 0.62 * body.height) {
        handX += x;
        handCount += 1;
      }
    }
    expect(Math.abs((kneeMin + kneeMax) / 2 - POSE.knee[g] * body.height)).toBeLessThan(0.02);
    expect(Math.abs(handX / handCount - POSE.hand[g] * body.height)).toBeLessThan(0.06);
    expect(innerAnkle).toBeGreaterThan(0); // the feet never cross the midline
  });

  it('keeps both feet on the floor', () => {
    const { result } = fit('HOMME_STANDARD');
    let lowest = Infinity;
    for (let i = 1; i < result.positions.length; i += 3) lowest = Math.min(lowest, result.positions[i]!);
    expect(Math.abs(lowest)).toBeLessThan(0.02);
  });

  it('finds the face: eyes on both sides above the nose, the mouth under it', () => {
    const { body, result } = fit('FEMME_STANDARD');
    const face = findFaceLandmarks(result.positions, base.armWeights, body, base.indices);
    expect(face).not.toBeNull();
    const f = face!;
    expect(f.eye.x).toBeGreaterThan(0.022);
    expect(f.eye.x).toBeLessThan(0.042);
    expect(f.eye.y).toBeGreaterThan(f.noseTip.y + 0.015);
    expect(f.mouth.y).toBeLessThan(f.noseTip.y - 0.015);
    expect(f.top - f.mouth.y).toBeLessThan(0.25);
    // The eyeball sits behind the lid rim, inside the head.
    const ball = eyeball(f, body);
    expect(ball.centre.z + ball.radius).toBeLessThan(f.rimZ);
    expect(ball.radius).toBeGreaterThan(0.009);
    // The opening read on the lids: a fissure ~2 cm wide and well under 1.5 cm high.
    expect(f.eyeHalf.w).toBeGreaterThan(0.007);
    expect(f.eyeHalf.w).toBeLessThan(0.016);
    expect(f.eyeHalf.h).toBeGreaterThan(0.002);
    expect(f.eyeHalf.h).toBeLessThan(f.eyeHalf.w);
  });

  it('sculpts fuller lips and opens the eyes a little', () => {
    const { body, result } = fit('FEMME_STANDARD');
    const f = findFaceLandmarks(result.positions, base.armWeights, body, base.indices)!;
    const { positions, face } = sculptFace(result.positions, f, body);
    expect(face.eyeHalf.h).toBeGreaterThan(f.eyeHalf.h);
    let lipForward = 0;
    let moved = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const dz = positions[i + 2]! - result.positions[i + 2]!;
      const dy = positions[i + 1]! - result.positions[i + 1]!;
      if (Math.abs(result.positions[i]!) < 0.01 && Math.abs(result.positions[i + 1]! - (f.mouth.y + 0.0045)) < 0.002 && result.positions[i + 2]! > f.skull.z) {
        lipForward = Math.max(lipForward, dz);
      }
      // Far from the face (hands, feet, back), nothing moves.
      if (result.positions[i + 1]! < f.mouth.y - 0.1 && (dz !== 0 || dy !== 0)) moved += 1;
    }
    expect(lipForward).toBeGreaterThan(0.001);
    expect(moved).toBe(0);
  });

  it('colours lips warmer than the cheeks, in linear RGB for every vertex', () => {
    const { body, result } = fit('FEMME_STANDARD');
    const f = findFaceLandmarks(result.positions, base.armWeights, body)!;
    const colors = faceColors(result.positions, f, body.skin, '#3a2a1f', body);
    expect(colors.length).toBe(result.positions.length);
    const nearest = (x: number, y: number) => {
      let best = 0;
      let d = Infinity;
      for (let i = 0; i < result.positions.length; i += 3) {
        if (result.positions[i + 2]! < f.skull.z) continue;
        const e = Math.hypot(result.positions[i]! - x, result.positions[i + 1]! - y);
        if (e < d) {
          d = e;
          best = i;
        }
      }
      return best;
    };
    const lip = nearest(0, f.mouth.y - 0.003);
    const cheek = nearest(0.055, f.mouth.y + 0.02);
    // Redder: more red than green relative to the cheek.
    expect(colors[lip]! / colors[lip + 1]!).toBeGreaterThan(colors[cheek]! / colors[cheek + 1]!);
    // A man's stubble darkens the chin, not the forehead.
    const bearded = faceColors(result.positions, f, body.skin, '#3a2a1f', body, true);
    const chin = nearest(0, f.mouth.y - 0.03);
    const forehead = nearest(0, f.eye.y + 0.035);
    expect(bearded[chin]!).toBeLessThan(colors[chin]! * 0.95);
    expect(bearded[forehead]!).toBeCloseTo(colors[forehead]!, 6);
  });

  it.each([
    ['FEMME_STANDARD', 'long'],
    ['HOMME_STANDARD', 'short'],
  ] as const)('grows hair (%s, %s) over the skull, never over the face', (id, style) => {
    const { body, result } = fit(id);
    const f = findFaceLandmarks(result.positions, base.armWeights, body, base.indices)!;
    const hair = buildHair(result.positions, base.armWeights, body, f, style);
    expect(hair.indices.length).toBeGreaterThan(1000);
    const count = hair.positions.length / 3;
    expect(hair.uvs.length / 2).toBe(count);
    expect(hair.shade.length).toBe(count);
    expect(hair.alpha.length).toBe(count);
    let lowest = Infinity;
    for (let i = 0; i < hair.positions.length; i += 3) {
      // Cut by the alpha test (the scalp layer's edge): not drawn.
      if (hair.alpha[i / 3]! < 0.5) continue;
      const x = hair.positions[i]!;
      const y = hair.positions[i + 1]!;
      const z = hair.positions[i + 2]!;
      lowest = Math.min(lowest, y);
      // Nothing in front of the eyes, the nose or the mouth.
      if (Math.abs(x) < 0.05 && z > f.skull.z + 0.04) expect(y).toBeGreaterThan(f.eye.y + 0.02);
    }
    if (style === 'long') expect(lowest).toBeLessThan(f.mouth.y - 0.08); // to the shoulders
    else expect(lowest).toBeGreaterThan(bodyLandmarks(body).napeY); // short cut: above the nape
  });

  it('gives a child a relatively larger head than an adult', () => {
    const headShare = (id: string) => {
      const { body, result } = fit(id);
      const f = findFaceLandmarks(result.positions, base.armWeights, body)!;
      return (f.top - f.mouth.y) / body.height;
    };
    expect(headShare('ENFANT_GARCON')).toBeGreaterThan(headShare('HOMME_STANDARD') * 1.1);
    expect(headShare('ENFANT_10_ANS')).toBeGreaterThan(headShare('FEMME_STANDARD') * 1.1);
  });

  it('picks gender, weight and age morphs from the template and the waist', () => {
    const woman = morphFor(readBodyMeasurements({}, 'FEMME_STANDARD'), 'FEMME_STANDARD');
    const man = morphFor(readBodyMeasurements({}, 'HOMME_ATHLETIQUE'), 'HOMME_ATHLETIQUE');
    const child = morphFor(readBodyMeasurements({}, 'ENFANT_10_ANS'), 'ENFANT_10_ANS');
    const boy = morphFor(readBodyMeasurements({}, 'ENFANT_GARCON'), 'ENFANT_GARCON');
    expect(boy.age).toBe(1);
    expect(boy.gender).toBeGreaterThan(child.gender); // children: less dimorphic, still a boy and a girl
    expect(woman.gender).toBe(0);
    expect(man.gender).toBe(1);
    expect(man.muscle).toBeGreaterThan(woman.muscle);
    const strong = morphFor(readBodyMeasurements({}, 'HOMME_COSTAUD'), 'HOMME_COSTAUD');
    expect(strong.gender).toBe(1);
    expect(strong.muscle).toBeGreaterThan(man.muscle);
    expect(child.age).toBe(1);
    expect(woman.age).toBe(0);
  });
});
