import { NotFoundException } from '@nestjs/common';
import { CreationProjectStage } from '@angaly/types';

import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';
import { AddCreationProjectStageMediaUseCase } from '../../application/use-cases/add-creation-project-stage-media.use-case';
import { AddCreationProjectStageNoteUseCase } from '../../application/use-cases/add-creation-project-stage-note.use-case';
import { DeleteCreationProjectStageMediaUseCase } from '../../application/use-cases/delete-creation-project-stage-media.use-case';
import { DeleteCreationProjectStageNoteUseCase } from '../../application/use-cases/delete-creation-project-stage-note.use-case';

describe('CreationProject Stage Notes & Media Use Cases (unit)', () => {
  let repository: jest.Mocked<ICreationProjectRepository>;
  let addNoteUseCase: AddCreationProjectStageNoteUseCase;
  let deleteNoteUseCase: DeleteCreationProjectStageNoteUseCase;
  let addMediaUseCase: AddCreationProjectStageMediaUseCase;
  let deleteMediaUseCase: DeleteCreationProjectStageMediaUseCase;

  const mockProject = CreationProjectEntity.create({
    id: 'p-1',
    reference: 'CRP-2026-0001',
    customerId: 'c-1',
    title: 'Robe de cocktail',
    description: null,
    stage: CreationProjectStage.CONCEPTION,
    quoteId: null,
    creationId: null,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByQuoteId: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      createAdminProject: jest.fn(),
      findCustomers: jest.fn(),
      findQuotes: jest.fn(),
      updateStage: jest.fn(),
      findDetailById: jest.fn(),
      assign: jest.fn(),
      findAssignableStaff: jest.fn(),
      findAssignableStaffById: jest.fn(),
      addStageNote: jest.fn(),
      deleteStageNote: jest.fn(),
      addStageMedia: jest.fn(),
      deleteStageMedia: jest.fn(),
    };

    addNoteUseCase = new AddCreationProjectStageNoteUseCase(repository);
    deleteNoteUseCase = new DeleteCreationProjectStageNoteUseCase(repository);
    addMediaUseCase = new AddCreationProjectStageMediaUseCase(repository);
    deleteMediaUseCase = new DeleteCreationProjectStageMediaUseCase(repository);
  });

  describe('AddCreationProjectStageNoteUseCase', () => {
    it('throws NotFoundException if project is not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        addNoteUseCase.execute({
          projectId: 'p-none',
          stage: CreationProjectStage.CONCEPTION,
          content: 'Test note',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds note successfully', async () => {
      repository.findById.mockResolvedValue(mockProject);
      repository.addStageNote.mockResolvedValue({
        id: 'n-1',
        projectId: 'p-1',
        stage: CreationProjectStage.CONCEPTION,
        content: 'Test note',
        authorEmail: 'couturiere@angaly.mg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await addNoteUseCase.execute({
        projectId: 'p-1',
        stage: CreationProjectStage.CONCEPTION,
        content: 'Test note',
        authorId: 'u-1',
      });

      expect(res.id).toBe('n-1');
      expect(repository.addStageNote).toHaveBeenCalledWith('p-1', CreationProjectStage.CONCEPTION, 'Test note', 'u-1');
    });
  });

  describe('DeleteCreationProjectStageNoteUseCase', () => {
    it('throws NotFoundException if project is not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        deleteNoteUseCase.execute({ projectId: 'p-none', noteId: 'n-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes note successfully', async () => {
      repository.findById.mockResolvedValue(mockProject);
      repository.deleteStageNote.mockResolvedValue(undefined);

      await deleteNoteUseCase.execute({ projectId: 'p-1', noteId: 'n-1' });
      expect(repository.deleteStageNote).toHaveBeenCalledWith('p-1', 'n-1');
    });
  });

  describe('AddCreationProjectStageMediaUseCase', () => {
    it('throws NotFoundException if project is not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        addMediaUseCase.execute({
          projectId: 'p-none',
          stage: CreationProjectStage.PATRON,
          url: 'https://example.com/file.jpg',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds media successfully', async () => {
      repository.findById.mockResolvedValue(mockProject);
      repository.addStageMedia.mockResolvedValue({
        id: 'm-1',
        projectId: 'p-1',
        stage: CreationProjectStage.PATRON,
        url: 'https://example.com/file.jpg',
        title: 'Croquis',
        fileName: 'file.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1234,
        uploadedByEmail: 'couturiere@angaly.mg',
        createdAt: new Date(),
      });

      const res = await addMediaUseCase.execute({
        projectId: 'p-1',
        stage: CreationProjectStage.PATRON,
        url: 'https://example.com/file.jpg',
        title: 'Croquis',
        fileName: 'file.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1234,
        uploadedById: 'u-1',
      });

      expect(res.id).toBe('m-1');
      expect(repository.addStageMedia).toHaveBeenCalledWith(
        'p-1',
        CreationProjectStage.PATRON,
        {
          url: 'https://example.com/file.jpg',
          title: 'Croquis',
          fileName: 'file.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1234,
        },
        'u-1',
      );
    });
  });

  describe('DeleteCreationProjectStageMediaUseCase', () => {
    it('throws NotFoundException if project is not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        deleteMediaUseCase.execute({ projectId: 'p-none', mediaId: 'm-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes media successfully', async () => {
      repository.findById.mockResolvedValue(mockProject);
      repository.deleteStageMedia.mockResolvedValue(undefined);

      await deleteMediaUseCase.execute({ projectId: 'p-1', mediaId: 'm-1' });
      expect(repository.deleteStageMedia).toHaveBeenCalledWith('p-1', 'm-1');
    });
  });
});
