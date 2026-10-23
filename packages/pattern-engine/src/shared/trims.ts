import type { InternalLine, MeasurementSet, Notion, PatternParameters, PatternPieceGeometry, Trim } from '../types';

/**
 * Garnitures and corset boning, applied after a rule has built its pieces (any rule whose pieces follow the bodice /
 * sleeve naming: « Corsage | Bustier Devant / Côté / Dos », « Manche… »). Pure functions, millimetres.
 *
 *  - BERTHE: a band laid along the neckline edge of the front (side panels included when the edge runs on over them,
 *    off the shoulders) and of the back, `depthMm` deep, falling to a point `pointMm` lower at the centre front;
 *  - SLEEVE_FRILL: `tiers` gathered frills round the sleeve hem;
 *  - BEADING: no piece, a notion (bead count and running length) along its place;
 *  - corsage BALEINE: boning lines inside the bodice pieces (`internalLinesMm`), the channel strips cut for them and a
 *    waist tape; the bones themselves are notions.
 */

type Pt = { x: number; y: number };
type Outline = Pt[];

/** The berthe's point reaches across this share of the front's width (a V over the bust, measured on Met 108161). */
const BERTHE_POINT_SHARE = 0.55;
/** A frill is gathered: its length is this many times the hem it is sewn round. */
export const FRILL_GATHER = 1.8;
/** Width of a boning channel strip (mm) and how far inside the edges a bone stops. */
export const BONE_CHANNEL_WIDTH_MM = 15;
const BONE_INSET_MM = 15;
/** Bone positions across a bodice piece (share of its width at mid-height): centre line, middle, near the side. */
const BONE_SHARES_CENTRE = [0.04, 0.5];
const BONE_SHARES_SIDE = [0.5];
/** Waist tape (gros-grain) overlap at the closure (mm). */
const WAIST_TAPE_OVERLAP_MM = 50;

const BODICE = /^(corsage|bustier)\b/i;
const isFront = (name: string): boolean => BODICE.test(name) && /devant/i.test(name);
const isSide = (name: string): boolean => BODICE.test(name) && /c[ôo]t[ée]/i.test(name);
const isBack = (name: string): boolean => BODICE.test(name) && /dos/i.test(name);
const isSleeve = (name: string): boolean => /^manche\b/i.test(name);
const isOffShoulder = (name: string): boolean => /hors [ée]paules/i.test(name);

const openRing = (outline: Outline): Outline => {
  const a = outline[0];
  const b = outline[outline.length - 1];
  return a && b && a.x === b.x && a.y === b.y ? outline.slice(0, -1) : [...outline];
};

export const polylineLength = (pts: Outline): number =>
  pts.reduce((sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - pts[i - 1]!.x, p.y - pts[i - 1]!.y)), 0);

/**
 * The neckline edge of a bodice piece, from its centre-line point (outline[0], x = 0) along the top: the run of points
 * whose x keeps growing. On a shouldered neckline it stops at the shoulder-neck point (the highest of the run); off the
 * shoulders (`whole`) the run is the whole edge, out to the armhole.
 */
export function necklineEdge(outline: Outline, whole: boolean): Outline {
  const ring = openRing(outline);
  const run: Outline = [];
  for (const p of ring) {
    if (run.length > 0 && p.x <= run[run.length - 1]!.x) break;
    run.push({ ...p });
  }
  if (whole || run.length < 2) return run;
  let top = 0;
  run.forEach((p, i) => {
    if (p.y <= run[top]!.y) top = i;
  });
  return run.slice(0, top + 1);
}

/**
 * A berthe band below an edge (centre line first, x growing): it hangs `depthMm` straight down from the edge (lace
 * falls, it is not a facing), `pointMm` deeper at the centre line, the extra fading out linearly over
 * BERTHE_POINT_SHARE of the edge's width (a V). The edge's x only grows, so the band never crosses itself. Closed
 * outline: top edge, then the bottom back.
 */
export function bertheBand(edge: Outline, depthMm: number, pointMm: number): Outline {
  const x0 = edge[0]!.x;
  const width = Math.max(1, edge[edge.length - 1]!.x - x0);
  const top = edge.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  const bottom = top.map((p) => ({ x: p.x, y: Math.round(p.y + depthMm + pointMm * Math.max(0, 1 - (p.x - x0) / (width * BERTHE_POINT_SHARE))) }));
  return [...top, ...bottom.reverse(), { ...top[0]! }];
}

/** Width (mm) of a piece at its lowest row (a sleeve's hem). */
const hemWidth = (outline: Outline): number => {
  const ring = openRing(outline);
  const maxY = Math.max(...ring.map((p) => p.y));
  const y = maxY - 1;
  const xs: number[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
  }
  if (xs.length < 2) return Math.max(...ring.filter((p) => p.y === maxY).map((p) => p.x)) - Math.min(...ring.filter((p) => p.y === maxY).map((p) => p.x));
  return Math.max(...xs) - Math.min(...xs);
};

/** Topmost and bottommost crossing of a vertical line x with an outline, or null when the line misses it. */
const verticalSpan = (outline: Outline, x: number): [number, number] | null => {
  const ring = openRing(outline);
  const ys: number[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) ys.push(a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y));
  }
  return ys.length >= 2 ? [Math.min(...ys), Math.max(...ys)] : null;
};

/** Boning lines of a bodice piece: vertical, at shares of its width, stopping BONE_INSET_MM inside its edges. */
export function boneLines(outline: Outline, shares: number[]): InternalLine[] {
  const ring = openRing(outline);
  const minX = Math.min(...ring.map((p) => p.x));
  const maxX = Math.max(...ring.map((p) => p.x));
  const lines: InternalLine[] = [];
  for (const share of shares) {
    const x = Math.round(minX + (maxX - minX) * share);
    const span = verticalSpan(ring, x + 0.5);
    if (!span || span[1] - span[0] < 4 * BONE_INSET_MM) continue;
    lines.push({ kind: 'BONE', points: [{ x, y: Math.round(span[0] + BONE_INSET_MM) }, { x, y: Math.round(span[1] - BONE_INSET_MM) }] });
  }
  return lines;
}

/** How many times a line on this piece is cut: a piece on the fold mirrors it (except on the fold itself). */
const copiesOf = (piece: PatternPieceGeometry, x: number): number => (piece.quantity === 1 ? (x <= 5 ? 1 : 2) : piece.quantity);

const rect = (w: number, h: number): Outline => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
  { x: 0, y: 0 },
];

const materialName: Record<string, string> = { DENTELLE: 'dentelle', TISSU: 'même tissu', TULLE: 'tulle' };
const materialFabric: Record<string, string> = {
  DENTELLE: 'Dentelle (Calais, Chantilly) — festons vers le bas',
  TISSU: 'Même tissu que la robe',
  TULLE: 'Tulle de soie',
};

const find = <T extends Trim['kind']>(parameters: PatternParameters, kind: T): Extract<Trim, { kind: T }> | undefined =>
  parameters.trims?.items.find((t): t is Extract<Trim, { kind: T }> => t.kind === kind);

/** The front neckline edge across the front (and its side panel when the edge runs on over it, off the shoulders). */
const frontEdgeOf = (pieces: PatternPieceGeometry[]): Outline | null => {
  const front = pieces.find((p) => isFront(p.name));
  if (!front) return null;
  const off = isOffShoulder(front.name);
  const edge = necklineEdge(front.outlineMm, off);
  const side = pieces.find((p) => isSide(p.name));
  if (off && side && edge.length > 0) {
    const end = edge[edge.length - 1]!;
    const run = necklineEdge(side.outlineMm, true);
    for (const p of run.slice(1)) edge.push({ x: end.x + p.x, y: p.y });
  }
  return edge.length >= 2 ? edge : null;
};

const backEdgeOf = (pieces: PatternPieceGeometry[]): Outline | null => {
  const back = pieces.find((p) => isBack(p.name));
  if (!back) return null;
  const edge = necklineEdge(back.outlineMm, isOffShoulder(back.name));
  return edge.length >= 2 ? edge : null;
};

/** Total hem (mm) of one sleeve: the sum of its pieces' hems (a two-piece sleeve). */
const sleeveHemOf = (pieces: PatternPieceGeometry[]): number | null => {
  const sleeves = pieces.filter((p) => isSleeve(p.name));
  return sleeves.length > 0 ? sleeves.reduce((sum, p) => sum + hemWidth(p.outlineMm), 0) : null;
};

/**
 * Adds the trim pieces (berthe, sleeve frills) and the corset's boning to a rule's pieces. Returns a new list; the
 * pieces it changes (boning lines) are copies. Without trims nor `corsage = BALEINE`, the input comes back unchanged.
 */
export function applyTrimsAndBoning(parameters: PatternParameters, pieces: PatternPieceGeometry[]): PatternPieceGeometry[] {
  let out = pieces;
  if (parameters.details['corsage']?.toUpperCase() === 'BALEINE') {
    out = out.map((p) =>
      BODICE.test(p.name)
        ? { ...p, internalLinesMm: [...(p.internalLinesMm ?? []), ...boneLines(p.outlineMm, isSide(p.name) ? BONE_SHARES_SIDE : BONE_SHARES_CENTRE)] }
        : p,
    );
    const bones = out.flatMap((p) => (p.internalLinesMm ?? []).filter((l) => l.kind === 'BONE'));
    if (bones.length > 0) {
      const longest = Math.max(...bones.map((l) => polylineLength(l.points)));
      const count = out.reduce(
        (n, p) => n + (p.internalLinesMm ?? []).filter((l) => l.kind === 'BONE').reduce((k, l) => k + copiesOf(p, l.points[0]!.x), 0),
        0,
      );
      out = [
        ...out,
        {
          name: 'Coulisse de baleine',
          fabricRecommendation: 'Coutil ou ruban de coulisse 15 mm (cousu sur l’envers, le long des lignes de baleines)',
          quantity: count,
          seamAllowanceMm: 0,
          grainline: { angleDegrees: 90, originX: BONE_CHANNEL_WIDTH_MM / 2, originY: Math.round((longest + 20) / 2) },
          notches: [],
          outlineMm: rect(BONE_CHANNEL_WIDTH_MM * 2, Math.round(longest + 20)),
        },
      ];
    }
  }

  const berthe = find(parameters, 'BERTHE');
  if (berthe) {
    const front = frontEdgeOf(out);
    const back = backEdgeOf(out);
    const label = materialName[berthe.material] ?? 'dentelle';
    const piece = (name: string, outline: Outline): PatternPieceGeometry => ({
      name: `${name} (${label})`,
      fabricRecommendation: materialFabric[berthe.material] ?? null,
      quantity: 1, // coupée au pli du milieu
      seamAllowanceMm: berthe.material === 'DENTELLE' ? 0 : 10,
      grainline: { angleDegrees: 0, originX: Math.round(Math.max(...outline.map((p) => p.x)) / 2), originY: Math.round((outline[0]!.y + berthe.depthMm / 2)) },
      notches: [{ positionAlongEdge: 0, edgeIndex: 0 }],
      outlineMm: outline,
    });
    if (front) out = [...out, piece('Berthe Devant', bertheBand(front, berthe.depthMm, berthe.pointMm))];
    if (back) out = [...out, piece('Berthe Dos', bertheBand(back, berthe.depthMm, 0))];
  }

  const frill = find(parameters, 'SLEEVE_FRILL');
  const hem = sleeveHemOf(out);
  if (frill && hem !== null) {
    const label = materialName[frill.material] ?? 'dentelle';
    const length = Math.round(hem * FRILL_GATHER);
    for (let k = 1; k <= frill.tiers; k += 1) {
      out = [
        ...out,
        {
          name: `Volant de manche ${k}/${frill.tiers} (${label})`,
          fabricRecommendation: materialFabric[frill.material] ?? null,
          quantity: 2,
          seamAllowanceMm: frill.material === 'DENTELLE' ? 0 : 10,
          grainline: { angleDegrees: 0, originX: Math.round(length / 2), originY: Math.round(frill.depthMm / 2) },
          // Quarter marks: gather evenly between them round the sleeve.
          notches: [0.25, 0.5, 0.75].map((positionAlongEdge) => ({ positionAlongEdge, edgeIndex: 0 })),
          outlineMm: rect(length, frill.depthMm),
        },
      ];
    }
  }
  return out;
}

const beadPlaceLabel: Record<string, string> = {
  ENCOLURE: 'bord du décolleté',
  BERTHE: 'pointe de la berthe',
  MANCHES: 'bas des manches',
  TAILLE: 'couture de taille',
};

/** Length (mm) of the edge a bead row follows, round the whole garment (both halves, both sleeves). */
const beadRunMm = (place: string, pieces: PatternPieceGeometry[], measurements: MeasurementSet): number => {
  switch (place) {
    case 'ENCOLURE': {
      const front = frontEdgeOf(pieces);
      const back = backEdgeOf(pieces);
      return 2 * ((front ? polylineLength(front) : 0) + (back ? polylineLength(back) : 0));
    }
    case 'BERTHE': {
      const band = pieces.find((p) => /^berthe devant/i.test(p.name));
      if (!band) return 0;
      // The bottom edge: the second half of the band's outline.
      const ring = openRing(band.outlineMm);
      return 2 * polylineLength(ring.slice(Math.floor(ring.length / 2)));
    }
    case 'MANCHES':
      return 2 * (sleeveHemOf(pieces) ?? 0);
    default:
      return ((measurements['TOUR_TAILLE'] ?? 70) * 10) + 40;
  }
};

/**
 * Notions (mercerie): bead rows (count and running length), bones (count and longest), waist tape. Indicative, like the
 * yardage; the couturière confirms.
 */
export function trimNotions(parameters: PatternParameters, measurements: MeasurementSet, pieces: PatternPieceGeometry[]): Notion[] {
  const notions: Notion[] = [];
  for (const t of parameters.trims?.items ?? []) {
    if (t.kind !== 'BEADING') continue;
    const run = Math.round(beadRunMm(t.place, pieces, measurements) * t.rows);
    if (run <= 0) continue;
    notions.push({
      label: `Perles ${t.beadMm} mm — ${beadPlaceLabel[t.place] ?? t.place}${t.rows > 1 ? ` (${t.rows} rangs)` : ''}`,
      lengthMm: run,
      quantity: Math.ceil(run / t.beadMm),
    });
  }
  const bonePieces = pieces.filter((p) => (p.internalLinesMm ?? []).some((l) => l.kind === 'BONE'));
  if (bonePieces.length > 0) {
    const lines = bonePieces.flatMap((p) => (p.internalLinesMm ?? []).filter((l) => l.kind === 'BONE').map((l) => ({ p, l })));
    const count = lines.reduce((n, { p, l }) => n + copiesOf(p, l.points[0]!.x), 0);
    const total = lines.reduce((n, { p, l }) => n + copiesOf(p, l.points[0]!.x) * polylineLength(l.points), 0);
    notions.push({ label: 'Baleines spirale 7 mm (avec embouts)', quantity: count, lengthMm: Math.round(total) });
    // A waist stay cut as a piece (« Ceinture intérieure ») already is that tape.
    if (!pieces.some((p) => p.name.startsWith('Ceinture intérieure'))) notions.push({
      label: 'Ruban de taille gros-grain 25 mm (intérieur)',
      lengthMm: Math.round((measurements['TOUR_TAILLE'] ?? 70) * 10 + WAIST_TAPE_OVERLAP_MM),
      quantity: 1,
    });
  }
  return notions;
}
