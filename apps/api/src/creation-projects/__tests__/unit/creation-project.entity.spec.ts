import { CreationProjectStage } from '@angaly/types';

import { CreationProjectEntity, CreationProjectProps } from '../../domain/entities/creation-project.entity';

const base: CreationProjectProps = {
  id: 'p-1',
  reference: 'CRP-2026-0001',
  customerId: 'c-1',
  title: 'Robe mariage 2026',
  description: null,
  stage: CreationProjectStage.PATRON,
  quoteId: null,
  creationId: null,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('CreationProjectEntity', () => {
  it('exposes the pipeline position of the current stage', () => {
    expect(CreationProjectEntity.create(base).stageIndex).toBe(2);
  });

  it('is completed only at the TERMINEE stage', () => {
    expect(CreationProjectEntity.create(base).isCompleted).toBe(false);
    expect(CreationProjectEntity.create({ ...base, stage: CreationProjectStage.TERMINEE }).isCompleted).toBe(true);
  });

  it('rejects an empty title', () => {
    expect(() => CreationProjectEntity.create({ ...base, title: '  ' })).toThrow('title cannot be empty');
  });
});
