import { RecordPatternLearningUseCase } from '../../application/use-cases/record-pattern-learning.use-case';
import type { IPatternLearningRepository } from '../../domain/repositories/pattern-learning.repository';

describe('RecordPatternLearningUseCase', () => {
  const trainingCollector = { confirmInspirationLabel: jest.fn().mockResolvedValue(undefined) };

  const data = {
    patternProjectId: 'p1',
    garmentType: 'ROBE',
    occasion: null,
    style: null,
    cutType: 'EVASEE',
    details: {},
  };

  it('forwards to the repository', async () => {
    const upsertGenerated = jest.fn().mockResolvedValue(undefined);
    const markExported = jest.fn().mockResolvedValue(undefined);
    const repository = { upsertGenerated, markExported, findRecentByGarmentType: jest.fn() } as IPatternLearningRepository;
    const useCase = new RecordPatternLearningUseCase(repository, trainingCollector as never);

    await useCase.recordGenerated(data);
    await useCase.recordExported('p1');

    expect(upsertGenerated).toHaveBeenCalledWith(data);
    expect(trainingCollector.confirmInspirationLabel).toHaveBeenCalledWith(undefined, data);
    expect(markExported).toHaveBeenCalledWith('p1');
  });

  it('never throws, so a learning failure cannot break a generation or an export', async () => {
    const boom = jest.fn().mockRejectedValue(new Error('db down'));
    const repository = { upsertGenerated: boom, markExported: boom, findRecentByGarmentType: jest.fn() } as IPatternLearningRepository;
    const useCase = new RecordPatternLearningUseCase(repository, trainingCollector as never);

    await expect(useCase.recordGenerated(data)).resolves.toBeUndefined();
    await expect(useCase.recordExported('p1')).resolves.toBeUndefined();
  });
});
