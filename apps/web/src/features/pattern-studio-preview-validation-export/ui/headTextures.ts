'use client';

import * as THREE from 'three';

/** Deterministic pseudo-random sequence (the textures look the same on every load). */
const random = (seed: number) => {
  let v = seed;
  return (): number => {
    v = (v * 16807) % 2147483647;
    return (v - 1) / 2147483646;
  };
};

const canvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  return ctx ? [c, ctx] : null;
};

/**
 * Hair strands colour map: fine streaks of varying brown along v (the length of a lock), so that the
 * sculpted locks read as hair. u runs across the strands.
 */
export const hairTexture = (base: string): THREE.Texture | null => {
  const color = canvas(512, 512);
  if (!color) return null;
  const [cc, c] = color;
  const rnd = random(7);
  const tone = new THREE.Color(base);
  c.fillStyle = `#${tone.getHexString()}`;
  c.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 3200; k += 1) {
    const x = rnd() * 512;
    const light = 0.45 + rnd() * 1.25;
    const col = tone.clone().multiplyScalar(light);
    c.strokeStyle = `rgba(${Math.round(Math.min(1, col.r) * 255)},${Math.round(Math.min(1, col.g) * 255)},${Math.round(Math.min(1, col.b) * 255)},${0.25 + rnd() * 0.5})`;
    c.lineWidth = 0.6 + rnd() * 1.6;
    c.beginPath();
    c.moveTo(x, 512);
    // Slight waviness along the strand.
    const wave = (rnd() - 0.5) * 6;
    c.bezierCurveTo(x + wave, 340, x - wave, 170, x + wave * 0.5, 0);
    c.stroke();
  }
  const map = new THREE.CanvasTexture(cc);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 1);
  map.anisotropy = 8;
  return map;
};

/**
 * Eyeball colour map on an equirectangular sphere whose top pole (+y before rotation) is the gaze:
 * pupil, iris with radial fibres, dark limbal ring, white sclera with a hint of warmth at the edges.
 */
export const eyeTexture = (iris = '#8a6440'): THREE.Texture | null => {
  const made = canvas(512, 256);
  if (!made) return null;
  const [cnv, ctx] = made;
  const image = ctx.createImageData(512, 256);
  const irisColor = new THREE.Color(iris);
  const rnd = random(3);
  const fibres = Array.from({ length: 512 }, () => 0.75 + rnd() * 0.5);
  for (let py = 0; py < 256; py += 1) {
    const theta = (py / 255) * Math.PI; // angle from the gaze axis
    for (let px = 0; px < 512; px += 1) {
      let r: number;
      let g: number;
      let b: number;
      if (theta < 0.17) {
        r = g = b = 0.02; // pupil
      } else if (theta < 0.5) {
        const t = (theta - 0.17) / 0.33;
        // Fibres, a lighter collarette around the pupil and a darker outer rim.
        const collarette = t < 0.25 ? 1.35 : 1;
        const k = fibres[px]! * collarette * (0.75 + 0.35 * (1 - t)) * (t > 0.85 ? 0.5 : 1);
        r = irisColor.r * k;
        g = irisColor.g * k;
        b = irisColor.b * k;
      } else if (theta < 0.55) {
        r = 0.08;
        g = 0.06;
        b = 0.05; // limbal ring
      } else {
        const warm = Math.min(1, (theta - 0.55) / 1.1);
        r = 0.86 - 0.04 * warm;
        g = 0.82 - 0.1 * warm;
        b = 0.78 - 0.12 * warm;
      }
      const o = (py * 512 + px) * 4;
      image.data[o] = Math.round(Math.min(1, r) * 255);
      image.data[o + 1] = Math.round(Math.min(1, g) * 255);
      image.data[o + 2] = Math.round(Math.min(1, b) * 255);
      image.data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(cnv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
