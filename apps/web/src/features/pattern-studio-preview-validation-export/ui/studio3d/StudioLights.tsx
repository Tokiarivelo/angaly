'use client';

import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SHADOW_TARGET, type LightingPreset, type QualityTierName } from '../../utils/studio3d/studio-config';
import { configureKeyShadow } from '../../utils/studio3d/studio-scene';

/** The preset's lights: one shadow-casting key aimed at the body, shadowless fills, a sky/ground hemisphere. */
export const StudioLights: React.FC<{ preset: LightingPreset; tier: QualityTierName }> = ({ preset, tier }) => {
  const invalidate = useThree((state) => state.invalidate);
  const key = useMemo(() => new THREE.DirectionalLight(), []);
  useEffect(() => () => key.dispose(), [key]);
  useEffect(() => {
    key.position.set(...preset.key.position);
    key.color.set(preset.key.color);
    key.intensity = preset.key.intensity;
    key.target.position.set(...SHADOW_TARGET);
    key.target.updateMatrixWorld();
    configureKeyShadow(key, preset, tier);
    invalidate();
  }, [key, preset, tier, invalidate]);
  return (
    <>
      <primitive object={key} />
      <primitive object={key.target} />
      {preset.fills.map((light, i) => (
        <directionalLight key={i} position={[...light.position]} intensity={light.intensity} color={light.color} />
      ))}
      <hemisphereLight args={[preset.hemisphere.sky, preset.hemisphere.ground, preset.hemisphere.intensity]} />
    </>
  );
};
