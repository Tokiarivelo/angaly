/**
 * Motifs drawn on a detail area instead of plain cloth (pattern-engine `DetailArea.motif`):
 * - embroidery: scrolls of leaves and flowers in thread, French knots, on a see-through ground, laid over the cloth;
 * - smocking: the honeycomb of diamonds a smocked panel makes, as relief (normal map + ambient occlusion) on the
 *   dress fabric.
 * The pixels are computed by pure, deterministic functions (no canvas: they run in tests and on the server too); the
 * three.js textures wrap them. Every motif tiles seamlessly; its repeat is set in metres, as the patches' UVs are.
 */
import * as THREE from 'three';
import { isHexColor } from '@angaly/types';

/** One embroidery tile covers this much cloth (m): a scroll with two flowers every 8 cm. */
export const EMBROIDERY_TILE_M = 0.08;
/** Smocking: one diamond of the honeycomb every 12 mm across and down. */
export const SMOCK_TILE_M = 0.012;
/** Thread colour of an embroidery when the pattern gave none (champagne gold). */
export const EMBROIDERY_COLOR = '#C9A45C';

export const EMBROIDERY_SIZE = 256;
export const SMOCK_SIZE = 128;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** Anti-aliased coverage of a shape from its signed distance (px, < 0 inside). */
const cover = (d: number): number => clamp01(0.5 - d);

/** Wrapped difference on a tile of `n` pixels: the shortest way round. */
const wrap = (d: number, n: number): number => d - n * Math.round(d / n);

interface Ink {
  /** Coverage per pixel (0–1). */
  a: Float32Array;
  /** Stitch direction per pixel (radians), for the satin-stitch shading. */
  dir: Float32Array;
}

/** Paints a shape given by its signed distance (px) inside a box, wrapping across the tile's edges. */
const paint = (
  ink: Ink,
  n: number,
  box: { x0: number; y0: number; x1: number; y1: number },
  dist: (dx: number, dy: number) => number,
  cx: number,
  cy: number,
  dir: number,
): void => {
  for (let y = Math.floor(box.y0); y <= Math.ceil(box.y1); y += 1) {
    for (let x = Math.floor(box.x0); x <= Math.ceil(box.x1); x += 1) {
      const px = ((x % n) + n) % n;
      const py = ((y % n) + n) % n;
      const c = cover(dist(wrap(px + 0.5 - cx, n), wrap(py + 0.5 - cy, n)));
      if (c <= 0) continue;
      const k = py * n + px;
      if (c > ink.a[k]!) {
        ink.a[k] = c;
        ink.dir[k] = dir;
      }
    }
  }
};

const disc = (ink: Ink, n: number, cx: number, cy: number, r: number): void =>
  paint(ink, n, { x0: cx - r - 1, y0: cy - r - 1, x1: cx + r + 1, y1: cy + r + 1 }, (dx, dy) => Math.hypot(dx, dy) - r, cx, cy, 0);

/** An ellipse (a leaf, a petal) of half-axes a × b, turned by `angle`. Satin stitches run across it. */
const ellipse = (ink: Ink, n: number, cx: number, cy: number, a: number, b: number, angle: number): void => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  paint(
    ink,
    n,
    { x0: cx - a - 1, y0: cy - a - 1, x1: cx + a + 1, y1: cy + a + 1 },
    (dx, dy) => {
      const u = (dx * cos + dy * sin) / a;
      const v = (-dx * sin + dy * cos) / b;
      // Approximate distance (px) to the ellipse's edge: exact enough at these sizes for a clean edge.
      return (Math.hypot(u, v) - 1) * Math.min(a, b);
    },
    cx,
    cy,
    angle + Math.PI / 2,
  );
};

/** A stem: a thick segment with round ends (stem stitch runs along it). */
const stem = (ink: Ink, n: number, x0: number, y0: number, x1: number, y1: number, w: number): void => {
  const lx = x1 - x0;
  const ly = y1 - y0;
  const len2 = lx * lx + ly * ly || 1;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  paint(
    ink,
    n,
    { x0: Math.min(x0, x1) - w - 1, y0: Math.min(y0, y1) - w - 1, x1: Math.max(x0, x1) + w + 1, y1: Math.max(y0, y1) + w + 1 },
    (dx, dy) => {
      // dx, dy are relative to the segment's middle.
      const px = dx + cx - x0;
      const py = dy + cy - y0;
      const t = clamp01((px * lx + py * ly) / len2);
      return Math.hypot(px - t * lx, py - t * ly) - w;
    },
    cx,
    cy,
    Math.atan2(ly, lx),
  );
};

/** A flower: five petals round a knotted heart. */
const flower = (ink: Ink, n: number, cx: number, cy: number, r: number, turn: number): void => {
  for (let p = 0; p < 5; p += 1) {
    const a = turn + (Math.PI * 2 * p) / 5;
    ellipse(ink, n, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.55, r * 0.32, a);
  }
  disc(ink, n, cx, cy, r * 0.26);
};

/**
 * Embroidery tile (RGBA, `size` × `size`): white-to-grey satin shading where the thread lies (the material's colour
 * dyes it), alpha = thread coverage, transparent elsewhere so the cloth shows between the motifs.
 */
export const embroideryPixels = (size = EMBROIDERY_SIZE): Uint8Array<ArrayBuffer> => {
  const n = size;
  const ink: Ink = { a: new Float32Array(n * n), dir: new Float32Array(n * n) };
  const s = n / 256;
  // The scroll: a wave across the tile (one period, so it joins the next tile), drawn as short stems.
  const vine = (t: number): [number, number] => [t * n, n * (0.5 + 0.17 * Math.sin(2 * Math.PI * t))];
  const steps = 64;
  for (let i = 0; i < steps; i += 1) {
    const [x0, y0] = vine(i / steps);
    const [x1, y1] = vine((i + 1) / steps);
    stem(ink, n, x0, y0, x1, y1, 2.2 * s);
  }
  // Tendrils curling off the scroll, and leaves along it, alternately above and below.
  for (let k = 0; k < 8; k += 1) {
    const t = (k + 0.5) / 8;
    const [x, y] = vine(t);
    const side = k % 2 === 0 ? -1 : 1;
    const slope = Math.atan(0.17 * 2 * Math.PI * Math.cos(2 * Math.PI * t));
    const out = slope + side * 0.9;
    ellipse(ink, n, x + Math.cos(out) * 12 * s, y + Math.sin(out) * 12 * s, 11 * s, 4.5 * s, out);
    // A tendril: three short stems curling back.
    let px = x;
    let py = y;
    let a = slope - side * 1.1;
    for (let j = 0; j < 4; j += 1) {
      const nx = px + Math.cos(a) * 6 * s;
      const ny = py + Math.sin(a) * 6 * s;
      stem(ink, n, px, py, nx, ny, 1.1 * s);
      px = nx;
      py = ny;
      a -= side * 0.75;
    }
  }
  // Two flowers on the scroll's crests, and French knots scattered in the free ground.
  flower(ink, n, 0.25 * n, 0.33 * n, 22 * s, 0.3);
  flower(ink, n, 0.75 * n, 0.67 * n, 22 * s, 1.1);
  flower(ink, n, 0.75 * n, 0.2 * n, 12 * s, 0.7);
  flower(ink, n, 0.25 * n, 0.8 * n, 12 * s, 0.1);
  for (const [x, y] of [
    [0.08, 0.12],
    [0.45, 0.1],
    [0.58, 0.32],
    [0.92, 0.42],
    [0.42, 0.9],
    [0.06, 0.6],
    [0.55, 0.62],
    [0.95, 0.88],
  ] as const) {
    disc(ink, n, x * n, y * n, 3 * s);
  }
  const out = new Uint8Array(n * n * 4);
  for (let k = 0; k < n * n; k += 1) {
    const a = ink.a[k]!;
    if (a <= 0) continue;
    // Satin stitch: fine lines across the shape catch the light.
    const x = k % n;
    const y = (k - x) / n;
    const d = ink.dir[k]!;
    const across = x * Math.cos(d) + y * Math.sin(d);
    const shine = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(across * 1.6));
    const v = Math.round(255 * shine);
    out[k * 4] = v;
    out[k * 4 + 1] = v;
    out[k * 4 + 2] = v;
    out[k * 4 + 3] = Math.round(255 * a);
  }
  return out;
};

/**
 * Height of smocked cloth (0 = drawn into a fold at the stitches, 1 = the puff in a diamond's middle) at (u, v) in
 * tile units. The stitches sit on a diamond lattice: (0, 0) and (½, ½) of each tile.
 */
export const smockHeight = (u: number, v: number): number => {
  const a = u + v;
  const b = u - v;
  const fa = a - Math.floor(a);
  const fb = b - Math.floor(b);
  const puff = Math.sin(Math.PI * fa) * Math.sin(Math.PI * fb);
  // The gathered cloth also falls in fine vertical pleats between the stitches.
  const pleats = 0.12 * Math.abs(Math.sin(Math.PI * 4 * u));
  return clamp01(Math.pow(Math.max(0, puff), 0.6) * 0.88 + pleats);
};

/** Smocking tile: a tangent-space normal map (RGBA) and an ambient-occlusion map (grey, RGBA), both `size` × `size`. */
export const smockingPixels = (size = SMOCK_SIZE): { normal: Uint8Array<ArrayBuffer>; ao: Uint8Array<ArrayBuffer> } => {
  const n = size;
  const h = new Float32Array(n * n);
  for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) h[y * n + x] = smockHeight((x + 0.5) / n, (y + 0.5) / n);
  const at = (x: number, y: number): number => h[(((y % n) + n) % n) * n + (((x % n) + n) % n)]!;
  const normal = new Uint8Array(n * n * 4);
  const ao = new Uint8Array(n * n * 4);
  // Relief depth relative to the tile: a smocked puff stands ~3 mm on a 12 mm diamond.
  const depth = 0.25 * n * 0.5;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const dx = ((at(x + 1, y) - at(x - 1, y)) / 2) * depth;
      const dy = ((at(x, y + 1) - at(x, y - 1)) / 2) * depth;
      const len = Math.hypot(dx, dy, 1);
      const k = (y * n + x) * 4;
      // Texture rows grow downward while v grows upward: flip the y slope.
      normal[k] = Math.round(255 * (0.5 - (0.5 * dx) / len));
      normal[k + 1] = Math.round(255 * (0.5 + (0.5 * dy) / len));
      normal[k + 2] = Math.round(255 * (0.5 + 0.5 / len));
      normal[k + 3] = 255;
      const occ = Math.round(255 * (0.45 + 0.55 * at(x, y)));
      ao[k] = occ;
      ao[k + 1] = occ;
      ao[k + 2] = occ;
      ao[k + 3] = 255;
    }
  }
  return { normal, ao };
};

const dataTexture = (pixels: Uint8Array<ArrayBuffer>, size: number, tileM: number, colorSpace: THREE.ColorSpace): THREE.DataTexture => {
  const map = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  map.colorSpace = colorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = 8;
  map.repeat.set(1 / tileM, 1 / tileM);
  map.needsUpdate = true;
  return map;
};

/** The embroidery's map: thread shading in RGB, coverage in alpha. The material's colour is the thread's. */
export const embroideryMap = (): THREE.DataTexture => dataTexture(embroideryPixels(), EMBROIDERY_SIZE, EMBROIDERY_TILE_M, THREE.SRGBColorSpace);

/** Smocking's relief: a normal map and an ambient-occlusion map, laid on the dress fabric. */
export const smockingMaps = (): { normalMap: THREE.DataTexture; aoMap: THREE.DataTexture } => {
  const { normal, ao } = smockingPixels();
  return {
    normalMap: dataTexture(normal, SMOCK_SIZE, SMOCK_TILE_M, THREE.NoColorSpace),
    aoMap: dataTexture(ao, SMOCK_SIZE, SMOCK_TILE_M, THREE.NoColorSpace),
  };
};

/** The embroidery's thread: the pattern's colour, else the contrast fabric's, else champagne gold (as the render). */
export const threadColor = (trimColor: string | undefined, contrastColor: string | null | undefined): string =>
  trimColor ?? (isHexColor(contrastColor) ? contrastColor : EMBROIDERY_COLOR);

/**
 * Material settings of an embroidery: the thread alone, its satin shading dyed in its colour and slightly raised,
 * blended over the cloth (not cut out: far away the mipmaps average the coverage, and a cut-out would drop it). The
 * silk catches the light in its own colour — a white sheen would wash a red thread out to pink.
 */
export const embroideryMaterialParameters = (color: string, motif: THREE.Texture): THREE.MeshPhysicalMaterialParameters => ({
  color,
  map: motif,
  bumpMap: motif,
  bumpScale: 0.6,
  transparent: true,
  depthWrite: false,
  alphaTest: 0.02,
  side: THREE.DoubleSide,
  roughness: 0.45,
  sheen: 0.5,
  sheenColor: new THREE.Color(color),
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
