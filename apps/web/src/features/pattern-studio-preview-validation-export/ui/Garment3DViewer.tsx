'use client';

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { AdaptiveDpr, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { drapeGarment, skirtSurface, SLEEVE_TILT, type GarmentModel, type PanelMeshData } from '../utils/garment3d/garment-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { loopSubdivide } from '../utils/garment3d/subdivide';
import { cavityOcclusion } from '../utils/garment3d/surface-shading';
import { defineMuscles } from '../utils/garment3d/muscle-definition';
import { loftRings } from '../utils/garment3d/body-model';
import { bodyLandmarks, bodyScale } from '../utils/garment3d/body-model';

import {
  createContouredLimbGeometry,
  createCoutureFootGeometry,
  createCoutureHandGeometry,
  createCoutureHeadGeometry,
  createHairGeometry,
} from '../utils/garment3d/mannequin-mesh';
import { ringAt } from '../utils/garment3d/body-model';
import { fitHumanBody, morphFor, type FitResult } from '../utils/garment3d/human-body';
import { buildHair, eyeball, faceColors, findFaceLandmarks, sculptFace, type HairStyle } from '../utils/garment3d/head-features';
import { accentMaterial, contrastMaterial, fabricMaterial, glow, laceAlphaMap, plastronMaterial, type Cloth, type FabricLook } from './fabricTextures';
import { embroideryMap, embroideryMaterialParameters, smockingMaps, threadColor } from './motifTextures';
import { isHexColor } from '@angaly/types';
import { applyPose, forearmMask, handCentres, isNeutral, seatHandsOnSkirt, type BodyPose } from '../utils/garment3d/pose';
import { eyeTexture, hairTexture } from './headTextures';
import { useHumanBase } from './useHumanBase';
import { SculptBrush, type SculptHandlers, type SculptViewProps } from './SculptBrush';
import { MeshEditLayer, type MeshEditViewProps, type ScreenBox } from './MeshEditLayer';
import { outlineInstances, type PointInstance } from '../utils/garment3d/mesh-edit';
import type { PatternPieceDto } from '@angaly/types';
import { garmentFrameOf } from '../utils/garment3d/photo-frame';
import { LIGHTING_PRESETS, dprRange, type LightingPresetName } from '../utils/studio3d/studio-config';
import { configureStudioRenderer } from '../utils/studio3d/studio-scene';
import { guardPerturbedNormal, withNormalGuard } from '../utils/studio3d/normal-guard';
import { useStudioQuality } from '../hooks/useStudioQuality';
import { StudioEnvironment } from './studio3d/StudioEnvironment';
import { StudioLights } from './studio3d/StudioLights';
import { ShadowFloor } from './studio3d/ShadowFloor';
import { StudioPost } from './studio3d/StudioPost';
import { StudioBackdrop } from './studio3d/StudioBackdrop';

interface Garment3DViewerProps {
  model: GarmentModel;
  /** 0 = panels exploded around the mannequin, 1 = assembled. */
  assembly: number;
  showMannequin: boolean;
  transparent: boolean;
  /** Hand tool: dragging with the left button / one finger moves the scene instead of rotating it. */
  panMode?: boolean;
  /** Highlights the panel(s) built from this pattern piece. */
  selectedPieceId: string | null;
  /** Snaps the camera to a preset view (numpad-style); a new `nonce` re-applies the same view. */
  viewRequest: ViewRequest | null;
  onContextLost?: (() => void) | undefined;
  /** Fabric read from the photo (print and colours); absent ⇒ technical zone colours. */
  fabric?: FabricLook | null | undefined;
  /** Joint angles of the human body (absent ⇒ standing, arms along the body). */
  pose?: BodyPose | undefined;
  /** Modelling the pattern on the garment: the left button drags the fabric instead of turning the view. */
  sculpt?: SculptViewProps | null | undefined;
  /** Edit mode: the pattern's points on the garment, selected and transformed one by one (Blender's Edit Mode). */
  edit?: MeshEditProps | null | undefined;
  /** Seam lines over the cloth (absent ⇒ shown in the technical colours, hidden over a real fabric unless modelling). */
  showSeams?: boolean | undefined;
  /** Told where the garment's front box lies on the canvas (px from its top left) whenever it moves: the photo is laid over it. */
  onGarmentScreenRect?: ((rect: ScreenRect | null) => void) | undefined;
  /** Studio light setup (softboxes, key light, shadow); `studio` by default. */
  lighting?: LightingPresetName | undefined;
}

/** A box on the 3D canvas, in CSS px from the canvas's top left corner. */
export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Projects the garment's front box (its widest x, its top and its hem, on the body's axis) through the camera after
 * each frame and reports it when it moved by half a pixel or more.
 */
const FrameReporter: React.FC<{ panels: PanelMeshData[]; onRect: (rect: ScreenRect | null) => void }> = ({ panels, onRect }) => {
  const frame = useMemo(() => garmentFrameOf(panels), [panels]);
  const last = useRef<ScreenRect | null>(null);
  const report = useRef(onRect);
  report.current = onRect;
  useEffect(() => () => report.current(null), []);
  useFrame(({ camera, size }) => {
    if (!frame) return;
    const corner = (x: number, y: number) => {
      const v = new THREE.Vector3(x, y, frame.axisZ).project(camera);
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    };
    const a = corner(frame.minX, frame.top);
    const c = corner(frame.maxX, frame.bottom);
    const rect = { left: Math.min(a.x, c.x), top: Math.min(a.y, c.y), right: Math.max(a.x, c.x), bottom: Math.max(a.y, c.y) };
    const prev = last.current;
    if (prev && Math.abs(prev.left - rect.left) < 0.5 && Math.abs(prev.top - rect.top) < 0.5 && Math.abs(prev.right - rect.right) < 0.5 && Math.abs(prev.bottom - rect.bottom) < 0.5) return;
    last.current = rect;
    report.current(rect);
  });
  return null;
};

export type MeshEditProps = Omit<MeshEditViewProps, 'instances'> & {
  /** The pieces the model was draped from (their outline points are shown). */
  pieces: PatternPieceDto[];
  /** The points as placed on the garment, for the keyboard operations (select all, G / S / R). */
  onInstances: (instances: PointInstance[]) => void;
};

export type ViewName = 'front' | 'back' | 'side' | 'top' | 'reset' | 'face';
export interface ViewRequest {
  view: ViewName;
  nonce: number;
}

const VIEW_DISTANCE = 3.3;
const VIEW_TARGET = new THREE.Vector3(0, 0.88, 0);
/** Close-up on the face (head height of a 1.70 m body), looking at the eyes. */
const FACE_TARGET = new THREE.Vector3(0, 1.58, 0.02);
const VIEW_POSITIONS: Record<ViewName, [number, number, number]> = {
  face: [0.12, 1.6, 0.85],
  front: [0, VIEW_TARGET.y, VIEW_DISTANCE],
  back: [0, VIEW_TARGET.y, -VIEW_DISTANCE],
  side: [VIEW_DISTANCE, VIEW_TARGET.y, 0],
  top: [0, VIEW_TARGET.y + VIEW_DISTANCE, 0.001],
  reset: [0, 1.0, VIEW_DISTANCE],
};

/**
 * Given to R3F as renderer props (R3F would otherwise put its ACES tone mapping back on re-render). Opaque canvas: the
 * cut-out hair writes an alpha below 1, which the post-processing turns into black holes on a transparent canvas.
 */
const GL_OPTIONS = { antialias: false, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping } as const;

const EXPLODE_DISTANCE = 0.3;
const ZONE_COLORS: Record<PanelMeshData['zone'], string> = {
  bodice: '#18375D',
  torso: '#18375D',
  skirt: '#0C2650',
  legs: '#061938',
  sleeve: '#1E4574',
  collar: '#102F55',
  plastron: '#E9DFC6',
  cord: '#B8975A',
  belt: '#102F55',
  cuff: '#1E4574',
  revers: '#18375D',
  lace: '#EFE2C2',
  beads: '#F3E7CC',
  detail: '#18375D',
};

/** Pocket bags: a pale cotton lining, whatever the garment's fabric. */
const LINING_COLOR = '#E6DCC8';

/** Disposes a geometry when it is replaced or the viewer unmounts (GPU memory). */
const useGeometry = (build: () => THREE.BufferGeometry, deps: React.DependencyList): THREE.BufferGeometry => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(build, deps);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
};

/** The canvas renders on demand only: every prop change asks for exactly one new frame. */
const Invalidator: React.FC<{ signal: unknown[] }> = ({ signal }) => {
  const invalidate = useThree((state) => state.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => invalidate(), signal);
  return null;
};

/** Applies a preset view to the camera and the (default) orbit controls. */
const CameraRig: React.FC<{ request: ViewRequest | null; stature: number }> = ({ request, stature }) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target: THREE.Vector3; update: () => void } | null;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!request) return;
    const [x, y, z] = VIEW_POSITIONS[request.view];
    // The face close-up follows the head height (a child's head is lower).
    const k = stature / 1.7;
    const target = request.view === 'face' ? new THREE.Vector3(0, FACE_TARGET.y * k, FACE_TARGET.z) : VIEW_TARGET;
    if (request.view === 'face') camera.position.set(x, y * k, z * Math.sqrt(k));
    else camera.position.set(x, y, z);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
    camera.lookAt(target);
    invalidate();
  }, [request, stature, camera, controls, invalidate]);

  return null;
};

const Torso: React.FC<{ model: GarmentModel }> = ({ model }) => {
  const skin = model.body.skin;

  const geometry = useGeometry(() => {
    const mesh = loftRings(model.torsoRings, 48);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    g.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [model.torsoRings]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
    </mesh>
  );
};

/** Anatomically contoured limb segment (arms, legs). */
const SculptedLimbMesh: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
  radiusTop: number;
  radiusBottom: number;
  limbType: 'upperArm' | 'forearm' | 'thigh' | 'calf' | 'neck';
  color: string;
}> = ({ from, to, radiusTop, radiusBottom, limbType, color }) => {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      length: direction.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
    };
  }, [from, to]);

  const geometry = useGeometry(
    () => createContouredLimbGeometry(radiusTop, radiusBottom, length, limbType),
    [radiusTop, radiusBottom, length, limbType],
  );

  return (
    <mesh position={position} quaternion={quaternion} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.0} />
    </mesh>
  );
};


const HAIR_COLOR = '#4a3324';

const smoothstep01 = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Women: the atelier's stylised face. */
const isWoman = (templateId: string): boolean => templateId.startsWith('FEMME');

/**
 * Hair style by morphology: a high bun for women, long wavy hair for girls, a short textured cut for men
 * and boys.
 */
const hairStyleFor = (templateId: string): HairStyle =>
  templateId.startsWith('HOMME') || templateId === 'ENFANT_GARCON' ? 'short' : isWoman(templateId) ? 'bun' : 'long';

/** Scanned-quality human body (CC0 MakeHuman mesh) fitted to the customer's measurements. */
const Person: React.FC<{
  model: GarmentModel;
  base: NonNullable<ReturnType<typeof useHumanBase>>;
  fit: FitResult;
}> = ({ model, base, fit }) => {
  const { body } = model;
  // The face, sculpted towards a portrait's (fuller lips, eyes a little more open); a woman's then
  // stylised like the atelier's reference bust (shorter lower face, V jaw, almond eyes).
  const sculpted = useMemo(() => {
    const found = findFaceLandmarks(fit.positions, base.armWeights, body, base.indices);
    if (!found) return { positions: fit.positions, face: null };
    // The stylised face (utils/garment3d/face-stylize.ts) is not plugged in yet: see docs/handoff.md.
    return sculptFace(fit.positions, found, body);
  }, [fit, base, body]);
  const face = sculpted.face;
  const geometry = useGeometry(() => {
    // One Loop subdivision: smooth joints and silhouette (the scan is ~26 k triangles, 105 k after).
    const subdivided = loopSubdivide({ positions: sculpted.positions, indices: base.indices });
    // Muscular builds: the relief of the pectorals and the abdominals (none for women and children).
    const tone = morphFor(body, model.templateId).muscle;
    const smooth = { ...subdivided, positions: defineMuscles(subdivided.positions, body, smoothstep01((tone - 0.5) / 0.5)) };
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(smooth.positions, 3));
    // Skin colours darkened in the creases and hollows: the relief reads under a soft studio light.
    const colors = faceColors(smooth.positions, face, body.skin, HAIR_COLOR, body, model.templateId.startsWith('HOMME'));
    const light = cavityOcclusion(smooth.positions, smooth.indices);
    for (let v = 0; v < light.length; v += 1) {
      colors[v * 3] = colors[v * 3]! * light[v]!;
      colors[v * 3 + 1] = colors[v * 3 + 1]! * light[v]!;
      colors[v * 3 + 2] = colors[v * 3 + 2]! * light[v]!;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setIndex(new THREE.BufferAttribute(smooth.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [sculpted, base, face, body, model.templateId]);
  const hairGeometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    if (!face) return g;
    // On the sculpted head: the locks framing the face hang outside the reshaped cheeks.
    const hair = buildHair(sculpted.positions, base.armWeights, body, face, hairStyleFor(model.templateId));
    g.setAttribute('position', new THREE.BufferAttribute(hair.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(hair.uvs, 2));
    // Light factor and coverage per vertex (RGBA): the alpha test cuts the scalp layer at the hairline.
    const shade = new Float32Array(hair.shade.length * 4);
    hair.shade.forEach((k, i) => {
      shade.fill(k, i * 4, i * 4 + 3);
      shade[i * 4 + 3] = hair.alpha[i]!;
    });
    g.setAttribute('color', new THREE.BufferAttribute(shade, 4));
    g.setIndex(new THREE.BufferAttribute(hair.indices, 1));
    g.computeVertexNormals();
    g.computeTangents();
    return g;
  }, [sculpted, base, body, face, model.templateId]);
  const hairMaps = useMemo(() => hairTexture(HAIR_COLOR), []);
  const eyeMap = useMemo(() => eyeTexture(), []);
  useEffect(
    () => () => {
      hairMaps?.dispose();
      eyeMap?.dispose();
    },
    [hairMaps, eyeMap],
  );
  const ball = face ? eyeball(face, body) : null;
  const eyeGeometry = useGeometry(() => {
    const r = ball?.radius ?? 0.012;
    const g = new THREE.SphereGeometry(r, 40, 24);
    g.rotateX(Math.PI / 2); // the texture's top pole (pupil) looks forward (+z)
    // The upper lid shades the top of the eyeball (vertex colours multiply the texture).
    const p = g.getAttribute('position');
    const shade = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i += 1) {
      const up = p.getY(i) / r;
      const k = 1 - 0.6 * Math.min(1, Math.max(0, (up - 0.05) / 0.6)) - 0.15 * Math.min(1, Math.max(0, (-up - 0.3) / 0.5));
      shade.fill(k, i * 3, i * 3 + 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(shade, 3));
    return g;
  }, [ball?.radius]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          userData={{ skin: true }}
          vertexColors
          roughness={0.55}
          metalness={0}
          sheen={0.4}
          sheenRoughness={0.6}
          sheenColor="#E8A98A"
          clearcoat={0.06}
          clearcoatRoughness={0.6}
        />
      </mesh>
      {ball &&
        [1, -1].map((side) => (
          <mesh key={side} geometry={eyeGeometry} position={[side * ball.centre.x, ball.centre.y, ball.centre.z]}>
            <meshPhysicalMaterial map={eyeMap} vertexColors roughness={0.35} clearcoat={0.7} clearcoatRoughness={0.06} />
          </mesh>
        ))}
      {face && hairMaps && (
        <>
          <mesh geometry={hairGeometry} castShadow>
            <meshPhysicalMaterial
              userData={{ hair: true }}
              map={hairMaps}
              vertexColors
              alphaTest={0.5}
              side={THREE.DoubleSide}
              roughness={0.58}
              anisotropy={0.45}
              anisotropyRotation={Math.PI / 2}
              sheen={0.35}
              sheenRoughness={0.5}
              sheenColor="#8a6a50"
            />
          </mesh>
        </>
      )}
    </group>
  );
};

const radiusOf = (circumference: number): number => circumference / (2 * Math.PI);

/** Real 3D person with anatomical proportions, lifelike facial planes, styled hair, and natural posture. */
const Mannequin: React.FC<{ model: GarmentModel }> = ({ model }) => {
  const { body } = model;
  const landmarks = bodyLandmarks(body);
  const s = bodyScale(body);
  const shoulder = ringAt(model.torsoRings, landmarks.shoulderY);
  const armEndY = landmarks.shoulderY - Math.cos(SLEEVE_TILT) * body.armLength;
  const armEndX = Math.sin(SLEEVE_TILT) * body.armLength;
  const elbow = 0.55; // fraction of arm length where forearm starts
  const legX = Math.max(0.088 * s, radiusOf(body.thigh) * 0.95);
  const kneeY = landmarks.kneeY;
  const skin = body.skin;
  const neckR = radiusOf(body.neck);
  const headY = landmarks.napeY + 0.08 * s + body.headRadius * 0.85;

  const headGeometry = useGeometry(() => createCoutureHeadGeometry(body.headRadius), [body.headRadius]);
  const hairGeometry = useGeometry(() => createHairGeometry(body.headRadius), [body.headRadius]);
  const footGeometry = useGeometry(() => createCoutureFootGeometry(s), [s]);
  const leftHandGeometry = useGeometry(() => createCoutureHandGeometry(s, 1), [s]);
  const rightHandGeometry = useGeometry(() => createCoutureHandGeometry(s, -1), [s]);

  return (
    <group>
      <Torso model={model} />

      {/* Graceful contoured neck */}
      <SculptedLimbMesh
        from={[0, landmarks.napeY - 0.01, 0.008]}
        to={[0, landmarks.napeY + 0.08 * s, 0.018]}
        radiusTop={neckR * 0.88}
        radiusBottom={neckR * 0.98}
        limbType="neck"
        color={skin}
      />

      {/* Realistic Head with Sculpted Facial Anatomy */}
      <mesh position={[0, headY, 0.018]} geometry={headGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
      </mesh>

      {/* Styled Hair Coiffure */}
      <mesh position={[0, headY, 0.018]} geometry={hairGeometry} castShadow>
        <meshStandardMaterial color="#2B1E18" roughness={0.48} metalness={0.08} />
      </mesh>

      {[1, -1].map((side) => {
        const sx = side * (shoulder.a + 0.012);
        const ex = sx + side * armEndX * elbow;
        const ey = landmarks.shoulderY - 0.01 - Math.cos(SLEEVE_TILT) * body.armLength * elbow;
        const wx = side * (shoulder.a + 0.012 + armEndX);
        const isLeft = side === 1;

        return (
          <React.Fragment key={side}>
            {/* Shoulder deltoid articulation cap */}
            <mesh position={[sx, landmarks.shoulderY - 0.01, 0.004]} castShadow receiveShadow>
              <sphereGeometry args={[radiusOf(body.upperArm) * 1.02, 32, 24]} />
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>

            {/* Contoured Upper Arm */}
            <SculptedLimbMesh
              from={[sx, landmarks.shoulderY - 0.01, 0]}
              to={[ex, ey, 0]}
              radiusTop={radiusOf(body.upperArm)}
              radiusBottom={radiusOf(body.upperArm) * 0.82}
              limbType="upperArm"
              color={skin}
            />

            {/* Elbow joint */}
            <mesh position={[ex, ey, 0]} castShadow receiveShadow>
              <sphereGeometry args={[radiusOf(body.upperArm) * 0.80, 28, 20]} />
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>

            {/* Contoured Forearm */}
            <SculptedLimbMesh
              from={[ex, ey, 0]}
              to={[wx, armEndY, 0]}
              radiusTop={radiusOf(body.upperArm) * 0.82}
              radiusBottom={radiusOf(body.wrist)}
              limbType="forearm"
              color={skin}
            />

            {/* Realistic Human Hand with Sculpted Fingers */}
            <mesh
              position={[wx, armEndY, 0]}
              rotation={[0, 0, -side * SLEEVE_TILT]}
              geometry={isLeft ? leftHandGeometry : rightHandGeometry}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>

            {/* Contoured Thigh */}
            <SculptedLimbMesh
              from={[side * legX, landmarks.crotchY, 0]}
              to={[side * legX * 0.95, kneeY, 0]}
              radiusTop={radiusOf(body.thigh)}
              radiusBottom={radiusOf(body.knee)}
              limbType="thigh"
              color={skin}
            />

            {/* Knee patella joint */}
            <mesh position={[side * legX * 0.95, kneeY, 0.004]} castShadow receiveShadow>
              <sphereGeometry args={[radiusOf(body.knee) * 0.96, 28, 20]} />
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>

            {/* Contoured Calf & Shin */}
            <SculptedLimbMesh
              from={[side * legX * 0.95, kneeY, 0]}
              to={[side * legX * 0.9, landmarks.ankleY, 0]}
              radiusTop={radiusOf(body.knee) * 0.98}
              radiusBottom={radiusOf(body.ankle)}
              limbType="calf"
              color={skin}
            />

            {/* Realistic Human Foot planted on the floor */}
            <mesh
              position={[side * legX * 0.9, 0, 0.02 * s]}
              geometry={footGeometry}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
};

/** Triangles reordered so the accent ones (all three vertices accent) come last: two draw groups, two materials. */
const accentGroups = (
  indices: Uint32Array,
  accent: Uint8Array,
): { indices: Uint32Array; groups: Array<{ start: number; count: number; material: number }> } => {
  const plain: number[] = [];
  const marked: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    (accent[a] && accent[b] && accent[c] ? marked : plain).push(a, b, c);
  }
  return {
    indices: Uint32Array.from([...plain, ...marked]),
    groups: [
      { start: 0, count: plain.length, material: 0 },
      { start: plain.length, count: marked.length, material: 1 },
    ],
  };
};

/**
 * The cloth's surface. Velvet: a deep, slightly rough ground and a soft sheen of a lighter shade where the light
 * grazes the pile (folds and edges glow, faces turned to the eye stay dark), as on the photographs. Satin: a smooth
 * physical sheen. Otherwise a plain matte fabric.
 */
const ClothMaterial: React.FC<{
  cloth: Cloth | null;
  zone: PanelMeshData['zone'];
  highlighted: boolean;
  transparent: boolean;
  /** The geometry carries the folds' ambient occlusion as vertex colours. */
  shaded?: boolean;
  /** Relief drawn over the cloth (smocking's honeycomb). */
  relief?: Relief | null | undefined;
  attach: string;
}> = ({ cloth, zone, highlighted, transparent, shaded = false, relief, attach }) => {
  const common = {
    attach,
    ...(relief
      ? {
          normalMap: relief.normalMap,
          normalScale: new THREE.Vector2(1, 1),
          aoMap: relief.aoMap,
          aoMapIntensity: 0.8,
          // A NaN normal from the relief map would come out as a black pixel through the post-processing.
          onBeforeCompile: guardPerturbedNormal,
          customProgramCacheKey: () => 'normal-guard',
        }
      : {}),
    vertexColors: shaded,
    color: cloth?.color ?? ZONE_COLORS[zone],
    map: cloth?.map ?? null,
    emissive: highlighted ? '#936C3E' : '#000000',
    emissiveIntensity: highlighted ? 0.6 : 0,
    side: THREE.DoubleSide,
    transparent,
    opacity: transparent ? 0.5 : 1,
    depthWrite: !transparent,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  };
  if (cloth?.finish === 'VELOURS') {
    // The pile catches the light only at grazing angles, in the fabric's own hue (never a white plastic shine).
    // Deep pile: a bright, blue-grey sheen of the fabric's own hue on the folds' crests and edges.
    const sheen = glow(cloth.map ? '#2A3A78' : cloth.color, 0.32);
    return <meshPhysicalMaterial {...common} roughness={1} metalness={0} sheen={1} sheenRoughness={0.45} sheenColor={sheen} envMapIntensity={0.35} />;
  }
  if (cloth?.finish === 'SATIN') {
    return <meshPhysicalMaterial {...common} roughness={0.38} metalness={0.05} sheen={0.6} sheenRoughness={0.25} sheenColor="#ffffff" clearcoat={0.15} clearcoatRoughness={0.4} />;
  }
  return <meshStandardMaterial {...common} roughness={0.58} metalness={0.08} />;
};

/** Relief maps laid on a panel's cloth (smocking). */
interface Relief {
  normalMap: THREE.Texture;
  aoMap: THREE.Texture;
}

const Panel: React.FC<{
  panel: PanelMeshData;
  assembly: number;
  transparent: boolean;
  highlighted: boolean;
  cloth: Cloth | null;
  /** Fabric of the panel's accent part (a sleeve's puff), when it has one. */
  accentCloth?: Cloth | null | undefined;
  /** Draws the seam lines over the cloth. */
  seams?: boolean | undefined;
  /** Brush events, while modelling (see SculptBrush). */
  sculpt?: React.RefObject<SculptHandlers | null> | null;
  onHoverChange?: ((over: boolean) => void) | undefined;
  relief?: Relief | null | undefined;
}> = ({ panel, assembly, transparent, highlighted, cloth, accentCloth, seams = true, sculpt, onHoverChange, relief }) => {
  const split = Boolean(accentCloth && panel.accent);
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(panel.uvs, 2));
    // Ambient occlusion of the folds, as a grey vertex colour multiplying the cloth.
    if (panel.ao) {
      const rgb = new Float32Array(panel.ao.length * 3);
      for (let i = 0; i < panel.ao.length; i += 1) rgb.fill(panel.ao[i]!, i * 3, i * 3 + 3);
      g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    }
    const { indices, groups } = split && panel.accent ? accentGroups(panel.indices, panel.accent) : { indices: panel.indices, groups: [] };
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    for (const group of groups) g.addGroup(group.start, group.count, group.material);
    g.computeVertexNormals();
    return g;
  }, [panel, split]);

  const borderGeometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.border, 3));
    return g;
  }, [panel]);

  const spread = (1 - assembly) * EXPLODE_DISTANCE;
  const offset: [number, number, number] = [
    panel.explode.x * spread,
    panel.explode.y * spread * 0.5,
    panel.explode.z * spread,
  ];

  return (
    <group position={offset}>
      <mesh
        geometry={geometry}
        userData={{ panel }}
        castShadow
        receiveShadow
        {...(sculpt
          ? {
              onPointerMove: (e: ThreeEvent<PointerEvent>) => sculpt.current?.hover(e, panel),
              onPointerOver: () => onHoverChange?.(true),
              onPointerOut: () => {
                onHoverChange?.(false);
                sculpt.current?.leave();
              },
              onPointerDown: (e: ThreeEvent<PointerEvent>) => sculpt.current?.down(e, panel),
            }
          : {})}
      >
        <ClothMaterial cloth={cloth} zone={panel.zone} highlighted={highlighted} transparent={transparent} shaded={Boolean(panel.ao)} relief={relief} attach={split ? 'material-0' : 'material'} />
        {split && <ClothMaterial cloth={accentCloth ?? null} zone={panel.zone} highlighted={highlighted} transparent={transparent} shaded={Boolean(panel.ao)} attach="material-1" />}
      </mesh>
      {/* Couture stitching seam line in delicate Champagne */}
      {(seams || highlighted) && (
        <lineSegments geometry={borderGeometry}>
          <lineBasicMaterial color={highlighted ? '#F6F2E9' : '#C5B190'} transparent opacity={0.85} />
        </lineSegments>
      )}
    </group>
  );
};

/**
 * A lace garniture (berthe, sleeve frill): a see-through layer, its threads cut out by the lace's alpha map (a plain
 * fabric or tulle garniture is drawn solid or misty). Soft sheen, both sides.
 */
const LacePanel: React.FC<{ panel: PanelMeshData; assembly: number; highlighted: boolean; lace: THREE.Texture | null }> = ({
  panel,
  assembly,
  highlighted,
  lace,
}) => {
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(panel.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(panel.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [panel]);
  const spread = (1 - assembly) * EXPLODE_DISTANCE;
  const isLace = panel.material !== 'TISSU' && panel.material !== 'TULLE';
  return (
    <group position={[panel.explode.x * spread, panel.explode.y * spread * 0.5, panel.explode.z * spread]}>
      <mesh geometry={geometry} userData={{ panel }}>
        <meshPhysicalMaterial
          color={panel.trimColor ?? ZONE_COLORS.lace}
          alphaMap={isLace ? lace : null}
          alphaTest={isLace && lace ? 0.35 : 0}
          transparent={panel.material === 'TULLE'}
          opacity={panel.material === 'TULLE' ? 0.55 : 1}
          side={THREE.DoubleSide}
          roughness={0.6}
          sheen={0.5}
          sheenColor="#ffffff"
          emissive={highlighted ? '#936C3E' : '#000000'}
          emissiveIntensity={highlighted ? 0.5 : 0}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
};

/**
 * An embroidery: the thread alone (scrolls, leaves, flowers, knots), its satin shading dyed in the thread colour and
 * cut out by its coverage, laid over the cloth that shows between the motifs.
 */
const EmbroideryPanel: React.FC<{ panel: PanelMeshData; assembly: number; highlighted: boolean; motif: THREE.Texture; color: string }> = ({
  panel,
  assembly,
  highlighted,
  motif,
  color,
}) => {
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(panel.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(panel.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [panel]);
  // Same material as the realistic render's embroidery (`embroideryMaterialParameters`).
  const material = useMemo(() => withNormalGuard(new THREE.MeshPhysicalMaterial(embroideryMaterialParameters(color, motif))), [color, motif]);
  useEffect(() => () => material.dispose(), [material]);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    material.emissive.set(highlighted ? '#936C3E' : '#000000');
    material.emissiveIntensity = highlighted ? 0.5 : 0;
    invalidate();
  }, [material, highlighted, invalidate]);
  const spread = (1 - assembly) * EXPLODE_DISTANCE;
  return (
    <group position={[panel.explode.x * spread, panel.explode.y * spread * 0.5, panel.explode.z * spread]}>
      <mesh geometry={geometry} material={material} userData={{ panel }} receiveShadow />
    </group>
  );
};

/** A bead row: one pearl (a small lustrous sphere) per centre, drawn as instances. */
const BeadRow: React.FC<{ panel: PanelMeshData; assembly: number; highlighted: boolean }> = ({ panel, assembly, highlighted }) => {
  const count = panel.positions.length / 3;
  const sphere = useGeometry(() => new THREE.SphereGeometry(panel.beadRadius ?? 0.003, 10, 8), [panel.beadRadius]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      m.makeTranslation(panel.positions[i * 3]!, panel.positions[i * 3 + 1]!, panel.positions[i * 3 + 2]!);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [panel, count]);
  const spread = (1 - assembly) * EXPLODE_DISTANCE;
  return (
    <group position={[panel.explode.x * spread, panel.explode.y * spread * 0.5, panel.explode.z * spread]}>
      <instancedMesh ref={ref} args={[sphere, undefined, count]} castShadow>
        <meshPhysicalMaterial
          color={panel.trimColor ?? ZONE_COLORS.beads}
          roughness={0.22}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          emissive={highlighted ? '#936C3E' : '#000000'}
          emissiveIntensity={highlighted ? 0.5 : 0}
        />
      </instancedMesh>
    </group>
  );
};

export const Garment3DViewer: React.FC<Garment3DViewerProps> = ({
  model,
  assembly,
  showMannequin,
  transparent,
  panMode = false,
  selectedPieceId,
  viewRequest,
  onContextLost,
  fabric,
  pose,
  sculpt,
  edit,
  showSeams,
  onGarmentScreenRect,
  lighting = 'studio',
}) => {
  const human = useHumanBase();
  const preset = LIGHTING_PRESETS[lighting];
  const { tier, reportFrame } = useStudioQuality();
  const [renderReady, setRenderReady] = useState(false);
  const dpr = useMemo(() => dprRange(tier, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1), [tier]);
  const editing = Boolean(edit);
  // Edit mode: the left button selects; Alt + left (or the middle button) orbits, as Blender's emulation.
  const [altHeld, setAltHeld] = useState(false);
  const [box, setBox] = useState<ScreenBox | null>(null);
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e: KeyboardEvent): void => setAltHeld(e.altKey);
    const onBlur = (): void => setAltHeld(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, [editing]);
  const brush = useRef<SculptHandlers | null>(null);
  // Over the garment while modelling (or dragging): the left button models instead of orbiting.
  const [overGarment, setOverGarment] = useState(false);
  const [dragging, setDragging] = useState(false);
  const sculpting = Boolean(sculpt);
  const leftModels = sculpting && (overGarment || dragging);
  useEffect(() => {
    if (!sculpting) setOverGarment(false);
  }, [sculpting]);
  const cloth = useMemo(() => fabricMaterial(fabric), [fabric]);
  const lace = useMemo(() => laceAlphaMap(), []);
  useEffect(() => () => lace?.dispose(), [lace]);
  // Embroidery and smocking motifs, built once (pure pixels, a few ms) and only when the garment has one.
  const motifs = useMemo(() => new Set(model.panels.map((p) => p.motif).filter(Boolean)), [model.panels]);
  const embroidery = useMemo(() => (motifs.has('BRODERIE') ? embroideryMap() : null), [motifs]);
  useEffect(() => () => embroidery?.dispose(), [embroidery]);
  const smocks = useMemo<Relief | null>(() => (motifs.has('SMOCKS') ? smockingMaps() : null), [motifs]);
  useEffect(
    () => () => {
      smocks?.normalMap.dispose();
      smocks?.aoMap.dispose();
    },
    [smocks],
  );
  // A fabric with a known surface is shown as a photograph: studio backdrop and light.
  const studio = Boolean(fabric?.fabricFinish);
  const accentCloth = useMemo(() => accentMaterial(fabric), [fabric]);
  useEffect(() => () => accentCloth?.map?.dispose(), [accentCloth]);
  // The plastron of a robe-manteau is a contrasting fabric; the cord matches it, and so does a collar when the
  // analysis saw a contrasting one (a white collar on a dark dress).
  const plastronCloth = useMemo(() => plastronMaterial(fabric, ZONE_COLORS.plastron), [fabric]);
  useEffect(() => () => plastronCloth.map?.dispose(), [plastronCloth]);
  const cordCloth = useMemo<Cloth>(
    () => ({ color: isHexColor(fabric?.contrastColor) ? fabric.contrastColor : ZONE_COLORS.plastron, map: null }),
    [fabric],
  );
  const liningCloth = useMemo<Cloth>(() => ({ color: LINING_COLOR, map: null }), []);
  const goreCloth = useMemo(() => (fabric?.contrastGores ? contrastMaterial(fabric) : null), [fabric]);
  useEffect(() => () => goreCloth?.map?.dispose(), [goreCloth]);
  // Over a plastron the contrast colour belongs to the plastron; the collar (revers) is cut in the dress fabric.
  const contrastCollar = isHexColor(fabric?.contrastColor) && !model.layout.trims.some((t) => t.zone === 'plastron' && /plastron/i.test(t.piece.name));
  useEffect(() => () => cloth?.map?.dispose(), [cloth]);
  // The body is fitted once per model; the garment is then draped on that very body (its hull, its
  // arms, its legs). Until the mesh is loaded, the panels draped on the procedural mannequin are shown.
  // Keyed on the body only: modelling the pattern changes the model, never the person wearing it.
  const fitted = useMemo(
    () => (human ? fitHumanBody(human, model.body, model.torsoRings, morphFor(model.body, model.templateId)) : null),
    [human, model.body, model.torsoRings, model.templateId],
  );
  // The pose moves the joints of the fitted body; the garment is draped on the posed body. Deferred so
  // that dragging a joint slider stays fluid while the body and the drape are rebuilt.
  const deferredPose = useDeferredValue(pose);
  // Forearms and hands, told apart on the body at rest: a folded forearm never passes for an upper arm.
  const forearm = useMemo(() => (human && fitted ? forearmMask(fitted.positions, human.armWeights, model.body) : null), [human, fitted, model.body]);
  // The skirt draped on the body at rest: where a wide skirt (a crinoline) stands out, the posed arms are moved out
  // until the hands rest on it instead of going through it (`seatHandsOnSkirt`).
  const restSurface = useMemo(() => {
    if (!human || !fitted || !deferredPose || isNeutral(deferredPose)) return null;
    const restEnv = envelopeFromMesh(fitted.positions, human.indices, human.armWeights, model.body, forearm ?? undefined);
    return { surface: skirtSurface(drapeGarment(model.layout, model.body, restEnv), restEnv.axisZ), axisZ: restEnv.axisZ };
  }, [human, fitted, model.layout, model.body, forearm, deferredPose]);
  const seatedPose = useMemo(
    () =>
      human && fitted && deferredPose && restSurface
        ? seatHandsOnSkirt(deferredPose, fitted.positions, human.armWeights, model.body, restSurface.surface, restSurface.axisZ)
        : deferredPose,
    [human, fitted, model.body, deferredPose, restSurface],
  );
  const fit = useMemo(
    () =>
      human && fitted && seatedPose && !isNeutral(seatedPose)
        ? { ...fitted, positions: applyPose(fitted.positions, human.armWeights, model.body, seatedPose) }
        : fitted,
    [human, fitted, model.body, seatedPose],
  );
  // The body's envelope, sampled once per posed body (≈ 0.2 s): the pattern is re-draped on it at every edit.
  const envelope = useMemo(
    () => (human && fit ? envelopeFromMesh(fit.positions, human.indices, human.armWeights, model.body, forearm ?? undefined) : null),
    [human, fit, model.body, forearm],
  );
  const panels = useMemo(
    () =>
      human && fit && envelope
        ? drapeGarment(
            model.layout,
            model.body,
            envelope,
            seatedPose && fitted && !isNeutral(seatedPose)
              ? {
                  hands: handCentres(fitted.positions, fit.positions, human.armWeights, model.body),
                  legsPosed: [seatedPose.leftLeg, seatedPose.rightLeg].some((p) => p.forward > 3 || p.bend > 3 || p.raise > 3),
                }
              : {},
          )
        : model.panels,
    [human, fit, fitted, model, envelope, seatedPose],
  );
  const editPieces = edit?.pieces;
  const instances = useMemo(() => (editPieces ? outlineInstances(panels, editPieces) : []), [panels, editPieces]);
  const onInstances = edit?.onInstances;
  useEffect(() => onInstances?.(instances), [instances, onInstances]);
  const lost = useRef(onContextLost);
  lost.current = onContextLost;

  const leftButton = editing ? (altHeld ? THREE.MOUSE.ROTATE : (-1 as THREE.MOUSE)) : leftModels ? (-1 as THREE.MOUSE) : panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;

  return (
    <div className="relative h-full w-full">
    <Canvas
      frameloop="demand"
      dpr={dpr}
      shadows="variance"
      camera={{ position: [0, 1.0, VIEW_DISTANCE], fov: 32, near: 0.1, far: 30 }}
      // The anti-aliasing is the post-processing target's MSAA (StudioPost); the canvas itself has none.
      gl={GL_OPTIONS}
      aria-label="Prévisualisation 3D du patron assemblé sur un mannequin"
      onCreated={({ gl }) => {
        configureStudioRenderer(gl);
        // A lost context (GPU reset, too many contexts) must not leave a frozen black canvas.
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          lost.current?.();
        });
      }}
    >
      {studio ? <StudioBackdrop /> : <color attach="background" args={['#041329']} />}
      <StudioEnvironment preset={preset} backdrop={studio ? 'paper' : 'navy'} />
      <StudioLights preset={preset} tier={tier} />
      {showMannequin && <ShadowFloor opacity={preset.floorShadowOpacity} />}

      {showMannequin && (human && fit ? <Person model={model} base={human} fit={fit} /> : <Mannequin model={model} />)}
      {panels.map((panel) =>
        panel.zone === 'beads' ? (
          <BeadRow key={panel.id} panel={panel} assembly={assembly} highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)} />
        ) : panel.zone === 'lace' ? (
          <LacePanel key={panel.id} panel={panel} assembly={assembly} lace={lace} highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)} />
        ) : panel.motif === 'BRODERIE' && embroidery ? (
          <EmbroideryPanel
            key={panel.id}
            panel={panel}
            assembly={assembly}
            motif={embroidery}
            color={threadColor(panel.trimColor, fabric?.contrastColor)}
            highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)}
          />
        ) : (
        <Panel
          key={panel.id}
          panel={panel}
          assembly={assembly}
          transparent={transparent}
          highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)}
          sculpt={sculpting ? brush : null}
          onHoverChange={setOverGarment}
          cloth={
            panel.lining
              ? liningCloth
              : panel.zone === 'plastron' || panel.contrast || ((panel.zone === 'collar' || panel.zone === 'cuff') && fabric?.contrastTrims)
              ? plastronCloth
              : panel.zone === 'cord' || (panel.zone === 'collar' && contrastCollar)
                ? cordCloth
                : cloth
          }
          accentCloth={panel.accent ? (panel.zone === 'skirt' ? goreCloth : accentCloth) : null}
          relief={panel.motif === 'SMOCKS' ? smocks : null}
          seams={showSeams ?? (!cloth || sculpting || Boolean(edit))}
        />
        ),
      )}
      {sculpt && <SculptBrush ref={brush} sculpt={sculpt} panels={panels} onDraggingChange={setDragging} />}
      {edit && <MeshEditLayer edit={{ ...edit, instances }} panels={panels} onBoxChange={setBox} />}

      {/*
        Blender-style navigation: middle-drag (or left-drag) orbits, Shift+drag or right-drag pans (the left button too with the hand tool),
        wheel zooms toward the cursor, damping for smooth inertia. Touch: 1 finger orbits, 2 pan/zoom.
      */}
      <OrbitControls
        makeDefault
        target={[0, 0.88, 0]}
        enableDamping
        dampingFactor={0.12}
        enablePan
        mouseButtons={{
          // -1: no action (three's OrbitControls ignores unmapped buttons) — the brush has the left button.
          LEFT: leftButton,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{ ONE: leftModels || editing ? (-1 as THREE.TOUCH) : panMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        screenSpacePanning
        zoomToCursor
        rotateSpeed={0.9}
        panSpeed={0.9}
        minDistance={0.8}
        maxDistance={8}
      />

      {/* Click an axis to snap the view, like Blender's navigation gizmo. */}
      {/* renderPriority 2: drawn over the studio's post-processed frame (StudioPost renders at 1). */}
      <GizmoHelper alignment="bottom-right" margin={[56, 56]} renderPriority={2}>
        <GizmoViewport axisColors={['#E0605A', '#7FC47F', '#6A9AE0']} labelColor="#041329" />
      </GizmoHelper>

      {onGarmentScreenRect && <FrameReporter panels={panels} onRect={onGarmentScreenRect} />}
      <AdaptiveDpr pixelated />
      <CameraRig request={viewRequest} stature={model.body.height} />
      <Invalidator signal={[assembly, showMannequin, transparent, selectedPieceId, model, panels]} />
      <StudioPost tier={tier} aoAllowed={!transparent} warmKey={human ? 'person' : 'mannequin'} onReadyChange={setRenderReady} onFrame={reportFrame} />
    </Canvas>
    {!renderReady && (
      <div
        role="status"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="rounded-sm border border-[#18375D] bg-[#041329]/80 px-3 py-2 font-sans text-[10px] uppercase tracking-widest text-[#D8D3C8] backdrop-blur-md">
          Préparation du rendu…
        </span>
      </div>
    )}
    {box && (
      <div
        data-testid="box-select"
        className="pointer-events-none absolute border border-dashed border-[#FFA436] bg-[#FFA436]/10"
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      />
    )}
    </div>
  );
};
