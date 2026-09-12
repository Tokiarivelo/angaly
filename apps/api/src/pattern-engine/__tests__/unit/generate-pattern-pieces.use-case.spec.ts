import { Test, TestingModule } from '@nestjs/testing';
import { GeneratePatternPiecesUseCase } from '../../application/use-cases/generate-pattern-pieces.use-case';
import { PatternEngineProvider } from '../../infrastructure/providers/pattern-engine.provider';
import { PatternEngineValidationError } from '@angaly/pattern-engine';
import type { PatternParameters } from '@angaly/pattern-engine';

describe('GeneratePatternPiecesUseCase', () => {
  let useCase: GeneratePatternPiecesUseCase;
  let provider: PatternEngineProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratePatternPiecesUseCase, PatternEngineProvider],
    }).compile();

    useCase = module.get<GeneratePatternPiecesUseCase>(GeneratePatternPiecesUseCase);
    provider = module.get<PatternEngineProvider>(PatternEngineProvider);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw PatternEngineValidationError if rule requires measurements not provided', async () => {
    // Initialise avec JupeRule
    provider.onModuleInit();

    const params: PatternParameters = {
      garmentType: 'JUPE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };

    // Missing 'TOUR_BASSIN', 'LONGUEUR_DOS'
    const measurements = { TOUR_TAILLE: 70 };

    await expect(useCase.execute(params, measurements)).rejects.toThrow(PatternEngineValidationError);
  });
});
