/**
 * Construction pieces in 3D (pattern-engine `shared/construction.ts`): the pieces that stand off the garment — hem
 * flounces and tiers, godets, a separate peplum, a capelet, bows, a bustle's pouf, engageantes — are draped over the
 * garment already draped, read as a radial surface round the body axis. The pieces laid flat on the cloth (applied
 * bands, apron, Watteau pleat, sash, jabot, embroidery, smocking) come through the engine's detail areas instead
 * (`detail-patch.ts`): this module only tells them apart (`constructionRoleOf`). Pure geometry, no three.js.
 *
 * Every size is read off the piece itself (its depth, its count, its width) the way the engine cut it, so the 3D says
 * what the pattern says. The engine's own spacing of tiered flounces is repeated here (`TIER_STEP_SHARE`).
 */
import type { PanelMeshData } from './garment-model';

type V3 = [number, number, number];
interface Pt {
  x: number;
  y: number;
}

export interface ConstructionPiece {
  id: string;
  name: string;
  quantity: number;
  /** The piece's outline (mm), as generated (closing point included or not). */
  polygon: Pt[];
  fabricRecommendation: string | null;
}

export interface ConstructionScene {
  axisZ: number;
  napeY: number;
  waistY: number;
  /** Sleeve hems (ring round the hem, the arm's direction down it), for engageantes. */
  sleeveHems: Array<{ ring: V3[]; dir: V3 }>;
}

/** Same as the engine: each tier of flounces is sewn this share of its depth above the one below. */
export const TIER_STEP_SHARE = 0.75;
/** Cloth stands this far (m) off what it is sewn onto. */
const LIFT = 0.006;
const AROUND = 72;
const ROWS = 8;
/** A capelet stands this far (m) off the shoulders at its hem. */
const CAPELET_FLARE_M = 0.035;
/**
 * Engageantes come out from inside a pagoda sleeve: narrower than its hem where they start (share of the hem ring),
 * opening this much more by their own hem; and the depth of their gathers (m).
 */
const ENGAGEANTE_START = 0.7;
const ENGAGEANTE_SPREAD = 0.15;
const ENGAGEANTE_WAVE_M = 0.012;
/** Radial surface sampling: height step (m) and angle bins. */
const STEP_Y = 0.01;
const BINS = 72;

const normalize = (name: string): string => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').toLowerCase();

// The apron and the jabot are draped here (not through detail areas): an apron hangs over any skirt, gathered ones
// included, and a jabot is lace standing off the bodice, not a patch of the dress fabric.
const PROCEDURAL = ['volant d’ourlet', "volant d'ourlet", 'volant etage', 'godet', 'basque rapportee', 'basque a pointes (', 'pelerine (', 'chou ', 'drape de tournure', 'engageante — volant', 'tablier', 'jabot plisse'];
const APPLIED = ['bande appliquee', 'pli watteau', 'echarpe drapee', 'gabarit de broderie', 'panneau a smocks'];

/**
 * How the 3D shows a construction piece: `procedural` (draped here), `applied` (laid on the cloth through the engine's
 * detail areas), or null (not a construction piece, or one sewn inside).
 */
export const constructionRoleOf = (name: string): 'procedural' | 'applied' | null => {
  const n = normalize(name);
  if (n.includes('parementure')) return null;
  if (PROCEDURAL.some((k) => n.startsWith(k))) return 'procedural';
  if (APPLIED.some((k) => n.startsWith(k))) return 'applied';
  return null;
};

// ---------------------------------------------------------------- reading the pieces

const ringOf = (polygon: Pt[]): Pt[] => {
  const a = polygon[0];
  const b = polygon[polygon.length - 1];
  return a !== undefined && a.x === b?.x && a.y === b.y ? polygon.slice(0, -1) : polygon;
};
const boxOf = (polygon: Pt[]): { w: number; h: number } => ({
  w: Math.max(...polygon.map((p) => p.x)) - Math.min(...polygon.map((p) => p.x)),
  h: Math.max(...polygon.map((p) => p.y)) - Math.min(...polygon.map((p) => p.y)),
});
/** Radial depth of an annulus sector / capelet as the engine draws it: first point (inner) to last (outer, same angle). */
const radialDepthMm = (polygon: Pt[]): number => {
  const r = ringOf(polygon);
  return Math.hypot(r[0]!.x - r[r.length - 1]!.x, r[0]!.y - r[r.length - 1]!.y);
};

const look = (piece: ConstructionPiece): Pick<PanelMeshData, 'zone' | 'material' | 'trimColor' | 'contrast'> => {
  const n = normalize(`${piece.name} ${piece.fabricRecommendation ?? ''}`);
  const color = /#[0-9a-f]{6}/i.exec(piece.fabricRecommendation ?? '')?.[0];
  if (n.includes('dentelle')) return { zone: 'lace', material: 'DENTELLE', ...(color ? { trimColor: color } : {}) };
  if (n.includes('tulle')) return { zone: 'lace', material: 'TULLE', ...(color ? { trimColor: color } : {}) };
  if (n.includes('contrast')) return { zone: 'detail', contrast: true };
  return { zone: 'detail' };
};

// ---------------------------------------------------------------- the garment's surface

interface Surface {
  radius: (y: number, angle: number) => number | null;
  skirt: { topY: number; hemY: number } | null;
}

const surfaceOf = (panels: PanelMeshData[], axisZ: number, zones: ReadonlySet<string>): Map<number, number> => {
  const bins = new Map<number, number>();
  for (const p of panels) {
    if (!zones.has(p.zone)) continue;
    for (let o = 0; o < p.positions.length; o += 3) {
      const x = p.positions[o]!;
      const z = p.positions[o + 2]! - axisZ;
      const a = (Math.atan2(x, z) + 2 * Math.PI) % (2 * Math.PI);
      const k = Math.round(p.positions[o + 1]! / STEP_Y) * BINS + (Math.round((a / (2 * Math.PI)) * BINS) % BINS);
      bins.set(k, Math.max(bins.get(k) ?? 0, Math.hypot(x, z)));
    }
  }
  return bins;
};

const lookup = (bins: Map<number, number>) => (y: number, angle: number): number | null => {
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const row = Math.round(y / STEP_Y);
  const col = Math.round((a / (2 * Math.PI)) * BINS) % BINS;
  // The nearest sampled bin: same height first, then a little above / below, then the neighbouring angles.
  for (const dy of [0, 1, -1, 2, -2, 3, -3]) {
    for (const dc of [0, 1, -1, 2, -2]) {
      const v = bins.get((row + dy) * BINS + ((col + dc + BINS) % BINS));
      if (v !== undefined) return v;
    }
  }
  return null;
};

const readSurface = (panels: PanelMeshData[], axisZ: number, zones: string[]): Surface => {
  const radius = lookup(surfaceOf(panels, axisZ, new Set(zones)));
  let topY = -Infinity;
  let hemY = Infinity;
  for (const p of panels) {
    if (p.zone !== 'skirt') continue;
    for (let o = 0; o < p.positions.length; o += 3) {
      topY = Math.max(topY, p.positions[o + 1]!);
      if (p.positions[o + 2]! > axisZ) hemY = Math.min(hemY, p.positions[o + 1]!);
    }
  }
  return { radius, skirt: Number.isFinite(topY) && Number.isFinite(hemY) && topY > hemY ? { topY, hemY } : null };
};

// ---------------------------------------------------------------- meshes

interface Mesh {
  positions: number[];
  indices: number[];
  border: number[];
  uvs: number[];
}

const at = (axisZ: number, r: number, angle: number, y: number): V3 => [r * Math.sin(angle), y, axisZ + r * Math.cos(angle)];

/** A rows × cols grid of `point(row, col)` (row-major), `closed` joining the last column to the first. */
const gridMesh = (rows: number, cols: number, closed: boolean, point: (i: number, j: number) => V3, uvScale = 1): Mesh => {
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  const width = closed ? cols : cols + 1;
  for (let i = 0; i <= rows; i += 1) {
    for (let j = 0; j < width; j += 1) {
      mesh.positions.push(...point(i, j));
      mesh.uvs.push((j / cols) * uvScale, (i / rows) * uvScale * 0.3);
    }
  }
  const idx = (i: number, j: number): number => i * width + (closed ? j % cols : j);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) mesh.indices.push(idx(i, j), idx(i + 1, j), idx(i, j + 1), idx(i, j + 1), idx(i + 1, j), idx(i + 1, j + 1));
  }
  const p = (v: number): number[] => mesh.positions.slice(v * 3, v * 3 + 3);
  for (const i of [0, rows]) for (let j = 0; j < cols; j += 1) mesh.border.push(...p(idx(i, j)), ...p(idx(i, j + 1)));
  if (!closed) for (const j of [0, cols]) for (let i = 0; i < rows; i += 1) mesh.border.push(...p(idx(i, j)), ...p(idx(i + 1, j)));
  return mesh;
};

const panelOf = (mesh: Mesh, piece: ConstructionPiece | ConstructionPiece[], id: string, explode: PanelMeshData['explode']): PanelMeshData => {
  const pieces = Array.isArray(piece) ? piece : [piece];
  return {
    id,
    label: pieces.map((p) => p.name).join(' + '),
    role: 'trim',
    ...look(pieces[0]!),
    pieceIds: pieces.map((p) => p.id),
    positions: Float32Array.from(mesh.positions),
    indices: Uint32Array.from(mesh.indices),
    border: Float32Array.from(mesh.border),
    uvs: Float32Array.from(mesh.uvs),
    explode,
  };
};

/**
 * A ring of cloth sewn round the garment at height `y0`, hanging `depth` (m) and opening out by `flare` (m) at its
 * hem, in `waves` gathers of `waveDepth` (m). `depthAt(angle)` scales the depth round the ring (a pointed basque).
 */
const hangingRing = (
  surface: Surface,
  axisZ: number,
  y0: number,
  depth: number,
  flare: number,
  waves: number,
  waveDepth: number,
  depthAt: (angle: number) => number = () => 1,
  floor = -Infinity,
): Mesh => {
  const top = Array.from({ length: AROUND }, (_, j) => surface.radius(y0, (2 * Math.PI * j) / AROUND) ?? 0.15);
  return gridMesh(ROWS, AROUND, true, (i, j) => {
    const t = i / ROWS;
    const angle = (2 * Math.PI * j) / AROUND;
    const y = Math.max(floor, y0 - depth * depthAt(angle) * t);
    const under = surface.radius(y, angle) ?? top[j]!;
    const r = Math.max(under, top[j]!) + LIFT + flare * t + waveDepth * t * Math.sin(waves * angle);
    return at(axisZ, r, angle, y);
  });
};

// ---------------------------------------------------------------- the pieces

const tierOf = (name: string): { k: number; n: number } => {
  const m = /(\d+)\s*\/\s*(\d+)/.exec(name);
  return m ? { k: Number(m[1]), n: Number(m[2]) } : { k: 1, n: 1 };
};

const flounces = (pieces: ConstructionPiece[], surface: Surface, scene: ConstructionScene): PanelMeshData[] => {
  if (!surface.skirt) return [];
  const { hemY } = surface.skirt;
  return pieces.map((piece) => {
    const n = normalize(piece.name);
    const circular = n.includes('en forme');
    const depth = (circular ? radialDepthMm(piece.polygon) : boxOf(piece.polygon).h) / 1000;
    const { k } = tierOf(piece.name);
    const sewnAt = depth * (1 + (k - 1) * TIER_STEP_SHARE);
    const y0 = hemY + sewnAt;
    const girth = 2 * Math.PI * (surface.radius(y0, 0) ?? 0.4);
    const waves = Math.max(8, Math.round(girth / (circular ? 0.12 : 0.05)));
    const mesh = hangingRing(surface, scene.axisZ, y0, depth, depth * (circular ? 0.5 : 0.22), waves, circular ? 0.03 : 0.012, () => 1, hemY - 0.01);
    return panelOf(mesh, piece, `construction-flounce-${piece.id}`, { x: 0, y: -0.9 - 0.15 * k, z: 0.6 });
  });
};

const godetPanels = (piece: ConstructionPiece, surface: Surface, scene: ConstructionScene): PanelMeshData[] => {
  if (!surface.skirt) return [];
  const { hemY } = surface.skirt;
  const box = boxOf(piece.polygon);
  const h = box.h / 1000;
  const half = box.w / 2000;
  const count = Math.max(1, piece.quantity);
  return Array.from({ length: count }, (_, g) => {
    const centre = (2 * Math.PI * (g + 0.5)) / count + Math.PI / 2;
    const mesh = gridMesh(ROWS, 12, false, (i, j) => {
      const t = i / ROWS;
      const s = (j / 12) * 2 - 1;
      const y = hemY + h * (1 - t);
      const base = surface.radius(y, centre) ?? 0.4;
      const angle = centre + (s * half * t) / Math.max(0.1, base);
      const r = (surface.radius(y, angle) ?? base) + LIFT + 0.4 * half * t * (1 - s * s);
      return at(scene.axisZ, r, angle, y);
    });
    return panelOf(mesh, piece, `construction-godet-${piece.id}-${g}`, { x: Math.sin(centre), y: -0.8, z: Math.cos(centre) });
  });
};

/** Depth share round a pointed basque (centre front 1, small points over the hips, a postillion at the back). */
const POINTED = [
  [0, 1],
  [0.25, 0.3],
  [0.5, 0.55],
  [0.75, 0.3],
  [1, 0.8],
] as const;
const pointedDepth = (angle: number): number => {
  const a = Math.abs(((angle + Math.PI) % (2 * Math.PI)) - Math.PI) / Math.PI;
  for (let i = 1; i < POINTED.length; i += 1) {
    const [u0, d0] = POINTED[i - 1]!;
    const [u1, d1] = POINTED[i]!;
    if (a <= u1) return d0 + ((d1 - d0) * (a - u0)) / (u1 - u0);
  }
  return POINTED[POINTED.length - 1]![1];
};

const peplumPanel = (piece: ConstructionPiece, surface: Surface, scene: ConstructionScene): PanelMeshData => {
  const n = normalize(piece.name);
  const circular = n.includes('en forme');
  const pointed = n.includes('pointes');
  const depth = (circular ? radialDepthMm(piece.polygon) : boxOf(piece.polygon).h) / 1000;
  const y0 = scene.waistY - 0.01;
  const mesh = hangingRing(
    surface,
    scene.axisZ,
    y0,
    depth,
    depth * (circular ? 0.6 : pointed ? 0.06 : 0.25),
    circular ? 14 : pointed ? 0 : 40,
    circular ? 0.02 : pointed ? 0 : 0.008,
    pointed ? pointedDepth : () => 1,
  );
  return panelOf(mesh, piece, `construction-peplum-${piece.id}`, { x: 0, y: 0.1, z: 1.1 });
};

const capeletPanel = (piece: ConstructionPiece, around: Surface, scene: ConstructionScene): PanelMeshData => {
  const length = radialDepthMm(piece.polygon) / 1000;
  const y0 = scene.napeY - 0.035;
  const neck = 0.07;
  // It falls along the body: down the shoulders and arms, standing a little more off them towards its hem.
  const mesh = gridMesh(ROWS, AROUND, true, (i, j) => {
    const t = i / ROWS;
    const angle = (2 * Math.PI * j) / AROUND;
    const y = y0 - length * t;
    const under = Math.max(around.radius(y, angle) ?? neck, neck);
    return at(scene.axisZ, under + LIFT * 1.5 + CAPELET_FLARE_M * t, angle, y);
  });
  return panelOf(mesh, piece, `construction-capelet-${piece.id}`, { x: 0, y: 1.1, z: 0.4 });
};

/** A bow at a point on the garment: two loops either side of a knot, two tails hanging below. */
const bowMesh = (c: V3, out: V3, width: number, tail: number): Mesh => {
  const len = Math.hypot(out[0], out[2]) || 1;
  const n: V3 = [out[0] / len, 0, out[2] / len];
  const t: V3 = [n[2], 0, -n[0]];
  const mesh: Mesh = { positions: [], indices: [], border: [], uvs: [] };
  const add = (part: Mesh): void => {
    const base = mesh.positions.length / 3;
    mesh.positions.push(...part.positions);
    mesh.uvs.push(...part.uvs);
    mesh.indices.push(...part.indices.map((i) => i + base));
    mesh.border.push(...part.border);
  };
  const p = (s: number, u: number, d: number): V3 => [c[0] + t[0] * s + n[0] * d, c[1] + u, c[2] + t[2] * s + n[2] * d];
  // Loops: a ribbon round an ellipse each side.
  for (const side of [1, -1]) {
    add(
      gridMesh(1, 24, true, (i, j) => {
        const th = (2 * Math.PI * j) / 24;
        const s = side * (0.5 * width + 0.45 * width * Math.cos(th));
        const u = 0.22 * width * Math.sin(th);
        const d = 0.02 + 0.03 * width * (1 + Math.cos(th)) + (i - 0.5) * 0.25 * width;
        return p(s, u, d);
      }),
    );
  }
  // Knot.
  add(gridMesh(1, 12, true, (i, j) => {
    const th = (2 * Math.PI * j) / 12;
    return p(0.08 * width * Math.cos(th), (i - 0.5) * 0.3 * width, 0.03 + 0.05 * width * (1 + Math.sin(th)));
  }));
  // Tails.
  for (const side of [1, -1]) {
    add(
      gridMesh(6, 2, false, (i, j) => {
        const k = i / 6;
        const s = side * (0.05 * width + 0.35 * tail * k) + (j - 1) * 0.2 * width;
        return p(s, -tail * k, 0.025 + 0.01 * k);
      }),
    );
  }
  return mesh;
};

const bowPanels = (group: ConstructionPiece[], panels: PanelMeshData[], surface: Surface, scene: ConstructionScene): PanelMeshData[] => {
  const loops = group.find((p) => normalize(p.name).includes('boucles'));
  if (!loops) return [];
  const tails = group.find((p) => normalize(p.name).includes('pans'));
  const width = boxOf(loops.polygon).w / 2200;
  const tail = tails ? boxOf(tails.polygon).h / 1000 : width;
  const n = normalize(loops.name);
  const spots: Array<{ c: V3; out: V3 }> = [];
  const onSurface = (y: number, angle: number): { c: V3; out: V3 } => {
    const r = (surface.radius(y, angle) ?? 0.15) + LIFT;
    return { c: at(scene.axisZ, r, angle, y), out: [Math.sin(angle), 0, Math.cos(angle)] };
  };
  if (n.includes('epaule')) {
    // On top of each sleeve head: the highest sleeve point on each side.
    for (const side of [1, -1]) {
      let best: V3 | null = null;
      for (const p of panels) {
        if (p.role !== 'sleeve') continue;
        for (let o = 0; o < p.positions.length; o += 3) {
          if (Math.sign(p.positions[o]!) !== side) continue;
          if (!best || p.positions[o + 1]! > best[1]) best = [p.positions[o]!, p.positions[o + 1]!, p.positions[o + 2]!];
        }
      }
      // On the front of the sleeve head, facing forward (a little outward), so the loops read as a bow.
      if (best) spots.push({ c: [best[0], best[1] - 0.04, best[2] + 0.04], out: [side * 0.45, 0, 0.9] });
    }
  } else if (n.includes('arriere')) spots.push(onSurface(scene.waistY - 0.03, Math.PI));
  else if (n.includes('encolure')) spots.push(onSurface(scene.napeY - 0.09, 0));
  else spots.push(onSurface(scene.waistY, 0));
  return spots.map((s, k) => panelOf(bowMesh(s.c, s.out, width, tail), group, `construction-bow-${loops.id}-${k}`, { x: s.out[0] * 0.8, y: 0.3, z: s.out[2] * 0.8 + 0.2 }));
};

const poufPanel = (piece: ConstructionPiece, surface: Surface, scene: ConstructionScene): PanelMeshData => {
  const spread = 1.1;
  const top = scene.waistY - 0.02;
  const height = Math.min(0.45, boxOf(piece.polygon).h / 1000 * 0.55);
  const mesh = gridMesh(ROWS, 24, false, (i, j) => {
    const t = i / ROWS;
    const s = (j / 24) * 2 - 1;
    const angle = Math.PI + s * spread;
    const y = top - height * t;
    const bulge = 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * Math.cos((s * Math.PI) / 2) + 0.01 * Math.sin(8 * s) * t;
    const r = (surface.radius(y, angle) ?? 0.2) + LIFT + bulge;
    return at(scene.axisZ, r, angle, y);
  });
  return panelOf(mesh, piece, `construction-pouf-${piece.id}`, { x: 0, y: 0.2, z: -1.2 });
};

const engageantePanels = (pieces: ConstructionPiece[], scene: ConstructionScene): PanelMeshData[] =>
  scene.sleeveHems.flatMap((sleeve, s) =>
    pieces.map((piece) => {
      const depth = boxOf(piece.polygon).h / 1000;
      const { k } = tierOf(piece.name);
      const len = Math.hypot(...sleeve.dir) || 1;
      const down: V3 = [sleeve.dir[0] / len, sleeve.dir[1] / len, sleeve.dir[2] / len];
      // Each lower tier comes out a little further below the sleeve.
      const shift = (k - 1) * depth * 0.45;
      const ring = sleeve.ring;
      const n = ring.length;
      const c: V3 = [0, 1, 2].map((q) => ring.reduce((sum, p) => sum + p[q]!, 0) / n) as V3;
      // Falls out of the sleeve along the arm, opening a little, in soft gathers (not the stiff frill of a sleeve hem).
      const mesh = gridMesh(6, n, true, (i, j) => {
        const t = i / 6;
        const p = ring[j]!;
        const spread = ENGAGEANTE_START + ENGAGEANTE_SPREAD * t;
        const r: V3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
        const len = Math.hypot(...r) || 1;
        const wave = ENGAGEANTE_WAVE_M * t * Math.sin((2 * Math.PI * 8 * j) / n);
        const along = shift + depth * t;
        return [0, 1, 2].map((q) => c[q]! + r[q]! * spread + (r[q]! / len) * wave + down[q]! * along) as V3;
      });
      return panelOf(mesh, piece, `construction-engageante-${piece.id}-${s}`, { x: s % 2 === 0 ? 1.2 : -1.2, y: -0.2, z: 0 });
    }),
  );

const apronPanel = (piece: ConstructionPiece, surface: Surface, scene: ConstructionScene): PanelMeshData | null => {
  if (!surface.skirt) return null;
  const box = boxOf(piece.polygon);
  const top = scene.waistY - 0.01;
  const length = Math.min(box.h / 1000, top - surface.skirt.hemY - 0.05);
  // Gathered onto the front half of the waist: spans the front, in soft folds.
  const halfAngle = Math.PI / 3.2;
  const mesh = gridMesh(ROWS, 24, false, (i, j) => {
    const t = i / ROWS;
    const sAcross = (j / 24) * 2 - 1;
    const angle = sAcross * halfAngle * (1 + 0.12 * t);
    const y = top - length * t;
    const under = surface.radius(y, angle) ?? surface.radius(top, angle) ?? 0.2;
    return at(scene.axisZ, under + LIFT * 1.5 + 0.006 * Math.sin(10 * sAcross * Math.PI) * (0.3 + t), angle, y);
  });
  return panelOf(mesh, piece, `construction-apron-${piece.id}`, { x: 0, y: -0.3, z: 1.2 });
};

const jabotPanels = (pieces: ConstructionPiece[], surface: Surface, scene: ConstructionScene): PanelMeshData[] =>
  pieces.map((piece) => {
    const { k } = tierOf(piece.name);
    const length = boxOf(piece.polygon).h / 1000;
    const half = 0.055 * (1 - 0.12 * (k - 1));
    const top = scene.napeY - 0.07 - 0.02 * (k - 1);
    // Pleated cascade down the centre front, each lower tier standing a little further out.
    const mesh = gridMesh(6, 16, false, (i, j) => {
      const t = i / 6;
      const sAcross = (j / 16) * 2 - 1;
      const y = top - length * t;
      const x = sAcross * half * (1 + 0.35 * t);
      const base = surface.radius(y, 0) ?? 0.12;
      const pleat = 0.008 * (j % 2 === 0 ? 1 : -1) * (0.4 + t);
      return [x, y, scene.axisZ + base + LIFT * (2 + k) + 0.012 * t + pleat] as V3;
    });
    return panelOf(mesh, piece, `construction-jabot-${piece.id}`, { x: 0, y: 0.8, z: 1 });
  });

/**
 * The construction pieces that stand off the garment, draped over the garment's panels (already draped). Pieces it
 * cannot place (a flounce on a garment without a skirt) are skipped.
 */
export const drapeConstruction = (pieces: ConstructionPiece[], panels: PanelMeshData[], scene: ConstructionScene): PanelMeshData[] => {
  if (pieces.length === 0) return [];
  const garment = readSurface(panels, scene.axisZ, ['skirt', 'bodice', 'torso', 'plastron']);
  const withArms = readSurface(panels, scene.axisZ, ['skirt', 'bodice', 'torso', 'plastron', 'sleeve', 'collar']);
  const named = (key: string): ConstructionPiece[] => pieces.filter((p) => normalize(p.name).startsWith(key));
  const out: PanelMeshData[] = [];
  out.push(...flounces([...named('volant d’ourlet'), ...named("volant d'ourlet"), ...named('volant etage')], garment, scene));
  for (const g of named('godet')) out.push(...godetPanels(g, garment, scene));
  for (const p of [...named('basque rapportee'), ...named('basque a pointes (')]) out.push(peplumPanel(p, garment, scene));
  for (const p of named('pelerine (')) out.push(capeletPanel(p, withArms, scene));
  for (const p of named('drape de tournure')) out.push(poufPanel(p, garment, scene));
  out.push(...engageantePanels(named('engageante — volant'), scene));
  for (const p of named('tablier')) {
    const apron = apronPanel(p, garment, scene);
    if (apron) out.push(apron);
  }
  out.push(...jabotPanels(named('jabot plisse'), garment, scene));
  // Bows: grouped by their place (loops, knot and tails of one bow are one panel).
  const bows = new Map<string, ConstructionPiece[]>();
  for (const p of named('chou ')) {
    const key = normalize(p.name).split('—')[0]!.trim();
    bows.set(key, [...(bows.get(key) ?? []), p]);
  }
  for (const group of bows.values()) out.push(...bowPanels(group, panels, garment, scene));
  return out;
};
