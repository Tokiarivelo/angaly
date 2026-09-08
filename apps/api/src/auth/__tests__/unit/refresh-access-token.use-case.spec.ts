import { UnauthorizedException } from '@nestjs/common';

import { RefreshAccessTokenUseCase } from '../../application/use-cases/refresh-access-token.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { IRefreshTokenRepository, StoredRefreshToken } from '../../domain/repositories/refresh-token.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IAccessTokenService } from '../../domain/services/access-token.service';
import type { ITokenExpiryPolicy } from '../../domain/services/token-expiry-policy';
import { hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

function sampleUser(isActive = true): UserEntity {
  return UserEntity.create({
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
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

function buildDeps() {
  const userRepository: jest.Mocked<IUserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createWithCustomer: jest.fn(),
    updateLastLoginAt: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
  const accessTokenService: jest.Mocked<IAccessTokenService> = { sign: jest.fn(), verify: jest.fn() };
  const refreshTokenRepository: jest.Mocked<IRefreshTokenRepository> = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    revoke: jest.fn(),
  };
  const tokenExpiryPolicy: jest.Mocked<ITokenExpiryPolicy> = {
    refreshTokenExpiresAt: jest.fn(),
    passwordResetTokenExpiresAt: jest.fn(),
  };
  return { userRepository, accessTokenService, refreshTokenRepository, tokenExpiryPolicy };
}

function buildUseCase(deps: ReturnType<typeof buildDeps>) {
  return new RefreshAccessTokenUseCase(
    deps.userRepository,
    deps.accessTokenService,
    deps.refreshTokenRepository,
    deps.tokenExpiryPolicy,
  );
}

describe('RefreshAccessTokenUseCase', () => {
  it('rejects an unknown token', async () => {
    const deps = buildDeps();
    deps.refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(buildUseCase(deps).execute('raw-token')).rejects.toThrow(UnauthorizedException);
    expect(deps.refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });

  it('rejects an already-revoked token', async () => {
    const deps = buildDeps();
    deps.refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken({ revokedAt: new Date() }));

    await expect(buildUseCase(deps).execute('raw-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('rejects an expired token', async () => {
    const deps = buildDeps();
    deps.refreshTokenRepository.findByTokenHash.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(buildUseCase(deps).execute('raw-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('revokes the presented token even when the user no longer exists', async () => {
    const deps = buildDeps();
    deps.refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken());
    deps.userRepository.findById.mockResolvedValue(null);

    await expect(buildUseCase(deps).execute('raw-token')).rejects.toThrow('Invalid or expired refresh token');
    expect(deps.refreshTokenRepository.revoke).toHaveBeenCalledWith('token-1');
  });

  it('rotates the token and issues a fresh access token on success', async () => {
    const deps = buildDeps();
    deps.refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken());
    deps.userRepository.findById.mockResolvedValue(sampleUser());
    deps.accessTokenService.sign.mockReturnValue('new-access-token');
    const expiresAt = new Date('2026-01-08T00:00:00.000Z');
    deps.tokenExpiryPolicy.refreshTokenExpiresAt.mockReturnValue(expiresAt);

    const result = await buildUseCase(deps).execute('raw-token');

    expect(deps.refreshTokenRepository.revoke).toHaveBeenCalledWith('token-1');
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', expiresAt }),
    );
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toHaveLength(64);
  });
});
