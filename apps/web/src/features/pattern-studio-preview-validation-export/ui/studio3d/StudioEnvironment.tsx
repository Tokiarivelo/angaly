'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { LightingPreset, StudioBackdropName } from '../../utils/studio3d/studio-config';
import { buildSoftboxRoom, disposeScene } from '../../utils/studio3d/studio-scene';

/**
 * Studio reflections (eyes, skin sheen, satin, velvet): the preset's softboxes in a grey room, pre-filtered once
 * with PMREM. No network asset.
 */
export const StudioEnvironment: React.FC<{ preset: LightingPreset; backdrop: StudioBackdropName }> = ({ preset, backdrop }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = buildSoftboxRoom(preset, backdrop);
    const env = pmrem.fromScene(room, 0.02).texture;
    disposeScene(room);
    pmrem.dispose();
    scene.environment = env;
    scene.environmentIntensity = preset.environmentIntensity;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene, preset, backdrop, invalidate]);
  return null;
};
