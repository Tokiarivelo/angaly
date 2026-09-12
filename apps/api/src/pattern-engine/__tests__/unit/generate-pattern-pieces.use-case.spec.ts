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

  it('should generate pieces for PANTALON when measurements are provided', async () => {
    provider.onModuleInit();

    const params: PatternParameters = {
      garmentType: 'PANTALON',
      cutType: 'DROITE',
      style: null,
      details: {},
    };

    const measurements = { TOUR_TAILLE: 72, TOUR_BASSIN: 96, LONGUEUR_JAMBE: 100 };

    const result = await useCase.execute(params, measurements);
    expect(result.pieces.length).toBeGreaterThan(0);
    expect(result.pieces.some((p) => p.name === 'Devant Pantalon')).toBe(true);
    expect(result.pieces.some((p) => p.name === 'Dos Pantalon')).toBe(true);
  });
});

