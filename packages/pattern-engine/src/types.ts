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
}

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
}

export interface IPatternEngine {
  registerRule(rule: IPatternRule): void;
  generate(parameters: PatternParameters, measurements: MeasurementSet): PatternGenerationResult;
}
