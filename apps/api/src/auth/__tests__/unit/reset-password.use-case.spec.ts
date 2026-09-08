import { BadRequestException } from '@nestjs/common';

import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import type {
  IPasswordResetTokenRepository,
  StoredPasswordResetToken,
} from '../../domain/repositories/password-reset-token.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IPasswordHasher } from '../../domain/services/password-hasher';
import { hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

function storedToken(overrides: Partial<StoredPasswordResetToken> = {}): StoredPasswordResetToken {
  return {
    id: 'reset-1',
    userId: 'user-1',
    tokenHash: hashOpaqueToken('raw-token'),
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
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
  const passwordResetTokenRepository: jest.Mocked<IPasswordResetTokenRepository> = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    markUsed: jest.fn(),
  };
  const passwordHasher: jest.Mocked<IPasswordHasher> = { hash: jest.fn(), compare: jest.fn() };
  return { userRepository, passwordResetTokenRepository, passwordHasher };
}

function buildUseCase(deps: ReturnType<typeof buildDeps>) {
  return new ResetPasswordUseCase(deps.userRepository, deps.passwordResetTokenRepository, deps.passwordHasher);
}

describe('ResetPasswordUseCase', () => {
  it('rejects an unknown token', async () => {
    const deps = buildDeps();
    deps.passwordResetTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(buildUseCase(deps).execute('raw-token', 'newpassword123')).rejects.toThrow(BadRequestException);
    expect(deps.userRepository.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('rejects an already-used token (single use)', async () => {
    const deps = buildDeps();
    deps.passwordResetTokenRepository.findByTokenHash.mockResolvedValue(storedToken({ usedAt: new Date() }));

    await expect(buildUseCase(deps).execute('raw-token', 'newpassword123')).rejects.toThrow(
      'Invalid or expired reset token',
    );
  });

  it('rejects an expired token', async () => {
    const deps = buildDeps();
    deps.passwordResetTokenRepository.findByTokenHash.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(buildUseCase(deps).execute('raw-token', 'newpassword123')).rejects.toThrow(
      'Invalid or expired reset token',
    );
  });

  it('updates the password hash and marks the token used on success', async () => {
    const deps = buildDeps();
    deps.passwordResetTokenRepository.findByTokenHash.mockResolvedValue(storedToken());
    deps.passwordHasher.hash.mockResolvedValue('new-hashed-password');

    await buildUseCase(deps).execute('raw-token', 'newpassword123');

    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('newpassword123');
    expect(deps.userRepository.updatePasswordHash).toHaveBeenCalledWith('user-1', 'new-hashed-password');
    expect(deps.passwordResetTokenRepository.markUsed).toHaveBeenCalledWith('reset-1');
  });
});
