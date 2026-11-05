'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Photo-studio backdrop for a real fabric: a seamless grey paper, lighter behind the head, darker towards the floor
 * (a dark garment reads against it, as on the fashion plates). Drawn as the scene background.
 */
export const StudioBackdrop: React.FC = () => {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const c = canvas.getContext('2d');
    if (!c) return undefined;
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#77787B');
    g.addColorStop(0.55, '#5E5F62');
    g.addColorStop(1, '#3B3C3F');
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const previous = scene.background;
    scene.background = texture;
    return () => {
      scene.background = previous;
      texture.dispose();
    };
  }, [scene]);
  return null;
};
