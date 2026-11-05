import type * as THREE from 'three';

/** Where three's fragment shader perturbs the normal (normal map, bump map). */
const NORMAL_MAPS_CHUNK = '#include <normal_fragment_maps>';

/** GLSL put after it: a NaN or null perturbed normal falls back to the surface's own normal. */
export const NORMAL_GUARD_GLSL = `${NORMAL_MAPS_CHUNK}
if ( any( isnan( normal ) ) || dot( normal, normal ) < 1e-8 ) normal = nonPerturbedNormal;`;

/**
 * `onBeforeCompile` for materials with a bump or normal map (embroidery, smocking). The derivative-based tangent frame
 * gives a NaN normal where the map is flat over a degenerate triangle; through the half-float post-processing a NaN
 * pixel comes out black (teardown trap: one NaN blacks out its pixel after post-processing).
 */
export const guardPerturbedNormal = (shader: { fragmentShader: string }): void => {
  if (!shader.fragmentShader.includes(NORMAL_MAPS_CHUNK) || shader.fragmentShader.includes(NORMAL_GUARD_GLSL)) return;
  shader.fragmentShader = shader.fragmentShader.replace(NORMAL_MAPS_CHUNK, NORMAL_GUARD_GLSL);
};

/** Installs the guard on a material (distinct program cache key: the guarded program is not shared with others). */
export const withNormalGuard = <M extends THREE.Material>(material: M): M => {
  material.onBeforeCompile = guardPerturbedNormal;
  material.customProgramCacheKey = () => 'normal-guard';
  return material;
};
