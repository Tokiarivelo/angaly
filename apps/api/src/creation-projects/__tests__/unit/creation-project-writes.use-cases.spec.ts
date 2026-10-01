/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions on repository methods */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreationProjectStage, Role } from '@angaly/types';

import { AssignCreationProjectUseCase } from '../../application/use-cases/assign-creation-project.use-case';
import { CreateCreationProjectFromQuoteUseCase } from '../../application/use-cases/create-creation-project-from-quote.use-case';
import { GetAdminCreationProjectUseCase } from '../../application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from '../../application/use-cases/list-assignable-staff.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
import { UpdateCreationProjectStageUseCase } from '../../application/use-cases/update-creation-project-stage.use-case';
import { CreationProjectAssignee, CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import type { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';
import { generateCreationProjectReference } from '../../domain/value-objects/creation-project-reference.vo';

function project(
  stage = CreationProjectStage.CONSULTATION,
  assignedTo: CreationProjectAssignee | null = null,
): CreationProjectEntity {
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
    assignedTo,
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
    findDetailById: jest.fn(),
    assign: jest.fn(),
    findAssignableStaff: jest.fn(),
    findAssignableStaffById: jest.fn(),
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

      expect(repository.updateStage).toHaveBeenCalledWith('p-1', CreationProjectStage.PATRON, null, null);
    });

    it('sets completedAt when reaching TERMINEE', async () => {
      repository.findById.mockResolvedValue(project(CreationProjectStage.ESSAYAGE));
      repository.updateStage.mockResolvedValue(project(CreationProjectStage.TERMINEE));

      await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.TERMINEE);

      expect(repository.updateStage).toHaveBeenCalledWith('p-1', CreationProjectStage.TERMINEE, expect.any(Date), null);
    });

    it('does nothing when the stage is unchanged', async () => {
      const current = project(CreationProjectStage.PATRON);
      repository.findById.mockResolvedValue(current);

      const result = await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.PATRON);

      expect(result).toBe(current);
      expect(repository.updateStage).not.toHaveBeenCalled();
    });
  });

  it('records the acting staff member when changing the stage', async () => {
    repository.findById.mockResolvedValue(project());
    repository.updateStage.mockResolvedValue(project(CreationProjectStage.PATRON));

    await new UpdateCreationProjectStageUseCase(repository).execute('p-1', CreationProjectStage.PATRON, 'u-9');

    expect(repository.updateStage).toHaveBeenCalledWith('p-1', CreationProjectStage.PATRON, null, 'u-9');
  });

  describe('AssignCreationProjectUseCase', () => {
    const staff = { id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE };

    it('throws NotFoundException for an unknown project', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(new AssignCreationProjectUseCase(repository).execute('missing', 'u-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects an assignee that is not an active staff member', async () => {
      repository.findById.mockResolvedValue(project());
      repository.findAssignableStaffById.mockResolvedValue(null);

      await expect(new AssignCreationProjectUseCase(repository).execute('p-1', 'client-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.assign).not.toHaveBeenCalled();
    });

    it('assigns an active staff member', async () => {
      repository.findById.mockResolvedValue(project());
      repository.findAssignableStaffById.mockResolvedValue(staff);
      repository.assign.mockResolvedValue(project());

      await new AssignCreationProjectUseCase(repository).execute('p-1', 'u-2');

      expect(repository.assign).toHaveBeenCalledWith('p-1', 'u-2');
    });

    it('unassigns with null without checking staff', async () => {
      const assigned = project(CreationProjectStage.CONSULTATION, staff);
      repository.findById.mockResolvedValue(assigned);
      repository.assign.mockResolvedValue(project());

      await new AssignCreationProjectUseCase(repository).execute('p-1', null);

      expect(repository.findAssignableStaffById).not.toHaveBeenCalled();
      expect(repository.assign).toHaveBeenCalledWith('p-1', null);
    });

    it('does nothing when the assignee is unchanged', async () => {
      const assigned = project(CreationProjectStage.CONSULTATION, staff);
      repository.findById.mockResolvedValue(assigned);
      repository.findAssignableStaffById.mockResolvedValue(staff);

      const result = await new AssignCreationProjectUseCase(repository).execute('p-1', 'u-2');

      expect(result).toBe(assigned);
      expect(repository.assign).not.toHaveBeenCalled();
    });
  });

  describe('GetAdminCreationProjectUseCase', () => {
    it('throws NotFoundException for an unknown project', async () => {
      repository.findDetailById.mockResolvedValue(null);

      await expect(new GetAdminCreationProjectUseCase(repository).execute('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the project detail', async () => {
      const detail = project();
      repository.findDetailById.mockResolvedValue(detail);

      expect(await new GetAdminCreationProjectUseCase(repository).execute('p-1')).toBe(detail);
    });
  });

  it('ListAssignableStaffUseCase returns the repository staff list', async () => {
    const staff = [{ id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE }];
    repository.findAssignableStaff.mockResolvedValue(staff);

    expect(await new ListAssignableStaffUseCase(repository).execute()).toBe(staff);
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
