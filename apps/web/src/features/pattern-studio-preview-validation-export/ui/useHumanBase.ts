'use client';

import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type * as THREE from 'three';
import type { HumanBaseData } from '../utils/garment3d/human-body';

export const HUMAN_BASE_URL = '/models/human-base.glb';

interface HumanExtras {
  morphNames: string[];
  armWeights: number[];
  landmarksFemale: number[];
  landmarksMale: number[];
  landmarksFemaleChild: number[];
  landmarksMaleChild: number[];
}

let cached: Promise<HumanBaseData> | null = null;

const load = (): Promise<HumanBaseData> =>
  new Promise((resolve, reject) => {
    new GLTFLoader().load(
      HUMAN_BASE_URL,
      (gltf) => {
        let mesh: THREE.Mesh | null = null;
        gltf.scene.traverse((o) => {
          if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
        });
        const found = mesh as THREE.Mesh | null;
        const extras = found?.userData as Partial<HumanExtras> | undefined;
        const morphAttrs = found?.geometry.morphAttributes['position'];
        if (!found || !extras?.morphNames || !extras.armWeights || !morphAttrs) {
          reject(new Error('human-base.glb: unexpected content'));
          return;
        }
        const morphs: Record<string, Float32Array> = {};
        extras.morphNames.forEach((name, i) => {
          const attr = morphAttrs[i];
          if (attr) morphs[name] = Float32Array.from(attr.array as ArrayLike<number>);
        });
        resolve({
          positions: Float32Array.from(found.geometry.getAttribute('position').array as ArrayLike<number>),
          indices: Uint32Array.from(found.geometry.getIndex()?.array as ArrayLike<number>),
          morphs,
          armWeights: Float32Array.from(extras.armWeights),
          landmarksFemale: extras.landmarksFemale ?? [],
          landmarksMale: extras.landmarksMale ?? [],
          landmarksFemaleChild: extras.landmarksFemaleChild ?? [],
          landmarksMaleChild: extras.landmarksMaleChild ?? [],
        });
      },
      undefined,
      (error) => reject(error instanceof Error ? error : new Error('human-base.glb: load failed')),
    );
  });

/** Loads the human base mesh once per page; `null` while loading or when it cannot be loaded. */
export const useHumanBase = (): HumanBaseData | null => {
  const [data, setData] = useState<HumanBaseData | null>(null);
  useEffect(() => {
    let alive = true;
    cached ??= load();
    cached.then(
      (d) => alive && setData(d),
      () => {
        cached = null; // allow a retry on the next mount
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return data;
};
