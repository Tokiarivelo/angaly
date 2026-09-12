import { Injectable } from '@nestjs/common';
import type {
  PatternParameters,
  MeasurementSet,
  PatternGenerationResult,
} from '../../domain/ports/pattern-generation.port';
import { PatternEngineProvider } from '../../infrastructure/providers/pattern-engine.provider';
import { PatternEngineValidationError } from '@angaly/pattern-engine';

@Injectable()
export class GeneratePatternPiecesUseCase {
  constructor(
    private readonly patternEngineProvider: PatternEngineProvider,
  ) {}

  async execute(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): Promise<PatternGenerationResult> {
    const engine = this.patternEngineProvider.getEngine();
    
    try {
      // Le moteur de pattern-engine lève PatternEngineValidationError s'il manque des mesures
      // ou si la règle pour ce GarmentType n'est pas trouvée (si bien implémenté dans le package).
      return engine.generate(parameters, measurements);
    } catch (error) {
      if (error instanceof PatternEngineValidationError) {
        throw error;
      }
      throw new Error(`Failed to generate pattern pieces: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
