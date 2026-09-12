import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserEntity } from '../../domain/entities/user.entity';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ACCESS_TOKEN_SERVICE, IAccessTokenService } from '../../domain/services/access-token.service';
import { ITokenExpiryPolicy, TOKEN_EXPIRY_POLICY } from '../../domain/services/token-expiry-policy';
import { generateOpaqueToken, hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

export interface RefreshResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const ROTATION_GRACE_PERIOD_MS = 30_000;

/**
 * Rotation: the presented refresh token is revoked upon first use.
 * A 30-second grace period allows concurrent requests or race conditions
 * (e.g. parallel page renders, RSC + client fetches) to complete safely
 * without invalidating the user's active session.
 */
@Injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: IAccessTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_EXPIRY_POLICY) private readonly tokenExpiryPolicy: ITokenExpiryPolicy,
  ) {}

  async execute(rawRefreshToken: string): Promise<RefreshResult> {
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isRevoked = Boolean(stored.revokedAt);
    const isWithinGracePeriod =
      stored.revokedAt !== null &&
      Date.now() - stored.revokedAt.getTime() < ROTATION_GRACE_PERIOD_MS;

    if (isRevoked && !isWithinGracePeriod) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!isRevoked) {
      await this.refreshTokenRepository.revoke(stored.id);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.accessTokenService.sign({ sub: user.id, role: user.role });
    const refreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = this.tokenExpiryPolicy.refreshTokenExpiresAt();
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    return { user, accessToken, refreshToken, refreshTokenExpiresAt };
  }
}
