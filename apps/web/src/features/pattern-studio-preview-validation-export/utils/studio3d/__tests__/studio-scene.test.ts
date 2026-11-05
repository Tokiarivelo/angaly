import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { LIGHTING_PRESETS, QUALITY_TIERS, SHADOW_CAMERA_HALF_SIZE, SHADOW_RADIUS_MAP_SIZE } from '../studio-config';
import {
  NO_AO,
  applyStudioShadows,
  buildSoftboxRoom,
  configureKeyShadow,
  configureStudioRenderer,
  createShadowFloor,
  disposeScene,
  excludedFromAo,
  hideForAo,
} from '../studio-scene';

describe('buildSoftboxRoom', () => {
  it('has one bright panel per softbox, facing the body, and a floor', () => {
    const preset = LIGHTING_PRESETS.studio;
    const room = buildSoftboxRoom(preset, 'paper');
    const meshes = room.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh);
    expect(meshes).toHaveLength(preset.softboxes.length + 1);
    preset.softboxes.forEach((box, i) => {
      const panel = meshes[i]!;
      expect(panel.position.toArray()).toEqual([...box.position]);
      expect((panel.material as THREE.MeshBasicMaterial).color.r).toBeCloseTo(box.intensity);
      // The panel's normal points at the body.
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(panel.quaternion);
      const toBody = new THREE.Vector3(0, 1, 0).sub(panel.position).normalize();
      expect(normal.dot(toBody)).toBeGreaterThan(0.99);
    });
    expect(room.background).toBeInstanceOf(THREE.Color);
  });

  it('tints the room by backdrop', () => {
    const paper = buildSoftboxRoom(LIGHTING_PRESETS.soft, 'paper').background as THREE.Color;
    const navy = buildSoftboxRoom(LIGHTING_PRESETS.soft, 'navy').background as THREE.Color;
    expect(navy.b).toBeGreaterThan(navy.r);
    expect(paper.equals(navy)).toBe(false);
  });

  it('disposes every geometry and material', () => {
    const room = buildSoftboxRoom(LIGHTING_PRESETS.contrast, 'navy');
    const spies = room.children.flatMap((c) => {
      const m = c as THREE.Mesh;
      return [vi.spyOn(m.geometry, 'dispose'), vi.spyOn(m.material as THREE.Material, 'dispose')];
    });
    disposeScene(room);
    for (const spy of spies) expect(spy).toHaveBeenCalled();
  });

  it('disposes material arrays', () => {
    const group = new THREE.Group();
    const a = new THREE.MeshBasicMaterial();
    const b = new THREE.MeshBasicMaterial();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), [a, b]));
    const spyA = vi.spyOn(a, 'dispose');
    const spyB = vi.spyOn(b, 'dispose');
    disposeScene(group);
    expect(spyA).toHaveBeenCalled();
    expect(spyB).toHaveBeenCalled();
  });
});

describe('createShadowFloor', () => {
  it('is a flat shadow catcher pulled forward in depth, kept out of the AO', () => {
    const floor = createShadowFloor(0.3);
    expect(floor.material).toBeInstanceOf(THREE.ShadowMaterial);
    expect(floor.material.opacity).toBe(0.3);
    expect(floor.material.polygonOffset).toBe(true);
    expect(floor.material.polygonOffsetFactor).toBeLessThan(0);
    expect(floor.receiveShadow).toBe(true);
    expect(floor.rotation.x).toBeCloseTo(-Math.PI / 2);
    expect(floor.userData[NO_AO]).toBe(true);
    expect(excludedFromAo(floor)).toBe(true);
  });
});

describe('configureKeyShadow', () => {
  it('sets a tight VSM shadow sized by tier', () => {
    const light = new THREE.DirectionalLight();
    configureKeyShadow(light, LIGHTING_PRESETS.studio, 'high');
    expect(light.castShadow).toBe(true);
    expect(light.shadow.mapSize.x).toBe(QUALITY_TIERS.high.shadowMap);
    expect(light.shadow.camera.right).toBe(SHADOW_CAMERA_HALF_SIZE);
    expect(light.shadow.camera.left).toBe(-SHADOW_CAMERA_HALF_SIZE);
    expect(light.shadow.radius).toBe(LIGHTING_PRESETS.studio.key.shadowRadius * (QUALITY_TIERS.high.shadowMap / SHADOW_RADIUS_MAP_SIZE));
    expect(light.shadow.blurSamples).toBe(24);
    expect(light.shadow.bias).toBeLessThan(0);
    expect(light.shadow.normalBias).toBeGreaterThan(0);
  });

  it('drops the old shadow map when the tier changes its size', () => {
    const light = new THREE.DirectionalLight();
    configureKeyShadow(light, LIGHTING_PRESETS.studio, 'high');
    const map = new THREE.WebGLRenderTarget(4, 4);
    const dispose = vi.spyOn(map, 'dispose');
    light.shadow.map = map;
    configureKeyShadow(light, LIGHTING_PRESETS.soft, 'high');
    expect(light.shadow.map).toBe(map);
    configureKeyShadow(light, LIGHTING_PRESETS.soft, 'low');
    expect(dispose).toHaveBeenCalled();
    expect(light.shadow.map).toBeNull();
    expect(light.shadow.mapSize.x).toBe(QUALITY_TIERS.low.shadowMap);
  });
});

describe('excludedFromAo / hideForAo', () => {
  const mesh = (params: THREE.MeshBasicMaterialParameters): THREE.Mesh => new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(params));

  it('leaves out see-through, overlay and cut-out materials', () => {
    expect(excludedFromAo(mesh({}))).toBe(false);
    expect(excludedFromAo(mesh({ transparent: true }))).toBe(true);
    expect(excludedFromAo(mesh({ depthTest: false }))).toBe(true);
    expect(excludedFromAo(mesh({ alphaTest: 0.5 }))).toBe(true);
    expect(excludedFromAo(new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial({ transparent: true })]))).toBe(true);
    expect(excludedFromAo(new THREE.Group())).toBe(false);
  });

  it('hides them and shows them again', () => {
    const scene = new THREE.Scene();
    const cloth = mesh({});
    const tulle = mesh({ transparent: true });
    const hiddenAlready = mesh({ transparent: true });
    hiddenAlready.visible = false;
    scene.add(cloth, tulle, hiddenAlready, createShadowFloor(0.3));
    const restore = hideForAo(scene);
    expect(cloth.visible).toBe(true);
    expect(tulle.visible).toBe(false);
    expect(scene.getObjectByName('studio-shadow-floor')!.visible).toBe(false);
    restore();
    expect(tulle.visible).toBe(true);
    expect(scene.getObjectByName('studio-shadow-floor')!.visible).toBe(true);
    // An object hidden by the viewer stays hidden.
    expect(hiddenAlready.visible).toBe(false);
  });
});

describe('configureStudioRenderer', () => {
  it('sets neutral tone mapping and VSM shadows', () => {
    const renderer = { shadowMap: { enabled: false, type: THREE.PCFShadowMap } } as unknown as THREE.WebGLRenderer;
    configureStudioRenderer(renderer);
    expect(renderer.toneMapping).toBe(THREE.NeutralToneMapping);
    expect(renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
    expect(renderer.shadowMap.enabled).toBe(true);
    expect(renderer.shadowMap.type).toBe(THREE.VSMShadowMap);
  });
});

describe('applyStudioShadows', () => {
  it('lets an opaque simulated mesh cast and receive shadows', () => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    applyStudioShadows(mesh);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it('keeps a see-through layer (embroidery thread) from casting its own shadow', () => {
    const thread = new THREE.MeshPhysicalMaterial({ transparent: true });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), [new THREE.MeshStandardMaterial(), thread]);
    mesh.castShadow = true;
    applyStudioShadows(mesh);
    expect(mesh.castShadow).toBe(false);
    expect(mesh.receiveShadow).toBe(true);
  });
});
