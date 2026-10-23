import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { envelopeFromMesh, type BodyEnvelope } from '../utils/garment3d/body-envelope';
import { suggestTemplate } from '../utils/garment3d/body-templates';
import { buildGarmentModel, drapeGarment, skirtSurface, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, forearmMask, handCentres, POSE_PRESETS, seatHandsOnSkirt } from '../utils/garment3d/pose';
import { loopSubdivide } from '../utils/garment3d/subdivide';
import { loadHumanBase } from './helpers/humanBase';

const human = loadHumanBase();
const meas = { TOUR_COU: 36, CARRURE_DOS: 37, TOUR_BASSIN: 98, TOUR_TAILLE: 74, LONGUEUR_DOS: 42, TOUR_POITRINE: 92 };
const pieces = (JSON.parse(readFileSync(join(__dirname, 'fixtures/robe-v2-1890.pieces.json'), 'utf8')) as { pieces: PatternPieceDto[] }).pieces;

/**
 * Skin of the shoulders by the neck (above the armpit, 3–14 cm out) facing a camera along `view` that no cloth hides
 * from it, as "x,y,z" (z from the torso axis).
 */
const bare = (P: Float32Array, I: Uint32Array, cloth: PanelMeshData[], env: BodyEnvelope, napeY: number, view: number[]): string[] => {
  const tris: number[][] = [];
  for (const p of cloth) { if (p.zone === 'beads' || p.zone === 'lace') continue; for (let i = 0; i < p.indices.length; i += 3) tris.push([0, 1, 2].flatMap((k) => [0, 1, 2].map((c) => p.positions[p.indices[i + k]! * 3 + c]!))); }
  const n = new Float32Array(P.length);
  for (let i = 0; i < I.length; i += 3) {
    const [a, b, c] = [I[i]! * 3, I[i + 1]! * 3, I[i + 2]! * 3];
    const u = [0, 1, 2].map((k) => P[b + k]! - P[a + k]!); const v = [0, 1, 2].map((k) => P[c + k]! - P[a + k]!);
    const cr = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    for (const o of [a, b, c]) for (let k = 0; k < 3; k += 1) n[o + k] = n[o + k]! + cr[k]!;
  }
  // Möller–Trumbore: does the ray from o along d meet a cloth triangle (from 1 mm under the skin out to 30 cm)?
  const hit = (o: number[], d: number[]): boolean => tris.some((t) => {
    const e1 = [t[3]! - t[0]!, t[4]! - t[1]!, t[5]! - t[2]!]; const e2 = [t[6]! - t[0]!, t[7]! - t[1]!, t[8]! - t[2]!];
    const pv = [d[1]! * e2[2]! - d[2]! * e2[1]!, d[2]! * e2[0]! - d[0]! * e2[2]!, d[0]! * e2[1]! - d[1]! * e2[0]!];
    const det = e1[0]! * pv[0]! + e1[1]! * pv[1]! + e1[2]! * pv[2]!; if (Math.abs(det) < 1e-12) return false;
    const tv = [o[0]! - t[0]!, o[1]! - t[1]!, o[2]! - t[2]!]; const u = (tv[0]! * pv[0]! + tv[1]! * pv[1]! + tv[2]! * pv[2]!) / det; if (u < 0 || u > 1) return false;
    const q = [tv[1]! * e1[2]! - tv[2]! * e1[1]!, tv[2]! * e1[0]! - tv[0]! * e1[2]!, tv[0]! * e1[1]! - tv[1]! * e1[0]!];
    const v = (d[0]! * q[0]! + d[1]! * q[1]! + d[2]! * q[2]!) / det; if (v < 0 || u + v > 1) return false;
    const s = (e2[0]! * q[0]! + e2[1]! * q[1]! + e2[2]! * q[2]!) / det; return s > -0.001 && s < 0.3;
  });
  const out: string[] = [];
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i]!; const y = P[i + 1]!;
    if (Math.abs(x) < 0.03 || Math.abs(x) > 0.14 || y < env.armpitY || y > napeY + 0.01) continue;
    if (n[i]! * view[0]! + n[i + 1]! * view[1]! + n[i + 2]! * view[2]! <= 0) continue;
    if (!hit([x, y, P[i + 2]!], view)) out.push([x, y, P[i + 2]! - env.axisZ].map((c) => c.toFixed(3)).join(','));
  }
  return out;
};

// The 1890s coat-dress (v2) exactly as the 3D viewer shows it: the version's measurements, the silhouette suggested
// from them, the fashion-plate pose with the hands seated on the skirt, and the skin smoothed by one subdivision.
const templateId = suggestTemplate(meas);
const built = buildGarmentModel(pieces, 'ROBE', meas, templateId, 'STRUCTURE', null);
if (!built.ok) throw new Error(built.reason);
const model = built.model;
const fitted = fitHumanBody(human, model.body, model.torsoRings, morphFor(model.body, model.templateId));
const forearm = forearmMask(fitted.positions, human.armWeights, model.body);
const restEnv = envelopeFromMesh(fitted.positions, human.indices, human.armWeights, model.body, forearm);
const pose = seatHandsOnSkirt(
  POSE_PRESETS.PRESENTATION.pose,
  fitted.positions,
  human.armWeights,
  model.body,
  skirtSurface(drapeGarment(model.layout, model.body, restEnv), restEnv.axisZ),
  restEnv.axisZ,
);
const posed = applyPose(fitted.positions, human.armWeights, model.body, pose);
const env = envelopeFromMesh(posed, human.indices, human.armWeights, model.body, forearm);
const panels = drapeGarment(model.layout, model.body, env, { hands: handCentres(fitted.positions, posed, human.armWeights, model.body), legsPosed: false });
const skin = loopSubdivide({ positions: posed, indices: human.indices });

describe('coat-dress v2 in the viewer, seen from behind', () => {
  it('shows no skin between the officer collar and the back on either side of the nape', () => {
    // The « Dos » view looks from 0.88 m up and 3.3 m behind: from under the nape, then from level and from above.
    // Before: 10, 18 and 2 skin points showed there (the back's neck point 1.5–3 cm out from the front's, and the
    // collar's foot stopped on the coat front's narrow top running round to the neck point).
    expect(templateId).toBe('FEMME_SABLIER');
    for (const view of [[0, -0.17, -0.985], [0, 0, -1], [0, -0.35, -0.937]]) {
      expect(bare(skin.positions, skin.indices, panels, env, model.body.napeY, view)).toEqual([]);
    }
  });
});
