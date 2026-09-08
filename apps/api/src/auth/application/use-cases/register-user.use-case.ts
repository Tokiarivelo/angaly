import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { UserEntity } from '../../domain/entities/user.entity';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ACCESS_TOKEN_SERVICE, IAccessTokenService } from '../../domain/services/access-token.service';
import { IPasswordHasher, PASSWORD_HASHER } from '../../domain/services/password-hasher';
import { ITokenExpiryPolicy, TOKEN_EXPIRY_POLICY } from '../../domain/services/token-expiry-policy';
import { generateOpaqueToken, hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';
import { normalizeEmail } from '../../domain/value-objects/email.vo';

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface RegisterUserResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Creates the User (role CLIENT) and its Customer profile atomically (see
 * IUserRepository.createWithCustomer), then starts a session immediately —
 * the visitor lands signed in, same as after a manual login, without a
 * redundant second password verification against the hash we just computed.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: IAccessTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_EXPIRY_POLICY) private readonly tokenExpiryPolicy: ITokenExpiryPolicy,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const email = normalizeEmail(input.email);
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.createWithCustomer(
      { email, passwordHash, role: 'CLIENT' },
      { firstName: input.firstName, lastName: input.lastName, phone: input.phone ?? null },
    );

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
