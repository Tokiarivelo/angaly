import { CreatePatternProjectUseCase } from '../../application/use-cases/create-pattern-project.use-case';
import { IPatternProjectRepository } from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';

describe('CreatePatternProjectUseCase', () => {
  let useCase: CreatePatternProjectUseCase;
  let mockRepository: jest.Mocked<IPatternProjectRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve(
          PatternProjectEntity.create({
            ...data,
            inspirationMediaUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            versions: [],
          }),
        ),
      ),
      findById: jest.fn(),
      findByRef: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    useCase = new CreatePatternProjectUseCase(mockRepository);
  });

  it('creates a draft pattern project with generated ref', async () => {
    const result = await useCase.execute('cust-123', {
      garmentType: 'ROBE',
      occasion: 'Soirée',
      style: 'Moderne',
    });

    expect(result.customerId).toBe('cust-123');
    expect(result.garmentType).toBe('ROBE');
    expect(result.status).toBe('DRAFT');
    expect(result.projectRef).toMatch(/^ANG-PAT-\d{4}-[A-Z0-9]{8}$/);
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });
});
