import type { InternalLine, Notion, PatternPieceGeometry } from '../types';

/**
 * Construction of the bottoms (trousers, skirts): rise, waistband, closure, pleats, pockets, hem and vent. Pure
 * functions in millimetres, shared by `PantalonRule`, `JupeRule` and the suit's trousers.
 *
 * Detail groups read (`@angaly/types` PATTERN_DETAIL_OPTIONS): `taille` (rise), `ceinture`, `fermeture`, `plis`,
 * `poches`, `poches_dos`, `bas`, `fente`. Names of the extra pieces never contain « devant » / « dos » (the 3D preview
 * would take them for panels): facings, fly pieces, pocket bags and welts are sewn inside and listed only.
 */

export type BottomKind = 'PANTALON' | 'JUPE';
export type Rise = 'NATURELLE' | 'HAUTE' | 'BASSE';
export type Band = 'DROITE' | 'FORMEE' | 'ELASTIQUEE' | 'COULISSE' | 'SANS';
export type Closure = 'BRAGUETTE_ZIP' | 'BRAGUETTE_BOUTONS' | 'ZIP_COTE' | 'ZIP_INVISIBLE' | 'BOUTONS' | 'ELASTIQUE';
export type Pleats = 'AUCUN' | 'PINCES' | 'UN_PLI' | 'DEUX_PLIS';
export type FrontPockets = 'AUCUNE' | 'ITALIENNES' | 'COUTURE' | 'PLAQUEES';
export type BackPockets = 'AUCUNE' | 'PASSEPOIL' | 'PLAQUEES';
export type Hem = 'OURLET' | 'REVERS';
export type Vent = 'AUCUNE' | 'DOS' | 'COTE';

export interface BottomsSpec {
  rise: Rise;
  band: Band;
  closure: Closure;
  pleats: Pleats;
  frontPockets: FrontPockets;
  backPockets: BackPockets;
  hem: Hem;
  vent: Vent;
}

/** How far above (+) or below (−) the natural waist the top edge sits (mm). */
export const RISE_OFFSET_MM: Record<Rise, number> = { NATURELLE: 0, HAUTE: 40, BASSE: -40 };
/** Above the waist the body widens again a little (lower ribs): extra girth per mm of rise above it. */
const ABOVE_WAIST_GIRTH_PER_MM = 0.25;

/** Finished waistband heights (mm); the piece is cut double (folded) plus seam allowances. */
const BAND_HEIGHT_MM: Record<Exclude<Band, 'SANS'>, number> = { DROITE: 40, FORMEE: 50, ELASTIQUEE: 35, COULISSE: 35 };
/** Overlap at the closure (mm): the band's end that carries the button. */
const BAND_OVERLAP_MM = 40;
/** A pull-on band must pass over the hips: its length is the hip girth plus this ease (mm). */
const PULL_ON_EASE_MM = 40;
/** Elastic is cut this share of the waist (it stretches to it). */
const ELASTIC_SHARE = 0.9;
/** Shaped band: the lower edge is this much longer than the upper one (it follows the hips). */
const SHAPED_BAND_FLARE_MM = 50;
/** Facing of a band-less waist (mm deep). */
const WAIST_FACING_DEPTH_MM = 60;

/** Fly: finished width (mm) and how far below the waist it stops above the crotch (mm). */
const FLY_WIDTH_MM = 35;
const FLY_ABOVE_CROTCH_MM = 65;
/** Zip lengths sold (cm): the shortest one at least as long as the opening. */
const ZIP_LENGTHS_CM = [12, 15, 18, 20, 22, 25, 30];
/** A skirt's zip opening (mm below the top edge). */
const SKIRT_ZIP_OPENING_MM = 200;
/** Buttons down a fly or a skirt front (spacing, mm). */
const BUTTON_SPACING_MM = 45;

/** Pleat intake at the waist (mm per pleat, front piece); half of it is let out again at the hip line. */
export const PLEAT_DEPTH_MM = 35;
const PLEAT_HIP_SHARE = 0.5;
/** A dart's intake (mm) and length below the waist (mm). */
const DART_INTAKE_MM = 20;
const DART_LENGTH_MM = 110;

/** Slanted (« italienne ») pocket: opening along the side seam and across the waist (mm), bag size. */
const SLANT_POCKET_SIDE_MM = 170;
const SLANT_POCKET_WAIST_MM = 40;
const POCKET_BAG_WIDTH_MM = 170;
const POCKET_BAG_DEPTH_MM = 280;
/** In-seam pocket opening (mm) starting this far below the waist (mm). */
const SEAM_POCKET_OPENING_MM = 160;
const SEAM_POCKET_FROM_WAIST_MM = 30;
/** Patch pockets (front, back): width × depth (mm). */
const PATCH_FRONT_MM = [160, 170] as const;
const PATCH_BACK_MM = [140, 150] as const;
/** Back welt pocket: opening width (mm), welt strip height (mm), bag depth (mm). */
const WELT_WIDTH_MM = 130;
const WELT_STRIP_MM = 50;
const WELT_BAG_DEPTH_MM = 180;

/** Trouser turn-up: depth (mm) — the band is cut 2 × deep plus a facing. */
const TURN_UP_DEPTH_MM = 40;
/** Skirt vent: height above the hem (mm) and underlap (mm). A long fitted skirt gets one by default. */
const VENT_HEIGHT_MM = 180;
const VENT_UNDERLAP_MM = 40;
const VENT_NEEDED_FROM_LENGTH_MM = 550;
const VENT_NEEDED_CUTS = new Set(['AJUSTEE', 'DROITE', 'SIRENE']);

const pick = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T => {
  const v = value?.toUpperCase();
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
};

const RISES: readonly Rise[] = ['NATURELLE', 'HAUTE', 'BASSE'];
const BANDS: readonly Band[] = ['DROITE', 'FORMEE', 'ELASTIQUEE', 'COULISSE', 'SANS'];
const TROUSER_CLOSURES: readonly Closure[] = ['BRAGUETTE_ZIP', 'BRAGUETTE_BOUTONS', 'ZIP_COTE', 'ELASTIQUE'];
const SKIRT_CLOSURES: readonly Closure[] = ['ZIP_INVISIBLE', 'ZIP_COTE', 'BOUTONS', 'ELASTIQUE'];
const PLEATS: readonly Pleats[] = ['AUCUN', 'PINCES', 'UN_PLI', 'DEUX_PLIS'];
const FRONT_POCKETS: readonly FrontPockets[] = ['AUCUNE', 'ITALIENNES', 'COUTURE', 'PLAQUEES'];
const BACK_POCKETS: readonly BackPockets[] = ['AUCUNE', 'PASSEPOIL', 'PLAQUEES'];
const HEMS: readonly Hem[] = ['OURLET', 'REVERS'];
const VENTS: readonly Vent[] = ['AUCUNE', 'DOS', 'COTE'];

/**
 * The bottoms' construction from the detail choices. Defaults are what the rules drew before these groups existed:
 * trousers with a straight band, a zip fly and slanted pockets; a skirt with a straight band and an invisible zip.
 * A pull-on closure needs an elastic or drawstring band (forced); a long fitted skirt gets a back vent unless told.
 */
export function resolveBottoms(
  kind: BottomKind,
  details: Record<string, string>,
  context: { cutType?: string | null; lengthMm?: number } = {},
): BottomsSpec {
  const closure = pick(details['fermeture'], kind === 'PANTALON' ? TROUSER_CLOSURES : SKIRT_CLOSURES, kind === 'PANTALON' ? 'BRAGUETTE_ZIP' : 'ZIP_INVISIBLE');
  let band = pick(details['ceinture'], BANDS, 'DROITE');
  if (closure === 'ELASTIQUE' && band !== 'COULISSE') band = 'ELASTIQUEE';
  const cut = (context.cutType ?? '').toUpperCase();
  const longFitted = kind === 'JUPE' && VENT_NEEDED_CUTS.has(cut) && (context.lengthMm ?? 0) >= VENT_NEEDED_FROM_LENGTH_MM;
  return {
    rise: pick(details['taille'], RISES, 'NATURELLE'),
    band,
    closure: band === 'ELASTIQUEE' || band === 'COULISSE' ? 'ELASTIQUE' : closure,
    pleats: pick(details['plis'], PLEATS, 'AUCUN'),
    frontPockets: pick(details['poches'], FRONT_POCKETS, kind === 'PANTALON' ? 'ITALIENNES' : 'AUCUNE'),
    backPockets: kind === 'PANTALON' ? pick(details['poches_dos'], BACK_POCKETS, 'AUCUNE') : 'AUCUNE',
    hem: kind === 'PANTALON' ? pick(details['bas'], HEMS, 'OURLET') : 'OURLET',
    vent: kind === 'JUPE' ? pick(details['fente'], VENTS, longFitted ? 'DOS' : 'AUCUNE') : 'AUCUNE',
  };
}

/** The girth (mm) at the top edge for a rise: the waist, a little more above it, towards the hips below it. */
export function topGirthMm(rise: Rise, waistMm: number, hipMm: number, hipDepthMm: number): number {
  const offset = RISE_OFFSET_MM[rise];
  if (offset >= 0) return Math.round(waistMm + offset * ABOVE_WAIST_GIRTH_PER_MM * 4);
  const t = Math.min(1, -offset / Math.max(60, hipDepthMm));
  return Math.round(waistMm + (hipMm - waistMm) * t);
}

const rect = (w: number, h: number): Array<{ x: number; y: number }> => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
  { x: 0, y: 0 },
];

const piece = (
  name: string,
  outlineMm: Array<{ x: number; y: number }>,
  quantity: number,
  fabric: string | null,
  grainAngle = 90,
): PatternPieceGeometry => {
  const xs = outlineMm.map((p) => p.x);
  const ys = outlineMm.map((p) => p.y);
  return {
    name,
    fabricRecommendation: fabric,
    quantity,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: grainAngle, originX: (Math.min(...xs) + Math.max(...xs)) / 2, originY: (Math.min(...ys) + Math.max(...ys)) / 2 },
    notches: [],
    outlineMm,
  };
};

/**
 * The waistband (or the facing that replaces it). `topGirth` is the finished girth at the top edge (mm). The straight
 * and shaped bands keep the piece name « Ceinture » (the 3D preview draws it round the waist).
 */
export function waistbandPieces(spec: BottomsSpec, topGirth: number, hipMm: number): PatternPieceGeometry[] {
  if (spec.band === 'SANS') {
    return [piece('Parementure de taille', rect(Math.round(topGirth / 2 + 20), WAIST_FACING_DEPTH_MM), 2, 'Tissu principal + entoilage léger', 0)];
  }
  const h = BAND_HEIGHT_MM[spec.band];
  if (spec.band === 'ELASTIQUEE' || spec.band === 'COULISSE') {
    // Pulled on over the hips: as long as the hips, gathered in by the elastic or the cord.
    const length = Math.round(Math.max(topGirth, hipMm) + PULL_ON_EASE_MM);
    const band = piece('Ceinture', rect(length, 2 * h + 20), 1, 'Tissu principal', 0);
    return spec.band === 'COULISSE'
      ? [band, piece('Cordon de serrage', rect(Math.round(topGirth + 600), 30), 1, 'Tissu principal ou cordon', 0)]
      : [band];
  }
  const length = Math.round(topGirth + BAND_OVERLAP_MM + 40);
  if (spec.band === 'FORMEE') {
    // Cut on the curve: the lower edge longer than the upper one, in two halves (seam at the centre back).
    const half = Math.round(length / 2);
    const flare = SHAPED_BAND_FLARE_MM / 2;
    const outline = [
      { x: 0, y: 0 },
      { x: half, y: 12 },
      { x: half + flare, y: h + 22 },
      { x: -flare, y: h + 22 },
      { x: 0, y: 0 },
    ];
    return [piece('Ceinture', outline, 4, 'Tissu principal + entoilage thermocollant', 0)];
  }
  return [piece('Ceinture', rect(length, 2 * h + 20), 1, 'Entoilage thermocollant préconisé', 0)];
}

/** The fly pieces of trousers (zip or buttons): the facing, sewn to the left front, and the shield behind it. */
export function closurePieces(spec: BottomsSpec, crotchDepthMm: number): PatternPieceGeometry[] {
  if (spec.closure !== 'BRAGUETTE_ZIP' && spec.closure !== 'BRAGUETTE_BOUTONS') return [];
  const length = Math.max(120, crotchDepthMm - FLY_ABOVE_CROTCH_MM);
  // The facing's lower end is rounded to the J of the topstitching.
  const facing = [
    { x: 0, y: 0 },
    { x: FLY_WIDTH_MM + 10, y: 0 },
    { x: FLY_WIDTH_MM + 10, y: length - 25 },
    { x: FLY_WIDTH_MM - 5, y: length },
    { x: 0, y: length },
    { x: 0, y: 0 },
  ];
  return [
    piece('Parementure de braguette', facing, 1, 'Tissu principal'),
    piece('Sous-patte de braguette', rect(2 * FLY_WIDTH_MM + 20, length + 10), 1, 'Tissu principal + doublure'),
  ];
}

/** Front and back pockets: bags, facings, welts, patches. */
export function pocketPieces(spec: BottomsSpec): PatternPieceGeometry[] {
  const out: PatternPieceGeometry[] = [];
  switch (spec.frontPockets) {
    case 'ITALIENNES':
      // The bag (lining) and the facing (main fabric) seen in the slanted opening.
      out.push(
        piece('Fond de Poche', [
          { x: 0, y: 0 },
          { x: POCKET_BAG_WIDTH_MM - 10, y: 0 },
          { x: POCKET_BAG_WIDTH_MM, y: 150 },
          { x: POCKET_BAG_WIDTH_MM - 40, y: POCKET_BAG_DEPTH_MM - 20 },
          { x: 30, y: POCKET_BAG_DEPTH_MM - 20 },
          { x: 0, y: 180 },
          { x: 0, y: 0 },
        ], 2, 'Doublure coton ou satinette'),
        piece('Garniture de poche', [
          { x: 0, y: 0 },
          { x: SLANT_POCKET_WAIST_MM + 60, y: 0 },
          { x: SLANT_POCKET_WAIST_MM + 60, y: SLANT_POCKET_SIDE_MM + 40 },
          { x: 0, y: SLANT_POCKET_SIDE_MM + 40 },
          { x: 0, y: 0 },
        ], 2, 'Tissu principal'),
      );
      break;
    case 'COUTURE':
      out.push(piece('Fond de poche (couture de côté)', [
        { x: 0, y: SEAM_POCKET_FROM_WAIST_MM },
        { x: 0, y: SEAM_POCKET_FROM_WAIST_MM + SEAM_POCKET_OPENING_MM },
        { x: 60, y: SEAM_POCKET_FROM_WAIST_MM + SEAM_POCKET_OPENING_MM + 80 },
        { x: POCKET_BAG_WIDTH_MM, y: SEAM_POCKET_FROM_WAIST_MM + SEAM_POCKET_OPENING_MM + 40 },
        { x: POCKET_BAG_WIDTH_MM, y: SEAM_POCKET_FROM_WAIST_MM + 20 },
        { x: 0, y: SEAM_POCKET_FROM_WAIST_MM },
      ], 4, 'Doublure coton ou tissu principal'));
      break;
    case 'PLAQUEES':
      out.push(piece('Poche plaquée', rect(PATCH_FRONT_MM[0] + 20, PATCH_FRONT_MM[1] + 40), 2, 'Tissu principal'));
      break;
    default:
      break;
  }
  if (spec.backPockets === 'PASSEPOIL') {
    out.push(
      piece('Passepoil de poche arrière', rect(WELT_WIDTH_MM + 40, WELT_STRIP_MM), 2, 'Tissu principal', 0),
      piece('Fond de poche arrière', rect(WELT_WIDTH_MM + 40, 2 * WELT_BAG_DEPTH_MM), 2, 'Doublure coton ou satinette'),
    );
  } else if (spec.backPockets === 'PLAQUEES') {
    out.push(piece('Poche plaquée arrière', rect(PATCH_BACK_MM[0] + 20, PATCH_BACK_MM[1] + 40), 2, 'Tissu principal'));
  }
  return out;
}

/** A trouser turn-up, cut as a separate band round each leg's hem (`hemGirth`: the leg's hem girth, mm). */
export function hemPieces(spec: BottomsSpec, hemGirth: number): PatternPieceGeometry[] {
  if (spec.hem !== 'REVERS') return [];
  return [piece('Bande de revers de bas', rect(Math.round(hemGirth + 20), 3 * TURN_UP_DEPTH_MM + 20), 2, 'Tissu principal', 0)];
}

/** Front waist intake of the pleats (mm, front piece). Darts take nothing off the outline (marked only). */
export function pleatIntakeMm(spec: BottomsSpec): { waist: number; hip: number } {
  const n = spec.pleats === 'DEUX_PLIS' ? 2 : spec.pleats === 'UN_PLI' ? 1 : 0;
  return { waist: n * PLEAT_DEPTH_MM, hip: Math.round(n * PLEAT_DEPTH_MM * PLEAT_HIP_SHARE) };
}

/**
 * Marks inside a front / back piece: the natural waist line (WAIST, when the top edge sits above or below it), pleat
 * folds or darts from the top edge. `topY` is the top edge's y at the centre, `width` the top edge's width.
 */
export function bottomMarks(
  spec: BottomsSpec,
  side: 'front' | 'back',
  frame: { centreX: number; sideX: number; topY: number },
): InternalLine[] {
  const lines: InternalLine[] = [];
  const offset = RISE_OFFSET_MM[spec.rise];
  if (offset !== 0) {
    const y = frame.topY + offset;
    lines.push({ kind: 'WAIST', points: [{ x: frame.centreX, y }, { x: frame.sideX, y }] });
  }
  const width = frame.sideX - frame.centreX;
  const fold = (share: number, length: number): InternalLine => {
    const x = frame.centreX + width * share;
    return { kind: 'PLACEMENT', points: [{ x, y: frame.topY }, { x, y: frame.topY + length }] };
  };
  if (side === 'front' && (spec.pleats === 'UN_PLI' || spec.pleats === 'DEUX_PLIS')) {
    lines.push(fold(0.38, 90));
    if (spec.pleats === 'DEUX_PLIS') lines.push(fold(0.62, 70));
  }
  if (spec.pleats === 'PINCES' || side === 'back') {
    // Darts: the back always takes one (seat shaping); the front only when asked.
    const x = frame.centreX + width * 0.5;
    lines.push({
      kind: 'PLACEMENT',
      points: [
        { x: x - DART_INTAKE_MM / 2, y: frame.topY },
        { x, y: frame.topY + DART_LENGTH_MM },
        { x: x + DART_INTAKE_MM / 2, y: frame.topY },
      ],
    });
  }
  return lines;
}

/** Where the front / back of trousers or a skirt sits on its piece (mm): what the detail marks are placed from. */
export interface BottomFrame {
  /** Centre front (or back) and side seam at the top edge. */
  centreX: number;
  sideX: number;
  topY: number;
  /** Side seam at the hip line. */
  hipSideX: number;
  hipY: number;
  /** Hem line, the leg's crease (trousers) and the half width of the hem. */
  hemY: number;
  creaseX?: number;
  halfHemMm?: number;
  /** Bottom of the fly (trousers): where the crotch curve starts. */
  flyEndY?: number;
}

/**
 * Detail areas keep this far (mm) inside the top edge (which rises ~10 mm to the side seam) and the side seam (which runs
 * back in below the hip line, where `sideAt` keeps the hip's x).
 */
const AREA_TOP_INSET_MM = 12;
const AREA_SIDE_INSET_MM = 8;

/** A closed outline: the first point repeated at the end. */
const closeArea = (points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> => [...points, points[0]!];

/** A mark drawn once (not on both sides of a garment cut double): the fly lies on the left front only. */
export type DetailLine = InternalLine & { single?: boolean };

/**
 * Where each construction detail shows on the outside of the garment, as lines inside its front / back piece (same frame
 * as the outline): the fly's topstitching, the pockets' openings and outlines, the welts, the turn-up's fold. The
 * pattern shows them to the seamstress, the 3D preview draws them on the cloth.
 */
export function detailPlacementLines(spec: BottomsSpec, side: 'front' | 'back', f: BottomFrame): DetailLine[] {
  const lines: DetailLine[] = [];
  const at = (x: number, y: number) => ({ x: Math.round(x), y: Math.round(y) });
  const sideAt = (y: number): number => {
    // The side seam between the top edge and the hip line, straight below it.
    const t = Math.max(0, Math.min(1, (y - f.topY) / Math.max(1, f.hipY - f.topY)));
    return f.sideX + (f.hipSideX - f.sideX) * t;
  };
  const inward = f.centreX < f.sideX ? -1 : 1; // from the side seam towards the centre
  if (side === 'front') {
    if ((spec.closure === 'BRAGUETTE_ZIP' || spec.closure === 'BRAGUETTE_BOUTONS') && f.flyEndY !== undefined) {
      // The fly's J topstitching, FLY_WIDTH_MM from the centre front.
      const x = f.centreX - inward * FLY_WIDTH_MM;
      const end = f.flyEndY;
      const points = [at(x, f.topY), at(x, end - 25), at(x + inward * 10, end - 6), at(f.centreX, end)];
      lines.push({
        kind: 'PLACEMENT',
        single: true,
        points,
        // The facing and the shield lie behind the topstitched J, from the centre front out to it.
        detail: { pieces: ['Parementure de braguette', 'Sous-patte de braguette'], area: closeArea([at(f.centreX, f.topY), ...points]), inside: true },
      });
    }
    switch (spec.frontPockets) {
      case 'ITALIENNES': {
        // The bag hangs inside from the waist, between the side seam and POCKET_BAG_WIDTH_MM in from it.
        const depth = f.topY + POCKET_BAG_DEPTH_MM - 20;
        const top = f.topY + AREA_TOP_INSET_MM;
        const bag = closeArea([
          at(sideAt(top) + inward * AREA_SIDE_INSET_MM, top),
          at(f.sideX + inward * POCKET_BAG_WIDTH_MM, top),
          at(f.sideX + inward * POCKET_BAG_WIDTH_MM, depth - 60),
          at(sideAt(depth) + inward * 40, depth),
          at(sideAt(depth) + inward * AREA_SIDE_INSET_MM, depth),
        ]);
        lines.push({
          kind: 'PLACEMENT',
          points: [at(f.sideX + inward * SLANT_POCKET_WAIST_MM, f.topY), at(sideAt(f.topY + SLANT_POCKET_SIDE_MM), f.topY + SLANT_POCKET_SIDE_MM)],
          detail: { pieces: ['Fond de Poche', 'Garniture de poche'], area: bag, inside: true },
        });
        break;
      }
      case 'COUTURE': {
        const y0 = f.topY + SEAM_POCKET_FROM_WAIST_MM;
        const y1 = y0 + SEAM_POCKET_OPENING_MM;
        // The bag is sewn to the side seam along the opening and hangs inside towards the centre.
        const edge = inward * AREA_SIDE_INSET_MM;
        const bag = closeArea([
          at(sideAt(y0) + edge, y0),
          at(sideAt(y0 + 20) + inward * POCKET_BAG_WIDTH_MM, y0 + 20),
          at(sideAt(y1 + 40) + inward * POCKET_BAG_WIDTH_MM, y1 + 40),
          at(sideAt(y1 + 80) + inward * 60, y1 + 80),
          at(sideAt(y1) + edge, y1),
        ]);
        lines.push({
          kind: 'PLACEMENT',
          points: [at(sideAt(y0) + inward * 6, y0), at(sideAt(y1) + inward * 6, y1)],
          detail: { pieces: ['Fond de poche (couture de côté)'], area: bag, inside: true },
        });
        break;
      }
      case 'PLAQUEES': {
        const [w, h] = PATCH_FRONT_MM;
        const y0 = f.topY + 70;
        const x0 = sideAt(y0) + inward * 30;
        const x1 = x0 + inward * w;
        const points = [at(x0, y0), at(x1, y0), at(x1, y0 + h), at(x0, y0 + h), at(x0, y0)];
        lines.push({ kind: 'PLACEMENT', points, detail: { pieces: ['Poche plaquée'], area: points } });
        break;
      }
      default:
        break;
    }
  } else if (spec.backPockets !== 'AUCUNE') {
    // Back pockets halfway between the centre back and the side, under the waistband.
    const mid = (f.centreX + f.sideX) / 2;
    const y0 = f.topY + 75;
    if (spec.backPockets === 'PASSEPOIL') {
      const [left, right] = [mid - WELT_WIDTH_MM / 2, mid + WELT_WIDTH_MM / 2];
      const rect = (x0: number, ya: number, x1: number, yb: number) => closeArea([at(x0, ya), at(x1, ya), at(x1, yb), at(x0, yb)]);
      // The welts show between the two lines; the bag hangs inside below them.
      lines.push({ kind: 'PLACEMENT', points: [at(left, y0), at(right, y0)], detail: { pieces: ['Passepoil de poche arrière'], area: rect(left, y0, right, y0 + 10) } });
      lines.push({
        kind: 'PLACEMENT',
        points: [at(left, y0 + 10), at(right, y0 + 10)],
        detail: { pieces: ['Fond de poche arrière'], area: rect(left - 20, y0 - 10, right + 20, y0 + WELT_BAG_DEPTH_MM), inside: true },
      });
    } else {
      const [w, h] = PATCH_BACK_MM;
      const points = [at(mid - w / 2, y0 - 10), at(mid + w / 2, y0 - 10), at(mid + w / 2 - 5, y0 + h - 25), at(mid, y0 + h), at(mid - w / 2 + 5, y0 + h - 25), at(mid - w / 2, y0 - 10)];
      lines.push({ kind: 'PLACEMENT', points, detail: { pieces: ['Poche plaquée arrière'], area: points } });
    }
  }
  if (spec.hem === 'REVERS' && f.creaseX !== undefined && f.halfHemMm !== undefined) {
    // The turn-up's top fold, across the leg.
    const y = f.hemY - TURN_UP_DEPTH_MM;
    const [x0, x1] = [f.creaseX - f.halfHemMm, f.creaseX + f.halfHemMm];
    lines.push({
      kind: 'PLACEMENT',
      points: [at(x0, y), at(x1, y)],
      // The band folded up outside, from the fold down to the hem.
      detail: { pieces: ['Bande de revers de bas'], area: closeArea([at(x0, y), at(x1, y), at(x1, f.hemY), at(x0, f.hemY)]) },
    });
  }
  return lines;
}

/**
 * A skirt's back vent: an underlap on the centre-back edge from the hem up (back piece cut in two, quantity 2).
 * Returns the outline with the vent, or the same outline when there is none. Expects the back's outline to run
 * … → (x, lg) side hem → (0, lg) centre-back hem → (0, 0).
 */
export function withBackVent(outline: Array<{ x: number; y: number }>, spec: BottomsSpec, lengthMm: number): Array<{ x: number; y: number }> {
  if (spec.vent !== 'DOS') return outline;
  const i = outline.findIndex((p) => p.x === 0 && p.y === lengthMm);
  if (i < 0) return outline;
  const top = lengthMm - VENT_HEIGHT_MM;
  const vent = [
    { x: 0, y: lengthMm },
    { x: -VENT_UNDERLAP_MM, y: lengthMm },
    { x: -VENT_UNDERLAP_MM, y: top },
    { x: 0, y: top - VENT_UNDERLAP_MM },
  ];
  return [...outline.slice(0, i), ...vent, ...outline.slice(i + 1)];
}

/** Notions: zip (length rounded up to what is sold), buttons, elastic, cord. */
export function bottomNotions(kind: BottomKind, spec: BottomsSpec, topGirth: number, crotchDepthMm: number): Notion[] {
  const notions: Notion[] = [];
  const zipFor = (openingMm: number): number => ZIP_LENGTHS_CM.find((cm) => cm * 10 >= openingMm) ?? ZIP_LENGTHS_CM.at(-1)!;
  switch (spec.closure) {
    case 'BRAGUETTE_ZIP':
      notions.push({ label: `Fermeture à glissière de braguette ${zipFor(crotchDepthMm - FLY_ABOVE_CROTCH_MM - 20)} cm`, quantity: 1 });
      break;
    case 'BRAGUETTE_BOUTONS':
      notions.push({ label: 'Boutons de braguette', quantity: Math.max(3, Math.floor((crotchDepthMm - FLY_ABOVE_CROTCH_MM) / BUTTON_SPACING_MM)) });
      break;
    case 'ZIP_COTE':
      notions.push({ label: `Fermeture à glissière invisible (côté) ${zipFor(kind === 'PANTALON' ? 180 : SKIRT_ZIP_OPENING_MM)} cm`, quantity: 1 });
      break;
    case 'ZIP_INVISIBLE':
      notions.push({ label: `Fermeture à glissière invisible (milieu dos) ${zipFor(SKIRT_ZIP_OPENING_MM)} cm`, quantity: 1 });
      break;
    case 'BOUTONS':
      notions.push({ label: 'Boutons (devant)', quantity: 6 });
      break;
    default:
      break;
  }
  if (spec.band === 'DROITE' || spec.band === 'FORMEE') notions.push({ label: 'Bouton ou crochet de ceinture', quantity: 1 });
  if (spec.band === 'ELASTIQUEE') notions.push({ label: `Élastique ${BAND_HEIGHT_MM.ELASTIQUEE - 5} mm`, lengthMm: Math.round(topGirth * ELASTIC_SHARE) });
  if (spec.band === 'COULISSE') notions.push({ label: 'Œillets de cordon', quantity: 2 });
  return notions;
}
