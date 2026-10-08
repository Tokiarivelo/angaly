import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { buildHairShell, fitHumanBody, morphFor, type HumanBaseData } from '../utils/garment3d/human-body';

/** Reads the real asset (public/models/human-base.glb) so the fit is tested on the actual mesh. */
const loadBase = (): HumanBaseData & { raw: { indices: Uint32Array } } => {
  const buf = readFileSync(resolve(__dirname, '../../../../public/models/human-base.glb'));
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString()) as {
    accessors: Array<{ bufferView: number }>;
    bufferViews: Array<{ byteOffset: number; byteLength: number }>;
    meshes: Array<{ primitives: Array<{ attributes: { POSITION: number }; indices: number; targets: Array<{ POSITION: number }> }>; extras: Record<string, never> }>;
  };
  const bin = buf.subarray(20 + jsonLength + 8);
  const slice = (accessor: number): ArrayBuffer => {
    const view = json.bufferViews[json.accessors[accessor]!.bufferView]!;
    return bin.buffer.slice(bin.byteOffset + view.byteOffset, bin.byteOffset + view.byteOffset + view.byteLength) as ArrayBuffer;
  };
  const mesh = json.meshes[0]!;
  const primitive = mesh.primitives[0]!;
  const extras = mesh.extras as unknown as {
    morphNames: string[];
    armWeights: number[];
    landmarksFemale: number[];
    landmarksMale: number[];
    landmarksFemaleChild: number[];
    landmarksMaleChild: number[];
  };
  const morphs: Record<string, Float32Array> = {};
  extras.morphNames.forEach((name, i) => {
    morphs[name] = new Float32Array(slice(primitive.targets[i]!.POSITION));
  });
  const indices = new Uint32Array(slice(primitive.indices));
  return {
    positions: new Float32Array(slice(primitive.attributes.POSITION)),
    indices,
    morphs,
    armWeights: Float32Array.from(extras.armWeights),
    landmarksFemale: extras.landmarksFemale,
    landmarksMale: extras.landmarksMale,
    landmarksFemaleChild: extras.landmarksFemaleChild,
    landmarksMaleChild: extras.landmarksMaleChild,
    raw: { indices },
  };
};

const base = loadBase();

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

  it('brings bust, waist and hip close to the measured girths (never wider than the garment ellipse)', () => {
    const { body, result } = fit('FEMME_STANDARD', { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 100 });
    expect(result.circumferences.waist).toBeGreaterThan(0.6);
    expect(result.circumferences.waist).toBeLessThan(body.waist * 1.08);
    expect(result.circumferences.hip).toBeLessThan(body.hip * 1.08);
    expect(result.circumferences.bust).toBeLessThan(body.bust * 1.08);
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

  it('keeps both feet on the floor', () => {
    const { result } = fit('HOMME_STANDARD');
    let lowest = Infinity;
    for (let i = 1; i < result.positions.length; i += 3) lowest = Math.min(lowest, result.positions[i]!);
    expect(Math.abs(lowest)).toBeLessThan(0.02);
  });

  it('builds a hair cap on the skull only (no hair below the neck line)', () => {
    const { body, result } = fit('FEMME_STANDARD');
    const hair = buildHairShell(result.positions, base.raw.indices, body);
    expect(hair.indices.length).toBeGreaterThan(300);
    let lowest = Infinity;
    for (const i of hair.indices) lowest = Math.min(lowest, hair.positions[i * 3 + 1]!);
    expect(lowest).toBeGreaterThan(body.height * 0.8);
  });

  it('picks gender, weight and age morphs from the template and the waist', () => {
    const woman = morphFor(readBodyMeasurements({}, 'FEMME_STANDARD'), 'FEMME_STANDARD');
    const man = morphFor(readBodyMeasurements({}, 'HOMME_ATHLETIQUE'), 'HOMME_ATHLETIQUE');
    const child = morphFor(readBodyMeasurements({}, 'ENFANT_10_ANS'), 'ENFANT_10_ANS');
    expect(woman.gender).toBe(0);
    expect(man.gender).toBe(1);
    expect(man.muscle).toBeGreaterThan(woman.muscle);
    expect(child.age).toBe(1);
    expect(woman.age).toBe(0);
  });
});
