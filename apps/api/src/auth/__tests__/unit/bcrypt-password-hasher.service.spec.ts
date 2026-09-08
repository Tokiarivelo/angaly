import { BcryptPasswordHasherService } from '../../infrastructure/services/bcrypt-password-hasher.service';

describe('BcryptPasswordHasherService', () => {
  const service = new BcryptPasswordHasherService();

  it('hashes a password to a non-plaintext bcrypt string', async () => {
    const hash = await service.hash('password123');

    expect(hash).not.toBe('password123');
    expect(hash).toMatch(/^\$2[aby]\$/);
  }, 10_000);

  it('compare() matches the original password against its hash', async () => {
    const hash = await service.hash('password123');

    expect(await service.compare('password123', hash)).toBe(true);
    expect(await service.compare('wrong-password', hash)).toBe(false);
  }, 10_000);

  it('produces a different hash on each call (random salt)', async () => {
    const [first, second] = await Promise.all([service.hash('password123'), service.hash('password123')]);
    expect(first).not.toBe(second);
  }, 10_000);
});
