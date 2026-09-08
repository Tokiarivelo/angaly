import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';

import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from './application/use-cases/logout-user.use-case';
import { RefreshAccessTokenUseCase } from './application/use-cases/refresh-access-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { ACCESS_TOKEN_SERVICE } from './domain/services/access-token.service';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { TOKEN_EXPIRY_POLICY } from './domain/services/token-expiry-policy';
import { BcryptPasswordHasherService } from './infrastructure/services/bcrypt-password-hasher.service';
import { EnvTokenExpiryPolicy } from './infrastructure/services/env-token-expiry-policy.service';
import { JwtAccessTokenService } from './infrastructure/services/jwt-access-token.service';
import { PrismaPasswordResetTokenRepository } from './infrastructure/repositories/prisma-password-reset-token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { AuthController } from './presentation/controllers/auth.controller';

/** ADR-001: RS256 — keys decoded from base64 (JWT_PRIVATE_KEY_BASE64/JWT_PUBLIC_KEY_BASE64), never committed raw. */
function decodeBase64Key(base64Value: string): string {
  return Buffer.from(base64Value, 'base64').toString('utf-8');
}

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: decodeBase64Key(config.getOrThrow<string>('JWT_PRIVATE_KEY_BASE64')),
        publicKey: decodeBase64Key(config.getOrThrow<string>('JWT_PUBLIC_KEY_BASE64')),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: (config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') ?? '15m') as JwtSignOptions['expiresIn'],
        },
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshAccessTokenUseCase,
    LogoutUserUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    JwtAuthGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: PrismaPasswordResetTokenRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: ACCESS_TOKEN_SERVICE, useClass: JwtAccessTokenService },
    { provide: TOKEN_EXPIRY_POLICY, useClass: EnvTokenExpiryPolicy },
  ],
  exports: [JwtAuthGuard, ACCESS_TOKEN_SERVICE],
})
export class AuthModule {}
