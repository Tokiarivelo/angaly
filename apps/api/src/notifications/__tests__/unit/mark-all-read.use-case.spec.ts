import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkAllReadUseCase } from '../../application/use-cases/mark-all-read.use-case';

function buildRepository(): jest.Mocked<INotificationRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
}

describe('MarkAllReadUseCase', () => {
  it('delegates to the repository for the given user', async () => {
    const repository = buildRepository();
    const useCase = new MarkAllReadUseCase(repository);

    await useCase.execute('user-1');

    expect(repository.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
