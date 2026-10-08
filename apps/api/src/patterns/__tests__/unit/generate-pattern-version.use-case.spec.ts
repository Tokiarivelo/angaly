import { GeneratePatternVersionUseCase } from '../../application/use-cases/generate-pattern-version.use-case';
import type { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import type { IPatternVersionRepository } from '../../domain/repositories/pattern-version.repository';
import type { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import type { GetMeasurementProfileUseCase } from '../../../measurements/application/use-cases/get-measurement-profile.use-case';
import type { EstimateMissingMeasurementsUseCase } from '../../../ai-inference/application/use-cases/estimate-missing-measurements.use-case';
import { InspirationParametersService } from '../../application/services/inspiration-parameters.service';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';

describe('GeneratePatternVersionUseCase', () => {
  let useCase: GeneratePatternVersionUseCase;
  let mockProjectRepo: jest.Mocked<IPatternProjectRepository>;
  let mockVersionRepo: jest.Mocked<IPatternVersionRepository>;
  let mockGeneratePiecesUseCase: jest.Mocked<GeneratePatternPiecesUseCase>;
  let mockGetMeasurementProfileUseCase: jest.Mocked<GetMeasurementProfileUseCase>;
  let mockEstimateMissingMeasurementsUseCase: jest.Mocked<EstimateMissingMeasurementsUseCase>;
  let mockProviderResolver: { resolveSelected: jest.Mock };
  let mockRecordLearning: { recordGenerated: jest.Mock };
  let mockSuggest: { execute: jest.Mock };

  const mockProject = PatternProjectEntity.create({
    id: 'proj-1',
    projectRef: 'ANG-PAT-2026-00001',
    customerId: 'cust-1',
    measurementProfileId: null,
    garmentType: 'ROBE',
    occasion: 'Mariage',
    style: 'Sirène',
    cutType: 'SIRENE',
    detailsJson: null,
    inspirationMediaId: null,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockProjectRepo = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockProject),
      findByRef: jest.fn(),
      find: jest.fn(),
      update: jest.fn().mockResolvedValue(mockProject),
      count: jest.fn(),
    };

    mockVersionRepo = {
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve(
          PatternVersionEntity.create({
            id: data.id,
            projectId: data.projectId,
            versionNumber: data.versionNumber,
            changeLabel: data.changeLabel ?? null,
            parametersJson: data.parametersJson,
            generatedByAI: data.generatedByAI ?? false,
            reviewedById: null,
            reviewNote: null,
            createdAt: new Date(),
            pieces: [],
            exports: [],
          }),
        ),
      ),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      findLatestByProjectId: jest.fn().mockResolvedValue(null),
      createExport: jest.fn(),
    };

    mockGeneratePiecesUseCase = {
      execute: jest.fn().mockResolvedValue({
        pieces: [
          {
            name: 'Corsage Devant',
            fabricRecommendation: 'Satin Duchesse',
            quantity: 1,
            outlineMm: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
            seamAllowanceMm: 10,
            grainline: { angleDegrees: 90, originX: 50, originY: 50 },
            notches: [],
          },
        ],
        warnings: [],
        metadata: { engineVersion: '0.1.0' },
      }),
    } as any;

    mockGetMeasurementProfileUseCase = {
      execute: jest.fn().mockRejectedValue(new Error('no profile linked')),
    } as any;

    mockEstimateMissingMeasurementsUseCase = {
      execute: jest.fn().mockResolvedValue({
        estimation: { estimatedMeasurements: {}, estimatedKeys: [], confidence: 0, modelVersion: 'fallback-0.0.0' },
        isIndicativeOnly: true,
      }),
    } as any;

    mockProviderResolver = { resolveSelected: jest.fn().mockResolvedValue(undefined) };
    mockRecordLearning = { recordGenerated: jest.fn().mockResolvedValue(undefined) };
    mockSuggest = {
      execute: jest.fn().mockResolvedValue({
        suggestion: {
          suggestedCutType: 'SIRENE',
          suggestedDetails: { col: 'BATEAU', dos: 'N_IMPORTE_QUOI', longueur: 'MIDI' },
          detectedInspirationFeatures: null,
          confidence: 0.8,
          modelVersion: 'claude-haiku-4-5-20251001',
        },
        isIndicativeOnly: false,
      }),
    };

    useCase = new GeneratePatternVersionUseCase(
      mockProjectRepo,
      mockVersionRepo,
      mockGeneratePiecesUseCase,
      mockGetMeasurementProfileUseCase,
      mockEstimateMissingMeasurementsUseCase,
      mockProviderResolver as any,
      mockRecordLearning as any,
      new InspirationParametersService(),
      mockSuggest as any,
    );
  });

  it('generates a pattern version and increments version number', async () => {
    const version = await useCase.execute('proj-1', 'cust-1');

    expect(version.versionNumber).toBe(1);
    expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalled();
    expect(mockProjectRepo.update).toHaveBeenCalledWith('proj-1', {
      status: 'GENERATED',
    });
  });

  it('throws ForbiddenException if customer is not owner', async () => {
    await expect(useCase.execute('proj-1', 'rogue-customer')).rejects.toThrow(
      'Vous n’avez pas accès',
    );
  });

  it('normalizes PANTALON garment type and passes it to pattern engine', async () => {
    const pantalonProject = PatternProjectEntity.create({
      id: 'proj-pantalon',
      projectRef: 'ANG-PAT-2026-00002',
      customerId: 'cust-1',
      measurementProfileId: null,
      garmentType: 'PANTALON',
      occasion: 'Bureau',
      style: 'Cigarette',
      cutType: 'SLIM',
      detailsJson: null,
      inspirationMediaId: null,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockProjectRepo.findById.mockResolvedValueOnce(pantalonProject);
    mockProjectRepo.update.mockResolvedValueOnce(pantalonProject);

    await useCase.execute('proj-pantalon', 'cust-1');

    expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ garmentType: 'PANTALON', cutType: 'SLIM' }),
      expect.any(Object),
    );
  });

  it('translates PatternEngineValidationError into UnprocessableEntityException', async () => {
    const { PatternEngineValidationError } = await import('@angaly/pattern-engine');
    mockGeneratePiecesUseCase.execute.mockRejectedValueOnce(
      new PatternEngineValidationError('Missing measurements'),
    );

    const { UnprocessableEntityException } = await import('@nestjs/common');
    await expect(useCase.execute('proj-1', 'cust-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects unrecognized garment types instead of silently defaulting to ROBE', async () => {
    const weirdProject = PatternProjectEntity.create({
      id: 'proj-weird',
      projectRef: 'ANG-PAT-2026-00003',
      customerId: 'cust-1',
      measurementProfileId: null,
      garmentType: 'CHAPEAU',
      occasion: 'Autre',
      style: 'Créatif',
      cutType: 'DROITE',
      detailsJson: null,
      inspirationMediaId: null,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockProjectRepo.findById.mockResolvedValueOnce(weirdProject);

    const { UnprocessableEntityException } = await import('@nestjs/common');
    await expect(useCase.execute('proj-weird', 'cust-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(mockGeneratePiecesUseCase.execute).not.toHaveBeenCalled();
  });

  it('merges measurements from the linked measurement profile before manual overrides', async () => {
    const profiledProject = PatternProjectEntity.create({
      id: 'proj-profile',
      projectRef: 'ANG-PAT-2026-00004',
      customerId: 'cust-1',
      measurementProfileId: 'profile-1',
      garmentType: 'ROBE',
      occasion: 'Mariage',
      style: 'Sirène',
      cutType: 'SIRENE',
      detailsJson: null,
      inspirationMediaId: null,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockProjectRepo.findById.mockResolvedValueOnce(profiledProject);
    mockProjectRepo.update.mockResolvedValueOnce(profiledProject);
    mockGetMeasurementProfileUseCase.execute.mockResolvedValueOnce({
      values: new Map([
        ['TOUR_POITRINE', 88],
        ['TOUR_TAILLE', 68],
      ]),
    } as any);

    await useCase.execute('proj-profile', 'cust-1', { measurements: { TOUR_TAILLE: 70 } });

    expect(mockGetMeasurementProfileUseCase.execute).toHaveBeenCalledWith('profile-1', 'cust-1');
    expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ TOUR_POITRINE: 88, TOUR_TAILLE: 70 }),
    );
  });

  it('fills missing required measurements via AI estimation and retries generation once', async () => {
    const { PatternEngineValidationError } = await import('@angaly/pattern-engine');
    mockGeneratePiecesUseCase.execute
      .mockRejectedValueOnce(
        new PatternEngineValidationError('Missing measurements', ['TOUR_BASSIN']),
      )
      .mockResolvedValueOnce({
        pieces: [],
        warnings: [],
        metadata: { engineVersion: '0.1.0' },
      } as any);
    mockEstimateMissingMeasurementsUseCase.execute.mockResolvedValueOnce({
      estimation: {
        estimatedMeasurements: { TOUR_BASSIN: 95 },
        estimatedKeys: ['TOUR_BASSIN'],
        confidence: 0.4,
        modelVersion: 'gemini-2.5-flash',
      },
      isIndicativeOnly: true,
    });

    const version = await useCase.execute('proj-1', 'cust-1');

    expect(mockEstimateMissingMeasurementsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ garmentType: 'ROBE', requiredKeys: ['TOUR_BASSIN'] }),
    );
    expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledTimes(2);
    expect(version.generatedByAI).toBe(true);
    expect((version.parametersJson as any).estimatedMeasurementKeys).toEqual(['TOUR_BASSIN']);
  });

  it('uses the AI provider chosen by the user for the measurement estimation', async () => {
    const { PatternEngineValidationError } = await import('@angaly/pattern-engine');
    mockGeneratePiecesUseCase.execute
      .mockRejectedValueOnce(new PatternEngineValidationError('Missing', ['TOUR_BASSIN']))
      .mockResolvedValueOnce({ pieces: [], warnings: [], metadata: { engineVersion: '0.1.0' } } as any);
    const credentials = { provider: 'ANTHROPIC', model: 'claude-haiku-4-5-20251001', apiKey: 'k' };
    mockProviderResolver.resolveSelected.mockResolvedValue(credentials);
    mockEstimateMissingMeasurementsUseCase.execute.mockResolvedValueOnce({
      estimation: {
        estimatedMeasurements: { TOUR_BASSIN: 95 },
        estimatedKeys: ['TOUR_BASSIN'],
        confidence: 0.4,
        modelVersion: 'x',
      },
      isIndicativeOnly: true,
    });

    await useCase.execute('proj-1', 'cust-1', { aiProvider: 'ANTHROPIC' as any });

    expect(mockProviderResolver.resolveSelected).toHaveBeenCalledWith('ANTHROPIC', 'MEASUREMENT_ESTIMATION');
    expect(mockEstimateMissingMeasurementsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ provider: credentials }),
    );
  });

  it('records the generated choices for the learning loop', async () => {
    await useCase.execute('proj-1', 'cust-1');

    expect(mockRecordLearning.recordGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ patternProjectId: 'proj-1', garmentType: 'ROBE' }),
    );
  });

  it('rejects with the original error if AI estimation returns nothing usable', async () => {
    const { PatternEngineValidationError } = await import('@angaly/pattern-engine');
    mockGeneratePiecesUseCase.execute.mockRejectedValueOnce(
      new PatternEngineValidationError('Missing measurements', ['TOUR_BASSIN']),
    );
    mockEstimateMissingMeasurementsUseCase.execute.mockResolvedValueOnce({
      estimation: { estimatedMeasurements: {}, estimatedKeys: [], confidence: 0, modelVersion: 'fallback-0.0.0' },
      isIndicativeOnly: true,
    });

    const { UnprocessableEntityException } = await import('@nestjs/common');
    await expect(useCase.execute('proj-1', 'cust-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('forwards the engine warnings (e.g. the generic AUTRE base block) to parametersJson.warnings', async () => {
    mockGeneratePiecesUseCase.execute.mockResolvedValueOnce({
      pieces: [],
      warnings: ['Patron de base générique : adaptation requise.'],
      metadata: { engineVersion: '0.2.0-fit' },
    } as any);

    const version = await useCase.execute('proj-1', 'cust-1');

    expect(version.parametersJson.warnings).toEqual(['Patron de base générique : adaptation requise.']);
  });

  it('adds no warning of its own when the engine reports none', async () => {
    const version = await useCase.execute('proj-1', 'cust-1');

    const warnings = version.parametersJson.warnings as string[];
    expect(warnings).toEqual([]);
  });

  describe('with a stored photo analysis', () => {
    const analysedProject = (overrides: Record<string, unknown> = {}) =>
      PatternProjectEntity.create({
        id: 'proj-photo',
        projectRef: 'ANG-PAT-2026-00009',
        customerId: 'cust-1',
        measurementProfileId: null,
        garmentType: 'ROBE',
        occasion: 'MARIAGE',
        style: 'GLAMOUR',
        cutType: 'SIRENE',
        detailsJson: { manches: 'LONGUES' },
        inspirationMediaId: 'media-1',
        inspirationAnalysisJson: {
          features: { silhouette: 'ajustée', tissu: 'tulle' },
          profile: {
            isGarment: true,
            garmentType: 'ROBE',
            occasion: 'MARIAGE',
            style: 'GLAMOUR',
            cutType: 'SIRENE',
            details: { manches: 'SANS_MANCHES', decollete: 'COEUR', longueur: 'SOL' },
            constructionMethod: 'MIXED',
            presentation: 'MANNEQUIN',
            constructionNotes: 'Traîne à draper sur mannequin.',
          },
        },
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      });

    it('keeps the customer choices, fills the gaps from the photo and then from the AI', async () => {
      mockProjectRepo.findById.mockResolvedValueOnce(analysedProject());

      const version = await useCase.execute('proj-photo', 'cust-1');

      expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          cutType: 'SIRENE',
          details: {
            manches: 'LONGUES', // customer choice wins over the photo
            decollete: 'COEUR', // from the photo
            longueur: 'SOL', // from the photo
            col: 'BATEAU', // from the AI (valid)
            // dos: invalid AI value is dropped
          },
        }),
        expect.any(Object),
      );
      expect(mockSuggest.execute).toHaveBeenCalledWith(
        expect.objectContaining({ inspirationFeatures: { silhouette: 'ajustée', tissu: 'tulle' } }),
      );
      const stored = version.parametersJson as { inspiration: Record<string, unknown> };
      expect(stored.inspiration).toMatchObject({
        observations: { tissu: 'tulle' },
        presentation: 'MANNEQUIN',
        constructionMethod: 'MIXED',
        detailKeysFromPhoto: ['decollete', 'longueur'],
        detailKeysFromAi: ['col'],
      });
    });

    it('warns that a draped garment is finished on a mannequin', async () => {
      mockProjectRepo.findById.mockResolvedValueOnce(analysedProject());

      const version = await useCase.execute('proj-photo', 'cust-1');

      const { warnings } = version.parametersJson as { warnings: string[] };
      expect(warnings.some((w) => w.includes('sur mannequin') && w.includes('Traîne à draper'))).toBe(true);
    });

    it('does not call the AI when nothing is missing or when the AI is unavailable', async () => {
      mockProjectRepo.findById.mockResolvedValueOnce(
        analysedProject({
          detailsJson: {
            manches: 'LONGUES', col: 'ROND', decollete: 'SAGE', dos: 'FERME', longueur: 'MAXI', fermeture: 'AUCUNE',
          },
        }),
      );
      await useCase.execute('proj-photo', 'cust-1');
      expect(mockSuggest.execute).not.toHaveBeenCalled();

      mockSuggest.execute.mockRejectedValueOnce(new Error('boom'));
      mockProjectRepo.findById.mockResolvedValueOnce(analysedProject());
      await expect(useCase.execute('proj-photo', 'cust-1')).resolves.toBeDefined();
    });

    it('is unchanged for projects without a photo analysis', async () => {
      await useCase.execute('proj-1', 'cust-1');
      expect(mockSuggest.execute).not.toHaveBeenCalled();
    });
  });
  describe('extended parameters and measurement validation', () => {
    const projectWith = (parametersExtJson: unknown) =>
      PatternProjectEntity.create({
        id: 'proj-ext',
        projectRef: 'ANG-PAT-2026-00009',
        customerId: 'cust-1',
        measurementProfileId: null,
        garmentType: 'JUPE',
        occasion: null,
        style: null,
        cutType: 'EVASEE',
        detailsJson: null,
        inspirationMediaId: null,
        parametersExtJson: parametersExtJson as any,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    it('passes validated ease / fullness / lengths to the engine and records them', async () => {
      mockProjectRepo.findById.mockResolvedValueOnce(
        projectWith({ ease: 'AMPLE', fullness: { skirt: 2 }, lengths: { skirtPct: 90 } }),
      );

      const version = await useCase.execute('proj-ext', 'cust-1');

      expect(mockGeneratePiecesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ease: 'AMPLE',
          fullness: { skirt: 2 },
          lengths: { skirtPct: 90 },
        }),
        expect.any(Object),
      );
      expect((version.parametersJson as any).parameters.ease).toBe('AMPLE');
    });

    it('sends no extended key at all when the project has none (historical geometry)', async () => {
      await useCase.execute('proj-1', 'cust-1');
      const params = mockGeneratePiecesUseCase.execute.mock.calls[0]![0] as unknown as Record<string, unknown>;
      expect(params).not.toHaveProperty('ease');
      expect(params).not.toHaveProperty('fullness');
      expect(params).not.toHaveProperty('lengths');
    });

    it('drops out-of-range stored values instead of feeding them to the engine', async () => {
      mockProjectRepo.findById.mockResolvedValueOnce(
        projectWith({ ease: 'TROP', fullness: { skirt: 99 }, lengths: { skirtPct: 90 } }),
      );

      await useCase.execute('proj-ext', 'cust-1');

      const params = mockGeneratePiecesUseCase.execute.mock.calls[0]![0] as unknown as Record<string, unknown>;
      expect(params).not.toHaveProperty('ease');
      expect(params).not.toHaveProperty('fullness');
      expect(params['lengths']).toEqual({ skirtPct: 90 });
    });

    it('rejects implausible manual measurements with a 400', async () => {
      await expect(
        useCase.execute('proj-1', 'cust-1', { measurements: { TOUR_TAILLE: 900 } }),
      ).rejects.toThrow('Mesures invalides');
      expect(mockGeneratePiecesUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
