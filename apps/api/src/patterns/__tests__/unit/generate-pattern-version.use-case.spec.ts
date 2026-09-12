import { GeneratePatternVersionUseCase } from '../../application/use-cases/generate-pattern-version.use-case';
import { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import { IPatternVersionRepository } from '../../domain/repositories/pattern-version.repository';
import { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';

describe('GeneratePatternVersionUseCase', () => {
  let useCase: GeneratePatternVersionUseCase;
  let mockProjectRepo: jest.Mocked<IPatternProjectRepository>;
  let mockVersionRepo: jest.Mocked<IPatternVersionRepository>;
  let mockGeneratePiecesUseCase: jest.Mocked<GeneratePatternPiecesUseCase>;

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
            generatedByAI: false,
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

    useCase = new GeneratePatternVersionUseCase(
      mockProjectRepo,
      mockVersionRepo,
      mockGeneratePiecesUseCase,
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
});

