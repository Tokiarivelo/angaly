'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { GarmentModel } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, isNeutral, type BodyPose } from '../utils/garment3d/pose';
import { clothRoleForMaterial, motifForMaterial, panelMotifs, type RenderClothRole, type RenderMotif } from '../utils/realistic-render';
import { accentMaterial, fabricMaterial, glow, plastronMaterial, type Cloth, type FabricLook } from './fabricTextures';
import { embroideryMap, embroideryMaterialParameters, smockingMaps, threadColor } from './motifTextures';
import { useHumanBase } from './useHumanBase';
import type { HumanBaseData } from '../utils/garment3d/human-body';
import { LIGHTING_PRESETS, SIMULATED_CLOTH_AO_BLEND, dprRange } from '../utils/studio3d/studio-config';
import { applyStudioShadows, configureStudioRenderer } from '../utils/studio3d/studio-scene';
import { withNormalGuard } from '../utils/studio3d/normal-guard';
import { useStudioQuality } from '../hooks/useStudioQuality';
import { StudioBackdrop } from './studio3d/StudioBackdrop';
import { StudioEnvironment } from './studio3d/StudioEnvironment';
import { StudioLights } from './studio3d/StudioLights';
import { ShadowFloor } from './studio3d/ShadowFloor';
import { StudioPost } from './studio3d/StudioPost';

/** Draco decoder copied from three (`examples/jsm/libs/draco/gltf`) into `public/draco/`: no CDN. */
export const DRACO_DECODER_PATH = '/draco/';
const VIEW_DISTANCE = 3.3;

/** The plain-coloured fabric of the 3D preview when the photo gave none (the `.glb` keeps its own material). */
const PLASTRON_FALLBACK = '#efe6d2';

/** The preview's renderer: no canvas anti-aliasing (the studio's MSAA does it), neutral tone mapping. */
const GL_OPTIONS = { antialias: false, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping } as const;

interface RealisticRenderViewerProps {
  /** The simulated garment (`.glb`, Draco) produced by the cloth-sim worker. */
  glbUrl: string;
  /** Same garment model as the preview: the mannequin is fitted to the same body. */
  model: GarmentModel;
  /** The pose the cloth was simulated in (`simPose`), not the requested one. */
  pose: BodyPose;
  fabric?: FabricLook | null | undefined;
  showMannequin?: boolean | undefined;
  onError?: ((message: string) => void) | undefined;
  onContextLost?: (() => void) | undefined;
}

/** Same surfaces as the preview (velvet sheen, satin, matte), so both renders read as the same fabric. */
const surfaceFor = (cloth: Cloth): THREE.Material => {
  const common = { color: cloth.color, map: cloth.map, side: THREE.DoubleSide };
  if (cloth.finish === 'VELOURS') {
    return new THREE.MeshPhysicalMaterial({
      ...common,
      roughness: 1,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(glow(cloth.map ? '#2A3A78' : cloth.color, 0.32)),
      envMapIntensity: 0.35,
    });
  }
  if (cloth.finish === 'SATIN') {
    return new THREE.MeshPhysicalMaterial({ ...common, roughness: 0.38, metalness: 0.05, sheen: 0.6, sheenRoughness: 0.25, clearcoat: 0.15 });
  }
  return new THREE.MeshStandardMaterial({ ...common, roughness: 0.58, metalness: 0.08 });
};

let dracoLoader: DRACOLoader | null = null;
const loader = (): GLTFLoader => {
  dracoLoader ??= new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
  return new GLTFLoader().setDRACOLoader(dracoLoader);
};

/** Loads the `.glb`; `null` while loading. */
const useSimulatedGarment = (url: string, onError?: (message: string) => void): THREE.Group | null => {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const report = useRef(onError);
  report.current = onError;
  useEffect(() => {
    let alive = true;
    setScene(null);
    loader().load(
      url,
      (gltf) => {
        if (alive) setScene(gltf.scene);
      },
      undefined,
      () => {
        if (alive) report.current?.('Le rendu réaliste n’a pas pu être chargé.');
      },
    );
    return () => {
      alive = false;
    };
  }, [url]);
  return scene;
};

/** Smocking's honeycomb on a surface: relief and the shadow of its folds. */
const withSmocks = (surface: THREE.Material, relief: { normalMap: THREE.Texture; aoMap: THREE.Texture }): THREE.Material => {
  if (surface instanceof THREE.MeshStandardMaterial) {
    surface.normalMap = relief.normalMap;
    surface.aoMap = relief.aoMap;
    surface.aoMapIntensity = 0.8;
    // A NaN normal from the relief map would come out as a black pixel through the post-processing.
    withNormalGuard(surface);
    surface.needsUpdate = true;
  }
  return surface;
};

const Garment: React.FC<{ scene: THREE.Group; fabric?: FabricLook | null | undefined; motifs: ReadonlyMap<string, RenderMotif> }> = ({
  scene,
  fabric,
  motifs,
}) => {
  const cloths = useMemo<Record<RenderClothRole, Cloth | null>>(() => {
    const dress = fabricMaterial(fabric);
    return {
      dress,
      accent: accentMaterial(fabric) ?? dress,
      plastron: fabric ? plastronMaterial(fabric, PLASTRON_FALLBACK) : null,
    };
  }, [fabric]);
  // Embroidery and smocking, drawn as in the preview (built only when the garment has them).
  const kinds = useMemo(() => new Set(Array.from(motifs.values(), (m) => m.motif)), [motifs]);
  const embroidery = useMemo(() => (kinds.has('BRODERIE') ? embroideryMap() : null), [kinds]);
  const smocks = useMemo(() => (kinds.has('SMOCKS') ? smockingMaps() : null), [kinds]);
  useEffect(
    () => () => {
      embroidery?.dispose();
      smocks?.normalMap.dispose();
      smocks?.aoMap.dispose();
    },
    [embroidery, smocks],
  );

  useEffect(() => {
    const created: THREE.Material[] = [];
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const swap = (material: THREE.Material): THREE.Material => {
        const motif = motifForMaterial(material.name, motifs);
        if (motif?.motif === 'BRODERIE' && embroidery) {
          // The thread alone over the cloth beneath (Blender simulated it as a layer on the dress).
          const thread = withNormalGuard(new THREE.MeshPhysicalMaterial(embroideryMaterialParameters(threadColor(motif.color, fabric?.contrastColor), embroidery)));
          thread.name = material.name;
          created.push(thread);
          return thread;
        }
        const cloth = cloths[clothRoleForMaterial(material.name)];
        if (!cloth) {
          material.side = THREE.DoubleSide;
          return motif?.motif === 'SMOCKS' && smocks ? withSmocks(material, smocks) : material;
        }
        const surface = surfaceFor(cloth);
        surface.name = material.name;
        created.push(surface);
        return motif?.motif === 'SMOCKS' && smocks ? withSmocks(surface, smocks) : surface;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
      // The simulated folds shade each other and the body (the AO deepens their hollows).
      applyStudioShadows(mesh);
    });
    return () => created.forEach((m) => m.dispose());
  }, [scene, cloths, motifs, embroidery, smocks, fabric?.contrastColor]);

  useEffect(() => () => [cloths.dress, cloths.accent, cloths.plastron].forEach((c) => c?.map?.dispose()), [cloths]);

  return <primitive object={scene} />;
};

const Mannequin: React.FC<{ human: HumanBaseData | null; model: GarmentModel; pose: BodyPose }> = ({ human, model, pose }) => {
  const geometry = useMemo(() => {
    if (!human) return null;
    const fitted = fitHumanBody(human, model.body, model.torsoRings, morphFor(model.body, model.templateId));
    const positions = isNeutral(pose) ? fitted.positions : applyPose(fitted.positions, human.armWeights, model.body, pose);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setIndex(new THREE.BufferAttribute(human.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [human, model.body, model.torsoRings, model.templateId, pose]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={model.body.skin} roughness={0.55} metalness={0} />
    </mesh>
  );
};

/**
 * The realistic render: the garment as Blender's cloth simulation left it (gravity, folds, seams closed), on the
 * mannequin posed as during the simulation. Geometry only comes from the `.glb`; the fabric is the preview's.
 */
export const RealisticRenderViewer: React.FC<RealisticRenderViewerProps> = ({
  glbUrl,
  model,
  pose,
  fabric,
  showMannequin = true,
  onError,
  onContextLost,
}) => {
  const scene = useSimulatedGarment(glbUrl, onError);
  const human = useHumanBase();
  // Same studio as the preview (`Garment3DViewer`): both renders must read as the same garment under the same light.
  const preset = LIGHTING_PRESETS.studio;
  const { tier, reportFrame } = useStudioQuality();
  const [renderReady, setRenderReady] = useState(false);
  const dpr = useMemo(() => dprRange(tier, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1), [tier]);
  // A fabric with a known surface is shown as a photograph: grey paper backdrop.
  const paper = Boolean(fabric?.fabricFinish);
  // The preview's panels say which `.glb` materials are an embroidery or a smocked panel (materials = panel ids).
  const motifs = useMemo(() => panelMotifs(model.panels), [model.panels]);
  const lost = useRef(onContextLost);
  lost.current = onContextLost;

  return (
    <div className="relative h-full w-full" data-testid="realistic-render-viewer">
      <Canvas
        frameloop="demand"
        dpr={dpr}
        shadows="variance"
        camera={{ position: [0, 1.0, VIEW_DISTANCE], fov: 32, near: 0.1, far: 30 }}
        gl={GL_OPTIONS}
        aria-label="Rendu réaliste du vêtement simulé sur le mannequin"
        onCreated={({ gl }) => {
          configureStudioRenderer(gl);
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            lost.current?.();
          });
        }}
      >
        {paper ? <StudioBackdrop /> : <color attach="background" args={['#041329']} />}
        <StudioEnvironment preset={preset} backdrop={paper ? 'paper' : 'navy'} />
        <StudioLights preset={preset} tier={tier} />
        {showMannequin && <ShadowFloor opacity={preset.floorShadowOpacity} />}
        {showMannequin && <Mannequin human={human} model={model} pose={pose} />}
        {scene && <Garment scene={scene} fabric={fabric} motifs={motifs} />}
        <OrbitControls target={[0, 0.95, 0]} enableDamping={false} minDistance={0.6} maxDistance={8} />
        <StudioPost
          tier={tier}
          aoAllowed
          aoBlend={SIMULATED_CLOTH_AO_BLEND}
          warmKey={`${scene ? glbUrl : 'loading'}:${human ? 'person' : 'none'}`}
          onReadyChange={setRenderReady}
          onFrame={reportFrame}
        />
      </Canvas>
      {(!scene || !renderReady) && (
        <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-sm border border-[#18375D] bg-[#041329]/80 px-3 py-2 font-sans text-[10px] uppercase tracking-widest text-[#D8D3C8] backdrop-blur-md">
            {scene ? 'Préparation du rendu…' : 'Chargement du rendu réaliste…'}
          </span>
        </div>
      )}
    </div>
  );
};
