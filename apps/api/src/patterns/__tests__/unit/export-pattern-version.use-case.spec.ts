import { ExportPatternVersionUseCase } from '../../application/use-cases/export-pattern-version.use-case';
import { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import { IPatternVersionRepository } from '../../domain/repositories/pattern-version.repository';
import { UploadMediaBufferUseCase } from '../../../media/application/use-cases/upload-media-buffer.use-case';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';
import { PatternExportEntity } from '../../domain/entities/pattern-export.entity';

describe('ExportPatternVersionUseCase', () => {
  let useCase: ExportPatternVersionUseCase;
  let mockVersionRepo: jest.Mocked<IPatternVersionRepository>;
  let mockProjectRepo: jest.Mocked<IPatternProjectRepository>;
  let mockUploadMediaUseCase: jest.Mocked<UploadMediaBufferUseCase>;

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
    status: 'VALIDATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockVersion = PatternVersionEntity.create({
    id: 'ver-1',
    projectId: 'proj-1',
    versionNumber: 1,
    changeLabel: null,
    parametersJson: {},
    generatedByAI: false,
    reviewedById: null,
    reviewNote: null,
    createdAt: new Date(),
    pieces: [],
    exports: [],
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
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockVersion),
      findByProjectId: jest.fn(),
      findLatestByProjectId: jest.fn(),
      createExport: jest.fn().mockImplementation((data) =>
        Promise.resolve(
          PatternExportEntity.create({
            ...data,
            createdAt: new Date(),
          }),
        ),
      ),
    };

    mockUploadMediaUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: 'media-1',
        url: 'http://localhost:9000/patterns/test.pdf',
      } as any),
    } as any;

    useCase = new ExportPatternVersionUseCase(
      mockVersionRepo,
      mockProjectRepo,
      mockUploadMediaUseCase,
    );
  });

  it('exports pattern into requested format when validated', async () => {
    const result = await useCase.execute('ver-1', 'cust-1', 'PDF_A4');

    expect(result.format).toBe('PDF_A4');
    expect(result.mediaId).toBe('media-1');
    expect(mockUploadMediaUseCase.execute).toHaveBeenCalled();
  });

  it('blocks export when project is REVIEW_REQUIRED', async () => {
    const reviewProject = PatternProjectEntity.create({
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
      status: 'REVIEW_REQUIRED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockProjectRepo.findById.mockResolvedValueOnce(reviewProject);

    await expect(
      useCase.execute('ver-1', 'cust-1', 'PDF_A4'),
    ).rejects.toThrow('L’export est bloqué');
  });
});
