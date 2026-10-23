'use client';

import * as THREE from 'three';
import { isHexColor, MOTIF_SIZE_BOUNDS_CM, type FabricFinish, type FabricPrint, type GarmentFit } from '@angaly/types';

/** What the 3D preview needs to dress the panels in the photo's fabric. */
export type FabricLook = Pick<
  GarmentFit,
  | 'fabricPrint'
  | 'fabricColor'
  | 'motifColor'
  | 'motifSizeCm'
  | 'contrastColor'
  | 'fabricBehavior'
  | 'fabricFinish'
  | 'contrastPrint'
  | 'contrastMotifColor'
  | 'accentPrint'
  | 'contrastGores'
  | 'contrastTrims'
>;

/** A panel's look: ground colour, print map (or none) and surface. */
export interface Cloth {
  color: string;
  map: THREE.Texture | null;
  finish?: FabricFinish | undefined;
}

/** Width of one repeat of the print on the fabric (m): panels carry flat-fabric UVs in metres. */
export const PRINT_TILE_M = 0.05;
/** Larger repeats of the woven / embroidered motifs (m). */
const TILE_M: Partial<Record<FabricPrint, number>> = { BROCART: 0.09, ARABESQUE: 0.14 };
/** Width of one motif as a share of its repeat, as drawn below (a dot, a flower): sizes the repeat from `motifSizeCm`. */
const MOTIF_SHARE: Partial<Record<FabricPrint, number>> = { POIS: 0.3, FLEURI: 0.36 };
const MOTIF_SHARE_DEFAULT = 0.3;

/** Repeat (m) of a print: from the motif's size read on the photo when given, else the print's usual one. */
export const printTileM = (print: FabricPrint, motifSizeCm?: number): number => {
  if (motifSizeCm === undefined || !Number.isFinite(motifSizeCm) || motifSizeCm <= 0) return TILE_M[print] ?? PRINT_TILE_M;
  const size = Math.min(MOTIF_SIZE_BOUNDS_CM[1], Math.max(MOTIF_SIZE_BOUNDS_CM[0], motifSizeCm)) / 100;
  return size / (MOTIF_SHARE[print] ?? MOTIF_SHARE_DEFAULT);
};
/** Height of one repeat of the plastron's print down the opening (m). */
const PLASTRON_TILE_M = 0.2;
/** Share of the plastron's width taken by each border, when it has accent-fabric borders. */
export const PLASTRON_BORDER = 0.24;

const SIZE = 256;

/** Lighter / darker shade of a `#rrggbb` colour (t > 0 towards white, t < 0 towards black). */
export const shade = (hex: string, t: number): string => {
  const c = new THREE.Color(hex);
  const target = t > 0 ? new THREE.Color('#ffffff') : new THREE.Color('#000000');
  return `#${c.lerp(target, Math.abs(t)).getHexString()}`;
};

/** The same hue, lighter (and a little more saturated): the light on a velvet's pile keeps its colour. */
export const glow = (hex: string, lightness: number): string => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.15, lightness);
  return `#${c.getHexString()}`;
};

/** Flowers of a brocade: rust and old rose on the gold vine, as woven on ivory jacquard. */
const BROCADE_FLOWERS = ['#B5653F', '#C88A6A'];

/** A rinceau: a meandering vine up the tile, leaves on both sides, small flowers (brocade / jacquard). */
const drawBrocade = (c: CanvasRenderingContext2D, w: number, h: number, motif: string, x0 = 0): void => {
  const accent = shade(motif, -0.35);
  const vine = (cx: number, phase: number): void => {
    c.strokeStyle = motif;
    c.lineWidth = w * 0.03;
    c.beginPath();
    for (let k = 0; k <= 40; k += 1) {
      const y = (h * k) / 40;
      const x = cx + Math.sin((k / 40) * Math.PI * 2 + phase) * w * 0.12;
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    for (let k = 0; k < 4; k += 1) {
      const y = h * (0.12 + k * 0.25);
      const x = cx + Math.sin((y / h) * Math.PI * 2 + phase) * w * 0.12;
      const side = k % 2 === 0 ? 1 : -1;
      // A leaf pair and a five-petal flower at the end of a short stem.
      c.fillStyle = motif;
      for (const s of [1, -1]) {
        c.beginPath();
        c.ellipse(x + s * w * 0.09, y + h * 0.025, w * 0.1, h * 0.032, s * 0.6, 0, Math.PI * 2);
        c.fill();
      }
      const fx = x + side * w * 0.22;
      const fy = y - h * 0.06;
      c.strokeStyle = motif;
      c.lineWidth = w * 0.01;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + side * w * 0.1, y, fx, fy);
      c.stroke();
      c.fillStyle = BROCADE_FLOWERS[k % 2] ?? accent;
      for (let p = 0; p < 5; p += 1) {
        const a = (2 * Math.PI * p) / 5;
        c.beginPath();
        c.ellipse(fx + Math.cos(a) * w * 0.075, fy + Math.sin(a) * w * 0.075, w * 0.07, w * 0.042, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = shade(motif, 0.4);
      c.beginPath();
      c.arc(fx, fy, w * 0.035, 0, Math.PI * 2);
      c.fill();
    }
  };
  vine(x0 + w * 0.5, 0);
};

/** Arabesques: open spirals and long curls in a fine line (gold on dark velvet). */
const drawArabesque = (c: CanvasRenderingContext2D, w: number, h: number, motif: string, x0 = 0): void => {
  c.strokeStyle = motif;
  c.lineCap = 'round';
  const spiral = (cx: number, cy: number, r: number, turn: number, dir: 1 | -1): void => {
    c.beginPath();
    for (let k = 0; k <= 60; k += 1) {
      const t = k / 60;
      const a = dir * (turn * Math.PI * 2 * t);
      const rr = r * (1 - 0.75 * t);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  };
  c.lineWidth = w * 0.012;
  spiral(x0 + w * 0.3, h * 0.3, w * 0.22, 1.4, 1);
  spiral(x0 + w * 0.75, h * 0.78, w * 0.2, 1.3, -1);
  c.lineWidth = w * 0.008;
  // Long curls tying the spirals together across the tile edges (the repeat stays seamless).
  c.beginPath();
  c.moveTo(x0, h * 0.62);
  c.bezierCurveTo(x0 + w * 0.3, h * 0.45, x0 + w * 0.55, h * 1.05, x0 + w, h * 0.62);
  c.stroke();
  c.beginPath();
  c.moveTo(x0 + w * 0.52, 0);
  c.bezierCurveTo(x0 + w * 0.35, h * 0.2, x0 + w * 0.65, h * 0.35, x0 + w * 0.52, h * 0.5);
  c.stroke();
  c.beginPath();
  c.moveTo(x0 + w * 0.52, h);
  c.bezierCurveTo(x0 + w * 0.6, h * 0.95, x0 + w * 0.5, h * 0.9, x0 + w * 0.52, h);
  c.stroke();
};

const draw: Record<Exclude<FabricPrint, 'UNI'>, (c: CanvasRenderingContext2D, motif: string) => void> = {
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
  BROCART: (c, motif) => drawBrocade(c, SIZE, SIZE, motif),
  ARABESQUE: (c, motif) => drawArabesque(c, SIZE, SIZE, motif),
  AUTRE: (c) => {
    c.lineWidth = SIZE * 0.06;
    c.beginPath();
    c.moveTo(0, SIZE);
    c.lineTo(SIZE, 0);
    c.stroke();
  },
};

const canvasTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return map;
};

/** A repeating print map (ground + motif), its repeat in metres; null when there is nothing to draw. */
const printMap = (print: FabricPrint, ground: string, motif: string, motifSizeCm?: number): THREE.Texture | null => {
  if (print === 'UNI' || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c = canvas.getContext('2d');
  if (!c) return null;
  c.fillStyle = ground;
  c.fillRect(0, 0, SIZE, SIZE);
  c.fillStyle = motif;
  c.strokeStyle = motif;
  draw[print](c, motif);
  const map = canvasTexture(canvas);
  const tile = printTileM(print, motifSizeCm);
  map.repeat.set(1 / tile, 1 / tile);
  return map;
};

/**
 * Colour and print map of the fabric read from the photo (null when the analysis gave no colour or
 * print: the panels then keep their technical zone colours). The map repeats every PRINT_TILE_M.
 */
export const fabricMaterial = (look: FabricLook | null | undefined): Cloth | null => {
  if (!look || (!look.fabricPrint && !isHexColor(look.fabricColor))) return null;
  const ground = isHexColor(look.fabricColor) ? look.fabricColor : '#f2efe8';
  const print = look.fabricPrint ?? 'UNI';
  const motif = isHexColor(look.motifColor) ? look.motifColor : '#2b2b2b';
  const map = printMap(print, ground, motif, look.motifSizeCm);
  return { color: map ? '#ffffff' : ground, map, finish: look.fabricFinish };
};

/** The accent fabric (the sleeves' puffs, the plastron's borders): the ground colour with `accentPrint`. Null without one. */
export const accentMaterial = (look: FabricLook | null | undefined): Cloth | null => {
  if (!look?.accentPrint || look.accentPrint === 'UNI' || !isHexColor(look.fabricColor)) return null;
  const motif = isHexColor(look.motifColor) ? look.motifColor : '#C9A45A';
  const map = printMap(look.accentPrint, look.fabricColor, motif);
  return map ? { color: '#ffffff', map, finish: look.fabricFinish } : null;
};

/**
 * The contrasting fabric laid like the main one (UVs in metres of flat fabric): the side gores of a gored skirt
 * (`contrastGores`). Its print at the dress's motif size. Null without a contrast colour.
 */
export const contrastMaterial = (look: FabricLook | null | undefined): Cloth | null => {
  if (!look || !isHexColor(look.contrastColor)) return null;
  const motif = isHexColor(look.contrastMotifColor) ? look.contrastMotifColor : shade(look.contrastColor, -0.4);
  const map = printMap(look.contrastPrint ?? 'UNI', look.contrastColor, motif, look.motifSizeCm);
  return { color: map ? '#ffffff' : look.contrastColor, map, finish: look.fabricFinish };
};

/**
 * The plastron of a robe-manteau, laid across the opening (u 0 → 1 from one front to the other, v in metres down
 * it): the contrast colour with its print, framed — when the dress has an accent fabric — by two borders of it and a
 * thin gold piping. Null without a contrast colour.
 */
export const plastronMaterial = (look: FabricLook | null | undefined, fallback: string): Cloth => {
  const ground = isHexColor(look?.contrastColor) ? look.contrastColor : fallback;
  const print = look?.contrastPrint ?? 'UNI';
  const border = look?.accentPrint && look.accentPrint !== 'UNI' && isHexColor(look.fabricColor) ? look : null;
  if (typeof document === 'undefined' || (print === 'UNI' && !border)) return { color: ground, map: null };
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  if (!c) return { color: ground, map: null };
  c.fillStyle = ground;
  c.fillRect(0, 0, W, H);
  const motif = isHexColor(look?.contrastMotifColor) ? look.contrastMotifColor : '#B8913F';
  const b = border ? Math.round(W * PLASTRON_BORDER) : 0;
  if (print === 'BROCART') {
    // A woven ground (faint lozenges of a deeper ivory), then three vines side by side across the visible middle.
    const inner = W - 2 * b;
    c.fillStyle = shade(ground, -0.07);
    for (let y = 0; y < H; y += 32) {
      for (let x = b + ((y / 32) % 2) * 16; x < W - b; x += 32) {
        c.beginPath();
        c.moveTo(x, y - 9);
        c.lineTo(x + 7, y);
        c.lineTo(x, y + 9);
        c.lineTo(x - 7, y);
        c.fill();
      }
    }
    for (let k = 0; k < 2; k += 1) drawBrocade(c, inner / 2, H, motif, b + (k * inner) / 2);
  } else if (print !== 'UNI') {
    const tile = printMap(print, ground, motif);
    if (tile?.image) {
      for (let x = 0; x < W; x += SIZE / 2) for (let y = 0; y < H; y += SIZE / 2) c.drawImage(tile.image as CanvasImageSource, x, y, SIZE / 2, SIZE / 2);
    }
  }
  if (border?.fabricColor) {
    const gold = isHexColor(border.motifColor) ? border.motifColor : '#C9A45A';
    for (const x0 of [0, W - b]) {
      c.fillStyle = border.fabricColor;
      c.fillRect(x0, 0, b, H);
      c.save();
      c.beginPath();
      c.rect(x0, 0, b, H);
      c.clip();
      drawArabesque(c, b, H / 2, gold, x0);
      c.translate(0, H / 2);
      drawArabesque(c, b, H / 2, gold, x0);
      c.restore();
    }
    // Gold piping where the borders meet the middle.
    c.fillStyle = gold;
    c.fillRect(b - 3, 0, 4, H);
    c.fillRect(W - b - 1, 0, 4, H);
  }
  const map = canvasTexture(canvas);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.repeat.set(1, 1 / PLASTRON_TILE_M);
  return { color: '#ffffff', map, finish: 'SATIN' };
};

/** Repeat of the lace pattern (m): a rosette every 3 cm, as on Valenciennes / Chantilly borders. */
export const LACE_TILE_M = 0.03;

/**
 * Alpha map of a lace: a fine net (hexagonal holes) with solid rosettes and their leaves, white where the thread is,
 * black where the cloth shows through. Null without a canvas (tests, server).
 */
export const laceAlphaMap = (): THREE.Texture | null => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c = canvas.getContext('2d');
  if (!c) return null;
  c.fillStyle = '#000000';
  c.fillRect(0, 0, SIZE, SIZE);
  // The net: thin threads crossing on a diagonal grid.
  c.strokeStyle = '#7a7a7a';
  c.lineWidth = SIZE / 128;
  for (let k = -SIZE; k <= 2 * SIZE; k += SIZE / 12) {
    c.beginPath();
    c.moveTo(k, 0);
    c.lineTo(k + SIZE, SIZE);
    c.moveTo(k, SIZE);
    c.lineTo(k + SIZE, 0);
    c.stroke();
  }
  // Rosettes (solid thread), four per tile, with petals and a scroll of leaves.
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#ffffff';
  c.lineWidth = SIZE / 48;
  for (const [cx, cy] of [
    [0.25, 0.25],
    [0.75, 0.75],
    [0.75, 0.25],
    [0.25, 0.75],
  ] as const) {
    const x = cx * SIZE;
    const y = cy * SIZE;
    const r = SIZE * (cx === cy ? 0.12 : 0.07);
    for (let p = 0; p < 6; p += 1) {
      const a = (Math.PI * 2 * p) / 6;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.55, r * 0.3, a, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.arc(x, y, r * 0.35, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.moveTo(0.25 * SIZE, 0.25 * SIZE);
  c.quadraticCurveTo(0.5 * SIZE, 0.15 * SIZE, 0.75 * SIZE, 0.25 * SIZE);
  c.moveTo(0.25 * SIZE, 0.75 * SIZE);
  c.quadraticCurveTo(0.5 * SIZE, 0.85 * SIZE, 0.75 * SIZE, 0.75 * SIZE);
  c.stroke();
  const map = canvasTexture(canvas);
  map.repeat.set(1 / LACE_TILE_M, 1 / LACE_TILE_M);
  return map;
};
