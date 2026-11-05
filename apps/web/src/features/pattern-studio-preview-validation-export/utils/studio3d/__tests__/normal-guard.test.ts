import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { NORMAL_GUARD_GLSL, guardPerturbedNormal, withNormalGuard } from '../normal-guard';

describe('guardPerturbedNormal', () => {
  it('adds the NaN fallback right after the normal maps', () => {
    const shader = { fragmentShader: 'a\n#include <normal_fragment_maps>\nb' };
    guardPerturbedNormal(shader);
    expect(shader.fragmentShader).toBe(`a\n${NORMAL_GUARD_GLSL}\nb`);
    expect(shader.fragmentShader).toContain('normal = nonPerturbedNormal');
    // Applied twice: unchanged.
    guardPerturbedNormal(shader);
    expect(shader.fragmentShader.match(/isnan/g)).toHaveLength(1);
  });

  it('leaves a shader without normal maps alone', () => {
    const shader = { fragmentShader: 'void main() {}' };
    guardPerturbedNormal(shader);
    expect(shader.fragmentShader).toBe('void main() {}');
  });

  it('installs on a material with its own program key', () => {
    const material = withNormalGuard(new THREE.MeshPhysicalMaterial());
    expect(material.onBeforeCompile).toBe(guardPerturbedNormal);
    expect(material.customProgramCacheKey()).toBe('normal-guard');
  });
});
