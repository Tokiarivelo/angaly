import { UpdatePatternProjectStepUseCase } from '../../application/use-cases/update-pattern-project-step.use-case';
import { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';

describe('UpdatePatternProjectStepUseCase', () => {
  let useCase: UpdatePatternProjectStepUseCase;
  let mockProjectRepo: jest.Mocked<IPatternProjectRepository>;

  const mockProject = PatternProjectEntity.create({
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
      update: jest.fn().mockImplementation((_id, data) =>
        Promise.resolve(
          PatternProjectEntity.create({
            ...mockProject,
            ...data,
            id: mockProject.id,
            projectRef: mockProject.projectRef,
            customerId: mockProject.customerId,
            createdAt: mockProject.createdAt,
            updatedAt: new Date(),
          }),
        ),
      ),
      count: jest.fn(),
    };

    useCase = new UpdatePatternProjectStepUseCase(mockProjectRepo);
  });

  it('updates project fields step by step', async () => {
    const updated = await useCase.execute('proj-1', 'cust-1', {
      occasion: 'Mariage',
      style: 'Classique',
      cutType: 'SIRENE',
    });

    expect(mockProjectRepo.update).toHaveBeenCalledWith('proj-1', expect.objectContaining({
      occasion: 'Mariage',
      style: 'Classique',
      cutType: 'SIRENE',
    }));
    expect(updated).toBeDefined();
  });
});
