import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AO_SETTINGS, QUALITY_TIERS, type QualityTierName } from './studio-config';
import { hideForAo } from './studio-scene';

/** A pass that draws nothing and only runs a callback (hide / show objects around the AO pass). */
class CallbackPass extends Pass {
  constructor(private readonly run: () => void) {
    super();
    this.needsSwap = false;
  }

  override render(): void {
    this.run();
  }
}

export interface StudioComposer {
  composer: EffectComposer;
  gtao: GTAOPass;
  /** Draws one frame through the passes, to the canvas. */
  render: () => void;
  /** Canvas size in CSS px and its pixel ratio. */
  setSize: (width: number, height: number, pixelRatio: number) => void;
  /** MSAA samples and AO of a tier (`aoAllowed` false ⇒ AO off whatever the tier, e.g. see-through mode). */
  setQuality: (tier: QualityTierName, aoAllowed: boolean) => void;
  dispose: () => void;
}

/**
 * The studio's post-processing, as in teardown's V8 stage: scene → (floor and overlays hidden) GTAO → shown again →
 * output (tone mapping, sRGB). The scene renders into a half-float target with the tier's MSAA (the canvas itself is
 * created without anti-aliasing).
 */
export const createStudioComposer = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  tier: QualityTierName,
  aoAllowed: boolean,
  /** How strongly the AO darkens the frame (0–1); `AO_SETTINGS.blendIntensity` by default. */
  aoBlend: number = AO_SETTINGS.blendIntensity,
): StudioComposer => {
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: QUALITY_TIERS[tier].samples });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 4, 4);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = aoBlend;
  gtao.updateGtaoMaterial({
    radius: AO_SETTINGS.radius,
    distanceExponent: AO_SETTINGS.distanceExponent,
    thickness: AO_SETTINGS.thickness,
    scale: AO_SETTINGS.scale,
    samples: AO_SETTINGS.samples,
    distanceFallOff: AO_SETTINGS.distanceFallOff,
    screenSpaceRadius: false,
  });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  let restore: (() => void) | null = null;
  const hide = new CallbackPass(() => {
    restore = hideForAo(scene);
  });
  const show = new CallbackPass(() => {
    restore?.();
    restore = null;
  });
  composer.addPass(hide);
  composer.addPass(gtao);
  composer.addPass(show);
  composer.addPass(new OutputPass());

  let samples = QUALITY_TIERS[tier].samples;
  const setQuality = (next: QualityTierName, allowed: boolean): void => {
    const ao = QUALITY_TIERS[next].ao && allowed;
    gtao.enabled = ao;
    hide.enabled = ao;
    show.enabled = ao;
    const wanted = QUALITY_TIERS[next].samples;
    if (wanted !== samples) {
      samples = wanted;
      for (const t of [composer.renderTarget1, composer.renderTarget2]) {
        t.samples = wanted;
        // three reallocates the target's buffers with the new sample count on next use.
        t.dispose();
      }
    }
  };
  setQuality(tier, aoAllowed);

  return {
    composer,
    gtao,
    render: () => composer.render(),
    setSize: (width, height, pixelRatio) => {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
    },
    setQuality,
    dispose: () => {
      restore?.();
      gtao.dispose();
      composer.dispose();
    },
  };
};
