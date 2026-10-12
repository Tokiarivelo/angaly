'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { drapeGarment, SLEEVE_TILT, type GarmentModel, type PanelMeshData } from '../utils/garment3d/garment-model';
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
import { fabricMaterial, type FabricLook } from './fabricTextures';
import { eyeTexture, hairTexture } from './headTextures';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useHumanBase } from './useHumanBase';

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
}

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

const EXPLODE_DISTANCE = 0.3;
const ZONE_COLORS: Record<PanelMeshData['zone'], string> = {
  bodice: '#18375D',
  torso: '#18375D',
  skirt: '#0C2650',
  legs: '#061938',
  sleeve: '#1E4574',
};

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
    <mesh geometry={geometry}>
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
    <mesh position={position} quaternion={quaternion} geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.0} />
    </mesh>
  );
};


const HAIR_COLOR = '#4a3324';

const smoothstep01 = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Hair style by morphology: long wavy hair for women and girls, a short textured cut for men and boys. */
const hairStyleFor = (templateId: string): HairStyle =>
  templateId.startsWith('HOMME') || templateId === 'ENFANT_GARCON' ? 'short' : 'long';

/** Scanned-quality human body (CC0 MakeHuman mesh) fitted to the customer's measurements. */
const Person: React.FC<{
  model: GarmentModel;
  base: NonNullable<ReturnType<typeof useHumanBase>>;
  fit: FitResult;
}> = ({ model, base, fit }) => {
  const { body } = model;
  const s = bodyScale(body);
  // The face, sculpted towards a portrait's (fuller lips, eyes a little more open).
  const sculpted = useMemo(() => {
    const found = findFaceLandmarks(fit.positions, base.armWeights, body, base.indices);
    return found ? sculptFace(fit.positions, found, body) : { positions: fit.positions, face: null };
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
    const hair = buildHair(fit.positions, base.armWeights, body, face, hairStyleFor(model.templateId));
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
  }, [fit, base, body, face, model.templateId]);
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
      <mesh position={[0, 0.001, 0.02 * s]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34 * s, 48]} />
        <meshBasicMaterial color="#020B17" transparent opacity={0.45} />
      </mesh>
      <mesh geometry={geometry}>
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
          <mesh geometry={hairGeometry}>
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

/** Soft studio reflections (eyes, skin sheen, fabric) from a generated room, no network asset. */
const StudioEnvironment: React.FC = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.25;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
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
  const kneeY = (landmarks.crotchY + landmarks.ankleY) / 2;
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

      {/* Natural ground contact shadow beneath feet on the floor */}
      <mesh position={[0, 0.001, 0.02 * s]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34 * s, 48]} />
        <meshBasicMaterial color="#020B17" transparent opacity={0.45} />
      </mesh>

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
      <mesh position={[0, headY, 0.018]} geometry={headGeometry}>
        <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
      </mesh>

      {/* Styled Hair Coiffure */}
      <mesh position={[0, headY, 0.018]} geometry={hairGeometry}>
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
            <mesh position={[sx, landmarks.shoulderY - 0.01, 0.004]}>
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
            <mesh position={[ex, ey, 0]}>
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
            <mesh position={[side * legX * 0.95, kneeY, 0.004]}>
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
            >
              <meshStandardMaterial color={skin} roughness={0.55} metalness={0.0} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
};

const Panel: React.FC<{
  panel: PanelMeshData;
  assembly: number;
  transparent: boolean;
  highlighted: boolean;
  cloth: { color: string; map: THREE.Texture | null } | null;
}> = ({ panel, assembly, transparent, highlighted, cloth }) => {
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(panel.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(panel.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [panel]);

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
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={cloth?.color ?? ZONE_COLORS[panel.zone]}
          map={cloth?.map ?? null}
          emissive={highlighted ? '#936C3E' : '#000000'}
          emissiveIntensity={highlighted ? 0.6 : 0}
          roughness={0.58}
          metalness={0.08}
          side={THREE.DoubleSide}
          transparent={transparent}
          opacity={transparent ? 0.5 : 0.98}
          depthWrite={!transparent}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* Couture stitching seam line in delicate Champagne */}
      <lineSegments geometry={borderGeometry}>
        <lineBasicMaterial
          color={highlighted ? '#F6F2E9' : '#C5B190'}
          transparent
          opacity={0.85}
        />
      </lineSegments>
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
}) => {
  const human = useHumanBase();
  const cloth = useMemo(() => fabricMaterial(fabric), [fabric]);
  useEffect(() => () => cloth?.map?.dispose(), [cloth]);
  // The body is fitted once per model; the garment is then draped on that very body (its hull, its
  // arms, its legs). Until the mesh is loaded, the panels draped on the procedural mannequin are shown.
  const fit = useMemo(
    () => (human ? fitHumanBody(human, model.body, model.torsoRings, morphFor(model.body, model.templateId)) : null),
    [human, model],
  );
  const panels = useMemo(
    () =>
      human && fit
        ? drapeGarment(model.layout, model.body, envelopeFromMesh(fit.positions, human.indices, human.armWeights, model.body))
        : model.panels,
    [human, fit, model],
  );
  const lost = useRef(onContextLost);
  lost.current = onContextLost;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.0, VIEW_DISTANCE], fov: 32, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Prévisualisation 3D du patron assemblé sur un mannequin"
      onCreated={({ gl }) => {
        // A lost context (GPU reset, too many contexts) must not leave a frozen black canvas.
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          lost.current?.();
        });
      }}
    >
      <color attach="background" args={['#041329']} />
      <StudioEnvironment />
      {/* Studio three-point light: a strong key high on one side, a weak cool fill (the relief stays readable). */}
      <ambientLight intensity={0.15} color="#E8E2D5" />
      <hemisphereLight args={['#FFFFFF', '#061938', 0.5]} />
      <directionalLight position={[-2.8, 3.6, 2.2]} intensity={2.4} color="#FFF6EA" />
      <directionalLight position={[3, 1.5, 2.8]} intensity={0.4} color="#A9BAD6" />
      <directionalLight position={[0, 3.5, -3.5]} intensity={1.1} color="#F0E6D2" />
      <directionalLight position={[0, -1, 1]} intensity={0.25} color="#C5B190" />

      {showMannequin && (human && fit ? <Person model={model} base={human} fit={fit} /> : <Mannequin model={model} />)}
      {panels.map((panel) => (
        <Panel
          key={panel.id}
          panel={panel}
          assembly={assembly}
          transparent={transparent}
          highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)}
          cloth={cloth}
        />
      ))}

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
          LEFT: panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{ ONE: panMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        screenSpacePanning
        zoomToCursor
        rotateSpeed={0.9}
        panSpeed={0.9}
        minDistance={0.8}
        maxDistance={8}
      />

      {/* Click an axis to snap the view, like Blender's navigation gizmo. */}
      <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
        <GizmoViewport axisColors={['#E0605A', '#7FC47F', '#6A9AE0']} labelColor="#041329" />
      </GizmoHelper>

      <AdaptiveDpr pixelated />
      <CameraRig request={viewRequest} stature={model.body.height} />
      <Invalidator signal={[assembly, showMannequin, transparent, selectedPieceId, model, panels]} />
    </Canvas>
  );
};
