import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AO_SETTINGS, QUALITY_TIERS, SIMULATED_CLOTH_AO_BLEND } from '../studio-config';
import { createStudioComposer } from '../studio-composer';
import { createShadowFloor } from '../studio-scene';

/** Enough of a WebGLRenderer for the composer to be built and resized (no frame is drawn). */
const fakeRenderer = (): THREE.WebGLRenderer =>
  ({
    getPixelRatio: () => 1,
    getSize: (v: THREE.Vector2) => v.set(800, 600),
  }) as unknown as THREE.WebGLRenderer;

const setup = (tier: 'high' | 'medium' | 'low' = 'high', aoAllowed = true) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const post = createStudioComposer(fakeRenderer(), scene, camera, tier, aoAllowed);
  return { scene, camera, post };
};

describe('createStudioComposer', () => {
  it('chains scene → hide → GTAO → show → output', () => {
    const { post } = setup();
    const passes = post.composer.passes;
    expect(passes).toHaveLength(5);
    expect(passes[0]).toBeInstanceOf(RenderPass);
    expect(passes[2]).toBeInstanceOf(GTAOPass);
    expect(passes[4]).toBeInstanceOf(OutputPass);
    expect(passes[1]!.needsSwap).toBe(false);
    expect(passes[3]!.needsSwap).toBe(false);
    expect(post.gtao.blendIntensity).toBe(AO_SETTINGS.blendIntensity);
    expect(post.composer.renderTarget1.texture.type).toBe(THREE.HalfFloatType);
    expect(post.composer.renderTarget1.samples).toBe(QUALITY_TIERS.high.samples);
  });

  it('takes a stronger AO blend for the simulated cloth', () => {
    const post = createStudioComposer(fakeRenderer(), new THREE.Scene(), new THREE.PerspectiveCamera(), 'high', true, SIMULATED_CLOTH_AO_BLEND);
    expect(post.gtao.blendIntensity).toBe(SIMULATED_CLOTH_AO_BLEND);
    expect(SIMULATED_CLOTH_AO_BLEND).toBeGreaterThan(AO_SETTINGS.blendIntensity);
    expect(SIMULATED_CLOTH_AO_BLEND).toBeLessThanOrEqual(1);
  });

  it('hides the floor during the AO pass and shows it after', () => {
    const { scene, post } = setup();
    const floor = createShadowFloor(0.3);
    scene.add(floor);
    const [, hide, , show] = post.composer.passes;
    hide!.render({} as THREE.WebGLRenderer, {} as THREE.WebGLRenderTarget, {} as THREE.WebGLRenderTarget, 0, false);
    expect(floor.visible).toBe(false);
    show!.render({} as THREE.WebGLRenderer, {} as THREE.WebGLRenderTarget, {} as THREE.WebGLRenderTarget, 0, false);
    expect(floor.visible).toBe(true);
    // Showing twice is harmless.
    show!.render({} as THREE.WebGLRenderer, {} as THREE.WebGLRenderTarget, {} as THREE.WebGLRenderTarget, 0, false);
    expect(floor.visible).toBe(true);
  });

  it('turns AO on only for a tier that has it, when allowed', () => {
    const { post } = setup('high', true);
    expect(post.gtao.enabled).toBe(true);
    post.setQuality('high', false);
    expect(post.gtao.enabled).toBe(false);
    expect(post.composer.passes[1]!.enabled).toBe(false);
    post.setQuality('medium', true);
    expect(post.gtao.enabled).toBe(false);
    post.setQuality('high', true);
    expect(post.gtao.enabled).toBe(true);
  });

  it('changes the MSAA samples with the tier, reallocating the targets', () => {
    const { post } = setup('high');
    const dispose = vi.spyOn(post.composer.renderTarget1, 'dispose');
    post.setQuality('high', true);
    expect(dispose).not.toHaveBeenCalled();
    post.setQuality('low', true);
    expect(dispose).toHaveBeenCalled();
    expect(post.composer.renderTarget1.samples).toBe(0);
    expect(post.composer.renderTarget2.samples).toBe(0);
  });

  it('resizes every pass with the pixel ratio', () => {
    const { post } = setup();
    const gtaoSize = vi.spyOn(post.gtao, 'setSize');
    post.setSize(400, 300, 2);
    expect(post.composer.renderTarget1.width).toBe(800);
    expect(post.composer.renderTarget1.height).toBe(600);
    expect(gtaoSize).toHaveBeenCalledWith(800, 600);
  });

  it('renders through the composer and disposes it', () => {
    const { scene, post } = setup();
    const render = vi.spyOn(post.composer, 'render').mockImplementation(() => undefined);
    post.render();
    expect(render).toHaveBeenCalled();
    const floor = createShadowFloor(0.3);
    scene.add(floor);
    post.composer.passes[1]!.render({} as THREE.WebGLRenderer, {} as THREE.WebGLRenderTarget, {} as THREE.WebGLRenderTarget, 0, false);
    const gtaoDispose = vi.spyOn(post.gtao, 'dispose');
    const composerDispose = vi.spyOn(post.composer, 'dispose');
    post.dispose();
    expect(gtaoDispose).toHaveBeenCalled();
    expect(composerDispose).toHaveBeenCalled();
    // A frame interrupted between hide and show leaves nothing hidden.
    expect(floor.visible).toBe(true);
  });
});
