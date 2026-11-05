import { act, render } from '@testing-library/react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIGHTING_PRESETS, QUALITY_TIERS } from '../utils/studio3d/studio-config';

/** The R3F state the components read, and the frame callbacks they register. */
const fiber = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  frames: [] as Array<{ cb: () => void; priority: number }>,
}));

vi.mock('@react-three/fiber', () => ({
  useThree: (select: (s: Record<string, unknown>) => unknown) => select(fiber.state),
  useFrame: (cb: () => void, priority = 0) => {
    fiber.frames.push({ cb, priority });
  },
}));

const post = vi.hoisted(() => ({
  instance: {
    composer: {},
    render: vi.fn(),
    setSize: vi.fn(),
    setQuality: vi.fn(),
    dispose: vi.fn(),
  },
  create: vi.fn(),
  warm: vi.fn(),
}));

vi.mock('../utils/studio3d/studio-composer', () => ({
  createStudioComposer: (...args: unknown[]) => {
    post.create(...args);
    return post.instance;
  },
}));
vi.mock('../utils/studio3d/shader-warmup', () => ({ warmComposer: (...args: unknown[]) => post.warm(...args) }));

const pmrem = vi.hoisted(() => ({ fromScene: vi.fn(), dispose: vi.fn(), texture: { dispose: vi.fn() } }));
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class PMREMGenerator {
    fromScene(...args: unknown[]) {
      pmrem.fromScene(...args);
      return { texture: pmrem.texture };
    }
    dispose() {
      pmrem.dispose();
    }
  }
  return { ...actual, PMREMGenerator };
});

import { ShadowFloor } from '../ui/studio3d/ShadowFloor';
import { StudioEnvironment } from '../ui/studio3d/StudioEnvironment';
import { StudioLights } from '../ui/studio3d/StudioLights';
import { StudioPost } from '../ui/studio3d/StudioPost';

const invalidate = vi.fn();
let scene: THREE.Scene;

beforeEach(() => {
  scene = new THREE.Scene();
  fiber.frames = [];
  fiber.state = {
    gl: {},
    scene,
    camera: new THREE.PerspectiveCamera(),
    size: { width: 800, height: 600 },
    viewport: { dpr: 1.5 },
    invalidate,
  };
  vi.clearAllMocks();
  // three's own JSX tags (primitive, lights) are unknown to react-dom: expected warnings.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('StudioEnvironment', () => {
  it('sets the softbox environment and clears it on unmount', () => {
    const { unmount } = render(<StudioEnvironment preset={LIGHTING_PRESETS.studio} backdrop="navy" />);
    expect(pmrem.fromScene).toHaveBeenCalledWith(expect.any(THREE.Scene), 0.02);
    expect(pmrem.dispose).toHaveBeenCalled();
    expect(scene.environment).toBe(pmrem.texture);
    expect(scene.environmentIntensity).toBe(LIGHTING_PRESETS.studio.environmentIntensity);
    expect(invalidate).toHaveBeenCalled();
    unmount();
    expect(scene.environment).toBeNull();
    expect(pmrem.texture.dispose).toHaveBeenCalled();
  });
});

describe('ShadowFloor', () => {
  it('builds the floor and frees it on unmount', () => {
    const geometry = vi.spyOn(THREE.PlaneGeometry.prototype, 'dispose');
    const { unmount } = render(<ShadowFloor opacity={0.3} />);
    unmount();
    expect(geometry).toHaveBeenCalled();
  });
});

describe('StudioLights', () => {
  it('aims a shadow-casting key at the body, sized by tier', () => {
    const shadow = vi.spyOn(THREE.DirectionalLight.prototype, 'dispose');
    const { unmount } = render(<StudioLights preset={LIGHTING_PRESETS.contrast} tier="medium" />);
    expect(invalidate).toHaveBeenCalled();
    unmount();
    expect(shadow).toHaveBeenCalled();
  });

  it('uses the preset and tier given', async () => {
    const seen: THREE.DirectionalLight[] = [];
    const original = THREE.DirectionalLight.prototype.dispose;
    vi.spyOn(THREE.DirectionalLight.prototype, 'dispose').mockImplementation(function (this: THREE.DirectionalLight) {
      seen.push(this);
      original.call(this);
    });
    const { unmount } = render(<StudioLights preset={LIGHTING_PRESETS.soft} tier="low" />);
    unmount();
    const key = seen[0]!;
    expect(key.castShadow).toBe(true);
    expect(key.intensity).toBe(LIGHTING_PRESETS.soft.key.intensity);
    expect(key.position.toArray()).toEqual([...LIGHTING_PRESETS.soft.key.position]);
    expect(key.shadow.mapSize.x).toBe(QUALITY_TIERS.low.shadowMap);
  });

  it('keeps the key light without its shadow when shadows are off', () => {
    const seen: THREE.DirectionalLight[] = [];
    const original = THREE.DirectionalLight.prototype.dispose;
    vi.spyOn(THREE.DirectionalLight.prototype, 'dispose').mockImplementation(function (this: THREE.DirectionalLight) {
      seen.push(this);
      original.call(this);
    });
    const { unmount } = render(<StudioLights preset={LIGHTING_PRESETS.studio} tier="high" shadows={false} />);
    unmount();
    expect(seen[0]!.castShadow).toBe(false);
    expect(seen[0]!.intensity).toBe(LIGHTING_PRESETS.studio.key.intensity);
  });
});

describe('StudioPost', () => {
  it('waits for the shaders, then renders every frame through the composer at priority 1', async () => {
    let finish!: () => void;
    post.warm.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const onReady = vi.fn();
    const onFrame = vi.fn();
    render(<StudioPost tier="high" aoAllowed warmKey="person" onReadyChange={onReady} onFrame={onFrame} />);
    expect(post.create).toHaveBeenCalledWith(fiber.state.gl, scene, fiber.state.camera, 'high', true, undefined);
    expect(post.instance.setSize).toHaveBeenCalledWith(800, 600, 1.5);
    expect(post.instance.setQuality).toHaveBeenCalledWith('high', true);
    expect(onReady).toHaveBeenLastCalledWith(false);
    const frame = fiber.frames.at(-1)!;
    expect(frame.priority).toBe(1);
    // Not ready: nothing drawn.
    frame.cb();
    expect(post.instance.render).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(onReady).toHaveBeenLastCalledWith(true);
    fiber.frames.at(-1)!.cb();
    fiber.frames.at(-1)!.cb();
    expect(post.instance.render).toHaveBeenCalledTimes(2);
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it('applies a new tier without a new composer and disposes on unmount', async () => {
    post.warm.mockResolvedValue(undefined);
    const { rerender, unmount } = render(<StudioPost tier="high" aoAllowed warmKey="a" />);
    rerender(<StudioPost tier="low" aoAllowed={false} warmKey="a" />);
    expect(post.create).toHaveBeenCalledTimes(1);
    expect(post.instance.setQuality).toHaveBeenLastCalledWith('low', false);
    await act(async () => undefined);
    unmount();
    expect(post.instance.dispose).toHaveBeenCalled();
  });
});
