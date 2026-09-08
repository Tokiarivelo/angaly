import { generateKeyPairSync } from 'node:crypto';

import type { JwtSignOptions } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';

import { JwtAccessTokenService } from '../../infrastructure/services/jwt-access-token.service';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function buildService(overrides: { expiresIn?: string } = {}): JwtAccessTokenService {
  const jwtService = new JwtService({
    privateKey,
    publicKey,
    signOptions: {
      algorithm: 'RS256',
      expiresIn: (overrides.expiresIn ?? '15m') as JwtSignOptions['expiresIn'],
    },
    verifyOptions: { algorithms: ['RS256'] },
  });
  return new JwtAccessTokenService(jwtService);
}

describe('JwtAccessTokenService', () => {
  it('signs and verifies a round-trip payload', () => {
    const service = buildService();
    const token = service.sign({ sub: 'user-1', role: 'CLIENT' });

    expect(typeof token).toBe('string');
    expect(service.verify(token)).toEqual({ sub: 'user-1', role: 'CLIENT' });
  });

  it('returns null (never throws) for a malformed token', () => {
    const service = buildService();
    expect(service.verify('not-a-jwt')).toBeNull();
  });

  it('returns null for a token signed with a different key', () => {
    const service = buildService();
    const otherKeys = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const rogueJwt = new JwtService({
      privateKey: otherKeys.privateKey,
      signOptions: { algorithm: 'RS256' },
    });
    const rogueToken = rogueJwt.sign({ sub: 'user-1', role: 'CLIENT' });

    expect(service.verify(rogueToken)).toBeNull();
  });

  it('returns null for an expired token', async () => {
    const service = buildService({ expiresIn: '1ms' });
    const token = service.sign({ sub: 'user-1', role: 'CLIENT' });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(service.verify(token)).toBeNull();
  });

  it('returns null when the payload shape is unexpected', () => {
    const service = buildService();
    const jwtService = new JwtService({ privateKey, signOptions: { algorithm: 'RS256' } });
    const tokenWithBadShape = jwtService.sign({ sub: 123, role: 'CLIENT' });

    expect(service.verify(tokenWithBadShape)).toBeNull();
  });
});
