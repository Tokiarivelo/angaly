import {
  GarmentType,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
  PatternGenerationResult,
  PatternEngineValidationError,
} from '@angaly/pattern-engine';

export type {
  GarmentType,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
  PatternGenerationResult,
};
export { PatternEngineValidationError };

export interface IPatternGenerationPort {
  generatePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): Promise<PatternGenerationResult>;
}
