import { LogoutUserUseCase } from '../../application/use-cases/logout-user.use-case';
import type { IRefreshTokenRepository, StoredRefreshToken } from '../../domain/repositories/refresh-token.repository';
import { hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

function buildRepository(): jest.Mocked<IRefreshTokenRepository> {
  return { create: jest.fn(), findByTokenHash: jest.fn(), revoke: jest.fn() };
}

function storedToken(overrides: Partial<StoredRefreshToken> = {}): StoredRefreshToken {
  return {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: hashOpaqueToken('raw-token'),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

describe('LogoutUserUseCase', () => {
  it('does nothing when no token is presented', async () => {
    const repository = buildRepository();
    await new LogoutUserUseCase(repository).execute(undefined);
    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('does nothing when the token is unknown (idempotent)', async () => {
    const repository = buildRepository();
    repository.findByTokenHash.mockResolvedValue(null);

    await new LogoutUserUseCase(repository).execute('raw-token');

    expect(repository.revoke).not.toHaveBeenCalled();
  });

  it('does nothing when the token is already revoked (idempotent)', async () => {
    const repository = buildRepository();
    repository.findByTokenHash.mockResolvedValue(storedToken({ revokedAt: new Date() }));

    await new LogoutUserUseCase(repository).execute('raw-token');

    expect(repository.revoke).not.toHaveBeenCalled();
  });

  it('revokes an active token', async () => {
    const repository = buildRepository();
    repository.findByTokenHash.mockResolvedValue(storedToken());

    await new LogoutUserUseCase(repository).execute('raw-token');

    expect(repository.revoke).toHaveBeenCalledWith('token-1');
  });
});
