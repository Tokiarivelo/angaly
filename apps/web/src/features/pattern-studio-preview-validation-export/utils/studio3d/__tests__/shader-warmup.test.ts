import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createStudioComposer } from '../studio-composer';
import { isOverrideMaterial, passMaterials, warmComposer, warmUp } from '../shader-warmup';

const fakeRenderer = () => {
  const compiled: Array<{ root: THREE.Object3D; target: THREE.WebGLRenderTarget | null; lights: THREE.Scene | null | undefined }> = [];
  let target: THREE.WebGLRenderTarget | null = null;
  const renderer = {
    getPixelRatio: () => 1,
    getSize: (v: THREE.Vector2) => v.set(800, 600),
    getRenderTarget: () => target,
    setRenderTarget: (t: THREE.WebGLRenderTarget | null) => {
      target = t;
    },
    compileAsync: vi.fn((root: THREE.Object3D, _camera: THREE.Camera, lights?: THREE.Scene | null) => {
      compiled.push({ root, target, lights });
      return Promise.resolve(root);
    }),
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.NeutralToneMapping,
    toneMappingExposure: 1,
  } as unknown as THREE.WebGLRenderer;
  return { renderer, compiled };
};

describe('passMaterials / isOverrideMaterial', () => {
  it('finds the materials a pass holds, directly or in arrays', () => {
    const a = new THREE.MeshBasicMaterial();
    const b = new THREE.MeshNormalMaterial();
    const pass = { a, list: [b, 3, null], other: 'x' } as unknown as Parameters<typeof passMaterials>[0];
    expect(passMaterials(pass)).toEqual([a, b]);
    expect(isOverrideMaterial(a)).toBe(false);
    expect(isOverrideMaterial(b)).toBe(true);
    expect(isOverrideMaterial(new THREE.MeshDepthMaterial())).toBe(true);
  });
});

describe('warmUp', () => {
  it('compiles each job against its own target and restores the current one', async () => {
    const { renderer, compiled } = fakeRenderer();
    const before = new THREE.WebGLRenderTarget(2, 2);
    renderer.setRenderTarget(before);
    const target = new THREE.WebGLRenderTarget(2, 2);
    const scene = new THREE.Scene();
    const quad = new THREE.ShaderMaterial();
    const normals = new THREE.MeshNormalMaterial();
    await warmUp(renderer, new THREE.PerspectiveCamera(), [
      { scene, target },
      { materials: [quad, normals], target: null, lights: scene },
    ]);
    expect(compiled).toHaveLength(2);
    expect(compiled[0]).toMatchObject({ root: scene, target });
    expect(compiled[1]!.target).toBeNull();
    expect(compiled[1]!.lights).toBe(scene);
    const meshes = compiled[1]!.root.children as THREE.Mesh[];
    // A pass quad has no normals; an override material is drawn on a mesh that has some.
    expect(meshes[0]!.geometry.getAttribute('normal')).toBeUndefined();
    expect(meshes[1]!.geometry.getAttribute('normal')).toBeDefined();
    expect(renderer.getRenderTarget()).toBe(before);
  });
});

describe('warmComposer', () => {
  it('warms the scene, the passes and the output pass (whose defines are set first)', async () => {
    const { renderer, compiled } = fakeRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const post = createStudioComposer(renderer, scene, camera, 'high', true);
    const output = post.composer.passes.find((p) => p instanceof OutputPass) as OutputPass;
    await warmComposer(renderer, post.composer, scene, camera);
    expect(compiled).toHaveLength(4);
    expect(compiled[0]!.root).toBe(scene);
    // GTAO's own materials (AO, denoise, blend) are compiled into the composer's target, its normals with the scene's lights.
    const gtaoMaterials = passMaterials(post.gtao as GTAOPass);
    const quadMaterials = (compiled[1]!.root.children as THREE.Mesh[]).map((m) => m.material);
    expect(quadMaterials.length).toBeGreaterThan(0);
    expect(quadMaterials.every((m) => gtaoMaterials.includes(m as THREE.Material))).toBe(true);
    expect(compiled[2]!.lights).toBe(scene);
    expect(compiled[3]!.target).toBeNull();
    expect((compiled[3]!.root.children[0] as THREE.Mesh).material).toBe(output.material);
    expect(output.material.defines).toHaveProperty('NEUTRAL_TONE_MAPPING');    // The canvas's target is bound again afterwards.
    expect(renderer.getRenderTarget()).toBeNull();
  });

  it('leaves the disabled AO out', async () => {
    const { renderer, compiled } = fakeRenderer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const post = createStudioComposer(renderer, scene, camera, 'low', true);
    await warmComposer(renderer, post.composer, scene, camera);
    expect(compiled[1]!.root.children).toHaveLength(0);
    expect(compiled[2]!.root.children).toHaveLength(0);
  });
});
