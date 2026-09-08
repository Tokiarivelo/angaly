import { ConflictException } from '@nestjs/common';

import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IAccessTokenService } from '../../domain/services/access-token.service';
import type { IPasswordHasher } from '../../domain/services/password-hasher';
import type { ITokenExpiryPolicy } from '../../domain/services/token-expiry-policy';

function sampleUser(): UserEntity {
  return UserEntity.create({
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive: true,
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

describe('RegisterUserUseCase', () => {
  it('rejects an email that is already taken', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser());
    const useCase = new RegisterUserUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.accessTokenService,
      deps.refreshTokenRepository,
      deps.tokenExpiryPolicy,
    );

    await expect(
      useCase.execute({ email: 'client@example.com', password: 'password123', firstName: 'A', lastName: 'B', phone: null }),
    ).rejects.toThrow(ConflictException);
    expect(deps.userRepository.createWithCustomer).not.toHaveBeenCalled();
  });

  it('hashes the password, creates the user+customer atomically, and issues a session', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.passwordHasher.hash.mockResolvedValue('hashed-password');
    deps.userRepository.createWithCustomer.mockResolvedValue(sampleUser());
    deps.accessTokenService.sign.mockReturnValue('access-token');
    const expiresAt = new Date('2026-01-08T00:00:00.000Z');
    deps.tokenExpiryPolicy.refreshTokenExpiresAt.mockReturnValue(expiresAt);
    const useCase = new RegisterUserUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.accessTokenService,
      deps.refreshTokenRepository,
      deps.tokenExpiryPolicy,
    );

    const result = await useCase.execute({
      email: '  Client@Example.com  ',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Rakoto',
      phone: '+261340000000',
    });

    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(deps.userRepository.createWithCustomer).toHaveBeenCalledWith(
      { email: 'client@example.com', passwordHash: 'hashed-password', role: 'CLIENT' },
      { firstName: 'Jean', lastName: 'Rakoto', phone: '+261340000000' },
    );
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', expiresAt }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(64);
    expect(result.user.id).toBe('user-1');
  });
});
