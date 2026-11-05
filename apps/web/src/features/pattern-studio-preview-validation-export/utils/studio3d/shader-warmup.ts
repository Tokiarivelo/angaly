import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/*
 * Shader warm-up before the first frame (port of teardown's `sims/kit/warm.js`). three.js links a program the first
 * time something draws with it, and the frame waits on each in turn: 1–2 s on an integrated GPU, a frozen page
 * meanwhile. Here they all start at once (`renderer.compileAsync`, KHR_parallel_shader_compile) and the viewer waits
 * without blocking — the scene's materials and the ones held by the post passes, which compileAsync never meets on its
 * own. Each set compiles against the target it draws into, so the cached program matches the frame's.
 */

/** three's full-screen triangle: position and uv, no normal (as the pass quads). */
const fullScreenTriangle = (): THREE.BufferGeometry => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  return g;
};

/** Every material a pass holds directly or in an array. */
export const passMaterials = (pass: Pass): THREE.Material[] =>
  Object.values(pass as unknown as Record<string, unknown>).flatMap((v) =>
    v instanceof THREE.Material ? [v] : Array.isArray(v) ? v.filter((m): m is THREE.Material => m instanceof THREE.Material) : [],
  );

/** Drawn over the scene's own meshes (as `scene.overrideMaterial`) rather than on a quad. */
export const isOverrideMaterial = (m: THREE.Material): boolean =>
  m instanceof THREE.MeshNormalMaterial || m instanceof THREE.MeshDepthMaterial || m instanceof THREE.MeshDistanceMaterial;

export interface WarmupJob {
  scene?: THREE.Object3D;
  materials?: THREE.Material[];
  /** null ⇒ the canvas. */
  target: THREE.WebGLRenderTarget | null;
  /** A scene whose lights apply (override materials see the scene's lights and shadows). */
  lights?: THREE.Scene | null;
  override?: boolean;
}

/** Compiles every job in parallel; resolves when all programs are linked. */
export const warmUp = (renderer: THREE.WebGLRenderer, camera: THREE.Camera, jobs: WarmupJob[]): Promise<unknown> => {
  const previous = renderer.getRenderTarget();
  const triangle = fullScreenTriangle();
  const plane = new THREE.PlaneGeometry(1, 1);
  const waits = jobs.map(({ scene, materials = [], target, lights = null, override = false }) => {
    let root = scene;
    if (!root) {
      root = new THREE.Scene();
      for (const m of materials) root.add(new THREE.Mesh(override || isOverrideMaterial(m) ? plane : triangle, m));
    }
    renderer.setRenderTarget(target);
    return renderer.compileAsync(root, camera, lights);
  });
  renderer.setRenderTarget(previous);
  return Promise.all(waits).finally(() => {
    triangle.dispose();
    plane.dispose();
  });
};

/** The scene and every enabled pass of a composer; the last pass draws to the canvas. */
export const warmComposer = (
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): Promise<unknown> => {
  const target = composer.renderTarget1;
  const passes = composer.passes.filter((p) => p.enabled);
  const last = composer.renderToScreen ? passes[passes.length - 1] ?? null : null;
  // OutputPass picks its defines (tone mapping, sRGB) on its first render: run that part now, without drawing. It
  // binds a render target on the way: the canvas's own target is put back after (else what draws next, like the
  // navigation gizmo, goes off screen).
  const before = renderer.getRenderTarget();
  for (const pass of passes) {
    if (!(pass instanceof OutputPass)) continue;
    const holder = pass as unknown as { fsQuad: { render: (r: THREE.WebGLRenderer) => void } };
    const quad = holder.fsQuad;
    holder.fsQuad = { render: () => undefined };
    pass.render(renderer, composer.renderTarget2, composer.renderTarget1, 0, false);
    holder.fsQuad = quad;
  }
  renderer.setRenderTarget(before);
  const materials = passes.filter((p) => p !== last).flatMap(passMaterials);
  return warmUp(renderer, camera, [
    { scene, target },
    { materials: materials.filter((m) => !isOverrideMaterial(m)), target },
    { materials: materials.filter(isOverrideMaterial), target, lights: scene },
    { materials: last ? passMaterials(last) : [], target: null },
  ]);
};
