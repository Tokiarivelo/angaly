import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { USER_ROLES, UserRole } from '../../domain/entities/user.entity';
import { AccessTokenPayload, IAccessTokenService } from '../../domain/services/access-token.service';

/** ADR-001: RS256, signed with JwtModule's configured private key / verified with the public key (see auth.module.ts). */
@Injectable()
export class JwtAccessTokenService implements IAccessTokenService {
  private readonly logger = new Logger(JwtAccessTokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  sign(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): AccessTokenPayload | null {
    try {
      const decoded = this.jwtService.verify<{ sub: unknown; role: unknown }>(token);
      if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
        return null;
      }
      if (!(USER_ROLES as readonly string[]).includes(decoded.role)) {
        return null;
      }
      return { sub: decoded.sub, role: decoded.role as UserRole };
    } catch (error) {
      this.logger.debug(`Access token verification failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }
  }
}
