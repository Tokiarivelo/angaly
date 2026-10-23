export { PatternEngine } from './pattern-engine';
export type {
  DrapeBlock,
  DrapeSpec,
  EaseLevel,
  GarmentType,
  GrainlineSpec,
  InternalLine,
  DetailArea,
  IPatternEngine,
  IPatternRule,
  MeasurementSet,
  NotchSpec,
  Notion,
  PatternGenerationResult,
  PatternParameters,
  PatternPieceGeometry,
  Trim,
  TrimSpec,
  ConstructionItem,
  ConstructionSpec,
  ConstructionMaterialKind,
  ConstructionPartKind,
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
export { applyTrimsAndBoning, trimNotions } from './shared/trims';
export { applyConstruction, hemSweepMm, isSeparateFabric, skirtGirthAboveHem } from './shared/construction';
export type { ConstructionResult } from './shared/construction';
export { CATALOG_MEASUREMENTS, DRESS_CATALOG, catalogGroupOf } from './catalog/dress-catalog';
export type { DressCase } from './catalog/dress-catalog';

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
