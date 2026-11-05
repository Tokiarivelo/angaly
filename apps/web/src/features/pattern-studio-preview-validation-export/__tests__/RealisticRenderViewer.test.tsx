import { render, screen, waitFor } from '@testing-library/react';
import * as THREE from 'three';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GarmentModel } from '../utils/garment3d/garment-model';
import { NEUTRAL_POSE } from '../utils/garment3d/pose';
import { SIMULATED_CLOTH_AO_BLEND } from '../utils/studio3d/studio-config';

/** What the studio parts and the canvas received (three.js cannot draw in jsdom). */
const probe = vi.hoisted(() => ({
  canvas: {} as Record<string, unknown>,
  post: {} as Record<string, unknown>,
  parts: [] as string[],
  glb: null as THREE.Group | null,
  fail: false,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
    probe.canvas = props;
    return <div data-testid="canvas">{children}</div>;
  },
  useThree: () => undefined,
}));
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null }));

const part = vi.hoisted(
  () => (name: string) =>
    function Part() {
      probe.parts.push(name);
      return null;
    },
);
vi.mock('../ui/studio3d/StudioBackdrop', () => ({ StudioBackdrop: part('backdrop') }));
vi.mock('../ui/studio3d/StudioEnvironment', () => ({ StudioEnvironment: part('environment') }));
vi.mock('../ui/studio3d/StudioLights', () => ({ StudioLights: part('lights') }));
vi.mock('../ui/studio3d/ShadowFloor', () => ({ ShadowFloor: part('floor') }));
vi.mock('../ui/studio3d/StudioPost', () => ({
  StudioPost: (props: Record<string, unknown>) => {
    probe.post = props;
    return null;
  },
}));
vi.mock('../ui/useHumanBase', () => ({ useHumanBase: () => null }));

vi.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: class {
    setDecoderPath() {
      return this;
    }
  },
}));
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    setDRACOLoader() {
      return this;
    }
    load(_url: string, onLoad: (gltf: { scene: THREE.Group }) => void, _progress: unknown, onError: () => void) {
      queueMicrotask(() => (probe.fail || !probe.glb ? onError() : onLoad({ scene: probe.glb })));
    }
  },
}));

import { RealisticRenderViewer } from '../ui/RealisticRenderViewer';

const model = { panels: [], body: { skin: '#c99' } } as unknown as GarmentModel;

/** A simulated garment: a dress panel and the embroidery thread laid over it. */
const simulatedGarment = (): { scene: THREE.Group; dress: THREE.Mesh; thread: THREE.Mesh } => {
  const scene = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ name: 'front' }));
  const thread = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({ name: 'front-thread', transparent: true }));
  scene.add(dress, thread);
  return { scene, dress, thread };
};

describe('RealisticRenderViewer', () => {
  beforeEach(() => {
    probe.canvas = {};
    probe.post = {};
    probe.parts = [];
    probe.glb = null;
    probe.fail = false;
  });

  it('renders in the preview’s studio: VSM shadows, no canvas AA, softboxes, key light, floor, post-processing', () => {
    probe.glb = simulatedGarment().scene;
    render(<RealisticRenderViewer glbUrl="/r.glb" model={model} pose={NEUTRAL_POSE} />);
    expect(probe.canvas['shadows']).toBe('variance');
    expect((probe.canvas['gl'] as { antialias: boolean; toneMapping: number }).antialias).toBe(false);
    expect((probe.canvas['gl'] as { toneMapping: number }).toneMapping).toBe(THREE.NeutralToneMapping);
    expect(probe.parts).toEqual(expect.arrayContaining(['environment', 'lights', 'floor']));
    expect(probe.parts).not.toContain('backdrop');
    expect(probe.post['aoAllowed']).toBe(true);
    expect(probe.post['aoBlend']).toBe(SIMULATED_CLOTH_AO_BLEND);
  });

  it('turns the shadows on for the simulated meshes once the .glb is loaded, and warms the shaders again', async () => {
    const { scene, dress, thread } = simulatedGarment();
    probe.glb = scene;
    render(<RealisticRenderViewer glbUrl="/r.glb" model={model} pose={NEUTRAL_POSE} />);
    expect(screen.getByText('Chargement du rendu réaliste…')).toBeInTheDocument();
    expect(probe.post['warmKey']).toBe('loading:none');
    await waitFor(() => expect(dress.castShadow).toBe(true));
    expect(dress.receiveShadow).toBe(true);
    expect(thread.castShadow).toBe(false);
    expect(thread.receiveShadow).toBe(true);
    expect(probe.post['warmKey']).toBe('/r.glb:none');
    // Shaders still compiling: the waiting label says so instead of a frozen frame.
    expect(screen.getByText('Préparation du rendu…')).toBeInTheDocument();
  });

  it('shows the grey paper backdrop for a fabric with a known surface, no floor without the mannequin', () => {
    render(
      <RealisticRenderViewer glbUrl="/r.glb" model={model} pose={NEUTRAL_POSE} showMannequin={false} fabric={{ fabricColor: '#223344', fabricFinish: 'SATIN' }} />,
    );
    expect(probe.parts).toContain('backdrop');
    expect(probe.parts).not.toContain('floor');
  });

  it('reports a .glb that cannot be loaded', async () => {
    probe.fail = true;
    const onError = vi.fn();
    render(<RealisticRenderViewer glbUrl="/r.glb" model={model} pose={NEUTRAL_POSE} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('Le rendu réaliste n’a pas pu être chargé.'));
  });
});
