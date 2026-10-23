/**
 * Contracts for the deterministic pattern-construction engine.
 * Implementations (concrete rules per garment type) land in Phase 4 — see
 * docs/phases/phase-4-premium-pattern-studio.md. This file defines the
 * boundary between:
 *   - apps/ai-service (suggests PatternParameters from measurements/inspiration —
 *     never produces geometry),
 *   - this package (turns confirmed PatternParameters + measurements into exact
 *     PatternPieceGeometry, deterministically, with no AI involved),
 *   - apps/api's `pattern-engine` module (orchestrates the two and persists
 *     PatternVersion/PatternPiece rows).
 */

export type GarmentType =
  | 'ROBE'
  | 'JUPE'
  | 'PANTALON'
  | 'VESTE'
  | 'COSTUME'
  | 'CHEMISE'
  | 'ROBE_MARIEE'
  | 'AUTRE';

/** Measurement key (e.g. "TOUR_POITRINE") → value in centimeters. */
export type MeasurementSet = Record<string, number>;

/** Confirmed design choices — the input a couturière/customer has validated (spec §20-24). */
export interface PatternParameters {
  garmentType: GarmentType;
  cutType: string; // e.g. "SIRENE", "PRINCESSE"
  style: string | null;
  details: Record<string, string>; // manches, col, décolleté, longueur, etc.
  /**
   * Phase 5b S1 — extended, optional inputs. Absent (or `CONFORT`) = the historical geometry,
   * unchanged. Bounds are enforced upstream by `validatePatternExtParameters` (@angaly/types);
   * the engine never depends on that package, hence the structural copy below.
   */
  ease?: EaseLevel;
  fullness?: { skirt?: number; sleeve?: number; leg?: number };
  lengths?: { skirtPct?: number; sleevePct?: number; bodicePct?: number; legPct?: number };
  /** Phase 5b S4 — deterministic drape blocks (gathered / pleated / circle skirt, wrap front, cowl neck). */
  drape?: DrapeSpec;
  /** Garnitures: a berthe, sleeve frills (extra pieces), bead rows (notions). */
  trims?: TrimSpec;
  /**
   * How the cloth behaves (`FabricBehavior` of @angaly/types, read off the photo). A woven cloth (anything but
   * `STRETCH`, and when unknown) never gets a pattern smaller than the body: see `MIN_WEARING_EASE_MM`.
   */
  fabric?: FabricBehaviorKind;
  /**
   * Construction pieces and advanced garnitures (lining, interfacing, hem flounces, godets, peplum, jabot, capelet,
   * bustle, Watteau pleat, engageantes, balayeuse…), derived from the rule's own pieces: `shared/construction.ts`.
   */
  construction?: ConstructionSpec;
}

/** Structural copy of `ConstructionItem` (@angaly/types `pattern-construction.ts`). Lengths in mm. */
export type ConstructionMaterialKind = 'TISSU' | 'DENTELLE' | 'TULLE' | 'CONTRASTE';
export type ConstructionPartKind = 'CORSAGE' | 'JUPE' | 'MANCHES';
export type ConstructionItem =
  | { kind: 'LINING'; parts?: ConstructionPartKind[] }
  | { kind: 'INTERFACING' }
  | { kind: 'HEM_FLOUNCE'; tiers: number; depthMm: number; style: 'FRONCE' | 'CIRCULAIRE'; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'GODETS'; count: number; heightMm: number; widthMm: number }
  | { kind: 'PEPLUM'; style: 'CIRCULAIRE' | 'POINTES' | 'FRONCEE'; depthMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'JABOT'; lengthMm: number; tiers: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'CAPELET'; lengthMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'BOW'; place: 'MANCHES' | 'DOS' | 'TAILLE' | 'ENCOLURE'; widthMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'HEM_BANDS'; rows: number; widthMm: number; gapMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'ENGAGEANTES'; tiers: number; depthMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'BALAYEUSE'; depthMm: number }
  | { kind: 'BUSTLE'; style: 'COUSSIN' | 'POUF' | 'PANIERS' }
  | { kind: 'WATTEAU_PLEAT'; depthMm: number }
  | { kind: 'SEAM_POCKETS' }
  | { kind: 'BIAS_BINDING'; widthMm: number }
  | { kind: 'UNDERARM_GUSSET'; sizeMm: number }
  | { kind: 'SASH'; widthMm: number; lengthMm: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'PUFF_SUPPORT' }
  | { kind: 'APRON'; lengthMm: number; fullness: number; material?: ConstructionMaterialKind; color?: string }
  | { kind: 'EMBROIDERY'; place: 'ENCOLURE' | 'CORSAGE' | 'MANCHES' | 'OURLET'; widthMm: number; color?: string }
  | { kind: 'SMOCKING'; place: 'CORSAGE' | 'MANCHES' | 'TAILLE'; rows: number; ratio: number }
  | { kind: 'CONTRAST_CUFFS'; heightMm: number; color?: string };

export interface ConstructionSpec {
  items: ConstructionItem[];
}

/** Structural copy of `FabricBehavior` (@angaly/types): the engine depends on no package. */
export type FabricBehaviorKind = 'FLUIDE' | 'STRUCTURE' | 'RIGIDE' | 'STRETCH';

/** Skirt blocks replace the rule's own skirt panels; at most one per garment. */
export type DrapeBlock =
  | { kind: 'GATHERED_SKIRT'; fullness: number }
  | { kind: 'PLEATED_SKIRT'; pleats: number; depthMm: number; type: 'KNIFE' | 'BOX' }
  | { kind: 'CIRCLE_SKIRT'; fraction: 0.25 | 0.5 | 1 }
  | { kind: 'WRAP_FRONT'; overlapMm: number; side: 'LEFT' | 'RIGHT' }
  | { kind: 'COWL_NECK'; depthMm: number }
  // Lot 2 (S5)
  | { kind: 'TRAIN'; lengthMm: number }
  | { kind: 'OVERSKIRT'; lengthPct: number; side: 'LEFT' | 'RIGHT' }
  | { kind: 'DRAPED_BODICE'; pleats: number; side: 'LEFT' | 'RIGHT' }
  | { kind: 'ASYMMETRIC_HEM'; dropMm: number; side: 'LEFT' | 'RIGHT' };

export interface DrapeSpec {
  blocks: DrapeBlock[];
}

/** Structural copy of `Trim` (@angaly/types): garnitures sewn on the finished garment. */
export type TrimMaterialKind = 'DENTELLE' | 'TISSU' | 'TULLE';
export type TrimPlaceKind = 'ENCOLURE' | 'BERTHE' | 'MANCHES' | 'TAILLE';
export type Trim =
  | { kind: 'BERTHE'; depthMm: number; pointMm: number; material: TrimMaterialKind; color?: string }
  | { kind: 'SLEEVE_FRILL'; tiers: number; depthMm: number; material: TrimMaterialKind; color?: string }
  | { kind: 'BEADING'; place: TrimPlaceKind; beadMm: number; rows: number; color?: string };

export interface TrimSpec {
  items: Trim[];
}

/** Global ease: AJUSTE (close-fitting) < CONFORT (historical default) < AMPLE (roomy). */
export type EaseLevel = 'AJUSTE' | 'CONFORT' | 'AMPLE';

export interface GrainlineSpec {
  angleDegrees: number;
  originX: number;
  originY: number;
}

export interface NotchSpec {
  positionAlongEdge: number; // 0..1
  edgeIndex: number;
}

export interface PatternPieceGeometry {
  name: string; // e.g. "Devant", "Dos", "Manche"
  fabricRecommendation: string | null;
  quantity: number;
  /** Flat 2D outline in millimeters, closed polygon, first point repeated last. */
  outlineMm: Array<{ x: number; y: number }>;
  seamAllowanceMm: number;
  grainline: GrainlineSpec;
  notches: NotchSpec[];
  /**
   * Lines drawn inside the piece (mm, same frame as the outline): BONE = a boning channel stitched along it (corset
   * bodice), PLACEMENT = where a trim is sewn on. Absent on most pieces.
   */
  internalLinesMm?: InternalLine[];
}

export interface InternalLine {
  kind: 'BONE' | 'PLACEMENT' | 'WAIST';
  points: Array<{ x: number; y: number }>;
  /** The detail pieces this mark places on the piece (a fly's facing, a pocket, a turn-up), and where. */
  detail?: DetailArea;
  /** The points are button centres (a placement, not a line drawn on the cloth). */
  buttons?: { diameterMm: number };
}

/**
 * Where detail pieces lie on the piece that carries them (same mm frame as its outline): the 3D preview lays them on the
 * cloth there, as pieces of their own that come apart when the garment is exploded.
 */
export interface DetailArea {
  /** Names of the pieces (as generated) covering the area. */
  pieces: string[];
  /** Closed outline of the area. */
  area: Array<{ x: number; y: number }>;
  /** Sewn on the inside of the garment (facings, bags, shields), not on the outside. */
  inside?: boolean;
  /** Cut in the contrasting fabric (a gilet's points, the tabs crossed over the skirt). */
  contrast?: boolean;
  /** Stacking order of areas that overlap (0 = next to the cloth, higher = laid on top). */
  layer?: number;
  /** How the 3D draws the area: a motif (embroidery, smocking) instead of plain cloth. */
  motif?: 'BRODERIE' | 'SMOCKS';
  /** Thread or motif colour (#rrggbb). */
  color?: string;
}

/** A notion (mercerie) the garment needs besides its fabric: bead rows, bones, tape. */
export interface Notion {
  label: string;
  /** Running length (mm), for what is bought by the metre. */
  lengthMm?: number;
  /** Count, for what is bought by the piece (bones, beads). */
  quantity?: number;
}

export interface PatternGenerationResult {
  pieces: PatternPieceGeometry[];
  warnings: string[];
  metadata: {
    engineVersion: string;
    generatedAt: string; // ISO 8601
    /** Indicative fabric need (never a purchase quantity — the couturière confirms). */
    yardage?: { fabricWidthMm: number; lengthMm: number; method: string };
    /** Notions (mercerie) the rule lists: bead rows, bones, waist tape. Indicative, like the yardage. */
    notions?: Notion[];
  };
}

export class PatternEngineValidationError extends Error {
  constructor(
    message: string,
    public readonly missingMeasurementKeys: string[] = [],
  ) {
    super(message);
    this.name = 'PatternEngineValidationError';
  }
}

/** One rule = the construction logic for a single GarmentType. */
export interface IPatternRule {
  readonly garmentType: GarmentType;
  readonly requiredMeasurementKeys: string[];
  appliesTo(parameters: PatternParameters): boolean;
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[];
  /** Rule-specific, customer-facing caveats (e.g. "generic base block"). Optional. */
  warnings?(parameters: PatternParameters, measurements: MeasurementSet): string[];
  /** Notions the garment needs (computed from the same pieces). Optional. */
  notions?(parameters: PatternParameters, measurements: MeasurementSet, pieces: PatternPieceGeometry[]): Notion[];
}

export interface IPatternEngine {
  registerRule(rule: IPatternRule): void;
  generate(parameters: PatternParameters, measurements: MeasurementSet): PatternGenerationResult;
}
