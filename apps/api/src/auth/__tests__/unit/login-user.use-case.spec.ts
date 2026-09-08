import { UnauthorizedException } from '@nestjs/common';

import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IAccessTokenService } from '../../domain/services/access-token.service';
import type { IPasswordHasher } from '../../domain/services/password-hasher';
import type { ITokenExpiryPolicy } from '../../domain/services/token-expiry-policy';

function sampleUser(overrides: Partial<{ isActive: boolean }> = {}): UserEntity {
  return UserEntity.create({
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive: overrides.isActive ?? true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildDeps() {
  const userRepository: jest.Mocked<IUserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createWithCustomer: jest.fn(),
    updateLastLoginAt: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
  const passwordHasher: jest.Mocked<IPasswordHasher> = { hash: jest.fn(), compare: jest.fn() };
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
  return { userRepository, passwordHasher, accessTokenService, refreshTokenRepository, tokenExpiryPolicy };
}

function buildUseCase(deps: ReturnType<typeof buildDeps>) {
  return new LoginUserUseCase(
    deps.userRepository,
    deps.passwordHasher,
    deps.accessTokenService,
    deps.refreshTokenRepository,
    deps.tokenExpiryPolicy,
  );
}

describe('LoginUserUseCase', () => {
  it('rejects an unknown email with a generic message', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);

    await expect(buildUseCase(deps).execute('nobody@example.com', 'password123')).rejects.toThrow(
      new UnauthorizedException('Invalid email or password'),
    );
    expect(deps.passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('rejects a deactivated account with the same generic message', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser({ isActive: false }));

    await expect(buildUseCase(deps).execute('client@example.com', 'password123')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('rejects a wrong password with the same generic message', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser());
    deps.passwordHasher.compare.mockResolvedValue(false);

    await expect(buildUseCase(deps).execute('client@example.com', 'wrong')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('updates lastLoginAt and issues an access + refresh token on success', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser());
    deps.passwordHasher.compare.mockResolvedValue(true);
    deps.accessTokenService.sign.mockReturnValue('access-token');
    const expiresAt = new Date('2026-01-08T00:00:00.000Z');
    deps.tokenExpiryPolicy.refreshTokenExpiresAt.mockReturnValue(expiresAt);

    const result = await buildUseCase(deps).execute('client@example.com', 'password123');

    expect(deps.userRepository.updateLastLoginAt).toHaveBeenCalledWith('user-1', expect.any(Date));
    expect(deps.accessTokenService.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'CLIENT' });
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', expiresAt }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshTokenExpiresAt).toBe(expiresAt);
  });
});
