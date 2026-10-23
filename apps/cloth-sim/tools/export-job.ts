/**
 * Phase 1 prototype — writes a cloth-sim job (JSON) from a pattern version dump.
 *
 * The garment starts from the geometric drape of the 3D preview (same code as the viewer: fitted human
 * body, pose, envelope, drapeGarment), so Blender only has to let the cloth settle. The pieces' geometry
 * still comes from packages/pattern-engine (CLAUDE.md rules 18–19): nothing here draws a piece.
 *
 * The garment is draped on the body in a dressing pose, arms a little away from the torso (DRESS_POSE): in a pose with
 * the arms close to the body (PRESENTATION brings them 20° in), the inner side of the sleeve starts inside the torso and
 * the solver pushes it out through the arm. Blender then moves the body from the dressing pose to the requested one
 * (`targetBody`) while the cloth follows, as a mannequin is dressed arms out then posed.
 *
 * Usage: tsx apps/cloth-sim/tools/export-job.ts <version.json> <job.json> [POSE]
 * where version.json = { garmentType, measurements, fabricBehavior, pieces: PatternPieceDto[] }.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { PatternPieceDto } from '@angaly/types';
import { envelopeFromMesh } from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/body-envelope';
import { suggestTemplate } from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/body-templates';
import { buildGarmentModel, drapeGarment } from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/human-body';
import { buildHair, eyeball, faceColors, findFaceLandmarks, sculptFace } from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/head-features';
import {
  applyPose,
  forearmMask,
  isNeutral,
  POSE_PRESETS,
  type BodyPose,
  type PosePresetId,
} from '../../web/src/features/pattern-studio-preview-validation-export/utils/garment3d/pose';
import { loadHumanBase } from '../../web/src/features/pattern-studio-preview-validation-export/__tests__/helpers/humanBase';

interface VersionDump {
  versionId?: string;
  garmentType: string;
  measurements: Record<string, number> | null;
  fabricBehavior?: string | null;
  /** The fabric read off the photo (`GarmentFit`): colours, prints, finish — what the render dresses the cloth in. */
  fit?: Record<string, unknown> | null;
  pieces: PatternPieceDto[];
}

/** Rounded to 0.1 mm: keeps the job small without moving anything visibly. */
const round = (values: ArrayLike<number>, digits = 4): number[] => Array.from(values, (v) => Number(v.toFixed(digits)));

/** Dressing pose: arms 15° out from the mesh's rest pose, elbows straight, legs at rest. */
const ARM_OUT = { raise: 15, forward: 0, twist: 0, bend: 0 };
const DRESS_POSE: BodyPose = { ...POSE_PRESETS.NEUTRE.pose, leftArm: ARM_OUT, rightArm: ARM_OUT };

/**
 * Room (m) kept between the upper arm and the torso: a sleeve and the bodice's side are two layers of cloth there. In
 * PRESENTATION the upper arm comes within 4 mm of the side; the cloth squeezed between two colliders is pushed out
 * through the arm and the sleeve slides off it.
 */
const ARM_CLEARANCE = 0.025;
const RAISE_STEP = 2.5;

/**
 * Distance from the upper half of the arms (arm weight ≥ 0.9) to the torso (arm weight ≤ 0.05), at its 5th percentile:
 * the armpit, where the arm joins the torso, is always close; what matters is the side of the arm along the torso.
 */
const armToTorso = (positions: Float32Array, armWeights: Float32Array): number => {
  const arm: number[] = [];
  const torso: number[] = [];
  for (let v = 0; v < armWeights.length; v += 1) {
    if (armWeights[v]! >= 0.9) arm.push(v);
    else if (armWeights[v]! <= 0.05) torso.push(v);
  }
  const ys = arm.map((v) => positions[v * 3 + 1]!).sort((a, b) => a - b);
  const midY = ys[Math.floor(ys.length / 2)] ?? 0;
  const gaps: number[] = [];
  for (const a of arm) {
    if (positions[a * 3 + 1]! < midY) continue;
    let best = Infinity;
    for (const t of torso) {
      const d = Math.hypot(positions[a * 3]! - positions[t * 3]!, positions[a * 3 + 1]! - positions[t * 3 + 1]!, positions[a * 3 + 2]! - positions[t * 3 + 2]!);
      if (d < best) best = d;
    }
    gaps.push(best);
  }
  gaps.sort((x, y) => x - y);
  return gaps[Math.floor(gaps.length * 0.05)] ?? Infinity;
};

/** The look fields of a `GarmentFit` (colours, prints, finish, motif size): nothing else goes to the render. */
const LOOK_KEYS = ['fabricColor', 'fabricPrint', 'motifColor', 'motifSizeCm', 'contrastColor', 'contrastPrint', 'contrastMotifColor', 'accentPrint', 'fabricFinish'];
const lookOf = (fit: Record<string, unknown> | null | undefined): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fit ?? {}).filter(([k, v]) => LOOK_KEYS.includes(k) && v !== null && v !== undefined));

const [input, output, poseArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: export-job.ts <version.json> <job.json> [NEUTRE|PRESENTATION|MIROIR]');
  process.exit(1);
}
const dump = JSON.parse(readFileSync(input, 'utf8')) as VersionDump;
const poseId = (poseArg ?? 'PRESENTATION') as PosePresetId;
const pose = POSE_PRESETS[poseId].pose;

const templateId = suggestTemplate(dump.measurements);
const built = buildGarmentModel(dump.pieces, dump.garmentType, dump.measurements, templateId, dump.fabricBehavior ?? null);
if (!built.ok) throw new Error(built.reason);
const { model } = built;

const human = loadHumanBase();
const fitted = fitHumanBody(human, model.body, model.torsoRings, morphFor(model.body, model.templateId));
// The head as the viewer shows it (Garment3DViewer `Person`): the face sculpted, skin colours (lips, brows, lash
// line), eyeballs and, for a woman, the high bun. The arms move with the pose, the head never does.
const HAIR_COLOR = '#4a3324';
const landmarks = findFaceLandmarks(fitted.positions, human.armWeights, model.body, human.indices);
const sculpted = landmarks ? sculptFace(fitted.positions, landmarks, model.body) : { positions: fitted.positions, face: null };
const rest = sculpted.positions;
const face = sculpted.face;
const woman = model.templateId.startsWith('FEMME');
const hairStyle = model.templateId.startsWith('HOMME') || model.templateId === 'ENFANT_GARCON' ? 'short' : woman ? 'bun' : 'long';
const head = face
  ? (() => {
      const hair = buildHair(rest, human.armWeights, model.body, face, hairStyle);
      const ball = eyeball(face, model.body);
      return {
        /** Linear RGB per body vertex. */
        skinColors: round(faceColors(rest, face, model.body.skin, HAIR_COLOR, model.body, model.templateId.startsWith('HOMME')), 4),
        hairColor: HAIR_COLOR,
        hair: { positions: round(hair.positions), indices: Array.from(hair.indices), uvs: round(hair.uvs), shade: round(hair.shade, 3), alpha: round(hair.alpha, 3) },
        eyes: { radius: Number(ball.radius.toFixed(5)), centre: [ball.centre.x, ball.centre.y, ball.centre.z].map((v) => Number(v.toFixed(5))) },
      };
    })()
  : null;
const posedFor = (p: BodyPose): Float32Array => (isNeutral(p) ? rest : applyPose(rest, human.armWeights, model.body, p));
const dressed = posedFor(DRESS_POSE);
// The requested pose, arms opened step by step (never beyond the dressing pose) until the sleeves have room.
let simPose: BodyPose = pose;
let posed = posedFor(simPose);
while (
  armToTorso(posed, human.armWeights) < ARM_CLEARANCE &&
  (simPose.leftArm.raise < ARM_OUT.raise || simPose.rightArm.raise < ARM_OUT.raise)
) {
  const open = (arm: BodyPose['leftArm']) => ({ ...arm, raise: Math.min(ARM_OUT.raise, arm.raise + RAISE_STEP) });
  simPose = { ...simPose, leftArm: open(simPose.leftArm), rightArm: open(simPose.rightArm) };
  posed = posedFor(simPose);
}
const env = envelopeFromMesh(dressed, human.indices, human.armWeights, model.body, forearmMask(rest, human.armWeights, model.body));
const panels = drapeGarment(model.layout, model.body, env, {});

const job = {
  version: 1,
  units: 'm',
  source: { versionId: dump.versionId ?? null, garmentType: dump.garmentType, templateId: model.templateId },
  pose: poseId,
  dressPose: DRESS_POSE,
  /** The pose actually simulated: the requested one, arms opened for the sleeves (the viewer must use this one). */
  simPose,
  armClearance: Number(armToTorso(posed, human.armWeights).toFixed(4)),
  fabric: { behavior: dump.fabricBehavior ?? null },
  look: lookOf(dump.fit),
  body: { positions: round(dressed), indices: Array.from(human.indices), armWeights: round(human.armWeights, 3) },
  targetBody: { positions: round(posed) },
  ...(head ? { head } : {}),
  panels: panels.map((p) => ({
    id: p.id,
    label: p.label,
    role: p.role,
    zone: p.zone,
    pieceIds: p.pieceIds,
    positions: round(p.positions),
    indices: Array.from(p.indices),
    uvs: round(p.uvs),
    ...(p.accent ? { accent: Array.from(p.accent) } : {}),
    // A detail drawn as a motif (embroidery, smocking) and its thread colour: the render draws it like the preview.
    ...(p.motif ? { motif: p.motif } : {}),
    ...(p.motif && p.trimColor ? { trimColor: p.trimColor } : {}),
  })),
};
writeFileSync(output, JSON.stringify(job));
const verts = panels.reduce((n, p) => n + p.positions.length / 3, 0);
console.log(
  `${panels.length} panels, ${verts} cloth vertices, body ${posed.length / 3} vertices (dressed, then ${poseId}, arms raise ${simPose.leftArm.raise}°/${simPose.rightArm.raise}°) → ${output}`,
);
