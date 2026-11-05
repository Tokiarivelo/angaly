import * as THREE from 'three';
import {
  ENVIRONMENT_ROOM_COLORS,
  QUALITY_TIERS,
  SHADOW_CAMERA_HALF_SIZE,
  SHADOW_RADIUS_MAP_SIZE,
  type LightingPreset,
  type QualityTierName,
  type StudioBackdropName,
} from './studio-config';

/** `userData` flag: the object is left out of the ambient-occlusion pass (floor, overlays, see-through layers). */
export const NO_AO = 'studioNoAo';

/**
 * The room the environment map is made from: grey walls, the preset's softboxes (white panels brighter than 1, so
 * they read as light sources after PMREM) and a darker floor disc. Disposes nothing: call `disposeScene` after use.
 */
export const buildSoftboxRoom = (preset: LightingPreset, backdrop: StudioBackdropName): THREE.Scene => {
  const room = new THREE.Scene();
  room.background = new THREE.Color(ENVIRONMENT_ROOM_COLORS[backdrop]);
  for (const box of preset.softboxes) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(box.width, box.height),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(box.intensity), side: THREE.DoubleSide }),
    );
    panel.position.set(...box.position);
    panel.lookAt(0, 1, 0);
    room.add(panel);
  }
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(ENVIRONMENT_ROOM_COLORS[backdrop]).multiplyScalar(0.6), side: THREE.DoubleSide }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  room.add(floor);
  return room;
};

/** Frees the geometries and materials of a throwaway scene (the softbox room once converted). */
export const disposeScene = (scene: THREE.Object3D): void => {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      (object.geometry as THREE.BufferGeometry).dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const m of materials as THREE.Material[]) m.dispose();
    }
  });
};

/**
 * The invisible floor that only shows the shadow. `polygonOffset` pulls it forward in depth: without it the shadow
 * catcher loses the depth test inside the post-processing render target (teardown trap).
 */
export const createShadowFloor = (opacity: number): THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial> => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ color: '#0B1220', opacity, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.userData[NO_AO] = true;
  floor.name = 'studio-shadow-floor';
  return floor;
};

/**
 * Sets the key light's VSM shadow: a camera held tight around the body (sharper texels; the light aims at
 * `SHADOW_TARGET`, the body's middle), the tier's map size, the preset's blur, and teardown's biases (no acne on the cloth, no peter-panning under the feet).
 */
export const configureKeyShadow = (light: THREE.DirectionalLight, preset: LightingPreset, tier: QualityTierName): void => {
  light.castShadow = true;
  const camera = light.shadow.camera;
  const h = SHADOW_CAMERA_HALF_SIZE;
  camera.left = -h;
  camera.right = h;
  camera.top = h;
  camera.bottom = -h;
  camera.near = 0.5;
  camera.far = 12;
  camera.updateProjectionMatrix();
  const size = QUALITY_TIERS[tier].shadowMap;
  if (light.shadow.mapSize.x !== size) {
    light.shadow.mapSize.set(size, size);
    // A new size only takes effect with a new map.
    light.shadow.map?.dispose();
    light.shadow.map = null;
  }
  // The radius is in shadow-map texels: scaled with the map so the edge is equally soft whatever the tier.
  light.shadow.radius = preset.key.shadowRadius * (size / SHADOW_RADIUS_MAP_SIZE);
  light.shadow.blurSamples = 24;
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.002;
};

const materialsOf = (object: THREE.Object3D): THREE.Material[] => {
  const material = (object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
};

/**
 * Objects that must not write the AO pass's normals and depth: flagged ones (floor), see-through materials (tulle,
 * the "Transparence" mode), overlays drawn over everything (brush, edit points), cut-out hair and lace (the normal
 * pass ignores alpha tests: the cut parts would come back as a pale ghost). Points and lines are skipped by GTAO.
 */
export const excludedFromAo = (object: THREE.Object3D): boolean => {
  if (object.userData[NO_AO]) return true;
  return materialsOf(object).some((m) => m.transparent || !m.depthTest || m.alphaTest > 0);
};

/**
 * Shadow flags of a loaded mesh (the simulated `.glb`): it receives the studio's shadows, and casts one unless it is
 * a see-through layer (the embroidery thread over the dress), whose own shadow would darken the cloth right under it.
 */
export const applyStudioShadows = (mesh: THREE.Mesh): void => {
  mesh.castShadow = !materialsOf(mesh).some((m) => m.transparent);
  mesh.receiveShadow = true;
};

/** Hides the objects left out of the AO pass; returns the function that shows them again. */
export const hideForAo = (scene: THREE.Object3D): (() => void) => {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (object.visible && (object as THREE.Mesh).isMesh && excludedFromAo(object)) {
      object.visible = false;
      hidden.push(object);
    }
  });
  return () => {
    for (const object of hidden) object.visible = true;
  };
};

/** The renderer settings of the studio: neutral tone mapping (truer fabric colours than ACES), soft VSM shadows. */
export const configureStudioRenderer = (renderer: THREE.WebGLRenderer): void => {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
};
