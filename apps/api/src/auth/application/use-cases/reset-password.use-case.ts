import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/password-reset-token.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { IPasswordHasher, PASSWORD_HASHER } from '../../domain/services/password-hasher';
import { hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const stored = await this.passwordResetTokenRepository.findByTokenHash(hashOpaqueToken(rawToken));

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePasswordHash(stored.userId, passwordHash);
    await this.passwordResetTokenRepository.markUsed(stored.id);
  }
}
