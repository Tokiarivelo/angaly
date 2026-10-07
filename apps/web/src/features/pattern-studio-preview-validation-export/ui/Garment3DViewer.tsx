'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SLEEVE_TILT, type GarmentModel, type PanelMeshData } from '../utils/garment3d/garment-model';
import { loftRings } from '../utils/garment3d/body-model';
import { bodyLandmarks } from '../utils/garment3d/body-model';

interface Garment3DViewerProps {
  model: GarmentModel;
  /** 0 = panels exploded around the mannequin, 1 = assembled. */
  assembly: number;
  showMannequin: boolean;
  transparent: boolean;
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
  bodice: '#C5B190',
  torso: '#C5B190',
  skirt: '#7F95B8',
  sleeve: '#B08A5B',
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
  const geometry = useGeometry(() => {
    const mesh = loftRings(model.torsoRings, 40);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    g.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [model.torsoRings]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#E4DED2" roughness={0.9} metalness={0} />
    </mesh>
  );
};

/** Cylinder between two points (arms, legs). */
const Limb: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
  radiusTop: number;
  radiusBottom: number;
}> = ({ from, to, radiusTop, radiusBottom }) => {
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

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radiusTop, radiusBottom, length, 14]} />
      <meshStandardMaterial color="#E4DED2" roughness={0.9} />
    </mesh>
  );
};

const Mannequin: React.FC<{ model: GarmentModel }> = ({ model }) => {
  const landmarks = bodyLandmarks(model.body);
  const shoulder = model.torsoRings[1]!;
  const armEndY = landmarks.shoulderY - Math.cos(SLEEVE_TILT) * model.body.armLength;
  const armEndX = Math.sin(SLEEVE_TILT) * model.body.armLength;

  return (
    <group>
      <Torso model={model} />
      <mesh position={[0, landmarks.napeY + 0.115, 0.01]}>
        <sphereGeometry args={[0.095, 20, 16]} />
        <meshStandardMaterial color="#E4DED2" roughness={0.9} />
      </mesh>
      {[1, -1].map((side) => (
        <React.Fragment key={side}>
          <Limb
            from={[side * (shoulder.a + 0.012), landmarks.shoulderY - 0.01, 0]}
            to={[side * (shoulder.a + 0.012 + armEndX), armEndY, 0]}
            radiusTop={0.036}
            radiusBottom={0.026}
          />
          <Limb
            from={[side * 0.09, landmarks.crotchY, 0]}
            to={[side * 0.085, landmarks.ankleY, 0]}
            radiusTop={0.082}
            radiusBottom={0.036}
          />
        </React.Fragment>
      ))}
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
          emissive={highlighted ? '#C5B190' : '#000000'}
          emissiveIntensity={highlighted ? 0.45 : 0}
          roughness={0.75}
          side={THREE.DoubleSide}
          transparent={transparent}
          opacity={transparent ? 0.5 : 1}
          depthWrite={!transparent}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={borderGeometry}>
        <lineBasicMaterial color={highlighted ? '#FFFFFF' : '#041329'} />
      </lineSegments>
    </group>
  );
};

export const Garment3DViewer: React.FC<Garment3DViewerProps> = ({
  model,
  assembly,
  showMannequin,
  transparent,
  selectedPieceId,
  viewRequest,
  onContextLost,
}) => {
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
      <hemisphereLight args={['#FFFFFF', '#1B2B4A', 0.9]} />
      <directionalLight position={[2.5, 3, 3]} intensity={1.4} />
      <directionalLight position={[-2, 1.5, -2]} intensity={0.5} />

      {showMannequin && <Mannequin model={model} />}
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
        Blender-style navigation: middle-drag (or left-drag) orbits, Shift+drag or right-drag pans,
        wheel zooms toward the cursor, damping for smooth inertia. Touch: 1 finger orbits, 2 pan/zoom.
      */}
      <OrbitControls
        makeDefault
        target={[0, 0.88, 0]}
        enableDamping
        dampingFactor={0.12}
        enablePan
        screenSpacePanning
        zoomToCursor
        rotateSpeed={0.9}
        panSpeed={0.9}
        minDistance={0.8}
        maxDistance={8}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
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
