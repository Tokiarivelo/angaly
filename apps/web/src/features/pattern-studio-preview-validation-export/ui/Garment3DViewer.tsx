'use client';

import React, { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
}

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
}) => {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.0, 3.3], fov: 32, near: 0.1, far: 20 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Prévisualisation 3D du patron assemblé sur un mannequin"
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

      <OrbitControls
        makeDefault
        target={[0, 0.88, 0]}
        enablePan={false}
        minDistance={1.3}
        maxDistance={6}
        maxPolarAngle={Math.PI * 0.62}
      />
      <Invalidator signal={[assembly, showMannequin, transparent, selectedPieceId, model]} />
    </Canvas>
  );
};
