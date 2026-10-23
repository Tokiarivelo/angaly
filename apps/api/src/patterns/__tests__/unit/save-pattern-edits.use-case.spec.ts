import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SavePatternEditsUseCase } from '../../application/use-cases/save-pattern-edits.use-case';
import type { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import type { IPatternVersionRepository } from '../../domain/repositories/pattern-version.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';

describe('SavePatternEditsUseCase', () => {
  const project = PatternProjectEntity.create({
    id: 'proj-1',
    projectRef: 'ANG-PAT-2026-00001',
    customerId: 'cust-1',
    measurementProfileId: null,
    garmentType: 'ROBE',
    occasion: null,
    style: null,
    cutType: null,
    detailsJson: null,
    inspirationMediaId: null,
    status: 'GENERATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const base = PatternVersionEntity.create({
    id: 'ver-1',
    projectId: 'proj-1',
    versionNumber: 2,
    changeLabel: null,
    parametersJson: { measurements: { TOUR_TAILLE: 70 } },
    generatedByAI: true,
    reviewedById: null,
    reviewNote: null,
    createdAt: new Date(),
    pieces: [],
    exports: [],
  });
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const piece = (outlineMm: unknown) => ({
    name: 'Devant',
    dimensionsJson: { widthMm: 100, heightMm: 100, outlineMm },
    quantity: 1,
  });

  let projectRepo: jest.Mocked<IPatternProjectRepository>;
  let versionRepo: jest.Mocked<IPatternVersionRepository>;
  let useCase: SavePatternEditsUseCase;
  let create: jest.Mock;

  beforeEach(() => {
    projectRepo = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(project),
      findByRef: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };
    create = jest.fn().mockImplementation((data) => Promise.resolve(data));
    versionRepo = {
      create,
      findById: jest.fn().mockResolvedValue(base),
      findByProjectId: jest.fn(),
      findLatestByProjectId: jest.fn().mockResolvedValue(PatternVersionEntity.create({
        ...{ id: 'ver-3', projectId: 'proj-1', versionNumber: 3, changeLabel: null, parametersJson: {},
          generatedByAI: false, reviewedById: null, reviewNote: null, createdAt: new Date(), pieces: [], exports: [] },
      })),
      createExport: jest.fn(),
    };
    useCase = new SavePatternEditsUseCase(projectRepo, versionRepo);
  });

  it('creates the next version carrying the base parameters and the edited pieces', async () => {
    const result = (await useCase.execute('ver-1', 'cust-1', [piece(square)])) as unknown as {
      versionNumber: number;
      changeLabel: string;
      generatedByAI: boolean;
      parametersJson: unknown;
      pieces: Array<{ seamAllowanceCm: number | null; grainlineJson: unknown }>;
    };
    expect(result.versionNumber).toBe(4);
    expect(result.changeLabel).toBe('Retouche manuelle depuis v2');
    expect(result.generatedByAI).toBe(false);
    expect(result.parametersJson).toEqual({ measurements: { TOUR_TAILLE: 70 } });
    expect(result.pieces[0]?.seamAllowanceCm).toBeNull();
    expect(result.pieces[0]?.grainlineJson).toBeNull();
  });

  it('uses the provided change label', async () => {
    const result = (await useCase.execute('ver-1', 'cust-1', [piece(square)], ' Taille reprise ')) as unknown as {
      changeLabel: string;
    };
    expect(result.changeLabel).toBe('Taille reprise');
  });

  it('rejects an unknown version', async () => {
    versionRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('nope', 'cust-1', [piece(square)])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects another customer’s project', async () => {
    await expect(useCase.execute('ver-1', 'cust-2', [piece(square)])).rejects.toBeInstanceOf(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
  });

  it.each([[[{ x: 0, y: 0 }, { x: 1, y: 1 }]], [[{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 'a', y: 2 }]], ['nope']])(
    'rejects an invalid outline %#',
    async (outline) => {
      await expect(useCase.execute('ver-1', 'cust-1', [piece(outline)])).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    },
  );
});
