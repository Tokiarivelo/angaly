import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { ACCESS_TOKEN_SERVICE, AccessTokenPayload, IAccessTokenService } from '../../domain/services/access-token.service';

interface RequestWithUser extends Request {
  user?: AccessTokenPayload;
}

/**
 * Reference auth guard for the whole API (docs/features/auth.md: "JwtAuthGuard
 * de ce module est le guard d'authentification de référence") — verifies the
 * RS256 access token from `Authorization: Bearer <token>` and attaches its
 * payload to `req.user` for `@CurrentUser()`. Applied at controller level
 * per rule absolue #17 (jamais dans les use-cases).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: IAccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = this.accessTokenService.verify(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request.user = payload;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    return header.slice('Bearer '.length).trim() || null;
  }
}
