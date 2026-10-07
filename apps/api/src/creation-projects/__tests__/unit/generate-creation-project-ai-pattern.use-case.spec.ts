import { NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';
import { GenerateCreationProjectAiPatternUseCase } from '../../application/use-cases/generate-creation-project-ai-pattern.use-case';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';
import { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import { SuggestPatternParametersUseCase } from '../../../ai-inference/application/use-cases/suggest-pattern-parameters.use-case';

describe('GenerateCreationProjectAiPatternUseCase', () => {
  const repository = {
    findById: jest.fn(),
    addStageMedia: jest.fn(),
    addStageNote: jest.fn(),
  } as unknown as jest.Mocked<ICreationProjectRepository>;

  const generatePatternPiecesUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GeneratePatternPiecesUseCase>;

  const suggestPatternParametersUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<SuggestPatternParametersUseCase>;

  let useCase: GenerateCreationProjectAiPatternUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    useCase = new GenerateCreationProjectAiPatternUseCase(
      repository,
      generatePatternPiecesUseCase,
      suggestPatternParametersUseCase,
    );
  });

  const mockProject = CreationProjectEntity.create({
    id: 'proj-1',
    reference: 'CRP-2026-TEST01',
    customerId: 'cust-1',
    title: 'Robe de gala drapée',
    description: 'Robe de gala soie ivoire',
    stage: CreationProjectStage.PATRON,
    quoteId: null,
    creationId: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPieces = [
    {
      name: 'Corsage Devant',
      outlineMm: [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 400 },
        { x: 0, y: 400 },
      ],
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: 100, originY: 200 },
      notches: [],
      quantity: 1,
      fabricRecommendation: 'Soie',
    },
    {
      name: 'Corsage Dos',
      outlineMm: [
        { x: 0, y: 0 },
        { x: 190, y: 0 },
        { x: 190, y: 390 },
        { x: 0, y: 390 },
      ],
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: 95, originY: 195 },
      notches: [],
      quantity: 1,
      fabricRecommendation: 'Soie',
    },
  ];

  it('generates pattern pieces, attaches SVG media and writes atelier note', async () => {
    repository.findById.mockResolvedValue(mockProject);
    suggestPatternParametersUseCase.execute.mockResolvedValue({
      suggestion: {
        suggestedCutType: 'EVASEE',
        suggestedDetails: { encolure: 'bateau' },
        confidence: 0.92,
        modelVersion: 'gemini-1.5-pro',
        detectedInspirationFeatures: null,
      },
      isIndicativeOnly: false,
    });
    generatePatternPiecesUseCase.execute.mockResolvedValue({
      pieces: mockPieces,
      warnings: [],
      metadata: { engineVersion: '0.1.0', generatedAt: new Date().toISOString() },
    });
    repository.addStageMedia.mockResolvedValue({
      id: 'media-1',
      projectId: 'proj-1',
      stage: CreationProjectStage.PATRON,
      url: 'data:image/svg+xml;utf8,...',
      title: 'Patron IA — ROBE (EVASEE)',
      fileName: 'patron-robe-CRP-2026-TEST01.svg',
      mimeType: 'image/svg+xml',
      sizeBytes: 1024,
      uploadedByEmail: 'staff@angaly.mg',
      createdAt: new Date(),
    });
    repository.addStageNote.mockResolvedValue({
      id: 'note-1',
      projectId: 'proj-1',
      stage: CreationProjectStage.PATRON,
      content: 'Patron géométrique généré par IA...',
      authorEmail: 'staff@angaly.mg',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(
      'proj-1',
      {
        garmentType: 'ROBE',
        style: 'Gala',
        requestAiSuggestion: true,
        saveMedia: true,
        addNote: true,
      },
      'staff-1',
    );

    expect(result.pieces).toHaveLength(2);
    expect(result.parameters.cutType).toBe('EVASEE');
    expect(result.aiSuggestion?.suggestedCutType).toBe('EVASEE');
    expect(result.svgContent).toContain('ANGALY HAUTE COUTURE');
    expect(result.svgDataUri).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(repository.addStageMedia).toHaveBeenCalledTimes(1);
    expect(repository.addStageNote).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when project is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('unknown', { garmentType: 'ROBE' }, 'staff-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
