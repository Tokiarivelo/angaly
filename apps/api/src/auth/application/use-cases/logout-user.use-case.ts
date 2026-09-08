import { Inject, Injectable } from '@nestjs/common';

import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository';
import { hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

/** Idempotent: succeeds even if the token is already revoked/unknown — logout should never fail visibly to the user. */
@Injectable()
export class LogoutUserUseCase {
  constructor(@Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    const stored = await this.refreshTokenRepository.findByTokenHash(hashOpaqueToken(rawRefreshToken));
    if (stored && !stored.revokedAt) {
      await this.refreshTokenRepository.revoke(stored.id);
    }
  }
}
