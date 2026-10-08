export { PatternEngine } from './pattern-engine';
export type {
  DrapeBlock,
  DrapeSpec,
  EaseLevel,
  GarmentType,
  GrainlineSpec,
  IPatternEngine,
  IPatternRule,
  MeasurementSet,
  NotchSpec,
  PatternGenerationResult,
  PatternParameters,
  PatternPieceGeometry,
} from './types';
export { PatternEngineValidationError } from './types';
export { JupeRule } from './rules/jupe.rule';
export { RobeRule } from './rules/robe.rule';
export { PantalonRule } from './rules/pantalon.rule';
export { VesteRule } from './rules/veste.rule';
export { ChemiseRule } from './rules/chemise.rule';
export { CostumeRule } from './rules/costume.rule';
export { RobeMarieeRule } from './rules/robe-mariee.rule';
export { AutreRule } from './rules/autre.rule';

export {
  comparePatterns,
  contourIoU,
  createDefaultEngine,
  evaluateFidelityCase,
  normalizedHausdorff,
  summarizeFidelity,
} from './eval/fidelity';
export type {
  FidelityCase,
  FidelityResult,
  FidelitySummary,
  PatternComparison,
  PieceFidelity,
} from './eval/fidelity';
