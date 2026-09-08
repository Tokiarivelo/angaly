import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/password-reset-token.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ITokenExpiryPolicy, TOKEN_EXPIRY_POLICY } from '../../domain/services/token-expiry-policy';
import { generateOpaqueToken, hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';
import { normalizeEmail } from '../../domain/value-objects/email.vo';

/**
 * Always resolves without error and without revealing whether the email
 * exists — prevents user enumeration via response timing/shape.
 * `notifications` (Phase 3) doesn't exist yet: the generated token is logged
 * instead of emailed for now (TODO below), never the user's password.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    @Inject(TOKEN_EXPIRY_POLICY) private readonly tokenExpiryPolicy: ITokenExpiryPolicy,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(normalizeEmail(email));
    if (!user) {
      return;
    }

    const rawToken = generateOpaqueToken();
    await this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt: this.tokenExpiryPolicy.passwordResetTokenExpiresAt(),
    });

    // TODO(notifications, Phase 3): email `rawToken` to the user instead of logging it.
    this.logger.log(`Password reset requested for user ${user.id} — token generated (not emailed yet, see TODO)`);
  }
}
