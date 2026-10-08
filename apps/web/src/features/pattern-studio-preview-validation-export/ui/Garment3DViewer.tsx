'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SLEEVE_TILT, type GarmentModel, type PanelMeshData } from '../utils/garment3d/garment-model';
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
import { buildHairShell, fitHumanBody, morphFor } from '../utils/garment3d/human-body';
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
}

export type ViewName = 'front' | 'back' | 'side' | 'top' | 'reset';
export interface ViewRequest {
  view: ViewName;
  nonce: number;
}

const VIEW_DISTANCE = 3.3;
const VIEW_TARGET = new THREE.Vector3(0, 0.88, 0);
const VIEW_POSITIONS: Record<ViewName, [number, number, number]> = {
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
const CameraRig: React.FC<{ request: ViewRequest | null }> = ({ request }) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target: THREE.Vector3; update: () => void } | null;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!request) return;
    const [x, y, z] = VIEW_POSITIONS[request.view];
    camera.position.set(x, y, z);
    if (controls) {
      controls.target.copy(VIEW_TARGET);
      controls.update();
    }
    camera.lookAt(VIEW_TARGET);
    invalidate();
  }, [request, camera, controls, invalidate]);

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


/** Scanned-quality human body (CC0 MakeHuman mesh) fitted to the customer's measurements. */
const Person: React.FC<{ model: GarmentModel; base: NonNullable<ReturnType<typeof useHumanBase>> }> = ({ model, base }) => {
  const { body } = model;
  const s = bodyScale(body);
  const fit = useMemo(
    () => fitHumanBody(base, body, model.torsoRings, morphFor(body, model.templateId)),
    [base, body, model.torsoRings, model.templateId],
  );
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(fit.positions, 3));
    g.setIndex(new THREE.BufferAttribute(base.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [fit, base]);
  const hairGeometry = useGeometry(() => {
    const hair = buildHairShell(fit.positions, base.indices, body);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(hair.positions, 3));
    g.setIndex(new THREE.BufferAttribute(hair.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [fit, base, body]);

  return (
    <group>
      <mesh position={[0, 0.001, 0.02 * s]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34 * s, 48]} />
        <meshBasicMaterial color="#020B17" transparent opacity={0.45} />
      </mesh>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial color={body.skin} roughness={0.62} metalness={0} sheen={0.6} sheenRoughness={0.5} sheenColor="#F2C9B0" />
      </mesh>
      <mesh geometry={hairGeometry}>
        <meshStandardMaterial color="#2B1E18" roughness={0.7} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
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
}> = ({ panel, assembly, transparent, highlighted }) => {
  const geometry = useGeometry(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(panel.positions, 3));
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
          color={ZONE_COLORS[panel.zone]}
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
}) => {
  const human = useHumanBase();
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
      <ambientLight intensity={0.4} color="#E8E2D5" />
      <hemisphereLight args={['#FFFFFF', '#061938', 0.85]} />
      <directionalLight position={[3, 4, 3.5]} intensity={1.5} color="#FFF8EE" />
      <directionalLight position={[-3, 2.5, 2.5]} intensity={0.75} color="#94A8C7" />
      <directionalLight position={[0, 3.5, -3.5]} intensity={1.1} color="#F0E6D2" />
      <directionalLight position={[0, -1, 1]} intensity={0.25} color="#C5B190" />

      {showMannequin && (human ? <Person model={model} base={human} /> : <Mannequin model={model} />)}
      {model.panels.map((panel) => (
        <Panel
          key={panel.id}
          panel={panel}
          assembly={assembly}
          transparent={transparent}
          highlighted={selectedPieceId !== null && panel.pieceIds.includes(selectedPieceId)}
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
      <CameraRig request={viewRequest} />
      <Invalidator signal={[assembly, showMannequin, transparent, selectedPieceId, model]} />
    </Canvas>
  );
};
