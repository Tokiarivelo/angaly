/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions on repository methods */
import { NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import { CreateCreationProjectFromQuoteUseCase } from '../../application/use-cases/create-creation-project-from-quote.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
import { UpdateCreationProjectStageUseCase } from '../../application/use-cases/update-creation-project-stage.use-case';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import type { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';
import { generateCreationProjectReference } from '../../domain/value-objects/creation-project-reference.vo';

function project(stage = CreationProjectStage.CONSULTATION): CreationProjectEntity {
  return CreationProjectEntity.create({
    id: 'p-1',
    reference: 'CRP-2026-abc12345',
    customerId: 'c-1',
    title: 'Robe de mariée',
    description: null,
    stage,
    quoteId: 'q-1',
    creationId: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('creation-projects write use cases', () => {
  const repository: jest.Mocked<ICreationProjectRepository> = {
    findByCustomerId: jest.fn(),
    findById: jest.fn(),
    findByQuoteId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    updateStage: jest.fn(),
  };

  beforeEach(() => jest.resetAllMocks());

  describe('CreateCreationProjectFromQuoteUseCase', () => {
    const quote = { id: 'q-1', customerId: 'c-1', creationId: null, description: 'Robe de mariée' };

    it('creates a project from an accepted quote', async () => {
      repository.findByQuoteId.mockResolvedValue(null);
      repository.create.mockResolvedValue(project());

      await new CreateCreationProjectFromQuoteUseCase(repository).execute(quote);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'c-1',
          quoteId: 'q-1',
          title: 'Robe de mariée',
          description: null,
          reference: expect.stringMatching(/^CRP-\d{4}-/) as string,
        }),
      );
    });

    it('truncates a long description into the title and keeps it in full as description', async () => {
      repository.findByQuoteId.mockResolvedValue(null);
      repository.create.mockResolvedValue(project());
      const description = 'x'.repeat(200);

      await new CreateCreationProjectFromQuoteUseCase(repository).execute({ ...quote, description });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'x'.repeat(120), description }),
      );
    });

    it('is idempotent: returns the existing project of the quote', async () => {
      const existing = project();
      repository.findByQuoteId.mockResolvedValue(existing);

      const result = await new CreateCreationProjectFromQuoteUseCase(repository).execute(quote);

      expect(result).toBe(existing);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('UpdateCreationProjectStageUseCase', () => {
    it('throws NotFoundException for an unknown project', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        new UpdateCreationProjectStageUseCase(repository).execute('missing', CreationProjectStage.PATRON),
      ).rejects.toThrow(NotFoundException);
    });

    it('moves the stage and leaves completedAt empty', async () => {
      repository.findById.mockResolvedValue(project());
      repository.updateStage.mockResolvedValue(project(CreationProjectStage.PATRON));

      await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.PATRON);

      expect(repository.updateStage).toHaveBeenCalledWith('p-1', CreationProjectStage.PATRON, null);
    });

    it('sets completedAt when reaching TERMINEE', async () => {
      repository.findById.mockResolvedValue(project(CreationProjectStage.ESSAYAGE));
      repository.updateStage.mockResolvedValue(project(CreationProjectStage.TERMINEE));

      await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.TERMINEE);

      expect(repository.updateStage).toHaveBeenCalledWith('p-1', CreationProjectStage.TERMINEE, expect.any(Date));
    });

    it('does nothing when the stage is unchanged', async () => {
      const current = project(CreationProjectStage.PATRON);
      repository.findById.mockResolvedValue(current);

      const result = await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.PATRON);

      expect(result).toBe(current);
      expect(repository.updateStage).not.toHaveBeenCalled();
    });
  });

  it('ListAllCreationProjectsUseCase forwards the stage filter', async () => {
    repository.findAll.mockResolvedValue([project()]);

    await new ListAllCreationProjectsUseCase(repository).execute(CreationProjectStage.PATRON);

    expect(repository.findAll).toHaveBeenCalledWith(CreationProjectStage.PATRON);
  });

  it('generateCreationProjectReference is unique and well formed', () => {
    const a = generateCreationProjectReference(new Date('2026-09-30T00:00:00Z'));
    expect(a).toMatch(/^CRP-2026-[A-Za-z0-9_-]{8}$/);
    expect(generateCreationProjectReference()).not.toBe(generateCreationProjectReference());
  });
});
