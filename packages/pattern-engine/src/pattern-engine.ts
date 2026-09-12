import {
  type GarmentType,
  type IPatternEngine,
  type IPatternRule,
  type MeasurementSet,
  type PatternGenerationResult,
  type PatternParameters,
  PatternEngineValidationError,
} from './types';

const ENGINE_VERSION = '0.1.0-foundation';

/**
 * Deterministic orchestrator: picks the registered rule matching the requested
 * garment type, validates the measurement set against it, then delegates the
 * actual geometry construction to that rule. No AI involved (see types.ts doc).
 */
export class PatternEngine implements IPatternEngine {
  private readonly rulesByGarmentType = new Map<GarmentType, IPatternRule>();

  registerRule(rule: IPatternRule): void {
    this.rulesByGarmentType.set(rule.garmentType, rule);
  }

  generate(parameters: PatternParameters, measurements: MeasurementSet): PatternGenerationResult {
    let rule = this.rulesByGarmentType.get(parameters.garmentType);
    if (!rule || !rule.appliesTo(parameters)) {
      for (const candidate of this.rulesByGarmentType.values()) {
        if (candidate.appliesTo(parameters)) {
          rule = candidate;
          break;
        }
      }
    }
    if (!rule || !rule.appliesTo(parameters)) {
      throw new PatternEngineValidationError(
        `No pattern rule registered for garment type "${parameters.garmentType}"`,
      );
    }

    const missingMeasurementKeys = rule.requiredMeasurementKeys.filter(
      (key) => measurements[key] === undefined,
    );
    if (missingMeasurementKeys.length > 0) {
      throw new PatternEngineValidationError(
        `Missing required measurements for "${parameters.garmentType}": ${missingMeasurementKeys.join(', ')}`,
        missingMeasurementKeys,
      );
    }

    const pieces = rule.computePieces(parameters, measurements);

    return {
      pieces,
      warnings: [],
      metadata: {
        engineVersion: ENGINE_VERSION,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
