'use client';

import * as THREE from 'three';
import { isHexColor, type FabricPrint, type GarmentFit } from '@angaly/types';

/** What the 3D preview needs to dress the panels in the photo's fabric. */
export type FabricLook = Pick<GarmentFit, 'fabricPrint' | 'fabricColor' | 'motifColor'>;

/** Width of one repeat of the print on the fabric (m): panels carry flat-fabric UVs in metres. */
export const PRINT_TILE_M = 0.05;

const SIZE = 256;

const draw: Record<Exclude<FabricPrint, 'UNI'>, (c: CanvasRenderingContext2D) => void> = {
  // Two staggered 1.5 cm dots per 5 cm repeat.
  POIS: (c) => {
    const r = SIZE * 0.15;
    for (const [x, y] of [
      [0.25, 0.25],
      [0.75, 0.75],
    ] as const) {
      c.beginPath();
      c.arc(x * SIZE, y * SIZE, r, 0, Math.PI * 2);
      c.fill();
    }
  },
  RAYURES: (c) => {
    c.fillRect(0, 0, SIZE * 0.3, SIZE);
  },
  CARREAUX: (c) => {
    c.globalAlpha = 0.55;
    c.fillRect(0, 0, SIZE * 0.5, SIZE);
    c.fillRect(0, 0, SIZE, SIZE * 0.5);
    c.globalAlpha = 1;
  },
  FLEURI: (c) => {
    const flower = (x: number, y: number, r: number): void => {
      for (let k = 0; k < 5; k += 1) {
        const a = (2 * Math.PI * k) / 5;
        c.beginPath();
        c.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, r * 0.45, a, 0, Math.PI * 2);
        c.fill();
      }
    };
    flower(SIZE * 0.3, SIZE * 0.3, SIZE * 0.1);
    flower(SIZE * 0.78, SIZE * 0.72, SIZE * 0.08);
  },
  AUTRE: (c) => {
    c.lineWidth = SIZE * 0.06;
    c.beginPath();
    c.moveTo(0, SIZE);
    c.lineTo(SIZE, 0);
    c.stroke();
  },
};

/**
 * Colour and print map of the fabric read from the photo (null when the analysis gave no colour or
 * print: the panels then keep their technical zone colours). The map repeats every PRINT_TILE_M.
 */
export const fabricMaterial = (look: FabricLook | null | undefined): { color: string; map: THREE.Texture | null } | null => {
  if (!look || (!look.fabricPrint && !isHexColor(look.fabricColor))) return null;
  const ground = isHexColor(look.fabricColor) ? look.fabricColor : '#f2efe8';
  const print = look.fabricPrint ?? 'UNI';
  if (print === 'UNI' || typeof document === 'undefined') return { color: ground, map: null };
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c = canvas.getContext('2d');
  if (!c) return { color: ground, map: null };
  c.fillStyle = ground;
  c.fillRect(0, 0, SIZE, SIZE);
  const motif = isHexColor(look.motifColor) ? look.motifColor : '#2b2b2b';
  c.fillStyle = motif;
  c.strokeStyle = motif;
  draw[print](c);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1 / PRINT_TILE_M, 1 / PRINT_TILE_M);
  map.anisotropy = 8;
  return { color: '#ffffff', map };
};
