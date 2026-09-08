import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ITokenExpiryPolicy } from '../../domain/services/token-expiry-policy';

const DURATION_REGEX = /^(\d+)([smhd])$/;
const UNIT_TO_MS: Record<'s' | 'm' | 'h' | 'd', number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Parses the same "15m"/"7d" shorthand already used by JWT_ACCESS_TOKEN_EXPIRES_IN in .env.example. */
export function parseDurationToMs(duration: string): number {
  const match = DURATION_REGEX.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}" (expected e.g. "15m", "7d")`);
  }
  const [, value, unit] = match as unknown as [string, string, 's' | 'm' | 'h' | 'd'];
  return Number(value) * UNIT_TO_MS[unit];
}

const PASSWORD_RESET_TOKEN_TTL = '1h';

@Injectable()
export class EnvTokenExpiryPolicy implements ITokenExpiryPolicy {
  constructor(private readonly config: ConfigService) {}

  refreshTokenExpiresAt(): Date {
    const ttl = this.config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') ?? '7d';
    return new Date(Date.now() + parseDurationToMs(ttl));
  }

  passwordResetTokenExpiresAt(): Date {
    return new Date(Date.now() + parseDurationToMs(PASSWORD_RESET_TOKEN_TTL));
  }
}
