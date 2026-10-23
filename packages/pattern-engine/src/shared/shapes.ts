import type { PatternPieceGeometry } from '../types';
import type { NecklineShape, SleeveSpec } from './cut-profile';
import { collarLengthMm, fitSleeveDims } from './fit';

type Outline = PatternPieceGeometry['outlineMm'];

/** Points down a bell skirt's side seam, as shares of its length (dense near the waist, where it curves most). */
const BELL_SHARES = [0.03, 0.08, 0.15, 0.24, 0.36, 0.5, 0.67, 0.84];

/** Skirt panel: straight, A-line/flared, bell, or fishtail (narrow to the knee, flaring below). */
export function skirtOutline(
  waistWidth: number,
  hipWidth: number,
  hemWidth: number,
  length: number,
  fishtail: boolean,
  /** Depth of the hip line below the top edge (a skirt starting below the waist reaches it sooner). */
  hipDepthMm?: number,
  /**
   * Bell (1890s gored skirt): the side seam flares from the waist and less and less on the way down,
   * x = waist + (hem − waist) · t^bell (t: share of the length; bell < 1). Undefined: the straight A.
   */
  bell?: number,
): Outline {
  const hipDepth = hipDepthMm ?? Math.min(200, length / 2);
  // A flared skirt is an A from the waist: its side seam runs straight from the waist to the hem, so the hip
  // point never sits inside that line (else the skirt hugs the hips and only flares below them — a mermaid).
  const aLine = fishtail ? hipWidth : Math.round(waistWidth + ((hemWidth - waistWidth) * (hipDepth - 10)) / Math.max(1, length - 10));
  if (!fishtail && bell !== undefined && bell > 0 && bell < 1) {
    const side = BELL_SHARES.map((t) => {
      const y = Math.round(10 + t * (length - 10));
      const x = waistWidth + (hemWidth - waistWidth) * t ** bell;
      // Never inside the hip line once past it (a narrow hem on wide hips keeps the hips covered).
      return { x: Math.round(y >= hipDepth ? Math.max(hipWidth, x) : x), y };
    });
    return [{ x: 0, y: 0 }, { x: waistWidth, y: 10 }, ...side, { x: hemWidth, y: length }, { x: 0, y: length }, { x: 0, y: 0 }];
  }
  const points = [
    { x: 0, y: 0 },
    { x: waistWidth, y: 10 },
    { x: Math.max(hipWidth, aLine), y: hipDepth },
  ];
  if (fishtail) {
    points.push({ x: hipWidth * 0.9, y: length * 0.55 });
  }
  points.push({ x: hemWidth, y: length }, { x: 0, y: length }, { x: 0, y: 0 });
  return points;
}

/** Where the gigot sleeve's elbow sits, as a share of its length below the cap. */
const GIGOT_ELBOW_RATIO = 0.45;
/** Where the puff is fullest (share of the length below the cap) and how much of the top width it keeps there. */
const GIGOT_BELLY_RATIO = 0.28;
const GIGOT_BELLY_WIDTH = 0.96;
/** At the elbow the puff is gathered in, but never below this share of the top width (a leg-of-mutton, not a cone). */
const GIGOT_ELBOW_MIN_SHARE = 0.6;
/**
 * …nor above a fitted elbow (this × the standard sleeve's width): a very full gigot (1890s) still closes on the
 * arm at the elbow, the volume is all above it, and the forearm is fitted down to the wrist.
 */
const GIGOT_ELBOW_FIT = 1.15;
/** Below the belly the puff rounds in towards the elbow: a point this far down, keeping this share of the excess. */
const GIGOT_ROUND_RATIO = 0.37;
const GIGOT_ROUND_KEEP = 0.6;
/** A sleeve whose top is this much wider than the standard one gets the gigot cut. */
const GIGOT_TOP_RATIO = 1.2;
/** Segments per side of the sleeve cap curve. */
export const SLEEVE_CAP_SEGMENTS = 8;
/** The cap crown sits a little towards the back (left), as on a drafted set-in sleeve. */
const CAP_APEX_RATIO = 0.46;

/**
 * Sleeve cap: from the underarm point (0, capHeight) over the crown (apex, 0) back down to
 * (topWidth, capHeight). Steep at the underarm, round over the shoulder — an S-shaped curve like a
 * drafted set-in sleeve, never the straight "roof" of a triangle. Ends included.
 */
function sleeveCap(topWidthMm: number, capHeightMm: number): Outline {
  const points: Outline = [];
  const n = SLEEVE_CAP_SEGMENTS;
  for (let i = 0; i <= n * 2; i += 1) {
    // Back side: u 0 → apex, front side: apex → 1; v is 0 at the underarm, 1 at the crown.
    const back = i <= n;
    const u = back ? CAP_APEX_RATIO * (i / n) : CAP_APEX_RATIO + (1 - CAP_APEX_RATIO) * ((i - n) / n);
    const v = back ? i / n : 1 - (i - n) / n;
    const smooth = v * v * (3 - 2 * v);
    const rise = 0.55 * Math.sin((v * Math.PI) / 2) + 0.45 * smooth;
    points.push({ x: i === n * 2 ? topWidthMm : Math.round(topWidthMm * u * 10) / 10, y: Math.round(capHeightMm * (1 - rise)) });
  }
  return points;
}

/** Flat sleeve: curved cap, then a trapezoid down to the cuff. `topWidthMm` is the full circumference. */
export function sleeveOutline(
  topWidthMm: number,
  cuffWidthMm: number,
  capHeightMm: number,
  lengthMm: number,
  /** Gigot (leg-of-mutton): width of the sleeve at the elbow, 45 % down; the forearm below it is fitted. */
  elbowWidthMm?: number,
): Outline {
  const inset = (topWidthMm - cuffWidthMm) / 2;
  const cap = sleeveCap(topWidthMm, capHeightMm);
  if (elbowWidthMm !== undefined && elbowWidthMm < topWidthMm && elbowWidthMm > cuffWidthMm) {
    const elbowInset = (topWidthMm - elbowWidthMm) / 2;
    const elbowY = capHeightMm + Math.round(lengthMm * GIGOT_ELBOW_RATIO);
    const bellyInset = (topWidthMm * (1 - GIGOT_BELLY_WIDTH)) / 2;
    const bellyY = capHeightMm + Math.round(lengthMm * GIGOT_BELLY_RATIO);
    const roundY = capHeightMm + Math.round(lengthMm * GIGOT_ROUND_RATIO);
    const roundInset = bellyInset + (elbowInset - bellyInset) * (1 - GIGOT_ROUND_KEEP);
    return [
      ...cap,
      { x: topWidthMm - bellyInset, y: bellyY },
      { x: topWidthMm - roundInset, y: roundY },
      { x: topWidthMm - elbowInset, y: elbowY },
      { x: topWidthMm - inset, y: capHeightMm + lengthMm },
      { x: inset, y: capHeightMm + lengthMm },
      { x: elbowInset, y: elbowY },
      { x: roundInset, y: roundY },
      { x: bellyInset, y: bellyY },
      { x: 0, y: capHeightMm },
    ];
  }
  return [
    ...cap,
    { x: topWidthMm - inset, y: capHeightMm + lengthMm },
    { x: inset, y: capHeightMm + lengthMm },
    { x: 0, y: capHeightMm },
  ];
}

/** Points of a quadratic curve a → c (control b), both ends included. */
function curveTo(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, steps: number): Outline {
  const out: Outline = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    out.push({
      x: Math.round(((1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t ** 2 * c.x) * 10) / 10,
      y: Math.round((1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t ** 2 * c.y),
    });
  }
  return out;
}

/** Share of a bishop sleeve's length where the fullness is gathered into the cuff band. */
const BISHOP_GATHER_RATIO = 0.8;

/**
 * Bishop: full from the armhole to just above the wrist, then drawn in to the cuff band. The width above
 * the gather is what the 3D drape shows as the blouson at the wrist.
 */
function bishopOutline(top: number, cuff: number, capHeight: number, length: number): Outline {
  const wrist = capHeight + length;
  const gatherY = capHeight + Math.round(length * BISHOP_GATHER_RATIO);
  const body = top * 0.96;
  const inset = (top - body) / 2;
  const cuffInset = (top - cuff) / 2;
  return [
    ...sleeveCap(top, capHeight),
    { x: top - inset, y: gatherY },
    { x: top - cuffInset, y: wrist },
    { x: cuffInset, y: wrist },
    { x: inset, y: gatherY },
    { x: 0, y: capHeight },
  ];
}

/** Bell: fitted down to the elbow, then flaring out to the hem (`cuff` is the hem width, wider than the top). */
function bellOutline(top: number, hem: number, capHeight: number, length: number): Outline {
  const elbowY = capHeight + Math.round(length * 0.4);
  const elbowWidth = top * 0.82;
  const elbowInset = (top - elbowWidth) / 2;
  const hemInset = (top - hem) / 2; // negative: the hem is wider than the top
  const wrist = capHeight + length;
  const flank = (side: 1 | -1): Outline =>
    curveTo(
      { x: side === 1 ? top - elbowInset : elbowInset, y: elbowY },
      { x: side === 1 ? top - elbowInset : elbowInset, y: elbowY + (wrist - elbowY) * 0.55 },
      { x: side === 1 ? top - hemInset : hemInset, y: wrist },
      4,
    );
  return [...sleeveCap(top, capHeight), ...flank(1), ...flank(-1).reverse(), { x: 0, y: capHeight }];
}

/** Lantern: gathered into the armhole and into a cuff band, billowing in between (widest at 45 %). */
function lanternOutline(top: number, cuff: number, capHeight: number, length: number): Outline {
  const wrist = capHeight + length;
  const bellyY = capHeight + Math.round(length * 0.45);
  const belly = top * 1.9;
  const bellyInset = (top - belly) / 2; // negative: wider than the head
  const cuffInset = (top - cuff) / 2;
  return [
    ...sleeveCap(top, capHeight),
    { x: top - bellyInset, y: bellyY },
    { x: top - cuffInset, y: wrist },
    { x: cuffInset, y: wrist },
    { x: bellyInset, y: bellyY },
    { x: 0, y: capHeight },
  ];
}

/** Height (mm) the raglan's top edge rises above the underarm line: it reaches up to the neck. */
const RAGLAN_RISE_MM = 70;

/**
 * Raglan: no round cap — the top is a short edge at the neck, and two seams run diagonally down to the
 * underarm. `capHeight` is the vertical distance from that edge to the underarm.
 */
function raglanOutline(top: number, cuff: number, capHeight: number, length: number): Outline {
  const rise = capHeight + RAGLAN_RISE_MM;
  const cuffInset = (top - cuff) / 2;
  const back = curveTo({ x: 0, y: rise }, { x: top * 0.04, y: rise * 0.3 }, { x: top * 0.36, y: 0 }, 6);
  const front = curveTo({ x: top * 0.64, y: 0 }, { x: top * 0.96, y: rise * 0.3 }, { x: top, y: rise }, 6);
  return [
    ...back,
    ...front,
    { x: top - cuffInset, y: rise + length },
    { x: cuffInset, y: rise + length },
    { x: 0, y: rise },
  ];
}

/** Height (mm) of the kimono's shoulder slope: the sleeve continues the shoulder line instead of rounding over it. */
const KIMONO_SHOULDER_MM = 60;

/** Kimono: cut in one with the body — wide, a gentle shoulder slope instead of a cap, tapering to the cuff. */
function kimonoOutline(top: number, cuff: number, length: number): Outline {
  return sleeveOutline(top, cuff, KIMONO_SHOULDER_MM, length);
}

export function sleevePiece(
  name: string,
  tourPoitrineMm: number,
  sleeve: SleeveSpec,
  fabricRecommendation: string | null = null,
  seamAllowanceMm = 10,
  measurements: Record<string, number> = {},
): PatternPieceGeometry {
  const dims = fitSleeveDims(
    {
      topMm: (tourPoitrineMm / 3.2) * sleeve.topRatio,
      cuffMm: (tourPoitrineMm / 3.2) * sleeve.cuffRatio,
      capMm: 150,
    },
    measurements,
  );
  const kind = sleeve.kind ?? 'SET_IN';
  // A kimono sleeve has no cap; a raglan's "cap" is the diagonal seam; a bell's top is the plain set-in width.
  const capHeight = kind === 'KIMONO' ? KIMONO_SHOULDER_MM : dims.capMm;
  const top = dims.topMm;
  const cuff = dims.cuffMm;
  const outline = ((): Outline => {
    switch (kind) {
      case 'BISHOP':
        return bishopOutline(top, cuff, capHeight, sleeve.lengthMm);
      case 'BELL':
        return bellOutline(top, cuff, capHeight, sleeve.lengthMm);
      case 'LANTERN':
        return lanternOutline(top, cuff, capHeight, sleeve.lengthMm);
      case 'RAGLAN':
        return raglanOutline(top, cuff, capHeight, sleeve.lengthMm);
      case 'KIMONO':
        return kimonoOutline(top, cuff, sleeve.lengthMm);
      default:
        // Puffed sleeve = gigot: the volume stays on the upper arm, the forearm to the wrist is fitted.
        return sleeveOutline(
          top,
          cuff,
          capHeight,
          sleeve.lengthMm,
          sleeve.topRatio >= GIGOT_TOP_RATIO && sleeve.lengthMm >= 300
            ? Math.min(top * 0.85, Math.max(cuff * 1.25, Math.min(top * GIGOT_ELBOW_MIN_SHARE, (tourPoitrineMm / 3.2) * GIGOT_ELBOW_FIT)))
            : undefined,
        );
    }
  })();
  return {
    name,
    fabricRecommendation,
    quantity: 2,
    seamAllowanceMm,
    grainline: { angleDegrees: 90, originX: top / 2, originY: (capHeight + sleeve.lengthMm) / 2 },
    notches:
      kind === 'KIMONO' || kind === 'RAGLAN'
        ? [{ positionAlongEdge: 0.5, edgeIndex: 0 }]
        : [{ positionAlongEdge: 0, edgeIndex: SLEEVE_CAP_SEGMENTS }],
    outlineMm: outline,
  };
}

/**
 * Pointed waist (`taille = POINTE`): how far below the waist the front bodice falls to its point at the centre front
 * (mm). Measured on Met 108161 (≈ 6–7 cm below the waist at the sides, between the princess seams).
 */
export const WAIST_POINT_DROP_MM = 70;
/** The point's edges curve in a little (Victorian point): the middle of the edge lies this share of the drop down. */
const WAIST_POINT_MID_SHARE = 0.42;

/** Index of a front piece's bottom centre point: x = 0, the lowest one. -1 when there is none. */
const bottomCentreIdx = (ring: Outline): number => {
  let idx = -1;
  ring.forEach((p, i) => {
    if (p.x === 0 && (idx < 0 || p.y > ring[idx]!.y)) idx = i;
  });
  return idx;
};

/**
 * Pointed waist on a front bodice piece: its bottom centre point (x = 0) drops `dropMm` lower and the waist edge from
 * the side runs down to it in a slightly incurved V. Returns a new outline (input untouched).
 */
export function pointWaist(outline: Outline, dropMm: number): Outline {
  const ring = openRing(outline);
  const idx = bottomCentreIdx(ring);
  const prev = ring[(idx - 1 + ring.length) % ring.length];
  if (idx < 0 || !prev || prev.x <= 0 || dropMm <= 0) return outline.map((p) => ({ ...p }));
  const tip = { x: 0, y: ring[idx]!.y + dropMm };
  const mid = { x: Math.round(prev.x * 0.5), y: Math.round(prev.y + (tip.y - prev.y) * 0.5 + dropMm * (WAIST_POINT_MID_SHARE - 0.5)) };
  const out = [...ring.slice(0, idx), mid, tip, ...ring.slice(idx + 1)];
  return close(out);
}

/**
 * Depth (mm) of a pointed waist below the waist line at a share `u` of its half-width from the centre front (0 = the
 * tip, 1 = where it meets the waist line), as `pointWaist` draws it: straight from the tip to its mid point, then on.
 */
export function waistPointDepthAt(u: number, dropMm: number): number {
  const t = Math.min(1, Math.max(0, u));
  const mid = dropMm * WAIST_POINT_MID_SHARE;
  return t <= 0.5 ? dropMm + (mid - dropMm) * (t / 0.5) : mid * (1 - (t - 0.5) / 0.5);
}

/**
 * The front skirt under a pointed waist: its top edge dips to the same point at the centre front (the skirt is sewn
 * along the bodice's point). The skirt outline starts at its top centre point (0, 0). Returns a new outline.
 */
export function pointSkirtTop(outline: Outline, dropMm: number): Outline {
  const ring = openRing(outline);
  const first = ring[0];
  const next = ring[1];
  if (!first || !next || first.x !== 0 || next.x <= 0 || dropMm <= 0) return outline.map((p) => ({ ...p }));
  const tip = { x: 0, y: first.y + dropMm };
  const mid = { x: Math.round(next.x * 0.5), y: Math.round(next.y + (tip.y - next.y) * 0.5 + dropMm * (WAIST_POINT_MID_SHARE - 0.5)) };
  return close([tip, mid, ...ring.slice(1).map((p) => ({ ...p }))]);
}

/** Points per neckline curve (the straight neck segment of a block is replaced by them). */
export const NECK_CURVE_SEGMENTS = 8;

/**
 * Replaces the straight neckline segment of a bodice outline — first point (centre line, `depthMm`
 * below the shoulder-neck point) to second point (shoulder-neck point) — by a quarter ellipse: square
 * to the centre line at the centre, rising steeply to the shoulder, as a drafted neckline is. A
 * neckline shallower than 5 mm stays straight. Returns a new outline; the input is never mutated.
 */
export function curveNeckline(outline: Outline, shape: NecklineShape = 'ROUND'): Outline {
  const centre = outline[0];
  const neck = outline[1];
  if (!centre || !neck || centre.x !== 0 || centre.y - neck.y < 5 || neck.x <= 0) return outline.map((p) => ({ ...p }));
  // A V runs straight from the centre to the shoulder; a square neckline goes across, then straight up.
  if (shape === 'V') return outline.map((p) => ({ ...p }));
  if (shape === 'SQUARE') return [{ ...centre }, { x: neck.x, y: centre.y }, ...outline.slice(1).map((p) => ({ ...p }))];
  if (shape === 'SWEETHEART') return sweetheartNeckline(outline);
  const depth = centre.y - neck.y;
  const curve: Outline = [];
  for (let i = 1; i < NECK_CURVE_SEGMENTS; i += 1) {
    const theta = (Math.PI / 2) * (i / NECK_CURVE_SEGMENTS);
    curve.push({ x: Math.round(neck.x * Math.sin(theta)), y: Math.round(neck.y + depth * Math.cos(theta)) });
  }
  return [{ ...centre }, ...curve, ...outline.slice(1).map((p) => ({ ...p }))];
}

/** Apex of a sweetheart lobe: this share of the edge's width out from the centre, this share of its drop above the notch. */
const SWEETHEART_APEX_X = 0.55;
const SWEETHEART_APEX_RISE = 0.5;
/** Points along the lobe (notch → apex) and along the strap edge (apex → top). */
const SWEETHEART_LOBE_SEGMENTS = 6;
const SWEETHEART_STRAP_SEGMENTS = 4;
/** Points a sweetheart neckline adds between the notch and the top of the edge. */
export const SWEETHEART_POINTS = SWEETHEART_LOBE_SEGMENTS + SWEETHEART_STRAP_SEGMENTS - 1;

/**
 * Replaces the straight top segment of a front outline — first point (centre notch) to second point (top of the
 * edge, at the neck point or the strap) — by a sweetheart: the edge leaves the notch straight up (the two halves
 * meet in a point), rounds over the bust to a level apex, then climbs to the top as the strap's inner edge. Its
 * lobe stands above the straight line (a V), its strap side below it. Returns a new outline; the input is never mutated.
 */
export function sweetheartNeckline(outline: Outline): Outline {
  const centre = outline[0];
  const top = outline[1];
  if (!centre || !top || centre.x !== 0 || centre.y - top.y < 5 || top.x <= 0) return outline.map((p) => ({ ...p }));
  const apex = { x: top.x * SWEETHEART_APEX_X, y: centre.y - (centre.y - top.y) * SWEETHEART_APEX_RISE };
  const edge: Outline = [];
  for (let i = 1; i <= SWEETHEART_LOBE_SEGMENTS; i += 1) {
    const a = (Math.PI / 2) * (i / SWEETHEART_LOBE_SEGMENTS);
    edge.push({ x: Math.round(apex.x * (1 - Math.cos(a))), y: Math.round(centre.y - (centre.y - apex.y) * Math.sin(a)) });
  }
  for (let i = 1; i < SWEETHEART_STRAP_SEGMENTS; i += 1) {
    const a = (Math.PI / 2) * (i / SWEETHEART_STRAP_SEGMENTS);
    edge.push({
      x: Math.round(apex.x + (top.x - apex.x) * Math.sin(a)),
      y: Math.round(apex.y - (apex.y - top.y) * (1 - Math.cos(a))),
    });
  }
  return [{ ...centre }, ...edge, ...outline.slice(1).map((p) => ({ ...p }))];
}

type Pt = { x: number; y: number };

/** Part of a closed outline on one side of the horizontal line `y` (Sutherland–Hodgman), open ring. */
function clipBelowOrAbove(ring: Pt[], y: number, keepAbove: boolean): Pt[] {
  const inside = (p: Pt): boolean => (keepAbove ? p.y <= y : p.y >= y);
  const out: Pt[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if (inside(a)) out.push({ ...a });
    if (inside(a) !== inside(b)) {
      const t = (y - a.y) / (b.y - a.y);
      out.push({ x: Math.round(a.x + (b.x - a.x) * t), y });
    }
  }
  return out;
}

const openRing = (outline: Outline): Pt[] => {
  const first = outline[0]!;
  const last = outline[outline.length - 1]!;
  return first.x === last.x && first.y === last.y ? outline.slice(0, -1) : [...outline];
};

const close = (ring: Pt[]): Outline => [...ring, { ...ring[0]! }];

/** Points along an off-the-shoulder edge, from the centre line to the armhole. */
export const OFF_SHOULDER_EDGE_SEGMENTS = 8;
/** The edge meets the armhole at least this far above the underarm (mm): the sleeve still needs a cap to set into. */
const OFF_SHOULDER_MIN_ARMHOLE_MM = 60;
/** Appended to the name of a bodice piece or sleeve cut off the shoulders: the 3D seats it on the arms, not the shoulders. */
export const OFF_SHOULDER_SUFFIX = ' (hors épaules)';

/**
 * Off-the-shoulder (bardot) top edge. The outline starts with the centre-line point, the shoulder-neck point
 * (`outline[1]`, the shoulder line) and runs over the shoulder to the armhole tip (`outline[tipIdx]`, the shoulder
 * point). All of that is replaced by one edge: square to the centre line `depthMm` below the shoulder line, then
 * curving gently down to the armhole `armDropMm` below the shoulder point — on the upper arm, no shoulder seam left.
 * The armhole keeps at least OFF_SHOULDER_MIN_ARMHOLE_MM above the underarm. Returns a new outline (input untouched).
 */
export function offShoulderNeckline(outline: Outline, tipIdx: number, depthMm: number, armDropMm: number): Outline {
  const neck = outline[1];
  const tip = outline[tipIdx];
  const underarm = outline[tipIdx + 1];
  if (!neck || !tip || !underarm || outline[0]?.x !== 0 || tip.x <= 0) return outline.map((p) => ({ ...p }));
  const centre = { x: 0, y: Math.round(neck.y + depthMm) };
  const end = { x: tip.x, y: Math.round(Math.min(tip.y + armDropMm, underarm.y - OFF_SHOULDER_MIN_ARMHOLE_MM)) };
  const edge: Outline = [];
  for (let i = 1; i < OFF_SHOULDER_EDGE_SEGMENTS; i += 1) {
    const t = i / OFF_SHOULDER_EDGE_SEGMENTS;
    edge.push({ x: Math.round(end.x * t), y: Math.round(centre.y + (end.y - centre.y) * t * t) });
  }
  const rest = outline.slice(tipIdx + 1, -1).map((p) => ({ ...p }));
  return [centre, ...edge, end, ...rest, { ...centre }];
}

/**
 * Names the bodice pieces and sleeves of an off-the-shoulder garment (OFF_SHOULDER_SUFFIX) and cuts its sleeves'
 * caps under the edge (`offShoulderSleeve`). Call it last: rules find their pieces by name while building them.
 */
export function markOffShoulder(pieces: PatternPieceGeometry[], armDropMm: number): PatternPieceGeometry[] {
  const bodice = /corsage|bustier/i;
  return pieces.map((p) => {
    if (/^manche/i.test(p.name)) {
      return { ...p, name: p.name + OFF_SHOULDER_SUFFIX, notches: [], outlineMm: offShoulderSleeve(p.outlineMm, armDropMm) };
    }
    return bodice.test(p.name) ? { ...p, name: p.name + OFF_SHOULDER_SUFFIX } : p;
  });
}

/**
 * A sleeve set under an off-the-shoulder edge: its cap is cut off straight `armDropMm` below its crown (the armhole is
 * shorter by as much), so its top edge carries on the bodice's edge round the arm. Returns a new outline.
 */
export function offShoulderSleeve(outline: Outline, armDropMm: number): Outline {
  const ring = openRing(outline);
  const top = Math.min(...ring.map((p) => p.y));
  const cut = clipBelowOrAbove(ring, top + armDropMm, false);
  return cut.length >= 3 ? close(cut) : outline.map((p) => ({ ...p }));
}


/** Points per gathered lower edge (the curve that holds the gathers' extra length). */
export const GATHER_EDGE_SEGMENTS = 12;
/** Deepest dip of a gathered lower edge over the bust (mm). */
const GATHER_DIP_MM = 40;

export interface UnderbustSplit {
  /** Upper front, cut at the under-bust seam; its lower edge is `fullness` times the seam's length. */
  upper: Outline;
  /** Midriff band from the under-bust seam to the waist, starting at y = 0. */
  band: Outline;
  /** Height of the seam in the bodice's frame (mm), seam length on the half front, and the upper's edge. */
  seamYMm: number;
  seamMm: number;
  gatheredEdgeMm: number;
}

/**
 * Under-bust gathers (« fronces sous la poitrine ») on a front bodice cut on the fold (centre front at
 * x = 0): the bodice is cut at `seamYMm` and the part below becomes the midriff band. The upper part's
 * lower edge is lengthened to `fullness` times the seam it is gathered onto: it dips over the bust (a
 * curve square to the centre front, at most 4 cm deep) and widens at the side seam, which is redrawn
 * straight from the underarm. The centre front stays a straight fold line. Null when the line misses.
 */
export function splitUnderbust(outline: Outline, seamYMm: number, fullness: number): UnderbustSplit | null {
  const ring = openRing(outline);
  const upperRing = clipBelowOrAbove(ring, seamYMm, true);
  const bandRing = clipBelowOrAbove(ring, seamYMm, false);
  if (upperRing.length < 3 || bandRing.length < 3) return null;
  const seamX = Math.max(...upperRing.filter((p) => p.y === seamYMm).map((p) => p.x));
  if (!(seamX > 0)) return null;
  const depth = Math.min(GATHER_DIP_MM, seamX * 0.3);
  const edgeLength = (width: number): number => {
    let total = 0;
    let px = 0;
    let py = depth;
    for (let i = 1; i <= 200; i += 1) {
      const x = (width * i) / 200;
      const y = depth * Math.cos((Math.PI * x) / (2 * width));
      total += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return total;
  };
  let lo = seamX;
  let hi = seamX * fullness;
  for (let it = 0; it < 50; it += 1) {
    const mid = (lo + hi) / 2;
    if (edgeLength(mid) < fullness * seamX) lo = mid;
    else hi = mid;
  }
  const width = Math.round((lo + hi) / 2);
  // `rest` runs from the centre-front neck point round to the underarm; the new edge closes it back.
  const rest = upperRing.filter((p) => p.y !== seamYMm);
  const edge: Pt[] = [];
  for (let i = GATHER_EDGE_SEGMENTS; i >= 0; i -= 1) {
    const x = (width * i) / GATHER_EDGE_SEGMENTS;
    edge.push({ x: Math.round(x), y: Math.round(seamYMm + depth * Math.cos((Math.PI * x) / (2 * width))) });
  }
  const upper = close([...rest, ...edge]);
  const band = close(bandRing.map((p) => ({ x: p.x, y: p.y - seamYMm })));
  return { upper, band, seamYMm, seamMm: seamX, gatheredEdgeMm: Math.round(edgeLength(width)) };
}

/**
 * Crossover (« cache-cœur ») gathered front: the upper front of an under-bust split, cut as a pair instead
 * of on the fold, runs on past the centre front by `overlapMm` at the seam, so each side crosses over the
 * other. Its centre edge becomes a straight diagonal from the centre-front neck point down to the seam
 * on the other side; the gathered lower edge runs on to it. Returns a new outline.
 */
export function crossOverFront(upper: Outline, seamYMm: number, overlapMm: number): Outline {
  const ring = openRing(upper);
  // The ring starts at the centre-front neck point and ends at the centre-front bottom of the gathered edge.
  const last = ring[ring.length - 1]!;
  if (ring[0]!.x !== 0 || last.x !== 0 || overlapMm <= 0) return upper.map((p) => ({ ...p }));
  const across = { x: -Math.round(overlapMm), y: Math.round(seamYMm + (last.y - seamYMm) * 0.5) };
  return close([...ring.map((p) => ({ ...p })), across]);
}

/** Height (mm) of a stand collar band, and of a shirt collar with its stand. */
const COLLAR_BAND_MM = 45;
const COLLAR_SHIRT_MM = 70;
/** A shawl collar's run from the back of the neck to the end of its lapel, as a share of the back length. */
const SHAWL_RUN_RATIO = 1.55;

/**
 * The collar piece a dress takes from the `col` detail, or null when the detail asks for none (the neckline
 * itself is then the finish). Band lengths follow `TOUR_COU`; a shawl runs from the nape round the neck and
 * down the chest; a lavallière is a long strip tied in a bow.
 */
export function collarPiece(
  col: string | undefined,
  measurements: Record<string, number> = {},
  fabricRecommendation: string | null = null,
): PatternPieceGeometry | null {
  const choice = (col ?? '').toUpperCase();
  const neck = collarLengthMm(choice === 'OFFICIER' ? 380 : 400, measurements);
  const base = { fabricRecommendation, quantity: 2, seamAllowanceMm: 10, notches: [] };
  const strip = (length: number, height: number, tipHeight: number): Outline => [
    { x: 0, y: 0 },
    { x: length, y: 0 },
    { x: length - 10, y: tipHeight },
    { x: 10, y: height },
    { x: 0, y: 0 },
  ];
  switch (choice) {
    case 'OFFICIER':
      return {
        ...base,
        name: 'Col officier',
        grainline: { angleDegrees: 0, originX: neck / 2, originY: COLLAR_BAND_MM / 2 },
        outlineMm: strip(neck, COLLAR_BAND_MM, COLLAR_BAND_MM),
      };
    case 'CHEMISIER':
      return {
        ...base,
        name: 'Col chemise & pied de col',
        grainline: { angleDegrees: 0, originX: neck / 2, originY: COLLAR_SHIRT_MM / 2 },
        outlineMm: strip(neck, COLLAR_SHIRT_MM, COLLAR_SHIRT_MM - 10),
      };
    case 'LAVALLIERE':
      return {
        ...base,
        quantity: 1,
        name: 'Col lavallière',
        grainline: { angleDegrees: 0, originX: 700, originY: 60 },
        outlineMm: strip(1400, 120, 120),
      };
    case 'CHALE': {
      const run = Math.round(((measurements['LONGUEUR_DOS'] ?? 42) * 10 * SHAWL_RUN_RATIO) / 10) * 10 + neck / 2;
      // Narrow at the nape, widest across the chest, rounded at the lapel's end: the outer edge is a curve.
      const outer: Outline = [];
      for (let i = 0; i <= 10; i += 1) {
        const t = i / 10;
        outer.push({ x: Math.round(run * t), y: Math.round(60 + 70 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7) });
      }
      return {
        ...base,
        name: 'Col châle',
        fabricRecommendation: fabricRecommendation ?? 'Entoilage conseillé',
        grainline: { angleDegrees: 0, originX: run / 2, originY: 40 },
        outlineMm: [{ x: 0, y: 0 }, { x: run, y: 0 }, ...outer.slice().reverse(), { x: 0, y: 0 }],
      };
    }
    default:
      return null;
  }
}

/**
 * Coat-dress front (robe-manteau): the centre-front edge moves off the fold to `halfOpeningAt(y)` — the two
 * fronts part from the neck to the hem over a plastron. The straight centre segments are resampled so the edge
 * follows the opening's curve, and no point of the piece stays inside the opening. `y` is the piece's own.
 */
export function openCentreFront(outline: Outline, halfOpeningAt: (y: number) => number, steps = 10): Outline {
  const out: Outline = [];
  const open = (p: { x: number; y: number }) => ({ x: Math.max(p.x, Math.round(halfOpeningAt(p.y))), y: p.y });
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i]!;
    const b = outline[i + 1];
    out.push(open(a));
    if (b && a.x === 0 && b.x === 0 && Math.abs(b.y - a.y) > 1) {
      for (let k = 1; k < steps; k += 1) out.push(open({ x: 0, y: Math.round(a.y + ((b.y - a.y) * k) / steps) }));
    }
  }
  return out;
}

/** Plastron behind a coat-dress opening: the opening plus an underlap on each side, cut on the fold. */
export function plastronPiece(
  topYMm: number,
  bottomYMm: number,
  halfOpeningAt: (y: number) => number,
  underlapMm = 30,
): PatternPieceGeometry {
  const steps = 12;
  const half = (y: number): number => Math.round(halfOpeningAt(y) + underlapMm);
  const edge: Outline = [];
  for (let k = 0; k <= steps; k += 1) {
    const y = topYMm + ((bottomYMm - topYMm) * k) / steps;
    edge.push({ x: half(y), y: Math.round(y - topYMm) });
  }
  const length = Math.round(bottomYMm - topYMm);
  return {
    name: 'Plastron (sous-robe)',
    fabricRecommendation: 'Tissu contrastant',
    quantity: 1,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: half(topYMm) / 2, originY: length / 2 },
    notches: [],
    outlineMm: [{ x: 0, y: 0 }, ...edge, { x: 0, y: length }, { x: 0, y: 0 }],
  };
}

/** Cordelière: the cord tied over a coat-dress (a bias tube, cut as a long strip). */
export function cordPiece(lengthMm = 1000): PatternPieceGeometry {
  return {
    name: 'Cordelière',
    fabricRecommendation: 'Biais roulotté',
    quantity: 1,
    seamAllowanceMm: 5,
    grainline: { angleDegrees: 45, originX: lengthMm / 2, originY: 15 },
    notches: [],
    outlineMm: [{ x: 0, y: 0 }, { x: lengthMm, y: 0 }, { x: lengthMm, y: 30 }, { x: 0, y: 30 }, { x: 0, y: 0 }],
  };
}

/** Finished height of a cuff (mm); the piece is cut twice as high and folded. */
export const CUFF_HEIGHT_MM = 35;

/**
 * Cuff (« Poignet ») of a sleeve gathered or fitted at the wrist: a band as long as the sleeve's lower edge
 * (+ 20 mm of overlap for the button), folded in half lengthwise.
 */
export function cuffPiece(sleeve: PatternPieceGeometry, heightMm = CUFF_HEIGHT_MM): PatternPieceGeometry {
  const bottom = Math.max(...sleeve.outlineMm.map((p) => p.y));
  const hem = sleeve.outlineMm.filter((p) => bottom - p.y < 1).map((p) => p.x);
  const length = Math.round(Math.max(...hem) - Math.min(...hem)) + 20;
  const cut = 2 * heightMm;
  return {
    name: 'Poignet',
    fabricRecommendation: 'Entoilage conseillé',
    quantity: 2,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 0, originX: length / 2, originY: heightMm },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    outlineMm: [{ x: 0, y: 0 }, { x: length, y: 0 }, { x: length, y: cut }, { x: 0, y: cut }, { x: 0, y: 0 }],
  };
}

/** Finished width of a tied belt (mm), and the bow's loops and tails. */
export const BELT_HEIGHT_MM = 45;
const BOW_LOOP_MM = 95;
const BOW_HEIGHT_MM = 60;
const BOW_TAIL_MM = 230;

/**
 * Tied belt (`fermeture = CEINTURE_NOUEE`): the belt round the waist (+ 60 mm overlap), the bow's loops (one
 * strip folded into two loops), its knot and two tails cut on the slant at the end. Every strip is folded
 * lengthwise, so it is cut twice its finished height.
 */
export function beltPieces(waistMm: number): PatternPieceGeometry[] {
  const rect = (length: number, height: number): Outline => [
    { x: 0, y: 0 },
    { x: length, y: 0 },
    { x: length, y: height },
    { x: 0, y: height },
    { x: 0, y: 0 },
  ];
  const belt = Math.round(waistMm + 60);
  const loops = 4 * BOW_LOOP_MM + 20;
  const tail = BOW_TAIL_MM;
  return [
    {
      name: 'Ceinture',
      fabricRecommendation: 'Entoilage conseillé',
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 0, originX: belt / 2, originY: BELT_HEIGHT_MM },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
      outlineMm: rect(belt, 2 * BELT_HEIGHT_MM),
    },
    {
      name: 'Nœud (boucles)',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 0, originX: loops / 2, originY: BOW_HEIGHT_MM },
      notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
      outlineMm: rect(loops, 2 * BOW_HEIGHT_MM),
    },
    {
      name: 'Nœud (milieu)',
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 0, originX: 50, originY: 25 },
      notches: [],
      outlineMm: rect(100, 50),
    },
    {
      name: 'Pans du nœud',
      fabricRecommendation: null,
      quantity: 2,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: BOW_HEIGHT_MM, originY: tail / 2 },
      notches: [],
      // Folded lengthwise; the free end is cut on the slant.
      outlineMm: [
        { x: 0, y: 0 },
        { x: 2 * BOW_HEIGHT_MM, y: 0 },
        { x: 2 * BOW_HEIGHT_MM, y: tail },
        { x: 0, y: tail - 50 },
        { x: 0, y: 0 },
      ],
    },
  ];
}

const insidePolygon = (ring: Pt[], p: Pt): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

/**
 * Facing (« Parementure ») along part of a piece's edge — the run of outline points from index `from` to
 * index `to` (forward, wrapping round the closed outline): the edge itself, then the same edge moved
 * `widthMm` into the piece (mitred at the corners) — or a width that varies along the run (`t` 0 → 1 from its
 * first point to its last, a revers). `extendMm` carries the run on that far along the next edge
 * (a neck facing goes a little way along the shoulder seam). Returns null when the run is shorter than 2 points.
 */
export function facingPiece(
  name: string,
  outline: Outline,
  from: number,
  to: number,
  width: number | ((t: number) => number),
  quantity: number,
  extendMm = 0,
): PatternPieceGeometry | null {
  const widthAt = typeof width === 'number' ? () => width : width;
  const widthMm = typeof width === 'number' ? width : Math.min(...[0, 0.25, 0.5, 0.75, 1].map(width));
  const ring = openRing(outline);
  const n = ring.length;
  const edge: Pt[] = [];
  for (let k = from; ; k = (k + 1) % n) {
    const p = ring[k]!;
    const last = edge[edge.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) edge.push({ ...p });
    if (k === to || edge.length > n) break;
  }
  const end = ring[to];
  const next = ring[(to + 1) % n];
  if (extendMm > 0 && end && next) {
    const len = Math.hypot(next.x - end.x, next.y - end.y);
    const t = Math.min(1, extendMm / Math.max(1, len));
    if (len > 0.5) edge.push({ x: end.x + (next.x - end.x) * t, y: end.y + (next.y - end.y) * t });
  }
  // Points closer together than half the width would fold the offset edge over itself: thin them out.
  const spaced: Pt[] = [];
  for (const [i, p] of edge.entries()) {
    const last = spaced[spaced.length - 1];
    const isEnd = i === edge.length - 1;
    if (!last || isEnd || Math.hypot(p.x - last.x, p.y - last.y) >= widthMm / 2) spaced.push(p);
    if (isEnd && spaced.length > 2) {
      const prev = spaced[spaced.length - 2]!;
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < widthMm / 2) spaced.splice(spaced.length - 2, 1);
    }
  }
  edge.splice(0, edge.length, ...spaced);
  if (edge.length < 2) return null;
  const normalOf = (a: Pt, b: Pt): Pt => {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  };
  // Which side of the run is the piece: test a small step from the middle of its longest segment.
  let longest = 0;
  for (let i = 1; i < edge.length - 1; i += 1) {
    const d = Math.hypot(edge[i + 1]!.x - edge[i]!.x, edge[i + 1]!.y - edge[i]!.y);
    if (d > Math.hypot(edge[longest + 1]!.x - edge[longest]!.x, edge[longest + 1]!.y - edge[longest]!.y)) longest = i;
  }
  const a = edge[longest]!;
  const b = edge[longest + 1]!;
  const nm = normalOf(a, b);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const sign = insidePolygon(ring, { x: mid.x + nm.x * 3, y: mid.y + nm.y * 3 }) ? 1 : -1;
  const runs = edge.map((p, i) => (i === 0 ? 0 : Math.hypot(p.x - edge[i - 1]!.x, p.y - edge[i - 1]!.y)));
  for (let i = 1; i < runs.length; i += 1) runs[i] = runs[i]! + runs[i - 1]!;
  const runLength = runs[runs.length - 1]! || 1;
  const inner: Pt[] = edge.map((p, i) => {
    const before = i > 0 ? normalOf(edge[i - 1]!, p) : null;
    const after = i < edge.length - 1 ? normalOf(p, edge[i + 1]!) : null;
    const sum = { x: (before?.x ?? 0) + (after?.x ?? 0), y: (before?.y ?? 0) + (after?.y ?? 0) };
    const len = Math.hypot(sum.x, sum.y) || 1;
    const dir = { x: sum.x / len, y: sum.y / len };
    // Mitre: as far along the bisector as keeps the width on both sides (capped at sharp corners).
    const cos = before && after ? Math.max(0.5, dir.x * before.x + dir.y * before.y) : 1;
    const d = (sign * widthAt(runs[i]! / runLength)) / cos;
    return { x: Math.round(p.x + dir.x * d), y: Math.round(p.y + dir.y * d) };
  });
  // Near a corner the offset edge runs back on itself (its points pass the corner's mitre): drop those points.
  const keep = inner.map(() => true);
  for (let changed = true; changed; ) {
    changed = false;
    const idx = keep.flatMap((k, i) => (k ? [i] : []));
    for (let k = 0; k < idx.length - 1; k += 1) {
      const i = idx[k]!;
      const j = idx[k + 1]!;
      const along = (inner[j]!.x - inner[i]!.x) * (edge[j]!.x - edge[i]!.x) + (inner[j]!.y - inner[i]!.y) * (edge[j]!.y - edge[i]!.y);
      if (along < 0 && idx.length > 2) {
        keep[k === 0 ? j : i] = false;
        changed = true;
        break;
      }
    }
  }
  const innerKept = inner.filter((_, i) => keep[i]);
  const outlineMm = close([...edge.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })), ...innerKept.reverse()]);
  const xs = outlineMm.map((p) => p.x);
  const ys = outlineMm.map((p) => p.y);
  return {
    name,
    fabricRecommendation: 'Même tissu, entoilé',
    quantity,
    seamAllowanceMm: 10,
    grainline: {
      angleDegrees: 90,
      originX: Math.round((Math.min(...xs) + Math.max(...xs)) / 2),
      originY: Math.round((Math.min(...ys) + Math.max(...ys)) / 2),
    },
    notches: [],
    outlineMm,
  };
}
