import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserEntity } from '../../domain/entities/user.entity';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ACCESS_TOKEN_SERVICE, IAccessTokenService } from '../../domain/services/access-token.service';
import { IPasswordHasher, PASSWORD_HASHER } from '../../domain/services/password-hasher';
import { ITokenExpiryPolicy, TOKEN_EXPIRY_POLICY } from '../../domain/services/token-expiry-policy';
import { generateOpaqueToken, hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';
import { normalizeEmail } from '../../domain/value-objects/email.vo';

export interface LoginResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: IAccessTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_EXPIRY_POLICY) private readonly tokenExpiryPolicy: ITokenExpiryPolicy,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(normalizeEmail(email));
    // Same generic error whether the email is unknown or the password is wrong — never reveal which.
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.userRepository.updateLastLoginAt(user.id, new Date());

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
