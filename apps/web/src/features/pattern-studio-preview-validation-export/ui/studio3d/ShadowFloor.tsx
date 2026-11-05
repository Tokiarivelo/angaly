'use client';

import React, { useEffect, useMemo } from 'react';
import { createShadowFloor } from '../../utils/studio3d/studio-scene';

/** The invisible floor that only catches the key light's shadow (replaces the old dark disc under the feet). */
export const ShadowFloor: React.FC<{ opacity: number }> = ({ opacity }) => {
  const floor = useMemo(() => createShadowFloor(opacity), [opacity]);
  useEffect(
    () => () => {
      floor.geometry.dispose();
      floor.material.dispose();
    },
    [floor],
  );
  return <primitive object={floor} />;
};
