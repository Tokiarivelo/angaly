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
  fullness?: { skirt?: number; sleeve?: number };
  lengths?: { skirtPct?: number; sleevePct?: number; bodicePct?: number };
  /** Phase 5b S4 — deterministic drape blocks (gathered / pleated / circle skirt, wrap front, cowl neck). */
  drape?: DrapeSpec;
}

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
}

export interface PatternGenerationResult {
  pieces: PatternPieceGeometry[];
  warnings: string[];
  metadata: {
    engineVersion: string;
    generatedAt: string; // ISO 8601
    /** Indicative fabric need (never a purchase quantity — the couturière confirms). */
    yardage?: { fabricWidthMm: number; lengthMm: number; method: string };
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
}

export interface IPatternEngine {
  registerRule(rule: IPatternRule): void;
  generate(parameters: PatternParameters, measurements: MeasurementSet): PatternGenerationResult;
}
