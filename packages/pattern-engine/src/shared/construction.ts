import type {
  ConstructionItem,
  ConstructionMaterialKind,
  ConstructionPartKind,
  InternalLine,
  MeasurementSet,
  Notion,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';
import { FRILL_GATHER, necklineEdge, polylineLength } from './trims';

/**
 * Construction pieces and advanced garnitures (`parameters.construction`), applied after a rule (and its trims) has
 * built its pieces. Every piece is derived from the rule's own pieces (hem sweep, waist, neckline, sleeve hem, back
 * length) or, when the garment has none to read, from the measurements. Pure functions, millimetres, y down.
 *
 * Inventory (see docs/reviews/dress-pattern-catalog.md):
 *  - LINING: « Doublure — <pièce> » for each bodice / skirt / sleeve piece (skirt 25 mm, sleeve 15 mm shorter);
 *  - INTERFACING: « Entoilage — <pièce> » for collars, cuffs, facings, plastrons, belts, revers (no seam allowance);
 *  - HEM_FLOUNCE: one or more tiers of gathered (straight strips) or circular (annulus sectors) flounces up the skirt;
 *  - GODETS: circular-sector inserts set into the skirt seams from the hem up;
 *  - PEPLUM: a separate basque sewn at the waist (circular, pointed or gathered);
 *  - JABOT, CAPELET (pèlerine), BOW (chou: loops, knot, tails), SASH (écharpe drapée), APRON (tablier);
 *  - HEM_BANDS: applied bands that follow each skirt piece's hem;
 *  - ENGAGEANTES: lace undersleeve tiers on a drawstring band (1840–1870);
 *  - BALAYEUSE: the dust ruffle sewn inside a long hem (1870–1905);
 *  - BUSTLE: bustle pad, puffed drapery (pouf) or 18th-century side panniers;
 *  - WATTEAU_PLEAT: the box-pleated back panel of a robe à la française, nape to hem;
 *  - SEAM_POCKETS, BIAS_BINDING, UNDERARM_GUSSET (kimono sleeve), PUFF_SUPPORT (tulle under a puffed sleeve head).
 *
 * Naming contract with the 3D preview (garment-model.ts `classifyPiece`): the names of the pieces added here never
 * contain « jupe », « corsage », « bustier », « manche », « devant », « dos », « côté », « traîne », « jupon »,
 * « plastron », « ceinture », « nœud », « poignet », « revers » nor start with « col » — those words make the preview
 * drape a piece as a panel or a trim. Lining and interfacing copies keep the name of the piece they line, behind
 * « Doublure — » / « Entoilage — », which the preview lists as inside pieces. Tested in `construction.test.ts`.
 */

type Pt = { x: number; y: number };
type Outline = Pt[];

/** Widest panel (mm) cut across a standard 140 cm cloth, selvedges and seam allowances kept. */
export const PANEL_MAX_MM = 1400;
/** The widest circular piece (chord, mm) laid across a 140 cm cloth. */
const SECTOR_MAX_CHORD_MM = 1300;
/** Lining hems: the skirt lining stops this far above the hem, the sleeve lining this far above the sleeve's. */
export const LINING_SKIRT_SHORTER_MM = 25;
export const LINING_SLEEVE_SHORTER_MM = 15;
/** Tiered flounces overlap: each tier is sewn this share of its depth above the one below. */
export const TIER_STEP_SHARE = 0.75;
/** A balayeuse is box-pleated: its length is this many times the hem it lines. */
export const BALAYEUSE_GATHER = 1.5;
/** Waist ease of a separate peplum (mm on the whole girth). */
const PEPLUM_WAIST_EASE_MM = 40;
/** A pointed basque flares out over the hips: its lower edge is this much wider than its top. */
const PEPLUM_POINT_FLARE = 1.08;
/** A gathered peplum / apron: gather ratio over the waist. */
const PEPLUM_GATHER = 1.6;
/** Jabot: finished width of a pleated tier (cut ×3 for the pleats), each lower tier this much shorter. */
const JABOT_WIDTH_MM = 110;
const JABOT_TIER_STEP_MM = 40;
/** A capelet spans this share of a full circle (the shoulders need more than a half, less than a whole). */
const CAPELET_SWEEP = 0.75;
/** Neck ease of a capelet (mm on the whole girth). */
const CAPELET_NECK_EASE_MM = 30;
/** Armhole circumference as a share of the bust girth, when there is no sleeve to read it from. */
const ARMHOLE_BUST_SHARE = 0.45;
/** A pocket opening on the side seam: from this far below the waist, this long. */
const POCKET_OPENING = { fromMm: 40, lengthMm: 160 };
/** Default wrist girth (mm) when the measurement is missing. */
const DEFAULT_WRIST_MM = 170;
/** Hem rows: edges in the lower part of a piece (share of its height) whose outward normal points down this much. */
const HEM_ZONE_SHARE = 0.45;
const HEM_NORMAL_MIN = 0.3;
const ARC_SEGMENTS = 16;

const BODICE = /^(corsage|bustier|empi[èe]cement)\b/i;
const SKIRT = /^jupe\b/i;
const SLEEVE = /^manche\b/i;
const FACING_LIKE = /^(col\b|poignet|parementure|ceinture|plastron|revers)/i;
const NOT_INTERFACED = /gros-grain|ruban|ourlet/i;

// ---------------------------------------------------------------- geometry helpers

const openRing = (outline: Outline): Outline => {
  const a = outline[0];
  const b = outline[outline.length - 1];
  return a && b && a.x === b.x && a.y === b.y ? outline.slice(0, -1) : [...outline];
};
const close = (ring: Outline): Outline => [...ring, { ...ring[0]! }];
const r1 = (v: number): number => Math.round(v * 10) / 10;
const roundPt = (p: Pt): Pt => ({ x: r1(p.x), y: r1(p.y) });

const rect = (w: number, h: number): Outline => close([{ x: 0, y: 0 }, { x: Math.round(w), y: 0 }, { x: Math.round(w), y: Math.round(h) }, { x: 0, y: Math.round(h) }]);

const bounds = (outline: Outline): { minX: number; minY: number; maxX: number; maxY: number } => ({
  minX: Math.min(...outline.map((p) => p.x)),
  minY: Math.min(...outline.map((p) => p.y)),
  maxX: Math.max(...outline.map((p) => p.x)),
  maxY: Math.max(...outline.map((p) => p.y)),
});

/** Moves an outline so its bounding box starts at (0, 0). */
const toOrigin = (outline: Outline): Outline => {
  const b = bounds(outline);
  return outline.map((p) => roundPt({ x: p.x - b.minX, y: p.y - b.minY }));
};

/** Signed area (shoelace); positive when the outward normal of an edge (dx, dy) is (dy, −dx). */
const signedArea = (ring: Outline): number =>
  ring.reduce((s, p, i) => {
    const q = ring[(i + 1) % ring.length]!;
    return s + p.x * q.y - q.x * p.y;
  }, 0) / 2;

/** [minX, maxX] of a ring on the horizontal line y, or null. */
export function rowExtent(outline: Outline, y: number): [number, number] | null {
  const ring = openRing(outline);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const x = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return min === Infinity ? null : [min, max];
}

/** The part of a ring above the line y = yMax (Sutherland–Hodgman against one half-plane). */
export function clipAbove(outline: Outline, yMax: number): Outline {
  const ring = openRing(outline);
  const out: Outline = [];
  for (let i = 0; i < ring.length; i += 1) {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    const pin = p.y <= yMax;
    const qin = q.y <= yMax;
    if (pin) out.push({ ...p });
    if (pin !== qin) out.push({ x: p.x + ((yMax - p.y) / (q.y - p.y)) * (q.x - p.x), y: yMax });
  }
  return out.length >= 3 ? close(out.map(roundPt)) : outline;
}

/**
 * The hem of a piece: the longest run of consecutive edges in its lower part whose outward normal points down
 * (a straight, curved or trained hem alike; side seams and the waist are left out). Ordered along the outline.
 */
export function hemChain(outline: Outline): Outline {
  const ring = openRing(outline);
  if (ring.length < 3) return [];
  const b = bounds(ring);
  const zone = b.minY + (b.maxY - b.minY) * HEM_ZONE_SHARE;
  const sign = Math.sign(signedArea(ring)) || 1;
  const isHem = (i: number): boolean => {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    if (len === 0 || p.y < zone || q.y < zone) return false;
    const ny = (sign * -(q.x - p.x)) / len;
    return ny >= HEM_NORMAL_MIN;
  };
  // Start right after a non-hem edge so a run is never split by the ring's seam.
  const n = ring.length;
  let start = 0;
  while (start < n && isHem(start)) start += 1;
  if (start === n) return [];
  let best: Outline = [];
  let run: Outline = [];
  for (let k = 1; k <= n; k += 1) {
    const i = (start + k) % n;
    if (isHem(i)) {
      if (run.length === 0) run.push({ ...ring[i]! });
      run.push({ ...ring[(i + 1) % n]! });
    } else {
      if (polylineLength(run) > polylineLength(best)) best = run;
      run = [];
    }
  }
  if (polylineLength(run) > polylineLength(best)) best = run;
  return best;
}

/** How many times a piece is cut round the body: a piece cut once lies on the fold (both halves). */
const roundCopies = (piece: PatternPieceGeometry): number => (piece.quantity === 1 ? 2 : piece.quantity);

const grainOf = (outline: Outline, angleDegrees = 90): PatternPieceGeometry['grainline'] => {
  const b = bounds(outline);
  return { angleDegrees, originX: Math.round((b.minX + b.maxX) / 2), originY: Math.round((b.minY + b.maxY) / 2) };
};

/** Points (n + 1) of an arc of radius r round (cx, cy), angles in radians measured from +y (down) towards +x. */
const arc = (cx: number, cy: number, r: number, from: number, to: number, segments = ARC_SEGMENTS): Outline =>
  Array.from({ length: segments + 1 }, (_, i) => {
    const t = from + ((to - from) * i) / segments;
    return { x: cx + r * Math.sin(t), y: cy + r * Math.cos(t) };
  });

/** An annulus sector, symmetric about the downward axis: inner radius rIn, outer rOut, total angle sweep (rad). */
export function annulusSector(rIn: number, rOut: number, sweep: number): Outline {
  const inner = arc(0, 0, rIn, -sweep / 2, sweep / 2);
  const outer = arc(0, 0, rOut, sweep / 2, -sweep / 2);
  return close(toOrigin([...inner, ...outer]));
}

/** Splits a strip length into the fewest equal panels no wider than PANEL_MAX_MM. */
const panelsOf = (lengthMm: number): { count: number; widthMm: number } => {
  const count = Math.max(1, Math.ceil(lengthMm / PANEL_MAX_MM));
  return { count, widthMm: Math.round(lengthMm / count) };
};

// ---------------------------------------------------------------- reading the garment

interface Garment {
  skirts: PatternPieceGeometry[];
  bodices: PatternPieceGeometry[];
  sleeves: PatternPieceGeometry[];
  /** y of the front hem in the skirts' shared frame (waist at y ≈ 0), or null without skirt pieces. */
  floorY: number | null;
}

const readGarment = (pieces: PatternPieceGeometry[]): Garment => {
  const skirts = pieces.filter((p) => SKIRT.test(p.name) && !/jupon/i.test(p.name));
  const bodices = pieces.filter((p) => BODICE.test(p.name));
  const sleeves = pieces.filter((p) => SLEEVE.test(p.name));
  const floorY = skirts.length > 0 ? Math.min(...skirts.map((p) => bounds(p.outlineMm).maxY)) : null;
  return { skirts, bodices, sleeves, floorY };
};

/** Whole hem sweep (mm) round the body: every skirt piece's hem, times the times it is cut. */
export function hemSweepMm(pieces: PatternPieceGeometry[]): number {
  return readGarment(pieces).skirts.reduce((s, p) => s + polylineLength(hemChain(p.outlineMm)) * roundCopies(p), 0);
}

/** Skirt girth (mm, round the body) `heightMm` above the front hem, or null without skirt pieces. */
export function skirtGirthAboveHem(pieces: PatternPieceGeometry[], heightMm: number): number | null {
  const g = readGarment(pieces);
  if (g.floorY === null) return null;
  const y = g.floorY - heightMm;
  let sum = 0;
  for (const p of g.skirts) {
    const e = rowExtent(p.outlineMm, y);
    if (e) sum += (e[1] - e[0]) * roundCopies(p);
  }
  return sum > 0 ? Math.round(sum) : null;
}

/** Total sleeve hem (mm) of one arm: the sum of a one- or two-piece sleeve's hems. */
const sleeveHemMm = (g: Garment): number | null => {
  if (g.sleeves.length === 0) return null;
  const total = g.sleeves.reduce((s, p) => {
    const chain = hemChain(p.outlineMm);
    if (chain.length >= 2) return s + polylineLength(chain);
    const b = bounds(p.outlineMm);
    const e = rowExtent(p.outlineMm, b.maxY - 1);
    return s + (e ? e[1] - e[0] : 0);
  }, 0);
  return total > 0 ? total : null;
};

/** Neckline length (mm) round the whole neck, read off the front and back bodice. */
const necklineLengthMm = (g: Garment): number | null => {
  const front = g.bodices.find((p) => /devant/i.test(p.name));
  const back = g.bodices.find((p) => /dos/i.test(p.name));
  if (!front || !back) return null;
  const off = (p: PatternPieceGeometry): boolean => /hors [ée]paules/i.test(p.name);
  const f = polylineLength(necklineEdge(front.outlineMm, off(front)));
  const b = polylineLength(necklineEdge(back.outlineMm, off(back)));
  return f > 0 && b > 0 ? Math.round(2 * (f + b)) : null;
};

const cm = (m: MeasurementSet, key: string, fallbackCm: number): number => (m[key] ?? fallbackCm) * 10;

// ---------------------------------------------------------------- fabrics and names

const MATERIAL_FABRIC: Record<ConstructionMaterialKind, string> = {
  TISSU: 'Même tissu que la robe',
  DENTELLE: 'Dentelle (festons vers le bas)',
  TULLE: 'Tulle de soie',
  CONTRASTE: 'Tissu contrastant',
};
const MATERIAL_LABEL: Record<ConstructionMaterialKind, string> = { TISSU: 'même tissu', DENTELLE: 'dentelle', TULLE: 'tulle', CONTRASTE: 'contraste' };

const fabricOf = (material: ConstructionMaterialKind | undefined, color?: string): string =>
  `${MATERIAL_FABRIC[material ?? 'TISSU']}${color ? ` (${color})` : ''}`;
const seamOf = (material: ConstructionMaterialKind | undefined): number => (material === 'DENTELLE' ? 0 : 10);

const piece = (
  name: string,
  outlineMm: Outline,
  quantity: number,
  fabricRecommendation: string,
  seamAllowanceMm = 10,
  extra: Partial<PatternPieceGeometry> = {},
): PatternPieceGeometry => ({
  name,
  fabricRecommendation,
  quantity: Math.max(1, Math.round(quantity)),
  seamAllowanceMm,
  grainline: grainOf(outlineMm),
  notches: [],
  outlineMm,
  ...extra,
});

/** Quarter marks along the gathered edge (edge 0 = the top). */
const QUARTER_NOTCHES = [0.25, 0.5, 0.75].map((positionAlongEdge) => ({ positionAlongEdge, edgeIndex: 0 }));

// ---------------------------------------------------------------- the items

interface Output {
  added: PatternPieceGeometry[];
  /** Extra internal lines per base piece name (placement of flounces, godets, bands, pocket openings). */
  marks: Map<string, MarkLine[]>;
  warnings: string[];
  notions: Notion[];
}

/** A mark on a piece; `single`: its detail is drawn on one side only of a piece cut double or on the fold. */
type MarkLine = InternalLine & { single?: boolean };

const mark = (out: Output, name: string, line: MarkLine): void => {
  out.marks.set(name, [...(out.marks.get(name) ?? []), line]);
};

/** A horizontal placement line across every skirt piece, `heightMm` above the front hem. */
const markSkirtRow = (out: Output, g: Garment, heightMm: number): void => {
  if (g.floorY === null) return;
  const y = Math.round(g.floorY - heightMm);
  for (const p of g.skirts) {
    const e = rowExtent(p.outlineMm, y);
    if (e) mark(out, p.name, { kind: 'PLACEMENT', points: [{ x: r1(e[0]), y }, { x: r1(e[1]), y }] });
  }
};

function hemFlounce(item: Extract<ConstructionItem, { kind: 'HEM_FLOUNCE' }>, g: Garment, pieces: PatternPieceGeometry[], out: Output): void {
  if (g.floorY === null) {
    out.warnings.push('Volants d’ourlet : pas de jupe à border, aucun volant ajouté.');
    return;
  }
  const label = MATERIAL_LABEL[item.material ?? 'TISSU'];
  for (let k = 1; k <= item.tiers; k += 1) {
    const sewnAt = Math.round(item.depthMm * (1 + (k - 1) * TIER_STEP_SHARE));
    const girth = skirtGirthAboveHem(pieces, sewnAt) ?? hemSweepMm(pieces);
    if (girth <= 0) continue;
    const tierName = item.tiers === 1 ? 'Volant d’ourlet' : `Volant étagé ${k}/${item.tiers}`;
    if (item.style === 'FRONCE') {
      const { count, widthMm } = panelsOf(girth * FRILL_GATHER);
      out.added.push(
        piece(`${tierName} (froncé, ${label})`, rect(widthMm, item.depthMm), count, fabricOf(item.material, item.color), seamOf(item.material), {
          grainline: { angleDegrees: 0, originX: Math.round(widthMm / 2), originY: Math.round(item.depthMm / 2) },
          notches: QUARTER_NOTCHES,
        }),
      );
    } else {
      // A circular flounce: its inner edge is as long as the skirt round it (no gathers), cut in sectors.
      const rIn = girth / (2 * Math.PI);
      const rOut = rIn + item.depthMm;
      let sectors = 2;
      while (2 * rOut * Math.sin(Math.PI / sectors) > SECTOR_MAX_CHORD_MM && sectors < 24) sectors += 1;
      const outline = annulusSector(rIn, rOut, (2 * Math.PI) / sectors);
      out.added.push(piece(`${tierName} en forme (${sectors} secteurs, ${label})`, outline, sectors, fabricOf(item.material, item.color), seamOf(item.material)));
      if (k === 1) out.notions.push({ label: 'Crin (galon de crin) 25 mm — bord du volant en forme', lengthMm: Math.round(2 * Math.PI * rOut) });
    }
    markSkirtRow(out, g, sewnAt);
  }
}

function godets(item: Extract<ConstructionItem, { kind: 'GODETS' }>, g: Garment, out: Output): void {
  const h = item.heightMm;
  const sweep = 2 * Math.asin(Math.min(1, item.widthMm / (2 * h)));
  const apex = { x: 0, y: 0 };
  const outline = close(toOrigin([apex, ...arc(0, 0, h, sweep / 2, -sweep / 2)]));
  out.added.push(
    piece(`Godet (${item.count} à insérer)`, outline, item.count, 'Même tissu que la robe — milieu du godet dans le droit-fil', 10, {
      grainline: { angleDegrees: 90, originX: Math.round(bounds(outline).maxX / 2), originY: Math.round(h / 2) },
    }),
  );
  if (g.floorY === null) {
    out.warnings.push('Godets : pas de jupe dans ce patron, leur emplacement n’est pas marqué.');
    return;
  }
  // The slit each godet is set into: up the seam on the side edge of every skirt piece.
  const y0 = Math.round(g.floorY - h);
  const y1 = Math.round(g.floorY - 1);
  for (const p of g.skirts) {
    const a = rowExtent(p.outlineMm, y0);
    const b = rowExtent(p.outlineMm, y1);
    if (a && b) mark(out, p.name, { kind: 'PLACEMENT', points: [{ x: r1(a[1]), y: y0 }, { x: r1(b[1]), y: y1 }] });
  }
}

function peplum(item: Extract<ConstructionItem, { kind: 'PEPLUM' }>, base: PatternPieceGeometry[], m: MeasurementSet, out: Output): void {
  if (base.some((p) => /basque/i.test(p.name))) {
    out.warnings.push('Basque rapportée : le patron a déjà une basque, la basque rapportée n’est pas ajoutée.');
    return;
  }
  const waist = cm(m, 'TOUR_TAILLE', 70) + PEPLUM_WAIST_EASE_MM;
  const d = item.depthMm;
  const fabric = fabricOf(item.material, item.color);
  if (item.style === 'CIRCULAIRE') {
    // Two half circles: the inner edge of both together is the waist.
    const rIn = waist / (2 * Math.PI);
    const outline = annulusSector(rIn, rIn + d, Math.PI);
    out.added.push(piece('Basque rapportée en forme (½)', outline, 2, fabric, seamOf(item.material)));
  } else if (item.style === 'POINTES') {
    const half = waist / 2;
    const f = PEPLUM_POINT_FLARE;
    // From the centre front (x = 0, the deepest point) to the centre back (a postillion point), two smaller points
    // over the hips between.
    const outline = close([
      { x: 0, y: 0 },
      { x: Math.round(half), y: 0 },
      { x: Math.round(half * f), y: Math.round(0.8 * d) },
      { x: Math.round(0.75 * half * f), y: Math.round(0.3 * d) },
      { x: Math.round(0.5 * half * f), y: Math.round(0.55 * d) },
      { x: Math.round(0.25 * half * f), y: Math.round(0.3 * d) },
      { x: 0, y: d },
    ]);
    out.added.push(piece('Basque à pointes (½, pointe au milieu)', outline, 2, fabric, seamOf(item.material)));
    out.added.push(piece('Basque à pointes — parementure', outline, 2, 'Doublure ou même tissu', 10));
  } else {
    out.added.push(piece('Basque rapportée froncée (½)', rect((waist / 2) * PEPLUM_GATHER, d), 2, fabric, seamOf(item.material), { notches: QUARTER_NOTCHES }));
  }
}

/** Top of a bodice piece's centre line (its smallest y at x ≈ 0): the centre-front neck point. */
const centreNeckY = (outline: Outline): number => {
  const centre = outline.filter((p) => p.x <= 2);
  return centre.length > 0 ? Math.min(...centre.map((p) => p.y)) : bounds(outline).minY;
};

function jabot(item: Extract<ConstructionItem, { kind: 'JABOT' }>, g: Garment, out: Output): void {
  const front = g.bodices.find((p) => /devant/i.test(p.name));
  if (front) {
    // Hangs from the centre-front neck: half its finished width each side of the centre line (the area is mirrored).
    const y0 = centreNeckY(front.outlineMm);
    const y1 = Math.min(bounds(front.outlineMm).maxY - 10, y0 + item.lengthMm);
    const half = JABOT_WIDTH_MM / 2;
    const names = Array.from({ length: item.tiers }, (_, i) => `Jabot plissé — volant ${i + 1}/${item.tiers}`);
    mark(out, front.name, {
      kind: 'PLACEMENT',
      points: [{ x: 0, y: y0 }, { x: 0, y: y1 }],
      detail: { pieces: names, area: close([{ x: 0, y: y0 }, { x: half, y: y0 }, { x: half * 1.3, y: y1 }, { x: 0, y: y1 + 15 }]), layer: 2 },
    });
  }
  const w = JABOT_WIDTH_MM * 3;
  for (let k = 1; k <= item.tiers; k += 1) {
    const h = Math.max(80, item.lengthMm - (k - 1) * JABOT_TIER_STEP_MM);
    const sag = Math.min(40, h * 0.15);
    // Rounded lower edge, lowest in the middle.
    const bottom = Array.from({ length: 9 }, (_, i) => {
      const x = w - (w * i) / 8;
      return { x: Math.round(x), y: Math.round(h + sag * Math.sin((Math.PI * x) / w)) };
    });
    const outline = close([{ x: 0, y: 0 }, { x: w, y: 0 }, ...bottom]);
    out.added.push(piece(`Jabot plissé — volant ${k}/${item.tiers}`, outline, 1, fabricOf(item.material ?? 'DENTELLE', item.color), seamOf(item.material ?? 'DENTELLE')));
  }
  out.added.push(piece('Jabot — patte d’attache', rect(JABOT_WIDTH_MM, 40), 1, 'Même tissu, entoilé'));
  out.notions.push({ label: 'Pression ou agrafe (jabot amovible)', quantity: 2 });
}

function capelet(item: Extract<ConstructionItem, { kind: 'CAPELET' }>, m: MeasurementSet, out: Output): void {
  const neck = cm(m, 'TOUR_COU', 36) + CAPELET_NECK_EASE_MM;
  const sweep = 2 * Math.PI * CAPELET_SWEEP;
  const rIn = neck / sweep;
  // Half the capelet, from the centre back (on the fold, angle 0) to the centre front (half the sweep).
  const inner = arc(0, 0, rIn, 0, sweep / 2);
  const outer = arc(0, 0, rIn + item.lengthMm, sweep / 2, 0);
  const outline = close(toOrigin([...inner, ...outer]));
  out.added.push(piece('Pèlerine (½, milieu arrière au pli)', outline, 1, fabricOf(item.material, item.color), seamOf(item.material)));
  out.added.push(piece('Pèlerine — parementure d’encolure', close(toOrigin([...arc(0, 0, rIn, 0, sweep / 2), ...arc(0, 0, rIn + 50, sweep / 2, 0)])), 1, 'Même tissu + entoilage léger'));
  out.notions.push({ label: 'Agrafe ou ruban de fermeture (pèlerine)', quantity: 1 });
}

const BOW_PLACE: Record<Extract<ConstructionItem, { kind: 'BOW' }>['place'], { label: string; sides: number; tail: number }> = {
  MANCHES: { label: 'Chou d’épaule', sides: 2, tail: 1.2 },
  DOS: { label: 'Chou arrière', sides: 1, tail: 3 },
  TAILLE: { label: 'Chou de taille', sides: 1, tail: 2 },
  ENCOLURE: { label: 'Chou d’encolure', sides: 1, tail: 1 },
};

function bow(item: Extract<ConstructionItem, { kind: 'BOW' }>, out: Output): void {
  const w = item.widthMm;
  const place = BOW_PLACE[item.place];
  const fabric = fabricOf(item.material, item.color);
  const tailWidth = Math.round(0.45 * w);
  const tailLength = Math.round(place.tail * w);
  out.added.push(piece(`${place.label} — boucles`, rect(2.2 * w, 0.5 * w), place.sides, `${fabric} — plié en deux dans la longueur`, 10, { notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }] }));
  out.added.push(piece(`${place.label} — milieu`, rect(Math.max(60, 0.35 * w), Math.max(50, 0.3 * w)), place.sides, fabric));
  out.added.push(
    piece(`${place.label} — pans`, close([{ x: 0, y: 0 }, { x: tailWidth, y: 0 }, { x: tailWidth, y: tailLength }, { x: 0, y: tailLength - tailWidth }]), 2 * place.sides, fabric),
  );
}

function hemBands(item: Extract<ConstructionItem, { kind: 'HEM_BANDS' }>, g: Garment, out: Output): void {
  if (g.skirts.length === 0) {
    out.warnings.push('Bandes appliquées : pas de jupe à border, aucune bande ajoutée.');
    return;
  }
  const label = MATERIAL_LABEL[item.material ?? 'CONTRASTE'];
  g.skirts.forEach((p, index) => {
    const chain = hemChain(p.outlineMm);
    if (chain.length < 2) return;
    for (let k = 1; k <= item.rows; k += 1) {
      const lift = item.gapMm + (k - 1) * (item.widthMm + item.gapMm);
      const lower = chain.map((q) => roundPt({ x: q.x, y: q.y - lift }));
      const upper = chain.map((q) => roundPt({ x: q.x, y: q.y - lift - item.widthMm })).reverse();
      const name = `Bande appliquée ${k}/${item.rows} — pièce ${index + 1} de l’ourlet (${label})`;
      out.added.push(piece(name, close(toOrigin([...lower, ...upper])), p.quantity, fabricOf(item.material ?? 'CONTRASTE', item.color), 6));
      // Where the band lies on the skirt piece: the 3D preview lays it on the cloth there.
      mark(out, p.name, {
        kind: 'PLACEMENT',
        points: upper.slice().reverse(),
        detail: { pieces: [name], area: close([...lower, ...upper]), ...((item.material ?? 'CONTRASTE') === 'CONTRASTE' ? { contrast: true } : {}), layer: 1 },
      });
    }
  });
}

function engageantes(item: Extract<ConstructionItem, { kind: 'ENGAGEANTES' }>, g: Garment, m: MeasurementSet, out: Output): void {
  const hem = Math.max(260, sleeveHemMm(g) ?? 300);
  const label = MATERIAL_LABEL[item.material ?? 'DENTELLE'];
  for (let k = 1; k <= item.tiers; k += 1) {
    const depth = Math.max(30, item.depthMm - (k - 1) * 15);
    const { count, widthMm } = panelsOf(hem * FRILL_GATHER);
    out.added.push(
      piece(`Engageante — volant ${k}/${item.tiers} (${label})`, rect(widthMm, depth), 2 * count, fabricOf(item.material ?? 'DENTELLE', item.color), seamOf(item.material ?? 'DENTELLE'), { notches: QUARTER_NOTCHES }),
    );
  }
  out.added.push(piece('Engageante — bracelet coulissé', rect(cm(m, 'TOUR_POIGNET', DEFAULT_WRIST_MM / 10) + 40, 40), 2, 'Batiste ou linon'));
  out.notions.push({ label: 'Ruban de coulisse 6 mm (engageantes)', lengthMm: Math.round(2 * (cm(m, 'TOUR_POIGNET', DEFAULT_WRIST_MM / 10) + 300)) });
}

function balayeuse(item: Extract<ConstructionItem, { kind: 'BALAYEUSE' }>, pieces: PatternPieceGeometry[], out: Output): void {
  const hem = hemSweepMm(pieces);
  if (hem <= 0) {
    out.warnings.push('Balayeuse : pas d’ourlet de jupe à doubler, aucune balayeuse ajoutée.');
    return;
  }
  const { count, widthMm } = panelsOf(hem * BALAYEUSE_GATHER);
  out.added.push(
    piece('Balayeuse (volant de propreté, plissé)', rect(widthMm, item.depthMm), count, 'Batiste, organdi ou tarlatane — cousue à l’intérieur de l’ourlet', 10, { notches: QUARTER_NOTCHES }),
  );
}

function bustle(item: Extract<ConstructionItem, { kind: 'BUSTLE' }>, m: MeasurementSet, out: Output): void {
  const waist = cm(m, 'TOUR_TAILLE', 70);
  const tie = (label: string): PatternPieceGeometry => piece(label, rect(waist + 300, 30), 1, 'Ruban ou même toile, plié');
  if (item.style === 'PANIERS') {
    const w = 380;
    const d = 300;
    const outline = close([{ x: 0, y: 0 }, { x: w, y: 0 }, ...arc(w / 2, 0, w / 2, Math.PI / 2, -Math.PI / 2).slice(1, -1).map((p) => ({ x: p.x, y: (p.y * d) / (w / 2) }))]);
    out.added.push(piece('Panier (poche de hanche)', close(toOrigin(openRing(outline))), 4, 'Toile de coton forte'));
    out.added.push(tie('Lien des paniers'));
    out.notions.push({ label: 'Cerceaux de panier (jonc ou baleine plastique)', quantity: 6, lengthMm: 6 * 1100 });
    return;
  }
  // Bustle pad: a crescent (outer half ellipse, inner smaller one), cut twice and stuffed.
  const outer = Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
    const t = Math.PI - (Math.PI * i) / ARC_SEGMENTS;
    return { x: 170 + 170 * Math.cos(t), y: 120 - 120 * Math.sin(t) };
  });
  const inner = Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
    const t = (Math.PI * i) / ARC_SEGMENTS;
    return { x: 170 + 110 * Math.cos(t), y: 120 - 50 * Math.sin(t) };
  });
  out.added.push(piece('Coussin de tournure', close([...outer, ...inner].map(roundPt)), 2, 'Toile de coton forte'));
  out.added.push(tie('Lien de tournure'));
  out.notions.push({ label: 'Crin ou ouate de rembourrage (tournure)', quantity: 1 });
  if (item.style === 'POUF') {
    const w = Math.round((cm(m, 'TOUR_BASSIN', 96) / 2) * 1.3);
    const h = 800;
    const sag = 150;
    const bottom = Array.from({ length: 9 }, (_, i) => {
      const x = w - (w * i) / 8;
      return { x: Math.round(x), y: Math.round(h + sag * Math.sin((Math.PI * x) / w)) };
    });
    out.added.push(piece('Drapé de tournure (pouf)', close([{ x: 0, y: 0 }, { x: w, y: 0 }, ...bottom]), 1, 'Même tissu que la robe — relevé par des cordons', 10, { notches: QUARTER_NOTCHES }));
    out.notions.push({ label: 'Cordons de relevé du pouf (4 × 60 cm)', quantity: 4, lengthMm: 2400 });
  }
}

function watteau(item: Extract<ConstructionItem, { kind: 'WATTEAU_PLEAT' }>, g: Garment, m: MeasurementSet, out: Output): void {
  const backBodice = g.bodices.find((p) => /dos/i.test(p.name));
  const backSkirt = g.skirts.find((p) => /dos/i.test(p.name)) ?? g.skirts[0];
  const top = backBodice ? bounds(backBodice.outlineMm).maxY - bounds(backBodice.outlineMm).minY : cm(m, 'LONGUEUR_DOS', 41);
  const skirt = backSkirt ? bounds(backSkirt.outlineMm).maxY - bounds(backSkirt.outlineMm).minY : 1000;
  const length = Math.round(top + skirt);
  const w = 2 * item.depthMm;
  const flare = Math.round(0.1 * length);
  const outline = close([{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w + flare, y: length }, { x: 0, y: length }]);
  // On the back pieces, along the centre back: the 3D preview lays the pleat there.
  for (const host of [backBodice, backSkirt]) {
    if (!host) continue;
    const b = bounds(host.outlineMm);
    const top = host === backBodice ? centreNeckY(host.outlineMm) : b.minY;
    mark(out, host.name, {
      kind: 'PLACEMENT',
      points: [{ x: 0, y: top }, { x: 0, y: b.maxY }],
      detail: { pieces: ['Pli Watteau (panneau, milieu au pli)'], area: close([{ x: 0, y: top }, { x: w, y: top }, { x: w + (host === backSkirt ? flare / 2 : 0), y: b.maxY - 2 }, { x: 0, y: b.maxY - 2 }]), layer: 1 },
    });
  }
  out.added.push(
    piece('Pli Watteau (panneau, milieu au pli)', outline, 1, 'Même tissu que la robe — deux plis creux cousus de la nuque aux omoplates', 10, {
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    }),
  );
}

function seamPockets(g: Garment, out: Output): void {
  const outline = close([
    { x: 0, y: 0 },
    { x: 160, y: 0 },
    { x: 185, y: 50 },
    { x: 185, y: 230 },
    { x: 150, y: 290 },
    { x: 80, y: 305 },
    { x: 20, y: 290 },
    { x: 0, y: 260 },
  ]);
  out.added.push(piece('Fond de poche dans la couture', outline, 4, 'Doublure ou popeline'));
  // The opening, on the side seam of the front skirt piece that reaches furthest out.
  const fronts = g.skirts.filter((p) => /devant/i.test(p.name));
  const pool = fronts.length > 0 ? fronts : g.skirts;
  const side = pool.reduce<PatternPieceGeometry | null>((best, p) => (!best || bounds(p.outlineMm).maxX > bounds(best.outlineMm).maxX ? p : best), null);
  if (!side) {
    out.warnings.push('Poches dans la couture : pas de couture de côté de jupe, l’ouverture n’est pas marquée.');
    return;
  }
  const top = bounds(side.outlineMm).minY;
  const y0 = Math.round(top + POCKET_OPENING.fromMm);
  const y1 = y0 + POCKET_OPENING.lengthMm;
  const a = rowExtent(side.outlineMm, y0);
  const b = rowExtent(side.outlineMm, y1);
  if (a && b) mark(out, side.name, { kind: 'PLACEMENT', points: [{ x: r1(a[1]), y: y0 }, { x: r1(b[1]), y: y1 }] });
}

function biasBinding(item: Extract<ConstructionItem, { kind: 'BIAS_BINDING' }>, g: Garment, m: MeasurementSet, out: Output): void {
  const neck = necklineLengthMm(g) ?? cm(m, 'TOUR_COU', 36) + 60;
  const strip = (name: string, length: number, quantity: number): PatternPieceGeometry =>
    piece(name, rect(length + 40, item.widthMm), quantity, 'Même tissu, coupé dans le biais (45°)', 0, {
      grainline: { angleDegrees: 45, originX: Math.round((length + 40) / 2), originY: Math.round(item.widthMm / 2) },
    });
  out.added.push(strip('Biais d’encolure', Math.round(neck), 1));
  if (g.sleeves.length === 0) out.added.push(strip('Biais d’emmanchure', Math.round(cm(m, 'TOUR_POITRINE', 90) * ARMHOLE_BUST_SHARE), 2));
}

function gusset(item: Extract<ConstructionItem, { kind: 'UNDERARM_GUSSET' }>, out: Output): void {
  const s = item.sizeMm;
  const outline = close([{ x: s / 2, y: 0 }, { x: s, y: s / 2 }, { x: s / 2, y: s }, { x: 0, y: s / 2 }]);
  out.added.push(piece('Gousset de dessous de bras', outline, 2, 'Même tissu, dans le biais', 6, { grainline: { angleDegrees: 45, originX: Math.round(s / 2), originY: Math.round(s / 2) } }));
}

function sash(item: Extract<ConstructionItem, { kind: 'SASH' }>, g: Garment, out: Output): void {
  const parts = item.lengthMm > 2800 ? 2 : 1;
  const l = Math.round(item.lengthMm / parts + (parts > 1 ? 20 : 0));
  const w = item.widthMm;
  const outline = close([{ x: w, y: 0 }, { x: l, y: 0 }, { x: l - w, y: w }, { x: 0, y: w }]);
  const front = g.bodices.find((p) => /devant/i.test(p.name));
  const name = `Écharpe drapée (biais${parts > 1 ? ', en 2 parties' : ''})`;
  if (front) {
    // From the shoulder down across the chest to the opposite side of the waist (drawn on one side only).
    const b = bounds(front.outlineMm);
    const W = b.maxX - b.minX;
    const H = b.maxY - b.minY;
    const band = Math.min(w, H * 0.35);
    const area = close([
      { x: b.minX + W * 0.45, y: b.minY + 5 },
      { x: b.minX + W * 0.45 + band, y: b.minY + 5 },
      { x: b.minX + W * 0.95, y: b.maxY - 5 },
      { x: b.minX + W * 0.95 - band * 1.2, y: b.maxY - 5 },
    ]).map(roundPt);
    mark(out, front.name, { kind: 'PLACEMENT', single: true, points: [area[0]!, area[2]!], detail: { pieces: [name], area, layer: 2, ...(item.material === 'CONTRASTE' ? { contrast: true } : {}) } });
  }
  out.added.push(
    piece(name, outline, parts, fabricOf(item.material, item.color), seamOf(item.material), {
      grainline: { angleDegrees: 45, originX: Math.round(l / 2), originY: Math.round(w / 2) },
    }),
  );
}

function puffSupport(g: Garment, out: Output): void {
  if (g.sleeves.length === 0) {
    out.warnings.push('Soutien de bouffant : pas de manche, rien à soutenir.');
    return;
  }
  const head = Math.max(...g.sleeves.map((p) => bounds(p.outlineMm).maxX - bounds(p.outlineMm).minX));
  const w = Math.round(head * 0.7);
  const h = 160;
  const bottom = Array.from({ length: 9 }, (_, i) => {
    const x = w - (w * i) / 8;
    return { x: Math.round(x), y: Math.round(h * Math.sin((Math.PI * x) / w)) };
  });
  out.added.push(piece('Soutien de bouffant (tulle raide)', close([{ x: 0, y: 0 }, ...bottom.reverse().slice(1, -1), { x: w, y: 0 }].reverse()), 2, 'Tulle raide ou crin, froncé dans la tête', 0));
}

function apron(item: Extract<ConstructionItem, { kind: 'APRON' }>, g: Garment, m: MeasurementSet, out: Output): void {
  const waist = cm(m, 'TOUR_TAILLE', 70);
  const w = Math.round((waist / 2) * item.fullness);
  const front = g.skirts.find((p) => /devant/i.test(p.name) && bounds(p.outlineMm).minX <= 2) ?? g.skirts.find((p) => bounds(p.outlineMm).minX <= 2);
  if (front) {
    // Gathered onto a quarter of the waist each side of the centre front, falling straight.
    const b = bounds(front.outlineMm);
    const half = Math.min(b.maxX * 0.95, waist / 4);
    const y1 = Math.min(b.maxY - 10, b.minY + item.lengthMm);
    const area = close([{ x: 0, y: b.minY + 5 }, { x: half, y: b.minY + 5 }, { x: half * 1.15, y: y1 }, { x: 0, y: y1 }]).map(roundPt);
    mark(out, front.name, {
      kind: 'PLACEMENT',
      points: [area[0]!, area[1]!],
      detail: { pieces: ['Tablier'], area, layer: 2, ...((item.material ?? 'CONTRASTE') === 'CONTRASTE' ? { contrast: true } : {}) },
    });
  }
  out.added.push(piece('Tablier', rect(w, item.lengthMm), 1, fabricOf(item.material ?? 'CONTRASTE', item.color), 10, { notches: QUARTER_NOTCHES }));
  out.added.push(piece('Lien de tablier', rect(waist + 1000, 80), 1, fabricOf(item.material ?? 'CONTRASTE', item.color)));
}

function lining(item: Extract<ConstructionItem, { kind: 'LINING' }>, g: Garment, base: PatternPieceGeometry[], out: Output): void {
  const parts = new Set<ConstructionPartKind>(item.parts && item.parts.length > 0 ? item.parts : ['CORSAGE', 'JUPE', 'MANCHES']);
  const hasPetticoat = base.some((p) => /jupon/i.test(p.name));
  if (hasPetticoat && parts.has('JUPE')) out.warnings.push('Doublure : la jupe a déjà son jupon-doublure, elle n’est pas doublée une seconde fois.');
  const copy = (p: PatternPieceGeometry, shorterMm: number): PatternPieceGeometry => {
    const outline = shorterMm > 0 ? clipAbove(p.outlineMm, bounds(p.outlineMm).maxY - shorterMm) : p.outlineMm.map((q) => ({ ...q }));
    return {
      name: `Doublure — ${p.name}`,
      fabricRecommendation: 'Doublure (pongé de soie, Bemberg ou acétate)',
      quantity: p.quantity,
      seamAllowanceMm: p.seamAllowanceMm,
      grainline: { ...p.grainline },
      notches: p.notches.map((n) => ({ ...n })),
      outlineMm: outline,
    };
  };
  if (parts.has('CORSAGE')) for (const p of g.bodices) out.added.push(copy(p, 0));
  if (parts.has('JUPE') && !hasPetticoat) for (const p of g.skirts) out.added.push(copy(p, LINING_SKIRT_SHORTER_MM));
  if (parts.has('MANCHES')) for (const p of g.sleeves) out.added.push(copy(p, LINING_SLEEVE_SHORTER_MM));
}

function interfacing(pieces: PatternPieceGeometry[], out: Output): void {
  for (const p of pieces) {
    // A gros-grain waist stay and hem facings are never interfaced.
    if (!FACING_LIKE.test(p.name) || NOT_INTERFACED.test(p.name)) continue;
    // A collar is cut twice (upper and under collar): only one is interfaced.
    const quantity = /^col\b/i.test(p.name) ? Math.max(1, Math.ceil(p.quantity / 2)) : p.quantity;
    out.added.push({
      name: `Entoilage — ${p.name}`,
      fabricRecommendation: 'Entoilage thermocollant (coupé sans valeur de couture)',
      quantity,
      seamAllowanceMm: 0,
      grainline: { ...p.grainline },
      notches: [],
      outlineMm: p.outlineMm.map((q) => ({ ...q })),
    });
  }
}

/** Embroidery thread: running length (mm) per mm² of embroidered surface (satin stitch, indicative). */
const EMBROIDERY_THREAD_PER_MM2 = 1;
/** One skein of stranded cotton: 8 m. */
const SKEIN_MM = 8000;

/** A band `widthMm` deep under an edge (x growing), as a closed area. */
const bandUnder = (edge: Outline, widthMm: number): Outline => close([...edge.map(roundPt), ...edge.map((p) => roundPt({ x: p.x, y: p.y + widthMm })).reverse()]);

/** How high (mm above the hem) the flounces of a skirt reach: the top tier's seam. 0 without flounces. */
const flounceTopMm = (items: ConstructionItem[]): number =>
  Math.max(0, ...items.map((i) => (i.kind === 'HEM_FLOUNCE' ? Math.round(i.depthMm * (1 + (i.tiers - 1) * TIER_STEP_SHARE)) : 0)));

/**
 * `aboveHemMm`: where a hem embroidery may start — above the flounces, which would otherwise hide it (they stand off
 * the skirt from their seam down).
 */
function embroidery(item: Extract<ConstructionItem, { kind: 'EMBROIDERY' }>, g: Garment, out: Output, aboveHemMm = 0): void {
  const areas: Array<{ host: PatternPieceGeometry; area: Outline }> = [];
  const off = (p: PatternPieceGeometry): boolean => /hors [ée]paules/i.test(p.name);
  if (item.place === 'ENCOLURE') {
    for (const host of g.bodices.filter((p) => /devant|dos/i.test(p.name))) {
      const edge = necklineEdge(host.outlineMm, off(host));
      if (edge.length >= 2) areas.push({ host, area: bandUnder(edge, item.widthMm) });
    }
  } else if (item.place === 'CORSAGE') {
    const host = g.bodices.find((p) => /devant/i.test(p.name));
    if (host) {
      const b = bounds(host.outlineMm);
      const top = centreNeckY(host.outlineMm) + 30;
      const bottom = Math.min(b.maxY - 20, top + Math.max(item.widthMm, (b.maxY - top) * 0.6));
      const half = Math.min((b.maxX - b.minX) * 0.45, item.widthMm);
      areas.push({ host, area: close([{ x: 0, y: top }, { x: half, y: top }, { x: half * 0.6, y: bottom }, { x: 0, y: bottom }]) });
    }
  } else {
    const hosts = item.place === 'MANCHES' ? g.sleeves : g.skirts;
    for (const host of hosts) {
      const chain = hemChain(host.outlineMm);
      if (chain.length < 2) continue;
      const start = 15 + (item.place === 'OURLET' ? aboveHemMm : 0);
      const lower = chain.map((q) => roundPt({ x: q.x, y: q.y - start }));
      const upper = chain.map((q) => roundPt({ x: q.x, y: q.y - start - item.widthMm })).reverse();
      areas.push({ host, area: close([...lower, ...upper]) });
    }
  }
  if (areas.length === 0) {
    out.warnings.push(`Broderie : rien à broder à cet emplacement (${item.place.toLowerCase()}).`);
    return;
  }
  const place = { ENCOLURE: 'encolure', CORSAGE: 'plastron du corsage', MANCHES: 'bas des bras', OURLET: 'bas de l’ourlet' }[item.place];
  const name = `Gabarit de broderie (${place})`;
  let surface = 0;
  areas.forEach(({ host, area }) => {
    mark(out, host.name, { kind: 'PLACEMENT', points: area.slice(0, 2), detail: { pieces: [name], area, contrast: true, layer: 3, motif: 'BRODERIE', ...(item.color ? { color: item.color } : {}) } });
    surface += Math.abs(signedArea(openRing(area))) * roundCopies(host);
  });
  // The template: the largest area, to trace the motif onto the cloth before cutting.
  const largest = areas.reduce((a, b) => (Math.abs(signedArea(openRing(b.area))) > Math.abs(signedArea(openRing(a.area))) ? b : a));
  out.added.push(piece(name, close(toOrigin(openRing(largest.area))), 1, `Papier calque — motif à reporter${item.color ? ` (fil ${item.color})` : ''}`, 0));
  const thread = Math.round(surface * EMBROIDERY_THREAD_PER_MM2);
  out.notions.push({ label: `Fil à broder${item.color ? ` ${item.color}` : ''} (${place})`, lengthMm: thread, quantity: Math.max(1, Math.ceil(thread / SKEIN_MM)) });
}

function smocking(item: Extract<ConstructionItem, { kind: 'SMOCKING' }>, g: Garment, m: MeasurementSet, out: Output): void {
  const depth = item.rows * 12 + 30;
  let host: PatternPieceGeometry | undefined;
  let width = 0;
  let area: Outline | null = null;
  let quantity = 1;
  if (item.place === 'MANCHES') {
    host = g.sleeves[0];
    if (host) {
      const chain = hemChain(host.outlineMm);
      width = chain.length >= 2 ? polylineLength(chain) : bounds(host.outlineMm).maxX - bounds(host.outlineMm).minX;
      const lower = chain.map((q) => roundPt({ x: q.x, y: q.y - 20 }));
      const upper = chain.map((q) => roundPt({ x: q.x, y: q.y - 20 - depth })).reverse();
      if (lower.length >= 2) area = close([...lower, ...upper]);
      quantity = 2;
    }
  } else {
    host = g.bodices.find((p) => /devant/i.test(p.name));
    if (host) {
      const b = bounds(host.outlineMm);
      const top = item.place === 'CORSAGE' ? centreNeckY(host.outlineMm) + 10 : b.maxY - depth - 5;
      const e0 = rowExtent(host.outlineMm, top + 2);
      const e1 = rowExtent(host.outlineMm, top + depth);
      if (e0 && e1) {
        const right = Math.min(e0[1], e1[1]) * (item.place === 'CORSAGE' ? 0.8 : 1);
        width = right * roundCopies(host);
        area = close([{ x: 0, y: top }, { x: right, y: top }, { x: right, y: top + depth }, { x: 0, y: top + depth }]).map(roundPt);
      }
      if (item.place === 'TAILLE') width = Math.max(width, cm(m, 'TOUR_TAILLE', 70) / 2);
    }
  }
  if (!host || !area || width <= 0) {
    out.warnings.push('Smocks : pas de pièce à smocker à cet emplacement.');
    return;
  }
  const place = { CORSAGE: 'plastron', MANCHES: 'bas des bras', TAILLE: 'taille' }[item.place];
  const name = `Panneau à smocks (${place})`;
  const cut = Math.round(width * item.ratio);
  const { count, widthMm } = panelsOf(cut);
  out.added.push(piece(name, rect(widthMm, depth + 20), count * quantity, `Même tissu, ${item.ratio} × la largeur finie, ${item.rows} rangs de smocks`, 10, { notches: QUARTER_NOTCHES }));
  mark(out, host.name, { kind: 'PLACEMENT', points: area.slice(0, 2), detail: { pieces: [name], area, layer: 1, motif: 'SMOCKS' } });
  out.notions.push({ label: `Fil élastique (smocks, ${place})`, lengthMm: Math.round(item.rows * width * quantity * 1.1) });
}

function contrastCuffs(item: Extract<ConstructionItem, { kind: 'CONTRAST_CUFFS' }>, g: Garment, base: PatternPieceGeometry[], out: Output): PatternPieceGeometry[] {
  const fabric = `Tissu contrastant${item.color ? ` (${item.color})` : ''}`;
  if (base.some((p) => /^poignet\b/i.test(p.name))) {
    // The sleeve already has its cuff: it is cut in the contrasting cloth.
    return base.map((p) => (/^poignet\b/i.test(p.name) ? { ...p, fabricRecommendation: `${fabric} — entoilé` } : p));
  }
  const hem = sleeveHemMm(g);
  if (hem === null) {
    out.warnings.push('Poignets contrastés : pas de manche, aucun poignet ajouté.');
    return base;
  }
  // A band round the sleeve hem, cut folded (twice its finished height).
  out.added.push(piece('Poignet (contraste)', rect(hem + 20, 2 * item.heightMm), 2, `${fabric} — plié en deux, entoilé`, 10, { notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }] }));
  return base;
}

// ---------------------------------------------------------------- entry point

export interface ConstructionResult {
  pieces: PatternPieceGeometry[];
  warnings: string[];
  notions: Notion[];
}

/**
 * Adds the construction pieces asked for in `parameters.construction` to a rule's pieces (after its trims). The base
 * pieces come back as copies, with the placement lines of what is sewn on them (flounce rows, godet slits, bands,
 * pocket openings). Without construction items, the input comes back unchanged.
 */
export function applyConstruction(parameters: PatternParameters, measurements: MeasurementSet, pieces: PatternPieceGeometry[]): ConstructionResult {
  const items = parameters.construction?.items ?? [];
  if (items.length === 0) return { pieces, warnings: [], notions: [] };
  const g = readGarment(pieces);
  const out: Output = { added: [], marks: new Map(), warnings: [], notions: [] };
  // Facing-like pieces are read before anything is added: a capelet's own facing is interfaced by its recommendation.
  const facingSource = pieces;
  // Base pieces whose cloth an item changes (a cuff cut in the contrasting fabric).
  let recoloured = pieces;
  for (const item of items) {
    switch (item.kind) {
      case 'HEM_FLOUNCE':
        hemFlounce(item, g, pieces, out);
        break;
      case 'GODETS':
        godets(item, g, out);
        break;
      case 'PEPLUM':
        peplum(item, pieces, measurements, out);
        break;
      case 'JABOT':
        jabot(item, g, out);
        break;
      case 'CAPELET':
        capelet(item, measurements, out);
        break;
      case 'BOW':
        bow(item, out);
        break;
      case 'HEM_BANDS':
        hemBands(item, g, out);
        break;
      case 'ENGAGEANTES':
        engageantes(item, g, measurements, out);
        break;
      case 'BALAYEUSE':
        balayeuse(item, pieces, out);
        break;
      case 'BUSTLE':
        bustle(item, measurements, out);
        break;
      case 'WATTEAU_PLEAT':
        watteau(item, g, measurements, out);
        break;
      case 'SEAM_POCKETS':
        seamPockets(g, out);
        break;
      case 'BIAS_BINDING':
        biasBinding(item, g, measurements, out);
        break;
      case 'UNDERARM_GUSSET':
        gusset(item, out);
        break;
      case 'SASH':
        sash(item, g, out);
        break;
      case 'PUFF_SUPPORT':
        puffSupport(g, out);
        break;
      case 'APRON':
        apron(item, g, measurements, out);
        break;
      case 'LINING':
        lining(item, g, pieces, out);
        break;
      case 'INTERFACING':
        interfacing(facingSource, out);
        break;
      case 'EMBROIDERY':
        embroidery(item, g, out, flounceTopMm(items));
        break;
      case 'SMOCKING':
        smocking(item, g, measurements, out);
        break;
      case 'CONTRAST_CUFFS':
        recoloured = contrastCuffs(item, g, recoloured, out);
        break;
    }
  }
  const marked = recoloured.map((p) => {
    const lines = out.marks.get(p.name);
    return lines ? { ...p, internalLinesMm: [...(p.internalLinesMm ?? []), ...lines] } : p;
  });
  return { pieces: [...marked, ...out.added], warnings: out.warnings, notions: out.notions };
}

/** Pieces cut from another cloth than the garment's (lining, interfacing): left out of the main fabric's yardage. */
export const isSeparateFabric = (name: string): boolean => /^(doublure|entoilage) —/i.test(name);
