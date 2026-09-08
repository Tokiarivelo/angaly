import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
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
  const passwordResetTokenRepository: jest.Mocked<IPasswordResetTokenRepository> = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    markUsed: jest.fn(),
  };
  const tokenExpiryPolicy: jest.Mocked<ITokenExpiryPolicy> = {
    refreshTokenExpiresAt: jest.fn(),
    passwordResetTokenExpiresAt: jest.fn(),
  };
  return { userRepository, passwordResetTokenRepository, tokenExpiryPolicy };
}

describe('RequestPasswordResetUseCase', () => {
  it('resolves silently for an unknown email — never reveals whether it exists', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);
    const useCase = new RequestPasswordResetUseCase(
      deps.userRepository,
      deps.passwordResetTokenRepository,
      deps.tokenExpiryPolicy,
    );

    await expect(useCase.execute('nobody@example.com')).resolves.toBeUndefined();
    expect(deps.passwordResetTokenRepository.create).not.toHaveBeenCalled();
  });

  it('creates a hashed reset token with the configured expiry for a known email', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(sampleUser());
    const expiresAt = new Date('2026-01-01T01:00:00.000Z');
    deps.tokenExpiryPolicy.passwordResetTokenExpiresAt.mockReturnValue(expiresAt);
    const useCase = new RequestPasswordResetUseCase(
      deps.userRepository,
      deps.passwordResetTokenRepository,
      deps.tokenExpiryPolicy,
    );

    await useCase.execute('  Client@Example.com  ');

    expect(deps.userRepository.findByEmail).toHaveBeenCalledWith('client@example.com');
    expect(deps.passwordResetTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', expiresAt }),
    );
    const call = deps.passwordResetTokenRepository.create.mock.calls[0][0];
    expect(call.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
